import { hoverTooltip, EditorView } from "@codemirror/view"
import { contextsField, resultsField } from "./MathpadLang"
import { formatResult, createFormatOptions } from "@/lib/engine/formatter"
import { Preferences } from "@/lib/types"
import { aggregateFunctionRegistry } from "@/lib/engine/adapters/registry"

/**
 * Creates a hover tooltip extension that shows variable values on hover
 */
export function variableHoverExtension(preferences: Preferences) {
  const formatOptions = createFormatOptions(preferences)
  const aggregateKeywords = aggregateFunctionRegistry.getAllKeywords()

  return [
    hoverTooltip((view, pos) => {
      // Get the word at the cursor position
      const word = view.state.wordAt(pos)
      if (!word) return null

      const text = view.state.doc.sliceString(word.from, word.to)
      const lowerText = text.toLowerCase()

      // Get the current line number (1-based from CodeMirror)
      const line = view.state.doc.lineAt(pos)
      const lineNumber = line.number

      // Get execution context for this line
      const contexts = view.state.field(contextsField, false)
      if (!contexts) return null

      // Check if this is an aggregate function keyword
      if (aggregateKeywords.has(lowerText)) {
        // For aggregate functions, show the result of THIS line
        // Convert CodeMirror's 1-based lineNumber to 0-based for results
        const results = view.state.field(resultsField, false)
        if (!results) return null

        const result = results.get(lineNumber - 1)
        if (!result || result.type === "error" || result.type === "empty") return null

        // Format the value
        const formatted = formatResult(result, formatOptions)

        return {
          pos: word.from,
          end: word.to,
          above: true,
          create() {
            const dom = document.createElement("div")
            dom.className = "cm-variable-hover"
            dom.textContent = formatted
            return { dom }
          },
        }
      }

      // For variables, get context from the PREVIOUS line to see what's available
      // contexts map uses evaluation.lineNumber which is 0-based
      // CodeMirror line 1 = evaluation line 0, so we need contexts.get(lineNumber - 2) to get previous line's context
      // But for line 1, there is no previous context
      if (lineNumber === 1) return null

      const context = contexts.get(lineNumber - 2)
      if (!context) return null

      let varValue = null

      // Check if this is "prev" or "previous" - these reference the last result
      if (lowerText === "prev" || lowerText === "previous" || lowerText === "it") {
        // Find the last non-empty result from lineResults
        if (context.lineResults.length > 0) {
          for (let i = context.lineResults.length - 1; i >= 0; i--) {
            const result = context.lineResults[i]
            if (result.type !== "empty") {
              varValue = result
              break
            }
          }
        }
      } else {
        // Check if this word is a variable in the context
        varValue = context.variables.get(text)
      }

      if (!varValue) return null

      // Only show tooltips for number and percent results
      if (varValue.type === "error" || varValue.type === "empty") return null

      // Format the value
      const formatted = formatResult(varValue, formatOptions)

      return {
        pos: word.from,
        end: word.to,
        above: true,
        create() {
          const dom = document.createElement("div")
          dom.className = "cm-variable-hover"
          dom.textContent = formatted
          return { dom }
        },
      }
    }),
    variableHoverTheme,
  ]
}

/**
 * Theme styling for variable hover tooltips
 */
const variableHoverTheme = EditorView.baseTheme({
  ".cm-tooltip.cm-tooltip-hover": {
    border: "none",
    backgroundColor: "transparent",
  },
  ".cm-variable-hover": {
    backgroundColor: "rgba(100, 149, 237, 0.1)",
    border: "2px solid rgb(100, 149, 237)",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "rgb(100, 149, 237)",
    boxShadow: "0 4px 12px rgba(100, 149, 237, 0.2)",
    backdropFilter: "blur(8px)",
    transition: "all 0.2s ease-in-out",
    animation: "bubble-in 0.2s ease-out",
  },
  "@keyframes bubble-in": {
    "0%": {
      opacity: "0",
      transform: "scale(0.8) translateY(4px)",
    },
    "100%": {
      opacity: "1",
      transform: "scale(1) translateY(0)",
    },
  },
})
