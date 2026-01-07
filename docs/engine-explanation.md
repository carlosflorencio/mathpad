# Mathpad Calculation Engine - Technical Explanation

## Overview

The Mathpad calculation engine is a **three-phase pipeline** that transforms plain text containing mathematical expressions into evaluated results with formatted output. It processes entire documents line-by-line while maintaining context (variables, previous results) across lines.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         Document Input                            │
│                    "price = 100\ntax = 20%"                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │   evaluateDocument()         │
              │   (lib/engine/index.ts)      │
              └──────────────┬───────────────┘
                             │
              ┌──────────────┴───────────────┐
              │   Line-by-line iteration     │
              │   Context: { variables,      │
              │              lineResults }   │
              └──────────────┬───────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
  ┌─────────┐         ┌─────────┐         ┌─────────┐
  │ Phase 1 │         │ Phase 2 │         │ Phase 3 │
  │Tokenize │────────▶│  Parse  │────────▶│Evaluate │
  └─────────┘         └─────────┘         └─────────┘
        │                    │                    │
        ▼                    ▼                    ▼
   [Tokens]           [AST Nodes]         [EvalResult]
        │                    │                    │
        │                    │                    ▼
        │                    │            ┌─────────────┐
        │                    │            │  Formatter  │
        │                    │            └──────┬──────┘
        │                    │                   │
        └────────────────────┴───────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │   Update ExecutionContext    │
              │   - Store variables          │
              │   - Add to lineResults       │
              └──────────────┬───────────────┘
                             │
                             ▼
                   [Next Line or Done]
```

## Core Concepts

### 1. Execution Context

The engine maintains state across lines using an `ExecutionContext`:

```typescript
interface ExecutionContext {
  variables: Map<string, EvalResult>  // User-defined variables
  lineResults: EvalResult[]           // Results from previous lines
  currentLine: number                 // Current line number (0-indexed)
}
```

**Key behaviors:**
- Variables are scoped to the current section (reset by `---` separator)
- Previous results are accessible via `prev`, `previous`, or operator-prefix syntax
- Context is immutable - each evaluation returns a new context

### 2. Three-Phase Pipeline

#### Phase 1: Tokenization (`tokenizer.ts`)

**Purpose:** Convert raw text into a stream of tokens

**Input:** `"price = 100$"`

**Output:**
```typescript
[
  { type: "identifier", value: "price", position: 0, length: 5 },
  { type: "assign", value: "=", position: 6, length: 1 },
  { type: "number", value: "100$", position: 8, length: 4 },
  { type: "eof", value: "", position: 12, length: 0 }
]
```

**Key features:**
- Handles numbers with thousands separators: `1,000,000` or `1 000 000`
- Recognizes format suffixes: `$`, `€`, `km`, `K`, `M`, `B`, etc.
- Supports multi-word identifiers: `"total price = 100"`
- Distinguishes operators from prose based on context
- Handles date literals: `2024-01-15`, `2024-01-15T10:30:45`
- Recognizes date keywords: `today`, `now`, `yesterday`, `tomorrow`
- Recognizes duration units: `5day`, `300hr`, `30min`

**Prose detection:**
Lines without numbers, operators, or aggregate keywords are treated as plain text (comments) and tokenized as empty.

**Context-aware tokenization:**
The tokenizer receives the current execution context to distinguish defined variables from undefined prose:
- `"x + 10"` where `x` is defined → tokenizes as expression
- `"x + 10"` where `x` is NOT defined → may be skipped as prose, handled by parser

#### Phase 2: Parsing (`parser.ts`)

**Purpose:** Build an Abstract Syntax Tree (AST) from tokens

**Input:** Token stream from tokenizer

**Output:** AST node representing the expression structure

**Example:**
Input: `"price * 1.2"`

AST:
```typescript
{
  kind: "binary",
  operator: "*",
  left: {
    kind: "identifier",
    name: "price",
    position: 0,
    length: 5
  },
  right: {
    kind: "number",
    value: "1.2",
    position: 8,
    length: 3
  },
  position: 0,
  length: 11
}
```

**Parser structure:**
Uses **recursive descent parsing** with precedence climbing:
1. Assignment (lowest precedence)
2. Formatting/Conversion (`in`, `to`)
3. Addition/Subtraction
4. Multiplication/Division/Modulo
5. Exponentiation (right-associative)
6. Unary operators (`-`, `+`)
7. Postfix operators (`++`, `--`)
8. Primary (numbers, identifiers, parentheses) (highest precedence)

**Special parsing rules:**

**Operator-prefix syntax:**
Lines starting with a binary operator operate on the previous result:
```
100
+10   → Parsed as: previousResult + 10
*2    → Parsed as: previousResult * 2
```

Implementation: `parser.ts:72-105`
- Detects operator as first token
- Creates implicit `previousResult` node with `position: 0, length: 0`
- No whitespace required between operator and operand

**Assignment syntax:**
Supports multiple assignment patterns:
- `variable = expression` - Simple assignment
- `variable in FORMAT = expression` - Formatted assignment (e.g., `price in $ = 100`)

**Function calls:**
Identifier followed by `(...)` is parsed as function call:
- `sqrt(16)` → function call node with argument

#### Phase 3: Evaluation (`evaluator.ts`)

**Purpose:** Execute the AST and produce a result

**Input:** AST node + ExecutionContext

**Output:** `[EvalResult, ExecutionContext]` (pure function, returns new context)

**Result types:**
```typescript
type EvalResult =
  | NumberResult    // { type: "number", value: Big, format?: string }
  | PercentResult   // { type: "percent", value: Big, format?: string }
  | DateResult      // { type: "date", value: Date, format?: string }
  | DurationResult  // { type: "duration", value: Big, unit: "ms"|"sec"|"min"|"hr"|"day" }
  | ErrorResult     // { type: "error", message: string, position: number, length: number }
  | EmptyResult     // { type: "empty" }
