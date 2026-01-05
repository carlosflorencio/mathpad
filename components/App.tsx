"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useNotes } from "@/hooks/notes/useNotes"
import { Preferences } from "@/lib/preferences/Preferences"
import { ShareData } from "@/lib/notes/types"
import { FileSystemNoteRepository } from "@/lib/notes/FileSystemNoteRepository"
import { Editor } from "./Editor"
import { HelpMenu } from "./HelpMenu"
import { PreferencesDialog } from "./PreferencesDialog"
import { ToastContainer } from "./Toast"
import { KeybindingsModal } from "./modals/KeybindingsModal"
import { EditorSyntaxModal } from "./modals/EditorSyntaxModal"
import { FolderSyncHelpModal } from "./modals/FolderSyncHelpModal"
import { AboutModal } from "./modals/AboutModal"
import { ConflictResolutionModal } from "./modals/ConflictResolutionModal"
import { ExternalDeletionModal } from "./modals/ExternalDeletionModal"
import { ManageNotesModal } from "./modals/ManageNotesModal"
import { ShareModal } from "./modals/ShareModal"
import { QuickActionPalette, Action } from "./QuickActionPalette"
import { useKeyBindings } from "@/hooks/useKeyBindings"
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
    // Folder sync
    folderName,
    isFolderMapped,
    openFolder,
    closeFolder,
    pendingDeletions,
    confirmDeletions,
    cancelDeletions,
  } = useNotes()

  const [showPreferences, setShowPreferences] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [showKeybindingsModal, setShowKeybindingsModal] = useState(false)
  const [showSyntaxModal, setShowSyntaxModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showNotesMenu, setShowNotesMenu] = useState(false)
  const [showManageNotes, setShowManageNotes] = useState(false)
  const [showFolderSyncHelp, setShowFolderSyncHelp] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([])
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
    setShowHelpMenu(false)
    setShowKeybindingsModal(false)
    setShowSyntaxModal(false)
    setShowAboutModal(false)
    setShowMenu(false)
    setShowNotesMenu(false)
    setShowManageNotes(false)
    setShowFolderSyncHelp(false)
    setShowQuickActions(false)
  }, [])

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDialogs()
        setRenamingNoteId(null)
        setConflictData(null)
      }
    }

    window.addEventListener("keyup", handleKeyUp)
    return () => window.removeEventListener("keyup", handleKeyUp)
  }, [closeDialogs])

  // Keyboard shortcuts
  useKeyBindings({
    bindings: [
      {
        key: "k",
        ctrlOrCmd: true,
        handler: () => setShowQuickActions(true),
        description: "Open quick actions",
      },
      {
        key: "n",
        ctrlOrCmd: true,
        handler: () => {
          createNote()
          showToast("New note created")
        },
        description: "Create new note",
      },
    ],
  })

  // Quick actions for palette
  const quickActions: Action[] = [
    {
      id: "new-note",
      label: "New Note",
      description: "Create a new note",
      icon: (
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
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      handler: () => {
        createNote()
        showToast("New note created")
      },
      keywords: ["create", "add"],
    },
    {
      id: "manage-notes",
      label: "Manage Notes",
      description: "Rename and delete notes",
      icon: (
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
          <path d="M3 3h18v18H3zM9 3v18M3 9h18M3 15h6" />
        </svg>
      ),
      handler: () => setShowManageNotes(true),
      keywords: ["rename", "delete", "organize"],
    },
    {
      id: "open-folder",
      label: isFolderMapped ? "Change Folder" : "Open Folder",
      description: "Sync notes with a folder on your computer",
      icon: (
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
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      handler: () => {
        handleOpenFolder()
      },
      keywords: ["sync", "folder", "file"],
    },
    ...(isFolderMapped
      ? [
          {
            id: "close-folder",
            label: "Close Folder",
            description: "Stop syncing with folder",
            icon: (
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
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="3" y1="3" x2="21" y2="21" />
              </svg>
            ),
            handler: () => {
              handleCloseFolder()
            },
            keywords: ["sync", "folder"],
          },
        ]
      : []),
    {
      id: "preferences",
      label: "Preferences",
      description: "Change theme and font size",
      icon: (
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
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2" />
        </svg>
      ),
      handler: () => setShowPreferences(true),
      keywords: ["settings", "theme", "font", "dark", "light"],
    },
    {
      id: "share",
      label: "Share",
      description: "Copy share link to clipboard",
      icon: (
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
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      ),
      handler: () => {
        handleShare()
      },
      keywords: ["copy", "link", "export"],
    },
    {
      id: "help",
      label: "Help",
      description: "View documentation and syntax guide",
      icon: (
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
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      handler: () => setShowHelpMenu(true),
      keywords: ["documentation", "docs", "syntax"],
    },
  ]

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
      setShareUrl(url)
      setShowShareModal(true)
      showToast("Link copied to clipboard")
    }
  }, [shareNote, showToast])

  const handleOpenFolder = useCallback(async () => {
    try {
      await openFolder()
      showToast("Folder opened successfully")
    } catch (error) {
      console.error("Error opening folder:", error)
      showToast("Failed to open folder")
    }
  }, [openFolder, showToast])

  const handleCloseFolder = useCallback(async () => {
    try {
      await closeFolder()
      showToast("Folder closed")
    } catch (error) {
      console.error("Error closing folder:", error)
    }
  }, [closeFolder, showToast])

  const isFileSystemSupported = FileSystemNoteRepository.isSupported()

  const handleShowFolderInOS = useCallback(() => {
    // The File System Access API doesn't provide a way to open the folder in the OS
    // We can only inform the user of the folder name
    showToast(`Syncing with: ${folderName}`)
  }, [folderName, showToast])

  const startRename = useCallback((noteId: string, currentName: string) => {
    renameBlurEnabledRef.current = false
    setRenamingNoteId(noteId)
    setRenameValue(currentName)
    // Enable blur after a short delay to prevent immediate blur
    setTimeout(() => {
      renameBlurEnabledRef.current = true
    }, 100)
  }, [])

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

      {(showPreferences ||
        showKeybindingsModal ||
        showSyntaxModal ||
        showAboutModal ||
        conflictData ||
        showManageNotes ||
        showFolderSyncHelp ||
        showShareModal ||
        pendingDeletions.length > 0) && <div className="modal-backdrop" onClick={closeDialogs} />}

      {showPreferences && (
        <PreferencesDialog
          preferences={preferences}
          close={closeDialogs}
          save={handleSavePreferences}
        />
      )}

      {showKeybindingsModal && <KeybindingsModal onClose={() => setShowKeybindingsModal(false)} />}

      {showSyntaxModal && <EditorSyntaxModal onClose={() => setShowSyntaxModal(false)} />}

      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}

      {conflictData && (
        <ConflictResolutionModal conflictData={conflictData} onResolve={handleConflictResolve} />
      )}

      {pendingDeletions.length > 0 && (
        <ExternalDeletionModal
          pendingDeletions={pendingDeletions}
          onConfirm={() => {
            confirmDeletions()
            showToast("Deleted notes removed from app")
          }}
          onCancel={() => {
            cancelDeletions()
            showToast("Deleted notes will be restored to folder")
          }}
        />
      )}

      {showManageNotes && (
        <ManageNotesModal
          notes={notes}
          activeNote={activeNote}
          onClose={() => setShowManageNotes(false)}
          onRename={(noteId, newName) => {
            renameNote(noteId, newName)
            showToast("Note renamed")
          }}
          onDelete={(noteId) => {
            deleteNote(noteId)
            showToast("Note deleted")
          }}
        />
      )}

      {showFolderSyncHelp && <FolderSyncHelpModal onClose={() => setShowFolderSyncHelp(false)} />}

      {showShareModal && <ShareModal url={shareUrl} onClose={() => setShowShareModal(false)} />}

      <QuickActionPalette
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        actions={quickActions}
        notes={notes}
        activeNoteId={activeNote.id}
        onSwitchNote={(noteId) => {
          switchNote(noteId)
        }}
      />

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
                className="dropdown-item flex justify-between items-center"
                style={{
                  opacity: isFileSystemSupported ? 1 : 0.5,
                  cursor: isFileSystemSupported ? "pointer" : "not-allowed",
                }}
              >
                <span
                  onClick={
                    isFileSystemSupported
                      ? () => {
                          handleOpenFolder()
                          setShowMenu(false)
                        }
                      : undefined
                  }
                  className="flex-1"
                  title={
                    !isFileSystemSupported
                      ? "File System API not supported in this browser"
                      : undefined
                  }
                >
                  {isFolderMapped ? "Change Folder" : "Open Folder"}
                </span>
                {isFileSystemSupported && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowFolderSyncHelp(true)
                      setShowMenu(false)
                    }}
                    className="ml-2 px-1.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-color)] border border-[var(--ui-border-color)] rounded cursor-pointer hover:border-[var(--text-muted)] transition-colors"
                    title="Learn about folder sync"
                  >
                    <svg
                      width="14"
                      height="14"
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
                )}
              </div>

              {isFolderMapped && (
                <div
                  className="dropdown-item flex justify-between items-center"
                  title="Stop syncing with folder. Notes will remain in the app."
                >
                  <span
                    onClick={() => {
                      handleCloseFolder()
                      setShowMenu(false)
                    }}
                    className="flex-1"
                  >
                    Close Folder
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowFolderSyncHelp(true)
                      setShowMenu(false)
                    }}
                    className="ml-2 px-1.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-color)] border border-[var(--ui-border-color)] rounded cursor-pointer hover:border-[var(--text-muted)] transition-colors"
                    title="Learn about folder sync"
                  >
                    <svg
                      width="14"
                      height="14"
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
              )}

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
                  setShowHelpMenu(true)
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

        {/* Folder and Note Name - unified display */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 text-[var(--text-color)] bg-[var(--bg-dropdown)] rounded">
          {isFolderMapped && folderName && (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--text-muted)]"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span
                onClick={handleShowFolderInOS}
                className="cursor-pointer hover:opacity-70 text-[var(--text-muted)]"
                title={`Syncing with: ${folderName}`}
              >
                {folderName}
              </span>
              <span className="text-[var(--text-muted)]">›</span>
            </>
          )}
          {renamingNoteId === activeNote.id ? (
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
          onClick={() => setShowHelpMenu(true)}
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

        {showHelpMenu && (
          <HelpMenu
            onClose={() => setShowHelpMenu(false)}
            onSelectKeybindings={() => setShowKeybindingsModal(true)}
            onSelectSyntax={() => setShowSyntaxModal(true)}
            onSelectFolderSync={() => setShowFolderSyncHelp(true)}
            onSelectAbout={() => setShowAboutModal(true)}
          />
        )}
      </div>
    </div>
  )
}
