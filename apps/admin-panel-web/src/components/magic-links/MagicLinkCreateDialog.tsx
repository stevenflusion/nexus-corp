"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  Loader2Icon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RoleScopeSelect } from "@/components/magic-links/RoleScopeSelect"
import { ExpirationSelector } from "@/components/magic-links/ExpirationSelector"
import { UsageLimitInput } from "@/components/magic-links/UsageLimitInput"
import { CopyableLinkField } from "@/components/magic-links/CopyableLinkField"
import { createMagicLink } from "@/lib/magic-links"
import type {
  MagicLink,
  MagicLinkRole,
  DeliveryChannel,
  ExpirationType,
  UsageLimitType,
  CreateMagicLinkInput,
} from "@/lib/types"

interface MagicLinkCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicateSource?: MagicLink | null
  onCreated?: (link: MagicLink) => void
}

interface FormState {
  recipientName: string
  recipientEmail: string
  recipientPhone: string
  internalNote: string
  role: MagicLinkRole | null
  scope: string
  scopeId: string
  destinationScreen: string
  expiration: {
    type: ExpirationType
    relativeHours?: number
    absoluteDate?: string
  }
  deferredActivationEnabled: boolean
  deferredActivationDate: string
  usageLimit: { type: UsageLimitType; count: number | null }
  deliveryChannel: DeliveryChannel
  emailMessage: string
}

type FormErrorKey =
  | "recipientName"
  | "recipientEmail"
  | "recipientPhone"
  | "role"
  | "scope"
  | "destinationScreen"
  | "expiration"
  | "deferredActivation"
  | "usageLimit"

const initialFormState: FormState = {
  recipientName: "",
  recipientEmail: "",
  recipientPhone: "",
  internalNote: "",
  role: null,
  scope: "",
  scopeId: "",
  destinationScreen: "",
  expiration: { type: "relative", relativeHours: 24 },
  deferredActivationEnabled: false,
  deferredActivationDate: "",
  usageLimit: { type: "single", count: null },
  deliveryChannel: "generate_only",
  emailMessage: `Hola,\n\nAccedé a Nexus Corp usando este link seguro:\n{{link}}\n\nEste link es personal e intransferible. Si no solicitaste este acceso, ignorá este mensaje.\n\nSaludos,\nEquipo Nexus`,
}

const destinationOptions = [
  "/dashboard",
  "/pos",
  "/delivery/orders",
  "/brand/dashboard",
  "/brand/reports",
  "/admin/dashboard",
  "/admin/users",
  "/admin/settings",
]

const channelOptions: { value: DeliveryChannel; label: string }[] = [
  { value: "generate_only", label: "Solo generar link (copiar)" },
  { value: "send_email", label: "Enviar por email" },
  { value: "generate_qr", label: "Generar QR" },
]

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidPhone(phone: string): boolean {
  return /^[+\d\s()-]{7,}$/.test(phone.trim())
}

