"use client"

import * as React from "react"
import { format, startOfDay } from "date-fns"
import { CalendarIcon, ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { ExpirationType } from "@/lib/types"

interface ExpirationSelectorProps {
  value: {
    type: ExpirationType
    relativeHours?: number
    absoluteDate?: string
  }
  onChange: (value: {
    type: ExpirationType
    relativeHours?: number
    absoluteDate?: string
  }) => void
  error?: string
}

const presets = [
  { label: "1 hora", hours: 1 },
  { label: "24 horas", hours: 24 },
  { label: "7 días", hours: 168 },
  { label: "30 días", hours: 720 },
]

function ExpirationSelector({ value, onChange, error }: ExpirationSelectorProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value.absoluteDate ? new Date(value.absoluteDate) : undefined
  )
  const [time, setTime] = React.useState<string>(
    value.absoluteDate ? format(new Date(value.absoluteDate), "HH:mm") : "23:59"
  )
  const [calendarOpen, setCalendarOpen] = React.useState(false)

  const updateAbsoluteDate = (nextDate: Date | undefined, nextTime: string) => {
    if (!nextDate) {
      onChange({ type: "absolute", absoluteDate: undefined })
      return
    }
    const [hours, minutes] = nextTime.split(":").map(Number)
    const combined = new Date(nextDate)
    combined.setHours(hours ?? 0, minutes ?? 0, 0, 0)
    onChange({ type: "absolute", absoluteDate: combined.toISOString() })
  }

  const handleTypeChange = (type: ExpirationType) => {
    if (type === "relative") {
      onChange({ type, relativeHours: value.relativeHours ?? 24 })
    } else {
      onChange({ type, absoluteDate: value.absoluteDate })
    }
  }

  const handlePresetClick = (hours: number) => {
    onChange({ type: "relative", relativeHours: hours })
  }

  const handleCustomHoursChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const raw = event.target.value
    if (raw === "") {
      onChange({ type: "relative", relativeHours: undefined })
      return
    }
    const parsed = Number.parseInt(raw, 10)
    onChange({
      type: "relative",
      relativeHours: Number.isNaN(parsed) ? undefined : Math.max(1, parsed),
    })
  }

  const handleDateSelect = (selected: Date | undefined) => {
    setDate(selected)
    setCalendarOpen(false)
    updateAbsoluteDate(selected, time)
  }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = event.target.value
    setTime(nextTime)
    updateAbsoluteDate(date, nextTime)
  }

  const isCustomRelative =
    value.type === "relative" &&
    value.relativeHours !== undefined &&
    !presets.some((preset) => preset.hours === value.relativeHours)

  return (
    <div data-slot="expiration-selector" className="flex flex-col gap-3">
      <RadioGroup
        value={value.type}
        onValueChange={(val) => handleTypeChange(val as ExpirationType)}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem
            value="relative"
            id="exp-relative"
            aria-invalid={!!error}
          />
          <Label htmlFor="exp-relative" className="font-normal text-foreground">
            Relativa
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem
            value="absolute"
            id="exp-absolute"
            aria-invalid={!!error}
          />
          <Label htmlFor="exp-absolute" className="font-normal text-foreground">
            Fecha exacta
          </Label>
        </div>
      </RadioGroup>

      {value.type === "relative" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const active = value.relativeHours === preset.hours
              return (
                <Button
                  key={preset.hours}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(preset.hours)}
                >
                  {preset.label}
                </Button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={isCustomRelative ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onChange({
                  type: "relative",
                  relativeHours: isCustomRelative
                    ? value.relativeHours
                    : presets[presets.length - 1].hours + 1,
                })
              }
            >
              Personalizado
            </Button>
            {isCustomRelative && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={value.relativeHours ?? ""}
                  onChange={handleCustomHoursChange}
                  placeholder="Horas"
                  className="w-24"
                  aria-invalid={!!error}
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
            )}
          </div>
        </div>
      )}

      {value.type === "absolute" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-date">Fecha</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  id="exp-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal sm:w-48",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon />
                  {date ? format(date, "dd/MM/yyyy") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  disabled={{ before: startOfDay(new Date()) }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-time">Hora</Label>
            <div className="relative">
              <ClockIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="exp-time"
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="w-full pl-9 sm:w-32"
                aria-invalid={!!error}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export { ExpirationSelector }
export type { ExpirationSelectorProps }
