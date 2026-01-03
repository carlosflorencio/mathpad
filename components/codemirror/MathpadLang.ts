// Syntax highlighter using the engine's tokenizer as source of truth
// This eliminates duplicate regex logic and ensures highlighting matches parsing

import { StreamLanguage } from "@codemirror/language"
import { tokenize } from "@/lib/engine/tokenizer"
import { Token } from "@/lib/engine/types"

/**
 * Map engine token types to CodeMirror highlight tags
 */
function tokenTypeToTag(token: Token, state: any): string | null {
  switch (token.type) {
    case "number":
      return "number"

    case "percent":
      return "number"

    case "identifier":
      // Check if it's a math function
      const mathFuncs = new Set([
        "abs",
        "acos",
        "asin",
        "atan",
        "atan2",
        "ceil",
        "cos",
        "exp",
        "floor",
        "log",
        "max",
        "min",
        "pow",
        "random",
        "round",
        "sin",
        "sqrt",
        "tan",
        "PI",
        "E",
      ])
      if (mathFuncs.has(token.value)) {
        return "function"
      }
      // Only highlight as variable if line has assignment or operators
      // Otherwise it's just plain text (like "Earth's circumference is around 40k km")
      if (state.hasAssignment || state.hasOperators) {
        return "variableName"
      }
      return null

    case "keyword":
      return "keyword"

    case "conversion":
      // "to" and "in" when used for unit conversions
      return "keyword"

    case "operator":
      return "operator"

    case "paren":
      return null

    case "assign":
      return "operator"

    case "eof":
      return null

    default:
      return null
  }
}

/**
 * Split a number token value into numeric and unit parts
 * Examples:
 *   "100km" -> { numPart: "100", numLength: 3, unitPart: "km", unitLength: 2 }
 *   "100 kilometers" -> { numPart: "100", numLength: 3, unitPart: "kilometers", unitLength: 10 }
 *   "100.5" -> null (no unit)
 */
function splitNumberUnit(
  value: string
): { numPart: string; numLength: number; unitPart: string; unitLength: number } | null {
  // Match: number part (digits, decimals, separators, spaces) followed by unit part (letters, $, €)
  // The regex captures spaces between number and unit as part of the separator
  const match = value.match(/^([\d.,_' ]+?)\s*([a-zA-Z$€].*)$/)
  if (match) {
    const numPart = match[1].trim()
    const unitPart = match[2]

    // Calculate actual lengths in the original string (including spaces)
    const numEndIndex = value.indexOf(unitPart)
    const numLength = numEndIndex
    const unitLength = unitPart.length

    return { numPart, numLength, unitPart, unitLength }
  }
  return null
}

// Stream-based language implementation
const mathpadLanguage = StreamLanguage.define({
  name: "mathpad",

  startState() {
    return {
      tokens: [] as Token[],
      currentTokenIndex: 0,
      lineText: "",
      colonIndex: -1,
      inUnitPart: false,
      currentToken: null as Token | null,
      hasAssignment: false, // Track if line has = sign
      hasOperators: false, // Track if line has operators
    }
  },

  token(stream, state) {
    // New line - tokenize the entire line using engine tokenizer
    if (stream.sol()) {
      state.lineText = stream.string
      state.currentTokenIndex = 0
      state.colonIndex = -1
      state.inUnitPart = false
      state.currentToken = null
      state.hasAssignment = false
      state.hasOperators = false

      // Check for separator line
      if (/^---+$/.test(state.lineText.trim())) {
        stream.skipToEnd()
        return "separator"
      }

      // Check for comment
      if (state.lineText.trim().startsWith("#")) {
        stream.skipToEnd()
        return "comment"
      }

      // Find label (text before colon)
      const colonIndex = state.lineText.indexOf(":")
      if (colonIndex !== -1) {
        const beforeColon = state.lineText.substring(0, colonIndex).trim()
        if (beforeColon.length > 0 && /^[a-zA-Z][a-zA-Z0-9 ]*$/.test(beforeColon)) {
          state.colonIndex = colonIndex
        }
      }

      // Tokenize the expression part (after label if present)
      try {
        state.tokens = tokenize(state.lineText)

        // Analyze tokens to determine if line has assignments or operators
        state.hasAssignment = state.tokens.some((t) => t.type === "assign")
        state.hasOperators = state.tokens.some(
          (t) => t.type === "operator" && !["/"].includes(t.value)
        )
      } catch (e) {
        // If tokenization fails, just skip to end
        state.tokens = []
      }
    }

    // Handle label (before colon)
    if (state.colonIndex !== -1 && stream.pos <= state.colonIndex) {
      stream.pos = state.colonIndex + 1
      return "labelName"
    }

    // No tokens - skip to end
    if (state.tokens.length === 0) {
      stream.skipToEnd()
      return null
    }

    // Skip whitespace between tokens
    if (stream.peek() && /\s/.test(stream.peek()!)) {
      stream.next()
      return null
    }

    // Find the next token that includes current stream position
    while (state.currentTokenIndex < state.tokens.length) {
      const token = state.tokens[state.currentTokenIndex]

      // Skip EOF tokens
      if (token.type === "eof") {
        state.currentTokenIndex++
        continue
      }

      // Token is ahead of stream - move stream to token position
      if (token.position > stream.pos) {
        stream.pos = token.position
        return null
      }

      // We're at or inside this token
      if (token.position <= stream.pos && stream.pos < token.position + token.length) {
        const tokenEnd = token.position + token.length

        // Special handling for number tokens with unit suffixes
        if (token.type === "number") {
          const split = splitNumberUnit(token.value)

          if (split) {
            // This number has a unit suffix
            const unitStartPos = token.position + split.numLength

            if (stream.pos < unitStartPos) {
              // Currently in the number part
              stream.pos = unitStartPos
              return "number"
            } else {
              // Currently in the unit part
              stream.pos = tokenEnd
              state.currentTokenIndex++
              return "unit"
            }
          }
        }

        // Special handling for compound units like km/h, m/s
        // Check if this is a keyword/operator that could be part of a compound unit
        if (
          (token.type === "keyword" || token.type === "operator") &&
          state.currentTokenIndex + 2 < state.tokens.length
        ) {
          const nextToken = state.tokens[state.currentTokenIndex + 1]
          const nextNextToken = state.tokens[state.currentTokenIndex + 2]

          // Pattern: unit + "/" + unit (e.g., km/h, m/s)
          if (
            nextToken.type === "operator" &&
            nextToken.value === "/" &&
            (nextNextToken.type === "keyword" || nextNextToken.type === "identifier")
          ) {
            // This is a compound unit - highlight all three tokens as unit
            const compoundEnd = nextNextToken.position + nextNextToken.length
            stream.pos = compoundEnd
            state.currentTokenIndex += 3
            return "unit"
          }
        }

        // Normal token without special handling
        stream.pos = tokenEnd
        state.currentTokenIndex++
        return tokenTypeToTag(token, state)
      }

      // Token is behind current position - move to next token
      state.currentTokenIndex++
    }

    // No more tokens - skip to end
    stream.skipToEnd()
    return null
  },

  languageData: {
    commentTokens: { line: "#" },
  },
})

export { mathpadLanguage }
