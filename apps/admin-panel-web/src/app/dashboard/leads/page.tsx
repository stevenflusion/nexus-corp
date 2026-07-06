"use client"

import * as React from "react"
import { toast } from "sonner"

import { LeadFilters } from "@/components/leads/LeadFilters"
import { LeadsTable } from "@/components/leads/LeadsTable"
import { Pagination } from "@/components/leads/Pagination"
import { EmptyState } from "@/components/leads/EmptyState"
import { LoadingSkeleton } from "@/components/leads/LoadingSkeleton"
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer"
import { ConfirmDialog } from "@/components/leads/ConfirmDialog"
import { getLeadsWithQuotes } from "@/lib/leads"
import type { Lead, LeadFilters as LeadFiltersType } from "@/lib/types"

const defaultFilters: LeadFiltersType = {
  search: "",
  status: "all",
  source: "all",
}

export default function LeadsPage() {
  const [filters, setFilters] =
    React.useState<LeadFiltersType>(defaultFilters)
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(6)
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const confirmActionRef = React.useRef<() => void>(() => {})

  React.useEffect(() => {
    let cancelled = false

    setLoading(true)
    getLeadsWithQuotes(filters).then((data) => {
      if (!cancelled) {
        setLeads(data)
        setLoading(false)
        setCurrentPage(1)
      }
    })

    return () => {
      cancelled = true
    }
  }, [filters])

  const refreshLead = (updated: Lead) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id_leads === updated.id_leads ? updated : lead))
    )
    setSelectedLead((prev) =>
      prev?.id_leads === updated.id_leads ? updated : prev
    )
  }

  const handleFiltersChange = (next: LeadFiltersType) => {
    setFilters(next)
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters)
  }

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDetailOpen(true)
  }

  const openConfirm = (onConfirm: () => void) => {
    confirmActionRef.current = onConfirm
    setIsConfirmOpen(true)
  }

  const handleConfirm = () => {
    confirmActionRef.current()
    confirmActionRef.current = () => {}
  }

  const totalItems = leads.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const paginatedLeads = leads.slice(
    (currentPageSafe - 1) * itemsPerPage,
    currentPageSafe * itemsPerPage
  )

  const isDefaultFilters =
    filters.search === "" &&
    filters.status === "all" &&
    filters.source === "all"

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Visualizá y gestioná los leads registrados en el sistema.
        </p>
      </div>

      <LeadFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : totalItems === 0 ? (
        isDefaultFilters ? (
          <EmptyState variant="no-leads" />
        ) : (
          <EmptyState
            variant="no-results"
            onClearFilters={handleClearFilters}
          />
        )
      ) : (
        <>
          <LeadsTable leads={paginatedLeads} onRowClick={handleRowClick} />
          <Pagination
            currentPage={currentPageSafe}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      )}

      <LeadDetailDrawer
        lead={selectedLead}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onStatusChange={refreshLead}
        onDeleteNoteRequest={openConfirm}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Eliminar nota"
        description="¿Estás seguro de que querés eliminar esta nota? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirm}
        destructive
      />
    </div>
  )
}
