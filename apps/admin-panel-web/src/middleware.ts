import { NextRequest, NextResponse } from "next/server"

/**
 * Protect all dashboard routes by requiring an auth-token cookie.
 *
 * Public routes such as / and /login are intentionally not matched by the
 * config below, so unauthenticated users can reach the login page.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