```

**Evaluation dispatch:**
The evaluator uses pattern matching on AST node types:

```typescript
switch (node.kind) {
  case "number": return evaluateNumber(node, context)
  case "binary": return evaluateBinary(node, context)
  case "identifier": return evaluateIdentifier(node, context)
  case "assignment": return evaluateAssignment(node, context)
  case "function": return evaluateFunction(node, context)
  case "aggregate": return evaluateAggregate(node, context)
  case "dateLiteral": return evaluateDateLiteral(node, context)
  // ... etc
}
```

**Number precision:**
All calculations use `big.js` to avoid floating-point errors:
```typescript
Big.DP = 20              // 20 decimal places
Big.RM = Big.roundHalfUp // Round half up
```

This ensures `0.1 + 0.2 = 0.3` (not `0.30000000000004`).

### 3. Adapter Pattern

All mathematical operations use the **adapter pattern** for extensibility. Adapters are registered in central registries.

#### Registries (`adapters/registry.ts`)

```typescript
// Function registry (single-argument functions)
functionRegistry.register(new SqrtFunction())
functionRegistry.register(new RoundFunction())

// Binary operator registry
binaryOperatorRegistry.register(new AdditionOperator())
binaryOperatorRegistry.register(new MultiplicationOperator())

// Unary operator registry
unaryOperatorRegistry.register(new NegationOperator())

// Aggregate function registry
aggregateFunctionRegistry.register(new SumAggregate())
aggregateFunctionRegistry.register(new AvgAggregate())

// Format registry
formatRegistry.registerParser(new DollarFormat())
formatRegistry.registerParser(new KiloFormat())
```

#### Adapter interfaces (`adapters/base.ts`)

**FunctionAdapter:**
```typescript
interface FunctionAdapter {
  name: string
  description: string
  execute(value: Big): Big
  executeDate?(value: Date): Big | Date  // Optional date support
  validate?(value: Big): string | null
  validateDate?(value: Date): string | null
}
```

**BinaryOperatorAdapter:**
```typescript
interface BinaryOperatorAdapter {
  symbol: string
  executeNumbers(left: Big, right: Big): Big
  executePercents?(left: Big, right: Big): Big
  executeDateDuration?(left: Date, right: Big, rightUnit: DurationUnit): Date
  executeDurationDuration?(left: Big, leftUnit: DurationUnit, right: Big, rightUnit: DurationUnit): Big
  // ... more type combinations
}
```

**AggregateFunctionAdapter:**
```typescript
interface AggregateFunctionAdapter {
  keywords: string[]
  functionName: AggregateFunctionName
  execute(values: Big[]): Big
}
```

**FormatParserAdapter:**
```typescript
interface FormatParserAdapter {
  id: string
  keywords: string[]
  parse(text: string): Big | null
  canConvert?(from: string, to: string): boolean
  convert?(value: Big, from: string, to: string): Big
}
```

**Example adapter:**

```typescript
// adapters/functions/sqrt.ts
export class SqrtFunction implements FunctionAdapter {
  name = "sqrt"
  description = "Square root"

