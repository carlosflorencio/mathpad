import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { evaluateDocument, computeResults } from '../index';
import { defaultPreferences } from '@/lib/types';

describe('Integration Tests', () => {
  const prefs = { ...defaultPreferences, decimalPlaces: 2 };

  describe('Basic Arithmetic', () => {
    it('should evaluate simple addition', () => {
      const results = computeResults('1 + 2', prefs);
      expect(results[0]).toBe('3');
    });

    it('should evaluate subtraction', () => {
      const results = computeResults('10 - 3', prefs);
      expect(results[0]).toBe('7');
    });

    it('should evaluate multiplication', () => {
      const results = computeResults('5 * 6', prefs);
      expect(results[0]).toBe('30');
    });

    it('should evaluate division', () => {
      const results = computeResults('20 / 4', prefs);
      expect(results[0]).toBe('5');
    });

    it('should evaluate exponentiation', () => {
      const results = computeResults('2 ^ 3', prefs);
      expect(results[0]).toBe('8');
    });

    it('should handle order of operations', () => {
      const results = computeResults('1 + 2 * 3', prefs);
      expect(results[0]).toBe('7');
    });

    it('should handle parentheses', () => {
      const results = computeResults('(1 + 2) * 3', prefs);
      expect(results[0]).toBe('9');
    });
  });

  describe('Number Formats', () => {
    it('should handle decimals', () => {
      const results = computeResults('3.14 + 2.86', prefs);
      expect(results[0]).toBe('6');
    });

    it('should handle k suffix', () => {
      const results = computeResults('10k + 5k', prefs);
      expect(results[0]).toBe('15,000');
    });

    it('should handle M suffix', () => {
      const results = computeResults('1M + 500k', prefs);
      expect(results[0]).toBe('1,500,000');
    });

    it('should handle numbers with separators', () => {
      const results = computeResults('1,000 + 2,000', prefs);
      expect(results[0]).toBe('3,000');
    });
  });

  describe('Percentages', () => {
    it('should evaluate percentage literals', () => {
      const results = computeResults('50%', prefs);
      expect(results[0]).toBe('50%');
    });

    it('should add percentage to number', () => {
      const results = computeResults('100 + 20%', prefs);
      expect(results[0]).toBe('120');
    });

    it('should subtract percentage from number', () => {
      const results = computeResults('100 - 20%', prefs);
      expect(results[0]).toBe('80');
    });

    it('should multiply number by percentage', () => {
      const results = computeResults('100 * 20%', prefs);
      expect(results[0]).toBe('20');
    });

    it('should handle "of" operator', () => {
      const results = computeResults('20% of 100', prefs);
      expect(results[0]).toBe('20');
    });

    it('should add percentages', () => {
      const results = computeResults('10% + 5%', prefs);
      expect(results[0]).toBe('15%');
    });
  });

  describe('Variables', () => {
    it('should assign and use variables', () => {
      const results = computeResults('x = 10\nx + 5', prefs);
      expect(results[0]).toBe('10');
      expect(results[1]).toBe('15');
    });

    it('should handle multi-word variable names', () => {
      const results = computeResults('total price = 100\ntotal price * 2', prefs);
      expect(results[0]).toBe('100');
      expect(results[1]).toBe('200');
    });

    it('should use variables across multiple lines', () => {
      const results = computeResults('a = 10\nb = 20\na + b', prefs);
      expect(results[0]).toBe('10');
      expect(results[1]).toBe('20');
      expect(results[2]).toBe('30');
    });

    it('should handle variable reassignment', () => {
      const results = computeResults('x = 10\nx = 20\nx', prefs);
      expect(results[0]).toBe('10');
      expect(results[1]).toBe('20');
      expect(results[2]).toBe('20');
    });
  });

  describe('Aggregate Functions', () => {
    it('should sum previous lines', () => {
      const results = computeResults('10\n20\n30\nsum', prefs);
      expect(results[0]).toBe('10');
      expect(results[1]).toBe('20');
      expect(results[2]).toBe('30');
      expect(results[3]).toBe('60');
    });

    it('should calculate average', () => {
      const results = computeResults('10\n20\n30\navg', prefs);
      expect(results[3]).toBe('20');
    });

    it('should find minimum', () => {
      const results = computeResults('30\n10\n20\nmin', prefs);
      expect(results[3]).toBe('10');
    });

    it('should find maximum', () => {
      const results = computeResults('30\n10\n20\nmax', prefs);
      expect(results[3]).toBe('30');
    });

    it('should count numbers', () => {
      const results = computeResults('10\n20\n30\ncount', prefs);
      expect(results[3]).toBe('3');
    });

    it('should ignore empty lines in aggregates', () => {
      const results = computeResults('10\n\n20\nsum', prefs);
      expect(results[3]).toBe('30');
    });
  });

  describe('Unary Operators', () => {
    it('should handle negative numbers', () => {
      const results = computeResults('-5', prefs);
      expect(results[0]).toBe('-5');
    });

    it('should handle double negation', () => {
      const results = computeResults('--5', prefs);
      expect(results[0]).toBe('5');
    });

    it('should handle unary plus', () => {
      const results = computeResults('+5', prefs);
      expect(results[0]).toBe('5');
    });
  });

  describe('Error Handling', () => {
    it('should handle division by zero', () => {
      const results = computeResults('1 / 0', prefs);
      expect(results[0]).toContain('Error');
    });

    it('should handle undefined variables', () => {
      const results = computeResults('x + 5', prefs);
      expect(results[0]).toContain('Error');
    });

    it('should handle invalid operations', () => {
      const results = computeResults('10% + 20', prefs);
      expect(results[0]).toContain('Error');
    });
  });

  describe('Complex Expressions', () => {
    it('should evaluate invoice-style calculation', () => {
      const input = `item1 = 100
item2 = 200
item3 = 150
subtotal = sum
tax = subtotal * 8%
total = subtotal + tax`;
      const results = computeResults(input, prefs);
      expect(results[0]).toBe('100');
      expect(results[1]).toBe('200');
      expect(results[2]).toBe('150');
      expect(results[3]).toBe('450'); // sum
      expect(results[4]).toBe('36'); // tax
      expect(results[5]).toBe('486'); // total
    });

    it('should handle percentage calculations with variables', () => {
      // Fixed: "of" operator with variables
      const input = `base = 1000
20% of base
base - (20% of base)`;
      const results = computeResults(input, prefs);
      expect(results[0]).toBe('1,000');
      expect(results[1]).toBe('200');
      expect(results[2]).toBe('800');
    });

    it('should handle mixed operations', () => {
      const input = `salary = 100k
tax rate = 25%
tax = salary * tax rate
net = salary - tax`;
      const results = computeResults(input, prefs);
      expect(results[0]).toBe('100,000');
      expect(results[1]).toBe('25%');
      expect(results[2]).toBe('25,000');
      expect(results[3]).toBe('75,000');
    });
  });

  describe('Empty and Comment Lines', () => {
    it('should handle empty lines', () => {
      const results = computeResults('10\n\n20', prefs);
      expect(results[0]).toBe('10');
      expect(results[1]).toBe('');
      expect(results[2]).toBe('20');
    });

    it('should handle multiple empty lines', () => {
      const results = computeResults('\n\n10\n\n', prefs);
      expect(results[2]).toBe('10');
    });
  });

  describe('Formatting Options', () => {
    it('should respect decimal places', () => {
      const prefs1 = { ...defaultPreferences, decimalPlaces: 0 };
      const prefs2 = { ...defaultPreferences, decimalPlaces: 4 };
      
      const results1 = computeResults('1 / 3', prefs1);
      const results2 = computeResults('1 / 3', prefs2);
      
      expect(results1[0]).toBe('0');
      expect(results2[0]).toBe('0.3333');
    });

    it('should respect thousands separator', () => {
      const prefsComma = { ...defaultPreferences, thousandsSeparator: ',' as const };
      const prefsSpace = { ...defaultPreferences, thousandsSeparator: ' ' as const };
      
      const results1 = computeResults('1000000', prefsComma);
      const results2 = computeResults('1000000', prefsSpace);
      
      expect(results1[0]).toBe('1,000,000');
      expect(results2[0]).toBe('1 000 000');
    });

    it('should respect decimal separator', () => {
      const prefsComma = { 
        ...defaultPreferences, 
        decimalSeparator: ',' as const,
        thousandsSeparator: '.' as const,
        decimalPlaces: 2
      };
      
      const results = computeResults('1000.5', prefsComma);
      // Note: showTrailingZeros is false by default, so "1.000,5" is correct
      expect(results[0]).toBe('1.000,5');
    });
  });

  describe('Math Functions', () => {
    it('should round to nearest integer', () => {
      const results = computeResults('round(3.14)\nround(3.5)\nround(3.9)', prefs);
      expect(results[0]).toBe('3');
      expect(results[1]).toBe('4');
      expect(results[2]).toBe('4');
    });

    it('should round up with ceil', () => {
      const results = computeResults('ceil(3.14)\nceil(3.9)\nceil(-2.3)', prefs);
      expect(results[0]).toBe('4');
      expect(results[1]).toBe('4');
      expect(results[2]).toBe('-2'); // ceil rounds towards positive infinity
    });

    it('should round down with floor', () => {
      const results = computeResults('floor(3.14)\nfloor(3.9)\nfloor(-2.3)', prefs);
      expect(results[0]).toBe('3');
      expect(results[1]).toBe('3');
      expect(results[2]).toBe('-3'); // floor rounds towards negative infinity
    });

    it('should calculate absolute value', () => {
      const results = computeResults('abs(-5)\nabs(5)\nabs(-3.14)', prefs);
      expect(results[0]).toBe('5');
      expect(results[1]).toBe('5');
      expect(results[2]).toBe('3.14');
    });

    it('should calculate square root', () => {
      const results = computeResults('sqrt(4)\nsqrt(9)\nsqrt(2)', prefs);
      expect(results[0]).toBe('2');
      expect(results[1]).toBe('3');
      expect(results[2]).toBe('1.41');
    });

    it('should handle functions in expressions', () => {
      const results = computeResults('round(3.7) + ceil(2.1)', prefs);
      expect(results[0]).toBe('7');
    });

    it('should handle nested functions', () => {
      const results = computeResults('round(sqrt(10))', prefs);
      expect(results[0]).toBe('3');
    });

    it('should handle functions with variables', () => {
      const input = `x = 3.7
y = round(x)
z = y * 2`;
      const results = computeResults(input, prefs);
      expect(results[0]).toBe('3.7');
      expect(results[1]).toBe('4');
      expect(results[2]).toBe('8');
    });

    it('should error on sqrt of negative number', () => {
      const results = computeResults('sqrt(-4)', prefs);
      expect(results[0]).toContain('Error');
    });

    it('should work with percentages', () => {
      const results = computeResults('round(33.7%)', prefs);
      expect(results[0]).toBe('34%');
    });
  });
});
