// @formality/react - FieldGroup Component
// Groups fields with shared conditions and state propagation

import { useMemo, type ReactNode } from 'react';
import type { GroupConfig } from '@formality/core';
import { useFormContext } from '../context/FormContext';
import {
  GroupContext,
  useGroupContext,
  type GroupContextValue,
  type GroupState,
} from '../context/GroupContext';
import { useConditions } from '../hooks/useConditions';
import { useInferredInputs } from '../hooks/useInferredInputs';

/**
 * FieldGroup component props
 */
export interface FieldGroupProps {
  /** Group name (must match a key in FormConfig.groups) */
  name: string;

  /** Fields to render within this group */
  children: ReactNode;
}

/**
 * FieldGroup component - Groups fields with shared conditions
 *
 * Provides:
 * - Group-level condition evaluation (disabled/visible)
 * - State propagation to nested fields:
 *   - disabled: OR logic (child || parent)
 *   - visible: AND logic (child && parent)
 * - Subscription accumulation from parent groups
 *
 * Groups can be nested, with state merging at each level.
 *
 * @example
 * ```tsx
 * // FormConfig
 * formConfig={{
 *   groups: {
 *     clientSection: {
 *       conditions: [
 *         { when: 'hasClient', is: false, visible: false }
 *       ]
 *     }
 *   }
 * }}
 *
 * // Usage
 * <Form config={config} formConfig={formConfig}>
 *   <Field name="hasClient" />
 *   <FieldGroup name="clientSection">
 *     <Field name="clientName" />
 *     <Field name="clientEmail" />
 *   </FieldGroup>
 * </Form>
 * ```
 */
export function FieldGroup({ name, children }: FieldGroupProps): JSX.Element {
  const { formConfig } = useFormContext();
  const parentContext = useGroupContext();

  // Get group config
  const groupConfig: GroupConfig = formConfig.groups?.[name] ?? {
    conditions: [],
    subscribesTo: [],
  };

  // Warn if group config not found (in development)
  if (process.env.NODE_ENV !== 'production' && !formConfig.groups?.[name]) {
    console.warn(
      `FieldGroup: No config found for group "${name}". ` +
        `Make sure to define it in formConfig.groups.`
    );
  }

  // Infer fields from conditions
  const inferredInputs = useInferredInputs({
    conditions: groupConfig.conditions,
    subscribesTo: groupConfig.subscribesTo,
  });

  // Evaluate conditions
  const conditionResult = useConditions({
    conditions: groupConfig.conditions ?? [],
    subscribesTo: groupConfig.subscribesTo,
  });

  // Merge with parent context state
  const mergedState = useMemo<GroupState>(() => {
    // Disabled: OR logic (any parent can disable)
    const isDisabled =
      (conditionResult.hasDisabledCondition
        ? conditionResult.disabled ?? false
        : false) || parentContext.state.isDisabled;

    // Visible: AND logic (any parent can hide)
    const isVisible =
      (conditionResult.hasVisibleCondition
        ? conditionResult.visible ?? true
        : true) && parentContext.state.isVisible;

    // setValue: This group's setValue takes priority, then parent's
    // (Child fields can still override with their own field-level conditions)
    const hasSetCondition =
      conditionResult.hasSetCondition || parentContext.state.hasSetCondition;
    const setValue = conditionResult.hasSetCondition
      ? conditionResult.setValue
      : parentContext.state.setValue;

    // Accumulate conditions and subscriptions
    const conditions = [
      ...parentContext.state.conditions,
      ...(groupConfig.conditions ?? []),
    ];

    const subscriptions = [
      ...parentContext.state.subscriptions,
      ...(groupConfig.subscribesTo ?? []),
    ];

    return {
      isDisabled,
      isVisible,
      hasSetCondition,
      setValue,
      conditions,
      subscriptions,
    };
  }, [conditionResult, parentContext.state, groupConfig]);

  // Build context value
  const contextValue = useMemo<GroupContextValue>(
    () => ({
      state: mergedState,
      subscriptions: mergedState.subscriptions,
      inferredInputs,
      config: groupConfig,
    }),
    [mergedState, inferredInputs, groupConfig]
  );

  // CRITICAL: Use span wrapper with display:none instead of returning null
  // This preserves children in DOM for state preservation (PRD Section 5.4, 18.10)
  return (
    <GroupContext.Provider value={contextValue}>
      <span
        style={{ display: mergedState.isVisible ? undefined : 'none' }}
        data-formality-group={name}
      >
        {children}
      </span>
    </GroupContext.Provider>
  );
}
