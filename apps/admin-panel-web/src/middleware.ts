import { NextRequest, NextResponse } from "next/server"

/**
 * Protect all dashboard routes by requiring an auth-token cookie.
 *
 * Public routes such as / and /login are intentionally not matched by the
 * config below, so unauthenticated users can reach the login page.
 *
 * When the auth-token is missing we also clear the non-httpOnly
 * magic-link-exp cookie so the client does not show a stale countdown.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    const redirect = NextResponse.redirect(new URL("/", request.url))
    redirect.cookies.delete("magic-link-exp")
    return redirect
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
