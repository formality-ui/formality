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
  formValues: Record<string, unknown>
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
 * Example: minLength(5) returns a ValidatorFunction
 */
export type ValidatorFactory<TArgs = unknown> = (
  args: TArgs
) => ValidatorFunction;

/**
 * ValidatorsConfig - Named validators configuration
 *
 * Values can be direct validators or validator factories
 */
export interface ValidatorsConfig {
  [name: string]: ValidatorFunction | ValidatorFactory;
}

/**
 * ErrorMessagesConfig - Error message templates by type key
 *
 * Used to resolve error messages from validation result types
 */
export interface ErrorMessagesConfig {
  [type: string]: string;
}
