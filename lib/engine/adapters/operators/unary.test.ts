import { describe, it, expect } from "vitest"
import Big from "big.js"
import { UnaryPlusOperator, UnaryMinusOperator } from "./unary"

describe("UnaryPlusOperator", () => {
  const plus = new UnaryPlusOperator()

  it("should return the same number", () => {
    expect(plus.executeNumber?.(new Big("5")).toString()).toBe("5")
    expect(plus.executeNumber?.(new Big("-5")).toString()).toBe("-5")
  })

  it("should return the same percent", () => {
    expect(plus.executePercent?.(new Big("10")).toString()).toBe("10")
  })
})

describe("UnaryMinusOperator", () => {
  const minus = new UnaryMinusOperator()

  it("should negate numbers", () => {
    expect(minus.executeNumber?.(new Big("5")).toString()).toBe("-5")
    expect(minus.executeNumber?.(new Big("-5")).toString()).toBe("5")
    expect(minus.executeNumber?.(new Big("0")).toString()).toBe("0")
  })

  it("should negate percents", () => {
    expect(minus.executePercent?.(new Big("10")).toString()).toBe("-10")
    expect(minus.executePercent?.(new Big("-10")).toString()).toBe("10")
  })
})
