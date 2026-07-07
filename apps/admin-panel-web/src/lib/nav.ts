import type { MagicLinkRole } from "./types"

/**
 * Single source of truth for admin-panel routes.
 *
 * Two categories:
 * 1. SELECTABLE destinations — what an admin picks as the landing page when
 *    creating a magic link (`destinationScreen`). These are real functional
 *    sections (Dashboard, Magic Links, Leads).
 * 2. UNIVERSAL routes — always accessible to ANY logged-in user, regardless of
 *    their magic link's `destinationScreen`. These are NOT selectable as a
 *    landing page because they're settings/fallbacks (Tema, 404).
 *
 * Consumed by:
 * - MagicLinkCreateDialog (selectable destinations filtered by role)
 * - app-sidebar (all routes, grouped, for navigation)
 *
 * Universal routes are implicit in the access model: the 404 page is handled
 * by Next.js automatically; /dashboard/settings/tema is a user preference that
 * everyone can access once inside the panel.
 */

export type NavDestination = {
  /** Human label shown in the UI (Spanish). */
  title: string
  /** Absolute route inside admin-panel-web. */
  url: string
  /** Which roles can be assigned this destination on a magic link. */
  roles: MagicLinkRole[]
  /**
   * Whether this route appears as a selectable `destinationScreen` in the
   * magic link wizard. Universal routes (settings, 404) are NOT selectable.
   */
  selectable: boolean
  /**
   * Sidebar grouping.
   * - `null` -> top-level entry
   * - string -> child of that group (the group is rendered collapsible)
   */
  group: string | null
}

/**
 * SELECTABLE destinations — the functional sections an admin can send a
 * magic-link recipient to as their landing page.
 *
 * Universal routes (always accessible, not selectable):
 * - /dashboard/settings/tema -> appearance settings, available to everyone
 * - /404 (not-found)         -> automatic Next.js fallback
 *
 * NOTE: keep SELECTABLE urls in sync with the backend enum in
 * apps/api/src/dto/magic_links_dto.ts (VALID_DESTINATION_SCREENS).
 */
export const navDestinations: NavDestination[] = [
  // ── Selectable ──────────────────────────────────────────────
  {
    title: "Acceso total",
    url: "/dashboard/all",
    roles: ["admin", "sistemas", "gerente_general", "gerencia_marketing"],
    selectable: true,
    group: null,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    roles: ["admin", "sistemas", "gerente_general", "gerencia_marketing"],
    selectable: true,
    group: null,
  },
  {
    title: "Magic Links",
    url: "/dashboard/magic-links",
    roles: ["admin"],
    selectable: true,
    group: "Administrador",
  },
  {
    title: "Leads",
    url: "/dashboard/leads",
    roles: ["admin", "sistemas"],
    selectable: true,
    group: "Administrador",
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    roles: ["admin", "sistemas", "gerente_general", "gerencia_marketing"],
    selectable: true,
    group: "Administrador",
  },
  // ── Universal (not selectable as a landing page) ───────────
  {
    title: "Tema",
    url: "/dashboard/settings/tema",
    roles: ["admin", "sistemas", "gerente_general", "gerencia_marketing"],
    selectable: false,
    group: "Settings",
  },
]

/**
 * Selectable destinations shown in the magic link wizard.
 *
 * Role does NOT gate destination selection — the admin can send any role to
 * any selectable screen. The `roles` field on NavDestination is kept for
 * future RBAC evolution but is ignored here.
 */
export function getDestinationsForRole(
  _role: MagicLinkRole | null
): NavDestination[] {
  return navDestinations.filter((d) => d.selectable)
}

/** Whether a destination URL is selectable (role-independent). */
export function isDestinationAllowed(
  url: string,
  _role: MagicLinkRole | null
): boolean {
  return navDestinations.some((d) => d.selectable && d.url === url)
}

/** Ordered list of group titles for sidebar rendering. */
export const navGroupOrder: string[] = [
  "Administrador",
  "Settings",
]

// ── Access control ─────────────────────────────────────────────

/** Routes ALWAYS accessible to any logged-in user (not selectable as landing). */
export const UNIVERSAL_ROUTES: string[] = [
  "/dashboard/settings/tema",
]

/**
 * Routes a magic-link user is allowed to visit, given their destinationScreen.
 *
 * - `/dashboard/all` grants access to EVERY selectable destination + universal.
 * - Any other destination grants access to that destination + universal only.
 *
 * Admin users (kind === "auth") are NOT restricted — they see everything.
 */
export function getAllowedRoutes(destinationScreen: string): string[] {
  if (destinationScreen === "/dashboard/all") {
    return [
      ...navDestinations.filter((d) => d.selectable).map((d) => d.url),
      ...UNIVERSAL_ROUTES,
    ]
  }

  const allowed = new Set<string>([destinationScreen, ...UNIVERSAL_ROUTES])
  return [...allowed]
}

/** Whether a magic-link user can visit a given pathname. */
export function isRouteAllowed(
  pathname: string,
  destinationScreen: string
): boolean {
  const allowed = getAllowedRoutes(destinationScreen)
  return allowed.some((route) => pathname === route || pathname.startsWith(route + "/"))
}

/**
 * Destinations visible in the sidebar for a magic-link user.
 *
 * - `/dashboard/all` -> all destinations (every section + Tema).
 * - specific destination -> only that destination + universal routes.
 *
 * Admin users (kind === "auth") should call this with a sentinel to get all.
 */
export function getSidebarDestinations(
  destinationScreen: string | null
): NavDestination[] {
  if (!destinationScreen) {
    // Auth admin or unknown — show everything
    return navDestinations
  }

  const allowed = getAllowedRoutes(destinationScreen)
  return navDestinations.filter((d) => allowed.includes(d.url))
}