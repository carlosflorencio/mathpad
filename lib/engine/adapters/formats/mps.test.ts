import { describe, it, expect } from "vitest"
import { MetersPerSecondFormat } from "./mps"

describe("MetersPerSecondFormat", () => {
  const format = new MetersPerSecondFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("m/s")
    expect(format.name).toBe("Meters per second")
    expect(format.description).toBe("Format as meters per second (m/s)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix m/s", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("m/s")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse m/s suffix (case-insensitive)", () => {
    expect(format.canParse("m/s")).toBe(true)
    expect(format.canParse("M/S")).toBe(true)
    expect(format.canParse("M/s")).toBe(true)
  })

  it("should parse mps suffix (case-insensitive)", () => {
    expect(format.canParse("mps")).toBe(true)
    expect(format.canParse("MPS")).toBe(true)
    expect(format.canParse("Mps")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("m")).toBe(false)
    expect(format.canParse("km/h")).toBe(false)
    expect(format.canParse("mph")).toBe(false)
    expect(format.canParse("$")).toBe(false)
  })
})
