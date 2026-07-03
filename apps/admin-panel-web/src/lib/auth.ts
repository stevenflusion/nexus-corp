import { cookies } from "next/headers"

export type AuthUser = {
  id_admin_users: number
  name_admin_users: string
  email_admin_users: string
}

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

  return { id_admin_users: id, name_admin_users: name, email_admin_users: email }
}

/**
 * Read the auth-token cookie and return the decoded user info.
 *
 * Returns null when the user is not authenticated or the token is invalid.
 * Never throws and never exposes the raw JWT to client components.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const payload = decodeJwtPayload(token)
    if (!payload) return null

    return toAuthUser(payload)
  } catch {
    return null
  }
}
