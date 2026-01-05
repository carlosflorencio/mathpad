/**
 * Today function
 * Returns the current date at midnight UTC
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class TodayFunction implements FunctionAdapter {
  name = "today"
  description = "Current date at midnight UTC"

  execute(/* _value: Big */): Big {
    throw new Error("today() does not take arguments")
  }

  /**
   * Special no-argument version that returns current date at midnight
   * This is called when the function is invoked without arguments
   */
  executeDate(): Date {
    const localNow = new Date()
    // Create UTC midnight for current local date
    return new Date(
      Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 0, 0, 0, 0)
    )
  }
}
