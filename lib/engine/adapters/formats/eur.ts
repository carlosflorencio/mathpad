import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Euro format adapter
 * Displays numbers with € suffix
 * Parses: 100€, 100 €, €100
 */
export class EURFormat implements FormatAdapter {
  id = "€"
  name = "Euro"
  description = "Format as Euro (€)"
  unitCategory = UNIT_CATEGORIES.CURRENCY
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "€",
    }
  }

  canParse(suffix: string): boolean {
    return suffix === "€" || suffix.toLowerCase() === "eur"
  }
}
