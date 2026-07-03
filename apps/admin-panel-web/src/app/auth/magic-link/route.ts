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
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  // Use the Host header to construct the base URL.
  // request.url may contain 0.0.0.0 when the dev server binds to 0.0.0.0,
  // which breaks cookies (wrong domain) and redirects.
  const protocol = request.headers.get("x-forwarded-proto") || "http"
  const host = request.headers.get("host") || "localhost:3000"
  const baseUrl = `${protocol}://${host}`

  // No token in the URL — redirect to login with error
  if (!token) {
    return redirectWithError("invalid", baseUrl)
  }

  const apiKey = process.env.API_KEY
  const apiUrl = process.env.API_URL

  if (!apiKey || !apiUrl) {
    return redirectWithError("unknown", baseUrl)
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

      return redirectWithError(errorType, baseUrl)
    }

    const data = (await response.json()) as {
      token?: string
      destinationScreen?: string
    }

    if (!data.token) {
      return redirectWithError("unknown", baseUrl)
    }

    // Set the auth-token cookie directly on the redirect response.
    // cookies().set() from next/headers does NOT work with NextResponse.redirect()
    // — the cookie is lost. Must set it on the response object directly.
    const destination = data.destinationScreen ?? "/dashboard"
    const redirectResponse = NextResponse.redirect(
      new URL(destination, baseUrl)
    )

    redirectResponse.cookies.set(COOKIE_NAME, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: EIGHT_HOURS_IN_SECONDS,
      path: "/",
    })

    return redirectResponse
  } catch {
    return redirectWithError("unknown", origin)
  }
}
