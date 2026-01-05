import { describe, it, expect } from "vitest"
import { DayFunction } from "./day"

describe("DayFunction", () => {
  const dayFn = new DayFunction()

  it("should extract day from date", () => {
    const date = new Date("2024-03-15T14:30:45Z")
    const result = dayFn.executeDate!(date)
    expect(result.toNumber()).toBe(15)
  })

  it("should work with different days", () => {
    expect(dayFn.executeDate!(new Date("2024-01-01Z")).toNumber()).toBe(1)
    expect(dayFn.executeDate!(new Date("2024-06-30Z")).toNumber()).toBe(30)
    expect(dayFn.executeDate!(new Date("2024-12-31Z")).toNumber()).toBe(31)
  })

  it("should validate invalid dates", () => {
    const invalidDate = new Date("invalid")
    const error = dayFn.validateDate!(invalidDate)
    expect(error).toBe("Invalid date")
  })

  it("should validate valid dates", () => {
    const validDate = new Date("2024-01-15Z")
    const error = dayFn.validateDate!(validDate)
    expect(error).toBeNull()
  })
})
