import { describe, it, expect } from "vitest"
import { MillilitersFormat } from "./ml"

describe("MillilitersFormat", () => {
  const format = new MillilitersFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("ml")
    expect(format.name).toBe("Milliliters")
    expect(format.description).toBe("Format as milliliters (ml)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix ml", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("ml")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse ml suffix (case-insensitive)", () => {
    expect(format.canParse("ml")).toBe(true)
    expect(format.canParse("ML")).toBe(true)
    expect(format.canParse("Ml")).toBe(true)
  })

  it("should parse milliliter/milliliters (case-insensitive)", () => {
    expect(format.canParse("milliliter")).toBe(true)
    expect(format.canParse("milliliters")).toBe(true)
    expect(format.canParse("MILLILITER")).toBe(true)
    expect(format.canParse("MILLILITERS")).toBe(true)
  })

  it("should parse millilitre/millilitres (case-insensitive)", () => {
    expect(format.canParse("millilitre")).toBe(true)
    expect(format.canParse("millilitres")).toBe(true)
    expect(format.canParse("MILLILITRE")).toBe(true)
    expect(format.canParse("MILLILITRES")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("L")).toBe(false)
    expect(format.canParse("gal")).toBe(false)
    expect(format.canParse("m")).toBe(false)
  })
})
