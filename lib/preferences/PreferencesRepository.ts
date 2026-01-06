import { Preferences } from "./Preferences"
import { Result } from "../result"

const PREFERENCES_KEY = "mathpad-preferences"

export class PreferencesRepository {
  load(): Result<Preferences, string> {
    if (typeof window === "undefined") {
      return { ok: true, value: Preferences.default() }
    }

    try {
      const stored = localStorage.getItem(PREFERENCES_KEY)
      if (!stored) {
        return { ok: true, value: Preferences.default() }
      }

      const data = JSON.parse(stored)
      // Provide backward compatibility for hasSeenOnboarding field
      return {
        ok: true,
        value: Preferences.fromJSON({
          ...data,
          hasSeenOnboarding: data.hasSeenOnboarding ?? false,
        }),
      }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to load preferences: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  save(preferences: Preferences): Result<void, string> {
    if (typeof window === "undefined") {
      return { ok: true, value: undefined }
    }

    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences.toJSON()))
      return { ok: true, value: undefined }
    } catch (error) {
      return {
        ok: false,
        error: `Failed to save preferences: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }
}
