import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { NoteRepository } from "./NoteRepository"
import { FileFormat } from "./types"
import { Result } from "../result"
import { get, set, del } from "idb-keyval"
import "./file-system-types" // Type augmentations

const FOLDER_HANDLE_KEY = "mathpad-folder-handle"

/**
 * Repository implementation using File System Access API.
 * Stores notes as {name}.json files in a user-selected folder.
 */
export class FileSystemNoteRepository implements NoteRepository {
  private folderHandle: FileSystemDirectoryHandle | null = null
  private fileHandles: Map<string, FileSystemFileHandle> = new Map()

  /**
   * Check if File System Access API is supported
   */
  static isSupported(): boolean {
    return typeof window !== "undefined" && "showDirectoryPicker" in window
  }

  /**
   * Open a folder and request permissions
   */
  async openFolder(): Promise<Result<string, string>> {
    if (!FileSystemNoteRepository.isSupported()) {
      return { ok: false, error: "File System Access API not supported" }
    }

    try {
      // Show directory picker
      const handle = await (
        window as unknown as {
          showDirectoryPicker: (options: { mode: string }) => Promise<FileSystemDirectoryHandle>
        }
      ).showDirectoryPicker({
        mode: "readwrite",
      })

      // Store handle in IndexedDB for persistence
      await set(FOLDER_HANDLE_KEY, handle)
      this.folderHandle = handle

      return { ok: true, value: handle.name }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { ok: false, error: "Folder selection cancelled" }
      }
      return {
        ok: false,
        error: `Failed to open folder: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Load folder handle from IndexedDB
   */
  async loadFolderHandle(): Promise<Result<string | null, string>> {
    try {
      const handle = await get<FileSystemDirectoryHandle>(FOLDER_HANDLE_KEY)
      if (!handle) {
        return { ok: true, value: null }
      }

      // Request permission if needed
      const permission = await handle.queryPermission({ mode: "readwrite" })
      if (permission === "denied") {
        await this.closeFolder()
        return { ok: false, error: "Folder permission denied" }
      }

      if (permission === "prompt") {
        const newPermission = await handle.requestPermission({ mode: "readwrite" })
        if (newPermission !== "granted") {
          await this.closeFolder()
          return { ok: false, error: "Folder permission denied" }
        }
      }

      this.folderHandle = handle
      return { ok: true, value: handle.name }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to load folder handle: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Close folder and clear handle
   */
  async closeFolder(): Promise<Result<void, string>> {
    try {
      await del(FOLDER_HANDLE_KEY)
      this.folderHandle = null
      this.fileHandles.clear()
      return { ok: true, value: undefined }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to close folder: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Check if folder is currently mapped
   */
  isFolderMapped(): boolean {
    return this.folderHandle !== null
  }

  /**
   * Get folder name if mapped
   */
  getFolderName(): string | null {
    return this.folderHandle?.name || null
  }

  /**
   * Load all notes from folder
   */
  async loadAll(): Promise<Result<NoteCollection, string>> {
    if (!this.folderHandle) {
      return { ok: true, value: new NoteCollection([]) }
    }

    try {
      const notes: Note[] = []
      this.fileHandles.clear()

      // Scan for *.json files
      for await (const entry of this.folderHandle.values()) {
        if (entry.kind === "file" && entry.name.endsWith(".json")) {
          try {
            const fileHandle = entry as FileSystemFileHandle
            const file = await fileHandle.getFile()
            const content = await file.text()
            const data: FileFormat = JSON.parse(content)

            // Validate format
            if (
              data.version === "1.0" &&
              typeof data.id === "string" &&
              typeof data.name === "string" &&
              typeof data.content === "string"
            ) {
              // Get file lastModified timestamp
              const note = Note.fromJSON({
                id: data.id,
                name: data.name,
                content: data.content,
                lastModified: file.lastModified,
              })
              notes.push(note)
              this.fileHandles.set(data.id, fileHandle)
            } else {
              console.warn(`Invalid note format in file: ${entry.name}`)
            }
          } catch (error) {
            console.warn(`Failed to parse note file: ${entry.name}`, error)
          }
        }
      }

      return { ok: true, value: new NoteCollection(notes) }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to load notes from folder: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Save all notes to folder
   */
  async saveAll(collection: NoteCollection): Promise<Result<void, string>> {
    if (!this.folderHandle) {
      return { ok: true, value: undefined }
    }

    try {
      // Save each note
      for (const note of collection.all) {
        const result = await this.saveNote(note)
        if (!result.ok) {
          return result
        }
      }

      // Delete files for notes that were removed
      const noteIds = new Set(collection.all.map((n) => n.id))
      for (const [id, handle] of this.fileHandles.entries()) {
        if (!noteIds.has(id)) {
          try {
            await this.folderHandle.removeEntry(handle.name)
            this.fileHandles.delete(id)
          } catch (error) {
            console.warn(`Failed to delete file for removed note: ${id}`, error)
          }
        }
      }

      return { ok: true, value: undefined }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to save notes to folder: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Save a single note to folder
   */
  async saveNote(note: Note): Promise<Result<void, string>> {
    if (!this.folderHandle) {
      return { ok: true, value: undefined }
    }

    try {
      const filename = `${note.id.slice(0, 8)}.json`
      const fileFormat: FileFormat = {
        version: "1.0",
        id: note.id,
        name: note.name,
        content: note.content,
      }

      // Get or create file handle
      const fileHandle =
        this.fileHandles.get(note.id) ||
        (await this.folderHandle.getFileHandle(filename, { create: true }))

      this.fileHandles.set(note.id, fileHandle)

      // Write to file
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(fileFormat, null, 2))
      await writable.close()

      return { ok: true, value: undefined }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to save note: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Delete a note from folder
   */
  async deleteNote(noteId: string): Promise<Result<void, string>> {
    if (!this.folderHandle) {
      return { ok: true, value: undefined }
    }

    try {
      const fileHandle = this.fileHandles.get(noteId)
      if (fileHandle) {
        await this.folderHandle.removeEntry(fileHandle.name)
        this.fileHandles.delete(noteId)
      } else {
        // Try to delete by UUID filename directly
        const filename = `${noteId.slice(0, 8)}.json`
        try {
          await this.folderHandle.removeEntry(filename)
        } catch {
          // File might not exist, that's okay
        }
      }
      return { ok: true, value: undefined }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to delete note: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Check for external changes
   * Returns notes that were modified, deleted, or added externally
   */
  async checkExternalChanges(
    currentCollection: NoteCollection
  ): Promise<Result<{ modified: Note[]; deleted: string[]; added: Note[] }, string>> {
    if (!this.folderHandle) {
      return { ok: true, value: { modified: [], deleted: [], added: [] } }
    }

    try {
      const modified: Note[] = []
      const added: Note[] = []
      const foundIds = new Set<string>()

      // Scan folder for changes
      for await (const entry of this.folderHandle.values()) {
        if (entry.kind === "file" && entry.name.endsWith(".json")) {
          try {
            const fileHandle = entry as FileSystemFileHandle
            const file = await fileHandle.getFile()
            const content = await file.text()
            const data: FileFormat = JSON.parse(content)

            if (data.version === "1.0" && typeof data.id === "string") {
              foundIds.add(data.id)
              const existingNote = currentCollection.findById(data.id)

              if (existingNote) {
                // Check if modified
                if (file.lastModified > existingNote.lastModified) {
                  const note = Note.fromJSON({
                    id: data.id,
                    name: data.name,
                    content: data.content,
                    lastModified: file.lastModified,
                  })
                  modified.push(note)
                  this.fileHandles.set(data.id, fileHandle)
                }
              } else {
                // New note added externally
                const note = Note.fromJSON({
                  id: data.id,
                  name: data.name,
                  content: data.content,
                  lastModified: file.lastModified,
                })
                added.push(note)
                this.fileHandles.set(data.id, fileHandle)
              }
            }
          } catch (error) {
            console.warn(`Failed to check file: ${entry.name}`, error)
          }
        }
      }

      // Find deleted notes
      const deleted: string[] = []
      for (const note of currentCollection.all) {
        if (!foundIds.has(note.id) && this.fileHandles.has(note.id)) {
          deleted.push(note.id)
          this.fileHandles.delete(note.id)
        }
      }

      return { ok: true, value: { modified, deleted, added } }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to check external changes: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * NoteRepository interface methods
   * These delegate to the main folder operations
   */
  loadActiveNoteId(): Result<string | null, string> {
    // Active note ID is stored in localStorage, not in folder
    return { ok: true, value: null }
  }

  saveActiveNoteId(): Result<void, string> {
    // Active note ID is stored in localStorage, not in folder
    return { ok: true, value: undefined }
  }
}
