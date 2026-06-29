# Vim Key Bindings Implementation Plan

## Overview

Add vim key bindings as an optional user setting in Mathpad, allowing users to toggle between default and vim keybindings in the editor.

## Goals

- Provide optional vim key bindings for the CodeMirror editor
- Make it configurable through the preferences dialog
- Maintain backward compatibility (default: vim disabled)
- Support core vim motions and commands suitable for a mathematical notepad
- Make all menus keyboard-accessible with vim-style keybindings
- Display keybind hints in menus when vim mode is enabled

## Architecture

### 1. Preferences Layer

#### Update `Preferences` class (`lib/preferences/Preferences.ts`)

**Changes:**

- Add `vimMode: boolean` property to the Preferences class
- Update constructor to accept vim mode parameter
- Add `withVimMode(enabled: boolean): Preferences` method
- Update `toJSON()` and `fromJSON()` methods to include vimMode
- Update `default()` to set `vimMode: false`

**Example:**

```typescript
export class Preferences {
  constructor(
    public readonly fontSize: number,
    public readonly decimalPlaces: number,
    public readonly decimalSeparator: "," | ".",
    public readonly thousandsSeparator: "," | "." | " " | "",
    public readonly theme: "dark" | "light",
    public readonly hasSeenOnboarding: boolean,
    public readonly vimMode: boolean // NEW
  ) {}

  static default(): Preferences {
    return new Preferences(18, 2, ".", ",", "dark", false, false)
  }

  withVimMode(enabled: boolean): Preferences {
    return new Preferences(
      this.fontSize,
      this.decimalPlaces,
      this.decimalSeparator,
      this.thousandsSeparator,
      this.theme,
      this.hasSeenOnboarding,
      enabled
    )
  }

  // Update other with* methods to include vimMode
  // Update toJSON() and fromJSON()
}
```

**Files to modify:**

- `lib/preferences/Preferences.ts` - Add vimMode property and methods
- `lib/preferences/Preferences.test.ts` - Update tests to include vimMode

### 2. UI Layer

#### Update `PreferencesDialog` component (`components/PreferencesDialog.tsx`)

**Changes:**

- Add state for `vimMode` boolean
- Add toggle/checkbox for vim mode setting
- Update the effect that saves preferences to include vimMode

**Example UI addition:**

```tsx
<div className="mb-4">
  <label className="form-label flex items-center gap-2">
    <input
      type="checkbox"
      checked={vimMode}
      onChange={(e) => setVimMode(e.target.checked)}
      className="form-checkbox"
    />
    <span>Enable Vim Key Bindings</span>
  </label>
  <p className="text-sm text-[var(--text-muted)] mt-1">
    Use vim-style navigation and editing commands
  </p>
</div>
```

**Files to modify:**

- `components/PreferencesDialog.tsx` - Add vim mode toggle UI

### 3. CodeMirror Integration

#### Install CodeMirror vim extension

**Package to install:**

```bash
npm install @replit/codemirror-vim
```

This is the official vim mode extension for CodeMirror 6, maintained by Replit.

#### Update `Editor` component (`components/Editor.tsx`)

**Changes:**

- Import vim extension from `@replit/codemirror-vim`
- Create vim extension conditionally based on preferences
- Add vim extension to the extensions array when enabled
- Handle vim mode changes dynamically

**Implementation approach:**

```typescript
import { vim } from "@replit/codemirror-vim"

// Inside EditorComponent:
const extensions = useMemo(() => {
  const exts = [
    // ... existing extensions
    mathpadLanguage(),
    dark(preferences.theme === "dark"),
    light(preferences.theme === "light"),
    // ... other extensions
  ]

  // Conditionally add vim mode
  if (preferences.vimMode) {
    exts.push(vim())
  }

  return exts
}, [preferences /* other deps */])
```

**Considerations:**

- Vim extension should be added to the extensions array conditionally
- When vim mode is toggled, the entire editor extensions need to be reconfigured
- The vim extension may conflict with some existing keybindings (handled by priority)
- Consider using Compartment for dynamic vim mode toggling

**Files to modify:**

- `components/Editor.tsx` - Add conditional vim extension

### 4. Vim Mode Customization (Optional Enhancements)

#### Custom vim commands for Mathpad

Since this is a mathematical notepad, consider customizing vim to work better with the domain:

**Potential customizations:**

