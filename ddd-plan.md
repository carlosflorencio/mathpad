Revised Refactoring Plan: Feature-Based DDD Architecture
Goals

1. ✅ Separate domain logic from UI/React logic
2. ✅ Use rich domain entities (classes with methods)
3. ✅ Repository pattern for data access
4. ✅ Flat feature-based folder structure (no subfolders)
5. ✅ Domain services for complex operations
6. ✅ Unit tests alongside each file
7. ✅ Future-proof for filesystem implementation

---

🗂️ New Directory Structure
lib/
notes/ # Notes feature domain (FLAT)
Note.ts # Note entity class
Note.test.ts # Note unit tests
NoteCollection.ts # Collection entity
NoteCollection.test.ts # Collection tests
NotesService.ts # Business logic
NotesService.test.ts # Service tests
ShareService.ts # URL compression/sharing
ShareService.test.ts # Share tests
LocalStorageNoteRepository.ts # localStorage implementation
LocalStorageNoteRepository.test.ts
types.ts # DTOs (ShareData, FileFormat)

preferences/ # Preferences feature (FLAT)
Preferences.ts # Preferences entity
Preferences.test.ts # Preferences tests
PreferencesRepository.ts # Repository for preferences
PreferencesRepository.test.ts

engine/ # Calculator engine (unchanged) # ... existing structure
hooks/ # React hooks (UI layer)
notes/
useNotes.ts # Main notes hook
useNotes.test.ts (optional) # Hook integration tests
components/ # Existing (unchanged)
App.tsx
Editor.tsx
...

---

📦 Phase-by-Phase Implementation
Phase 1: Setup Structure ⏱️ ~5 min
Actions:

1. Create new directories:
   mkdir -p lib/notes
   mkdir -p lib/preferences
   mkdir -p hooks/notes
2. Files to migrate:
   - lib/types.ts → split into feature types
   - lib/note-utils.ts → merge into Note.ts
   - lib/storage.ts → become LocalStorageNoteRepository.ts
   - lib/url-utils.ts → become ShareService.ts
   - lib/use-notes.ts → move to hooks/notes/useNotes.ts
3. Delete after migration:
   - lib/use-local-storage.ts (unused)

---

