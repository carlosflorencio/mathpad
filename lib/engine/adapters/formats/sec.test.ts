import { describe, it, expect } from "vitest"
import { SecondsFormat } from "./sec"

describe("SecondsFormat", () => {
  const format = new SecondsFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("sec")
    expect(format.name).toBe("Seconds")
    expect(format.description).toBe("Format as seconds (sec)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix sec", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("sec")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse sec suffix (case-insensitive)", () => {
    expect(format.canParse("sec")).toBe(true)
    expect(format.canParse("SEC")).toBe(true)
    expect(format.canParse("Sec")).toBe(true)
  })

  it("should parse second/seconds (case-insensitive)", () => {
    expect(format.canParse("second")).toBe(true)
    expect(format.canParse("seconds")).toBe(true)
    expect(format.canParse("SECOND")).toBe(true)
    expect(format.canParse("SECONDS")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("s")).toBe(false)
    expect(format.canParse("min")).toBe(false)
    expect(format.canParse("hr")).toBe(false)
  })
})
