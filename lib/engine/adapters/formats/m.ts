import { FormatAdapter, FormatResult } from "./base"

/**
 * Meter format adapter
 * Displays numbers with m suffix
 * Parses: m (lowercase only), meter, meters, metre, metres
 * Note: Uppercase M is reserved for millions
 */
export class MeterFormat implements FormatAdapter {
  id = "m"
  name = "Meter"
  description = "Format as meters (m)"
  preserveInline = true

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
