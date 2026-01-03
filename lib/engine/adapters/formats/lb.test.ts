import { describe, it, expect } from "vitest"
import { PoundsFormat } from "./lb"

describe("PoundsFormat", () => {
  const format = new PoundsFormat()

  it("should have correct metadata", () => {
    expect(format.id).toBe("lb")
    expect(format.name).toBe("Pounds")
    expect(format.description).toBe("Format as pounds (lb)")
  })

  it("should preserve inline format", () => {
    expect(format.preserveInline).toBe(true)
  })

  it("should have multiplier of 1", () => {
    expect(format.parseMultiplier()).toBe(1)
  })

  it("should format with suffix lb", () => {
    const result = format.format()
    expect(result.divisor).toBe(1)
    expect(result.suffix).toBe("lb")
    expect(result.prefix).toBeUndefined()
  })

  it("should parse lb suffix (case-insensitive)", () => {
    expect(format.canParse("lb")).toBe(true)
    expect(format.canParse("LB")).toBe(true)
    expect(format.canParse("Lb")).toBe(true)
  })

  it("should parse lbs suffix (case-insensitive)", () => {
    expect(format.canParse("lbs")).toBe(true)
    expect(format.canParse("LBS")).toBe(true)
  })

  it("should parse pound/pounds (case-insensitive)", () => {
    expect(format.canParse("pound")).toBe(true)
    expect(format.canParse("pounds")).toBe(true)
    expect(format.canParse("POUND")).toBe(true)
    expect(format.canParse("POUNDS")).toBe(true)
  })

  it("should not parse other suffixes", () => {
    expect(format.canParse("kg")).toBe(false)
    expect(format.canParse("g")).toBe(false)
    expect(format.canParse("l")).toBe(false)
  })
})
