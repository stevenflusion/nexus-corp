import type { APIRoute } from "astro";

const MAX_BODY_LENGTH = 8000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, maxLength = 280) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isValidPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 13;
};

const saveLeadInHono = async (leadPayload: {
  name_leads: string;
  email_leads: string;
  phone_leads: string;
  city_leads: string;
  status_leads: string;
  source_leads: string;
  coments_optionals_lead: string;
}) => {
  const honoApiKey =
    import.meta.env.VALID_API_KEY ||
    process.env.VALID_API_KEY ||
    "";

  const honoUrl =
    import.meta.env.HONO_API_URL ||
    process.env.HONO_API_URL ||
    "http://api:4000/api/leads";

  try {
    const response = await fetch(honoUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": honoApiKey,
      },
      body: JSON.stringify(leadPayload),
    });

    return response.ok;
  } catch (error) {
    console.error("Error conectando con Hono:", error);
    return false;
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json(
      { error: "Content-Type no permitido." },
      { status: 415 }
    );
  }

  const rawBody = await request.text();

  if (rawBody.length > MAX_BODY_LENGTH) {
    return Response.json(
      { error: "Solicitud demasiado grande." },
      { status: 413 }
    );
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: "JSON inválido." },
      { status: 400 }
    );
  }

  if (!isRecord(payload)) {
    return Response.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }

  const name = readString(payload.name);
  const phone = readString(payload.phone);
  const service = readString(payload.service, 120);
  const message = readString(payload.message, 800);
  const email = readString(payload.email, 120);

  if (!name || !phone || !isValidPhone(phone)) {
    return Response.json(
      { error: "Nombre y teléfono son obligatorios." },
      { status: 400 }
    );
  }

  const leadSaved = await saveLeadInHono({
    name_leads: name,
    email_leads: email,
    phone_leads: phone,
    city_leads: "Ecuador",
    status_leads: "new",
    source_leads: `web`,
    coments_optionals_lead: message,
  });

  if (!leadSaved) {
    return Response.json(
      {
        error: "No se pudo registrar el lead.",
      },
      {
        status: 500,
      }
    );
  }

  return Response.json(
    {
      ok: true,
    },
    {
      status: 201,
    }
  );
};

export const GET: APIRoute = async () =>
  Response.json(
    {
      error: "Método no permitido.",
    },
    {
      status: 405,
    }
  );