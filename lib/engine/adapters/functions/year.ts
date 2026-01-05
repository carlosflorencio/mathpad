/**
 * Year extraction function
 * Extracts the year component from a date
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class YearFunction implements FunctionAdapter {
  name = "year"
  description = "Extract year from date (1-9999)"

  execute(/* _value: Big */): Big {
    throw new Error("year() requires a date argument")
  }

  executeDate(value: Date): Big {
    return new Big(value.getUTCFullYear())
  }

  validateDate(value: Date): string | null {
    if (isNaN(value.getTime())) {
      return "Invalid date"
    }
    return null
  }
}
