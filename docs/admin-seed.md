# Admin User Seed

This document records how to create the initial admin user for the admin panel.

## Default admin

| Field | Value |
|-------|-------|
| Email | `admin@nexus.corp.com` |
| Name | `Admin Nexus` |
| Password | Stored in `.env` as `ADMIN_INITIAL_PASSWORD` |

## Seed the user

Make sure the backend is running and `.env` is loaded, then run:

```bash
# From the repository root
npx tsx apps/api/src/scripts/seed-admin.ts
```

The script checks whether the admin user already exists via `GET /api/admin` and creates it with `POST /api/admin` if it does not.

## Reset

To recreate the admin user, delete the existing row from the `admin_users` table and run the script again.
