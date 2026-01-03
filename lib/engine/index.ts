import { tokenize } from "./tokenizer"
import { parse } from "./parser"
import { evaluate } from "./evaluator"
import { formatResult, createFormatOptions } from "./formatter"
import { createContext, LineEvaluation } from "./types"
import { Preferences } from "../types"
import { formatRegistry } from "./adapters/formats/registry"

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
    let [result, newContext] = evaluate(ast, context)

    // Special case: If the result is an "undefined variable" error and the AST is just
    // a standalone identifier, try to extract a calculable expression from the line
    // This allows users to write descriptive text with numbers like:
    // "Earth's circumference is around 40k km" -> extracts and calculates "40k km"
    if (
      result.type === "error" &&
      result.message.includes("not defined") &&
      ast.kind === "identifier"
    ) {
      // Try to find a number in the token stream and parse from there
      const numberIndex = tokens.findIndex((t) => t.type === "number" || t.type === "percent")
      if (numberIndex !== -1) {
        // Found a number - try parsing from that point
        let remainingTokens = tokens.slice(numberIndex)

        // Check if the token after the number is a keyword that's a valid format
        // This handles cases like "40k km" where we want to treat "km" as a format
        // Note: format identifiers are tokenized as "keyword" type
        if (
          remainingTokens.length >= 2 &&
          remainingTokens[0].type === "number" &&
          remainingTokens[1].type === "keyword"
        ) {
          const potentialFormat = remainingTokens[1].value.toLowerCase()
          if (formatRegistry.findParser(potentialFormat)) {
            // Insert an "in" keyword to convert "40k km" to "40k in km"
            remainingTokens = [
              remainingTokens[0],
              {
                type: "keyword",
                value: "in",
                position: remainingTokens[1].position,
                length: 0,
              },
              {
                type: "keyword",
                value: potentialFormat,
                position: remainingTokens[1].position,
                length: remainingTokens[1].length,
              },
              ...remainingTokens.slice(2),
            ]
          }
        }

        const newAst = parse(remainingTokens)
        const [newResult, newNewContext] = evaluate(newAst, context)
        if (newResult.type !== "error") {
          // Successfully parsed an expression from the remaining tokens
          result = newResult
          newContext = newNewContext
        } else {
          // Still failed, treat as empty
          result = { type: "empty" }
        }
      } else {
        // No number found, treat as empty (plain text comment)
        result = { type: "empty" }
      }
    }

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
