# App.tsx Refactoring Plan

## Overview
Refactor the monolithic `App.tsx` component (978 lines) into smaller, focused modules to improve maintainability, testability, and code organization.

## Current State Analysis

### File: `components/App.tsx` (978 lines)

**Current responsibilities:**
1. **State management** - 15+ state variables for modals, dialogs, UI state
2. **Event handlers** - 20+ callback functions for various actions
3. **UI rendering** - Desktop and mobile layouts, multiple menus
4. **Business logic** - Note management, folder sync, sharing, preferences
5. **Effects** - Multiple useEffect hooks for initialization and side effects
6. **Quick actions** - Action definitions and handlers
7. **Keyboard shortcuts** - Global keybinding setup

**Problems with current structure:**
- Single file with too many responsibilities (violates Single Responsibility Principle)
- Difficult to test individual features in isolation
- Hard to navigate and understand the component
- Tight coupling between UI and business logic
- State updates scattered throughout the file
- Duplicate code between desktop and mobile menu implementations

## Refactoring Strategy

### Principle: Vertical Slicing
Instead of splitting by type (components, hooks, utils), split by feature domain. This makes related code easier to find and modify together.

### Goals
- Reduce App.tsx to a coordinator component (~150-200 lines)
- Extract reusable hooks for state management
- Separate UI components from business logic
- Improve testability of each module
- Maintain existing functionality (no behavior changes)

## Proposed Architecture

```
components/
├── App.tsx (150-200 lines) - Main coordinator
├── app/
│   ├── hooks/
│   │   ├── useAppState.ts - Centralized state management
│   │   ├── useToasts.ts - Toast notification logic
│   │   ├── useNoteActions.ts - Note-related actions
│   │   └── useFolderSync.ts - Folder sync logic
│   ├── menus/
│   │   ├── DesktopMenu.tsx - Desktop top-left menu
│   │   ├── MobileMenu.tsx - Mobile bottom-right menu
│   │   ├── NotesSubmenu.tsx - Nested notes submenu
│   │   └── menuItems.ts - Shared menu item definitions
│   ├── actions/
│   │   ├── quickActions.ts - Quick action definitions
│   │   └── keyboardShortcuts.ts - Keyboard binding definitions
│   └── layout/
│       ├── AppLayout.tsx - Main layout structure
│       ├── TopBar.tsx - Desktop top bar (menu + note name)
│       ├── BottomBar.tsx - Mobile bottom bar
│       └── ModalBackdrop.tsx - Shared modal backdrop
```

## Detailed Refactoring Plan

### 1. Extract State Management Hooks

#### File: `components/app/hooks/useAppState.ts`

**Purpose:** Centralize all modal/dialog visibility state

```typescript
export function useAppState() {
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
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [conflictData, setConflictData] = useState<ShareData | null>(null)

  const closeAllDialogs = useCallback(() => {
    setShowPreferences(false)
    setShowKeybindingsModal(false)
    setShowSyntaxModal(false)
    setShowAboutModal(false)
    setShowMenu(false)
    setShowHelpMenu(false)
    setShowNotesMenu(false)
    setShowManageNotes(false)
    setShowFolderSyncHelp(false)
    setShowQuickActions(false)
    setShowShareModal(false)
    setShowOnboarding(false)
  }, [])

  return {
    // State
    showPreferences, showHelpMenu, showKeybindingsModal,
    showSyntaxModal, showAboutModal, showMenu, showNotesMenu,
    showManageNotes, showFolderSyncHelp, showQuickActions,
    showShareModal, showOnboarding, shareUrl, conflictData,
    // Setters
    setShowPreferences, setShowHelpMenu, setShowKeybindingsModal,
    setShowSyntaxModal, setShowAboutModal, setShowMenu,
    setShowNotesMenu, setShowManageNotes, setShowFolderSyncHelp,
    setShowQuickActions, setShowShareModal, setShowOnboarding,
    setShareUrl, setConflictData,
    // Actions
    closeAllDialogs,
  }
}
```

**Benefits:**
- Single source of truth for modal state
- Easy to test state transitions
- Reduces App.tsx by ~50 lines

