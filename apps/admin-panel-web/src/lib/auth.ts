import { cookies } from "next/headers"

export type AuthUser = {
  kind: "auth"
  id_admin_users: number
  name_admin_users: string
  email_admin_users: string
}

export type MagicLinkUser = {
  kind: "magic-link"
  token_id: string
  role: string
  scopeId: string
  destinationScreen: string
}

export type User = AuthUser | MagicLinkUser

/**
 * Decode a JWT payload without verifying the signature.
 *
 * This is safe for UI state because the token signature is validated by the
 * backend on every protected request. We only need the user metadata here.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadBase64 = token.split(".")[1]
    if (!payloadBase64) return null

    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(base64)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function toAuthUser(payload: Record<string, unknown>): AuthUser | null {
  const id = payload.id_admin_users
  const name = payload.name_admin_users
  const email = payload.email_admin_users

  if (
    typeof id !== "number" ||
    typeof name !== "string" ||
    typeof email !== "string"
  ) {
    return null
  }

  return {
    kind: "auth",
    id_admin_users: id,
    name_admin_users: name,
    email_admin_users: email,
  }
}

function toMagicLinkUser(payload: Record<string, unknown>): MagicLinkUser | null {
  const token_id = payload.token_id
  const role = payload.role
  const scopeId = payload.scopeId
  const destinationScreen = payload.destinationScreen

  if (
    typeof token_id !== "string" ||
    typeof role !== "string" ||
    typeof scopeId !== "string"
  ) {
    return null
  }

  return {
    kind: "magic-link",
    token_id,
    role,
    scopeId,
    destinationScreen: typeof destinationScreen === "string" ? destinationScreen : "",
  }
}

/**
 * Read the auth-token cookie and return the decoded user info.
 *
 * Returns null when the user is not authenticated or the token is invalid.
 * Never throws and never exposes the raw JWT to client components.
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const payload = decodeJwtPayload(token)
    if (!payload) return null

    return toAuthUser(payload) ?? toMagicLinkUser(payload)
  } catch {
    return null
  }
}
