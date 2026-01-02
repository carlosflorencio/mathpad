import { describe, it, expect } from "vitest"
import Big from "big.js"
import { MaxAggregate } from "./max"

describe("MaxAggregate", () => {
  const max = new MaxAggregate()

  it("should find maximum value", () => {
    const values = [new Big("30"), new Big("10"), new Big("20")]
    expect(max.execute(values).toString()).toBe("30")
  })

  it("should handle negative numbers", () => {
    const values = [new Big("-5"), new Big("-10"), new Big("-2")]
    expect(max.execute(values).toString()).toBe("-2")
  })

  it("should handle decimals", () => {
    const values = [new Big("1.5"), new Big("1.9"), new Big("1.2")]
    expect(max.execute(values).toString()).toBe("1.9")
  })

  it("should handle single value", () => {
    const values = [new Big("42")]
    expect(max.execute(values).toString()).toBe("42")
  })

  it("should validate empty array", () => {
    const error = max.validate?.([])
    expect(error).toBe("No numbers to max")
  })

  it("should validate non-empty array", () => {
    const error = max.validate?.([new Big("1")])
    expect(error).toBeNull()
  })
})
