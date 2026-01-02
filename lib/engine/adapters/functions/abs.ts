/**
 * Abs function - absolute value
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class AbsFunction implements FunctionAdapter {
  name = "abs"
  description = "Absolute value"

  execute(value: Big): Big {
    return value.abs()
  }
}
