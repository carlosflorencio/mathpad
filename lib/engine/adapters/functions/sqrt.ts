/**
 * Sqrt function - square root
 */

import Big from "big.js"
import { FunctionAdapter } from "../base"

export class SqrtFunction implements FunctionAdapter {
  name = "sqrt"
  description = "Square root"

  validate(value: Big): string | null {
    if (value.lt(0)) {
      return "Cannot take square root of negative number"
    }
    return null
  }

  execute(value: Big): Big {
    return value.sqrt()
  }
}
