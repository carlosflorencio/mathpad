import { FormatAdapter, FormatResult } from "./base"

/**
 * USD Dollar format adapter
 * Displays numbers with $ prefix
 * Parses: 100$, 100 $, $100
 */
export class USDFormat implements FormatAdapter {
  id = "$"
  name = "US Dollar"
  description = "Format as US Dollar ($)"
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      prefix: "$",
    }
  }

  canParse(suffix: string): boolean {
    return suffix === "$" || suffix.toLowerCase() === "usd"
  }
}
