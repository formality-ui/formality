// @formality/react - useFormState Hook
// Custom hook wrapping RHF's useFormState with proxy optimization

import { useMemo } from 'react';
import {
  useFormState as useRHFFormState,
  useWatch,
  useFormContext as useRHFFormContext,
} from 'react-hook-form';
import type { UseFormStateReturn, FieldValues, Path } from 'react-hook-form';
import { makeProxyState } from '../utils/makeProxyState';
import { useFormContext as useFormalityFormContext } from '../context/FormContext';
import type { CustomFieldState, ExtendedFormState } from '../types';

/**
 * Options for useFormState hook
 */
export interface UseFormStateOptions {
  /** Specific field name(s) to watch. If not provided, watches all configured fields. */
  name?: string | string[];
}

/**
 * Custom useFormState that wraps RHF's hook with proxy optimization
 *
 * This hook enhances React Hook Form's useFormState with:
 * - Proxy-wrapped field states to prevent unnecessary re-renders
 * - Record property access via lazy getter
 * - Integration with Formality's FormContext
 *
 * Performance Benefits:
 * - Only re-renders when accessed properties change
 * - Expression evaluation only creates dependencies on used properties
 * - Field states can update independently without cross-field re-renders
 *
 * @example
 * ```tsx
 * function MyField() {
 *   const formState = useFormState();
 *
 *   // Only re-renders when firstName.value changes
 *   const value = formState.fields.firstName?.value;
 *
 *   // Access original record for expressions
 *   const recordId = formState.record.id;
 * }
 * ```
 */
export function useFormState<TFieldValues extends FieldValues = FieldValues>(
  options?: UseFormStateOptions
): ExtendedFormState<TFieldValues> {
  // Get RHF context
  const rhfContext = useRHFFormContext<TFieldValues>();

  // Get Formality context (may not be available if used outside Form)
  let formalityContext: ReturnType<typeof useFormalityFormContext<TFieldValues>> | null = null;
  try {
    formalityContext = useFormalityFormContext<TFieldValues>();
  } catch {
    // Used outside Form - formalityContext stays null
  }

  // Get RHF form state
  const rhfFormState = useRHFFormState<TFieldValues>({
    control: rhfContext.control,
  });

  // Determine field names to track
  const fieldNames = useMemo(() => {
    if (options?.name) {
      return Array.isArray(options.name) ? options.name : [options.name];
    }
    if (formalityContext?.config) {
      return Object.keys(formalityContext.config);
    }
    return [];
  }, [options?.name, formalityContext?.config]);

  // Watch field values (skip if no fields)
  const watchedValues = useWatch({
    control: rhfContext.control,
    name: fieldNames.length > 0 ? (fieldNames as any) : undefined,
  });

  // Build proxy-wrapped field states
  const fields = useMemo(() => {
    const result: Record<string, CustomFieldState> = {};

    if (fieldNames.length === 0) {
      return result;
    }

    // Handle single field vs multiple fields
    const values = Array.isArray(watchedValues) ? watchedValues : [watchedValues];

    fieldNames.forEach((name, index) => {
      const fieldState = rhfContext.getFieldState(name as Path<TFieldValues>, rhfFormState);
      const value = (values as unknown[])[index];

      // Create proxy state for each field
      result[name] = makeProxyState({
        value,
        isTouched: fieldState.isTouched,
        isDirty: fieldState.isDirty,
        isValidating: false, // RHF doesn't expose per-field validating easily
        error: fieldState.error
          ? {
              type: fieldState.error.type,
              message: fieldState.error.message,
            }
          : undefined,
        invalid: fieldState.invalid,
      });
    });

    return result;
  }, [fieldNames, watchedValues, rhfFormState, rhfContext]);

  // Create result object with lazy record access
  const result = useMemo(() => {
    const base = {
      ...rhfFormState,
      fields,
    } as ExtendedFormState<TFieldValues>;

    // Add record property with lazy access
    Object.defineProperty(base, 'record', {
      get: () => formalityContext?.record ?? {},
      enumerable: true,
      configurable: true,
    });

    return base;
  }, [rhfFormState, fields, formalityContext?.record]);

  return result;
}
