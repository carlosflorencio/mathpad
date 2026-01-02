import { describe, it, expect } from "vitest"
import Big from "big.js"
import { AbsFunction } from "./abs"

describe("AbsFunction", () => {
  const abs = new AbsFunction()

  it("should return absolute value of positive numbers", () => {
    expect(abs.execute(new Big("5")).toString()).toBe("5")
    expect(abs.execute(new Big("3.14")).toString()).toBe("3.14")
  })

  it("should return absolute value of negative numbers", () => {
    expect(abs.execute(new Big("-5")).toString()).toBe("5")
    expect(abs.execute(new Big("-3.14")).toString()).toBe("3.14")
  })

  it("should handle zero", () => {
    expect(abs.execute(new Big("0")).toString()).toBe("0")
  })
})
