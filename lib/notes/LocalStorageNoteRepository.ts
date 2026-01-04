import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { Result } from "../result"

const NOTES_KEY = "mathpad-notes"
const ACTIVE_NOTE_ID_KEY = "mathpad-active-note-id"

/**
 * Repository implementation using browser localStorage.
 * Future: Create FileSystemNoteRepository for File System Access API
 */
export class LocalStorageNoteRepository {
  loadAll(): Result<NoteCollection, string> {
    if (typeof window === "undefined") {
      return { ok: true, value: new NoteCollection([]) }
    }

    try {
      const stored = localStorage.getItem(NOTES_KEY)
      if (!stored) {
        return { ok: true, value: new NoteCollection([]) }
      }

      const parsed = JSON.parse(stored)
      const notes = Array.isArray(parsed) ? parsed.map((data) => Note.fromJSON(data)) : []
      return { ok: true, value: new NoteCollection(notes) }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to load notes from localStorage: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  saveAll(collection: NoteCollection): Result<void, string> {
    if (typeof window === "undefined") {
      return { ok: true, value: undefined }
    }

    try {
      const json = collection.all.map((note) => note.toJSON())
      localStorage.setItem(NOTES_KEY, JSON.stringify(json))
      return { ok: true, value: undefined }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to save notes to localStorage: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  loadActiveNoteId(): Result<string | null, string> {
    if (typeof window === "undefined") {
      return { ok: true, value: null }
    }

    try {
      const id = localStorage.getItem(ACTIVE_NOTE_ID_KEY)
      return { ok: true, value: id }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to load active note ID: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  saveActiveNoteId(id: string): Result<void, string> {
    if (typeof window === "undefined") {
      return { ok: true, value: undefined }
    }

    try {
      localStorage.setItem(ACTIVE_NOTE_ID_KEY, id)
      return { ok: true, value: undefined }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to save active note ID: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  clearActiveNoteId(): Result<void, string> {
    if (typeof window === "undefined") {
      return { ok: true, value: undefined }
    }

    try {
      localStorage.removeItem(ACTIVE_NOTE_ID_KEY)
      return { ok: true, value: undefined }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to clear active note ID: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }
}
