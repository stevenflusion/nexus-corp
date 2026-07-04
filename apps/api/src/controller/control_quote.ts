import { Hono } from "hono";
import { quotes } from "../database/schemas/quotes";
import { createOne, getAll, getById, updateById, deleteById, listWithFilters } from "../utils/crud";
import { 
  QuoteCreateDto, 
  QuoteUpdateDto, 
  QuoteResponseDto, 
  sanitizeQuoteCreate, 
  sanitizeQuoteUpdate 
} from "../dto/quotesDTO";
import { sanitizeCreateQuoteWithLeadRequest } from "../dto/quotes_whit_leadDTO";
import { quotesService } from "../services/quotes_services";
import { getClientIp } from "../utils/request";


const quotesController = new Hono();

// LISTAR TODAS LAS COTIZACIONES
quotesController.get("/", async (c) => {
  const allQuotes = await getAll<QuoteResponseDto>(quotes);
  return c.json(allQuotes);
});

// COTIZACIONES DE UN LEAD ESPECÍFICO (Filtro por FK)
quotesController.get("/lead/:leadId", async (c) => {
  const leadId = Number(c.req.param("leadId"));
  const userQuotes = await listWithFilters<QuoteResponseDto>(quotes, { lead_id: leadId });
  return c.json(userQuotes);
});

// OBTENER UNA COTIZACIÓN POR SU ID
quotesController.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const quote = await getById<QuoteResponseDto>(quotes, quotes.id_quotes, id);

  if (!quote) {
    return c.json({ error: "Quote not found" }, 404);
  }
  return c.json(quote);
});

// CREAR COTIZACIÓN
quotesController.post("/", async (c) => {
  const body = await c.req.json();
  const payload = sanitizeQuoteCreate(body);

  if (!payload) {
    return c.json({ error: "Missing required fields or invalid format inside body" }, 400);
  }

  const created = await createOne<QuoteCreateDto>(quotes, payload);
  return c.json(created as QuoteResponseDto, 201);
});

// ACTUALIZAR COTIZACIÓN
quotesController.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const payload = sanitizeQuoteUpdate(body);

  if (Object.keys(payload).length === 0) {
    return c.json({ error: "No valid fields provided for update" }, 400);
  }

  // Agregamos la fecha de actualización manual
  const updateData = { ...payload, updatedAt: new Date() };

  const updatedRow = await updateById<any>(quotes, quotes.id_quotes, id, updateData);

  if (!updatedRow) {
    return c.json({ error: "Quote not found" }, 404);
  }

  return c.json(updatedRow as QuoteResponseDto);
});

// ELIMINAR COTIZACIÓN
quotesController.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await deleteById(quotes, quotes.id_quotes, id);

  if (!deleted) {
    return c.json({ error: "Quote not found" }, 404);
  }
  return c.json({ success: true });
});


quotesController.post("/with-lead", async (c) => {
  try {
    const body = await c.req.json();


    const payload = sanitizeCreateQuoteWithLeadRequest(body);


    if (!payload) {
      return c.json(
        {
          error: "Datos inválidos o incompletos.",
        },
        400
      );
    }


    // El controlador NO sabe qué es 'createOne' ni 'getByField'. Solo llama al servicio.
    const ip = getClientIp(c);
    const result = await quotesService.createQuoteWithLead(payload, {ip});

    return c.json({
      success: true,
      message: result.isNewLead 
        ? "Nuevo Lead creado y cotización anclada." 
        : "Cotización anclada a Lead existente.",
      data: {
        lead_id: result.lead_id,
        quote: result.quote
      }
    }, 201);

  } catch (error: any) {

    console.error("Error en /quotes/with-lead:", error);

    // Manejo limpio de errores de validación o del servidor
    if (error.message === "INVALID_DATA") {
      return c.json({ error: "Datos del Lead o de la Cotización inválidos o incompletos." }, 400);
    }
    
    return c.json({ error: "Error interno en el servidor al procesar la solicitud." }, 500);
  }
});

export { quotesController };