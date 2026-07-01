"use client"

import * as React from "react"
import {
  BanIcon,
  SendIcon,
  CalendarClockIcon,
  CopyPlusIcon,
} from "lucide-react"
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
import { StatusBadge } from "@/components/magic-links/StatusBadge"
import { ActivityTimeline } from "@/components/magic-links/ActivityTimeline"
import { CopyableLinkField } from "@/components/magic-links/CopyableLinkField"
import { ExpirationSelector } from "@/components/magic-links/ExpirationSelector"
import type {
  MagicLink,
  MagicLinkStatus,
  ActivityLogEntry,
  ExpirationType,
} from "@/lib/types"

interface MagicLinkDetailDrawerProps {
  link: MagicLink | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (action: string, link: MagicLink, payload?: string) => void
  activity?: ActivityLogEntry[]
}

const roleLabels: Record<MagicLink["role"], string> = {
  admin: "Admin",
  brand_manager: "Brand Manager",
  tendero: "Tendero",
  delivery: "Delivery",
}

const channelLabels: Record<MagicLink["deliveryChannel"], string> = {
  generate_only: "Generar solo link",
  send_email: "Enviar por email",
  generate_qr: "Generar QR",
}

const expirationTypeLabels: Record<MagicLink["expirationType"], string> = {
  relative: "Relativa",
  absolute: "Absoluta",
}

const usageLimitLabels: Record<MagicLink["usageLimitType"], string> = {
  single: "Un solo uso",
  unlimited: "Usos ilimitados",
  specific: "Cantidad específica",
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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso))
}

function formatUsage(link: MagicLink): string {
  if (link.usageLimit === null) return `${link.usageCount} / ∞`
  return `${link.usageCount} / ${link.usageLimit}`
}

const initialExtendExpiration = {
  type: "relative" as ExpirationType,
  relativeHours: 168,
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-start gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function ActionButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button className={cn("w-full sm:w-auto", className)} {...props}>
      {children}
    </Button>
  )
}

