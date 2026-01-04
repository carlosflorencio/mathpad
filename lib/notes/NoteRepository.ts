import { NoteCollection } from "./NoteCollection"
import { Result } from "../result"

/**
 * Repository interface for note persistence.
 * Implementations: LocalStorageNoteRepository, FileSystemNoteRepository, HybridNoteRepository
 */
export interface NoteRepository {
  loadAll(): Result<NoteCollection, string> | Promise<Result<NoteCollection, string>>
  saveAll(collection: NoteCollection): Result<void, string> | Promise<Result<void, string>>
  loadActiveNoteId(): Result<string | null, string> | Promise<Result<string | null, string>>
  saveActiveNoteId(id: string): Result<void, string> | Promise<Result<void, string>>
  clearActiveNoteId?(): Result<void, string> | Promise<Result<void, string>>
}
