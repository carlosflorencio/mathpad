import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Minutes format adapter
 * Displays numbers with min suffix
 * Parses: min, minute, minutes (case-insensitive)
 */
export class MinutesFormat implements FormatAdapter {
  id = "min"
  name = "Minutes"
  description = "Format as minutes (min)"
  unitCategory = UNIT_CATEGORIES.TIME
  preserveInline = true
  toBaseUnit = 60 // 1 min = 60 sec

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "min",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "min" || lower === "minute" || lower === "minutes"
  }
}
