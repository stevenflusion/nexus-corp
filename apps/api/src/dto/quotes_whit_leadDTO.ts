import { QuoteCreateDto } from "./quotesDTO"; // Ajusta la ruta a tus archivos
import { LeadCreateDto } from "./leadDTO";

// Este es el DTO compuesto que usará el controlador
export type QuoteWithLeadFlexDto = {
  quoteData: Omit<QuoteCreateDto, "lead_id">; // Copia todo QuoteCreateDto pero quita el lead_id
  leadData: LeadCreateDto;
};