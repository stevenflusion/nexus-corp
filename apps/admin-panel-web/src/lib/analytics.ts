// Repository facade for analytics data from the Nexus API.

import { apiGet, apiPost } from "./api-client"

export interface PageViewPayload {
  page_path: string
  referrer?: string
  user_agent?: string
  session_id?: string
  device_type?: string
}

export interface AnalyticsDashboardData {
  days: number
  visitsByDay: { date: string; visits: number }[]
  topPages: { page: string; visits: number }[]
  totalVisits: number
  uniqueVisitors: number
  deviceBreakdown: { device: string; visits: number }[]
  referrers: { referrer: string; visits: number }[]
}

export async function trackPageView(payload: PageViewPayload): Promise<unknown> {
  return apiPost<unknown>("/analytics/page-view", payload)
}

export async function getAnalyticsDashboard(days?: number): Promise<AnalyticsDashboardData> {
  const params = days ? { days: String(days) } : undefined
  return apiGet<AnalyticsDashboardData>("/analytics/dashboard", params)
}
