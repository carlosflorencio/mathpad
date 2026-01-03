import { describe, it, expect } from "vitest"
import { FeetFormat } from "./ft"

describe("FeetFormat", () => {
  const format = new FeetFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("ft")
    expect(format.name).toBe("Feet")
    expect(format.description).toBe("Format as feet (ft)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix ft", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("ft")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse ft suffix (case-insensitive)", () => {
    expect(format.canParse("ft")).toBe(true)
    expect(format.canParse("FT")).toBe(true)
    expect(format.canParse("Ft")).toBe(true)
  })

  it("should parse foot/feet (case-insensitive)", () => {
    expect(format.canParse("foot")).toBe(true)
    expect(format.canParse("feet")).toBe(true)
    expect(format.canParse("FOOT")).toBe(true)
    expect(format.canParse("FEET")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("m")).toBe(false)
    expect(format.canParse("mi")).toBe(false)
    expect(format.canParse("km")).toBe(false)
  })
})
