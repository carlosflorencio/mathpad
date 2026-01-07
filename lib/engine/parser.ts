import {
  Token,
  ASTNode,
  NumberNode,
  PercentNode,
  DateLiteralNode,
  IdentifierNode,
  AggregateNode,
  FunctionCallNode,
  EmptyNode,
} from "./types"
import {
  functionRegistry,
  aggregateFunctionRegistry,
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from "./adapters/registry"
import { isFormatSuffix } from "./adapters/formats/registry"

/**
 * Recursive descent parser for mathematical expressions
 */
class Parser {
  private tokens: Token[]
  private position: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.position = 0
  }

  private current(): Token {
    return this.tokens[this.position]
  }

  private peek(offset: number = 1): Token {
    const pos = this.position + offset
    return pos < this.tokens.length ? this.tokens[pos] : this.tokens[this.tokens.length - 1]
  }

  private advance(): void {
    if (this.position < this.tokens.length - 1) {
      this.position++
    }
  }

  private isAtEnd(): boolean {
    return this.current().type === "eof"
  }

  private match(...types: Token["type"][]): boolean {
    return types.includes(this.current().type)
  }

  private matchValue(...values: string[]): boolean {
    return values.includes(this.current().value)
  }

  /**
   * Main parse function - starts from assignment level
   */
  parse(): ASTNode {
    // Empty line
    if (this.isAtEnd()) {
      return {
        kind: "empty",
        position: 0,
        length: 0,
      }
    }

    // Check if line starts with a binary operator
    // If so, treat it as: previousResult <operator> <expression>
    const firstToken = this.current()
    const nextToken = this.peek()

    if (
      firstToken.type === "operator" &&
      binaryOperatorRegistry.has(firstToken.value) &&
      nextToken.type !== "eof"
    ) {
      const operator = firstToken.value as "+" | "-" | "*" | "/" | "%" | "^"
      const operatorPosition = firstToken.position
      this.advance() // skip operator

      // Create a node representing the previous line's result
      const prevResultNode: ASTNode = {
        kind: "previousResult",
        position: 0,
        length: 0,
      }

      // Parse the rest as the right operand
      const right = this.parseFormatted()

      // Return a binary operation with previousResult on the left
      return {
        kind: "binary",
        operator,
        left: prevResultNode,
        right,
        position: operatorPosition,
        length: right.position + right.length - operatorPosition,
      }
    }

    // Check for assignment: identifier = expression or identifier in FORMAT = expression
    if (this.current().type === "identifier") {
      const identifier = this.current().value
      const position = this.current().position

      // Check for "var in FORMAT = expr" pattern (e.g., "price in K = 100")
      if (
        (this.peek().type === "keyword" || this.peek().type === "conversion") &&
        this.peek().value === "in"
      ) {
        const formatToken = this.peek(2)
        if (formatToken.type === "keyword" && isFormatSuffix(formatToken.value)) {
          const assignToken = this.peek(3)
          if (assignToken.type === "assign") {
            const format = formatToken.value
            this.advance() // skip identifier
            this.advance() // skip 'in'
            this.advance() // skip format
            this.advance() // skip '='
            const expression = this.parseExpression()
            return {
              kind: "assignment",
              identifier,
              expression,
              format,
              position,
              length: expression.position + expression.length - position,
            }
          }
        }
      }

      // Check for regular assignment: identifier = expression
      // Use parseFormatted to support conversions like "var = 100$ to eur"
      if (this.peek().type === "assign") {
        this.advance() // skip identifier
        this.advance() // skip '='
        const expression = this.parseFormatted()
        return {
          kind: "assignment",
          identifier,
          expression,
          position,
          length: expression.position + expression.length - position,
        }
      }
    }

    return this.parseFormatted()
  }

  /**
   * Parse formatted expression: expression in FORMAT
   * Parse conversion expression: expression to UNIT
   * Example: "5000 in K" or "100 in $" or "100km to m"
   */
  private parseFormatted(): ASTNode {
    const expression = this.parseExpression()

    // Check for "in FORMAT" suffix (e.g., "in K", "in M", "in $")
    if (
      !this.isAtEnd() &&
      (this.current().type === "keyword" || this.current().type === "conversion") &&
      this.current().value === "in"
    ) {
      this.advance() // skip 'in'
      if (this.current().type === "keyword") {
        const format = this.current().value
        if (isFormatSuffix(format)) {
          this.advance() // skip format
          return {
            kind: "formatted",
            expression,
            format,
            position: expression.position,
            length:
              this.tokens[this.position - 1].position +
              this.tokens[this.position - 1].length -
              expression.position,
          }
        }
      }
    }

    // Check for "to UNIT" suffix (e.g., "100km to m", "1hr to min")
    if (
      !this.isAtEnd() &&
      (this.current().type === "keyword" || this.current().type === "conversion") &&
      this.current().value === "to"
    ) {
      this.advance() // skip 'to'
      // After "to", the unit might be tokenized as keyword, operator, identifier, or number (e.g., "$", "min", etc.)
      // For compound units like "m/s" or "km/h", we need to combine multiple tokens
      if (
        this.current().type === "keyword" ||
        this.current().type === "operator" ||
        this.current().type === "identifier" ||
        this.current().type === "number"
      ) {
        let targetUnit = this.current().value
        this.advance() // skip first part of unit

        // Check if this is a compound unit (e.g., m/s, km/h)
        // Look for pattern: unit + "/" + unit
        if (
          !this.isAtEnd() &&
          this.current().type === "operator" &&
          this.current().value === "/" &&
          this.position + 1 < this.tokens.length
        ) {
          const nextToken = this.tokens[this.position + 1]

          // Check if next token after "/" could be part of a unit
          if (nextToken.type === "keyword" || nextToken.type === "identifier") {
            const compoundUnit = targetUnit + "/" + nextToken.value

            // Check if this compound unit is a valid format
            if (isFormatSuffix(compoundUnit)) {
              this.advance() // skip "/"
              this.advance() // skip second part
              targetUnit = compoundUnit
            }
          }
        }

        if (isFormatSuffix(targetUnit)) {
          return {
            kind: "conversion",
            expression,
            targetUnit,
            position: expression.position,
            length:
              this.tokens[this.position - 1].position +
              this.tokens[this.position - 1].length -
              expression.position,
          }
        }
      }
    }

    return expression
  }

  /**
   * Parse expression (handles addition and subtraction)
   * Also handles "of" operator for fractions (e.g., "20% of 100")
   */
  private parseExpression(): ASTNode {
    let node = this.parseMultiplication()

    while (!this.isAtEnd()) {
      const current = this.current()

      // Check for "of" keyword (fraction operator)
      if (current.type === "identifier" && current.value.toLowerCase() === "of") {
        this.advance()
        const denominator = this.parseMultiplication()
        node = {
          kind: "fraction",
          numerator: node,
          denominator,
          position: node.position,
          length: denominator.position + denominator.length - node.position,
        }
        continue
      }

      // Addition and subtraction
      if (
        current.type === "operator" &&
        binaryOperatorRegistry.has(current.value) &&
        (current.value === "+" || current.value === "-")
      ) {
        const operator = current.value as "+" | "-"
        this.advance()
        const right = this.parseMultiplication()
        node = {
          kind: "binary",
          operator,
          left: node,
          right,
          position: node.position,
          length: right.position + right.length - node.position,
        }
        continue
      }

      break
    }

    return node
  }

  /**
   * Parse multiplication, division, and modulo
   */
  private parseMultiplication(): ASTNode {
    let node = this.parseExponentiation()

    while (!this.isAtEnd()) {
      const current = this.current()

      if (
        current.type === "operator" &&
        binaryOperatorRegistry.has(current.value) &&
        ["*", "/", "%"].includes(current.value)
      ) {
        const operator = current.value as "*" | "/" | "%"
        this.advance()
        const right = this.parseExponentiation()
        node = {
          kind: "binary",
          operator,
          left: node,
          right,
          position: node.position,
          length: right.position + right.length - node.position,
        }
        continue
      }

      break
    }

    return node
  }

  /**
   * Parse exponentiation (right-associative)
   */
  private parseExponentiation(): ASTNode {
    let node = this.parseUnary()

    if (
      !this.isAtEnd() &&
      this.current().type === "operator" &&
      binaryOperatorRegistry.has(this.current().value) &&
      this.current().value === "^"
    ) {
      this.advance()
      const right = this.parseExponentiation() // Right-associative
      node = {
        kind: "binary",
        operator: "^",
        left: node,
        right,
        position: node.position,
        length: right.position + right.length - node.position,
      }
    }

    return node
  }

  /**
   * Parse unary operators (+ and -)
   */
  private parseUnary(): ASTNode {
    const current = this.current()

    if (
      current.type === "operator" &&
      unaryOperatorRegistry.has(current.value) &&
      (current.value === "+" || current.value === "-")
    ) {
      const operator = current.value as "+" | "-"
      const position = current.position
      this.advance()
      const operand = this.parseUnary()
      return {
        kind: "unary",
        operator,
        operand,
        position,
        length: operand.position + operand.length - position,
      }
    }

    return this.parsePostfix()
  }

  /**
   * Parse postfix operators (++ and --)
   */
  private parsePostfix(): ASTNode {
    let node = this.parsePrimary()

    // Check for postfix operators
    if (!this.isAtEnd() && this.current().type === "operator") {
      const current = this.current()
      if (
        unaryOperatorRegistry.has(current.value) &&
        (current.value === "++" || current.value === "--")
      ) {
        const operator = current.value as "++" | "--"
        this.advance()
        node = {
          kind: "postfix",
          operator,
          operand: node,
          position: node.position,
          length: current.position + current.length - node.position,
        }
      }
    }

    return node
  }

  /**
   * Parse primary expressions (numbers, identifiers, parentheses, aggregates)
   */
  private parsePrimary(): ASTNode {
    const current = this.current()

    // Numbers
    if (current.type === "number") {
      const node: NumberNode = {
        kind: "number",
        value: current.value,
        position: current.position,
        length: current.length,
      }
      this.advance()
      return node
    }

    // Percentages
    if (current.type === "percent") {
      const node: PercentNode = {
        kind: "percent",
        value: current.value,
        position: current.position,
        length: current.length,
      }
      this.advance()
      return node
    }

    // Date literals (ISO format or keywords like "today", "now")
    if (current.type === "date") {
      const node: DateLiteralNode = {
        kind: "dateLiteral",
        value: current.value,
        position: current.position,
        length: current.length,
      }
      this.advance()
      return node
    }

    // Previous result references (prev, previous)
    if (current.type === "previousResult") {
      const node: ASTNode = {
        kind: "previousResult",
        position: current.position,
        length: current.length,
      }
      this.advance()
      return node
    }

    // Aggregate functions (sum, avg, min, max, count)
    if (
      current.type === "operator" &&
      aggregateFunctionRegistry.isAggregateKeyword(current.value)
    ) {
      const funcName = aggregateFunctionRegistry.mapAggregateKeyword(current.value)
      if (!funcName) {
        const node: EmptyNode = {
          kind: "empty",
          position: current.position,
          length: current.length,
        }
        this.advance()
        return node
      }
      const node: AggregateNode = {
        kind: "aggregate",
        function: funcName,
        position: current.position,
        length: current.length,
      }
      this.advance()
      return node
    }

    // Identifiers (variables) or function calls
    if (current.type === "identifier") {
      const name = current.value
      const position = current.position
      const length = current.length
      this.advance()

      // Check if this is a function call (identifier followed by '(')
      if (this.current().type === "paren" && this.current().value === "(") {
        // Check if it's a known function
        const lowerName = name.toLowerCase()
        if (functionRegistry.has(lowerName)) {
          this.advance() // consume '('
          const argument = this.parseExpression()
          if (this.current().type === "paren" && this.current().value === ")") {
            this.advance() // consume ')'
          }
          const node: FunctionCallNode = {
            kind: "function",
            name: lowerName,
            argument,
            position,
            length: this.position - position,
          }
          return node
        }
      }

      // Regular identifier (variable)
      const node: IdentifierNode = {
        kind: "identifier",
        name,
        position,
        length,
      }
      return node
    }

    // Parentheses
    if (current.type === "paren" && current.value === "(") {
      this.advance()
      const node = this.parseExpression()
      if (this.current().type === "paren" && this.current().value === ")") {
        this.advance()
      }
      return node
    }

    // Unexpected token - return empty node
    // IMPORTANT: Don't advance if the token is a closing paren - let the caller handle it
    const isClosingParen = current.type === "paren" && current.value === ")"
    const node: EmptyNode = {
      kind: "empty",
      position: current.position,
      length: current.length,
    }
    if (!isClosingParen) {
      this.advance()
    }
    return node
  }
}

/**
 * Parse a line into an AST
 */
export function parse(tokens: Token[]): ASTNode {
  const parser = new Parser(tokens)
  return parser.parse()
}
