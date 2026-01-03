import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Billions (B) format adapter
 * Parses: 5B -> 5000000000
 * Formats: 5000000000 -> 5B
 */
export class BillionsFormat implements FormatAdapter {
  id = "B"
  name = "Billions"
  description = "Format numbers in billions (B)"
  unitCategory = UNIT_CATEGORIES.NUMBER

  parseMultiplier(): number {
    return 1000000000
  }

  format(): FormatResult {
    return {
      divisor: 1000000000,
      suffix: "B",
    }
  }

  canParse(suffix: string): boolean {
    return suffix === "B"
  }
}
