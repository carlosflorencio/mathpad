/**
 * Count aggregate function
 */

import Big from "big.js"
import { AggregateFunctionAdapter } from "../base"

export class CountAggregate implements AggregateFunctionAdapter {
  name = "count"
  description = "Count how many line numbers exist"

  validate(values: Big[]): string | null {
    if (values.length === 0) {
      return "No numbers to count"
    }
    return null
  }

  execute(values: Big[]): Big {
    return new Big(values.length)
  }
}
