import { describe, it, expect } from "vitest"
import { tokenize, extractVariables } from "./tokenizer"
import { createContext } from "./types"
import Big from "big.js"

describe("Tokenizer", () => {
  describe("Numbers", () => {
    it("should tokenize simple integers", () => {
      const tokens = tokenize("42")
      expect(tokens[0]).toMatchObject({ type: "number", value: "42" })
    })

    it("should tokenize decimals", () => {
      const tokens = tokenize("3.14")
      expect(tokens[0]).toMatchObject({ type: "number", value: "3.14" })
    })

    it("should tokenize numbers with k suffix", () => {
      const tokens = tokenize("100k")
      expect(tokens[0]).toMatchObject({ type: "number", value: "100k" })
    })

    it("should tokenize numbers with M suffix", () => {
      const tokens = tokenize("1.5M")
      expect(tokens[0]).toMatchObject({ type: "number", value: "1.5M" })
    })

    it("should tokenize numbers with B suffix", () => {
      const tokens = tokenize("2.5B")
      expect(tokens[0]).toMatchObject({ type: "number", value: "2.5B" })
    })

    it("should tokenize numbers with separators", () => {
      const tokens = tokenize("1,000,000")
      expect(tokens[0]).toMatchObject({ type: "number", value: "1,000,000" })
    })

    it("should tokenize numbers with underscores", () => {
      const tokens = tokenize("1_000_000")
      expect(tokens[0]).toMatchObject({ type: "number", value: "1_000_000" })
    })
  })

  describe("Percentages", () => {
    it("should tokenize percentage literals", () => {
      const tokens = tokenize("25%")
      expect(tokens[0]).toMatchObject({ type: "percent", value: "25" })
    })

    it("should tokenize decimal percentages", () => {
      const tokens = tokenize("12.5%")
      expect(tokens[0]).toMatchObject({ type: "percent", value: "12.5" })
    })
  })

  describe("Operators", () => {
    it("should tokenize arithmetic operators", () => {
      const tokens = tokenize("1 + 2 - 3 * 4 / 5 % 6 ^ 7")
      expect(tokens[1]).toMatchObject({ type: "operator", value: "+" })
      expect(tokens[3]).toMatchObject({ type: "operator", value: "-" })
      expect(tokens[5]).toMatchObject({ type: "operator", value: "*" })
      expect(tokens[7]).toMatchObject({ type: "operator", value: "/" })
      expect(tokens[9]).toMatchObject({ type: "operator", value: "%" })
      expect(tokens[11]).toMatchObject({ type: "operator", value: "^" })
    })

    it("should normalize × to *", () => {
      const tokens = tokenize("2 × 3")
      expect(tokens[1]).toMatchObject({ type: "operator", value: "*" })
    })

    it("should normalize − to -", () => {
      const tokens = tokenize("5 − 3")
      expect(tokens[1]).toMatchObject({ type: "operator", value: "-" })
    })
  })

  describe("Identifiers and Variables", () => {
    it("should tokenize identifiers", () => {
      const tokens = tokenize("salary")
      expect(tokens[0]).toMatchObject({ type: "identifier", value: "salary" })
    })

    it("should tokenize multi-word identifiers", () => {
      const tokens = tokenize("yearly income")
      expect(tokens[0]).toMatchObject({ type: "identifier", value: "yearly income" })
    })

    it("should tokenize identifiers with underscores", () => {
      const tokens = tokenize("total_cost")
      expect(tokens[0]).toMatchObject({ type: "identifier", value: "total_cost" })
    })
  })

  describe("Assignments", () => {
    it("should tokenize variable assignments", () => {
      const tokens = tokenize("x = 100")
      expect(tokens[0]).toMatchObject({ type: "identifier", value: "x" })
      expect(tokens[1]).toMatchObject({ type: "assign", value: "=" })
      expect(tokens[2]).toMatchObject({ type: "number", value: "100" })
    })

    it("should tokenize assignments with multi-word names", () => {
      const tokens = tokenize("total price = 1500")
      expect(tokens[0]).toMatchObject({ type: "identifier", value: "total price" })
      expect(tokens[1]).toMatchObject({ type: "assign", value: "=" })
    })
  })

  describe("Aggregate Keywords", () => {
    it("should recognize sum keyword", () => {
      const tokens = tokenize("sum")
      expect(tokens[0]).toMatchObject({ type: "operator", value: "sum" })
    })

    it("should recognize total keyword", () => {
      const tokens = tokenize("total")
      expect(tokens[0]).toMatchObject({ type: "operator", value: "total" })
    })

    it("should recognize avg keyword", () => {
      const tokens = tokenize("avg")
      expect(tokens[0]).toMatchObject({ type: "operator", value: "avg" })
    })

    it("should recognize min/max keywords", () => {
      const tokens1 = tokenize("min")
      const tokens2 = tokenize("max")
      expect(tokens1[0]).toMatchObject({ type: "operator", value: "min" })
      expect(tokens2[0]).toMatchObject({ type: "operator", value: "max" })
    })

    it("should recognize count keyword", () => {
      const tokens = tokenize("count")
      expect(tokens[0]).toMatchObject({ type: "operator", value: "count" })
    })
  })

  describe("Parentheses", () => {
    it("should tokenize parentheses", () => {
      const tokens = tokenize("(1 + 2)")
      expect(tokens[0]).toMatchObject({ type: "paren", value: "(" })
      expect(tokens[4]).toMatchObject({ type: "paren", value: ")" })
    })
  })

  describe("Complex Expressions", () => {
    it("should tokenize complete expression", () => {
      const tokens = tokenize("100 + 25%")
      expect(tokens).toHaveLength(4) // number, operator, percent, eof
      expect(tokens[0]).toMatchObject({ type: "number", value: "100" })
      expect(tokens[1]).toMatchObject({ type: "operator", value: "+" })
      expect(tokens[2]).toMatchObject({ type: "percent", value: "25" })
    })

    it("should handle labels with colons", () => {
      const tokens = tokenize("Price: 100 * 2")
      expect(tokens[0]).toMatchObject({ type: "number", value: "100" })
      expect(tokens[1]).toMatchObject({ type: "operator", value: "*" })
    })

    it('should tokenize fractions with "of"', () => {
      const tokens = tokenize("20% of 100")
      expect(tokens[0]).toMatchObject({ type: "percent", value: "20" })
      expect(tokens[1]).toMatchObject({ type: "identifier", value: "of" })
      expect(tokens[2]).toMatchObject({ type: "number", value: "100" })
    })

    it('should tokenize fractions with "of" and variable', () => {
      const tokens = tokenize("20% of base")
      expect(tokens[0]).toMatchObject({ type: "percent", value: "20" })
      expect(tokens[1]).toMatchObject({ type: "identifier", value: "of" })
      expect(tokens[2]).toMatchObject({ type: "identifier", value: "base" })
    })
  })

  describe("Variable Extraction", () => {
    it("should extract variable names from assignments", () => {
      const lines = ["x = 10", "y = 20", "result = x + y"]
      const vars = extractVariables(lines)
      expect(vars).toContain("x")
      expect(vars).toContain("y")
      expect(vars).toContain("result")
    })

    it("should handle empty lines", () => {
      const lines = ["", "x = 10", ""]
      const vars = extractVariables(lines)
      expect(vars).toEqual(["x"])
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty input", () => {
      const tokens = tokenize("")
      expect(tokens).toHaveLength(1) // just EOF
      expect(tokens[0]).toMatchObject({ type: "eof" })
    })

    it("should handle whitespace only", () => {
      const tokens = tokenize("   ")
      expect(tokens).toHaveLength(1) // just EOF
    })

    it("should skip unknown characters", () => {
      const tokens = tokenize("1 # 2")
      expect(tokens).toHaveLength(3) // number, number, eof
      expect(tokens[0]).toMatchObject({ type: "number", value: "1" })
      expect(tokens[1]).toMatchObject({ type: "number", value: "2" })
    })
  })

  describe("Conversion keyword detection", () => {
    it("should mark 'in' as conversion when between number and format", () => {
      const tokens = tokenize("100 in km")
      expect(tokens[0]).toMatchObject({ type: "number", value: "100" })
      expect(tokens[1]).toMatchObject({ type: "conversion", value: "in" })
      expect(tokens[2]).toMatchObject({ type: "keyword", value: "km" })
    })

    it("should mark 'in' as conversion for k/m/b formats", () => {
      const tokens = tokenize("1000 in k")
      expect(tokens[0]).toMatchObject({ type: "number", value: "1000" })
      expect(tokens[1]).toMatchObject({ type: "conversion", value: "in" })
      expect(tokens[2]).toMatchObject({ type: "keyword", value: "k" })
    })

    it("should mark 'to' as conversion when between number and format", () => {
      const tokens = tokenize("100 to km")
      expect(tokens[0]).toMatchObject({ type: "number", value: "100" })
      expect(tokens[1]).toMatchObject({ type: "conversion", value: "to" })
      expect(tokens[2]).toMatchObject({ type: "keyword", value: "km" })
    })

    it("should NOT mark 'in' as conversion in middle of sentence", () => {
      const tokens = tokenize("Earth's circumference is in to around 40k km")
      // Find the 'in' token
      const inToken = tokens.find((t) => t.value === "in")
      expect(inToken).toBeDefined()
      expect(inToken?.type).toBe("keyword")
    })

    it("should NOT mark 'to' as conversion in middle of sentence", () => {
      const tokens = tokenize("Earth's circumference is in to around 40k km")
      // Find the 'to' token
      const toToken = tokens.find((t) => t.value === "to")
      expect(toToken).toBeDefined()
      expect(toToken?.type).toBe("keyword")
    })

    it("should NOT mark 'in' as conversion when not followed by format", () => {
      const tokens = tokenize("10 in the morning")
      const inToken = tokens.find((t) => t.value === "in")
      expect(inToken?.type).toBe("keyword")
    })
  })

  describe("Context-aware tokenization", () => {
    it("should skip undefined identifier when context is provided", () => {
      const context = createContext()
      context.variables.set("cal", { type: "number", value: new Big(2) })

      const line = "sdfsdf cal + 2"
      const tokens = tokenize(line, context)

      // Should NOT include "sdfsdf" token since it's undefined
      const identifierTokens = tokens.filter((t) => t.type === "identifier")
      expect(identifierTokens.length).toBe(1) // Only "cal"
      expect(identifierTokens[0].value).toBe("cal")
    })

    it("should include undefined identifier when no context is provided", () => {
      const line = "sdfsdf cal + 2"
      const tokens = tokenize(line) // No context

      // Without context, multi-word identifiers are collected together
      const identifierTokens = tokens.filter((t) => t.type === "identifier")
      expect(identifierTokens.length).toBe(1)
      expect(identifierTokens[0].value).toBe("sdfsdf cal")
    })
  })
})
