import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Hours format adapter
 * Displays numbers with hr suffix
 * Parses: hr, h, hour, hours (case-insensitive)
 */
export class HoursFormat implements FormatAdapter {
  id = "hr"
  name = "Hours"
  description = "Format as hours (hr)"
  unitCategory = UNIT_CATEGORIES.TIME
  preserveInline = true
  toBaseUnit = 3600 // 1 hr = 3600 sec

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "hr",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "hr" || lower === "h" || lower === "hour" || lower === "hours"
  }
}
