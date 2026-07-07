"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnalyticsDashboard } from "@/lib/analytics"
import type { AnalyticsDashboardData } from "@/lib/analytics"

const COLORS = ["#002b55", "#009933", "#c89b3c", "#3a7cb8", "#8f6a2e", "#1ac65b", "#a87a1f", "#4d5b6a"]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "short" })
}

function MetricCard({
  title,
  value,
  loading,
}: {
  title: string
  value: string | number
  loading: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsDashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [days, setDays] = React.useState(30)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAnalyticsDashboard(days)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.message || "Error al cargar analytics")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [days])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Métricas de tráfico de nexuscorpec.com
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                days === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Métricas clave */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total visitas" value={data?.totalVisits ?? 0} loading={loading} />
        <MetricCard title="Visitantes únicos" value={data?.uniqueVisitors ?? 0} loading={loading} />
        <MetricCard
          title="Páginas vistas/día"
          value={
            data && data.visitsByDay.length > 0
              ? Math.round(data.totalVisits / data.visitsByDay.length)
              : 0
          }
          loading={loading}
        />
        <MetricCard
          title="Páginas más vista"
          value={data?.topPages[0]?.page ?? "—"}
          loading={loading}
        />
      </div>

      {/* Gráfico de visitas por día */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Visitas por día</h2>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data && data.visitsByDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.visitsByDay}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#002b55" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#002b55" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={((value: any) => [value, "Visitas"]) as any}
                labelFormatter={((label: any) => formatDate(label)) as any}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#002b55"
                strokeWidth={2}
                fill="url(#colorVisits)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Sin datos para el período seleccionado
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top páginas */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Páginas más vistas</h2>
          {loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : data && data.topPages.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topPages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="page"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={((value: any) => [value, "Visitas"]) as any}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="visits" radius={[0, 4, 4, 0]} fill="#009933" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-muted-foreground">
              Sin datos
            </div>
          )}
        </div>

        {/* Dispositivos */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Dispositivos</h2>
          {loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : data && data.deviceBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="visits"
                  nameKey="device"
                >
                  {data.deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Tooltip
                  formatter={((value: any, name: any) => [value, name]) as any}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-muted-foreground">
              Sin datos
            </div>
          )}
        </div>
      </div>

      {/* Referrers */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Fuentes de tráfico</h2>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : data && data.referrers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.referrers.map((ref) => (
              <div
                key={ref.referrer}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <span className="truncate text-sm font-medium">{ref.referrer}</span>
                <span className="text-sm font-bold text-muted-foreground">{ref.visits}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[100px] items-center justify-center text-muted-foreground">
            Sin datos de referrers
          </div>
        )}
      </div>
    </div>
  )
}
