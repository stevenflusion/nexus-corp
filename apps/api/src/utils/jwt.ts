import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
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
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "8h",
  });
}

// ==========================
// CREATE MAGIC LINK TOKEN
// ==========================

export function createMagicLinkToken(payload: MagicLinkJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "8h",
  });
}

// ==========================
// VERIFY TOKEN
// ==========================

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}