import currenciesData from "./currencies.json"

export interface CurrencyData {
  code: string // Currency code (e.g., "USD")
  symbol: string // Display symbol (e.g., "$", "€", "CHF")
  name: string // Full name (e.g., "US Dollar")
  rate: number // Exchange rate vs USD base
}

interface CurrenciesConfig {
  lastUpdated: string
  base: string
  currencies: CurrencyData[]
}

let cachedData: CurrenciesConfig = currenciesData

export function getAllCurrencies(): CurrencyData[] {
  return cachedData.currencies
}

export function getCurrency(code: string): CurrencyData | undefined {
  return cachedData.currencies.find((c) => c.code.toUpperCase() === code.toUpperCase())
}

export function getLastUpdated(): string {
  return cachedData.lastUpdated
}

export function getBaseCurrency(): string {
  return cachedData.base
}

export function reloadCurrencies(): void {
  // For testing: allow reloading currencies
  // Note: This is a simple cache reload - in practice, you'd re-import the JSON
  // For now, this function is a placeholder for future dynamic rate updates
  cachedData = currenciesData
}
