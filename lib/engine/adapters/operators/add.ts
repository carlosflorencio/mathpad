/**
 * Add operator (+)
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

export class AddOperator implements BinaryOperatorAdapter {
  symbol = "+"

  executeNumbers(left: Big, right: Big): Big {
    return left.plus(right)
  }

  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 + 20% = 120
    return left.times(new Big(1).plus(rightPercent.div(100)))
  }

  // Note: executePercentNumber is NOT implemented
  // Percent + Number is not a valid operation (e.g., 10% + 20 is invalid)

  executePercentPercent(left: Big, right: Big): Big {
    // 20% + 10% = 30%
    return left.plus(right)
  }

  executeDateDuration(left: Date, right: Big, rightUnit: string): Date {
    // Date + Duration = Date
    // Convert duration to milliseconds and add to date
    const durationMs = right.times(DURATION_TO_MS[rightUnit] || 1)
    const newTimestamp = left.getTime() + durationMs.toNumber()
    return new Date(newTimestamp)
  }

  executeDurationDate(left: Big, leftUnit: string, right: Date): Date {
    // Duration + Date = Date (commutative)
    return this.executeDateDuration(right, left, leftUnit)
  }

  executeDurationDuration(
    left: Big,
    leftUnit: string,
    right: Big,
    rightUnit: string
  ): { value: Big; unit: string } {
    // Duration + Duration = Duration
    // Convert both to milliseconds, add, then convert to the larger unit
    const leftMs = left.times(DURATION_TO_MS[leftUnit] || 1)
    const rightMs = right.times(DURATION_TO_MS[rightUnit] || 1)
    const totalMs = leftMs.plus(rightMs)

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
