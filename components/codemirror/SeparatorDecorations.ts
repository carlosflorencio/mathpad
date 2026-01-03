import { ViewPlugin, Decoration, DecorationSet, EditorView, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

/**
 * ViewPlugin to add visual styling to separator lines (---)
 * Makes separators more prominent with background color and centered text
 */
const separatorDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view)
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>()

      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        const lines = text.split("\n")
        let pos = from

        for (const line of lines) {
          const trimmed = line.trim()
          // Check if line is a separator (--- with optional extra dashes)
          if (trimmed.match(/^---+$/)) {
            // Add line decoration for background and styling
            builder.add(
              pos,
              pos,
              Decoration.line({
                attributes: {
                  class: "cm-separator-line",
                },
              })
            )

            // Add widget decoration to show "New Context" text after the dashes
            // Position it at the end of the line content (before newline)
            const lineEndPos = pos + line.length
            builder.add(
              lineEndPos,
              lineEndPos,
              Decoration.widget({
                widget: new SeparatorAfterWidget(),
                side: 1,
              })
            )
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

import { WidgetType } from "@codemirror/view"

/**
 * Widget to display "New Context" message after separator line
 */
class SeparatorAfterWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = document.createElement("span")
    span.className = "cm-separator-widget"
    span.textContent = " New Context"
    span.title = "Variables and aggregates reset after this line"
    return span
  }
}

/**
 * Export the plugin and theme extensions
 */
export function separatorDecorationsExtension() {
  return [separatorDecorations, separatorTheme]
}

/**
 * Theme styling for separator lines
 */
const separatorTheme = EditorView.baseTheme({
  ".cm-separator-line": {
    backgroundColor: "var(--separator-bg)",
    borderTop: "1px solid var(--separator-border)",
    borderBottom: "1px solid var(--separator-border)",
    position: "relative",
    paddingTop: "2px",
    paddingBottom: "2px",
  },
  ".cm-separator-widget": {
    color: "var(--separator-text)",
    fontSize: "0.75em",
    fontStyle: "italic",
    opacity: "0.6",
    fontWeight: "400",
    letterSpacing: "0.02em",
    marginLeft: "4px",
  },
})
