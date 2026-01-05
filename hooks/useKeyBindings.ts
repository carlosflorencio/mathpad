import { useEffect } from "react"

export type KeyBinding = {
  key: string
  ctrlOrCmd?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description: string
}

export interface UseKeyBindingsOptions {
  bindings: KeyBinding[]
  enabled?: boolean
}

/**
 * Hook to manage keyboard shortcuts with cross-platform support
 * Automatically handles Cmd on Mac and Ctrl on Windows/Linux
 */
export function useKeyBindings({ bindings, enabled = true }: UseKeyBindingsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const binding of bindings) {
        const keyMatches = event.key.toLowerCase() === binding.key.toLowerCase()

        // Cross-platform Ctrl/Cmd detection
        const hasCtrlOrCmd = event.metaKey || event.ctrlKey
        const needsCtrlOrCmd = binding.ctrlOrCmd ?? false
        const modifierMatches = hasCtrlOrCmd === needsCtrlOrCmd

        const hasShift = event.shiftKey
        const needsShift = binding.shift ?? false
        const shiftMatches = hasShift === needsShift

        const hasAlt = event.altKey
        const needsAlt = binding.alt ?? false
        const altMatches = hasAlt === needsAlt

        if (keyMatches && modifierMatches && shiftMatches && altMatches) {
          event.preventDefault()
          event.stopPropagation()
          binding.handler()
          break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true })
  }, [bindings, enabled])
}

/**
 * Get the display string for the modifier key (Cmd on Mac, Ctrl elsewhere)
 */
export function getModifierKey(): string {
  if (typeof navigator === "undefined") return "Ctrl"
  return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl"
}

/**
 * Format a key binding for display
 */
export function formatKeyBinding(binding: KeyBinding): string {
  const parts: string[] = []

  if (binding.ctrlOrCmd) {
    parts.push(getModifierKey())
  }
  if (binding.shift) {
    parts.push("Shift")
  }
  if (binding.alt) {
    parts.push("Alt")
  }

  parts.push(binding.key.toUpperCase())

  return parts.join("+")
}
