import { FormatAdapter, FormatResult } from "./base"

/**
 * Gallons format adapter
 * Displays numbers with gal suffix
 * Parses: 100gal, 100 gal, 100 gallon, 100 gallons
 */
export class GallonsFormat implements FormatAdapter {
  id = "gal"
  name = "Gallons"
  description = "Format as gallons (gal)"
  preserveInline = true

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: "gal",
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    return lower === "gal" || lower === "gallon" || lower === "gallons"
  }
}
