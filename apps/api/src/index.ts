import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { apiKeyMiddleware } from "./middleware/api_key_middleware";
import { apiRouter } from "./routes/routes_controller";

const app = new Hono();
const port = Number(process.env.API_PORT );

// 1. Proteger globalmente todas las rutas que apunten a /api
app.use("/api/*", apiKeyMiddleware);

// 2. Montar el enrutador maestro en el prefijo /api
app.route("/api", apiRouter);


app.get("/health", (c) => {
  return c.json({ status: "ok" });
});



serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend running on port ${port}`);
});
