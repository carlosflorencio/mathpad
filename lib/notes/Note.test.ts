import { describe, it, expect } from "vitest"
import { Note } from "./Note"

describe("Note", () => {
  describe("create", () => {
    it("should create a new note with generated UUID", () => {
      const note = Note.create("Test Note", "content")
      expect(note.id).toBeTruthy()
      expect(note.name).toBe("Test Note")
      expect(note.content).toBe("content")
      expect(note.lastModified).toBeGreaterThan(0)
    })

    it("should create note with empty content by default", () => {
      const note = Note.create("Test")
      expect(note.content).toBe("")
    })
  })

  describe("rename", () => {
    it("should return new note with updated name and timestamp", () => {
      const original = Note.create("Original", "content")
      const renamed = original.rename("New Name")

      expect(renamed.id).toBe(original.id)
      expect(renamed.name).toBe("New Name")
      expect(renamed.content).toBe("content")
      expect(renamed.lastModified).toBeGreaterThanOrEqual(original.lastModified)
      expect(original.name).toBe("Original") // immutability
    })
  })

  describe("updateContent", () => {
    it("should return new note with updated content", () => {
      const original = Note.create("Test", "old")
      const updated = original.updateContent("new")

      expect(updated.content).toBe("new")
      expect(updated.lastModified).toBe(original.lastModified) // not touched
      expect(original.content).toBe("old") // immutability
    })
  })

  describe("computeContentHash", () => {
    it("should compute consistent hash for same content", () => {
      const note1 = Note.create("Test", "hello world")
      const note2 = Note.create("Test", "hello world")
      expect(note1.computeContentHash()).toBe(note2.computeContentHash())
    })

    it("should compute different hash for different content", () => {
      const note1 = Note.create("Test", "hello")
      const note2 = Note.create("Test", "world")
      expect(note1.computeContentHash()).not.toBe(note2.computeContentHash())
    })
  })

  describe("serialization", () => {
    it("should serialize and deserialize correctly", () => {
      const original = Note.create("Test", "content")
      const json = original.toJSON()
      const restored = Note.fromJSON(json)

      expect(restored.id).toBe(original.id)
      expect(restored.name).toBe(original.name)
      expect(restored.content).toBe(original.content)
      expect(restored.lastModified).toBe(original.lastModified)
    })
  })
})
