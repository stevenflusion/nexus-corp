import type { APIRoute } from "astro"
import {
  MAX_CHAT_MESSAGE_LENGTH,
  processChatbotMessage,
  sanitizeChatMessage,
} from "@/chatbot/engine"
import { checkRateLimit } from "@/chatbot/rate-limit"
import {
  isAllowedOrigin,
  isBodyTooLarge,
  isRawBodyTooLarge,
  isJsonRequest,
} from "@/chatbot/security"

export const prerender = false

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })

const getClientKey = (request: Request, clientAddress?: string) => {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]
  return forwardedFor?.trim() || clientAddress || "anonymous"
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isAllowedOrigin(request)) {
    return jsonResponse({ error: "Origen no permitido." }, 403)
  }

  if (!isJsonRequest(request)) {
    return jsonResponse({ error: "Content-Type no permitido." }, 415)
  }

  if (isBodyTooLarge(request)) {
    return jsonResponse({ error: "La solicitud es demasiado grande." }, 413)
  }

  const rateLimit = checkRateLimit(
    `web:${getClientKey(request, clientAddress)}`,
    {
      maxRequests: 24,
      windowMs: 60_000,
    }
  )

  if (rateLimit.limited) {
    return jsonResponse(
      {
        error:
          "Hemos recibido demasiados mensajes seguidos. Intenta nuevamente en un momento.",
      },
      429
    )
  }

  let payload: unknown

  try {
    const rawBody = await request.text()

    if (isRawBodyTooLarge(rawBody)) {
      return jsonResponse({ error: "La solicitud es demasiado grande." }, 413)
    }

    payload = JSON.parse(rawBody)
  } catch {
    return jsonResponse(
      { error: "El cuerpo de la solicitud no es JSON valido." },
      400
    )
  }

  if (!isRecord(payload) || typeof payload.message !== "string") {
    return jsonResponse({ error: "El mensaje es obligatorio." }, 400)
  }

  const message = sanitizeChatMessage(payload.message)

  if (!message) {
    return jsonResponse({ error: "El mensaje no puede estar vacio." }, 400)
  }

  if (payload.message.length > MAX_CHAT_MESSAGE_LENGTH) {
    return jsonResponse(
      {
        error: `El mensaje no puede superar ${MAX_CHAT_MESSAGE_LENGTH} caracteres.`,
      },
      413
    )
  }

  try {
    const response = processChatbotMessage({
      message,
      channel: "web",
      conversationId: `web:${getClientKey(request, clientAddress)}`,
      metadata: {
        userAgent: request.headers.get("user-agent")?.slice(0, 120) ?? "",
      },
    })

    return jsonResponse({
      id: response.id,
      reply: response.message,
      intent: response.intent,
      confidence: response.confidence,
      handoffRecommended: response.handoffRecommended,
      suggestions: response.suggestions,
    })
  } catch {
    return jsonResponse(
      {
        error:
          "No pudimos procesar el mensaje en este momento. Intenta nuevamente o contacta a un asesor.",
      },
      500
    )
  }
}

export const GET: APIRoute = async () =>
  jsonResponse({ error: "Metodo no permitido." }, 405)

export const ALL: APIRoute = async () =>
  jsonResponse({ error: "Metodo no permitido." }, 405)
