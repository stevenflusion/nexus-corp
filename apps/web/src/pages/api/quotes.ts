import { access, appendFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"

import type { APIRoute } from "astro"

type ProductId = "vehiculo" | "vivienda" | "consumo"

const DEFAULT_QUOTES_FILE = "storage/nexus-quote-leads.csv"
const MAX_BODY_LENGTH = 12_000

const headers = [
  "Fecha",
  "Tipo de cotizacion",
  "Nombre",
  "Correo",
  "Telefono",
  "Ciudad",
  "Monto solicitado",
  "Entrada",
  "Monto a analizar",
  "Plazo",
  "Producto",
  "Tasa mostrada",
  "Tasa anual",
  "Resultado o cuota calculada",
  "Aceptacion de terminos",
  "Preferencia de contacto",
  "Estado del lead",
]

const productIds = new Set<ProductId>(["vehiculo", "vivienda", "consumo"])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const readString = (value: unknown, maxLength = 180) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const readNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : Number.NaN

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const csvSafe = (value: string | number | boolean) => {
  const raw = String(value)
  const neutralized = /^[=+\-@]/.test(raw) ? `'${raw}` : raw

  return `"${neutralized.replace(/"/g, '""')}"`
}

const getQuotesFilePath = () =>
  resolve(process.env.QUOTE_LEADS_FILE || DEFAULT_QUOTES_FILE)

const appendCsvRow = async (row: Array<string | number | boolean>) => {
  const filePath = getQuotesFilePath()

  await mkdir(dirname(filePath), { recursive: true })

  let shouldWriteHeader = false

  try {
    await access(filePath)
  } catch {
    shouldWriteHeader = true
  }

  const lines = [
    ...(shouldWriteHeader ? [headers.map(csvSafe).join(",")] : []),
    row.map(csvSafe).join(","),
  ]

  await appendFile(filePath, `${lines.join("\n")}\n`, "utf8")
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("content-type")?.includes("application/json") !== true) {
    return Response.json({ error: "Content-Type no permitido." }, { status: 415 })
  }

  const rawBody = await request.text()

  if (rawBody.length > MAX_BODY_LENGTH) {
    return Response.json({ error: "La solicitud es demasiado grande." }, { status: 413 })
  }

  let payload: unknown

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 })
  }

  if (!isRecord(payload)) {
    return Response.json({ error: "La cotización es obligatoria." }, { status: 400 })
  }

  const product = readString(payload.product) as ProductId
  const name = readString(payload.name)
  const email = readString(payload.email)
  const phone = readString(payload.phone)
  const city = readString(payload.city)
  const quoteType = readString(payload.quoteType)
  const rateShown = readString(payload.rateShown, 300)
  const contactPreference = readString(payload.contactPreference, 40)
  const leadStatus = readString(payload.leadStatus, 40) || "nuevo"
  const amount = readNumber(payload.amount)
  const downPayment = readNumber(payload.downPayment)
  const financedAmount = readNumber(payload.financedAmount)
  const termMonths = readNumber(payload.termMonths)
  const annualRate = readNumber(payload.annualRate)
  const monthlyPayment = readNumber(payload.monthlyPayment)
  const resultStatus = readString(payload.resultStatus)
  const acceptedTerms = payload.acceptedTerms === true

  if (
    !productIds.has(product) ||
    !name ||
    !phone ||
    !city ||
    !email ||
    !isValidEmail(email) ||
    !acceptedTerms ||
    [amount, downPayment, financedAmount, termMonths, annualRate, monthlyPayment].some(
      (value) => !Number.isFinite(value) || value < 0
    )
  ) {
    return Response.json(
      { error: "Por favor completa los campos obligatorios." },
      { status: 400 }
    )
  }

  await appendCsvRow([
    new Date().toISOString(),
    quoteType,
    name,
    email,
    phone,
    city,
    amount.toFixed(2),
    downPayment.toFixed(2),
    financedAmount.toFixed(2),
    termMonths,
    product,
    rateShown,
    `${(annualRate * 100).toFixed(2)}%`,
    resultStatus
      ? `${resultStatus} | Cuota estimada: ${monthlyPayment.toFixed(2)}`
      : monthlyPayment.toFixed(2),
    acceptedTerms ? "Si" : "No",
    contactPreference,
    leadStatus,
  ])

  return Response.json({ ok: true }, { status: 201 })
}

export const GET: APIRoute = async () =>
  Response.json({ error: "Método no permitido." }, { status: 405 })
