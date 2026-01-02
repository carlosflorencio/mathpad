/**
 * Central registry for all adapters
 *
 * This module automatically imports and registers all adapters.
 * To add a new feature:
 * 1. Create a new file in functions/, operators/, or aggregates/
 * 2. Export your adapter class
 * 3. Import and register it here
 *
 * The registry will handle all lookups and provide a unified interface.
 */

import {
  FunctionAdapter,
  BinaryOperatorAdapter,
  UnaryOperatorAdapter,
  AggregateFunctionAdapter,
} from "./base"

// Import all functions
import { RoundFunction } from "./functions/round"
import { CeilFunction } from "./functions/ceil"
import { FloorFunction } from "./functions/floor"
import { AbsFunction } from "./functions/abs"
import { SqrtFunction } from "./functions/sqrt"

// Import all operators
import { AddOperator } from "./operators/add"
import { SubtractOperator } from "./operators/subtract"
import { MultiplyOperator } from "./operators/multiply"
import { DivideOperator } from "./operators/divide"
import { ModuloOperator } from "./operators/modulo"
import { PowerOperator } from "./operators/power"
import { UnaryPlusOperator, UnaryMinusOperator } from "./operators/unary"

// Import all aggregates
import { SumAggregate } from "./aggregates/sum"
import { AvgAggregate } from "./aggregates/avg"
import { MinAggregate } from "./aggregates/min"
import { MaxAggregate } from "./aggregates/max"
import { CountAggregate } from "./aggregates/count"

// ============================================================================
// Function Registry
// ============================================================================

class FunctionRegistry {
  private functions = new Map<string, FunctionAdapter>()

  register(adapter: FunctionAdapter): void {
    this.functions.set(adapter.name.toLowerCase(), adapter)
    if (adapter.aliases) {
      for (const alias of adapter.aliases) {
        this.functions.set(alias.toLowerCase(), adapter)
      }
    }
  }

  get(name: string): FunctionAdapter | undefined {
    return this.functions.get(name.toLowerCase())
  }

  has(name: string): boolean {
    return this.functions.has(name.toLowerCase())
  }

  getAllNames(): string[] {
    const names = new Set<string>()
    for (const adapter of this.functions.values()) {
      names.add(adapter.name)
    }
    return Array.from(names)
  }

  getAllAdapters(): FunctionAdapter[] {
    const adapters = new Map<string, FunctionAdapter>()
    for (const adapter of this.functions.values()) {
      adapters.set(adapter.name, adapter)
    }
    return Array.from(adapters.values())
  }
}

// ============================================================================
// Binary Operator Registry
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

// ============================================================================
// Unary Operator Registry
// ============================================================================

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

// ============================================================================
// Aggregate Function Registry
// ============================================================================

class AggregateFunctionRegistry {
  private aggregates = new Map<string, AggregateFunctionAdapter>()

  register(adapter: AggregateFunctionAdapter): void {
    this.aggregates.set(adapter.name.toLowerCase(), adapter)
    if (adapter.aliases) {
      for (const alias of adapter.aliases) {
        this.aggregates.set(alias.toLowerCase(), adapter)
      }
    }
  }

  get(name: string): AggregateFunctionAdapter | undefined {
    return this.aggregates.get(name.toLowerCase())
  }

  has(name: string): boolean {
    return this.aggregates.has(name.toLowerCase())
  }

  getAllNames(): string[] {
    const names = new Set<string>()
    for (const adapter of this.aggregates.values()) {
      names.add(adapter.name)
    }
    return Array.from(names)
  }

  getAllKeywords(): Set<string> {
    const keywords = new Set<string>()
    for (const adapter of this.aggregates.values()) {
      keywords.add(adapter.name.toLowerCase())
      if (adapter.aliases) {
        for (const alias of adapter.aliases) {
          keywords.add(alias.toLowerCase())
        }
      }
    }
    return keywords
  }

  getAllAdapters(): AggregateFunctionAdapter[] {
    const adapters = new Map<string, AggregateFunctionAdapter>()
    for (const adapter of this.aggregates.values()) {
      adapters.set(adapter.name, adapter)
    }
    return Array.from(adapters.values())
  }

  mapKeywordToName(keyword: string): string | null {
    const adapter = this.get(keyword)
    return adapter ? adapter.name : null
  }
}

// ============================================================================
// Create and populate registries
// ============================================================================

export const functionRegistry = new FunctionRegistry()
export const binaryOperatorRegistry = new BinaryOperatorRegistry()
export const unaryOperatorRegistry = new UnaryOperatorRegistry()
export const aggregateFunctionRegistry = new AggregateFunctionRegistry()

// Register all functions
functionRegistry.register(new RoundFunction())
functionRegistry.register(new CeilFunction())
functionRegistry.register(new FloorFunction())
functionRegistry.register(new AbsFunction())
functionRegistry.register(new SqrtFunction())

// Register all binary operators
binaryOperatorRegistry.register(new AddOperator())
binaryOperatorRegistry.register(new SubtractOperator())
binaryOperatorRegistry.register(new MultiplyOperator())
binaryOperatorRegistry.register(new DivideOperator())
binaryOperatorRegistry.register(new ModuloOperator())
binaryOperatorRegistry.register(new PowerOperator())

// Register all unary operators
unaryOperatorRegistry.register(new UnaryPlusOperator())
unaryOperatorRegistry.register(new UnaryMinusOperator())

// Register all aggregate functions
aggregateFunctionRegistry.register(new SumAggregate())
aggregateFunctionRegistry.register(new AvgAggregate())
aggregateFunctionRegistry.register(new MinAggregate())
aggregateFunctionRegistry.register(new MaxAggregate())
aggregateFunctionRegistry.register(new CountAggregate())
