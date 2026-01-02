/**
 * Add operator (+)
 */

import Big from "big.js"
import { BinaryOperatorAdapter } from "../base"

export class AddOperator implements BinaryOperatorAdapter {
  symbol = "+"

  executeNumbers(left: Big, right: Big): Big {
    return left.plus(right)
  }

  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 + 20% = 120
    return left.times(new Big(1).plus(rightPercent.div(100)))
  }

  // Note: executePercentNumber is NOT implemented
  // Percent + Number is not a valid operation (e.g., 10% + 20 is invalid)

  executePercentPercent(left: Big, right: Big): Big {
    // 20% + 10% = 30%
    return left.plus(right)
  }
}
