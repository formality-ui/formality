// @formality-ui/core - Validation Types
// This file defines validation-related types

/**
 * ValidationResult - Result from a validator function
 *
 * true | undefined = valid
 * false = invalid (use generic/default message)
 * string = invalid with custom message
 * { type, message? } = invalid with type key for error message lookup
 */
export type ValidationResult =
  | true // Valid
  | false // Invalid (generic message)
  | string // Invalid with message
  | undefined // Valid
  | { type: string; message?: string }; // Invalid with type

/**
 * ValidatorFunction - Inline validator signature
 *
 * @param value - The field value to validate
 * @param formValues - All form values for cross-field validation
 * @returns Validation result (sync or async)
 */
export type ValidatorFunction = (
  value: unknown,
  formValues: Record<string, unknown>,
) => ValidationResult | Promise<ValidationResult>;

/**
 * ValidatorSpec - Validator specification
 *
 * Can be:
 * - string: Named validator lookup from provider
 * - function: Inline validator
 * - array: Multiple validators run in sequence
 */
export type ValidatorSpec =
  | string // Named validator
  | ValidatorFunction // Inline function
  | Array<string | ValidatorFunction>; // Multiple validators

/**
 * ValidatorFactory - Factory function for parameterized validators
 *
 * Accepts any number of factory arguments and returns a {@link ValidatorFunction}.
 * The `...args: any[]` rest signature is intentional: it lets concrete factories
 * with specific parameter types (e.g. `(min: number) => ValidatorFunction`,
 * `(regex: RegExp, message: string) => ValidatorFunction`) be assignable to this
 * type without parameter-invariance errors, while still producing a fully typed
 * `ValidatorFunction` return.
 *
 * @example
 * const min: ValidatorFactory = (minVal: number) => (value) =>
 *   Number(value) < minVal ? { type: 'min' } : true;
 */
export type ValidatorFactory = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- variadic factory args: `any[]` is required so concrete factories with specific param types (e.g. `(min: number)`) remain assignable without parameter-invariance errors.
  ...args: any[]
) => ValidatorFunction;

/**
 * ValidatorEntry - A named validator or a validator factory.
 *
 * Either a direct {@link ValidatorFunction} (called with `value` + `formValues`)
 * or a {@link ValidatorFactory} (called with factory args to produce a
 * `ValidatorFunction`).
 */
export type ValidatorEntry = ValidatorFunction | ValidatorFactory;

/**
 * ValidatorsConfig - Named validators configuration
 *
 * Values can be direct {@link ValidatorFunction}s or {@link ValidatorFactory}s.
 */
export interface ValidatorsConfig {
  [name: string]: ValidatorEntry;
}

/**
 * ErrorMessagesConfig - Error message templates by type key
 *
 * Used to resolve error messages from validation result types
 */
export interface ErrorMessagesConfig {
  [type: string]: string;
}
