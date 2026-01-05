# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application

```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm start            # Run production server
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check formatting without writing
```

### Testing

```bash
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode

# Run specific test file
npm test -- lib/engine/integration.test.ts

# Run tests matching a pattern
npm test -- -t "should handle operator prefix"
```

### Pre-Commit Workflow

```bash
npm run lint && npm test && npm run format
```

## Core Architecture

### Calculation Engine (`lib/engine/`)

The engine uses a **three-phase pipeline** to evaluate mathematical expressions:

1. **Tokenizer** (`tokenizer.ts`) → Breaks text into tokens
2. **Parser** (`parser.ts`) → Builds Abstract Syntax Tree (AST)
3. **Evaluator** (`evaluator.ts`) → Evaluates AST to produce results

Key files:

- `index.ts` - Public API: `evaluateDocument()`, `computeResults()`
- `formatter.ts` - Number formatting with locale support
- `types.ts` - Type definitions for tokens, AST nodes, results

### Adapter Pattern for Extensibility

All mathematical operations use the **adapter pattern** via registries in `lib/engine/adapters/registry.ts`:

- **Functions** (`adapters/functions/`) - Single-arg functions: `sqrt()`, `round()`, etc.
- **Operators** (`adapters/operators/`) - Binary (`+`, `-`) and unary (`-x`) operators
- **Aggregates** (`adapters/aggregates/`) - Multi-value: `sum`, `avg`, `min`, `max`
- **Formats** (`adapters/formats/`) - Units and suffixes: `$`, `km`, `K`, `M`, `B`

Each adapter implements an interface from `adapters/base.ts` and is registered in the central registry.

### Document Evaluation Flow

`evaluateDocument()` processes text line-by-line:

1. Maintains an `ExecutionContext` with variables and previous line results
2. Each line goes through: tokenize → parse → evaluate → format
3. Special handling for:
   - **Operator-prefix syntax**: Lines starting with `+`, `-`, `*`, `/` operate on previous result
   - **Error recovery**: When undefined variables are followed by non-operators, skip prose and retry parsing
   - **Separators**: Lines with `---` reset the execution context
   - **Previous result references**: `prev` or `previous` keywords reference the last non-error, non-empty result

### Error Handling

Two error propagation prevention mechanisms:

1. **In evaluator.ts** (`evaluatePreviousResult`): Skips error results when looking for previous value
2. **In index.ts**: Fallback to unary parsing for first-line expressions like `-5`, `--5` without spaces

### CodeMirror Integration (`components/codemirror/`)

Custom extensions for the editor:

- `ResultsGutter.ts` - Right gutter displaying live calculation results
- `ErrorDecorations.ts` - Red underlines and inline error messages (skips zero-length decorations)
- `AggregateDecorations.ts` - Blue border showing which lines feed into aggregate functions
- `Completions.ts` - Autocomplete for functions, variables, keywords
- `MathpadLang.ts` - Custom language mode with syntax highlighting

## Adding New Features

### Adding a Math Function

1. Create `lib/engine/adapters/functions/myfunction.ts`:

```typescript
import Big from "big.js"
import { FunctionAdapter } from "../base"

export class MyFunction implements FunctionAdapter {
  name = "myfunction"
  description = "Description shown in autocomplete"

  execute(value: Big): Big {
    return value.times(2)
  }

  validate?(value: Big): string | null {
    if (value.lt(0)) return "Cannot process negative numbers"
    return null
  }
}
```

2. Create test file `lib/engine/adapters/functions/myfunction.test.ts` as a sibling

3. Register in `lib/engine/adapters/registry.ts`:

```typescript
import { MyFunction } from "./functions/myfunction"
functionRegistry.register(new MyFunction())
```

4. Run: `npm run lint && npm test && npm run format`

### Adding a Binary Operator

Similar to functions, but implements `BinaryOperatorAdapter`:

- Must specify `symbol` (e.g., `"+"`)
- Has `executeNumbers()`, `executePercents()`, etc. for different operand types
- Registered in `binaryOperatorRegistry`

### Adding an Aggregate Function

1. Create adapter implementing `AggregateFunctionAdapter` in `adapters/aggregates/`
2. Update `AggregateFunctionName` type in `adapters/base.ts`
3. Register in `aggregateFunctionRegistry`

See existing adapters for examples.

## Testing Conventions

- **Tests live as siblings of source files** (not in `__tests__/` directories)
  - `tokenizer.ts` → `tokenizer.test.ts` (same directory)
  - This follows Go conventions for better discoverability
- Integration tests in `lib/engine/integration.test.ts`
- Use descriptive test names: `"should handle operator prefix without space (+1)"`
- Test both happy paths and edge cases (errors, edge values, type mismatches)

## Important Implementation Details

### Big.js for Precision

All calculations use `big.js` to avoid IEEE 754 floating-point errors:

- `0.1 + 0.2` = `0.3` (not `0.30000000000004`)
- Critical for financial calculations
- All numeric operations should use `Big` type, not JavaScript `number`

### Operator-Prefix Syntax

Lines starting with operators (e.g., `+1`, `*2`) operate on the previous result:

```
100
+10    → 110 (previous result + 10)
*2     → 220 (previous result * 2)
```

