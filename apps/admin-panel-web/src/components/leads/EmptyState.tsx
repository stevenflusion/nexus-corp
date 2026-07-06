"use client"

import { UsersIcon, SearchXIcon, PlusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  variant: "no-leads" | "no-results"
  onCreateClick?: () => void
  onClearFilters?: () => void
}

function EmptyState({
  variant,
  onCreateClick,
  onClearFilters,
}: EmptyStateProps) {
  const isNoLeads = variant === "no-leads"
  const Icon = isNoLeads ? UsersIcon : SearchXIcon
  const title = isNoLeads
    ? "No hay leads registrados"
    : "No se encontraron resultados"
  const description = isNoLeads
    ? "Los leads aparecerán aquí cuando se registren desde la web o cotizador."
    : "Ajustá los filtros o limpiá la búsqueda para ver más resultados."

  return (
    <div
      data-slot="leads-empty-state"
      data-variant={variant}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm",
        "min-h-[16rem]"
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-7" />
      </div>

      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {isNoLeads ? null : (
        <Button
          data-slot="leads-empty-state-clear"
          variant="outline"
          onClick={onClearFilters}
        >
          <XIcon />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
