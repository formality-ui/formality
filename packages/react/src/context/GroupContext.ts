// @formality/react - GroupContext
// Group-level context for nested disabled/visible state propagation

import { createContext, useContext } from 'react';
import type { ConditionDescriptor, GroupConfig } from '@formality/core';

/**
 * GroupState - Current computed state for a FieldGroup
 *
 * Contains the resolved disabled/visible states from condition
 * evaluation and the conditions/subscriptions used.
 */
export interface GroupState {
  /** Is the group disabled (propagates to all child fields) */
  isDisabled: boolean;

  /** Is the group visible (propagates to all child fields) */
  isVisible: boolean;

  /** Conditions from group configuration */
  conditions: ConditionDescriptor[];

  /** Fields this group subscribes to */
  subscriptions: string[];
}

/**
 * GroupContextValue - Group-level configuration and state
 *
 * Provides inherited disabled/visible state and subscription
 * information to nested fields and groups.
 */
export interface GroupContextValue {
  /** Current computed state for the group */
  state: GroupState;

  /** Inherited subscriptions from parent groups */
  subscriptions: string[];

  /** Field names inferred from group conditions */
  inferredInputs: string[];

  /** Group configuration */
  config: GroupConfig;
}

/**
 * Default group context values
 *
 * When no FieldGroup is present, fields use these defaults:
 * - Not disabled
 * - Visible
 * - No conditions or subscriptions
 */
const defaultGroupContext: GroupContextValue = {
  state: {
    isDisabled: false,
    isVisible: true,
    conditions: [],
    subscriptions: [],
  },
  subscriptions: [],
  inferredInputs: [],
  config: { conditions: [], subscribesTo: [] },
};

/**
 * GroupContext - React context for group-level state
 *
 * Provides inherited disabled/visible state from parent groups
 * to child fields and nested groups.
 */
export const GroupContext = createContext<GroupContextValue>(defaultGroupContext);

GroupContext.displayName = 'FormalityGroupContext';

/**
 * useGroupContext - Hook to access group-level context
 *
 * @returns The GroupContextValue from the nearest FieldGroup or default
 */
export function useGroupContext(): GroupContextValue {
  return useContext(GroupContext);
}
