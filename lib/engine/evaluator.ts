import Big from "big.js"
import { ASTNode, EvalResult, ExecutionContext, NumberResult, PercentResult } from "./types"
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

  // Find the last non-empty result
  for (let i = context.lineResults.length - 1; i >= 0; i--) {
    const result = context.lineResults[i]
    if (result.type !== "empty") {
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

  // Number + Number
  if (left.type === "number" && right.type === "number") {
    return evaluateBinaryNumbers(op, left, right, node, ctx2)
  }

  // Number + Percent
  if (left.type === "number" && right.type === "percent") {
    return evaluateNumberPercent(op, left, right, node, ctx2)
  }

  // Percent + Number (only valid for some operations)
  if (left.type === "percent" && right.type === "number") {
    return evaluatePercentNumber(op, left, right, node, ctx2)
  }

  // Percent + Percent
  if (left.type === "percent" && right.type === "percent") {
    return evaluatePercentPercent(op, left, right, node, ctx2)
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
  if (argResult.type === "empty") {
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

  // Get numeric value (works for both number and percent types)
  let value: Big
  if (argResult.type === "number") {
    value = argResult.value
  } else if (argResult.type === "percent") {
    value = argResult.value
  } else {
    return [
      {
        type: "error",
        message: "Function requires a numeric argument",
        position: node.position,
        length: node.length,
      },
      newContext,
    ]
  }

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
  const targetAdapter = formatRegistry.get(node.targetUnit)

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
        format: node.targetUnit,
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
