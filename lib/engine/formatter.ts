import Big from "big.js"
import { EvalResult, FormatOptions, FormatSuffix } from "./types"
import { formatRegistry } from "./adapters/formats/registry"

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
      return formatNumber(result.value, options, result.format)

    case "percent":
      return formatPercent(result.value, options, result.format)

    case "date":
      return formatDate(result.value)

    case "duration":
      return formatDuration(result.value, result.unit, options)

    default:
      return ""
  }
}

/**
 * Format a number with the given options
 */
function formatNumber(value: Big, options: FormatOptions, format?: FormatSuffix): string {
  // Apply format suffix if specified (e.g., K, M, B)
  if (format) {
    return formatWithSuffix(value, format, options)
  }

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
 * Format a number with a format suffix using the format registry
 */
function formatWithSuffix(value: Big, suffix: FormatSuffix, options: FormatOptions): string {
  // Use findParser to handle case-insensitive lookups (e.g., "k" -> "K")
  const parser = formatRegistry.findParser(suffix)
  if (!parser) {
    // Fallback if adapter not found
    return formatNumber(value, options)
  }
  const adapter = parser.adapter

  const { divisor, suffix: adapterSuffix, prefix } = adapter.format()
  const divided = value.div(divisor)

  // Format the divided value
  let formatted = divided.toFixed(options.decimalPlaces)

  // Remove trailing zeros
  formatted = formatted.replace(/(\.\d*?)0+$/, "$1")
  formatted = formatted.replace(/\.$/, "")

  // Split into parts
  const parts = formatted.split(".")
  let integerPart = parts[0]
  const decimalPart = parts[1]

  // Add thousands separator
  if (options.thousandsSeparator) {
    integerPart = addThousandsSeparator(integerPart, options.thousandsSeparator)
  }

  // Combine
  const number = decimalPart
    ? `${integerPart}${options.decimalSeparator}${decimalPart}`
    : integerPart

  // Apply prefix/suffix - use original user input (suffix param) if available,
  // otherwise fall back to adapter's suffix (for backwards compatibility)
  if (prefix) {
    return `${prefix}${number}`
  }
  // Use the original suffix the user typed (e.g., "k") instead of the canonical ID (e.g., "K")
  return `${number}${suffix ?? adapterSuffix ?? ""}`
}

/**
 * Format a percentage value
 */
function formatPercent(value: Big, options: FormatOptions, format?: FormatSuffix): string {
  const formatted = formatNumber(value, options, format)
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
 * Format a date value
 */
function formatDate(value: Date): string {
  // Check if the date has a time component (not midnight UTC)
  const hasTime =
    value.getUTCHours() !== 0 || value.getUTCMinutes() !== 0 || value.getUTCSeconds() !== 0

  if (hasTime) {
    // Format as YYYY-MM-DDTHH:mm:ss
    return value.toISOString().slice(0, 19)
  } else {
    // Format as YYYY-MM-DD
    return value.toISOString().slice(0, 10)
  }
}

/**
 * Format a duration value
 */
function formatDuration(value: Big, unit: string, options: FormatOptions): string {
  const formatted = formatNumber(value, options)
  return `${formatted}${unit}`
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
