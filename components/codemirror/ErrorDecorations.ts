import { Decoration, DecorationSet, EditorView, hoverTooltip, WidgetType } from "@codemirror/view"
import { StateField, StateEffect, Extension } from "@codemirror/state"

// Define effect for updating error positions
export const setErrorsEffect = StateEffect.define<ErrorInfo[]>()

export interface ErrorInfo {
  lineNumber: number
  position: number
  length: number
  message: string
}

// Widget for inline error messages
class ErrorMessageWidget extends WidgetType {
  constructor(readonly message: string) {
    super()
  }

  toDOM() {
    const wrap = document.createElement("span")
    wrap.className = "cm-error-inline"
    wrap.textContent = `  // ${this.message}`
    return wrap
  }

  ignoreEvent() {
    return false
  }
}

// Store errors in a state field for access by hover tooltip
const errorsStateField = StateField.define<ErrorInfo[]>({
  create() {
    return []
  },
  update(errors, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setErrorsEffect)) {
        return effect.value
      }
    }
    return errors
  },
})

// State field to track error decorations (underlines + inline messages)
const errorDecorationsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(setErrorsEffect)) {
        const errors = effect.value
        const marks = []

        for (const error of errors) {
          // Convert line number and position to document position
          const line = tr.state.doc.line(error.lineNumber + 1) // line() uses 1-based indexing
          const from = line.from + error.position
          const to = from + error.length

          // Add underline decoration (only if length > 0)
          if (error.length > 0) {
            marks.push(
              Decoration.mark({
                class: "cm-error-underline",
              }).range(from, to)
            )
          }

          // Add inline error message widget at the end of the line
          marks.push(
            Decoration.widget({
              widget: new ErrorMessageWidget(error.message),
              side: 1,
            }).range(line.to)
          )
        }

        decorations = Decoration.set(marks, true)
      }
    }
    return decorations
  },
  provide: (f) => EditorView.decorations.from(f),
})

// Hover tooltip extension for showing error messages
const errorHoverTooltip = hoverTooltip((view, pos) => {
  const errors = view.state.field(errorsStateField)

  // Find if the cursor position is within any error range
  for (const error of errors) {
    const line = view.state.doc.line(error.lineNumber + 1)
    const from = line.from + error.position
    const to = from + error.length

    if (pos >= from && pos <= to) {
      return {
        pos: from,
        end: to,
        above: true,
        create() {
          const dom = document.createElement("div")
          dom.className = "cm-error-tooltip"
          dom.textContent = error.message
          return { dom }
        },
      }
    }
  }

  return null
})

// Theme for error underlines, inline messages, and tooltips
const errorTheme = EditorView.theme({
  ".cm-error-underline": {
    textDecoration: "underline",
    textDecorationColor: "#ef4444",
    textDecorationStyle: "wavy",
    textDecorationThickness: "2px",
    textUnderlineOffset: "3px",
    cursor: "help",
  },
  ".cm-error-inline": {
    color: "#ef4444",
    opacity: "0.6",
    fontSize: "0.9em",
    fontStyle: "italic",
    marginLeft: "8px",
    userSelect: "none",
    pointerEvents: "none",
  },
  ".cm-error-tooltip": {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "13px",
    maxWidth: "400px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
})

// Export extension
export function errorDecorations(): Extension {
  return [errorsStateField, errorDecorationsField, errorHoverTooltip, errorTheme]
}
