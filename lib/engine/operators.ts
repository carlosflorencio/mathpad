/**
 * Operator adapter pattern for binary and unary operators
 * Each operator knows how to combine or transform values
 */

import Big from "big.js"
import { EvalResult, NumberResult, PercentResult, ExecutionContext, ASTNode } from "./types"

/**
 * Binary operator adapter interface
 * Handles operations between two values (e.g., +, -, *, /)
 */
export interface BinaryOperatorAdapter {
  /** Operator symbol */
  symbol: string

  /** Alternative symbols (e.g., × for *) */
  aliases?: string[]

  /** Execute operation on two numbers */
  executeNumbers?(left: Big, right: Big): Big

  /** Execute operation on number and percent */
  executeNumberPercent?(left: Big, rightPercent: Big): Big

  /** Execute operation on percent and number */
  executePercentNumber?(leftPercent: Big, right: Big): Big

  /** Execute operation on two percents */
  executePercentPercent?(left: Big, right: Big): Big

  /** Validate operation (return error message if invalid) */
  validate?(left: Big, right: Big): string | null
}

/**
 * Unary operator adapter interface
 * Handles operations on a single value (e.g., unary -, +)
 */
export interface UnaryOperatorAdapter {
  /** Operator symbol */
  symbol: string

  /** Execute operation on a number */
  executeNumber?(value: Big): Big

  /** Execute operation on a percent */
  executePercent?(value: Big): Big
}

// ============================================================================
// Binary Operator Implementations
// ============================================================================

export class AddOperator implements BinaryOperatorAdapter {
  symbol = "+"

  executeNumbers(left: Big, right: Big): Big {
    return left.plus(right)
  }

  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 + 20% = 120
    return left.times(new Big(1).plus(rightPercent.div(100)))
  }

  executePercentNumber(leftPercent: Big, right: Big): Big {
    // 20% + 100 = 120 (percent applies to the number)
    return right.times(new Big(1).plus(leftPercent.div(100)))
  }

  executePercentPercent(left: Big, right: Big): Big {
    // 20% + 10% = 30%
    return left.plus(right)
  }
}

export class SubtractOperator implements BinaryOperatorAdapter {
  symbol = "-"
  aliases = ["−"]

  executeNumbers(left: Big, right: Big): Big {
    return left.minus(right)
  }

  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 - 20% = 80
    return left.times(new Big(1).minus(rightPercent.div(100)))
  }

  executePercentNumber(leftPercent: Big, right: Big): Big {
    // 20% - 100 is not a typical operation, but we'll subtract normally
    return leftPercent.minus(right)
  }

  executePercentPercent(left: Big, right: Big): Big {
    // 30% - 10% = 20%
    return left.minus(right)
  }
}

export class MultiplyOperator implements BinaryOperatorAdapter {
  symbol = "*"
  aliases = ["×"]

  executeNumbers(left: Big, right: Big): Big {
    return left.times(right)
  }

  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 * 20% = 20
    return left.times(rightPercent).div(100)
  }

  executePercentNumber(leftPercent: Big, right: Big): Big {
    // 20% * 100 = 20
    return right.times(leftPercent).div(100)
  }

  executePercentPercent(left: Big, right: Big): Big {
    // 20% * 50% = 10% (0.2 * 0.5 = 0.1)
    return left.times(right).div(100)
  }
}

export class DivideOperator implements BinaryOperatorAdapter {
  symbol = "/"

  validate(left: Big, right: Big): string | null {
    if (right.eq(0)) {
      return "Division by zero"
    }
    return null
  }

  executeNumbers(left: Big, right: Big): Big {
    return left.div(right)
  }

  executeNumberPercent(left: Big, rightPercent: Big): Big {
    // 100 / 20% = 500 (100 / 0.2)
    return left.div(rightPercent.div(100))
  }

  executePercentPercent(left: Big, right: Big): Big {
    // 50% / 25% = 2 (0.5 / 0.25)
    return left.div(right)
  }
}

export class ModuloOperator implements BinaryOperatorAdapter {
  symbol = "%"

  validate(left: Big, right: Big): string | null {
    if (right.eq(0)) {
      return "Modulo by zero"
    }
    return null
  }

  executeNumbers(left: Big, right: Big): Big {
    return left.mod(right)
  }
}

export class PowerOperator implements BinaryOperatorAdapter {
  symbol = "^"

  executeNumbers(left: Big, right: Big): Big {
    return left.pow(right.toNumber())
  }
}

// ============================================================================
// Unary Operator Implementations
// ============================================================================

export class UnaryPlusOperator implements UnaryOperatorAdapter {
  symbol = "+"

  executeNumber(value: Big): Big {
    return value
  }

  executePercent(value: Big): Big {
    return value
  }
}

export class UnaryMinusOperator implements UnaryOperatorAdapter {
  symbol = "-"

  executeNumber(value: Big): Big {
    return value.times(-1)
  }

  executePercent(value: Big): Big {
    return value.times(-1)
  }
}

// ============================================================================
// Operator Registries
// ============================================================================

class BinaryOperatorRegistry {
  private operators = new Map<string, BinaryOperatorAdapter>()

  register(adapter: BinaryOperatorAdapter): void {
    this.operators.set(adapter.symbol, adapter)
    if (adapter.aliases) {
      for (const alias of adapter.aliases) {
        this.operators.set(alias, adapter)
      }
    }
  }

  get(symbol: string): BinaryOperatorAdapter | undefined {
    return this.operators.get(symbol)
  }

  has(symbol: string): boolean {
    return this.operators.has(symbol)
  }
}

class UnaryOperatorRegistry {
  private operators = new Map<string, UnaryOperatorAdapter>()

  register(adapter: UnaryOperatorAdapter): void {
    this.operators.set(adapter.symbol, adapter)
  }

  get(symbol: string): UnaryOperatorAdapter | undefined {
    return this.operators.get(symbol)
  }

  has(symbol: string): boolean {
    return this.operators.has(symbol)
  }
}

// Create and populate registries
export const binaryOperatorRegistry = new BinaryOperatorRegistry()
export const unaryOperatorRegistry = new UnaryOperatorRegistry()

// Register binary operators
binaryOperatorRegistry.register(new AddOperator())
binaryOperatorRegistry.register(new SubtractOperator())
binaryOperatorRegistry.register(new MultiplyOperator())
binaryOperatorRegistry.register(new DivideOperator())
binaryOperatorRegistry.register(new ModuloOperator())
binaryOperatorRegistry.register(new PowerOperator())

// Register unary operators
unaryOperatorRegistry.register(new UnaryPlusOperator())
unaryOperatorRegistry.register(new UnaryMinusOperator())
