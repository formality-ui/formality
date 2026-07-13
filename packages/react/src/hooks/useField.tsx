// @formality-ui/react - useField Hook
// RHF Controller integration for a single Field (PRD §1.3.3 / §5.3 / §20)

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
 * Parameters for {@link useField}.
 *
 * Mirrors the subset of `FieldProps` (in `../components/Field`) that the hook
 * consumes as the single seam for **RHF Controller integration** (gap_analysis.md
 * **G6**; PRD §1.3.3).
 *
 * Per PRD §1.3.3, `hooks/useField` is the module that owns **RHF Controller
 * integration** for a field — "Uses Core: transform/pipeline, validation/
 * validate". This interface is the **input contract** for that module: it
 * carries the field identity + the overrides + the passthrough props threaded
 * into the parse/format pipeline (§5.3.5), change handler (§5.3.6), validation
 * wiring (§5.3.7), forwardRef delivery (§20.1), and template/host rendering
 * (§5.3.8).
 *
 * Generic over `TName` (default `string`) so a narrowed name type from
 * `FieldProps<TName>` can be threaded straight through (PRD §C.4 / T2.1). The
 * default keeps a bare `UseFieldParams` identical to `UseFieldParams<string>`.
 *
 * @template TName - Field name literal/union type (default `string`).
 */
export interface UseFieldParams<TName extends string = string> {
  /**
   * Field name (must match a key in Form's config). When `TName` is narrowed,
   * this is checked against `TName` at compile time.
   */
  name: TName;

  /** Override the input type resolved from config. */
  type?: string;

  /**
   * Override disabled state. Highest priority in the §5.3.4 disabled
   * resolution (prop > condition > config).
   */
  disabled?: boolean;

  /** Override hidden state (inverse of visible). */
  hidden?: boolean;

  /**
   * Whether to register this field in Form's field registry (default `true`).
   *
   * NOTE: the registration `useEffect` itself is OWNED by the `<Field>`
   * component (contract bullet b) — this flag is threaded through so a future
   * direct-hook consumer can opt out. `useField` does NOT call
   * `registerField`/`unregisterField`.
   */
  shouldRegister?: boolean;

  /**
   * Per-field input-config override. Merged at the highest-priority layer over
   * provider/form config (e.g. per-field debounce). See `resolveInputConfig`.
   */
  inputConfig?: Partial<InputConfig>;

  /**
   * Optional render-prop. Applied INSIDE the hook's Controller render callback
   * (§5.3.8) against {@link UseFieldReturn}, so the render-prop always sees the
   * live `fieldState`/`formState`/`fieldProps` values.
   */
  children?: ReactNode | ((api: UseFieldReturn) => ReactNode);

  /**
   * Additional props forwarded to the input component (the 8-layer
   * `componentProps` merge layer, §5.3.2). Captured by `mergeFieldProps`.
   */
  [key: string]: unknown;
}

/**
 * Return value of {@link useField}.
 *
 * **Structurally identical** to `FieldRenderAPI` (in `../components/Field`) —
 * the data the render layer (template / host / render-prop `children`) consumes.
 * This equivalence is enforced bidirectionally by
 * `__typechecks__/useField.test-d.ts`.
 *
 * Per PRD §1.3.3, the hook owns the RHF Controller integration, so the fields
 * below are exactly the Controller-produced state the render layer needs:
 * `fieldState` + `formState` come from the Controller render callback;
 * `renderedField` is the RAW rendered input (template/component/host) when
 * visible, `null` when hidden (the Controller mounts ONLY when visible, so
 * hidden fields are not RHF-registered — §5.3.8 / §20);
 * `fieldProps` is the final 8-layer-merged props (§5.3.2, via `mergeFieldProps`);
 * `watchers` is the map of fields currently watching this field (§5.3.1 step 3).
 */
export interface UseFieldReturn {
  /**
   * RHF field state from the Controller render callback
   * (`invalid` / `isTouched` / `isDirty` / `error` / …).
   */
  fieldState: ControllerFieldState;

  /**
   * The RAW rendered input (template / component / host element), or `null`
   * when the field is not visible. The render-prop `children` is applied
   * INSIDE the Controller render callback that produces this element.
   */
  renderedField: ReactNode;

  /**
   * Final merged props passed to the input — the output of the 8-layer
   * `mergeFieldProps` pipeline (§5.3.2).
   */
  fieldProps: Record<string, unknown>;

  /**
   * Map of fields watching this field (`true` = currently subscribed). Populated
   * via the watcher-setter registered with `useSubscriptions` (§5.3.1 step 3).
   */
  watchers: Record<string, boolean>;

  /**
   * RHF form state from the Controller. Typed as `UseFormStateReturn<FieldValues>`
   * to match `FieldRenderAPI` exactly (NOT bare `UseFormStateReturn`).
   */
  formState: UseFormStateReturn<FieldValues>;
}

