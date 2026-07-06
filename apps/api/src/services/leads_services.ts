import { eq } from "drizzle-orm";

import { db } from "../database/database";
import { leads } from "../database/schemas/leads";
import { quotes } from "../database/schemas/quotes";

export const leadsService = {
  // Trae todos los leads junto con sus cotizaciones asociadas (si tienen)
  async getAllLeadsWithQuotes() {
    const rows = await db
      .select({
        lead: leads,
        quote: quotes,
      })
      .from(leads)
      .leftJoin(quotes, eq(quotes.lead_id, leads.id_leads));

    // Agrupamos porque el join devuelve una fila por cada quote
    // (un lead con 3 quotes aparece 3 veces en `rows`, hay que juntarlas)
    const grouped = new Map<number, typeof leads.$inferSelect & { quotes: (typeof quotes.$inferSelect)[] }>();

    for (const row of rows) {
      const leadId = row.lead.id_leads;

      if (!grouped.has(leadId)) {
        grouped.set(leadId, { ...row.lead, quotes: [] });
      }

      if (row.quote) {
        grouped.get(leadId)!.quotes.push(row.quote);
      }
    }

    return Array.from(grouped.values());
  },
};