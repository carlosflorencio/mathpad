import { FormatAdapter, FormatResult } from "./base"

/**
 * Grams format adapter
 * Displays numbers with g suffix
 * Parses: 100g, 100 g, 100 gram, 100 grams
 * Note: Only lowercase 'g' to avoid confusion with other units
 */
export class GramsFormat implements FormatAdapter {
  id = "g"
  name = "Grams"
  description = "Format as grams (g)"
  preserveInline = true

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