Phase 2: Create Domain Entities ⏱️ ~20 min
2.1 Create lib/notes/Note.ts
export class Note {
constructor(
public readonly id: string,
private \_name: string,
private \_content: string,
private \_lastModified: number
) {}
// Getters
get name(): string { return this.\_name }
get content(): string { return this.\_content }
get lastModified(): number { return this.\_lastModified }
// Domain methods (immutable)
rename(newName: string): Note {
return new Note(this.id, newName, this.\_content, Date.now())
}
updateContent(content: string): Note {
return new Note(this.id, this.\_name, content, this.\_lastModified)
}
touch(): Note {
return new Note(this.id, this.\_name, this.\_content, Date.now())
}
// Factory method
static create(name: string, content: string = ""): Note {
return new Note(generateUUID(), name, content, Date.now())
}
// Serialization
toJSON() {
return {
id: this.id,
name: this.\_name,
content: this.\_content,
lastModified: this.\_lastModified,
}
}
static fromJSON(data: any): Note {
return new Note(data.id, data.name, data.content, data.lastModified)
}
// Domain logic (from note-utils.ts)
computeContentHash(): string {
let hash = 2166136261 // FNV offset basis
for (let i = 0; i < this.\_content.length; i++) {
hash ^= this.\_content.charCodeAt(i)
hash = Math.imul(hash, 16777619)
}
return (hash >>> 0).toString(16).padStart(8, "0")
}
toSanitizedFilename(): string {
return this.\_name.replace(/[/\\:*?"<>|]/g, "-").trim()
}
}
function generateUUID(): string {
if (typeof crypto !== "undefined" && crypto.randomUUID) {
return crypto.randomUUID()
}
return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
const r = (Math.random() \* 16) | 0
const v = c === "x" ? r : (r & 0x3) | 0x8
return v.toString(16)
})
}
2.2 Create lib/notes/Note.test.ts
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
      expect(renamed.lastModified).toBeGreaterThan(original.lastModified)
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
describe("toSanitizedFilename", () => {
it("should replace invalid filesystem characters", () => {
const note = Note.create('Test/File:Name\*?"<>|', "")
expect(note.toSanitizedFilename()).toBe("Test-File-Name-------")
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
2.3 Create lib/notes/NoteCollection.ts
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
2.4 Create lib/notes/NoteCollection.test.ts
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
2.5 Create lib/preferences/Preferences.ts
export class Preferences {
constructor(
public readonly fontSize: number,
public readonly decimalPlaces: number,
public readonly decimalSeparator: "," | ".",
public readonly thousandsSeparator: "," | "." | " " | "",
public readonly theme: "dark" | "light"
) {}
static default(): Preferences {
return new Preferences(18, 2, ".", ",", "dark")
}
withFontSize(size: number): Preferences {
return new Preferences(size, this.decimalPlaces, this.decimalSeparator, this.thousandsSeparator, this.theme)
}
withDecimalPlaces(places: number): Preferences {
return new Preferences(this.fontSize, places, this.decimalSeparator, this.thousandsSeparator, this.theme)
}
withDecimalSeparator(separator: "," | "."): Preferences {
return new Preferences(this.fontSize, this.decimalPlaces, separator, this.thousandsSeparator, this.theme)
}
withThousandsSeparator(separator: "," | "." | " " | ""): Preferences {
return new Preferences(this.fontSize, this.decimalPlaces, this.decimalSeparator, separator, this.theme)
}
withTheme(theme: "dark" | "light"): Preferences {
return new Preferences(this.fontSize, this.decimalPlaces, this.decimalSeparator, this.thousandsSeparator, theme)
}
toJSON() {
return {
fontSize: this.fontSize,
decimalPlaces: this.decimalPlaces,
decimalSeparator: this.decimalSeparator,
thousandsSeparator: this.thousandsSeparator,
theme: this.theme,
}
}
static fromJSON(data: any): Preferences {
return new Preferences(
data.fontSize,
data.decimalPlaces,
data.decimalSeparator,
data.thousandsSeparator,
data.theme
)
}
}
2.6 Create lib/preferences/Preferences.test.ts
import { describe, it, expect } from "vitest"
import { Preferences } from "./Preferences"
describe("Preferences", () => {
describe("default", () => {
it("should create default preferences", () => {
const prefs = Preferences.default()
expect(prefs.fontSize).toBe(18)
expect(prefs.theme).toBe("dark")
})
})
describe("with\* methods", () => {
it("should create new instance with updated fontSize", () => {
const original = Preferences.default()
const updated = original.withFontSize(24)

      expect(updated.fontSize).toBe(24)
      expect(original.fontSize).toBe(18) // immutability
    })
    it("should create new instance with updated theme", () => {
      const original = Preferences.default()
      const updated = original.withTheme("light")

      expect(updated.theme).toBe("light")
      expect(original.theme).toBe("dark")
    })

})
describe("serialization", () => {
it("should serialize and deserialize correctly", () => {
const original = Preferences.default().withFontSize(20).withTheme("light")
const json = original.toJSON()
const restored = Preferences.fromJSON(json)

      expect(restored.fontSize).toBe(20)
      expect(restored.theme).toBe("light")
    })

})
})
2.7 Create lib/notes/types.ts
// Data Transfer Objects (DTOs) - keep as interfaces
export interface ShareData {
id: string
n?: string // optional name
c: string // content
v: "1" // version
}
export interface FileFormat {
version: "1.0"
id: string
name: string
content: string
}

---

Phase 3: Create Repositories ⏱️ ~20 min
3.1 Create lib/notes/LocalStorageNoteRepository.ts
Key Point: Named LocalStorage\* to distinguish from future FileSystemNoteRepository
import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
const NOTES_KEY = "mathpad-notes"
const ACTIVE_NOTE_ID_KEY = "mathpad-active-note-id"
/\*\*

- Repository implementation using browser localStorage.
- Future: Create FileSystemNoteRepository for File System Access API
  \*/
  export class LocalStorageNoteRepository {
  loadAll(): NoteCollection {
  if (typeof window === "undefined") {
  return new NoteCollection([])
  }
  try {
  const stored = localStorage.getItem(NOTES_KEY)
  if (!stored) return new NoteCollection([])
  const parsed = JSON.parse(stored)
  const notes = Array.isArray(parsed) ? parsed.map((data) => Note.fromJSON(data)) : []
  return new NoteCollection(notes)
  } catch (error) {
  console.error("Failed to load notes from localStorage:", error)
  return new NoteCollection([])
  }
  }
  saveAll(collection: NoteCollection): void {
  if (typeof window === "undefined") return
  try {
  const json = collection.all.map((note) => note.toJSON())
  localStorage.setItem(NOTES_KEY, JSON.stringify(json))
  } catch (error) {
  console.error("Failed to save notes to localStorage:", error)
  }
  }
  loadActiveNoteId(): string | null {
  if (typeof window === "undefined") return null
  try {
  return localStorage.getItem(ACTIVE_NOTE_ID_KEY)
  } catch (error) {
  console.error("Failed to load active note ID:", error)
  return null
  }
  }
  saveActiveNoteId(id: string): void {
  if (typeof window === "undefined") return
  try {
  localStorage.setItem(ACTIVE_NOTE_ID_KEY, id)
  } catch (error) {
  console.error("Failed to save active note ID:", error)
  }
  }
  clearActiveNoteId(): void {
  if (typeof window === "undefined") return
  try {
  localStorage.removeItem(ACTIVE_NOTE_ID_KEY)
  } catch (error) {
  console.error("Failed to clear active note ID:", error)
  }
  }
  }
  3.2 Create lib/notes/LocalStorageNoteRepository.test.ts
  import { describe, it, expect, beforeEach, vi } from "vitest"
  import { Note } from "./Note"
  import { NoteCollection } from "./NoteCollection"
  import { LocalStorageNoteRepository } from "./LocalStorageNoteRepository"
  // Mock localStorage
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
  const collection = repository.loadAll()
  expect(collection.count).toBe(0)
  })
  it("should load notes from localStorage", () => {
  const note1 = Note.create("Note 1", "content 1")
  const note2 = Note.create("Note 2", "content 2")
  const collection = new NoteCollection([note1, note2])
        repository.saveAll(collection)
        const loaded = repository.loadAll()

        expect(loaded.count).toBe(2)
        expect(loaded.findById(note1.id)?.name).toBe("Note 1")
        expect(loaded.findById(note2.id)?.content).toBe("content 2")
      })
      it("should handle corrupted data gracefully", () => {
        localStorage.setItem("mathpad-notes", "invalid json")
        const collection = repository.loadAll()
        expect(collection.count).toBe(0)
      })
  })
  describe("saveAll", () => {
  it("should save notes to localStorage", () => {
  const note = Note.create("Test")
  const collection = new NoteCollection([note])
        repository.saveAll(collection)

        const stored = localStorage.getItem("mathpad-notes")
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored!)
        expect(parsed).toHaveLength(1)
        expect(parsed[0].name).toBe("Test")
      })
  })
  describe("activeNoteId", () => {
  it("should save and load active note ID", () => {
  repository.saveActiveNoteId("test-id")
  expect(repository.loadActiveNoteId()).toBe("test-id")
  })
  it("should clear active note ID", () => {
  repository.saveActiveNoteId("test-id")
  repository.clearActiveNoteId()
  expect(repository.loadActiveNoteId()).toBeNull()
  })
  })
  })
  3.3 Create lib/preferences/PreferencesRepository.ts
  import { Preferences } from "./Preferences"
  const PREFERENCES_KEY = "mathpad-preferences"
  export class PreferencesRepository {
  load(): Preferences {
  if (typeof window === "undefined") {
  return Preferences.default()
  }
  try {
  const stored = localStorage.getItem(PREFERENCES_KEY)
  if (!stored) return Preferences.default()
  const data = JSON.parse(stored)
  return Preferences.fromJSON(data)
  } catch (error) {
  console.error("Failed to load preferences:", error)
  return Preferences.default()
  }
  }
  save(preferences: Preferences): void {
  if (typeof window === "undefined") return
  try {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences.toJSON()))
  } catch (error) {
  console.error("Failed to save preferences:", error)
  }
  }
  }
  3.4 Create lib/preferences/PreferencesRepository.test.ts
  import { describe, it, expect, beforeEach } from "vitest"
  import { Preferences } from "./Preferences"
  import { PreferencesRepository } from "./PreferencesRepository"
  const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
  store[key] = value
  },
  clear: () => {
  store = {}
  },
  }
  })()
  Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  })
  describe("PreferencesRepository", () => {
  let repository: PreferencesRepository
  beforeEach(() => {
  localStorageMock.clear()
  repository = new PreferencesRepository()
  })
  describe("load", () => {
  it("should return default preferences when nothing stored", () => {
  const prefs = repository.load()
  expect(prefs.fontSize).toBe(18)
  expect(prefs.theme).toBe("dark")
  })
  it("should load stored preferences", () => {
  const custom = Preferences.default().withFontSize(24).withTheme("light")
  repository.save(custom)
        const loaded = repository.load()
        expect(loaded.fontSize).toBe(24)
        expect(loaded.theme).toBe("light")
      })
  })
  describe("save", () => {
  it("should save preferences to localStorage", () => {
  const prefs = Preferences.default().withFontSize(20)
  repository.save(prefs)
        const stored = localStorage.getItem("mathpad-preferences")
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored!)
        expect(parsed.fontSize).toBe(20)
      })
  })
  })

