import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Kilometers per hour format adapter
 * Displays numbers with km/h suffix
 * Parses: 100km/h, 100 km/h, kmh, kph
 */
export class KilometersPerHourFormat implements FormatAdapter {
  id = "km/h"
  name = "Kilometers per hour"
  description = "Format as kilometers per hour (km/h)"
  unitCategory = UNIT_CATEGORIES.SPEED
  preserveInline = true
  toBaseUnit = 0.277778 // 1 km/h = 0.277778 m/s

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "km/h",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "km/h" || lower === "kmh" || lower === "kph" || lower === "kmph"
  }
}
