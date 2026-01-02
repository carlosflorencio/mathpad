/**
 * Unary operators (+ and -)
 */

import Big from "big.js"
import { UnaryOperatorAdapter } from "../base"

export class UnaryPlusOperator implements UnaryOperatorAdapter {
  symbol = "+"

  executeNumber(value: Big): Big {
    return value
  }

  executePercent(value: Big): Big {
    return value
  }
}

export class UnaryMinusOperator implements UnaryOperatorAdapter {
  symbol = "-"

  executeNumber(value: Big): Big {
    return value.times(-1)
  }

  executePercent(value: Big): Big {
    return value.times(-1)
  }
}
