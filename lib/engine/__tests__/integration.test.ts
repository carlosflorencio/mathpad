import { describe, it, expect } from "vitest"
import { computeResults } from "../index"
import { defaultPreferences } from "@/lib/types"

describe("Integration Tests", () => {
  const prefs = { ...defaultPreferences, decimalPlaces: 2 }

  describe("Basic Arithmetic", () => {
    it("should evaluate simple addition", () => {
      const results = computeResults("1 + 2", prefs)
      expect(results[0]).toBe("3")
    })

    it("should evaluate subtraction", () => {
      const results = computeResults("10 - 3", prefs)
      expect(results[0]).toBe("7")
    })

    it("should evaluate multiplication", () => {
      const results = computeResults("5 * 6", prefs)
      expect(results[0]).toBe("30")
    })

    it("should evaluate division", () => {
      const results = computeResults("20 / 4", prefs)
      expect(results[0]).toBe("5")
    })

    it("should evaluate exponentiation", () => {
      const results = computeResults("2 ^ 3", prefs)
      expect(results[0]).toBe("8")
    })

    it("should handle order of operations", () => {
      const results = computeResults("1 + 2 * 3", prefs)
      expect(results[0]).toBe("7")
    })

    it("should handle parentheses", () => {
      const results = computeResults("(1 + 2) * 3", prefs)
      expect(results[0]).toBe("9")
    })
  })

  describe("Number Formats", () => {
    it("should handle decimals", () => {
      const results = computeResults("3.14 + 2.86", prefs)
      expect(results[0]).toBe("6")
    })

    it("should handle k suffix", () => {
      const results = computeResults("10k + 5k", prefs)
      expect(results[0]).toBe("15,000")
    })

    it("should handle M suffix", () => {
      const results = computeResults("1M + 500k", prefs)
      expect(results[0]).toBe("1,500,000")
    })

    it("should handle B suffix", () => {
      const results = computeResults("1B + 500M", prefs)
      expect(results[0]).toBe("1,500,000,000")
    })

    it("should handle numbers with separators", () => {
      const results = computeResults("1,000 + 2,000", prefs)
      expect(results[0]).toBe("3,000")
    })
  })

  describe("Percentages", () => {
    it("should evaluate percentage literals", () => {
      const results = computeResults("50%", prefs)
      expect(results[0]).toBe("50%")
    })

    it("should add percentage to number", () => {
      const results = computeResults("100 + 20%", prefs)
      expect(results[0]).toBe("120")
    })

    it("should subtract percentage from number", () => {
      const results = computeResults("100 - 20%", prefs)
      expect(results[0]).toBe("80")
    })

    it("should multiply number by percentage", () => {
      const results = computeResults("100 * 20%", prefs)
      expect(results[0]).toBe("20")
    })

    it('should handle "of" operator', () => {
      const results = computeResults("20% of 100", prefs)
      expect(results[0]).toBe("20")
    })

    it("should add percentages", () => {
      const results = computeResults("10% + 5%", prefs)
      expect(results[0]).toBe("15%")
    })
  })

  describe("Variables", () => {
    it("should assign and use variables", () => {
      const results = computeResults("x = 10\nx + 5", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("15")
    })

    it("should handle multi-word variable names", () => {
      const results = computeResults("total price = 100\ntotal price * 2", prefs)
      expect(results[0]).toBe("100")
      expect(results[1]).toBe("200")
    })

    it("should use variables across multiple lines", () => {
      const results = computeResults("a = 10\nb = 20\na + b", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("20")
      expect(results[2]).toBe("30")
    })

    it("should handle variable reassignment", () => {
      const results = computeResults("x = 10\nx = 20\nx", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("20")
      expect(results[2]).toBe("20")
    })

    it("should handle multiline variable assignment with number", () => {
      const results = computeResults("variable2 =\n  1000\nvariable2", prefs)
      expect(results[0]).toBe("")
      expect(results[1]).toBe("1,000")
      expect(results[2]).toBe("1,000")
    })

    it("should handle multiline variable with expression", () => {
      const results = computeResults("result =\n  100 + 50\nresult * 2", prefs)
      expect(results[0]).toBe("")
      expect(results[1]).toBe("150")
      expect(results[2]).toBe("300")
    })

    it("should handle multiline variable with tabs", () => {
      const results = computeResults("price =\n\t500\nprice + 100", prefs)
      expect(results[0]).toBe("")
      expect(results[1]).toBe("500")
      expect(results[2]).toBe("600")
    })

    it("should handle multiline variable with percentage", () => {
      const results = computeResults("tax =\n  15%\ntax", prefs)
      expect(results[0]).toBe("")
      expect(results[1]).toBe("15%")
      expect(results[2]).toBe("15%")
    })

    it("should handle multiple multiline variables", () => {
      const results = computeResults("a =\n  100\nb =\n  200\na + b", prefs)
      expect(results[0]).toBe("")
      expect(results[1]).toBe("100")
      expect(results[2]).toBe("")
      expect(results[3]).toBe("200")
      expect(results[4]).toBe("300")
    })
  })

  describe("Aggregate Functions", () => {
    it("should sum previous lines", () => {
      const results = computeResults("10\n20\n30\nsum", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("20")
      expect(results[2]).toBe("30")
      expect(results[3]).toBe("60")
    })

    it("should calculate average", () => {
      const results = computeResults("10\n20\n30\navg", prefs)
      expect(results[3]).toBe("20")
    })

    it("should find minimum", () => {
      const results = computeResults("30\n10\n20\nmin", prefs)
      expect(results[3]).toBe("10")
    })

    it("should find maximum", () => {
      const results = computeResults("30\n10\n20\nmax", prefs)
      expect(results[3]).toBe("30")
    })

    it("should count numbers", () => {
      const results = computeResults("10\n20\n30\ncount", prefs)
      expect(results[3]).toBe("3")
    })

    it("should ignore empty lines in aggregates", () => {
      const results = computeResults("10\n\n20\nsum", prefs)
      expect(results[3]).toBe("30")
    })
  })

  describe("Unary Operators", () => {
    it("should handle negative numbers", () => {
      const results = computeResults("-5", prefs)
      expect(results[0]).toBe("-5")
    })

    it("should handle double negation", () => {
      const results = computeResults("--5", prefs)
      expect(results[0]).toBe("5")
    })

    it("should handle unary plus", () => {
      const results = computeResults("+5", prefs)
      expect(results[0]).toBe("5")
    })
  })

  describe("Postfix Operators", () => {
    it("should increment number", () => {
      const results = computeResults("2++", prefs)
      expect(results[0]).toBe("3")
    })

    it("should decrement number", () => {
      const results = computeResults("5--", prefs)
      expect(results[0]).toBe("4")
    })

    it("should increment expression in parentheses", () => {
      const results = computeResults("(2 + 3)++", prefs)
      expect(results[0]).toBe("6")
    })

    it("should decrement expression in parentheses", () => {
      const results = computeResults("(10 - 3)--", prefs)
      expect(results[0]).toBe("6")
    })

    it("should increment percentage", () => {
      const results = computeResults("50%++", prefs)
      expect(results[0]).toBe("51%")
    })

    it("should decrement percentage", () => {
      const results = computeResults("75%--", prefs)
      expect(results[0]).toBe("74%")
    })

    it("should work in larger expressions", () => {
      const results = computeResults("5++ + 10", prefs)
      expect(results[0]).toBe("16")
    })

    it("should work with variables", () => {
      const results = computeResults("x = 10\nx++", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("11")
    })
  })

  describe("Error Handling", () => {
    it("should handle division by zero", () => {
      const results = computeResults("1 / 0", prefs)
      expect(results[0]).toContain("Error")
    })

    it("should handle undefined variables", () => {
      const results = computeResults("x + 5", prefs)
      expect(results[0]).toContain("Error")
    })

    it("should handle invalid operations", () => {
      const results = computeResults("10% + 20", prefs)
      expect(results[0]).toContain("Error")
    })
  })

  describe("Complex Expressions", () => {
    it("should evaluate invoice-style calculation", () => {
      const input = `item1 = 100
item2 = 200
item3 = 150
subtotal = sum
tax = subtotal * 8%
total = subtotal + tax`
      const results = computeResults(input, prefs)
      expect(results[0]).toBe("100")
      expect(results[1]).toBe("200")
      expect(results[2]).toBe("150")
      expect(results[3]).toBe("450") // sum
      expect(results[4]).toBe("36") // tax
      expect(results[5]).toBe("486") // total
    })

    it("should handle percentage calculations with variables", () => {
      // Fixed: "of" operator with variables
      const input = `base = 1000
20% of base
base - (20% of base)`
      const results = computeResults(input, prefs)
      expect(results[0]).toBe("1,000")
      expect(results[1]).toBe("200")
      expect(results[2]).toBe("800")
    })

    it("should handle mixed operations", () => {
      const input = `salary = 100k
tax rate = 25%
tax = salary * tax rate
net = salary - tax`
      const results = computeResults(input, prefs)
      expect(results[0]).toBe("100,000")
      expect(results[1]).toBe("25%")
      expect(results[2]).toBe("25,000")
      expect(results[3]).toBe("75,000")
    })
  })

  describe("Empty and Comment Lines", () => {
    it("should handle empty lines", () => {
      const results = computeResults("10\n\n20", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("")
      expect(results[2]).toBe("20")
    })

    it("should handle multiple empty lines", () => {
      const results = computeResults("\n\n10\n\n", prefs)
      expect(results[2]).toBe("10")
    })

    it("should handle comment lines", () => {
      const results = computeResults("10\n# This is a comment\n20", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("")
      expect(results[2]).toBe("20")
    })

    it("should handle multiple comment lines", () => {
      const results = computeResults("# Header\n10\n# Middle\n20\n# Footer", prefs)
      expect(results[0]).toBe("")
      expect(results[1]).toBe("10")
      expect(results[2]).toBe("")
      expect(results[3]).toBe("20")
      expect(results[4]).toBe("")
    })

    it("should ignore comments in aggregate functions", () => {
      const results = computeResults("10\n# comment\n20\nsum", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("")
      expect(results[2]).toBe("20")
      expect(results[3]).toBe("30")
    })
  })

  describe("Separators", () => {
    it("should reset context after separator", () => {
      const results = computeResults("x = 10\n---\nx + 5", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("")
      expect(results[2]).toContain("Error") // x is not defined after separator
    })

    it("should reset aggregates after separator", () => {
      const results = computeResults("10\n20\nsum\n---\n30\n40\nsum", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("20")
      expect(results[2]).toBe("30") // sum of 10 + 20
      expect(results[3]).toBe("")
      expect(results[4]).toBe("30")
      expect(results[5]).toBe("40")
      expect(results[6]).toBe("70") // sum of 30 + 40 (not including previous)
    })

    it("should handle multiple separators", () => {
      const results = computeResults("x = 1\n---\nx = 2\n---\nx = 3", prefs)
      expect(results[0]).toBe("1")
      expect(results[1]).toBe("")
      expect(results[2]).toBe("2")
      expect(results[3]).toBe("")
      expect(results[4]).toBe("3")
    })

    it("should handle separator with spaces", () => {
      const results = computeResults("10\n  ---  \n20", prefs)
      expect(results[0]).toBe("10")
      expect(results[1]).toBe("")
      expect(results[2]).toBe("20")
    })

    it("should handle complex scenario with comments and separators", () => {
      const input = `# Invoice 1
item1 = 100
item2 = 200
subtotal = sum
---
# Invoice 2
item1 = 50
item2 = 75
subtotal = sum`
      const results = computeResults(input, prefs)
      expect(results[0]).toBe("") // comment
      expect(results[1]).toBe("100")
      expect(results[2]).toBe("200")
      expect(results[3]).toBe("300") // sum
      expect(results[4]).toBe("") // separator
      expect(results[5]).toBe("") // comment
      expect(results[6]).toBe("50")
      expect(results[7]).toBe("75")
      expect(results[8]).toBe("125") // sum (new context)
    })
  })

  describe("Formatting Options", () => {
    it("should respect decimal places", () => {
      const prefs1 = { ...defaultPreferences, decimalPlaces: 0 }
      const prefs2 = { ...defaultPreferences, decimalPlaces: 4 }

      const results1 = computeResults("1 / 3", prefs1)
      const results2 = computeResults("1 / 3", prefs2)

      expect(results1[0]).toBe("0")
      expect(results2[0]).toBe("0.3333")
    })

    it("should respect thousands separator", () => {
      const prefsComma = { ...defaultPreferences, thousandsSeparator: "," as const }
      const prefsSpace = { ...defaultPreferences, thousandsSeparator: " " as const }

      const results1 = computeResults("1000000", prefsComma)
      const results2 = computeResults("1000000", prefsSpace)

      expect(results1[0]).toBe("1,000,000")
      expect(results2[0]).toBe("1 000 000")
    })

    it("should respect decimal separator", () => {
      const prefsComma = {
        ...defaultPreferences,
        decimalSeparator: "," as const,
        thousandsSeparator: "." as const,
        decimalPlaces: 2,
      }

      const results = computeResults("1000.5", prefsComma)
      // Note: showTrailingZeros is false by default, so "1.000,5" is correct
      expect(results[0]).toBe("1.000,5")
    })
  })

  describe("Math Functions", () => {
    it("should round to nearest integer", () => {
      const results = computeResults("round(3.14)\nround(3.5)\nround(3.9)", prefs)
      expect(results[0]).toBe("3")
      expect(results[1]).toBe("4")
      expect(results[2]).toBe("4")
    })

    it("should round up with ceil", () => {
      const results = computeResults("ceil(3.14)\nceil(3.9)\nceil(-2.3)", prefs)
      expect(results[0]).toBe("4")
      expect(results[1]).toBe("4")
      expect(results[2]).toBe("-2") // ceil rounds towards positive infinity
    })

    it("should round down with floor", () => {
      const results = computeResults("floor(3.14)\nfloor(3.9)\nfloor(-2.3)", prefs)
      expect(results[0]).toBe("3")
      expect(results[1]).toBe("3")
      expect(results[2]).toBe("-3") // floor rounds towards negative infinity
    })

    it("should calculate absolute value", () => {
      const results = computeResults("abs(-5)\nabs(5)\nabs(-3.14)", prefs)
      expect(results[0]).toBe("5")
      expect(results[1]).toBe("5")
      expect(results[2]).toBe("3.14")
    })

    it("should calculate square root", () => {
      const results = computeResults("sqrt(4)\nsqrt(9)\nsqrt(2)", prefs)
      expect(results[0]).toBe("2")
      expect(results[1]).toBe("3")
      expect(results[2]).toBe("1.41")
    })

    it("should handle functions in expressions", () => {
      const results = computeResults("round(3.7) + ceil(2.1)", prefs)
      expect(results[0]).toBe("7")
    })

    it("should handle nested functions", () => {
      const results = computeResults("round(sqrt(10))", prefs)
      expect(results[0]).toBe("3")
    })

    it("should handle functions with variables", () => {
      const input = `x = 3.7
y = round(x)
z = y * 2`
      const results = computeResults(input, prefs)
      expect(results[0]).toBe("3.7")
      expect(results[1]).toBe("4")
      expect(results[2]).toBe("8")
    })

    it("should error on sqrt of negative number", () => {
      const results = computeResults("sqrt(-4)", prefs)
      expect(results[0]).toContain("Error")
    })

    it("should work with percentages", () => {
      const results = computeResults("round(33.7%)", prefs)
      expect(results[0]).toBe("34%")
    })
  })

  describe("K/M/B Formatting", () => {
    it("should format expression with K suffix", () => {
      const results = computeResults("5000 in K", prefs)
      expect(results[0]).toBe("5K")
    })

    it("should format expression with M suffix", () => {
      const results = computeResults("2500000 in M", prefs)
      expect(results[0]).toBe("2.5M")
    })

    it("should format expression with B suffix", () => {
      const results = computeResults("1500000000 in B", prefs)
      expect(results[0]).toBe("1.5B")
    })

    it("should format variable assignment with K suffix", () => {
      const results = computeResults("price in K = 10000\nprice", prefs)
      expect(results[0]).toBe("10K")
      expect(results[1]).toBe("10K")
    })

    it("should format variable assignment with M suffix", () => {
      const results = computeResults("revenue in M = 5000000\nrevenue", prefs)
      expect(results[0]).toBe("5M")
      expect(results[1]).toBe("5M")
    })

    it("should format variable assignment with B suffix", () => {
      const results = computeResults("budget in B = 3000000000\nbudget", prefs)
      expect(results[0]).toBe("3B")
      expect(results[1]).toBe("3B")
    })

    it("should format complex expressions with K", () => {
      const results = computeResults("(1000 + 500) * 2 in K", prefs)
      expect(results[0]).toBe("3K")
    })

    it("should handle decimals with K formatting", () => {
      const results = computeResults("1234 in K", prefs)
      expect(results[0]).toBe("1.23K")
    })

    it("should handle decimals with M formatting", () => {
      const results = computeResults("12345678 in M", prefs)
      expect(results[0]).toBe("12.35M")
    })

    it("should format percentage with K suffix", () => {
      const results = computeResults("5000% in K", prefs)
      expect(results[0]).toBe("5K%")
    })

    it("should use formatted variable in calculations", () => {
      const results = computeResults("base in K = 5000\nresult = base * 2\nresult in K", prefs)
      expect(results[0]).toBe("5K")
      expect(results[1]).toBe("10K")
      expect(results[2]).toBe("10K")
    })
  })

  describe("Inline Formats - Currency", () => {
    it("should parse inline dollar format without space", () => {
      const results = computeResults("100$", prefs)
      expect(results[0]).toBe("$100")
    })

    it("should parse inline dollar format with space", () => {
      const results = computeResults("100 $", prefs)
      expect(results[0]).toBe("$100")
    })

    it("should parse inline euro format without space", () => {
      const results = computeResults("100€", prefs)
      expect(results[0]).toBe("€100")
    })

    it("should parse inline euro format with space", () => {
      const results = computeResults("100 €", prefs)
      expect(results[0]).toBe("€100")
    })

    it("should propagate dollar format through calculations", () => {
      const results = computeResults("100$ * 2", prefs)
      expect(results[0]).toBe("$200")
    })

    it("should propagate euro format through calculations", () => {
      const results = computeResults("50€ + 25€", prefs)
      expect(results[0]).toBe("€75")
    })

    it("should handle dollar format in complex expressions", () => {
      const results = computeResults("(100$ + 50$) * 2", prefs)
      expect(results[0]).toBe("$300")
    })
  })

  describe("Inline Formats - Units", () => {
    it("should parse inline km format without space", () => {
      const results = computeResults("100km", prefs)
      expect(results[0]).toBe("100km")
    })

    it("should parse inline km format with space", () => {
      const results = computeResults("100 km", prefs)
      expect(results[0]).toBe("100km")
    })

    it("should parse inline m format without space", () => {
      const results = computeResults("50m", prefs)
      expect(results[0]).toBe("50m")
    })

    it("should parse inline m format with space", () => {
      const results = computeResults("50 m", prefs)
      expect(results[0]).toBe("50m")
    })

    it("should propagate km format through calculations", () => {
      const results = computeResults("100km + 50km", prefs)
      expect(results[0]).toBe("150km")
    })

    it("should propagate m format through calculations", () => {
      const results = computeResults("10m * 3", prefs)
      expect(results[0]).toBe("30m")
    })

    it("should handle unit format in complex expressions", () => {
      const results = computeResults("(100km + 50km) / 2", prefs)
      expect(results[0]).toBe("75km")
    })
  })

  describe("Inline Formats - Time Units", () => {
    it("should parse and preserve minutes", () => {
      const results = computeResults("30min + 15min", prefs)
      expect(results[0]).toBe("45min")
    })

    it("should parse minutes with full word", () => {
      const results = computeResults("30 minutes", prefs)
      expect(results[0]).toBe("30min")
    })

    it("should parse and preserve seconds", () => {
      const results = computeResults("90sec * 2", prefs)
      expect(results[0]).toBe("180sec")
    })

    it("should parse seconds with full word", () => {
      const results = computeResults("45 seconds", prefs)
      expect(results[0]).toBe("45sec")
    })

    it("should parse and preserve hours", () => {
      const results = computeResults("2hr + 3hr", prefs)
      expect(results[0]).toBe("5hr")
    })

    it("should parse hours with h suffix", () => {
      const results = computeResults("8h", prefs)
      expect(results[0]).toBe("8hr")
    })
  })

  describe("Inline Formats - Distance Units", () => {
    it("should parse and preserve kilometers", () => {
      const results = computeResults("10km + 5km", prefs)
      expect(results[0]).toBe("15km")
    })

    it("should parse kilometers with full word", () => {
      const results = computeResults("100 kilometers", prefs)
      expect(results[0]).toBe("100km")
    })

    it("should parse and preserve meters", () => {
      const results = computeResults("100m * 2", prefs)
      expect(results[0]).toBe("200m")
    })

    it("should parse meters with full word (US spelling)", () => {
      const results = computeResults("50 meters", prefs)
      expect(results[0]).toBe("50m")
    })

    it("should parse metres with full word (British spelling)", () => {
      const results = computeResults("50 metres", prefs)
      expect(results[0]).toBe("50m")
    })

    it("should parse and preserve miles", () => {
      const results = computeResults("10mi + 5mi", prefs)
      expect(results[0]).toBe("15mi")
    })

    it("should parse miles with full word", () => {
      const results = computeResults("100 miles", prefs)
      expect(results[0]).toBe("100mi")
    })

    it("should parse and preserve feet", () => {
      const results = computeResults("100ft * 2", prefs)
      expect(results[0]).toBe("200ft")
    })

    it("should parse feet with full word", () => {
      const results = computeResults("50 feet", prefs)
      expect(results[0]).toBe("50ft")
    })
  })

  describe("Inline Formats - Weight Units", () => {
    it("should parse and preserve kilograms", () => {
      const results = computeResults("50kg + 25kg", prefs)
      expect(results[0]).toBe("75kg")
    })

    it("should parse kilograms with full word", () => {
      const results = computeResults("100 kilograms", prefs)
      expect(results[0]).toBe("100kg")
    })

    it("should parse and preserve pounds", () => {
      const results = computeResults("150lb + 50lb", prefs)
      expect(results[0]).toBe("200lb")
    })

    it("should parse pounds with lbs suffix", () => {
      const results = computeResults("200lbs", prefs)
      expect(results[0]).toBe("200lb")
    })

    it("should parse and preserve grams", () => {
      const results = computeResults("500g * 2", prefs)
      expect(results[0]).toBe("1,000g")
    })

    it("should distinguish grams (g) from uppercase G", () => {
      const results = computeResults("100g + 50g", prefs)
      expect(results[0]).toBe("150g")
    })
  })

  describe("Inline Formats - Volume Units", () => {
    it("should parse and preserve liters", () => {
      const results = computeResults("2L + 3L", prefs)
      expect(results[0]).toBe("5L")
    })

    it("should parse liters with full word", () => {
      const results = computeResults("10 liters", prefs)
      expect(results[0]).toBe("10L")
    })

    it("should parse and preserve milliliters", () => {
      const results = computeResults("250ml * 4", prefs)
      expect(results[0]).toBe("1,000ml")
    })

    it("should parse milliliters with full word", () => {
      const results = computeResults("500 milliliters", prefs)
      expect(results[0]).toBe("500ml")
    })

    it("should parse and preserve gallons", () => {
      const results = computeResults("5gal + 3gal", prefs)
      expect(results[0]).toBe("8gal")
    })

    it("should parse gallons with full word", () => {
      const results = computeResults("20 gallons", prefs)
      expect(results[0]).toBe("20gal")
    })
  })

  describe("Unit Type Validation - Incompatible Operations", () => {
    it("should reject adding currency and time units", () => {
      const results = computeResults("100$ + 10sec", prefs)
      expect(results[0]).toBe("Error: Cannot add currency and time")
    })

    it("should reject adding currency and distance units", () => {
      const results = computeResults("100$ + 10km", prefs)
      expect(results[0]).toBe("Error: Cannot add currency and distance")
    })

    it("should reject subtracting time and distance units", () => {
      const results = computeResults("10hr - 10km", prefs)
      expect(results[0]).toBe("Error: Cannot subtract time and distance")
    })

    it("should reject multiplying weight and volume units", () => {
      const results = computeResults("100kg * 10L", prefs)
      expect(results[0]).toBe("Error: Cannot multiply weight and volume")
    })

    it("should reject dividing volume and weight units", () => {
      const results = computeResults("100L / 10kg", prefs)
      expect(results[0]).toBe("Error: Cannot divide volume and weight")
    })

    it("should reject adding distance and time units", () => {
      const results = computeResults("100km + 30min", prefs)
      expect(results[0]).toBe("Error: Cannot add distance and time")
    })

    it("should allow operations between same unit types", () => {
      const results = computeResults("100$ + 50$", prefs)
      expect(results[0]).toBe("$150")
    })

    it("should allow operations between units and plain numbers", () => {
      const results = computeResults("100km + 50", prefs)
      expect(results[0]).toBe("150km")
    })

    it("should allow operations with K/M/B formats (number category)", () => {
      const results = computeResults("10k + 100$", prefs)
      expect(results[0]).toBe("$10,100")
    })
  })

  describe("Unit Conversions with 'to' Keyword", () => {
    it("should convert kilometers to meters", () => {
      const results = computeResults("100km to m", prefs)
      expect(results[0]).toBe("100,000m")
    })

    it("should convert meters to kilometers", () => {
      const results = computeResults("5000m to km", prefs)
      expect(results[0]).toBe("5km")
    })

    it("should convert miles to meters", () => {
      const results = computeResults("1mi to m", prefs)
      expect(results[0]).toBe("1,609.34m")
    })

    it("should convert feet to meters", () => {
      const results = computeResults("10ft to m", prefs)
      expect(results[0]).toBe("3.05m")
    })

    it("should convert hours to minutes", () => {
      const results = computeResults("1hr to min", prefs)
      expect(results[0]).toBe("60min")
    })

    it("should convert seconds to minutes", () => {
      const results = computeResults("90sec to min", prefs)
      expect(results[0]).toBe("1.5min")
    })

    it("should convert minutes to seconds", () => {
      const results = computeResults("2min to sec", prefs)
      expect(results[0]).toBe("120sec")
    })

    it("should convert kilograms to grams", () => {
      const results = computeResults("2kg to g", prefs)
      expect(results[0]).toBe("2,000g")
    })

    it("should convert grams to kilograms", () => {
      const results = computeResults("1000g to kg", prefs)
      expect(results[0]).toBe("1kg")
    })

    it("should convert pounds to kilograms", () => {
      const results = computeResults("10lb to kg", prefs)
      expect(results[0]).toBe("4.54kg")
    })

    it("should convert liters to milliliters", () => {
      const results = computeResults("2L to ml", prefs)
      expect(results[0]).toBe("2,000ml")
    })

    it("should convert milliliters to liters", () => {
      const results = computeResults("500ml to L", prefs)
      expect(results[0]).toBe("0.5L")
    })

    it("should convert gallons to liters", () => {
      const results = computeResults("1gal to L", prefs)
      expect(results[0]).toBe("3.79L")
    })

    it("should reject conversion between incompatible categories", () => {
      const results = computeResults("100km to sec", prefs)
      expect(results[0]).toBe("Error: Cannot convert distance to time")
    })

    it("should reject conversion of numbers without units", () => {
      const results = computeResults("100 to m", prefs)
      expect(results[0]).toBe("Error: Cannot convert number without a unit")
    })

    it("should support conversion in expressions", () => {
      const results = computeResults("(100km + 50km) to m", prefs)
      expect(results[0]).toBe("150,000m")
    })

    it("should support conversion with variables", () => {
      const results = computeResults("x = 5km\nx to m", prefs)
      expect(results[1]).toBe("5,000m")
    })
  })
})
