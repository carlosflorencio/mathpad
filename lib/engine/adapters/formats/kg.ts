import { FormatAdapter, FormatResult } from "./base"

/**
 * Kilograms format adapter
 * Displays numbers with kg suffix
 * Parses: 100kg, 100 kg, 100 kilogram, 100 kilograms
 */
export class KilogramsFormat implements FormatAdapter {
  id = "kg"
  name = "Kilograms"
  description = "Format as kilograms (kg)"
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "kg",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "kg" || lower === "kilogram" || lower === "kilograms"
  }
}
