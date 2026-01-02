/**
 * Max aggregate function
 */

import Big from 'big.js';
import { AggregateFunctionAdapter } from '../base';

export class MaxAggregate implements AggregateFunctionAdapter {
  name = 'max';
  aliases = ['maximum'];
  description = 'Maximum of all previous numbers';
  
  validate(values: Big[]): string | null {
    if (values.length === 0) {
      return 'No numbers to max';
    }
    return null;
  }
  
  execute(values: Big[]): Big {
    return values.reduce((max, n) => (n.gt(max) ? n : max));
  }
}
