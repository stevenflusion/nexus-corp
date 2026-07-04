import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { leads } from "../database/schemas/leads"; // Ajusta la ruta a tu esquema real

// Modelo completo de la base de datos (Select y Insert)
export type LeadDTO = InferSelectModel<typeof leads>;
export type LeadInsert = InferInsertModel<typeof leads>;

// 1. DTO para CREAR: Requeridos excepto monthly_family_income (que es opcional/nullable)
export type LeadCreateDto = Pick<
  LeadDTO, 
  "name_leads" | "email_leads" | "phone_leads" | "city_leads" | "status_leads" | "source_leads"
> & {
  monthly_family_income?: string | null;
  coments_optionals_lead?: string | null;
};

export type LeadCreateWhitQuoteDto = Pick<
  LeadDTO, 
  "name_leads" | "email_leads" | "phone_leads" | "city_leads" | "status_leads" | "source_leads" 
> & {
  monthly_family_income?: string | null;
  coments_optionals_lead?: string | null;
};

export type LeadRecuestWhitQuoteDto = Pick<
  LeadDTO, 
  "name_leads" | "email_leads" | "phone_leads" | "city_leads" | "status_leads" | "source_leads"   
> & {
  id_leads? : number | null;
  monthly_family_income?: string | null;
  coments_optionals_lead?: string | null;
};

// 2. DTO para ACTUALIZAR: Solo el id (obligatorio) y el status (obligatorio según tu regla)
export type LeadUpdateStatusDto = {
  id_leads: number;
  status_leads: "new" | "contacted" | "qualified" | "lost";
};

// 3. DTO para RESPUESTA: Listar todos (Campos que expones al cliente)
export type LeadResponseDto = LeadDTO;


// ==========================================
// FUNCIONES DE SANITIZACIÓN (Validación Manual)
// ==========================================

export function sanitizeLeadCreate(body: unknown): LeadCreateDto | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;

  // Sanitizar strings obligatorios
  const name_leads = typeof payload.name_leads === "string" ? payload.name_leads.trim() : "";
  const email_leads = typeof payload.email_leads === "string" ? payload.email_leads.trim() : "";
  const phone_leads = typeof payload.phone_leads === "string" ? payload.phone_leads.trim() : "";
  const city_leads = typeof payload.city_leads === "string" ? payload.city_leads.trim() : "";

  // Validar enums con sus defaults si no vienen
  const status_leads = ["new", "contacted", "qualified", "lost"].includes(payload.status_leads as string)
    ? (payload.status_leads as LeadCreateDto["status_leads"])
    : "new";

  const source_leads = ["web", "manual", "quote", "chatbot", "otro"].includes(payload.source_leads as string)
    ? (payload.source_leads as LeadCreateDto["source_leads"])
    : "web";

  // monthly_family_income es opcional
  let monthly_family_income: string | null = null;
  if (typeof payload.monthly_family_income === "string" || typeof payload.monthly_family_income === "number") {
    monthly_family_income = String(payload.monthly_family_income).trim();
  }

  let coments_optionals_lead: string | null = null;
if (typeof payload.coments_optionals_lead === "string") {
  coments_optionals_lead = payload.coments_optionals_lead.trim();
}

  // Validar campos requeridos obligatorios
  if (!name_leads || !email_leads || !phone_leads || !city_leads) {
    return null;
  }

  return {
    name_leads,
    email_leads,
    phone_leads,
    city_leads,
    status_leads,
    source_leads,
    monthly_family_income,
    coments_optionals_lead,
  };
}

export function sanitizeLeadUpdateStatus(body: unknown): LeadUpdateStatusDto | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;
  const id_leads = typeof payload.id_leads === "number" ? payload.id_leads : undefined;
  
  // Validar que el status pertenezca al enum
  const validStatuses = ["new", "contacted", "qualified", "lost"];
  const status_leads = typeof payload.status_leads === "string" && validStatuses.includes(payload.status_leads)
    ? (payload.status_leads as LeadUpdateStatusDto["status_leads"])
    : undefined;

  // Ambos campos son estrictamente necesarios para esta actualización parcial
  if (id_leads === undefined || Number.isNaN(id_leads) || !status_leads) {
    return null;
  }

  return {
    id_leads,
    status_leads,
  };
}