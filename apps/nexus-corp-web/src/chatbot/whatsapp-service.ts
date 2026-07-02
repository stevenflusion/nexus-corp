import { getWhatsAppApiConfig, validateWhatsAppApiConfig } from "./config"
import { sanitizeChatMessage } from "./engine"
import type { WhatsAppInboundMessage } from "./whatsapp.types"

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000
const WHATSAPP_TEXT_MESSAGE_LIMIT = 3500
const WHATSAPP_SEND_TIMEOUT_MS = 10_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : []

const asString = (value: unknown) => (typeof value === "string" ? value : "")

const isValidWhatsAppPhone = (value: string) => /^\d{8,15}$/.test(value)

const parseWhatsAppTimestamp = (value: unknown) => {
  const timestamp = Number(value)

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return 0
  }

  return timestamp
}

const extractContactName = (contacts: unknown[], from: string) => {
  for (const contact of contacts) {
    if (!isRecord(contact) || asString(contact.wa_id) !== from) {
      continue
    }

    const profile = isRecord(contact.profile) ? contact.profile : undefined
    const name = sanitizeChatMessage(asString(profile?.name))

    return name || undefined
  }

  return undefined
}

export const extractWhatsAppTextMessages = (
  payload: unknown
): WhatsAppInboundMessage[] => {
  if (!isRecord(payload)) {
    return []
  }

  const messages: WhatsAppInboundMessage[] = []

  for (const entry of asArray(payload.entry)) {
    if (!isRecord(entry)) {
      continue
    }

    for (const change of asArray(entry.changes)) {
      if (!isRecord(change) || !isRecord(change.value)) {
        continue
      }

      const contacts = asArray(change.value.contacts)

      for (const message of asArray(change.value.messages)) {
        if (!isRecord(message) || message.type !== "text") {
          continue
        }

        const text = isRecord(message.text) ? message.text : undefined
        const body = sanitizeChatMessage(asString(text?.body))
        const from = asString(message.from)
        const id = asString(message.id).slice(0, 160)
        const timestamp = parseWhatsAppTimestamp(message.timestamp)

        if (
          !isValidWhatsAppPhone(from) ||
          !body ||
          !id ||
          !timestamp
        ) {
          continue
        }

        messages.push({
          from,
          body,
          id,
          timestamp,
          profileName: extractContactName(contacts, from),
        })
      }
    }
  }

  return messages
}

export const isWithinWhatsAppResponseWindow = (
  message: WhatsAppInboundMessage,
  now = Date.now()
) => {
  const { maxResponseAgeHours } = getWhatsAppApiConfig()
  const safeMaxHours =
    Number.isFinite(maxResponseAgeHours) && maxResponseAgeHours > 0
      ? Math.min(maxResponseAgeHours, 24)
      : 24
  const timestampMs = message.timestamp * 1000
  const ageMs = now - timestampMs

  return ageMs >= -MAX_CLOCK_SKEW_MS && ageMs <= safeMaxHours * 60 * 60 * 1000
}

export const splitWhatsAppTextMessage = (
  message: string,
  maxLength = WHATSAPP_TEXT_MESSAGE_LIMIT
) => {
  const normalizedMessage = message.replace(/\r\n/g, "\n").trim()

  if (!normalizedMessage) {
    return []
  }

  if (normalizedMessage.length <= maxLength) {
    return [normalizedMessage]
  }

  const chunks: string[] = []
  let remainingMessage = normalizedMessage

  while (remainingMessage.length > maxLength) {
    const paragraphBreak = remainingMessage.lastIndexOf("\n\n", maxLength)
    const lineBreak = remainingMessage.lastIndexOf("\n", maxLength)
    const wordBreak = remainingMessage.lastIndexOf(" ", maxLength)
    const fallbackBreak = maxLength
    const minimumUsefulBreak = Math.floor(maxLength * 0.55)
    const cutIndex =
      paragraphBreak >= minimumUsefulBreak
        ? paragraphBreak
        : lineBreak >= minimumUsefulBreak
          ? lineBreak
          : wordBreak >= minimumUsefulBreak
            ? wordBreak
            : fallbackBreak
    const chunk = remainingMessage.slice(0, cutIndex).trim()

    if (chunk) {
      chunks.push(chunk)
    }

    remainingMessage = remainingMessage.slice(cutIndex).trim()
  }

  if (remainingMessage) {
    chunks.push(remainingMessage)
  }

  return chunks
}

const sendSingleWhatsAppTextMessage = async (
  to: string,
  message: string,
  config: ReturnType<typeof getWhatsAppApiConfig>
) => {
  const url = `${config.apiBaseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WHATSAPP_SEND_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    })

    if (!response.ok) {
      console.warn("Error HTTP de Meta", {
        status: response.status,
      })
    }

    return {
      ok: response.ok,
      status: response.status,
      reason: response.ok ? "sent" : "provider_error",
    }
  } catch {
    console.warn("Error HTTP de Meta", {
      status: 0,
    })

    return {
      ok: false,
      status: 0,
      reason: "network_error",
    }
  } finally {
    clearTimeout(timeout)
  }
}

export const sendWhatsAppTextMessage = async (to: string, message: string) => {
  const { config, ok } = validateWhatsAppApiConfig("send_message")
  const chunks = splitWhatsAppTextMessage(message)

  if (!ok || !isValidWhatsAppPhone(to) || chunks.length === 0) {
    return {
      ok: false,
      status: 0,
      reason: "missing_config",
      messagesSent: 0,
    }
  }

  let lastStatus = 0
  let messagesSent = 0

  for (const chunk of chunks) {
    const result = await sendSingleWhatsAppTextMessage(to, chunk, config)
    lastStatus = result.status

    if (!result.ok) {
      return {
        ...result,
        messagesSent,
      }
    }

    messagesSent += 1
  }

  return {
    ok: true,
    status: lastStatus,
    reason: "sent",
    messagesSent,
  }
}
