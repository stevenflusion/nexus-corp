// Domain types for the MagicLinks admin feature.

export type MagicLinkStatus = "active" | "expired" | "used" | "revoked"

export type MagicLinkRole = "admin" | "sistemas" | "gerente_general" | "gerencia_marketing"

export type DeliveryChannel = "generate_only" | "send_email" | "generate_qr"

export type ExpirationType = "relative" | "absolute"

export type UsageLimitType = "single" | "unlimited" | "specific"

export interface ActivityLogEntry {
  id: string
  timestamp: string // ISO
  result: "success" | "failed_expired" | "failed_used" | "failed_revoked"
  ip: string
  device: string
}

export interface MagicLink {
  id: string
  status: MagicLinkStatus
  // Destinatario
  recipientName: string
  recipientEmail: string | null
  recipientPhone: string | null
  internalNote: string | null
  // Acceso
  role: MagicLinkRole
  scope: string // brand name, shop name, etc.
  scopeId: string
  destinationScreen: string // post-login redirect route
  // Vigencia
  expirationType: ExpirationType
  expirationDate: string | null // ISO, null = sin expiración
  deferredActivation: string | null // ISO date, null = inmediata
  usageLimitType: UsageLimitType
  usageLimit: number | null // null = unlimited, 1 = single, N = specific
  usageCount: number // current uses
  // Entrega
  deliveryChannel: DeliveryChannel
  // Metadata
  url: string // the generated magic link URL
  createdBy: string // admin name
  createdAt: string // ISO
  updatedAt: string // ISO
  // Activity
  activity: ActivityLogEntry[]
}

export interface CreateMagicLinkInput {
  recipientName: string
  recipientEmail: string | null
  recipientPhone: string | null
  internalNote: string | null
  role: MagicLinkRole
  scope: string
  scopeId: string
  destinationScreen: string
  expirationType: ExpirationType
  expirationDate: string | null
  deferredActivation: string | null
  usageLimitType: UsageLimitType
  usageLimit: number | null
  deliveryChannel: DeliveryChannel
}

export interface MagicLinkFilters {
  search: string
  status: MagicLinkStatus | "all"
  role: MagicLinkRole | "all"
  dateFrom: string | null
  dateTo: string | null
}

// ─── Lead domain types ───────────────────────────────────────────

export type LeadStatus = "new" | "contacted" | "qualified" | "lost"

export type LeadSource = "web" | "manual" | "quote" | "chatbot" | "otro"

export interface Quote {
  id_quotes: number
  lead_id: number
  product_quotes: string
  requested_amount_quotes: string // decimal as string
  down_payment_quotes: string // decimal as string
  term_months_quotes: number
  annual_interest_rate_quotes: string // decimal as string
  monthly_payment_quotes: string // decimal as string
  contact_preference_quotes: string
  result_status_quotes: string
  createdAt: string
  updatedAt: string
}

export interface LeadNote {
  id_lead_notes: number
  manager_lead_notes: string
  note_lead_notes: string
  id_leads: number
  createdAt: string
}

export interface Lead {
  id_leads: number
  name_leads: string
  email_leads: string | null
  phone_leads: string | null
  city_leads: string | null
  status_leads: LeadStatus
  source_leads: LeadSource
  monthly_family_income: string | null // decimal as string
  coments_optionals_lead: string | null
  accepted_terms_lead: boolean
  accepted_terms_at: string | null
  accepted_terms_ip: string | null
  createdAt: string
  updatedAt: string
  quotes?: Quote[]
}

export interface LeadFilters {
  search: string
  status: LeadStatus | "all"
  source: LeadSource | "all"
}
