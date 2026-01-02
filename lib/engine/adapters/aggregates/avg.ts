/**
 * Average aggregate function
 */

import Big from "big.js"
import { AggregateFunctionAdapter } from "../base"

export class AvgAggregate implements AggregateFunctionAdapter {
  name = "avg"
  aliases = ["average", "mean"]
  description = "Average of all previous numbers"

  validate(values: Big[]): string | null {
    if (values.length === 0) {
      return "No numbers to avg"
    }
    return null
  }

  execute(values: Big[]): Big {
    const sum = values.reduce((acc, n) => acc.plus(n), new Big(0))
    return sum.div(values.length)
  }
}
