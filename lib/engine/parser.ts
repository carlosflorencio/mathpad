import {
  Token,
  ASTNode,
  NumberNode,
  PercentNode,
  IdentifierNode,
  AggregateNode,
  FunctionCallNode,
  EmptyNode,
} from "./types"
import { functionRegistry, aggregateFunctionRegistry } from "./adapters/registry"

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

    // Check for assignment: identifier = expression
    if (this.current().type === "identifier" && this.peek().type === "assign") {
      const identifier = this.current().value
      const position = this.current().position
      this.advance() // skip identifier
      this.advance() // skip '='
      const expression = this.parseExpression()
      return {
        kind: "assignment",
        identifier,
        expression,
        position,
        length: expression.position + expression.length - position,
      }
    }

    return this.parseExpression()
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
      if (current.type === "operator" && (current.value === "+" || current.value === "-")) {
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

      if (current.type === "operator" && ["*", "/", "%"].includes(current.value)) {
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

    if (!this.isAtEnd() && this.current().type === "operator" && this.current().value === "^") {
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

    if (current.type === "operator" && (current.value === "+" || current.value === "-")) {
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
      if (current.value === "++" || current.value === "--") {
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
    const node: EmptyNode = {
      kind: "empty",
      position: current.position,
      length: current.length,
    }
    this.advance()
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
