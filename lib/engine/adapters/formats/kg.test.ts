import { describe, it, expect } from "vitest"
import { KilogramsFormat } from "./kg"

describe("KilogramsFormat", () => {
  const format = new KilogramsFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("kg")
    expect(format.name).toBe("Kilograms")
    expect(format.description).toBe("Format as kilograms (kg)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix kg", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("kg")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse kg suffix (case-insensitive)", () => {
    expect(format.canParse("kg")).toBe(true)
    expect(format.canParse("KG")).toBe(true)
    expect(format.canParse("Kg")).toBe(true)
  })

  it("should parse kilogram/kilograms (case-insensitive)", () => {
    expect(format.canParse("kilogram")).toBe(true)
    expect(format.canParse("kilograms")).toBe(true)
    expect(format.canParse("KILOGRAM")).toBe(true)
    expect(format.canParse("KILOGRAMS")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("k")).toBe(false)
    expect(format.canParse("g")).toBe(false)
    expect(format.canParse("lb")).toBe(false)
  })
})
