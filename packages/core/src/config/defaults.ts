// @formality/core - Default Value Resolution
// Pure functions for resolving initial/default values
// ZERO framework dependencies

import type { FieldConfig, InputConfig } from '../types';

/**
 * Resolve the initial value for a field
 *
 * Priority order (highest to lowest):
 * 1. defaultValues[fieldName] (from Form props)
 * 2. record[recordKey] (using recordKey if specified, else fieldName)
 * 3. inputConfig.defaultValue (from input type definition)
 *
 * @param fieldName - Field name
 * @param fieldConfig - Field configuration
 * @param inputConfig - Input type configuration
 * @param record - Record data passed to form
 * @param defaultValues - Default values passed to form
 * @returns Resolved initial value
 *
 * @example
 * // Field with recordKey mapping
 * resolveInitialValue(
 *   'client',
 *   { recordKey: 'selectedClient' },
 *   { defaultValue: null },
 *   { selectedClient: { id: 5 } },
 *   {}
 * )
 * // → { id: 5 }
 *
 * // Field with explicit defaultValue
 * resolveInitialValue(
 *   'status',
 *   {},
 *   { defaultValue: 'pending' },
 *   {},
 *   { status: 'active' }
 * )
 * // → 'active' (defaultValues takes precedence)
 */
export function resolveInitialValue(
  fieldName: string,
  fieldConfig?: FieldConfig,
  inputConfig?: InputConfig,
  record?: Record<string, unknown>,
  defaultValues?: Record<string, unknown>
): unknown {
  // Priority 1: Explicit default value for this field
  if (defaultValues && fieldName in defaultValues) {
    return defaultValues[fieldName];
  }

  // Priority 2: Record value (using recordKey if specified)
  const recordKey = fieldConfig?.recordKey ?? fieldName;
  if (record && recordKey in record) {
    return record[recordKey];
  }

  // Priority 3: Input type default value
  if (inputConfig?.defaultValue !== undefined) {
    return inputConfig.defaultValue;
  }

  // No default - return undefined
  return undefined;
}

/**
 * Resolve initial values for all fields in a configuration
 *
 * @param fieldConfigs - Map of field names to configurations
 * @param inputs - Map of input types to configurations
 * @param record - Record data passed to form
 * @param defaultValues - Default values passed to form
 * @returns Map of field names to initial values
 */
export function resolveAllInitialValues(
  fieldConfigs: Record<string, FieldConfig>,
  inputs: Record<string, InputConfig>,
  record?: Record<string, unknown>,
  defaultValues?: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, fieldConfig] of Object.entries(fieldConfigs)) {
    const type = fieldConfig.type ?? 'textField';
    const inputConfig = inputs[type];

    const value = resolveInitialValue(
      fieldName,
      fieldConfig,
      inputConfig,
      record,
      defaultValues
    );

    if (value !== undefined) {
      result[fieldName] = value;
    }
  }

  // Also include any explicit default values not in config
  if (defaultValues) {
    for (const [fieldName, value] of Object.entries(defaultValues)) {
      if (!(fieldName in result)) {
        result[fieldName] = value;
      }
    }
  }

  return result;
}

/**
 * Check if a value is considered "empty" for default value purposes
 *
 * @param value - Value to check
 * @returns true if value is empty
 */
export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (value === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
}

/**
 * Get the default value for an input type
 *
 * Falls back to common defaults based on type name if not specified.
 *
 * @param inputConfig - Input configuration
 * @param typeName - Input type name (for fallback logic)
 * @returns Default value
 */
export function getInputDefaultValue(
  inputConfig?: InputConfig,
  typeName?: string
): unknown {
  // Explicit default value
  if (inputConfig?.defaultValue !== undefined) {
    return inputConfig.defaultValue;
  }

  // Type-based defaults
  if (typeName) {
    switch (typeName) {
      case 'switch':
      case 'checkbox':
        return false;
      case 'number':
      case 'decimal':
      case 'integer':
        return 0;
      case 'select':
      case 'autocomplete':
        return null;
      case 'multiSelect':
      case 'checkboxGroup':
        return [];
      case 'textField':
      case 'text':
      case 'textarea':
      case 'email':
      case 'password':
      default:
        return '';
    }
  }

  return '';
}

/**
 * Merge record data with form default values
 *
 * Record values take precedence over defaults for non-empty values.
 *
 * @param record - Record data (may have partial data)
 * @param defaults - Default values
 * @returns Merged values
 */
export function mergeRecordWithDefaults(
  record?: Record<string, unknown>,
  defaults?: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Start with defaults
  if (defaults) {
    Object.assign(result, defaults);
  }

  // Override with record values (including empty values to preserve intentional nulls)
  if (record) {
    for (const [key, value] of Object.entries(record)) {
      // Only override if the key exists in record (preserves intentional nulls/empty)
      result[key] = value;
    }
  }

  return result;
}
