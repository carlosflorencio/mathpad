export type Theme = "dark" | "light"

export interface Preferences {
  fontSize: number
  decimalPlaces: number
  decimalSeparator: "," | "."
  thousandsSeparator: "," | "." | " " | ""
  theme: Theme
}

export const defaultPreferences: Preferences = {
  fontSize: 18,
  decimalPlaces: 2,
  theme: "dark",
  decimalSeparator: ".",
  thousandsSeparator: ",",
}

// Multi-note system types

export interface Note {
  id: string // UUID v4
  name: string // "Untitled 1", "Calculations", etc.
  content: string // Editor content
  lastModified: number // Timestamp
}

export interface NotesState {
  notes: Note[]
  activeNoteId: string | null
  folderHandle: FileSystemDirectoryHandle | null
}

export interface ShareData {
  id: string // Note UUID (for deduplication)
  n?: string // name (optional, fallback to "Untitled X")
  c: string // content
  v: "1" // version
}

export interface FileFormat {
  version: "1.0"
  id: string
  name: string
  content: string
}
