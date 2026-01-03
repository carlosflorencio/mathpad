import { describe, it, expect } from "vitest"
import { KilometerFormat } from "./km"

describe("KilometerFormat", () => {
  const format = new KilometerFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("km")
    expect(format.name).toBe("Kilometers")
    expect(format.description).toBe("Format as kilometers (km)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix km", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("km")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse km suffix (case-insensitive)", () => {
    expect(format.canParse("km")).toBe(true)
    expect(format.canParse("KM")).toBe(true)
    expect(format.canParse("Km")).toBe(true)
  })

  it("should parse kilometer suffix (case-insensitive)", () => {
    expect(format.canParse("kilometer")).toBe(true)
    expect(format.canParse("KILOMETER")).toBe(true)
    expect(format.canParse("Kilometer")).toBe(true)
  })

  it("should parse kilometers suffix (case-insensitive)", () => {
    expect(format.canParse("kilometers")).toBe(true)
    expect(format.canParse("KILOMETERS")).toBe(true)
    expect(format.canParse("Kilometers")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("k")).toBe(false)
    expect(format.canParse("m")).toBe(false)
    expect(format.canParse("M")).toBe(false)
    expect(format.canParse("$")).toBe(false)
  })
})
