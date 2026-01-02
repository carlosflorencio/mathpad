/**
 * Ceil function - rounds up to integer
 */

import Big from 'big.js';
import { FunctionAdapter } from '../base';

export class CeilFunction implements FunctionAdapter {
  name = 'ceil';
  description = 'Round up to integer';
  
  execute(value: Big): Big {
    // Ceiling: round towards positive infinity
    return value.round(0, value.lt(0) ? Big.roundDown : Big.roundUp);
  }
}
