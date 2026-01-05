import { describe, it, expect } from "vitest"
import { Currency } from "./currency"
import { UNIT_CATEGORIES } from "./base"

describe("Currency", () => {
  describe("USD", () => {
    const usd = new Currency({
      code: "USD",
      symbol: "$",
      name: "US Dollar",
      rate: 1.0,
    })

    it("should have correct metadata", () => {
      expect(usd.id).toBe("$")
      expect(usd.name).toBe("US Dollar")
      expect(usd.description).toBe("Format as US Dollar ($)")
      expect(usd.unitCategory).toBe(UNIT_CATEGORIES.CURRENCY)
    })

    it("should preserve inline format", () => {
      expect(usd.preserveInline).toBe(true)
    })

    it("should have multiplier of 1", () => {
      expect(usd.parseMultiplier()).toBe(1)
    })

    it("should format with suffix $", () => {
      const result = usd.format()
      expect(result.divisor).toBe(1)
      expect(result.suffix).toBe("$")
      expect(result.prefix).toBeUndefined()
    })

    it("should have correct exchange rate", () => {
      expect(usd.toBaseUnit).toBe(1.0)
    })

    it("should parse $ suffix", () => {
      expect(usd.canParse("$")).toBe(true)
    })

    it("should parse usd suffix (case-insensitive)", () => {
      expect(usd.canParse("usd")).toBe(true)
      expect(usd.canParse("USD")).toBe(true)
    })

    it("should not parse other suffixes", () => {
      expect(usd.canParse("€")).toBe(false)
      expect(usd.canParse("k")).toBe(false)
      expect(usd.canParse("M")).toBe(false)
    })
  })

  describe("EUR", () => {
    const eur = new Currency({
      code: "EUR",
      symbol: "€",
      name: "Euro",
      rate: 1.09,
    })

    it("should have correct metadata", () => {
      expect(eur.id).toBe("€")
      expect(eur.name).toBe("Euro")
      expect(eur.description).toBe("Format as Euro (€)")
    })

    it("should format with suffix €", () => {
      const result = eur.format()
      expect(result.divisor).toBe(1)
      expect(result.suffix).toBe("€")
    })

    it("should have correct exchange rate", () => {
      expect(eur.toBaseUnit).toBe(1.09)
    })

    it("should parse € suffix", () => {
      expect(eur.canParse("€")).toBe(true)
    })

    it("should parse eur suffix (case-insensitive)", () => {
      expect(eur.canParse("eur")).toBe(true)
      expect(eur.canParse("EUR")).toBe(true)
    })

    it("should not parse other currency symbols", () => {
      expect(eur.canParse("$")).toBe(false)
      expect(eur.canParse("£")).toBe(false)
    })
  })

  describe("GBP", () => {
    const gbp = new Currency({
      code: "GBP",
      symbol: "£",
      name: "British Pound",
      rate: 1.27,
    })

    it("should have correct metadata", () => {
      expect(gbp.id).toBe("£")
      expect(gbp.name).toBe("British Pound")
      expect(gbp.description).toBe("Format as British Pound (£)")
    })

    it("should format with suffix £", () => {
      const result = gbp.format()
      expect(result.divisor).toBe(1)
      expect(result.suffix).toBe("£")
    })

    it("should have correct exchange rate", () => {
      expect(gbp.toBaseUnit).toBe(1.27)
    })

    it("should parse £ suffix", () => {
      expect(gbp.canParse("£")).toBe(true)
    })

    it("should parse gbp suffix (case-insensitive)", () => {
      expect(gbp.canParse("gbp")).toBe(true)
      expect(gbp.canParse("GBP")).toBe(true)
    })
  })

  describe("CHF (compound code)", () => {
    const chf = new Currency({
      code: "CHF",
      symbol: "CHF",
      name: "Swiss Franc",
      rate: 1.14,
    })

    it("should use code as symbol when no separate symbol", () => {
      expect(chf.id).toBe("CHF")
      expect(chf.format().suffix).toBe("CHF")
    })

    it("should parse chf suffix (case-insensitive)", () => {
      expect(chf.canParse("chf")).toBe(true)
      expect(chf.canParse("CHF")).toBe(true)
    })
  })
})
