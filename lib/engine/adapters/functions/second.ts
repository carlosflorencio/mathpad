/**
 * Second extraction function
 * Extracts the second component from a date
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class SecondFunction implements FunctionAdapter {
  name = "secondOfMinute"
  aliases = ["second"]
  description = "Extract second from date (0-59)"

  execute(/* _value: Big */): Big {
    throw new Error("second() requires a date argument")
  }

  executeDate(value: Date): Big {
    return new Big(value.getUTCSeconds())
  }

  validateDate(value: Date): string | null {
    if (isNaN(value.getTime())) {
      return "Invalid date"
    }
    return null
  }
}
