import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Calculator,
  Car,
  Check,
  ClipboardCheck,
  CreditCard,
  Home,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type ProductId = "vehiculo" | "vivienda" | "consumo"
type ContactPreference = "whatsapp" | "llamada" | "correo"
type LeadSaveStatus = "idle" | "saving" | "saved" | "local" | "error"

const DEFAULT_INCOME = 1800
const DEFAULT_DEBTS = 250
const LOCAL_QUOTE_LEADS_KEY = "nexus:quote-leads"

const products = [
  {
    id: "vehiculo" as const,
    title: "Vehículo automotriz",
    description:
      "Compra, renovación o evaluación de entrada para auto nuevo o seminuevo.",
    icon: Car,
    accent: "Vehicular",
    min: 8000,
    max: 90000,
    defaultAmount: 28000,
    defaultTerm: 60,
    terms: [24, 36, 48, 60, 72],
    annualRate: 0.12,
    suggestedDownPayment: 0.2,
    rateSummary: "Vehículo automotriz desde el 12% anual.",
    rateDisclaimer:
      "La tasa final puede variar según el tipo de cliente, tipo de entidad financiera, perfil crediticio y condiciones comerciales aplicables.",
    rateFactors:
      "Factores que influyen: tipo de cliente, tipo de entidad, financiera, perfil crediticio y condiciones comerciales.",
  },
  {
    id: "vivienda" as const,
    title: "Vivienda",
    description:
      "Preparación para compra, construcción, mejora o consolidación patrimonial.",
    icon: Home,
    accent: "Patrimonial",
    min: 25000,
    max: 250000,
    defaultAmount: 85000,
    defaultTerm: 180,
    terms: [60, 120, 180, 240],
    annualRate: 0.0499,
    suggestedDownPayment: 0.25,
    rateSummary: "Vivienda con tasa nominal desde el 4.99% anual.",
    rateDisclaimer:
      "Referencia Banco Pacífico. La tasa final puede variar según la entidad financiera, perfil del cliente, monto, plazo y condiciones aplicables.",
    rateFactors:
      "Tasa nominal referencial para preparar una conversación de asesoría.",
  },
  {
    id: "consumo" as const,
    title: "Crédito de consumo",
    description:
      "Ordenamiento de capacidad para estudios, salud, equipamiento o metas familiares.",
    icon: CreditCard,
    accent: "Personal",
    min: 1000,
    max: 50000,
    defaultAmount: 12000,
    defaultTerm: 36,
    terms: [12, 24, 36, 48, 60],
    annualRate: 0.1677,
    suggestedDownPayment: 0,
    rateSummary: "Crédito de consumo desde el 16.77% anual.",
    rateDisclaimer:
      "La tasa final puede variar según el perfil del cliente, entidad financiera, monto, plazo y condiciones comerciales aplicables.",
    rateFactors:
      "Referencia anual para asesoría; no representa aprobación ni oferta financiera.",
  },
]

const defaultProduct = products[0]

const steps = [
  "Elige tu objetivo",
  "Define monto y plazo",
  "Completa tus datos",
  "Resultado asesorado",
]

const cities = [
  "Quito",
  "Guayaquil",
  "Cuenca",
  "Manta",
  "Ambato",
  "Loja",
  "Otra ciudad",
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)

const formatPercent = (value: number) =>
  new Intl.NumberFormat("es-EC", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)

const isValidPhone = (value: string) => {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 9 && digits.length <= 13
}

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const clampNumber = (value: number, min: number, max: number) => {
  const parsed = Number.isFinite(value) ? value : min
  return Math.min(Math.max(parsed, min), max)
}

const normalizeNumericDraft = (value: string) => {
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    return ""
  }

  return digits.replace(/^0+(?=\d)/, "")
}

const getMonthlyPayment = (
  principal: number,
  annualRate: number,
  months: number
) => {
  if (principal <= 0 || months <= 0) {
    return 0
  }

  const monthlyRate = annualRate / 12
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
}

interface QuoteLeadPayload {
  product: ProductId
  quoteType: string
  name: string
  email: string
  phone: string
  city: string
  amount: number
  downPayment: number
  financedAmount: number
  termMonths: number
  annualRate: number
  rateShown: string
  monthlyPayment: number
  resultStatus: string
  contactPreference: ContactPreference
  acceptedTerms: boolean
  leadStatus: "nuevo"
}

interface QuoteWizardProps {
  initialProduct?: ProductId
}

const appendLocalQuoteLead = (payload: QuoteLeadPayload) => {
  try {
    const stored = window.localStorage.getItem(LOCAL_QUOTE_LEADS_KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    const current = Array.isArray(parsed) ? parsed : []

    window.localStorage.setItem(
      LOCAL_QUOTE_LEADS_KEY,
      JSON.stringify(
        [...current, { ...payload, createdAt: new Date().toISOString() }].slice(
          -200
        )
      )
    )
  } catch {
    // The lead can still be sent by WhatsApp if browser storage is unavailable.
  }
}

const saveQuoteLead = async (payload: QuoteLeadPayload) => {
  try {
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      return "saved" as const
    }
  } catch {
    // Static exports do not have local API routes; keep a browser copy instead.
  }

  appendLocalQuoteLead(payload)
  return "local" as const
}

