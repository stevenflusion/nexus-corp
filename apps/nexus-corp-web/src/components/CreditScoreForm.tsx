import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react"
import { useRef, useState } from "react"

type Step = "datos" | "documentos" | "exito"

interface LeadFormState {
  name: string
  email: string
  phone: string
  city: string
  message: string
  acceptedTerms: boolean
}

const INITIAL_LEAD: LeadFormState = {
  name: "",
  email: "",
  phone: "",
  city: "",
  message: "",
  acceptedTerms: false,
}

const MAX_FILE_BYTES = 15 * 1024 * 1024

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isValidPhone = (value: string) => {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 9 && digits.length <= 13
}

export default function CreditScoreForm() {
  const [step, setStep] = useState<Step>("datos")
  const [lead, setLead] = useState<LeadFormState>(INITIAL_LEAD)
  const [idLeads, setIdLeads] = useState<number | null>(null)

  const [contractFile, setContractFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)

  const [submittingLead, setSubmittingLead] = useState(false)
  const [submittingDocs, setSubmittingDocs] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const contractInputRef = useRef<HTMLInputElement | null>(null)
  const selfieInputRef = useRef<HTMLInputElement | null>(null)

  const handleLeadChange = (
    field: keyof LeadFormState,
    value: string | boolean
  ) => {
    setLead((prev) => ({ ...prev, [field]: value }))
  }

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!lead.name.trim() || !lead.email.trim() || !isValidEmail(lead.email)) {
      setErrorMessage("Ingresa un nombre y un correo válidos.")
      return
    }

    if (!isValidPhone(lead.phone)) {
      setErrorMessage("Ingresa un teléfono válido (mínimo 9 dígitos).")
      return
    }

    if (!lead.acceptedTerms) {
      setErrorMessage("Debes aceptar los Términos y la Política de Privacidad.")
      return
    }

    setSubmittingLead(true)

    try {
      const response = await fetch("/api/credit-score-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name.trim(),
          email: lead.email.trim(),
          phone: lead.phone.trim(),
          city: lead.city.trim(),
          message: lead.message.trim(),
          acceptedTerms: lead.acceptedTerms,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.id_leads) {
        setErrorMessage(
          data?.error ?? "No pudimos registrar tus datos. Inténtalo nuevamente."
        )
        return
      }

      setIdLeads(data.id_leads)
      setStep("documentos")
    } catch {
      setErrorMessage("Error de conexión. Verifica tu internet e inténtalo de nuevo.")
    } finally {
      setSubmittingLead(false)
    }
  }

  const validateFile = (
    file: File,
    allowed: string[],
    label: string
  ): string | null => {
    if (!allowed.includes(file.type)) {
      return `Formato no válido para ${label}.`
    }
    if (file.size > MAX_FILE_BYTES) {
      return `${label} debe pesar máximo 15 MB.`
    }
    return null
  }

  const handleContractChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setErrorMessage(null)
    if (!file) {
      setContractFile(null)
      return
    }
    const error = validateFile(file, ["application/pdf"], "el contrato (PDF)")
    if (error) {
      setErrorMessage(error)
      event.target.value = ""
      setContractFile(null)
      return
    }
    setContractFile(file)
  }

  const handleSelfieChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setErrorMessage(null)
    if (!file) {
      setSelfieFile(null)
      setSelfiePreview(null)
      return
    }
    const error = validateFile(
      file,
      ["image/jpeg", "image/png", "image/webp"],
      "la selfie"
    )
    if (error) {
      setErrorMessage(error)
      event.target.value = ""
      setSelfieFile(null)
      setSelfiePreview(null)
      return
    }
    setSelfieFile(file)
    setSelfiePreview(URL.createObjectURL(file))
  }

  const handleDocsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!idLeads) {
      setErrorMessage("Falta registrar tus datos. Vuelve al paso anterior.")
      setStep("datos")
      return
    }

    if (!contractFile) {
      setErrorMessage("Adjunta el contrato firmado en PDF.")
      return
    }

    if (!selfieFile) {
      setErrorMessage("Adjunta una selfie sosteniendo tu cédula.")
      return
    }

    setSubmittingDocs(true)

    try {
      const formData = new FormData()
      formData.append("id_leads", String(idLeads))
      formData.append("contract", contractFile)
      formData.append("selfie", selfieFile)

      const response = await fetch("/api/credit-scores", {
        method: "POST",
        body: formData,
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(
          data?.error ?? "No pudimos subir tus documentos. Inténtalo nuevamente."
        )
        return
      }

      setStep("exito")
    } catch {
      setErrorMessage("Error de conexión al subir los documentos. Intenta de nuevo.")
    } finally {
      setSubmittingDocs(false)
    }
  }

  return (
    <div className="grid gap-4 rounded-lg border border-[var(--nexus-line)] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--nexus-green)] text-white">
          {step === "exito" ? (
            <BadgeCheck className="size-5" aria-hidden="true" />
          ) : step === "documentos" ? (
            <FileText className="size-5" aria-hidden="true" />
          ) : (
            <UserRound className="size-5" aria-hidden="true" />
          )}
        </span>
        <div>
          <p className="text-xs font-black text-[var(--nexus-green)] uppercase">
            {step === "datos" && "Paso 1 de 2"}
            {step === "documentos" && "Paso 2 de 2"}
            {step === "exito" && "Solicitud enviada"}
          </p>
          <h2 className="text-2xl font-black text-[var(--nexus-blue-dark)]">
            {step === "datos" && "Tus datos"}
            {step === "documentos" && "Sube tus documentos"}
            {step === "exito" && "¡Todo listo!"}
          </h2>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </p>
      )}

      {step === "datos" && (
        <form className="grid gap-4" onSubmit={handleLeadSubmit}>
          <label className="grid gap-2 text-sm font-black text-[var(--nexus-blue-dark)]">
            Nombre completo
            <input
              className="h-12 rounded-lg border border-[var(--nexus-line-soft)] bg-white px-4 font-semibold transition outline-none focus:border-[var(--nexus-green)] focus:ring-4 focus:ring-[var(--nexus-green)]/12"
              placeholder="Tu nombre completo"
              autoComplete="name"
              required
              value={lead.name}
              onChange={(e) => handleLeadChange("name", e.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-black text-[var(--nexus-blue-dark)]">
            Correo electrónico
            <input
              className="h-12 rounded-lg border border-[var(--nexus-line-soft)] bg-white px-4 font-semibold transition outline-none focus:border-[var(--nexus-green)] focus:ring-4 focus:ring-[var(--nexus-green)]/12"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              required
              value={lead.email}
              onChange={(e) => handleLeadChange("email", e.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-black text-[var(--nexus-blue-dark)]">
            Teléfono
            <input
              className="h-12 rounded-lg border border-[var(--nexus-line-soft)] bg-white px-4 font-semibold transition outline-none focus:border-[var(--nexus-green)] focus:ring-4 focus:ring-[var(--nexus-green)]/12"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Tu WhatsApp"
              required
              value={lead.phone}
              onChange={(e) => handleLeadChange("phone", e.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-black text-[var(--nexus-blue-dark)]">
            Ciudad
            <input
              className="h-12 rounded-lg border border-[var(--nexus-line-soft)] bg-white px-4 font-semibold transition outline-none focus:border-[var(--nexus-green)] focus:ring-4 focus:ring-[var(--nexus-green)]/12"
              placeholder="Ciudad donde resides"
              autoComplete="address-level2"
              value={lead.city}
              onChange={(e) => handleLeadChange("city", e.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-black text-[var(--nexus-blue-dark)]">
            Comentario (opcional)
            <textarea
              className="min-h-24 rounded-lg border border-[var(--nexus-line-soft)] bg-white px-4 py-3 font-semibold transition outline-none focus:border-[var(--nexus-green)] focus:ring-4 focus:ring-[var(--nexus-green)]/12"
              placeholder="Cuéntanos algo adicional sobre tu solicitud"
              value={lead.message}
              onChange={(e) => handleLeadChange("message", e.target.value)}
            />
          </label>

          <label className="flex items-start gap-3 text-sm text-[var(--nexus-gray)]">
            <input
              type="checkbox"
              required
              className="mt-1 size-4 rounded border-[var(--nexus-line-soft)] accent-[var(--nexus-green)]"
              checked={lead.acceptedTerms}
              onChange={(e) => handleLeadChange("acceptedTerms", e.target.checked)}
            />
            <span>
              He leído y acepto los{" "}
              <a
                href="/politica-de-privacidad"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[var(--nexus-green)] underline hover:text-[var(--nexus-green-business)]"
              >
                Términos y Condiciones
              </a>{" "}
              y la{" "}
              <a
                href="/politica-de-privacidad"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[var(--nexus-green)] underline hover:text-[var(--nexus-green-business)]"
              >
                Política de Privacidad
              </a>{" "}
              para el tratamiento de mis datos personales.
            </span>
          </label>

          <button
            type="submit"
            disabled={submittingLead}
            className="inline-flex items-center justify-center gap-3 rounded-lg bg-[var(--nexus-green)] px-6 py-4 text-sm font-black text-white transition hover:bg-[var(--nexus-green-business)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingLead ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <>
                Continuar
                <ArrowRight className="size-5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}

      {step === "documentos" && (
        <form className="grid gap-4" onSubmit={handleDocsSubmit}>
          <div className="grid gap-2">
            <p className="text-sm font-black text-[var(--nexus-blue-dark)]">
              Contrato firmado (PDF)
            </p>
            <button
              type="button"
              onClick={() => contractInputRef.current?.click()}
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-[var(--nexus-line-soft)] bg-[var(--nexus-cream)] px-4 py-5 text-left transition hover:border-[var(--nexus-green)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-[var(--nexus-green)]">
                <Upload className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold text-[var(--nexus-gray)]">
                {contractFile ? contractFile.name : "Toca para seleccionar el PDF del contrato"}
              </span>
            </button>
            <input
              ref={contractInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleContractChange}
            />
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-black text-[var(--nexus-blue-dark)]">
              Selfie sosteniendo tu cédula
            </p>
            <button
              type="button"
              onClick={() => selfieInputRef.current?.click()}
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-[var(--nexus-line-soft)] bg-[var(--nexus-cream)] px-4 py-5 text-left transition hover:border-[var(--nexus-green)]"
            >
              {selfiePreview ? (
                <img
                  src={selfiePreview}
                  alt="Vista previa de la selfie"
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-[var(--nexus-green)]">
                  <Upload className="size-5" aria-hidden="true" />
                </span>
              )}
              <span className="text-sm font-bold text-[var(--nexus-gray)]">
                {selfieFile ? selfieFile.name : "Toca para tomar o subir tu selfie con cédula"}
              </span>
            </button>
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              className="hidden"
              onChange={handleSelfieChange}
            />
            <p className="text-xs font-semibold text-[var(--nexus-gray-soft)]">
              Asegúrate de que tu rostro y los datos de la cédula se vean claros y legibles.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("datos")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--nexus-line-soft)] px-5 py-4 text-sm font-black text-[var(--nexus-blue-dark)] transition hover:border-[var(--nexus-green)]"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
              Atrás
            </button>
            <button
              type="submit"
              disabled={submittingDocs}
              className="inline-flex flex-1 items-center justify-center gap-3 rounded-lg bg-[var(--nexus-green)] px-6 py-4 text-sm font-black text-white transition hover:bg-[var(--nexus-green-business)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingDocs ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  Enviar solicitud
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {step === "exito" && (
        <div className="grid gap-4 text-center">
          <p className="text-base leading-7 text-[var(--nexus-gray)]">
            Recibimos tu contrato y tu selfie con cédula. Tu solicitud quedó registrada como{" "}
            <strong className="text-[var(--nexus-blue-dark)]">PENDIENTE</strong> y un asesor la
            revisará a la brevedad.
          </p>
          <a
            href="https://wa.me/593981371278?text=Hola%20NEXUS%2C%20acabo%20de%20enviar%20mi%20solicitud%20de%20score%20crediticio."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-3 rounded-lg bg-[var(--nexus-green)] px-6 py-4 text-sm font-black text-white transition hover:bg-[var(--nexus-green-business)]"
          >
            Escribir a un asesor por WhatsApp
            <ArrowRight className="size-5" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  )
}
