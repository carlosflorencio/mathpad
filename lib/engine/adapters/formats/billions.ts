import { FormatAdapter } from "./base"

/**
 * Billions (B) format adapter
 * Parses: 5B -> 5000000000
 * Formats: 5000000000 -> 5B
 */
export class BillionsFormat implements FormatAdapter {
  id = "B"
  name = "Billions"
  description = "Format numbers in billions (B)"

  parseMultiplier(): number {
    return 1000000000
  }

  format() {
    return {
      divisor: 1000000000,
      suffix: "B",
    }
  }

  canParse(suffix: string): boolean {
    return suffix === "B"
  }
}
