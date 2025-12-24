// @formality-ui/react - FormContext
// Form-level context for field registration and state management

import { createContext, useContext } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import type { FormFieldsConfig, FormConfig, FormState } from '@formality-ui/core';
import type { WatcherSetterFn, DebouncedFunction } from '../types';

/**
 * FormContextValue - Form-level configuration and operations
 *
 * Provides field registration, subscription management, and access
 * to form state for all fields within a Form component.
 */
export interface FormContextValue<TFieldValues extends FieldValues = FieldValues> {
  // ========================
  // Configuration
  // ========================

  /** Field configurations for this form */
  config: FormFieldsConfig;

  /** Form-level configuration (title, groups, input overrides) */
  formConfig: FormConfig;

  /** Original record passed to Form (for expression access) */
  record?: Record<string, unknown>;

  // ========================
  // Registry Operations
  // ========================

  /**
   * Register a field when it mounts
   * @param name - Field name
   */
  registerField: (name: string) => void;

  /**
   * Unregister a field when it unmounts
   * @param name - Field name
   */
  unregisterField: (name: string) => void;

  // ========================
  // Subscription Operations
  // ========================

  /**
   * Add a subscription from subscriber to target field
   * @param target - The field being watched
   * @param subscriber - The field watching
   */
  addSubscription: (target: string, subscriber: string) => void;

  /**
   * Remove a subscription from subscriber to target field
   * @param target - The field being watched
   * @param subscriber - The field watching
   */
  removeSubscription: (target: string, subscriber: string) => void;

  /**
   * Register a setter for a field's watchers state
   * @param name - Field name
   * @param setter - React state setter for watchers
   */
  registerWatcherSetter: (name: string, setter: WatcherSetterFn) => void;

  /**
   * Unregister a watcher setter when field unmounts
   * @param name - Field name
   */
  unregisterWatcherSetter: (name: string) => void;

  // ========================
  // Field State Operations
  // ========================

  /**
   * Programmatically change a field's value
   * @param name - Field name
   * @param value - New value
   */
  changeField: (name: string, value: unknown) => void;

  /**
   * Set a field's validating state
   * @param name - Field name
   * @param isValidating - Whether validation is in progress
   */
  setFieldValidating: (name: string, isValidating: boolean) => void;

  // ========================
  // State Access
  // ========================

  /**
   * Get the current complete form state
   * Used for expression evaluation and condition checking
   */
  getFormState: () => FormState;

  // ========================
  // Submission Operations
  // ========================

  /** Optional submit handler passed to Form */
  onSubmit?: (values: Partial<TFieldValues>) => void | Promise<void>;

  /** Debounced submit for auto-save forms */
  debouncedSubmit: DebouncedFunction;

  /** Immediate submit bypassing debounce */
  submitImmediate: () => void;

  // ========================
  // Unused Fields Tracking
  // ========================

  /** Fields in config but not rendered (for config-driven forms) */
  unusedFields: string[];

  // ========================
  // React Hook Form Integration
  // ========================

  /** React Hook Form methods passthrough */
  methods: UseFormReturn<TFieldValues>;
}

/**
 * FormContext - React context for form-level state and operations
 *
 * Must be provided by a Form component. No default value as
 * fields cannot function without a parent Form.
 */
export const FormContext = createContext<FormContextValue | null>(null);

FormContext.displayName = 'FormalityFormContext';

/**
 * useFormContext - Hook to access form-level context
 *
 * @throws Error if used outside a Form component
 * @returns The FormContextValue from the nearest Form component
 */
export function useFormContext<TFieldValues extends FieldValues = FieldValues>(): FormContextValue<TFieldValues> {
  const context = useContext(FormContext) as FormContextValue<TFieldValues> | null;

  if (!context) {
    throw new Error(
      'useFormContext must be used within a Form component. ' +
      'Make sure your component is wrapped in a <Form> component.'
    );
  }

  return context;
}
