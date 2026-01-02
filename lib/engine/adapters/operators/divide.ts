/**
 * Divide operator (/)
 */

import Big from 'big.js';
import { BinaryOperatorAdapter } from '../base';

export class DivideOperator implements BinaryOperatorAdapter {
  symbol = '/';
  
  validate(left: Big, right: Big): string | null {
    if (right.eq(0)) {
      return 'Division by zero';
    }
    return null;
  }
  
  executeNumbers(left: Big, right: Big): Big {
    return left.div(right);
  }
  
  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 / 20% = 500 (100 / 0.2)
    return left.div(rightPercent.div(100));
  }
  
  executePercentPercent(left: Big, right: Big): Big {
    // 50% / 25% = 2 (0.5 / 0.25)
    return left.div(right);
  }
}
