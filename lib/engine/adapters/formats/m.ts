import { FormatAdapter, FormatResult } from "./base"

/**
 * Meter format adapter
 * Displays numbers with m suffix
 * Parses: 100m, 100 m (lowercase only, to avoid confusion with M for millions)
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
    // Only match lowercase 'm', not uppercase 'M' (which is millions)
    return suffix === "m"
  }
}
