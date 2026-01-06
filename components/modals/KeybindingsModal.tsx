import { getModifierKey } from "@/hooks/useKeyBindings"

interface KeybindingsModalProps {
  onClose: () => void
}

type KeyBinding = {
  keys: string
  description: string
  category: string
}

export function KeybindingsModal({ onClose }: KeybindingsModalProps) {
  const modKey = getModifierKey()

  const keybindings: KeyBinding[] = [
    // Navigation
    {
      keys: `${modKey}+K`,
      description: "Open quick action palette",
      category: "Navigation",
    },
    {
      keys: `${modKey}+N`,
      description: "Create new note",
      category: "Notes",
    },
    {
      keys: "Esc",
      description: "Close dialogs and cancel operations",
      category: "Navigation",
    },

    // Editor
    {
      keys: `${modKey}+S`,
      description: "Save note (auto-saves continuously)",
      category: "Editor",
    },

    // Quick Actions (via Cmd+K)
    {
      keys: "Type to search",
      description: "Find actions and switch notes",
      category: "Quick Actions",
    },
    {
      keys: "↑ ↓",
      description: "Navigate suggestions",
      category: "Quick Actions",
    },
    {
      keys: "Enter",
      description: "Select action or note",
      category: "Quick Actions",
    },
  ]

  // Group by category
  const categories = ["Navigation", "Notes", "Editor", "Quick Actions"]
  const groupedBindings = categories.map((category) => ({
    category,
    bindings: keybindings.filter((kb) => kb.category === category),
  }))

  return (
    <div className="modal">
      <h2 className="text-lg mb-4">Keyboard Shortcuts</h2>

      <div className="space-y-6">
        {groupedBindings.map(
          ({ category, bindings }) =>
            bindings.length > 0 && (
              <div key={category}>
                <h3 className="font-semibold text-[var(--text-color)] mb-3">{category}</h3>
                <div className="space-y-2">
                  {bindings.map((binding, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded hover:bg-[var(--bg-button-hover)]"
                    >
                      <span className="text-sm text-[var(--text-color)]">
                        {binding.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs bg-[var(--bg-input)] text-[var(--text-muted)] rounded border border-[var(--ui-border-color)] font-mono">
                        {binding.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}
      </div>

      <div className="bg-[var(--bg-input)] p-3 rounded mt-6">
        <p className="text-sm text-[var(--text-muted)]">
          <strong>Tip:</strong> Press{" "}
          <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
            {modKey}+K
          </kbd>{" "}
          to access all actions and notes quickly!
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          <strong>Note:</strong> Some browsers may override {modKey}+N at the system
          level. Use {modKey}+K → &quot;New Note&quot; as an alternative.
        </p>
      </div>

      <div className="flex justify-end mt-4">
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