- Preserve quick action palette (Cmd/Ctrl+K) even in vim mode
- Preserve new note creation (Cmd/Ctrl+N) even in vim mode
- Configure vim's ':' command mode to work with Mathpad features
- Add custom vim commands like `:format` to format results

**Example:**

```typescript
import { vim, Vim } from "@replit/codemirror-vim"

if (preferences.vimMode) {
  // Configure vim before using it
  Vim.defineEx("format", "for", () => {
    // Custom format command
  })

  exts.push(
    vim({
      // Override specific keybindings if needed
    })
  )
}
```

### 5. Keybinding Conflicts Resolution

#### Review and resolve conflicts

**Potential conflicts to address:**

- **Cmd/Ctrl+K**: Quick action palette (preserve this)
- **Cmd/Ctrl+N**: New note (preserve this)
- **Completion**: Tab for autocomplete vs vim tab behavior
- **History**: Vim undo/redo vs CodeMirror history

**Strategy:**

- Use `keymap.of()` with higher precedence for Mathpad-specific commands
- Configure vim to allow certain keys to fall through
- Document vim mode behavior in help/keybindings modal

**Implementation:**

```typescript
const vimKeymapOverrides = keymap.of([
  {
    key: "Mod-k",
    run: () => {
      // Always open quick actions, even in vim mode
      setShowQuickActions(true)
      return true
    },
  },
  {
    key: "Mod-n",
    run: () => {
      // Always create new note, even in vim mode
      createNote()
      return true
    },
  },
])

// Add this keymap AFTER vim extension to override
if (preferences.vimMode) {
  exts.push(vim())
  exts.push(vimKeymapOverrides) // Higher priority
}
```

### 6. Documentation Updates

#### Update user-facing documentation

**Files to update:**

- `components/modals/KeybindingsModal.tsx` - Add section explaining vim mode
  - List supported vim commands (navigation, editing, visual mode)
  - Explain how to enable/disable vim mode
  - Document any Mathpad-specific overrides

**Example content:**

```markdown
## Vim Mode (Optional)

Enable vim key bindings in Preferences for vim-style editing:

**Normal mode navigation:**

- h, j, k, l - Move cursor left, down, up, right
- w, b - Move by word forward/backward
- 0, $ - Start/end of line
- gg, G - Start/end of document

**Insert mode:**

- i, a - Insert before/after cursor
- I, A - Insert at start/end of line
- o, O - New line below/above

**Visual mode:**

- v - Visual character mode
- V - Visual line mode

**Editing:**

- x, dd - Delete character/line
- yy, p - Copy line, paste
- u, Ctrl-r - Undo, redo

**Note:** Quick actions (Cmd/Ctrl+K) and new note (Cmd/Ctrl+N)
work the same in both normal and vim modes.
```

### 7. Keyboard-Accessible Menus

#### Make all menus navigable with keyboard

When vim mode is enabled, users should be able to navigate and activate menu items using keyboard shortcuts without touching the mouse.

**Design principles:**

- All menu items should have single-letter keybindings (vim-style)
- Keybindings should be mnemonic (e.g., 'n' for New Note, 'p' for Preferences)
- Show keybind hints next to menu items when vim mode is enabled
- Support both uppercase and lowercase keys
- Don't conflict with vim editing commands

#### Menu Keybinding Schema

**Top-level menu items:**

```
n - New Note
m - Manage Notes
o - Open Folder
c - Close Folder (if folder is open)
p - Preferences
s - Share
h - Help
```

**Notes submenu:**

```
1-9 - Switch to note 1-9
j/k - Navigate down/up in note list (vim-style)
/ - Search/filter notes
```

**Help menu:**

```
k - Keybindings
s - Syntax Guide
f - Folder Sync Help
a - About
```

#### Implementation

**Step 1: Create keyboard navigation hook**

File: `hooks/useKeyboardMenuNavigation.ts`

```typescript
interface MenuKeyBinding {
  key: string
  label: string
  action: () => void
  disabled?: boolean
}

export function useKeyboardMenuNavigation(
  isOpen: boolean,
  bindings: MenuKeyBinding[],
  vimModeEnabled: boolean
) {
  useEffect(() => {
    if (!isOpen || !vimModeEnabled) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle single key presses (no modifiers except shift)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const key = e.key.toLowerCase()
      const binding = bindings.find((b) => b.key === key && !b.disabled)

      if (binding) {
        e.preventDefault()
        e.stopPropagation()
        binding.action()
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [isOpen, bindings, vimModeEnabled])
}
```

