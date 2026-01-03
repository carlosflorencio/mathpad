import { FormatAdapter, FormatResult } from "./base"

/**
 * Millions (M) format adapter
 * Parses: 5M -> 5000000
 * Formats: 5000000 -> 5M
 */
export class MillionsFormat implements FormatAdapter {
  id = "M"
  name = "Millions"
  description = "Format numbers in millions (M)"

  parseMultiplier(): number {
    return 1000000
  }

  format(): FormatResult {
    return {
      divisor: 1000000,
      suffix: "M",
    }
  }

  canParse(suffix: string): boolean {
    return suffix === "M"
  }
}
