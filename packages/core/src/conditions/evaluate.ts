// @formality/core - Condition Evaluation
// Pure functions for evaluating conditions against form state
// ZERO framework dependencies

import type { ConditionDescriptor, ConditionResult } from '../types';
import { evaluate, evaluateDescriptor } from '../expression/evaluate';
import { buildEvaluationContext, unwrapFieldProxy } from '../expression/context';
import { inferFieldsFromDescriptor } from '../expression/infer';

/**
 * Field state with metadata for expression evaluation
 */
export interface FieldStateInput {
  value: unknown;
  isTouched?: boolean;
  isDirty?: boolean;
  isValidating?: boolean;
  error?: unknown;
  invalid?: boolean;
}

/**
 * Input for condition evaluation
 */
export interface EvaluateConditionsInput {
  /** Array of conditions to evaluate */
  conditions: ConditionDescriptor[];

  /** Map of field names to their current values */
  fieldValues: Record<string, unknown>;

  /** Optional: Full field states with metadata (isTouched, isDirty, etc.) */
  fieldStates?: Record<string, FieldStateInput>;

  /** Original record passed to form */
  record?: Record<string, unknown>;

  /** Additional props for expression context */
  props?: Record<string, unknown>;
}

/**
 * Check if a condition matches based on its trigger and matchers
 *
 * Handles both 'when' (field reference) and 'selectWhen' (expression) triggers,
 * and applies 'is' (exact match) or 'truthy' (boolean check) matchers.
 *
 * @param condition - The condition to check
 * @param context - Evaluation context with field values
 * @param fieldValues - Direct field values map for 'when' lookup
 * @returns true if the condition matches, false otherwise
 */
function evaluateConditionMatch(
  condition: ConditionDescriptor,
  context: Record<string, unknown>,
  fieldValues: Record<string, unknown>
): boolean {
  let triggerValue: unknown;

  // Determine trigger value
  if (condition.when !== undefined) {
    // Simple field reference: look up field value directly
    triggerValue = fieldValues[condition.when];
  } else if (condition.selectWhen !== undefined) {
    // Expression or function trigger
    if (typeof condition.selectWhen === 'string') {
      triggerValue = evaluate(condition.selectWhen, context);
    } else if (typeof condition.selectWhen === 'function') {
      // Functions are evaluated by the framework adapter
      // Core returns the function as-is for the adapter to call
      return false; // Framework adapter handles this case
    } else {
      // Object/array descriptor
      triggerValue = evaluateDescriptor(condition.selectWhen, context);
    }
  } else {
    // No trigger defined - condition doesn't match
    return false;
  }

  // Apply matchers
  if (condition.is !== undefined) {
    // Exact value match
    return triggerValue === condition.is;
  }

  if (condition.truthy !== undefined) {
    // Boolean truthiness check
    const isTruthy = Boolean(triggerValue);
    return condition.truthy ? isTruthy : !isTruthy;
  }

  // Default: truthy check if no matcher specified
  return Boolean(triggerValue);
}

/**
 * Evaluate all conditions for a field/group
 *
 * Implements the condition evaluation rules:
 * - disabled: OR logic (any true = true)
 * - visible: AND logic (any false = false)
 * - setValue: last matching condition wins
 *
 * @param input - Evaluation input with conditions and state
 * @returns Result with resolved disabled, visible, and setValue states
 *
 * @example
 * const result = evaluateConditions({
 *   conditions: [
 *     { when: 'signed', is: false, disabled: true },
 *     { when: 'archived', truthy: true, visible: false },
 *   ],
 *   fieldValues: { signed: false, archived: true },
 * });
 * // result.disabled === true (signed is false, matches first condition)
 * // result.visible === false (archived is truthy, matches second condition)
 */
