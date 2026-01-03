import Big from "big.js"
import { UnaryOperatorAdapter } from "../base"

/**
 * Increment operator adapter (++)
 * Adds 1 to the operand
 */
export class IncrementOperator implements UnaryOperatorAdapter {
  symbol = "++"

  executeNumber(value: Big): Big {
    return value.plus(1)
  }

  executePercent(value: Big): Big {
    return value.plus(1)
  }
}

/**
 * Decrement operator adapter (--)
 * Subtracts 1 from the operand
 */
export class DecrementOperator implements UnaryOperatorAdapter {
  symbol = "--"

  executeNumber(value: Big): Big {
    return value.minus(1)
  }

  executePercent(value: Big): Big {
    return value.minus(1)
  }
}
