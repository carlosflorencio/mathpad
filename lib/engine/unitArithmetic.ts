/**
 * Unit arithmetic - handles dimensional analysis for unit operations
 * Enables calculations like: 100 km / 100 km/h = 1 hr
 */

import { formatRegistry } from "./adapters/formats/registry"
import { FormatAdapter, UnitCategory } from "./adapters/formats/base"

/**
 * Result of unit arithmetic calculation
 */
export interface UnitArithmeticResult {
  /** The resulting format ID (e.g., "hr", "km", "km/h") or undefined if no special format */
  format?: string
  /** Factor to multiply the numeric result by (for unit conversions) */
  conversionFactor: number
}

/**
 * Perform unit arithmetic for multiplication or division operations
 * Returns the resulting unit and any conversion factor needed
 *
 * Examples:
 * - km / (km/h) → h (distance / speed = time)
 * - km / h → km/h (distance / time = speed)
 * - km/h * h → km (speed * time = distance)
 */
export function performUnitArithmetic(
  op: "*" | "/",
  leftFormat: string | undefined,
  rightFormat: string | undefined
): UnitArithmeticResult {
  // If either operand has no format, no unit arithmetic
  if (!leftFormat || !rightFormat) {
    return { conversionFactor: 1 }
  }

  const leftAdapter = formatRegistry.get(leftFormat)
  const rightAdapter = formatRegistry.get(rightFormat)

  if (!leftAdapter || !rightAdapter) {
    return { conversionFactor: 1 }
  }

  const leftCategory = leftAdapter.unitCategory || "number"
  const rightCategory = rightAdapter.unitCategory || "number"

  // Multiplication
  if (op === "*") {
    return handleMultiplication(leftCategory, rightCategory, leftAdapter, rightAdapter)
  }

  // Division
  if (op === "/") {
    return handleDivision(leftCategory, rightCategory, leftAdapter, rightAdapter)
  }

  return { conversionFactor: 1 }
}

/**
 * Handle multiplication unit arithmetic
 * Examples:
 * - speed * time → distance (km/h * hr → km)
 * - time * speed → distance (hr * km/h → km)
 */
function handleMultiplication(
  leftCategory: UnitCategory,
  rightCategory: UnitCategory,
  leftAdapter: FormatAdapter,
  rightAdapter: FormatAdapter
): UnitArithmeticResult {
  // speed * time = distance
  if (leftCategory === "speed" && rightCategory === "time") {
    return speedTimeToDistance(leftAdapter, rightAdapter)
  }

  // time * speed = distance
  if (leftCategory === "time" && rightCategory === "speed") {
    return speedTimeToDistance(rightAdapter, leftAdapter)
  }

  // No unit arithmetic for other cases
  return { conversionFactor: 1 }
}

/**
 * Handle division unit arithmetic
 * Examples:
 * - distance / speed → time (km / km/h → hr)
 * - distance / time → speed (km / hr → km/h)
 * - speed / speed → number (km/h / km/h → 1)
 */
function handleDivision(
  leftCategory: UnitCategory,
  rightCategory: UnitCategory,
  leftAdapter: FormatAdapter,
  rightAdapter: FormatAdapter
): UnitArithmeticResult {
  // distance / speed = time
  if (leftCategory === "distance" && rightCategory === "speed") {
    return distanceSpeedToTime(leftAdapter, rightAdapter)
  }

  // distance / time = speed
  if (leftCategory === "distance" && rightCategory === "time") {
    return distanceTimeToSpeed(leftAdapter, rightAdapter)
  }

  // speed / speed = number (dimensionless)
  if (leftCategory === "speed" && rightCategory === "speed") {
    return { conversionFactor: 1 } // Cancel out, no format
  }

  // distance / distance = number (dimensionless)
  if (leftCategory === "distance" && rightCategory === "distance") {
    return { conversionFactor: 1 } // Cancel out, no format
  }

  // time / time = number (dimensionless)
  if (leftCategory === "time" && rightCategory === "time") {
    return { conversionFactor: 1 } // Cancel out, no format
  }

  // No unit arithmetic for other cases
  return { conversionFactor: 1 }
}

/**
 * Calculate: speed * time = distance
 * Example: 100 km/h * 2 hr = 200 km
 */
