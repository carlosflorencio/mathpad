import { describe, it, expect } from "vitest"
import { SecondFunction } from "./second"

describe("SecondFunction", () => {
  const secondFn = new SecondFunction()

  it("should extract second from datetime", () => {
    const date = new Date("2024-03-15T14:30:45Z")
    const result = secondFn.executeDate!(date)
    expect(result.toNumber()).toBe(45)
  })

  it("should work with different seconds", () => {
    expect(secondFn.executeDate!(new Date("2024-01-15T12:30:00Z")).toNumber()).toBe(0)
    expect(secondFn.executeDate!(new Date("2024-01-15T12:30:15Z")).toNumber()).toBe(15)
    expect(secondFn.executeDate!(new Date("2024-01-15T12:30:59Z")).toNumber()).toBe(59)
  })

  it("should return 0 for date without time", () => {
    expect(secondFn.executeDate!(new Date("2024-01-15Z")).toNumber()).toBe(0)
  })

  it("should validate invalid dates", () => {
    const invalidDate = new Date("invalid")
    const error = secondFn.validateDate!(invalidDate)
    expect(error).toBe("Invalid date")
  })

  it("should validate valid dates", () => {
    const validDate = new Date("2024-01-15T14:30:45Z")
    const error = secondFn.validateDate!(validDate)
    expect(error).toBeNull()
  })
})
