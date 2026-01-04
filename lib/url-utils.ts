import LZString from "lz-string"
import { Note, ShareData } from "./types"

/**
 * Compress a note into a shareable URL-safe string
 */
export function compressNoteForSharing(note: Note): string {
  const shareData: ShareData = {
    id: note.id,
    n: note.name,
    c: note.content,
    v: "1",
  }

  const json = JSON.stringify(shareData)
  return LZString.compressToEncodedURIComponent(json)
}

/**
 * Decompress a shared URL hash into ShareData
 * Returns null if decompression fails or data is invalid
 */
export function decompressSharedNote(hash: string): ShareData | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(hash)
    if (!decompressed) return null

    const parsed = JSON.parse(decompressed)

    // Validate structure
    if (
      typeof parsed !== "object" ||
      typeof parsed.id !== "string" ||
      typeof parsed.c !== "string" ||
      parsed.v !== "1"
    ) {
      console.error("Invalid share data structure")
      return null
    }

    return parsed as ShareData
  } catch (error) {
    console.error("Failed to decompress shared note:", error)
    return null
  }
}

/**
 * Create a shareable URL for a note
 */
export function createShareURL(note: Note, baseURL: string = window.location.origin): string {
  const compressed = compressNoteForSharing(note)
  return `${baseURL}/#${compressed}`
}
