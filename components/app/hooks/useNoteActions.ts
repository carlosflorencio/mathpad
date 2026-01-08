import { useCallback } from "react"

export interface NoteActionsParams {
  createNote: () => void
  renameNote: (noteId: string, newName: string) => void
  deleteNote: (noteId: string) => void
  shareNote: () => string | null
  showToast: (message: string) => void
  setShowShareModal: (show: boolean) => void
  setShareUrl: (url: string) => void
}

/**
 * Encapsulates note-related actions with toast integration
 */
export function useNoteActions({
  createNote,
  renameNote,
  deleteNote,
  shareNote,
  showToast,
  setShowShareModal,
  setShareUrl,
}: NoteActionsParams) {
  const handleCreateNote = useCallback(() => {
    createNote()
    showToast("New note created")
  }, [createNote, showToast])

  const handleRenameNote = useCallback(
    (noteId: string, newName: string) => {
      renameNote(noteId, newName)
      showToast("Note renamed")
    },
    [renameNote, showToast]
  )

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      deleteNote(noteId)
      showToast("Note deleted")
    },
    [deleteNote, showToast]
  )

  const handleShare = useCallback(() => {
    const url = shareNote()
    if (url) {
      navigator.clipboard.writeText(url)
      setShareUrl(url)
      setShowShareModal(true)
      showToast("Link copied to clipboard")
    }
  }, [shareNote, showToast, setShareUrl, setShowShareModal])

  return {
    handleCreateNote,
    handleRenameNote,
    handleDeleteNote,
    handleShare,
  }
}
