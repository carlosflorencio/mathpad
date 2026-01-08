import { describe, it, expect } from "vitest"
import { Preferences } from "./Preferences"

describe("Preferences", () => {
  describe("default", () => {
    it("should create default preferences", () => {
      const prefs = Preferences.default()
      expect(prefs.fontSize).toBe(18)
      expect(prefs.theme).toBe("dark")
      expect(prefs.vimMode).toBe(false)
    })
  })

  describe("with* methods", () => {
    it("should create new instance with updated fontSize", () => {
      const original = Preferences.default()
      const updated = original.withFontSize(24)

      expect(updated.fontSize).toBe(24)
      expect(original.fontSize).toBe(18) // immutability
    })

    it("should create new instance with updated theme", () => {
      const original = Preferences.default()
      const updated = original.withTheme("light")

      expect(updated.theme).toBe("light")
      expect(original.theme).toBe("dark")
    })

    it("should create new instance with updated vimMode", () => {
      const original = Preferences.default()
      const updated = original.withVimMode(true)

      expect(updated.vimMode).toBe(true)
      expect(original.vimMode).toBe(false) // immutability
    })
  })

  describe("serialization", () => {
    it("should serialize and deserialize correctly", () => {
      const original = Preferences.default().withFontSize(20).withTheme("light")
      const json = original.toJSON()
      const restored = Preferences.fromJSON(json)

      expect(restored.fontSize).toBe(20)
      expect(restored.theme).toBe("light")
    })

    it("should serialize and deserialize vimMode correctly", () => {
      const original = Preferences.default().withVimMode(true)
      const json = original.toJSON()
      const restored = Preferences.fromJSON(json)

      expect(restored.vimMode).toBe(true)
    })

    it("should handle missing vimMode in fromJSON (backward compatibility)", () => {
      const json = {
        fontSize: 18,
        decimalPlaces: 2,
        decimalSeparator: "." as const,
        thousandsSeparator: "," as const,
        theme: "dark" as const,
        hasSeenOnboarding: false,
        // vimMode is missing
      }
      const restored = Preferences.fromJSON(json)

      expect(restored.vimMode).toBe(false) // should default to false
    })
  })
})
