import { Context, Next } from "hono";


const VALID_API_KEY = process.env.VALID_API_KEY;

export async function apiKeyMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header("x-api-key");

  if (!apiKey || apiKey !== VALID_API_KEY) {
    return c.json(
      { 
        error: "Unauthorized", 
        message: "API Key inválida o ausente en los encabezados (x-api-key)." 
      }, 
      401
    );
  }

  // Si todo está bien, continúa con el controlador
  await next();
}