// @formality/core - State Types
// This file defines form and field state interfaces

/**
 * FieldError - Error object for a field
 */
export interface FieldError {
  /** Error type identifier (e.g., 'required', 'pattern', 'validate') */
  type: string;

  /** Human-readable error message */
  message?: string;
}

/**
 * FieldState - Current state of a single field
 *
 * Used in expressions and condition evaluation.
 */
export interface FieldState {
  /** Current field value */
  value: unknown;

  /** Has the field been touched (focused then blurred) */
  isTouched: boolean;

  /** Has the value changed from default */
  isDirty: boolean;

  /** Is async validation currently running */
  isValidating: boolean;

  /** Current validation error (if any) */
  error?: FieldError;

  /** Inverse of valid state for convenience */
  invalid: boolean;

  /** Map of subscriber field names watching this field */
  watchers?: Record<string, boolean>;
}

/**
 * FormState - Complete form state
 *
 * Available in all expression evaluations and conditions.
 */
export interface FormState {
  /** Map of field names to their current states */
  fields: Record<string, FieldState>;

  /** Original record passed to Form (for expression access) */
  record?: Record<string, unknown>;

  /** Map of field names to their errors */
  errors: Record<string, FieldError | undefined>;

  /** Initial/default values for all fields */
  defaultValues: Record<string, unknown>;

  /** Map of touched field names */
  touchedFields: Record<string, boolean>;

  /** Map of dirty field names */
  dirtyFields: Record<string, boolean>;

  /** Has any field been modified */
  isDirty: boolean;

  /** Has any field been touched */
  isTouched: boolean;

  /** Are all fields valid */
  isValid: boolean;

  /** Is form submission in progress */
  isSubmitting: boolean;

  /**
   * Field-level props context for expression evaluation
   * Only available in field-level expressions (e.g., selectProps)
   */
  props?: {
    /** Current field name - allows expressions like "props.name" */
    name: string;
    /** Additional field-specific props */
    [key: string]: unknown;
  };
}
