import { describe, it, expect } from "vitest"
import { YearFunction } from "./year"

describe("YearFunction", () => {
  const yearFn = new YearFunction()

  it("should extract year from date", () => {
    const date = new Date("2024-03-15T14:30:45Z")
    const result = yearFn.executeDate!(date)
    expect(result.toNumber()).toBe(2024)
  })

  it("should work with different years", () => {
    expect(yearFn.executeDate!(new Date("2000-01-01Z")).toNumber()).toBe(2000)
    expect(yearFn.executeDate!(new Date("1990-12-31Z")).toNumber()).toBe(1990)
    expect(yearFn.executeDate!(new Date("2025-06-15Z")).toNumber()).toBe(2025)
  })

  it("should validate invalid dates", () => {
    const invalidDate = new Date("invalid")
    const error = yearFn.validateDate!(invalidDate)
    expect(error).toBe("Invalid date")
  })

  it("should validate valid dates", () => {
    const validDate = new Date("2024-01-15Z")
    const error = yearFn.validateDate!(validDate)
    expect(error).toBeNull()
  })
})
