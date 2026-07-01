import type { ChatIntent } from "./types"

export interface DetectedIntent {
  intent: ChatIntent
  confidence: number
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const includesKeyword = (message: string, keyword: string) => {
  const normalizedKeyword = normalizeText(keyword)

  if (!normalizedKeyword) {
    return false
  }

  if (normalizedKeyword.includes(" ")) {
    return message.includes(normalizedKeyword)
  }

  return new RegExp(`(^| )${escapeRegExp(normalizedKeyword)}( |$)`).test(
    message
  )
}

const includesAny = (message: string, keywords: string[]) =>
  keywords.some((keyword) => includesKeyword(message, keyword))

const isSingleOption = (message: string, option: number) =>
  message === String(option) || message === `opcion ${option}`

export const detectIntent = (rawMessage: string): DetectedIntent => {
  const message = normalizeText(rawMessage)

  if (!message) {
    return {
      intent: "empty",
      confidence: 1,
    }
  }

  if (isSingleOption(message, 1)) {
    return { intent: "housing_credit", confidence: 1 }
  }

  if (isSingleOption(message, 2)) {
    return { intent: "vehicle_credit", confidence: 1 }
  }

  if (isSingleOption(message, 3)) {
    return { intent: "consumer_credit", confidence: 1 }
  }

  if (isSingleOption(message, 4)) {
    return { intent: "documents", confidence: 1 }
  }

  if (isSingleOption(message, 5)) {
    return { intent: "location", confidence: 1 }
  }

  if (isSingleOption(message, 6)) {
    return { intent: "human_agent", confidence: 1 }
  }

  if (
    includesAny(message, [
      "ustedes prestan",
      "dan prestamos",
      "dan credito",
      "otorgan prestamos",
      "prestan dinero",
      "aprueban creditos",
      "entregan dinero",
    ])
  ) {
    return { intent: "direct_loan", confidence: 0.95 }
  }

  if (
    includesAny(message, [
      "asesor",
      "humano",
      "persona",
      "ejecutivo",
      "llamar",
      "llamada",
      "quiero hablar",
    ])
  ) {
    return { intent: "human_agent", confidence: 0.95 }
  }

  if (
    includesAny(message, [
      "vivienda",
      "casa",
      "construccion",
      "hipoteca",
      "departamento",
    ])
  ) {
    return { intent: "housing_credit", confidence: 0.9 }
  }

  if (
    includesAny(message, [
      "vehiculo",
      "vehicular",
      "auto",
      "carro",
      "camioneta",
    ])
  ) {
    return { intent: "vehicle_credit", confidence: 0.9 }
  }

  if (includesAny(message, ["consumo", "personal", "credito personal"])) {
    return { intent: "consumer_credit", confidence: 0.9 }
  }

  if (
    includesAny(message, [
      "documentos",
      "requisitos",
      "que necesito",
      "cedula",
      "rol de pagos",
    ])
  ) {
    return { intent: "documents", confidence: 0.9 }
  }

  if (
    includesAny(message, [
      "ubicados",
      "ubicacion",
      "direccion",
      "donde estan",
      "maps",
      "google maps",
    ])
  ) {
    return { intent: "location", confidence: 0.9 }
  }

  if (includesAny(message, ["horario", "atienden", "abren", "cierran"])) {
    return { intent: "schedule", confidence: 0.9 }
  }

  if (
    includesAny(message, [
      "precio",
      "planes",
      "costo",
      "cuanto cobran",
      "tarifa",
      "valor",
    ])
  ) {
    return { intent: "pricing", confidence: 0.85 }
  }

  if (
    includesAny(message, [
      "tiempo",
      "demora",
      "cuanto toma",
      "cuanto tardan",
      "rapido",
    ])
  ) {
    return { intent: "timing", confidence: 0.85 }
  }

  if (
    includesAny(message, [
      "contacto",
      "telefono",
      "whatsapp",
      "correo",
      "email",
      "solicitar informacion",
    ])
  ) {
    return { intent: "contact", confidence: 0.85 }
  }

  if (
    includesAny(message, [
      "servicios",
      "que hacen",
      "que ofrecen",
      "asesoria financiera",
      "en que ayudan",
    ])
  ) {
    return { intent: "services", confidence: 0.85 }
  }

  if (
    includesAny(message, [
      "hola",
      "buenas",
      "buenos dias",
      "buenas tardes",
      "buenas noches",
      "saludos",
    ])
  ) {
    return { intent: "greeting", confidence: 0.9 }
  }

  if (includesAny(message, ["gracias", "listo", "perfecto", "ok gracias"])) {
    return { intent: "thanks", confidence: 0.8 }
  }

  return {
    intent: "fallback",
    confidence: 0,
  }
}

export const normalizeIntentText = normalizeText
