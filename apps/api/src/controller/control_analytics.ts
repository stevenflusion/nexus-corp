import { Hono } from "hono";
import { sql, count, eq, desc } from "drizzle-orm";
import { page_views } from "../database/schemas/analytics";
import { createOne, getAll } from "../utils/crud";
import { db } from "../database/database";
import {
  PageViewCreateDto,
  PageViewResponseDto,
  sanitizePageViewCreate,
} from "../dto/analyticsDTO";

const analyticsController = new Hono();

// POST /analytics/page-view — registrar una visita
analyticsController.post("/page-view", async (c) => {
  const body = await c.req.json();
  const payload = sanitizePageViewCreate(body);

  if (!payload) {
    return c.json({ error: "page_path is required" }, 400);
  }

  const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "";
  const enriched: PageViewCreateDto = {
    ...payload,
    ip_address: payload.ip_address || ip.split(",")[0]?.trim() || null,
  };

  const created = await createOne<PageViewCreateDto>(page_views, enriched);
  return c.json(created as PageViewResponseDto, 201);
});

// GET /analytics/dashboard — métricas agregadas
analyticsController.get("/dashboard", async (c) => {
  const daysParam = c.req.query("days");
  const days = Math.min(Math.max(Number(daysParam) || 30, 7), 90);

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  // Visitas por día
  const visitsByDayRaw = await db
    .select({
      date: sql<string>`DATE(${page_views.created_at})`,
      visits: count(),
    })
    .from(page_views)
    .where(sql`${page_views.created_at} >= ${sinceDate}`)
    .groupBy(sql`DATE(${page_views.created_at})`)
    .orderBy(sql`DATE(${page_views.created_at})`);

  // Top páginas
  const topPagesRaw = await db
    .select({
      page_path: page_views.page_path,
      visits: count(),
    })
    .from(page_views)
    .where(sql`${page_views.created_at} >= ${sinceDate}`)
    .groupBy(page_views.page_path)
    .orderBy(desc(count()))
    .limit(10);

  // Total visitas en el período
  const totalVisitsRaw = await db
    .select({ total: count() })
    .from(page_views)
    .where(sql`${page_views.created_at} >= ${sinceDate}`);

  // Visitantes únicos (por session_id)
  const uniqueVisitorsRaw = await db
    .select({ total: count() })
    .from(page_views)
    .where(sql`${page_views.created_at} >= ${sinceDate} AND ${page_views.session_id} IS NOT NULL`)
    .groupBy(page_views.session_id);

  // Breakdown por device_type
  const deviceBreakdownRaw = await db
    .select({
      device_type: page_views.device_type,
      visits: count(),
    })
    .from(page_views)
    .where(sql`${page_views.created_at} >= ${sinceDate}`)
    .groupBy(page_views.device_type)
    .orderBy(desc(count()));

  // Referrers
  const referrersRaw = await db
    .select({
      referrer: page_views.referrer,
      visits: count(),
    })
    .from(page_views)
    .where(sql`${page_views.created_at} >= ${sinceDate} AND ${page_views.referrer} IS NOT NULL`)
    .groupBy(page_views.referrer)
    .orderBy(desc(count()))
    .limit(8);

  return c.json({
    days,
    visitsByDay: visitsByDayRaw.map((r) => ({
      date: r.date,
      visits: Number(r.visits),
    })),
    topPages: topPagesRaw.map((r) => ({
      page: r.page_path,
      visits: Number(r.visits),
    })),
    totalVisits: Number(totalVisitsRaw[0]?.total ?? 0),
    uniqueVisitors: uniqueVisitorsRaw.length,
    deviceBreakdown: deviceBreakdownRaw.map((r) => ({
      device: r.device_type || "Desconocido",
      visits: Number(r.visits),
    })),
    referrers: referrersRaw.map((r) => ({
      referrer: r.referrer || "Directo",
      visits: Number(r.visits),
    })),
  });
});

export { analyticsController };
