// @formality/core - Configuration Types
// This file defines all configuration interfaces for the Formality framework

import type { ConditionDescriptor } from './conditions';
import type { ValidatorSpec, ValidatorsConfig, ErrorMessagesConfig } from './validation';
import type { FormState } from './state';

/**
 * SelectValue - The core polymorphic type for all select* properties
 *
 * CRITICAL: When using functions, automatic field inference is NOT possible.
 * You MUST provide explicit `subscribesTo` to declare dependencies.
 */
export type SelectValue<TReturn = unknown> =
  | string // Expression: "client.id"
  | SelectFunction<TReturn> // Function callback
  | { [key: string]: SelectValue } // Nested object
  | SelectValue[]; // Array of values

/**
 * SelectFunction - Callback signature for function-based select values
 *
 * @param formState - Current form state with fields, record, errors, etc.
 * @param methods - Form methods (framework-specific, typed as unknown for core)
 * @returns The computed value
 *
 * IMPORTANT: When using SelectFunction, you MUST specify subscribesTo
 * because automatic dependency inference cannot analyze function bodies.
 */
export type SelectFunction<TReturn = unknown> = (
  formState: FormState,
  methods: unknown
) => TReturn;

/**
 * InputConfig - Configuration for an input component type
 *
 * This defines how a particular input type (e.g., textField, switch, autocomplete)
 * behaves across all forms.
 */
export interface InputConfig<TValue = unknown> {
  /** The React component to render */
  component: unknown; // ComponentType - typed as unknown for framework agnosticism

  /** Default value for this input type (e.g., '' for text, false for switch) */
  defaultValue: TValue;

  /** Debounce milliseconds for validation/auto-save. false = immediate, number = delay */
  debounce?: number | false;

  /** Prop name for passing value to component (default: 'value') */
  inputFieldProp?: string;

  /** For complex values (objects), which property contains the actual value */
  valueField?: string;

  /** Transform field name for submission (e.g., 'client' → 'clientId') */
  getSubmitField?: (fieldName: string) => string;

  /** Transform user input to form value. String = named parser, function = inline */
  parser?: string | ((value: unknown) => TValue);

  /** Transform form value to display value. String = named formatter, function = inline */
  formatter?: string | ((value: TValue) => unknown);

  /** Type-level validation (runs after field-level validator) */
  validator?: ValidatorSpec;

  /** Template component wrapper for consistent styling */
  template?: unknown; // ComponentType

  /** Default props for this input type */
  props?: Record<string, unknown>;
}

/**
 * FieldConfig - Configuration for a specific field instance
 *
 * This defines field-level behavior including conditions, validation,
 * and dynamic props.
 */
export interface FieldConfig {
  /** Input type key (resolves to InputConfig) */
  type?: string;

  /** Human-readable label (static) */
  label?: string;

  /** Alias for label (legacy support) */
  title?: string;

  /** Static disabled state (can be overridden by conditions) */
  disabled?: boolean;

  /** Static hidden state (can be overridden by conditions) */
  hidden?: boolean;

  /** Display order for config-driven rendering (lower = earlier) */
  order?: number;

  /** Key to use when reading initial value from record (defaults to field name) */
  recordKey?: string;

  /** React Hook Form RegisterOptions (required, min, max, pattern, etc.) */
  rules?: Record<string, unknown>;

  /** Field-level validation (runs before type-level validator) */
  validator?: ValidatorSpec;

  /** Static props merged before selectProps */
  props?: Record<string, unknown>;

  /** Dynamic props evaluated against form state */
  selectProps?: SelectValue<Record<string, unknown>>;

  /** Condition descriptors for disabled/visible/setValue behaviors */
  conditions?: ConditionDescriptor[];

  /** Explicit field subscriptions (REQUIRED when using functions in selectProps) */
  subscribesTo?: string[];

  /** Pass field state to component (value, error, touched, etc.) */
  provideState?: boolean;

  /** Pass subscribed field states to component */
  passSubscriptions?: boolean;

  /** Prop name for subscribed states (default: 'state') */
  passSubscriptionsAs?: string;
}

/**
 * FormFieldsConfig - Map of field names to their configurations
 */
export type FormFieldsConfig = Record<string, FieldConfig>;

/**
 * GroupConfig - Configuration for a FieldGroup
 */
export interface GroupConfig {
  /** Conditions for group-level disabled/visible state */
  conditions?: ConditionDescriptor[];

  /** Explicit subscriptions for function-based conditions */
  subscribesTo?: string[];
}

/**
 * FormConfig - Form-level configuration
 *
 * Overrides provider settings and applies to all fields in the form.
 */
export interface FormConfig {
  /**
   * Input type overrides - can be object OR function
   * Function form allows dynamic modification based on all available inputs
   */
  inputs?:
    | Record<string, Partial<InputConfig>>
    | ((allInputs: Record<string, InputConfig>) => Record<string, Partial<InputConfig>>);

  /** Named field groups with their conditions */
  groups?: Record<string, GroupConfig>;

  /** Static default props for all fields in this form */
  defaultFieldProps?: Record<string, unknown>;

  /** Dynamic default props evaluated per-field */
  selectDefaultFieldProps?: SelectValue;

  /** Static form title */
  title?: string;

  /** Dynamic form title evaluated against form state */
  selectTitle?: SelectValue<string>;
}

/**
 * FormalityProviderConfig - Global provider configuration
 *
 * Sets up input types, transformers, validators, and global defaults.
 */
export interface FormalityProviderConfig {
  /** Input type definitions */
  inputs: Record<string, InputConfig>;

  /** Named formatters for value → display transformation */
  formatters?: Record<string, (value: unknown) => unknown>;

  /** Named parsers for input → value transformation */
  parsers?: Record<string, (value: unknown) => unknown>;

  /** Named validators and validator factories */
  validators?: ValidatorsConfig;

  /** Error message templates by type key */
  errorMessages?: ErrorMessagesConfig;

  /** Default template for all inputs */
  defaultInputTemplate?: unknown; // ComponentType

  /** Named templates for specific input types */
  inputTemplates?: Record<string, unknown>; // Record<string, ComponentType>

  /** Default prop name for passSubscriptions (default: 'state') */
  defaultSubscriptionPropName?: string;

  /** Static default props for all fields */
  defaultFieldProps?: Record<string, unknown>;

  /** Dynamic default props evaluated per-field */
  selectDefaultFieldProps?: SelectValue;
}

/**
 * InputTemplateProps - Props passed to input template components
 */
export interface InputTemplateProps {
  /** The input component to render */
  Field: unknown; // ComponentType

  /** Merged props to pass to the component */
  fieldProps: Record<string, unknown>;

  /** Current field state */
  fieldState: Record<string, unknown>;

  /** Current form state */
  formState: FormState;
}
