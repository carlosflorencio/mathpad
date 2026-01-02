import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { CeilFunction } from './ceil';

describe('CeilFunction', () => {
  const ceil = new CeilFunction();

  it('should round up to integer', () => {
    expect(ceil.execute(new Big('3.14')).toString()).toBe('4');
    expect(ceil.execute(new Big('3.9')).toString()).toBe('4');
    expect(ceil.execute(new Big('3.01')).toString()).toBe('4');
  });

  it('should handle negative numbers (towards positive infinity)', () => {
    expect(ceil.execute(new Big('-2.3')).toString()).toBe('-2');
    expect(ceil.execute(new Big('-2.9')).toString()).toBe('-2');
  });

  it('should handle integers', () => {
    expect(ceil.execute(new Big('5')).toString()).toBe('5');
    expect(ceil.execute(new Big('-10')).toString()).toBe('-10');
  });
});
