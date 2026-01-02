import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { FloorFunction } from './floor';

describe('FloorFunction', () => {
  const floor = new FloorFunction();

  it('should round down to integer', () => {
    expect(floor.execute(new Big('3.14')).toString()).toBe('3');
    expect(floor.execute(new Big('3.9')).toString()).toBe('3');
    expect(floor.execute(new Big('3.99')).toString()).toBe('3');
  });

  it('should handle negative numbers (towards negative infinity)', () => {
    expect(floor.execute(new Big('-2.3')).toString()).toBe('-3');
    expect(floor.execute(new Big('-2.1')).toString()).toBe('-3');
  });

  it('should handle integers', () => {
    expect(floor.execute(new Big('5')).toString()).toBe('5');
    expect(floor.execute(new Big('-10')).toString()).toBe('-10');
  });
});
