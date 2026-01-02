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
import { CodeMirror } from './codemirror/CodeMirror';
import { Preferences } from '@/lib/types';

interface EditorProps {
  value: string;
  onUpdate: (value: string) => void;
  preferences: Preferences;
}

// Placeholder evaluator - will be replaced with actual implementation
function textToResults(text: string, preferences: Preferences): string[] {
  const lines = text.split('\n');
  return lines.map(() => ''); // Return empty results for now
}

export function Editor({ value, onUpdate, preferences }: EditorProps) {
  const results = textToResults(value, preferences);
  const resultsRef = useRef(results);
  resultsRef.current = results;

  const onChange = (value: string) => {
    resultsRef.current = textToResults(value, preferences);
    onUpdate(value);
  };

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