#### File: `components/app/hooks/useToasts.ts`

**Purpose:** Extract toast notification logic

```typescript
export function useToasts() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([])

  const showToast = useCallback((message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return { toasts, showToast, removeToast }
}
```

**Benefits:**
- Reusable toast logic
- Easy to extend (add toast types, positions, durations)
- Reduces App.tsx by ~20 lines

#### File: `components/app/hooks/useNoteActions.ts`

**Purpose:** Encapsulate note-related actions and callbacks

```typescript
export function useNoteActions({
  notes,
  createNote,
  renameNote,
  deleteNote,
  shareNote,
  showToast,
  setShowShareModal,
  setShareUrl,
}: NoteActionsParams) {
  const handleCreateNote = useCallback(() => {
    createNote()
    showToast("New note created")
  }, [createNote, showToast])

  const handleRenameNote = useCallback((noteId: string, newName: string) => {
    renameNote(noteId, newName)
    showToast("Note renamed")
  }, [renameNote, showToast])

  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNote(noteId)
    showToast("Note deleted")
  }, [deleteNote, showToast])

  const handleShare = useCallback(() => {
    const url = shareNote()
    if (url) {
      navigator.clipboard.writeText(url)
      setShareUrl(url)
      setShowShareModal(true)
      showToast("Link copied to clipboard")
    }
  }, [shareNote, showToast, setShareUrl, setShowShareModal])

  return {
    handleCreateNote,
    handleRenameNote,
    handleDeleteNote,
    handleShare,
  }
}
```

**Benefits:**
- Groups related note operations
- Consistent toast messaging
- Easy to add cross-cutting concerns (analytics, logging)
- Reduces App.tsx by ~40 lines

#### File: `components/app/hooks/useFolderSync.ts`

**Purpose:** Extract folder synchronization logic

```typescript
export function useFolderSync({
  openFolder,
  closeFolder,
  showToast,
}: FolderSyncParams) {
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

  return {
    handleOpenFolder,
    handleCloseFolder,
  }
}
```

**Benefits:**
- Isolates folder sync error handling
- Reusable across different UI contexts
- Reduces App.tsx by ~20 lines

### 2. Extract Menu Components

#### File: `components/app/menus/menuItems.ts`

**Purpose:** Define menu structure as data (DRY principle)

```typescript
export interface MenuItem {
  id: string
  label: string
  onClick: () => void
  show?: boolean
  disabled?: boolean
  dividerAfter?: boolean
  submenu?: MenuItem[]
}

export function createMenuItems(params: MenuItemsParams): MenuItem[] {
  return [
    {
      id: "new-note",
      label: "New Note",
      onClick: params.onNewNote,
    },
    {
      id: "notes",
      label: "Notes",
      submenu: params.notes.map(note => ({
        id: note.id,
        label: note.id === params.activeNoteId ? `• ${note.name}` : note.name,
        onClick: () => params.onSwitchNote(note.id),
      })),
      dividerAfter: true,
    },
    {
      id: "manage-notes",
      label: "Manage Notes",
      onClick: params.onManageNotes,
      dividerAfter: true,
    },
    {
      id: "open-folder",
      label: params.isFolderMapped ? "Change Folder" : "Open Folder",
      onClick: params.onOpenFolder,
      disabled: !params.isFileSystemSupported,
    },
    // ... more items
  ]
}
```

**Benefits:**
- Single source of truth for menu structure
- Easier to maintain menu consistency across desktop/mobile
- Can be tested independently
- Easier to add keyboard shortcuts to menu items

#### File: `components/app/menus/DesktopMenu.tsx`

**Purpose:** Desktop top-left menu implementation

