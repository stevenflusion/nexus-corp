import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
const port = Number(process.env.API_PORT ?? 4000);

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend running on port ${port}`);
});
