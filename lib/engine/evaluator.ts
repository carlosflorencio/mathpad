import Big from 'big.js';
import { ASTNode, EvalResult, ExecutionContext, NumberResult, PercentResult, EmptyResult, ErrorResult } from './types';

// Configure Big.js for better precision
Big.DP = 20; // Decimal places
Big.RM = Big.roundHalfUp; // Rounding mode

/**
 * Evaluate an AST node and return a result
 * This is a pure function - no side effects, returns new context
 */
export function evaluate(node: ASTNode, context: ExecutionContext): [EvalResult, ExecutionContext] {
  try {
    switch (node.kind) {
      case 'empty':
        return [{ type: 'empty' }, context];

      case 'number':
        return evaluateNumber(node, context);

      case 'percent':
        return evaluatePercent(node, context);

      case 'identifier':
        return evaluateIdentifier(node, context);

      case 'binary':
        return evaluateBinary(node, context);

      case 'unary':
        return evaluateUnary(node, context);

      case 'assignment':
        return evaluateAssignment(node, context);

      case 'aggregate':
        return evaluateAggregate(node, context);

      case 'fraction':
        return evaluateFraction(node, context);

      default:
        const exhaustiveCheck: never = node;
        return [
          {
            type: 'error',
            message: 'Unknown node type',
            position: 0,
            length: 0,
          },
          context,
        ];
    }
  } catch (error) {
    return [
      {
        type: 'error',
        message: error instanceof Error ? error.message : 'Evaluation error',
        position: node.position,
        length: node.length,
      },
      context,
    ];
  }
}

/**
 * Evaluate a number literal
 */
