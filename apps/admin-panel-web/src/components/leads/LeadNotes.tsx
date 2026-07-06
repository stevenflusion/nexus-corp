"use client"

import * as React from "react"
import { Trash2Icon, PencilIcon, CheckIcon, XIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { LeadNote } from "@/lib/types"
import {
  createLeadNote,
  updateLeadNote,
  deleteLeadNote,
} from "@/lib/leads"

interface LeadNotesProps {
  leadId: number
  notes: LeadNote[]
  onNotesChange: (notes: LeadNote[]) => void
  onDeleteRequest: (onConfirm: () => void) => void
}

function LeadNotes({ leadId, notes, onNotesChange, onDeleteRequest }: LeadNotesProps) {
  const [isCreating, setIsCreating] = React.useState(false)
  const [newManager, setNewManager] = React.useState("")
  const [newNote, setNewNote] = React.useState("")
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editManager, setEditManager] = React.useState("")
  const [editNote, setEditNote] = React.useState("")

  const handleCreate = async () => {
    if (!newManager.trim() || !newNote.trim()) {
      toast.error("Completá el autor y la nota")
      return
    }

    try {
      const created = await createLeadNote({
        manager_lead_notes: newManager.trim(),
        note_lead_notes: newNote.trim(),
        id_leads: leadId,
      })
      onNotesChange([created, ...notes])
      setIsCreating(false)
      setNewManager("")
      setNewNote("")
      toast.success("Nota creada")
    } catch {
      toast.error("No se pudo crear la nota")
    }
  }

  const handleUpdate = async (id: number) => {
    if (!editManager.trim() || !editNote.trim()) {
      toast.error("Completá el autor y la nota")
      return
    }

    try {
      const updated = await updateLeadNote(id, {
        manager_lead_notes: editManager.trim(),
        note_lead_notes: editNote.trim(),
      })
      onNotesChange(notes.map((n) => (n.id_lead_notes === id ? updated : n)))
      setEditingId(null)
      toast.success("Nota actualizada")
    } catch {
      toast.error("No se pudo actualizar la nota")
    }
  }

  const handleDelete = (note: LeadNote) => {
    onDeleteRequest(async () => {
      try {
        await deleteLeadNote(note.id_lead_notes)
        onNotesChange(notes.filter((n) => n.id_lead_notes !== note.id_lead_notes))
        toast.success("Nota eliminada")
      } catch {
        toast.error("No se pudo eliminar la nota")
      }
    })
  }

  const startEdit = (note: LeadNote) => {
    setEditingId(note.id_lead_notes)
    setEditManager(note.manager_lead_notes)
    setEditNote(note.note_lead_notes)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditManager("")
    setEditNote("")
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Notas</h4>
        {!isCreating && (
          <Button
            data-slot="lead-notes-add"
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            <PlusIcon className="size-4" />
            Agregar nota
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3">
          <Input
            data-slot="lead-notes-new-manager"
            placeholder="Autor"
            value={newManager}
            onChange={(e) => setNewManager(e.target.value)}
          />
          <Textarea
            data-slot="lead-notes-new-text"
            placeholder="Escribí una nota..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreating(false)
                setNewManager("")
                setNewNote("")
              }}
            >
              <XIcon className="size-4" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <CheckIcon className="size-4" />
              Guardar
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay notas para este lead.
          </p>
        ) : (
          notes.map((note, index) => (
            <React.Fragment key={note.id_lead_notes}>
              {index > 0 && <Separator />}
              <div className="flex flex-col gap-2 py-1">
                {editingId === note.id_lead_notes ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      data-slot="lead-notes-edit-manager"
                      value={editManager}
                      onChange={(e) => setEditManager(e.target.value)}
                    />
                    <Textarea
                      data-slot="lead-notes-edit-text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                      >
                        <XIcon className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(note.id_lead_notes)}
                      >
                        <CheckIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {note.manager_lead_notes}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          data-slot="lead-notes-edit"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          onClick={() => startEdit(note)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          data-slot="lead-notes-delete"
                          variant="ghost"
                          size="icon-sm"
                          className={cn(
                            "size-7 text-destructive",
                            "hover:bg-destructive/10 hover:text-destructive"
                          )}
                          onClick={() => handleDelete(note)}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.note_lead_notes}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))
        )}
      </div>
    </section>
  )
}

export { LeadNotes }
export type { LeadNotesProps }
