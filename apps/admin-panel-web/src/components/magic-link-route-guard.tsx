"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { isRouteAllowed } from "@/lib/nav"
import type { MagicLinkUser } from "@/lib/auth"

/**
 * Client-side route guard for magic-link users.
 *
 * Sits inside the dashboard layout. On every pathname change, checks whether
 * the current route is allowed for the user's `destinationScreen`. If not,
 * redirects back to their destination.
 *
 * Admin users (kind === "auth") are NOT wrapped by this guard — the layout
 * only renders it for `MagicLinkUser`.
 */
function MagicLinkRouteGuard({
  user,
  children,
}: {
  user: MagicLinkUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  React.useEffect(() => {
    if (!isRouteAllowed(pathname, user.destinationScreen)) {
      router.replace(user.destinationScreen)
    }
  }, [pathname, user.destinationScreen, router])

  return <>{children}</>
}

export { MagicLinkRouteGuard }