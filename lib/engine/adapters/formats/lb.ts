import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Pounds format adapter
 * Displays numbers with lb suffix
 * Parses: lb, lbs, pound, pounds (case-insensitive)
 */
export class PoundsFormat implements FormatAdapter {
  id = "lb"
  name = "Pounds"
  description = "Format as pounds (lb)"
  unitCategory = UNIT_CATEGORIES.WEIGHT
  preserveInline = true
  toBaseUnit = 0.453592 // 1 lb = 0.453592 kg

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
