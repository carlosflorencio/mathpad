/**
 * Hour extraction function
 * Extracts the hour component from a date
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class HourFunction implements FunctionAdapter {
  name = "hourOfDay"
  aliases = ["hour"]
  description = "Extract hour from date (0-23)"

  execute(/* _value: Big */): Big {
    throw new Error("hour() requires a date argument")
  }

  executeDate(value: Date): Big {
    return new Big(value.getUTCHours())
  }

  validateDate(value: Date): string | null {
    if (isNaN(value.getTime())) {
      return "Invalid date"
    }
    return null
  }
}
