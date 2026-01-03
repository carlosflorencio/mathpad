import { ViewPlugin, Decoration, DecorationSet, EditorView, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { aggregateFunctionRegistry } from "../../lib/engine/adapters/registry"
import { contextsField } from "./MathpadLang"

/**
 * ViewPlugin to add visual indicators on lines that are included in aggregate functions.
 * Shows a colored border on the left side of lines that will be aggregated.
 */
const aggregateDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    // Build regex pattern from registered aggregate keywords
    aggregateKeywords: RegExp

    constructor(view: EditorView) {
      // Get all aggregate keywords from registry (includes aliases like "average", "total", etc.)
      const keywords = Array.from(aggregateFunctionRegistry.getAllKeywords()).join("|")
      this.aggregateKeywords = new RegExp(`\\b(${keywords})\\b`)
      this.decorations = this.buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.state.field(contextsField) !== update.startState.field(contextsField)
      ) {
        this.decorations = this.buildDecorations(update.view)
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>()
      const contexts = view.state.field(contextsField)

      // Build maps of line numbers
      const aggregateLines = new Set<number>()
      const separatorLines = new Set<number>()

      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        const lines = text.split("\n")
        let pos = from

        // First pass: find all aggregate function lines and separators
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const trimmed = line.trim()
          const lineNumber = view.state.doc.lineAt(pos).number

          // Check if line is a separator
          if (trimmed.match(/^---+$/)) {
            separatorLines.add(lineNumber)
          }

          // Check if line contains an aggregate function
          if (trimmed && !trimmed.startsWith("#") && this.aggregateKeywords.test(trimmed)) {
            aggregateLines.add(lineNumber)
          }

          pos += line.length + 1 // +1 for newline
        }
      }

      // Second pass: add indicators to lines that will be aggregated
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        const lines = text.split("\n")
        let pos = from

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const lineNumber = view.state.doc.lineAt(pos).number
          const context = contexts.get(lineNumber)

          // Check if this line is an aggregate function
          const isAggregateLine = aggregateLines.has(lineNumber)

          // Always highlight aggregate function lines
          if (isAggregateLine) {
            builder.add(
              pos,
              pos,
              Decoration.line({
                attributes: {
                  class: "cm-aggregate-line",
                },
              })
            )
          }
          // For non-aggregate lines: check if they have results and feed into an aggregate
          else if (context && context.lineResults.length > 0 && !separatorLines.has(lineNumber)) {
            // Look ahead to see if there's an aggregate on a future line IN THE SAME CONTEXT
            // (i.e., before any separator)
            let hasAggregateAhead = false
            for (const aggLine of aggregateLines) {
              if (aggLine > lineNumber) {
                // Check if there's a separator between this line and the aggregate
                let hasSeparatorBetween = false
                for (const sepLine of separatorLines) {
                  if (sepLine > lineNumber && sepLine < aggLine) {
                    hasSeparatorBetween = true
                    break
                  }
                }

                // Only count aggregate if no separator between
                if (!hasSeparatorBetween) {
                  hasAggregateAhead = true
                  break
                }
              }
            }

            // Highlight lines that feed values into an aggregate
            if (hasAggregateAhead) {
              builder.add(
                pos,
                pos,
                Decoration.line({
                  attributes: {
                    class: "cm-aggregate-line",
                  },
                })
              )
            }
          }

          pos += line.length + 1 // +1 for newline
        }
      }

      return builder.finish()
    }
  },
  {
    decorations: (v) => v.decorations,
  }
)

/**
 * Export the plugin and theme extensions
 */
export function aggregateDecorationsExtension() {
  return [aggregateDecorations, aggregateTheme]
}

/**
 * Theme styling for aggregate indicators
 */
const aggregateTheme = EditorView.baseTheme({
  ".cm-aggregate-line": {
    borderRight: "3px solid rgb(100, 149, 237)",
    paddingRight: "3px",
  },
})
