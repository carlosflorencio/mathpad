import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { SubtractOperator } from './subtract';

describe('SubtractOperator', () => {
  const subtract = new SubtractOperator();

  describe('executeNumbers', () => {
    it('should subtract two numbers', () => {
      expect(subtract.executeNumbers?.(new Big('10'), new Big('3')).toString()).toBe('7');
      expect(subtract.executeNumbers?.(new Big('5.5'), new Big('2.25')).toString()).toBe('3.25');
    });

    it('should handle negative results', () => {
      expect(subtract.executeNumbers?.(new Big('3'), new Big('5')).toString()).toBe('-2');
    });
  });

  describe('executeNumberPercent', () => {
    it('should subtract percentage from number (100 - 20% = 80)', () => {
      expect(subtract.executeNumberPercent?.(new Big('100'), new Big('20')).toString()).toBe('80');
    });

    it('should handle negative percentages', () => {
      expect(subtract.executeNumberPercent?.(new Big('100'), new Big('-10')).toString()).toBe('110');
    });
  });

  describe('executePercentPercent', () => {
    it('should subtract two percentages', () => {
      expect(subtract.executePercentPercent?.(new Big('30'), new Big('10')).toString()).toBe('20');
    });
  });
});
