// @formality-ui/react - useInferredInputs Hook
// Infers field dependencies from selectProps and conditions

import { useMemo } from 'react';
import {
  inferFieldsFromDescriptor,
  inferFieldsFromConditions,
} from '@formality-ui/core';
import type { ConditionDescriptor, SelectValue } from '@formality-ui/core';

interface UseInferredInputsOptions {
  /** Dynamic props descriptor to analyze for field references */
  selectProps?: SelectValue;

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
  const { selectProps, conditions = [], subscribesTo = [] } = options;

  return useMemo(() => {
    const inferred: string[] = [...subscribesTo];

    // Infer from selectProps expression/descriptor
    if (selectProps) {
      inferred.push(...inferFieldsFromDescriptor(selectProps));
    }

    // Infer from conditions (when fields, selectWhen expressions)
    if (conditions.length > 0) {
      inferred.push(...inferFieldsFromConditions(conditions));
    }

    // Return unique field names
    return [...new Set(inferred)];
  }, [selectProps, conditions, subscribesTo]);
}
