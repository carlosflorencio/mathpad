import { describe, it, expect } from "vitest"
import { GallonsFormat } from "./gal"

describe("GallonsFormat", () => {
  const format = new GallonsFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("gal")
    expect(format.name).toBe("Gallons")
    expect(format.description).toBe("Format as gallons (gal)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix gal", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("gal")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse gal suffix (case-insensitive)", () => {
    expect(format.canParse("gal")).toBe(true)
    expect(format.canParse("GAL")).toBe(true)
    expect(format.canParse("Gal")).toBe(true)
  })

  it("should parse gallon/gallons (case-insensitive)", () => {
    expect(format.canParse("gallon")).toBe(true)
    expect(format.canParse("gallons")).toBe(true)
    expect(format.canParse("GALLON")).toBe(true)
    expect(format.canParse("GALLONS")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("L")).toBe(false)
    expect(format.canParse("ml")).toBe(false)
    expect(format.canParse("g")).toBe(false)
  })
})
