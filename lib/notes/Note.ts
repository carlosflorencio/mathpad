export class Note {
  constructor(
    public readonly id: string,
    private _name: string,
    private _content: string,
    private _lastModified: number
  ) {}

  // Getters
  get name(): string {
    return this._name
  }
  get content(): string {
    return this._content
  }
  get lastModified(): number {
    return this._lastModified
  }

  // Domain methods (immutable)
  rename(newName: string): Note {
    return new Note(this.id, newName, this._content, Date.now())
  }

  updateContent(content: string): Note {
    return new Note(this.id, this._name, content, this._lastModified)
  }

  touch(): Note {
    return new Note(this.id, this._name, this._content, Date.now())
  }

  // Factory method
  static create(name: string, content: string = ""): Note {
    return new Note(generateUUID(), name, content, Date.now())
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      name: this._name,
      content: this._content,
      lastModified: this._lastModified,
    }
  }

  static fromJSON(data: { id: string; name: string; content: string; lastModified: number }): Note {
    return new Note(data.id, data.name, data.content, data.lastModified)
  }

  // Domain logic (from note-utils.ts)
  computeContentHash(): string {
    let hash = 2166136261 // FNV offset basis
    for (let i = 0; i < this._content.length; i++) {
      hash ^= this._content.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0).toString(16).padStart(8, "0")
  }
}

/**
 * Generate a UUID v4 for a note
 * Moved from lib/note-utils.ts
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
