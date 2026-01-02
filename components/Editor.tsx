'use client';

import { acceptCompletion, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, redo } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { drawSelection, EditorView, highlightActiveLine, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { useRef } from 'react';
import { mathpadLanguage } from './codemirror/MathpadLang';
import { completions } from './codemirror/Completions';
import { dark } from './codemirror/DarkTheme';
import { light } from './codemirror/LightTheme';
import { rightGutter } from './codemirror/ResultsGutter';
import { errorDecorations, setErrorsEffect, ErrorInfo } from './codemirror/ErrorDecorations';
import { CodeMirror } from './codemirror/CodeMirror';
import { Preferences } from '@/lib/types';
import { evaluateDocument, LineEvaluation } from '@/lib/engine';

interface EditorProps {
  value: string;
  onUpdate: (value: string) => void;
  preferences: Preferences;
}

function textToEvaluations(text: string, preferences: Preferences): LineEvaluation[] {
  try {
    return evaluateDocument(text, preferences);
  } catch (error) {
    console.error('Error computing results:', error);
    // Return empty results on error to prevent crashes
    return text.split('\n').map((_, i) => ({
      lineNumber: i,
      result: { type: 'empty' as const },
      formatted: '',
      context: { variables: new Map(), lineResults: [], currentLine: i },
    }));
  }
}

export function Editor({ value, onUpdate, preferences }: EditorProps) {
  const evaluations = textToEvaluations(value, preferences);
  const evaluationsRef = useRef(evaluations);
  evaluationsRef.current = evaluations;

  // Extract formatted results for the gutter
  const results = evaluations.map(e => e.formatted);
  const resultsRef = useRef(results);
  resultsRef.current = results;

  // Extract error information
  const errorsRef = useRef<ErrorInfo[]>([]);

  const onChange = (value: string) => {
    const newEvaluations = textToEvaluations(value, preferences);
    evaluationsRef.current = newEvaluations;
    resultsRef.current = newEvaluations.map(e => e.formatted);
    
    // Extract error decorations
    const newErrors: ErrorInfo[] = newEvaluations
      .filter(e => e.result.type === 'error')
      .map(e => ({
        lineNumber: e.lineNumber,
        position: (e.result as any).position,
        length: (e.result as any).length,
        message: (e.result as any).message,
      }));
    
    errorsRef.current = newErrors;
    
    onUpdate(value);
  };

  // Extension to update errors on every transaction
  const errorUpdateExtension = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      // Dispatch error updates
      update.view.dispatch({
        effects: setErrorsEffect.of(errorsRef.current),
      });
    }
  });

  return (
    <CodeMirror
      className="flex-1 h-full"
      value={value}
      onChange={onChange}
      extensions={[
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        highlightActiveLine(),
        highlightSelectionMatches(),
        EditorView.lineWrapping,
        mathpadLanguage,
        rightGutter((lineNumber) => resultsRef.current[lineNumber - 1]),
        errorDecorations(),
        errorUpdateExtension,
        autocompletion({ override: [completions] }),
        preferences.theme === 'dark' ? dark : light,
        history(),
        keymap.of([
          ...defaultKeymap,
          ...searchKeymap,
          ...completionKeymap,
          { key: 'Tab', run: acceptCompletion },
          ...historyKeymap,
          { key: 'Mod-Shift-z', run: redo, preventDefault: true },
        ]),
      ]}
    />
  );
}
