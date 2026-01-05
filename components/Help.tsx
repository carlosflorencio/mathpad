"use client"

import { useState } from "react"
import { KeybindingsModal } from "./modals/KeybindingsModal"
import { EditorSyntaxModal } from "./modals/EditorSyntaxModal"
import { FolderSyncHelpModal } from "./modals/FolderSyncHelpModal"
import { AboutModal } from "./modals/AboutModal"

interface HelpProps {
  close: () => void
}

type HelpSection = "menu" | "keybindings" | "syntax" | "folder-sync" | "about"

export function Help({ close }: HelpProps) {
  const [activeSection, setActiveSection] = useState<HelpSection>("menu")

  if (activeSection === "keybindings") {
    return <KeybindingsModal onClose={() => setActiveSection("menu")} />
  }

  if (activeSection === "syntax") {
    return <EditorSyntaxModal onClose={() => setActiveSection("menu")} />
  }

  if (activeSection === "folder-sync") {
    return <FolderSyncHelpModal onClose={() => setActiveSection("menu")} />
  }

  if (activeSection === "about") {
    return <AboutModal onClose={() => setActiveSection("menu")} />
  }

  // Main menu
  return (
    <div className="modal" style={{ maxWidth: "500px" }}>
      <h2 className="text-lg mb-4">Help & Documentation</h2>

      <div className="space-y-2">
        <button
          onClick={() => setActiveSection("keybindings")}
          className="w-full text-left p-4 rounded border border-[var(--ui-border-color)] hover:bg-[var(--bg-button-hover)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--text-muted)]"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
            </svg>
            <div>
              <div className="font-semibold text-[var(--text-color)]">Keyboard Shortcuts</div>
              <div className="text-sm text-[var(--text-muted)]">
                View all keyboard shortcuts and commands
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveSection("syntax")}
          className="w-full text-left p-4 rounded border border-[var(--ui-border-color)] hover:bg-[var(--bg-button-hover)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--text-muted)]"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <div>
              <div className="font-semibold text-[var(--text-color)]">Editor Syntax</div>
              <div className="text-sm text-[var(--text-muted)]">
                Learn calculator syntax and features
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveSection("folder-sync")}
          className="w-full text-left p-4 rounded border border-[var(--ui-border-color)] hover:bg-[var(--bg-button-hover)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--text-muted)]"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <div>
              <div className="font-semibold text-[var(--text-color)]">Folder Sync</div>
              <div className="text-sm text-[var(--text-muted)]">
                How to sync notes with a local folder
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveSection("about")}
          className="w-full text-left p-4 rounded border border-[var(--ui-border-color)] hover:bg-[var(--bg-button-hover)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--text-muted)]"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <div className="font-semibold text-[var(--text-color)]">About</div>
              <div className="text-sm text-[var(--text-muted)]">App version and information</div>
            </div>
          </div>
        </button>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={close}
          className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
        >
          Close
        </button>
      </div>
    </div>
  )
}
