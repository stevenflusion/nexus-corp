"use client"

import { AlertTriangleIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  destructive?: boolean
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  destructive = true,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="confirm-dialog" className="sm:max-w-sm">
        <DialogHeader className="gap-4">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              destructive
                ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                : "bg-primary/10 text-primary dark:bg-primary/20"
            )}
          >
            <AlertTriangleIcon className="size-5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="sm:flex-row sm:justify-end">
          <Button
            data-slot="confirm-dialog-cancel"
            variant="outline"
            onClick={() => onOpenChange(false)}
            autoFocus
          >
            {cancelLabel}
          </Button>
          <Button
            data-slot="confirm-dialog-confirm"
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
