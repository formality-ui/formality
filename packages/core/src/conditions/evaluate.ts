// @formality-ui/core - Condition Evaluation
// Pure functions for evaluating conditions against form state
// ZERO framework dependencies

import type { ConditionDescriptor, ConditionResult, FieldMatcher } from '../types';
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
  disabled?: boolean;
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
 * Check if a single field matches its matchers
 *
 * @param fieldName - The field name to check
 * @param matcher - The matchers to apply
 * @param fieldValues - Map of field values
 * @param fieldStates - Optional field states for state-based matchers
 * @returns true if all matchers pass, false otherwise
 */
function evaluateFieldMatcher(
  fieldName: string,
  matcher: FieldMatcher,
  fieldValues: Record<string, unknown>,
  fieldStates?: Record<string, FieldStateInput>
): boolean {
  const fieldValue = fieldValues[fieldName];
  const fieldState = fieldStates?.[fieldName];

  // Check isValid matcher
  if (matcher.isValid !== undefined) {
    const isFieldValid = fieldState
      ? !fieldState.invalid && !fieldState.error
      : true; // No state = assume valid
    if (matcher.isValid !== isFieldValid) {
      return false;
    }
  }

  // Check isDisabled matcher
  if (matcher.isDisabled !== undefined) {
    const isFieldDisabled = fieldState?.disabled ?? false;
    if (matcher.isDisabled !== isFieldDisabled) {
      return false;
    }
  }

  // Check exact value match
  if (matcher.is !== undefined) {
    if (fieldValue !== matcher.is) {
      return false;
    }
  }

  // Check truthy/isTruthy (they're aliases)
  const truthyCheck = matcher.truthy ?? matcher.isTruthy;
  if (truthyCheck !== undefined) {
    const isTruthy = Boolean(fieldValue);
    if (truthyCheck !== isTruthy) {
      return false;
    }
  }

  // If no matchers specified, default to truthy check
  const hasAnyMatcher =
    matcher.is !== undefined ||
    matcher.truthy !== undefined ||
    matcher.isTruthy !== undefined ||
    matcher.isValid !== undefined ||
    matcher.isDisabled !== undefined;

  if (!hasAnyMatcher) {
    return Boolean(fieldValue);
  }

  return true;
}

/**
 * Check if a condition matches based on its trigger and matchers
 *
 * Handles triggers:
 * - 'when' as string: Single field reference
 * - 'when' as object: Multi-field with per-field matchers (AND logic)
 * - 'selectWhen': Expression or function trigger
 *
 * Applies matchers:
 * - 'is' (exact match) or 'truthy' (boolean check) for value matching
 * - 'isValid' and 'isDisabled' for field state matching
 *
 * When multiple matchers are specified, ALL must pass (AND logic).
 *
 * @param condition - The condition to check
 * @param context - Evaluation context with field values
 * @param fieldValues - Direct field values map for 'when' lookup
 * @param fieldStates - Optional field states for state-based matchers
 * @returns true if the condition matches, false otherwise
 */
function evaluateConditionMatch(
  condition: ConditionDescriptor,
  context: Record<string, unknown>,
  fieldValues: Record<string, unknown>,
  fieldStates?: Record<string, FieldStateInput>
): boolean {
  // Handle multi-field 'when' (object form)
  if (condition.when !== undefined && typeof condition.when === 'object') {
    // All field conditions must match (AND logic)
    for (const [fieldName, matcher] of Object.entries(condition.when)) {
      if (!evaluateFieldMatcher(fieldName, matcher, fieldValues, fieldStates)) {
        return false;
      }
    }
    return true;
  }

  let triggerValue: unknown;

  // Determine trigger value for single-field or expression triggers
  if (typeof condition.when === 'string') {
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

  // Apply field state matchers (require string 'when' trigger for field reference)
  if (typeof condition.when === 'string' && fieldStates) {
    const fieldState = fieldStates[condition.when];

    // Check isValid matcher
    if (condition.isValid !== undefined) {
      // Field is valid if not invalid and has no error
      const isFieldValid = fieldState
        ? !fieldState.invalid && !fieldState.error
        : true; // No state = assume valid
      if (condition.isValid !== isFieldValid) {
        return false;
      }
    }

    // Check isDisabled matcher
    if (condition.isDisabled !== undefined) {
      const isFieldDisabled = fieldState?.disabled ?? false;
      if (condition.isDisabled !== isFieldDisabled) {
        return false;
      }
    }
  }

  // Apply value matchers
  if (condition.is !== undefined) {
    // Exact value match
    return triggerValue === condition.is;
  }

  if (condition.truthy !== undefined) {
    // Boolean truthiness check
    const isTruthy = Boolean(triggerValue);
    return condition.truthy ? isTruthy : !isTruthy;
  }

  // If only state matchers were specified (isValid/isDisabled), we've already checked them
  if (condition.isValid !== undefined || condition.isDisabled !== undefined) {
    return true;
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
    const isMatched = evaluateConditionMatch(condition, context, fieldValues, fieldStates);

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
 * @param fieldStates - Optional field states for state-based matchers
 * @returns true if the condition matches
 */
export function conditionMatches(
  condition: ConditionDescriptor,
  fieldValues: Record<string, unknown>,
  record?: Record<string, unknown>,
  props?: Record<string, unknown>,
  fieldStates?: Record<string, FieldStateInput>
): boolean {
  const context = buildEvaluationContext(fieldValues, record, props, fieldStates);
  return evaluateConditionMatch(condition, context, fieldValues, fieldStates);
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
    // Add 'when' field reference(s)
    if (condition.when !== undefined) {
      if (typeof condition.when === 'string') {
        fields.push(condition.when);
      } else {
        // Multi-field object: add all field names
        fields.push(...Object.keys(condition.when));
      }
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
