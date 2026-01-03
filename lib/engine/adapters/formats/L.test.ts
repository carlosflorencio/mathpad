import { describe, it, expect } from "vitest"
import { LitersFormat } from "./L"

describe("LitersFormat", () => {
  const format = new LitersFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("L")
    expect(format.name).toBe("Liters")
    expect(format.description).toBe("Format as liters (L)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix L", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("L")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse L suffix (both cases)", () => {
    expect(format.canParse("L")).toBe(true)
    expect(format.canParse("l")).toBe(true)
  })

  it("should parse liter/liters (case-insensitive)", () => {
    expect(format.canParse("liter")).toBe(true)
    expect(format.canParse("liters")).toBe(true)
    expect(format.canParse("LITER")).toBe(true)
    expect(format.canParse("LITERS")).toBe(true)
  })

  it("should parse litre/litres (case-insensitive)", () => {
    expect(format.canParse("litre")).toBe(true)
    expect(format.canParse("litres")).toBe(true)
    expect(format.canParse("LITRE")).toBe(true)
    expect(format.canParse("LITRES")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("ml")).toBe(false)
    expect(format.canParse("gal")).toBe(false)
    expect(format.canParse("m")).toBe(false)
  })
})
