import Big from "big.js"
import {
  ASTNode,
  EvalResult,
  ExecutionContext,
  NumberResult,
  PercentResult,
  DateResult,
  DurationResult,
} from "./types"
import {
  functionRegistry,
  binaryOperatorRegistry,
  unaryOperatorRegistry,
  aggregateFunctionRegistry,
} from "./adapters/registry"
import { formatRegistry } from "./adapters/formats/registry"
import { performUnitArithmetic } from "./unitArithmetic"

// Configure Big.js for better precision
Big.DP = 20 // Decimal places
Big.RM = Big.roundHalfUp // Rounding mode

// Duration units (time category)
const DURATION_UNITS = new Set(["ms", "sec", "min", "hr", "day"])

/**
 * Check if a NumberResult is actually a duration (has a time unit)
 */
function isDuration(result: NumberResult): boolean {
  if (!result.format) return false
  return DURATION_UNITS.has(result.format)
}

/**
 * Convert a NumberResult with duration format to DurationResult
 */
function toDurationResult(result: NumberResult): DurationResult {
  const unit = result.format as "ms" | "sec" | "min" | "hr" | "day"
  return {
    type: "duration",
    value: result.value,
    unit,
    format: result.format,
  }
}

/**
 * Evaluate an AST node and return a result
 * This is a pure function - no side effects, returns new context
 */
