import { JwtPayload } from "../utils/jwt";

// =======================
// LOGIN DTO
// =======================

export type LoginDto = {
  email_admin_users: string;
  password_admin_users: string;
};

// =======================
// LOGIN RESPONSE
// =======================

export type LoginResponseDto = {
  token: string;
  user: {
    id_admin_users: number;
    name_admin_users: string;
    email_admin_users: string;
  };
};

// =======================
// SANITIZER
// =======================

export function sanitizeLogin(body: unknown): LoginDto | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as Record<string, unknown>;

  const email_admin_users =
    typeof payload.email_admin_users === "string"
      ? payload.email_admin_users.trim().toLowerCase()
      : "";

  const password_admin_users =
    typeof payload.password_admin_users === "string"
      ? payload.password_admin_users.trim()
      : "";

  if (!email_admin_users || !password_admin_users) {
    return null;
  }

  return {
    email_admin_users,
    password_admin_users,
  };
}