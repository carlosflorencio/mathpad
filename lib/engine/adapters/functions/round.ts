/**
 * Round function - rounds to nearest integer
 */

import Big from 'big.js';
import { FunctionAdapter } from '../base';

export class RoundFunction implements FunctionAdapter {
  name = 'round';
  description = 'Round to nearest integer';
  
  execute(value: Big): Big {
    return value.round(0, Big.roundHalfUp);
  }
}
