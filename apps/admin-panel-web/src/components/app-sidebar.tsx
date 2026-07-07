"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { User } from "@/lib/auth"
import { navDestinations, navGroupOrder, getSidebarDestinations } from "@/lib/nav"
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  LayoutDashboardIcon,
  UserRoundCogIcon,
  Settings2Icon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
} from "lucide-react"

// Presentation-only icon maps kept here (JSX belongs in the component, not in
// the data-only nav.ts module). Keys are destination URL (top-level items) or
// group title (collapsible groups).
const topLevelIcons: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboardIcon />,
  "/dashboard/all": <LayoutDashboardIcon />,
}

const groupIcons: Record<string, React.ReactNode> = {
  Administrador: <UserRoundCogIcon />,
  Settings: <Settings2Icon />,
}

/**
 * Build the NavMain items shape from the single source of truth in nav.ts.
 *
 * Top-level destinations (group === null) are rendered as direct links.
 * Grouped destinations are rendered as collapsible entries with children.
 */
function buildNavMain(destinations: typeof navDestinations) {
  const items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: { title: string; url: string }[]
  }[] = []

  for (const d of destinations) {
    if (d.group !== null) continue
    items.push({
      title: d.title,
      url: d.url,
      icon: topLevelIcons[d.url],
    })
  }

  for (const group of navGroupOrder) {
    const children = destinations.filter((d) => d.group === group)
    if (children.length === 0) continue
    items.push({
      title: group,
      url: "#",
      icon: groupIcons[group],
      items: children.map((c) => ({ title: c.title, url: c.url })),
    })
  }

  return items
}

const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: <GalleryVerticalEndIcon />,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: <AudioLinesIcon />,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: <TerminalIcon />,
      plan: "Free",
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: <FrameIcon />,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: <PieChartIcon />,
    },
    {
      name: "Travel",
      url: "#",
      icon: <MapIcon />,
    },
  ],
}

const FALLBACK_AVATAR = "/avatars/shadcn.jpg"

function formatRole(role: string): string {
  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User | null
}) {
  const destinationScreen =
    user?.kind === "magic-link" ? user.destinationScreen : null
  const visibleDestinations = getSidebarDestinations(destinationScreen)
  const navMainItems = buildNavMain(visibleDestinations)

  const userProps = user
    ? user.kind === "auth"
      ? {
          name: user.name_admin_users,
          email: user.email_admin_users,
          avatar: FALLBACK_AVATAR,
        }
      : {
          name: formatRole(user.role),
          email: user.scopeId,
          avatar: FALLBACK_AVATAR,
        }
    : {
        name: "Invitado",
        email: "",
        avatar: FALLBACK_AVATAR,
      }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        {destinationScreen === null && <NavProjects projects={data.projects} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userProps} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