/**
 * useField — RHF Controller integration for a single Field (PRD §1.3.3 / §20).
 *
 * This hook owns the **entire** Controller lifecycle for one field: it reads
 * the form/config/group contexts, resolves the input config, sets up watchers
 * + subscriptions + conditions, builds the setValue effect (ref pattern,
 * §7.1.1), resolves the disabled/visible/label state, builds the validation
 * rules + change handler, mounts the `<Controller>` element with its full
 * render callback (format → state injection → `mergeFieldProps` 8-layer merge →
 * forwardRef delivery §20.1/§20.4 → template/host/component → render-prop
 * `children`), and returns the {@link UseFieldReturn}.
 *
 * ## Responsibilities (PRD §1.3.3 + §5.3.x + §20)
 *
 * - **Controller integration** — wraps RHF's `<Controller>` render callback.
 *   The `<Controller>` mounts ONLY when the field is visible (the
 *   `renderedField` is `null` when hidden), preserving the
 *   conditionally-hidden-field invariant (hidden fields are NOT RHF-registered).
 * - **Parse/format pipeline (§5.3.5)** — Core `parse` / `format` from
 *   `@formality-ui/core` (`transform/pipeline`).
 * - **Change handler (§5.3.6)** — `changeField` + watcher fan-out.
 * - **Validation (§5.3.7)** — Core `runValidator` / `resolveErrorMessage`
 *   (`validation/validate`).
 * - **forwardRef delivery (§20.1)** — delivers the input's ref via the merged
 *   props' `forwardRef` key (the CURRENT implemented behavior — NOT the legacy
 *   `ref` key shown in the stale §5.3.2 pseudo-code). The host-element path
 *   (§20.4 narrow exception) translates `forwardRef` back into React's special
 *   `ref` key for string components.
 * - **Props merge (§5.3.2)** — `resolveInputConfig` + `resolveLabel` +
 *   `mergeFieldProps` (the 8-layer merge).
 * - **Template/host render (§5.3.8)** — produces the RAW `renderedField`.
 *
 * It consumes these context hooks (`useFormContext`, `useConfigContext`,
 * `useGroupContext`) and composed hooks (`useConditions`, `usePropsEvaluation`,
 * `useInferredInputs`, `useSubscriptions`), and the Core fns above.
 *
 * NOTE: field **registration** (`registerField`/`unregisterField`) is OWNED by
 * the `<Field>` component (contract bullet b), NOT this hook. The hook reads
 * `useFormContext()` for everything else (config, methods, changeField,
 * setFieldValidating, register/unregisterWatcherSetter).
 *
 * @param params - Field parameters (see {@link UseFieldParams}).
 * @returns The Controller-produced state + the RAW rendered input
 *   (see {@link UseFieldReturn}).
 *
 * @example
 * ```tsx
 * // Direct hook usage (custom layout):
 * function MyField() {
 *   const { renderedField, fieldState } = useField({ name: "email" });
 *   return <div className={fieldState.error ? "has-error" : ""}>{renderedField}</div>;
 * }
 *
 * // Equivalent via the thin wrapper component:
 * <Field name="email" />;
 * ```
 */
export function useField<TName extends string = string>({
  name,
  type: typeProp,
  disabled: disabledProp,
  hidden: hiddenProp,
  children,
  inputConfig: inputConfigProp,
  ...restProps
}: UseFieldParams<TName>): UseFieldReturn {
  const {
    config,
    formConfig,
    methods,
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

  // === CONTRACT REFS ===
  //
  // `fieldState`/`formState`/`finalProps` only exist INSIDE the Controller
  // render callback. To honor the {@link UseFieldReturn} contract for direct-
  // hook consumers without setState-during-render (which would trip
  // "Maximum update depth" — the exact regression
  // Field.subscriptionStability.test.tsx guards), we capture them into refs
  // here. The `<Field>` component only consumes `renderedField`, and the
  // render-prop `children` is applied INSIDE the callback with the live values,
  // so these refs need not be reactive for the Field tests.
  const fieldStateRef = useRef<ControllerFieldState>(
    {} as ControllerFieldState,
  );
  const formStateRef = useRef<UseFormStateReturn<FieldValues>>(
    {} as UseFormStateReturn<FieldValues>,
  );
  const fieldPropsRef = useRef<Record<string, unknown>>({});

  // === RENDERED FIELD ===
  //
  // The hook owns the `<Controller>` element + its ENTIRE render callback
  // (including the render-prop `children` application). `renderedField` is the
  // `<Controller>` element when visible, `null` when hidden — so the Controller
  // mounts ONLY when visible (hidden fields are NOT RHF-registered).
  const renderedField: ReactNode = isVisible ? (
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

        // Capture contract values for direct-hook consumers (best-effort;
        // Field only consumes `renderedField`).
        fieldStateRef.current = fieldState;
        formStateRef.current = formState;
        fieldPropsRef.current = finalProps;

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

        let renderedFieldEl: React.ReactElement;
        if (TemplateComponent) {
          renderedFieldEl = (
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
          renderedFieldEl = createElement(inputConfig.component as string, {
            ...strippedHostProps,
            ref: (finalProps as Record<string, unknown>)
              .forwardRef as Ref<HTMLElement>,
          });
        } else {
          // Component path: forwardRef-exclusive per PRD §20.4.
          renderedFieldEl = <Component {...finalProps} />;
        }

        // Render children if function
        if (typeof children === "function") {
          const result = children({
            fieldState,
            renderedField: renderedFieldEl,
            fieldProps: finalProps,
            watchers,
            formState,
          });
          // Ensure we return a valid ReactElement
          return <>{result}</>;
        }

        return renderedFieldEl as React.ReactElement;
      }}
    />
  ) : null;

  return {
    fieldState: fieldStateRef.current,
    renderedField,
    fieldProps: fieldPropsRef.current,
    watchers,
    formState: formStateRef.current,
  };
}