**Step 2: Update menu components to show keybind hints**

Update `DesktopMenu.tsx` (and similar for `MobileMenu.tsx`):

```typescript
interface MenuItemProps {
  label: string
  onClick: () => void
  keybind?: string  // NEW: single letter keybind
  disabled?: boolean
  vimModeEnabled: boolean  // NEW
}

function MenuItem({ label, onClick, keybind, disabled, vimModeEnabled }: MenuItemProps) {
  return (
    <div
      className={`dropdown-item ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <span>{label}</span>
      {vimModeEnabled && keybind && (
        <span className="ml-auto text-[var(--text-muted)] font-mono text-sm">
          {keybind}
        </span>
      )}
    </div>
  )
}
```

**Step 3: Update menu item definitions**

Update `menuItems.ts`:

```typescript
export interface MenuItem {
  id: string
  label: string
  onClick: () => void
  keybind?: string // NEW: vim-style keyboard shortcut
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
      keybind: "n", // NEW
      onClick: params.onNewNote,
    },
    {
      id: "notes",
      label: "Notes",
      keybind: "→", // NEW: arrow to indicate submenu
      submenu: params.notes.map((note, index) => ({
        id: note.id,
        label: note.id === params.activeNoteId ? `• ${note.name}` : note.name,
        keybind: index < 9 ? String(index + 1) : undefined, // NEW: numbers 1-9
        onClick: () => params.onSwitchNote(note.id),
      })),
      dividerAfter: true,
    },
    {
      id: "manage-notes",
      label: "Manage Notes",
      keybind: "m", // NEW
      onClick: params.onManageNotes,
      dividerAfter: true,
    },
    {
      id: "open-folder",
      label: params.isFolderMapped ? "Change Folder" : "Open Folder",
      keybind: "o", // NEW
      onClick: params.onOpenFolder,
      disabled: !params.isFileSystemSupported,
    },
    {
      id: "close-folder",
      label: "Close Folder",
      keybind: "c", // NEW
      onClick: params.onCloseFolder,
      show: params.isFolderMapped,
      dividerAfter: true,
    },
    {
      id: "preferences",
      label: "Preferences",
      keybind: "p", // NEW
      onClick: params.onPreferences,
    },
  ]
}
```

**Step 4: Wire up keyboard navigation in App.tsx**

```typescript
// In DesktopMenu component
const menuBindings = useMemo(() => {
  return menuItems
    .filter((item) => item.show !== false)
    .map((item) => ({
      key: item.keybind || "",
      label: item.label,
      action: () => {
        item.onClick()
        setShowMenu(false)
      },
      disabled: item.disabled,
    }))
    .filter((binding) => binding.key !== "")
}, [menuItems])

useKeyboardMenuNavigation(showMenu, menuBindings, preferences.vimMode)

// Similar for other menus (Help, Notes submenu)
```

#### Visual Design for Keybind Hints

**Display style:**

- Right-aligned in menu items
- Monospace font
- Muted color (not as prominent as the menu label)
- Small size (12-14px)

**Example rendering:**

```
┌─────────────────────────────┐
│ New Note              n     │
│ Notes                 →     │
│ Manage Notes          m     │
├─────────────────────────────┤
│ Open Folder           o     │
│ Preferences           p     │
└─────────────────────────────┘
```

**CSS styling:**

```css
.menu-item-keybind {
  margin-left: auto;
  padding-left: 2rem;
  color: var(--text-muted);
  font-family: monospace;
  font-size: 0.875rem;
  opacity: 0.7;
}
```

#### Keybind Conflicts Resolution

**Potential conflicts:**

- Menu keybinds vs. vim editor commands
- Menu keybinds vs. global shortcuts (Cmd/Ctrl+K, Cmd/Ctrl+N)

**Resolution strategy:**

- Menu keybinds only work when menu is open
- Use event handlers with `stopPropagation()` to prevent editor interference
- Document that menus "steal" focus when open (expected behavior)

#### Accessibility Considerations

**Keyboard focus management:**

- When menu opens, trap focus within menu
- Tab/Shift+Tab to navigate between items (in addition to keybinds)
- Escape to close menu
- Enter/Space to activate focused item

**Screen reader support:**

- Announce keybinds as part of item label: "New Note, press N"
- Use `aria-keyshortcuts` attribute on menu items
- Ensure menu has proper ARIA roles

**Implementation:**

```typescript
<div
  className="dropdown-item"
  role="menuitem"
  aria-keyshortcuts={vimModeEnabled && keybind ? keybind : undefined}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }}
