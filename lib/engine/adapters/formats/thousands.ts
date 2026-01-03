import { FormatAdapter, FormatResult } from "./base"

/**
 * Thousands (K) format adapter
 * Parses: 5k -> 5000
 * Formats: 5000 -> 5K
 */
export class ThousandsFormat implements FormatAdapter {
  id = "K"
  name = "Thousands"
  description = "Format numbers in thousands (K)"

  parseMultiplier(): number {
    return 1000
  }

  format(): FormatResult {
    return {
      divisor: 1000,
      suffix: "K",
    }
  }

  canParse(suffix: string): boolean {
    return suffix === "k" || suffix === "K"
  }
}
