"use client"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { LeadStatus } from "@/lib/types"

const statusBadgeVariants = cva("", {
  variants: {
    status: {
      new: "",
      contacted: "",
      qualified: "",
      lost: "",
    },
    size: {
      sm: "px-1.5 py-0 text-[0.65rem]",
      default: "",
      lg: "px-2.5 py-0.5 text-sm",
    },
  },
  defaultVariants: {
    status: "new",
    size: "default",
  },
})

const statusConfig: Record<
  LeadStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  new: { label: "Nuevo", variant: "default" },
  contacted: { label: "Contactado", variant: "secondary" },
  qualified: { label: "Calificado", variant: "outline" },
  lost: { label: "Perdido", variant: "destructive" },
}

interface StatusBadgeProps
  extends
    Omit<React.ComponentProps<typeof Badge>, "variant">,
    VariantProps<typeof statusBadgeVariants> {
  status: LeadStatus
}

function StatusBadge({
  status,
  size = "default",
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      data-slot="status-badge"
      data-status={status}
      data-size={size}
      variant={config.variant}
      className={cn(statusBadgeVariants({ status, size }), className)}
      {...props}
    >
      {config.label}
    </Badge>
  )
}

export { StatusBadge, statusBadgeVariants }
