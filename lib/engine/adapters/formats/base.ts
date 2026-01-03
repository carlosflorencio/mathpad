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
