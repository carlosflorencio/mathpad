# Format Adapters

Format adapters handle number formatting and parsing for different units, scales, and currencies.

## Architecture

The format adapter system follows the same pattern as other adapters in the codebase:

- **Base Interface**: `FormatAdapter` in `base.ts` defines the contract
- **Individual Adapters**: Each format has its own file (e.g., `thousands.ts`)
- **Tests**: Each adapter has a corresponding test file (e.g., `thousands.test.ts`)
- **Registry**: `registry.ts` manages all registered formats

## Built-in Formats

- **K (Thousands)**: `5k` → 5000, `5000` → `5K`
- **M (Millions)**: `5M` → 5000000, `5000000` → `5M`
- **B (Billions)**: `5B` → 5000000000, `5000000000` → `5B`

## Usage in MathPad

### As Input (Parsing)

```
5k + 2k    // 7000
10M * 2    // 20000000
```

### As Output (Formatting)

```
total in K = 5000     // Displays as: 5K
revenue in M = 1000000 // Displays as: 1M
budget in B = 3000000000 // Displays as: 3B
```

## Adding a New Format Adapter

Follow these steps to add a new format (e.g., currency, temperature, etc.):

### 1. Create the Adapter File

Create `lib/engine/adapters/formats/yourformat.ts`:

```typescript
import { FormatAdapter } from "./base"

export class YourFormat implements FormatAdapter {
  // Unique identifier used in syntax: "value in ID"
  id = "YOUR_ID"

  // Human-readable name
  name = "Your Format Name"

  // Description of what this format does
  description = "What your format does"

  // (Optional) Parse number literals with this suffix
  // Example: "100$" → multiply by 1
  parseMultiplier?(): number {
    return 1 // or your conversion factor
  }

  // Format numbers for display
  format() {
    return {
      divisor: 1, // Divide value by this
      suffix: "YOUR_ID", // Append this after number
      prefix: "$", // (Optional) Prepend this before number
    }
  }

  // Check if this adapter can parse a given suffix
  canParse(suffix: string): boolean {
    return suffix === "YOUR_ID" || suffix === "alternative"
  }
}
```

### 2. Create Tests

Create `lib/engine/adapters/formats/yourformat.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { YourFormat } from "./yourformat"

describe("YourFormat", () => {
  const format = new YourFormat()

  describe("metadata", () => {
    it("should have correct id", () => {
      expect(format.id).toBe("YOUR_ID")
    })

    it("should have descriptive name", () => {
      expect(format.name).toBe("Your Format Name")
    })
  })

  describe("parseMultiplier", () => {
    it("should return correct multiplier", () => {
      expect(format.parseMultiplier()).toBe(1)
    })
  })

  describe("format", () => {
    it("should return correct formatting info", () => {
      const result = format.format()
      expect(result.divisor).toBe(1)
      expect(result.suffix).toBe("YOUR_ID")
    })
  })

  describe("canParse", () => {
    it("should accept valid suffixes", () => {
      expect(format.canParse("YOUR_ID")).toBe(true)
    })

    it("should reject invalid suffixes", () => {
      expect(format.canParse("INVALID")).toBe(false)
    })
  })
})
```

### 3. Register the Adapter

Add to `lib/engine/adapters/formats/registry.ts`:

```typescript
import { YourFormat } from "./yourformat"

// ... in the registry setup
formatRegistry.register(new YourFormat())
```

### 4. Run Tests

```bash
npm test
npm run lint
npm run format
```

## Example: Adding Currency Format

Here's a complete example for adding USD currency formatting:

**File: `dollar.ts`**

```typescript
import { FormatAdapter } from "./base"

export class DollarFormat implements FormatAdapter {
  id = "$"
  name = "US Dollar"
  description = "Format as US currency"

  format() {
    return {
      divisor: 1,
      prefix: "$",
    }
  }

  canParse(suffix: string): boolean {
    return suffix === "$"
  }
}
```

**Usage:**

```
price in $ = 100      // Displays as: $100
total = price * 2     // Displays as: $200 (inherits format)
```

## Example: Adding Temperature Conversion

**File: `celsius.ts`**

```typescript
import { FormatAdapter } from "./base"

export class CelsiusFormat implements FormatAdapter {
  id = "°C"
  name = "Celsius"
  description = "Temperature in Celsius"

  // Convert from Fahrenheit (base unit) to Celsius for display
  format() {
    return {
      divisor: 1.8, // (F - 32) / 1.8 = C
      suffix: "°C",
    }
  }

  // Parse Celsius input to Fahrenheit (base unit)
  parseMultiplier(): number {
    return 1.8 // C * 1.8 + 32 = F (add 32 in evaluator)
  }

  canParse(suffix: string): boolean {
    return suffix === "°C" || suffix === "C"
  }
}
```

Note: For more complex conversions (like temperature with offsets), you may need to extend the `FormatAdapter` interface to support offset values.

## Design Principles

1. **One format per file**: Each format adapter lives in its own file
2. **Test coverage**: Every adapter must have comprehensive unit tests
3. **Single responsibility**: Each adapter handles one specific format/unit
4. **Extensibility**: New formats can be added without modifying existing code
5. **Type safety**: Use TypeScript interfaces and types throughout

## Future Enhancements

Potential additions to the format system:

- **Unit conversions**: meters, feet, kilograms, pounds, etc.
- **Currency conversion**: Live exchange rates
- **Time units**: seconds, minutes, hours, days
- **Custom formats**: User-defined formatting rules
- **Compound units**: km/h, $/hour, etc.
