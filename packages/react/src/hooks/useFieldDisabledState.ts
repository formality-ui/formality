// @formality-ui/react - useFieldDisabledState Hook
// Resolves disabled state for a field from multiple sources

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import {
  evaluateConditions,
  type ConditionResult,
  type FieldStateInput,
} from "@formality-ui/core";
import type { ConditionDescriptor } from "@formality-ui/core";
import { useFormContext } from "../context/FormContext";
import { useInferredInputs } from "./useInferredInputs";

interface UseFieldDisabledStateOptions {
  /** Current field name */
  fieldName: string;

  /** Disabled prop from JSX (highest priority) */
  disabledProp?: boolean;

  /** Disabled from field config */
  fieldConfigDisabled?: boolean;

  /** Conditions to evaluate for disabled state */
  conditions?: ConditionDescriptor[];

  /** Group disabled state from parent FieldGroup */
  groupDisabled?: boolean;

  /** Explicit field subscriptions for conditions */
  subscribesTo?: string[];
}

/**
 * Resolves the disabled state for a field from multiple sources
 *
 * This hook implements the priority order for disabled state resolution:
 * 1. JSX prop (highest priority)
 * 2. Field config
 * 3. Condition evaluation
 * 4. Group state
 * 5. Default: false (field is enabled)
 *
 * Evaluates conditions using the same logic as useConditions but only
 * returns the disabled state as a boolean.
 *
 * @param options - Field configuration for disabled state resolution
 * @returns boolean - Whether the field should be disabled
 *
 * @example
 * ```tsx
 * const isDisabled = useFieldDisabledState({
 *   fieldName: 'email',
 *   disabledProp: props.disabled,
 *   fieldConfigDisabled: config.email?.disabled,
 *   conditions: config.email?.conditions,
 *   groupDisabled: groupContext.state.isDisabled,
 * });
 * ```
 */
export function useFieldDisabledState(
  options: UseFieldDisabledStateOptions,
): boolean {
  const {
    fieldName,
    disabledProp,
    fieldConfigDisabled,
    conditions = [],
    groupDisabled,
    subscribesTo,
  } = options;

  const { record, methods } = useFormContext();

  // ============================================
  // PRIORITY 1-2: Non-Conditional Source Resolution (prop and config only)
  // ============================================
  // JSX prop > field config
  // Note: We don't include group here because conditions need to be evaluated
  // before group state according to the priority order
  const baseDisabled = useMemo(() => {
    if (disabledProp !== undefined) return disabledProp;
    if (fieldConfigDisabled !== undefined) return fieldConfigDisabled;
    return undefined; // No explicit non-conditional source set
  }, [disabledProp, fieldConfigDisabled]);

  // ============================================
  // CONDITION EVALUATION
  // ============================================
  // Infer fields to watch from conditions
  const watchFields = useInferredInputs({
    conditions,
    subscribesTo,
  });

  // Watch inferred fields (ISOLATED subscriptions)
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
    // regardless of how many fields are watched.
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

  // Build field states WITHOUT disabled property
  // CRITICAL: Do NOT add disabled to fieldStates (creates circular dependency)
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
        isValidating: false,
        // ❌ NO disabled property - this breaks the circular dependency
      };
    });

    return states;
  }, [watchFields, fieldValues, methods]);

  // Evaluate conditions to extract disabled result
  const conditionResult = useMemo((): ConditionResult => {
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
      props: { name: fieldName },
    });
  }, [conditions, fieldValues, fieldStates, record, fieldName]);

  // ============================================
  // FINAL DISABLED RESOLUTION
  // ============================================
  // Priority order: prop > config > conditions > group > false
  return useMemo(() => {
    // 1. JSX prop or field config (highest non-conditional priority)
    if (baseDisabled !== undefined) {
      return baseDisabled;
    }

    // 2. Conditions
    if (conditionResult.hasDisabledCondition) {
      return conditionResult.disabled ?? false;
    }

    // 3. Group state
    if (groupDisabled) {
      return true;
    }

    // 4. Default: enabled
    return false;
  }, [baseDisabled, conditionResult, groupDisabled]);
}
