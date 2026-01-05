import { describe, it, expect } from "vitest"
import { MillisecondsFormat } from "./ms"

describe("MillisecondsFormat", () => {
  const format = new MillisecondsFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("ms")
    expect(format.name).toBe("Milliseconds")
    expect(format.description).toBe("Format as milliseconds (ms)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix ms", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("ms")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse ms suffix (case-insensitive)", () => {
    expect(format.canParse("ms")).toBe(true)
    expect(format.canParse("MS")).toBe(true)
    expect(format.canParse("Ms")).toBe(true)
  })

  it("should parse millisecond/milliseconds (case-insensitive)", () => {
    expect(format.canParse("millisecond")).toBe(true)
    expect(format.canParse("milliseconds")).toBe(true)
    expect(format.canParse("MILLISECOND")).toBe(true)
    expect(format.canParse("MILLISECONDS")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("m")).toBe(false)
    expect(format.canParse("sec")).toBe(false)
    expect(format.canParse("min")).toBe(false)
    expect(format.canParse("s")).toBe(false)
  })
})
