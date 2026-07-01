"use client"

import * as React from "react"
import { CopyIcon, CheckIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CopyableLinkFieldProps {
  url: string
  label?: string
}

function CopyableLinkField({ url, label }: CopyableLinkFieldProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copiado al portapapeles")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar el link")
    }
  }

  return (
    <div
      data-slot="copyable-link-field"
      className={cn("flex flex-col gap-1.5", !label && "w-full")}
    >
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={url}
          className="flex-1 bg-muted/30 font-mono text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={handleCopy}
          aria-label={copied ? "Copiado" : "Copiar link"}
          className="shrink-0"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
    </div>
  )
}

export { CopyableLinkField }
export type { CopyableLinkFieldProps }
