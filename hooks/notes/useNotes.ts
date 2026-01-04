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

    const result = notesService.saveNote(activeNote.id, collection)
    if (result.ok) {
      setCollection(result.value)
      lastSavedContentRef.current = activeNote.content
      setHasUnsavedChanges(false)
    } else {
      console.error("Failed to save note:", result.error)
    }
  }, [activeNote, collection])

  // Initialize on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    // Load preferences
    const prefsResult = preferencesRepository.load()
    if (prefsResult.ok) {
      setPreferences(prefsResult.value)
    } else {
      console.error("Failed to load preferences:", prefsResult.error)
    }

    // Check for shared URL first
    const hash = window.location.hash.slice(1)
    if (hash) {
      const sharedResult = shareService.decompressSharedData(hash)
      if (sharedResult.ok) {
        const sharedNote = sharedResult.value

        const loadResult = noteRepository.loadAll()
        if (!loadResult.ok) {
          console.error("Failed to load notes:", loadResult.error)
          setIsLoaded(true)
          return
        }

        const loadedCollection = loadResult.value
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
          const importResult = shareService.importSharedNote(
            sharedNote,
            loadedCollection,
            "keep-both"
          )
          if (importResult.ok) {
            setCollection(importResult.value.collection)
            setActiveNoteId(importResult.value.note.id)
            noteRepository.saveAll(importResult.value.collection)
            noteRepository.saveActiveNoteId(importResult.value.note.id)
            lastSavedContentRef.current = importResult.value.note.content
          } else {
            console.error("Failed to import shared note:", importResult.error)
          }
        }

        window.history.replaceState(null, "", window.location.pathname)
        setIsLoaded(true)
        return
      }
    }

    // Normal load from repository
    const loadResult = noteRepository.loadAll()
    if (!loadResult.ok) {
      console.error("Failed to load notes:", loadResult.error)
      setIsLoaded(true)
      return
    }

    let loadedCollection = loadResult.value
    if (loadedCollection.count === 0) {
      const firstNote = Note.create("Untitled 1", "")
      loadedCollection = loadedCollection.add(firstNote)
      noteRepository.saveAll(loadedCollection)
      noteRepository.saveActiveNoteId(firstNote.id)
      setCollection(loadedCollection)
      setActiveNoteId(firstNote.id)
      lastSavedContentRef.current = ""
    } else {
      const activeIdResult = noteRepository.loadActiveNoteId()
      const activeId =
        (activeIdResult.ok ? activeIdResult.value : null) || loadedCollection.all[0].id
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
    if (result.ok) {
      setCollection(result.value.collection)
      setActiveNoteId(result.value.note.id)
      lastSavedContentRef.current = ""
    } else {
      console.error("Failed to create note:", result.error)
    }
  }, [collection])

  // Switch note
  const switchNote = useCallback(
    (noteId: string) => {
      if (activeNote && activeNote.content !== lastSavedContentRef.current) {
        save()
      }

      const result = notesService.switchToNote(noteId)
      if (result.ok) {
        setActiveNoteId(noteId)
        const note = collection.findById(noteId)
        if (note) {
          lastSavedContentRef.current = note.content
        }
      } else {
        console.error("Failed to switch note:", result.error)
      }
    },
    [activeNote, collection, save]
  )

  // Delete note
  const deleteNote = useCallback(
    (noteId: string) => {
      const result = notesService.deleteNote(noteId, activeNoteId, collection)
      if (result.ok) {
        setCollection(result.value.collection)
        setActiveNoteId(result.value.newActiveNoteId)
        const note = result.value.collection.findById(result.value.newActiveNoteId || "")
        lastSavedContentRef.current = note?.content || ""
      } else {
        console.error("Failed to delete note:", result.error)
      }
    },
    [collection, activeNoteId]
  )

  // Rename note
  const renameNote = useCallback(
    (noteId: string, newName: string) => {
      const result = notesService.renameNote(noteId, newName, collection)
      if (result.ok) {
        setCollection(result.value)
      } else {
        console.error("Failed to rename note:", result.error)
      }
    },
    [collection]
  )

  // Update content
  const updateContent = useCallback(
    (content: string) => {
      if (!activeNote) return

      const result = notesService.updateNoteContent(activeNote.id, content, collection)
      if (result.ok) {
        setCollection(result.value)
      } else {
        console.error("Failed to update content:", result.error)
      }
    },
    [activeNote, collection]
  )

  // Share note
  const shareNote = useCallback((): string | null => {
    if (!activeNote) return null

    const result = shareService.createShareURL(activeNote)
    if (result.ok) {
      return result.value
    } else {
      console.error("Failed to create share URL:", result.error)
      return null
    }
  }, [activeNote])

  // Import shared note
  const importSharedNote = useCallback(
    (sharedData: ShareData, action: "replace" | "keep-both") => {
      const result = shareService.importSharedNote(sharedData, collection, action)
      if (result.ok) {
        setCollection(result.value.collection)
        setActiveNoteId(result.value.note.id)
        noteRepository.saveAll(result.value.collection)
        noteRepository.saveActiveNoteId(result.value.note.id)
        lastSavedContentRef.current = result.value.note.content
      } else {
        console.error("Failed to import shared note:", result.error)
      }
    },
    [collection]
  )

  // Save preferences
  const savePrefs = useCallback((prefs: Preferences) => {
    setPreferences(prefs)
    const result = preferencesRepository.save(prefs)
    if (!result.ok) {
      console.error("Failed to save preferences:", result.error)
    }
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
