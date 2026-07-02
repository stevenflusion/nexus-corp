import { access, appendFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"

import type { APIRoute } from "astro"

const DEFAULT_REGISTRATIONS_FILE = "storage/nexus-webinar-registrations.csv"
const DEFAULT_REGISTRATION_TO = "info@nexuscorpec.com"
const MAX_BODY_LENGTH = 8_000

const headers = [
  "Fecha",
  "Nombre",
  "Correo",
  "Telefono",
  "Objetivo",
  "Comentario",
  "Aceptacion de terminos",
  "Correo enviado",
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const readString = (value: unknown, maxLength = 280) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const isValidPhone = (value: string) => {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 9 && digits.length <= 13
}

const csvSafe = (value: string | boolean) => {
  const raw = String(value)
  const neutralized = /^[=+\-@]/.test(raw) ? `'${raw}` : raw

  return `"${neutralized.replace(/"/g, '""')}"`
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const getRegistrationsFilePath = () =>
  resolve(process.env.WEBINAR_REGISTRATIONS_FILE || DEFAULT_REGISTRATIONS_FILE)

const appendCsvRow = async (row: Array<string | boolean>) => {
  const filePath = getRegistrationsFilePath()

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

const sendRegistrationEmail = async ({
  name,
  email,
  phone,
  interest,
  message,
}: {
  name: string
  email: string
  phone: string
  interest: string
  message: string
}) => {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return false
  }

  const to = process.env.WEBINAR_REGISTRATION_TO || DEFAULT_REGISTRATION_TO
  const from =
    process.env.WEBINAR_REGISTRATION_FROM ||
    "NEXUS Webinar <onboarding@resend.dev>"

  const plainText = [
    "Nuevo registro al webinar NEXUS",
    "",
    `Nombre: ${name}`,
    `Correo: ${email}`,
    `Telefono: ${phone}`,
    `Objetivo: ${interest}`,
    `Comentario: ${message || "Sin comentario adicional."}`,
  ].join("\n")

  const html = `
    <div style="font-family: Arial, sans-serif; color: #001f3d; line-height: 1.5;">
      <h2 style="margin: 0 0 16px;">Nuevo registro al webinar NEXUS</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
      <p><strong>Telefono:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Objetivo:</strong> ${escapeHtml(interest)}</p>
      <p><strong>Comentario:</strong><br />${escapeHtml(message || "Sin comentario adicional.")}</p>
    </div>
  `

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `Nuevo registro al webinar: ${name}`,
      text: plainText,
      html,
    }),
  })

  return response.ok
}

export const POST: APIRoute = async ({ request }) => {
  if (
    request.headers.get("content-type")?.includes("application/json") !== true
  ) {
    return Response.json(
      { error: "Content-Type no permitido." },
      { status: 415 }
    )
  }

  const rawBody = await request.text()

  if (rawBody.length > MAX_BODY_LENGTH) {
    return Response.json(
      { error: "La solicitud es demasiado grande." },
      { status: 413 }
    )
  }

  let payload: unknown

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: "JSON invalido." }, { status: 400 })
  }

  if (!isRecord(payload)) {
    return Response.json(
      { error: "El registro es obligatorio." },
      { status: 400 }
    )
  }

  const name = readString(payload.name)
  const email = readString(payload.email)
  const phone = readString(payload.phone)
  const interest = readString(payload.interest, 120)
  const message = readString(payload.message, 800)
  const acceptedTerms = payload.acceptedTerms === true

  if (
    !name ||
    !email ||
    !isValidEmail(email) ||
    !phone ||
    !isValidPhone(phone) ||
    !interest ||
    !acceptedTerms
  ) {
    return Response.json(
      { error: "Por favor completa los campos obligatorios." },
      { status: 400 }
    )
  }

  let emailSent = false

  try {
    emailSent = await sendRegistrationEmail({
      name,
      email,
      phone,
      interest,
      message,
    })
  } catch {
    emailSent = false
  }

  await appendCsvRow([
    new Date().toISOString(),
    name,
    email,
    phone,
    interest,
    message || "Sin comentario adicional.",
    acceptedTerms ? "Si" : "No",
    emailSent ? "Si" : "No",
  ])

  return Response.json(
    { ok: true, emailSent },
    { status: emailSent ? 201 : 202 }
  )
}

export const GET: APIRoute = async () =>
  Response.json({ error: "Metodo no permitido." }, { status: 405 })
