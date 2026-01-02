import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { ModuloOperator } from './modulo';

describe('ModuloOperator', () => {
  const modulo = new ModuloOperator();

  describe('executeNumbers', () => {
    it('should calculate modulo', () => {
      expect(modulo.executeNumbers?.(new Big('10'), new Big('3')).toString()).toBe('1');
      expect(modulo.executeNumbers?.(new Big('17'), new Big('5')).toString()).toBe('2');
      expect(modulo.executeNumbers?.(new Big('10'), new Big('2')).toString()).toBe('0');
    });
  });

  describe('validate', () => {
    it('should return error for modulo by zero', () => {
      const error = modulo.validate?.(new Big('10'), new Big('0'));
      expect(error).toBe('Modulo by zero');
    });

    it('should return null for valid modulo', () => {
      const error = modulo.validate?.(new Big('10'), new Big('3'));
      expect(error).toBeNull();
    });
  });
});