export default function QuoteWizard({
  initialProduct = "vehiculo",
}: QuoteWizardProps) {
  const initialSelectedProduct =
    products.find((item) => item.id === initialProduct) ?? defaultProduct
  const [isReady, setIsReady] = useState(false)
  const [step, setStep] = useState(0)
  const [product, setProduct] = useState<ProductId>(initialSelectedProduct.id)
  const currentProduct =
    products.find((item) => item.id === product) ?? defaultProduct

  const [amount, setAmount] = useState(initialSelectedProduct.defaultAmount)
  const [downPayment, setDownPayment] = useState(
    Math.round(
      initialSelectedProduct.defaultAmount *
        initialSelectedProduct.suggestedDownPayment
    )
  )
  const [term, setTerm] = useState(initialSelectedProduct.defaultTerm)
  const [income, setIncome] = useState(DEFAULT_INCOME)
  const [monthlyDebts, setMonthlyDebts] = useState(DEFAULT_DEBTS)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("Quito")
  const [preference, setPreference] = useState<ContactPreference>("whatsapp")
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [leadSaveStatus, setLeadSaveStatus] = useState<LeadSaveStatus>("idle")
  const [savedLeadKey, setSavedLeadKey] = useState("")

  useEffect(() => {
    const readyTimer = window.setTimeout(() => {
      setIsReady(true)
    }, 0)

    return () => window.clearTimeout(readyTimer)
  }, [])

  useEffect(() => {
    const clampTimer = window.setTimeout(() => {
      const safeAmount = clampNumber(
        amount,
        currentProduct.min,
        currentProduct.max
      )

      setAmount((value) =>
        clampNumber(value, currentProduct.min, currentProduct.max)
      )
      setDownPayment((value) => clampNumber(value, 0, safeAmount))
    }, 0)

    return () => window.clearTimeout(clampTimer)
  }, [amount, currentProduct.max, currentProduct.min])

  const calculation = useMemo(() => {
    const safeAmount = clampNumber(
      amount,
      currentProduct.min,
      currentProduct.max
    )
    const safeDownPayment = clampNumber(downPayment, 0, safeAmount)
    const safeIncome = Math.max(income, 0)
    const safeMonthlyDebts = clampNumber(monthlyDebts, 0, safeIncome)
    const financed = Math.max(safeAmount - safeDownPayment, 0)
    const monthlyPayment = getMonthlyPayment(
      financed,
      currentProduct.annualRate,
      term
    )
    const netIncome = Math.max(safeIncome - safeMonthlyDebts, 0)
    const capacityRatio = currentProduct.id === "vivienda" ? 0.4 : 0.35
    const suggestedCapacity = Math.max(
      safeIncome * capacityRatio - safeMonthlyDebts,
      0
    )
    const suggestedDownPayment =
      safeAmount * currentProduct.suggestedDownPayment
    const entryGap = Math.max(suggestedDownPayment - safeDownPayment, 0)
    const load = suggestedCapacity > 0 ? monthlyPayment / suggestedCapacity : 99

    let status = "Revisar escenario"
    let statusTone = "review"
    let guidance =
      "La cuota estimada queda por encima de la capacidad sugerida. Conviene revisar entrada, plazo, monto o documentos antes de gestionar."

    if (load <= 0.85 && entryGap === 0) {
      status = "Escenario preliminar compatible"
      statusTone = "healthy"
      guidance =
        "La cuota estimada queda dentro de una zona razonable para iniciar una revisión documental con un asesor."
    } else if (load <= 0.85 && entryGap > 0) {
      status = "Compatible, con entrada por reforzar"
      statusTone = "tight"
      guidance =
        "La cuota conversa con tu capacidad, pero conviene revisar una entrada mayor antes de gestionar."
    } else if (load <= 1) {
      status = "Escenario ajustado"
      statusTone = "tight"
      guidance =
        "La cuota estimada puede conversar con tu capacidad, pero se debe revisar holgura mensual, estabilidad e historial."
    }

    return {
      amount: safeAmount,
      downPayment: safeDownPayment,
      financed,
      monthlyPayment,
      netIncome,
      suggestedCapacity,
      suggestedDownPayment,
      entryGap,
      load,
      status,
      statusTone,
      guidance,
    }
  }, [amount, currentProduct, downPayment, income, monthlyDebts, term])

  const progress = Math.round((step / (steps.length - 1)) * 100)

  const selectProduct = (nextProduct: ProductId) => {
    const selected =
      products.find((item) => item.id === nextProduct) ?? defaultProduct
    setProduct(nextProduct)
    setAmount(selected.defaultAmount)
    setDownPayment(
      Math.round(selected.defaultAmount * selected.suggestedDownPayment)
    )
    setTerm(selected.defaultTerm)
    setLeadSaveStatus("idle")
    setSavedLeadKey("")
    setError("")
  }

  const quoteLeadPayload = useMemo<QuoteLeadPayload>(
    () => ({
      product: currentProduct.id,
      quoteType: currentProduct.title,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      amount: calculation.amount,
      downPayment: calculation.downPayment,
      financedAmount: calculation.financed,
      termMonths: term,
      annualRate: currentProduct.annualRate,
      rateShown: currentProduct.rateSummary,
      monthlyPayment: Number(calculation.monthlyPayment.toFixed(2)),
      resultStatus: calculation.status,
      contactPreference: preference,
      acceptedTerms: consent,
      leadStatus: "nuevo",
    }),
    [
      calculation.amount,
      calculation.downPayment,
      calculation.financed,
      calculation.monthlyPayment,
      calculation.status,
      city,
      consent,
      currentProduct.annualRate,
      currentProduct.id,
      currentProduct.rateSummary,
      currentProduct.title,
      email,
      name,
      phone,
      preference,
      term,
    ]
  )

  const quoteLeadKey = JSON.stringify(quoteLeadPayload)

  const next = async () => {
    if (
      step === 1 &&
      (!Number.isFinite(amount) ||
        amount < currentProduct.min ||
        amount > currentProduct.max ||
        !Number.isFinite(income) ||
        income <= 0 ||
        !Number.isFinite(monthlyDebts) ||
        monthlyDebts < 0 ||
        monthlyDebts >= income ||
        downPayment < 0 ||
        downPayment > amount ||
        !currentProduct.terms.includes(term))
    ) {
      setError(
        "Revisa monto, entrada, plazo, ingresos y deudas antes de continuar."
      )
      return
    }

    if (step === 2 && (!name.trim() || !phone.trim() || !city.trim())) {
      setError("Por favor completa los campos obligatorios.")
      return
    }

    if (step === 2 && !isValidPhone(phone)) {
      setError("Ingresa un teléfono válido para coordinar la asesoría.")
      return
    }

    if (step === 2 && !email.trim()) {
      setError("Por favor ingresa un correo válido.")
      return
    }

    if (step === 2 && !isValidEmail(email)) {
      setError("Por favor ingresa un correo válido.")
      return
    }

    if (step === 2 && !consent) {
      setError("Debes aceptar los términos y condiciones para continuar.")
      return
    }

    if (step === 2 && savedLeadKey !== quoteLeadKey) {
      setLeadSaveStatus("saving")

      try {
        const status = await saveQuoteLead(quoteLeadPayload)
        setLeadSaveStatus(status)
        setSavedLeadKey(quoteLeadKey)
      } catch {
        setLeadSaveStatus("error")
        setError(
          "No pudimos registrar la cotización. Intenta nuevamente antes de continuar."
        )
        return
      }
    }

    setError("")
    setStep((value) => Math.min(value + 1, steps.length - 1))
  }

  const back = () => {
    setError("")
    setStep((value) => Math.max(value - 1, 0))
  }

  const reset = () => {
    setProduct(initialSelectedProduct.id)
    setAmount(initialSelectedProduct.defaultAmount)
    setDownPayment(
      Math.round(
        initialSelectedProduct.defaultAmount *
          initialSelectedProduct.suggestedDownPayment
      )
    )
    setTerm(initialSelectedProduct.defaultTerm)
    setIncome(DEFAULT_INCOME)
    setMonthlyDebts(DEFAULT_DEBTS)
    setName("")
    setPhone("")
    setEmail("")
    setCity("Quito")
    setPreference("whatsapp")
    setConsent(false)
    setStep(0)
    setError("")
    setCopied(false)
    setLeadSaveStatus("idle")
    setSavedLeadKey("")
  }

  const resultMessage = [
    "Hola NEXUS, quiero asesoría para revisar mi perfil financiero.",
    `Objetivo: ${currentProduct.title}`,
    `Monto objetivo: ${formatCurrency(calculation.amount)}`,
    `Entrada disponible: ${formatCurrency(calculation.downPayment)}`,
    `Monto a analizar: ${formatCurrency(calculation.financed)}`,
    `Plazo: ${term} meses`,
    `Tasa referencial: ${currentProduct.rateSummary}`,
    `Ingreso mensual: ${formatCurrency(Math.max(income, 0))}`,
    `Compromisos mensuales: ${formatCurrency(clampNumber(monthlyDebts, 0, Math.max(income, 0)))}`,
    `Cuota estimada: ${formatCurrency(calculation.monthlyPayment)}`,
    `Capacidad sugerida: ${formatCurrency(calculation.suggestedCapacity)}`,
    `Resultado: ${calculation.status}`,
    `Nombre: ${name || "Pendiente"}`,
    `Teléfono: ${phone || "Pendiente"}`,
    `Correo: ${email || "Pendiente"}`,
    `Ciudad: ${city || "Pendiente"}`,
    `Preferencia de contacto: ${preference}`,
    `Aceptación de términos: ${consent ? "Sí" : "No"}`,
  ].join("\n")

  const whatsappHref = `https://wa.me/593981371278?text=${encodeURIComponent(resultMessage)}`

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(resultMessage)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      className="quote-wizard bg-white text-[#08272d]"
      data-ready={isReady ? "true" : "false"}
      data-testid="quote-wizard"
    >
      <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-[1500px] lg:grid lg:grid-cols-[1fr_360px]">
        <aside
          className="order-2 hidden bg-[#006b25] text-white lg:flex lg:flex-col lg:px-10 lg:pt-10 lg:pb-24"
          style={{
            backgroundImage:
              "linear-gradient(145deg, rgba(0, 113, 39, 0.9), rgba(0, 84, 31, 0.84) 48%, rgba(0, 32, 35, 0.78)), url('/branding/fondo-cotizador.png')",
            backgroundSize: "cover",
            backgroundPosition: "center 68%",
          }}
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-white font-black text-[#006b25]">
                N
              </span>
              <div>
                <p className="text-xs font-bold text-white/64 uppercase">
                  Nexus
                </p>
                <p className="text-lg font-black">Cotizador guiado</p>
              </div>
            </div>

            <ol className="mt-12 space-y-7">
              {steps.map((label, index) => (
                <li
                  key={label}
                  className="grid grid-cols-[56px_1fr] items-center gap-5"
                >
                  <span
                    className={`grid size-14 place-items-center rounded-full border-2 text-xl font-black ${
                      index <= step
                        ? "border-white bg-white text-[#006b25]"
                        : "border-white/55 text-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-base leading-snug font-bold">
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-16">
            <p className="text-sm font-semibold text-white/72">
              {step + 1} de 4 pasos
            </p>
            <p className="mt-2 text-2xl font-black">{progress} % completado</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-[#b8f7c5] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-5 text-xs leading-5 text-white/68">
              NEXUS no otorga financiamiento. Esta herramienta prepara una
              conversación de asesoría con datos ordenados.
            </p>
          </div>
        </aside>

        <div className="lg:hidden">
          <div
            className="bg-[#006b25] px-3 py-4 text-white"
            style={{
              backgroundImage:
                "linear-gradient(145deg, rgba(0, 113, 39, 0.92), rgba(0, 84, 31, 0.88) 60%, rgba(0, 32, 35, 0.84)), url('/branding/fondo-cotizador.png')",
              backgroundSize: "cover",
              backgroundPosition: "center 58%",
            }}
          >
            <ol className="grid grid-cols-4 gap-1">
              {steps.map((label, index) => (
                <li
                  key={label}
                  className="grid min-w-0 justify-items-center gap-2 text-center"
                >
                  <span
                    className={`grid size-9 place-items-center rounded-full border-2 text-sm font-black ${
                      index <= step
                        ? "border-white bg-white text-[#006b25]"
                        : "border-white/55 text-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="max-w-full text-[0.64rem] leading-tight font-bold">
                    {index === 0
                      ? "Objetivo"
                      : index === 1
                        ? "Monto"
                        : index === 2
                          ? "Datos"
                          : "Resultado"}
                  </span>
                  <span
                    className={`size-3 rounded-full ${
                      index <= step ? "bg-[#b8f7c5]" : "bg-white/65"
                    }`}
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>

        <main className="px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <a
                href="/"
                className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#006b25] transition hover:bg-white hover:text-[#007127]"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Volver al sitio
              </a>
              <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#08272d]/10 bg-white px-3 py-2 text-xs font-bold text-[#4e575e] shadow-sm">
                <ShieldCheck
                  className="size-4 text-[#007127]"
                  aria-hidden="true"
                />
                Referencial, no aprobación ni oferta financiera
              </div>
            </div>

            <div className="mt-9">
              {step === 0 && (
                <div data-testid="step-product">
                  <div className="text-center">
                    <p className="text-sm font-black text-[#007127] uppercase">
                      Paso 1
                    </p>
                    <h1 className="mt-3 text-2xl font-black text-[#006b25] sm:text-3xl">
                      Elige el objetivo que quieres preparar
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#4e575e]">
                      Selecciona el tipo de proyecto. El resultado te ayuda a
                      conversar con un asesor con cifras, no con suposiciones.
                    </p>
                  </div>

                  <div className="mt-10 grid gap-4 lg:grid-cols-3">
                    {products.map((item) => {
                      const Icon = item.icon
                      const selected = item.id === product

                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!isReady}
                          onClick={() => selectProduct(item.id)}
                          className={`min-h-[18rem] rounded-lg border p-6 text-left transition ${
                            selected
                              ? "border-[#b8f7c5] bg-[#006b25] text-white shadow-xl shadow-[#006b25]/12"
                              : "border-[#d8eadf] bg-white text-[#08272d] hover:border-[#006b25]/40"
                          } disabled:cursor-wait disabled:opacity-70`}
                          data-testid={`product-${item.id}`}
                        >
                          <span
                            className={`grid size-14 place-items-center rounded-lg ${
                              selected
                                ? "bg-white/12 text-white"
                                : "bg-[#edf8f0] text-[#006b25]"
                            }`}
                          >
                            <Icon className="size-8" aria-hidden="true" />
                          </span>
                          <p
                            className={`mt-8 text-xs font-black uppercase ${
                              selected ? "text-[#b8f7c5]" : "text-[#007127]"
                            }`}
                          >
                            {item.accent}
                          </p>
                          <h2 className="mt-3 text-2xl font-black">
                            {item.title}
                          </h2>
                          <p
                            className={`mt-3 text-sm leading-6 ${
                              selected ? "text-white/84" : "text-[#4e575e]"
                            }`}
                          >
                            {item.description}
                          </p>
                          <p
                            className={`mt-4 rounded-lg px-3 py-2 text-sm leading-5 font-black ${
                              selected
                                ? "bg-white/10 text-white"
                                : "bg-[#edf8f0] text-[#006b25]"
                            }`}
                          >
                            {item.rateSummary}
                          </p>
                          <span
                            className={`mt-8 inline-flex items-center gap-2 text-sm font-black ${
                              selected ? "text-[#b8f7c5]" : "text-[#006b25]"
                            }`}
                          >
                            {selected ? "Seleccionado" : "Elegir opción"}
                            {selected && (
                              <Check className="size-4" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div
                  className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]"
                  data-testid="step-amount"
                >
                  <div className="rounded-lg border border-[#d8eadf] bg-white p-5 shadow-sm sm:p-7">
                    <p className="text-sm font-black text-[#007127] uppercase">
                      Paso 2
                    </p>
                    <h1 className="mt-3 text-2xl font-black text-[#006b25] sm:text-3xl">
                      Elige el monto que deseas simular
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-[#4e575e]">
                      Ajusta monto, entrada, plazo e ingresos. La cuota se
                      calcula con una tasa referencial para preparar asesoría.
                    </p>

                    <div className="mt-8 grid gap-6">
                      <NumberRange
                        label="Monto objetivo"
                        value={amount}
                        min={currentProduct.min}
                        max={currentProduct.max}
                        step={500}
                        onChange={setAmount}
                        id="quote-amount"
                      />
                      <NumberRange
                        label="Entrada disponible"
                        value={downPayment}
                        min={0}
                        max={amount}
                        step={500}
                        onChange={setDownPayment}
                        id="quote-down-payment"
                      />

                      <div className="grid gap-3">
                        <div className="flex items-center justify-between gap-4">
                          <label
                            className="text-sm font-black text-[#08272d]"
                            htmlFor="term"
                          >
                            Plazo
                          </label>
                          <span className="rounded-lg bg-[#edf8f0] px-3 py-1 text-sm font-black text-[#006b25]">
                            {term} meses
                          </span>
                        </div>
                        <select
                          id="term"
                          value={term}
                          onChange={(event) =>
                            setTerm(Number(event.target.value))
                          }
                          className="h-12 rounded-lg border border-[#cfe6d6] bg-white px-4 text-base font-bold text-[#08272d] transition outline-none focus:border-[#007127] focus:ring-4 focus:ring-[#007127]/12"
                        >
                          {currentProduct.terms.map((item) => (
                            <option key={item} value={item}>
                              {item} meses
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-lg border border-[#d8eadf] bg-[#f8fdf9] p-4">
                        <p className="text-xs font-black text-[#007127] uppercase">
                          Tasa referencial
                        </p>
                        <p className="mt-1 text-sm leading-6 font-bold text-[#08272d]">
                          {currentProduct.rateSummary}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-[#4e575e]">
                          {currentProduct.rateDisclaimer}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-[#4e575e]">
                          {currentProduct.rateFactors}
                        </p>
                      </div>

                      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <MoneyInput
                          label="Ingreso mensual familiar"
                          value={income}
                          onChange={setIncome}
                          id="income"
                        />
                        <MoneyInput
                          label="Compromisos mensuales"
                          value={monthlyDebts}
                          onChange={setMonthlyDebts}
                          id="monthly-debts"
                        />
                      </div>
                    </div>
                  </div>

                  <ResultPreview
                    title="Lectura preliminar"
                    product={currentProduct.title}
                    amount={calculation.amount}
                    calculation={calculation}
                    term={term}
                  />
                </div>
              )}

              {step === 2 && (
                <div
                  className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]"
                  data-testid="step-data"
                >
                  <div className="rounded-lg border border-[#d8eadf] bg-white p-5 shadow-sm sm:p-7">
                    <p className="text-sm font-black text-[#007127] uppercase">
                      Paso 3
                    </p>
                    <h1 className="mt-3 text-2xl font-black text-[#006b25] sm:text-3xl">
                      Llena tus datos de contacto
                    </h1>
                    <p className="mt-3 text-base leading-7 text-[#4e575e]">
                      Al continuar, tu cotización queda registrada para
                      seguimiento comercial y exportación a Excel.
                    </p>

                    <div className="mt-8 grid gap-4">
                      <TextInput
                        label="Nombre completo"
                        value={name}
                        onChange={setName}
                        placeholder="Ej. Ana Torres"
                        icon={UserRound}
                        id="quote-name"
                      />
                      <TextInput
                        label="Teléfono"
                        value={phone}
                        onChange={setPhone}
                        placeholder="Ej. 098 137 1278"
                        icon={Phone}
                        id="quote-phone"
                        type="tel"
                        inputMode="tel"
                      />
                      <TextInput
                        label="Correo"
                        value={email}
                        onChange={setEmail}
                        placeholder="correo@dominio.com"
                        type="email"
                        inputMode="email"
                        icon={MessageCircle}
                        id="quote-email"
                      />

                      <label className="grid gap-2 text-sm font-black text-[#08272d]">
                        Ciudad
                        <select
                          id="quote-city"
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                          className="h-12 rounded-lg border border-[#cfe6d6] bg-white px-4 text-base font-bold text-[#08272d] transition outline-none focus:border-[#007127] focus:ring-4 focus:ring-[#007127]/12"
                        >
                          {cities.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>

                      <div
                        role="radiogroup"
                        aria-label="Preferencia de contacto"
                      >
                        <p className="text-sm font-black text-[#08272d]">
                          Preferencia de contacto
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                          {[
                            ["whatsapp", "WhatsApp"],
                            ["llamada", "Llamada"],
                            ["correo", "Correo"],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setPreference(value as ContactPreference)
                              }
                              role="radio"
                              aria-checked={preference === value}
                              className={`rounded-lg border px-4 py-3 text-sm font-black transition ${
                                preference === value
                                  ? "border-[#007127] bg-[#007127] text-white"
                                  : "border-[#cfe6d6] bg-white text-[#006b25] hover:border-[#006b25]/40"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="flex gap-3 rounded-lg border border-[#cfe6d6] bg-[#f8fdf9] p-4 text-sm leading-6 font-bold text-[#4e575e]">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(event) => setConsent(event.target.checked)}
                          className="mt-1 size-4 shrink-0 accent-[#007127]"
                        />
                        <span>
                          Acepto los términos y condiciones y autorizo el uso de
                          mis datos para recibir información sobre mi
                          cotización.
                        </span>
                      </label>
                    </div>
                  </div>

                  <ResultPreview
                    title="Resumen antes de resultado"
                    product={currentProduct.title}
                    amount={calculation.amount}
                    calculation={calculation}
                    term={term}
                  />
                </div>
              )}

              {step === 3 && (
                <div
                  className="grid gap-6 xl:grid-cols-[1fr_0.92fr]"
                  data-testid="step-result"
                >
                  <div className="rounded-lg border border-[#d8eadf] bg-white p-5 shadow-sm sm:p-7">
                    <p className="text-sm font-black text-[#007127] uppercase">
                      Paso 4
                    </p>
                    <h1 className="mt-3 text-2xl font-black text-[#006b25] sm:text-3xl">
                      Resultado para iniciar asesoría
                    </h1>
                    <p className="mt-3 text-base leading-7 text-[#4e575e]">
                      Este resultado no aprueba ni niega una operación. Sirve
                      para decidir qué revisar con un asesor antes de gestionar.
                    </p>

                    <div
                      className={`mt-8 rounded-lg border p-5 ${
                        calculation.statusTone === "healthy"
                          ? "border-[#007127]/30 bg-[#effaf3]"
                          : calculation.statusTone === "tight"
                            ? "border-[#c38b00]/35 bg-[#fff7df]"
                            : "border-[#b42318]/25 bg-[#fff1f0]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-black text-[#006b25] uppercase">
                            Lectura referencial
                          </p>
                          <h2 className="mt-2 text-2xl font-black text-[#08272d]">
                            {calculation.status}
                          </h2>
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4e575e]">
                            {calculation.guidance}
                          </p>
                        </div>
                        <BadgeCheck
                          className="size-10 shrink-0 text-[#007127]"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <MetricCard
                        label="Monto a analizar"
                        value={formatCurrency(calculation.financed)}
                      />
                      <MetricCard
                        label="Cuota estimada"
                        value={formatCurrency(calculation.monthlyPayment)}
                      />
                      <MetricCard
                        label="Capacidad sugerida"
                        value={formatCurrency(calculation.suggestedCapacity)}
                      />
                      <MetricCard
                        label="Entrada sugerida"
                        value={formatCurrency(calculation.suggestedDownPayment)}
                      />
                      <MetricCard
                        label="Tasa usada"
                        value={formatPercent(currentProduct.annualRate)}
                      />
                    </div>

                    <p className="mt-5 rounded-lg border border-[#d8eadf] bg-[#f8fdf9] px-4 py-3 text-sm font-bold text-[#4e575e]">
                      {leadSaveStatus === "saved"
                        ? "Cotización registrada para Excel."
                        : leadSaveStatus === "local"
                          ? "Cotización guardada localmente. En despliegue estático se requiere un backend externo para registro centralizado."
                          : "Cotización preparada para registro comercial."}
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#007127] px-5 py-4 text-sm font-black text-white transition hover:bg-[#006b25]"
                        data-testid="whatsapp-result"
                      >
                        Enviar resumen a WhatsApp
                        <MessageCircle className="size-5" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={copySummary}
                        className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#cfe6d6] bg-white px-5 py-4 text-sm font-black text-[#006b25] transition hover:border-[#007127]/40"
                      >
                        {copied ? "Resumen copiado" : "Copiar resumen"}
                        <ClipboardCheck className="size-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#006b25] bg-[linear-gradient(145deg,#007127_0%,#00541f_56%,#002023_100%)] p-5 text-white sm:p-7">
                    <p className="text-xs font-black text-[#b8f7c5] uppercase">
                      Siguientes pasos
                    </p>
                    <h2 className="mt-3 text-2xl font-black">
                      Qué revisa NEXUS contigo
                    </h2>
                    <div className="mt-6 grid gap-3">
                      {[
                        "Capacidad real después de gastos y compromisos.",
                        "Documentos necesarios para una conversación formal.",
                        "Escenarios de entrada, plazo y cuota más sanos.",
                        "Alternativas posibles según objetivo y perfil.",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex gap-3 rounded-lg bg-white/8 p-4 text-sm leading-6 text-white/84"
                        >
                          <Check
                            className="mt-0.5 size-5 shrink-0 text-[#b8f7c5]"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 text-xs leading-5 text-white/62">
                      La decisión final depende de políticas de entidades,
                      historial, documentación, garantías y condiciones
                      vigentes.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p
                className="mt-5 rounded-lg border border-[#b42318]/20 bg-[#fff1f0] px-4 py-3 text-sm font-bold text-[#b42318]"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={back}
                disabled={!isReady || step === 0}
                aria-disabled={!isReady || step === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#cfe6d6] bg-white px-5 py-3 text-sm font-black text-[#006b25] transition enabled:hover:border-[#007127]/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Anterior
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  disabled={!isReady || leadSaveStatus === "saving"}
                  aria-busy={leadSaveStatus === "saving"}
                  className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#006b25] px-6 py-3 text-sm font-black text-white transition hover:bg-[#007127]"
                  data-testid="quote-next"
                  onClick={() => void next()}
                >
                  {leadSaveStatus === "saving" ? "Registrando..." : "Continuar"}
                  <ArrowRight className="size-5" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#006b25] px-6 py-3 text-sm font-black text-white transition hover:bg-[#007127]"
                  data-testid="quote-reset"
                >
                  Nueva simulación
                  <Calculator className="size-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </section>
  )
}

function NumberRange({
  label,
  value,
  min,
  max,
  step,
  onChange,
  id,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  id: string
}) {
  const safeValue = Math.min(Math.max(value, min), max)
  const [draftValue, setDraftValue] = useState(String(safeValue))

  useEffect(() => {
    if (document.activeElement?.id === id) {
      return
    }

    let isCurrent = true

    queueMicrotask(() => {
      if (isCurrent && document.activeElement?.id !== id) {
        setDraftValue(String(safeValue))
      }
    })

    return () => {
      isCurrent = false
    }
  }, [id, safeValue])

  const commitDraftValue = () => {
    if (!draftValue) {
      setDraftValue(String(safeValue))
      return
    }

    const nextValue = clampNumber(Number(draftValue), min, max)
    onChange(nextValue)
    setDraftValue(String(nextValue))
  }

  return (
    <div className="grid min-w-0 gap-3">
      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,11rem)] sm:items-center">
        <label
          className="min-w-0 text-sm leading-5 font-black text-[#08272d]"
          htmlFor={id}
        >
          {label}
        </label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={draftValue}
          onChange={(event) => {
            const nextDraft = normalizeNumericDraft(event.target.value)
            setDraftValue(nextDraft)

            if (!nextDraft) {
              return
            }

            const parsedValue = Number(nextDraft)

            if (parsedValue >= min && parsedValue <= max) {
              onChange(parsedValue)
            }
          }}
          onBlur={commitDraftValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur()
            }
          }}
          className="h-11 min-w-0 rounded-lg border border-[#cfe6d6] bg-white px-3 text-right text-base font-black text-[#006b25] transition outline-none focus:border-[#007127] focus:ring-4 focus:ring-[#007127]/12"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={(event) =>
          onChange(clampNumber(Number(event.target.value), min, max))
        }
        className="h-2 w-full cursor-pointer accent-[#007127]"
        aria-label={label}
      />
      <div className="flex items-center justify-between text-xs font-bold text-[#4e575e]">
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  )
}

function MoneyInput({
  label,
  value,
  onChange,
  id,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  id: string
}) {
  const [draftValue, setDraftValue] = useState(String(value))

  useEffect(() => {
    if (document.activeElement?.id === id) {
      return
    }

    let isCurrent = true

    queueMicrotask(() => {
      if (isCurrent && document.activeElement?.id !== id) {
        setDraftValue(String(value))
      }
    })

    return () => {
      isCurrent = false
    }
  }, [id, value])

  const commitDraftValue = () => {
    if (!draftValue) {
      onChange(0)
      setDraftValue("0")
      return
    }

    const nextValue = Math.max(Number(draftValue), 0)
    onChange(nextValue)
    setDraftValue(String(nextValue))
  }

  return (
    <label
      className="grid min-w-0 gap-2 text-sm leading-5 font-black text-[#08272d]"
      htmlFor={id}
    >
      {label}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={draftValue}
        onChange={(event) => {
          const nextDraft = normalizeNumericDraft(event.target.value)
          setDraftValue(nextDraft)

          if (nextDraft) {
            onChange(Math.max(Number(nextDraft), 0))
          }
        }}
        onBlur={commitDraftValue}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur()
          }
        }}
        className="h-12 min-w-0 rounded-lg border border-[#cfe6d6] bg-white px-4 text-base font-bold text-[#08272d] transition outline-none focus:border-[#007127] focus:ring-4 focus:ring-[#007127]/12"
      />
    </label>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  id,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: typeof UserRound
  type?: string
  id: string
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search"
}) {
  return (
    <label
      className="grid gap-2 text-sm font-black text-[#08272d]"
      htmlFor={id}
    >
      {label}
      <span className="flex h-12 items-center gap-3 rounded-lg border border-[#cfe6d6] bg-white px-4 transition focus-within:border-[#007127] focus-within:ring-4 focus-within:ring-[#007127]/12">
        <Icon className="size-5 shrink-0 text-[#007127]" aria-hidden="true" />
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-base font-bold text-[#08272d] outline-none placeholder:text-[#7a858d]"
        />
      </span>
    </label>
  )
}

function ResultPreview({
  title,
  product,
  amount,
  calculation,
  term,
}: {
  title: string
  product: string
  amount: number
  calculation: {
    financed: number
    monthlyPayment: number
    suggestedCapacity: number
    status: string
    guidance: string
  }
  term: number
}) {
  return (
    <aside className="rounded-lg bg-[#006b25] bg-[linear-gradient(145deg,#007127_0%,#00541f_56%,#002023_100%)] p-5 text-white shadow-xl shadow-[#006b25]/12 sm:p-7">
      <p className="text-xs font-black text-[#b8f7c5] uppercase">{title}</p>
      <h2 className="mt-3 text-2xl font-black">{calculation.status}</h2>
      <p className="mt-3 text-sm leading-6 text-white/72">
        {calculation.guidance}
      </p>

      <div className="mt-7 grid gap-3">
        <div className="rounded-lg bg-white p-4 text-[#08272d]">
          <p className="text-xs font-black text-[#4e575e] uppercase">
            Objetivo
          </p>
          <p className="mt-1 text-xl font-black">{product}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricDark label="Monto" value={formatCurrency(amount)} />
          <MetricDark label="Plazo" value={`${term} meses`} />
          <MetricDark
            label="A analizar"
            value={formatCurrency(calculation.financed)}
          />
          <MetricDark
            label="Cuota est."
            value={formatCurrency(calculation.monthlyPayment)}
          />
          <MetricDark
            label="Capacidad"
            value={formatCurrency(calculation.suggestedCapacity)}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-white/12 bg-white/8 p-4">
        <p className="text-xs font-black text-[#b8f7c5] uppercase">
          Capacidad sugerida
        </p>
        <p className="mt-2 text-2xl font-black">
          {formatCurrency(calculation.suggestedCapacity)}
        </p>
        <p className="mt-2 text-xs leading-5 text-white/62">
          Basada en ingreso disponible. Un asesor debe validar gastos,
          documentos e historial.
        </p>
      </div>
    </aside>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d8eadf] bg-[#f8fdf9] p-4">
      <p className="text-xs font-black text-[#4e575e] uppercase">{label}</p>
      <p className="mt-2 min-w-0 text-2xl font-black break-words text-[#006b25] tabular-nums">
        {value}
      </p>
    </div>
  )
}

function MetricDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-4">
      <p className="text-xs font-black text-white/58 uppercase">{label}</p>
      <p className="mt-2 min-w-0 text-lg font-black break-words text-white tabular-nums">
        {value}
      </p>
    </div>
  )
}
