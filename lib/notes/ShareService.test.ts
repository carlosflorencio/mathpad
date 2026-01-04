import { describe, it, expect, beforeEach } from "vitest"
import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { ShareService } from "./ShareService"

describe("ShareService", () => {
  let service: ShareService

  beforeEach(() => {
    service = new ShareService()
  })

  describe("compression", () => {
    it("should compress and decompress note data", () => {
      const note = Note.create("Test Note", "Hello World")

      const compressResult = service.compressNote(note)
      expect(compressResult.ok).toBe(true)
      if (!compressResult.ok) return

      expect(compressResult.value).toBeTruthy()
      expect(typeof compressResult.value).toBe("string")

      const decompressResult = service.decompressSharedData(compressResult.value)
      expect(decompressResult.ok).toBe(true)
      if (!decompressResult.ok) return

      expect(decompressResult.value.id).toBe(note.id)
      expect(decompressResult.value.n).toBe("Test Note")
      expect(decompressResult.value.c).toBe("Hello World")
    })

    it("should handle invalid data gracefully", () => {
      const result = service.decompressSharedData("invalid-data")
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeTruthy()
      }
    })
  })

  describe("createShareURL", () => {
    it("should create URL with compressed data in hash", () => {
      const note = Note.create("Test", "content")
      const result = service.createShareURL(note, "https://example.com")

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value).toContain("https://example.com/#")
      expect(result.value.length).toBeGreaterThan("https://example.com/#".length)
    })
  })

  describe("importSharedNote", () => {
    it("should replace existing note content", () => {
      const original = Note.create("Original", "old content")
      const collection = new NoteCollection([original])

      const sharedData = {
        id: original.id,
        n: "Original",
        c: "new content",
        v: "1" as const,
      }

      const result = service.importSharedNote(sharedData, collection, "replace")

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.note.content).toBe("new content")
      expect(result.value.note.id).toBe(original.id)
      expect(result.value.collection.count).toBe(1)
    })

    it("should return error when replacing non-existent note", () => {
      const collection = new NoteCollection([])

      const sharedData = {
        id: "non-existent",
        n: "Test",
        c: "content",
        v: "1" as const,
      }

      const result = service.importSharedNote(sharedData, collection, "replace")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("not found")
      }
    })

    it("should create new note when keeping both", () => {
      const original = Note.create("Original", "old content")
      const collection = new NoteCollection([original])

      const sharedData = {
        id: original.id,
        n: "Original",
        c: "new content",
        v: "1" as const,
      }

      const result = service.importSharedNote(sharedData, collection, "keep-both")

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.note.name).toBe("Copy of Original")
      expect(result.value.note.content).toBe("new content")
      expect(result.value.note.id).not.toBe(original.id)
      expect(result.value.collection.count).toBe(2)
    })

    it("should keep original name when importing new note", () => {
      const existingNote = Note.create("Existing", "some content")
      const collection = new NoteCollection([existingNote])

      const sharedData = {
        id: "different-id",
        n: "Shared Note",
        c: "shared content",
        v: "1" as const,
      }

      const result = service.importSharedNote(sharedData, collection, "keep-both")

      expect(result.ok).toBe(true)
      if (!result.ok) return

      // Should keep original name (no "Copy of" prefix) since note doesn't exist
      expect(result.value.note.name).toBe("Shared Note")
      expect(result.value.note.content).toBe("shared content")
      expect(result.value.collection.count).toBe(2)
    })
  })
})