**Parser logic** (`parser.ts:71-108`):

- Checks if first token is a binary operator
- Creates implicit `previousResult` AST node with `position: 0, length: 0`
- No whitespace requirement (both `+1` and `+ 1` work)

**Special case for first line** (`index.ts:225-297`):

- If line starts with `+` or `-` WITHOUT space and there's no previous result, treat as unary
- Example: `-5` on first line → `-5` (unary negation, not error)
- Example: `+ 2` on first line → Error (has space, expects previous result)

### Error Decoration Edge Case

`ErrorDecorations.ts:65-72` checks `error.length > 0` before creating underline decorations because:

- Operator-prefix creates implicit `previousResult` nodes with `length: 0`
- CodeMirror requires `from !== to` for mark decorations
- Inline error messages still display even without underlines

### Context and Variables

- Variables stored in `ExecutionContext.variables: Map<string, EvalResult>`
- Previous results in `ExecutionContext.lineResults: EvalResult[]`
- Separators (`---`) reset context (new variables, fresh lineResults)
- Multi-word variable names supported: `total price = 100`

## Common Pitfalls

1. **Don't use JavaScript `number` in calculations** - Always use `Big` from `big.js`
2. **Register all adapters** - Forgetting to register in `registry.ts` means the feature won't work
3. **Test files must be siblings** - Don't create `__tests__/` directories
4. **Empty error decorations** - Check `error.length > 0` before creating mark decorations
5. **Operator-prefix edge cases** - Remember the unary fallback logic for first-line expressions

## Date/Time Operations

The engine supports comprehensive date and time operations:

### Date Literals

- **ISO format**: `2024-01-15`, `2024-01-15T10:30:45`
- **Keywords**: `today`, `now`, `yesterday`, `tomorrow`
- Display format: ISO (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)

### Duration Units

- `ms`, `sec`, `min`, `hr`, `day`
- Format adapters in `adapters/formats/`: `day.ts`, `ms.ts`, `hr.ts`, `min.ts`, `sec.ts`

### Date Arithmetic

```
2024-01-15 + 5day        → 2024-01-20 (Date + Duration)
2024-01-15 - 5day        → 2024-01-10 (Date - Duration)
2024-01-15 - 2024-01-01  → 14day (Date - Date)
now + 300hr              → Future date (Relative operations)
5day + 2day              → 7day (Duration + Duration)
10day / 5day             → 2 (Duration / Duration = dimensionless number)
```

### Date Functions

**Extraction functions** (require date argument):

- `year(date)`, `month(date)`, `dayOfMonth(date)`
- `hourOfDay(date)`, `minuteOfHour(date)`, `secondOfMinute(date)`
- Aliases: `day()`, `hour()`, `minute()`, `second()`

**Constructor functions** (no arguments):

- `today()` - Current date at midnight UTC
- `now()` - Current date and time

### Adding Date-Aware Functions

Functions can handle both numeric and date inputs:

```typescript
export class MyDateFunction implements FunctionAdapter {
  name = "myfunction"
  description = "Works with dates"

  execute(_value: Big): Big {
    throw new Error("myfunction() requires a date argument")
  }

  executeDate(value: Date): Big | Date {
    // Return Big for numeric result, Date for date result
    return new Big(value.getUTCFullYear())
  }

  validateDate?(value: Date): string | null {
    if (isNaN(value.getTime())) return "Invalid date"
    return null
  }
}
```

### Implementation Notes

1. **Date Storage**: JavaScript `Date` objects stored as UTC
2. **Duration Storage**: `Big` values in milliseconds internally, displayed with unit
3. **Type Conversion**: Numbers with time units (e.g., `5day`) are converted to `DurationResult` before operations
4. **Date Validation**: Tokenizer accepts broad ranges, evaluator validates actual dates
5. **Result Types**: `DateResult` has `value: Date`, `DurationResult` has `value: Big` + `unit`
6. **Operator Support**: Binary operators have optional methods like `executeDateDuration()`, `executeDurationDuration()`
7. **Function Name Conflicts**: Use descriptive names (`dayOfMonth`, `hourOfDay`) to avoid conflicts with format parsers

### Example Usage

```
// Project planning
project start = 2024-01-15
sprint length = 14day
sprint end = project start + sprint length

// Relative dates
deadline = today + 30day
in 300 hours = now + 300hr

// Date extraction
event = 2024-06-15T18:00:00
event year = year(event)
event month = month(event)
```

## Key Type Definitions

- `Token` - Lexical token from tokenizer (includes `"date"` type)
- `ASTNode` - Abstract syntax tree node (union of 14+ node types, includes `DateLiteralNode`)
- `EvalResult` - Evaluation result: `NumberResult | PercentResult | DateResult | DurationResult | ErrorResult | EmptyResult`
- `DateResult` - `{ type: "date", value: Date, format?: FormatSuffix }`
- `DurationResult` - `{ type: "duration", value: Big, unit: "ms"|"sec"|"min"|"hr"|"day", format?: FormatSuffix }`
- `ExecutionContext` - Stores variables and previous line results
- `LineEvaluation` - Result for a single line (includes result, formatted string, context)
