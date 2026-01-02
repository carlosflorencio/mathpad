import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { PowerOperator } from './power';

describe('PowerOperator', () => {
  const power = new PowerOperator();

  describe('executeNumbers', () => {
    it('should calculate power', () => {
      expect(power.executeNumbers?.(new Big('2'), new Big('3')).toString()).toBe('8');
      expect(power.executeNumbers?.(new Big('5'), new Big('2')).toString()).toBe('25');
      expect(power.executeNumbers?.(new Big('10'), new Big('0')).toString()).toBe('1');
    });

    it('should handle negative exponents', () => {
      expect(power.executeNumbers?.(new Big('2'), new Big('-1')).toString()).toBe('0.5');
    });

    it('should handle large exponents', () => {
      const result = power.executeNumbers?.(new Big('2'), new Big('10'));
      expect(result?.toString()).toBe('1024');
    });
  });
});
