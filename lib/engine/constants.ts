/**
 * Single source of truth for all function and operator definitions
 */

import { functionRegistry } from './functions';

// Re-export function registry for use in other modules
export { functionRegistry };

// Aggregate functions that operate on all previous results
export const AGGREGATE_FUNCTIONS = {
  sum: ['sum', 'total'],
  avg: ['avg', 'average', 'mean'],
  min: ['min', 'minimum'],
  max: ['max', 'maximum'],
  count: ['count'],
} as const;

export type AggregateFunctionName = keyof typeof AGGREGATE_FUNCTIONS;

// Get all aggregate function keywords (including aliases)
export function getAllAggregateKeywords(): Set<string> {
  const keywords = new Set<string>();
  for (const aliases of Object.values(AGGREGATE_FUNCTIONS)) {
    for (const alias of aliases) {
      keywords.add(alias);
    }
  }
  return keywords;
}

// Map an aggregate keyword to its canonical name
export function mapAggregateKeyword(keyword: string): AggregateFunctionName | null {
  const lower = keyword.toLowerCase();
  for (const [name, aliases] of Object.entries(AGGREGATE_FUNCTIONS)) {
    if ((aliases as readonly string[]).includes(lower)) {
      return name as AggregateFunctionName;
    }
  }
  return null;
}

// Check if a string is a valid math function
export function isMathFunction(name: string): boolean {
  return functionRegistry.has(name);
}

// Check if a string is a valid aggregate function keyword
export function isAggregateKeyword(keyword: string): boolean {
  return getAllAggregateKeywords().has(keyword.toLowerCase());
}

// Get all math function names
export function getMathFunctionNames(): string[] {
  return functionRegistry.getAllNames();
}

// Get function description
export function getFunctionDescription(name: string): string | undefined {
  const adapter = functionRegistry.get(name);
  return adapter?.description;
}

// Function descriptions for autocomplete (aggregate functions)
export const AGGREGATE_FUNCTION_DESCRIPTIONS: Record<AggregateFunctionName, string> = {
  sum: 'Sum all previous numbers',
  avg: 'Average of all previous numbers',
  min: 'Minimum of all previous numbers',
  max: 'Maximum of all previous numbers',
  count: 'Count of all previous numbers',
};
