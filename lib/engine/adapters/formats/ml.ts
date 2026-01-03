import { FormatAdapter, FormatResult } from "./base"

/**
 * Milliliters format adapter
 * Displays numbers with ml suffix
 * Parses: 100ml, 100 ml, 100 milliliter, 100 milliliters, 100 millilitre, 100 millilitres
 */
export class MillilitersFormat implements FormatAdapter {
  id = "ml"
  name = "Milliliters"
  description = "Format as milliliters (ml)"
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
