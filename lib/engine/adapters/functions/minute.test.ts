import { describe, it, expect } from "vitest"
import { MinuteFunction } from "./minute"

describe("MinuteFunction", () => {
  const minuteFn = new MinuteFunction()

  it("should extract minute from datetime", () => {
    const date = new Date("2024-03-15T14:30:45Z")
    const result = minuteFn.executeDate!(date)
    expect(result.toNumber()).toBe(30)
  })

  it("should work with different minutes", () => {
    expect(minuteFn.executeDate!(new Date("2024-01-15T12:00:00Z")).toNumber()).toBe(0)
    expect(minuteFn.executeDate!(new Date("2024-01-15T12:15:00Z")).toNumber()).toBe(15)
    expect(minuteFn.executeDate!(new Date("2024-01-15T12:59:00Z")).toNumber()).toBe(59)
  })

  it("should return 0 for date without time", () => {
    expect(minuteFn.executeDate!(new Date("2024-01-15Z")).toNumber()).toBe(0)
  })

  it("should validate invalid dates", () => {
    const invalidDate = new Date("invalid")
    const error = minuteFn.validateDate!(invalidDate)
    expect(error).toBe("Invalid date")
  })

  it("should validate valid dates", () => {
    const validDate = new Date("2024-01-15T14:30:00Z")
    const error = minuteFn.validateDate!(validDate)
    expect(error).toBeNull()
  })
})
