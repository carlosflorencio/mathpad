import { describe, it, expect } from "vitest"
import Big from "big.js"
import { MultiplyOperator } from "./multiply"

describe("MultiplyOperator", () => {
  const multiply = new MultiplyOperator()

  describe("executeNumbers", () => {
    it("should multiply two numbers", () => {
      expect(multiply.executeNumbers?.(new Big("5"), new Big("6")).toString()).toBe("30")
      expect(multiply.executeNumbers?.(new Big("2.5"), new Big("4")).toString()).toBe("10")
    })
  })

  describe("executeNumberPercent", () => {
    it("should multiply number by percentage (100 * 20% = 20)", () => {
      expect(multiply.executeNumberPercent?.(new Big("100"), new Big("20")).toString()).toBe("20")
      expect(multiply.executeNumberPercent?.(new Big("50"), new Big("10")).toString()).toBe("5")
    })
  })

  describe("executePercentNumber", () => {
    it("should multiply percentage by number (20% * 100 = 20)", () => {
      expect(multiply.executePercentNumber?.(new Big("20"), new Big("100")).toString()).toBe("20")
    })
  })

  describe("executePercentPercent", () => {
    it("should multiply two percentages (20% * 50% = 10%)", () => {
      expect(multiply.executePercentPercent?.(new Big("20"), new Big("50")).toString()).toBe("10")
    })
  })
})
