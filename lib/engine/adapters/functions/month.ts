/**
 * Month extraction function
 * Extracts the month component from a date
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class MonthFunction implements FunctionAdapter {
  name = "month"
  description = "Extract month from date (1-12)"

  execute(/* _value: Big */): Big {
    throw new Error("month() requires a date argument")
  }

  executeDate(value: Date): Big {
    // getUTCMonth() returns 0-11, so add 1 to get 1-12
    return new Big(value.getUTCMonth() + 1)
  }

  validateDate(value: Date): string | null {
    if (isNaN(value.getTime())) {
      return "Invalid date"
    }
    return null
  }
}
