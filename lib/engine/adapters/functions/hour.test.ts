import { describe, it, expect } from "vitest"
import { HourFunction } from "./hour"

describe("HourFunction", () => {
  const hourFn = new HourFunction()

  it("should extract hour from datetime", () => {
    const date = new Date("2024-03-15T14:30:45Z")
    const result = hourFn.executeDate!(date)
    expect(result.toNumber()).toBe(14)
  })

  it("should work with different hours", () => {
    expect(hourFn.executeDate!(new Date("2024-01-15T00:00:00Z")).toNumber()).toBe(0)
    expect(hourFn.executeDate!(new Date("2024-01-15T12:30:00Z")).toNumber()).toBe(12)
    expect(hourFn.executeDate!(new Date("2024-01-15T23:59:59Z")).toNumber()).toBe(23)
  })

  it("should return 0 for date without time", () => {
    expect(hourFn.executeDate!(new Date("2024-01-15Z")).toNumber()).toBe(0)
  })

  it("should validate invalid dates", () => {
    const invalidDate = new Date("invalid")
    const error = hourFn.validateDate!(invalidDate)
    expect(error).toBe("Invalid date")
  })

  it("should validate valid dates", () => {
    const validDate = new Date("2024-01-15T14:30:00Z")
    const error = hourFn.validateDate!(validDate)
    expect(error).toBeNull()
  })
})
