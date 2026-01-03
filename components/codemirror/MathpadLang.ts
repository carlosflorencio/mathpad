// Simple syntax highlighter for mathematical expressions
// Using CodeMirror 6 StreamLanguage for simple token-based highlighting

import { StreamLanguage } from "@codemirror/language"

// Simple token-based parser
const mathpadLanguage = StreamLanguage.define({
  name: "mathpad",

  startState() {
    return { inComment: false }
  },

  token(stream, state) {
    // Separator (---)
    if (stream.match(/^---+$/)) {
      return "separator"
    }

    // Comments
    if (stream.match("#")) {
      stream.skipToEnd()
      return "comment"
    }

    // Numbers (including k, M, B multipliers)
    if (stream.match(/\d+\.?\d*[kKmMbB]*/)) {
      return "number"
    }

    // Keywords
    if (stream.match(/\b(in|to)\b/)) {
      return "keyword"
    }

    // Math functions
    const mathFuncs = [
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
    ]

    for (const func of mathFuncs) {
      if (stream.match(new RegExp(`\\b${func}\\b`))) {
        return "function"
      }
    }

    // Variables
    if (stream.match(/[a-zA-Z_]\w*/)) {
      return "variableName"
    }

    // Skip other characters
    stream.next()
    return null
  },

  languageData: {
    commentTokens: { line: "#" },
  },
})

export { mathpadLanguage }
