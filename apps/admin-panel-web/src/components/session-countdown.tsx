"use client"

import { useEffect, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Badge } from "@/components/ui/badge"
import { useSessionMonitor } from "@/hooks/useSessionMonitor"
import { cn } from "@/lib/utils"
import { ClockIcon } from "lucide-react"

const countdownBadgeVariants = cva(
  "group/badge inline-flex h-8 w-fit shrink-0 items-center justify-center gap-2 overflow-hidden rounded-4xl border border-transparent px-3 py-1 text-sm font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-4!",
  {
    variants: {
      urgency: {
        default: "bg-primary text-primary-foreground",
        warning:
          "bg-muted-foreground text-background ring-1 ring-border focus-visible:ring-muted-foreground/20",
        danger:
          "bg-destructive text-white focus-visible:ring-destructive/20 animate-pulse",
      },
    },
    defaultVariants: {
      urgency: "default",
    },
  }
)

function formatHMMSS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function SessionCountdown({
  className,
}: React.ComponentProps<"span">) {
  const { isMagicLink, expiresAt } = useSessionMonitor()

  const [display, setDisplay] = useState<string | null>(null)
  const [urgency, setUrgency] =
    useState<VariantProps<typeof countdownBadgeVariants>["urgency"]>("default")

  useEffect(() => {
    if (!isMagicLink || !expiresAt) {
      setDisplay(null)
      return
    }

    const update = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      )
      setDisplay(formatHMMSS(remaining))

      if (remaining < 60) {
        setUrgency("danger")
      } else if (remaining < 5 * 60) {
        setUrgency("warning")
      } else {
        setUrgency("default")
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [isMagicLink, expiresAt])

  if (!display) return null

  return (
    <Badge
      variant="default"
      className={cn(countdownBadgeVariants({ urgency }), className)}
    >
      <ClockIcon className="size-4" />
      {display}
    </Badge>
  )
}
