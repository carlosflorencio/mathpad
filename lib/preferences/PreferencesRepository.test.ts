import { describe, it, expect, beforeEach } from "vitest"
import { Preferences } from "./Preferences"
import { PreferencesRepository } from "./PreferencesRepository"

// Mock window and localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, "window", {
  value: {},
  writable: true,
})

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
})

describe("PreferencesRepository", () => {
  let repository: PreferencesRepository

  beforeEach(() => {
    localStorageMock.clear()
    repository = new PreferencesRepository()
  })

  describe("load", () => {
    it("should return default preferences when nothing stored", () => {
      const result = repository.load()
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.fontSize).toBe(18)
        expect(result.value.theme).toBe("dark")
      }
    })

    it("should load stored preferences", () => {
      const custom = Preferences.default().withFontSize(24).withTheme("light")
      repository.save(custom)

      const result = repository.load()
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.fontSize).toBe(24)
        expect(result.value.theme).toBe("light")
      }
    })

    it("should handle corrupted data gracefully", () => {
      localStorage.setItem("mathpad-preferences", "invalid json")
      const result = repository.load()
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("Failed to load preferences")
      }
    })
  })

  describe("save", () => {
    it("should save preferences to localStorage", () => {
      const prefs = Preferences.default().withFontSize(20)
      const result = repository.save(prefs)
      expect(result.ok).toBe(true)

      const stored = localStorage.getItem("mathpad-preferences")
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.fontSize).toBe(20)
    })
  })
})
