import type { APIRoute } from "astro";

export const prerender = false; // se ejecuta en el servidor, no en build

const MAX_BODY_LENGTH = 8_000;

const API_URL =
  import.meta.env.PUBLIC_HONO_API_URL ||
  process.env.PUBLIC_HONO_API_URL ||
  "http://api:4000/api";

const API_KEY =
  import.meta.env.PUBLIC_VALID_API_KEY ||
  process.env.PUBLIC_VALID_API_KEY ||
  "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, maxLength = 280) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 13;
};

// ==========================================
// Crea el lead en la API Hono y devuelve su id_leads
// ==========================================
const createLeadInHono = async (
  leadPayload: {
    name_leads: string;
    email_leads: string;
    phone_leads: string;
    city_leads: string;
    coments_optionals_lead: string;
    status_leads: string;
    source_leads: string;
    acceptedTerms: boolean;
  },
  clientIp: string
): Promise<{ ok: boolean; id_leads: number | null; error?: unknown }> => {
  try {
    const response = await fetch(`${API_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "x-forwarded-for": clientIp,
      },
      body: JSON.stringify(leadPayload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Hono rechazó el lead:", response.status, data);
      return { ok: false, id_leads: null, error: data };
    }

    // La API puede devolver el id como id_leads o id, cubrimos ambos casos.
    const id_leads =
      (isRecord(data) &&
        (typeof data.id_leads === "number"
          ? data.id_leads
          : typeof data.id === "number"
            ? data.id
            : null)) ||
      null;

    return { ok: true, id_leads };
  } catch (error) {
    console.error("Error conectando con la API Hono de Leads:", error);
    return { ok: false, id_leads: null, error: "network_error" };
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Content-Type no permitido." }, { status: 415 });
  }

  const rawBody = await request.text();

  if (rawBody.length > MAX_BODY_LENGTH) {
    return Response.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return Response.json({ error: "El registro es obligatorio." }, { status: 400 });
  }

  const name = readString(payload.name);
  const email = readString(payload.email);
  const phone = readString(payload.phone);
  const city = readString(payload.city, 120) || "Ecuador/Online";
  const message = readString(payload.message, 800);
  const acceptedTerms = payload.acceptedTerms === true;

  if (!name || !email || !isValidEmail(email) || !phone || !isValidPhone(phone) || !acceptedTerms) {
    return Response.json(
      { error: "Completa nombre, correo, teléfono válidos y acepta los términos." },
      { status: 400 }
    );
  }

  const result = await createLeadInHono(
    {
      name_leads: name,
      email_leads: email,
      phone_leads: phone,
      city_leads: city,
      status_leads: "new",
      source_leads: "solicitud-credito",
      coments_optionals_lead: message,
      acceptedTerms: true,
    },
    clientAddress
  );

  if (!result.ok || !result.id_leads) {
    return Response.json(
      { error: "No se pudo registrar el lead en el sistema central." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true, id_leads: result.id_leads }, { status: 201 });
};

export const GET: APIRoute = async () =>
  Response.json({ error: "Método no permitido." }, { status: 405 });
