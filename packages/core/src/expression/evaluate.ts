// @formality/core - Expression Evaluation
// Uses jsep for parsing and custom evaluation for safe expression execution

import jsep from 'jsep';
import { unwrapFieldProxy } from './context';

// jsep AST node types
type Expression = jsep.Expression;
type Identifier = jsep.Identifier;
type Literal = jsep.Literal;
type MemberExpression = jsep.MemberExpression;
type BinaryExpression = jsep.BinaryExpression;
// LogicalExpression uses the same type as BinaryExpression in newer jsep versions
type LogicalExpression = jsep.BinaryExpression;
type UnaryExpression = jsep.UnaryExpression;
type ConditionalExpression = jsep.ConditionalExpression;
type CallExpression = jsep.CallExpression;
type ArrayExpression = jsep.ArrayExpression;
type Compound = jsep.Compound;

/**
 * Evaluation context type
 */
export type EvaluationContext = Record<string, unknown>;

/**
 * Get a property from an object safely
 */
function getProperty(obj: unknown, key: string): unknown {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  if (typeof obj === 'object') {
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}

/**
 * Evaluate an AST node against a context
 */
function evaluateNode(node: Expression, context: EvaluationContext): unknown {
  switch (node.type) {
    case 'Literal':
      return (node as Literal).value;

    case 'Identifier':
      return context[(node as Identifier).name];

    case 'MemberExpression': {
      const memberNode = node as MemberExpression;
      const object = evaluateNode(memberNode.object, context);
      if (memberNode.computed) {
        // bracket notation: obj[expr]
        const property = evaluateNode(memberNode.property, context);
        return getProperty(object, String(property));
      } else {
        // dot notation: obj.prop
        return getProperty(object, (memberNode.property as Identifier).name);
      }
    }

    case 'BinaryExpression': {
      const binaryNode = node as BinaryExpression;

      // Logical operators need short-circuit evaluation
      // (newer jsep versions treat these as BinaryExpression)
      switch (binaryNode.operator) {
        case '&&': {
          const left = evaluateNode(binaryNode.left, context);
          // Unwrap proxy for truthiness check
          const leftValue = unwrapFieldProxy(left);
          return leftValue ? evaluateNode(binaryNode.right, context) : leftValue;
        }
        case '||': {
          const left = evaluateNode(binaryNode.left, context);
          // Unwrap proxy for truthiness check
          const leftValue = unwrapFieldProxy(left);
          return leftValue ? leftValue : evaluateNode(binaryNode.right, context);
        }
        case '??': {
          const left = evaluateNode(binaryNode.left, context);
          // Unwrap proxy for null/undefined check
          const leftValue = unwrapFieldProxy(left);
          return leftValue !== null && leftValue !== undefined
            ? leftValue
            : evaluateNode(binaryNode.right, context);
        }
      }

      // Non-short-circuit operators evaluate both sides
      const left = evaluateNode(binaryNode.left, context);
      const right = evaluateNode(binaryNode.right, context);
      // Unwrap proxies for comparison/arithmetic operations
      const leftValue = unwrapFieldProxy(left);
      const rightValue = unwrapFieldProxy(right);

      switch (binaryNode.operator) {
        case '+':
          return (leftValue as number) + (rightValue as number);
        case '-':
          return (leftValue as number) - (rightValue as number);
        case '*':
          return (leftValue as number) * (rightValue as number);
        case '/':
          return (leftValue as number) / (rightValue as number);
        case '%':
          return (leftValue as number) % (rightValue as number);
        case '===':
          return leftValue === rightValue;
        case '!==':
          return leftValue !== rightValue;
        case '==':
          // eslint-disable-next-line eqeqeq
          return leftValue == rightValue;
        case '!=':
          // eslint-disable-next-line eqeqeq
          return leftValue != rightValue;
        case '<':
          return (leftValue as number) < (rightValue as number);
        case '>':
          return (leftValue as number) > (rightValue as number);
        case '<=':
          return (leftValue as number) <= (rightValue as number);
        case '>=':
          return (leftValue as number) >= (rightValue as number);
        default:
          throw new Error(`Unknown binary operator: ${binaryNode.operator}`);
      }
    }

    case 'LogicalExpression': {
      const logicalNode = node as LogicalExpression;
      const left = evaluateNode(logicalNode.left, context);
      // Unwrap proxy for truthiness/null checks
      const leftValue = unwrapFieldProxy(left);

      switch (logicalNode.operator) {
        case '&&':
          // Short-circuit: only evaluate right if left is truthy
          return leftValue ? evaluateNode(logicalNode.right, context) : leftValue;
        case '||':
          // Short-circuit: only evaluate right if left is falsy
          return leftValue ? leftValue : evaluateNode(logicalNode.right, context);
        case '??':
          // Nullish coalescing: only evaluate right if left is null/undefined
          return leftValue !== null && leftValue !== undefined
            ? leftValue
            : evaluateNode(logicalNode.right, context);
        default:
          throw new Error(`Unknown logical operator: ${logicalNode.operator}`);
      }
    }

    case 'UnaryExpression': {
      const unaryNode = node as UnaryExpression;
      const argument = evaluateNode(unaryNode.argument, context);
      // Unwrap proxy for unary operations
      const argValue = unwrapFieldProxy(argument);

      switch (unaryNode.operator) {
        case '!':
          return !argValue;
        case '-':
          return -(argValue as number);
        case '+':
          return +(argValue as number);
        case 'typeof':
          return typeof argValue;
        default:
          throw new Error(`Unknown unary operator: ${unaryNode.operator}`);
      }
    }

    case 'ConditionalExpression': {
      const condNode = node as ConditionalExpression;
      const test = evaluateNode(condNode.test, context);
      // Unwrap proxy for truthiness check
      const testValue = unwrapFieldProxy(test);
      return testValue
        ? evaluateNode(condNode.consequent, context)
        : evaluateNode(condNode.alternate, context);
    }

    case 'ArrayExpression': {
      const arrayNode = node as ArrayExpression;
      return arrayNode.elements.map((element) =>
        element ? evaluateNode(element, context) : undefined
      );
    }

    case 'CallExpression': {
      // We don't allow function calls for security
      throw new Error('Function calls are not allowed in expressions');
    }

    case 'Compound': {
      // Compound expressions (multiple statements) - evaluate last one
      const compoundNode = node as Compound;
      let result: unknown;
      for (const bodyNode of compoundNode.body) {
        result = evaluateNode(bodyNode, context);
      }
      return result;
    }

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

/**
 * Parse and cache expression ASTs
 */
const astCache = new Map<string, Expression>();

function parseExpression(expr: string): Expression {
  const cached = astCache.get(expr);
  if (cached) {
    return cached;
  }

  const ast = jsep(expr);
  astCache.set(expr, ast);
  return ast;
}

/**
 * Evaluate a string expression against a context object
 *
 * @param expr - Expression string (e.g., "client.id", "client && signed")
 * @param context - Evaluation context with field values
 * @returns The evaluated result
 *
 * @example
 * evaluate("client.id", { client: { id: 5 } }) // → 5
 * evaluate("client && signed", { client: { id: 5 }, signed: true }) // → true
 * evaluate("signed ? 'Yes' : 'No'", { signed: true }) // → 'Yes'
 */
export function evaluate(expr: string, context: EvaluationContext): unknown {
  try {
    const ast = parseExpression(expr);
    const result = evaluateNode(ast, context);
    // Unwrap proxy to return raw value
    const unwrapped = unwrapFieldProxy(result);
    return unwrapped;
  } catch (error) {
    // Log error in development, return undefined in production
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Expression evaluation error for "${expr}":`, error);
    }
    return undefined;
  }
}

/**
 * Evaluate a SelectValue descriptor
 *
 * Handles string expressions, objects with nested expressions, and arrays.
 * Does NOT handle functions - those must be handled by the framework adapter.
 *
 * @param descriptor - The SelectValue to evaluate
 * @param context - Evaluation context
 * @returns The evaluated result
 */
export function evaluateDescriptor(
  descriptor: unknown,
  context: EvaluationContext
): unknown {
  // String: evaluate as expression
  if (typeof descriptor === 'string') {
    return evaluate(descriptor, context);
  }

  // Function: return as-is (framework adapter handles this)
  if (typeof descriptor === 'function') {
    return descriptor;
  }

  // Array: evaluate each element
  if (Array.isArray(descriptor)) {
    return descriptor.map((item) => evaluateDescriptor(item, context));
  }

  // Object: evaluate each value
  if (descriptor !== null && typeof descriptor === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(descriptor)) {
      result[key] = evaluateDescriptor(value, context);
    }
    return result;
  }

  // Primitive values: return as-is
  return descriptor;
}

/**
 * Clear the expression AST cache
 * Useful for testing or memory management
 */
export function clearExpressionCache(): void {
  astCache.clear();
}