  execute(value: Big): Big {
    const num = value.toNumber()
    if (num < 0) throw new Error("Cannot take square root of negative number")
    return new Big(Math.sqrt(num))
  }

  validate(value: Big): string | null {
    if (value.lt(0)) return "Cannot take square root of negative number"
    return null
  }
}
```

### 4. Format System

The format system handles unit suffixes and conversions.

#### Format Parser

**Purpose:** Parse and convert formatted numbers

**Example formats:**
- Currency: `$`, `€`, `£`, `¥`
- Large numbers: `K` (1,000), `M` (1,000,000), `B` (1,000,000,000)
- Distance: `km`, `m`, `cm`, `mm`, `mi`, `ft`, `in`
- Time: `day`, `hr`, `min`, `sec`, `ms`
- Speed: `km/h`, `m/s`, `mph`

**Conversion:**
```
100km to m   → 100,000
5hr to min   → 300
```

**Implementation:**
```typescript
// adapters/formats/kilometer.ts
export class KilometerFormat implements FormatParserAdapter {
  id = "km"
  keywords = ["km", "kilometer", "kilometers", "kilometre", "kilometres"]

  parse(text: string): Big | null {
    const match = text.toLowerCase().match(/^([\d.,\s]+)\s*(km|kilometer|kilometre)s?$/)
    if (!match) return null
    return parseNumber(match[1]).times(1000) // Convert to meters internally
  }

  canConvert(from: string, to: string): boolean {
    return ["km", "m", "cm", "mm", "mi", "ft", "in"].includes(to)
  }

  convert(value: Big, from: string, to: string): Big {
    // Convert from meters to target unit
    const conversionFactors = {
      km: 0.001,
      m: 1,
      cm: 100,
      // ... etc
    }
    return value.times(conversionFactors[to])
  }
}
```

### 5. Date and Time Operations

The engine supports comprehensive date/time operations.

#### Date Literals

**Supported formats:**
- ISO dates: `2024-01-15`
- ISO datetimes: `2024-01-15T10:30:45`
- Keywords: `today`, `now`, `yesterday`, `tomorrow`

**Tokenization:** Dates are recognized in the tokenizer before number parsing to avoid treating `2024-01-15` as arithmetic.

**Storage:** JavaScript `Date` objects in UTC

#### Duration Values

**Duration units:** `ms`, `sec`, `min`, `hr`, `day`

**Internal representation:**
- Stored as `Big` values in milliseconds
- Tagged with unit for display

**Type conversion:**
Numbers with duration units (e.g., `5day`) are converted to `DurationResult` before operations.

#### Date Arithmetic

**Supported operations:**
```
Date + Duration = Date        // 2024-01-15 + 5day → 2024-01-20
Date - Duration = Date        // 2024-01-15 - 5day → 2024-01-10
Date - Date = Duration        // 2024-01-15 - 2024-01-01 → 14day
Duration + Duration = Duration // 5day + 2day → 7day
Duration / Duration = Number   // 10day / 5day → 2
```

**Implementation:**
Binary operators have optional methods for date operations:
```typescript
class AdditionOperator implements BinaryOperatorAdapter {
  symbol = "+"

  executeNumbers(left: Big, right: Big): Big {
    return left.plus(right)
  }

  executeDateDuration(left: Date, right: Big, rightUnit: DurationUnit): Date {
    const ms = convertToMilliseconds(right, rightUnit)
    return new Date(left.getTime() + ms.toNumber())
  }

