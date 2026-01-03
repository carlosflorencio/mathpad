import { FormatAdapter, FormatResult } from "./base"

/**
 * Seconds format adapter
 * Displays numbers with sec suffix
 * Parses: 100sec, 100 sec, 100 second, 100 seconds
 */
export class SecondsFormat implements FormatAdapter {
  id = "sec"
  name = "Seconds"
  description = "Format as seconds (sec)"
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "sec",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "sec" || lower === "second" || lower === "seconds"
  }
}
