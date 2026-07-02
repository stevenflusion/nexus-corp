import { getBusinessProfile } from "./business-profile"
import { defaultChatbotSuggestions } from "./knowledge-base"
import { normalizePhoneNumber, readEnv, readFirstEnv } from "./runtime-env"
import type { ChatbotWidgetConfig } from "./types"

export const getChatbotWidgetConfig = (): ChatbotWidgetConfig => {
  const profile = getBusinessProfile()
  const isStaticBuild =
    readFirstEnv(["BUILD_TARGET", "ASTRO_OUTPUT"]) === "static"
  const whatsappNumber = normalizePhoneNumber(
    readEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", profile.contact.whatsappNumber)
  )

  return {
    companyName: profile.companyName,
    assistantName: `Asistente ${profile.companyName}`,
    apiEndpoint: readEnv(
      "PUBLIC_CHATBOT_API_ENDPOINT",
      isStaticBuild ? "" : "/api/chatbot/message"
    ),
    welcomeMessage: `Hola, gracias por comunicarte con ${profile.companyName}.\nTe ayudamos con asesoría financiera para vivienda, construcción, vehículos y consumo.\n\n¿En qué podemos ayudarte hoy?\n\n1. Asesoría para vivienda\n2. Asesoría vehicular\n3. Asesoría para crédito de consumo\n4. Requisitos o documentos\n5. Ubicación y horarios\n6. Hablar con un asesor`,
    whatsappNumber: whatsappNumber || undefined,
    whatsappPrompt: `Hola ${profile.companyName}, quiero continuar mi consulta con un asesor por WhatsApp.`,
    suggestions: defaultChatbotSuggestions,
  }
}

export const getSiteUrl = () =>
  readFirstEnv(
    ["NEXT_PUBLIC_SITE_URL", "BUSINESS_WEBSITE"],
    "http://localhost:4321"
  )

export const getWhatsAppApiConfig = () => ({
  token: readFirstEnv(["META_ACCESS_TOKEN", "WHATSAPP_TOKEN"]),
  phoneNumberId: readEnv("WHATSAPP_PHONE_NUMBER_ID"),
  verifyToken: readFirstEnv(["META_VERIFY_TOKEN", "WHATSAPP_VERIFY_TOKEN"]),
  appId: readEnv("META_APP_ID"),
  appSecret: readFirstEnv(["META_APP_SECRET", "WHATSAPP_APP_SECRET"]),
  businessAccountId: readEnv("WHATSAPP_BUSINESS_ACCOUNT_ID"),
  apiVersion: readEnv("WHATSAPP_API_VERSION", "v25.0"),
  apiBaseUrl: readEnv("WHATSAPP_API_BASE_URL", "https://graph.facebook.com"),
  maxResponseAgeHours: Number(readEnv("CHATBOT_MAX_RESPONSE_AGE_HOURS", "24")),
  allowedOrigins: readEnv("CHATBOT_ALLOWED_ORIGINS"),
  webhookPublicUrl: readEnv("WEBHOOK_PUBLIC_URL"),
  humanAgentPhone: readEnv(
    "HUMAN_AGENT_PHONE",
    getBusinessProfile().contact.whatsappDisplay
  ),
})

type WhatsAppConfigUse = "verify_webhook" | "verify_signature" | "send_message"

const requiredWhatsAppEnvByUse: Record<WhatsAppConfigUse, string[]> = {
  verify_webhook: ["META_VERIFY_TOKEN"],
  verify_signature: ["META_APP_SECRET"],
  send_message: ["META_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
}

export const validateWhatsAppApiConfig = (use: WhatsAppConfigUse) => {
  const config = getWhatsAppApiConfig()
  const valuesByName = new Map<string, string>([
    ["META_VERIFY_TOKEN", config.verifyToken],
    ["META_APP_SECRET", config.appSecret],
    ["META_ACCESS_TOKEN", config.token],
    ["WHATSAPP_PHONE_NUMBER_ID", config.phoneNumberId],
  ])
  const missing = requiredWhatsAppEnvByUse[use].filter(
    (envName) => !valuesByName.get(envName)?.trim()
  )

  return {
    config,
    missing,
    ok: missing.length === 0,
  }
}
