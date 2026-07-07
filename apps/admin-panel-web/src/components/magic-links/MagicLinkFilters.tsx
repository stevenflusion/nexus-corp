"use client"

import { SearchIcon, PlusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  MagicLinkFilters,
  MagicLinkRole,
  MagicLinkStatus,
} from "@/lib/types"

const statusLabels: Record<MagicLinkStatus | "all", string> = {
  all: "Todos",
  active: "Activo",
  expired: "Expirado",
  used: "Usado",
  revoked: "Revocado",
}

const roleLabels: Record<MagicLinkRole | "all", string> = {
  all: "Todos",
  admin: "Admin",
  sistemas: "Sistemas",
  gerente_general: "Gerente General",
  gerencia_marketing: "Gerencia de Marketing",
}

interface MagicLinkFiltersProps {
  filters: MagicLinkFilters
  onFiltersChange: (filters: MagicLinkFilters) => void
  onCreateClick: () => void
  onClearFilters: () => void
}

function MagicLinkFilters({
  filters,
  onFiltersChange,
  onCreateClick,
  onClearFilters,
}: MagicLinkFiltersProps) {
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.role !== "all" ||
    filters.dateFrom !== null ||
    filters.dateTo !== null

  const update = (patch: Partial<MagicLinkFilters>) => {
    onFiltersChange({ ...filters, ...patch })
  }

  return (
    <div
      data-slot="magic-link-filters"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative max-w-md min-w-[16rem] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-slot="magic-link-filters-search"
            type="text"
            placeholder="Buscar por nombre, email o teléfono"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              update({ status: value as MagicLinkStatus | "all" })
            }
          >
            <SelectTrigger
              data-slot="magic-link-filters-status"
              className="w-full sm:w-36"
            >
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{statusLabels.all}</SelectItem>
              <SelectItem value="active">{statusLabels.active}</SelectItem>
              <SelectItem value="expired">{statusLabels.expired}</SelectItem>
              <SelectItem value="used">{statusLabels.used}</SelectItem>
              <SelectItem value="revoked">{statusLabels.revoked}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.role}
            onValueChange={(value) =>
              update({ role: value as MagicLinkRole | "all" })
            }
          >
            <SelectTrigger
              data-slot="magic-link-filters-role"
              className="w-full sm:w-40"
            >
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{roleLabels.all}</SelectItem>
              <SelectItem value="admin">{roleLabels.admin}</SelectItem>
              <SelectItem value="sistemas">
                {roleLabels.sistemas}
              </SelectItem>
              <SelectItem value="gerente_general">{roleLabels.gerente_general}</SelectItem>
              <SelectItem value="gerencia_marketing">{roleLabels.gerencia_marketing}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            data-slot="magic-link-filters-create"
            onClick={onCreateClick}
            className="w-full sm:w-auto"
          >
            <PlusIcon />
            Crear MagicLink
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm text-muted-foreground">Desde</span>
          <Input
            data-slot="magic-link-filters-date-from"
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(event) =>
              update({ dateFrom: event.target.value || null })
            }
            className="w-full sm:w-40"
          />
          <span className="text-sm text-muted-foreground">Hasta</span>
          <Input
            data-slot="magic-link-filters-date-to"
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(event) => update({ dateTo: event.target.value || null })}
            className="w-full sm:w-40"
          />
        </div>

        <Button
          data-slot="magic-link-filters-clear"
          variant="ghost"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className={cn("w-full sm:w-auto", !hasActiveFilters && "invisible")}
        >
          <XIcon />
          Limpiar filtros
        </Button>
      </div>
    </div>
  )
}

export { MagicLinkFilters }
export type { MagicLinkFiltersProps }
