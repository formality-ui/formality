// @formality/core - Validation Pipeline
// Pure functions for running validators against field values
// ZERO framework dependencies

import type {
  ValidationResult,
  ValidatorSpec,
  ValidatorFunction,
  ValidatorsConfig,
} from '../types';

/**
 * Run a single validator against a value
 *
 * Handles both sync and async validators uniformly.
 *
 * @param validator - The validator function to run
 * @param value - The value to validate
 * @param formValues - All form values for cross-field validation
 * @returns Validation result (may be a Promise for async validators)
 */
function runSingleValidator(
  validator: ValidatorFunction,
  value: unknown,
  formValues: Record<string, unknown>
): ValidationResult | Promise<ValidationResult> {
  try {
    return validator(value, formValues);
  } catch (error) {
    // If validator throws, treat as validation failure
    return {
      type: 'validation_error',
      message: error instanceof Error ? error.message : 'Validation error',
    };
  }
}

/**
 * Resolve a named validator from the validators config
 *
 * @param name - Validator name
 * @param validators - Named validators config
 * @returns The validator function or undefined if not found
 */
function resolveNamedValidator(
  name: string,
  validators: ValidatorsConfig
): ValidatorFunction | undefined {
  const validator = validators[name];

  if (typeof validator === 'function') {
    // Check if it's a factory (takes args and returns a function)
    // We detect this by checking if calling with no args returns a function
    // For simple validators, they return ValidationResult directly
    // This is a best-effort heuristic
    return validator as ValidatorFunction;
  }

  return undefined;
}

/**
 * Run a validator specification against a value
 *
 * Supports:
 * - string: Named validator lookup
 * - function: Inline validator
 * - array: Multiple validators in sequence (short-circuits on first failure)
 *
 * @param spec - Validator specification
 * @param value - Value to validate
 * @param formValues - All form values for cross-field validation
 * @param namedValidators - Named validators config from provider
 * @returns Validation result (may be a Promise)
 *
 * @example
 * // Named validator
 * runValidator('required', '', {}, validators)
 *
 * // Inline validator
 * runValidator((val) => val ? true : 'Required', '', {})
 *
 * // Multiple validators
 * runValidator(['required', 'email'], '', {}, validators)
 */
export async function runValidator(
  spec: ValidatorSpec,
  value: unknown,
  formValues: Record<string, unknown>,
  namedValidators?: ValidatorsConfig
): Promise<ValidationResult> {
  // Handle array of validators - run in sequence
  if (Array.isArray(spec)) {
    for (const item of spec) {
      const result = await runValidator(item, value, formValues, namedValidators);
      // Short-circuit on first failure
      if (!isValid(result)) {
        return result;
      }
    }
    return true; // All passed
  }

  // Handle string (named validator)
  if (typeof spec === 'string') {
    if (!namedValidators) {
      console.warn(`Named validator "${spec}" requested but no validators provided`);
      return true; // Pass if no validators configured
    }

    const validator = resolveNamedValidator(spec, namedValidators);
    if (!validator) {
      console.warn(`Validator "${spec}" not found in validators config`);
      return true; // Pass if validator not found
    }

    const result = runSingleValidator(validator, value, formValues);
    return Promise.resolve(result);
  }

  // Handle function (inline validator)
  if (typeof spec === 'function') {
    const result = runSingleValidator(spec, value, formValues);
    return Promise.resolve(result);
  }

  // Unknown spec type - pass
  return true;
}

/**
 * Run validator synchronously (for validators known to be sync)
 *
 * @param spec - Validator specification
 * @param value - Value to validate
 * @param formValues - All form values
 * @param namedValidators - Named validators config
 * @returns Validation result
 */
export function runValidatorSync(
  spec: ValidatorSpec,
  value: unknown,
  formValues: Record<string, unknown>,
  namedValidators?: ValidatorsConfig
): ValidationResult {
  // Handle array of validators
  if (Array.isArray(spec)) {
    for (const item of spec) {
      const result = runValidatorSync(item, value, formValues, namedValidators);
      if (!isValid(result)) {
        return result;
      }
    }
    return true;
  }

  // Handle string (named validator)
  if (typeof spec === 'string') {
    if (!namedValidators) {
      return true;
    }

    const validator = resolveNamedValidator(spec, namedValidators);
    if (!validator) {
      return true;
    }

    const result = validator(value, formValues);
    // If it returns a Promise, this will fail at runtime
    // Use runValidator for async support
    return result as ValidationResult;
  }

  // Handle function
  if (typeof spec === 'function') {
    const result = spec(value, formValues);
    return result as ValidationResult;
  }

  return true;
}

/**
 * Check if a validation result indicates success
 *
 * @param result - Validation result to check
 * @returns true if valid, false if invalid
 */
export function isValid(result: ValidationResult): boolean {
  if (result === true || result === undefined) {
    return true;
  }
  return false;
}

/**
 * Combine multiple validators into a single validator function
 *
 * @param validators - Array of validator specs to combine
 * @param namedValidators - Named validators config
 * @returns Combined validator function
 */
export function composeValidators(
  validators: ValidatorSpec[],
  namedValidators?: ValidatorsConfig
): ValidatorFunction {
  return async (value: unknown, formValues: Record<string, unknown>) => {
    for (const spec of validators) {
      const result = await runValidator(spec, value, formValues, namedValidators);
      if (!isValid(result)) {
        return result;
      }
    }
    return true;
  };
}

/**
 * Create a required validator
 *
 * @returns Validator function that checks for non-empty values
 */
export function required(): ValidatorFunction {
  return (value: unknown) => {
    if (value === undefined || value === null || value === '') {
      return { type: 'required', message: 'This field is required' };
    }
    if (Array.isArray(value) && value.length === 0) {
      return { type: 'required', message: 'This field is required' };
    }
    return true;
  };
}

/**
 * Create a minLength validator factory
 *
 * @param length - Minimum length
 * @returns Validator function
 */
export function minLength(length: number): ValidatorFunction {
  return (value: unknown) => {
    if (typeof value !== 'string') {
      return true; // Skip non-strings
    }
    if (value.length < length) {
      return {
        type: 'minLength',
        message: `Must be at least ${length} characters`,
      };
    }
    return true;
  };
}

/**
 * Create a maxLength validator factory
 *
 * @param length - Maximum length
 * @returns Validator function
 */
export function maxLength(length: number): ValidatorFunction {
  return (value: unknown) => {
    if (typeof value !== 'string') {
      return true;
    }
    if (value.length > length) {
      return {
        type: 'maxLength',
        message: `Must be at most ${length} characters`,
      };
    }
    return true;
  };
}

/**
 * Create a pattern validator factory
 *
 * @param pattern - RegExp pattern to match
 * @param message - Custom error message
 * @returns Validator function
 */
export function pattern(pattern: RegExp, message?: string): ValidatorFunction {
  return (value: unknown) => {
    if (typeof value !== 'string') {
      return true;
    }
    if (!pattern.test(value)) {
      return {
        type: 'pattern',
        message: message ?? 'Invalid format',
      };
    }
    return true;
  };
}
