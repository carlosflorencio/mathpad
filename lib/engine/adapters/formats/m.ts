import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Meters format adapter
 * Displays numbers with m suffix
 * Parses: m, meter, meters, metre, metres (case-insensitive)
 */
export class MeterFormat implements FormatAdapter {
  id = "m"
  name = "Meters"
  description = "Format as meters (m)"
  unitCategory = UNIT_CATEGORIES.DISTANCE
  preserveInline = true
  toBaseUnit = 1 // Base unit for distance

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "m",
    }
  }

  canParse(suffix: string): boolean {
    // Only match lowercase 'm' for abbreviation (uppercase 'M' is millions)
    // But allow full words case-insensitively
    if (suffix === "m") return true

    const lower = suffix.toLowerCase()
    return lower === "meter" || lower === "meters" || lower === "metre" || lower === "metres"
  }
}
