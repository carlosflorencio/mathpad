import { describe, it, expect } from "vitest"
import Big from "big.js"
import { SqrtFunction } from "./sqrt"

describe("SqrtFunction", () => {
  const sqrt = new SqrtFunction()

  it("should calculate square root", () => {
    expect(sqrt.execute(new Big("4")).toString()).toBe("2")
    expect(sqrt.execute(new Big("9")).toString()).toBe("3")
    expect(sqrt.execute(new Big("16")).toString()).toBe("4")
  })

  it("should handle decimals", () => {
    const result = sqrt.execute(new Big("2"))
    expect(parseFloat(result.toString())).toBeCloseTo(1.414, 3)
  })

  it("should handle zero", () => {
    expect(sqrt.execute(new Big("0")).toString()).toBe("0")
  })

  it("should validate negative numbers", () => {
    const error = sqrt.validate?.(new Big("-4"))
    expect(error).toBe("Cannot take square root of negative number")
  })
})
