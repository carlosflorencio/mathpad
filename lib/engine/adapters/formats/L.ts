import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Liters format adapter
 * Displays numbers with L suffix (uppercase to avoid confusion with lowercase l)
 * Parses: L, l, liter, liters, litre, litres (case-insensitive for full words)
 */
export class LitersFormat implements FormatAdapter {
  id = "L"
  name = "Liters"
  description = "Format as liters (L)"
  unitCategory = UNIT_CATEGORIES.VOLUME
  toBaseUnit = 1 // Base unit for volume
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "L",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return (
      suffix === "L" ||
      lower === "l" ||
      lower === "liter" ||
      lower === "liters" ||
      lower === "litre" ||
      lower === "litres"
    )
  }
}
