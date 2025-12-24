// @formality-ui/react - ConfigContext
// Global configuration context for Formality

import { createContext, useContext, type ComponentType } from 'react';
import type {
  InputConfig,
  ValidatorsConfig,
  ErrorMessagesConfig,
  SelectValue,
} from '@formality-ui/core';
import type { InputTemplateProps } from '../types';

/**
 * ConfigContextValue - Global configuration provided by FormalityProvider
 *
 * Contains all input types, transformers, validators, and global defaults
 * that apply across all forms in the application.
 */
export interface ConfigContextValue {
  /** Input type definitions (e.g., textField, switch, autocomplete) */
  inputs: Record<string, InputConfig>;

  /** Named formatters for value → display transformation */
  formatters: Record<string, (value: unknown) => unknown>;

  /** Named parsers for input → value transformation */
  parsers: Record<string, (value: unknown) => unknown>;

  /** Named validators and validator factories */
  validators: ValidatorsConfig;

  /** Error message templates by type key */
  errorMessages: ErrorMessagesConfig;

  /** Default template component for all inputs */
  defaultInputTemplate?: ComponentType<InputTemplateProps>;

  /** Named template components for specific input types */
  inputTemplates: Record<string, ComponentType<InputTemplateProps>>;

  /** Default prop name for passSubscriptions (default: 'state') */
  defaultSubscriptionPropName: string;

  /** Static default props for all fields */
  defaultFieldProps: Record<string, unknown>;

  /** Dynamic default props evaluated per-field */
  selectDefaultFieldProps?: SelectValue;
}

/**
 * Default configuration context values
 *
 * These are sensible defaults that can be overridden by FormalityProvider.
 * Per PRD 5.1: defaultSubscriptionPropName defaults to 'state'.
 */
const defaultConfigContext: ConfigContextValue = {
  inputs: {},
  formatters: {},
  parsers: {},
  validators: {},
  errorMessages: {},
  inputTemplates: {},
  defaultSubscriptionPropName: 'state',
  defaultFieldProps: {},
};

/**
 * ConfigContext - React context for global Formality configuration
 *
 * Provides access to input types, transformers, validators, and
 * global defaults to all forms and fields in the application.
 */
export const ConfigContext = createContext<ConfigContextValue>(defaultConfigContext);

ConfigContext.displayName = 'FormalityConfigContext';

/**
 * useConfigContext - Hook to access global configuration
 *
 * @returns The current ConfigContextValue from the nearest FormalityProvider
 */
export function useConfigContext(): ConfigContextValue {
  return useContext(ConfigContext);
}
