import { describe, it, expect } from "vitest"
import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"

describe("NoteCollection", () => {
  describe("add", () => {
    it("should add note and return new collection", () => {
      const collection = new NoteCollection([])
      const note = Note.create("Test")
      const newCollection = collection.add(note)

      expect(newCollection.count).toBe(1)
      expect(collection.count).toBe(0) // immutability
    })
  })

  describe("update", () => {
    it("should update existing note", () => {
      const note1 = Note.create("Note 1")
      const note2 = Note.create("Note 2")
      const collection = new NoteCollection([note1, note2])

      const updated = note1.rename("Updated")
      const newCollection = collection.update(updated)

      expect(newCollection.findById(note1.id)?.name).toBe("Updated")
      expect(collection.findById(note1.id)?.name).toBe("Note 1") // immutability
    })
  })

  describe("remove", () => {
    it("should remove note by id", () => {
      const note1 = Note.create("Note 1")
      const note2 = Note.create("Note 2")
      const collection = new NoteCollection([note1, note2])

      const newCollection = collection.remove(note1.id)

      expect(newCollection.count).toBe(1)
      expect(newCollection.findById(note1.id)).toBeNull()
      expect(newCollection.findById(note2.id)).toBeTruthy()
    })
  })

  describe("generateUniqueName", () => {
    it("should generate 'Untitled 1' for empty collection", () => {
      const collection = new NoteCollection([])
      expect(collection.generateUniqueName()).toBe("Untitled 1")
    })

    it("should increment number for existing untitled notes", () => {
      const note1 = Note.create("Untitled 1")
      const note2 = Note.create("Untitled 2")
      const collection = new NoteCollection([note1, note2])

      expect(collection.generateUniqueName()).toBe("Untitled 3")
    })

    it("should handle non-sequential numbers", () => {
      const note1 = Note.create("Untitled 1")
      const note2 = Note.create("Untitled 5")
      const collection = new NoteCollection([note1, note2])

      expect(collection.generateUniqueName()).toBe("Untitled 6")
    })

    it("should not conflict with custom named notes", () => {
      const note1 = Note.create("My Custom Note")
      const collection = new NoteCollection([note1])

      expect(collection.generateUniqueName()).toBe("Untitled 1")
    })
  })
})
