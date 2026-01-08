/**
 * Exports document content and evaluation results as formatted text
 * with results displayed in a gutter column
 */

/**
 * Converts document content and results into a shareable text format
 * @param content - The document content (lines of text)
 * @param results - The formatted results for each line
 * @returns Formatted text with content and results separated by a gutter character
 */
export function exportAsText(content: string, results: string[]): string {
  const lines = content.split("\n")
  const gutterChar = "│" // Box drawing character for the gutter

  // Find the maximum length of content lines for alignment
  const maxContentLength = Math.max(...lines.map((line) => line.length), 0)

  // Build the formatted text
  const formattedLines = lines.map((line, index) => {
    const result = results[index] || ""
    const paddedLine = line.padEnd(maxContentLength)

    // Always show gutter, even for empty results
    return `${paddedLine} ${gutterChar} ${result}`
  })

  return formattedLines.join("\n")
}
