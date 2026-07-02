"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/magic-links/StatusBadge"
import { MagicLinkRowActions } from "@/components/magic-links/MagicLinkRowActions"
import { Badge } from "@/components/ui/badge"
import type { MagicLink, MagicLinkRole } from "@/lib/types"

const roleLabels: Record<MagicLinkRole, string> = {
  admin: "Admin",
  brand_manager: "Brand Manager",
  tendero: "Tendero",
  delivery: "Delivery",
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso))
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function formatUsage(link: MagicLink): string {
  if (link.usageLimit === null) return `${link.usageCount}/∞`
  return `${link.usageCount}/${link.usageLimit}`
}

interface MagicLinkTableProps {
  links: MagicLink[]
  onRowClick: (link: MagicLink) => void
  onAction: (action: string, link: MagicLink) => void
}

function MagicLinkTable({ links, onRowClick, onAction }: MagicLinkTableProps) {
  return (
    <div
      data-slot="magic-link-table"
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Estado</TableHead>
            <TableHead>Destinatario</TableHead>
            <TableHead>Rol/Scope</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead>Expira</TableHead>
            <TableHead className="w-[80px]">Usos</TableHead>
            <TableHead className="w-[60px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow
              key={link.id}
              data-slot="magic-link-table-row"
              className="cursor-pointer"
              onClick={() => onRowClick(link)}
            >
              <TableCell>
                <StatusBadge status={link.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{link.recipientName}</span>
                  <span className="text-sm text-muted-foreground">
                    {link.recipientEmail ?? link.recipientPhone ?? "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant="secondary" className="w-fit">
                    {roleLabels[link.role]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {link.scope}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{formatDate(link.createdAt)}</span>
                  <span className="text-sm text-muted-foreground">
                    {link.createdBy}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {link.expirationDate ? (
                  <span>{formatDateTime(link.expirationDate)}</span>
                ) : (
                  <span className="text-muted-foreground">Sin expiración</span>
                )}
              </TableCell>
              <TableCell>
                <span className="font-medium tabular-nums">
                  {formatUsage(link)}
                </span>
              </TableCell>
              <TableCell>
                <MagicLinkRowActions link={link} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { MagicLinkTable }
export type { MagicLinkTableProps }
