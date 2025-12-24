// @formality-ui/core - Error Message Resolution
// Pure functions for resolving validation error messages
// ZERO framework dependencies

import type { ValidationResult, ErrorMessagesConfig } from '../types';

/**
 * Resolve an error message from a validation result
 *
 * Handles all ValidationResult types:
 * - true/undefined → undefined (valid, no message)
 * - false → lookup 'invalid' in errorMessages or use default
 * - string → use string directly as message
 * - { type, message? } → use message or lookup type in errorMessages
 *
 * @param result - Validation result to resolve
 * @param errorMessages - Error message templates by type key
 * @returns Error message string or undefined if valid
 *
 * @example
 * resolveErrorMessage(false, {}) // → 'Invalid value'
 * resolveErrorMessage('Custom error', {}) // → 'Custom error'
 * resolveErrorMessage({ type: 'required' }, { required: 'This is required' }) // → 'This is required'
 */
export function resolveErrorMessage(
  result: ValidationResult,
  errorMessages?: ErrorMessagesConfig
): string | undefined {
  // Valid results - no error message
  if (result === true || result === undefined) {
    return undefined;
  }

  // String result - use directly as message
  if (typeof result === 'string') {
    return result;
  }

  // False result - generic invalid message
  if (result === false) {
    return errorMessages?.['invalid'] ?? 'Invalid value';
  }

  // Object result with type and optional message
  if (typeof result === 'object' && result !== null) {
    // Use provided message if available
    if (result.message) {
      return result.message;
    }

    // Lookup message by type
    if (result.type && errorMessages?.[result.type]) {
      return errorMessages[result.type];
    }

    // Fallback to type as message
    if (result.type) {
      return formatTypeAsMessage(result.type);
    }

    return 'Invalid value';
  }

  return 'Invalid value';
}

/**
 * Format a validation type key into a human-readable message
 *
 * @param type - Type key (e.g., 'required', 'minLength')
 * @returns Formatted message
 *
 * @example
 * formatTypeAsMessage('required') // → 'Required'
 * formatTypeAsMessage('minLength') // → 'Min length'
 * formatTypeAsMessage('maxLength') // → 'Max length'
 */
export function formatTypeAsMessage(type: string): string {
  // Convert camelCase/snake_case to words
  const words = type
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → camel Case
    .replace(/_/g, ' ') // snake_case → snake case
    .toLowerCase();

  // Capitalize first letter
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Create an error messages config with default messages
 *
 * @param overrides - Custom error messages to merge with defaults
 * @returns Complete error messages config
 */
export function createErrorMessages(
  overrides?: ErrorMessagesConfig
): ErrorMessagesConfig {
  const defaults: ErrorMessagesConfig = {
    required: 'This field is required',
    invalid: 'Invalid value',
    minLength: 'Too short',
    maxLength: 'Too long',
    pattern: 'Invalid format',
    min: 'Value is too small',
    max: 'Value is too large',
    email: 'Invalid email address',
    url: 'Invalid URL',
    number: 'Must be a number',
    integer: 'Must be a whole number',
    positive: 'Must be positive',
    negative: 'Must be negative',
    date: 'Invalid date',
    phone: 'Invalid phone number',
    unique: 'Must be unique',
    match: 'Fields do not match',
    validate: 'Validation failed',
  };

  return {
    ...defaults,
    ...overrides,
  };
}

/**
 * Extract error type from a validation result
 *
 * @param result - Validation result
 * @returns Error type string or undefined if valid
 */
export function getErrorType(result: ValidationResult): string | undefined {
  if (result === true || result === undefined) {
    return undefined;
  }

  if (result === false) {
    return 'invalid';
  }

  if (typeof result === 'string') {
    return 'validate';
  }

  if (typeof result === 'object' && result !== null) {
    return result.type || 'validate';
  }

  return 'validate';
}

/**
 * Create a validation error object
 *
 * @param type - Error type
 * @param message - Error message (optional, will be resolved from errorMessages)
 * @param errorMessages - Error messages config
 * @returns Error object with type and message
 */
export function createValidationError(
  type: string,
  message?: string,
  errorMessages?: ErrorMessagesConfig
): { type: string; message: string } {
  const resolvedMessage =
    message ??
    errorMessages?.[type] ??
    formatTypeAsMessage(type);

  return {
    type,
    message: resolvedMessage,
  };
}
