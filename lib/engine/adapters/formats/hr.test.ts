import { describe, it, expect } from "vitest"
import { HoursFormat } from "./hr"

describe("HoursFormat", () => {
  const format = new HoursFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("hr")
    expect(format.name).toBe("Hours")
    expect(format.description).toBe("Format as hours (hr)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix hr", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("hr")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse hr suffix (case-insensitive)", () => {
    expect(format.canParse("hr")).toBe(true)
    expect(format.canParse("HR")).toBe(true)
    expect(format.canParse("Hr")).toBe(true)
  })

  it("should parse h suffix (case-insensitive)", () => {
    expect(format.canParse("h")).toBe(true)
    expect(format.canParse("H")).toBe(true)
  })

  it("should parse hour/hours (case-insensitive)", () => {
    expect(format.canParse("hour")).toBe(true)
    expect(format.canParse("hours")).toBe(true)
    expect(format.canParse("HOUR")).toBe(true)
    expect(format.canParse("HOURS")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("min")).toBe(false)
    expect(format.canParse("sec")).toBe(false)
    expect(format.canParse("m")).toBe(false)
  })
})
