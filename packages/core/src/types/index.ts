// @formality/core - Types Barrel Export
// Re-exports all type definitions

// Configuration types
export type {
  SelectValue,
  SelectFunction,
  InputConfig,
  FieldConfig,
  FormFieldsConfig,
  GroupConfig,
  FormConfig,
  FormalityProviderConfig,
  InputTemplateProps,
} from './config';

// State types
export type { FieldError, FieldState, FormState } from './state';

// Condition types
export type { ConditionDescriptor, ConditionResult } from './conditions';

// Validation types
export type {
  ValidationResult,
  ValidatorFunction,
  ValidatorSpec,
  ValidatorFactory,
  ValidatorsConfig,
  ErrorMessagesConfig,
} from './validation';
