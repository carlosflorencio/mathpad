"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useNotes } from "@/hooks/notes/useNotes"
import { Preferences } from "@/lib/preferences/Preferences"
import { ShareData } from "@/lib/notes/types"
import { Editor } from "./Editor"
import { Help } from "./Help"
import { PreferencesDialog } from "./PreferencesDialog"
import { ToastContainer } from "./Toast"
import * as darkTheme from "./codemirror/DarkTheme"
import * as lightTheme from "./codemirror/LightTheme"

function configureCSSVars(preferences: Preferences): void {
  if (typeof document !== "undefined" && document.documentElement) {
    const style = document.documentElement.style
    style.setProperty("--font-size", preferences.fontSize + "px")

    const isDark = preferences.theme === "dark"
    const colors = isDark ? darkTheme.colors : lightTheme.colors

    // Colors
    style.setProperty("--text-color", isDark ? colors.light : colors.medium)
    style.setProperty("--text-muted", isDark ? "rgba(214,221,209,0.7)" : "rgba(0,0,0,0.5)")
    style.setProperty("--desk-bg-color", isDark ? colors.darkBackground : "#f8f9fa")
    style.setProperty("--cm-background", colors.background)

    // UI Elements
    style.setProperty("--ui-border-color", isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")
    style.setProperty("--bg-modal", isDark ? "rgba(33,34,38,0.95)" : "rgba(255,255,255,0.95)")
    style.setProperty("--bg-dropdown", isDark ? "rgba(33,34,38,0.8)" : "rgba(255,255,255,0.8)")
    style.setProperty("--bg-input", isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,1)")
    style.setProperty("--bg-button-hover", isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)")
    style.setProperty("--bg-menu-item-hover", "rgba(122,122,122,0.1)")

    // Shadows
    style.setProperty(
      "--paper-shadow",
      isDark ? "var(--paper-shadow-dark)" : "var(--paper-shadow-light)"
    )
  }
}

export function App() {
  const {
    notes,
    activeNote,
    preferences,
    isLoaded,
    createNote,
    switchNote,
    deleteNote,
    renameNote,
    updateContent,
    shareNote,
    importSharedNote,
    savePreferences,
  } = useNotes()

  const [showPreferences, setShowPreferences] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showNotesMenu, setShowNotesMenu] = useState(false)
  const [showManageNotes, setShowManageNotes] = useState(false)
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null)
  const [renamingInModal, setRenamingInModal] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [conflictData, setConflictData] = useState<ShareData | null>(null)

  const menuTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const notesMenuRef = useRef<HTMLDivElement>(null)
  const renameBlurEnabledRef = useRef(false)

  useEffect(() => {
    if (isLoaded) {
      configureCSSVars(preferences)
    }
  }, [isLoaded, preferences])

  // Check for pending shared note conflict
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      const pending = sessionStorage.getItem("pending-shared-note")
      if (pending) {
        try {
          const sharedNote = JSON.parse(pending) as ShareData
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setConflictData(sharedNote)
          sessionStorage.removeItem("pending-shared-note")
        } catch (e) {
          console.error("Failed to parse pending shared note:", e)
        }
      }
    }
  }, [isLoaded])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMenu || showNotesMenu) {
        const target = e.target as HTMLElement
        if (!target.closest(".dropdown-menu") && !target.closest(".icon-button")) {
          setShowMenu(false)
          setShowNotesMenu(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMenu, showNotesMenu])

  const closeDialogs = useCallback(() => {
    setShowPreferences(false)
    setShowHelp(false)
    setShowMenu(false)
    setShowNotesMenu(false)
    setShowManageNotes(false)
  }, [])

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDialogs()
        setRenamingNoteId(null)
        setDeleteConfirmId(null)
        setConflictData(null)
      }
    }

    window.addEventListener("keyup", handleKeyUp)
    return () => window.removeEventListener("keyup", handleKeyUp)
  }, [closeDialogs])

  const handleSavePreferences = useCallback(
    (prefs: Preferences) => {
      savePreferences(prefs)
      configureCSSVars(prefs)
    },
    [savePreferences]
  )

  const showToast = useCallback((message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const handleShare = useCallback(() => {
    const url = shareNote()
    if (url) {
      navigator.clipboard.writeText(url)
      showToast("Link copied to clipboard")
    }
  }, [shareNote, showToast])

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId)
      if (!note) return

      if (deleteConfirmId === noteId) {
        // Confirmed, delete it
        deleteNote(noteId)
        setDeleteConfirmId(null)
        showToast("Note deleted")
      } else {
        // Show confirmation
        setDeleteConfirmId(noteId)
        setTimeout(() => setDeleteConfirmId(null), 3000) // Reset after 3s
      }
    },
    [notes, deleteNote, deleteConfirmId, showToast]
  )

  const startRename = useCallback(
    (noteId: string, currentName: string, inModal: boolean = false) => {
      renameBlurEnabledRef.current = false
      setRenamingNoteId(noteId)
      setRenamingInModal(inModal)
      setRenameValue(currentName)
      // Enable blur after a short delay to prevent immediate blur
      setTimeout(() => {
        renameBlurEnabledRef.current = true
      }, 100)
    },
    []
  )

  const finishRename = useCallback(() => {
    if (!renameBlurEnabledRef.current) {
      return
    }

    if (renamingNoteId && renameValue.trim()) {
      const note = notes.find((n) => n.id === renamingNoteId)
      const newName = renameValue.trim()

      // Only rename and show toast if the name actually changed
      if (note && note.name !== newName) {
        renameNote(renamingNoteId, newName)
        showToast("Note renamed")
      }
    }
    setRenamingNoteId(null)
    setRenamingInModal(false)
    setRenameValue("")
  }, [renamingNoteId, renameValue, renameNote, showToast, notes])

  const handleConflictResolve = useCallback(
    (action: "replace" | "keep-both" | "cancel") => {
      if (!conflictData) return

      if (action === "cancel") {
        setConflictData(null)
        return
      }

      importSharedNote(conflictData, action)
      setConflictData(null)

      if (action === "replace") {
        showToast("Note replaced with shared content")
      } else {
        showToast("Imported as new note")
      }
    },
    [conflictData, importSharedNote, showToast]
  )

  const handleNotesMenuHover = useCallback(() => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current)
    }
    setShowNotesMenu(true)
  }, [])

  const handleNotesMenuLeave = useCallback(() => {
    menuTimeoutRef.current = setTimeout(() => {
      setShowNotesMenu(false)
    }, 300) // 300ms delay before closing
  }, [])

  if (!isLoaded || typeof window === "undefined") {
    return <div className="flex flex-1 bg-[var(--desk-bg-color)]"></div>
  }

  if (!activeNote) {
    return <div className="flex flex-1 bg-[var(--desk-bg-color)]">Loading...</div>
  }

  return (
    <div className="flex flex-col min-h-screen font-mono bg-[var(--desk-bg-color)]">
      <div className="desk-container">
        <div className="paper-container">
          <Editor
            value={activeNote.content}
            onUpdate={updateContent}
            preferences={preferences}
            onCopy={(value: string) => showToast(`Copied: ${value}`)}
          />
        </div>
      </div>

      {(showPreferences || showHelp || conflictData || showManageNotes) && (
        <div className="modal-backdrop" onClick={closeDialogs} />
      )}

      {showPreferences && (
        <PreferencesDialog
          preferences={preferences}
          close={closeDialogs}
          save={handleSavePreferences}
        />
      )}

      {showHelp && <Help close={closeDialogs} />}

      {/* Conflict Resolution Dialog */}
      {conflictData && (
        <div className="modal">
          <h2 className="text-lg mb-4">Note Already Exists</h2>
          <p className="mb-4">
            Note &quot;{conflictData.n || "Untitled"}&quot; already exists with different content.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => handleConflictResolve("cancel")}
              className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConflictResolve("keep-both")}
              className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
            >
              Keep Both
            </button>
            <button
              onClick={() => handleConflictResolve("replace")}
              className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
            >
              Replace
            </button>
          </div>
        </div>
      )}

      {/* Manage Notes Dialog */}
      {showManageNotes && (
        <div className="modal" style={{ maxWidth: "500px" }}>
          <h2 className="text-lg mb-4">Manage Notes</h2>
          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
            {notes.map((note) => {
              return (
                <div
                  key={note.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-[var(--bg-button-hover)]"
                >
                  {renamingNoteId === note.id && renamingInModal ? (
                    <>
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") finishRename()
                          if (e.key === "Escape") setRenamingNoteId(null)
                        }}
                        onBlur={finishRename}
                        className="flex-1 px-2 py-1 bg-[var(--bg-input)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] cursor-text outline-none focus:border-[var(--text-muted)]"
                        ref={(input) => {
                          if (input) {
                            setTimeout(() => input.focus(), 0)
                          }
                        }}
                      />
                      {notes.length > 1 && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="px-2 py-1 text-[var(--text-muted)] hover:text-red-500 border border-[var(--ui-border-color)] rounded cursor-pointer hover:border-red-500"
                          title={deleteConfirmId === note.id ? "Click again to confirm" : "Delete"}
                        >
                          {deleteConfirmId === note.id ? (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <span
                        className="flex-1 text-[var(--text-color)] cursor-text"
                        onClick={(e) => {
                          e.stopPropagation()
                          startRename(note.id, note.name, true)
                        }}
                        title="Click to rename"
                      >
                        {note.id === activeNote.id && "• "}
                        {note.name}
                      </span>
                      {notes.length > 1 && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="px-2 py-1 text-[var(--text-muted)] hover:text-red-500 border border-[var(--ui-border-color)] rounded cursor-pointer hover:border-red-500"
                          title={deleteConfirmId === note.id ? "Click again to confirm" : "Delete"}
                        >
                          {deleteConfirmId === note.id ? (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowManageNotes(false)}
              className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Top Left Menu & Share & Note Name */}
      <div className="fixed top-4 left-4 flex gap-2 items-center select-none">
        <div className="relative">
          <button title="Menu" className="icon-button" onClick={() => setShowMenu(!showMenu)}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <div
                className="dropdown-item"
                onClick={() => {
                  createNote()
                  setShowMenu(false)
                  showToast("New note created")
                }}
              >
                New Note
              </div>

              <div
                className="relative"
                ref={notesMenuRef}
                onMouseEnter={handleNotesMenuHover}
                onMouseLeave={handleNotesMenuLeave}
              >
                <div className="dropdown-item flex justify-between items-center">
                  <span>Notes</span>
                  <span className="ml-2">▸</span>
                </div>

                {showNotesMenu && (
                  <div
                    className="dropdown-menu"
                    style={{ left: "100%", top: 0, minWidth: "250px" }}
                    onMouseEnter={handleNotesMenuHover}
                    onMouseLeave={handleNotesMenuLeave}
                  >
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="dropdown-item"
                        onClick={() => {
                          switchNote(note.id)
                          setShowMenu(false)
                          setShowNotesMenu(false)
                        }}
                      >
                        {note.id === activeNote.id && "• "}
                        {note.name}
                      </div>
                    ))}
                    <div className="border-t border-[var(--ui-border-color)] my-1"></div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setShowManageNotes(true)
                        setShowMenu(false)
                        setShowNotesMenu(false)
                      }}
                    >
                      Manage Notes
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--ui-border-color)] my-1"></div>

              <div
                className="dropdown-item"
                onClick={() => {
                  setShowPreferences(true)
                  setShowMenu(false)
                }}
              >
                Preferences
              </div>

              <div
                className="dropdown-item md:hidden"
                onClick={() => {
                  handleShare()
                  setShowMenu(false)
                }}
              >
                Share
              </div>

              <div
                className="dropdown-item md:hidden"
                onClick={() => {
                  setShowHelp(true)
                  setShowMenu(false)
                }}
              >
                Help
              </div>
            </div>
          )}
        </div>

        <button title="Share" className="hidden md:flex icon-button" onClick={handleShare}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>

        {/* Note Name - right after share button */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 text-[var(--text-color)] bg-[var(--bg-dropdown)] rounded">
          {renamingNoteId === activeNote.id && !renamingInModal ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") finishRename()
                if (e.key === "Escape") setRenamingNoteId(null)
              }}
              onBlur={finishRename}
              className="px-2 py-1 bg-[var(--bg-input)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] cursor-text outline-none focus:border-[var(--text-muted)]"
              autoFocus
              style={{ width: "200px" }}
            />
          ) : (
            <span
              onClick={() => startRename(activeNote.id, activeNote.name)}
              className="cursor-pointer hover:opacity-70"
              title="Click to rename"
            >
              {activeNote.name}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Right Help/Docs */}
      <div className="fixed bottom-4 right-4 hidden md:block select-none">
        <button
          title="Help & Documentation"
          className="icon-button rounded-full"
          onClick={() => setShowHelp(true)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}
