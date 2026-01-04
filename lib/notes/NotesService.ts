import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { LocalStorageNoteRepository } from "./LocalStorageNoteRepository"
import { Result } from "../result"

export class NotesService {
  constructor(private repository: LocalStorageNoteRepository) {}

  createNewNote(
    collection: NoteCollection
  ): Result<{ note: Note; collection: NoteCollection }, string> {
    const name = collection.generateUniqueName()
    const note = Note.create(name, "")
    const newCollection = collection.add(note)

    const saveResult = this.repository.saveAll(newCollection)
    if (!saveResult.ok) {
      return saveResult
    }

    const saveActiveResult = this.repository.saveActiveNoteId(note.id)
    if (!saveActiveResult.ok) {
      return saveActiveResult
    }

    return { ok: true, value: { note, collection: newCollection } }
  }

  switchToNote(noteId: string): Result<void, string> {
    return this.repository.saveActiveNoteId(noteId)
  }

  deleteNote(
    noteId: string,
    activeNoteId: string | null,
    collection: NoteCollection
  ): Result<{ collection: NoteCollection; newActiveNoteId: string | null }, string> {
    let newCollection = collection.remove(noteId)
    let newActiveNoteId = activeNoteId

    if (noteId === activeNoteId) {
      if (newCollection.count === 0) {
        // Create new note if last one deleted
        const newNote = Note.create("Untitled 1", "")
        newCollection = newCollection.add(newNote)
        newActiveNoteId = newNote.id
      } else {
        // Switch to first remaining note
        newActiveNoteId = newCollection.all[0].id
      }
    }

    const saveResult = this.repository.saveAll(newCollection)
    if (!saveResult.ok) {
      return saveResult
    }

    if (newActiveNoteId) {
      const saveActiveResult = this.repository.saveActiveNoteId(newActiveNoteId)
      if (!saveActiveResult.ok) {
        return saveActiveResult
      }
    }

    return { ok: true, value: { collection: newCollection, newActiveNoteId } }
  }

  renameNote(
    noteId: string,
    newName: string,
    collection: NoteCollection
  ): Result<NoteCollection, string> {
    const note = collection.findById(noteId)
    if (!note) {
      return { ok: false, error: `Note not found: ${noteId}` }
    }

    const renamedNote = note.rename(newName)
    const newCollection = collection.update(renamedNote)

    const saveResult = this.repository.saveAll(newCollection)
    if (!saveResult.ok) {
      return saveResult
    }

    return { ok: true, value: newCollection }
  }

  updateNoteContent(
    noteId: string,
    content: string,
    collection: NoteCollection
  ): Result<NoteCollection, string> {
    const note = collection.findById(noteId)
    if (!note) {
      return { ok: false, error: `Note not found: ${noteId}` }
    }

    const updatedNote = note.updateContent(content)
    return { ok: true, value: collection.update(updatedNote) }
  }

  saveNote(noteId: string, collection: NoteCollection): Result<NoteCollection, string> {
    const note = collection.findById(noteId)
    if (!note) {
      return { ok: false, error: `Note not found: ${noteId}` }
    }

    const touchedNote = note.touch()
    const newCollection = collection.update(touchedNote)

    const saveResult = this.repository.saveAll(newCollection)
    if (!saveResult.ok) {
      return saveResult
    }

    return { ok: true, value: newCollection }
  }
}
