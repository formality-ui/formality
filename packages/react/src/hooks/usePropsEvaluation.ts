// @formality-ui/react - usePropsEvaluation Hook
// Evaluates selectProps against current field values

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import {
  evaluateDescriptor,
  buildFieldContext,
  type FormState,
} from "@formality-ui/core";
import type { SelectValue } from "@formality-ui/core";
import { useFormContext } from "../context/FormContext";
import { useInferredInputs } from "./useInferredInputs";
import { makeProxyState } from "../utils/makeProxyState";

/**
 * Evaluated props object returned by usePropsEvaluation
 *
 * Result of evaluating SelectValue expressions (selectProps, formDefaultFieldProps,
 * providerDefaultFieldProps) against current form state.
 *
 * The evaluation follows the priority system where higher-priority props override
 * lower-priority ones:
 * 1. Field-level selectProps (highest priority)
 * 2. Form-level formDefaultFieldProps (medium priority)
 * 3. Provider-level providerDefaultFieldProps (lowest priority)
 *
 * @example
 * ```tsx
 * // Expression evaluation
 * const props = usePropsEvaluation({
 *   selectProps: { disabled: '!signed' },
 *   fieldName: 'contact',
 * });
 * // When signed=false, props = { disabled: true }
 *
 * // Function callback evaluation
 * const props = usePropsEvaluation({
 *   selectProps: (formState) => ({
 *     variant: formState.fields.type?.value === 'premium' ? 'filled' : 'outlined'
 *   }),
 *   fieldName: 'variant',
 * });
 * ```
 */
export type SelectedProps = Record<string, unknown>;

/**
 * Result of evaluating all three prop sources separately
 *
 * Each layer is evaluated independently so that mergeFieldProps
 * can correctly apply the 8-layer priority order.
 */
export interface EvaluatedPropsResult {
  /** Evaluated provider-level selectDefaultFieldProps (layer 7 priority) */
  providerSelectProps: Record<string, unknown>;

  /** Evaluated form-level selectDefaultFieldProps (layer 5 priority) */
  formSelectProps: Record<string, unknown>;

  /** Evaluated field-level selectProps (layer 2 priority) */
  fieldSelectProps: Record<string, unknown>;
}

export interface UsePropsEvaluationOptions {
  /** Dynamic props descriptor to evaluate */
  selectProps?: SelectValue;

  /** Dynamic default field props from Form config (higher priority) */
  formDefaultFieldProps?: SelectValue;

  /** Dynamic default field props from Provider config (lower priority) */
  providerDefaultFieldProps?: SelectValue;

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Current field name */
  fieldName: string;
}

/**
 * Evaluates dynamic props against current field values
 *
 * This hook:
 * 1. Infers which fields to watch from selectProps expressions
 * 2. Subscribes to those fields via useWatch
 * 3. Evaluates selectProps whenever watched values change
 *
 * Handles both expression-based selectProps and function-based selectProps.
 *
 * @param options - Hook options including props to evaluate and subscription config
 * @param {SelectValue} [options.selectProps] - Dynamic props descriptor to evaluate
 * @param {SelectValue} [options.formDefaultFieldProps] - Dynamic default props from Form config (higher priority)
 * @param {SelectValue} [options.providerDefaultFieldProps] - Dynamic default props from Provider config (lower priority)
 * @param {string[]} [options.subscribesTo] - Explicit field subscriptions
 * @param {string} options.fieldName - Current field name
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
  options: UsePropsEvaluationOptions,
): EvaluatedPropsResult {
  const {
    selectProps,
    formDefaultFieldProps,
    providerDefaultFieldProps,
    subscribesTo,
    fieldName,
  } = options;
  const { record, methods } = useFormContext();

  // Infer fields to watch from providerDefaultFieldProps, formDefaultFieldProps, selectProps, and explicit subscriptions
  const watchFields = useInferredInputs({
    providerDefaultFieldProps,
    formDefaultFieldProps,
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
      // useWatch returns an array when given an array of field names
      // useWatch({ name: ["f1"] }) → [v1]
      // useWatch({ name: ["f1", "f2"] }) → [v1, v2]
      const values = Array.isArray(watchedValues)
        ? watchFields.reduce(
            (acc, field, i) => {
              acc[field] = watchedValues[i];
              return acc;
            },
            {} as Record<string, unknown>,
          )
        : (watchedValues as Record<string, unknown>);

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

  // Evaluate props: evaluate ALL three layers separately for mergeFieldProps
  return useMemo(() => {
    // Step 1: Evaluate providerDefaultFieldProps (lowest priority, layer 7)
    let providerResult: Record<string, unknown> = {};
    if (providerDefaultFieldProps) {
      // Handle function providerDefaultFieldProps
      if (typeof providerDefaultFieldProps === "function") {
        providerResult =
          (providerDefaultFieldProps(formState, methods) as Record<string, unknown>) ??
          {};
      } else {
        // Build evaluation context
        const context = buildFieldContext(formState, fieldName);

        // Evaluate descriptor (string expression, object with expressions, or array)
        providerResult =
          (evaluateDescriptor(providerDefaultFieldProps, context) as Record<string, unknown>) ??
          {};
      }
    }

    // Step 2: Evaluate formDefaultFieldProps (medium priority, layer 5)
    let formResult: Record<string, unknown> = {};
    if (formDefaultFieldProps) {
      // Handle function formDefaultFieldProps
      if (typeof formDefaultFieldProps === "function") {
        formResult =
          (formDefaultFieldProps(formState, methods) as Record<string, unknown>) ?? {};
      } else {
        // Build evaluation context
        const context = buildFieldContext(formState, fieldName);

        // Evaluate descriptor (string expression, object with expressions, or array)
        formResult =
          (evaluateDescriptor(formDefaultFieldProps, context) as Record<string, unknown>) ??
          {};
      }
    }

    // Step 3: Evaluate selectProps (highest priority, layer 2)
    let fieldResult: Record<string, unknown> = {};
    if (selectProps) {
      // Handle function selectProps
      if (typeof selectProps === "function") {
        fieldResult =
          (selectProps(formState, methods) as Record<string, unknown>) ?? {};
      } else {
        // Build evaluation context
        const context = buildFieldContext(formState, fieldName);

        // Evaluate descriptor (string expression, object with expressions, or array)
        fieldResult =
          (evaluateDescriptor(selectProps, context) as Record<string, unknown>) ?? {};
      }
    }

    // Step 4: Return all three results for mergeFieldProps to handle priority
    return {
      providerSelectProps: providerResult,
      formSelectProps: formResult,
      fieldSelectProps: fieldResult,
    };
  }, [providerDefaultFieldProps, formDefaultFieldProps, selectProps, formState, methods, fieldName]);
}
