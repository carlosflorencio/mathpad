# MathPad Repository Stack

## Core Technologies

**Frontend Framework**
- **Next.js 16.1.1** - React-based framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety throughout

**Editor**
- **CodeMirror 6** - Modern code editor with custom extensions for:
  - Live results gutter (`ResultsGutter.ts`)
  - Error decorations with inline messages
  - Aggregate function visualizations
  - Custom autocomplete
  - Syntax highlighting via custom language mode (`MathpadLang.ts`)

**Styling**
- **Tailwind CSS 4** - Utility-first CSS framework
- **PostCSS** - CSS processing

**Math & Data**
- **Big.js 7.0.1** - Arbitrary precision arithmetic (prevents IEEE 754 floating-point errors)
- **convert-units 2.3.4** - Unit conversions
- Custom calculation engine with tokenizer → parser → evaluator pipeline

## Architecture Pattern

**Adapter Pattern for Extensibility** (`lib/engine/adapters/`)
- **Functions** - Single-arg operations (sqrt, round, ceil, etc.)
- **Operators** - Binary (+, -, *, /) and unary (-x) operators
- **Aggregates** - Multi-value functions (sum, avg, min, max)
- **Formats** - Units and suffixes ($, km, K, M, B, date/time units)
- **Central Registry** - All adapters registered in `registry.ts`

## Development Tools

**Testing**
- **Vitest 4.0.16** - Fast unit test framework with UI
- Tests co-located as siblings (Go convention)

**Code Quality**
- **ESLint 9** - Linting
- **Prettier 3.7.4** - Code formatting

**Storage & Persistence**
- **idb-keyval 6.2.2** - IndexedDB wrapper for notes persistence
- **lz-string 1.5.0** - String compression for URL sharing

## Project Structure

```
app/                      # Next.js App Router
├── page.tsx             # Main route
└── layout.tsx           # Root layout

components/
├── codemirror/          # Custom CodeMirror extensions
└── modals/              # UI dialogs

lib/
├── engine/              # 3-phase calculation engine
│   ├── tokenizer.ts    # Text → Tokens
│   ├── parser.ts       # Tokens → AST
│   ├── evaluator.ts    # AST → Results
│   └── adapters/       # Extensible operations
├── notes/              # Note management
└── preferences/        # Settings persistence

hooks/                   # React hooks
scripts/                 # Build-time scripts
```

## Key Features

- **Date/Time Support** - ISO dates, relative dates (today, now), durations (5day, 300hr)
- **Currency Operations** - Multi-currency with exchange rates
- **Variables** - Multi-word variable names supported
- **Operator-Prefix Syntax** - Lines starting with `+10` operate on previous result
- **Context Separators** - `---` resets execution context
- **LocalStorage + URL Sharing** - State persistence and sharing via hash

## Build & Deploy

- **Deployment** - GitHub workflows configured (`.github/`)
- **Scripts** - Custom `updateExchangeRates.ts` for currency data updates
- **Dev Server** - Runs on `localhost:3000`

This is a modern web calculator with a sophisticated custom math engine built on Next.js + TypeScript + CodeMirror 6, using adapter pattern for extensibility and Big.js for precision arithmetic.
