/**
 * Now function
 * Returns the current date and time
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class NowFunction implements FunctionAdapter {
  name = "now"
  description = "Current date and time"

  execute(/* _value: Big */): Big {
    throw new Error("now() does not take arguments")
  }

  /**
   * Special no-argument version that returns current date and time
   * This is called when the function is invoked without arguments
   */
  executeDate(): Date {
    return new Date()
  }
}
