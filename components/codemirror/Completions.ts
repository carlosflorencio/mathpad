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

export function completions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/)
  if (!word || (word.from === word.to && !context.explicit)) {
    return null
  } else {
    const vars: Completion[] = Array.from(
      context.state.doc.toString().matchAll(/(^|\n)(\w*)\s+=.*/g),
      (m: RegExpMatchArray) => m[2]
    ).map((v) => ({ label: v, type: "variable" }))

    return {
      from: word.from,
      options: mathpadFunctions.concat(vars),
    }
  }
}
