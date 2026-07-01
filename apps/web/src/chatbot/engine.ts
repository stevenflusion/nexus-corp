import { getBusinessProfile } from "./business-profile"
import { isBusinessOpen } from "./business-hours"
import { detectIntent, normalizeIntentText } from "./intent-detector"
import {
  buildHumanHandoffMessage,
  buildIntentResponse,
  buildOutOfHoursNote,
} from "./responses"
import type {
  ChatChannel,
  ChatContext,
  ChatIntent,
  ChatbotResponse,
} from "./types"

export const MAX_CHAT_MESSAGE_LENGTH = 700

export const sanitizeChatMessage = (message: string) =>
  message.replace(/\s+/g, " ").trim().slice(0, MAX_CHAT_MESSAGE_LENGTH)

export const normalizeChatText = normalizeIntentText

const getResponseId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

const getSuggestions = (intent: ChatIntent) => {
  switch (intent) {
    case "greeting":
    case "fallback":
    case "empty":
      return [
        "Créditos de vivienda",
        "Requisitos o documentos",
        "Hablar con un asesor",
      ]
    case "location":
    case "schedule":
      return ["Qué servicios ofrecen", "Hablar con un asesor"]
    case "human_agent":
      return ["Qué documentos necesito", "Horario de atención"]
    default:
      return ["Hablar con un asesor", "Requisitos o documentos"]
  }
}

const shouldRecommendHandoff = (intent: ChatIntent) =>
  intent === "human_agent" || intent === "fallback"

export const processChatMessage = (
  rawMessage: string,
  context: ChatContext = {}
): ChatbotResponse => {
  const message = sanitizeChatMessage(rawMessage)
  const profile = getBusinessProfile()
  const detected = detectIntent(message)
  const open = isBusinessOpen(context.now ?? new Date())
  const matchedEntryId =
    detected.intent === "fallback" || detected.intent === "empty"
      ? undefined
      : `intent:${detected.intent}`

  let responseMessage = buildIntentResponse(detected.intent, profile)

  if (!open && detected.intent === "human_agent") {
    responseMessage = `${buildHumanHandoffMessage(profile)}\n\n${buildOutOfHoursNote()}`
  } else if (!open && detected.intent !== "empty") {
    responseMessage = `${responseMessage}\n\n${buildOutOfHoursNote()}`
  }

  return {
    id: getResponseId(),
    message: responseMessage,
    intent: detected.intent,
    confidence: detected.confidence,
    handoffRecommended: shouldRecommendHandoff(detected.intent),
    matchedEntryId,
    suggestions: getSuggestions(detected.intent),
  }
}

export interface ProcessChatbotMessageInput {
  message: string
  conversationId?: string
  channel?: ChatChannel
  userName?: string
  now?: Date
  metadata?: ChatContext["metadata"]
}

export const processChatbotMessage = ({
  message,
  conversationId,
  channel = "web",
  userName,
  now,
  metadata,
}: ProcessChatbotMessageInput): ChatbotResponse =>
  processChatMessage(message, {
    channel,
    sessionId: conversationId,
    now,
    metadata: {
      ...metadata,
      userName: userName ?? null,
    },
  })
