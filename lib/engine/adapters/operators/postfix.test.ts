import { describe, it, expect } from "vitest"
import Big from "big.js"
import { IncrementOperator, DecrementOperator } from "./postfix"

describe("IncrementOperator", () => {
  const increment = new IncrementOperator()

  describe("executeNumber", () => {
    it("should increment positive number by 1", () => {
      const result = increment.executeNumber(new Big(5))
      expect(result.toString()).toBe("6")
    })

    it("should increment zero to 1", () => {
      const result = increment.executeNumber(new Big(0))
      expect(result.toString()).toBe("1")
    })

    it("should increment negative number by 1", () => {
      const result = increment.executeNumber(new Big(-3))
      expect(result.toString()).toBe("-2")
    })

    it("should increment decimal number by 1", () => {
      const result = increment.executeNumber(new Big(2.5))
      expect(result.toString()).toBe("3.5")
    })
  })

  describe("executePercent", () => {
    it("should increment percentage by 1", () => {
      const result = increment.executePercent(new Big(50))
      expect(result.toString()).toBe("51")
    })

    it("should increment zero percent to 1", () => {
      const result = increment.executePercent(new Big(0))
      expect(result.toString()).toBe("1")
    })
  })
})

describe("DecrementOperator", () => {
  const decrement = new DecrementOperator()

  describe("executeNumber", () => {
    it("should decrement positive number by 1", () => {
      const result = decrement.executeNumber(new Big(5))
      expect(result.toString()).toBe("4")
    })

    it("should decrement 1 to zero", () => {
      const result = decrement.executeNumber(new Big(1))
      expect(result.toString()).toBe("0")
    })

    it("should decrement zero to -1", () => {
      const result = decrement.executeNumber(new Big(0))
      expect(result.toString()).toBe("-1")
    })

    it("should decrement negative number by 1", () => {
      const result = decrement.executeNumber(new Big(-3))
      expect(result.toString()).toBe("-4")
    })

    it("should decrement decimal number by 1", () => {
      const result = decrement.executeNumber(new Big(2.5))
      expect(result.toString()).toBe("1.5")
    })
  })

  describe("executePercent", () => {
    it("should decrement percentage by 1", () => {
      const result = decrement.executePercent(new Big(50))
      expect(result.toString()).toBe("49")
    })

    it("should decrement 1 percent to zero", () => {
      const result = decrement.executePercent(new Big(1))
      expect(result.toString()).toBe("0")
    })
  })
})
