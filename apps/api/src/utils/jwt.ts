import jwt from "jsonwebtoken";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }
  return secret;
}

export interface JwtPayload {
  id_admin_users: number;
  name_admin_users: string;
  email_admin_users: string;
}

export interface MagicLinkJwtPayload {
  token_id: string;
  role: string;
  scopeId: string;
  destinationScreen: string;
}

// ==========================
// CREATE TOKEN
// ==========================

export function createToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "8h",
  });
}

// ==========================
// CREATE MAGIC LINK TOKEN
// ==========================

export function createMagicLinkToken(payload: MagicLinkJwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "8h",
  });
}

// ==========================
// VERIFY TOKEN
// ==========================

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

// ==========================
// VERIFY MAGIC LINK TOKEN
// ==========================

export function verifyMagicLinkToken(token: string): MagicLinkJwtPayload {
  return jwt.verify(token, getJwtSecret()) as MagicLinkJwtPayload;
}