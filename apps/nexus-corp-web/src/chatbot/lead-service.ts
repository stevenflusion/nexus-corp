import { mkdir, appendFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

import { readEnv } from "./runtime-env"
import type { ChatbotResponse } from "./types"
import type {
  WhatsAppInboundMessage,
  WhatsAppLeadRecord,
} from "./whatsapp.types"

const DEFAULT_LEADS_FILE = "storage/whatsapp-leads.jsonl"

const getLeadId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

const getLeadsFilePath = () =>
  resolve(readEnv("WHATSAPP_LEADS_FILE", DEFAULT_LEADS_FILE))

const getLeadStatus = (
  response: ChatbotResponse
): WhatsAppLeadRecord["status"] => {
  if (response.intent === "human_agent") {
    return "derivado"
  }

  if (response.handoffRecommended) {
    return "nuevo"
  }

  return "respondido"
}

export const buildWhatsAppLeadRecord = (
  message: WhatsAppInboundMessage,
  response: ChatbotResponse
): WhatsAppLeadRecord => ({
  id: getLeadId(),
  phone: message.from,
  profileName: message.profileName,
  lastMessage: message.body,
  intent: response.intent,
  receivedAt: new Date(message.timestamp * 1000).toISOString(),
  status: getLeadStatus(response),
  requestedHumanAgent: response.intent === "human_agent",
  source: "WhatsApp",
  channel: "whatsapp",
  messageId: message.id,
})

export const saveWhatsAppLead = async (record: WhatsAppLeadRecord) => {
  const filePath = getLeadsFilePath()

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8")
  } catch {
    console.warn("Could not persist WhatsApp lead", {
      source: record.source,
      status: record.status,
    })
  }
}
