// @formality-ui/core - Configuration Types
// This file defines all configuration interfaces for the Formality framework

import type { ConditionDescriptor } from "./conditions";
import type {
  ValidatorSpec,
  ValidatorsConfig,
  ErrorMessagesConfig,
} from "./validation";
import type { FormState } from "./state";

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
  methods: unknown,
) => TReturn;

/**
 * InputConfig - Configuration for an input component type
 *
 * This defines how a particular input type (e.g., textField, switch, autocomplete)
 * behaves across all forms.
 *
 * Framework agnosticism: `component` and `template` are intentionally `unknown`
 * here (core cannot import a UI framework). React consumers should use the
 * `ReactInputConfig<TValue>` overlay exported from `@formality-ui/react`, which
 * narrows both to `ComponentType<...>`.
 *
 * `TValue` (default `unknown`) links `defaultValue`, `parser`, and `formatter`
 * to a single value type. It defaults to `unknown` because the framework-agnostic
 * core cannot know the value type of every UI component; React consumers can
 * parameterize it via `ReactInputConfig<TValue>` (e.g.
 * `ReactInputConfig<string>` for a text field). Today only the overlay exposes
 * this parameterization; end-to-end per-input value inference is a future
 * enhancement.
 *
 * @template TValue - The form value type this input produces/consumes.
 */
export interface InputConfig<TValue = unknown> {
  /** The component to render (typed `unknown` for framework agnosticism; React consumers see `ComponentType<any>` via `ReactInputConfig`) */
  component: unknown;

  /** Default value for this input type (e.g., '' for text, false for switch) */
  defaultValue: TValue;

  /**
   * Auto-save debounce for fields of this input type.
   *
   * - `false` — submit immediately on change (no debounce timer). Use for
   *   toggles/switches/selects where every change is a discrete commit.
   * - `number` — delay auto-save by this many milliseconds after the last
   *   change to a field of this type. Fields that share the same numeric
   *   debounce coalesce into a single timer; fields with different numeric
   *   debounces fire on their own cadence. When unset, the field falls back
   *   to the Form-level `debounce` prop (default 1000ms).
   *
   * This governs *auto-save timing only*. The field value is still committed
   * to the form state on every change (it does not throttle re-renders).
   */
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

  /** Template component wrapper for consistent styling (typed `unknown` for framework agnosticism; React consumers see `ComponentType<InputTemplateProps>` via `ReactInputConfig`) */
  template?: unknown;

  /** Default props for this input type */
  props?: Record<string, unknown>;
}

/**
 * FieldConfig - Configuration for a specific field instance
 *
 * This defines field-level behavior including conditions, validation,
 * and dynamic props.
 *
 * Framework agnosticism: `rules` is intentionally `Record<string, unknown>` here
 * (core cannot import react-hook-form). React consumers should use the
 * `ReactFieldConfig` overlay exported from `@formality-ui/react`, which narrows
 * `rules` to react-hook-form's `RegisterOptions` for full autocomplete and
 * checking (required, min, max, pattern, validate, valueAsNumber, …).
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

  /** Register options forwarded to the framework's field register call (typed loose for framework agnosticism; React consumers see react-hook-form's `RegisterOptions` via `ReactFieldConfig`) */
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
 *
 * Generic over the field-name union so a typed `<Form<TFieldValues>>` can reject
 * unknown config keys. Defaults to `string`, which is identical to the previous
 * non-generic `Record<string, FieldConfig>` (backwards compatible).
 */
export type FormFieldsConfig<TName extends string = string> = Record<
  TName,
  FieldConfig
>;

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
    | ((
        allInputs: Record<string, InputConfig>,
      ) => Record<string, Partial<InputConfig>>);

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
 *
 * Framework agnosticism: `defaultInputTemplate` and `inputTemplates` are
 * intentionally `unknown` here (core cannot import a UI framework). React's
 * `FormalityProviderProps` and `ConfigContextValue` overlay
 * `ComponentType<InputTemplateProps>` on top of these loose fields.
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
 *
 * Framework agnosticism: `Field` is intentionally `unknown` here. React overlays
 * this same-named type in `@formality-ui/react` with `Field: ComponentType<any>`
 * and RHF-typed `fieldState`/`formState`; React consumers import that overlay.
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
