import { FormatAdapter, FormatResult } from "./base"

/**
 * Feet format adapter
 * Displays numbers with ft suffix
 * Parses: 100ft, 100 ft, 100 foot, 100 feet
 */
export class FeetFormat implements FormatAdapter {
  id = "ft"
  name = "Feet"
  description = "Format as feet (ft)"
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "ft",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "ft" || lower === "foot" || lower === "feet"
  }
}