---

Phase 4: Create Domain Services ⏱️ ~30 min
4.1 Create lib/notes/NotesService.ts
import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { LocalStorageNoteRepository } from "./LocalStorageNoteRepository"
export class NotesService {
constructor(private repository: LocalStorageNoteRepository) {}
createNewNote(collection: NoteCollection): { note: Note; collection: NoteCollection } {
const name = collection.generateUniqueName()
const note = Note.create(name, "")
const newCollection = collection.add(note)
this.repository.saveAll(newCollection)
this.repository.saveActiveNoteId(note.id)
return { note, collection: newCollection }
}
switchToNote(noteId: string): void {
this.repository.saveActiveNoteId(noteId)
}
deleteNote(
noteId: string,
activeNoteId: string | null,
collection: NoteCollection
): { collection: NoteCollection; newActiveNoteId: string | null } {
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
this.repository.saveAll(newCollection)
if (newActiveNoteId) {
this.repository.saveActiveNoteId(newActiveNoteId)
}
return { collection: newCollection, newActiveNoteId }
}
renameNote(noteId: string, newName: string, collection: NoteCollection): NoteCollection {
const note = collection.findById(noteId)
if (!note) return collection
const renamedNote = note.rename(newName)
const newCollection = collection.update(renamedNote)
this.repository.saveAll(newCollection)
return newCollection
}
updateNoteContent(noteId: string, content: string, collection: NoteCollection): NoteCollection {
const note = collection.findById(noteId)
if (!note) return collection
const updatedNote = note.updateContent(content)
return collection.update(updatedNote)
}
saveNote(noteId: string, collection: NoteCollection): NoteCollection {
const note = collection.findById(noteId)
if (!note) return collection
const touchedNote = note.touch()
const newCollection = collection.update(touchedNote)
this.repository.saveAll(newCollection)
return newCollection
}
}
4.2 Create lib/notes/NotesService.test.ts
import { describe, it, expect, beforeEach } from "vitest"
import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { LocalStorageNoteRepository } from "./LocalStorageNoteRepository"
import { NotesService } from "./NotesService"
// Mock localStorage
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
it("should create note with unique name", () => {
const collection = new NoteCollection([])
const result = service.createNewNote(collection)
expect(result.note.name).toBe("Untitled 1")
expect(result.collection.count).toBe(1)
})
it("should increment name for subsequent notes", () => {
let collection = new NoteCollection([])

      const result1 = service.createNewNote(collection)
      const result2 = service.createNewNote(result1.collection)
      expect(result1.note.name).toBe("Untitled 1")
      expect(result2.note.name).toBe("Untitled 2")
    })
    it("should save to repository", () => {
      const collection = new NoteCollection([])
      service.createNewNote(collection)
      const loaded = repository.loadAll()
      expect(loaded.count).toBe(1)
    })

})
describe("deleteNote", () => {
it("should delete note and switch to next", () => {
const note1 = Note.create("Note 1")
const note2 = Note.create("Note 2")
const collection = new NoteCollection([note1, note2])
const result = service.deleteNote(note1.id, note1.id, collection)
expect(result.collection.count).toBe(1)
expect(result.newActiveNoteId).toBe(note2.id)
})
it("should create new note when deleting last one", () => {
const note = Note.create("Only Note")
const collection = new NoteCollection([note])
const result = service.deleteNote(note.id, note.id, collection)
expect(result.collection.count).toBe(1)
expect(result.collection.all[0].name).toBe("Untitled 1")
})
it("should not change active note when deleting non-active note", () => {
const note1 = Note.create("Note 1")
const note2 = Note.create("Note 2")
const collection = new NoteCollection([note1, note2])
const result = service.deleteNote(note2.id, note1.id, collection)
expect(result.newActiveNoteId).toBe(note1.id)
expect(result.collection.count).toBe(1)
})
})
describe("renameNote", () => {
it("should rename note and update timestamp", () => {
const note = Note.create("Old Name")
const collection = new NoteCollection([note])
const newCollection = service.renameNote(note.id, "New Name", collection)
const renamed = newCollection.findById(note.id)
expect(renamed?.name).toBe("New Name")
expect(renamed?.lastModified).toBeGreaterThan(note.lastModified)
})
})
describe("updateNoteContent", () => {
it("should update content without touching timestamp", () => {
const note = Note.create("Test", "old content")
const collection = new NoteCollection([note])
const newCollection = service.updateNoteContent(note.id, "new content", collection)
const updated = newCollection.findById(note.id)
expect(updated?.content).toBe("new content")
expect(updated?.lastModified).toBe(note.lastModified)
})
})
describe("saveNote", () => {
it("should touch note and update timestamp", () => {
const note = Note.create("Test")
const collection = new NoteCollection([note])
const newCollection = service.saveNote(note.id, collection)
const saved = newCollection.findById(note.id)
expect(saved?.lastModified).toBeGreaterThan(note.lastModified)
})
})
})
4.3 Create lib/notes/ShareService.ts
import LZString from "lz-string"
import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { ShareData } from "./types"
export class ShareService {
compressNote(note: Note): string {
const shareData: ShareData = {
id: note.id,
n: note.name,
c: note.content,
v: "1",
}
const json = JSON.stringify(shareData)
return LZString.compressToEncodedURIComponent(json)
}
decompressSharedData(hash: string): ShareData | null {
try {
const decompressed = LZString.decompressFromEncodedURIComponent(hash)
if (!decompressed) return null
const parsed = JSON.parse(decompressed)
if (
typeof parsed !== "object" ||
typeof parsed.id !== "string" ||
typeof parsed.c !== "string" ||
parsed.v !== "1"
) {
console.error("Invalid share data structure")
return null
}
return parsed as ShareData
} catch (error) {
console.error("Failed to decompress shared note:", error)
return null
}
}
createShareURL(note: Note, baseURL: string = window.location.origin): string {
const compressed = this.compressNote(note)
return `${baseURL}/#${compressed}`
}
importSharedNote(
sharedData: ShareData,
collection: NoteCollection,
action: "replace" | "keep-both"
): { note: Note; collection: NoteCollection } {
if (action === "replace") {
const existingNote = collection.findById(sharedData.id)
if (!existingNote) {
throw new Error("Note not found for replacement")
}
const replacedNote = existingNote.updateContent(sharedData.c).touch()
return {
note: replacedNote,
collection: collection.update(replacedNote),
}
} else {
// Keep both - create new note
const name = `Copy of ${sharedData.n || "Untitled"}`
const newNote = Note.create(name, sharedData.c)
return {
note: newNote,
collection: collection.add(newNote),
}
}
}
}
4.4 Create lib/notes/ShareService.test.ts
import { describe, it, expect } from "vitest"
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

      const compressed = service.compressNote(note)
      expect(compressed).toBeTruthy()
      expect(typeof compressed).toBe("string")

      const decompressed = service.decompressSharedData(compressed)
      expect(decompressed).not.toBeNull()
      expect(decompressed?.id).toBe(note.id)
      expect(decompressed?.n).toBe("Test Note")
      expect(decompressed?.c).toBe("Hello World")
    })
    it("should handle invalid data gracefully", () => {
      const invalid = service.decompressSharedData("invalid-data")
      expect(invalid).toBeNull()
    })

})
describe("createShareURL", () => {
it("should create URL with compressed data in hash", () => {
const note = Note.create("Test", "content")
const url = service.createShareURL(note, "https://example.com")

      expect(url).toContain("https://example.com/#")
      expect(url.length).toBeGreaterThan("https://example.com/#".length)
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

      expect(result.note.content).toBe("new content")
      expect(result.note.id).toBe(original.id)
      expect(result.collection.count).toBe(1)
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

      expect(result.note.name).toBe("Copy of Original")
      expect(result.note.content).toBe("new content")
      expect(result.note.id).not.toBe(original.id)
      expect(result.collection.count).toBe(2)
    })

})
})

