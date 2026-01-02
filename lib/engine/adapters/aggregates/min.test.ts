import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { MinAggregate } from './min';

describe('MinAggregate', () => {
  const min = new MinAggregate();

  it('should find minimum value', () => {
    const values = [new Big('30'), new Big('10'), new Big('20')];
    expect(min.execute(values).toString()).toBe('10');
  });

  it('should handle negative numbers', () => {
    const values = [new Big('5'), new Big('-10'), new Big('0')];
    expect(min.execute(values).toString()).toBe('-10');
  });

  it('should handle decimals', () => {
    const values = [new Big('1.5'), new Big('1.2'), new Big('1.8')];
    expect(min.execute(values).toString()).toBe('1.2');
  });

  it('should handle single value', () => {
    const values = [new Big('42')];
    expect(min.execute(values).toString()).toBe('42');
  });

  it('should validate empty array', () => {
    const error = min.validate?.([]);
    expect(error).toBe('No numbers to min');
  });

  it('should validate non-empty array', () => {
    const error = min.validate?.([new Big('1')]);
    expect(error).toBeNull();
  });
});
