"use client"

import { acceptCompletion, autocompletion, completionKeymap } from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap, redo } from "@codemirror/commands"
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { drawSelection, EditorView, keymap } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { useRef } from "react"
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
import { Preferences } from "@/lib/types"
import { evaluateDocument, LineEvaluation } from "@/lib/engine"

interface EditorProps {
  value: string
  onUpdate: (value: string) => void
  preferences: Preferences
  onCopy?: (value: string) => void
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

export function Editor({ value, onUpdate, preferences, onCopy }: EditorProps) {
  const evaluations = textToEvaluations(value, preferences)
  const evaluationsRef = useRef(evaluations)
  evaluationsRef.current = evaluations

  // Extract formatted results for the gutter
  const results = evaluations.map((e) => e.formatted)
  const resultsRef = useRef(results)
  resultsRef.current = results

  // Extract error information from initial evaluations
  const initialErrors: ErrorInfo[] = evaluations
    .filter((e) => e.result.type === "error")
    .map((e) => ({
      lineNumber: e.lineNumber,
      position: (e.result as any).position,
      length: (e.result as any).length,
      message: (e.result as any).message,
    }))

  const errorsRef = useRef<ErrorInfo[]>(initialErrors)
  errorsRef.current = initialErrors

  // Store onCopy in a ref so it doesn't cause extension recreation
  const onCopyRef = useRef(onCopy)
  onCopyRef.current = onCopy

  const onChange = (value: string) => {
    const newEvaluations = textToEvaluations(value, preferences)
    evaluationsRef.current = newEvaluations
    resultsRef.current = newEvaluations.map((e) => e.formatted)

    // Extract error decorations
    const newErrors: ErrorInfo[] = newEvaluations
      .filter((e) => e.result.type === "error")
      .map((e) => ({
        lineNumber: e.lineNumber,
        position: (e.result as any).position,
        length: (e.result as any).length,
        message: (e.result as any).message,
      }))

    errorsRef.current = newErrors

    onUpdate(value)
  }

  // Track if we've dispatched initial errors
  const hasDispatchedInitialErrorsRef = useRef(false)

  // Extension to dispatch errors and contexts on document changes
  const updateExtension = EditorView.updateListener.of((update) => {
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
  })

  // Build initial context and results maps for syntax highlighting
  const initialContexts = new Map()
  const initialResults = new Map()
  evaluations.forEach((evaluation) => {
    initialContexts.set(evaluation.lineNumber, evaluation.context)
    initialResults.set(evaluation.lineNumber, evaluation.result)
  })

  return (
    <CodeMirror
      className="flex-1 h-full"
      value={value}
      onChange={onChange}
      extensions={[
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        highlightSelectionMatches(),
        EditorView.lineWrapping,
        initialContextsFacet.of(initialContexts),
        initialResultsFacet.of(initialResults),
        mathpadLanguage,
        contextsField,
        resultsField,
        viewTracker,
        rightGutter(
          (lineNumber) => resultsRef.current[lineNumber - 1],
          (value) => onCopyRef.current?.(value)
        ),
        errorDecorations(),
        separatorDecorationsExtension(),
        aggregateDecorationsExtension(),
        variableHoverExtension(preferences),
        updateExtension,
        autocompletion({ override: [completions] }),
        preferences.theme === "dark" ? dark : light,
        history(),
        keymap.of([
          ...defaultKeymap,
          ...searchKeymap,
          ...completionKeymap,
          { key: "Tab", run: acceptCompletion },
          ...historyKeymap,
          { key: "Mod-Shift-z", run: redo, preventDefault: true },
        ]),
      ]}
    />
  )
}
