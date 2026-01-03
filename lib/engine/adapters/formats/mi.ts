import { FormatAdapter, FormatResult } from "./base"

/**
 * Miles format adapter
 * Displays numbers with mi suffix
 * Parses: 100mi, 100 mi, 100 mile, 100 miles
 */
export class MilesFormat implements FormatAdapter {
  id = "mi"
  name = "Miles"
  description = "Format as miles (mi)"
  preserveInline = true

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
