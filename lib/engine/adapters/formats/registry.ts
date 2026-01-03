import { FormatAdapter } from "./base"
import { ThousandsFormat } from "./thousands"
import { MillionsFormat } from "./millions"
import { BillionsFormat } from "./billions"
import { USDFormat } from "./usd"
import { EURFormat } from "./eur"
import { KilometerFormat } from "./km"
import { MeterFormat } from "./m"
import { MinutesFormat } from "./min"
import { SecondsFormat } from "./sec"
import { HoursFormat } from "./hr"
import { MilesFormat } from "./mi"
import { FeetFormat } from "./ft"
import { KilogramsFormat } from "./kg"
import { PoundsFormat } from "./lb"
import { GramsFormat } from "./g"
import { LitersFormat } from "./L"
import { MillilitersFormat } from "./ml"
import { GallonsFormat } from "./gal"
import { KilometersPerHourFormat } from "./kmh"
import { MetersPerSecondFormat } from "./mps"
import { MilesPerHourFormat } from "./mph"

/**
 * Registry for all format adapters
 * Provides lookup by ID and parsing capabilities
 */
class FormatRegistry {
  private formats = new Map<string, FormatAdapter>()

  register(adapter: FormatAdapter): void {
    this.formats.set(adapter.id, adapter)
  }

  /**
   * Get a format adapter by its ID
   */
  get(id: string): FormatAdapter | undefined {
    return this.formats.get(id)
  }

  /**
   * Get all registered format IDs
   */
  getAllIds(): string[] {
    return Array.from(this.formats.keys())
  }

  /**
   * Find a format adapter that can parse the given suffix
   * Returns the adapter and the multiplier to apply
   */
  findParser(suffix: string): { adapter: FormatAdapter; multiplier: number } | null {
    for (const adapter of this.formats.values()) {
      if (adapter.canParse(suffix)) {
        const multiplier = adapter.parseMultiplier?.() ?? 1
        return { adapter, multiplier }
      }
    }
    return null
  }

  /**
   * Check if a string is a valid format ID
   */
  isValidFormat(id: string): boolean {
    return this.formats.has(id)
  }
}

// Create and populate the global registry
export const formatRegistry = new FormatRegistry()

// Register built-in number formats
formatRegistry.register(new ThousandsFormat())
formatRegistry.register(new MillionsFormat())
formatRegistry.register(new BillionsFormat())

// Register currency formats
formatRegistry.register(new USDFormat())
formatRegistry.register(new EURFormat())

// Register distance unit formats
formatRegistry.register(new KilometerFormat())
formatRegistry.register(new MeterFormat())
formatRegistry.register(new MilesFormat())
formatRegistry.register(new FeetFormat())

// Register time unit formats
formatRegistry.register(new MinutesFormat())
formatRegistry.register(new SecondsFormat())
formatRegistry.register(new HoursFormat())

// Register weight unit formats
formatRegistry.register(new KilogramsFormat())
formatRegistry.register(new PoundsFormat())
formatRegistry.register(new GramsFormat())

// Register volume unit formats
formatRegistry.register(new LitersFormat())
formatRegistry.register(new MillilitersFormat())
formatRegistry.register(new GallonsFormat())

// Register speed unit formats
formatRegistry.register(new KilometersPerHourFormat())
formatRegistry.register(new MetersPerSecondFormat())
formatRegistry.register(new MilesPerHourFormat())

/**
 * Helper to check if a string is a valid registered format suffix
 * This is a type guard that can be used for TypeScript narrowing
 * @param value - The string to check
 * @returns true if the value is a registered format ID
 */
export function isFormatSuffix(value: string): boolean {
  return formatRegistry.isValidFormat(value)
}

// To add a new format (e.g., currency or units), create a new adapter:
//
// Example: Currency format
// ```typescript
// class DollarFormat implements FormatAdapter {
//   id = "$"
//   name = "US Dollar"
//   description = "Format as US currency"
//
//   format() {
//     return { divisor: 1, prefix: "$" }
//   }
//
//   canParse(suffix: string): boolean {
//     return suffix === "$"
//   }
// }
//
// formatRegistry.register(new DollarFormat())
// ```
//
// Then you can use: "price in $ = 100" or "100 in $"
