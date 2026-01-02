import { CompletionContext, Completion } from '@codemirror/autocomplete';
import { functionRegistry, AGGREGATE_FUNCTIONS, AGGREGATE_FUNCTION_DESCRIPTIONS, AggregateFunctionName } from '@/lib/engine/constants';

// Build completions from constants
const mathpadFunctions: Completion[] = [
  // Math functions (from adapter registry)
  ...functionRegistry.getAllAdapters().map((adapter) => ({
    label: adapter.name,
    type: 'function' as const,
    info: adapter.description,
  })),
  // Aggregate functions (use primary name only, not aliases)
  ...(Object.keys(AGGREGATE_FUNCTIONS) as AggregateFunctionName[]).map((name) => ({
    label: name,
    type: 'function' as const,
    info: AGGREGATE_FUNCTION_DESCRIPTIONS[name],
  })),
];

export function completions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  } else {
    const vars: Completion[] = Array.from(
      context.state.doc.toString().matchAll(/(^|\n)(\w*)\s+=.*/g),
      (m: RegExpMatchArray) => m[2]
    ).map((v) => ({ label: v, type: 'variable' }));

    return {
      from: word.from,
      options: mathpadFunctions.concat(vars),
    };
  }
}