>
  <span>{label}</span>
  {vimModeEnabled && keybind && (
    <span className="menu-item-keybind" aria-hidden="true">
      {keybind}
    </span>
  )}
</div>
```

#### Quick Action Palette Integration

The quick action palette (Cmd/Ctrl+K) should also show keybinds when vim mode is enabled:

```typescript
interface Action {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  handler: () => void
  keywords: string[]
  keybind?: string  // NEW: optional keybind to display
}

// Update action definitions
const quickActions: Action[] = [
  {
    id: "new-note",
    label: "New Note",
    description: "Create a new note",
    icon: <PlusIcon />,
    keybind: "n",  // NEW
    handler: () => { /* ... */ },
    keywords: ["create", "add"],
  },
  // ... more actions
]

// In QuickActionPalette component
<div className="action-item">
  <div className="action-icon">{action.icon}</div>
  <div className="action-text">
    <div className="action-label">{action.label}</div>
    <div className="action-description">{action.description}</div>
  </div>
  {vimModeEnabled && action.keybind && (
    <div className="action-keybind">{action.keybind}</div>
  )}
</div>
```

### 8. Testing Strategy

#### Test coverage needed

**Unit tests:**

- `Preferences.test.ts` - Test vim mode property and methods
- Verify serialization/deserialization with vimMode

**Integration tests:**

- Test vim mode toggle in preferences dialog
- Verify vim keybindings work when enabled
- Verify default keybindings work when disabled
- Test switching between modes preserves editor state

**Manual testing checklist:**

_Editor vim mode:_

- [ ] Enable vim mode in preferences
- [ ] Test basic vim navigation (hjkl, w, b, 0, $)
- [ ] Test insert mode (i, a, o, O)
- [ ] Test visual mode (v, V)
- [ ] Test deletion and undo (dd, x, u)
- [ ] Test quick actions still work (Cmd/Ctrl+K)
- [ ] Test new note still works (Cmd/Ctrl+N)
- [ ] Test autocompletion works in insert mode
- [ ] Disable vim mode and verify normal behavior
- [ ] Test vim mode persists across sessions

_Keyboard menu navigation:_

- [ ] Open menu with vim mode enabled
- [ ] Verify keybind hints are displayed next to menu items
- [ ] Test single-letter keybinds (n, m, o, p, s, h)
- [ ] Test notes submenu navigation (1-9 for switching notes)
- [ ] Test help menu keybinds (k, s, f, a)
- [ ] Verify keybinds only work when menu is open
- [ ] Verify Escape closes menus
- [ ] Test Tab/Shift+Tab navigation works
- [ ] Test Enter/Space activates focused items
- [ ] Disable vim mode and verify keybind hints are hidden
- [ ] Test with screen reader (accessibility)
- [ ] Verify ARIA attributes are correct

## Implementation Steps

### Phase 1: Foundation

1. Update `Preferences` class with vimMode property
2. Update Preferences tests
3. Add vim mode toggle to PreferencesDialog
4. Install `@replit/codemirror-vim` package

### Phase 2: Editor Integration

5. Add conditional vim extension to Editor component
6. Test basic vim functionality
7. Implement keybinding overrides for Mathpad-specific commands

### Phase 3: Keyboard Menu Navigation

8. Create `useKeyboardMenuNavigation` hook
9. Update menu item type definitions to include `keybind` property
10. Update `createMenuItems` function with keybind assignments
11. Update `DesktopMenu` component to display keybind hints
12. Update `MobileMenu` component to display keybind hints
13. Wire up keyboard navigation in `App.tsx`
14. Update `HelpMenu` component with keybinds
15. Update `QuickActionPalette` to show keybinds
16. Add CSS styling for keybind hints
17. Implement accessibility features (ARIA, focus management)

### Phase 4: Polish

18. Update KeybindingsModal documentation with menu keybinds
19. Add vim mode indicator to editor (optional status bar)
20. Test mode switching and persistence
21. Add vim mode section to help documentation
22. Document menu keybind behavior

### Phase 5: Testing & Release

23. Complete manual testing checklist (editor + menus)
24. Test accessibility with screen readers
25. Gather user feedback (if applicable)
26. Document known limitations or quirks

## Technical Considerations

### CodeMirror 6 Compartments

Consider using Compartments for dynamic vim mode toggling:

```typescript
const vimCompartment = useRef(new Compartment())

