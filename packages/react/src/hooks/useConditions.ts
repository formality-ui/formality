// @formality-ui/react - useConditions Hook
// Evaluates conditions against current field values

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

interface UseConditionsOptions {
  /** Conditions to evaluate */
  conditions: ConditionDescriptor[];

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Additional props for expression context */
  props?: Record<string, unknown>;

  /** Optional: All field configs for computing disabled states in fieldStates */
  /** Maps field name to its conditions array */
  allFieldsConfig?: Record<string, { conditions?: ConditionDescriptor[] }>;
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
 * Uses two-pass evaluation to populate the disabled property in field states:
 * - Pass 1: Build base field states without disabled (prevents circular dependency)
 * - Pass 2: Compute disabled for each field using Pass 1 states
 * - Pass 3: Merge base states with disabled into final field states
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
  const { conditions, subscribesTo, props, allFieldsConfig } = options;
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

  // ============================================================================
  // PASS 1: Build base field states WITHOUT disabled property
  // ============================================================================
  // CRITICAL: Use getFieldState() for NON-REACTIVE access to field metadata
  // This prevents subscribing to the entire form state which causes all fields to re-validate
  // Field states are read on-demand when values change, not when ANY field's metadata changes
  //
  // NOTE: This is Pass 1 of two-pass evaluation - disabled is NOT included here
  // to break the circular dependency between conditions and disabled state.
  const baseFieldStates = useMemo(() => {
    const states: Record<string, FieldStateInput> = {};

    // Collect all fields to build states for: watched fields + current field
    // Current field is needed for two-pass evaluation when it references other fields' disabled states
    const currentFieldName = props?.name as string | undefined;
    const allFieldsForPass1 = currentFieldName
      ? [...new Set([...watchFields, currentFieldName])]
      : watchFields;

    if (allFieldsForPass1.length === 0) {
      return states;
    }

    allFieldsForPass1.forEach((fieldName) => {
      // getFieldState() reads current state without creating subscriptions
      const fieldState = methods.getFieldState(fieldName as any);
      states[fieldName] = {
        value: fieldValues[fieldName],
        isTouched: fieldState.isTouched,
        isDirty: fieldState.isDirty,
        error: fieldState.error,
        invalid: fieldState.invalid,
        isValidating: false, // Not easily available per-field
        // ❌ NO disabled property - this is critical for Pass 1 to prevent circular dependency
      };
    });

    return states;
  }, [watchFields, fieldValues, methods, props]);

  // ============================================================================
  // PASS 2: Compute disabled states for each field
  // ============================================================================
  // Uses baseFieldStates (without disabled) to evaluate conditions
  // This prevents the circular dependency: conditions → disabled → conditions
  //
  // For circular dependencies (e.g., fieldA.isDisabled depends on fieldB.isDisabled),
  // we use iterative evaluation to converge to a stable state:
  // - Start with baseFieldStates (disabled = undefined for all)
  // - Iteratively compute disabled states until stable or max iterations reached
  const disabledStates = useMemo(() => {
    const disabled: Record<string, boolean> = {};

    // Collect all fields that need disabled state computation:
    // 1. Watched fields (fields referenced in conditions)
    // 2. Current field (so it can compute its own disabled from conditions)
    // 3. All fields in allFieldsConfig (to ensure we have states for all referenced fields)
    const currentFieldName = props?.name as string | undefined;
    const configFields = allFieldsConfig ? Object.keys(allFieldsConfig) : [];
    const allFieldsForPass2 = [...new Set([...watchFields, ...configFields])];
    if (currentFieldName && !allFieldsForPass2.includes(currentFieldName)) {
      allFieldsForPass2.push(currentFieldName);
    }

    if (allFieldsForPass2.length === 0) {
      return disabled;
    }

    // Build base states for ALL fields (not just watched fields)
    // This ensures we have states for fields that don't have baseFieldStates yet
    const allBaseStates: Record<string, FieldStateInput> = {};
    for (const fieldName of allFieldsForPass2) {
      if (baseFieldStates[fieldName]) {
        allBaseStates[fieldName] = baseFieldStates[fieldName];
      } else {
        // Field not in baseFieldStates, create default state
        const fieldState = methods.getFieldState(fieldName as any);
        allBaseStates[fieldName] = {
          value: fieldValues[fieldName],
          isTouched: fieldState.isTouched,
          isDirty: fieldState.isDirty,
          error: fieldState.error,
          invalid: fieldState.invalid,
          isValidating: false,
        };
      }
    }

    // Initial pass: compute disabled using allBaseStates (no disabled property)
    let currentStates = allBaseStates;
    let hasChanged = true;
    let iteration = 0;
    const maxIterations = 10; // Prevent infinite loops, should converge quickly

    while (hasChanged && iteration < maxIterations) {
      hasChanged = false;
      iteration++;

      // Compute disabled for all fields using current states
      const newDisabled: Record<string, boolean> = {};

      for (const fieldName of allFieldsForPass2) {
        const fieldConfig = allFieldsConfig?.[fieldName];
        const fieldConditions = fieldConfig?.conditions ?? [];
        const configDisabled = fieldConfig?.disabled;

        const result = evaluateConditions({
          conditions: fieldConditions,
          fieldValues,
          fieldStates: currentStates,
          record,
          props: { name: fieldName },
        });

        // Priority: config > conditions
        // Config-level disabled takes precedence over condition-based disabled
        newDisabled[fieldName] = configDisabled ?? (result.disabled ?? false);
      }

      // Create new states with updated disabled
      const newStates: Record<string, FieldStateInput> = {};
      for (const fieldName of allFieldsForPass2) {
        const baseState = allBaseStates[fieldName];
        if (baseState) {
          newStates[fieldName] = {
            ...baseState,
            disabled: newDisabled[fieldName],
          };
        }
      }

      // Check if disabled states have changed
      for (const fieldName of allFieldsForPass2) {
        const oldDisabled = disabled[fieldName];
        const newDisabledValue = newDisabled[fieldName];
        if (oldDisabled !== newDisabledValue) {
          hasChanged = true;
          disabled[fieldName] = newDisabledValue;
        }
      }

      // Use new states for next iteration
      currentStates = newStates;
    }

    return disabled;
  }, [watchFields, allFieldsConfig, fieldValues, baseFieldStates, record, props, methods]);

  // ============================================================================
  // PASS 3: Merge base states with disabled into final field states
  // ============================================================================
  // This is the final fieldStates object that includes all properties including disabled
  const fieldStates = useMemo(() => {
    // Start with baseFieldStates (watched fields + current field)
    const states: Record<string, FieldStateInput> = { ...baseFieldStates };

    // Add disabled states for all fields that have them (from Pass 2)
    // This includes fields from allFieldsConfig that might not be in baseFieldStates
    Object.entries(disabledStates).forEach(([fieldName, disabled]) => {
      if (states[fieldName]) {
        // Field already in baseFieldStates, just add disabled
        states[fieldName] = {
          ...states[fieldName],
          disabled,
        };
      } else {
        // Field not in baseFieldStates, create new state with disabled
        const fieldState = methods.getFieldState(fieldName as any);
        states[fieldName] = {
          value: fieldValues[fieldName],
          isTouched: fieldState.isTouched,
          isDirty: fieldState.isDirty,
          error: fieldState.error,
          invalid: fieldState.invalid,
          isValidating: false,
          disabled,
        };
      }
    });

    return states;
  }, [baseFieldStates, disabledStates, fieldValues, methods]);

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
