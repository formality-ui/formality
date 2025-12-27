// @formality-ui/core - Expression Context Building
// Implements the Dual Context Mapping pattern for expression evaluation

import type { FormState, FieldState, FieldError } from '../types';

/**
 * Qualified prefixes that should NOT be auto-transformed
 */
export const QUALIFIED_PREFIXES = [
  'fields',
  'record',
  'errors',
  'defaultValues',
  'touchedFields',
  'dirtyFields',
  'props',
] as const;

/**
 * JavaScript keywords to skip during field inference
 */
export const KEYWORDS = [
  'true',
  'false',
  'null',
  'undefined',
  'typeof',
  'instanceof',
  'new',
  'this',
  'if',
  'else',
  'return',
] as const;

/**
 * Known field state properties that should be accessed directly on the field state
 */
const FIELD_STATE_PROPERTIES = new Set([
  'value',
  'isTouched',
  'isDirty',
  'isValidating',
  'error',
  'invalid',
  'disabled',
]);

/**
 * Symbol to identify field state proxies for unwrapping in expressions
 */
export const FIELD_PROXY_MARKER = Symbol.for('formality.fieldProxy');

/**
 * Symbol to get the raw value from a field proxy
 */
export const FIELD_PROXY_VALUE = Symbol.for('formality.fieldProxyValue');

/**
 * Create a proxy for a field state that:
 * - Returns field state properties (isTouched, isDirty, etc.) when accessed
 * - Delegates unknown properties to value[prop] for object values
 * - Coerces to the value for primitive operations
 *
 * This allows both:
 * - `client` and `client.value` to return the same thing
 * - `client.isTouched` to return the touched state
 * - `client.id` to return value.id (for object values)
 */
export function createFieldStateProxy(fieldState: FieldState | { value: unknown }): unknown {
  // If value is null/undefined or primitive, we still need the proxy for metadata access
  const proxy = new Proxy(fieldState as object, {
    get(target: FieldState | { value: unknown }, prop: string | symbol) {
      // Marker to identify this as a field proxy
      if (prop === FIELD_PROXY_MARKER) {
        return true;
      }

      // Allow extracting raw value for expression evaluation
      if (prop === FIELD_PROXY_VALUE) {
        return target.value;
      }

      // Symbol.toPrimitive for type coercion (comparisons, string concat, etc.)
      if (prop === Symbol.toPrimitive) {
        return (_hint: string) => target.value;
      }

      // Known field state properties - return from field state
      if (typeof prop === 'string' && FIELD_STATE_PROPERTIES.has(prop)) {
        return (target as Record<string, unknown>)[prop];
      }

      // Unknown property - delegate to value
      const value = target.value;
      if (value !== null && value !== undefined && typeof value === 'object') {
        return (value as Record<string, unknown>)[prop as string];
      }

      return undefined;
    },
  });

  return proxy;
}

/**
 * Check if a value is a field state proxy
 */
export function isFieldProxy(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<symbol, unknown>)[FIELD_PROXY_MARKER] === true
  );
}

/**
 * Unwrap a field proxy to get its primitive value for boolean/comparison contexts
 */
export function unwrapFieldProxy(value: unknown): unknown {
  if (isFieldProxy(value)) {
    return (value as Record<symbol, unknown>)[FIELD_PROXY_VALUE];
  }
  return value;
}

/**
 * Build evaluation context for form-level expressions
 *
 * Implements Dual Context Mapping:
 * - Provides field values at BOTH qualified (fields.client.value) AND unqualified (client) levels
 * - Qualified paths take precedence on name collision
 *
 * @param fields - Map of field names to field states
 * @param record - Original record passed to form
 * @param errors - Map of field names to errors
 * @param defaultValues - Initial/default values for fields
 * @param touchedFields - Map of touched field names
 * @param dirtyFields - Map of dirty field names
 * @returns Evaluation context object
 */
export function buildFormContext(
  fields: Record<string, FieldState>,
  record?: Record<string, unknown>,
  errors?: Record<string, FieldError | undefined>,
  defaultValues?: Record<string, unknown>,
  touchedFields?: Record<string, boolean>,
  dirtyFields?: Record<string, boolean>
): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  // Add qualified paths first (these take precedence)
  context.fields = fields;
  context.record = record ?? {};
  context.errors = errors ?? {};
  context.defaultValues = defaultValues ?? {};
  context.touchedFields = touchedFields ?? {};
  context.dirtyFields = dirtyFields ?? {};

  // Add unqualified shortcuts as proxies
  // This allows:
  // - "client" to resolve to the value (via proxy unwrapping)
  // - "client.value" to also resolve to the value
  // - "client.isTouched" to resolve to field state metadata
  // - "client.id" to resolve to value.id (for object values)
  for (const [fieldName, fieldState] of Object.entries(fields)) {
    // Don't override qualified prefixes
    if (!(fieldName in context)) {
      context[fieldName] = createFieldStateProxy(fieldState);
    }
  }

  return context;
}

/**
 * Build evaluation context for field-level expressions
 *
 * Extends form context with field-specific props (including field name).
 * This enables expressions like "props.name" to resolve to the current field name.
 *
 * @param formState - Complete form state
 * @param fieldName - Current field name (added to props.name)
 * @param additionalProps - Additional props to merge
 * @returns Evaluation context object
 */
export function buildFieldContext(
  formState: FormState,
  fieldName: string,
  additionalProps?: Record<string, unknown>
): Record<string, unknown> {
  const context = buildFormContext(
    formState.fields,
    formState.record,
    formState.errors,
    formState.defaultValues,
    formState.touchedFields,
    formState.dirtyFields
  );

  // Add field-specific props
  context.props = {
    name: fieldName,
    ...additionalProps,
  };

  return context;
}

/**
 * Field state input for building evaluation context
 */
interface FieldStateForContext {
  value: unknown;
  isTouched?: boolean;
  isDirty?: boolean;
  isValidating?: boolean;
  error?: unknown;
  invalid?: boolean;
  disabled?: boolean;
}

/**
 * Build a minimal evaluation context from field values
 *
 * Used when you only have raw values (not full FieldState objects).
 * Useful for condition evaluation with watched values.
 *
 * @param fieldValues - Map of field names to their current values
 * @param record - Optional record for record.* access
 * @param props - Optional props for props.* access
 * @param fieldStates - Optional full field states with metadata (isTouched, isDirty, etc.)
 * @returns Evaluation context object
 */
export function buildEvaluationContext(
  fieldValues: Record<string, unknown>,
  record?: Record<string, unknown>,
  props?: Record<string, unknown>,
  fieldStates?: Record<string, FieldStateForContext>
): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  // Build fields object - use full field states if available, otherwise just values
  const fields: Record<string, FieldStateForContext> = {};
  for (const [name, value] of Object.entries(fieldValues)) {
    if (fieldStates && fieldStates[name]) {
      // Use full field state with metadata
      fields[name] = fieldStates[name];
    } else {
      // Fall back to minimal state with just value
      fields[name] = { value };
    }
  }

  // Add qualified paths
  context.fields = fields;
  context.record = record ?? {};
  context.props = props ?? {};

  // Add unqualified shortcuts as proxies
  // Proxies enable accessing both value and metadata (isTouched, isDirty, etc.)
  for (const [fieldName] of Object.entries(fieldValues)) {
    if (!(fieldName in context)) {
      context[fieldName] = createFieldStateProxy(fields[fieldName]);
    }
  }

  return context;
}
