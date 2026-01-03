import { FormatAdapter, FormatResult } from "./base"

/**
 * Pounds format adapter
 * Displays numbers with lb suffix
 * Parses: 100lb, 100 lb, 100 pound, 100 pounds, 100lbs
 */
export class PoundsFormat implements FormatAdapter {
  id = "lb"
  name = "Pounds"
  description = "Format as pounds (lb)"
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "lb",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "lb" || lower === "lbs" || lower === "pound" || lower === "pounds"
  }
}
