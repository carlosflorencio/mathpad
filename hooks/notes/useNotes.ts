"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Note } from "@/lib/notes/Note"
import { NoteCollection } from "@/lib/notes/NoteCollection"
import { LocalStorageNoteRepository } from "@/lib/notes/LocalStorageNoteRepository"
import { FileSystemNoteRepository } from "@/lib/notes/FileSystemNoteRepository"
import { HybridNoteRepository } from "@/lib/notes/HybridNoteRepository"
import { NotesService } from "@/lib/notes/NotesService"
import { ShareService } from "@/lib/notes/ShareService"
import { Preferences } from "@/lib/preferences/Preferences"
import { PreferencesRepository } from "@/lib/preferences/PreferencesRepository"
import { ShareData } from "@/lib/notes/types"

// Singleton instances
const localStorageRepo = new LocalStorageNoteRepository()
const fileSystemRepo = new FileSystemNoteRepository()
const hybridRepo = new HybridNoteRepository(localStorageRepo, fileSystemRepo)
const notesService = new NotesService(hybridRepo)
const shareService = new ShareService()
const preferencesRepository = new PreferencesRepository()

export function useNotes() {
  const [collection, setCollection] = useState<NoteCollection>(new NoteCollection([]))
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<Preferences>(Preferences.default())
  const [isLoaded, setIsLoaded] = useState(false)

  // Folder sync state
  const [folderName, setFolderName] = useState<string | null>(null)
  const [isFolderMapped, setIsFolderMapped] = useState(false)
  const [pendingDeletions, setPendingDeletions] = useState<Note[]>([])

  const lastSavedContentRef = useRef<string>("")
  const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const collectionRef = useRef<NoteCollection>(collection)

  // Keep ref in sync with state
  useEffect(() => {
    collectionRef.current = collection
  }, [collection])

  const activeNote = collection.findById(activeNoteId || "")

  // Save function (for manual save via Cmd+S if needed)
  const save = useCallback(async () => {
    if (!activeNoteId) return

    // Get the latest content from editorContentRef in App, or use current collection
    const currentCollection = collectionRef.current
    const currentNote = currentCollection.findById(activeNoteId)
    if (!currentNote) return

    // Only save if content has actually changed
    if (currentNote.content === lastSavedContentRef.current) {
      return
    }

    try {
      const result = await notesService.saveNote(activeNoteId, currentCollection)
      if (result.ok) {
        setCollection(result.value)
        lastSavedContentRef.current = currentNote.content
      } else {
        console.error("Failed to save note:", result.error)
      }
    } catch (error) {
      console.error("Error saving note:", error)
    }
  }, [activeNoteId])

  // Debounced save function (called from updateContent)
  const scheduleSave = useCallback(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Schedule new save
    autoSaveTimerRef.current = setTimeout(() => {
      save()
    }, 200)
  }, [save])

  // Initialize on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    // Load preferences
    const prefsResult = preferencesRepository.load()
    if (prefsResult.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

        const loadResult = localStorageRepo.loadAll()
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
            localStorageRepo.saveAll(importResult.value.collection)
            localStorageRepo.saveActiveNoteId(importResult.value.note.id)
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
    const loadResult = localStorageRepo.loadAll()
    if (!loadResult.ok) {
      console.error("Failed to load notes:", loadResult.error)
      setIsLoaded(true)
      return
    }

    let loadedCollection = loadResult.value
    if (loadedCollection.count === 0) {
      const firstNote = Note.create("Untitled 1", "")
      loadedCollection = loadedCollection.add(firstNote)
      localStorageRepo.saveAll(loadedCollection)
      localStorageRepo.saveActiveNoteId(firstNote.id)
      setCollection(loadedCollection)
      setActiveNoteId(firstNote.id)
      lastSavedContentRef.current = ""
    } else {
      const activeIdResult = localStorageRepo.loadActiveNoteId()
      const activeId =
        (activeIdResult.ok ? activeIdResult.value : null) || loadedCollection.all[0].id
      const activeNoteData = loadedCollection.findById(activeId) || loadedCollection.all[0]
      setCollection(loadedCollection)
      setActiveNoteId(activeNoteData.id)
      lastSavedContentRef.current = activeNoteData.content
    }

    setIsLoaded(true)
  }, [])

  // Create new note
  const createNewNote = useCallback(async () => {
    try {
      const result = await notesService.createNewNote(collection)
      if (result.ok) {
        setCollection(result.value.collection)
        setActiveNoteId(result.value.note.id)
        lastSavedContentRef.current = ""
      } else {
        console.error("Failed to create note:", result.error)
      }
    } catch (error) {
      console.error("Error creating note:", error)
    }
  }, [collection])

  // Switch note
  const switchNote = useCallback(
    async (noteId: string) => {
      // Clear any pending auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      if (activeNote && activeNote.content !== lastSavedContentRef.current) {
        await save()
      }

      try {
        const result = await notesService.switchToNote(noteId)
        if (result.ok) {
          setActiveNoteId(noteId)
          const note = collection.findById(noteId)
          if (note) {
            lastSavedContentRef.current = note.content
          }
        } else {
          console.error("Failed to switch note:", result.error)
        }
      } catch (error) {
        console.error("Error switching note:", error)
      }
    },
    [activeNote, collection, save]
  )

  // Delete note
  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        const result = await notesService.deleteNote(noteId, activeNoteId, collection)
        if (result.ok) {
          setCollection(result.value.collection)
          setActiveNoteId(result.value.newActiveNoteId)
          const note = result.value.collection.findById(result.value.newActiveNoteId || "")
          lastSavedContentRef.current = note?.content || ""
        } else {
          console.error("Failed to delete note:", result.error)
        }
      } catch (error) {
        console.error("Error deleting note:", error)
      }
    },
    [collection, activeNoteId]
  )

  // Rename note
  const renameNote = useCallback(async (noteId: string, newName: string) => {
    try {
      const result = await notesService.renameNote(noteId, newName, collectionRef.current)
      if (result.ok) {
        setCollection(result.value)
      } else {
        console.error("Failed to rename note:", result.error)
      }
    } catch (error) {
      console.error("Error renaming note:", error)
    }
  }, [])

  // Update content
  const updateContent = useCallback(
    (content: string) => {
      if (!activeNoteId) return

      // Use functional form of setState to always get latest collection
      setCollection((currentCollection) => {
        const result = notesService.updateNoteContent(activeNoteId, content, currentCollection)
        if (result.ok) {
          // Schedule debounced save (only if content actually changed)
          if (content !== lastSavedContentRef.current) {
            scheduleSave()
          }
          return result.value
        } else {
          console.error("Failed to update content:", result.error)
          return currentCollection
        }
      })
    },
    [activeNoteId, scheduleSave]
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
        localStorageRepo.saveAll(result.value.collection)
        localStorageRepo.saveActiveNoteId(result.value.note.id)
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

  // Folder operations
  const syncWithFolder = useCallback(async () => {
    if (!isFolderMapped) return

    try {
      // Check for external changes
      const changesResult = await fileSystemRepo.checkExternalChanges(collectionRef.current)
      if (!changesResult.ok) {
        console.error("Failed to check external changes:", changesResult.error)
        return
      }

      const changes = changesResult.value

      // Handle deleted notes
      if (changes.deleted.length > 0) {
        // Convert IDs to Note objects
        const deletedNotes = changes.deleted
          .map((id) => collectionRef.current.findById(id))
          .filter((note): note is Note => note !== undefined)
        setPendingDeletions(deletedNotes)
        return // Wait for user confirmation
      }

      // Reload from hybrid repo to merge changes
      const loadResult = await hybridRepo.loadAll()
      if (loadResult.ok) {
        const newCollection = loadResult.value
        setCollection(newCollection)

        // If active note was modified or added, update it
        if (activeNoteId) {
          const activeNote = newCollection.findById(activeNoteId)
          if (activeNote) {
            lastSavedContentRef.current = activeNote.content
          }
        }
      }
    } catch (error) {
      console.error("Error syncing with folder:", error)
    }
  }, [isFolderMapped, activeNoteId])

  const openFolder = useCallback(async () => {
    try {
      const result = await fileSystemRepo.openFolder()
      if (result.ok) {
        setFolderName(result.value)
        setIsFolderMapped(true)

        // Immediately sync all existing local storage notes to filesystem
        const currentCollection = collectionRef.current
        if (currentCollection.count > 0) {
          await fileSystemRepo.saveAll(currentCollection)
        }

        // Trigger initial sync to check for any external changes
        await syncWithFolder()
      } else {
        console.error("Failed to open folder:", result.error)
      }
    } catch (error) {
      console.error("Error opening folder:", error)
    }
  }, [syncWithFolder])

  const closeFolder = useCallback(async () => {
    try {
      await fileSystemRepo.closeFolder()
      setFolderName(null)
      setIsFolderMapped(false)
    } catch (error) {
      console.error("Error closing folder:", error)
    }
  }, [])

  const confirmDeletions = useCallback(async () => {
    // Remove deleted notes from collection
    let updatedCollection = collectionRef.current
    for (const note of pendingDeletions) {
      updatedCollection = updatedCollection.remove(note.id)
    }

    // Save updated collection
    const saveResult = await hybridRepo.saveAll(updatedCollection)
    if (saveResult.ok) {
      setCollection(updatedCollection)

      // If active note was deleted, switch to another
      if (activeNoteId && pendingDeletions.some((n) => n.id === activeNoteId)) {
        const newActiveId = updatedCollection.all[0]?.id || null
        setActiveNoteId(newActiveId)
        lastSavedContentRef.current = updatedCollection.all[0]?.content || ""
      }
    }

    setPendingDeletions([])
  }, [pendingDeletions, activeNoteId])

  const cancelDeletions = useCallback(() => {
    // Keep notes in app, they'll be re-saved to folder on next sync
    setPendingDeletions([])
  }, [])

  // Check folder handle on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    const checkFolderHandle = async () => {
      const result = await fileSystemRepo.loadFolderHandle()
      if (result.ok && result.value) {
        setFolderName(result.value)
        setIsFolderMapped(true)
      }
    }

    checkFolderHandle()
  }, [])

  // Window focus sync
  useEffect(() => {
    if (!isFolderMapped) return

    const handleFocus = async () => {
      await syncWithFolder()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [isFolderMapped, syncWithFolder])

  // 10-second interval sync
  useEffect(() => {
    if (!isFolderMapped) return

    const interval = setInterval(async () => {
      await syncWithFolder()
    }, 10000)

    return () => clearInterval(interval)
  }, [isFolderMapped, syncWithFolder])

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

  return {
    notes: collection.all,
    activeNote,
    preferences,
    isLoaded,
    createNote: createNewNote,
    switchNote,
    deleteNote,
    renameNote,
    updateContent,
    save,
    shareNote,
    importSharedNote,
    savePreferences: savePrefs,
    // Folder sync
    folderName,
    isFolderMapped,
    openFolder,
    closeFolder,
    pendingDeletions,
    confirmDeletions,
    cancelDeletions,
  }
}
