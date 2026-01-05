import { FormatAdapter, FormatResult, UNIT_CATEGORIES } from "./base"
import { CurrencyData } from "../currencyLoader"

/**
 * Generic currency format adapter
 * Can be instantiated for any currency with data from currencies.json
 */
export class Currency implements FormatAdapter {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly unitCategory = UNIT_CATEGORIES.CURRENCY
  readonly preserveInline = true
  private readonly rate: number
  private readonly code: string

  constructor(private data: CurrencyData) {
    this.id = data.symbol
    this.name = data.name
    this.description = `Format as ${data.name} (${data.symbol})`
    this.rate = data.rate
    this.code = data.code
  }

  get toBaseUnit(): number {
    return this.rate
  }

  parseMultiplier(): number {
    return 1
  }

  format(): FormatResult {
    return {
      divisor: 1,
      suffix: this.data.symbol,
    }
  }

  canParse(suffix: string): boolean {
    const lower = suffix.toLowerCase()
    const code = this.code.toLowerCase()

    // Parse both symbol and code (case-insensitive for code)
    return suffix === this.data.symbol || lower === code
  }
}
