// @formality/core - Configuration Merging
// Pure functions for merging configuration layers
// ZERO framework dependencies

import type {
  InputConfig,
  FieldConfig,
  FormConfig,
  FormalityProviderConfig,
} from '../types';

/**
 * Deep merge two objects, with the second object taking precedence
 *
 * @param base - Base object
 * @param override - Override object (takes precedence)
 * @returns Merged object
 */
export function deepMerge<T extends object>(
  base: T,
  override: Partial<T> | undefined
): T {
  if (!override) {
    return base;
  }

  const result = { ...base } as T;

  for (const key in override) {
    const baseValue = base[key as keyof T];
    const overrideValue = override[key as keyof T];

    if (overrideValue === undefined) {
      continue;
    }

    if (
      typeof baseValue === 'object' &&
      baseValue !== null &&
      typeof overrideValue === 'object' &&
      overrideValue !== null &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      // Recursively merge objects
      result[key as keyof T] = deepMerge(
        baseValue as object,
        overrideValue as object
      ) as T[keyof T];
    } else {
      // Override value takes precedence
      result[key as keyof T] = overrideValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Merge input configurations from multiple sources
 *
 * Priority order (highest to lowest):
 * 1. Form-level inputs
 * 2. Provider-level inputs
 *
 * @param providerInputs - Provider input configs
 * @param formInputs - Form input configs (or function to transform)
 * @returns Merged input configs
 */
export function mergeInputConfigs(
  providerInputs: Record<string, InputConfig>,
  formInputs?: FormConfig['inputs']
): Record<string, InputConfig> {
  // No form inputs - return provider inputs
  if (!formInputs) {
    return providerInputs;
  }

  // Function form - allow form to transform all inputs
  if (typeof formInputs === 'function') {
    const transformed = formInputs(providerInputs);
    return mergeInputConfigs(providerInputs, transformed);
  }

  // Object form - merge each input config
  const result = { ...providerInputs };

  for (const [type, overrides] of Object.entries(formInputs)) {
    if (result[type]) {
      result[type] = deepMerge(result[type], overrides);
    } else {
      result[type] = overrides as InputConfig;
    }
  }

  return result;
}

/**
 * Resolve input config for a specific type
 *
 * @param type - Input type key
 * @param inputs - Merged input configs
 * @param defaultType - Default type if specified type not found
 * @returns Input config or undefined
 */
export function resolveInputConfig(
  type: string,
  inputs: Record<string, InputConfig>,
  defaultType: string = 'textField'
): InputConfig | undefined {
  return inputs[type] ?? inputs[defaultType];
}

/**
 * Resolve field type from multiple sources
 *
 * Priority order (highest to lowest):
 * 1. Component prop type
 * 2. Field config type
 * 3. Default type ('textField')
 *
 * @param componentType - Type from component props
 * @param fieldConfig - Field configuration
 * @param defaultType - Default type
 * @returns Resolved type
 */
export function resolveFieldType(
  componentType?: string,
  fieldConfig?: FieldConfig,
  defaultType: string = 'textField'
): string {
  return componentType ?? fieldConfig?.type ?? defaultType;
}

/**
 * Merge static props from multiple configuration layers
 *
 * Priority order (highest to lowest):
 * 1. Component props (from JSX)
 * 2. Field config selectProps (evaluated separately)
 * 3. Field config props
 * 4. Input config props
 * 5. Form-level selectDefaultFieldProps (evaluated separately)
 * 6. Form-level defaultFieldProps
 * 7. Provider-level selectDefaultFieldProps (evaluated separately)
 * 8. Provider-level defaultFieldProps
 *
 * NOTE: This function only merges STATIC props. Dynamic props (selectProps,
 * selectDefaultFieldProps) must be evaluated and merged separately.
 *
 * @param layers - Configuration layers from lowest to highest priority
 * @returns Merged static props
 */
export function mergeStaticProps(
  ...layers: Array<Record<string, unknown> | undefined>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const layer of layers) {
    if (layer) {
      Object.assign(result, layer);
    }
  }

  return result;
}

/**
 * Merge all field props following the priority order
 *
 * This is the main props merging function that combines:
 * - Static props from config layers
 * - Evaluated dynamic props
 * - Core field props
 *
 * @param options - All props sources
 * @returns Final merged props
 */
export function mergeFieldProps(options: {
  providerDefaultFieldProps?: Record<string, unknown>;
  providerSelectDefaultFieldProps?: Record<string, unknown>;
  formDefaultFieldProps?: Record<string, unknown>;
  formSelectDefaultFieldProps?: Record<string, unknown>;
  inputProps?: Record<string, unknown>;
  fieldConfigProps?: Record<string, unknown>;
  selectProps?: Record<string, unknown>;
  componentProps?: Record<string, unknown>;
  coreProps?: Record<string, unknown>;
}): Record<string, unknown> {
  const {
    providerDefaultFieldProps,
    providerSelectDefaultFieldProps,
    formDefaultFieldProps,
    formSelectDefaultFieldProps,
    inputProps,
    fieldConfigProps,
    selectProps,
    componentProps,
    coreProps,
  } = options;

  // Merge in priority order (later overrides earlier)
  return mergeStaticProps(
    providerDefaultFieldProps,
    providerSelectDefaultFieldProps,
    formDefaultFieldProps,
    formSelectDefaultFieldProps,
    inputProps,
    fieldConfigProps,
    selectProps,
    componentProps,
    coreProps // Core props always win (name, value, onChange, etc.)
  );
}

/**
 * Create a merged configuration context
 *
 * Combines provider and form configs into a single context object
 * for use during field rendering.
 *
 * @param providerConfig - Provider configuration
 * @param formConfig - Form configuration
 * @returns Merged configuration context
 */
export function createConfigContext(
  providerConfig: FormalityProviderConfig,
  formConfig?: FormConfig
): {
  inputs: Record<string, InputConfig>;
  formatters: Record<string, (value: unknown) => unknown>;
  parsers: Record<string, (value: unknown) => unknown>;
  validators: Record<string, unknown>;
  errorMessages: Record<string, string>;
  defaultFieldProps: Record<string, unknown>;
  selectDefaultFieldProps: unknown;
} {
  const mergedInputs = mergeInputConfigs(
    providerConfig.inputs,
    formConfig?.inputs
  );

  return {
    inputs: mergedInputs,
    formatters: providerConfig.formatters ?? {},
    parsers: providerConfig.parsers ?? {},
    validators: providerConfig.validators ?? {},
    errorMessages: providerConfig.errorMessages ?? {},
    defaultFieldProps: mergeStaticProps(
      providerConfig.defaultFieldProps,
      formConfig?.defaultFieldProps
    ),
    selectDefaultFieldProps:
      formConfig?.selectDefaultFieldProps ??
      providerConfig.selectDefaultFieldProps,
  };
}
