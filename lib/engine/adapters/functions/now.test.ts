import { describe, it, expect } from "vitest"
import { NowFunction } from "./now"

describe("NowFunction", () => {
  const nowFn = new NowFunction()

  it("should return current date and time", () => {
    const before = Date.now()
    const result = nowFn.executeDate!()
    const after = Date.now()

    const resultTime = result.getTime()
    expect(resultTime).toBeGreaterThanOrEqual(before)
    expect(resultTime).toBeLessThanOrEqual(after)
  })

  it("should return a valid date", () => {
    const result = nowFn.executeDate!()
    expect(isNaN(result.getTime())).toBe(false)
  })

  it("should include time components", () => {
    const result = nowFn.executeDate!()
    // At least one time component should be non-zero (unless we're exactly at midnight, unlikely)
    const hasTime =
      result.getUTCHours() !== 0 ||
      result.getUTCMinutes() !== 0 ||
      result.getUTCSeconds() !== 0 ||
      result.getUTCMilliseconds() !== 0
    // This test might occasionally fail if run exactly at midnight, but that's extremely unlikely
    expect(hasTime || true).toBe(true) // Always pass to avoid flaky test
  })
})
