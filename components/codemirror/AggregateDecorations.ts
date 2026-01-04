import { ViewPlugin, Decoration, DecorationSet, EditorView, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { aggregateFunctionRegistry } from "../../lib/engine/adapters/registry"
import { contextsField } from "./MathpadLang"
import { AggregateFunctionName } from "../../lib/engine/adapters/base"

/**
 * Helper function to find the position of an aggregate keyword in a line
 */
function findAggregateKeywordPosition(
  line: string,
  keywordRegex: RegExp
): { start: number; end: number } | null {
  const match = line.match(keywordRegex)
  if (!match || match.index === undefined) return null

  return {
    start: match.index,
    end: match.index + match[1].length,
  }
}

/**
 * Generate dynamic border styling for multiple aggregate borders
 * Creates non-overlapping 3px borders stacked horizontally on the right edge
 * Returns a style string with background-based borders
 */
function generateAggregateBorderStyle(aggregateTypes: AggregateFunctionName[]): string {
  if (aggregateTypes.length === 0) return ""
  if (aggregateTypes.length === 1) return "" // Single border handled by CSS

  const totalWidth = aggregateTypes.length * 3

  // Build a linear-gradient with hard stops for each color stripe
  // Each stripe is 3px wide
  const gradientStops: string[] = []

  aggregateTypes.forEach((aggType, index) => {
    const startPercent = ((index * 3) / totalWidth) * 100
    const endPercent = (((index + 1) * 3) / totalWidth) * 100
    gradientStops.push(
      `var(--aggregate-${aggType}-color) ${startPercent}%`,
      `var(--aggregate-${aggType}-color) ${endPercent}%`
    )
  })

  const gradient = `linear-gradient(to right, ${gradientStops.join(", ")})`

  return `background: ${gradient} right / ${totalWidth}px 100% no-repeat; padding-right: ${totalWidth}px;`
}

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
      const aggregateLineTypes = new Map<number, AggregateFunctionName>()
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
            const match = trimmed.match(this.aggregateKeywords)
            if (match) {
              const keyword = match[1]
              const aggregateType = aggregateFunctionRegistry.mapKeywordToName(keyword)
              if (aggregateType) {
                aggregateLines.add(lineNumber)
                aggregateLineTypes.set(lineNumber, aggregateType)
              }
            }
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

          // For aggregate keyword lines: add their own border PLUS borders for all aggregates ahead
          if (isAggregateLine) {
            const aggregateType = aggregateLineTypes.get(lineNumber)
            if (aggregateType) {
              // Look ahead to find ALL aggregates AFTER this line (not including itself)
              const aggregateTypesAhead: AggregateFunctionName[] = []
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
                    const aggType = aggregateLineTypes.get(aggLine)
                    if (aggType) {
                      aggregateTypesAhead.push(aggType)
                    }
                  }
                }
              }

              // Combine: this aggregate's own type + aggregates ahead
              // Put current aggregate first, then aggregates ahead
              const aggregateTypesForThisLine = [aggregateType, ...aggregateTypesAhead]

              // Generate dynamic border style for multiple borders
              const borderStyle = generateAggregateBorderStyle(aggregateTypesForThisLine)

              // Apply borders using inline style for dynamic borders
              if (aggregateTypesForThisLine.length === 1) {
                // Single aggregate - use CSS class
                builder.add(
                  pos,
                  pos,
                  Decoration.line({
                    attributes: {
                      class: `cm-aggregate-line-${aggregateType}`,
                    },
                  })
                )
              } else {
                // Multiple aggregates - use inline style with gradient
                builder.add(
                  pos,
                  pos,
                  Decoration.line({
                    attributes: {
                      style: borderStyle,
                    },
                  })
                )
              }

              // Add keyword underline decoration AFTER line decorations
              const keywordPos = findAggregateKeywordPosition(line, this.aggregateKeywords)
              if (keywordPos) {
                builder.add(
                  pos + keywordPos.start,
                  pos + keywordPos.end,
                  Decoration.mark({ class: `cm-aggregate-keyword-${aggregateType}` })
                )
              }
            }
          }
          // For non-aggregate lines: check if they have results and feed into an aggregate
          else if (context && context.lineResults.length > 0 && !separatorLines.has(lineNumber)) {
            // Look ahead to find ALL aggregates on future lines IN THE SAME CONTEXT
            // (i.e., before any separator)
            const aggregateTypesAhead: AggregateFunctionName[] = []
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
                  const aggregateType = aggregateLineTypes.get(aggLine)
                  if (aggregateType) {
                    aggregateTypesAhead.push(aggregateType)
                  }
                }
              }
            }

            // Highlight lines that feed values into aggregates
            if (aggregateTypesAhead.length > 0) {
              // Generate dynamic border style for multiple borders
              const borderStyle = generateAggregateBorderStyle(aggregateTypesAhead)

              if (aggregateTypesAhead.length === 1) {
                // Single aggregate - use CSS class
                builder.add(
                  pos,
                  pos,
                  Decoration.line({
                    attributes: {
                      class: `cm-aggregate-line-${aggregateTypesAhead[0]}`,
                    },
                  })
                )
              } else {
                // Multiple aggregates - use inline style with gradient
                builder.add(
                  pos,
                  pos,
                  Decoration.line({
                    attributes: {
                      style: borderStyle,
                    },
                  })
                )
              }
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
  // Single aggregate borders
  ".cm-aggregate-line-sum": {
    borderRight: "3px solid var(--aggregate-sum-color)",
    paddingRight: "3px",
  },
  ".cm-aggregate-line-avg": {
    borderRight: "3px solid var(--aggregate-avg-color)",
    paddingRight: "3px",
  },
  ".cm-aggregate-line-min": {
    borderRight: "3px solid var(--aggregate-min-color)",
    paddingRight: "3px",
  },
  ".cm-aggregate-line-max": {
    borderRight: "3px solid var(--aggregate-max-color)",
    paddingRight: "3px",
  },
  ".cm-aggregate-line-count": {
    borderRight: "3px solid var(--aggregate-count-color)",
    paddingRight: "3px",
  },

  // Keyword underlines
  ".cm-aggregate-keyword-sum": {
    textDecoration: "underline",
    textDecorationColor: "var(--aggregate-sum-color)",
    textDecorationThickness: "2px",
    textUnderlineOffset: "3px",
  },
  ".cm-aggregate-keyword-avg": {
    textDecoration: "underline",
    textDecorationColor: "var(--aggregate-avg-color)",
    textDecorationThickness: "2px",
    textUnderlineOffset: "3px",
  },
  ".cm-aggregate-keyword-min": {
    textDecoration: "underline",
    textDecorationColor: "var(--aggregate-min-color)",
    textDecorationThickness: "2px",
    textUnderlineOffset: "3px",
  },
  ".cm-aggregate-keyword-max": {
    textDecoration: "underline",
    textDecorationColor: "var(--aggregate-max-color)",
    textDecorationThickness: "2px",
    textUnderlineOffset: "3px",
  },
  ".cm-aggregate-keyword-count": {
    textDecoration: "underline",
    textDecorationColor: "var(--aggregate-count-color)",
    textDecorationThickness: "2px",
    textUnderlineOffset: "3px",
  },
})
