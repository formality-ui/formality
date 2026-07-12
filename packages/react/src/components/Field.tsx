// @formality-ui/react - Field Component
// Core field component with Controller integration

import {
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
  createElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  Controller,
  useWatch,
  type ControllerFieldState,
  type UseFormStateReturn,
  type FieldValues,
} from "react-hook-form";
import {
  resolveInputConfig,
  mergeFieldProps,
  resolveLabel,
  parse,
  format,
  runValidator,
  resolveErrorMessage,
} from "@formality-ui/core";
import type { FieldConfig, InputConfig } from "@formality-ui/core";
import type { FormalityFieldComponentProps } from "../overlays";
import { useFormContext } from "../context/FormContext";
import { useConfigContext } from "../context/ConfigContext";
import { useGroupContext } from "../context/GroupContext";
import { useConditions } from "../hooks/useConditions";
import { usePropsEvaluation } from "../hooks/usePropsEvaluation";
import { useInferredInputs } from "../hooks/useInferredInputs";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { makeProxyState } from "../utils/makeProxyState";
import type { CustomFieldState, WatcherSetterFn } from "../types";

/**
 * Field component props.
 *
 * `FieldProps` is generic over the field `name`:
 * `FieldProps<TName extends string = string>`. The default `TName = string`
 * means `<Field name={anyString} />` compiles unchanged (no migration) and a
 * bare `FieldProps` is identical to `FieldProps<string>`.
 *
 * To get compile-time checking of the field name, narrow `TName` explicitly —
 * e.g. `FieldProps<"name" | "email">` or a wrapper that threads a
 * `keyof ClientValues & string`. With a narrowed `TName`, a typo like
 * `name="ofice"` is rejected at compile time instead of silently rendering
 * nothing (the second half of PRD §C.4 / T2.1's "silent no-op" fix).
 *
 * Automatic per-form narrowing — where a `<Field>` automatically narrows its
 * `name` against the enclosing `<Form<TFieldValues>>`'s key set — is a planned
 * follow-up (PRD §C.4 T2.1) and is explicitly deferrable.
 *
 * @example
 * ```tsx
 * // Default usage — any string name compiles (unchanged behavior):
 * <Field name="email" />;
 *
 * // Opt-in strict usage — typo names are compile errors:
 * type Names = "name" | "email";
 * const props: FieldProps<Names> = { name: "email" };
 * ```
 */
export interface FieldProps<TName extends string = string> {
  /**
   * Field name (must match a key in Form's config).
   *
   * When `FieldProps` is narrowed (e.g. `FieldProps<"name" | "email">`), the
   * name is checked against `TName` at compile time. With the default
   * (`FieldProps` / `FieldProps<string>`), any string is accepted.
   */
  name: TName;

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

