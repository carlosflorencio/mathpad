import { describe, it, expect } from "vitest"
import { GramsFormat } from "./g"

describe("GramsFormat", () => {
  const format = new GramsFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("g")
    expect(format.name).toBe("Grams")
    expect(format.description).toBe("Format as grams (g)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix g", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("g")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse lowercase g suffix only", () => {
    expect(format.canParse("g")).toBe(true)
  })

  it("should NOT parse uppercase G", () => {
    expect(format.canParse("G")).toBe(false)
  })

  it("should parse gram/grams (case-insensitive)", () => {
    expect(format.canParse("gram")).toBe(true)
    expect(format.canParse("grams")).toBe(true)
    expect(format.canParse("GRAM")).toBe(true)
    expect(format.canParse("GRAMS")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("kg")).toBe(false)
    expect(format.canParse("lb")).toBe(false)
    expect(format.canParse("m")).toBe(false)
  })
})
