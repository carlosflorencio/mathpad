"use client"

import { useCallback, useEffect, useState } from "react"
import { useLocalStorage } from "@/lib/use-local-storage"
import { Preferences } from "@/lib/types"
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
  const { content, preferences, isLoaded, saveContent, savePreferences } = useLocalStorage()
  const [showPreferences, setShowPreferences] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([])

  useEffect(() => {
    if (isLoaded) {
      configureCSSVars(preferences)
    }
  }, [isLoaded, preferences])

  const closeDialogs = useCallback(() => {
    setShowPreferences(false)
    setShowHelp(false)
    setShowMenu(false)
  }, [])

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDialogs()
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

  if (!isLoaded || typeof window === "undefined") {
    return <div className="flex flex-1 bg-[var(--desk-bg-color)]"></div>
  }

  return (
    <div className="flex flex-col min-h-screen font-mono bg-[var(--desk-bg-color)]">
      <div className="desk-container">
        <div className="paper-container">
          <Editor
            value={content}
            onUpdate={saveContent}
            preferences={preferences}
            onCopy={(value: string) => showToast(`Copied: ${value}`)}
          />
        </div>
      </div>

      {(showPreferences || showHelp) && <div className="modal-backdrop" onClick={closeDialogs} />}

      {showPreferences && (
        <PreferencesDialog
          preferences={preferences}
          close={closeDialogs}
          save={handleSavePreferences}
        />
      )}

      {showHelp && <Help close={closeDialogs} />}

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Top Left Menu & Share */}
      <div className="fixed top-4 left-4 flex gap-2 items-start select-none">
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
                  setShowPreferences(true)
                  setShowMenu(false)
                }}
              >
                Preferences
              </div>
              <div
                className="dropdown-item md:hidden"
                onClick={() => {
                  showToast("Share functionality coming soon")
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

        <button
          title="Share"
          className="hidden md:flex icon-button"
          onClick={() => showToast("Share functionality coming soon")}
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
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
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
