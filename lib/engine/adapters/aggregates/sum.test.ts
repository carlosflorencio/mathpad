import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { SumAggregate } from './sum';

describe('SumAggregate', () => {
  const sum = new SumAggregate();

  it('should sum multiple values', () => {
    const values = [new Big('10'), new Big('20'), new Big('30')];
    expect(sum.execute(values).toString()).toBe('60');
  });

  it('should handle negative numbers', () => {
    const values = [new Big('10'), new Big('-5'), new Big('3')];
    expect(sum.execute(values).toString()).toBe('8');
  });

  it('should handle decimals', () => {
    const values = [new Big('1.5'), new Big('2.25'), new Big('3.75')];
    expect(sum.execute(values).toString()).toBe('7.5');
  });

  it('should validate empty array', () => {
    const error = sum.validate?.([]);
    expect(error).toBe('No numbers to sum');
  });

  it('should validate non-empty array', () => {
    const error = sum.validate?.([new Big('1')]);
    expect(error).toBeNull();
  });
});
