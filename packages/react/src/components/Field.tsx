// @formality/react - Field Component
// Core field component with Controller integration

import {
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import {
  Controller,
  type ControllerFieldState,
  type UseFormStateReturn,
  type FieldValues,
} from 'react-hook-form';
import {
  resolveInputConfig,
  mergeFieldProps,
  resolveLabel,
  parse,
  format,
  runValidator,
  resolveErrorMessage,
} from '@formality/core';
import type { FieldConfig, InputConfig } from '@formality/core';
import { useFormContext } from '../context/FormContext';
import { useConfigContext } from '../context/ConfigContext';
import { useGroupContext } from '../context/GroupContext';
import { useConditions } from '../hooks/useConditions';
import { usePropsEvaluation } from '../hooks/usePropsEvaluation';
import { useInferredInputs } from '../hooks/useInferredInputs';
import { useSubscriptions } from '../hooks/useSubscriptions';
import type { WatcherSetterFn } from '../types';

/**
 * Field component props
 */
export interface FieldProps {
  /** Field name (must match a key in Form's config) */
  name: string;

  /** Override the input type from config */
  type?: string;

  /** Override disabled state */
  disabled?: boolean;

  /** Override hidden state (inverse of visible) */
  hidden?: boolean;

  /** Custom render function for advanced use cases */
  children?: ReactNode | ((api: FieldRenderAPI) => ReactNode);

  /** Whether to register this field in Form's field registry (default: true) */
  shouldRegister?: boolean;

  /** Additional props to pass to the input component */
  [key: string]: unknown;
}

/**
 * API passed to render function children
 */
export interface FieldRenderAPI {
  /** React Hook Form field state */
  fieldState: ControllerFieldState;

  /** The rendered input component */
  renderedField: ReactNode;

  /** Final merged props passed to input */
  fieldProps: Record<string, unknown>;

  /** Map of fields watching this field */
  watchers: Record<string, boolean>;

  /** React Hook Form form state */
  formState: UseFormStateReturn<FieldValues>;
}

/**
 * Field component - Renders a form field with full Formality integration
 *
 * Provides:
 * - React Hook Form Controller integration
 * - Props resolution (8-layer merge)
 * - Condition evaluation (disabled/visible/setValue)
 * - Value transformation (parse/format)
 * - Validation (field + type validators)
 * - Subscription management
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Field name="email" />
 *
 * // Override type
 * <Field name="status" type="select" />
 *
 * // Custom render
 * <Field name="name">
 *   {({ renderedField, fieldState }) => (
 *     <div className={fieldState.error ? 'has-error' : ''}>
 *       {renderedField}
 *     </div>
 *   )}
 * </Field>
 * ```
 */
export function Field({
  name,
  type: typeProp,
  disabled: disabledProp,
  hidden: hiddenProp,
  children,
  shouldRegister = true,
  ...restProps
}: FieldProps): JSX.Element | null {
  const {
    config,
    formConfig,
    methods,
    registerField,
    unregisterField,
    registerWatcherSetter,
    unregisterWatcherSetter,
    changeField,
    setFieldValidating,
  } = useFormContext();

  const providerConfig = useConfigContext();
  const groupContext = useGroupContext();

  // Get field config
  const fieldConfig: FieldConfig = config[name] ?? {};

  // Resolve type
  const type = typeProp ?? fieldConfig.type ?? 'textField';

  // Resolve input config (merge provider + form)
  const inputConfig = useMemo((): InputConfig => {
    const formInputs =
      typeof formConfig.inputs === 'function'
        ? formConfig.inputs(providerConfig.inputs)
        : formConfig.inputs ?? {};

    // Merge provider inputs with form-level overrides
    const mergedInputs: Record<string, InputConfig> = { ...providerConfig.inputs };
    for (const [key, override] of Object.entries(formInputs)) {
      if (mergedInputs[key]) {
        mergedInputs[key] = { ...mergedInputs[key], ...override } as InputConfig;
      }
    }

    return resolveInputConfig(type, mergedInputs) ?? { component: 'input', defaultValue: '' };
  }, [type, providerConfig.inputs, formConfig.inputs]);

  // === REGISTRATION ===

  useEffect(() => {
    if (shouldRegister) {
      registerField(name);
      return () => unregisterField(name);
    }
  }, [name, shouldRegister, registerField, unregisterField]);

  // === WATCHER STATE ===

  const [watchers, setWatchers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    registerWatcherSetter(name, setWatchers as WatcherSetterFn);
    return () => unregisterWatcherSetter(name);
  }, [name, registerWatcherSetter, unregisterWatcherSetter]);

  // === SUBSCRIPTIONS ===

  const inferredSubscriptions = useInferredInputs({
    selectProps: fieldConfig.selectProps,
    conditions: fieldConfig.conditions,
    subscribesTo: fieldConfig.subscribesTo,
  });

  // Merge with group subscriptions
  const allSubscriptions = useMemo(() => {
    return [...new Set([...inferredSubscriptions, ...groupContext.subscriptions])];
  }, [inferredSubscriptions, groupContext.subscriptions]);

  useSubscriptions(name, allSubscriptions);

  // === CONDITIONS ===

  const conditionResult = useConditions({
    conditions: fieldConfig.conditions ?? [],
    subscribesTo: fieldConfig.subscribesTo,
    props: { name },
  });

  // === APPLY SET VALUE FROM CONDITIONS ===
  // When a condition's set/selectSet evaluates, apply the value to the field
  // Priority: field-level conditions > group-level conditions
  // Store methods.setValue in a ref to avoid dependency issues
  const setValueRef = useRef(methods.setValue);
  setValueRef.current = methods.setValue;
  const getValuesRef = useRef(methods.getValues);
  getValuesRef.current = methods.getValues;

  // Determine effective setValue: field-level takes priority over group-level
  const effectiveSetValue = useMemo(() => {
    if (conditionResult.hasSetCondition) {
      return { hasCondition: true, value: conditionResult.setValue };
    }
    if (groupContext.state.hasSetCondition) {
      return { hasCondition: true, value: groupContext.state.setValue };
    }
    return { hasCondition: false, value: undefined };
  }, [
    conditionResult.hasSetCondition,
    conditionResult.setValue,
    groupContext.state.hasSetCondition,
    groupContext.state.setValue,
  ]);

  useEffect(() => {
    if (effectiveSetValue.hasCondition && effectiveSetValue.value !== undefined) {
      const currentValue = getValuesRef.current(name);
      // Only update if the value is actually different to avoid infinite loops
      if (currentValue !== effectiveSetValue.value) {
        setValueRef.current(name, effectiveSetValue.value, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: false,
        });
      }
    }
  }, [effectiveSetValue.hasCondition, effectiveSetValue.value, name]);

  // === DISABLED/VISIBLE RESOLUTION ===

  const isDisabled = useMemo(() => {
    // Resolution order: prop > config > condition > group > false
    if (disabledProp !== undefined) return disabledProp;
    if (fieldConfig.disabled !== undefined) return fieldConfig.disabled;
    if (conditionResult.hasDisabledCondition)
      return conditionResult.disabled ?? false;
    if (groupContext.state.isDisabled) return true;
    return false;
  }, [
    disabledProp,
    fieldConfig.disabled,
    conditionResult,
    groupContext.state.isDisabled,
  ]);

  const isVisible = useMemo(() => {
    // Resolution order: prop > config > condition > group > true
    if (hiddenProp !== undefined) return !hiddenProp;
    if (fieldConfig.hidden !== undefined) return !fieldConfig.hidden;
    if (conditionResult.hasVisibleCondition)
      return conditionResult.visible ?? true;
    if (!groupContext.state.isVisible) return false;
    return true;
  }, [hiddenProp, fieldConfig.hidden, conditionResult, groupContext.state.isVisible]);

  // === PROPS EVALUATION ===

  const evaluatedSelectProps = usePropsEvaluation({
    selectProps: fieldConfig.selectProps,
    subscribesTo: fieldConfig.subscribesTo,
    fieldName: name,
  });

  // Resolve label
  const label = useMemo(() => {
    return resolveLabel(name, fieldConfig, evaluatedSelectProps, restProps);
  }, [name, fieldConfig, evaluatedSelectProps, restProps]);

  // === VALIDATION ===

  const validationRules = useMemo(() => {
    return {
      ...fieldConfig.rules,
      validate: async (value: unknown) => {
        setFieldValidating(name, true);

        try {
          // Field-level validator
          if (fieldConfig.validator) {
            const result = await runValidator(
              fieldConfig.validator,
              value,
              methods.getValues(),
              providerConfig.validators
            );
            if (result !== true && result !== undefined) {
              return resolveErrorMessage(result, providerConfig.errorMessages);
            }
          }

          // Type-level validator
          if (inputConfig.validator) {
            const result = await runValidator(
              inputConfig.validator,
              value,
              methods.getValues(),
              providerConfig.validators
            );
            if (result !== true && result !== undefined) {
              return resolveErrorMessage(result, providerConfig.errorMessages);
            }
          }

          return true;
        } finally {
          setFieldValidating(name, false);
        }
      },
    };
  }, [
    fieldConfig.rules,
    fieldConfig.validator,
    inputConfig.validator,
    methods,
    providerConfig.validators,
    providerConfig.errorMessages,
    name,
    setFieldValidating,
  ]);

  // === CHANGE HANDLER ===

  const handleChange = useCallback(
    (onChange: (value: unknown) => void) => (newValue: unknown) => {
      // Parse value
      const parsedValue = parse(
        newValue,
        inputConfig.parser,
        providerConfig.parsers
      );

      // Update form value
      onChange(parsedValue);

      // Notify subscribers
      changeField(name, parsedValue);
    },
    [inputConfig.parser, providerConfig.parsers, changeField, name]
  );

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // === RENDER ===

  return (
    <Controller
      control={methods.control}
      name={name}
      rules={validationRules}
      render={({ field, fieldState, formState }) => {
        // Format value for display
        const formattedValue = format(
          field.value,
          inputConfig.formatter,
          providerConfig.formatters
        );

        // Merge props (8 layers)
        const finalProps = mergeFieldProps({
          providerDefaultFieldProps: providerConfig.defaultFieldProps,
          providerSelectDefaultFieldProps: {}, // Evaluated at provider level if needed
          formDefaultFieldProps: formConfig.defaultFieldProps,
          formSelectDefaultFieldProps: {}, // Evaluated at form level if needed
          inputProps: inputConfig.props,
          fieldConfigProps: fieldConfig.props,
          selectProps: evaluatedSelectProps,
          componentProps: restProps,
          coreProps: {
            name,
            label,
            disabled: isDisabled,
            error: fieldState.error?.message,
            [inputConfig.inputFieldProp ?? 'value']: formattedValue,
            onChange: handleChange(field.onChange),
            onBlur: field.onBlur,
            ref: field.ref,
          },
        });

        // Get component
        const Component = inputConfig.component as React.ComponentType<any>;

        // Render through template if present
        const template =
          inputConfig.template ??
          providerConfig.inputTemplates[type] ??
          providerConfig.defaultInputTemplate;

        const TemplateComponent = template as
          | React.ComponentType<any>
          | undefined;

        const renderedField = TemplateComponent ? (
          <TemplateComponent
            Field={Component}
            fieldProps={finalProps}
            fieldState={fieldState}
            formState={formState}
          />
        ) : (
          <Component {...finalProps} />
        );

        // Render children if function
        if (typeof children === 'function') {
          const result = children({
            fieldState,
            renderedField,
            fieldProps: finalProps,
            watchers,
            formState,
          });
          // Ensure we return a valid ReactElement
          return <>{result}</>;
        }

        return renderedField as React.ReactElement;
      }}
    />
  );
}
