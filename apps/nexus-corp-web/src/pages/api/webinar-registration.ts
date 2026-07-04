import type { APIRoute } from "astro";

const DEFAULT_REGISTRATION_TO = "info@nexuscorpec.com";
const MAX_BODY_LENGTH = 8_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, maxLength = 280) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 13;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ==========================================
// 1. ENVÍO DE EMAIL (Mantiene tu lógica con Resend)
// ==========================================
const sendRegistrationEmail = async ({
  name,
  email,
  phone,
  interest,
  message,
}: {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return false;
  }

  const to = process.env.WEBINAR_REGISTRATION_TO || DEFAULT_REGISTRATION_TO;
  const from =
    process.env.WEBINAR_REGISTRATION_FROM ||
    "NEXUS Webinar <onboarding@resend.dev>";

  const plainText = [
    "Nuevo registro al webinar NEXUS",
    "",
    `Nombre: ${name}`,
    `Correo: ${email}`,
    `Telefono: ${phone}`,
    `Objetivo: ${interest}`,
    `Comentario: ${message || "Sin comentario adicional."}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #001f3d; line-height: 1.5;">
      <h2 style="margin: 0 0 16px;">Nuevo registro al webinar NEXUS</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
      <p><strong>Telefono:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Objetivo:</strong> ${escapeHtml(interest)}</p>
      <p><strong>Comentario:</strong><br />${escapeHtml(message || "Sin comentario adicional.")}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `Nuevo registro al webinar: ${name}`,
      text: plainText,
      html,
    }),
  });

  return response.ok;
};

// ==========================================
// 2. ENVIAR A HONO API (Reemplaza al CSV 🚀)
// ==========================================
const saveLeadInHono = async (leadPayload: {
  name_leads: string;
  email_leads: string;
  phone_leads: string;
  city_leads: string;
  coments_optionals_lead: string;
  status_leads: string;
  source_leads: string;
}) => {

  

  const honoApiKey = import.meta.env.PUBLIC_VALID_API_KEY || process.env.PUBLIC_VALID_API_KEY || "";
const honoUrl = import.meta.env.PUBLIC_HONO_API_URL || process.env.PUBLIC_HONO_API_URL || "http://api:4000/api/";


  try {
    const response = await fetch(`${honoUrl}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": honoApiKey, // Protegida en el servidor
      },
      body: JSON.stringify(leadPayload),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Error conectando con la API Hono de Leads:", error);
    return false;
  }
};

// ==========================================
// METODO POST PRINCIPAL
// ==========================================
export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("content-type")?.includes("application/json") !== true) {
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
    return Response.json({ error: "JSON invalido." }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return Response.json({ error: "El registro es obligatorio." }, { status: 400 });
  }

  const name = readString(payload.name);
  const email = readString(payload.email);
  const phone = readString(payload.phone);
  const interest = readString(payload.interest, 120);
  const message = readString(payload.message, 800);
  const acceptedTerms = payload.acceptedTerms === true;

  if (
    !name ||
    !email ||
    !isValidEmail(email) ||
    !phone ||
    !isValidPhone(phone) ||
    !interest ||
    !acceptedTerms
  ) {
    return Response.json({ error: "Por favor completa los campos obligatorios." }, { status: 400 });
  }

  // 1. Ejecutar el envío del correo
  let emailSent = false;
  try {
    emailSent = await sendRegistrationEmail({ name, email, phone, interest, message });
  } catch {
    emailSent = false;
  }

  // 2. Mapear al esquema estructurado de tu base de datos de Hono
  const honoLeadPayload = {
    name_leads: name,
    email_leads: email,
    phone_leads: phone,
    city_leads: "Ecuador/Online", // Ajusta si el formulario tiene un selector de ciudades
    status_leads: "new",
    source_leads: `webinar_interest: ${interest}`, // Guardamos su objetivo de interés dinámicamente como fuente
    coments_optionals_lead: message,
  };

  // 3. Ejecutar el guardado persistente en la base de datos a través de Hono
  const leadSaved = await saveLeadInHono(honoLeadPayload);

  if(!leadSaved){
    return Response.json(
      { error: "No se pudo sincronizar el lead con el sistema central." },
      { status: 500 }
    )
  }


  // Retornamos si se completó con éxito
  return Response.json(
    { 
      ok: true, 
      emailSent,
      leadSaved 
    },
    { status: emailSent && leadSaved ? 201 : 202 }
  );
};

export const GET: APIRoute = async () =>
  Response.json({ error: "Metodo no permitido." }, { status: 405 });