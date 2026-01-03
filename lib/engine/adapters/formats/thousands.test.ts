import { describe, it, expect } from "vitest"
import { ThousandsFormat } from "./thousands"

describe("ThousandsFormat", () => {
  const format = new ThousandsFormat()

  describe("metadata", () => {
    it("should have correct id", () => {
      expect(format.id).toBe("K")
    })

    it("should have descriptive name", () => {
      expect(format.name).toBe("Thousands")
    })

    it("should have description", () => {
      expect(format.description).toBeTruthy()
    })
  })

  describe("parseMultiplier", () => {
    it("should return 1000 as multiplier", () => {
      expect(format.parseMultiplier()).toBe(1000)
    })
  })

  describe("format", () => {
    it("should return correct divisor and suffix", () => {
      const result = format.format()
      expect(result.divisor).toBe(1000)
      expect(result.suffix).toBe("K")
    })
  })

  describe("canParse", () => {
    it("should accept lowercase k", () => {
      expect(format.canParse("k")).toBe(true)
    })

    it("should accept uppercase K", () => {
      expect(format.canParse("K")).toBe(true)
    })

    it("should reject other suffixes", () => {
      expect(format.canParse("M")).toBe(false)
      expect(format.canParse("B")).toBe(false)
      expect(format.canParse("$")).toBe(false)
    })
  })
})
