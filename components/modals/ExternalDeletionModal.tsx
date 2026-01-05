import { Note } from "@/lib/notes/Note"

interface ExternalDeletionModalProps {
  pendingDeletions: Note[]
  onConfirm: () => void
  onCancel: () => void
}

export function ExternalDeletionModal({
  pendingDeletions,
  onConfirm,
  onCancel,
}: ExternalDeletionModalProps) {
  return (
    <div className="modal">
      <h2 className="text-lg mb-4">Notes Deleted Externally</h2>
      <p className="mb-4">{pendingDeletions.length} note(s) were deleted from the synced folder:</p>
      <ul className="mb-4 space-y-1 max-h-48 overflow-y-auto">
        {pendingDeletions.map((note) => (
          <li key={note.id} className="text-[var(--text-muted)]">
            • {note.name}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
        >
          Keep in App
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-red-500 hover:bg-[var(--bg-button-hover)] rounded"
        >
          Remove from App
        </button>
      </div>
    </div>
  )
}
