/**
 * Direct DB seed for the initial admin user.
 * Uses Drizzle directly — does NOT require the backend to be running.
 *
 * Run from the repo root with:
 *   npx tsx apps/api/src/scripts/seed-admin-direct.ts
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../database/database.ts";
import { admin_users } from "../database/schemas/admin_users.ts";
import { encrypt } from "../utils/crypting.ts";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@nexus.corp.com";
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD ?? "N3xus@dm1n2026!";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin Nexus";

async function main() {
  const existing = await db
    .select()
    .from(admin_users)
    .where(eq(admin_users.email_admin_users, ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Admin user ${ADMIN_EMAIL} already exists. Skipping.`);
    process.exit(0);
  }

  const encryptedPassword = encrypt(ADMIN_PASSWORD);

  const [created] = await db
    .insert(admin_users)
    .values({
      name_admin_users: ADMIN_NAME,
      email_admin_users: ADMIN_EMAIL,
      password_admin_users: encryptedPassword,
      active: true,
    })
    .returning();

  console.log("Admin user created:", {
    id: created.id_admin_users,
    email: created.email_admin_users,
    name: created.name_admin_users,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
