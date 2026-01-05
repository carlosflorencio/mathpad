/**
 * Divide operator (/)
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

export class DivideOperator implements BinaryOperatorAdapter {
  symbol = "/"

  validate(left: Big, right: Big): string | null {
    if (right.eq(0)) {
      return "Division by zero"
    }
    return null
  }

  executeNumbers(left: Big, right: Big): Big {
    return left.div(right)
  }

  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 / 20% = 500 (100 / 0.2)
    return left.div(rightPercent.div(100))
  }

  executePercentPercent(left: Big, right: Big): Big {
    // 50% / 25% = 2 (0.5 / 0.25)
    return left.div(right)
  }

  executeDurationNumber(left: Big, leftUnit: string, right: Big): { value: Big; unit: string } {
    // Duration / Number = Duration
    // e.g., 10day / 2 = 5day
    const value = left.div(right)
    return { value, unit: leftUnit }
  }

  executeDurationDuration(
    left: Big,
    leftUnit: string,
    right: Big,
    rightUnit: string
  ): { value: Big; unit: string } {
    // Duration / Duration = Number (dimensionless)
    // e.g., 10day / 5day = 2
    // Convert both to milliseconds then divide
    const leftMs = left.times(DURATION_TO_MS[leftUnit] || 1)
    const rightMs = right.times(DURATION_TO_MS[rightUnit] || 1)
    const value = leftMs.div(rightMs)
    // Return as dimensionless number (no unit)
    // The evaluator will convert this to a NumberResult
    return { value, unit: "" }
  }
}
