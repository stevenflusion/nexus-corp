import type { ChatIntent } from "./types"

export interface WhatsAppInboundMessage {
  from: string
  id: string
  body: string
  timestamp: number
  profileName?: string
}

export interface WhatsAppLeadRecord {
  id: string
  phone: string
  profileName?: string
  lastMessage: string
  intent: ChatIntent
  receivedAt: string
  status: "nuevo" | "respondido" | "derivado"
  requestedHumanAgent: boolean
  source: "WhatsApp"
  channel: "whatsapp"
  messageId?: string
}
