import { NextResponse } from "next/server"
import { cookies } from "next/headers"

function getJwtExpiresAt(token: string): string | null {
  try {
    const payloadBase64 = token.split(".")[1]
    if (!payloadBase64) return null
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(base64)
    const payload = JSON.parse(json)
    if (typeof payload.exp === "number") {
      return new Date(payload.exp * 1000).toISOString()
    }
  } catch {
    // ignore decode errors
  }
  return null
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return NextResponse.json({ valid: false, reason: "missing_token" }, { status: 401 })
  }

  const apiKey = process.env.API_KEY
  const apiUrl = process.env.API_URL

  if (!apiKey || !apiUrl) {
    return NextResponse.json({ valid: false, reason: "config_error" }, { status: 500 })
  }

  try {
    const response = await fetch(`${apiUrl}/auth/magic-link/session`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "Authorization": `Bearer ${token}`,
      },
    })

    const data = await response.json()

    // If the API returns valid but no expiresAt, enrich it from the JWT so the
    // client countdown has a concrete target even when the link has no DB
    // expirationDate.
    if (data.valid && !data.expiresAt) {
      const jwtExpiresAt = getJwtExpiresAt(token)
      if (jwtExpiresAt) {
        data.expiresAt = jwtExpiresAt
      }
    }

    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ valid: false, reason: "network_error" }, { status: 500 })
  }
}
