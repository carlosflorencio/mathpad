import { exportAsText } from "./textExport"

describe("exportAsText", () => {
  it("should format simple calculation with results", () => {
    const content = "100\n+20"
    const results = ["100", "120"]

    const expected = "100 │ 100\n+20 │ 120"

    expect(exportAsText(content, results)).toBe(expected)
  })

  it("should handle lines with no results", () => {
    const content = "netflix = 8$\nrent = 600$\n\nexpenses = netflix + rent"
    const results = ["8$", "600$", "", "608$"]

    const expected =
      "netflix = 8$              │ 8$\n" +
      "rent = 600$               │ 600$\n" +
      "                          │ \n" +
      "expenses = netflix + rent │ 608$"

    expect(exportAsText(content, results)).toBe(expected)
  })

  it("should handle empty content", () => {
    const content = ""
    const results = [""]

    expect(exportAsText(content, results)).toBe(" │ ")
  })

  it("should align content based on longest line", () => {
    const content = "short\nlonger line here\nx"
    const results = ["1", "2", "3"]

    const expected = "short            │ 1\nlonger line here │ 2\nx                │ 3"

    expect(exportAsText(content, results)).toBe(expected)
  })

  it("should handle multiline calculations", () => {
    const content = "price = 100$\ntax = price * 0.1\ntotal = price + tax"
    const results = ["100$", "10$", "110$"]

    const expected =
      "price = 100$        │ 100$\n" + "tax = price * 0.1   │ 10$\n" + "total = price + tax │ 110$"

    expect(exportAsText(content, results)).toBe(expected)
  })

  it("should handle fewer results than lines", () => {
    const content = "line 1\nline 2\nline 3"
    const results = ["result 1"]

    const expected = "line 1 │ result 1\nline 2 │ \nline 3 │ "

    expect(exportAsText(content, results)).toBe(expected)
  })
})
