import { describe, it, expect } from "vitest"
import { EURFormat } from "./eur"

describe("EURFormat", () => {
  const format = new EURFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("€")
    expect(format.name).toBe("Euro")
    expect(format.description).toBe("Format as Euro (€)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix €", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("€")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse € suffix", () => {
    expect(format.canParse("€")).toBe(true)
  })

  it("should parse eur suffix (case-insensitive)", () => {
    expect(format.canParse("eur")).toBe(true)
    expect(format.canParse("EUR")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("$")).toBe(false)
    expect(format.canParse("k")).toBe(false)
    expect(format.canParse("M")).toBe(false)
  })
})
