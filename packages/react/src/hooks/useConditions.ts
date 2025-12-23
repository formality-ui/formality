// @formality/react - useConditions Hook
// Evaluates conditions against current field values

import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { evaluateConditions, type ConditionResult, type FieldStateInput } from '@formality/core';
import type { ConditionDescriptor } from '@formality/core';
import { useFormContext } from '../context/FormContext';
import { useInferredInputs } from './useInferredInputs';

interface UseConditionsOptions {
  /** Conditions to evaluate */
  conditions: ConditionDescriptor[];

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Additional props for expression context */
  props?: Record<string, unknown>;
}

/**
 * Evaluates conditions against current field values
 *
 * This hook:
 * 1. Infers which fields to watch from conditions
 * 2. Subscribes to those fields via useWatch
 * 3. Evaluates conditions whenever watched values change
 *
 * Implements the condition evaluation rules:
 * - disabled: OR logic (any true = disabled)
 * - visible: AND logic (any false = hidden)
 * - setValue: last matching condition wins
 *
 * @param options - Conditions and subscription config
 * @returns Evaluation result with disabled, visible, and setValue states
 *
 * @example
 * ```tsx
 * const result = useConditions({
 *   conditions: [
 *     { when: 'signed', is: false, disabled: true },
 *     { when: 'archived', truthy: true, visible: false },
 *   ],
 * });
 * // result.disabled === true when signed is false
 * // result.visible === false when archived is truthy
 * ```
 */
export function useConditions(options: UseConditionsOptions): ConditionResult {
  const { conditions, subscribesTo, props } = options;
  const { record, methods } = useFormContext();

  // Infer fields to watch from conditions and explicit subscriptions
  const watchFields = useInferredInputs({
    conditions,
    subscribesTo,
  });

  // Watch inferred fields (only subscribe if there are fields to watch)
  // CRITICAL: useWatch provides ISOLATED subscriptions - only re-renders when these specific values change
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields.length > 0 ? (watchFields as any) : [],
  });

  // Build field values map from watched values
  const fieldValues = useMemo(() => {
    const values: Record<string, unknown> = {};

    if (watchFields.length === 0) {
      return values;
    }

    // CRITICAL: useWatch with an array of names ALWAYS returns an array of values,
    // regardless of how many fields are watched. Only useWatch({ name: 'string' })
    // returns a single value.
    if (Array.isArray(watchedValues)) {
      watchFields.forEach((field, i) => {
        values[field] = watchedValues[i];
      });
    } else {
      // Fallback: single field, single value (shouldn't happen with array name)
      values[watchFields[0]] = watchedValues;
    }

    return values;
  }, [watchFields, watchedValues]);

  // Build full field states with metadata
  // CRITICAL: Use getFieldState() for NON-REACTIVE access to field metadata
  // This prevents subscribing to the entire form state which causes all fields to re-validate
  // Field states are read on-demand when values change, not when ANY field's metadata changes
  const fieldStates = useMemo(() => {
    const states: Record<string, FieldStateInput> = {};

    if (watchFields.length === 0) {
      return states;
    }

    watchFields.forEach((fieldName) => {
      // getFieldState() reads current state without creating subscriptions
      const fieldState = methods.getFieldState(fieldName as any);
      states[fieldName] = {
        value: fieldValues[fieldName],
        isTouched: fieldState.isTouched,
        isDirty: fieldState.isDirty,
        error: fieldState.error,
        invalid: fieldState.invalid,
        isValidating: false, // Not easily available per-field
      };
    });

    return states;
  }, [watchFields, fieldValues, methods]);

  // Evaluate conditions whenever field values or states change
  return useMemo(() => {
    // Return empty result if no conditions
    if (conditions.length === 0) {
      return {
        disabled: undefined,
        visible: undefined,
        setValue: undefined,
        hasDisabledCondition: false,
        hasVisibleCondition: false,
        hasSetCondition: false,
      };
    }

    return evaluateConditions({
      conditions,
      fieldValues,
      fieldStates,
      record,
      props,
    });
  }, [conditions, fieldValues, fieldStates, record, props]);
}
