import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { quotes } from "../database/schemas/quotes"; // Ajusta la ruta

export type QuoteDTO = InferSelectModel<typeof quotes>;
export type QuoteInsert = InferInsertModel<typeof quotes>;

// DTO para Creación: Todos los campos requeridos excepto fechas e IDs auto-generados
export type QuoteCreateDto = Pick<
  QuoteDTO,
  | "lead_id"
  | "product_quotes"
  | "requested_amount_quotes"
  | "down_payment_quotes"
  | "term_months_quotes"
  | "annual_interest_rate_quotes"
  | "monthly_payment_quotes"
  | "contact_preference_quotes"
>;

// DTO para Actualización: Todo opcional excepto el ID del registro
export type QuoteUpdateDto = Partial<QuoteCreateDto>;

export type QuoteResponseDto = QuoteDTO;

// ==========================================
// FUNCIONES DE SANITIZACIÓN
// ==========================================

export function sanitizeQuoteCreate(body: unknown): QuoteCreateDto | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;

  // Validar y parsear campos numéricos
  const lead_id = typeof payload.lead_id === "number" ? payload.lead_id : undefined;
  const term_months_quotes = typeof payload.term_months_quotes === "number" ? payload.term_months_quotes : undefined;

  // Los Decimal en Drizzle/Postgres se reciben bien como Strings para no perder precisión monetaria
  const requested_amount_quotes = typeof payload.requested_amount_quotes === "string" || typeof payload.requested_amount_quotes === "number" 
    ? String(payload.requested_amount_quotes).trim() : "";
  const down_payment_quotes = typeof payload.down_payment_quotes === "string" || typeof payload.down_payment_quotes === "number" 
    ? String(payload.down_payment_quotes).trim() : "";
  const annual_interest_rate_quotes = typeof payload.annual_interest_rate_quotes === "string" || typeof payload.annual_interest_rate_quotes === "number" 
    ? String(payload.annual_interest_rate_quotes).trim() : "";
  const monthly_payment_quotes = typeof payload.monthly_payment_quotes === "string" || typeof payload.monthly_payment_quotes === "number" 
    ? String(payload.monthly_payment_quotes).trim() : "";

  // Validar Enums estrictamente
  const validProducts = ["vehicle", "housing", "consumer"];
  const product_quotes = typeof payload.product_quotes === "string" && validProducts.includes(payload.product_quotes)
    ? (payload.product_quotes as QuoteCreateDto["product_quotes"]) : undefined;

  const validPreferences = ["phone", "email", "whatsapp", "other"];
  const contact_preference_quotes = typeof payload.contact_preference_quotes === "string" && validPreferences.includes(payload.contact_preference_quotes)
    ? (payload.contact_preference_quotes as QuoteCreateDto["contact_preference_quotes"]) : undefined;

  // Si falta algún campo obligatorio crítico, rebota
  if (
    lead_id === undefined || Number.isNaN(lead_id) ||
    term_months_quotes === undefined || Number.isNaN(term_months_quotes) ||
    !requested_amount_quotes || !down_payment_quotes || 
    !annual_interest_rate_quotes || !monthly_payment_quotes ||
    !product_quotes || !contact_preference_quotes
  ) {
    return null;
  }

  return {
    lead_id,
    product_quotes,
    requested_amount_quotes,
    down_payment_quotes,
    term_months_quotes,
    annual_interest_rate_quotes,
    monthly_payment_quotes,
    contact_preference_quotes,
  };
}

export function sanitizeQuoteUpdate(body: unknown): QuoteUpdateDto {
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const updated: QuoteUpdateDto = {};

  if (typeof payload.lead_id === "number" && !Number.isNaN(payload.lead_id)) updated.lead_id = payload.lead_id;
  if (typeof payload.term_months_quotes === "number" && !Number.isNaN(payload.term_months_quotes)) updated.term_months_quotes = payload.term_months_quotes;

  if (payload.requested_amount_quotes) updated.requested_amount_quotes = String(payload.requested_amount_quotes).trim();
  if (payload.down_payment_quotes) updated.down_payment_quotes = String(payload.down_payment_quotes).trim();
  if (payload.annual_interest_rate_quotes) updated.annual_interest_rate_quotes = String(payload.annual_interest_rate_quotes).trim();
  if (payload.monthly_payment_quotes) updated.monthly_payment_quotes = String(payload.monthly_payment_quotes).trim();

  if (typeof payload.product_quotes === "string" && ["vehicle", "housing", "consumer"].includes(payload.product_quotes)) {
    updated.product_quotes = payload.product_quotes as QuoteCreateDto["product_quotes"];
  }
  if (typeof payload.contact_preference_quotes === "string" && ["phone", "email", "whatsapp", "other"].includes(payload.contact_preference_quotes)) {
    updated.contact_preference_quotes = payload.contact_preference_quotes as QuoteCreateDto["contact_preference_quotes"];
  }

  return updated;
}