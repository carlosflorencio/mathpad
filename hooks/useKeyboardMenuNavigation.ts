import { useEffect } from "react"

export interface MenuKeyBinding {
  key: string
  label: string
  action: () => void
  disabled?: boolean
}

/**
 * Hook to enable keyboard navigation in menus when vim mode is enabled
 * @param isOpen - Whether the menu is currently open
 * @param bindings - Array of key bindings for menu items
 * @param vimModeEnabled - Whether vim mode is enabled
 */
export function useKeyboardMenuNavigation(
  isOpen: boolean,
  bindings: MenuKeyBinding[],
  vimModeEnabled: boolean
) {
  useEffect(() => {
    if (!isOpen || !vimModeEnabled) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle single key presses (no modifiers except shift)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const key = e.key.toLowerCase()
      const binding = bindings.find((b) => b.key === key && !b.disabled)

      if (binding) {
        e.preventDefault()
        e.stopPropagation()
        binding.action()
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [isOpen, bindings, vimModeEnabled])
}
