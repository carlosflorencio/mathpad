import { FormatAdapter, FormatResult } from "./base"

/**
 * Minutes format adapter
 * Displays numbers with min suffix
 * Parses: 100min, 100 min, 100 minute, 100 minutes
 */
export class MinutesFormat implements FormatAdapter {
  id = "min"
  name = "Minutes"
  description = "Format as minutes (min)"
  preserveInline = true

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
