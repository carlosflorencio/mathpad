import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Feet format adapter
 * Displays numbers with ft suffix
 * Parses: ft, foot, feet (case-insensitive)
 */
export class FeetFormat implements FormatAdapter {
  id = "ft"
  name = "Feet"
  description = "Format as feet (ft)"
  unitCategory = UNIT_CATEGORIES.DISTANCE
  preserveInline = true
  toBaseUnit = 0.3048 // 1 ft = 0.3048 m

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
