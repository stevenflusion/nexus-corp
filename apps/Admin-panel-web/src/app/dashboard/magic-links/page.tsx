"use client"

import * as React from "react"

import { MagicLinkFilters } from "@/components/magic-links/MagicLinkFilters"
import { MagicLinkTable } from "@/components/magic-links/MagicLinkTable"
import { Pagination } from "@/components/magic-links/Pagination"
import { EmptyState } from "@/components/magic-links/EmptyState"
import { LoadingSkeleton } from "@/components/magic-links/LoadingSkeleton"
import { getMagicLinks } from "@/lib/magic-links"
import type { MagicLink, MagicLinkFilters as MagicLinkFiltersType } from "@/lib/types"

const defaultFilters: MagicLinkFiltersType = {
  search: "",
  status: "all",
  role: "all",
  dateFrom: null,
  dateTo: null,
}

export default function MagicLinksPage() {
  const [filters, setFilters] = React.useState<MagicLinkFiltersType>(defaultFilters)
  const [links, setLinks] = React.useState<MagicLink[]>([])
  const [loading, setLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)
  const [selectedLink, setSelectedLink] = React.useState<MagicLink | null>(null)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    setLoading(true)
    getMagicLinks(filters).then((data) => {
      if (!cancelled) {
        setLinks(data)
        setLoading(false)
        setCurrentPage(1)
      }
    })

    return () => {
      cancelled = true
    }
  }, [filters])

  const handleFiltersChange = (next: MagicLinkFiltersType) => {
    setFilters(next)
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters)
  }

  const handleRowClick = (link: MagicLink) => {
    setSelectedLink(link)
  }

  const handleAction = (_action: string, link: MagicLink) => {
    // Slice 3 will wire detail drawer, revoke/extend/resend/duplicate flows.
    // Slice 4 will wire the create dialog.
    setSelectedLink(link)
  }

  const totalItems = links.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const paginatedLinks = links.slice(
    (currentPageSafe - 1) * itemsPerPage,
    currentPageSafe * itemsPerPage
  )

  const isDefaultFilters =
    filters.search === "" &&
    filters.status === "all" &&
    filters.role === "all" &&
    filters.dateFrom === null &&
    filters.dateTo === null

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
        <h1 className="text-2xl font-bold">Magic Links</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los links de acceso para administradores, brand managers,
          tenderos y delivery.
        </p>
      </div>

      <MagicLinkFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onCreateClick={() => setIsCreateOpen(true)}
        onClearFilters={handleClearFilters}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : totalItems === 0 ? (
        isDefaultFilters ? (
          <EmptyState
            variant="no-links"
            onCreateClick={() => setIsCreateOpen(true)}
          />
        ) : (
          <EmptyState
            variant="no-results"
            onClearFilters={handleClearFilters}
          />
        )
      ) : (
        <>
          <MagicLinkTable
            links={paginatedLinks}
            onRowClick={handleRowClick}
            onAction={handleAction}
          />
          <Pagination
            currentPage={currentPageSafe}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      )}

      {/* Slice 4 will render the create dialog here using isCreateOpen. */}
      {isCreateOpen && null}
      {/* Slice 3 will render the detail drawer here using selectedLink. */}
      {selectedLink && null}
    </div>
  )
}
