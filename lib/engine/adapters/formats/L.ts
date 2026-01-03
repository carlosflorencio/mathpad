import { FormatAdapter, FormatResult } from "./base"

/**
 * Liters format adapter
 * Displays numbers with L suffix
 * Parses: 100L, 100 L, 100 liter, 100 liters, 100 litre, 100 litres
 * Note: Uses uppercase L to distinguish from lowercase l (which looks like 1)
 */
export class LitersFormat implements FormatAdapter {
  id = "L"
  name = "Liters"
  description = "Format as liters (L)"
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
