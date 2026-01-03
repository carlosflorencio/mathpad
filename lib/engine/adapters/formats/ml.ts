import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Milliliters format adapter
 * Displays numbers with ml suffix
 * Parses: ml, milliliter, milliliters, millilitre, millilitres (case-insensitive)
 */
export class MillilitersFormat implements FormatAdapter {
  id = "ml"
  name = "Milliliters"
  description = "Format as milliliters (ml)"
  unitCategory = UNIT_CATEGORIES.VOLUME
  toBaseUnit = 0.001 // 1ml = 0.001L
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "ml",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return (
      lower === "ml" ||
      lower === "milliliter" ||
      lower === "milliliters" ||
      lower === "millilitre" ||
      lower === "millilitres"
    )
  }
}
