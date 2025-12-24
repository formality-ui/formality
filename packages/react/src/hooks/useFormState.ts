// @formality-ui/react - useFormState Hook
// Custom hook wrapping RHF's useWatch with proxy optimization
// CRITICAL: This hook is designed for ISOLATED field subscriptions

import { useMemo } from 'react';
import {
  useWatch,
  useFormContext as useRHFFormContext,
} from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { makeProxyState } from '../utils/makeProxyState';
import { useFormContext as useFormalityFormContext } from '../context/FormContext';
import type { CustomFieldState, IsolatedFormState } from '../types';

/**
 * Options for useFormState hook
 */
export interface UseFormStateOptions {
  /**
   * Specific field name(s) to watch.
   * REQUIRED for performance - you must specify which fields you need.
   * Watching all fields defeats the purpose of isolation.
   */
  name: string | string[];
}

/**
 * Custom useFormState that provides ISOLATED field subscriptions
 *
 * CRITICAL PERFORMANCE REQUIREMENT:
 * You MUST specify which fields to watch via the `name` option.
 * This hook is designed to prevent the "subscribe to everything" anti-pattern.
 *
 * This hook provides:
 * - Proxy-wrapped field states to prevent unnecessary re-renders
 * - Record property access via lazy getter
 * - Integration with Formality's FormContext
 *
 * Performance Benefits:
 * - Only re-renders when specified fields change
 * - Expression evaluation only creates dependencies on used properties
 * - Field states can update independently without cross-field re-renders
 *
 * @example
 * ```tsx
 * function MyField() {
 *   // Watch specific fields only
 *   const formState = useFormState({ name: ['firstName', 'lastName'] });
 *
 *   // Only re-renders when firstName or lastName change
 *   const value = formState.fields.firstName?.value;
 *
 *   // Access original record for expressions
 *   const recordId = formState.record.id;
 * }
 * ```
 */
export function useFormState<TFieldValues extends FieldValues = FieldValues>(
  options: UseFormStateOptions
): IsolatedFormState {
  // Get RHF context
  const rhfContext = useRHFFormContext<TFieldValues>();

  // Get Formality context (may not be available if used outside Form)
  let formalityContext: ReturnType<typeof useFormalityFormContext<TFieldValues>> | null = null;
  try {
    formalityContext = useFormalityFormContext<TFieldValues>();
  } catch {
    // Used outside Form - formalityContext stays null
  }

  // Determine field names to track - MUST be explicitly specified
  const fieldNames = useMemo(() => {
    return Array.isArray(options.name) ? options.name : [options.name];
  }, [options.name]);

  // Watch ONLY specified field values via useWatch (isolated subscription)
  const watchedValues = useWatch({
    control: rhfContext.control,
    name: fieldNames as any,
  });

  // Build proxy-wrapped field states for watched fields ONLY
  // CRITICAL: We do NOT call getFieldState which would subscribe to form state
  const fields = useMemo(() => {
    const result: Record<string, CustomFieldState> = {};

    if (fieldNames.length === 0) {
      return result;
    }

    // Handle single field vs multiple fields
    const values = fieldNames.length === 1
      ? [watchedValues]
      : (watchedValues as unknown[]);

    fieldNames.forEach((name, index) => {
      const value = values[index];

      // Create minimal proxy state with just the value
      // We intentionally do NOT access isTouched/isDirty/error from rhfFormState
      // as that would create subscriptions to the entire form state
      result[name] = makeProxyState({
        value,
        isTouched: false,
        isDirty: false,
        isValidating: false,
        error: undefined,
        invalid: false,
      });
    });

    return result;
  }, [fieldNames, watchedValues]);

  // Create result object with lazy record access
  const result = useMemo((): IsolatedFormState => {
    const base: IsolatedFormState = {
      fields,
      record: {}, // Will be overwritten by defineProperty
      // Provide minimal form-level state that doesn't require subscriptions
      isDirty: false,
      isTouched: false,
      isValid: true,
      isSubmitting: false,
      errors: {},
      touchedFields: {},
      dirtyFields: {},
      defaultValues: {},
    };

    // Add record property with lazy access
    Object.defineProperty(base, 'record', {
      get: () => formalityContext?.record ?? {},
      enumerable: true,
      configurable: true,
    });

    return base;
  }, [fields, formalityContext?.record]);

  return result;
}
