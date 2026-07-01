"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { UsageLimitType } from "@/lib/types"

interface UsageLimitInputProps {
  value: { type: UsageLimitType; count: number | null }
  onChange: (value: { type: UsageLimitType; count: number | null }) => void
  error?: string
}

const options: { value: UsageLimitType; label: string }[] = [
  { value: "single", label: "Un solo uso" },
  { value: "unlimited", label: "Ilimitado" },
  { value: "specific", label: "Número específico" },
]

function UsageLimitInput({ value, onChange, error }: UsageLimitInputProps) {
  const handleTypeChange = (type: UsageLimitType) => {
    onChange({
      type,
      count: type === "specific" ? (value.count ?? 1) : null,
    })
  }

  const handleCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    if (raw === "") {
      onChange({ ...value, count: null })
      return
    }
    const parsed = Number.parseInt(raw, 10)
    onChange({ ...value, count: Number.isNaN(parsed) ? null : Math.max(1, parsed) })
  }

  return (
    <div data-slot="usage-limit-input" className="flex flex-col gap-3">
      <RadioGroup
        value={value.type}
        onValueChange={(val) => handleTypeChange(val as UsageLimitType)}
        className="flex flex-col gap-2"
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem
              value={option.value}
              id={`usage-${option.value}`}
              aria-invalid={!!error}
            />
            <Label
              htmlFor={`usage-${option.value}`}
              className="font-normal text-foreground"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {value.type === "specific" && (
        <Input
          type="number"
          min={1}
          value={value.count ?? ""}
          onChange={handleCountChange}
          placeholder="Cantidad"
          aria-invalid={!!error}
          className="w-32"
        />
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export { UsageLimitInput }
export type { UsageLimitInputProps }
