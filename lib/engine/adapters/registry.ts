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
  AggregateFunctionName,
} from "./base"

// Import all functions
import { RoundFunction } from "./functions/round"
import { CeilFunction } from "./functions/ceil"
import { FloorFunction } from "./functions/floor"
import { AbsFunction } from "./functions/abs"
import { SqrtFunction } from "./functions/sqrt"
import { YearFunction } from "./functions/year"
import { MonthFunction } from "./functions/month"
import { DayFunction } from "./functions/day"
import { HourFunction } from "./functions/hour"
import { MinuteFunction } from "./functions/minute"
import { SecondFunction } from "./functions/second"
import { TodayFunction } from "./functions/today"
import { NowFunction } from "./functions/now"

// Import all operators
import { AddOperator } from "./operators/add"
import { SubtractOperator } from "./operators/subtract"
import { MultiplyOperator } from "./operators/multiply"
import { DivideOperator } from "./operators/divide"
import { ModuloOperator } from "./operators/modulo"
import { PowerOperator } from "./operators/power"
import { UnaryPlusOperator, UnaryMinusOperator } from "./operators/unary"
import { IncrementOperator, DecrementOperator } from "./operators/postfix"

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

  /**
   * Get all registered binary operator symbols (including aliases)
   */
  getAllSymbols(): string[] {
    return Array.from(this.operators.keys())
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

  /**
   * Get all registered unary operator symbols
   */
  getAllSymbols(): string[] {
    return Array.from(this.operators.keys())
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

  mapKeywordToName(keyword: string): AggregateFunctionName | null {
    const adapter = this.get(keyword)
    return adapter ? (adapter.name as AggregateFunctionName) : null
  }

  /**
   * Check if a string is a valid aggregate function keyword
   */
  isAggregateKeyword(keyword: string): boolean {
    return this.has(keyword)
  }

  /**
   * Map an aggregate keyword to its canonical name
   */
  mapAggregateKeyword(keyword: string): AggregateFunctionName | null {
    return this.mapKeywordToName(keyword)
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
functionRegistry.register(new YearFunction())
functionRegistry.register(new MonthFunction())
functionRegistry.register(new DayFunction())
functionRegistry.register(new HourFunction())
functionRegistry.register(new MinuteFunction())
functionRegistry.register(new SecondFunction())
functionRegistry.register(new TodayFunction())
functionRegistry.register(new NowFunction())

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

// Register postfix operators
unaryOperatorRegistry.register(new IncrementOperator())
unaryOperatorRegistry.register(new DecrementOperator())

// Register all aggregate functions
aggregateFunctionRegistry.register(new SumAggregate())
aggregateFunctionRegistry.register(new AvgAggregate())
aggregateFunctionRegistry.register(new MinAggregate())
aggregateFunctionRegistry.register(new MaxAggregate())
aggregateFunctionRegistry.register(new CountAggregate())
