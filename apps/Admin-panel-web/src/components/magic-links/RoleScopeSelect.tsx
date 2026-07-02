"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { MagicLinkRole } from "@/lib/types"

interface ScopeOption {
  id: string
  label: string
}

const scopeOptions: Record<MagicLinkRole, ScopeOption[]> = {
  admin: [
    { id: "global", label: "Global" },
    { id: "system", label: "Sistema" },
  ],
  brand_manager: [
    { id: "brand-001", label: "Savanhi" },
    { id: "brand-002", label: "Nexus" },
    { id: "brand-003", label: "Corp Brand A" },
  ],
  tendero: [
    { id: "shop-001", label: "Tienda Centro" },
    { id: "shop-002", label: "Tienda Norte" },
    { id: "shop-003", label: "Tienda Sur" },
  ],
  delivery: [
    { id: "zone-001", label: "Zona Urbana" },
    { id: "zone-002", label: "Zona Rural" },
    { id: "zone-003", label: "Zona Mixta" },
  ],
}

const roleLabels: Record<MagicLinkRole, string> = {
  admin: "Admin",
  brand_manager: "Brand Manager",
  tendero: "Tendero",
  delivery: "Delivery",
}

interface RoleScopeSelectProps {
  role: MagicLinkRole | null
  scope: string
  onRoleChange: (role: MagicLinkRole) => void
  onScopeChange: (scope: string, scopeId: string) => void
  roleError?: string
  scopeError?: string
}

function RoleScopeSelect({
  role,
  scope,
  onRoleChange,
  onScopeChange,
  roleError,
  scopeError,
}: RoleScopeSelectProps) {
  const options = role ? scopeOptions[role] : []

  const handleRoleChange = (value: string) => {
    onRoleChange(value as MagicLinkRole)
    onScopeChange("", "")
  }

  const handleScopeChange = (value: string) => {
    const option = options.find((opt) => opt.label === value)
    onScopeChange(value, option?.id ?? value)
  }

  return (
    <div data-slot="role-scope-select" className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role-select">Rol / tipo de acceso</Label>
        <Select value={role ?? ""} onValueChange={handleRoleChange}>
          <SelectTrigger
            id="role-select"
            className="w-full"
            aria-invalid={!!roleError}
          >
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(roleLabels) as MagicLinkRole[]).map((key) => (
              <SelectItem key={key} value={key}>
                {roleLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {roleError && (
          <p className="text-sm text-destructive" role="alert">
            {roleError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="scope-select">Scope específico</Label>
        <Select
          value={scope}
          onValueChange={handleScopeChange}
          disabled={!role}
        >
          <SelectTrigger
            id="scope-select"
            className="w-full"
            aria-invalid={!!scopeError}
          >
            <SelectValue
              placeholder={
                role ? "Seleccionar scope" : "Selecciona un rol primero"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {scopeError && (
          <p className="text-sm text-destructive" role="alert">
            {scopeError}
          </p>
        )}
      </div>
    </div>
  )
}

export { RoleScopeSelect }
export type { RoleScopeSelectProps }