function computeExpirationDate(
  expiration: FormState["expiration"]
): string | null {
  if (expiration.type === "relative") {
    if (!expiration.relativeHours || expiration.relativeHours <= 0) return null
    return new Date(
      Date.now() + expiration.relativeHours * 3600000
    ).toISOString()
  }

  if (expiration.type === "absolute") {
    if (!expiration.absoluteDate) return null
    const date = new Date(expiration.absoluteDate)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  }

  return null
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

function MagicLinkCreateDialog({
  open,
  onOpenChange,
  duplicateSource,
  onCreated,
}: MagicLinkCreateDialogProps) {
  const [formState, setFormState] = React.useState<FormState>(initialFormState)
  const [errors, setErrors] = React.useState<
    Partial<Record<FormErrorKey, string>>
  >({})
  const [loading, setLoading] = React.useState(false)
  const [createdLink, setCreatedLink] = React.useState<MagicLink | null>(null)
  const [activationCalendarOpen, setActivationCalendarOpen] =
    React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)

  React.useEffect(() => {
    if (!open) return

    if (duplicateSource) {
      setFormState({
        ...initialFormState,
        role: duplicateSource.role,
        scope: duplicateSource.scope,
        scopeId: duplicateSource.scopeId,
        destinationScreen: duplicateSource.destinationScreen,
        expiration:
          duplicateSource.expirationType === "relative"
            ? { type: "relative", relativeHours: 24 }
            : {
                type: "absolute",
                absoluteDate: duplicateSource.expirationDate ?? undefined,
              },
        deferredActivationEnabled: !!duplicateSource.deferredActivation,
        deferredActivationDate: duplicateSource.deferredActivation ?? "",
        usageLimit: {
          type: duplicateSource.usageLimitType,
          count: duplicateSource.usageLimit,
        },
        deliveryChannel: duplicateSource.deliveryChannel,
        emailMessage: `Hola ${duplicateSource.recipientName},\n\nAccedé a Nexus Corp usando este link seguro:\n{{link}}\n\nSaludos,\nEquipo Nexus`,
      })
    } else {
      setFormState(initialFormState)
    }

    setErrors({})
    setCreatedLink(null)
    setStep(1)
  }, [open, duplicateSource])

  const clearError = (key: FormErrorKey) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  // Validate only step 1 fields (essential/required)
  const validateStep1 = (): boolean => {
    const nextErrors: Partial<Record<FormErrorKey, string>> = {}

    const name = formState.recipientName.trim()
    if (!name) {
      nextErrors.recipientName = "El nombre es requerido"
    } else if (name.length < 2) {
      nextErrors.recipientName = "El nombre debe tener al menos 2 caracteres"
    }

    const email = formState.recipientEmail.trim()
    if (formState.deliveryChannel !== "generate_only") {
      if (!email) {
        nextErrors.recipientEmail =
          "El email es requerido para este canal de entrega"
      } else if (!isValidEmail(email)) {
        nextErrors.recipientEmail = "El email no es válido"
      }
    } else if (email && !isValidEmail(email)) {
      nextErrors.recipientEmail = "El email no es válido"
    }

    if (!formState.role) {
      nextErrors.role = "El rol es requerido"
    }

    if (!formState.scope) {
      nextErrors.scope = "El scope es requerido"
    }

    if (!formState.destinationScreen) {
      nextErrors.destinationScreen = "La pantalla de destino es requerida"
    }

    const expirationDate = computeExpirationDate(formState.expiration)
    if (!expirationDate) {
      nextErrors.expiration = "La expiración es requerida"
    } else if (new Date(expirationDate) <= new Date()) {
      nextErrors.expiration = "La expiración debe ser en el futuro"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  // Validate all fields (step 1 + step 2)
  const validateAll = (): boolean => {
    const step1Valid = validateStep1()
    const nextErrors: Partial<Record<FormErrorKey, string>> = {}

    const phone = formState.recipientPhone.trim()
    if (phone && !isValidPhone(phone)) {
      nextErrors.recipientPhone = "El teléfono no es válido"
    }

    const expirationDate = computeExpirationDate(formState.expiration)

    if (formState.deferredActivationEnabled) {
      if (!formState.deferredActivationDate) {
        nextErrors.deferredActivation = "La fecha de activación es requerida"
      } else if (
        expirationDate &&
        new Date(expirationDate) <= new Date(formState.deferredActivationDate)
      ) {
        nextErrors.expiration =
          "La expiración debe ser posterior a la activación"
      }
    }

    if (
      formState.usageLimit.type === "specific" &&
      (formState.usageLimit.count === null || formState.usageLimit.count < 1)
    ) {
      nextErrors.usageLimit = "La cantidad debe ser al menos 1"
    }

    // Merge with step 1 errors if step 1 wasn't clean
    if (!step1Valid) {
      setErrors((prev) => ({ ...prev, ...nextErrors }))
    } else {
      setErrors(nextErrors)
    }

    return step1Valid && Object.keys(nextErrors).length === 0
  }

  const handleBlur = () => {
    if (step === 1) {
      validateStep1()
    } else {
      validateAll()
    }
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // If on step 1, Enter key should go to step 2, not submit
    if (step === 1) {
      handleNext()
      return
    }

    if (!validateAll()) {
      return
    }

    setLoading(true)

    try {
      const input: CreateMagicLinkInput = {
        recipientName: formState.recipientName.trim(),
        recipientEmail: formState.recipientEmail.trim() || null,
        recipientPhone: formState.recipientPhone.trim() || null,
        internalNote: formState.internalNote.trim() || null,
        role: formState.role!,
        scope: formState.scope,
        scopeId: formState.scopeId,
        destinationScreen: formState.destinationScreen,
        expirationType: formState.expiration.type,
        expirationDate: computeExpirationDate(formState.expiration),
        deferredActivation: formState.deferredActivationEnabled
          ? formState.deferredActivationDate
          : null,
        usageLimitType: formState.usageLimit.type,
        usageLimit:
          formState.usageLimit.type === "unlimited"
            ? null
            : formState.usageLimit.count,
        deliveryChannel: formState.deliveryChannel,
      }

      const link = await createMagicLink(input)
      setCreatedLink(link)
      toast.success("MagicLink creado exitosamente")
      onCreated?.(link)
    } catch {
      toast.error("No se pudo generar el link, intenta de nuevo")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleCreateAnother = () => {
    setFormState(initialFormState)
    setErrors({})
    setCreatedLink(null)
    setStep(1)
  }

  const handleActivationDateSelect = (selected: Date | undefined) => {
    setActivationCalendarOpen(false)
    if (!selected) {
      update("deferredActivationDate", "")
      return
    }
    const current = formState.deferredActivationDate
      ? new Date(formState.deferredActivationDate)
      : new Date()
    selected.setHours(current.getHours(), current.getMinutes(), 0, 0)
    update("deferredActivationDate", selected.toISOString())
  }

  const handleActivationTimeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const timeValue = event.target.value
    if (!timeValue) {
      update("deferredActivationDate", "")
      return
    }
    const [hours, minutes] = timeValue.split(":").map(Number)
    const base = formState.deferredActivationDate
      ? new Date(formState.deferredActivationDate)
      : new Date()
    base.setHours(hours ?? 0, minutes ?? 0, 0, 0)
    update("deferredActivationDate", base.toISOString())
  }

  const activationDate = formState.deferredActivationDate
    ? new Date(formState.deferredActivationDate)
    : undefined

  const roleLabel: Record<MagicLinkRole, string> = {
    admin: "Admin",
    brand_manager: "Brand Manager",
    tendero: "Tendero",
    delivery: "Delivery",
  }

  const channelLabel: Record<DeliveryChannel, string> = {
    generate_only: "Solo generar link",
    send_email: "Enviar por email",
    generate_qr: "Generar QR",
  }

  const usageLabel: Record<UsageLimitType, string> = {
    single: "Un solo uso",
    unlimited: "Ilimitado",
    specific: `${formState.usageLimit.count} usos`,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="magic-link-create-dialog"
        className="flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-2xl"
      >
        {createdLink ? (
          <div className="flex flex-col items-center gap-6 overflow-y-auto p-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
              <CheckCircleIcon className="size-7" />
            </div>

            <div className="flex flex-col gap-2">
              <DialogTitle>MagicLink creado</DialogTitle>
              <DialogDescription>
                Compartí este link con {createdLink.recipientName}.
              </DialogDescription>
            </div>

            <CopyableLinkField url={createdLink.url} label="Link de acceso" />

            <div className="w-full rounded-xl border border-border bg-muted/30 p-4 text-left text-sm">
              <div className="grid grid-cols-[6.5rem_1fr] items-start gap-2">
                <span className="text-muted-foreground">Destinatario</span>
                <span className="font-medium text-foreground">
                  {createdLink.recipientName}
                </span>

                <span className="text-muted-foreground">Rol</span>
                <span className="font-medium text-foreground">
                  {roleLabel[createdLink.role]}
                </span>

                <span className="text-muted-foreground">Scope</span>
                <span className="font-medium text-foreground">
                  {createdLink.scope}
                </span>

                <span className="text-muted-foreground">Expiración</span>
                <span className="font-medium text-foreground">
                  {createdLink.expirationDate
                    ? formatDateTime(createdLink.expirationDate)
                    : "Sin expiración"}
                </span>

                <span className="text-muted-foreground">Canal</span>
                <span className="font-medium text-foreground">
                  {channelLabel[createdLink.deliveryChannel]}
                </span>

                <span className="text-muted-foreground">Usos</span>
                <span className="font-medium text-foreground">
                  {usageLabel[createdLink.usageLimitType]}
                </span>
              </div>
            </div>

            <DialogFooter className="w-full sm:justify-center">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cerrar
              </Button>
              <Button type="button" onClick={handleCreateAnother}>
                Crear otro
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <DialogHeader className="shrink-0">
              <DialogTitle>Crear MagicLink</DialogTitle>
              <DialogDescription>
                {step === 1
                  ? "Completá los datos básicos para generar un nuevo link de acceso."
                  : "Configurá los ajustes avanzados o generá el link directamente."}
              </DialogDescription>

              {/* Step indicator */}
              <div className="flex items-center gap-2 pt-1 pb-4 text-sm">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[0.7rem] font-medium",
                    step === 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  1
                </span>
                <span
                  className={cn(
                    "font-medium",
                    step === 1 ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Datos básicos
                </span>
                <span className="text-muted-foreground">·</span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[0.7rem] font-medium",
                    step === 2
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  2
                </span>
                <span
                  className={cn(
                    "font-medium",
                    step === 2 ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Ajustes avanzados
                </span>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  {/* Section 1: Destinatario (essential) */}
                  <section className="flex flex-col gap-4">
                    <h3 className="text-sm font-medium text-foreground">
                      Destinatario
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label htmlFor="recipient-name">Nombre</Label>
                        <Input
                          id="recipient-name"
                          type="text"
                          value={formState.recipientName}
                          onChange={(event) => {
                            update("recipientName", event.target.value)
                            clearError("recipientName")
                          }}
                          onBlur={handleBlur}
                          placeholder="Nombre del destinatario"
                          aria-invalid={!!errors.recipientName}
                        />
                        {errors.recipientName && (
                          <p className="text-sm text-destructive" role="alert">
                            {errors.recipientName}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label htmlFor="recipient-email">Email</Label>
                        <Input
                          id="recipient-email"
                          type="email"
                          value={formState.recipientEmail}
                          onChange={(event) => {
                            update("recipientEmail", event.target.value)
                            clearError("recipientEmail")
                          }}
                          onBlur={handleBlur}
                          placeholder="email@ejemplo.com"
                          aria-invalid={!!errors.recipientEmail}
                        />
                        {errors.recipientEmail && (
                          <p className="text-sm text-destructive" role="alert">
                            {errors.recipientEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Section 2: Acceso */}
                  <section className="flex flex-col gap-4">
                    <h3 className="text-sm font-medium text-foreground">
                      Acceso
                    </h3>

                    <RoleScopeSelect
                      role={formState.role}
                      scope={formState.scope}
                      onRoleChange={(role) => {
                        update("role", role)
                        clearError("role")
                        clearError("scope")
                      }}
                      onScopeChange={(scope, scopeId) => {
                        update("scope", scope)
                        update("scopeId", scopeId)
                        clearError("scope")
                      }}
                      roleError={errors.role}
                      scopeError={errors.scope}
                    />

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="destination-screen">
                        Pantalla de destino
                      </Label>
                      <Select
                        value={formState.destinationScreen}
                        onValueChange={(value) => {
                          update("destinationScreen", value)
                          clearError("destinationScreen")
                        }}
                      >
                        <SelectTrigger
                          id="destination-screen"
                          className="w-full"
                          aria-invalid={!!errors.destinationScreen}
                        >
                          <SelectValue placeholder="Seleccionar pantalla" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinationOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.destinationScreen && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.destinationScreen}
                        </p>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Section 3: Expiración (essential) */}
                  <section className="flex flex-col gap-4">
                    <h3 className="text-sm font-medium text-foreground">
                      Vigencia
                    </h3>

                    <div className="flex flex-col gap-1.5">
                      <Label>Expiración</Label>
                      <ExpirationSelector
                        value={formState.expiration}
                        onChange={(value) => {
                          update("expiration", value)
                          clearError("expiration")
                        }}
                        error={errors.expiration}
                      />
                    </div>
                  </section>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-6">
                  {/* Section: Destinatario (optional) */}
                  <section className="flex flex-col gap-4">
                    <h3 className="text-sm font-medium text-foreground">
                      Destinatario
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="recipient-phone">Teléfono</Label>
                        <Input
                          id="recipient-phone"
                          type="tel"
                          value={formState.recipientPhone}
                          onChange={(event) => {
                            update("recipientPhone", event.target.value)
                            clearError("recipientPhone")
                          }}
                          onBlur={handleBlur}
                          placeholder="+54 9 11 1234 5678"
                          aria-invalid={!!errors.recipientPhone}
                        />
                        {errors.recipientPhone && (
                          <p className="text-sm text-destructive" role="alert">
                            {errors.recipientPhone}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="internal-note">Nota interna</Label>
                        <Textarea
                          id="internal-note"
                          value={formState.internalNote}
                          onChange={(event) =>
                            update("internalNote", event.target.value)
                          }
                          placeholder="Motivo del acceso, contexto..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Section: Vigencia avanzada */}
                  <section className="flex flex-col gap-4">
                    <h3 className="text-sm font-medium text-foreground">
                      Vigencia avanzada
                    </h3>

                    <div className="flex flex-col gap-1.5">
                      <Label>Límite de usos</Label>
                      <UsageLimitInput
                        value={formState.usageLimit}
                        onChange={(value) => {
                          update("usageLimit", value)
                          clearError("usageLimit")
                        }}
                        error={errors.usageLimit}
                      />
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="deferred-activation"
                          checked={formState.deferredActivationEnabled}
                          onCheckedChange={(checked) => {
                            update(
                              "deferredActivationEnabled",
                              checked === true
                            )
                            if (checked === true) {
                              const now = new Date()
                              now.setMinutes(now.getMinutes() + 5)
                              update(
                                "deferredActivationDate",
                                now.toISOString()
                              )
                            } else {
                              update("deferredActivationDate", "")
                            }
                            clearError("deferredActivation")
                          }}
                        />
                        <Label
                          htmlFor="deferred-activation"
                          className="font-normal text-foreground"
                        >
                          Activación diferida
                        </Label>
                      </div>

                      {formState.deferredActivationEnabled && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor="activation-date">
                              Fecha de activación
                            </Label>
                            <Popover
                              open={activationCalendarOpen}
                              onOpenChange={setActivationCalendarOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  id="activation-date"
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal sm:w-48",
                                    !activationDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon />
                                  {activationDate
                                    ? format(activationDate, "dd/MM/yyyy")
                                    : "Seleccionar fecha"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={activationDate}
                                  onSelect={handleActivationDateSelect}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor="activation-time">Hora</Label>
                            <div className="relative">
                              <ClockIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="activation-time"
                                type="time"
                                value={
                                  activationDate
                                    ? format(activationDate, "HH:mm")
                                    : ""
                                }
                                onChange={handleActivationTimeChange}
                                className="w-full pl-9 sm:w-32"
                                aria-invalid={!!errors.deferredActivation}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {errors.deferredActivation && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.deferredActivation}
                        </p>
                      )}

                      {errors.expiration && step === 2 && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.expiration}
                        </p>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Section: Entrega */}
                  <section className="flex flex-col gap-4">
                    <h3 className="text-sm font-medium text-foreground">
                      Entrega
                    </h3>

                    <RadioGroup
                      value={formState.deliveryChannel}
                      onValueChange={(value) => {
                        update("deliveryChannel", value as DeliveryChannel)
                        clearError("recipientEmail")
                      }}
                      className="flex flex-col gap-2"
                    >
                      {channelOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center gap-2"
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={`channel-${option.value}`}
                          />
                          <Label
                            htmlFor={`channel-${option.value}`}
                            className="font-normal text-foreground"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {formState.deliveryChannel === "send_email" && (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email-message">Preview del email</Label>
                        <Textarea
                          id="email-message"
                          value={formState.emailMessage}
                          onChange={(event) =>
                            update("emailMessage", event.target.value)
                          }
                          placeholder="Mensaje del email..."
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Usá {"{{link}}"} como placeholder para el link
                          generado.
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end gap-2 p-4 pt-4">
              {step === 1 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Siguiente
                    <ChevronRightIcon />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    <ChevronLeftIcon />
                    Anterior
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2Icon className="animate-spin" />
                        Generando...
                      </>
                    ) : (
                      "Generar link"
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { MagicLinkCreateDialog }
export type { MagicLinkCreateDialogProps }
