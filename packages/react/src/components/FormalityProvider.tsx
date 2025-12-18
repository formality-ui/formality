// @formality/react - FormalityProvider
// Global configuration provider for Formality forms

import { useMemo, type ReactNode, type ComponentType } from 'react';
import type {
  InputConfig,
  ValidatorsConfig,
  ErrorMessagesConfig,
  SelectValue,
} from '@formality/core';
import { ConfigContext, type ConfigContextValue } from '../context/ConfigContext';
import type { InputTemplateProps } from '../types';

/**
 * FormalityProviderProps - Props for the FormalityProvider component
 *
 * Configures input types, transformers, validators, and global defaults
 * for all forms in the application.
 */
export interface FormalityProviderProps {
  /** Child components */
  children: ReactNode;

  /**
   * Input type definitions (REQUIRED)
   *
   * Defines how each input type (e.g., textField, switch, autocomplete)
   * behaves across all forms.
   *
   * @example
   * ```tsx
   * inputs={{
   *   textField: { component: TextField, defaultValue: '' },
   *   switch: { component: Switch, defaultValue: false },
   * }}
   * ```
   */
  inputs: Record<string, InputConfig>;

  /**
   * Named formatters for value → display transformation
   *
   * Transform form values before displaying in inputs.
   *
   * @example
   * ```tsx
   * formatters={{
   *   currency: (v) => `$${Number(v).toFixed(2)}`,
   *   uppercase: (v) => String(v).toUpperCase(),
   * }}
   * ```
   */
  formatters?: Record<string, (value: unknown) => unknown>;

  /**
   * Named parsers for input → value transformation
   *
   * Transform user input before storing in form state.
   *
   * @example
   * ```tsx
   * parsers={{
   *   number: (v) => Number(v) || 0,
   *   trim: (v) => String(v).trim(),
   * }}
   * ```
   */
  parsers?: Record<string, (value: unknown) => unknown>;

  /**
   * Named validators and validator factories
   *
   * Define reusable validation logic across forms.
   */
  validators?: ValidatorsConfig;

  /**
   * Error message templates by type key
   *
   * Map validation error types to human-readable messages.
   *
   * @example
   * ```tsx
   * errorMessages={{
   *   required: 'This field is required',
   *   minLength: 'Must be at least {min} characters',
   * }}
   * ```
   */
  errorMessages?: ErrorMessagesConfig;

  /**
   * Default template component for all inputs
   *
   * Wraps all inputs for consistent styling, labels, error display.
   */
  defaultInputTemplate?: ComponentType<InputTemplateProps>;

  /**
   * Named template components for specific input types
   *
   * Override the default template for specific input types.
   */
  inputTemplates?: Record<string, ComponentType<InputTemplateProps>>;

  /**
   * Default prop name for passSubscriptions (default: 'state')
   *
   * When a field has passSubscriptions: true, subscribed field states
   * are passed using this prop name.
   */
  defaultSubscriptionPropName?: string;

  /**
   * Static default props for all fields
   *
   * Props applied to every field unless overridden.
   */
  defaultFieldProps?: Record<string, unknown>;

  /**
   * Dynamic default props evaluated per-field
   *
   * Expression or function that computes default props.
   */
  selectDefaultFieldProps?: SelectValue;
}

/**
 * FormalityProvider - Global configuration provider for Formality
 *
 * Wraps your application to provide input types, transformers, validators,
 * and global defaults to all Formality forms.
 *
 * @example
 * ```tsx
 * import { FormalityProvider } from '@formality/react';
 *
 * const inputs = {
 *   textField: { component: TextInput, defaultValue: '' },
 *   switch: { component: Toggle, defaultValue: false },
 * };
 *
 * function App() {
 *   return (
 *     <FormalityProvider
 *       inputs={inputs}
 *       formatters={{ currency: (v) => `$${v}` }}
 *       errorMessages={{ required: 'Required' }}
 *     >
 *       <MyApp />
 *     </FormalityProvider>
 *   );
 * }
 * ```
 */
export function FormalityProvider({
  children,
  inputs,
  formatters = {},
  parsers = {},
  validators = {},
  errorMessages = {},
  defaultInputTemplate,
  inputTemplates = {},
  defaultSubscriptionPropName = 'state',
  defaultFieldProps = {},
  selectDefaultFieldProps,
}: FormalityProviderProps): JSX.Element {
  // Memoize context value to prevent unnecessary re-renders
  // in descendant components that consume ConfigContext
  const contextValue = useMemo<ConfigContextValue>(
    () => ({
      inputs,
      formatters,
      parsers,
      validators,
      errorMessages,
      defaultInputTemplate,
      inputTemplates,
      defaultSubscriptionPropName,
      defaultFieldProps,
      selectDefaultFieldProps,
    }),
    [
      inputs,
      formatters,
      parsers,
      validators,
      errorMessages,
      defaultInputTemplate,
      inputTemplates,
      defaultSubscriptionPropName,
      defaultFieldProps,
      selectDefaultFieldProps,
    ]
  );

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}