```typescript
interface DesktopMenuProps {
  isOpen: boolean
  onClose: () => void
  menuItems: MenuItem[]
  notesMenuRef: React.RefObject<HTMLDivElement>
  onNotesMenuHover: () => void
  onNotesMenuLeave: () => void
  showNotesMenu: boolean
}

export function DesktopMenu({
  isOpen,
  onClose,
  menuItems,
  notesMenuRef,
  onNotesMenuHover,
  onNotesMenuLeave,
  showNotesMenu,
}: DesktopMenuProps) {
  if (!isOpen) return null

  return (
    <div className="dropdown-menu">
      {menuItems.map(item => (
        <MenuItem
          key={item.id}
          item={item}
          onClose={onClose}
        />
      ))}
    </div>
  )
}
```

**Benefits:**
- Focused component with single responsibility
- Easy to style and test independently
- Reduces App.tsx by ~100 lines

#### File: `components/app/menus/MobileMenu.tsx`

**Purpose:** Mobile bottom-right menu implementation

Similar structure to DesktopMenu but with mobile-specific positioning and behavior.

**Benefits:**
- Separates mobile and desktop concerns
- Easier to optimize for touch interfaces
- Reduces App.tsx by ~100 lines

### 3. Extract Layout Components

#### File: `components/app/layout/AppLayout.tsx`

**Purpose:** Main application layout structure

```typescript
interface AppLayoutProps {
  children: React.ReactNode
  topBar?: React.ReactNode
  bottomBar?: React.ReactNode
  modals?: React.ReactNode
}

export function AppLayout({
  children,
  topBar,
  bottomBar,
  modals,
}: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen font-mono bg-[var(--desk-bg-color)]">
      {topBar}

      <div className="desk-container">
        <div className="paper-container">
          {children}
        </div>
      </div>

      {bottomBar}
      {modals}
    </div>
  )
}
```

**Benefits:**
- Separates layout concerns from business logic
- Easier to test layout variations
- Can be used in other views (e.g., print view)

#### File: `components/app/layout/TopBar.tsx`

**Purpose:** Desktop top bar with menu, share, and note name

```typescript
export function TopBar({
  onMenuClick,
  onShareClick,
  isFolderMapped,
  folderName,
  activeNote,
  renamingNoteId,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onStartRename,
  onManageNotes,
}: TopBarProps) {
  return (
    <div className="fixed top-4 left-4 hidden md:flex gap-2 items-center select-none">
      <button title="Menu" className="icon-button" onClick={onMenuClick}>
        <MenuIcon />
      </button>

      <button title="Share" className="hidden md:flex icon-button" onClick={onShareClick}>
        <ShareIcon />
      </button>

      <NoteName
        isFolderMapped={isFolderMapped}
        folderName={folderName}
        activeNote={activeNote}
        isRenaming={renamingNoteId === activeNote.id}
        renameValue={renameValue}
        onRenameChange={onRenameChange}
        onRenameSubmit={onRenameSubmit}
        onRenameCancel={onRenameCancel}
        onStartRename={onStartRename}
        onManageNotes={onManageNotes}
      />
    </div>
  )
}
```

**Benefits:**
- Isolates top bar layout and behavior
- Easier to modify desktop-specific UI
- Reduces App.tsx by ~100 lines

### 4. Extract Action Definitions

#### File: `components/app/actions/quickActions.ts`

**Purpose:** Define quick action palette items

```typescript
export function createQuickActions(params: QuickActionsParams): Action[] {
  return [
    {
      id: "new-note",
      label: "New Note",
      description: "Create a new note",
      icon: <PlusIcon />,
      handler: params.onNewNote,
      keywords: ["create", "add"],
    },
    {
      id: "manage-notes",
      label: "Manage Notes",
      description: "Rename and delete notes",
      icon: <GridIcon />,
      handler: params.onManageNotes,
      keywords: ["rename", "delete", "organize"],
    },
    // ... more actions
  ]
}
```

**Benefits:**
- Separates action definitions from component
- Easier to test and extend
- Can be reused in different contexts (e.g., command palette)
- Reduces App.tsx by ~150 lines

#### File: `components/app/actions/keyboardShortcuts.ts`

**Purpose:** Define keyboard shortcut bindings

```typescript
export function createKeyboardShortcuts(
  params: KeyboardShortcutsParams
): KeyBinding[] {
  return [
    {
      key: "k",
      ctrlOrCmd: true,
      handler: params.onQuickActions,
      description: "Open quick actions",
    },
    {
      key: "n",
      ctrlOrCmd: true,
      handler: params.onNewNote,
      description: "Create new note",
    },
  ]
}
```

