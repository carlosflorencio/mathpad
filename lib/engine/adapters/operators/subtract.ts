/**
 * Subtract operator (-)
 */

import Big from "big.js"
import { BinaryOperatorAdapter } from "../base"

// Duration unit multipliers to milliseconds
const DURATION_TO_MS: Record<string, number> = {
  ms: 1,
  sec: 1000,
  min: 60000,
  hr: 3600000,
  day: 86400000,
}

export class SubtractOperator implements BinaryOperatorAdapter {
  symbol = "-"
  aliases = ["−"]

  executeNumbers(left: Big, right: Big): Big {
    return left.minus(right)
  }

  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 - 20% = 80
    return left.times(new Big(1).minus(rightPercent.div(100)))
  }

  // Note: executePercentNumber is NOT implemented
  // Percent - Number is not a valid operation (e.g., 10% - 20 is invalid)

  executePercentPercent(left: Big, right: Big): Big {
    // 30% - 10% = 20%
    return left.minus(right)
  }

  executeDateDuration(left: Date, right: Big, rightUnit: string): Date {
    // Date - Duration = Date
    // Convert duration to milliseconds and subtract from date
    const durationMs = right.times(DURATION_TO_MS[rightUnit] || 1)
    const newTimestamp = left.getTime() - durationMs.toNumber()
    return new Date(newTimestamp)
  }

  executeDateDate(left: Date, right: Date): { value: Big; unit: string } {
    // Date - Date = Duration
    // Return difference in milliseconds, but display in appropriate unit
    const diffMs = new Big(left.getTime() - right.getTime())

    // Choose appropriate unit based on magnitude
    const absDiffMs = diffMs.abs().toNumber()
    let unit = "ms"

    if (absDiffMs >= 86400000) {
      // >= 1 day
      unit = "day"
    } else if (absDiffMs >= 3600000) {
      // >= 1 hour
      unit = "hr"
    } else if (absDiffMs >= 60000) {
      // >= 1 minute
      unit = "min"
    } else if (absDiffMs >= 1000) {
      // >= 1 second
      unit = "sec"
    }

    const value = diffMs.div(DURATION_TO_MS[unit] || 1)
    return { value, unit }
  }

  executeDurationDuration(
    left: Big,
    leftUnit: string,
    right: Big,
    rightUnit: string
  ): { value: Big; unit: string } {
    // Duration - Duration = Duration
    // Convert both to milliseconds, subtract, then convert to the larger unit
    const leftMs = left.times(DURATION_TO_MS[leftUnit] || 1)
    const rightMs = right.times(DURATION_TO_MS[rightUnit] || 1)
    const totalMs = leftMs.minus(rightMs)

    // Choose the larger unit (smaller multiplier index)
    const units = ["day", "hr", "min", "sec", "ms"]
    const leftIdx = units.indexOf(leftUnit)
    const rightIdx = units.indexOf(rightUnit)
    const resultUnit = leftIdx <= rightIdx ? leftUnit : rightUnit

    // Convert result to the chosen unit
    const resultValue = totalMs.div(DURATION_TO_MS[resultUnit] || 1)
    return { value: resultValue, unit: resultUnit }
  }
}
