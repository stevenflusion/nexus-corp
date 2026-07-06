import { QuoteCreateDto } from "./quotesDTO"; // Ajusta la ruta a tus archivos
import { LeadRecuestWhitQuoteDto } from "./leadDTO";

// Este es el DTO compuesto que usará el controlador
export type QuoteWithLeadFlexDto = {
  quoteData: QuoteCreateDto; // Copia todo QuoteCreateDto pero quita el lead_id
  leadData: LeadRecuestWhitQuoteDto;
};


export function sanitizeCreateQuoteWithLeadRequest(
  data: unknown
): QuoteWithLeadFlexDto | null {

  if (typeof data !== "object" || data === null) {
    return null;
  }

  const body = data as Record<string, unknown>;

  if (
    typeof body.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.phone !== "string" ||
    typeof body.city !== "string" ||
    body.acceptedTerms !== true
  ) {
    return null;
  }

  if (
    typeof body.product !== "string" ||
    typeof body.quoteType !== "string" ||
    typeof body.amount !== "number" ||
  typeof body.downPayment !== "number" ||
  typeof body.monthlyPayment !== "number" ||
  typeof body.annualRate !== "number"
  ) {
    return null;
  }


  const contactMap: Record<string, "phone" | "email" | "whatsapp" | "other"> = {
  llamada: "phone",
  correo: "email",
  whatsapp: "whatsapp",
};


  return {
    leadData:{
      name_leads: body.name.trim(),
      phone_leads: body.phone.trim(),
      city_leads: body.city.trim(),
      email_leads: body.email.trim(),
      status_leads: "new",
      source_leads: "quote",
      monthly_family_income: body.monthlyFamilyIncome != null ? String(body.monthlyFamilyIncome) : null,
      coments_optionals_lead: body.comentsOptionalsLead != null ? String(body.comentsOptionalsLead) : null,
      accepted_terms_lead: body.acceptedTerms === true,
    },
    quoteData: {
      lead_id : 0,
      product_quotes: body.product as "vehicle" | "housing" | "consumer",

      requested_amount_quotes: String(body.amount),

      down_payment_quotes: String(body.downPayment),

      monthly_payment_quotes: String(body.monthlyPayment),

      term_months_quotes: Number(body.termMonths),

      annual_interest_rate_quotes: String(body.annualRate),

      contact_preference_quotes:
        contactMap[body.contactPreference as string] ?? "other",

      result_status_quotes: String(body.resultStatus),
}
  };
}