**Benefits:**
- Centralized keyboard shortcut definitions
- Easy to document and display in help
- Can validate for conflicts
- Reduces App.tsx by ~20 lines

### 5. Extract Rename Logic

#### File: `components/app/hooks/useNoteRename.ts`

**Purpose:** Handle inline note renaming state

```typescript
export function useNoteRename({
  notes,
  renameNote,
  showToast,
}: NoteRenameParams) {
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const renameBlurEnabledRef = useRef(false)

  const startRename = useCallback((noteId: string, currentName: string) => {
    renameBlurEnabledRef.current = false
    setRenamingNoteId(noteId)
    setRenameValue(currentName)
    setTimeout(() => {
      renameBlurEnabledRef.current = true
    }, 100)
  }, [])

  const finishRename = useCallback(() => {
    if (!renameBlurEnabledRef.current) return

    if (renamingNoteId && renameValue.trim()) {
      const note = notes.find((n) => n.id === renamingNoteId)
      const newName = renameValue.trim()

      if (note && note.name !== newName) {
        renameNote(renamingNoteId, newName)
        showToast("Note renamed")
      }
    }
    setRenamingNoteId(null)
    setRenameValue("")
  }, [renamingNoteId, renameValue, renameNote, showToast, notes])

  return {
    renamingNoteId,
    renameValue,
    setRenameValue,
    startRename,
    finishRename,
    cancelRename: () => setRenamingNoteId(null),
  }
}
```

**Benefits:**
- Encapsulates complex rename interaction logic
- Easier to test rename flow
- Reduces App.tsx by ~30 lines

### 6. Refactored App.tsx Structure

After all extractions, `App.tsx` should look like:

```typescript
export function App() {
  // Data from useNotes hook
  const {
    notes, activeNote, preferences, isLoaded,
    createNote, switchNote, deleteNote, renameNote,
    updateContent, shareNote, importSharedNote,
    savePreferences, folderName, isFolderMapped,
    openFolder, closeFolder, pendingDeletions,
    confirmDeletions, cancelDeletions,
  } = useNotes()

  // UI state management
  const appState = useAppState()

  // Toast notifications
  const { toasts, showToast, removeToast } = useToasts()

  // Note actions with toast integration
  const noteActions = useNoteActions({
    notes, createNote, renameNote, deleteNote,
    shareNote, showToast,
    setShowShareModal: appState.setShowShareModal,
    setShareUrl: appState.setShareUrl,
  })

  // Folder sync actions
  const folderSync = useFolderSync({
    openFolder, closeFolder, showToast,
  })

  // Note rename logic
  const renameState = useNoteRename({
    notes, renameNote, showToast,
  })

  // Editor content management
  const [editorContent, setEditorContent] = useState(activeNote?.content || "")
  // ... editor sync logic ...

  // Quick actions
  const quickActions = useMemo(
    () => createQuickActions({
      onNewNote: noteActions.handleCreateNote,
      onManageNotes: () => appState.setShowManageNotes(true),
      // ... other handlers
    }),
    [noteActions, appState, /* deps */]
  )

  // Keyboard shortcuts
  useKeyBindings({
    bindings: createKeyboardShortcuts({
      onQuickActions: () => appState.setShowQuickActions(true),
      onNewNote: noteActions.handleCreateNote,
    }),
  })

  // Effects for initialization, CSS, onboarding, etc.
  // ...

  if (!isLoaded) return <LoadingScreen />
  if (!activeNote) return <LoadingScreen />

  return (
    <AppLayout
      topBar={
        <TopBar
          onMenuClick={() => appState.setShowMenu(!appState.showMenu)}
          onShareClick={noteActions.handleShare}
          isFolderMapped={isFolderMapped}
          folderName={folderName}
          activeNote={activeNote}
          {...renameState}
          onManageNotes={() => appState.setShowManageNotes(true)}
        />
      }
      bottomBar={
        <BottomBar
          onHelpClick={() => appState.setShowHelpMenu(true)}
          onMenuClick={() => appState.setShowMenu(!appState.showMenu)}
        />
      }
      modals={
        <>
          {/* All modals */}
          <Modals appState={appState} /* ... */ />
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </>
      }
    >
      <Editor
        value={editorContent}
        onUpdate={handleContentChange}
        preferences={preferences}
        onCopy={(value) => showToast(`Copied: ${value}`)}
      />
    </AppLayout>
  )
}
```

