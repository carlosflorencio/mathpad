# Agent Guidelines

This document provides guidelines for AI agents working on this codebase.

## Development Workflow

### 1. After Making Changes

Always run these commands in order:

```bash
# 1. Run linter to catch code quality issues
npm run lint

# 2. Run tests to ensure nothing broke
npm test

# 3. Format code for consistency
npm run format
```

### 2. Before Committing

```bash
# Run all checks together
npm run lint && npm test && npm run format
```

## Adding New Features

### Adding a New Math Function

1. Create adapter file: `lib/engine/adapters/functions/{name}.ts`
2. Create test file: `lib/engine/adapters/functions/{name}.test.ts`
3. Register in `lib/engine/adapters/registry.ts`
4. Run lint and tests

Example structure:

```typescript
// lib/engine/adapters/functions/log.ts
import Big from "big.js"
import { FunctionAdapter } from "../base"

export class LogFunction implements FunctionAdapter {
  name = "log"
  description = "Natural logarithm"

  validate(value: Big): string | null {
    if (value.lte(0)) return "Cannot take log of non-positive number"
    return null
  }

  execute(value: Big): Big {
    return new Big(Math.log(value.toNumber()))
  }
}
```

### Adding a New Operator

1. Create adapter file: `lib/engine/adapters/operators/{name}.ts`
2. Create test file: `lib/engine/adapters/operators/{name}.test.ts`
3. Register in `lib/engine/adapters/registry.ts`
4. Run lint and tests

### Adding a New Aggregate Function

1. Create adapter file: `lib/engine/adapters/aggregates/{name}.ts`
2. Create test file: `lib/engine/adapters/aggregates/{name}.test.ts`
3. Update `AggregateFunctionName` type in `lib/engine/adapters/base.ts`
4. Register in `lib/engine/adapters/registry.ts`
5. Run lint and tests

## Code Quality Standards

### ESLint Rules

- Remove unused imports
- Avoid `any` types - use specific types
- Use `const` instead of `let` when values aren't reassigned
- Don't update refs during render (React components)

### Testing

- All features must have unit tests
- Tests should cover happy path and edge cases
- Use descriptive test names: `"should return error for negative input"`

### Code Style

- Use Prettier for formatting (runs automatically with `npm run format`)
- Double quotes, 100 char line width, 2 space indentation
- Tests as siblings: `feature.ts` + `feature.test.ts`

## Architecture

### Adapter Pattern

This codebase uses the adapter pattern for extensibility:

- **Functions** (`lib/engine/adapters/functions/`): Single-argument math functions
- **Operators** (`lib/engine/adapters/operators/`): Binary and unary operators
- **Aggregates** (`lib/engine/adapters/aggregates/`): Functions that operate on collections

### Key Principles

1. **Single Responsibility**: Each adapter does one thing well
2. **Open/Closed**: Add features by creating new adapters, not modifying existing code
3. **Central Registry**: All adapters registered in `lib/engine/adapters/registry.ts`
4. **Type Safety**: Use TypeScript interfaces for all adapters

## Common Issues

### TypeScript Errors

```bash
# Check for type errors
npx tsc --noEmit
```

### Test Failures

- Read the error message carefully
- Check that adapter is registered correctly
- Verify input/output types match expectations
- Ensure validation logic is correct

### Import Errors

- Use relative imports within `lib/engine/`
- Import from `./adapters/registry` not old files
- Don't import from deleted files (`constants.ts`, `functions.ts`, `operators.ts`)

## Need Help?

- Check README.md for project overview
- Look at existing adapters for examples
- Review tests to understand expected behavior