  /** Override input config for this field (e.g., debounce setting) */
  inputConfig?: Partial<InputConfig>;

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
export function Field<TName extends string = string>({
  name,
  type: typeProp,
  disabled: disabledProp,
  hidden: hiddenProp,
  children,
  shouldRegister = true,
  inputConfig: inputConfigProp,
  ...restProps
}: FieldProps<TName>): JSX.Element | null {
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
  const type = typeProp ?? fieldConfig.type ?? "textField";

  // Resolve input config (merge provider + form + prop)
  const inputConfig = useMemo((): InputConfig => {
    const formInputs =
      typeof formConfig.inputs === "function"
        ? formConfig.inputs(providerConfig.inputs)
        : (formConfig.inputs ?? {});

    // Merge provider inputs with form-level overrides
    const mergedInputs: Record<string, InputConfig> = {
      ...providerConfig.inputs,
    };
    for (const [key, override] of Object.entries(formInputs)) {
      if (mergedInputs[key]) {
        mergedInputs[key] = {
          ...mergedInputs[key],
          ...override,
        } as InputConfig;
      }
    }

    const baseInputConfig = resolveInputConfig(type, mergedInputs) ?? {
      component: "input",
      defaultValue: "",
    };

    // Merge with inputConfig prop (prop has highest priority)
    return inputConfigProp
      ? ({ ...baseInputConfig, ...inputConfigProp } as InputConfig)
      : baseInputConfig;
  }, [type, providerConfig.inputs, formConfig.inputs, inputConfigProp]);

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
    return [
      ...new Set([...inferredSubscriptions, ...groupContext.subscriptions]),
    ];
  }, [inferredSubscriptions, groupContext.subscriptions]);

  useSubscriptions(name, allSubscriptions);

  // === CONDITIONS ===

  const conditionResult = useConditions({
    conditions: fieldConfig.conditions ?? [],
    subscribesTo: fieldConfig.subscribesTo,
    props: { name },
    allFieldsConfig: config, // Pass all field configs for two-pass evaluation of disabled states
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
    if (
      effectiveSetValue.hasCondition &&
      effectiveSetValue.value !== undefined
    ) {
      const currentValue = getValuesRef.current(name);
      // Only update if the value is actually different to avoid infinite loops
      if (currentValue !== effectiveSetValue.value) {
        // `methods` comes from the un-parameterized `useFormContext()` (→
        // UseFormReturn<FieldValues>), so setValue's name param is
        // FieldPath<FieldValues> === string at runtime. Our generic `name: TName`
        // (extends string) is structurally a string; cast for RHF's deep
        // conditional type. See PRP P1.M1.T1.S2 gotchas.
        setValueRef.current(name as string, effectiveSetValue.value, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: false,
        });
      }
    }
  }, [effectiveSetValue.hasCondition, effectiveSetValue.value, name]);

  // === PROPS EVALUATION ===
  //
  // Evaluated before disabled/visible resolution so that the props-merge
  // layers (selectProps / selectDefaultFieldProps) can contribute `disabled`.
  const { providerSelectProps, formSelectProps, fieldSelectProps } =
    usePropsEvaluation({
      selectProps: fieldConfig.selectProps,
      formDefaultFieldProps: formConfig.selectDefaultFieldProps,
      providerDefaultFieldProps: providerConfig.selectDefaultFieldProps,
      subscribesTo: fieldConfig.subscribesTo,
      fieldName: name,
    });

  // === DISABLED/VISIBLE RESOLUTION ===
  //
  // `disabled` is resolved here (rather than flowing solely through the
  // props-merge pipeline) because it participates in the condition system's
  // two-pass evaluation (other fields can match on this field's `isDisabled`).
  // The resolved boolean is emitted as `coreProps.disabled`.
  //
  // To keep the documented props-merge layers (`selectProps`,
  // `selectDefaultFieldProps`, `defaultFieldProps`, `inputConfig.props`,
  // `fieldConfig.props`) able to disable a field — which they could not when
  // an always-emitted boolean `coreProps.disabled` clobbered them — the
  // resolution order consults those layers as a final fallback before
  // defaulting to `false`. The layers are consulted in `mergeFieldProps`
  // priority order (highest first), so a higher-priority layer wins.
  // See PRD §5.3.2 merge pipeline.
  const isDisabled = useMemo(() => {
    // Resolution order: prop > config > condition > group > props-merge > false
    if (disabledProp !== undefined) return disabledProp;
    if (fieldConfig.disabled !== undefined) return fieldConfig.disabled;
    if (conditionResult.hasDisabledCondition)
      return conditionResult.disabled ?? false;
    if (groupContext.state.isDisabled) return true;

    // Props-merge layers (evaluated dynamic props + static props), consulted
    // in `mergeFieldProps` priority order (highest first). Each layer may set
    // `disabled` via an evaluated expression (e.g. `selectProps: { disabled:
    // "!country" }`) or statically (e.g. `defaultFieldProps: { disabled: true }`).
    const propsLayers = [
      fieldSelectProps, // layer 2: field-level selectProps
      formSelectProps, // layer 5: form-level selectDefaultFieldProps
      providerSelectProps, // layer 7: provider-level selectDefaultFieldProps
      inputConfig.props, // layer 4: input config props
      fieldConfig.props, // layer 3: field config props
      formConfig.defaultFieldProps, // layer 6: form-level defaultFieldProps
      providerConfig.defaultFieldProps, // layer 8: provider-level defaultFieldProps
    ];
    for (const layer of propsLayers) {
      const layerDisabled = layer?.disabled;
      if (layerDisabled !== undefined) return Boolean(layerDisabled);
    }

    return false;
  }, [
    disabledProp,
    fieldConfig.disabled,
    fieldConfig.props,
    conditionResult,
    groupContext.state.isDisabled,
    fieldSelectProps,
    formSelectProps,
    providerSelectProps,
    inputConfig.props,
    formConfig.defaultFieldProps,
    providerConfig.defaultFieldProps,
  ]);

  const isVisible = useMemo(() => {
    // Resolution order: prop > config > condition > group > true
    if (hiddenProp !== undefined) return !hiddenProp;
    if (fieldConfig.hidden !== undefined) return !fieldConfig.hidden;
    if (conditionResult.hasVisibleCondition)
      return conditionResult.visible ?? true;
    if (!groupContext.state.isVisible) return false;
    return true;
  }, [
    hiddenProp,
    fieldConfig.hidden,
    conditionResult,
    groupContext.state.isVisible,
  ]);

  // Resolve label
  const label = useMemo(() => {
    return resolveLabel(name, fieldConfig, fieldSelectProps, restProps);
  }, [name, fieldConfig, fieldSelectProps, restProps]);

  // === STATE INJECTION (provideState / passSubscriptions) ===
  //
  // FieldConfig.provideState injects the OWN field's state (value, isTouched,
  // isDirty, invalid, error) under the configured prop name (default 'state').
  // FieldConfig.passSubscriptions injects the SUBSCRIBED fields' states under
  // a prop name (default 'state', override via passSubscriptionsAs). Both are
  // documented in PRD §3.2 / §5.3 / Appendix A and exercised by
  // examples/07-advanced-features.tsx.
  //
  // `provideState` reads from the Controller's fieldState (available in the
  // render callback below); `passSubscriptions` watches the inferred
  // subscriptions here so the component re-renders when they change.
  const passSubscriptionsEnabled = fieldConfig.passSubscriptions === true;
  const provideStateEnabled = fieldConfig.provideState === true;

  // Watch subscribed field values for passSubscriptions (only when enabled to
  // avoid unnecessary subscriptions).
  const subscribedWatchNames = useMemo(
    () =>
      passSubscriptionsEnabled && allSubscriptions.length > 0
        ? allSubscriptions
        : [],
    [passSubscriptionsEnabled, allSubscriptions],
  );
  const subscribedValues = useWatch({
    control: methods.control,
    name: subscribedWatchNames.length > 0 ? (subscribedWatchNames as any) : [],
  });

  // Build the subscribed-state map (Record<name, CustomFieldState>).
  const subscribedState = useMemo(() => {
    if (!passSubscriptionsEnabled || subscribedWatchNames.length === 0) {
      return undefined;
    }
    const result: Record<string, CustomFieldState> = {};
    const values: unknown[] = Array.isArray(subscribedValues)
      ? subscribedValues
      : [subscribedValues];
    subscribedWatchNames.forEach((fieldName, i) => {
      const fs = methods.getFieldState(fieldName as any);
      result[fieldName] = makeProxyState({
        value: values[i],
        isTouched: fs.isTouched,
        isDirty: fs.isDirty,
        isValidating: fs.isValidating,
        error: fs.error as CustomFieldState["error"],
        invalid: fs.invalid,
      });
    });
    return result;
  }, [
    passSubscriptionsEnabled,
    subscribedWatchNames,
    subscribedValues,
    methods,
  ]);

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
              providerConfig.validators,
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
              providerConfig.validators,
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
        providerConfig.parsers,
      );

      // Update form value
      onChange(parsedValue);

      // Notify subscribers
      changeField(name, parsedValue, inputConfig);
    },
    [
      inputConfig.parser,
      providerConfig.parsers,
      changeField,
      name,
      inputConfig,
    ],
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
          providerConfig.formatters,
        );

        // === STATE INJECTION (provideState / passSubscriptions) ===
        //
        // Inject field/subscribed state under the configured prop name. This
        // is delivered through `coreProps` so it reaches the plain-component,
        // template, and render-prop paths uniformly (PRD §3.2 / §5.3).
        //
        // `formState` (PRD §C.4 / T3.1) is delivered to the plain-component
        // path ONLY when the component has opted into Formality state via
        // `provideState` or `passSubscriptions`. This satisfies the
        // FormalityFieldComponentProps contract (where the component author has
        // already agreed to destructure Formality-injected props) while
        // avoiding leaking `formState` onto the DOM for ordinary components
        // that spread props onto a host element. Templates and render-prop
        // children always receive `formState` (below).
        const stateInjection: Record<string, unknown> = {};
        if (provideStateEnabled) {
          stateInjection[providerConfig.defaultSubscriptionPropName] =
            makeProxyState({
              value: field.value,
              isTouched: fieldState.isTouched,
              isDirty: fieldState.isDirty,
              isValidating: fieldState.isValidating,
              error: fieldState.error as CustomFieldState["error"],
              invalid: fieldState.invalid,
            });
        }
        if (passSubscriptionsEnabled && subscribedState) {
          const subsPropName =
            fieldConfig.passSubscriptionsAs ??
            providerConfig.defaultSubscriptionPropName;
          stateInjection[subsPropName] = subscribedState;
        }
        // Issue 6: deliver formState to plain components that have opted into
        // Formality state injection, so the FormalityFieldComponentProps type
        // contract holds for those components (PRD §C.4 / T3.1).
        if (provideStateEnabled || passSubscriptionsEnabled) {
          stateInjection.formState = formState;
        }

        // Merge props (8 layers)
        const finalProps = mergeFieldProps({
          providerDefaultFieldProps: providerConfig.defaultFieldProps,
          providerSelectDefaultFieldProps: providerSelectProps,
          formDefaultFieldProps: formConfig.defaultFieldProps,
          formSelectDefaultFieldProps: formSelectProps,
          inputProps: inputConfig.props,
          fieldConfigProps: fieldConfig.props,
          selectProps: fieldSelectProps,
          componentProps: restProps,
          coreProps: {
            name,
            label,
            disabled: isDisabled,
            error: fieldState.error?.message,
            [inputConfig.inputFieldProp ?? "value"]: formattedValue,
            onChange: handleChange(field.onChange),
            onBlur: field.onBlur,
            forwardRef: field.ref,
            ...stateInjection,
          },
        });

        // Get component
        const Component =
          inputConfig.component as React.ComponentType<FormalityFieldComponentProps>;

        // Host-component fallback (PRD §20.4 narrow exception).
        //
        // When `inputConfig.component` is a string host tag (the degenerate
        // `component: "input"` fallback used when an input type is unknown /
        // misconfigured), React only intercepts its SPECIAL `ref` key — NOT the
        // `forwardRef` prop that §20.1/§20.4 deliver for real components. If we
        // spread `finalProps` unchanged onto a host element, RHF's ref callback
        // (delivered as `forwardRef`) is never attached → focus-on-error breaks,
        // and `forwardRef` leaks to the DOM as a spurious `forwardref` attribute.
        //
        // To keep that fallback path functional we translate `forwardRef` back
        // into the special `ref` key (and drop the `forwardRef` prop) ONLY for
        // host-element rendering. Component rendering stays strictly
        // `forwardRef`-exclusive per §20.4 — this branch never runs for real
        // consumer components (which are functions/objects, not strings).
        const isHostComponent = typeof inputConfig.component === "string";

        // Render through template if present
        const template =
          inputConfig.template ??
          providerConfig.inputTemplates[type] ??
          providerConfig.defaultInputTemplate;

        const TemplateComponent = template as
          | React.ComponentType<any>
          | undefined;

        let renderedField: React.ReactElement;
        if (TemplateComponent) {
          renderedField = (
            <TemplateComponent
              Field={Component}
              fieldProps={finalProps}
              fieldState={fieldState}
              formState={formState}
            />
          );
        } else if (isHostComponent) {
          // Host-element path: translate `forwardRef` back into React's special
          // `ref` key (see block comment above) so the bare fallback input still
          // wires RHF's ref callback and supports focus-on-error. Also strip
          // the Formality-injected non-DOM props (formState, state, and the
          // configured subscriptions prop name) so they don't leak to the DOM
          // as spurious attributes — mirrors the forwardRef handling. Cast to a
          // host tag; `isHostComponent` guarantees `inputConfig.component` is a
          // string here, and React's JSX for intrinsic elements accepts `ref`.
          const subsPropName =
            fieldConfig.passSubscriptionsAs ??
            providerConfig.defaultSubscriptionPropName;
          const strippedHostProps: Record<string, unknown> = {};
          const nonDomKeys = new Set([
            "forwardRef",
            "formState",
            "state",
            subsPropName,
          ]);
          for (const [key, value] of Object.entries(finalProps)) {
            if (!nonDomKeys.has(key)) {
              strippedHostProps[key] = value;
            }
          }
          renderedField = createElement(inputConfig.component as string, {
            ...strippedHostProps,
            ref: (finalProps as Record<string, unknown>)
              .forwardRef as Ref<HTMLElement>,
          });
        } else {
          // Component path: forwardRef-exclusive per PRD §20.4.
          renderedField = <Component {...finalProps} />;
        }

        // Render children if function
        if (typeof children === "function") {
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
