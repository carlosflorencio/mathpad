import { Note } from "./types"

const NOTES_KEY = "mathpad-notes"
const ACTIVE_NOTE_ID_KEY = "mathpad-active-note-id"

/**
 * Load all notes from localStorage
 */
export function loadNotesFromStorage(): Note[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(NOTES_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("Failed to load notes from storage:", error)
    return []
  }
}

/**
 * Save all notes to localStorage
 */
export function saveNotesToStorage(notes: Note[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  } catch (error) {
    console.error("Failed to save notes to storage:", error)
  }
}

/**
 * Load the active note ID from localStorage
 */
export function loadActiveNoteId(): string | null {
  if (typeof window === "undefined") return null

  try {
    return localStorage.getItem(ACTIVE_NOTE_ID_KEY)
  } catch (error) {
    console.error("Failed to load active note ID:", error)
    return null
  }
}

/**
 * Save the active note ID to localStorage
 */
export function saveActiveNoteId(id: string): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(ACTIVE_NOTE_ID_KEY, id)
  } catch (error) {
    console.error("Failed to save active note ID:", error)
  }
}

/**
 * Clear active note ID from localStorage
 */
export function clearActiveNoteId(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(ACTIVE_NOTE_ID_KEY)
  } catch (error) {
    console.error("Failed to clear active note ID:", error)
  }
}