---

Phase 5: Create React Hook ⏱️ ~30 min
5.1 Create hooks/notes/useNotes.ts
"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Note } from "@/lib/notes/Note"
import { NoteCollection } from "@/lib/notes/NoteCollection"
import { LocalStorageNoteRepository } from "@/lib/notes/LocalStorageNoteRepository"
import { NotesService } from "@/lib/notes/NotesService"
import { ShareService } from "@/lib/notes/ShareService"
import { Preferences } from "@/lib/preferences/Preferences"
import { PreferencesRepository } from "@/lib/preferences/PreferencesRepository"
import { ShareData } from "@/lib/notes/types"
// Singleton instances
const noteRepository = new LocalStorageNoteRepository()
const notesService = new NotesService(noteRepository)
const shareService = new ShareService()
const preferencesRepository = new PreferencesRepository()
export function useNotes() {
const [collection, setCollection] = useState<NoteCollection>(new NoteCollection([]))
const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
const [preferences, setPreferences] = useState<Preferences>(Preferences.default())
const [isLoaded, setIsLoaded] = useState(false)
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
const lastSavedContentRef = useRef<string>("")
const activeNote = collection.findById(activeNoteId || "")
// Save function
const save = useCallback(() => {
if (!activeNote) return
const newCollection = notesService.saveNote(activeNote.id, collection)
setCollection(newCollection)
lastSavedContentRef.current = activeNote.content
setHasUnsavedChanges(false)
}, [activeNote, collection])
// Initialize on mount
useEffect(() => {
if (typeof window === "undefined") return
// Load preferences
const loadedPrefs = preferencesRepository.load()
setPreferences(loadedPrefs)
// Check for shared URL first
const hash = window.location.hash.slice(1)
if (hash) {
const sharedNote = shareService.decompressSharedData(hash)
if (sharedNote) {
let loadedCollection = noteRepository.loadAll()
const existingNote = loadedCollection.findById(sharedNote.id)
if (existingNote) {
const localHash = existingNote.computeContentHash()
const sharedHash = existingNote.updateContent(sharedNote.c).computeContentHash()
if (localHash === sharedHash) {
// Same content
setCollection(loadedCollection)
setActiveNoteId(existingNote.id)
lastSavedContentRef.current = existingNote.content
} else {
// Different content - store for conflict dialog
setCollection(loadedCollection)
setActiveNoteId(existingNote.id)
lastSavedContentRef.current = existingNote.content
sessionStorage.setItem("pending-shared-note", JSON.stringify(sharedNote))
}
} else {
// New note - import it
const result = shareService.importSharedNote(sharedNote, loadedCollection, "keep-both")
setCollection(result.collection)
setActiveNoteId(result.note.id)
noteRepository.saveAll(result.collection)
noteRepository.saveActiveNoteId(result.note.id)
lastSavedContentRef.current = result.note.content
}
window.history.replaceState(null, "", window.location.pathname)
setIsLoaded(true)
return
}
}
// Normal load from repository
let loadedCollection = noteRepository.loadAll()
if (loadedCollection.count === 0) {
const firstNote = Note.create("Untitled 1", "")
loadedCollection = loadedCollection.add(firstNote)
noteRepository.saveAll(loadedCollection)
noteRepository.saveActiveNoteId(firstNote.id)
setCollection(loadedCollection)
setActiveNoteId(firstNote.id)
lastSavedContentRef.current = ""
} else {
const activeId = noteRepository.loadActiveNoteId() || loadedCollection.all[0].id
const activeNoteData = loadedCollection.findById(activeId) || loadedCollection.all[0]
setCollection(loadedCollection)
setActiveNoteId(activeNoteData.id)
lastSavedContentRef.current = activeNoteData.content
}
setIsLoaded(true)
}, [])
// Auto-save every 10 seconds
useEffect(() => {
if (!isLoaded || !activeNote) return
if (autoSaveTimerRef.current) {
clearTimeout(autoSaveTimerRef.current)
}
if (activeNote.content !== lastSavedContentRef.current) {
autoSaveTimerRef.current = setTimeout(() => {
save()
}, 10000)
}
return () => {
if (autoSaveTimerRef.current) {
clearTimeout(autoSaveTimerRef.current)
}
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeNote?.content, isLoaded, save])
// Track unsaved changes
useEffect(() => {
if (!activeNote) {
setHasUnsavedChanges(false)
return
}
setHasUnsavedChanges(activeNote.content !== lastSavedContentRef.current)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeNote?.content])
// Create new note
const createNewNote = useCallback(() => {
const result = notesService.createNewNote(collection)
setCollection(result.collection)
setActiveNoteId(result.note.id)
lastSavedContentRef.current = ""
}, [collection])
// Switch note
const switchNote = useCallback(
(noteId: string) => {
if (activeNote && activeNote.content !== lastSavedContentRef.current) {
save()
}
notesService.switchToNote(noteId)
setActiveNoteId(noteId)
const note = collection.findById(noteId)
if (note) {
lastSavedContentRef.current = note.content
}
},
[activeNote, collection, save]
)
// Delete note
const deleteNote = useCallback(
(noteId: string) => {
const result = notesService.deleteNote(noteId, activeNoteId, collection)
setCollection(result.collection)
setActiveNoteId(result.newActiveNoteId)
const note = result.collection.findById(result.newActiveNoteId || "")
lastSavedContentRef.current = note?.content || ""
},
[collection, activeNoteId]
)
// Rename note
const renameNote = useCallback(
(noteId: string, newName: string) => {
const newCollection = notesService.renameNote(noteId, newName, collection)
setCollection(newCollection)
},
[collection]
)
// Update content
const updateContent = useCallback(
(content: string) => {
if (!activeNote) return
const newCollection = notesService.updateNoteContent(activeNote.id, content, collection)
setCollection(newCollection)
},
[activeNote, collection]
)
// Share note
const shareNote = useCallback((): string | null => {
if (!activeNote) return null
return shareService.createShareURL(activeNote)
}, [activeNote])
// Import shared note
const importSharedNote = useCallback(
(sharedData: ShareData, action: "replace" | "keep-both") => {
const result = shareService.importSharedNote(sharedData, collection, action)
setCollection(result.collection)
setActiveNoteId(result.note.id)
noteRepository.saveAll(result.collection)
noteRepository.saveActiveNoteId(result.note.id)
lastSavedContentRef.current = result.note.content
},
[collection]
)
// Save preferences
const savePrefs = useCallback((prefs: Preferences) => {
setPreferences(prefs)
preferencesRepository.save(prefs)
}, [])
// Keyboard shortcut for save
useEffect(() => {
const handleKeyDown = (e: KeyboardEvent) => {
if ((e.metaKey || e.ctrlKey) && e.key === "s") {
e.preventDefault()
save()
}
}
window.addEventListener("keydown", handleKeyDown)
return () => window.removeEventListener("keydown", handleKeyDown)
}, [save])
// Warn before closing with unsaved changes
useEffect(() => {
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
if (hasUnsavedChanges) {
e.preventDefault()
e.returnValue = ""
}
}
window.addEventListener("beforeunload", handleBeforeUnload)
return () => window.removeEventListener("beforeunload", handleBeforeUnload)
}, [hasUnsavedChanges])
return {
notes: collection.all,
activeNote,
preferences,
isLoaded,
hasUnsavedChanges,
createNote: createNewNote,
switchNote,
deleteNote,
renameNote,
updateContent,
save,
shareNote,
importSharedNote,
savePreferences: savePrefs,
}
}

