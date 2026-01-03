import { describe, it, expect } from "vitest"
import { MeterFormat } from "./m"

describe("MeterFormat", () => {
  const format = new MeterFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("m")
    expect(format.name).toBe("Meter")
    expect(format.description).toBe("Format as meters (m)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix m", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("m")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse lowercase m suffix only", () => {
    expect(format.canParse("m")).toBe(true)
  })

  it("should NOT parse uppercase M (to distinguish from millions)", () => {
    expect(format.canParse("M")).toBe(false)
  })

  it("should parse meter suffix (case-insensitive)", () => {
    expect(format.canParse("meter")).toBe(true)
    expect(format.canParse("METER")).toBe(true)
    expect(format.canParse("Meter")).toBe(true)
  })

  it("should parse meters suffix (case-insensitive)", () => {
    expect(format.canParse("meters")).toBe(true)
    expect(format.canParse("METERS")).toBe(true)
    expect(format.canParse("Meters")).toBe(true)
  })

  it("should parse metre suffix (British spelling, case-insensitive)", () => {
    expect(format.canParse("metre")).toBe(true)
    expect(format.canParse("METRE")).toBe(true)
    expect(format.canParse("Metre")).toBe(true)
  })

  it("should parse metres suffix (British spelling, case-insensitive)", () => {
    expect(format.canParse("metres")).toBe(true)
    expect(format.canParse("METRES")).toBe(true)
    expect(format.canParse("Metres")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("k")).toBe(false)
    expect(format.canParse("km")).toBe(false)
    expect(format.canParse("$")).toBe(false)
  })
})
