/**
 * Multiply operator (*)
 */

import Big from 'big.js';
import { BinaryOperatorAdapter } from '../base';

export class MultiplyOperator implements BinaryOperatorAdapter {
  symbol = '*';
  aliases = ['×'];
  
  executeNumbers(left: Big, right: Big): Big {
    return left.times(right);
  }
  
  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 * 20% = 20
    return left.times(rightPercent).div(100);
  }
  
  executePercentNumber(leftPercent: Big, right: Big): Big {
    // 20% * 100 = 20
    return right.times(leftPercent).div(100);
  }
  
  executePercentPercent(left: Big, right: Big): Big {
    // 20% * 50% = 10% (0.2 * 0.5 = 0.1)
    return left.times(right).div(100);
  }
}
