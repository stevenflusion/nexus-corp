import { Hono } from "hono";
import { lead_notes } from "../database/schemas/lead_notes";
import { createOne, getAll, getById, updateById, deleteById, listWithFilters } from "../utils/crud";
import { LeadNoteCreateDto, LeadNoteUpdateDto, LeadNoteResponseDto, sanitizeLeadNoteCreate, sanitizeLeadNoteUpdate } from "../dto/lead_notesDTO";

const leadNotesController = new Hono();

leadNotesController.get("/", async (c) => {
  const notes = await getAll<LeadNoteResponseDto>(lead_notes);
  return c.json(notes);
});

leadNotesController.get("/lead/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const notes = await listWithFilters<LeadNoteResponseDto>(lead_notes, { id_leads: id });
  return c.json(notes);
});

leadNotesController.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const note = await getById<LeadNoteResponseDto>(lead_notes, lead_notes.id_lead_notes, id);

  if (!note) {
    return c.json({ error: "Lead note not found" }, 404);
  }

  return c.json(note);
});

leadNotesController.post("/", async (c) => {
  const body = await c.req.json();
  const payload = sanitizeLeadNoteCreate(body);

  if (!payload) {
    return c.json({ error: "manager_lead_notes, note_lead_notes and id_leads are required" }, 400);
  }

  const created = await createOne<LeadNoteCreateDto>(lead_notes, payload);

  const response: LeadNoteResponseDto = {
    manager_lead_notes: created.manager_lead_notes,
    note_lead_notes: created.note_lead_notes,
    id_leads: created.id_leads,
  };

  return c.json(response, 201);
});

leadNotesController.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const payload = sanitizeLeadNoteUpdate(body);

  if (Object.keys(payload).length === 0) {
    return c.json({ error: "No update fields provided" }, 400);
  }

  const updatedRows = await updateById<LeadNoteUpdateDto>(lead_notes, lead_notes.id_lead_notes, id, payload);

  if (!updatedRows) {
    return c.json({ error: "Lead note not found" }, 404);
  }

    const updated = updatedRows as LeadNoteResponseDto;


  const response: LeadNoteResponseDto = {
    manager_lead_notes: updated.manager_lead_notes,
    note_lead_notes: updated.note_lead_notes,
    id_leads: updated.id_leads,
  };

  return c.json(response);
});

leadNotesController.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await deleteById(lead_notes, lead_notes.id_lead_notes, id);

  if (!deleted) {
    return c.json({ error: "Lead note not found" }, 404);
  }

  return c.json({ success: true });
});

export { leadNotesController };