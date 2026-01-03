import { describe, it, expect } from "vitest"
import { KilometersPerHourFormat } from "./kmh"

describe("KilometersPerHourFormat", () => {
  const format = new KilometersPerHourFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("km/h")
    expect(format.name).toBe("Kilometers per hour")
    expect(format.description).toBe("Format as kilometers per hour (km/h)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix km/h", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("km/h")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse km/h suffix (case-insensitive)", () => {
    expect(format.canParse("km/h")).toBe(true)
    expect(format.canParse("KM/H")).toBe(true)
    expect(format.canParse("Km/H")).toBe(true)
  })

  it("should parse kmh suffix (case-insensitive)", () => {
    expect(format.canParse("kmh")).toBe(true)
    expect(format.canParse("KMH")).toBe(true)
    expect(format.canParse("Kmh")).toBe(true)
  })

  it("should parse kph suffix (case-insensitive)", () => {
    expect(format.canParse("kph")).toBe(true)
    expect(format.canParse("KPH")).toBe(true)
    expect(format.canParse("Kph")).toBe(true)
  })

  it("should parse kmph suffix (case-insensitive)", () => {
    expect(format.canParse("kmph")).toBe(true)
    expect(format.canParse("KMPH")).toBe(true)
    expect(format.canParse("Kmph")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("km")).toBe(false)
    expect(format.canParse("m/s")).toBe(false)
    expect(format.canParse("mph")).toBe(false)
    expect(format.canParse("$")).toBe(false)
  })
})
