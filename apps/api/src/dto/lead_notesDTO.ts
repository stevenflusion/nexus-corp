import type { InferModel } from "drizzle-orm";
import { lead_notes } from "../database/schemas/lead_notes";

export type LeadNoteDTO = InferModel<typeof lead_notes>;

export type LeadNoteCreateDto = Pick<LeadNoteDTO, "manager_lead_notes" | "note_lead_notes" | "id_leads">;

export type LeadNoteUpdateDto = Partial<LeadNoteCreateDto>;

export type LeadNoteResponseDto = Pick<LeadNoteDTO, "manager_lead_notes" | "note_lead_notes" | "id_leads">;

export function sanitizeLeadNoteCreate(body: unknown): LeadNoteCreateDto | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;
  const manager_lead_notes = typeof payload.manager_lead_notes === "string" ? payload.manager_lead_notes.trim() : "";
  const note_lead_notes = typeof payload.note_lead_notes === "string" ? payload.note_lead_notes.trim() : "";
  const id_leads = typeof payload.id_leads === "number" ? payload.id_leads : undefined;

  if (!manager_lead_notes || !note_lead_notes || id_leads === undefined || Number.isNaN(id_leads)) {
    return null;
  }

  return {
    manager_lead_notes,
    note_lead_notes,
    id_leads,
  };
}

export function sanitizeLeadNoteUpdate(body: unknown): LeadNoteUpdateDto {
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const updated: LeadNoteUpdateDto = {};

  if (typeof payload.manager_lead_notes === "string") {
    updated.manager_lead_notes = payload.manager_lead_notes.trim();
  }

  if (typeof payload.note_lead_notes === "string") {
    updated.note_lead_notes = payload.note_lead_notes.trim();
  }

  if (typeof payload.id_leads === "number" && !Number.isNaN(payload.id_leads)) {
    updated.id_leads = payload.id_leads;
  }

  return updated;
}