function speedTimeToDistance(
  speedAdapter: FormatAdapter,
  timeAdapter: FormatAdapter
): UnitArithmeticResult {
  // Speed is already distance/time, so multiplying by time gives distance
  // We need to figure out what distance unit the speed uses

  // For km/h: return km
  // For mph: return mi
  // For m/s: return m

  const speedId = speedAdapter.id

  // Map speed units to their distance components
  const speedToDistance: Record<string, string> = {
    "km/h": "km",
    "m/s": "m",
    mph: "mi",
  }

  const distanceUnit = speedToDistance[speedId]
  if (!distanceUnit) {
    return { conversionFactor: 1 }
  }

  // Convert time to the time unit used by the speed
  // km/h uses hours, m/s uses seconds, mph uses hours
  const speedTimeUnit = speedId === "m/s" ? "sec" : "hr"
  const timeBaseAdapter = formatRegistry.get(speedTimeUnit)

  if (!timeAdapter.toBaseUnit || !timeBaseAdapter?.toBaseUnit) {
    return { format: distanceUnit, conversionFactor: 1 }
  }

  // Convert time to the speed's time unit
  // E.g., if speed is km/h and time is in minutes, convert minutes to hours
  const timeFactor = timeAdapter.toBaseUnit / timeBaseAdapter.toBaseUnit

  return { format: distanceUnit, conversionFactor: timeFactor }
}

/**
 * Calculate: distance / speed = time
 * Example: 100 km / 100 km/h = 1 hr
 */
function distanceSpeedToTime(
  distanceAdapter: FormatAdapter,
  speedAdapter: FormatAdapter
): UnitArithmeticResult {
  // Extract the time unit from the speed unit
  // km/h → hr, m/s → sec, mph → hr

  const speedId = speedAdapter.id

  // Map speed units to their time components
  const speedToTime: Record<string, string> = {
    "km/h": "hr",
    "m/s": "sec",
    mph: "hr",
  }

  const timeUnit = speedToTime[speedId]
  if (!timeUnit) {
    return { conversionFactor: 1 }
  }

  // Convert distance to the distance unit used by the speed
  // E.g., if distance is meters but speed is km/h, convert to km
  const speedToDistance: Record<string, string> = {
    "km/h": "km",
    "m/s": "m",
    mph: "mi",
  }

  const speedDistanceUnit = speedToDistance[speedId]
  const speedDistanceAdapter = formatRegistry.get(speedDistanceUnit)

  if (!distanceAdapter.toBaseUnit || !speedDistanceAdapter?.toBaseUnit) {
    return { format: timeUnit, conversionFactor: 1 }
  }

  // Convert distance to speed's distance unit
  const distanceFactor = distanceAdapter.toBaseUnit / speedDistanceAdapter.toBaseUnit

  return { format: timeUnit, conversionFactor: distanceFactor }
}

/**
 * Calculate: distance / time = speed
 * Example: 100 km / 1 hr = 100 km/h
 */
function distanceTimeToSpeed(
  distanceAdapter: FormatAdapter,
  timeAdapter: FormatAdapter
): UnitArithmeticResult {
  // Determine the appropriate speed unit based on distance and time
  // km + hr → km/h
  // m + sec → m/s
  // mi + hr → mph

  const distanceId = distanceAdapter.id
  const timeId = timeAdapter.id

  // Map distance+time combinations to speed units
  const distanceTimeToSpeed: Record<string, Record<string, string>> = {
    km: { hr: "km/h", sec: "m/s", min: "km/h" },
    m: { sec: "m/s", min: "m/s", hr: "km/h" },
    mi: { hr: "mph", min: "mph", sec: "mph" },
    ft: { sec: "m/s", min: "m/s", hr: "mph" }, // Convert ft to m or mi
  }

  const speedUnit = distanceTimeToSpeed[distanceId]?.[timeId]
  if (!speedUnit) {
    // Default fallback based on distance unit
    if (distanceId === "km" || distanceId === "m") {
      return { format: "km/h", conversionFactor: 1 }
    } else {
      return { format: "mph", conversionFactor: 1 }
    }
  }

  // Convert to base units for the target speed
  const speedAdapter = formatRegistry.get(speedUnit)
  const speedToDistance: Record<string, string> = {
    "km/h": "km",
    "m/s": "m",
    mph: "mi",
  }
  const speedToTime: Record<string, string> = {
    "km/h": "hr",
    "m/s": "sec",
    mph: "hr",
  }

  const speedDistanceUnit = speedToDistance[speedUnit]
  const speedTimeUnit = speedToTime[speedUnit]

  const speedDistanceAdapter = formatRegistry.get(speedDistanceUnit)
  const speedTimeAdapter = formatRegistry.get(speedTimeUnit)

  if (
    !distanceAdapter.toBaseUnit ||
    !speedDistanceAdapter?.toBaseUnit ||
    !timeAdapter.toBaseUnit ||
    !speedTimeAdapter?.toBaseUnit
  ) {
    return { format: speedUnit, conversionFactor: 1 }
  }

  // Convert both distance and time to the speed unit's components
  const distanceFactor = distanceAdapter.toBaseUnit / speedDistanceAdapter.toBaseUnit
  const timeFactor = speedTimeAdapter.toBaseUnit / timeAdapter.toBaseUnit

  // Result = (distance converted) / (time converted)
  const conversionFactor = distanceFactor * timeFactor

  return { format: speedUnit, conversionFactor }
}
