import { AppSidebar } from "@/components/app-sidebar"
import { SessionMonitorProvider } from "@/components/session-monitor-provider"
import { SessionCountdown } from "@/components/session-countdown"
import { MagicLinkRouteGuard } from "@/components/magic-link-route-guard"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { getAuthUser } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  const guardedChildren =
    user?.kind === "magic-link" ? (
      <MagicLinkRouteGuard user={user}>{children}</MagicLinkRouteGuard>
    ) : (
      children
    )

  return (
    <SessionMonitorProvider>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
            </div>
            <div className="ml-auto px-4">
              <SessionCountdown />
            </div>
          </header>
          {guardedChildren}
        </SidebarInset>
      </SidebarProvider>
    </SessionMonitorProvider>
  )
}
