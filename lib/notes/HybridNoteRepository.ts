import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { NoteRepository } from "./NoteRepository"
import { LocalStorageNoteRepository } from "./LocalStorageNoteRepository"
import { FileSystemNoteRepository } from "./FileSystemNoteRepository"
import { Result } from "../result"

/**
 * Hybrid repository that combines localStorage and file system storage.
 * - Always saves to localStorage (primary storage, works offline)
 * - Also saves to folder if mapped
 * - On load: merges both sources, preferring newest by lastModified
 */
export class HybridNoteRepository implements NoteRepository {
  constructor(
    private localRepo: LocalStorageNoteRepository,
    private fsRepo: FileSystemNoteRepository
  ) {}

  /**
   * Load notes from both localStorage and folder, merge by ID (newest wins)
   */
  async loadAll(): Promise<Result<NoteCollection, string>> {
    // Load from localStorage
    const localResult = this.localRepo.loadAll()
    if (!localResult.ok) {
      return localResult
    }

    // If no folder mapped, return localStorage notes
    if (!this.fsRepo.isFolderMapped()) {
      return localResult
    }

    // Load from folder
    const fsResult = await this.fsRepo.loadAll()
    if (!fsResult.ok) {
      console.warn("Failed to load from folder, using localStorage only:", fsResult.error)
      return localResult
    }

    // Merge collections (prefer newest by lastModified)
    const merged = this.mergeCollections(localResult.value, fsResult.value)
    return { ok: true, value: merged }
  }

  /**
   * Save to both localStorage and folder (if mapped)
   */
  async saveAll(collection: NoteCollection): Promise<Result<void, string>> {
    // Always save to localStorage first (primary storage)
    const localResult = this.localRepo.saveAll(collection)
    if (!localResult.ok) {
      return localResult
    }

    // Save to folder if mapped
    if (this.fsRepo.isFolderMapped()) {
      const fsResult = await this.fsRepo.saveAll(collection)
      if (!fsResult.ok) {
        console.warn("Failed to save to folder:", fsResult.error)
        // Don't fail the whole operation if folder save fails
        // localStorage save already succeeded
      }
    }

    return { ok: true, value: undefined }
  }

  /**
   * Load active note ID (stored in localStorage only)
   */
  loadActiveNoteId(): Result<string | null, string> {
    return this.localRepo.loadActiveNoteId()
  }

  /**
   * Save active note ID (stored in localStorage only)
   */
  saveActiveNoteId(id: string): Result<void, string> {
    return this.localRepo.saveActiveNoteId(id)
  }

  /**
   * Clear active note ID (stored in localStorage only)
   */
  clearActiveNoteId(): Result<void, string> {
    return this.localRepo.clearActiveNoteId()
  }

  /**
   * Get file system repository (for folder operations)
   */
  getFileSystemRepo(): FileSystemNoteRepository {
    return this.fsRepo
  }

  /**
   * Merge two collections by ID, preferring newest by lastModified
   */
  private mergeCollections(local: NoteCollection, fs: NoteCollection): NoteCollection {
    const notesById = new Map<string, Note>()

    // Add all local notes
    for (const note of local.all) {
      notesById.set(note.id, note)
    }

    // Add or update with folder notes (if newer)
    for (const note of fs.all) {
      const existing = notesById.get(note.id)
      if (!existing || note.lastModified > existing.lastModified) {
        notesById.set(note.id, note)
      }
    }

    return new NoteCollection(Array.from(notesById.values()))
  }
}
