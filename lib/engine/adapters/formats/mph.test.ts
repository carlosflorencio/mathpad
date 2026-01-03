import { describe, it, expect } from "vitest"
import { MilesPerHourFormat } from "./mph"

describe("MilesPerHourFormat", () => {
  const format = new MilesPerHourFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("mph")
    expect(format.name).toBe("Miles per hour")
    expect(format.description).toBe("Format as miles per hour (mph)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix mph", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("mph")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse mph suffix (case-insensitive)", () => {
    expect(format.canParse("mph")).toBe(true)
    expect(format.canParse("MPH")).toBe(true)
    expect(format.canParse("Mph")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("mi")).toBe(false)
    expect(format.canParse("km/h")).toBe(false)
    expect(format.canParse("m/s")).toBe(false)
    expect(format.canParse("$")).toBe(false)
  })
})
