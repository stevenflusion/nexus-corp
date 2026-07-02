"use client"

import { useTheme } from "@/hooks/use-theme"
import { MonitorIcon, MoonIcon, SunIcon, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const options = [
  {
    value: "system" as const,
    label: "Sistema",
    description: "Usa la configuración de tu dispositivo",
    icon: MonitorIcon,
  },
  {
    value: "light" as const,
    label: "Claro",
    description: "Tema claro siempre activo",
    icon: SunIcon,
  },
  {
    value: "dark" as const,
    label: "Oscuro",
    description: "Tema oscuro siempre activo",
    icon: MoonIcon,
  },
]

export default function TemaPage() {
  const { mode, setMode } = useTheme()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-bold">Tema</h1>
        <p className="text-sm text-muted-foreground">
          Elige cómo se ve la interfaz
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {options.map((opt) => {
          const isActive = mode === opt.value

          return (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={cn(
                "relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all hover:bg-muted/50",
                isActive
                  ? "border-primary bg-muted"
                  : "border-border"
              )}
            >
              {isActive && (
                <CheckIcon className="absolute right-4 top-4 size-5 text-primary" />
              )}
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <opt.icon className="size-5" />
              </div>
              <div>
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-muted-foreground">
                  {opt.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}