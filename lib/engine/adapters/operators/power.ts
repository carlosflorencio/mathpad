/**
 * Power operator (^)
 */

import Big from 'big.js';
import { BinaryOperatorAdapter } from '../base';

export class PowerOperator implements BinaryOperatorAdapter {
  symbol = '^';
  
  executeNumbers(left: Big, right: Big): Big {
    return left.pow(right.toNumber());
  }
}