export function evaluate(node: ASTNode, context: ExecutionContext): [EvalResult, ExecutionContext] {
  try {
    switch (node.kind) {
      case "empty":
        return [{ type: "empty" }, context]

      case "number":
        return evaluateNumber(node, context)

      case "percent":
        return evaluatePercent(node, context)

      case "dateLiteral":
        return evaluateDateLiteral(node, context)

      case "identifier":
        return evaluateIdentifier(node, context)

      case "binary":
        return evaluateBinary(node, context)

      case "unary":
        return evaluateUnary(node, context)

      case "postfix":
        return evaluatePostfix(node, context)

      case "assignment":
        return evaluateAssignment(node, context)

      case "aggregate":
        return evaluateAggregate(node, context)

      case "fraction":
        return evaluateFraction(node, context)

      case "function":
        return evaluateFunction(node, context)

      case "formatted":
        return evaluateFormatted(node, context)

      case "conversion":
        return evaluateConversion(node, context)

      case "previousResult":
        return evaluatePreviousResult(node, context)

      default:
        // TypeScript exhaustiveness check
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveCheck: never = node
        return [
          {
            type: "error",
            message: "Unknown node type",
            position: 0,
            length: 0,
          },
          context,
        ]
    }
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Evaluation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate a number literal
 */
function evaluateNumber(
  node: ASTNode & { kind: "number" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  try {
    let numStr = node.value
    let multiplier = 1
    let detectedFormat: string | undefined

    // Try to detect format suffix from the end of the string
    // Check from longest to shortest possible suffix (up to 12 chars for "milliliters")
    const maxSuffixLength = Math.min(numStr.length, 12)
    for (let len = maxSuffixLength; len > 0; len--) {
      const potentialSuffix = numStr.slice(-len)

      // Check if any format can parse this potential suffix
      const parser = formatRegistry.findParser(potentialSuffix)
      if (parser) {
        multiplier = parser.multiplier
        // Only preserve format if the adapter wants inline preservation
        if (parser.adapter.preserveInline) {
          detectedFormat = parser.adapter.id
        }
        numStr = numStr.slice(0, -len).trim()
        break
      }
    }

    // Remove separators (spaces, commas, underscores, apostrophes)
    numStr = numStr.replace(/[\s,_']/g, "")

    const value = new Big(numStr).times(multiplier)
    return [{ type: "number", value, format: detectedFormat }, context]
  } catch {
    return [
      {
        type: "error",
        message: "Invalid number format",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate a percentage literal
 */
function evaluatePercent(
  node: ASTNode & { kind: "percent" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  try {
    const numStr = node.value.replace(/[\s,_']/g, "")
    const value = new Big(numStr)
    return [{ type: "percent", value }, context]
  } catch {
    return [
      {
        type: "error",
        message: "Invalid percentage format",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate a date literal (ISO format or keywords like "today", "now")
 */
function evaluateDateLiteral(
  node: ASTNode & { kind: "dateLiteral" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  try {
    const value = node.value.toLowerCase()
    let date: Date

    // Handle date keywords
    if (value === "now") {
      date = new Date()
    } else if (value === "today") {
      // Current date at midnight UTC
      const localNow = new Date()
      date = new Date(Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate()))
    } else if (value === "yesterday") {
      const localNow = new Date()
      const yesterday = new Date(
        Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate())
      )
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      date = yesterday
    } else if (value === "tomorrow") {
      const localNow = new Date()
      const tomorrow = new Date(
        Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate())
      )
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      date = tomorrow
    } else {
      // Parse ISO format date
      date = new Date(node.value)
    }

    // Validate the date
    if (isNaN(date.getTime())) {
      return [
        {
          type: "error",
          message: "Invalid date format",
          position: node.position,
          length: node.length,
        },
        context,
      ]
    }

    return [{ type: "date", value: date }, context]
  } catch {
    return [
      {
        type: "error",
        message: "Invalid date format",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate an identifier (variable reference)
 * Special identifiers: "prev" and "previous" reference the previous line's result
 */
function evaluateIdentifier(
  node: ASTNode & { kind: "identifier" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  // Check for special "prev" or "previous" identifier
  const name = node.name.toLowerCase()
  if (name === "prev" || name === "previous") {
    return evaluatePreviousResult(node, context)
  }

  const value = context.variables.get(node.name)
  if (value === undefined) {
    return [
      {
        type: "error",
        message: `Variable '${node.name}' not defined`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
  return [value, context]
}

/**
 * Evaluate a reference to the previous line's result
 */
function evaluatePreviousResult(
  node: ASTNode & { kind: "previousResult" | "identifier" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  // Get the last non-empty result from lineResults
  if (context.lineResults.length === 0) {
    return [
      {
        type: "error",
        message: "No previous result available",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  // Find the last non-empty, non-error result
  for (let i = context.lineResults.length - 1; i >= 0; i--) {
    const result = context.lineResults[i]
    if (result.type !== "empty" && result.type !== "error") {
      return [result, context]
    }
  }

  // All previous results were empty
  return [
    {
      type: "error",
      message: "No previous result available",
      position: node.position,
      length: node.length,
    },
    context,
  ]
}

/**
 * Evaluate a binary operation
 */
function evaluateBinary(
  node: ASTNode & { kind: "binary" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const [left, ctx1] = evaluate(node.left, context)
  const [right, ctx2] = evaluate(node.right, ctx1)

  if (left.type === "error") return [left, ctx2]
  if (right.type === "error") return [right, ctx2]
  if (left.type === "empty") return [right, ctx2]
  if (right.type === "empty") return [left, ctx2]

  const op = node.operator

  // Only convert time units to DurationResult when needed for date arithmetic
  // For unit arithmetic (e.g., 100m / 10sec = 10m/s), keep them as NumberResult with format
  const needsDurationConversion =
    left.type === "date" ||
    right.type === "date" ||
    (left.type === "number" && isDuration(left) && right.type === "number" && isDuration(right))

  const leftIsDuration = needsDurationConversion && left.type === "number" && isDuration(left)
  const rightIsDuration = needsDurationConversion && right.type === "number" && isDuration(right)

  const actualLeft: EvalResult = leftIsDuration ? toDurationResult(left as NumberResult) : left
  const actualRight: EvalResult = rightIsDuration ? toDurationResult(right as NumberResult) : right

  // Number + Number (excluding durations which were converted above)
  if (actualLeft.type === "number" && actualRight.type === "number") {
    return evaluateBinaryNumbers(op, actualLeft, actualRight, node, ctx2)
  }

  // Number + Percent
  if (actualLeft.type === "number" && actualRight.type === "percent") {
    return evaluateNumberPercent(op, actualLeft as NumberResult, actualRight, node, ctx2)
  }

  // Percent + Number (only valid for some operations)
  if (actualLeft.type === "percent" && actualRight.type === "number") {
    return evaluatePercentNumber(op, actualLeft, actualRight as NumberResult, node, ctx2)
  }

  // Percent + Percent
  if (actualLeft.type === "percent" && actualRight.type === "percent") {
    return evaluatePercentPercent(op, actualLeft, actualRight, node, ctx2)
  }

  // Date + Duration or Duration + Date
  if (actualLeft.type === "date" && actualRight.type === "duration") {
    return evaluateDateDuration(op, actualLeft, actualRight, node, ctx2)
  }
  if (actualLeft.type === "duration" && actualRight.type === "date") {
    return evaluateDurationDate(op, actualLeft, actualRight, node, ctx2)
  }

  // Date - Date
  if (actualLeft.type === "date" && actualRight.type === "date") {
    return evaluateDateDate(op, actualLeft, actualRight, node, ctx2)
  }

  // Duration + Duration or Duration - Duration
  if (actualLeft.type === "duration" && actualRight.type === "duration") {
    return evaluateDurationDuration(op, actualLeft, actualRight, node, ctx2)
  }

  // Duration * Number or Number * Duration
  if (actualLeft.type === "duration" && actualRight.type === "number") {
    return evaluateDurationNumber(op, actualLeft, actualRight as NumberResult, node, ctx2)
  }
  if (actualLeft.type === "number" && actualRight.type === "duration") {
    return evaluateNumberDuration(op, actualLeft as NumberResult, actualRight, node, ctx2)
  }

  return [
    {
      type: "error",
      message: `Cannot apply operator '${op}' to these types`,
      position: node.position,
      length: node.length,
    },
    ctx2,
  ]
}

/**
 * Evaluate binary operation on two numbers
 */
function evaluateBinaryNumbers(
  op: string,
  left: NumberResult,
  right: NumberResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executeNumbers) {
    return [
      {
        type: "error",
        message: `Unknown operator '${op}'`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  // Validate if the adapter has validation logic
  if (adapter.validate) {
    const validationError = adapter.validate(left.value, right.value)
    if (validationError) {
      return [
        {
          type: "error",
          message: validationError,
          position: node.position,
          length: node.length,
        },
        context,
      ]
    }
  }

  // Validate unit compatibility
  if (left.format && right.format) {
    const leftAdapter = formatRegistry.get(left.format)
    const rightAdapter = formatRegistry.get(right.format)

    if (leftAdapter && rightAdapter) {
      const leftCategory = leftAdapter.unitCategory || "number"
      const rightCategory = rightAdapter.unitCategory || "number"

      // Check if units are incompatible
      // "number" category is compatible with everything
      // For multiplication and division, allow unit arithmetic combinations
      const isUnitArithmeticOperation = op === "*" || op === "/"
      const isValidUnitArithmetic =
        isUnitArithmeticOperation &&
        // speed * time = distance or time * speed = distance
        ((op === "*" &&
          ((leftCategory === "speed" && rightCategory === "time") ||
            (leftCategory === "time" && rightCategory === "speed"))) ||
          // distance / speed = time
          (op === "/" && leftCategory === "distance" && rightCategory === "speed") ||
          // distance / time = speed
          (op === "/" && leftCategory === "distance" && rightCategory === "time") ||
          // Same category (always allowed)
          leftCategory === rightCategory)

      if (
        leftCategory !== rightCategory &&
        leftCategory !== "number" &&
        rightCategory !== "number" &&
        !isValidUnitArithmetic
      ) {
        return [
          {
            type: "error",
            message: `Cannot ${getOperationName(op)} ${leftCategory} and ${rightCategory}`,
            position: node.position,
            length: node.length,
          },
          context,
        ]
      }
    }
  }

  try {
    const result = adapter.executeNumbers(left.value, right.value)

    // Perform unit arithmetic for multiplication and division
    if ((op === "*" || op === "/") && (left.format || right.format)) {
      const unitResult = performUnitArithmetic(op, left.format, right.format)

      // Apply conversion factor if needed
      const finalResult = result.times(unitResult.conversionFactor)

      // If unit arithmetic produced a new format, use it
      // Otherwise, keep the original format (for same-unit operations like 10m * 2)
      const finalFormat =
        unitResult.format !== undefined ? unitResult.format : left.format || right.format

      return [{ type: "number", value: finalResult, format: finalFormat }, context]
    }

    // Inherit format from left operand if it has one, otherwise from right
    const format = left.format || right.format
    return [{ type: "number", value: result, format }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Get human-readable operation name for error messages
 */
function getOperationName(op: string): string {
  switch (op) {
    case "+":
      return "add"
    case "-":
      return "subtract"
    case "*":
      return "multiply"
    case "/":
      return "divide"
    case "%":
      return "modulo"
    case "^":
      return "exponentiate"
    default:
      return "operate on"
  }
}

/**
 * Evaluate binary operation: Number operator Percent
 */
function evaluateNumberPercent(
  op: string,
  left: NumberResult,
  right: PercentResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executeNumberPercent) {
    return [
      {
        type: "error",
        message: `Cannot apply '${op}' to number and percent`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  try {
    const result = adapter.executeNumberPercent(left.value, right.value)
    // Inherit format from left operand if it has one, otherwise from right
    const format = left.format || right.format
    return [{ type: "number", value: result, format }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate binary operation: Percent operator Number
 */
function evaluatePercentNumber(
  op: string,
  left: PercentResult,
  right: NumberResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executePercentNumber) {
    return [
      {
        type: "error",
        message: `Cannot apply '${op}' to percent and number`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  try {
    const result = adapter.executePercentNumber(left.value, right.value)
    // Inherit format from left operand if it has one, otherwise from right
    const format = left.format || right.format
    return [{ type: "percent", value: result, format }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate binary operation: Percent operator Percent
 */
function evaluatePercentPercent(
  op: string,
  left: PercentResult,
  right: PercentResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executePercentPercent) {
    return [
      {
        type: "error",
        message: `Unknown operator '${op}'`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  // Validate if the adapter has validation logic
  if (adapter.validate) {
    const validationError = adapter.validate(left.value, right.value)
    if (validationError) {
      return [
        {
          type: "error",
          message: validationError,
          position: node.position,
          length: node.length,
        },
        context,
      ]
    }
  }

  try {
    const result = adapter.executePercentPercent(left.value, right.value)
    return [{ type: "percent", value: result }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate Date + Duration or Date - Duration
 */
function evaluateDateDuration(
  op: string,
  left: DateResult,
  right: DurationResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executeDateDuration) {
    return [
      {
        type: "error",
        message: `Cannot apply operator '${op}' to date and duration`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  try {
    const result = adapter.executeDateDuration(left.value, right.value, right.unit)
    return [{ type: "date", value: result }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate Duration + Date
 */
function evaluateDurationDate(
  op: string,
  left: DurationResult,
  right: DateResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executeDurationDate) {
    return [
      {
        type: "error",
        message: `Cannot apply operator '${op}' to duration and date`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  try {
    const result = adapter.executeDurationDate(left.value, left.unit, right.value)
    return [{ type: "date", value: result }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate Date - Date
 */
function evaluateDateDate(
  op: string,
  left: DateResult,
  right: DateResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executeDateDate) {
    return [
      {
        type: "error",
        message: `Cannot apply operator '${op}' to two dates`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  try {
    const { value, unit } = adapter.executeDateDate(left.value, right.value)
    return [{ type: "duration", value, unit: unit as "ms" | "sec" | "min" | "hr" | "day" }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate Duration op Duration
 */
function evaluateDurationDuration(
  op: string,
  left: DurationResult,
  right: DurationResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executeDurationDuration) {
    return [
      {
        type: "error",
        message: `Cannot apply operator '${op}' to two durations`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  try {
    const { value, unit } = adapter.executeDurationDuration(
      left.value,
      left.unit,
      right.value,
      right.unit
    )

    // If unit is empty string, it's a dimensionless number (from duration / duration)
    if (unit === "") {
      return [{ type: "number", value }, context]
    }

    return [{ type: "duration", value, unit: unit as "ms" | "sec" | "min" | "hr" | "day" }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate Duration * Number or Duration / Number
 */
function evaluateDurationNumber(
  op: string,
  left: DurationResult,
  right: NumberResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executeDurationNumber) {
    return [
      {
        type: "error",
        message: `Cannot apply operator '${op}' to duration and number`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  try {
    const { value, unit } = adapter.executeDurationNumber(left.value, left.unit, right.value)
    return [{ type: "duration", value, unit: unit as "ms" | "sec" | "min" | "hr" | "day" }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate Number * Duration
 */
function evaluateNumberDuration(
  op: string,
  left: NumberResult,
  right: DurationResult,
  node: ASTNode,
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const adapter = binaryOperatorRegistry.get(op)
  if (!adapter || !adapter.executeNumberDuration) {
    return [
      {
        type: "error",
        message: `Cannot apply operator '${op}' to number and duration`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  try {
    const { value, unit } = adapter.executeNumberDuration(left.value, right.value, right.unit)
    return [{ type: "duration", value, unit: unit as "ms" | "sec" | "min" | "hr" | "day" }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate a unary operation
 */
function evaluateUnary(
  node: ASTNode & { kind: "unary" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const [operand, ctx] = evaluate(node.operand, context)

  if (operand.type === "error") return [operand, ctx]
  if (operand.type === "empty") return [operand, ctx]

  const adapter = unaryOperatorRegistry.get(node.operator)
  if (!adapter) {
    return [
      {
        type: "error",
        message: `Unknown unary operator '${node.operator}'`,
        position: node.position,
        length: node.length,
      },
      ctx,
    ]
  }

  try {
    if (operand.type === "number" && adapter.executeNumber) {
      const result = adapter.executeNumber(operand.value)
      return [{ type: "number", value: result }, ctx]
    }
    if (operand.type === "percent" && adapter.executePercent) {
      const result = adapter.executePercent(operand.value)
      return [{ type: "percent", value: result }, ctx]
    }

    return [
      {
        type: "error",
        message: `Cannot apply unary '${node.operator}' to this type`,
        position: node.position,
        length: node.length,
      },
      ctx,
    ]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      ctx,
    ]
  }
}

/**
 * Evaluate a postfix operation (++ or --)
 */
function evaluatePostfix(
  node: ASTNode & { kind: "postfix" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const [operand, ctx] = evaluate(node.operand, context)

  if (operand.type === "error") return [operand, ctx]
  if (operand.type === "empty") return [operand, ctx]

  const adapter = unaryOperatorRegistry.get(node.operator)
  if (!adapter) {
    return [
      {
        type: "error",
        message: `Unknown postfix operator '${node.operator}'`,
        position: node.position,
        length: node.length,
      },
      ctx,
    ]
  }

  try {
    if (operand.type === "number" && adapter.executeNumber) {
      const result = adapter.executeNumber(operand.value)
      return [{ type: "number", value: result }, ctx]
    }
    if (operand.type === "percent" && adapter.executePercent) {
      const result = adapter.executePercent(operand.value)
      return [{ type: "percent", value: result }, ctx]
    }

    return [
      {
        type: "error",
        message: `Cannot apply postfix '${node.operator}' to this type`,
        position: node.position,
        length: node.length,
      },
      ctx,
    ]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      ctx,
    ]
  }
}

/**
 * Evaluate an assignment
 */
function evaluateAssignment(
  node: ASTNode & { kind: "assignment" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const [value, ctx] = evaluate(node.expression, context)

  if (value.type === "error") return [value, ctx]

  // Apply format if specified
  let finalValue = value
  if (node.format && (value.type === "number" || value.type === "percent")) {
    finalValue = { ...value, format: node.format }
  }

  // Create new context with updated variables
  const newContext: ExecutionContext = {
    ...ctx,
    variables: new Map(ctx.variables),
  }
  newContext.variables.set(node.identifier, finalValue)

  return [finalValue, newContext]
}

/**
 * Evaluate a formatted expression (e.g., "1000000 in M")
 */
function evaluateFormatted(
  node: ASTNode & { kind: "formatted" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const [value, ctx] = evaluate(node.expression, context)

  if (value.type === "error") return [value, ctx]

  // Apply format to number or percent
  if (value.type === "number" || value.type === "percent") {
    return [{ ...value, format: node.format }, ctx]
  }

  return [value, ctx]
}

/**
 * Evaluate an aggregate function (sum, avg, min, max, count)
 */
function evaluateAggregate(
  node: ASTNode & { kind: "aggregate" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const numbers: Big[] = []

  // Collect all number results from previous lines
  for (const result of context.lineResults) {
    if (result.type === "number") {
      numbers.push(result.value)
    }
  }

  if (numbers.length === 0) {
    return [
      {
        type: "error",
        message: `No numbers to ${node.function}`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  const adapter = aggregateFunctionRegistry.get(node.function)
  if (!adapter) {
    return [
      {
        type: "error",
        message: `Unknown function '${node.function}'`,
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }

  // Validate if the adapter has validation logic
  if (adapter.validate) {
    const validationError = adapter.validate(numbers)
    if (validationError) {
      return [
        {
          type: "error",
          message: validationError,
          position: node.position,
          length: node.length,
        },
        context,
      ]
    }
  }

  try {
    const result = adapter.execute(numbers)
    return [{ type: "number", value: result }, context]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Calculation error",
        position: node.position,
        length: node.length,
      },
      context,
    ]
  }
}

/**
 * Evaluate a fraction operation (e.g., "20% of 100")
 */
function evaluateFraction(
  node: ASTNode & { kind: "fraction" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const [numerator, ctx1] = evaluate(node.numerator, context)
  const [denominator, ctx2] = evaluate(node.denominator, ctx1)

  if (numerator.type === "error") return [numerator, ctx2]
  if (denominator.type === "error") return [denominator, ctx2]

  // Number of Number = (numerator * denominator) / 100
  if (numerator.type === "number" && denominator.type === "number") {
    const result = denominator.value.times(numerator.value).div(100)
    return [{ type: "number", value: result }, ctx2]
  }

  // Percent of Number = (percent * number) / 100
  if (numerator.type === "percent" && denominator.type === "number") {
    const result = denominator.value.times(numerator.value).div(100)
    return [{ type: "number", value: result }, ctx2]
  }

  // Percent of Percent = (percent * percent) / 100
  if (numerator.type === "percent" && denominator.type === "percent") {
    const result = denominator.value.times(numerator.value).div(100)
    return [{ type: "percent", value: result }, ctx2]
  }

  return [
    {
      type: "error",
      message: "Invalid fraction operation",
      position: node.position,
      length: node.length,
    },
    ctx2,
  ]
}

/**
 * Evaluate a function call (e.g., "round(3.14)")
 * Uses the adapter pattern - each function knows how to transform values
 */
function evaluateFunction(
  node: ASTNode & { kind: "function" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  const [argResult, newContext] = evaluate(node.argument, context)

  if (argResult.type === "error") return [argResult, newContext]

  // Look up the function adapter
  const adapter = functionRegistry.get(node.name)
  if (!adapter) {
    return [
      {
        type: "error",
        message: `Unknown function '${node.name}'`,
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  // Handle empty argument (for no-arg functions like today(), now())
  if (argResult.type === "empty") {
    // Check if this function supports no-argument execution (date constructors)
    if (adapter.executeDate) {
      try {
        const result = adapter.executeDate()
        if (result instanceof Date) {
          return [{ type: "date", value: result }, newContext]
        }
        // If it returns a Big, treat as number
        return [{ type: "number", value: result }, newContext]
      } catch (error) {
        return [
          {
            type: "error",
            message: error instanceof Error ? error.message : "Function evaluation error",
            position: node.position,
            length: node.length,
          },
          newContext,
        ]
      }
    }

    return [
      {
        type: "error",
        message: "Function requires an argument",
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  // Handle date argument
  if (argResult.type === "date") {
    if (!adapter.executeDate) {
      return [
        {
          type: "error",
          message: `Function '${node.name}' does not accept date arguments`,
          position: node.position,
          length: node.length,
        },
        newContext,
      ]
    }

    // Validate if the adapter has date validation logic
    if (adapter.validateDate) {
      const validationError = adapter.validateDate(argResult.value)
      if (validationError) {
        return [
          {
            type: "error",
            message: validationError,
            position: node.position,
            length: node.length,
          },
          newContext,
        ]
      }
    }

    // Execute the function on the date
    try {
      const result = adapter.executeDate(argResult.value)
      if (result instanceof Date) {
        return [{ type: "date", value: result }, newContext]
      }
      // If it returns a Big (like year, month, etc.), return as number
      return [{ type: "number", value: result }, newContext]
    } catch (error) {
      return [
        {
          type: "error",
          message: error instanceof Error ? error.message : "Function evaluation error",
          position: node.position,
          length: node.length,
        },
        newContext,
      ]
    }
  }

  // Get numeric value (works for both number and percent types)
  let value: Big
  if (argResult.type === "number") {
    value = argResult.value
  } else if (argResult.type === "percent") {
    value = argResult.value
  } else if (argResult.type === "duration") {
    // Duration is treated as a number for function purposes
    value = argResult.value
  } else {
    return [
      {
        type: "error",
        message: "Function requires a numeric or date argument",
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  // Validate if the adapter has validation logic
  if (adapter.validate) {
    const validationError = adapter.validate(value)
    if (validationError) {
      return [
        {
          type: "error",
          message: validationError,
          position: node.position,
          length: node.length,
        },
        newContext,
      ]
    }
  }

  // Execute the function
  try {
    const result = adapter.execute(value)

    // Return same type as input (number or percent)
    if (argResult.type === "percent") {
      return [{ type: "percent", value: result }, newContext]
    }
    return [{ type: "number", value: result }, newContext]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Function evaluation error",
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }
}

/**
 * Evaluate unit conversion expression (e.g., 100km to m)
 */
function evaluateConversion(
  node: ASTNode & { kind: "conversion" },
  context: ExecutionContext
): [EvalResult, ExecutionContext] {
  // Evaluate the expression
  const [exprResult, newContext] = evaluate(node.expression, context)

  // Handle error results
  if (exprResult.type === "error") {
    return [exprResult, newContext]
  }

  // Handle empty results
  if (exprResult.type === "empty") {
    return [
      {
        type: "error",
        message: "Cannot convert empty value",
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  // Only numbers can be converted (not percents)
  if (exprResult.type !== "number") {
    return [
      {
        type: "error",
        message: "Can only convert numbers with units",
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  // Source must have a unit format
  if (!exprResult.format) {
    return [
      {
        type: "error",
        message: "Cannot convert number without a unit",
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  // Get source and target format adapters
  const sourceAdapter = formatRegistry.get(exprResult.format)
  const targetParseResult = formatRegistry.findParser(node.targetUnit)
  const targetAdapter = targetParseResult?.adapter

  if (!sourceAdapter) {
    return [
      {
        type: "error",
        message: `Unknown source unit '${exprResult.format}'`,
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  if (!targetAdapter) {
    return [
      {
        type: "error",
        message: `Unknown target unit '${node.targetUnit}'`,
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  // Both units must have conversion factors defined
  if (sourceAdapter.toBaseUnit === undefined) {
    return [
      {
        type: "error",
        message: `Unit '${exprResult.format}' does not support conversion`,
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  if (targetAdapter.toBaseUnit === undefined) {
    return [
      {
        type: "error",
        message: `Unit '${node.targetUnit}' does not support conversion`,
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  // Units must be in the same category
  const sourceCategory = sourceAdapter.unitCategory
  const targetCategory = targetAdapter.unitCategory

  if (!sourceCategory || !targetCategory) {
    return [
      {
        type: "error",
        message: "Cannot convert between units without categories",
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  if (sourceCategory !== targetCategory) {
    return [
      {
        type: "error",
        message: `Cannot convert ${sourceCategory} to ${targetCategory}`,
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

  // Perform conversion: value -> base unit -> target unit
  try {
    const valueInBaseUnit = exprResult.value.times(sourceAdapter.toBaseUnit)
    const valueInTargetUnit = valueInBaseUnit.div(targetAdapter.toBaseUnit)

    return [
      {
        type: "number",
        value: valueInTargetUnit,
        format: targetAdapter.id,
      },
      newContext,
    ]
  } catch (error) {
    return [
      {
        type: "error",
        message: error instanceof Error ? error.message : "Conversion error",
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }
}
