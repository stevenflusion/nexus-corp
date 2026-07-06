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
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
        {
          title: "Administrador",
          url: "#",
          icon: <UserRoundCogIcon />,
          isActive: true,
          items: [
            {
              title: "Magic Links",
              url: "/dashboard/magic-links",
            },
            {
              title: "Leads",
              url: "/dashboard/leads",
            },
          ],
        },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        {
          title: "Tema",
          url: "/dashboard/settings/tema",
        },
      ],
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
  sessionSlot,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User | null
  sessionSlot?: React.ReactNode
}) {
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
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        {sessionSlot}
        <NavUser user={userProps} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
