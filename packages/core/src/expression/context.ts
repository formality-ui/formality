// @formality/core - Expression Context Building
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

  // Add unqualified shortcuts for field values
  // This allows "client" to resolve to fields.client.value
  for (const [fieldName, fieldState] of Object.entries(fields)) {
    // Don't override qualified prefixes
    if (!(fieldName in context)) {
      context[fieldName] = fieldState.value;
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
 * Build a minimal evaluation context from field values
 *
 * Used when you only have raw values (not full FieldState objects).
 * Useful for condition evaluation with watched values.
 *
 * @param fieldValues - Map of field names to their current values
 * @param record - Optional record for record.* access
 * @param props - Optional props for props.* access
 * @returns Evaluation context object
 */
export function buildEvaluationContext(
  fieldValues: Record<string, unknown>,
  record?: Record<string, unknown>,
  props?: Record<string, unknown>
): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  // Build minimal fields object from values
  const fields: Record<string, { value: unknown }> = {};
  for (const [name, value] of Object.entries(fieldValues)) {
    fields[name] = { value };
  }

  // Add qualified paths
  context.fields = fields;
  context.record = record ?? {};
  context.props = props ?? {};

  // Add unqualified shortcuts for field values
  for (const [fieldName, value] of Object.entries(fieldValues)) {
    if (!(fieldName in context)) {
      context[fieldName] = value;
    }
  }

  return context;
}
