import type { APIRoute } from "astro";

export const prerender = false; // asegura que esto se ejecute en el servidor, no en build

const API_URL = import.meta.env.PUBLIC_HONO_API_URL || "http://api:4000/api";
const API_KEY = import.meta.env.PUBLIC_VALID_API_KEY || "";

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const payload = await request.json();

    const response = await fetch(`${API_URL}/quotes/with-lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "x-forwarded-for": clientAddress,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error proxying quote to backend:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al procesar la cotización." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};