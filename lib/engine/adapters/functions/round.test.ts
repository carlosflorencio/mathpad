import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { RoundFunction } from './round';

describe('RoundFunction', () => {
  const round = new RoundFunction();

  it('should round to nearest integer', () => {
    expect(round.execute(new Big('3.14')).toString()).toBe('3');
    expect(round.execute(new Big('3.5')).toString()).toBe('4');
    expect(round.execute(new Big('3.9')).toString()).toBe('4');
  });

  it('should handle negative numbers', () => {
    expect(round.execute(new Big('-3.14')).toString()).toBe('-3');
    expect(round.execute(new Big('-3.5')).toString()).toBe('-4');
    expect(round.execute(new Big('-3.9')).toString()).toBe('-4');
  });

  it('should handle integers', () => {
    expect(round.execute(new Big('5')).toString()).toBe('5');
    expect(round.execute(new Big('-10')).toString()).toBe('-10');
  });
});