export function evaluateConditions(
  input: EvaluateConditionsInput
): ConditionResult {
  const { conditions, fieldValues, fieldStates, record, props } = input;

  // Build evaluation context for expressions
  // Pass fieldStates to enable access to isTouched, isDirty, etc.
  const context = buildEvaluationContext(fieldValues, record, props, fieldStates);

  // Initialize result tracking
  let disabled: boolean | undefined;
  let visible: boolean | undefined;
  let setValue: unknown | undefined;
  let hasDisabledCondition = false;
  let hasVisibleCondition = false;
  let hasSetCondition = false;

  // Evaluate each condition in order
  for (const condition of conditions) {
    const isMatched = evaluateConditionMatch(condition, context, fieldValues);

    if (!isMatched) {
      continue;
    }

    // Apply disabled action (OR logic: any true = true)
    if (condition.disabled !== undefined) {
      hasDisabledCondition = true;
      disabled = (disabled ?? false) || condition.disabled;
    }

    // Apply visible action (AND logic: any false = false)
    if (condition.visible !== undefined) {
      hasVisibleCondition = true;
      // Start with true on first visible condition, then AND subsequent values
      visible = visible === undefined ? condition.visible : visible && condition.visible;
    }

    // Apply setValue action (last matching wins)
    if (condition.set !== undefined) {
      hasSetCondition = true;
      setValue = condition.set;
    } else if (condition.selectSet !== undefined) {
      hasSetCondition = true;
      if (typeof condition.selectSet === 'string') {
        // Unwrap proxy to get raw value for setting
        setValue = unwrapFieldProxy(evaluate(condition.selectSet, context));
      } else if (typeof condition.selectSet === 'function') {
        // Function must be handled by framework adapter
        // Store the function for the adapter to call
        setValue = condition.selectSet;
      } else {
        // Unwrap proxy to get raw value for setting
        setValue = unwrapFieldProxy(evaluateDescriptor(condition.selectSet, context));
      }
    }
  }

  return {
    disabled: hasDisabledCondition ? disabled : undefined,
    visible: hasVisibleCondition ? visible : undefined,
    setValue: hasSetCondition ? setValue : undefined,
    hasDisabledCondition,
    hasVisibleCondition,
    hasSetCondition,
  };
}

/**
 * Evaluate a single condition's match (without applying actions)
 *
 * Useful for checking if a condition would match without computing results.
 *
 * @param condition - The condition to check
 * @param fieldValues - Map of field names to their current values
 * @param record - Optional record for expression context
 * @param props - Optional props for expression context
 * @returns true if the condition matches
 */
export function conditionMatches(
  condition: ConditionDescriptor,
  fieldValues: Record<string, unknown>,
  record?: Record<string, unknown>,
  props?: Record<string, unknown>
): boolean {
  const context = buildEvaluationContext(fieldValues, record, props);
  return evaluateConditionMatch(condition, context, fieldValues);
}

/**
 * Merge condition results from multiple sources (e.g., group + field)
 *
 * Follows the same cumulative logic:
 * - disabled: OR logic
 * - visible: AND logic
 * - setValue: later source wins
 *
 * @param results - Array of condition results to merge
 * @returns Merged result
 */
export function mergeConditionResults(
  results: ConditionResult[]
): ConditionResult {
  let disabled: boolean | undefined;
  let visible: boolean | undefined;
  let setValue: unknown | undefined;
  let hasDisabledCondition = false;
  let hasVisibleCondition = false;
  let hasSetCondition = false;

  for (const result of results) {
    // disabled: OR logic
    if (result.hasDisabledCondition) {
      hasDisabledCondition = true;
      disabled = (disabled ?? false) || (result.disabled ?? false);
    }

    // visible: AND logic
    if (result.hasVisibleCondition) {
      hasVisibleCondition = true;
      visible = visible === undefined ? result.visible : visible && (result.visible ?? true);
    }

    // setValue: later source wins
    if (result.hasSetCondition) {
      hasSetCondition = true;
      setValue = result.setValue;
    }
  }

  return {
    disabled: hasDisabledCondition ? disabled : undefined,
    visible: hasVisibleCondition ? visible : undefined,
    setValue: hasSetCondition ? setValue : undefined,
    hasDisabledCondition,
    hasVisibleCondition,
    hasSetCondition,
  };
}

/**
 * Extract field dependencies from an array of conditions
 *
 * Collects 'when' field references and infers dependencies from
 * 'selectWhen' and 'selectSet' expressions. Used for automatic subscription.
 *
 * @param conditions - Array of condition descriptors
 * @returns Array of unique field names referenced
 *
 * @example
 * inferFieldsFromConditions([
 *   { when: 'client', disabled: true },
 *   { selectWhen: 'signed && approved', visible: true },
 * ])
 * // → ['client', 'signed', 'approved']
 */
export function inferFieldsFromConditions(
  conditions: ConditionDescriptor[]
): string[] {
  const fields: string[] = [];

  for (const condition of conditions) {
    // Add 'when' field reference
    if (condition.when !== undefined) {
      fields.push(condition.when);
    }

    // Infer fields from 'selectWhen' expression
    if (condition.selectWhen !== undefined) {
      fields.push(...inferFieldsFromDescriptor(condition.selectWhen));
    }

    // Infer fields from 'selectSet' expression
    if (condition.selectSet !== undefined) {
      fields.push(...inferFieldsFromDescriptor(condition.selectSet));
    }

    // Add explicit subscribesTo if specified
    if (condition.subscribesTo !== undefined) {
      fields.push(...condition.subscribesTo);
    }
  }

  // Return unique field names
  return [...new Set(fields)];
}
