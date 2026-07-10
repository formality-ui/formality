// @formality-ui/react - useInferredInputs Hook
// Infers field dependencies from selectProps and conditions

import { useMemo } from "react";
import {
  inferFieldsFromDescriptor,
  inferFieldsFromConditions,
} from "@formality-ui/core";
import type { ConditionDescriptor, SelectValue } from "@formality-ui/core";

interface UseInferredInputsOptions {
  /** Dynamic props descriptor to analyze for field references */
  selectProps?: SelectValue;

  /** Form-level default field props to analyze for field references */
  formDefaultFieldProps?: SelectValue;

  /** Provider-level default field props to analyze for field references */
  providerDefaultFieldProps?: SelectValue;

  /** Conditions to analyze for field references */
  conditions?: ConditionDescriptor[];

  /** Explicit field subscriptions */
  subscribesTo?: string[];
}

/**
 * Infers field dependencies from selectProps, conditions, and explicit subscriptions
 *
 * This hook analyzes:
 * - selectProps expressions for field references
 * - condition 'when' fields and 'selectWhen' expressions
 * - explicit subscribesTo declarations
 *
 * Used to automatically determine which fields a Field or FieldGroup
 * should subscribe to for reactive updates.
 *
 * @param options - Sources to analyze for field references
 * @returns Array of unique field names to subscribe to
 *
 * @example
 * ```tsx
 * const subscriptions = useInferredInputs({
 *   selectProps: "client.id",
 *   conditions: [{ when: 'signed', disabled: true }],
 *   subscribesTo: ['contact'],
 * });
 * // → ['client', 'signed', 'contact']
 * ```
 */
export function useInferredInputs(options: UseInferredInputsOptions): string[] {
  const {
    selectProps,
    formDefaultFieldProps,
    providerDefaultFieldProps,
    conditions,
    subscribesTo,
  } = options;

  // Stable content signature.
  //
  // These inputs arrive from config objects that are usually reference-stable,
  // but callers also pass `undefined` (formerly defaulted to a *fresh* `[]` on
  // every call) and sometimes inline arrays. Keying the memo on a serialized
  // signature — instead of the raw array identities — keeps the returned array
  // reference stable across renders when nothing actually changed.
  //
  // Without this, the returned array is a new reference every render, which
  // propagates: `Field.allSubscriptions` memo busts every render, and
  // `useSubscriptions`'s effect (which lists `subscriptions` in its deps) tears
  // down + re-runs on every render — calling `addSubscription`/
  // `removeSubscription`, which `setWatchers` (a setState) inside an effect.
  // That setState-in-effect storm is what surfaces as React's
  // "Maximum update depth exceeded".
  const signature = JSON.stringify({
    selectProps,
    formDefaultFieldProps,
    providerDefaultFieldProps,
    conditions,
    subscribesTo,
  });

  return useMemo(() => {
    const inferred: string[] = [...(subscribesTo ?? [])];

    // Infer from providerDefaultFieldProps expression/descriptor
    if (providerDefaultFieldProps) {
      inferred.push(...inferFieldsFromDescriptor(providerDefaultFieldProps));
    }

    // Infer from formDefaultFieldProps expression/descriptor
    if (formDefaultFieldProps) {
      inferred.push(...inferFieldsFromDescriptor(formDefaultFieldProps));
    }

    // Infer from selectProps expression/descriptor
    if (selectProps) {
      inferred.push(...inferFieldsFromDescriptor(selectProps));
    }

    // Infer from conditions (when fields, selectWhen expressions)
    if (conditions && conditions.length > 0) {
      inferred.push(...inferFieldsFromConditions(conditions));
    }

    // Return unique field names
    return [...new Set(inferred)];
  }, [signature]);
}
