import Big from "big.js"
import { EvalResult, FormatOptions } from "./types"

/**
 * Format a result for display in the results gutter
 */
export function formatResult(result: EvalResult, options: FormatOptions): string {
  switch (result.type) {
    case "empty":
      return ""

    case "error":
      return `Error: ${result.message}`

    case "number":
      return formatNumber(result.value, options)

    case "percent":
      return formatPercent(result.value, options)

    default:
      return ""
  }
}

/**
 * Format a number with the given options
 */
function formatNumber(value: Big, options: FormatOptions): string {
  const num = value.toNumber()

  // Check for scientific notation threshold
  if (
    Math.abs(num) >= options.scientificNotationThreshold ||
    (Math.abs(num) > 0 && Math.abs(num) < 1 / options.scientificNotationThreshold)
  ) {
    return num.toExponential(options.decimalPlaces)
  }

  // Format with decimal places
  let formatted = value.toFixed(options.decimalPlaces)

  // Remove trailing zeros if not showing them (but keep at least one decimal if needed)
  if (!options.showTrailingZeros) {
    // Remove trailing zeros after decimal point
    formatted = formatted.replace(/(\.\d*?)0+$/, "$1")
    // Remove decimal point if no decimals remain
    formatted = formatted.replace(/\.$/, "")
  }

  // Split into integer and decimal parts
  const parts = formatted.split(".")
  let integerPart = parts[0]
  const decimalPart = parts[1]

  // Add thousands separator
  if (options.thousandsSeparator) {
    integerPart = addThousandsSeparator(integerPart, options.thousandsSeparator)
  }

  // Combine with decimal separator
  if (decimalPart) {
    return `${integerPart}${options.decimalSeparator}${decimalPart}`
  }

  return integerPart
}

/**
 * Format a percentage value
 */
function formatPercent(value: Big, options: FormatOptions): string {
  const formatted = formatNumber(value, options)
  return `${formatted}%`
}

/**
 * Add thousands separator to an integer string
 */
function addThousandsSeparator(intStr: string, separator: string): string {
  // Handle negative numbers
  const isNegative = intStr.startsWith("-")
  const digits = isNegative ? intStr.slice(1) : intStr

  // Add separator every 3 digits from the right
  const parts: string[] = []
  for (let i = digits.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3)
    parts.unshift(digits.slice(start, i))
  }

  const result = parts.join(separator)
  return isNegative ? `-${result}` : result
}

/**
 * Create default format options from preferences
 */
export function createFormatOptions(preferences: {
  decimalPlaces: number
  thousandsSeparator: "," | "." | " " | ""
  decimalSeparator: "," | "."
}): FormatOptions {
  return {
    decimalPlaces: preferences.decimalPlaces,
    thousandsSeparator: preferences.thousandsSeparator,
    decimalSeparator: preferences.decimalSeparator,
    showTrailingZeros: false,
    scientificNotationThreshold: 1e15,
  }
}
