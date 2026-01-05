import { useState, useEffect, useRef } from "react"
import { Note } from "@/lib/notes/Note"

export type Action = {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  handler: () => void
  keywords?: string[]
}

interface QuickActionPaletteProps {
  isOpen: boolean
  onClose: () => void
  actions: Action[]
  notes: Note[]
  activeNoteId: string
  onSwitchNote: (noteId: string) => void
}

export function QuickActionPalette({
  isOpen,
  onClose,
  actions,
  notes,
  activeNoteId,
  onSwitchNote,
}: QuickActionPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Combine actions and notes into searchable items
  const allItems = [
    ...actions.map((action) => ({
      type: "action" as const,
      id: action.id,
      label: action.label,
      description: action.description,
      icon: action.icon,
      handler: action.handler,
      searchText: `${action.label} ${action.keywords?.join(" ") || ""}`.toLowerCase(),
    })),
    ...notes.map((note) => ({
      type: "note" as const,
      id: note.id,
      label: note.name,
      description: note.id === activeNoteId ? "Current note" : undefined,
      icon: (
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
      ),
      handler: () => onSwitchNote(note.id),
      searchText: note.name.toLowerCase(),
    })),
  ]

  // Filter items based on query
  const filteredItems = query
    ? allItems.filter((item) => item.searchText.includes(query.toLowerCase()))
    : allItems

  // Ensure selected index is within bounds
  const safeSelectedIndex = Math.min(selectedIndex, filteredItems.length - 1)

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
      const container = scrollContainerRef.current
      const elementTop = selectedElement.offsetTop
      const elementBottom = elementTop + selectedElement.offsetHeight
      const containerTop = container.scrollTop
      const containerBottom = containerTop + container.clientHeight

      if (elementBottom > containerBottom) {
        // Scroll down to show the item
        container.scrollTop = elementBottom - container.clientHeight
      } else if (elementTop < containerTop) {
        // Scroll up to show the item
        container.scrollTop = elementTop
      }
    }
  }, [safeSelectedIndex])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredItems[safeSelectedIndex]) {
          filteredItems[safeSelectedIndex].handler()
          onClose()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredItems, safeSelectedIndex, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" style={{ maxWidth: "600px", padding: "0" }}>
        <div className="p-4 border-b border-[var(--ui-border-color)]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions and notes..."
            className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] outline-none focus:border-[var(--text-muted)]"
          />
        </div>

        <div ref={scrollContainerRef} className="max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No results found</div>
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
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-4 py-3 cursor-pointer flex items-center gap-3 ${
                    index === safeSelectedIndex ? "bg-[var(--bg-button-hover)]" : ""
                  }`}
                >
                  {item.icon && (
                    <div className="flex-shrink-0 text-[var(--text-muted)]">{item.icon}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--text-color)] truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.type === "note" && item.id === activeNoteId && (
                    <div className="text-xs text-[var(--text-muted)]">•</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[var(--ui-border-color)] text-xs text-[var(--text-muted)] flex gap-4">
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
            Select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
              Esc
            </kbd>{" "}
            Close
          </span>
        </div>
      </div>
    </>
  )
}
