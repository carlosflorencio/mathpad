/**
 * Floor function - rounds down to integer
 */

import Big from 'big.js';
import { FunctionAdapter } from '../base';

export class FloorFunction implements FunctionAdapter {
  name = 'floor';
  description = 'Round down to integer';
  
  execute(value: Big): Big {
    // Floor: round towards negative infinity
    return value.round(0, value.lt(0) ? Big.roundUp : Big.roundDown);
  }
}
