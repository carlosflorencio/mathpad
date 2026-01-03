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

    style.setProperty("--text-color", isDark ? colors.light : colors.medium)
    style.setProperty("--dialog-bg-color", isDark ? colors.background : colors.darkBackground)
    style.setProperty("--desk-bg-color", isDark ? colors.darkBackground : "#f8f9fa")
    style.setProperty("--cm-background", colors.background)
  }
}

export function App() {
  const { content, preferences, isLoaded, saveContent, savePreferences } = useLocalStorage()
  const [showPreferences, setShowPreferences] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([])

  useEffect(() => {
    if (isLoaded) {
      configureCSSVars(preferences)
    }
  }, [isLoaded, preferences])

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDialogs()
      }
    }

    window.addEventListener("keyup", handleKeyUp)
    return () => window.removeEventListener("keyup", handleKeyUp)
  }, [])

  const closeDialogs = () => {
    setShowPreferences(false)
    setShowHelp(false)
  }

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
    return <div className="flex flex-1 bg-[hsl(220,13%,18%)]"></div>
  }

  const isDark = preferences.theme === "dark"
  const bgColor = "bg-[var(--desk-bg-color)]"
  const textColor = isDark ? "text-[rgba(214,221,209)]" : "text-[hsl(0,0%,50%)]"

  return (
    <div className={`flex flex-col min-h-screen font-mono ${bgColor}`}>
      {!showHelp && !showPreferences && (
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
      )}
      {showPreferences && (
        <PreferencesDialog
          preferences={preferences}
          close={closeDialogs}
          save={handleSavePreferences}
        />
      )}
      {showHelp && <Help close={closeDialogs} />}

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div
        className={`fixed bottom-1 right-1 ${textColor} text-2xl select-none cursor-pointer text-right group`}
      >
        <div className="hidden group-hover:block group-hover:bg-[var(--dialog-bg-color)] px-1">
          <p
            className="cursor-pointer text-base hover:underline"
            onClick={() => {
              closeDialogs()
              setShowHelp(true)
            }}
          >
            Help
          </p>
          <p
            className="cursor-pointer text-base hover:underline"
            onClick={() => {
              closeDialogs()
              setShowPreferences(true)
            }}
          >
            Preferences
          </p>
        </div>
        ⚙
      </div>
    </div>
  )
}
