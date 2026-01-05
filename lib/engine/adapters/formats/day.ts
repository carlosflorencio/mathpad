import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Days format adapter
 * Displays numbers with day suffix
 * Parses: day, days, d (case-insensitive)
 */
export class DaysFormat implements FormatAdapter {
  id = "day"
  name = "Days"
  description = "Format as days (day)"
  unitCategory = UNIT_CATEGORIES.TIME
  preserveInline = true
  toBaseUnit = 86400 // 1 day = 86400 sec

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "day",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "day" || lower === "days" || lower === "d"
  }
}
