import LZString from "lz-string"
import { Note } from "./Note"
import { NoteCollection } from "./NoteCollection"
import { ShareData } from "./types"
import { Result } from "../result"

export class ShareService {
  compressNote(note: Note): Result<string, string> {
    try {
      const shareData: ShareData = {
        id: note.id,
        n: note.name,
        c: note.content,
        v: "1",
      }
      const json = JSON.stringify(shareData)
      const compressed = LZString.compressToEncodedURIComponent(json)
      return { ok: true, value: compressed }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to compress note: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  decompressSharedData(hash: string): Result<ShareData, string> {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(hash)
      if (!decompressed) {
        return { ok: false, error: "Failed to decompress: empty result" }
      }

      const parsed = JSON.parse(decompressed)

      if (
        typeof parsed !== "object" ||
        typeof parsed.id !== "string" ||
        typeof parsed.c !== "string" ||
        parsed.v !== "1"
      ) {
        return { ok: false, error: "Invalid share data structure" }
      }

      return { ok: true, value: parsed as ShareData }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to decompress shared note: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  createShareURL(note: Note, baseURL: string = window.location.origin): Result<string, string> {
    const compressResult = this.compressNote(note)
    if (!compressResult.ok) {
      return compressResult
    }

    try {
      return { ok: true, value: `${baseURL}/#${compressResult.value}` }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to create share URL: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  importSharedNote(
    sharedData: ShareData,
    collection: NoteCollection,
    action: "replace" | "keep-both"
  ): Result<{ note: Note; collection: NoteCollection }, string> {
    try {
      if (action === "replace") {
        const existingNote = collection.findById(sharedData.id)
        if (!existingNote) {
          return { ok: false, error: "Note not found for replacement" }
        }

        const replacedNote = existingNote.updateContent(sharedData.c).touch()
        return {
          ok: true,
          value: {
            note: replacedNote,
            collection: collection.update(replacedNote),
          },
        }
      } else {
        // Keep both - create new note
        const name = `Copy of ${sharedData.n || "Untitled"}`
        const newNote = Note.create(name, sharedData.c)
        return {
          ok: true,
          value: {
            note: newNote,
            collection: collection.add(newNote),
          },
        }
      }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to import shared note: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }
}
