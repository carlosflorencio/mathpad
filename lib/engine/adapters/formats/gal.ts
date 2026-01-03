import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Gallons format adapter
 * Displays numbers with gal suffix
 * Parses: gal, gallon, gallons (case-insensitive)
 */
export class GallonsFormat implements FormatAdapter {
  id = "gal"
  name = "Gallons"
  description = "Format as gallons (gal)"
  unitCategory = UNIT_CATEGORIES.VOLUME
  toBaseUnit = 3.78541 // 1gal = 3.78541L (US gallon)
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "gal",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "gal" || lower === "gallon" || lower === "gallons"
  }
}
