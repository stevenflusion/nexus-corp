import { Hono } from "hono";
import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";

import { db } from "../database/database";
import { magic_links, magic_link_activity } from "../database/schemas";
import { createOne, getById } from "../utils/crud";
import { generateToken, hashToken } from "../utils/token";
import { sendMagicLinkEmail } from "../services/email";
import {
  createMagicLinkSchema,
  extendMagicLinkSchema,
  magicLinkFiltersSchema,
} from "../dto/magic_links_dto";

const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL ?? "http://localhost:3000";

const DEFAULT_EMAIL_TEMPLATE = `
<p>Hola,</p>
<p>Tu enlace de acceso a Nexus está listo:</p>
<p><a href="{{link}}">{{link}}</a></p>
<p>Si no solicitaste este enlace, puedes ignorar este mensaje.</p>
`.trim();

const magicLinksController = new Hono();

// ==========================
// HELPERS
// ==========================

function getClientIp(c: any): string {
  return (
    c.req.header("x-forwarded-for") ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

function getDevice(c: any): string {
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

function buildMagicLinkUrl(rawToken: string): string {
  return `${ADMIN_PANEL_URL}/auth/magic-link?token=${rawToken}`;
}

// ==========================
// LIST
// GET /magic-links
// ==========================

magicLinksController.get("/", async (c) => {
  try {
    const rawQuery = c.req.query();
    const cleanedQuery: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(rawQuery)) {
      if (value === undefined || value === null || value === "" || value === "all") {
        continue;
      }
      cleanedQuery[key] = value;
    }

    const filters = magicLinkFiltersSchema.parse(cleanedQuery);
    const { search, status, role, dateFrom, dateTo, page, pageSize } = filters;

    const conditions: SQL[] = [];

    if (status) {
      conditions.push(eq(magic_links.status, status));
    }

    if (role) {
      conditions.push(eq(magic_links.role, role));
    }

    if (dateFrom) {
      conditions.push(gte(magic_links.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(magic_links.createdAt, new Date(dateTo)));
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(magic_links.recipientName, term),
          ilike(magic_links.recipientEmail, term),
          ilike(magic_links.recipientPhone, term),
          ilike(magic_links.scope, term),
          ilike(magic_links.id, term)
        ) as SQL
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(magic_links)
      .where(whereClause ?? sql`true`);

    const total = Number(countResult[0]?.count ?? 0);

    const items = await db
      .select()
      .from(magic_links)
      .where(whereClause ?? sql`true`)
      .orderBy(desc(magic_links.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return c.json(
      {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      200
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Validation error", details: error.message }, 422);
    }

    console.error("Error listing magic links:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==========================
// GET BY ID
// GET /magic-links/:id
// ==========================

magicLinksController.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const link = await getById<typeof magic_links.$inferSelect>(
      magic_links,
      magic_links.id,
      id
    );

    if (!link) {
      return c.json({ error: "Magic link not found" }, 404);
    }

    const activity = await db
      .select()
      .from(magic_link_activity)
      .where(eq(magic_link_activity.magic_link_id, id))
      .orderBy(desc(magic_link_activity.timestamp));

    return c.json({ ...link, activity }, 200);
  } catch (error) {
    console.error("Error getting magic link:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==========================
// CREATE
// POST /magic-links
// ==========================

magicLinksController.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const payload = createMagicLinkSchema.parse(body);

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    const created = await createOne(magic_links, {
      token_hash: tokenHash,
      status: "active",
      usageCount: 0,
      recipientName: payload.recipientName,
      recipientEmail: payload.recipientEmail,
      recipientPhone: payload.recipientPhone,
      internalNote: payload.internalNote,
      role: payload.role,
      scope: payload.scope,
      scopeId: payload.scopeId,
      destinationScreen: payload.destinationScreen,
      expirationType: payload.expirationType,
      expirationDate: payload.expirationDate ? new Date(payload.expirationDate) : null,
      deferredActivation: payload.deferredActivation ? new Date(payload.deferredActivation) : null,
      usageLimitType: payload.usageLimitType,
      usageLimit: payload.usageLimit,
      deliveryChannel: payload.deliveryChannel,
      createdBy: payload.createdBy,
    });

    const url = buildMagicLinkUrl(rawToken);

    if (
      payload.deliveryChannel === "send_email" &&
      payload.recipientEmail &&
      process.env.RESEND_API_KEY
    ) {
      await sendMagicLinkEmail(
        payload.recipientEmail,
        DEFAULT_EMAIL_TEMPLATE,
        url
      );
    }

    return c.json({ ...created, url }, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Validation error", details: error.message }, 422);
    }

    console.error("Error creating magic link:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==========================
// REVOKE
// POST /magic-links/:id/revoke
// ==========================

magicLinksController.post("/:id/revoke", async (c) => {
  try {
    const id = c.req.param("id");
    const link = await getById<typeof magic_links.$inferSelect>(
      magic_links,
      magic_links.id,
      id
    );

    if (!link) {
      return c.json({ error: "Magic link not found" }, 404);
    }

    if (link.status === "revoked") {
      return c.json({ error: "Magic link is already revoked" }, 409);
    }

    const ip = getClientIp(c);
    const device = getDevice(c);

    const [updated] = await db
      .update(magic_links)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(eq(magic_links.id, id))
      .returning();

    await logActivity(id, "failed_revoked", ip, device);

    return c.json(updated, 200);
  } catch (error) {
    console.error("Error revoking magic link:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==========================
// RESEND
// POST /magic-links/:id/resend
// ==========================

magicLinksController.post("/:id/resend", async (c) => {
  try {
    const id = c.req.param("id");
    const link = await getById<typeof magic_links.$inferSelect>(
      magic_links,
      magic_links.id,
      id
    );

    if (!link) {
      return c.json({ error: "Magic link not found" }, 404);
    }

    if (link.status === "revoked") {
      return c.json({ error: "Revoked magic links cannot be resent" }, 409);
    }

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const url = buildMagicLinkUrl(rawToken);

    const [updated] = await db
      .update(magic_links)
      .set({
        token_hash: tokenHash,
        status: link.status === "used" ? "active" : link.status,
        updatedAt: new Date(),
      })
      .where(eq(magic_links.id, id))
      .returning();

    const ip = getClientIp(c);
    const device = getDevice(c);

    await logActivity(id, "success", ip, device);

    if (
      link.deliveryChannel === "send_email" &&
      link.recipientEmail &&
      process.env.RESEND_API_KEY
    ) {
      await sendMagicLinkEmail(
        link.recipientEmail,
        DEFAULT_EMAIL_TEMPLATE,
        url
      );
    }

    return c.json({ ...updated, url }, 200);
  } catch (error) {
    console.error("Error resending magic link:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==========================
// EXTEND
// POST /magic-links/:id/extend
// ==========================

magicLinksController.post("/:id/extend", async (c) => {
  try {
    const id = c.req.param("id");
    const link = await getById<typeof magic_links.$inferSelect>(
      magic_links,
      magic_links.id,
      id
    );

    if (!link) {
      return c.json({ error: "Magic link not found" }, 404);
    }

    if (link.status === "revoked") {
      return c.json({ error: "Revoked magic links cannot be extended" }, 409);
    }

    const body = await c.req.json();
    const payload = extendMagicLinkSchema.parse(body);

    const [updated] = await db
      .update(magic_links)
      .set({
        expirationDate: new Date(payload.expirationDate),
        updatedAt: new Date(),
      })
      .where(eq(magic_links.id, id))
      .returning();

    const ip = getClientIp(c);
    const device = getDevice(c);

    await logActivity(id, "success", ip, device);

    return c.json(updated, 200);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Validation error", details: error.message }, 422);
    }

    console.error("Error extending magic link:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==========================
// ACTIVITY LOG
// GET /magic-links/:id/activity
// ==========================

magicLinksController.get("/:id/activity", async (c) => {
  try {
    const id = c.req.param("id");
    const link = await getById<typeof magic_links.$inferSelect>(
      magic_links,
      magic_links.id,
      id
    );

    if (!link) {
      return c.json({ error: "Magic link not found" }, 404);
    }

    const activity = await db
      .select()
      .from(magic_link_activity)
      .where(eq(magic_link_activity.magic_link_id, id))
      .orderBy(desc(magic_link_activity.timestamp));

    return c.json(activity, 200);
  } catch (error) {
    console.error("Error getting magic link activity:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { magicLinksController };
