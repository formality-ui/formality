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
  const { record, methods, config } = useFormContext();

  // Infer fields to watch from selectProps and explicit subscriptions
  const watchFields = useInferredInputs({
    selectProps,
    subscribesTo,
  });

  // Watch inferred fields (only subscribe if there are fields to watch)
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields.length > 0 ? watchFields : (undefined as any),
  });

  // Build form state for evaluation (needed for function-based selectProps)
  const formState = useMemo((): FormState => {
    const values = methods.getValues();
    const rhfState = methods.formState;

    // Build proxy-wrapped field states
    const fields: Record<string, any> = {};
    Object.keys(config).forEach((name) => {
      const fieldState = methods.getFieldState(name, rhfState);
      fields[name] = makeProxyState({
        value: values[name as keyof typeof values],
        isTouched: fieldState.isTouched,
        isDirty: fieldState.isDirty,
        isValidating: false,
        error: fieldState.error
          ? {
              type: fieldState.error.type,
              message: fieldState.error.message,
            }
          : undefined,
        invalid: fieldState.invalid,
      });
    });

    return {
      fields,
      record: record ?? {},
      errors: rhfState.errors as any,
      defaultValues: {},
      touchedFields: rhfState.touchedFields as any,
      dirtyFields: rhfState.dirtyFields as any,
      isDirty: rhfState.isDirty,
      isTouched: Object.keys(rhfState.touchedFields).length > 0,
      isValid: rhfState.isValid,
      isSubmitting: rhfState.isSubmitting,
    };
    // Include watchedValues in dependencies so we re-evaluate when watched fields change
  }, [methods, config, record, watchedValues]);

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
