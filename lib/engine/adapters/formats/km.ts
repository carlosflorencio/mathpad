import { FormatAdapter, FormatResult } from "./base"

/**
 * Kilometer format adapter
 * Displays numbers with km suffix
 * Parses: km, kilometer, kilometers (case-insensitive)
 */
export class KilometerFormat implements FormatAdapter {
  id = "km"
  name = "Kilometer"
  description = "Format as kilometers (km)"
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "km",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "km" || lower === "kilometer" || lower === "kilometers"
  }
}
