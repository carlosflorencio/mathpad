/**
 * Modulo operator (%)
 */

import Big from 'big.js';
import { BinaryOperatorAdapter } from '../base';

export class ModuloOperator implements BinaryOperatorAdapter {
  symbol = '%';
  
  validate(left: Big, right: Big): string | null {
    if (right.eq(0)) {
      return 'Modulo by zero';
    }
    return null;
  }
  
  executeNumbers(left: Big, right: Big): Big {
    return left.mod(right);
  }
}
