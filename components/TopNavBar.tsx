"use client"

import { Note } from "@/lib/notes/Note"

interface TopNavBarProps {
  // Menu props
  showMenu: boolean
  onMenuToggle: () => void
  onPreferencesClick: () => void
  onManageNotesClick: () => void
  onFolderSyncHelpClick: () => void
  onHelpClick: () => void

  // Note props
  activeNote: Note
  isRenaming: boolean
  renameValue: string
  onStartRename: () => void
  onRenameChange: (value: string) => void
  onRenameComplete: () => void
  onRenameCancel: () => void

  // Folder sync props
  isFolderMapped: boolean
  folderName: string | null
  onOpenFolder: () => void
  onCloseFolder: () => void
}

export function TopNavBar({
  showMenu,
  onMenuToggle,
  onPreferencesClick,
  onManageNotesClick,
  onFolderSyncHelpClick,
  onHelpClick,
  activeNote,
  isRenaming,
  renameValue,
  onStartRename,
  onRenameChange,
  onRenameComplete,
  onRenameCancel,
  isFolderMapped,
  folderName,
  onOpenFolder,
  onCloseFolder,
}: TopNavBarProps) {
  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-[var(--ui-border-color)]">
      {/* Left: Menu */}
      <div className="relative select-none">
        <button
          title="Menu"
          className="icon-button rounded"
          onClick={onMenuToggle}
          style={{ padding: "0.5rem 0.75rem" }}
        >
          <svg
            width="20"
            height="20"
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
            <div className="dropdown-item" onClick={onPreferencesClick}>
              Preferences
            </div>

            <div className="dropdown-item" onClick={onManageNotesClick}>
              Manage Notes
            </div>

            {isFolderMapped ? (
              <>
                <div className="dropdown-item" onClick={onCloseFolder}>
                  Close Folder
                </div>
                <div className="dropdown-item" onClick={onFolderSyncHelpClick}>
                  Folder Sync Help
                </div>
              </>
            ) : (
              <div className="dropdown-item" onClick={onOpenFolder}>
                Open Folder...
              </div>
            )}

            <div className="dropdown-item md:hidden" onClick={onHelpClick}>
              Help
            </div>
          </div>
        )}
      </div>

      {/* Center: Note Title */}
      <div className="flex items-center gap-2 min-w-0">
        {isFolderMapped && folderName && (
          <span className="text-sm text-[var(--text-muted)] truncate">{folderName} /</span>
        )}
        {isRenaming ? (
          <input
            autoFocus
            type="text"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameComplete()
              if (e.key === "Escape") onRenameCancel()
            }}
            onBlur={onRenameComplete}
            className="text-[var(--text-color)] bg-[var(--bg-input)] px-2 py-1 rounded border border-[var(--ui-border-color)] outline-none"
            style={{ width: "200px" }}
          />
        ) : (
          <span
            onClick={onStartRename}
            className="cursor-pointer hover:opacity-70"
            title="Click to rename"
          >
            {activeNote.name}
          </span>
        )}
      </div>
    </div>
  )
}
