import { Hono } from "hono";
import { leads } from "../database/schemas/leads"; // Ajusta la ruta a tu esquema
import { createOne, getAll, getById, updateById, listWithFilters, getByField } from "../utils/crud";
import { 
  LeadCreateDto, 
  LeadUpdateStatusDto, 
  LeadResponseDto, 
  sanitizeLeadCreate, 
  sanitizeLeadUpdateStatus 
} from "../dto/leadDTO"; // El archivo DTO que armamos antes

const leadsController = new Hono();

// 1. LISTAR TODOS
leadsController.get("/", async (c) => {
  const allLeads = await getAll<LeadResponseDto>(leads);
  return c.json(allLeads);
});

// 2. LEER POR ID
leadsController.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const lead = await getById<LeadResponseDto>(leads, leads.id_leads, id);

  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }

  return c.json(lead);
});

// 3. CREAR LEAD (monthly_family_income es opcional internamente en la sanitización)
leadsController.post("/", async (c) => {
  const body = await c.req.json();
  const payload = sanitizeLeadCreate(body);

  if (!payload) {
    return c.json({ 
      error: "name_leads, email_leads, phone_leads and city_leads are required" 
    }, 400);
  }

  // Guardamos usando el CRUD genérico
  const created = await createOne<LeadCreateDto>(leads, payload);

  // Mapeamos a la respuesta basándonos en los datos generados
  const response = created as LeadResponseDto;

  return c.json(response, 201);
});

// 4. ACTUALIZAR SOLO STATUS (Filtra todo lo demás)
leadsController.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  // Inyectamos el ID de la URL en el body para que el sanitizador lo procese junto al status
  const payload = sanitizeLeadUpdateStatus({ ...body, id_leads: id });

  if (!payload) {
    return c.json({ error: "A valid 'status_leads' is required" }, 400);
  }

  // Preparamos la data parcial para el update. 
  // Añadimos manualmente el updatedAt para mantener la auditoría al día.
  const updateData = {
    status_leads: payload.status_leads,
    updatedAt: new Date()
  };

  const updatedRows = await updateById<any>(leads, leads.id_leads, id, updateData);

  if (!updatedRows) {
    return c.json({ error: "Lead not found" }, 404);
  }

  const response = updatedRows as LeadResponseDto;
  return c.json(response);
});

leadsController.get("/phone/:phone", async (c) => {
  const phone = c.req.param("phone");

  if (!phone || phone.trim() === "") {
    return c.json({ error: "Phone parameter is required" }, 400);
  }

  // Usamos tu función genérica getByField pasando la columna y el valor sanitizado
  const lead = await getByField<LeadResponseDto>(leads, leads.phone_leads, phone.trim());

  if (!lead) {
    return c.json({ error: "Lead not found with the provided phone number" }, 404);
  }

  return c.json(lead);
});

export { leadsController };