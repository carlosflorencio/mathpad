import { Token } from "./types"
import {
  aggregateFunctionRegistry,
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from "./adapters/registry"
import { formatRegistry, isFormatSuffix } from "./adapters/formats/registry"

// Build operator set from registered adapters
// Include both binary and unary operators (unary includes prefix and postfix)
const BINARY_SYMBOLS = new Set(binaryOperatorRegistry.getAllSymbols())
const UNARY_SYMBOLS = new Set(unaryOperatorRegistry.getAllSymbols())
const OPERATORS = new Set([...BINARY_SYMBOLS, ...UNARY_SYMBOLS, "×", "−"])

const PARENS = new Set(["(", ")"])

// Keywords for aggregate functions
const AGGREGATE_KEYWORDS = aggregateFunctionRegistry.getAllKeywords()

/**
 * Tokenize a line into tokens
 */
export function tokenize(line: string): Token[] {
  const tokens: Token[] = []
  let pos = 0

  // Skip label (text followed by colon) if present
  const colonIndex = line.indexOf(":")
  if (colonIndex !== -1) {
    // Check if there's text before the colon that looks like a label
    const beforeColon = line.substring(0, colonIndex).trim()
    // Label should be alphanumeric with possible spaces
    if (beforeColon.length > 0 && /^[a-zA-Z][a-zA-Z0-9 ]*$/.test(beforeColon)) {
      // Skip past the colon and any following whitespace
      pos = colonIndex + 1
      while (pos < line.length && /\s/.test(line[pos])) {
        pos++
      }
    }
  }

  // Skip leading whitespace
  while (pos < line.length && /\s/.test(line[pos])) {
    pos++
  }

  while (pos < line.length) {
    const ch = line[pos]

    // Skip whitespace
    if (/\s/.test(ch)) {
      pos++
      continue
    }

    // Number (including decimals and suffixes like k, M)
    if (/\d/.test(ch) || (ch === "." && pos + 1 < line.length && /\d/.test(line[pos + 1]))) {
      const start = pos
      let numStr = ""

      // Collect digits, separators, and decimal point
      while (pos < line.length) {
        const c = line[pos]
        if (/[\d.,_']/.test(c)) {
          numStr += c
          pos++
        } else if (c === "." && !numStr.includes(".")) {
          numStr += c
          pos++
        } else if (c === " " && pos + 1 < line.length && /\d/.test(line[pos + 1])) {
          // Only include space if followed by a digit (for "1 000 000" style)
          numStr += c
          pos++
        } else {
          break
        }
      }

      // Trim trailing spaces
      numStr = numStr.trim()

      // Check for format suffix (k, M, B, $, €, km, m, etc.)
      // This handles both immediate suffixes (100$) and suffixes with spaces (100 $)
      let suffix = ""
      let tempPos = pos

      // Skip optional whitespace between number and suffix
      while (tempPos < line.length && line[tempPos] === " ") {
        tempPos++
      }

      // Try to match a format suffix
      // We try from longest to shortest, checking if any format adapter can parse it
      let matchedSuffixLength = 0
      const remainingText = line.slice(tempPos)

      // Try suffixes of decreasing length (start with reasonable max like 12 chars for "milliliters")
      const maxSuffixLength = Math.min(remainingText.length, 12)
      for (let len = maxSuffixLength; len > 0; len--) {
        const candidate = remainingText.slice(0, len)

        // Try to find a parser that can handle this candidate
        const parser = formatRegistry.findParser(candidate)
        if (parser) {
          // Make sure it's not part of a longer identifier
          const nextCharPos = tempPos + len
          if (nextCharPos >= line.length || /[\s\+\-\*\/\%\^\(\)\=]/.test(line[nextCharPos])) {
            matchedSuffixLength = len
            break
          }
        }
      }

      if (matchedSuffixLength > 0) {
        // Extract the actual suffix from the input (preserves case)
        suffix = line.slice(tempPos, tempPos + matchedSuffixLength)
        pos = tempPos + matchedSuffixLength
        numStr += suffix
      }

      // Check for percentage - only if % is immediately after the number (no space)
      if (pos < line.length && line[pos] === "%" && line[pos - 1] !== " ") {
        tokens.push({
          type: "percent",
          value: numStr,
          position: start,
          length: pos - start + 1,
        })
        pos++
      } else {
        tokens.push({
          type: "number",
          value: numStr,
          position: start,
          length: pos - start,
        })
      }
      continue
    }

    // Percentage symbol (modulo operator when not attached to a number)
    // This handles the case where % is used as modulo
    if (ch === "%") {
      tokens.push({
        type: "operator",
        value: "%",
        position: pos,
        length: 1,
      })
      pos++
      continue
    }

    // Multi-character operators (++, --)
    // Only treat as postfix if the previous token was a value or closing paren
    if ((ch === "+" || ch === "-") && pos + 1 < line.length && line[pos + 1] === ch) {
      const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null
      const canBePostfix =
        lastToken &&
        (lastToken.type === "number" ||
          lastToken.type === "percent" ||
          lastToken.type === "identifier" ||
          (lastToken.type === "paren" && lastToken.value === ")"))

      if (canBePostfix) {
        tokens.push({
          type: "operator",
          value: ch + ch, // "++" or "--"
          position: pos,
          length: 2,
        })
        pos += 2
        continue
      }
    }

    // Assignment operator
    if (ch === "=") {
      tokens.push({
        type: "assign",
        value: "=",
        position: pos,
        length: 1,
      })
      pos++
      continue
    }

    // Operators
    if (OPERATORS.has(ch)) {
      tokens.push({
        type: "operator",
        value: ch === "×" ? "*" : ch === "−" ? "-" : ch,
        position: pos,
        length: 1,
      })
      pos++
      continue
    }

    // Parentheses
    if (PARENS.has(ch)) {
      tokens.push({
        type: "paren",
        value: ch,
        position: pos,
        length: 1,
      })
      pos++
      continue
    }

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(ch)) {
      const start = pos
      let identifier = ""

      // Collect identifier characters
      // Allow spaces only if they're between letters (for multi-word identifiers)
      // BUT: Stop at special keywords like "of" to prevent them from being part of multi-word identifiers
      while (pos < line.length) {
        const c = line[pos]
        if (/[a-zA-Z0-9_]/.test(c)) {
          identifier += c
          pos++
        } else if (c === " " && pos + 1 < line.length && /[a-zA-Z_]/.test(line[pos + 1])) {
          // Check if current identifier is a special keyword that shouldn't be extended
          const currentLower = identifier.toLowerCase()
          if (currentLower === "of" || currentLower === "in" || currentLower === "to") {
            // Don't extend special keywords with more words
            break
          }

          // Peek ahead to see if the next word is a special keyword or format specifier
          const nextWordMatch = line.slice(pos + 1).match(/^([a-zA-Z_]+)/)
          if (nextWordMatch) {
            const nextWord = nextWordMatch[1]
            const nextLower = nextWord.toLowerCase()
            // Break before special keywords (in, of, to) or format specifiers
            if (
              nextLower === "of" ||
              nextLower === "in" ||
              nextLower === "to" ||
              isFormatSuffix(nextWord)
            ) {
              // Don't include space before special keywords
              break
            }
          }

          // Include space only if followed by a letter
          identifier += c
          pos++
        } else {
          break
        }
      }

      identifier = identifier.trim()
      const lowerIdentifier = identifier.toLowerCase()

      // Peek ahead to see if the next non-whitespace character is "="
      // OR if followed by "in FORMAT =" pattern (for formatted assignments)
      // If so, this should be treated as an identifier (for assignment), not a keyword
      let nextPos = pos
      while (nextPos < line.length && /\s/.test(line[nextPos])) {
        nextPos++
      }

      // Special handling for format specifiers: they should NEVER be treated as assignment targets
      // even if followed by "=", because they're format specifiers (e.g., K, M, B, $)
      const isFormatSpecifierToken = isFormatSuffix(identifier)
      let isAssignment = false

      if (!isFormatSpecifierToken) {
        // Check if directly followed by "="
        isAssignment = nextPos < line.length && line[nextPos] === "="

        // Also check for "in FORMAT =" pattern after identifier (e.g., "price in K =")
        if (!isAssignment && nextPos < line.length) {
          const restOfLine = line.slice(nextPos)
          // Build regex pattern from registered format IDs
          const formatIds = formatRegistry.getAllIds().join("")
          const formatPattern = `^in\\s+([${formatIds}])\\s*=`
          const formatMatch = restOfLine.match(new RegExp(formatPattern))
          if (formatMatch) {
            isAssignment = true
          }
        }
      }

      // Check if it's the "in" or "to" keyword (but not if followed by =)
      if ((lowerIdentifier === "in" || lowerIdentifier === "to") && !isAssignment) {
        tokens.push({
          type: "keyword",
          value: lowerIdentifier,
          position: start,
          length: identifier.length,
        })
      }
      // Check if it's an aggregate keyword (but not if followed by =)
      // These take priority over format specifiers to avoid conflicts (e.g., "min")
      else if (AGGREGATE_KEYWORDS.has(lowerIdentifier) && !isAssignment) {
        tokens.push({
          type: "operator",
          value: lowerIdentifier,
          position: start,
          length: identifier.length,
        })
      }
      // Check if it's a format specifier - these are always keywords unless used as regular variable names
      else if (isFormatSpecifierToken) {
        tokens.push({
          type: "keyword",
          value: identifier,
          position: start,
          length: identifier.length,
        })
      } else {
        tokens.push({
          type: "identifier",
          value: identifier,
          position: start,
          length: identifier.length,
        })
      }
      continue
    }

    // Unknown character, skip it
    pos++
  }

  // Add EOF token
  tokens.push({
    type: "eof",
    value: "",
    position: line.length,
    length: 0,
  })

  return tokens
}

/**
 * Get list of variable names used in previous lines for completion
 */
export function extractVariables(lines: string[]): string[] {
  const variables = new Set<string>()

  for (const line of lines) {
    const tokens = tokenize(line)
    // Look for assignment pattern: identifier = ...
    if (tokens.length >= 2 && tokens[0].type === "identifier" && tokens[1].type === "assign") {
      variables.add(tokens[0].value)
    }
  }

  return Array.from(variables)
}
