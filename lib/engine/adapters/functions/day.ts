/**
 * Day extraction function
 * Extracts the day component from a date
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class DayFunction implements FunctionAdapter {
  name = "dayOfMonth"
  aliases = ["day"]
  description = "Extract day from date (1-31)"

  execute(/* _value: Big */): Big {
    throw new Error("day() requires a date argument")
  }

  executeDate(value: Date): Big {
    return new Big(value.getUTCDate())
  }

  validateDate(value: Date): string | null {
    if (isNaN(value.getTime())) {
      return "Invalid date"
    }
    return null
  }
}
