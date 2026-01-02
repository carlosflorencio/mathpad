# MathPad

A modern calculator application with live results and variables. Built with Next.js, TypeScript, CodeMirror 6, and Tailwind CSS.

Inspired by:
- [NoteCalc3](https://github.com/bbodi/notecalc3)
- [CalcPad](https://github.com/filipesabella/CalcPad)
- [Numbr](https://github.com/antonmedv/numbr)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

### Editor
- **CodeMirror 6** with custom right gutter for live results
- **Syntax highlighting** for mathematical expressions
- **Auto-completion** for functions and variables
- **JetBrains Mono** font

### Calculations
- **Basic arithmetic**: `+`, `-`, `*`, `/`, `^`, `%`
- **Math functions**: `round()`, `ceil()`, `floor()`, `abs()`, `sqrt()`
- **Aggregate functions**: `sum`, `avg`, `min`, `max`, `count`
- **Variables**: `salary = 100000`
- **Percentages**: `100 + 20%`, `20% of 100`
- **Number formats**: `10k`, `1M`, `1,000,000`

### Preferences
- **Dark/Light theme** with system detection
- **Decimal places** (0-20)
- **Number formatting** (decimal/thousands separators)
- **Font size** adjustment
- **LocalStorage** persistence
- **URL sharing** via hash

### Keyboard Shortcuts
- `ESC` - Close dialogs
- `Tab` - Accept autocomplete
- `Ctrl+Space` - Trigger autocomplete
- `Ctrl+F` - Find & replace
- `Ctrl+Z` / `Ctrl+Shift+Z` - Undo/Redo

## Project Structure

```
app/
  layout.tsx              # Root layout
  page.tsx                # Main page
  globals.css             # Global styles

components/
  App.tsx                 # Main app container
  Editor.tsx              # Editor wrapper
  PreferencesDialog.tsx   # Settings modal
  codemirror/             # CodeMirror extensions
    CodeMirror.tsx
    Completions.ts
    DarkTheme.ts
    LightTheme.ts
    MathpadLang.ts
    ResultsGutter.ts

lib/
  engine/                 # Calculation engine
    adapters/             # Adapter pattern for extensibility
      functions/          # Math functions (round, ceil, etc.)
      operators/          # Binary & unary operators
      aggregates/         # Aggregate functions (sum, avg, etc.)
      base.ts             # Adapter interfaces
      registry.ts         # Central registry
    evaluator.ts          # AST evaluator
    parser.ts             # Expression parser
    tokenizer.ts          # Tokenizer
    formatter.ts          # Number formatter
    types.ts              # Type definitions
    index.ts              # Public API
  types.ts                # App types
  use-local-storage.ts    # Persistence hook
```

## Engine Architecture

The calculation engine uses an **adapter pattern** for easy extensibility:

### Adding a New Math Function

1. Create `lib/engine/adapters/functions/myfunction.ts`:
```typescript
import Big from 'big.js';
import { FunctionAdapter } from '../base';

export class MyFunction implements FunctionAdapter {
  name = 'myfunction';
  description = 'Description for autocomplete';
  
  execute(value: Big): Big {
    return value.times(2); // Your logic here
  }
  
  validate?(value: Big): string | null {
    // Optional validation
    return null;
  }
}
```

2. Register in `lib/engine/adapters/registry.ts`:
```typescript
import { MyFunction } from './functions/myfunction';
functionRegistry.register(new MyFunction());
```

3. Create test file `myfunction.test.ts` as a sibling

### Adapter Types

- **FunctionAdapter** - Single-argument functions (e.g., `sqrt(x)`)
- **BinaryOperatorAdapter** - Binary operators (e.g., `+`, `-`)
- **UnaryOperatorAdapter** - Unary operators (e.g., `-x`)
- **AggregateFunctionAdapter** - Multi-value functions (e.g., `sum`, `avg`)

See `lib/engine/adapters/base.ts` for full interface documentation.

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

Tests are co-located with source files:
- `round.ts` + `round.test.ts`
- `add.ts` + `add.test.ts`
- Integration tests in `lib/engine/__tests__/`

## Technologies

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **CodeMirror 6** - Editor
- **Big.js** - Arbitrary precision arithmetic (prevents floating-point errors)
- **Tailwind CSS 4** - Styling
- **Vitest** - Testing

## Why Big.js?

JavaScript's native numbers use IEEE 754 floating-point, which causes precision issues:
- `0.1 + 0.2 = 0.30000000000004` ❌
- With Big.js: `0.1 + 0.2 = 0.3` ✅

This is critical for financial calculations where precision matters.

## License

MIT
