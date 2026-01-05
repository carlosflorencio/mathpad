#!/usr/bin/env tsx

import * as fs from "fs"
import * as path from "path"

// Using v6 API - no API key required
const API_URL = "https://open.er-api.com/v6/latest/USD"

interface APIResponse {
  result: string // "success" or "error"
  provider: string
  documentation: string
  terms_of_use: string
  time_last_update_unix: number
  time_last_update_utc: string
  time_next_update_unix: number
  time_next_update_utc: string
  time_eol_unix: number
  base_code: string
  rates: Record<string, number>
}

interface CurrencyData {
  code: string
  symbol: string
  name: string
  rate: number
}

interface CurrenciesConfig {
  lastUpdated: string
  base: string
  currencies: CurrencyData[]
}

async function updateExchangeRates(): Promise<void> {
  console.log("Fetching latest exchange rates...")

  try {
    // Read existing currency metadata
    const currenciesPath = path.join(__dirname, "../lib/engine/adapters/currencies.json")
    const existingData: CurrenciesConfig = JSON.parse(fs.readFileSync(currenciesPath, "utf-8"))

    // Fetch latest rates from API
    const response = await fetch(API_URL)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data: APIResponse = await response.json()

    // Check if API returned success
    if (data.result !== "success") {
      throw new Error(`API returned error: ${data.result}`)
    }

    // Update rates while preserving metadata
    const updatedCurrencies = existingData.currencies.map((currency) => {
      if (currency.code === "USD") {
        return { ...currency, rate: 1.0 }
      }

      const apiRate = data.rates[currency.code]
      if (!apiRate) {
        console.warn(`⚠ No rate found for ${currency.code}, keeping existing rate`)
        return currency
      }

      // Invert: if 1 USD = 149 JPY, then 1 JPY = 1/149 USD
      const invertedRate = 1 / apiRate

      return {
        ...currency,
        rate: invertedRate,
      }
    })

    const outputData: CurrenciesConfig = {
      lastUpdated: new Date().toISOString(),
      base: "USD",
      currencies: updatedCurrencies,
    }

    fs.writeFileSync(currenciesPath, JSON.stringify(outputData, null, 2) + "\n")

    console.log("✓ Exchange rates updated successfully!")
    console.log(`  Last updated: ${outputData.lastUpdated}`)
    console.log(`  Currencies: ${updatedCurrencies.map((c) => c.code).join(", ")}`)
  } catch (error) {
    console.error("Failed to update exchange rates:", error)
    process.exit(1)
  }
}

updateExchangeRates()
