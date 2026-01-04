"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Note, Preferences, defaultPreferences, ShareData } from "./types"
import {
  loadNotesFromStorage,
  saveNotesToStorage,
  loadActiveNoteId,
  saveActiveNoteId,
} from "./storage"
import { createNote, generateNoteName, computeContentHash } from "./note-utils"
import { decompressSharedNote, createShareURL } from "./url-utils"

const PREFERENCES_KEY = "mathpad-preferences"

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastSavedContentRef = useRef<string>("")

  // Get active note
  const activeNote = notes.find((n) => n.id === activeNoteId) || null

  // Save current note
  const save = useCallback(() => {
    if (!activeNote) return

    const updatedNotes = notes.map((n) =>
      n.id === activeNote.id ? { ...n, lastModified: Date.now() } : n
    )
    setNotes(updatedNotes)
    saveNotesToStorage(updatedNotes)
    lastSavedContentRef.current = activeNote.content
    setHasUnsavedChanges(false)
  }, [activeNote, notes])

  // Initialize on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    // Load preferences
    const storedPrefs = localStorage.getItem(PREFERENCES_KEY)
    if (storedPrefs) {
      try {
        setPreferences(JSON.parse(storedPrefs))
      } catch (e) {
        console.error("Failed to parse preferences:", e)
      }
    }

    // Check for shared URL first
    const hash = window.location.hash.slice(1)
    if (hash) {
      const sharedNote = decompressSharedNote(hash)
      if (sharedNote) {
        // Load existing notes
        let loadedNotes = loadNotesFromStorage()

        // Check if note with same ID exists
        const existingNote = loadedNotes.find((n) => n.id === sharedNote.id)

        if (existingNote) {
          // Compare content hashes
          const localHash = computeContentHash(existingNote.content)
          const sharedHash = computeContentHash(sharedNote.c)

          if (localHash === sharedHash) {
            // Same content, just switch to it
            setNotes(loadedNotes)
            setActiveNoteId(existingNote.id)
            lastSavedContentRef.current = existingNote.content
          } else {
            // Different content, will show conflict dialog later
            setNotes(loadedNotes)
            setActiveNoteId(existingNote.id)
            lastSavedContentRef.current = existingNote.content
            // Store shared note for conflict handling
            sessionStorage.setItem("pending-shared-note", JSON.stringify(sharedNote))
          }
        } else {
          // New note, import it
          const newNote: Note = {
            id: sharedNote.id,
            name: sharedNote.n || generateNoteName(loadedNotes.map((n) => n.name)),
            content: sharedNote.c,
            lastModified: Date.now(),
          }
          loadedNotes = [...loadedNotes, newNote]
          setNotes(loadedNotes)
          setActiveNoteId(newNote.id)
          saveNotesToStorage(loadedNotes)
          saveActiveNoteId(newNote.id)
          lastSavedContentRef.current = newNote.content
        }

        // Clear hash from URL
        window.history.replaceState(null, "", window.location.pathname)
        setIsLoaded(true)
        return
      }
    }

    // Normal load from localStorage
    let loadedNotes = loadNotesFromStorage()

    // If no notes exist, create first one
    if (loadedNotes.length === 0) {
      const firstNote = createNote("Untitled 1", "")
      loadedNotes = [firstNote]
      saveNotesToStorage(loadedNotes)
      saveActiveNoteId(firstNote.id)
      setNotes(loadedNotes)
      setActiveNoteId(firstNote.id)
      lastSavedContentRef.current = ""
    } else {
      // Load active note or default to first
      const activeId = loadActiveNoteId() || loadedNotes[0].id
      const activeNoteData = loadedNotes.find((n) => n.id === activeId) || loadedNotes[0]
      setNotes(loadedNotes)
      setActiveNoteId(activeNoteData.id)
      lastSavedContentRef.current = activeNoteData.content
    }

    setIsLoaded(true)
  }, [])

  // Auto-save every 10 seconds
  useEffect(() => {
    if (!isLoaded || !activeNote) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Only set timer if content has changed
    if (activeNote.content !== lastSavedContentRef.current) {
      autoSaveTimerRef.current = setTimeout(() => {
        save()
      }, 10000) // 10 seconds
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
    const newName = generateNoteName(notes.map((n) => n.name))
    const newNote = createNote(newName, "")

    const updatedNotes = [...notes, newNote]
    setNotes(updatedNotes)
    setActiveNoteId(newNote.id)
    saveNotesToStorage(updatedNotes)
    saveActiveNoteId(newNote.id)
    lastSavedContentRef.current = ""
  }, [notes])

  // Switch to a different note
  const switchNote = useCallback(
    (noteId: string) => {
      // Save current note before switching
      if (activeNote && activeNote.content !== lastSavedContentRef.current) {
        save()
      }

      const note = notes.find((n) => n.id === noteId)
      if (note) {
        setActiveNoteId(noteId)
        saveActiveNoteId(noteId)
        lastSavedContentRef.current = note.content
      }
    },
    [activeNote, notes, save]
  )

  // Delete a note
  const deleteNote = useCallback(
    (noteId: string) => {
      const updatedNotes = notes.filter((n) => n.id !== noteId)

      // If deleting active note, switch to another
      if (noteId === activeNoteId) {
        if (updatedNotes.length === 0) {
          // Create a new note if this was the last one
          const newNote = createNote("Untitled 1", "")
          setNotes([newNote])
          setActiveNoteId(newNote.id)
          saveNotesToStorage([newNote])
          saveActiveNoteId(newNote.id)
          lastSavedContentRef.current = ""
        } else {
          // Switch to first remaining note
          const nextNote = updatedNotes[0]
          setNotes(updatedNotes)
          setActiveNoteId(nextNote.id)
          saveNotesToStorage(updatedNotes)
          saveActiveNoteId(nextNote.id)
          lastSavedContentRef.current = nextNote.content
        }
      } else {
        setNotes(updatedNotes)
        saveNotesToStorage(updatedNotes)
      }
    },
    [notes, activeNoteId]
  )

  // Rename a note
  const renameNote = useCallback(
    (noteId: string, newName: string) => {
      const updatedNotes = notes.map((n) =>
        n.id === noteId ? { ...n, name: newName, lastModified: Date.now() } : n
      )
      setNotes(updatedNotes)
      saveNotesToStorage(updatedNotes)
    },
    [notes]
  )

  // Update content of active note
  const updateContent = useCallback(
    (content: string) => {
      if (!activeNote) return

      const updatedNotes = notes.map((n) => (n.id === activeNote.id ? { ...n, content } : n))
      setNotes(updatedNotes)
    },
    [activeNote, notes]
  )

  // Share note
  const shareNote = useCallback((): string | null => {
    if (!activeNote) return null
    return createShareURL(activeNote)
  }, [activeNote])

  // Import shared note (handle conflicts)
  const importSharedNote = useCallback(
    (sharedData: ShareData, action: "replace" | "keep-both") => {
      if (action === "replace") {
        // Replace existing note content
        const updatedNotes = notes.map((n) =>
          n.id === sharedData.id ? { ...n, content: sharedData.c, lastModified: Date.now() } : n
        )
        setNotes(updatedNotes)
        saveNotesToStorage(updatedNotes)
        lastSavedContentRef.current = sharedData.c
      } else {
        // Keep both - import as new note
        const newName = `Copy of ${sharedData.n || "Untitled"}`
        const newNote = createNote(newName, sharedData.c)
        const updatedNotes = [...notes, newNote]
        setNotes(updatedNotes)
        setActiveNoteId(newNote.id)
        saveNotesToStorage(updatedNotes)
        saveActiveNoteId(newNote.id)
        lastSavedContentRef.current = sharedData.c
      }
    },
    [notes]
  )

  // Save preferences
  const savePrefs = useCallback((prefs: Preferences) => {
    setPreferences(prefs)
    if (typeof window !== "undefined") {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
    }
  }, [])

  // Keyboard shortcut for save (Cmd+S / Ctrl+S)
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
    notes,
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
