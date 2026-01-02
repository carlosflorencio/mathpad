/**
 * Function adapter pattern for math functions and aggregate functions
 * Each function knows how to transform values
 */

import Big from 'big.js';

/**
 * Function adapter interface
 * Each math function implements this to encapsulate its behavior
 */
export interface FunctionAdapter {
  /** Primary function name */
  name: string;
  
  /** Alternative names/aliases */
  aliases?: string[];
  
  /** Description for autocomplete */
  description: string;
  
  /**
   * Execute the function on a value
   * @throws Error if execution fails
   */
  execute(value: Big): Big;
  
  /**
   * Validate if the value is acceptable for this function
   * @returns error message if invalid, null if valid
   */
  validate?(value: Big): string | null;
}

/**
 * Aggregate function adapter interface
 * Operates on a collection of values (e.g., sum, avg, min, max)
 */
export interface AggregateFunctionAdapter {
  /** Primary function name */
  name: string;
  
  /** Alternative names/aliases */
  aliases?: string[];
  
  /** Description for autocomplete */
  description: string;
  
  /**
   * Execute the aggregate function on a collection of values
   * @param values Array of Big numbers to aggregate
   * @returns Aggregated result
   * @throws Error if execution fails
   */
  execute(values: Big[]): Big;
  
  /**
   * Validate if the values are acceptable for this function
   * @returns error message if invalid, null if valid
   */
  validate?(values: Big[]): string | null;
}

/**
 * Round to nearest integer
 */
export class RoundFunction implements FunctionAdapter {
  name = 'round';
  description = 'Round to nearest integer';
  
  execute(value: Big): Big {
    return value.round(0, Big.roundHalfUp);
  }
}

/**
 * Round up to integer (towards positive infinity)
 */
export class CeilFunction implements FunctionAdapter {
  name = 'ceil';
  description = 'Round up to integer';
  
  execute(value: Big): Big {
    return value.round(0, value.lt(0) ? Big.roundDown : Big.roundUp);
  }
}

/**
 * Round down to integer (towards negative infinity)
 */
export class FloorFunction implements FunctionAdapter {
  name = 'floor';
  description = 'Round down to integer';
  
  execute(value: Big): Big {
    return value.round(0, value.lt(0) ? Big.roundUp : Big.roundDown);
  }
}

/**
 * Absolute value
 */
export class AbsFunction implements FunctionAdapter {
  name = 'abs';
  description = 'Absolute value';
  
  execute(value: Big): Big {
    return value.abs();
  }
}

/**
 * Square root
 */
export class SqrtFunction implements FunctionAdapter {
  name = 'sqrt';
  description = 'Square root';
  
  validate(value: Big): string | null {
    if (value.lt(0)) {
      return 'Cannot take square root of negative number';
    }
    return null;
  }
  
  execute(value: Big): Big {
    return value.sqrt();
  }
}

/**
 * Function registry - maps function names to their adapters
 */
class FunctionRegistry {
  private functions = new Map<string, FunctionAdapter>();
  
  /**
   * Register a function adapter
   */
  register(adapter: FunctionAdapter): void {
    // Register primary name
    this.functions.set(adapter.name.toLowerCase(), adapter);
    
    // Register aliases
    if (adapter.aliases) {
      for (const alias of adapter.aliases) {
        this.functions.set(alias.toLowerCase(), adapter);
      }
    }
  }
  
  /**
   * Get a function adapter by name
   */
  get(name: string): FunctionAdapter | undefined {
    return this.functions.get(name.toLowerCase());
  }
  
  /**
   * Check if a function exists
   */
  has(name: string): boolean {
    return this.functions.has(name.toLowerCase());
  }
  
  /**
   * Get all registered function names (primary names only)
   */
  getAllNames(): string[] {
    const names = new Set<string>();
    for (const adapter of this.functions.values()) {
      names.add(adapter.name);
    }
    return Array.from(names);
  }
  
  /**
   * Get all function adapters (deduplicated)
   */
  getAllAdapters(): FunctionAdapter[] {
    const adapters = new Map<string, FunctionAdapter>();
    for (const adapter of this.functions.values()) {
      adapters.set(adapter.name, adapter);
    }
    return Array.from(adapters.values());
  }
}

// Create and populate the global registry
export const functionRegistry = new FunctionRegistry();

// Register all math functions
functionRegistry.register(new RoundFunction());
functionRegistry.register(new CeilFunction());
functionRegistry.register(new FloorFunction());
functionRegistry.register(new AbsFunction());
functionRegistry.register(new SqrtFunction());
