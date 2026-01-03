import { FormatAdapter, FormatResult } from "./base"

/**
 * Kilometer format adapter
 * Displays numbers with km suffix
 * Parses: 100km, 100 km
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
    return suffix.toLowerCase() === "km"
  }
}
