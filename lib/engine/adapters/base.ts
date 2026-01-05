/**
 * Base adapter interfaces for the mathpad engine
 *
 * These interfaces define the contract for all adapters in the system.
 * To add a new feature, simply implement one of these interfaces and register it.
 */

import Big from "big.js"

/**
 * Aggregate function names
 * These are the canonical names for aggregate functions that operate on collections
 */
export type AggregateFunctionName = "sum" | "avg" | "min" | "max" | "count"

/**
 * Math Function Adapter
 *
 * Represents a single-argument mathematical function (e.g., round, sqrt, abs)
 *
 * @example
 * ```typescript
 * export class LogFunction implements FunctionAdapter {
 *   name = 'log';
 *   description = 'Natural logarithm';
 *
 *   validate(value: Big): string | null {
 *     if (value.lte(0)) return 'Cannot take log of non-positive number';
 *     return null;
 *   }
 *
 *   execute(value: Big): Big {
 *     return Big(Math.log(value.toNumber()));
 *   }
 * }
 * ```
 */
export interface FunctionAdapter {
  /** Primary function name (e.g., 'round') */
  name: string

  /** Alternative names/aliases (e.g., ['rnd']) */
  aliases?: string[]

  /** Description shown in autocomplete */
  description: string

  /**
   * Execute the function on a value
   * @param value The input value
   * @returns The result of the function
   * @throws Error if execution fails
   */
  execute(value: Big): Big

  /**
   * Validate if the value is acceptable for this function
   * @param value The value to validate
   * @returns Error message if invalid, null if valid
   */
  validate?(value: Big): string | null

  /**
   * Execute the function on a date value (or no argument for date constructors)
   * @param value The input date (optional for functions like today(), now())
   * @returns The result (either a number or a date)
   * @throws Error if execution fails
   */
  executeDate?(value?: Date): Big | Date

  /**
   * Validate if the date value is acceptable for this function
   * @param value The date to validate
   * @returns Error message if invalid, null if valid
   */
  validateDate?(value: Date): string | null
}

/**
 * Binary Operator Adapter
 *
 * Represents an operator that combines two values (e.g., +, -, *, /)
 * Supports operations between numbers, percents, and mixed types
 *
 * @example
 * ```typescript
 * export class AddOperator implements BinaryOperatorAdapter {
 *   symbol = '+';
 *
 *   executeNumbers(left: Big, right: Big): Big {
 *     return left.plus(right);
 *   }
 *
 *   executeNumberPercent(left: Big, rightPercent: Big): Big {
 *     return left.times(new Big(1).plus(rightPercent.div(100)));
 *   }
 * }
 * ```
 */
export interface BinaryOperatorAdapter {
  /** Operator symbol (e.g., '+', '-') */
  symbol: string

  /** Alternative symbols (e.g., ['×'] for '*') */
  aliases?: string[]

  /** Execute operation on two numbers, returns number */
  executeNumbers?(left: Big, right: Big): Big

  /** Execute operation: number operator percent, returns number */
  executeNumberPercent?(left: Big, rightPercent: Big): Big

  /** Execute operation: percent operator number, returns number */
  executePercentNumber?(leftPercent: Big, right: Big): Big

  /** Execute operation on two percents, returns percent */
  executePercentPercent?(left: Big, right: Big): Big

  /** Execute operation: date operator duration, returns date */
  executeDateDuration?(left: Date, right: Big, rightUnit: string): Date

  /** Execute operation: duration operator date, returns date */
  executeDurationDate?(left: Big, leftUnit: string, right: Date): Date

  /** Execute operation: date operator date, returns duration (value in ms, unit) */
  executeDateDate?(left: Date, right: Date): { value: Big; unit: string }

  /** Execute operation: duration operator duration, returns duration */
  executeDurationDuration?(
    left: Big,
    leftUnit: string,
    right: Big,
    rightUnit: string
  ): { value: Big; unit: string }

  /** Execute operation: duration operator number, returns duration */
  executeDurationNumber?(left: Big, leftUnit: string, right: Big): { value: Big; unit: string }

  /** Execute operation: number operator duration, returns duration */
  executeNumberDuration?(left: Big, right: Big, rightUnit: string): { value: Big; unit: string }

  /**
   * Validate the operation (e.g., check for division by zero)
   * @param left Left operand value
   * @param right Right operand value
   * @returns Error message if invalid, null if valid
   */
  validate?(left: Big, right: Big): string | null
}

/**
 * Unary Operator Adapter
 *
 * Represents an operator that acts on a single value (e.g., unary -, +)
 *
 * @example
 * ```typescript
 * export class UnaryMinusOperator implements UnaryOperatorAdapter {
 *   symbol = '-';
 *
 *   executeNumber(value: Big): Big {
 *     return value.times(-1);
 *   }
 *
 *   executePercent(value: Big): Big {
 *     return value.times(-1);
 *   }
 * }
 * ```
 */
export interface UnaryOperatorAdapter {
  /** Operator symbol (e.g., '+', '-') */
  symbol: string

  /** Execute operation on a number, returns number */
  executeNumber?(value: Big): Big

  /** Execute operation on a percent, returns percent */
  executePercent?(value: Big): Big
}

/**
 * Aggregate Function Adapter
 *
 * Represents a function that operates on a collection of values (e.g., sum, avg, min)
 *
 * @example
 * ```typescript
 * export class MedianAggregate implements AggregateFunctionAdapter {
 *   name = 'median';
 *   description = 'Median of all previous numbers';
 *
 *   validate(values: Big[]): string | null {
 *     if (values.length === 0) return 'No numbers to calculate median';
 *     return null;
 *   }
 *
 *   execute(values: Big[]): Big {
 *     const sorted = [...values].sort((a, b) => a.cmp(b));
 *     const mid = Math.floor(sorted.length / 2);
 *     if (sorted.length % 2 === 0) {
 *       return sorted[mid - 1].plus(sorted[mid]).div(2);
 *     }
 *     return sorted[mid];
 *   }
 * }
 * ```
 */
export interface AggregateFunctionAdapter {
  /** Primary function name (e.g., 'sum', 'avg') */
  name: string

  /** Alternative names/aliases (e.g., ['total', 'add'] for 'sum') */
  aliases?: string[]

  /** Description shown in autocomplete */
  description: string

  /**
   * Execute the aggregate function on a collection of values
   * @param values Array of Big numbers to aggregate
   * @returns Aggregated result
   * @throws Error if execution fails
   */
  execute(values: Big[]): Big

  /**
   * Validate if the values are acceptable for this function
   * @param values The values to validate
   * @returns Error message if invalid, null if valid
   */
  validate?(values: Big[]): string | null
}
