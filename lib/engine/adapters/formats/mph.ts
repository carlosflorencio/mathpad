import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Miles per hour format adapter
 * Displays numbers with mph suffix
 * Parses: 100mph, 100 mph
 */
export class MilesPerHourFormat implements FormatAdapter {
  id = "mph"
  name = "Miles per hour"
  description = "Format as miles per hour (mph)"
  unitCategory = UNIT_CATEGORIES.SPEED
  preserveInline = true
  toBaseUnit = 0.44704 // 1 mph = 0.44704 m/s

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "mph",
    }
  }

  canParse(suffix: string): boolean {
    return suffix.toLowerCase() === "mph"
  }
}
