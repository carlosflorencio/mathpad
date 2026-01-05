import { describe, it, expect } from "vitest"
import { DaysFormat } from "./day"

describe("DaysFormat", () => {
  const format = new DaysFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("day")
    expect(format.name).toBe("Days")
    expect(format.description).toBe("Format as days (day)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix day", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("day")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse day suffix (case-insensitive)", () => {
    expect(format.canParse("day")).toBe(true)
    expect(format.canParse("DAY")).toBe(true)
    expect(format.canParse("Day")).toBe(true)
  })

  it("should parse days suffix (case-insensitive)", () => {
    expect(format.canParse("days")).toBe(true)
    expect(format.canParse("DAYS")).toBe(true)
    expect(format.canParse("Days")).toBe(true)
  })

  it("should parse d suffix (case-insensitive)", () => {
    expect(format.canParse("d")).toBe(true)
    expect(format.canParse("D")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("hr")).toBe(false)
    expect(format.canParse("min")).toBe(false)
    expect(format.canParse("sec")).toBe(false)
    expect(format.canParse("week")).toBe(false)
  })
})
