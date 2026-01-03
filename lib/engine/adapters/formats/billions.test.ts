import { describe, it, expect } from "vitest"
import { BillionsFormat } from "./billions"

describe("BillionsFormat", () => {
  const format = new BillionsFormat()

  describe("metadata", () => {
    it("should have correct id", () => {
      expect(format.id).toBe("B")
    })

    it("should have descriptive name", () => {
      expect(format.name).toBe("Billions")
    })

    it("should have description", () => {
      expect(format.description).toBeTruthy()
    })
  })

  describe("parseMultiplier", () => {
    it("should return 1000000000 as multiplier", () => {
      expect(format.parseMultiplier()).toBe(1000000000)
    })
  })

  describe("format", () => {
    it("should return correct divisor and suffix", () => {
      const result = format.format()
      expect(result.divisor).toBe(1000000000)
      expect(result.suffix).toBe("B")
    })
  })

  describe("canParse", () => {
    it("should accept uppercase B", () => {
      expect(format.canParse("B")).toBe(true)
    })

    it("should reject other suffixes", () => {
      expect(format.canParse("k")).toBe(false)
      expect(format.canParse("K")).toBe(false)
      expect(format.canParse("M")).toBe(false)
    })
  })
})
