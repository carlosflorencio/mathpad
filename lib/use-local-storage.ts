"use client"

import { useState, useEffect } from "react"
import { Preferences, defaultPreferences } from "./types"

const CONTENT_KEY = "mathpad-content"
const PREFERENCES_KEY = "mathpad-preferences"

export function useLocalStorage() {
  // Initialize state with values from localStorage/URL hash
  const [content, setContent] = useState<string>(() => {
    if (typeof window === "undefined") return ""

    // Check URL hash first (takes precedence)
    const hash = window.location.hash.slice(1)
    if (hash) {
      try {
        return decodeURIComponent(hash)
      } catch (e) {
        console.error("Failed to decode URL hash:", e)
      }
    }

    // Load from localStorage
    const storedContent = localStorage.getItem(CONTENT_KEY)
    return storedContent || ""
  })

  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof window === "undefined") return defaultPreferences

    const storedPreferences = localStorage.getItem(PREFERENCES_KEY)
    if (storedPreferences) {
      try {
        return JSON.parse(storedPreferences)
      } catch (e) {
        console.error("Failed to parse preferences:", e)
      }
    }
    return defaultPreferences
  })

  const [isLoaded, setIsLoaded] = useState(false)

  // Mark as loaded after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true)
  }, [])

  // Save content to localStorage
  const saveContent = (value: string) => {
    setContent(value)
    if (typeof window !== "undefined") {
      localStorage.setItem(CONTENT_KEY, value)
    }
  }

  // Save preferences to localStorage
  const savePreferences = (prefs: Preferences) => {
    setPreferences(prefs)
    if (typeof window !== "undefined") {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
    }
  }

  // Update URL hash with current content
  const shareContent = () => {
    if (typeof window !== "undefined" && content) {
      const encoded = encodeURIComponent(content)
      window.location.hash = encoded
      // Copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
      return window.location.href
    }
    return ""
  }

  return {
    content,
    preferences,
    isLoaded,
    saveContent,
    savePreferences,
    shareContent,
  }
}
