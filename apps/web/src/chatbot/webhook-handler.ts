import { validateWhatsAppApiConfig } from "./config"
import { filterUnprocessedWhatsAppMessages } from "./dedupe-service"
import { processChatbotMessage } from "./engine"
import { buildWhatsAppLeadRecord, saveWhatsAppLead } from "./lead-service"
import { checkRateLimit } from "./rate-limit"
import {
  isBodyTooLarge,
  isJsonRequest,
  isRawBodyTooLarge,
  verifyWhatsAppSignature,
} from "./security"
import {
  extractWhatsAppTextMessages,
  isWithinWhatsAppResponseWindow,
  sendWhatsAppTextMessage,
} from "./whatsapp-service"
import type { WhatsAppInboundMessage } from "./whatsapp.types"

const textResponse = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })

const logWebhookProcessingError = () => {
  console.warn("WhatsApp webhook processing failed")
}

const maskPhone = (phone: string) =>
  `${"*".repeat(Math.max(phone.length - 4, 0))}${phone.slice(-4)}`

const processInboundMessages = async (messages: WhatsAppInboundMessage[]) => {
  for (const inboundMessage of messages) {
    if (!isWithinWhatsAppResponseWindow(inboundMessage)) {
      continue
    }

    const rateLimit = checkRateLimit(`whatsapp:${inboundMessage.from}`, {
      maxRequests: 18,
      windowMs: 60_000,
    })

    console.info("Mensaje de WhatsApp recibido", {
      from: maskPhone(inboundMessage.from),
    })

    const chatbotResponse = processChatbotMessage({
      message: inboundMessage.body,
      channel: "whatsapp",
      conversationId: inboundMessage.from,
      userName: inboundMessage.profileName,
      metadata: {
        messageId: inboundMessage.id,
      },
    })

    await saveWhatsAppLead(
      buildWhatsAppLeadRecord(inboundMessage, chatbotResponse)
    )

    const reply = rateLimit.limited
      ? "Hemos recibido varios mensajes seguidos. Para ayudarte mejor, por favor intenta nuevamente en un momento."
      : chatbotResponse.message

    const sendResult = await sendWhatsAppTextMessage(inboundMessage.from, reply)

    if (sendResult.ok) {
      console.info("Respuesta enviada correctamente", {
        to: maskPhone(inboundMessage.from),
        messagesSent: sendResult.messagesSent,
      })
    }
  }
}

export const handleWhatsAppWebhookGet = (request: Request) => {
  const { config, missing, ok } = validateWhatsAppApiConfig("verify_webhook")
  const url = new URL(request.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (!ok) {
    return textResponse(
      `Missing WhatsApp configuration: ${missing.join(", ")}`,
      500
    )
  }

  if (mode === "subscribe" && token === config.verifyToken && challenge) {
    console.info("Webhook verificado correctamente")
    return textResponse(challenge)
  }

  return textResponse("Forbidden", 403)
}

export const handleWhatsAppWebhookPost = async (request: Request) => {
  if (!isJsonRequest(request)) {
    return textResponse("Unsupported Media Type", 415)
  }

  if (isBodyTooLarge(request)) {
    return textResponse("Payload Too Large", 413)
  }

  let rawBody = ""
  let payload: unknown

  try {
    rawBody = await request.text()

    if (isRawBodyTooLarge(rawBody)) {
      return textResponse("Payload Too Large", 413)
    }

    const configCheck = validateWhatsAppApiConfig("verify_signature")

    if (!configCheck.ok) {
      return textResponse(
        `Missing WhatsApp configuration: ${configCheck.missing.join(", ")}`,
        500
      )
    }

    const signature = verifyWhatsAppSignature(request, rawBody)

    if (!signature.valid) {
      return textResponse("Forbidden", 403)
    }

    payload = JSON.parse(rawBody)
  } catch {
    return textResponse("Invalid JSON", 400)
  }

  const messages = extractWhatsAppTextMessages(payload)

  if (messages.length > 0) {
    try {
      const unprocessedMessages = await filterUnprocessedWhatsAppMessages(
        messages
      )

      for (const duplicateMessage of messages.filter(
        (message) =>
          !unprocessedMessages.some(
            (unprocessedMessage) => unprocessedMessage.id === message.id
          )
      )) {
        console.info("Mensaje duplicado ignorado", {
          from: maskPhone(duplicateMessage.from),
        })
      }

      if (unprocessedMessages.length > 0) {
        void processInboundMessages(unprocessedMessages).catch(
          logWebhookProcessingError
        )
      }
    } catch {
      logWebhookProcessingError()
    }
  }

  return textResponse("EVENT_RECEIVED")
}

export const handleMethodNotAllowed = () =>
  textResponse("Method Not Allowed", 405)
