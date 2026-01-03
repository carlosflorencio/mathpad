import { describe, it, expect } from "vitest"
import { MinutesFormat } from "./min"

describe("MinutesFormat", () => {
  const format = new MinutesFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("min")
    expect(format.name).toBe("Minutes")
    expect(format.description).toBe("Format as minutes (min)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix min", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("min")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse min suffix (case-insensitive)", () => {
    expect(format.canParse("min")).toBe(true)
    expect(format.canParse("MIN")).toBe(true)
    expect(format.canParse("Min")).toBe(true)
  })

  it("should parse minute/minutes (case-insensitive)", () => {
    expect(format.canParse("minute")).toBe(true)
    expect(format.canParse("minutes")).toBe(true)
    expect(format.canParse("MINUTE")).toBe(true)
    expect(format.canParse("MINUTES")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("m")).toBe(false)
    expect(format.canParse("sec")).toBe(false)
    expect(format.canParse("hr")).toBe(false)
  })
})
