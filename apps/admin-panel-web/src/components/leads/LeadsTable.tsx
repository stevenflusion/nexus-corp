"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/leads/StatusBadge"
import { Badge } from "@/components/ui/badge"
import type { Lead, LeadSource } from "@/lib/types"

const sourceLabels: Record<LeadSource, string> = {
  web: "Web",
  manual: "Manual",
  quote: "Cotizador",
  chatbot: "Chatbot",
  otro: "Otro",
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso))
}

interface LeadsTableProps {
  leads: Lead[]
  onRowClick: (lead: Lead) => void
}

function LeadsTable({ leads, onRowClick }: LeadsTableProps) {
  return (
    <div
      data-slot="leads-table"
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Estado</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Ciudad / Origen</TableHead>
            <TableHead className="w-[100px]">Cotizaciones</TableHead>
            <TableHead className="w-[120px]">Creado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id_leads}
              data-slot="leads-table-row"
              className="cursor-pointer"
              onClick={() => onRowClick(lead)}
            >
              <TableCell>
                <StatusBadge status={lead.status_leads} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{lead.name_leads}</span>
                  {lead.coments_optionals_lead ? (
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {lead.coments_optionals_lead}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {lead.email_leads ?? "—"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {lead.phone_leads ?? "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">
                    {lead.city_leads ?? "—"}
                  </span>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {sourceLabels[lead.source_leads]}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium tabular-nums">
                  {lead.quotes?.length ?? 0}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDate(lead.createdAt)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { LeadsTable }
export type { LeadsTableProps }
