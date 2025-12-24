// @formality-ui/core - Condition Types
// This file defines condition descriptor and result interfaces

import type { SelectValue } from './config';

/**
 * ConditionDescriptor - Defines a single condition rule
 *
 * Conditions control disabled, visible, and setValue behaviors based on
 * form state. Each condition has a trigger (when/selectWhen), optional
 * matchers (is/truthy), and actions (disabled/visible/set/selectSet).
 */
export interface ConditionDescriptor {
  // ========================
  // TRIGGER (one required)
  // ========================

  /**
   * Simple field reference trigger
   * Example: "client" - triggers when client field has a value
   */
  when?: string;

  /**
   * Expression or function trigger
   * Example: "client.id > 5" or ({ fields }) => fields.client?.value?.id > 5
   */
  selectWhen?: SelectValue<boolean>;

  // ========================
  // MATCHERS (optional)
  // ========================

  /**
   * Exact value match
   * When true, condition matches if trigger value === is value
   */
  is?: unknown;

  /**
   * Truthy/falsy check
   * true: matches if trigger is truthy
   * false: matches if trigger is falsy
   */
  truthy?: boolean;

  // ========================
  // ACTIONS (when matched)
  // ========================

  /**
   * Set disabled state
   * Multiple conditions use OR logic (any true = disabled)
   */
  disabled?: boolean;

  /**
   * Set visible state
   * Multiple conditions use AND logic (any false = hidden)
   */
  visible?: boolean;

  /**
   * Set static value when condition matches
   * Last matching condition wins
   */
  set?: unknown;

  /**
   * Set dynamic value from expression or function
   * Last matching condition wins
   */
  selectSet?: SelectValue;

  // ========================
  // DEPENDENCIES
  // ========================

  /**
   * Explicit field subscriptions for function-based conditions
   * REQUIRED when using functions in selectWhen or selectSet
   */
  subscribesTo?: string[];
}

/**
 * ConditionResult - Result of evaluating all conditions for a field/group
 *
 * Contains the resolved disabled/visible states and any setValue operation.
 */
export interface ConditionResult {
  /**
   * Resolved disabled state
   * undefined = no condition set disabled
   * true = at least one condition set disabled: true
   */
  disabled: boolean | undefined;

  /**
   * Resolved visible state
   * undefined = no condition set visible
   * true = all conditions with visible set it to true
   * false = at least one condition set visible: false
   */
  visible: boolean | undefined;

  /**
   * Value to set (from last matching set/selectSet condition)
   * undefined = no condition set a value
   */
  setValue: unknown | undefined;

  /** Was any condition's disabled action evaluated */
  hasDisabledCondition: boolean;

  /** Was any condition's visible action evaluated */
  hasVisibleCondition: boolean;

  /** Was any condition's set/selectSet action evaluated */
  hasSetCondition: boolean;
}
