// @formality/core - Field Dependency Inference
// Extracts field dependencies from expressions for automatic subscription

import { QUALIFIED_PREFIXES, KEYWORDS } from './context';

/**
 * Regular expression to match valid JavaScript identifiers
 */
const IDENTIFIER_REGEX = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;

/**
 * Set of JavaScript keywords to skip
 */
const KEYWORD_SET = new Set<string>(KEYWORDS);

/**
 * Set of qualified prefixes that may or may not be field names
 */
const QUALIFIED_PREFIX_SET = new Set<string>(QUALIFIED_PREFIXES);

/**
 * Extract field names from an expression string
 *
 * Scans the expression for unqualified identifiers that represent field names.
 * Skips JavaScript keywords. Qualified prefixes (fields, record, props, etc.)
 * are only skipped when followed by a dot.
 *
 * @param expr - Expression string to analyze
 * @returns Array of unique field names referenced
 *
 * @example
 * inferFieldsFromExpression("client.id") // → ["client"]
 * inferFieldsFromExpression("client && signed") // → ["client", "signed"]
 * inferFieldsFromExpression("record.name") // → [] (qualified path)
 * inferFieldsFromExpression("true && false") // → [] (keywords)
 * inferFieldsFromExpression("fields === null") // → ["fields"] (not followed by dot)
 */
export function inferFieldsFromExpression(expr: string): string[] {
  const fields: string[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  IDENTIFIER_REGEX.lastIndex = 0;

  while ((match = IDENTIFIER_REGEX.exec(expr)) !== null) {
    const identifier = match[1];

    // Skip JavaScript keywords
    if (KEYWORD_SET.has(identifier)) {
      continue;
    }

    // Check if this identifier is a property access (e.g., .id in client.id)
    // by looking at what comes before it in the string
    const beforeMatch = expr.slice(0, match.index);
    const lastNonWhitespace = beforeMatch.trimEnd().slice(-1);

    // If preceded by '.', it's a property access, skip it
    if (lastNonWhitespace === '.') {
      continue;
    }

    // Check if this is a qualified prefix followed by a dot
    // (e.g., "fields" in "fields.client" - skip it)
    // But "fields" NOT followed by a dot is a field reference
    const afterMatch = expr.slice(match.index + identifier.length);
    if (afterMatch.startsWith('.') && QUALIFIED_PREFIX_SET.has(identifier)) {
      continue;
    }

    fields.push(identifier);
  }

  // Return unique field names
  return [...new Set(fields)];
}

/**
 * Extract field dependencies from a SelectValue descriptor
 *
 * Recursively processes string expressions, objects, and arrays.
 * Does NOT analyze function bodies - those require explicit subscribesTo.
 *
 * @param descriptor - SelectValue to analyze (string, object, array, or function)
 * @returns Array of unique field names referenced
 *
 * @example
 * inferFieldsFromDescriptor("client.id") // → ["client"]
 * inferFieldsFromDescriptor({ queryParams: "client.id", filter: "signed" }) // → ["client", "signed"]
 * inferFieldsFromDescriptor(["client", "contact.name"]) // → ["client", "contact"]
 * inferFieldsFromDescriptor(() => {}) // → [] (functions need explicit subscribesTo)
 */
export function inferFieldsFromDescriptor(descriptor: unknown): string[] {
  // String: extract fields from expression
  if (typeof descriptor === 'string') {
    return inferFieldsFromExpression(descriptor);
  }

  // Function: cannot analyze, return empty (needs explicit subscribesTo)
  if (typeof descriptor === 'function') {
    return [];
  }

  // Array: collect fields from all elements
  if (Array.isArray(descriptor)) {
    const allFields: string[] = [];
    for (const item of descriptor) {
      allFields.push(...inferFieldsFromDescriptor(item));
    }
    return [...new Set(allFields)];
  }

  // Object: collect fields from all values
  if (descriptor !== null && typeof descriptor === 'object') {
    const allFields: string[] = [];
    for (const value of Object.values(descriptor)) {
      allFields.push(...inferFieldsFromDescriptor(value));
    }
    return [...new Set(allFields)];
  }

  // Primitive values: no fields
  return [];
}
