import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Kilograms format adapter
 * Displays numbers with kg suffix
 * Parses: kg, kilogram, kilograms (case-insensitive)
 */
export class KilogramsFormat implements FormatAdapter {
  id = "kg"
  name = "Kilograms"
  description = "Format as kilograms (kg)"
  unitCategory = UNIT_CATEGORIES.WEIGHT
  preserveInline = true
  toBaseUnit = 1 // Base unit for weight

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "kg",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "kg" || lower === "kilogram" || lower === "kilograms"
  }
}
