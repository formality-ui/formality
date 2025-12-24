// @formality-ui/react - Types
// React-specific type extensions for Formality

import type { ComponentType } from 'react';
import type {
  ControllerFieldState,
  UseFormStateReturn,
  FieldValues,
} from 'react-hook-form';
import type { FormState, FieldError } from '@formality-ui/core';

/**
 * Props passed to input template components
 *
 * Templates wrap input components to provide consistent styling,
 * labels, error display, etc.
 */
export interface InputTemplateProps {
  /** The input component to render */
  Field: ComponentType<any>;

  /** Merged props to pass to the component */
  fieldProps: Record<string, unknown>;

  /** Current field state from Controller */
  fieldState: ControllerFieldState;

  /** Current form state from RHF */
  formState: UseFormStateReturn<FieldValues>;
}

/**
 * Custom field state with proxy-optimized properties
 *
 * This is the Formality-enhanced field state that includes
 * all necessary properties for expressions and conditions.
 */
export interface CustomFieldState {
  /** Current field value */
  value: unknown;

  /** Has the field been touched (focused then blurred) */
  isTouched: boolean;

  /** Has the value changed from default */
  isDirty: boolean;

  /** Is async validation currently running */
  isValidating: boolean;

  /** Current validation error (if any) */
  error?: FieldError;

  /** Inverse of valid state for convenience */
  invalid: boolean;
}

/**
 * Extended form state with Formality-specific additions
 *
 * Combines RHF's form state with proxy-wrapped field states
 * and the original record for expression access.
 */
export interface ExtendedFormState<TFieldValues extends FieldValues = FieldValues>
  extends UseFormStateReturn<TFieldValues> {
  /** Proxy-wrapped field states for each field */
  fields: Record<string, CustomFieldState>;

  /** Original record passed to Form (for expression access) */
  record: Record<string, unknown>;
}

/**
 * Isolated form state for performance-critical subscriptions
 *
 * This is a lightweight version of ExtendedFormState that does NOT
 * subscribe to the entire RHF form state. It only contains:
 * - Fields you explicitly subscribed to
 * - The record object
 *
 * Use this when you need to watch specific fields without causing
 * re-renders when other fields change.
 */
export interface IsolatedFormState {
  /** Proxy-wrapped field states for watched fields only */
  fields: Record<string, CustomFieldState>;

  /** Original record passed to Form (for expression access) */
  record: Record<string, unknown>;

  /** Minimal form-level flags (not reactive) */
  isDirty: boolean;
  isTouched: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  errors: Record<string, unknown>;
  touchedFields: Record<string, unknown>;
  dirtyFields: Record<string, unknown>;
  defaultValues: Record<string, unknown>;
}

/**
 * Watcher setter function type
 *
 * Used by fields to receive updates about which other fields are watching them.
 */
export type WatcherSetterFn = React.Dispatch<
  React.SetStateAction<Record<string, boolean>>
>;

/**
 * Debounced function interface
 *
 * Used for debounced submission and validation.
 */
export interface DebouncedFunction {
  (): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
}
