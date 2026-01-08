import { useState, useEffect, useRef } from "react"
import { Note } from "@/lib/notes/Note"

interface NoteSelectorProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  activeNoteId: string
  onSwitchNote: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
}

export function NoteSelector({
  isOpen,
  onClose,
  notes,
  activeNoteId,
  onSwitchNote,
  onDeleteNote,
}: NoteSelectorProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isKeyboardNavigatingRef = useRef(false)

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    noteId: string
    noteName: string
    originalIndex: number
  } | null>(null)
  const [confirmChoice, setConfirmChoice] = useState(0) // 0 = Yes, 1 = No
  const justExitedConfirmationRef = useRef(false)

  // Convert notes to searchable items
  const noteItems = notes.map((note) => ({
    id: note.id,
    label: note.name,
    description: note.id === activeNoteId ? "Current note" : undefined,
    handler: () => {
      // Only switch if selecting a different note
      if (note.id !== activeNoteId) {
        onSwitchNote(note.id)
      }
    },
    searchText: note.name.toLowerCase(),
  }))

  // Filter items based on query
  const filteredItems = query
    ? noteItems.filter((item) => item.searchText.includes(query.toLowerCase()))
    : noteItems

  // Ensure selected index is within bounds
  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, filteredItems.length - 1))

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Reset index when query changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0)
  }, [query])

  // Auto-scroll selected item into view
  useEffect(() => {
    if (itemRefs.current[safeSelectedIndex] && scrollContainerRef.current) {
      const selectedElement = itemRefs.current[safeSelectedIndex]
      selectedElement.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      })
    }
  }, [safeSelectedIndex])

  // Scroll to selected item after exiting delete confirmation
  useEffect(() => {
    if (justExitedConfirmationRef.current && !deleteConfirmation) {
      justExitedConfirmationRef.current = false
      setTimeout(() => {
        if (itemRefs.current[safeSelectedIndex] && scrollContainerRef.current) {
          const selectedElement = itemRefs.current[safeSelectedIndex]
          selectedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          })
        }
      }, 0)
    }
  }, [deleteConfirmation, safeSelectedIndex])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle delete confirmation mode
      if (deleteConfirmation) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault()
          setConfirmChoice((prev) => (prev === 0 ? 1 : 0))
        } else if (e.key === "Enter") {
          e.preventDefault()
          if (confirmChoice === 0) {
            // Yes - delete the note, keep selector open, and select next item
            onDeleteNote(deleteConfirmation.noteId)

            // Calculate the next selection index
            const nextIndex =
              deleteConfirmation.originalIndex >= filteredItems.length - 1
                ? Math.max(0, deleteConfirmation.originalIndex - 1)
                : deleteConfirmation.originalIndex

            setSelectedIndex(nextIndex)
            justExitedConfirmationRef.current = true
            setDeleteConfirmation(null)
            setConfirmChoice(0)
          } else {
            // No - cancel and restore focus to the original item
            setSelectedIndex(deleteConfirmation.originalIndex)
            justExitedConfirmationRef.current = true
            setDeleteConfirmation(null)
            setConfirmChoice(0)
          }
        } else if (e.key === "Escape") {
          e.preventDefault()
          setSelectedIndex(deleteConfirmation.originalIndex)
          justExitedConfirmationRef.current = true
          setDeleteConfirmation(null)
          setConfirmChoice(0)
        }
        return
      }

      // Normal navigation mode
      if (e.key === "ArrowDown") {
        e.preventDefault()
        isKeyboardNavigatingRef.current = true
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        isKeyboardNavigatingRef.current = true
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredItems[safeSelectedIndex]) {
          filteredItems[safeSelectedIndex].handler()
          onClose()
        }
      } else if (e.key === "d" && e.ctrlKey) {
        e.preventDefault()
        const selectedItem = filteredItems[safeSelectedIndex]
        if (selectedItem) {
          setDeleteConfirmation({
            noteId: selectedItem.id,
            noteName: selectedItem.label,
            originalIndex: safeSelectedIndex,
          })
          setConfirmChoice(0)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredItems, safeSelectedIndex, onClose, deleteConfirmation, confirmChoice, onDeleteNote])

  if (!isOpen) return null

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" style={{ padding: "0" }}>
        <div className="p-4 border-b border-[var(--ui-border-color)]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] outline-none focus:border-[var(--text-muted)]"
          />
        </div>

        <div ref={scrollContainerRef} className="max-h-96 overflow-y-auto">
          {deleteConfirmation ? (
            <div className="p-6">
              <div className="text-[var(--text-color)] mb-4 text-center">
                Delete &quot;{deleteConfirmation.noteName}&quot;?
              </div>
              <div className="flex gap-3 justify-center">
                <div
                  className={`px-6 py-2 cursor-pointer rounded border ${
                    confirmChoice === 0
                      ? "bg-[var(--bg-button-hover)] border-[var(--text-color)]"
                      : "border-[var(--ui-border-color)]"
                  }`}
                  onClick={() => {
                    onDeleteNote(deleteConfirmation.noteId)
                    const nextIndex =
                      deleteConfirmation.originalIndex >= filteredItems.length - 1
                        ? Math.max(0, deleteConfirmation.originalIndex - 1)
                        : deleteConfirmation.originalIndex
                    setSelectedIndex(nextIndex)
                    justExitedConfirmationRef.current = true
                    setDeleteConfirmation(null)
                    setConfirmChoice(0)
                  }}
                  onMouseEnter={() => setConfirmChoice(0)}
                >
                  <span className="text-[var(--text-color)]">Yes</span>
                </div>
                <div
                  className={`px-6 py-2 cursor-pointer rounded border ${
                    confirmChoice === 1
                      ? "bg-[var(--bg-button-hover)] border-[var(--text-color)]"
                      : "border-[var(--ui-border-color)]"
                  }`}
                  onClick={() => {
                    setSelectedIndex(deleteConfirmation.originalIndex)
                    justExitedConfirmationRef.current = true
                    setDeleteConfirmation(null)
                    setConfirmChoice(0)
                  }}
                  onMouseEnter={() => setConfirmChoice(1)}
                >
                  <span className="text-[var(--text-color)]">No</span>
                </div>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No notes found</div>
          ) : (
            <div className="py-2">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  onClick={() => {
                    item.handler()
                    onClose()
                  }}
                  onMouseMove={() => {
                    // Skip first mouse move after keyboard navigation to prevent
                    // accidental selection change when scroll moves items under cursor
                    if (isKeyboardNavigatingRef.current) {
                      isKeyboardNavigatingRef.current = false
                      return
                    }
                    if (index !== safeSelectedIndex) {
                      setSelectedIndex(index)
                    }
                  }}
                  className={`px-4 py-3 cursor-pointer flex items-center gap-3 ${
                    index === safeSelectedIndex ? "bg-[var(--bg-button-hover)]" : ""
                  }`}
                >
                  <div className="flex-shrink-0 text-[var(--text-muted)]">
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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--text-color)] truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.id === activeNoteId && (
                    <div className="text-xs text-[var(--text-muted)]">•</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[var(--ui-border-color)] text-xs text-[var(--text-muted)] flex gap-4">
          {deleteConfirmation ? (
            <>
              <span>
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
                  ←→
                </kbd>{" "}
                Choose
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
                  Enter
                </kbd>{" "}
                Confirm
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
                  Esc
                </kbd>{" "}
                Cancel
              </span>
            </>
          ) : (
            <>
              <span>
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
                  ↑↓
                </kbd>{" "}
                Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
                  Enter
                </kbd>{" "}
                Open
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
                  Ctrl+D
                </kbd>{" "}
                Delete
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
                  Esc
                </kbd>{" "}
                Close
              </span>
            </>
          )}
        </div>
      </div>
    </>
  )
}
