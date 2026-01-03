import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Grams format adapter
 * Displays numbers with g suffix
 * Parses: g (lowercase only), gram, grams
 * Note: Only lowercase 'g' to avoid future conflicts
 */
export class GramsFormat implements FormatAdapter {
  id = "g"
  name = "Grams"
  description = "Format as grams (g)"
  unitCategory = UNIT_CATEGORIES.WEIGHT
  preserveInline = true
  toBaseUnit = 0.001 // 1 g = 0.001 kg

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "g",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    // Only accept lowercase to distinguish from potential uppercase G unit
    return suffix === "g" || lower === "gram" || lower === "grams"
  }
}
