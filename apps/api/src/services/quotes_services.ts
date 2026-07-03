import { quotes } from "../database/schemas/quotes";
import { leads } from "../database/schemas/leads";
import { createOne, getByField } from "../utils/crud";
import { sanitizeQuoteCreate, QuoteCreateDto } from "../dto/quotesDTO";
import { sanitizeLeadCreate, LeadCreateDto } from "../dto/leadDTO";

export const quotesService = {
  /**
   * Procesa el flujo completo de registrar una cotización junto a un lead usando su teléfono
   */
  async createQuoteWithLead(rawLeadData: unknown, rawQuoteData: unknown) {
    // 1. Sanitizar internamente en la capa de negocio
    const cleanLeadData = sanitizeLeadCreate(rawLeadData);
    const cleanQuoteData = sanitizeQuoteCreate({ ...rawQuoteData as any, lead_id: 0 });

    if (!cleanLeadData || !cleanQuoteData) {
      throw new Error("INVALID_DATA");
    }

    // 2. Buscar si el lead ya existe por teléfono
    const existingLead = await getByField<{ id_leads: number }>(
      leads,
      leads.phone_leads,
      cleanLeadData.phone_leads
    );

    let targetLeadId: number;
    let isNewLead = false;

    if (existingLead) {
      targetLeadId = existingLead.id_leads;
    } else {
      // Crear el nuevo lead si no existe
      const newLead = await createOne<any>(leads, cleanLeadData);
      targetLeadId = newLead.id_leads;
      isNewLead = true;
    }

    // 3. Enlazar el ID y crear la cotización
    cleanQuoteData.lead_id = targetLeadId;
    const finalQuote = await createOne<any>(quotes, cleanQuoteData);

    return {
      lead_id: targetLeadId,
      isNewLead,
      quote: finalQuote
    };
  }
};