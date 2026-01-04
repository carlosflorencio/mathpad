import { tokenize } from "./tokenizer"
import { parse } from "./parser"
import { evaluate } from "./evaluator"
import { formatResult, createFormatOptions } from "./formatter"
import { createContext, LineEvaluation, ASTNode } from "./types"
import { Preferences } from "../types"
import { formatRegistry } from "./adapters/formats/registry"
import { binaryOperatorRegistry } from "./adapters/registry"

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
        const tokens = tokenize(valueLine, context)
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

    // Tokenize the line (pass context so tokenizer can distinguish defined variables from text)
    const tokens = tokenize(line, context)

    // Special case: Check if we have a number followed by a format keyword (e.g., "40k km")
    // This should be treated as a unit conversion: "40k in km"
    if (
      tokens.length >= 3 &&
      tokens[0].type === "number" &&
      tokens[1].type === "keyword" &&
      tokens[2].type === "eof"
    ) {
      const potentialFormat = tokens[1].value.toLowerCase()
      if (formatRegistry.findParser(potentialFormat)) {
        // Insert an "in" keyword to convert "40k km" to "40k in km"
        tokens.splice(1, 0, {
          type: "conversion",
          value: "in",
          position: tokens[1].position,
          length: 0,
        })
      }
    }

    // Parse into AST
    const ast = parse(tokens)

    // Evaluate the AST
    let [result, newContext] = evaluate(ast, context)

    // Special case: If the result is an "undefined variable" error, try to skip undefined identifiers
    // and re-parse from a point that might have valid content
    // This allows mixing prose with calculations like: "some text variable + 2"
    // BUT: Only do this if the undefined variable is NOT followed by an operator (otherwise it's part of an expression)
    if (result.type === "error" && result.message.includes("not defined")) {
      // Extract the undefined variable name from the error message
      const match = result.message.match(/Variable '(.+?)' not defined/)
      const undefinedVar = match ? match[1] : null

      let shouldRetry = false
      let retryIndex = -1

      if (undefinedVar) {
        // Find the position of the undefined variable in the token stream
        const undefinedVarIndex = tokens.findIndex(
          (t) => t.type === "identifier" && t.value === undefinedVar
        )

        if (undefinedVarIndex !== -1) {
          // Check what comes after the undefined variable
          const nextToken = tokens[undefinedVarIndex + 1]

          // If the next token is an operator, this is part of an expression - DON'T retry
          // Examples: "x + 10" should error (x is undefined and followed by +)
          if (
            nextToken &&
            nextToken.type === "operator" &&
            binaryOperatorRegistry.has(nextToken.value)
          ) {
            shouldRetry = false
          } else {
            // The undefined variable is standalone or followed by another identifier/number
            // This looks like prose followed by a calculation
            // Examples: "some text cal + 2" should parse as cal + 2
            shouldRetry = true

            // Look for the next token that could start a valid expression
            for (let i = undefinedVarIndex + 1; i < tokens.length; i++) {
              const token = tokens[i]
              if (token.type === "number" || token.type === "percent") {
                retryIndex = i
                break
              } else if (token.type === "identifier") {
                // Check if this identifier is defined
                if (context.variables.has(token.value)) {
                  retryIndex = i
                  break
                }
                // If not defined, keep looking
              } else if (token.type === "eof") {
                break
              }
            }
          }
        }
      }

      // If we should retry and found a valid retry point, try parsing from there
      if (shouldRetry && retryIndex !== -1) {
        let remainingTokens = tokens.slice(retryIndex)

        // Check if the token after a number is a keyword that's a valid format
        // This handles cases like "40k km" where we want to treat "km" as a format
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
      } else if (shouldRetry && retryIndex === -1) {
        // Should retry but no valid retry point found, treat as empty (plain text comment)
        result = { type: "empty" }
      }
      // else: Don't retry (undefined variable is part of expression), keep the error
    }

    // Special case: If the result is a "No previous result available" error on the FIRST line
    // that starts with an operator (like "+5" or "-5" WITHOUT space), try to parse it as a unary expression
    // This allows "-5" to work on the first line, while "+ 5" (with space) will still error as expected
    if (
      result.type === "error" &&
      result.message === "No previous result available" &&
      context.lineResults.length === 0 && // Only on first line (no previous results yet)
      i === 0 // AND we're truly on the first line, not after a separator
    ) {
      const firstToken = tokens[0]
      // Check if line starts with + or - operator
      if (
        firstToken.type === "operator" &&
        (firstToken.value === "+" || firstToken.value === "-")
      ) {
        // Check if there's a number or another operator after (for cases like "+5", "-50%", or "--5")
        const nextToken = tokens[1]
        // Also check that there's NO whitespace between the operator and the next token
        const hasNoWhitespace = nextToken && firstToken.position + firstToken.length === nextToken.position

        if (
          nextToken &&
          hasNoWhitespace &&
          (nextToken.type === "number" ||
            nextToken.type === "percent" ||
            (nextToken.type === "operator" && (nextToken.value === "+" || nextToken.value === "-")))
        ) {
          // This looks like it could be a unary expression like "+5", "-50%", or "--5" (no space)
          // For cases like "--5", we need to handle nested unary operators
          // Build the operand by recursively parsing remaining tokens as unary
          const buildUnaryOperand = (remainingTokens: typeof tokens): ASTNode => {
            const first = remainingTokens[0]
            const second = remainingTokens[1]

            // If first token is an operator, recursively build unary
            if (
              first &&
              first.type === "operator" &&
              (first.value === "+" || first.value === "-") &&
              second &&
              first.position + first.length === second.position // no whitespace
            ) {
              return {
                kind: "unary",
                operator: first.value as "+" | "-",
                operand: buildUnaryOperand(remainingTokens.slice(1)),
                position: first.position,
                length:
                  remainingTokens[remainingTokens.length - 2].position +
                  remainingTokens[remainingTokens.length - 2].length -
                  first.position,
              }
            }

            // Otherwise, parse normally
            return parse(remainingTokens)
          }

          const unaryAst: ASTNode = {
            kind: "unary",
            operator: firstToken.value as "+" | "-",
            operand: buildUnaryOperand(tokens.slice(1)),
            position: firstToken.position,
            length: tokens[tokens.length - 2].position + tokens[tokens.length - 2].length - firstToken.position,
          }
          const [unaryResult, unaryContext] = evaluate(unaryAst, context)
          if (unaryResult.type !== "error") {
            result = unaryResult
            newContext = unaryContext
          }
        }
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