function MagicLinkDetailDrawer({
  link,
  open,
  onOpenChange,
  onAction,
  activity = [],
}: MagicLinkDetailDrawerProps) {
  const [isExtending, setIsExtending] = React.useState(false)
  const [extendExpiration, setExtendExpiration] = React.useState<{
    type: ExpirationType
    relativeHours?: number
    absoluteDate?: string
  }>(initialExtendExpiration)

  React.useEffect(() => {
    if (link) {
      setIsExtending(false)
      setExtendExpiration(initialExtendExpiration)
    }
  }, [link?.id])

  if (!link) return null

  const isActive = link.status === "active"
  const isUsed = link.status === "used"
  const isExpiredOrRevoked =
    link.status === "expired" || link.status === "revoked"

  const handleAction = (
    action: string,
    status: MagicLinkStatus,
    payload?: string
  ) => {
    if (status !== link.status) return
    onAction(action, link, payload)
  }

  const handleExtendConfirm = () => {
    let nextExpiration: string | null = null

    if (
      extendExpiration.type === "relative" &&
      extendExpiration.relativeHours
    ) {
      nextExpiration = new Date(
        Date.now() + extendExpiration.relativeHours * 3600000
      ).toISOString()
    } else if (
      extendExpiration.type === "absolute" &&
      extendExpiration.absoluteDate
    ) {
      nextExpiration = extendExpiration.absoluteDate
    }

    if (!nextExpiration) {
      toast.error("Seleccioná una fecha de expiración")
      return
    }

    const date = new Date(nextExpiration)
    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      toast.error("La fecha de expiración debe ser en el futuro")
      return
    }

    handleAction("extend", link.status, date.toISOString())
    setIsExtending(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-slot="magic-link-detail-drawer"
        side="right"
        className="sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Detalle de MagicLink</SheetTitle>
          <SheetDescription>{link.recipientName}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          <div className="flex flex-col gap-3">
            <StatusBadge status={link.status} size="lg" />
            <CopyableLinkField url={link.url} />
          </div>

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Destinatario</h4>
            <div className="flex flex-col gap-2">
              <SummaryRow label="Nombre" value={link.recipientName} />
              <SummaryRow label="Email" value={link.recipientEmail ?? "—"} />
              <SummaryRow label="Teléfono" value={link.recipientPhone ?? "—"} />
              <SummaryRow
                label="Nota interna"
                value={link.internalNote ?? "—"}
              />
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Acceso</h4>
            <div className="flex flex-col gap-2">
              <SummaryRow label="Rol" value={roleLabels[link.role]} />
              <SummaryRow label="Scope" value={link.scope} />
              <SummaryRow label="Pantalla" value={link.destinationScreen} />
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Vigencia</h4>
            <div className="flex flex-col gap-2">
              <SummaryRow
                label="Expiración"
                value={expirationTypeLabels[link.expirationType]}
              />
              <SummaryRow
                label="Fecha límite"
                value={
                  link.expirationDate
                    ? formatDateTime(link.expirationDate)
                    : "Sin expiración"
                }
              />
              <SummaryRow
                label="Activación"
                value={
                  link.deferredActivation
                    ? formatDateTime(link.deferredActivation)
                    : "Inmediata"
                }
              />
              <SummaryRow label="Usos" value={formatUsage(link)} />
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Entrega</h4>
            <div className="flex flex-col gap-2">
              <SummaryRow
                label="Canal"
                value={channelLabels[link.deliveryChannel]}
              />
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Metadata</h4>
            <div className="flex flex-col gap-2">
              <SummaryRow label="Creado por" value={link.createdBy} />
              <SummaryRow
                label="Creado el"
                value={formatDateTime(link.createdAt)}
              />
              <SummaryRow
                label="Actualizado el"
                value={formatDateTime(link.updatedAt)}
              />
            </div>
          </section>

          <Separator />

          <ActivityTimeline entries={activity} />

          <div className="flex flex-col gap-3 pt-2">
            {isExtending ? (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <span className="text-sm font-medium">
                  Nueva fecha de expiración
                </span>
                <ExpirationSelector
                  value={extendExpiration}
                  onChange={setExtendExpiration}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsExtending(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleExtendConfirm}
                    disabled={
                      extendExpiration.type === "relative"
                        ? !extendExpiration.relativeHours
                        : !extendExpiration.absoluteDate
                    }
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {isActive && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ActionButton
                      data-slot="magic-link-detail-revoke"
                      variant="destructive"
                      onClick={() => handleAction("revoke", "active")}
                    >
                      <BanIcon />
                      Revocar
                    </ActionButton>
                    <ActionButton
                      data-slot="magic-link-detail-extend"
                      variant="outline"
                      onClick={() => setIsExtending(true)}
                    >
                      <CalendarClockIcon />
                      Extender expiración
                    </ActionButton>
                    <ActionButton
                      data-slot="magic-link-detail-resend"
                      variant="outline"
                      onClick={() => handleAction("resend", "active")}
                    >
                      <SendIcon />
                      Reenviar
                    </ActionButton>
                  </div>
                )}

                {isExpiredOrRevoked && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ActionButton
                      data-slot="magic-link-detail-duplicate"
                      onClick={() => handleAction("duplicate", link.status)}
                    >
                      <CopyPlusIcon />
                      Duplicar configuración
                    </ActionButton>
                  </div>
                )}

                {isUsed && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ActionButton
                      data-slot="magic-link-detail-resend"
                      variant="outline"
                      onClick={() => handleAction("resend", "used")}
                    >
                      <SendIcon />
                      Reenviar
                    </ActionButton>
                    <ActionButton
                      data-slot="magic-link-detail-duplicate"
                      onClick={() => handleAction("duplicate", link.status)}
                    >
                      <CopyPlusIcon />
                      Duplicar configuración
                    </ActionButton>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { MagicLinkDetailDrawer }
export type { MagicLinkDetailDrawerProps }
