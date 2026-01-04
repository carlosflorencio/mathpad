import { Note } from "./types"

/**
 * Generate a UUID v4 for a note
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate a unique note name like "Untitled 1", "Untitled 2", etc.
 */
export function generateNoteName(existingNames: string[]): string {
  const untitledPattern = /^Untitled(?: (\d+))?$/
  let maxNumber = 0

  for (const name of existingNames) {
    const match = name.match(untitledPattern)
    if (match) {
      const num = match[1] ? parseInt(match[1], 10) : 1
      maxNumber = Math.max(maxNumber, num)
    }
  }

  const nextNumber = maxNumber + 1
  return nextNumber === 1 ? "Untitled 1" : `Untitled ${nextNumber}`
}

/**
 * Compute a hash of content for deduplication
 * Using a simple FNV-1a hash for speed
 */
export function computeContentHash(content: string): string {
  let hash = 2166136261 // FNV offset basis

  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i)
    hash = Math.imul(hash, 16777619) // FNV prime
  }

  // Convert to hex string
  return (hash >>> 0).toString(16).padStart(8, "0")
}

/**
 * Sanitize filename for filesystem compatibility
 * Replaces invalid characters with hyphens
 */
export function sanitizeFilename(name: string): string {
  // Replace invalid filesystem chars with hyphen
  return name.replace(/[/\\:*?"<>|]/g, "-").trim()
}

/**
 * Create a new note with generated ID and timestamp
 */
export function createNote(name: string, content: string = ""): Note {
  return {
    id: generateUUID(),
    name,
    content,
    lastModified: Date.now(),
  }
}
