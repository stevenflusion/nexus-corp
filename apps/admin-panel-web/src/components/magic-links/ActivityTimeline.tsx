"use client"

import { Badge } from "@/components/ui/badge"
import type { ActivityLogEntry } from "@/lib/types"

interface ActivityTimelineProps {
  entries: ActivityLogEntry[]
}

const resultLabels: Record<ActivityLogEntry["result"], string> = {
  success: "Éxito",
  failed_expired: "Expirado",
  failed_used: "Ya usado",
  failed_revoked: "Revocado",
}

const resultVariants: Record<
  ActivityLogEntry["result"],
  React.ComponentProps<typeof Badge>["variant"]
> = {
  success: "default",
  failed_expired: "outline",
  failed_used: "outline",
  failed_revoked: "destructive",
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function ActivityTimeline({ entries }: ActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <div
        data-slot="activity-timeline-empty"
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Sin actividad registrada
        </p>
      </div>
    )
  }

  return (
    <div data-slot="activity-timeline" className="flex flex-col gap-4">
      <h4 className="text-sm font-medium">Historial de actividad</h4>
      <div className="relative flex flex-col gap-4 pl-3">
        <div className="absolute top-2 bottom-2 left-[11px] w-px bg-border" />
        {entries.map((entry) => (
          <div
            key={entry.id}
            data-slot="activity-timeline-entry"
            className="relative flex gap-3"
          >
            <span
              data-slot="activity-timeline-dot"
              className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full bg-border ring-2 ring-popover"
            />
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(entry.timestamp)}
                </span>
                <Badge variant={resultVariants[entry.result]}>
                  {resultLabels[entry.result]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.ip} · {entry.device}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { ActivityTimeline }
export type { ActivityTimelineProps }
