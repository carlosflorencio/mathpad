import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Miles format adapter
 * Displays numbers with mi suffix
 * Parses: mi, mile, miles (case-insensitive)
 */
export class MilesFormat implements FormatAdapter {
  id = "mi"
  name = "Miles"
  description = "Format as miles (mi)"
  unitCategory = UNIT_CATEGORIES.DISTANCE
  preserveInline = true
  toBaseUnit = 1609.34 // 1 mi = 1609.34 m

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "mi",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "mi" || lower === "mile" || lower === "miles"
  }
}
