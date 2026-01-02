import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view"
import { StateField, StateEffect, Extension } from "@codemirror/state"

// Define effect for updating error positions
export const setErrorsEffect = StateEffect.define<ErrorInfo[]>()

export interface ErrorInfo {
  lineNumber: number
  position: number
  length: number
  message: string
}

// State field to track error decorations
const errorDecorationsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(setErrorsEffect)) {
        const errors = effect.value
        const marks: any[] = []

        for (const error of errors) {
          // Convert line number and position to document position
          const line = tr.state.doc.line(error.lineNumber + 1) // line() uses 1-based indexing
          const from = line.from + error.position
          const to = from + error.length

          // Add underline decoration
          marks.push(
            Decoration.mark({
              class: "cm-error-underline",
              attributes: {
                title: error.message,
              },
            }).range(from, to)
          )
        }

        decorations = Decoration.set(marks, true)
      }
    }
    return decorations
  },
  provide: (f) => EditorView.decorations.from(f),
})

// Theme for error underlines
const errorTheme = EditorView.theme({
  ".cm-error-underline": {
    textDecoration: "underline",
    textDecorationColor: "#ef4444",
    textDecorationStyle: "wavy",
    textDecorationThickness: "2px",
    textUnderlineOffset: "3px",
    cursor: "help",
  },
})

// Export extension
export function errorDecorations(): Extension {
  return [errorDecorationsField, errorTheme]
}
