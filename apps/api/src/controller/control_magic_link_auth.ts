import { Hono, type Context } from "hono";
import { eq } from "drizzle-orm";

import { db } from "../database/database";
import { magic_links, magic_link_activity } from "../database/schemas";
import { createOne, getByField } from "../utils/crud";
import { hashToken } from "../utils/token";
import { createMagicLinkToken } from "../utils/jwt";
import { verifyMagicLinkSchema } from "../dto/magic_links_dto";

const magicLinkAuthController = new Hono();

// ==========================
// HELPERS
// ==========================

function getClientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for") ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

function getDevice(c: Context): string {
  const userAgent = c.req.header("user-agent") ?? "unknown";
  return userAgent.slice(0, 200);
}

async function logActivity(
  magicLinkId: string,
  result: "success" | "failed_expired" | "failed_used" | "failed_revoked",
  ip: string,
  device: string
) {
  await createOne(magic_link_activity, {
    magic_link_id: magicLinkId,
    result,
    ip,
    device,
  });
}

// ==========================
// VERIFY TOKEN
// POST /magic-link/verify
// ==========================

magicLinkAuthController.post("/verify", async (c) => {
  try {
    const body = await c.req.json();
    const payload = verifyMagicLinkSchema.parse(body);

    const tokenHash = hashToken(payload.token);
    const link = await getByField<typeof magic_links.$inferSelect>(
      magic_links,
      magic_links.token_hash,
      tokenHash
    );

    if (!link) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const ip = getClientIp(c);
    const device = getDevice(c);

    if (link.status === "revoked") {
      await logActivity(link.id, "failed_revoked", ip, device);
      return c.json({ error: "Magic link has been revoked" }, 403);
    }

    if (link.expirationDate && new Date(link.expirationDate) < new Date()) {
      await logActivity(link.id, "failed_expired", ip, device);
      return c.json({ error: "Magic link has expired" }, 410);
    }

    if (link.usageLimitType !== "unlimited") {
      const limit =
        link.usageLimitType === "single"
          ? 1
          : (link.usageLimit ?? 1);

      if (link.usageCount >= limit) {
        await logActivity(link.id, "failed_used", ip, device);
        return c.json({ error: "Magic link usage limit reached" }, 409);
      }
    }

    if (
      link.deferredActivation &&
      new Date(link.deferredActivation) > new Date()
    ) {
      return c.json(
        { error: "Magic link is not yet active" },
        403
      );
    }

    const newUsageCount = link.usageCount + 1;
    let newStatus: typeof link.status = link.status;

    if (link.usageLimitType !== "unlimited") {
      const limit =
        link.usageLimitType === "single"
          ? 1
          : (link.usageLimit ?? 1);

      if (newUsageCount >= limit) {
        newStatus = "used";
      }
    }

    await db
      .update(magic_links)
      .set({
        usageCount: newUsageCount,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(magic_links.id, link.id));

    await logActivity(link.id, "success", ip, device);

    const token = createMagicLinkToken({
      token_id: link.id,
      role: link.role,
      scopeId: link.scopeId,
      destinationScreen: link.destinationScreen,
    });

    return c.json(
      {
        token,
        role: link.role,
        scopeId: link.scopeId,
        destinationScreen: link.destinationScreen,
      },
      200
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Validation error", details: error.message }, 422);
    }

    console.error("Error verifying magic link:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { magicLinkAuthController };
