// @formality/react - usePropsEvaluation Hook
// Evaluates selectProps against current field values

import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import {
  evaluateDescriptor,
  buildFieldContext,
  type FormState,
} from '@formality/core';
import type { SelectValue } from '@formality/core';
import { useFormContext } from '../context/FormContext';
import { useInferredInputs } from './useInferredInputs';
import { makeProxyState } from '../utils/makeProxyState';

interface UsePropsEvaluationOptions {
  /** Dynamic props descriptor to evaluate */
  selectProps?: SelectValue;

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Current field name */
  fieldName: string;
}

/**
 * Evaluates selectProps against current field values
 *
 * This hook:
 * 1. Infers which fields to watch from selectProps expressions
 * 2. Subscribes to those fields via useWatch
 * 3. Evaluates selectProps whenever watched values change
 *
 * Handles both expression-based selectProps and function-based selectProps.
 *
 * @param options - selectProps and subscription config
 * @returns Evaluated props object
 *
 * @example
 * ```tsx
 * const props = usePropsEvaluation({
 *   selectProps: {
 *     options: "client.id ? clientOptions : allOptions",
 *     disabled: "!signed",
 *   },
 *   fieldName: 'contact',
 * });
 * // props.options and props.disabled are evaluated against current state
 * ```
 */
export function usePropsEvaluation(
  options: UsePropsEvaluationOptions
): Record<string, unknown> {
  const { selectProps, subscribesTo, fieldName } = options;
  const { record, methods } = useFormContext();

  // Infer fields to watch from selectProps and explicit subscriptions
  const watchFields = useInferredInputs({
    selectProps,
    subscribesTo,
  });

  // Watch inferred fields (only subscribe if there are fields to watch)
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields.length > 0 ? (watchFields as any) : [],
  });

  // Build form state for evaluation (needed for function-based selectProps)
  // CRITICAL: Only build state for watched fields to maintain performance isolation
  const formState = useMemo((): FormState => {
    // Build proxy-wrapped field states ONLY for watched fields
    // This prevents subscribing to the entire form state
    const fields: Record<string, any> = {};

    if (watchFields.length > 0) {
      // Handle single vs multiple watched values
      const values = watchFields.length === 1
        ? { [watchFields[0]]: watchedValues }
        : watchFields.reduce((acc, field, i) => {
            acc[field] = (watchedValues as unknown[])[i];
            return acc;
          }, {} as Record<string, unknown>);

      watchFields.forEach((name) => {
        // Create minimal proxy state with just the value
        // We don't need isTouched/isDirty/error for selectProps evaluation
        fields[name] = makeProxyState({
          value: values[name],
          isTouched: false,
          isDirty: false,
          isValidating: false,
          error: undefined,
          invalid: false,
        });
      });
    }

    return {
      fields,
      record: record ?? {},
      errors: {},
      defaultValues: {},
      touchedFields: {},
      dirtyFields: {},
      isDirty: false,
      isTouched: false,
      isValid: true,
      isSubmitting: false,
    };
    // Only depends on watchFields and watchedValues - NOT the entire form state
  }, [watchFields, watchedValues, record]);

  // Evaluate selectProps
  return useMemo(() => {
    if (!selectProps) {
      return {};
    }

    // Handle function selectProps
    if (typeof selectProps === 'function') {
      const result = selectProps(formState, methods);
      return (result as Record<string, unknown>) ?? {};
    }

    // Build evaluation context
    const context = buildFieldContext(formState, fieldName);

    // Evaluate descriptor (string expression, object with expressions, or array)
    const result = evaluateDescriptor(selectProps, context);

    return (result as Record<string, unknown>) ?? {};
  }, [selectProps, formState, methods, fieldName]);
}
