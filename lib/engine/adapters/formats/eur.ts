import { FormatAdapter, FormatResult } from "./base"

/**
 * Euro format adapter
 * Displays numbers with € prefix
 * Parses: 100€, 100 €, €100
 */
export class EURFormat implements FormatAdapter {
  id = "€"
  name = "Euro"
  description = "Format as Euro (€)"
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      prefix: "€",
    }
  }

  canParse(suffix: string): boolean {
    return suffix === "€" || suffix.toLowerCase() === "eur"
  }
}
