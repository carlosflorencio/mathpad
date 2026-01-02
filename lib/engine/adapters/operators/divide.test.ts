import { describe, it, expect } from "vitest"
import Big from "big.js"
import { DivideOperator } from "./divide"

describe("DivideOperator", () => {
  const divide = new DivideOperator()

  describe("executeNumbers", () => {
    it("should divide two numbers", () => {
      expect(divide.executeNumbers?.(new Big("20"), new Big("4")).toString()).toBe("5")
      expect(divide.executeNumbers?.(new Big("10"), new Big("2")).toString()).toBe("5")
    })
  })

  describe("validate", () => {
    it("should return error for division by zero", () => {
      const error = divide.validate?.(new Big("10"), new Big("0"))
      expect(error).toBe("Division by zero")
    })

    it("should return null for valid division", () => {
      const error = divide.validate?.(new Big("10"), new Big("2"))
      expect(error).toBeNull()
    })
  })

  describe("executeNumberPercent", () => {
    it("should divide number by percentage (100 / 20% = 500)", () => {
      expect(divide.executeNumberPercent?.(new Big("100"), new Big("20")).toString()).toBe("500")
    })
  })

  describe("executePercentPercent", () => {
    it("should divide two percentages (50% / 25% = 2)", () => {
      expect(divide.executePercentPercent?.(new Big("50"), new Big("25")).toString()).toBe("2")
    })
  })
})
