import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Kilometers format adapter
 * Displays numbers with km suffix
 * Parses: km, kilometer, kilometers (case-insensitive)
 */
export class KilometerFormat implements FormatAdapter {
  id = "km"
  name = "Kilometers"
  description = "Format as kilometers (km)"
  unitCategory = UNIT_CATEGORIES.DISTANCE
  preserveInline = true
  toBaseUnit = 1000 // 1 km = 1000 m

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
