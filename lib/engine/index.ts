import { tokenize } from "./tokenizer"
import { parse } from "./parser"
import { evaluate } from "./evaluator"
import { formatResult, createFormatOptions } from "./formatter"
import { ExecutionContext, createContext, LineEvaluation, EvalResult } from "./types"
import { Preferences } from "../types"

/**
 * Evaluate a complete document (multiple lines)
 * Returns formatted results for each line
 */
export function evaluateDocument(text: string, preferences: Preferences): LineEvaluation[] {
  const lines = text.split("\n")
  const formatOptions = createFormatOptions(preferences)
  let context = createContext()
  const results: LineEvaluation[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    context.currentLine = i

    // Tokenize the line
    const tokens = tokenize(line)

    // Parse into AST
    const ast = parse(tokens)

    // Evaluate the AST
    const [result, newContext] = evaluate(ast, context)

    // Format the result
    const formatted = formatResult(result, formatOptions)

    // Store the result for this line
    results.push({
      lineNumber: i,
      result,
      formatted,
      context: newContext,
    })

    // Update context for next line
    context = newContext
    context.lineResults.push(result)
  }

  return results
}

/**
 * Simplified function that returns just the formatted strings
 * This is what the Editor component uses
 */
export function computeResults(text: string, preferences: Preferences): string[] {
  const evaluations = evaluateDocument(text, preferences)
  return evaluations.map((e) => e.formatted)
}

// Re-export key types and functions for convenience
export { tokenize } from "./tokenizer"
export { parse } from "./parser"
export { evaluate } from "./evaluator"
export { formatResult, createFormatOptions } from "./formatter"
export * from "./types"
