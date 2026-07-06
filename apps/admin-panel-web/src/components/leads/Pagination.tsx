"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div
      data-slot="lead-pagination"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="text-sm text-muted-foreground">
        Mostrando{" "}
        <span className="font-medium text-foreground">
          {start}-{end}
        </span>{" "}
        de <span className="font-medium text-foreground">{totalItems}</span>{" "}
        resultados
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Filas por página
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) =>
              onItemsPerPageChange(Number.parseInt(value, 10))
            }
          >
            <SelectTrigger
              data-slot="lead-pagination-per-page"
              className="w-20"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            data-slot="lead-pagination-previous"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeftIcon />
            <span className="sr-only">Página anterior</span>
          </Button>

          <span
            data-slot="lead-pagination-info"
            className={cn(
              "flex h-7 min-w-[4rem] items-center justify-center rounded-md border border-border px-2 text-sm font-medium"
            )}
          >
            {currentPage} / {totalPages}
          </span>

          <Button
            data-slot="lead-pagination-next"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRightIcon />
            <span className="sr-only">Página siguiente</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export { Pagination }
export type { PaginationProps }
