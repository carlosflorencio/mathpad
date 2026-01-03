import { CompletionContext, Completion } from "@codemirror/autocomplete"
import { functionRegistry, aggregateFunctionRegistry } from "@/lib/engine/adapters/registry"

// Build completions from adapter registries
const mathpadFunctions: Completion[] = [
  // Math functions (from adapter registry)
  ...functionRegistry.getAllAdapters().map((adapter) => ({
    label: adapter.name,
    type: "function" as const,
    info: adapter.description,
  })),
  // Aggregate functions (from adapter registry)
  ...aggregateFunctionRegistry.getAllAdapters().map((adapter) => ({
    label: adapter.name,
    type: "function" as const,
    info: adapter.description,
  })),
]

/**
 * Case-sensitive filter for completions
 * Only show completions where the label starts with the typed text (case-sensitive)
 */
function caseSensitiveFilter(completions: Completion[], query: string): Completion[] {
  if (!query) return completions
  return completions.filter((c) => c.label.startsWith(query))
}

export function completions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/)
  if (!word || (word.from === word.to && !context.explicit)) {
    return null
  } else {
    const query = context.state.doc.sliceString(word.from, word.to)

    const vars: Completion[] = Array.from(
      context.state.doc.toString().matchAll(/(^|\n)(\w*)\s+=.*/g),
      (m: RegExpMatchArray) => m[2]
    ).map((v) => ({ label: v, type: "variable" }))

    const allCompletions = mathpadFunctions.concat(vars)

    return {
      from: word.from,
      options: caseSensitiveFilter(allCompletions, query),
      filter: false, // Disable CodeMirror's default filtering since we're doing it ourselves
    }
  }
}
