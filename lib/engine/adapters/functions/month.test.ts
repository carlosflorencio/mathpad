import { describe, it, expect } from "vitest"
import { MonthFunction } from "./month"

describe("MonthFunction", () => {
  const monthFn = new MonthFunction()

  it("should extract month from date", () => {
    const date = new Date("2024-03-15T14:30:45Z")
    const result = monthFn.executeDate!(date)
    expect(result.toNumber()).toBe(3)
  })

  it("should work with different months", () => {
    expect(monthFn.executeDate!(new Date("2024-01-15Z")).toNumber()).toBe(1)
    expect(monthFn.executeDate!(new Date("2024-06-15Z")).toNumber()).toBe(6)
    expect(monthFn.executeDate!(new Date("2024-12-15Z")).toNumber()).toBe(12)
  })

  it("should validate invalid dates", () => {
    const invalidDate = new Date("invalid")
    const error = monthFn.validateDate!(invalidDate)
    expect(error).toBe("Invalid date")
  })

  it("should validate valid dates", () => {
    const validDate = new Date("2024-01-15Z")
    const error = monthFn.validateDate!(validDate)
    expect(error).toBeNull()
  })
})
