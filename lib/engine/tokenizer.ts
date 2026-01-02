import { Token, TokenType } from './types';

// Operators that can appear in expressions
const OPERATORS = new Set(['+', '-', '*', '/', '%', '^', '×', '−']);
const PARENS = new Set(['(', ')']);

// Keywords for aggregate functions
const AGGREGATE_KEYWORDS = new Set([
  'sum', 'total',
  'avg', 'average', 'mean',
  'min', 'minimum',
  'max', 'maximum',
  'count'
]);

/**
 * Tokenizes a line of input into tokens
 * @param line The input string to tokenize
 * @returns Array of tokens
 */
export function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  // Skip colon prefix if exists (for labels like "Tax: 100 * 0.2")
  if (line.includes(':')) {
    const colonIndex = line.indexOf(':');
    pos = colonIndex + 1;
    // Skip whitespace after colon
    while (pos < line.length && /\s/.test(line[pos])) {
      pos++;
    }
  }

  // Check for assignment (identifier = expression)
  // Match: letter/underscore, followed by letters/digits/underscores/spaces, then =
  // But only include spaces if they're between word characters (for "total price = 100")
  const assignMatch = line.slice(pos).match(/^([a-zA-Z_][\w\s]*?)\s*=(?!=)/);
  if (assignMatch) {
    const identifierName = assignMatch[1].trim();
    tokens.push({
      type: 'identifier',
      value: identifierName,
      position: pos,
      length: assignMatch[1].length,
    });
    tokens.push({
      type: 'assign',
      value: '=',
      position: pos + assignMatch[1].length,
      length: 1,
    });
    pos += assignMatch[0].length;
  }

  // Main tokenization loop
  while (pos < line.length) {
    const ch = line[pos];

    // Skip whitespace
    if (/\s/.test(ch)) {
      pos++;
      continue;
    }

    // Number (including decimals and suffixes like k, M)
    if (/\d/.test(ch) || (ch === '.' && pos + 1 < line.length && /\d/.test(line[pos + 1]))) {
      const start = pos;
      let numStr = '';

      // Collect digits, separators, and decimal point
      while (pos < line.length) {
        const c = line[pos];
        if (/[\d.,_']/.test(c)) {
          numStr += c;
          pos++;
        } else if (c === '.' && !numStr.includes('.')) {
          numStr += c;
          pos++;
        } else if (c === ' ' && pos + 1 < line.length && /\d/.test(line[pos + 1])) {
          // Only include space if followed by a digit (for "1 000 000" style)
          numStr += c;
          pos++;
        } else {
          break;
        }
      }

      // Trim trailing spaces
      numStr = numStr.trim();

      // Check for suffix (k, M)
      if (pos < line.length && /[kM]/.test(line[pos])) {
        numStr += line[pos];
        pos++;
      }

      // Check for percentage - only if % is immediately after the number (no space)
      if (pos < line.length && line[pos] === '%' && line[pos - 1] !== ' ') {
        tokens.push({
          type: 'percent',
          value: numStr,
          position: start,
          length: pos - start + 1,
        });
        pos++;
      } else {
        tokens.push({
          type: 'number',
          value: numStr,
          position: start,
          length: pos - start,
        });
      }
      continue;
    }

    // Percentage symbol (modulo operator when not attached to a number)
    // This handles the case where % is used as modulo
    if (ch === '%') {
      tokens.push({
        type: 'operator',
        value: '%',
        position: pos,
        length: 1,
      });
      pos++;
      continue;
    }

    // Operators
    if (OPERATORS.has(ch)) {
      tokens.push({
        type: 'operator',
        value: ch === '×' ? '*' : ch === '−' ? '-' : ch,
        position: pos,
        length: 1,
      });
      pos++;
      continue;
    }

    // Parentheses
    if (PARENS.has(ch)) {
      tokens.push({
        type: 'paren',
        value: ch,
        position: pos,
        length: 1,
      });
      pos++;
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(ch)) {
      const start = pos;
      let identifier = '';

      // Collect identifier characters
      // Allow spaces only if they're between letters (for multi-word identifiers)
      // BUT: Stop at special keywords like "of" to prevent them from being part of multi-word identifiers
      while (pos < line.length) {
        const c = line[pos];
        if (/[a-zA-Z0-9_]/.test(c)) {
          identifier += c;
          pos++;
        } else if (c === ' ' && pos + 1 < line.length && /[a-zA-Z_]/.test(line[pos + 1])) {
          // Check if current identifier is a special keyword that shouldn't be extended
          const currentLower = identifier.toLowerCase();
          if (currentLower === 'of') {
            // Don't extend "of" keyword with more words
            break;
          }
          
          // Peek ahead to see if the next word is a special keyword
          const nextWordMatch = line.slice(pos + 1).match(/^([a-zA-Z_]+)/);
          if (nextWordMatch && nextWordMatch[1].toLowerCase() === 'of') {
            // Don't include space before "of" keyword
            break;
          }
          
          // Include space only if followed by a letter
          identifier += c;
          pos++;
        } else {
          break;
        }
      }

      identifier = identifier.trim();
      const lowerIdentifier = identifier.toLowerCase();

      // Check if it's an aggregate keyword
      if (AGGREGATE_KEYWORDS.has(lowerIdentifier)) {
        tokens.push({
          type: 'operator',
          value: lowerIdentifier,
          position: start,
          length: identifier.length,
        });
      } else {
        tokens.push({
          type: 'identifier',
          value: identifier,
          position: start,
          length: identifier.length,
        });
      }
      continue;
    }

    // Unknown character, skip it
    pos++;
  }

  // Add EOF token
  tokens.push({
    type: 'eof',
    value: '',
    position: line.length,
    length: 0,
  });

  return tokens;
}

/**
 * Get list of variable names used in previous lines for completion
 */
export function extractVariables(lines: string[]): string[] {
  const variables = new Set<string>();

  for (const line of lines) {
    const tokens = tokenize(line);
    // Look for assignment pattern: identifier = ...
    if (tokens.length >= 2 && tokens[0].type === 'identifier' && tokens[1].type === 'assign') {
      variables.add(tokens[0].value);
    }
  }

  return Array.from(variables);
}
