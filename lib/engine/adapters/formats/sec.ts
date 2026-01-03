import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Seconds format adapter
 * Displays numbers with sec suffix
 * Parses: sec, second, seconds, s (case-insensitive)
 */
export class SecondsFormat implements FormatAdapter {
  id = "sec"
  name = "Seconds"
  description = "Format as seconds (sec)"
  unitCategory = UNIT_CATEGORIES.TIME
  preserveInline = true
  toBaseUnit = 1 // Base unit for time

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "sec",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "sec" || lower === "second" || lower === "seconds"
  }
}
