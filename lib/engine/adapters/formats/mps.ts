import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Meters per second format adapter
 * Displays numbers with m/s suffix
 * Parses: 100m/s, 100 m/s, mps
 */
export class MetersPerSecondFormat implements FormatAdapter {
  id = "m/s"
  name = "Meters per second"
  description = "Format as meters per second (m/s)"
  unitCategory = UNIT_CATEGORIES.SPEED
  preserveInline = true
  toBaseUnit = 1 // Base unit for speed

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "m/s",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "m/s" || lower === "mps"
  }
}