---

Phase 6: Update Component Imports ⏱️ ~10 min
Update components/App.tsx:
// OLD imports
import { useNotes } from "@/lib/use-notes"
import { Preferences, ShareData } from "@/lib/types"
// NEW imports
import { useNotes } from "@/hooks/notes/useNotes"
import { Preferences } from "@/lib/preferences/Preferences"
import { ShareData } from "@/lib/notes/types"
Update other components similarly if they import from old locations.

---

Phase 7: Delete Old Files ⏱️ ~2 min
Delete:

- lib/use-notes.ts
- lib/use-local-storage.ts
- lib/types.ts
- lib/note-utils.ts
- lib/storage.ts
- lib/url-utils.ts

---

Phase 8: Testing & Validation ⏱️ ~15 min

1. Run tests:
   npm run lint # Should pass
   npm test # All tests should pass (old + new)
2. Manual testing:
   - Create note
   - Rename note
   - Delete note
   - Switch notes
   - Share note via URL
   - Import shared note
   - Auto-save (wait 10s after typing)
   - Preferences save/load
   - Browser refresh preserves state
3. Check console: No errors in browser console

---

Phase 9: Update Documentation ⏱️ ~5 min
Update AGENTS.md with new architecture section (shown earlier in the plan).

---

🎯 Final Structure Summary
lib/
notes/ # 12 files
Note.ts + Note.test.ts
NoteCollection.ts + NoteCollection.test.ts
NotesService.ts + NotesService.test.ts
ShareService.ts + ShareService.test.ts
LocalStorageNoteRepository.ts + LocalStorageNoteRepository.test.ts
types.ts

preferences/ # 4 files
Preferences.ts + Preferences.test.ts
PreferencesRepository.ts + PreferencesRepository.test.ts

engine/ # Unchanged
hooks/
notes/
useNotes.ts # 1 file
components/ # Minor import updates
Total New Files: 17 files (12 in notes, 4 in preferences, 1 in hooks)  
Deleted Files: 6 files  
Modified Files: 1 file (App.tsx imports)

---

---

❓ Final Questions Before Implementation

1. Immutability Trade-off: Entities are immutable (return new instances). This is clean but creates more objects. For this app size, it should be fine. Acceptable?
2. Singleton Services: Using singleton instances in the hook. Alternative would be React Context for dependency injection. Keep simple or add DI?
3. Test Coverage: I've included basic happy-path tests. Should we add more edge cases, or is this sufficient for the refactoring?
4. Error Handling: Currently using console.error and returning null/empty values. Should we throw exceptions or use Result types?
5. Migration Strategy: All at once (2.5 hours of work, no commits until done) OR incremental (commit after each phase)? I recommend incremental so we can validate each step.
   Ready to proceed? 🚀
   ▣ Plan · claude-sonnet-4.5 · 1m 54s
   yes immutability is fine
   use singleton for now
   the tests are fine for now
   use result types
