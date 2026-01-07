// Syntax highlighter using the engine's tokenizer as source of truth
// This eliminates duplicate regex logic and ensures highlighting matches parsing

import { StreamLanguage } from "@codemirror/language"
import { StateField, StateEffect, Facet } from "@codemirror/state"
import { ViewPlugin, ViewUpdate, EditorView } from "@codemirror/view"
import { tokenize } from "@/lib/engine/tokenizer"
import { Token, ExecutionContext, EvalResult } from "@/lib/engine/types"
import { formatRegistry } from "@/lib/engine/adapters/formats/registry"
import { UNIT_CATEGORIES } from "@/lib/engine/adapters/formats/base"

/**
 * StateEffect to update execution contexts for all lines
 */
export const setContextsEffect = StateEffect.define<Map<number, ExecutionContext>>()

/**
 * StateEffect to update evaluation results for all lines
 */
export const setResultsEffect = StateEffect.define<Map<number, EvalResult>>()

/**
 * Facet for providing initial contexts when creating the editor state
 */
export const initialContextsFacet = Facet.define<
  Map<number, ExecutionContext>,
  Map<number, ExecutionContext>
>({
  combine(values) {
    // Return the first provided map, or an empty map if none provided
    return values[0] || new Map()
  },
})

/**
 * Facet for providing initial results when creating the editor state
 */
export const initialResultsFacet = Facet.define<Map<number, EvalResult>, Map<number, EvalResult>>({
  combine(values) {
    return values[0] || new Map()
  },
})

/**
 * StateField that stores execution context for each line (0-based line numbers)
 * This allows the syntax highlighter to know which variables are defined
 */
export const contextsField = StateField.define<Map<number, ExecutionContext>>({
  create(state) {
    // Try to get initial contexts from facet
    return state.facet(initialContextsFacet) || new Map()
  },
  update(contexts, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setContextsEffect)) {
        return effect.value
      }
    }
    return contexts
  },
})

/**
 * StateField that stores evaluation results for each line (0-based line numbers)
 * This allows hover tooltips to show the result of aggregate functions
 */
export const resultsField = StateField.define<Map<number, EvalResult>>({
  create(state) {
    return state.facet(initialResultsFacet) || new Map()
  },
  update(results, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setResultsEffect)) {
        return effect.value
      }
    }
    return results
  },
})

/**
 * Get the execution context for a given line number from the editor state
 * Returns the context from the PREVIOUS line (to know what variables are defined before this line)
 */
function getContextForLine(
  view: EditorView | undefined,
  lineNumber: number
): ExecutionContext | undefined {
  if (!view) return undefined
  const contexts = view.state.field(contextsField, false)
  if (!contexts) return undefined

  // Get context from the previous line (line numbers are 1-based in the map, 0-based here)
  // If we're on line 0, there's no previous context
  if (lineNumber === 0) return undefined

  return contexts.get(lineNumber - 1)
}

// Store the current EditorView so the language can access contexts
// This is a workaround since StreamLanguage doesn't provide access to the editor state
let currentView: EditorView | undefined = undefined

/**
 * Plugin to track the current EditorView for the language tokenizer
 */
export const viewTracker = ViewPlugin.fromClass(
  class {
    constructor(view: EditorView) {
      currentView = view
    }

    update(update: ViewUpdate) {
      currentView = update.view
    }

    destroy() {
      currentView = undefined
    }
  }
)

/**
 * State type for the StreamLanguage tokenizer
 */
interface MathpadLanguageState {
  tokens: Token[]
  currentTokenIndex: number
  lineText: string
  lineNumber: number
  colonIndex: number
  inUnitPart: boolean
  currentToken: Token | null
  hasAssignment: boolean
  hasOperators: boolean
  commentStart: number // Position where inline comment starts (-1 if none)
}

/**
 * Map engine token types to CodeMirror highlight tags
 */
