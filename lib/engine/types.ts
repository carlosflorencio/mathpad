import Big from "big.js"
import { AggregateFunctionName } from "./adapters/base"

// ============================================================================
// Format Types
// ============================================================================

/**
 * Format suffix type - represents any registered format ID
 * This is a string type since formats are dynamically registered at runtime
 * Built-in formats: "K" (thousands), "M" (millions), "B" (billions)
 * Additional formats can be registered via the formatRegistry
 */
export type FormatSuffix = string

// ============================================================================
// Token Types (from Tokenizer)
// ============================================================================

export type TokenType =
  | "number"
  | "percent"
  | "identifier"
  | "operator"
  | "paren"
  | "assign"
  | "keyword"
  | "eof"

export interface Token {
  type: TokenType
  value: string
  position: number
  length: number
}

// ============================================================================
// AST Node Types
// ============================================================================

export type ASTNode =
  | NumberNode
  | PercentNode
  | IdentifierNode
  | BinaryOpNode
  | UnaryOpNode
  | PostfixOpNode
  | AssignmentNode
  | FormattedExpressionNode
  | ConversionNode
  | AggregateNode
  | FractionNode
  | FunctionCallNode
  | EmptyNode

export interface NumberNode {
  kind: "number"
  value: string
  position: number
  length: number
}

export interface PercentNode {
  kind: "percent"
  value: string
  position: number
  length: number
}

export interface IdentifierNode {
  kind: "identifier"
  name: string
  position: number
  length: number
}

export interface BinaryOpNode {
  kind: "binary"
  operator: "+" | "-" | "*" | "/" | "%" | "^"
  left: ASTNode
  right: ASTNode
  position: number
  length: number
}

export interface UnaryOpNode {
  kind: "unary"
  operator: "+" | "-"
  operand: ASTNode
  position: number
  length: number
}

export interface PostfixOpNode {
  kind: "postfix"
  operator: "++" | "--"
  operand: ASTNode
  position: number
  length: number
}

export interface AssignmentNode {
  kind: "assignment"
  identifier: string
  expression: ASTNode
  format?: FormatSuffix
  position: number
  length: number
}

export interface FormattedExpressionNode {
  kind: "formatted"
  expression: ASTNode
  format: FormatSuffix
  position: number
  length: number
}

export interface ConversionNode {
  kind: "conversion"
  expression: ASTNode
  targetUnit: FormatSuffix
  position: number
  length: number
}

export interface AggregateNode {
  kind: "aggregate"
  function: AggregateFunctionName
  position: number
  length: number
}

export interface FractionNode {
  kind: "fraction"
  numerator: ASTNode
  denominator: ASTNode
  position: number
  length: number
}

export interface FunctionCallNode {
  kind: "function"
  name: string
  argument: ASTNode
  position: number
  length: number
}

export interface EmptyNode {
  kind: "empty"
  position: number
  length: number
}

// ============================================================================
// Evaluation Result Types
// ============================================================================

export type EvalResult = NumberResult | PercentResult | EmptyResult | ErrorResult

export interface NumberResult {
  type: "number"
  value: Big
  format?: FormatSuffix
}

export interface PercentResult {
  type: "percent"
  value: Big
  format?: FormatSuffix
}

export interface EmptyResult {
  type: "empty"
}

export interface ErrorResult {
  type: "error"
  message: string
  position: number
  length: number
}

// ============================================================================
// Execution Context
// ============================================================================

export interface ExecutionContext {
  variables: Map<string, EvalResult>
  lineResults: EvalResult[]
  currentLine: number
}

export function createContext(): ExecutionContext {
  return {
    variables: new Map(),
    lineResults: [],
    currentLine: 0,
  }
}

export function cloneContext(ctx: ExecutionContext): ExecutionContext {
  return {
    variables: new Map(ctx.variables),
    lineResults: [...ctx.lineResults],
    currentLine: ctx.currentLine,
  }
}

// ============================================================================
// Line Evaluation Result
// ============================================================================

export interface LineEvaluation {
  lineNumber: number
  result: EvalResult
  formatted: string
  context: ExecutionContext
}

// ============================================================================
// Formatting Options
// ============================================================================

export interface FormatOptions {
  decimalPlaces: number
  thousandsSeparator: "," | "." | " " | ""
  decimalSeparator: "," | "."
  showTrailingZeros: boolean
  scientificNotationThreshold: number
}
