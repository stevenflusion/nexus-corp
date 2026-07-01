/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly BUSINESS_EMAIL?: string
  readonly BUSINESS_MAPS_URL?: string
  readonly BUSINESS_NAME?: string
  readonly BUSINESS_PHONE_DISPLAY?: string
  readonly BUSINESS_PHONE_NUMBER?: string
  readonly BUSINESS_WEBSITE?: string
  readonly CHATBOT_BUSINESS_HOURS?: string
  readonly CHATBOT_COMPANY_NAME?: string
  readonly CHATBOT_CONTACT_EMAIL?: string
  readonly CHATBOT_CONTACT_LOCATION?: string
  readonly CHATBOT_CONTACT_WHATSAPP_DISPLAY?: string
  readonly CHATBOT_ALLOWED_ORIGINS?: string
  readonly CHATBOT_MAX_RESPONSE_AGE_HOURS?: string
  readonly HUMAN_AGENT_PHONE?: string
  readonly META_ACCESS_TOKEN?: string
  readonly META_APP_ID?: string
  readonly META_APP_SECRET?: string
  readonly META_VERIFY_TOKEN?: string
  readonly NEXT_PUBLIC_SITE_URL?: string
  readonly NEXT_PUBLIC_WHATSAPP_NUMBER?: string
  readonly QUOTE_LEADS_FILE?: string
  readonly RESEND_API_KEY?: string
  readonly WEBINAR_REGISTRATIONS_FILE?: string
  readonly WEBINAR_REGISTRATION_FROM?: string
  readonly WEBINAR_REGISTRATION_TO?: string
  readonly WEBHOOK_PUBLIC_URL?: string
  readonly WHATSAPP_API_BASE_URL?: string
  readonly WHATSAPP_API_VERSION?: string
  readonly WHATSAPP_APP_SECRET?: string
  readonly WHATSAPP_BUSINESS_ACCOUNT_ID?: string
  readonly WHATSAPP_DEDUP_FILE?: string
  readonly WHATSAPP_LEADS_FILE?: string
  readonly WHATSAPP_PHONE_NUMBER_ID?: string
  readonly WHATSAPP_TOKEN?: string
  readonly WHATSAPP_VERIFY_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