function tokenTypeToTag(token: Token, state: MathpadLanguageState): string | null {
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

      // Get context to check if this identifier is defined
      const context = getContextForLine(currentView, state.lineNumber)
      const isDefined = context && context.variables.has(token.value)

      // Highlight if:
      // 1. It's a defined variable in the context
      // 2. Line has assignment or operators (for expressions)
      if (isDefined || state.hasAssignment || state.hasOperators) {
        return "variableName"
      }
      return null

    case "previousResult":
      // "prev" and "previous" keywords - highlight like operators (same as aggregate functions)
      return "operator"

    case "keyword":
      // Highlight format specifiers (units, currencies, K/M/B, etc.) as "unit" (blue)
      // Don't highlight plain "in" and "to" keywords that appear in sentences
      // Note: When "in" or "to" are used for conversions, they get type="conversion" not "keyword"
      if (token.value === "in" || token.value === "to") {
        // These are plain keywords in a sentence, don't highlight
        return null
      }
      // This is a format specifier like "km", "$", "hr", "k", "M", etc. - highlight as unit (blue)
      return "unit"

    case "conversion":
      // "to" and "in" when used for unit conversions (e.g., "100 in km", "100 to k")
      // Highlight as keyword (green) to distinguish from format specifiers
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
      lineNumber: 0, // Track current line number (0-based)
      colonIndex: -1,
      inUnitPart: false,
      currentToken: null as Token | null,
      hasAssignment: false, // Track if line has = sign
      hasOperators: false, // Track if line has operators
      commentStart: -1, // Position where inline comment starts (-1 if none)
    }
  },

  copyState(state) {
    return {
      tokens: state.tokens,
      currentTokenIndex: state.currentTokenIndex,
      lineText: state.lineText,
      lineNumber: state.lineNumber,
      colonIndex: state.colonIndex,
      inUnitPart: state.inUnitPart,
      currentToken: state.currentToken,
      hasAssignment: state.hasAssignment,
      hasOperators: state.hasOperators,
      commentStart: state.commentStart,
    }
  },

  blankLine(state) {
    // Increment line number for blank lines
    state.lineNumber++
  },

  token(stream, state) {
    // New line - tokenize the entire line using engine tokenizer
    if (stream.sol()) {
      // Increment line number when we see a new line (after the first line)
      if (state.lineText !== "") {
        state.lineNumber++
      }

      state.lineText = stream.string
      state.currentTokenIndex = 0
      state.colonIndex = -1
      state.inUnitPart = false
      state.currentToken = null
      state.hasAssignment = false
      state.hasOperators = false
      state.commentStart = -1

      // Check for separator line
      if (/^---+$/.test(state.lineText.trim())) {
        stream.skipToEnd()
        return "separator"
      }

      // Check for full-line comment (# or //)
      const trimmedLine = state.lineText.trim()
      if (trimmedLine.startsWith("#") || trimmedLine.startsWith("//")) {
        stream.skipToEnd()
        return "comment"
      }

      // Find inline comment position (// or # after content)
      const doubleSlashIndex = state.lineText.indexOf("//")
      const hashIndex = state.lineText.indexOf("#")
      if (doubleSlashIndex !== -1) {
        state.commentStart = doubleSlashIndex
      } else if (hashIndex > 0) {
        // Only treat # as comment if not at start (full-line already handled)
        state.commentStart = hashIndex
      }

      // Find label (text before colon)
      const colonIndex = state.lineText.indexOf(":")
      if (colonIndex !== -1) {
        const beforeColon = state.lineText.substring(0, colonIndex).trim()
        if (beforeColon.length > 0 && /^[a-zA-Z][a-zA-Z0-9 ]*$/.test(beforeColon)) {
          state.colonIndex = colonIndex
        }
      }

      // Get execution context for this line (from previous line's evaluation)
      const context = getContextForLine(currentView, state.lineNumber)

      // Tokenize the expression part (after label if present)
      try {
        state.tokens = tokenize(state.lineText, context)

        // Analyze tokens to determine if line has assignments or operators
        state.hasAssignment = state.tokens.some((t) => t.type === "assign")
        state.hasOperators = state.tokens.some((t) => t.type === "operator" && t.value !== "/")

        // Analyze tokens to determine if line has assignments or operators
        state.hasAssignment = state.tokens.some((t) => t.type === "assign")
        state.hasOperators = state.tokens.some((t) => t.type === "operator" && t.value !== "/")
      } catch {
        // If tokenization fails, just skip to end
        state.tokens = []
      }
    }

    // Handle label (before colon)
    if (state.colonIndex !== -1 && stream.pos <= state.colonIndex) {
      stream.pos = state.colonIndex + 1
      return "labelName"
    }

    // Handle inline comment - if we've reached the comment position, highlight rest as comment
    if (state.commentStart !== -1 && stream.pos >= state.commentStart) {
      stream.skipToEnd()
      return "comment"
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
              // Check the adapter's unitCategory to determine if this is a numeric multiplier
              const parser = formatRegistry.findParser(split.unitPart)
              const isNumericMultiplier = parser?.adapter.unitCategory === UNIT_CATEGORIES.NUMBER

              stream.pos = tokenEnd
              state.currentTokenIndex++
              // Numeric multipliers are part of the number literal (40k = 40,000)
              // Physical units are separate (40km = 40 kilometers)
              return isNumericMultiplier ? "number" : "unit"
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
    commentTokens: { line: "//" },
  },
})

export { mathpadLanguage }
