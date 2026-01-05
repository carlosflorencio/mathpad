import { describe, it, expect } from "vitest"
import { TodayFunction } from "./today"

describe("TodayFunction", () => {
  const todayFn = new TodayFunction()

  it("should return current date at midnight", () => {
    const result = todayFn.executeDate!()
    const now = new Date()

    expect(result.getUTCFullYear()).toBe(now.getFullYear())
    expect(result.getUTCMonth()).toBe(now.getMonth())
    expect(result.getUTCDate()).toBe(now.getDate())
    expect(result.getUTCHours()).toBe(0)
    expect(result.getUTCMinutes()).toBe(0)
    expect(result.getUTCSeconds()).toBe(0)
    expect(result.getUTCMilliseconds()).toBe(0)
  })

  it("should return a valid date", () => {
    const result = todayFn.executeDate!()
    expect(isNaN(result.getTime())).toBe(false)
  })
})