// Initial setup
const extensions = [vimCompartment.current.of(preferences.vimMode ? vim() : [])]

// When preferences change
if (editorView) {
  editorView.dispatch({
    effects: vimCompartment.current.reconfigure(preferences.vimMode ? vim() : []),
  })
}
```

This allows toggling vim mode without recreating the entire editor.

### Vim Status Bar (Optional Enhancement)

Add a status indicator showing:

- Current vim mode (NORMAL, INSERT, VISUAL)
- Current line/column
- Vim command buffer (when typing multi-key commands)

### Accessibility

- Ensure vim mode doesn't break screen reader support
- Document that users relying on screen readers may want to disable vim mode
- Test with keyboard-only navigation

## Potential Issues & Solutions

### Issue 1: Vim blocks autocomplete

**Problem:** Tab key in insert mode triggers vim indent instead of accepting completion
**Solution:** Configure vim to allow Tab to fall through when completion popup is active

### Issue 2: Mode confusion for new users

**Problem:** Users accidentally enable vim mode and get confused
**Solution:** Add mode indicator, clear documentation, easy toggle in preferences

### Issue 3: Performance with vim mode

**Problem:** Vim extension may add overhead
**Solution:** Lazy-load vim extension only when enabled, monitor performance

### Issue 4: Conflict with browser shortcuts

**Problem:** Some vim commands conflict with browser shortcuts
**Solution:** Document known conflicts, use preventDefault judiciously

## Future Enhancements

1. **Vim configuration options:**
   - Relative line numbers
   - Custom vim keybindings
   - Configure specific vim features (visual mode, macros, etc.)

2. **Mathpad-specific vim commands:**
   - `:eval` - Evaluate current line/selection
   - `:clear` - Clear calculation context
   - `:format <unit>` - Convert result to different unit

3. **Vim mode themes:**
   - Customize vim mode indicator appearance
   - Different cursor styles for different modes

4. **Import vim configurations:**
   - Allow users to import their .vimrc-like settings
   - Preset vim configurations (minimal, standard, power-user)

5. **Enhanced keyboard menu navigation:**
   - Fuzzy search in notes submenu (activated by `/`)
   - Two-letter keybinds for more menu items (e.g., `gn` for "Go to Note")
   - Custom user-defined keybinds
   - Menu navigation history (jump back with Backspace)
   - Breadcrumb trail for nested menus

6. **Quick action enhancements:**
   - Vim-style command mode (`:` to open command palette)
   - Execute actions by typing names (e.g., `:preferences`, `:new note`)
   - Command history and completion

## References

- [CodeMirror 6 Vim Mode](https://github.com/replit/codemirror-vim)
- [CodeMirror 6 Extensions](https://codemirror.net/docs/guide/)
- [Vim Keybindings Reference](https://vim.rtorr.com/)

## Success Criteria

_Core vim functionality:_

- [ ] Users can enable/disable vim mode via preferences
- [ ] Vim mode preference persists across sessions
- [ ] Core vim motions work correctly (hjkl, w, b, 0, $, gg, G)
- [ ] Insert mode works as expected
- [ ] Mathpad-specific shortcuts (Cmd/Ctrl+K, Cmd/Ctrl+N) still work
- [ ] Autocomplete works in insert mode
- [ ] No performance degradation
- [ ] Smooth mode switching without losing editor content

_Keyboard menu navigation:_

- [ ] All menu items have assigned keybinds
- [ ] Keybind hints display when vim mode is enabled
- [ ] Keybind hints are hidden when vim mode is disabled
- [ ] Single-letter keybinds activate menu items correctly
- [ ] Menu keybinds only work when menu is open (no conflicts with editor)
- [ ] Tab/Shift+Tab navigation works for accessibility
- [ ] ARIA attributes correctly announce keybinds to screen readers
- [ ] Quick action palette shows keybinds when vim mode is enabled

_Documentation:_

- [ ] KeybindingsModal documents both editor and menu vim keybinds
- [ ] Help documentation explains vim mode features
- [ ] Menu keybind behavior is clearly documented
