import type { APIRoute } from "astro";

const MAX_BODY_LENGTH = 4000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, maxLength = 500) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : undefined;

const getDeviceType = (ua?: string): string => {
  if (!ua) return "desktop";
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Content-Type no permitido." }, { status: 415 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_LENGTH) {
    return Response.json({ error: "Solicitud demasiado grande." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const page_path = readString(payload.page_path);
  const referrer = readString(payload.referrer);
  const user_agent = readString(payload.user_agent, 2000);
  const session_id = readString(payload.session_id, 64);

  if (!page_path) {
    return Response.json({ error: "page_path es requerido." }, { status: 400 });
  }

  const honoApiKey =
    import.meta.env.PUBLIC_VALID_API_KEY ||
    process.env.PUBLIC_VALID_API_KEY ||
    "";

  const honoUrl =
    import.meta.env.PUBLIC_HONO_API_URL ||
    process.env.PUBLIC_HONO_API_URL ||
    "http://api:4000/api/";

  const device_type = getDeviceType(user_agent);

  try {
    const response = await fetch(`${honoUrl}/analytics/page-view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": honoApiKey,
      },
      body: JSON.stringify({
        page_path,
        referrer,
        user_agent,
        session_id,
        device_type,
        ip_address: clientAddress,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      console.error("Analytics backend error:", response.status, errorBody);
      return Response.json({ error: "Error al registrar analytics." }, { status: 502 });
    }

    const data = await response.json();
    return Response.json({ ok: true, id: data.id_page_views }, { status: 201 });
  } catch (error) {
    console.error("Error conectando con analytics backend:", error);
    return Response.json({ error: "Error de conexión." }, { status: 500 });
  }
};

export const GET: APIRoute = async () =>
  Response.json({ error: "Método no permitido." }, { status: 405 });
