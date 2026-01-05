import { Note } from "@/lib/notes/Note"
import { useCallback, useRef, useState } from "react"

interface ManageNotesModalProps {
  notes: Note[]
  activeNote: Note
  onClose: () => void
  onRename: (noteId: string, newName: string) => void
  onDelete: (noteId: string) => void
}

export function ManageNotesModal({
  notes,
  activeNote,
  onClose,
  onRename,
  onDelete,
}: ManageNotesModalProps) {
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
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

      // Only rename if the name actually changed
      if (note && note.name !== newName) {
        onRename(renamingNoteId, newName)
      }
    }
    setRenamingNoteId(null)
    setRenameValue("")
  }, [renamingNoteId, renameValue, onRename, notes])

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      if (deleteConfirmId === noteId) {
        // Confirmed, delete it
        onDelete(noteId)
        setDeleteConfirmId(null)
      } else {
        // Show confirmation
        setDeleteConfirmId(noteId)
        setTimeout(() => setDeleteConfirmId(null), 3000) // Reset after 3s
      }
    },
    [deleteConfirmId, onDelete]
  )

  return (
    <div className="modal" style={{ maxWidth: "500px" }}>
      <h2 className="text-lg mb-4">Manage Notes</h2>
      <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
        {notes.map((note) => {
          return (
            <div
              key={note.id}
              className="flex items-center gap-2 p-2 rounded hover:bg-[var(--bg-button-hover)]"
            >
              {renamingNoteId === note.id ? (
                <>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") finishRename()
                      if (e.key === "Escape") setRenamingNoteId(null)
                    }}
                    onBlur={finishRename}
                    className="flex-1 px-2 py-1 bg-[var(--bg-input)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] cursor-text outline-none focus:border-[var(--text-muted)]"
                    ref={(input) => {
                      if (input) {
                        setTimeout(() => input.focus(), 0)
                      }
                    }}
                  />
                  {notes.length > 1 && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="px-2 py-1 text-[var(--text-muted)] hover:text-red-500 border border-[var(--ui-border-color)] rounded cursor-pointer hover:border-red-500"
                      title={deleteConfirmId === note.id ? "Click again to confirm" : "Delete"}
                    >
                      {deleteConfirmId === note.id ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span
                    className="flex-1 text-[var(--text-color)] cursor-text"
                    onClick={(e) => {
                      e.stopPropagation()
                      startRename(note.id, note.name)
                    }}
                    title="Click to rename"
                  >
                    {note.id === activeNote.id && "• "}
                    {note.name}
                  </span>
                  {notes.length > 1 && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="px-2 py-1 text-[var(--text-muted)] hover:text-red-500 border border-[var(--ui-border-color)] rounded cursor-pointer hover:border-red-500"
                      title={deleteConfirmId === note.id ? "Click again to confirm" : "Delete"}
                    >
                      {deleteConfirmId === note.id ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
        >
          Close
        </button>
      </div>
    </div>
  )
}
