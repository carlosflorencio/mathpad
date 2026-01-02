import { describe, it, expect } from "vitest"
import Big from "big.js"
import { AddOperator } from "./add"

describe("AddOperator", () => {
  const add = new AddOperator()

  describe("executeNumbers", () => {
    it("should add two numbers", () => {
      expect(add.executeNumbers?.(new Big("1"), new Big("2")).toString()).toBe("3")
      expect(add.executeNumbers?.(new Big("10.5"), new Big("5.25")).toString()).toBe("15.75")
    })

    it("should handle negative numbers", () => {
      expect(add.executeNumbers?.(new Big("-5"), new Big("3")).toString()).toBe("-2")
      expect(add.executeNumbers?.(new Big("-5"), new Big("-3")).toString()).toBe("-8")
    })
  })

  describe("executeNumberPercent", () => {
    it("should add percentage to number (100 + 20% = 120)", () => {
      expect(add.executeNumberPercent?.(new Big("100"), new Big("20")).toString()).toBe("120")
    })

    it("should handle negative percentages", () => {
      expect(add.executeNumberPercent?.(new Big("100"), new Big("-10")).toString()).toBe("90")
    })
  })

  // Note: executePercentNumber is not implemented for add
  // Percent + Number is invalid (e.g., 10% + 20 should error)

  describe("executePercentPercent", () => {
    it("should add two percentages", () => {
      expect(add.executePercentPercent?.(new Big("20"), new Big("10")).toString()).toBe("30")
      expect(add.executePercentPercent?.(new Big("15"), new Big("5")).toString()).toBe("20")
    })
  })
})
