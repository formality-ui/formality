// @formality/react - useConditions Hook
// Evaluates conditions against current field values

import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { evaluateConditions, type ConditionResult } from '@formality/core';
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
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields.length > 0 ? watchFields : (undefined as any),
  });

  // Build field values map from watched values
  const fieldValues = useMemo(() => {
    const values: Record<string, unknown> = {};

    if (watchFields.length === 0) {
      return values;
    }

    // useWatch returns a single value if one field, array if multiple
    if (watchFields.length === 1) {
      values[watchFields[0]] = watchedValues;
    } else if (Array.isArray(watchedValues)) {
      watchFields.forEach((field, i) => {
        values[field] = watchedValues[i];
      });
    }

    return values;
  }, [watchFields, watchedValues]);

  // Evaluate conditions whenever field values change
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
      record,
      props,
    });
  }, [conditions, fieldValues, record, props]);
}
