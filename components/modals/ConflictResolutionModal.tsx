import { ShareData } from "@/lib/notes/types"

interface ConflictResolutionModalProps {
  conflictData: ShareData
  onResolve: (action: "replace" | "keep-both" | "cancel") => void
}

export function ConflictResolutionModal({ conflictData, onResolve }: ConflictResolutionModalProps) {
  return (
    <div className="modal">
      <h2 className="text-lg mb-4">Note Already Exists</h2>
      <p className="mb-4">
        Note &quot;{conflictData.n || "Untitled"}&quot; already exists with different content.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onResolve("cancel")}
          className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onResolve("keep-both")}
          className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
        >
          Keep Both
        </button>
        <button
          onClick={() => onResolve("replace")}
          className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
        >
          Replace
        </button>
      </div>
    </div>
  )
}
