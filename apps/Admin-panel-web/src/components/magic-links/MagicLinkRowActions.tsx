"use client"

import {
  EyeIcon,
  CopyIcon,
  SendIcon,
  CalendarClockIcon,
  CopyPlusIcon,
  BanIcon,
  MoreHorizontalIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MagicLink } from "@/lib/types"

interface MagicLinkRowActionsProps {
  link: MagicLink
  onAction: (action: string, link: MagicLink) => void
}

function MagicLinkRowActions({ link, onAction }: MagicLinkRowActionsProps) {
  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation()

    try {
      await navigator.clipboard.writeText(link.url)
      toast.success("Link copiado al portapapeles")
    } catch {
      toast.error("No se pudo copiar el link")
    }

    onAction("copy", link)
  }

  const isActive = link.status === "active"
  const isUsed = link.status === "used"
  const isExpired = link.status === "expired"
  const isRevoked = link.status === "revoked"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-slot="magic-link-row-actions-trigger"
          variant="ghost"
          size="icon-sm"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontalIcon />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-slot="magic-link-row-actions-view"
          onClick={(event) => {
            event.stopPropagation()
            onAction("view", link)
          }}
        >
          <EyeIcon />
          Ver detalle
        </DropdownMenuItem>

        <DropdownMenuItem
          data-slot="magic-link-row-actions-copy"
          onClick={handleCopy}
        >
          <CopyIcon />
          Copiar link
        </DropdownMenuItem>

        {(isActive || isUsed) && (
          <DropdownMenuItem
            data-slot="magic-link-row-actions-resend"
            onClick={(event) => {
              event.stopPropagation()
              onAction("resend", link)
            }}
          >
            <SendIcon />
            Reenviar
          </DropdownMenuItem>
        )}

        {isActive && (
          <DropdownMenuItem
            data-slot="magic-link-row-actions-extend"
            onClick={(event) => {
              event.stopPropagation()
              onAction("extend", link)
            }}
          >
            <CalendarClockIcon />
            Extender expiración
          </DropdownMenuItem>
        )}

        {(isExpired || isRevoked) && (
          <DropdownMenuItem
            data-slot="magic-link-row-actions-duplicate"
            onClick={(event) => {
              event.stopPropagation()
              onAction("duplicate", link)
            }}
          >
            <CopyPlusIcon />
            Duplicar configuración
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {isActive && (
          <DropdownMenuItem
            data-slot="magic-link-row-actions-revoke"
            variant="destructive"
            onClick={(event) => {
              event.stopPropagation()
              onAction("revoke", link)
            }}
          >
            <BanIcon className={cn("text-destructive")} />
            Revocar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { MagicLinkRowActions }
export type { MagicLinkRowActionsProps }
