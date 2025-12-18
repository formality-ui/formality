// @formality/react - React implementation of Formality
// Depends on @formality/core and react-hook-form

// ============================================================================
// Re-export core types for convenience
// ============================================================================
export type {
  // Config types
  SelectValue,
  SelectFunction,
  InputConfig,
  FieldConfig,
  FormFieldsConfig,
  GroupConfig,
  FormConfig,
  FormalityProviderConfig,
  // State types
  FieldError,
  FieldState,
  FormState,
  // Condition types
  ConditionDescriptor,
  ConditionResult,
  // Validation types
  ValidationResult,
  ValidatorFunction,
  ValidatorSpec,
  ValidatorsConfig,
  ErrorMessagesConfig,
} from '@formality/core';

// ============================================================================
// Context
// ============================================================================
export { ConfigContext, useConfigContext } from './context/ConfigContext';
export type { ConfigContextValue } from './context/ConfigContext';

export { FormContext, useFormContext } from './context/FormContext';
export type { FormContextValue } from './context/FormContext';

export { GroupContext, useGroupContext } from './context/GroupContext';
export type { GroupContextValue, GroupState } from './context/GroupContext';

// ============================================================================
// Components
// ============================================================================
export { FormalityProvider } from './components/FormalityProvider';
export type { FormalityProviderProps } from './components/FormalityProvider';

export { Form } from './components/Form';
export type { FormProps, FormRenderAPI } from './components/Form';

export { Field } from './components/Field';
export type { FieldProps, FieldRenderAPI } from './components/Field';

export { FieldGroup } from './components/FieldGroup';
export type { FieldGroupProps } from './components/FieldGroup';

export { UnusedFields } from './components/UnusedFields';
export type { UnusedFieldsProps } from './components/UnusedFields';

// ============================================================================
// Utilities
// ============================================================================
export { makeProxyState, makeDeepProxyState } from './utils/makeProxyState';

// ============================================================================
// Hooks
// ============================================================================
export { useFormState } from './hooks/useFormState';
export type { UseFormStateOptions } from './hooks/useFormState';

export { useConditions } from './hooks/useConditions';
export { usePropsEvaluation } from './hooks/usePropsEvaluation';
export { useInferredInputs } from './hooks/useInferredInputs';
export { useSubscriptions } from './hooks/useSubscriptions';

// ============================================================================
// Types
// ============================================================================
export type {
  InputTemplateProps,
  CustomFieldState,
  ExtendedFormState,
  WatcherSetterFn,
  DebouncedFunction,
} from './types';
