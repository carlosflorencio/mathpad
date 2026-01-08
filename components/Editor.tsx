"use client"

import { acceptCompletion, autocompletion, completionKeymap } from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap, redo } from "@codemirror/commands"
import { drawSelection, EditorView, keymap } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { useRef, useEffect, useMemo, memo } from "react"
import { vim } from "@replit/codemirror-vim"
import {
  mathpadLanguage,
  contextsField,
  setContextsEffect,
  resultsField,
  setResultsEffect,
  viewTracker,
  initialContextsFacet,
  initialResultsFacet,
} from "./codemirror/MathpadLang"
import { completions } from "./codemirror/Completions"
import { dark } from "./codemirror/DarkTheme"
import { light } from "./codemirror/LightTheme"
import { rightGutter } from "./codemirror/ResultsGutter"
import { errorDecorations, setErrorsEffect, ErrorInfo } from "./codemirror/ErrorDecorations"
import { separatorDecorationsExtension } from "./codemirror/SeparatorDecorations"
import { aggregateDecorationsExtension } from "./codemirror/AggregateDecorations"
import { variableHoverExtension } from "./codemirror/VariableHover"
import { CodeMirror } from "./codemirror/CodeMirror"
import { Preferences } from "@/lib/preferences/Preferences"
import { evaluateDocument, LineEvaluation, ErrorResult } from "@/lib/engine"

interface EditorProps {
  value: string
  onUpdate: (value: string) => void
  preferences: Preferences
  onCopy?: (value: string) => void
  noteId?: string
}

function textToEvaluations(text: string, preferences: Preferences): LineEvaluation[] {
  try {
    return evaluateDocument(text, preferences)
  } catch (error) {
    console.error("Error computing results:", error)
    // Return empty results on error to prevent crashes
    return text.split("\n").map((_, i) => ({
      lineNumber: i,
      result: { type: "empty" as const },
      formatted: "",
      context: { variables: new Map(), lineResults: [], currentLine: i },
    }))
  }
}

function EditorComponent({ value, onUpdate, preferences, onCopy, noteId }: EditorProps) {
  // Memoize evaluations to avoid re-computing when props haven't changed
  const evaluations = useMemo(() => textToEvaluations(value, preferences), [value, preferences])
  const evaluationsRef = useRef(evaluations)

  // Extract formatted results for the gutter
  const results = useMemo(() => evaluations.map((e) => e.formatted), [evaluations])
  const resultsRef = useRef(results)

  // Extract error information from initial evaluations
  const initialErrors: ErrorInfo[] = useMemo(
    () =>
      evaluations
        .filter((e) => e.result.type === "error")
        .map((e) => {
          const errorResult = e.result as ErrorResult
          return {
            lineNumber: e.lineNumber,
            position: errorResult.position,
            length: errorResult.length,
            message: errorResult.message,
          }
        }),
    [evaluations]
  )

  const errorsRef = useRef<ErrorInfo[]>(initialErrors)

  // Store onCopy in a ref so it doesn't cause extension recreation
  const onCopyRef = useRef(onCopy)

  // Update refs after render to avoid setting refs during render
  useEffect(() => {
    evaluationsRef.current = evaluations
    resultsRef.current = results
    errorsRef.current = initialErrors
    onCopyRef.current = onCopy
  })

  const onChange = (value: string) => {
    // Update immediately for typing responsiveness
    onUpdate(value)
  }

  // Track if we've dispatched initial errors
  const hasDispatchedInitialErrorsRef = useRef(false)

  // Extension to dispatch errors and contexts on document changes
  const updateExtension = useMemo(
    () =>
      // The ref is only accessed during CodeMirror callbacks, not during render
      // eslint-disable-next-line react-hooks/refs
      EditorView.updateListener.of((update) => {
        // Dispatch initial errors on first mount (not a doc change)
        if (!hasDispatchedInitialErrorsRef.current && !update.docChanged) {
          hasDispatchedInitialErrorsRef.current = true
          update.view.dispatch({
            effects: [setErrorsEffect.of(errorsRef.current)],
          })
          return
        }

        // Dispatch context and error updates on doc changes (defer to avoid conflicts)
        if (update.docChanged) {
          // Build context and results maps from evaluations
          const contextMap = new Map()
          const resultsMap = new Map()
          evaluationsRef.current.forEach((evaluation) => {
            contextMap.set(evaluation.lineNumber, evaluation.context)
            resultsMap.set(evaluation.lineNumber, evaluation.result)
          })
          setTimeout(() => {
            update.view.dispatch({
              effects: [
                setErrorsEffect.of(errorsRef.current),
                setContextsEffect.of(contextMap),
                setResultsEffect.of(resultsMap),
              ],
            })
          }, 0)
        }
      }),
    []
  )

  // Gutter extension that accesses refs
  const gutterExtension = useMemo(
    () =>
      rightGutter(
        // Refs are only accessed during CodeMirror callbacks, not during render
        // eslint-disable-next-line react-hooks/refs
        (lineNumber) => resultsRef.current[lineNumber - 1],
        // eslint-disable-next-line react-hooks/refs
        (value) => onCopyRef.current?.(value)
      ),
    []
  )

  // Build initial context and results maps for syntax highlighting
  const initialContexts = new Map()
  const initialResults = new Map()
  evaluations.forEach((evaluation) => {
    initialContexts.set(evaluation.lineNumber, evaluation.context)
    initialResults.set(evaluation.lineNumber, evaluation.result)
  })

  // Memoize variable hover extension to avoid recreation
  // Preferences is an immutable class, so we can safely depend on the instance
  const hoverExtension = useMemo(() => variableHoverExtension(preferences), [preferences])

  // Memoize theme to avoid recreation
  const themeExtension = useMemo(
    () => (preferences.theme === "dark" ? dark : light),
    [preferences.theme]
  )

  // Memoize vim extension - only include when enabled
  const vimExtension = useMemo(() => (preferences.vimMode ? vim() : []), [preferences.vimMode])

  // Create keymap with Mathpad-specific overrides
  // These keybindings should work even in vim mode and override vim defaults
  const keymapExtension = useMemo(
    () =>
      keymap.of([
        ...defaultKeymap,
        ...completionKeymap,
        { key: "Tab", run: acceptCompletion },
        ...historyKeymap,
        { key: "Mod-Shift-z", run: redo, preventDefault: true },
        // Disable Ctrl+D in vim mode (prevent delete line behavior)
        { key: "Ctrl-d", run: () => true, preventDefault: true },
      ]),
    []
  )

  return (
    <CodeMirror
      className="flex-1 h-full"
      value={value}
      onChange={onChange}
      noteId={noteId}
      extensions={[
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        EditorView.lineWrapping,
        initialContextsFacet.of(initialContexts),
        initialResultsFacet.of(initialResults),
        mathpadLanguage,
        contextsField,
        resultsField,
        viewTracker,
        gutterExtension,
        errorDecorations(),
        separatorDecorationsExtension(),
        aggregateDecorationsExtension(),
        hoverExtension,
        updateExtension,
        autocompletion({ override: [completions] }),
        themeExtension,
        history(),
        vimExtension, // Vim mode (conditionally included)
        keymapExtension, // Regular keymaps (after vim to override certain keys)
      ]}
    />
  )
}

// Memoize the entire Editor component to prevent re-renders when props haven't changed
export const Editor = memo(EditorComponent)
