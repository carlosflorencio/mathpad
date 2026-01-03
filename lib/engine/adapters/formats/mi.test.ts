import { describe, it, expect } from "vitest"
import { MilesFormat } from "./mi"

describe("MilesFormat", () => {
  const format = new MilesFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("mi")
    expect(format.name).toBe("Miles")
    expect(format.description).toBe("Format as miles (mi)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix mi", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("mi")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse mi suffix (case-insensitive)", () => {
    expect(format.canParse("mi")).toBe(true)
    expect(format.canParse("MI")).toBe(true)
    expect(format.canParse("Mi")).toBe(true)
  })

  it("should parse mile/miles (case-insensitive)", () => {
    expect(format.canParse("mile")).toBe(true)
    expect(format.canParse("miles")).toBe(true)
    expect(format.canParse("MILE")).toBe(true)
    expect(format.canParse("MILES")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("m")).toBe(false)
    expect(format.canParse("km")).toBe(false)
    expect(format.canParse("ft")).toBe(false)
  })
})
