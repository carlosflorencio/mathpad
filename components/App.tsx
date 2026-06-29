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
import { OnboardingOverlay, EXAMPLE_TEMPLATE } from "./OnboardingOverlay"
import {
  MenuIcon,
  ShareIcon,
  HelpIcon,
  FolderIcon,
  PlusIcon,
  QuestionIcon,
  ManageNotesIcon,
  OpenFolderIcon,
  CloseFolderIcon,
  PreferencesIcon,
} from "./icons"
import { QuickActionPalette, Action } from "./QuickActionPalette"
import { NoteSelector } from "./NoteSelector"
import { useKeyBindings } from "@/hooks/useKeyBindings"
import { useToasts } from "./app/hooks/useToasts"
import { useFolderSync } from "./app/hooks/useFolderSync"
import { useNoteRename } from "./app/hooks/useNoteRename"
import { useAppState } from "./app/hooks/useAppState"
import { useNoteActions } from "./app/hooks/useNoteActions"
import { applyCssVars } from "@/lib/theme/cssVars"

function configureCSSVars(preferences: Preferences): void {
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.style.setProperty("--font-size", preferences.fontSize + "px")
    applyCssVars(preferences.theme === "dark")
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

  // App state (modals, dialogs, UI state)
  const {
    showPreferences,
    showHelpMenu,
    showKeybindingsModal,
    showSyntaxModal,
    showAboutModal,
    showMenu,
    showNotesMenu,
    showManageNotes,
    showFolderSyncHelp,
    showQuickActions,
    showNoteSelector,
    showShareModal,
    showOnboarding,
    shareUrl,
    conflictData,
    setShowPreferences,
    setShowHelpMenu,
    setShowKeybindingsModal,
    setShowSyntaxModal,
    setShowAboutModal,
    setShowMenu,
    setShowNotesMenu,
    setShowManageNotes,
    setShowFolderSyncHelp,
    setShowQuickActions,
    setShowNoteSelector,
    setShowShareModal,
    setShowOnboarding,
    setShareUrl,
    setConflictData,
    closeAllDialogs,
  } = useAppState()

  // Toast notifications
  const { toasts, showToast, removeToast } = useToasts()

  // Folder sync actions
  const { handleOpenFolder, handleCloseFolder } = useFolderSync({
    openFolder,
    closeFolder,
    showToast,
  })

  // Note renaming
  const { renamingNoteId, renameValue, setRenameValue, startRename, finishRename, cancelRename } =
    useNoteRename({
      notes,
      renameNote,
      showToast,
    })

  // Note actions (with toast integration)
  const { handleCreateNote, handleDeleteNote, handleShare } = useNoteActions({
    createNote,
    renameNote,
    deleteNote,
    shareNote,
    showToast,
    setShowShareModal,
    setShareUrl,
  })

  // Menu keyboard navigation
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(-1)
  const menuItemsRef = useRef<(HTMLDivElement | null)[]>([])
  const [isInSubmenu, setIsInSubmenu] = useState(false)
  const [selectedSubmenuIndex, setSelectedSubmenuIndex] = useState(-1)
  const submenuItemsRef = useRef<(HTMLDivElement | null)[]>([])

  // Track the content we're currently editing to prevent stale updates
  const [editorContent, setEditorContent] = useState(activeNote?.content || "")
  const editorContentRef = useRef(editorContent)
  const activeNoteIdRef = useRef(activeNote?.id)
  const menuTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const notesMenuRef = useRef<HTMLDivElement>(null)

  // Debounced update to collection - only update Note objects when saving
  const debouncedUpdateContentRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Constants used in menu key bindings
  const isFileSystemSupported = FileSystemNoteRepository.isSupported()

  // Update editor content ONLY when active note ID changes (switching notes)
  // activeNote.content is NOT in the dependency array to avoid re-running on every edit
  useEffect(() => {
    if (activeNote && activeNote.id !== activeNoteIdRef.current) {
      // Clear any pending debounced updates when switching notes
      if (debouncedUpdateContentRef.current) {
        clearTimeout(debouncedUpdateContentRef.current)
      }

      setEditorContent(activeNote.content)
      editorContentRef.current = activeNote.content
      activeNoteIdRef.current = activeNote.id
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.id]) // Only depend on ID, not full activeNote object

  const handleContentChange = useCallback(
    (content: string) => {
      // Dismiss onboarding if user starts typing
      if (showOnboarding && content.length > 0) {
        const updated = preferences.withOnboardingComplete()
        savePreferences(updated)
        setShowOnboarding(false)
      }

      // Immediately update local state for responsive UI
      editorContentRef.current = content
      setEditorContent(content)

      // Debounce the collection update (which creates new Note objects)
      if (debouncedUpdateContentRef.current) {
        clearTimeout(debouncedUpdateContentRef.current)
      }

      debouncedUpdateContentRef.current = setTimeout(() => {
        updateContent(content)
      }, 200) // Same debounce as auto-save
    },
    [updateContent, showOnboarding, preferences, savePreferences, setShowOnboarding]
  )

  useEffect(() => {
    if (isLoaded) {
      configureCSSVars(preferences)
    }
  }, [isLoaded, preferences])

  // Show onboarding for first-time users with empty editor
  useEffect(() => {
    if (isLoaded && !preferences.hasSeenOnboarding && activeNote?.content.trim() === "") {
      setShowOnboarding(true)
    }
  }, [isLoaded, preferences.hasSeenOnboarding, activeNote?.content, setShowOnboarding])

  // Check for pending shared note conflict
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      const pending = sessionStorage.getItem("pending-shared-note")
      if (pending) {
        try {
          const sharedNote = JSON.parse(pending) as ShareData
          setConflictData(sharedNote)
          sessionStorage.removeItem("pending-shared-note")
        } catch (e) {
          console.error("Failed to parse pending shared note:", e)
        }
      }
    }
  }, [isLoaded, setConflictData])

  // Focus the editor (used after closing dialogs)
  const focusEditor = useCallback(() => {
    setTimeout(() => {
      const cmEditor = document.querySelector(".cm-editor .cm-content") as HTMLElement
      if (cmEditor) {
        cmEditor.focus()
      }
    }, 0)
  }, [])

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
  }, [showMenu, showNotesMenu, setShowMenu, setShowNotesMenu])

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Dismiss onboarding first if it's showing
        if (showOnboarding) {
          const updated = preferences.withOnboardingComplete()
          savePreferences(updated)
        }
        closeAllDialogs()
        cancelRename()
        setConflictData(null)
        focusEditor()
      }
    }

    window.addEventListener("keyup", handleKeyUp)
    return () => window.removeEventListener("keyup", handleKeyUp)
  }, [
    closeAllDialogs,
    showOnboarding,
    preferences,
    savePreferences,
    cancelRename,
    setConflictData,
    focusEditor,
  ])

  // Vim mode: Focus editor when pressing 'i' and editor doesn't have focus
  useEffect(() => {
    if (!preferences.vimMode) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle 'i' key
      if (e.key !== "i") return

      // Don't interfere if any modifiers are pressed
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return

      // Check if we're in an input/textarea (including the rename input)
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return
      }

      // Don't focus if any menu/dialog is open
      if (
        showMenu ||
        showHelpMenu ||
        showPreferences ||
        showKeybindingsModal ||
        showSyntaxModal ||
        showAboutModal ||
        showManageNotes ||
        showFolderSyncHelp ||
        showQuickActions ||
        showNoteSelector ||
        showShareModal ||
        showOnboarding
      ) {
        return
      }

      // Check if editor already has focus (check for CodeMirror element)
      const cmEditor = document.querySelector(".cm-editor")
      if (cmEditor && cmEditor.contains(document.activeElement)) {
        return
      }

      // Focus the editor by clicking on the paper container
      const paperContainer = document.querySelector(".paper-container")
      if (paperContainer) {
        e.preventDefault()
        ;(paperContainer as HTMLElement).click()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    preferences.vimMode,
    showMenu,
    showHelpMenu,
    showPreferences,
    showKeybindingsModal,
    showSyntaxModal,
    showAboutModal,
    showManageNotes,
    showFolderSyncHelp,
    showQuickActions,
    showNoteSelector,
    showShareModal,
    showOnboarding,
  ])

  // Menu keyboard navigation
  useEffect(() => {
    if (!showMenu || selectedMenuIndex < 0) return

    const handleMenuKeyDown = (e: KeyboardEvent) => {
      // Get all menu items (only the visible/enabled ones)
      const visibleItems = menuItemsRef.current.filter((item) => item !== null)
      const visibleSubmenuItems = submenuItemsRef.current.filter((item) => item !== null)

      if (visibleItems.length === 0) return

      // Handle submenu navigation
      if (isInSubmenu && showNotesMenu && visibleSubmenuItems.length > 0) {
        if (e.key === "ArrowDown" || e.key === "j") {
          e.preventDefault()
          setSelectedSubmenuIndex((prev) =>
            prev < 0 ? 0 : (prev + 1) % visibleSubmenuItems.length
          )
        } else if (e.key === "ArrowUp" || e.key === "k") {
          e.preventDefault()
          setSelectedSubmenuIndex((prev) =>
            prev < 0 ? 0 : (prev - 1 + visibleSubmenuItems.length) % visibleSubmenuItems.length
          )
        } else if (e.key === "ArrowLeft" || e.key === "h") {
          e.preventDefault()
          // Go back to main menu
          setIsInSubmenu(false)
          setSelectedSubmenuIndex(-1)
        } else if (e.key === "Enter") {
          e.preventDefault()
          if (selectedSubmenuIndex >= 0 && visibleSubmenuItems[selectedSubmenuIndex]) {
            visibleSubmenuItems[selectedSubmenuIndex].click()
          }
        } else if (e.key === "Escape") {
          e.preventDefault()
          setShowMenu(false)
          setSelectedMenuIndex(-1)
          setShowNotesMenu(false)
          setIsInSubmenu(false)
          setSelectedSubmenuIndex(-1)
          // Focus editor
          const paperContainer = document.querySelector(".paper-container")
          if (paperContainer) {
            ;(paperContainer as HTMLElement).click()
          }
        }
      } else {
        // Handle main menu navigation
        if (e.key === "ArrowDown" || e.key === "j") {
          e.preventDefault()
          setSelectedMenuIndex((prev) => (prev + 1) % visibleItems.length)
        } else if (e.key === "ArrowUp" || e.key === "k") {
          e.preventDefault()
          setSelectedMenuIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length)
        } else if (e.key === "ArrowRight" || e.key === "l") {
          // Open Notes submenu when on Notes item (index 1) and enter it
          if (selectedMenuIndex === 1) {
            e.preventDefault()
            setShowNotesMenu(true)
            setIsInSubmenu(true)
            setSelectedSubmenuIndex(0)
          }
        } else if (e.key === "ArrowLeft" || e.key === "h") {
          // Close Notes submenu if it's open
          if (showNotesMenu) {
            e.preventDefault()
            setShowNotesMenu(false)
            setIsInSubmenu(false)
            setSelectedSubmenuIndex(-1)
          }
        } else if (e.key === "Enter") {
          e.preventDefault()
          const selectedItem = visibleItems[selectedMenuIndex]
          if (selectedItem) {
            selectedItem.click()
          }
        } else if (e.key === "Escape") {
          e.preventDefault()
          setShowMenu(false)
          setSelectedMenuIndex(-1)
          setShowNotesMenu(false)
          setIsInSubmenu(false)
          setSelectedSubmenuIndex(-1)
          // Focus editor
          const paperContainer = document.querySelector(".paper-container")
          if (paperContainer) {
            ;(paperContainer as HTMLElement).click()
          }
        }
      }
    }

    window.addEventListener("keydown", handleMenuKeyDown)
    return () => window.removeEventListener("keydown", handleMenuKeyDown)
  }, [
    showMenu,
    selectedMenuIndex,
    showNotesMenu,
    isInSubmenu,
    selectedSubmenuIndex,
    setShowMenu,
    setShowNotesMenu,
  ])

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
        handler: handleCreateNote,
        description: "Create new note",
      },
      {
        key: "m",
        ctrlOrCmd: true,
        handler: () => {
          setShowMenu((prev) => {
            const newValue = !prev
            if (newValue) {
              // When opening menu, select first item
              setSelectedMenuIndex(0)
              setIsInSubmenu(false)
              setSelectedSubmenuIndex(-1)
            } else {
              // When closing, reset
              setSelectedMenuIndex(-1)
              setShowNotesMenu(false)
              setIsInSubmenu(false)
              setSelectedSubmenuIndex(-1)
            }
            return newValue
          })
        },
        description: "Toggle menu",
      },
      {
        key: "s",
        ctrlOrCmd: true,
        handler: handleShare,
        description: "Share note",
      },
      {
        key: "o",
        ctrlOrCmd: true,
        handler: () => setShowNoteSelector(true),
        description: "Open note selector",
      },
      {
        key: "p",
        ctrlOrCmd: true,
        handler: handleOpenFolder,
        description: "Open folder",
      },
    ],
  })

  // Quick actions for palette
  const quickActions: Action[] = [
    {
      id: "new-note",
      label: "New Note",
      description: "Create a new note",
      icon: <PlusIcon />,
      handler: handleCreateNote,
      keywords: ["create", "add"],
    },
    {
      id: "manage-notes",
      label: "Manage Notes",
      description: "Rename and delete notes",
      icon: <ManageNotesIcon />,
      handler: () => setShowManageNotes(true),
      keywords: ["rename", "delete", "organize"],
    },
    {
      id: "open-folder",
      label: isFolderMapped ? "Change Folder" : "Open Folder",
      description: "Sync notes with a folder on your computer",
      icon: <OpenFolderIcon />,
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
            icon: <CloseFolderIcon />,
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
      icon: <PreferencesIcon />,
      handler: () => setShowPreferences(true),
      keywords: ["settings", "theme", "font", "dark", "light"],
    },
    {
      id: "share",
      label: "Share",
      description: "Copy share link to clipboard",
      icon: <ShareIcon />,
      handler: () => {
        handleShare()
      },
      keywords: ["copy", "link", "export"],
    },
    {
      id: "help",
      label: "Help",
      description: "View documentation and syntax guide",
      icon: <HelpIcon />,
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

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false)
    const updated = preferences.withOnboardingComplete()
    savePreferences(updated)
  }, [preferences, savePreferences, setShowOnboarding])

  const handleInsertTemplate = useCallback(() => {
    if (activeNote) {
      updateContent(EXAMPLE_TEMPLATE)
      setEditorContent(EXAMPLE_TEMPLATE)
    }
  }, [activeNote, updateContent])

  const handleConflictResolve = useCallback(
    (action: "replace" | "keep-both" | "cancel") => {
      if (!conflictData) return

      if (action === "cancel") {
        setConflictData(null)
        focusEditor()
        return
      }

      importSharedNote(conflictData, action)
      setConflictData(null)

      if (action === "replace") {
        showToast("Note replaced with shared content")
      } else {
        showToast("Imported as new note")
      }
      focusEditor()
    },
    [conflictData, importSharedNote, showToast, setConflictData, focusEditor]
  )

  const handleNotesMenuHover = useCallback(() => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current)
    }
    setShowNotesMenu(true)
  }, [setShowNotesMenu])

  const handleNotesMenuLeave = useCallback(() => {
    menuTimeoutRef.current = setTimeout(() => {
      setShowNotesMenu(false)
    }, 300) // 300ms delay before closing
  }, [setShowNotesMenu])

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
            value={editorContent}
            onUpdate={handleContentChange}
            preferences={preferences}
            onCopy={(value: string) => showToast(`Copied: ${value}`)}
            noteId={activeNote.id}
          />
        </div>
      </div>

      {(showPreferences ||
        showKeybindingsModal ||
        showSyntaxModal ||
        showAboutModal ||
        showManageNotes ||
        showFolderSyncHelp ||
        showShareModal ||
        pendingDeletions.length > 0) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            closeAllDialogs()
            focusEditor()
          }}
        />
      )}

      {showPreferences && (
        <PreferencesDialog
          preferences={preferences}
          close={() => {
            closeAllDialogs()
            focusEditor()
          }}
          save={handleSavePreferences}
        />
      )}

      {showKeybindingsModal && (
        <KeybindingsModal
          onClose={() => {
            setShowKeybindingsModal(false)
            focusEditor()
          }}
          vimMode={preferences.vimMode}
        />
      )}

      {showSyntaxModal && (
        <EditorSyntaxModal
          onClose={() => {
            setShowSyntaxModal(false)
            focusEditor()
          }}
        />
      )}

      {showAboutModal && (
        <AboutModal
          onClose={() => {
            setShowAboutModal(false)
            focusEditor()
          }}
        />
      )}

      {conflictData && (
        <ConflictResolutionModal conflictData={conflictData} onResolve={handleConflictResolve} />
      )}

      {pendingDeletions.length > 0 && (
        <ExternalDeletionModal
          pendingDeletions={pendingDeletions}
          onConfirm={() => {
            confirmDeletions()
            showToast("Deleted notes removed from app")
            focusEditor()
          }}
          onCancel={() => {
            cancelDeletions()
            showToast("Deleted notes will be restored to folder")
            focusEditor()
          }}
        />
      )}

      {showManageNotes && (
        <ManageNotesModal
          notes={notes}
          activeNote={activeNote}
          onClose={() => {
            setShowManageNotes(false)
            focusEditor()
          }}
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

      {showFolderSyncHelp && (
        <FolderSyncHelpModal
          onClose={() => {
            setShowFolderSyncHelp(false)
            focusEditor()
          }}
        />
      )}

      {showShareModal && (
        <ShareModal
          url={shareUrl}
          content={editorContent}
          preferences={preferences}
          onClose={() => {
            setShowShareModal(false)
            focusEditor()
          }}
        />
      )}

      <QuickActionPalette
        isOpen={showQuickActions}
        onClose={() => {
          setShowQuickActions(false)
          focusEditor()
        }}
        actions={quickActions}
        notes={notes}
        activeNoteId={activeNote.id}
        onSwitchNote={(noteId) => {
          switchNote(noteId)
        }}
        onDeleteNote={(noteId) => {
          handleDeleteNote(noteId)
        }}
      />

      <NoteSelector
        isOpen={showNoteSelector}
        onClose={() => {
          setShowNoteSelector(false)
          focusEditor()
        }}
        notes={notes}
        activeNoteId={activeNote.id}
        onSwitchNote={(noteId) => {
          switchNote(noteId)
        }}
        onDeleteNote={(noteId) => {
          handleDeleteNote(noteId)
        }}
      />

      {showOnboarding && (
        <OnboardingOverlay
          onInsertTemplate={() => {
            handleInsertTemplate()
            handleDismissOnboarding()
          }}
          onDismiss={handleDismissOnboarding}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Desktop: Top Left Menu & Share & Note Name */}
      <div className="fixed top-4 left-4 hidden md:flex gap-2 items-center select-none">
        <div className="relative">
          <button title="Menu" className="icon-button" onClick={() => setShowMenu(!showMenu)}>
            <MenuIcon />
          </button>

          {/* Desktop Menu Dropdown - positioned relative to button */}
          {showMenu && (
            <div className="dropdown-menu">
              {(() => {
                let currentIndex = -1
                const getNextIndex = () => ++currentIndex

                const idx0 = getNextIndex() // New Note
                const idx1 = getNextIndex() // Notes
                const idx2 = getNextIndex() // Manage Notes
                const idx3 = getNextIndex() // Open/Change Folder
                const idx4 = isFolderMapped ? getNextIndex() : -1 // Close Folder (conditional)
                const idx5 = getNextIndex() // Preferences

                return (
                  <>
                    <div
                      ref={(el) => {
                        menuItemsRef.current[idx0] = el
                      }}
                      className={`dropdown-item flex justify-between items-center ${
                        selectedMenuIndex === idx0 ? "bg-[var(--bg-button-hover)]" : ""
                      }`}
                      onClick={() => {
                        createNote()
                        setShowMenu(false)
                        showToast("New note created")
                      }}
                    >
                      <span>New Note</span>
                    </div>

                    <div
                      className="relative"
                      ref={notesMenuRef}
                      onMouseEnter={handleNotesMenuHover}
                      onMouseLeave={handleNotesMenuLeave}
                    >
                      <div
                        ref={(el) => {
                          menuItemsRef.current[idx1] = el
                        }}
                        className={`dropdown-item flex justify-between items-center ${
                          selectedMenuIndex === idx1 ? "bg-[var(--bg-button-hover)]" : ""
                        }`}
                        onClick={() => setShowNotesMenu(!showNotesMenu)}
                      >
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
                          {notes.map((note, noteIndex) => (
                            <div
                              key={note.id}
                              ref={(el) => {
                                submenuItemsRef.current[noteIndex] = el
                              }}
                              className={`dropdown-item ${
                                isInSubmenu && selectedSubmenuIndex === noteIndex
                                  ? "bg-[var(--bg-button-hover)]"
                                  : ""
                              }`}
                              onClick={() => {
                                switchNote(note.id)
                                setShowMenu(false)
                                setShowNotesMenu(false)
                                setIsInSubmenu(false)
                                setSelectedSubmenuIndex(-1)
                              }}
                              onMouseEnter={() => {
                                if (isInSubmenu) {
                                  setSelectedSubmenuIndex(noteIndex)
                                }
                              }}
                            >
                              {note.id === activeNote.id && "• "}
                              {note.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      ref={(el) => {
                        menuItemsRef.current[idx2] = el
                      }}
                      className={`dropdown-item flex justify-between items-center ${
                        selectedMenuIndex === idx2 ? "bg-[var(--bg-button-hover)]" : ""
                      }`}
                      onClick={() => {
                        setShowManageNotes(true)
                        setShowMenu(false)
                      }}
                    >
                      <span>Manage Notes</span>
                    </div>

                    <div className="border-t border-[var(--ui-border-color)] my-1"></div>

                    <div
                      ref={(el) => {
                        menuItemsRef.current[idx3] = el
                      }}
                      className={`dropdown-item flex justify-between items-center ${
                        selectedMenuIndex === idx3 ? "bg-[var(--bg-button-hover)]" : ""
                      }`}
                      style={{
                        opacity: isFileSystemSupported ? 1 : 0.5,
                        cursor: isFileSystemSupported ? "pointer" : "not-allowed",
                      }}
                      onClick={
                        isFileSystemSupported
                          ? () => {
                              handleOpenFolder()
                              setShowMenu(false)
                            }
                          : undefined
                      }
                    >
                      <span className="flex-1">
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
                          <QuestionIcon />
                        </button>
                      )}
                    </div>

                    {isFolderMapped && (
                      <div
                        ref={(el) => {
                          menuItemsRef.current[idx4] = el
                        }}
                        className={`dropdown-item flex justify-between items-center ${
                          selectedMenuIndex === idx4 ? "bg-[var(--bg-button-hover)]" : ""
                        }`}
                        title="Stop syncing with folder. Notes will remain in the app."
                        onClick={() => {
                          handleCloseFolder()
                          setShowMenu(false)
                        }}
                      >
                        <span className="flex-1">Close Folder</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowFolderSyncHelp(true)
                            setShowMenu(false)
                          }}
                          className="ml-2 px-1.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-color)] border border-[var(--ui-border-color)] rounded cursor-pointer hover:border-[var(--text-muted)] transition-colors"
                          title="Learn about folder sync"
                        >
                          <QuestionIcon />
                        </button>
                      </div>
                    )}

                    <div className="border-t border-[var(--ui-border-color)] my-1"></div>

                    <div
                      ref={(el) => {
                        menuItemsRef.current[idx5] = el
                      }}
                      className={`dropdown-item flex justify-between items-center ${
                        selectedMenuIndex === idx5 ? "bg-[var(--bg-button-hover)]" : ""
                      }`}
                      onClick={() => {
                        setShowPreferences(true)
                        setShowMenu(false)
                      }}
                    >
                      <span>Preferences</span>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>

        <button title="Share" className="hidden md:flex icon-button" onClick={handleShare}>
          <ShareIcon />
        </button>

        {/* Folder and Note Name - unified display */}
        <div
          className="hidden md:flex items-center gap-2 text-[var(--text-color)] bg-[var(--bg-dropdown)] rounded"
          style={{
            padding: "var(--ui-button-padding)",
            minHeight: "calc(var(--ui-button-size) + 2 * var(--ui-button-padding))",
          }}
        >
          {isFolderMapped && folderName && (
            <>
              <FolderIcon />
              <span
                onClick={() => setShowManageNotes(true)}
                className="cursor-pointer hover:opacity-70 text-[var(--text-muted)]"
                title="Click to manage notes"
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
                if (e.key === "Escape") cancelRename()
              }}
              onBlur={finishRename}
              className="px-2 bg-[var(--bg-input)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] cursor-text outline-none focus:border-[var(--text-muted)]"
              autoFocus
              style={{ width: "200px", margin: "-1px 0" }}
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

      {/* Mobile: Bottom Right Menu Button */}
      <div className="fixed bottom-4 right-4 md:hidden select-none">
        <button
          title="Menu"
          className="icon-button rounded-full"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MenuIcon />
        </button>
      </div>

      {/* Desktop: Bottom Right Help/Docs */}
      <div className="fixed bottom-4 right-4 hidden md:block select-none">
        <button
          title="Help & Documentation"
          className="icon-button rounded-full"
          onClick={() => setShowHelpMenu(true)}
        >
          <HelpIcon />
        </button>
      </div>

      {/* Help Menu - works for both mobile and desktop */}
      {showHelpMenu && (
        <HelpMenu
          onClose={() => {
            setShowHelpMenu(false)
            focusEditor()
          }}
          onSelectKeybindings={() => setShowKeybindingsModal(true)}
          onSelectSyntax={() => setShowSyntaxModal(true)}
          onSelectFolderSync={() => setShowFolderSyncHelp(true)}
          onSelectAbout={() => setShowAboutModal(true)}
        />
      )}

      {/* Mobile Menu Dropdown - positioned above the bottom-right button */}
      {showMenu && (
        <div className="dropdown-menu mobile-menu fixed right-4 md:hidden">
          <div
            className="dropdown-item flex justify-between items-center"
            onClick={() => {
              handleCreateNote()
              setShowMenu(false)
            }}
          >
            <span>New Note</span>
          </div>

          <div
            className="dropdown-item flex justify-between items-center"
            onClick={() => {
              setShowManageNotes(true)
              setShowMenu(false)
            }}
          >
            <span>Manage Notes</span>
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
                !isFileSystemSupported ? "File System API not supported in this browser" : undefined
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
                <QuestionIcon />
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
                <QuestionIcon />
              </button>
            </div>
          )}

          <div className="border-t border-[var(--ui-border-color)] my-1"></div>

          <div
            className="dropdown-item flex justify-between items-center"
            onClick={() => {
              setShowPreferences(true)
              setShowMenu(false)
            }}
          >
            <span>Preferences</span>
          </div>

          <div
            className="dropdown-item md:hidden flex justify-between items-center"
            onClick={() => {
              handleShare()
              setShowMenu(false)
            }}
          >
            <span>Share</span>
          </div>

          <div
            className="dropdown-item md:hidden flex justify-between items-center"
            onClick={() => {
              setShowHelpMenu(true)
              setShowMenu(false)
            }}
          >
            <span>Help</span>
          </div>
        </div>
      )}
    </div>
  )
}
