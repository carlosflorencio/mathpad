import { getModifierKey } from "@/hooks/useKeyBindings"

interface KeybindingsModalProps {
  onClose: () => void
  vimMode?: boolean
}

type KeyBinding = {
  keys: string
  description: string
  category: string
}

export function KeybindingsModal({ onClose, vimMode = false }: KeybindingsModalProps) {
  const modKey = getModifierKey()

  const keybindings: KeyBinding[] = [
    // Navigation
    {
      keys: `${modKey}+K`,
      description: "Open quick action palette",
      category: "Navigation",
    },
    {
      keys: `${modKey}+M`,
      description: "Toggle menu",
      category: "Navigation",
    },
    {
      keys: "Esc",
      description: "Close dialogs and cancel operations",
      category: "Navigation",
    },

    // Notes
    {
      keys: `${modKey}+N`,
      description: "Create new note",
      category: "Notes",
    },
    {
      keys: `${modKey}+S`,
      description: "Share note (copy link to clipboard)",
      category: "Notes",
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

  const vimKeybindings: KeyBinding[] = [
    // Vim Editor - Navigation
    {
      keys: "h j k l",
      description: "Move cursor left, down, up, right",
      category: "Vim Editor - Navigation",
    },
    {
      keys: "w b",
      description: "Move word forward/backward",
      category: "Vim Editor - Navigation",
    },
    {
      keys: "0 $",
      description: "Move to start/end of line",
      category: "Vim Editor - Navigation",
    },
    {
      keys: "gg G",
      description: "Move to start/end of document",
      category: "Vim Editor - Navigation",
    },

    // Vim Editor - Editing
    {
      keys: "i",
      description: "Enter insert mode before cursor (or focus editor if not focused)",
      category: "Vim Editor - Editing",
    },
    {
      keys: "a",
      description: "Enter insert mode after cursor",
      category: "Vim Editor - Editing",
    },
    {
      keys: "I A",
      description: "Insert at start/end of line",
      category: "Vim Editor - Editing",
    },
    {
      keys: "o O",
      description: "Open new line below/above",
      category: "Vim Editor - Editing",
    },
    {
      keys: "x",
      description: "Delete character under cursor",
      category: "Vim Editor - Editing",
    },
    {
      keys: "dd",
      description: "Delete current line",
      category: "Vim Editor - Editing",
    },
    {
      keys: "yy",
      description: "Copy (yank) current line",
      category: "Vim Editor - Editing",
    },
    {
      keys: "p",
      description: "Paste after cursor",
      category: "Vim Editor - Editing",
    },
    {
      keys: "u",
      description: "Undo",
      category: "Vim Editor - Editing",
    },
    {
      keys: `${modKey}+R`,
      description: "Redo",
      category: "Vim Editor - Editing",
    },

    // Vim Editor - Visual Mode
    {
      keys: "v",
      description: "Enter visual character mode",
      category: "Vim Editor - Visual",
    },
    {
      keys: "V",
      description: "Enter visual line mode",
      category: "Vim Editor - Visual",
    },
    {
      keys: "Esc",
      description: "Exit visual or insert mode (return to normal mode)",
      category: "Vim Editor - Visual",
    },
  ]

  // Group by category
  const categories = vimMode
    ? [
        "Navigation",
        "Notes",
        "Quick Actions",
        "Vim Editor - Navigation",
        "Vim Editor - Editing",
        "Vim Editor - Visual",
      ]
    : ["Navigation", "Notes", "Quick Actions"]

  const allKeybindings = vimMode ? [...keybindings, ...vimKeybindings] : keybindings
  const groupedBindings = categories.map((category) => ({
    category,
    bindings: allKeybindings.filter((kb) => kb.category === category),
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
        {vimMode && (
          <p className="text-sm text-[var(--text-muted)] mt-2">
            <strong>Vim Mode:</strong> Press{" "}
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] rounded border border-[var(--ui-border-color)]">
              i
            </kbd>{" "}
            from anywhere to focus the editor.
          </p>
        )}
        <p className="text-xs text-[var(--text-muted)] mt-2">
          <strong>Note:</strong> Some browsers may override {modKey}+N at the system level. Use{" "}
          {modKey}+K → &quot;New Note&quot; as an alternative.
          {vimMode && (
            <>
              {" "}
              Global shortcuts like {modKey}+K and {modKey}+N work in both normal and insert modes.
            </>
          )}
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
