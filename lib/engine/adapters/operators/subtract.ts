/**
 * Subtract operator (-)
 */

import Big from "big.js"
import { BinaryOperatorAdapter } from "../base"

export class SubtractOperator implements BinaryOperatorAdapter {
  symbol = "-"
  aliases = ["−"]

  executeNumbers(left: Big, right: Big): Big {
    return left.minus(right)
  }

  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 - 20% = 80
    return left.times(new Big(1).minus(rightPercent.div(100)))
  }

  executePercentNumber(leftPercent: Big, right: Big): Big {
    // 20% - 100 is not a typical operation, but we'll subtract normally
    return leftPercent.minus(right)
  }

  executePercentPercent(left: Big, right: Big): Big {
    // 30% - 10% = 20%
    return left.minus(right)
  }
}
