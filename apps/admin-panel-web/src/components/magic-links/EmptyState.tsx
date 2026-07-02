"use client"

import { LinkIcon, SearchXIcon, PlusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  variant: "no-links" | "no-results"
  onCreateClick?: () => void
  onClearFilters?: () => void
}

function EmptyState({
  variant,
  onCreateClick,
  onClearFilters,
}: EmptyStateProps) {
  const isNoLinks = variant === "no-links"
  const Icon = isNoLinks ? LinkIcon : SearchXIcon
  const title = isNoLinks
    ? "No hay MagicLinks creados"
    : "No se encontraron resultados"
  const description = isNoLinks
    ? "Comienza creando tu primer MagicLink para invitar usuarios."
    : "Ajusta los filtros o limpia la búsqueda para ver más resultados."

  return (
    <div
      data-slot="magic-link-empty-state"
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

      {isNoLinks ? (
        <Button
          data-slot="magic-link-empty-state-create"
          onClick={onCreateClick}
        >
          <PlusIcon />
          Crear tu primer MagicLink
        </Button>
      ) : (
        <Button
          data-slot="magic-link-empty-state-clear"
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
