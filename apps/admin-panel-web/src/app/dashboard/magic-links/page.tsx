"use client"

import * as React from "react"
import { toast } from "sonner"

import { MagicLinkFilters } from "@/components/magic-links/MagicLinkFilters"
import { MagicLinkTable } from "@/components/magic-links/MagicLinkTable"
import { Pagination } from "@/components/magic-links/Pagination"
import { EmptyState } from "@/components/magic-links/EmptyState"
import { LoadingSkeleton } from "@/components/magic-links/LoadingSkeleton"
import { MagicLinkDetailDrawer } from "@/components/magic-links/MagicLinkDetailDrawer"
import { MagicLinkCreateDialog } from "@/components/magic-links/MagicLinkCreateDialog"
import { ConfirmDialog } from "@/components/magic-links/ConfirmDialog"
import {
  getMagicLinks,
  getMagicLinkActivity,
  revokeMagicLink,
  resendMagicLink,
  extendMagicLink,
} from "@/lib/magic-links"
import type {
  MagicLink,
  MagicLinkFilters as MagicLinkFiltersType,
  ActivityLogEntry,
} from "@/lib/types"

const defaultFilters: MagicLinkFiltersType = {
  search: "",
  status: "all",
  role: "all",
  dateFrom: null,
  dateTo: null,
}

export default function MagicLinksPage() {
  const [filters, setFilters] =
    React.useState<MagicLinkFiltersType>(defaultFilters)
  const [links, setLinks] = React.useState<MagicLink[]>([])
  const [loading, setLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(6)
  const [selectedLink, setSelectedLink] = React.useState<MagicLink | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [duplicateSource, setDuplicateSource] =
    React.useState<MagicLink | null>(null)
  const [activity, setActivity] = React.useState<ActivityLogEntry[]>([])
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const confirmActionRef = React.useRef<() => void>(() => {})

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

  React.useEffect(() => {
    if (!isDetailOpen || !selectedLink) {
      setActivity([])
      return
    }

    let cancelled = false
    getMagicLinkActivity(selectedLink.id).then((entries) => {
      if (!cancelled) {
        setActivity(entries)
      }
    })

    return () => {
      cancelled = true
    }
  }, [isDetailOpen, selectedLink?.id])

  const refreshLink = (updated: MagicLink) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === updated.id ? updated : link))
    )
    setSelectedLink((prev) => (prev?.id === updated.id ? updated : prev))
  }

  const handleFiltersChange = (next: MagicLinkFiltersType) => {
    setFilters(next)
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters)
  }

  const handleRowClick = (link: MagicLink) => {
    setSelectedLink(link)
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

  const handleCopy = async (link: MagicLink) => {
    try {
      await navigator.clipboard.writeText(link.url)
      toast.success("Link copiado")
    } catch {
      toast.error("No se pudo copiar el link")
    }
  }

  const handleResend = async (link: MagicLink) => {
    try {
      const updated = await resendMagicLink(link.id)
      refreshLink(updated)
      toast.success("Link reenviado")
    } catch {
      toast.error("No se pudo reenviar el link")
    }
  }

  const handleExtend = async (link: MagicLink, newDate: string) => {
    try {
      const updated = await extendMagicLink(link.id, newDate)
      refreshLink(updated)
      toast.success("Expiración extendida")
    } catch {
      toast.error("No se pudo extender la expiración")
    }
  }

  const handleRevoke = async (link: MagicLink) => {
    openConfirm(async () => {
      try {
        const updated = await revokeMagicLink(link.id)
        refreshLink(updated)
        setIsDetailOpen(false)
        toast.success("Link revocado")
      } catch {
        toast.error("No se pudo revocar el link")
      }
    })
  }

  const handleDuplicate = (link: MagicLink) => {
    setDuplicateSource(link)
    setIsDetailOpen(false)
    setIsCreateOpen(true)
    toast.info("Configuración cargada para duplicar")
  }

  const handleCreateOpenChange = (open: boolean) => {
    setIsCreateOpen(open)
    if (!open) {
      setDuplicateSource(null)
    }
  }

  const handleCreated = async (link: MagicLink) => {
    try {
      const data = await getMagicLinks(filters)
      setLinks(data)
      toast.success(`MagicLink creado para ${link.recipientName}`)
      setDuplicateSource(null)
    } catch {
      toast.error("No se pudo actualizar la lista")
    }
  }

  const handleAction = (action: string, link: MagicLink, payload?: string) => {
    switch (action) {
      case "view":
        handleRowClick(link)
        break
      case "copy":
        handleCopy(link)
        break
      case "resend":
        handleResend(link)
        break
      case "extend":
        if (payload) {
          handleExtend(link, payload)
        }
        break
      case "revoke":
        handleRevoke(link)
        break
      case "duplicate":
        handleDuplicate(link)
        break
      default:
        break
    }
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

      <MagicLinkDetailDrawer
        link={selectedLink}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onAction={handleAction}
        activity={activity}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Revocar MagicLink"
        description="Esta acción es irreversible. El link dejará de funcionar inmediatamente. ¿Estás seguro?"
        confirmLabel="Revocar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirm}
        destructive
      />

      <MagicLinkCreateDialog
        open={isCreateOpen}
        onOpenChange={handleCreateOpenChange}
        duplicateSource={duplicateSource}
        onCreated={handleCreated}
      />
    </div>
  )
}
