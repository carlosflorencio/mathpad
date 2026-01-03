import { describe, it, expect } from "vitest"
import { MillionsFormat } from "./millions"

describe("MillionsFormat", () => {
  const format = new MillionsFormat()

  describe("metadata", () => {
    it("should have correct id", () => {
      expect(format.id).toBe("M")
    })

    it("should have descriptive name", () => {
      expect(format.name).toBe("Millions")
    })

    it("should have description", () => {
      expect(format.description).toBeTruthy()
    })
  })

  describe("parseMultiplier", () => {
    it("should return 1000000 as multiplier", () => {
      expect(format.parseMultiplier()).toBe(1000000)
    })
  })

  describe("format", () => {
    it("should return correct divisor and suffix", () => {
      const result = format.format()
      expect(result.divisor).toBe(1000000)
      expect(result.suffix).toBe("M")
    })
  })

  describe("canParse", () => {
    it("should accept uppercase M", () => {
      expect(format.canParse("M")).toBe(true)
    })

    it("should reject other suffixes", () => {
      expect(format.canParse("k")).toBe(false)
      expect(format.canParse("K")).toBe(false)
      expect(format.canParse("B")).toBe(false)
    })
  })
})
