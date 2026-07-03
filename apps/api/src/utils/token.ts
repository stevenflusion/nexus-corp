import crypto from "crypto";

// ==========================
// TOKEN GENERATION
// ==========================

export function generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

// ==========================
// TOKEN HASH
// ==========================

export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}
