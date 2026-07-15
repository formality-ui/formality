// @formality-ui/core - Default Value Resolution
// Pure functions for resolving initial/default values
// ZERO framework dependencies

import type { FieldConfig, InputConfig } from "../types";

/**
 * Resolve a field-level override against its type-level default. Returns the
 * field value when it is not undefined (so null/false/0/"" are meaningful
 * overrides); otherwise the type value. This is the single precedence rule
 * shared by defaultValue, debounce, parser, formatter, getSubmitField, and
 * valueField (§6.4.0). Every adapter MUST call this helper at each
 * field-vs-type resolution site.
 *
 * @param fieldVal - The field-level (instance) value; `undefined` means "not specified".
 * @param typeVal  - The type-level (InputConfig) default; `undefined` means "not specified".
 * @returns `fieldVal` when it is not `undefined`, else `typeVal`.
 *
 * @example
 * // Field override wins (even when falsy):
 * resolveFieldOverType(false, true);   // → false
 * resolveFieldOverType(null, "x");     // → null
 * resolveFieldOverType(0, 100);        // → 0
 * resolveFieldOverType("", "fallback");// → ""
 *
 * // Field unset → type default:
 * resolveFieldOverType(undefined, "type"); // → "type"
 * resolveFieldOverType(undefined, undefined); // → undefined
 */
export function resolveFieldOverType<T>(
  fieldVal: T | undefined,
  typeVal: T | undefined,
): T | undefined {
  return fieldVal !== undefined ? fieldVal : typeVal;
}

/**
 * Resolve the initial value for a field
 *
 * Priority order (highest to lowest):
 * 1. defaultValues[fieldName] (from Form props)
 * 2. record[recordKey] (using recordKey if specified, else fieldName)
 * 3. fieldConfig.defaultValue (per-instance default; §6.4.1, §13.1)
 * 4. inputConfig.defaultValue (from input type definition)
 *
 * **PRD deviation note (accepted, gap_analysis G5).** PRD §1.3.2's table
 * summarizes this export as `resolveInitialValue(record, config, inputConfig)`.
 * The implemented signature is a richer superset —
 * `(fieldName, fieldConfig?, inputConfig?, record?, defaultValues?)` — because
 * it drives the full priority chain above (defaultValues → record[recordKey] →
 * fieldConfig.defaultValue → inputConfig.defaultValue) from a single call. This
 * is an internal API consumed by the framework adapters and by
 * {@link resolveAllInitialValues}, not a simplified end-user entry point; the
 * PRD literal form is a condensed representation. No code change is planned.
 *
 * @param fieldName - Field name
 * @param fieldConfig - Field configuration; `defaultValue` (when set) is the
 *   Priority-3 per-instance default (§6.4.1), honored for any value
 *   `!== undefined` (so null/false/0/"" are meaningful).
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
 *
 * // Field-level default wins over the type default (§6.4.1)
 * resolveInitialValue(
 *   'active',
 *   { type: 'switch', defaultValue: true }, // field default: true
 *   { defaultValue: false }, // type default: false
 *   undefined,
 *   undefined,
 * )
 * // → true (field-level default honored; null/false/0/"" would also win)
 */
export function resolveInitialValue(
  fieldName: string,
  fieldConfig?: FieldConfig,
  inputConfig?: InputConfig,
  record?: Record<string, unknown>,
  defaultValues?: Record<string, unknown>,
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

  // Priority 3+4: Field-level default overrides type-level (§6.4.1, §6.4.0)
  const resolvedDefault = resolveFieldOverType(
    fieldConfig?.defaultValue,
    inputConfig?.defaultValue,
  );
  if (resolvedDefault !== undefined) {
    return resolvedDefault;
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
  defaultValues?: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, fieldConfig] of Object.entries(fieldConfigs)) {
    const type = fieldConfig.type ?? "textField";
    const inputConfig = inputs[type];

    const value = resolveInitialValue(
      fieldName,
      fieldConfig,
      inputConfig,
      record,
      defaultValues,
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
  if (value === "") {
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
  typeName?: string,
): unknown {
  // Explicit default value
  if (inputConfig?.defaultValue !== undefined) {
    return inputConfig.defaultValue;
  }

  // Type-based defaults
  if (typeName) {
    switch (typeName) {
      case "switch":
      case "checkbox":
        return false;
      case "number":
      case "decimal":
      case "integer":
        return 0;
      case "select":
      case "autocomplete":
        return null;
      case "multiSelect":
      case "checkboxGroup":
        return [];
      case "textField":
      case "text":
      case "textarea":
      case "email":
      case "password":
      default:
        return "";
    }
  }

  return "";
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
  defaults?: Record<string, unknown>,
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
