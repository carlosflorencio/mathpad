import { describe, it, expect, beforeEach } from "vitest"
import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { LocalStorageNoteRepository } from "./LocalStorageNoteRepository"
import { NotesService } from "./NotesService"

// Mock window and localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, "window", {
  value: {},
  writable: true,
})

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
})

describe("NotesService", () => {
  let service: NotesService
  let repository: LocalStorageNoteRepository

  beforeEach(() => {
    localStorageMock.clear()
    repository = new LocalStorageNoteRepository()
    service = new NotesService(repository)
  })

  describe("createNewNote", () => {
    it("should create note with unique name", async () => {
      const collection = new NoteCollection([])
      const result = await service.createNewNote(collection)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.note.name).toBe("Untitled 1")
        expect(result.value.collection.count).toBe(1)
      }
    })

    it("should increment name for subsequent notes", async () => {
      const collection = new NoteCollection([])

      const result1 = await service.createNewNote(collection)
      expect(result1.ok).toBe(true)
      if (!result1.ok) return

      const result2 = await service.createNewNote(result1.value.collection)
      expect(result2.ok).toBe(true)
      if (!result2.ok) return

      expect(result1.value.note.name).toBe("Untitled 1")
      expect(result2.value.note.name).toBe("Untitled 2")
    })

    it("should save to repository", async () => {
      const collection = new NoteCollection([])
      const result = await service.createNewNote(collection)

      expect(result.ok).toBe(true)

      const loadResult = repository.loadAll()
      expect(loadResult.ok).toBe(true)
      if (loadResult.ok) {
        expect(loadResult.value.count).toBe(1)
      }
    })
  })

  describe("deleteNote", () => {
    it("should delete note and switch to next", async () => {
      const note1 = Note.create("Note 1")
      const note2 = Note.create("Note 2")
      const collection = new NoteCollection([note1, note2])

      const result = await service.deleteNote(note1.id, note1.id, collection)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.collection.count).toBe(1)
        expect(result.value.newActiveNoteId).toBe(note2.id)
      }
    })

    it("should create new note when deleting last one", async () => {
      const note = Note.create("Only Note")
      const collection = new NoteCollection([note])

      const result = await service.deleteNote(note.id, note.id, collection)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.collection.count).toBe(1)
        expect(result.value.collection.all[0].name).toBe("Untitled 1")
      }
    })

    it("should not change active note when deleting non-active note", async () => {
      const note1 = Note.create("Note 1")
      const note2 = Note.create("Note 2")
      const collection = new NoteCollection([note1, note2])

      const result = await service.deleteNote(note2.id, note1.id, collection)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.newActiveNoteId).toBe(note1.id)
        expect(result.value.collection.count).toBe(1)
      }
    })
  })

  describe("renameNote", () => {
    it("should rename note and update timestamp", async () => {
      const note = Note.create("Old Name")
      const collection = new NoteCollection([note])

      const result = await service.renameNote(note.id, "New Name", collection)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const renamed = result.value.findById(note.id)
        expect(renamed?.name).toBe("New Name")
        expect(renamed?.lastModified).toBeGreaterThanOrEqual(note.lastModified)
      }
    })

    it("should return error when note not found", async () => {
      const collection = new NoteCollection([])
      const result = await service.renameNote("non-existent", "New Name", collection)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("Note not found")
      }
    })
  })

  describe("updateNoteContent", () => {
    it("should update content without touching timestamp", () => {
      const note = Note.create("Test", "old content")
      const collection = new NoteCollection([note])

      const result = service.updateNoteContent(note.id, "new content", collection)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const updated = result.value.findById(note.id)
        expect(updated?.content).toBe("new content")
        expect(updated?.lastModified).toBe(note.lastModified)
      }
    })

    it("should return error when note not found", () => {
      const collection = new NoteCollection([])
      const result = service.updateNoteContent("non-existent", "content", collection)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("Note not found")
      }
    })
  })

  describe("saveNote", () => {
    it("should touch note and update timestamp", async () => {
      const note = Note.create("Test")
      const collection = new NoteCollection([note])

      const result = await service.saveNote(note.id, collection)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const saved = result.value.findById(note.id)
        expect(saved?.lastModified).toBeGreaterThanOrEqual(note.lastModified)
      }
    })

    it("should return error when note not found", async () => {
      const collection = new NoteCollection([])
      const result = await service.saveNote("non-existent", collection)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("Note not found")
      }
    })
  })
})
