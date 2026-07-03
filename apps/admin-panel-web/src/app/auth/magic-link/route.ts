import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const COOKIE_NAME = "auth-token"
const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "El link no es válido.",
  expired: "El link ha expirado.",
  revoked: "El link ha sido revocado.",
  used: "El link ya fue utilizado.",
  not_active: "El link aún no está activo.",
  unknown: "Ocurrió un error al verificar el link.",
}

function redirectWithError(
  errorType: string,
  baseUrl: string
): NextResponse {
  const message = ERROR_MESSAGES[errorType] ?? ERROR_MESSAGES.unknown
  return NextResponse.redirect(
    new URL(`/?magic_error=${encodeURIComponent(message)}`, baseUrl)
  )
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get("token")

  // No token in the URL — redirect to login with error
  if (!token) {
    return redirectWithError("invalid", origin)
  }

  const apiKey = process.env.API_KEY
  const apiUrl = process.env.API_URL

  if (!apiKey || !apiUrl) {
    return redirectWithError("unknown", origin)
  }

  try {
    const response = await fetch(`${apiUrl}/auth/magic-link/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      let errorType = "unknown"

      if (response.status === 401) errorType = "invalid"
      else if (response.status === 410) errorType = "expired"
      else if (response.status === 403) {
        // Could be revoked or not_active — try to read the body
        try {
          const body = await response.json()
          errorType = body.error?.includes("deferred") ? "not_active" : "revoked"
        } catch {
          errorType = "revoked"
        }
      } else if (response.status === 409) errorType = "used"

      return redirectWithError(errorType, origin)
    }

    const data = (await response.json()) as {
      token?: string
      destinationScreen?: string
    }

    if (!data.token) {
      return redirectWithError("unknown", origin)
    }

    // Set the auth-token cookie with the JWT
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: EIGHT_HOURS_IN_SECONDS,
      path: "/",
    })

    // Redirect to the destination screen (or dashboard as fallback)
    const destination = data.destinationScreen ?? "/dashboard"
    return NextResponse.redirect(new URL(destination, origin))
  } catch {
    return redirectWithError("unknown", origin)
  }
}
