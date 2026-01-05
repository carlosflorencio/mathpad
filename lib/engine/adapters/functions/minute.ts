/**
 * Minute extraction function
 * Extracts the minute component from a date
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class MinuteFunction implements FunctionAdapter {
  name = "minuteOfHour"
  aliases = ["minute"]
  description = "Extract minute from date (0-59)"

  execute(/* _value: Big */): Big {
    throw new Error("minute() requires a date argument")
  }

  executeDate(value: Date): Big {
    return new Big(value.getUTCMinutes())
  }

  validateDate(value: Date): string | null {
    if (isNaN(value.getTime())) {
      return "Invalid date"
    }
    return null
  }
}
