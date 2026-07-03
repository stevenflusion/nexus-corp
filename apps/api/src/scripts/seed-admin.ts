/**
 * Seed script for the initial admin user.
 *
 * Run from the repo root with:
 *   npx tsx apps/api/src/scripts/seed-admin.ts
 *
 * Requires the backend to be reachable and VALID_API_KEY / API_URL to be set.
 */

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";
const API_KEY = process.env.VALID_API_KEY ?? process.env.API_KEY;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@nexus.corp.com";
const ADMIN_PASSWORD =
  process.env.ADMIN_INITIAL_PASSWORD ?? "N3xus@dm1n2026!";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin Nexus";

async function main() {
  if (!API_KEY) {
    console.error(
      "Missing API key. Set VALID_API_KEY or API_KEY in the environment."
    );
    process.exit(1);
  }

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };

  // Check whether the admin user already exists.
  const listRes = await fetch(`${API_URL}/admin`, {
    method: "GET",
    headers,
  });

  if (!listRes.ok) {
    const text = await listRes.text();
    console.error(
      `Failed to list admin users: ${listRes.status} ${listRes.statusText}`
    );
    console.error(text);
    process.exit(1);
  }

  const users = (await listRes.json()) as Array<{ email_admin_users: string }>;
  const exists = users.some(
    (user) => user.email_admin_users.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  if (exists) {
    console.log(`Admin user ${ADMIN_EMAIL} already exists. Skipping seed.`);
    return;
  }

  const createRes = await fetch(`${API_URL}/admin`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email_admin_users: ADMIN_EMAIL,
      password_admin_users: ADMIN_PASSWORD,
      name_admin_users: ADMIN_NAME,
      active: true,
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error(
      `Failed to create admin user: ${createRes.status} ${createRes.statusText}`
    );
    console.error(text);
    process.exit(1);
  }

  const created = await createRes.json();
  console.log("Admin user created:", created);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
