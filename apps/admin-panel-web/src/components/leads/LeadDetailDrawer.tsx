"use client"

import * as React from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/leads/StatusBadge"
import { LeadNotes } from "@/components/leads/LeadNotes"
import type { Lead, LeadStatus, LeadSource, Quote, LeadNote } from "@/lib/types"
import { updateLeadStatus, getLeadNotes } from "@/lib/leads"

const statusLabels: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  lost: "Perdido",
}

const sourceLabels: Record<LeadSource, string> = {
  web: "Web",
  manual: "Manual",
  quote: "Cotizador",
  chatbot: "Chatbot",
  otro: "Otro",
}

interface LeadDetailDrawerProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (updated: Lead) => void
  onDeleteNoteRequest: (onConfirm: () => void) => void
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-start gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function formatCurrency(value: string): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return "—"
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num)
}

function formatPercent(value: string): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return "—"
  return new Intl.NumberFormat("es-EC", {
    style: "percent",
    minimumFractionDigits: 2,
  }).format(num)
}

function calculateFinanced(amount: string, downPayment: string): string {
  const a = Number(amount)
  const d = Number(downPayment)
  if (!Number.isFinite(a) || !Number.isFinite(d)) return "—"
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Math.max(a - d, 0))
}

function QuoteRow({ quote }: { quote: Quote }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{quote.product_quotes}</span>
        <span className="text-xs text-muted-foreground">
          {quote.result_status_quotes}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>Monto objetivo: {formatCurrency(quote.requested_amount_quotes)}</span>
        <span>Entrada: {formatCurrency(quote.down_payment_quotes)}</span>
        <span>A financiar: {calculateFinanced(quote.requested_amount_quotes, quote.down_payment_quotes)}</span>
        <span>Cuota: {formatCurrency(quote.monthly_payment_quotes)}</span>
        <span>Plazo: {quote.term_months_quotes} meses</span>
        <span>TNA: {formatPercent(quote.annual_interest_rate_quotes)}</span>
      </div>
    </div>
  )
}

function LeadDetailDrawer({
  lead,
  open,
  onOpenChange,
  onStatusChange,
  onDeleteNoteRequest,
}: LeadDetailDrawerProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)
  const [notes, setNotes] = React.useState<LeadNote[]>([])

  React.useEffect(() => {
    if (!open || !lead) {
      setNotes([])
      return
    }

    let cancelled = false
    getLeadNotes(lead.id_leads).then((data) => {
      if (!cancelled) setNotes(data)
    })

    return () => {
      cancelled = true
    }
  }, [open, lead?.id_leads])

  if (!lead) return null

  const handleStatusChange = async (next: LeadStatus) => {
    if (next === lead.status_leads) return
    setIsUpdatingStatus(true)
    try {
      const updated = await updateLeadStatus(lead.id_leads, next)
      onStatusChange(updated)
      toast.success("Estado actualizado")
    } catch {
      toast.error("No se pudo actualizar el estado")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—"
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-slot="lead-detail-drawer"
        side="right"
        className="sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Detalle de Lead</SheetTitle>
          <SheetDescription>{lead.name_leads}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          <div className="flex flex-col gap-3">
            <StatusBadge status={lead.status_leads} size="lg" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Cambiar estado:
              </span>
              <Select
                value={lead.status_leads}
                onValueChange={(value) =>
                  handleStatusChange(value as LeadStatus)
                }
                disabled={isUpdatingStatus}
              >
                <SelectTrigger
                  data-slot="lead-detail-status-select"
                  className="w-40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{statusLabels.new}</SelectItem>
                  <SelectItem value="contacted">
                    {statusLabels.contacted}
                  </SelectItem>
                  <SelectItem value="qualified">
                    {statusLabels.qualified}
                  </SelectItem>
                  <SelectItem value="lost">{statusLabels.lost}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Información general</h4>
            <div className="flex flex-col gap-2">
              <SummaryRow label="Nombre" value={lead.name_leads} />
              <SummaryRow label="Email" value={lead.email_leads ?? "—"} />
              <SummaryRow label="Teléfono" value={lead.phone_leads ?? "—"} />
              <SummaryRow label="Ciudad" value={lead.city_leads ?? "—"} />
              <SummaryRow
                label="Origen"
                value={sourceLabels[lead.source_leads]}
              />
              <SummaryRow
                label="Ingresos"
                value={
                  lead.monthly_family_income
                    ? formatCurrency(lead.monthly_family_income)
                    : "—"
                }
              />
              <SummaryRow
                label="Comentarios"
                value={lead.coments_optionals_lead ?? "—"}
              />
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Términos</h4>
            <div className="flex flex-col gap-2">
              <SummaryRow
                label="Aceptados"
                value={lead.accepted_terms_lead ? "Sí" : "No"}
              />
              <SummaryRow
                label="Fecha"
                value={formatDate(lead.accepted_terms_at)}
              />
              <SummaryRow label="IP" value={lead.accepted_terms_ip ?? "—"} />
            </div>
          </section>

          <Separator />

          {lead.quotes && lead.quotes.length > 0 && (
            <>
              <section className="flex flex-col gap-3">
                <h4 className="text-sm font-medium">
                  Cotizaciones ({lead.quotes.length})
                </h4>
                <div className="flex flex-col gap-2">
                  {lead.quotes.map((quote) => (
                    <QuoteRow key={quote.id_quotes} quote={quote} />
                  ))}
                </div>
              </section>
              <Separator />
            </>
          )}

          <LeadNotes
            leadId={lead.id_leads}
            notes={notes}
            onNotesChange={setNotes}
            onDeleteRequest={onDeleteNoteRequest}
          />

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Metadata</h4>
            <div className="flex flex-col gap-2">
              <SummaryRow
                label="Creado el"
                value={formatDate(lead.createdAt)}
              />
              <SummaryRow
                label="Actualizado el"
                value={formatDate(lead.updatedAt)}
              />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { LeadDetailDrawer }
export type { LeadDetailDrawerProps }
