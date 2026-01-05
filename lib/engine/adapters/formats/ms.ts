import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"

/**
 * Milliseconds format adapter
 * Displays numbers with ms suffix
 * Parses: ms, millisecond, milliseconds (case-insensitive)
 */
export class MillisecondsFormat implements FormatAdapter {
  id = "ms"
  name = "Milliseconds"
  description = "Format as milliseconds (ms)"
  unitCategory = UNIT_CATEGORIES.TIME
  preserveInline = true
  toBaseUnit = 0.001 // 1 ms = 0.001 sec

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "ms",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "ms" || lower === "millisecond" || lower === "milliseconds"
  }
}
