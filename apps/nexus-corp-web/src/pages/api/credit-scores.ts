import type { APIRoute } from "astro";

export const prerender = false; // se ejecuta en el servidor, no en build

const API_URL =
  import.meta.env.PUBLIC_HONO_API_URL ||
  process.env.PUBLIC_HONO_API_URL ||
  "http://api:4000/api";

const API_KEY =
  import.meta.env.PUBLIC_VALID_API_KEY ||
  process.env.PUBLIC_VALID_API_KEY ||
  "";

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB por archivo

const ALLOWED_CONTRACT_TYPES = ["application/pdf"];
const ALLOWED_SELFIE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Content-Type no permitido." }, { status: 415 });
  }

  let incomingForm: FormData;

  try {
    incomingForm = await request.formData();
  } catch {
    return Response.json({ error: "No se pudo leer el formulario." }, { status: 400 });
  }

  const idLeadsRaw = incomingForm.get("id_leads");
  const contract = incomingForm.get("contract");
  const selfie = incomingForm.get("selfie");

  const idLeads = typeof idLeadsRaw === "string" ? Number(idLeadsRaw) : NaN;

  if (!idLeads || Number.isNaN(idLeads)) {
    return Response.json({ error: "id_leads es obligatorio." }, { status: 400 });
  }

  if (!(contract instanceof File) || contract.size === 0) {
    return Response.json({ error: "El contrato firmado (PDF) es obligatorio." }, { status: 400 });
  }

  if (!(selfie instanceof File) || selfie.size === 0) {
    return Response.json({ error: "La selfie con cédula es obligatoria." }, { status: 400 });
  }

  if (!ALLOWED_CONTRACT_TYPES.includes(contract.type)) {
    return Response.json({ error: "El contrato debe ser un archivo PDF." }, { status: 400 });
  }

  if (!ALLOWED_SELFIE_TYPES.includes(selfie.type)) {
    return Response.json({ error: "La selfie debe ser una imagen (JPG, PNG o WEBP)." }, { status: 400 });
  }

  if (contract.size > MAX_FILE_BYTES || selfie.size > MAX_FILE_BYTES) {
    return Response.json({ error: "Cada archivo debe pesar máximo 15 MB." }, { status: 413 });
  }

  const outgoingForm = new FormData();
  outgoingForm.append("id_leads", String(idLeads));
  outgoingForm.append("contract", contract, contract.name);
  outgoingForm.append("selfie", selfie, selfie.name);

  try {
    const response = await fetch(`${API_URL}/credit-scores`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "x-forwarded-for": clientAddress,
        // No seteamos Content-Type: fetch arma el boundary del multipart automáticamente.
      },
      body: outgoingForm,
    });

    const data = await response.json().catch(() => null);

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error proxying credit-score a backend:", error);
    return Response.json(
      { error: "Error interno al procesar la solicitud de score crediticio." },
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async () =>
  Response.json({ error: "Método no permitido." }, { status: 405 });
