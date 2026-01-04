import { describe, it, expect } from "vitest"
import { Preferences } from "./Preferences"

describe("Preferences", () => {
  describe("default", () => {
    it("should create default preferences", () => {
      const prefs = Preferences.default()
      expect(prefs.fontSize).toBe(18)
      expect(prefs.theme).toBe("dark")
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
  })

  describe("serialization", () => {
    it("should serialize and deserialize correctly", () => {
      const original = Preferences.default().withFontSize(20).withTheme("light")
      const json = original.toJSON()
      const restored = Preferences.fromJSON(json)

      expect(restored.fontSize).toBe(20)
      expect(restored.theme).toBe("light")
    })
  })
})
