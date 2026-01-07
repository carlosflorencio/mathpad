import { useState, useCallback, useRef } from "react"
import { Note } from "@/lib/notes/Note"

export interface NoteRenameParams {
  notes: Note[]
  renameNote: (noteId: string, newName: string) => void
  showToast: (message: string) => void
}

/**
 * Handle inline note renaming state
 */
export function useNoteRename({ notes, renameNote, showToast }: NoteRenameParams) {
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const renameBlurEnabledRef = useRef(false)

  const startRename = useCallback((noteId: string, currentName: string) => {
    renameBlurEnabledRef.current = false
    setRenamingNoteId(noteId)
    setRenameValue(currentName)
    // Enable blur after a short delay to prevent immediate blur
    setTimeout(() => {
      renameBlurEnabledRef.current = true
    }, 100)
  }, [])

  const finishRename = useCallback(() => {
    if (!renameBlurEnabledRef.current) {
      return
    }

    if (renamingNoteId && renameValue.trim()) {
      const note = notes.find((n) => n.id === renamingNoteId)
      const newName = renameValue.trim()

      // Only rename and show toast if the name actually changed
      if (note && note.name !== newName) {
        renameNote(renamingNoteId, newName)
        showToast("Note renamed")
      }
    }
    setRenamingNoteId(null)
    setRenameValue("")
  }, [renamingNoteId, renameValue, renameNote, showToast, notes])

  const cancelRename = useCallback(() => {
    setRenamingNoteId(null)
    setRenameValue("")
  }, [])

  return {
    renamingNoteId,
    renameValue,
    setRenameValue,
    startRename,
    finishRename,
    cancelRename,
  }
}
