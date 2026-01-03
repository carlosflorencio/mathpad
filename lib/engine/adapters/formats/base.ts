import Big from "big.js"

/**
 * Result type for format() method
 */
export type FormatResult = {
  divisor: number
  suffix?: string
  prefix?: string
}

/**
 * Unit type categories for validation
 * Prevents operations between incompatible units (e.g., 100$ + 10km)
 */
export type UnitCategory =
  | "number" // Plain number formats (K, M, B) - compatible with everything
  | "currency" // Money units ($, €)
  | "distance" // Length units (km, m, mi, ft)
  | "time" // Time units (min, sec, hr)
  | "weight" // Mass units (kg, lb, g)
  | "volume" // Volume units (L, ml, gal)
  | "speed" // Speed units (km/h, m/s, mph)
  | "compound" // Other compound units (kg/m³, km/L, etc)

/**
 * Unit category constants - use these instead of string literals
 * Provides type safety without needing "as const" everywhere
 */
export const UNIT_CATEGORIES = {
  NUMBER: "number",
  CURRENCY: "currency",
  DISTANCE: "distance",
  TIME: "time",
  WEIGHT: "weight",
  VOLUME: "volume",
  SPEED: "speed",
  COMPOUND: "compound",
} as const

/**
 * Base interface for format adapters
 * Handles both parsing (input) and formatting (output)
 */
export interface FormatAdapter {
  /** Unique identifier for this format (e.g., "K", "M", "B", "$", "€") */
  id: string

  /** Human-readable name */
  name: string

  /** Description of what this format does */
  description: string

  /**
   * Unit category for type checking
   * Used to prevent invalid operations between incompatible units
   * Default: "number" (compatible with all units)
   */
  unitCategory?: UnitCategory

  /**
   * Conversion factor to base unit (for unit conversions)
   * Example: km has toBaseUnit: 1000 (1 km = 1000 m, where m is the base)
   * If undefined, this unit cannot be converted
   */
  toBaseUnit?: number

  /**
   * Whether this format should be preserved when used inline
   * - true: Format is preserved (e.g., 100$ * 2 = 200$)
   * - false: Format is only a multiplier (e.g., 10k + 5k = 15000, not 15K)
   * Default: false
   */
  preserveInline?: boolean

  /**
   * Parse a number with this suffix/prefix
   * Returns the multiplier to apply to the base number
   * Example: "5k" -> returns 1000, so 5 * 1000 = 5000
   */
  parseMultiplier?(): number

  /**
   * Format a number for display
   * Returns the divisor to apply and the suffix/prefix to add
   * Example: 5000 with K format -> { divisor: 1000, suffix: "K" }
   */
  format(): FormatResult

  /**
   * Check if this adapter can parse a given string suffix/prefix
   * Example: "k" or "K" for thousands adapter
   */
  canParse(suffix: string): boolean
}
