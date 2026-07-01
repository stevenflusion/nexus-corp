export type ChatChannel = "web" | "whatsapp"

export type ChatIntent =
  | "greeting"
  | "services"
  | "housing_credit"
  | "vehicle_credit"
  | "consumer_credit"
  | "schedule"
  | "location"
  | "contact"
  | "pricing"
  | "documents"
  | "timing"
  | "human_agent"
  | "direct_loan"
  | "thanks"
  | "fallback"
  | "empty"

export interface ChatContext {
  channel?: ChatChannel
  sessionId?: string
  now?: Date
  metadata?: Record<string, string | number | boolean | null>
}

export interface ChatbotResponse {
  id: string
  message: string
  intent: ChatIntent
  confidence: number
  handoffRecommended: boolean
  matchedEntryId?: string
  suggestions: string[]
}

export interface ChatbotWidgetConfig {
  companyName: string
  assistantName: string
  apiEndpoint: string
  welcomeMessage: string
  whatsappNumber?: string
  whatsappPrompt: string
  suggestions: string[]
}
