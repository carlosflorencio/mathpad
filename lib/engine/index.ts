import { tokenize } from "./tokenizer"
import { parse } from "./parser"
import { evaluate } from "./evaluator"
import { formatResult, createFormatOptions } from "./formatter"
import { createContext, LineEvaluation } from "./types"
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

    // Check for separator - reset context
    if (line.trim() === "---") {
      results.push({
        lineNumber: i,
        result: { type: "empty" },
        formatted: "",
        context,
      })
      // Reset context for new calculation section
      context = createContext()
      continue
    }

    // Check for comment - skip line but show as empty
    if (line.trim().startsWith("#")) {
      results.push({
        lineNumber: i,
        result: { type: "empty" },
        formatted: "",
        context,
      })
      continue
    }

    // Check for multiline variable assignment: "variable ="
    const multilineMatch = line.match(/^\s*(\w+)\s*=\s*$/)
    if (multilineMatch && i + 1 < lines.length) {
      const variableName = multilineMatch[1]
      const nextLine = lines[i + 1]

      // Check if next line is indented (starts with whitespace)
      if (nextLine.match(/^\s+\S/)) {
        // Store empty result for the assignment line
        results.push({
          lineNumber: i,
          result: { type: "empty" },
          formatted: "",
          context,
        })

        // Move to next line and process the indented value
        i++
        const valueLine = nextLine.trim()
        const tokens = tokenize(valueLine)
        const ast = parse(tokens)
        const [result, newContext] = evaluate(ast, context)

        // Store the variable with the evaluated result
        newContext.variables.set(variableName, result)

        const formatted = formatResult(result, formatOptions)

        results.push({
          lineNumber: i,
          result,
          formatted,
          context: newContext,
        })

        context = newContext
        context.lineResults.push(result)
        continue
      }
    }

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