  executeDurationDuration(
    left: Big, leftUnit: DurationUnit,
    right: Big, rightUnit: DurationUnit
  ): Big {
    const leftMs = convertToMilliseconds(left, leftUnit)
    const rightMs = convertToMilliseconds(right, rightUnit)
    return leftMs.plus(rightMs)
  }
}
```

#### Date Functions

**Extraction functions:**
- `year(date)`, `month(date)`, `dayOfMonth(date)`
- `hourOfDay(date)`, `minuteOfHour(date)`, `secondOfMinute(date)`
- Aliases: `day()`, `hour()`, `minute()`, `second()`

**Constructor functions:**
- `today()` - Current date at midnight UTC
- `now()` - Current date and time

**Implementation:**
Functions can handle both numeric and date inputs:
```typescript
export class YearFunction implements FunctionAdapter {
  name = "year"
  description = "Extract year from date"

  execute(_value: Big): Big {
    throw new Error("year() requires a date argument")
  }

  executeDate(value: Date): Big {
    return new Big(value.getUTCFullYear())
  }

  validateDate(value: Date): string | null {
    if (isNaN(value.getTime())) return "Invalid date"
    return null
  }
}
```

## Special Features

### 1. Operator-Prefix Syntax

Lines starting with operators automatically reference the previous result:

```
100
+10    → 110 (previous result + 10)
*2     → 220 (previous result * 2)
-50    → 170 (previous result - 50)
```

**Unary fallback:**
On the **first line**, operators without space are treated as unary:
```
-5     → -5 (unary negation)
--5    → 5 (double negation)
+ 2    → Error (no previous result, has space)
```

Implementation: `index.ts:277-353`

### 2. Previous Result References

Explicit references to previous results using keywords:

```
100
prev + 10      → 110
previous * 2   → 220
```

**Error skipping:**
The evaluator skips error results when looking for the previous value:
```
100
invalid + 5    → Error
prev + 10      → 110 (skips the error, uses 100)
```

Implementation: `evaluator.ts` in `evaluatePreviousResult()`

### 3. Aggregate Functions

Aggregate functions operate on multiple lines:

```
10
20
30
sum     → 60
avg     → 20
min     → 10
max     → 30
count   → 3
```

**Implementation:**
- Aggregate nodes are identified during parsing
- During evaluation, they collect all previous non-empty, non-error results
- Results are highlighted in the editor with blue borders

### 4. Multi-Word Variables

Variables can contain spaces:

```
total price = 100
tax rate = 20%
final cost = total price * (1 + tax rate)
```

**Tokenizer logic:**
- Collects letters, numbers, and spaces
- Stops at special keywords (`of`, `in`, `to`)
- Context-aware: stops if next word is a defined variable

### 5. Inline Comments

Support for inline and full-line comments:

```
# This is a full-line comment
price = 100  // This is an inline comment
tax = 20%    # This works too
```

**Extraction:**
- Comments are extracted before tokenization
- Stored in `LineEvaluation.comment`
- Preserved through evaluations

### 6. Separators

Horizontal rules reset the execution context:

```
x = 10
x + 5    → 15
---
x + 5    → Error (x is no longer defined)
```

**Use case:** Separate independent calculations in the same document

### 7. Error Recovery

The engine attempts to recover from errors gracefully:

**Undefined variable fallback:**
If an undefined variable is followed by non-operators, the engine tries to skip prose and re-parse:

```
"some text price + 10"
```
- First parse: Error ("some" not defined)
- Retry: Skip "some text", parse "price + 10"

Implementation: `index.ts:170-274`

**Error decoration edge case:**
Operator-prefix creates implicit nodes with `length: 0`. The error decorator checks `error.length > 0` before creating underlines to avoid CodeMirror errors.

### 8. Unit Arithmetic

Automatic unit conversion in arithmetic:

```
100km + 5000m  → 105km (auto-converts to common unit)
10km / 2hr     → 5km/h (derives compound unit)
```

Implementation: `unitArithmetic.ts`

## Formatting

The formatter converts `EvalResult` to display strings.

**Formatter** (`formatter.ts`):

```typescript
function formatResult(result: EvalResult, options: FormatOptions): string
```

**Format options** (from `Preferences`):
- `decimalPlaces: number` - Number of decimal places (2-8)
- `decimalSeparator: "," | "."` - Decimal separator
- `thousandsSeparator: "," | "." | " " | ""` - Thousands separator

**Example:**
```typescript
// Input: NumberResult { value: Big(1234567.89), format: "$" }
// Options: { decimalPlaces: 2, decimalSeparator: ".", thousandsSeparator: "," }
// Output: "$1,234,567.89"
```

**Number formatting:**
1. Round to specified decimal places
2. Split into integer and fractional parts
3. Add thousands separators
4. Add format prefix/suffix (e.g., `$`, `km`)
5. Apply decimal separator

## Integration with CodeMirror

The engine integrates with CodeMirror through several custom extensions:

### 1. Results Gutter (`ResultsGutter.ts`)

Displays calculated results on the right side of each line.

**Data flow:**
1. `Editor` component calls `evaluateDocument(text, preferences)`
2. Extracts `formatted` strings from `LineEvaluation[]`
3. Passes to CodeMirror via `setResultsEffect`
4. Results gutter extension reads from `resultsField` state
5. Renders formatted results aligned with line numbers

### 2. Error Decorations (`ErrorDecorations.ts`)

Shows red underlines and inline error messages.

**Data flow:**
1. Filter `LineEvaluation[]` for error results
2. Extract `ErrorInfo` (lineNumber, position, length, message)
3. Pass to CodeMirror via `setErrorsEffect`
4. Creates mark decorations for underlines
5. Creates widget decorations for inline messages

**Edge case handling:**
Skips zero-length errors (from implicit previousResult nodes) because CodeMirror requires `from !== to` for mark decorations.

### 3. Aggregate Decorations (`AggregateDecorations.ts`)

Shows blue borders around lines that feed into aggregate functions.

**Data flow:**
1. Scan AST for aggregate nodes
2. Determine which previous lines contribute to the aggregate
3. Add line decorations with blue border styling

### 4. Completions (`Completions.ts`)

Provides autocomplete for:
- Variables (from execution context)
- Functions (from function registry)
- Aggregate keywords (from aggregate registry)
- Format suffixes (from format registry)
- Special keywords (`prev`, `previous`, `today`, `now`)

**Context-aware:**
Completions are filtered based on the current token position and type.

### 5. Syntax Highlighting (`MathpadLang.ts`)

Custom language mode with:
- Number highlighting
- Operator highlighting
- Keyword highlighting (functions, aggregates, date keywords)
- Variable highlighting
- Comment highlighting

## Performance Optimizations

### 1. Memoization

The `Editor` component uses `useMemo` to avoid re-computing evaluations when props haven't changed:

```typescript
const evaluations = useMemo(
  () => textToEvaluations(value, preferences),
  [value, preferences]
)
```

### 2. Debounced Updates

Content changes are debounced (200ms) before triggering saves:

```typescript
debouncedUpdateContentRef.current = setTimeout(() => {
  updateContent(content)
}, 200)
```

### 3. Lazy Evaluation

The engine only evaluates visible lines when integrated with virtual scrolling (potential future optimization).

### 4. Adapter Registries

Adapters are registered once at startup. Lookups use Maps for O(1) access:

```typescript
functionRegistry.has("sqrt")      // O(1)
binaryOperatorRegistry.get("+")   // O(1)
```

## Error Handling

### Error Types

**Tokenizer errors:** Rare (mostly just returns empty tokens)

**Parser errors:** Returns empty nodes for unexpected tokens

**Evaluator errors:** Returns `ErrorResult` with:
- `message: string` - Human-readable error message
- `position: number` - Character position of error
- `length: number` - Length of erroneous token

**Common errors:**
- `"Variable 'x' not defined"`
- `"Cannot divide by zero"`
- `"No previous result available"`
- `"Invalid date"`
- `"Cannot convert km to $"` (incompatible units)
- `"sqrt() requires a number argument"`

### Error Display

Errors are shown:
1. **Red underline** - At error position in editor
2. **Inline message** - Below the erroneous line
3. **Empty gutter** - No result shown for error lines

### Error Propagation Prevention

The engine prevents errors from cascading:

**In evaluator:**
`evaluatePreviousResult` skips error results when looking for previous values.

**In document evaluator:**
Each line is evaluated independently. Errors don't affect subsequent lines (unless they reference the error result).

## Testing

### Unit Tests

Each module has a sibling test file:
- `tokenizer.test.ts` - Tests tokenization of various inputs
- `parser.test.ts` - Tests AST generation
- `evaluator.test.ts` - Tests evaluation logic
- Adapter tests (e.g., `sqrt.test.ts`) - Test individual adapters

### Integration Tests

`integration.test.ts` tests the full pipeline:
- Multi-line documents
- Variable assignments
- Previous result references
- Aggregate functions
- Date arithmetic
- Error handling

**Test pattern:**
```typescript
test("should handle operator prefix without space (+1)", () => {
  const result = evaluateDocument("100\n+1", Preferences.default())
  expect(result[0].formatted).toBe("100")
  expect(result[1].formatted).toBe("101")
})
```

## Extension Points

### Adding a New Function

1. Create `adapters/functions/myfunction.ts`
2. Implement `FunctionAdapter` interface
3. Register in `adapters/registry.ts`
4. Add tests in `myfunction.test.ts`

### Adding a New Operator

1. Create `adapters/operators/myoperator.ts`
2. Implement `BinaryOperatorAdapter` or `UnaryOperatorAdapter`
3. Register in `adapters/registry.ts`
4. Add tests

### Adding a New Format

1. Create `adapters/formats/myformat.ts`
2. Implement `FormatParserAdapter` interface
3. Register in `adapters/formats/registry.ts`
4. Add tests

### Adding a New Aggregate Function

1. Create `adapters/aggregates/myaggregate.ts`
2. Implement `AggregateFunctionAdapter` interface
3. Update `AggregateFunctionName` type in `adapters/base.ts`
4. Register in `adapters/registry.ts`
5. Add tests

## Common Patterns

### Pattern 1: Type-Based Dispatch

The evaluator uses type-based dispatch for operations:

```typescript
if (left.type === "number" && right.type === "number") {
  return operator.executeNumbers(left.value, right.value)
} else if (left.type === "date" && right.type === "duration") {
  return operator.executeDateDuration(left.value, right.value, right.unit)
}
// ... more type combinations
```

### Pattern 2: Immutable Context

All evaluations return a new context:

```typescript
function evaluate(node: ASTNode, context: ExecutionContext): [EvalResult, ExecutionContext] {
  // Never mutate context
  const newContext = { ...context }
  newContext.variables = new Map(context.variables)
  return [result, newContext]
}
```

### Pattern 3: Adapter Registration

Centralized registration at startup:

```typescript
// adapters/registry.ts
functionRegistry.register(new SqrtFunction())
functionRegistry.register(new RoundFunction())
// ... all adapters registered here
```

### Pattern 4: Error Result Creation

Consistent error result creation:

```typescript
return [{
  type: "error",
  message: "Variable 'x' not defined",
  position: node.position,
  length: node.length,
}, context]
```

## Debugging Tips

### 1. Tokenizer Issues

Log tokens to see what's being parsed:
```typescript
const tokens = tokenize("100 + 20%")
console.log(tokens)
```

### 2. Parser Issues

Log AST to understand structure:
```typescript
const ast = parse(tokens)
console.log(JSON.stringify(ast, null, 2))
```

### 3. Evaluator Issues

Log intermediate results:
```typescript
const [result, newContext] = evaluate(ast, context)
console.log({ result, variables: Array.from(newContext.variables.entries()) })
```

### 4. Context Issues

Log context at each line:
```typescript
const evaluations = evaluateDocument(text, preferences)
evaluations.forEach(e => {
  console.log(`Line ${e.lineNumber}:`, {
    result: e.result,
    variables: Array.from(e.context.variables.entries())
  })
})
```

## Conclusion

The Mathpad calculation engine is a well-structured, extensible system that:
- Uses a clean three-phase pipeline (tokenize → parse → evaluate)
- Maintains context across lines for variables and previous results
- Supports rich mathematical operations via the adapter pattern
- Handles dates, durations, and unit conversions
- Integrates seamlessly with CodeMirror for live editing
- Uses Big.js for precision
- Provides excellent error messages and recovery

The architecture makes it easy to add new functions, operators, formats, and features without modifying core engine code. The use of immutable data structures and pure functions makes the engine predictable and testable.
