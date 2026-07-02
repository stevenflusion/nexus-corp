"use client"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { MagicLinkStatus } from "@/lib/types"

const statusBadgeVariants = cva("", {
  variants: {
    status: {
      active: "",
      expired: "",
      used: "",
      revoked: "",
    },
    size: {
      sm: "px-1.5 py-0 text-[0.65rem]",
      default: "",
      lg: "px-2.5 py-0.5 text-sm",
    },
  },
  defaultVariants: {
    status: "active",
    size: "default",
  },
})

const statusConfig: Record<
  MagicLinkStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  active: { label: "Activo", variant: "default" },
  expired: { label: "Expirado", variant: "outline" },
  used: { label: "Usado", variant: "secondary" },
  revoked: { label: "Revocado", variant: "destructive" },
}

interface StatusBadgeProps
  extends
    Omit<React.ComponentProps<typeof Badge>, "variant">,
    VariantProps<typeof statusBadgeVariants> {
  status: MagicLinkStatus
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
