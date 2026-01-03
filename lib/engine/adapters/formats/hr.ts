import { FormatAdapter, FormatResult } from "./base"

/**
 * Hours format adapter
 * Displays numbers with hr suffix
 * Parses: 2hr, 2 hr, 2h, 2 h, 2 hour, 2 hours
 */
export class HoursFormat implements FormatAdapter {
  id = "hr"
  name = "Hours"
  description = "Format as hours (hr)"
  preserveInline = true

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
