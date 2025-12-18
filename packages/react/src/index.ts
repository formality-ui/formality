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

// ============================================================================
// Utilities
// ============================================================================
export { makeProxyState, makeDeepProxyState } from './utils/makeProxyState';

// ============================================================================
// Hooks
// ============================================================================
export { useFormState } from './hooks/useFormState';
export type { UseFormStateOptions } from './hooks/useFormState';

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
