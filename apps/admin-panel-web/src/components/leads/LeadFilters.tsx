"use client"

import { SearchIcon, XIcon } from "lucide-react"

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
import type { LeadFilters, LeadStatus, LeadSource } from "@/lib/types"

const statusLabels: Record<LeadStatus | "all", string> = {
  all: "Todos",
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  lost: "Perdido",
}

const sourceLabels: Record<LeadSource | "all", string> = {
  all: "Todos",
  web: "Web",
  manual: "Manual",
  quote: "Cotizador",
  chatbot: "Chatbot",
  otro: "Otro",
}

interface LeadFiltersProps {
  filters: LeadFilters
  onFiltersChange: (filters: LeadFilters) => void
  onClearFilters: () => void
}

function LeadFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: LeadFiltersProps) {
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.source !== "all"

  const update = (patch: Partial<LeadFilters>) => {
    onFiltersChange({ ...filters, ...patch })
  }

  return (
    <div
      data-slot="lead-filters"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative max-w-md min-w-[16rem] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-slot="lead-filters-search"
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
              update({ status: value as LeadStatus | "all" })
            }
          >
            <SelectTrigger
              data-slot="lead-filters-status"
              className="w-full sm:w-36"
            >
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{statusLabels.all}</SelectItem>
              <SelectItem value="new">{statusLabels.new}</SelectItem>
              <SelectItem value="contacted">{statusLabels.contacted}</SelectItem>
              <SelectItem value="qualified">{statusLabels.qualified}</SelectItem>
              <SelectItem value="lost">{statusLabels.lost}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.source}
            onValueChange={(value) =>
              update({ source: value as LeadSource | "all" })
            }
          >
            <SelectTrigger
              data-slot="lead-filters-source"
              className="w-full sm:w-36"
            >
              <SelectValue placeholder="Origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{sourceLabels.all}</SelectItem>
              <SelectItem value="web">{sourceLabels.web}</SelectItem>
              <SelectItem value="manual">{sourceLabels.manual}</SelectItem>
              <SelectItem value="quote">{sourceLabels.quote}</SelectItem>
              <SelectItem value="chatbot">{sourceLabels.chatbot}</SelectItem>
              <SelectItem value="otro">{sourceLabels.otro}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            data-slot="lead-filters-clear"
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
    </div>
  )
}

export { LeadFilters }
export type { LeadFiltersProps }
