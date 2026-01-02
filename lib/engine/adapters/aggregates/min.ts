/**
 * Min aggregate function
 */

import Big from "big.js"
import { AggregateFunctionAdapter } from "../base"

export class MinAggregate implements AggregateFunctionAdapter {
  name = "min"
  aliases = ["minimum"]
  description = "Minimum of all previous numbers"

  validate(values: Big[]): string | null {
    if (values.length === 0) {
      return "No numbers to min"
    }
    return null
  }

  execute(values: Big[]): Big {
    return values.reduce((min, n) => (n.lt(min) ? n : min))
  }
}