function evaluateNumber(node: ASTNode & { kind: 'number' }, context: ExecutionContext): [EvalResult, ExecutionContext] {
  try {
    let numStr = node.value;
    let multiplier = 1;

    // Handle suffixes
    if (numStr.endsWith('k')) {
      multiplier = 1000;
      numStr = numStr.slice(0, -1);
    } else if (numStr.endsWith('M')) {
      multiplier = 1000000;
      numStr = numStr.slice(0, -1);
    }

    // Remove separators (spaces, commas, underscores, apostrophes)
    numStr = numStr.replace(/[\s,_']/g, '');

    const value = new Big(numStr).times(multiplier);
    return [{ type: 'number', value }, context];
  } catch {
    return [
      {
        type: 'error',
        message: 'Invalid number format',
        position: node.position,
        length: node.length,
      },
      context,
    ];
  }
}

/**
 * Evaluate a percentage literal
 */
function evaluatePercent(node: ASTNode & { kind: 'percent' }, context: ExecutionContext): [EvalResult, ExecutionContext] {
  try {
    const numStr = node.value.replace(/[\s,_']/g, '');
    const value = new Big(numStr);
    return [{ type: 'percent', value }, context];
  } catch {
    return [
      {
        type: 'error',
        message: 'Invalid percentage format',
        position: node.position,
        length: node.length,
      },
      context,
    ];
  }
}

/**
 * Evaluate an identifier (variable reference)
 */
function evaluateIdentifier(node: ASTNode & { kind: 'identifier' }, context: ExecutionContext): [EvalResult, ExecutionContext] {
  const value = context.variables.get(node.name);
  if (value === undefined) {
    return [
      {
        type: 'error',
        message: `Variable '${node.name}' not defined`,
        position: node.position,
        length: node.length,
      },
      context,
    ];
  }
  return [value, context];
}

/**
 * Evaluate a binary operation
 */
function evaluateBinary(node: ASTNode & { kind: 'binary' }, context: ExecutionContext): [EvalResult, ExecutionContext] {
  const [left, ctx1] = evaluate(node.left, context);
  const [right, ctx2] = evaluate(node.right, ctx1);

  if (left.type === 'error') return [left, ctx2];
  if (right.type === 'error') return [right, ctx2];
  if (left.type === 'empty') return [right, ctx2];
  if (right.type === 'empty') return [left, ctx2];

  const op = node.operator;

  // Number + Number
  if (left.type === 'number' && right.type === 'number') {
    return evaluateBinaryNumbers(op, left, right, node, ctx2);
  }

  // Number + Percent
  if (left.type === 'number' && right.type === 'percent') {
    return evaluateNumberPercent(op, left, right, node, ctx2);
  }

  // Percent + Number (only valid for some operations)
  if (left.type === 'percent' && right.type === 'number') {
    return evaluatePercentNumber(op, left, right, node, ctx2);
  }

  // Percent + Percent
  if (left.type === 'percent' && right.type === 'percent') {
    return evaluatePercentPercent(op, left, right, node, ctx2);
  }

  return [
    {
      type: 'error',
      message: `Cannot apply operator '${op}' to these types`,
      position: node.position,
      length: node.length,
    },
    ctx2,
  ];
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
  try {
    let result: Big;
    switch (op) {
      case '+':
        result = left.value.plus(right.value);
        break;
      case '-':
        result = left.value.minus(right.value);
        break;
      case '*':
        result = left.value.times(right.value);
        break;
      case '/':
        if (right.value.eq(0)) {
          return [
            { type: 'error', message: 'Division by zero', position: node.position, length: node.length },
            context,
          ];
        }
        result = left.value.div(right.value);
        break;
      case '%':
        if (right.value.eq(0)) {
          return [
            { type: 'error', message: 'Modulo by zero', position: node.position, length: node.length },
            context,
          ];
        }
        result = left.value.mod(right.value);
        break;
      case '^':
        result = left.value.pow(right.value.toNumber());
        break;
      default:
        return [
          { type: 'error', message: `Unknown operator '${op}'`, position: node.position, length: node.length },
          context,
        ];
    }
    return [{ type: 'number', value: result }, context];
  } catch (error) {
    return [
      {
        type: 'error',
        message: error instanceof Error ? error.message : 'Calculation error',
        position: node.position,
        length: node.length,
      },
      context,
    ];
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
  try {
    let result: Big;
    switch (op) {
      case '+':
        // 100 + 20% = 120
        result = left.value.times(new Big(1).plus(right.value.div(100)));
        break;
      case '-':
        // 100 - 20% = 80
        result = left.value.times(new Big(1).minus(right.value.div(100)));
        break;
      case '*':
        // 100 * 20% = 20
        result = left.value.times(right.value).div(100);
        break;
      default:
        return [
          { type: 'error', message: `Cannot apply '${op}' to number and percent`, position: node.position, length: node.length },
          context,
        ];
    }
    return [{ type: 'number', value: result }, context];
  } catch (error) {
    return [
      {
        type: 'error',
        message: error instanceof Error ? error.message : 'Calculation error',
        position: node.position,
        length: node.length,
      },
      context,
    ];
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
  try {
    let result: Big;
    switch (op) {
      case '*':
        // 20% * 5 = 100%
        result = left.value.times(right.value);
        return [{ type: 'percent', value: result }, context];
      case '/':
        if (right.value.eq(0)) {
          return [
            { type: 'error', message: 'Division by zero', position: node.position, length: node.length },
            context,
          ];
        }
        // 100% / 2 = 50%
        result = left.value.div(right.value);
        return [{ type: 'percent', value: result }, context];
      default:
        return [
          { type: 'error', message: `Cannot apply '${op}' to percent and number`, position: node.position, length: node.length },
          context,
        ];
    }
  } catch (error) {
    return [
      {
        type: 'error',
        message: error instanceof Error ? error.message : 'Calculation error',
        position: node.position,
        length: node.length,
      },
      context,
    ];
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
  try {
    let result: Big;
    switch (op) {
      case '+':
        result = left.value.plus(right.value);
        break;
      case '-':
        result = left.value.minus(right.value);
        break;
      case '*':
        result = left.value.times(right.value);
        break;
      case '/':
        if (right.value.eq(0)) {
          return [
            { type: 'error', message: 'Division by zero', position: node.position, length: node.length },
            context,
          ];
        }
        result = left.value.div(right.value);
        break;
      case '%':
        if (right.value.eq(0)) {
          return [
            { type: 'error', message: 'Modulo by zero', position: node.position, length: node.length },
            context,
          ];
        }
        result = left.value.mod(right.value);
        break;
      case '^':
        result = left.value.pow(right.value.toNumber());
        break;
      default:
        return [
          { type: 'error', message: `Unknown operator '${op}'`, position: node.position, length: node.length },
          context,
        ];
    }
    return [{ type: 'percent', value: result }, context];
  } catch (error) {
    return [
      {
        type: 'error',
        message: error instanceof Error ? error.message : 'Calculation error',
        position: node.position,
        length: node.length,
      },
      context,
    ];
  }
}

/**
 * Evaluate a unary operation
 */
function evaluateUnary(node: ASTNode & { kind: 'unary' }, context: ExecutionContext): [EvalResult, ExecutionContext] {
  const [operand, ctx] = evaluate(node.operand, context);

  if (operand.type === 'error') return [operand, ctx];
  if (operand.type === 'empty') return [operand, ctx];

  if (node.operator === '-') {
    if (operand.type === 'number') {
      return [{ type: 'number', value: operand.value.times(-1) }, ctx];
    }
    if (operand.type === 'percent') {
      return [{ type: 'percent', value: operand.value.times(-1) }, ctx];
    }
  } else if (node.operator === '+') {
    return [operand, ctx];
  }

  return [
    {
      type: 'error',
      message: `Cannot apply unary '${node.operator}' to this type`,
      position: node.position,
      length: node.length,
    },
    ctx,
  ];
}

/**
 * Evaluate an assignment
 */
function evaluateAssignment(node: ASTNode & { kind: 'assignment' }, context: ExecutionContext): [EvalResult, ExecutionContext] {
  const [value, ctx] = evaluate(node.expression, context);

  if (value.type === 'error') return [value, ctx];

  // Create new context with updated variables
  const newContext: ExecutionContext = {
    ...ctx,
    variables: new Map(ctx.variables),
  };
  newContext.variables.set(node.identifier, value);

  return [value, newContext];
}

/**
 * Evaluate an aggregate function (sum, avg, min, max, count)
 */
function evaluateAggregate(node: ASTNode & { kind: 'aggregate' }, context: ExecutionContext): [EvalResult, ExecutionContext] {
  const numbers: Big[] = [];

  // Collect all number results from previous lines
  for (const result of context.lineResults) {
    if (result.type === 'number') {
      numbers.push(result.value);
    }
  }

  if (numbers.length === 0) {
    return [
      {
        type: 'error',
        message: `No numbers to ${node.function}`,
        position: node.position,
        length: node.length,
      },
      context,
    ];
  }

  try {
    let result: Big;
    switch (node.function) {
      case 'sum':
        result = numbers.reduce((acc, n) => acc.plus(n), new Big(0));
        break;
      case 'avg':
        result = numbers.reduce((acc, n) => acc.plus(n), new Big(0)).div(numbers.length);
        break;
      case 'min':
        result = numbers.reduce((min, n) => (n.lt(min) ? n : min));
        break;
      case 'max':
        result = numbers.reduce((max, n) => (n.gt(max) ? n : max));
        break;
      case 'count':
        result = new Big(numbers.length);
        break;
      default:
        return [
          {
            type: 'error',
            message: `Unknown function '${node.function}'`,
            position: node.position,
            length: node.length,
          },
          context,
        ];
    }
    return [{ type: 'number', value: result }, context];
  } catch (error) {
    return [
      {
        type: 'error',
        message: error instanceof Error ? error.message : 'Calculation error',
        position: node.position,
        length: node.length,
      },
      context,
    ];
  }
}

/**
 * Evaluate a fraction operation (e.g., "20% of 100")
 */
function evaluateFraction(node: ASTNode & { kind: 'fraction' }, context: ExecutionContext): [EvalResult, ExecutionContext] {
  const [numerator, ctx1] = evaluate(node.numerator, context);
  const [denominator, ctx2] = evaluate(node.denominator, ctx1);

  if (numerator.type === 'error') return [numerator, ctx2];
  if (denominator.type === 'error') return [denominator, ctx2];

  // Number of Number = (numerator * denominator) / 100
  if (numerator.type === 'number' && denominator.type === 'number') {
    const result = denominator.value.times(numerator.value).div(100);
    return [{ type: 'number', value: result }, ctx2];
  }

  // Percent of Number = (percent * number) / 100
  if (numerator.type === 'percent' && denominator.type === 'number') {
    const result = denominator.value.times(numerator.value).div(100);
    return [{ type: 'number', value: result }, ctx2];
  }

  // Percent of Percent = (percent * percent) / 100
  if (numerator.type === 'percent' && denominator.type === 'percent') {
    const result = denominator.value.times(numerator.value).div(100);
    return [{ type: 'percent', value: result }, ctx2];
  }

  return [
    {
      type: 'error',
      message: 'Invalid fraction operation',
      position: node.position,
      length: node.length,
    },
    ctx2,
  ];
}