**Result:**
- App.tsx reduced from ~978 lines to ~200 lines
- Clear separation of concerns
- Much easier to understand and maintain

## Migration Strategy

### Phase 1: Preparation
1. Create directory structure: `components/app/{hooks,menus,actions,layout}/`
2. Set up test files for new modules
3. Document current App.tsx behavior with integration tests

### Phase 2: Extract Hooks (Low Risk)
4. Create and test `useToasts` hook
5. Create and test `useAppState` hook
6. Create and test `useNoteRename` hook
7. Create and test `useNoteActions` hook
8. Create and test `useFolderSync` hook
9. Update App.tsx to use new hooks

### Phase 3: Extract Action Definitions (Low Risk)
10. Create `quickActions.ts` and update App.tsx
11. Create `keyboardShortcuts.ts` and update App.tsx

### Phase 4: Extract Components (Medium Risk)
12. Create `menuItems.ts` with menu structure
13. Create `DesktopMenu` component
14. Create `MobileMenu` component
15. Create `NotesSubmenu` component
16. Update App.tsx to use new menu components

### Phase 5: Extract Layout (Medium Risk)
17. Create `AppLayout` component
18. Create `TopBar` component
19. Create `BottomBar` component
20. Create `ModalBackdrop` component
21. Update App.tsx to use layout components

### Phase 6: Testing & Cleanup
22. Run full test suite
23. Manual testing of all features
24. Remove unused code and imports
25. Update documentation

## Testing Strategy

### Unit Tests
- Test each hook in isolation
- Test action creators return correct structure
- Test menu item generation logic

### Integration Tests
- Test App.tsx still renders correctly
- Test all user flows end-to-end
- Test modal interactions
- Test note CRUD operations
- Test folder sync flows

### Visual Regression Tests (if applicable)
- Screenshot comparison before/after refactor
- Ensure no visual changes

## Risks & Mitigation

### Risk 1: Breaking existing functionality
**Mitigation:**
- Comprehensive integration tests before refactoring
- Incremental approach (one module at a time)
- Feature flags for new code paths (if needed)

### Risk 2: Performance regression
**Mitigation:**
- Profile before and after refactoring
- Monitor re-render counts
- Ensure memoization is preserved

### Risk 3: Merge conflicts during refactoring
**Mitigation:**
- Complete refactor in a dedicated branch
- Keep refactor branch up-to-date with main
- Small, focused commits

## Success Criteria

- [ ] App.tsx reduced to < 250 lines
- [ ] All existing tests pass
- [ ] No visual changes to UI
- [ ] No functional regressions
- [ ] Each extracted module has unit tests
- [ ] Code coverage maintained or improved
- [ ] Documentation updated
- [ ] Team can navigate codebase more easily

## Future Improvements

After initial refactoring:

1. **State management library:**
   - Consider Zustand or Context API for global state
   - Reduce prop drilling

2. **Component library:**
   - Extract reusable UI components (Button, Modal, Dropdown)
   - Consistent styling and behavior

3. **Feature modules:**
   - Group by feature (notes/, sharing/, sync/, preferences/)
   - Each feature has its own hooks, components, types

4. **Type safety:**
   - Stricter TypeScript types
   - Branded types for IDs
   - Discriminated unions for state

## Conclusion

This refactoring will significantly improve the maintainability of the App component by:
- Reducing complexity and cognitive load
- Improving testability
- Enabling parallel development (less merge conflicts)
- Making it easier to onboard new developers
- Creating reusable modules for future features

The incremental approach minimizes risk while delivering value at each phase.
