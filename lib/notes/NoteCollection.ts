import { Note } from "./Note"

export class NoteCollection {
  constructor(private notes: Note[]) {}

  get all(): Note[] {
    return [...this.notes]
  }

  get count(): number {
    return this.notes.length
  }

  findById(id: string): Note | null {
    return this.notes.find((n) => n.id === id) || null
  }

  add(note: Note): NoteCollection {
    return new NoteCollection([...this.notes, note])
  }

  update(note: Note): NoteCollection {
    const updated = this.notes.map((n) => (n.id === note.id ? note : n))
    return new NoteCollection(updated)
  }

  remove(id: string): NoteCollection {
    return new NoteCollection(this.notes.filter((n) => n.id !== id))
  }

  getExistingNames(): string[] {
    return this.notes.map((n) => n.name)
  }

  generateUniqueName(): string {
    const existingNames = this.getExistingNames()
    const untitledPattern = /^Untitled(?: (\d+))?$/
    let maxNumber = 0

    for (const name of existingNames) {
      const match = name.match(untitledPattern)
      if (match) {
        const num = match[1] ? parseInt(match[1], 10) : 1
        maxNumber = Math.max(maxNumber, num)
      }
    }

    const nextNumber = maxNumber + 1
    return nextNumber === 1 ? "Untitled 1" : `Untitled ${nextNumber}`
  }
}
