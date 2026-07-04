import { quotes } from "../database/schemas/quotes";
import { leads } from "../database/schemas/leads";

import { createOne, getByField } from "../utils/crud";

import { QuoteWithLeadFlexDto } from "../dto/quotes_whit_leadDTO";
import { LeadCreateWhitQuoteDto } from "../dto/leadDTO";

export const quotesService = {
  async createQuoteWithLead(payload: QuoteWithLeadFlexDto) {
    const { leadData, quoteData } = payload;

    // Transformar Request DTO -> Create DTO
    const createLeadData: LeadCreateWhitQuoteDto = {
      name_leads: leadData.name_leads,
      email_leads: leadData.email_leads,
      phone_leads: leadData.phone_leads,
      city_leads: leadData.city_leads,
      status_leads: leadData.status_leads,
      source_leads: "quote",
      monthly_family_income: leadData.monthly_family_income ?? null,
      coments_optionals_lead : leadData.coments_optionals_lead ?? null,
    };

    // Buscar lead existente
    const existingLead = await getByField<{ id_leads: number }>(
      leads,
      leads.phone_leads,
      createLeadData.phone_leads
    );

    let targetLeadId: number;
    let isNewLead = false;

    if (existingLead) {
      targetLeadId = existingLead.id_leads;
    } else {
      const newLead = await createOne<LeadCreateWhitQuoteDto>(
        leads,
        createLeadData
      );

      targetLeadId = newLead.id_leads;
      isNewLead = true;
    }

    const finalQuote = await createOne(quotes, {
      ...quoteData,
      lead_id: targetLeadId,
    });

    return {
      lead_id: targetLeadId,
      isNewLead,
      quote: finalQuote,
    };
  },
};