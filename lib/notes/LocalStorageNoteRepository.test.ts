import { describe, it, expect, beforeEach } from "vitest"
import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { LocalStorageNoteRepository } from "./LocalStorageNoteRepository"

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

describe("LocalStorageNoteRepository", () => {
  let repository: LocalStorageNoteRepository

  beforeEach(() => {
    localStorageMock.clear()
    repository = new LocalStorageNoteRepository()
  })

  describe("loadAll", () => {
    it("should return empty collection when no notes stored", () => {
      const result = repository.loadAll()
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.count).toBe(0)
      }
    })

    it("should load notes from localStorage", () => {
      const note1 = Note.create("Note 1", "content 1")
      const note2 = Note.create("Note 2", "content 2")
      const collection = new NoteCollection([note1, note2])

      repository.saveAll(collection)
      const result = repository.loadAll()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.count).toBe(2)
        expect(result.value.findById(note1.id)?.name).toBe("Note 1")
        expect(result.value.findById(note2.id)?.content).toBe("content 2")
      }
    })

    it("should handle corrupted data gracefully", () => {
      localStorage.setItem("mathpad-notes", "invalid json")
      const result = repository.loadAll()
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("Failed to load notes")
      }
    })
  })

  describe("saveAll", () => {
    it("should save notes to localStorage", () => {
      const note = Note.create("Test")
      const collection = new NoteCollection([note])

      const result = repository.saveAll(collection)
      expect(result.ok).toBe(true)

      const stored = localStorage.getItem("mathpad-notes")
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].name).toBe("Test")
    })
  })

  describe("activeNoteId", () => {
    it("should save and load active note ID", () => {
      const saveResult = repository.saveActiveNoteId("test-id")
      expect(saveResult.ok).toBe(true)

      const loadResult = repository.loadActiveNoteId()
      expect(loadResult.ok).toBe(true)
      if (loadResult.ok) {
        expect(loadResult.value).toBe("test-id")
      }
    })

    it("should clear active note ID", () => {
      repository.saveActiveNoteId("test-id")
      const clearResult = repository.clearActiveNoteId()
      expect(clearResult.ok).toBe(true)

      const loadResult = repository.loadActiveNoteId()
      expect(loadResult.ok).toBe(true)
      if (loadResult.ok) {
        expect(loadResult.value).toBeNull()
      }
    })
  })
})
