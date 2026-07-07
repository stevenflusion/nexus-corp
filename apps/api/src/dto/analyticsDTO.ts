import type { InferModel } from "drizzle-orm";
import { page_views } from "../database/schemas/analytics";

export type PageViewDTO = InferModel<typeof page_views>;

export type PageViewCreateDto = Pick<PageViewDTO,
  "page_path" | "referrer" | "user_agent" | "ip_address" | "session_id" | "device_type" | "country" | "city"
>;

export type PageViewResponseDto = Pick<PageViewDTO,
  "id_page_views" | "page_path" | "referrer" | "user_agent" | "ip_address" | "session_id" | "device_type" | "country" | "city" | "created_at"
>;

export function sanitizePageViewCreate(body: unknown): PageViewCreateDto | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;
  const page_path = typeof payload.page_path === "string" ? payload.page_path.trim().slice(0, 500) : "";
  const referrer = typeof payload.referrer === "string" ? payload.referrer.trim().slice(0, 500) : null;
  const user_agent = typeof payload.user_agent === "string" ? payload.user_agent.trim() : null;
  const ip_address = typeof payload.ip_address === "string" ? payload.ip_address.trim().slice(0, 45) : null;
  const session_id = typeof payload.session_id === "string" ? payload.session_id.trim().slice(0, 64) : null;
  const device_type = typeof payload.device_type === "string" ? payload.device_type.trim().slice(0, 20) : null;
  const country = typeof payload.country === "string" ? payload.country.trim().slice(0, 100) : null;
  const city = typeof payload.city === "string" ? payload.city.trim().slice(0, 100) : null;

  if (!page_path) {
    return null;
  }

  return {
    page_path,
    referrer,
    user_agent,
    ip_address,
    session_id,
    device_type,
    country,
    city,
  };
}
