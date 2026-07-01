"use client"

import { MonitorIcon, MoonIcon, SunIcon, CheckIcon } from "lucide-react"
import {
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/hooks/use-theme"

const options = [
  { value: "system", label: "Sistema", icon: MonitorIcon },
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Oscuro", icon: MoonIcon },
] as const

export function ThemeSelector() {
  const { mode, setMode } = useTheme()
  const current = options.find((o) => o.value === mode) ?? options[0]

  return (
    <SidebarMenuSubItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuSubButton asChild>
            <button type="button">
              <current.icon className="size-4" />
              <span>Tema</span>
            </button>
          </SidebarMenuSubButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-40">
          {options.map((opt) => (
            <DropdownMenuItem key={opt.value} onClick={() => setMode(opt.value)}>
              <opt.icon className="size-4" />
              <span>{opt.label}</span>
              {mode === opt.value && <CheckIcon className="ml-auto size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuSubItem>
  )
}