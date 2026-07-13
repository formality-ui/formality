// @formality-ui/react - Form Component
// Core form component with React Hook Form integration

import {
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  useForm,
  FormProvider,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { debounce } from "lodash-es";
import {
  resolveAllInitialValues,
  resolveFormTitle,
  evaluateDescriptor,
  buildFormContext,
  extractValueField,
  transformFieldName,
} from "@formality-ui/core";
import type {
  FormFieldsConfig,
  FormConfig,
  FormState,
  InputConfig,
} from "@formality-ui/core";
import { FormContext, type FormContextValue } from "../context/FormContext";
import { GroupContext } from "../context/GroupContext";
import { useConfigContext } from "../context/ConfigContext";
import { makeProxyState } from "../utils/makeProxyState";
import type { WatcherSetterFn, DebouncedFunction } from "../types";
import type { ReactFormFieldsConfig } from "../overlays";

/**
 * Form component props
 */
export interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  /** Form content - can be static children or render function */
  children: ReactNode | ((api: FormRenderAPI<TFieldValues>) => ReactNode);

  /** Field configurations */
  config: ReactFormFieldsConfig<TFieldValues>;

  /** Form-level configuration (title, groups, input overrides) */
  formConfig?: FormConfig;

  /** Submit handler */
  onSubmit?: (values: Partial<TFieldValues>) => void | Promise<void>;

  /** Initial record data */
  record?: Partial<TFieldValues>;

  /** Enable auto-save on field changes */
  autoSave?: boolean;

  /**
   * Form-level auto-save debounce, used as the fallback for any field whose
   * `InputConfig.debounce` is unset.
   * - `false` — submit immediately (no debounce timer).
   * - `number` — delay auto-save by this many milliseconds (default: 1000).
   *
   * A field can override its own cadence via `InputConfig.debounce`
   * (`false` for immediate, or a number for a per-field delay).
   */
  debounce?: number | false;

  /**
   * React Hook Form validation trigger `mode`, forwarded to `useForm({ mode })`.
   * One of `'onChange'` (default) | `'onBlur'` | `'onSubmit'` | `'onTouched'` |
   * `'all'`. Honored as-is — auto-save is mode-agnostic: its validity gates
   * trigger validation of the touched fields themselves via `methods.trigger`
   * (which ignores `mode`), so it works under any mode. See PRD §12.
   */
  mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";

  /** Form-level validation */
  validate?: (
    values: Partial<TFieldValues>,
  ) => Record<string, string> | Promise<Record<string, string>>;
}

/**
 * API passed to render function children
 */
export interface FormRenderAPI<TFieldValues extends FieldValues = FieldValues> {
  /** Fields in config but not rendered */
  unusedFields: string[];

  /** React Hook Form formState */
  formState: UseFormReturn<TFieldValues>["formState"];

  /** React Hook Form methods */
  methods: UseFormReturn<TFieldValues>;

  /**
   * Submit handler that runs the full Formality submission pipeline.
   *
   * Use this in place of `methods.handleSubmit` to ensure form-level
   * `validate` and `transformValuesForSubmit` (valueField extraction +
   * getSubmitField rename) are applied before `onSubmit` receives the values.
   * `methods.handleSubmit` remains available as a raw RHF escape hatch but
   * bypasses those transforms.
   */
  handleSubmit: (
    onSubmit: (values: Partial<TFieldValues>) => void | Promise<void>,
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;

  /** Resolved form title (static or evaluated) */
  resolvedTitle?: string;
}

/**
 * Default group context for fields outside FieldGroup
 */
const defaultGroupContext = {
  state: {
    isDisabled: false,
    isVisible: true,
    hasSetCondition: false,
    setValue: undefined,
    conditions: [],
    subscriptions: [],
  },
  subscriptions: [],
  inferredInputs: [],
  config: { conditions: [], subscribesTo: [] },
};

/**
 * Form component - Core form wrapper with React Hook Form integration
 *
 * Provides:
 * - FormContext for field registration and subscription management
 * - React Hook Form integration with mode: 'onChange'
 * - Auto-save with debounced submission
 * - Config-driven default values
 * - Unused fields tracking for config-driven rendering
 *
 * @example
 * ```tsx
 * <Form
 *   config={{
 *     name: { type: 'textField', label: 'Name' },
 *     email: { type: 'textField', label: 'Email' },
 *   }}
 *   onSubmit={(values) => console.log(values)}
 * >
 *   <Field name="name" />
 *   <Field name="email" />
 *   <button type="submit">Submit</button>
 * </Form>
 * ```
 */
export function Form<TFieldValues extends FieldValues = FieldValues>({
  children,
  config,
  formConfig = {},
  onSubmit,
  record,
  autoSave = false,
  debounce: debounceMs = 1000,
  mode,
  validate,
}: FormProps<TFieldValues>): JSX.Element {
  // Get provider configuration
  const providerConfig = useConfigContext();

  // Merge input configs (form overrides provider)
  const mergedInputs = useMemo((): Record<string, InputConfig> => {
    const formInputs =
      typeof formConfig.inputs === "function"
        ? formConfig.inputs(providerConfig.inputs)
        : (formConfig.inputs ?? {});

    // Merge provider inputs with form-level overrides
    const result: Record<string, InputConfig> = { ...providerConfig.inputs };
    for (const [key, override] of Object.entries(formInputs)) {
      if (result[key]) {
        result[key] = { ...result[key], ...override } as InputConfig;
      }
    }
    return result;
  }, [providerConfig.inputs, formConfig.inputs]);

  // Calculate default values from config
  //
  // Comprehensive baseline used for BOTH defaultValues and values.
  // MUST contain (a) every configured field key — including ones absent from the
  // record and ones whose input type has no defaultValue — so a rendered
  // <Field>'s Controller registration can NEVER introduce a key the RHF
  // baseline lacks (the root cause of the isDirty false-positive when a <Form>
  // mounts inside a deferred portal/Dialog under StrictMode); and (b) every
  // record key not in config (passthrough) so they survive into
  // getValues()/submit.
  const defaultValues = useMemo(() => {
    const resolved = resolveAllInitialValues(
      config,
      mergedInputs,
      record ?? {},
    );
    const baseline: Record<string, unknown> = {
      ...(record ?? {}),
      ...resolved,
    };
    // Ensure EVERY configured field is present, even if it resolved to
    // undefined (field absent from record AND its input type has no
    // defaultValue). This keeps _formValues and _defaultValues key-sets aligned
    // regardless of Controller registration timing.
    for (const fieldName of Object.keys(config)) {
      if (!(fieldName in baseline)) baseline[fieldName] = undefined;
    }
    return baseline;
  }, [config, mergedInputs, record]);

  // Initialize React Hook Form
  const methods = useForm<TFieldValues>({
    mode: mode ?? "onChange",
    defaultValues: defaultValues as any,
    values: defaultValues as any, // was: `record as any` — see baseline comment above
  });

  // === REGISTRIES ===

  // Field registration
  const fieldRegistry = useRef(new Set<string>());
  const [registeredFields, setRegisteredFields] = useState<Set<string>>(
    new Set(),
  );

  // Subscription management (inverted index: target → subscribers)
  const invertedSubscriptions = useRef(new Map<string, Set<string>>());

  // Watcher setters for notifying fields about subscribers
  const watcherSetters = useRef(new Map<string, WatcherSetterFn>());

  // Pending updates for fields not yet mounted
  const pendingWatcherUpdates = useRef(new Map<string, Set<string>>());

  // Validation state tracking
  const validatingFields = useRef(new Map<string, boolean>());

  // Auto-save tracking
  // pendingChanges accumulates field changes while debounce is pending
  const pendingChangedFields = useRef(new Set<string>());
  const pendingAffectedFields = useRef(new Set<string>());
  // executionVersion is incremented when a new auto-save starts, used to abort if new changes come in
  const executionVersionRef = useRef(0);

  // Per-field numeric debounce cache: interval (ms) → memoized debounced
  // auto-save fn. Fields that share the same numeric `InputConfig.debounce`
  // coalesce into a single timer (mirroring the single-timer behavior of the
  // Form-level debounce); fields with different numeric debounces each get
  // their own timer and fire on their own cadence.
  const fieldDebouncersRef = useRef(new Map<number, DebouncedFunction>());
  // Ref so `changeField` can reach the latest factory without being rebuilt
  // (and churning its context consumers) on every `executeAutoSave` change.
  const getOrCreateDebouncedRef = useRef<(ms: number) => DebouncedFunction>();

  // === REGISTRY OPERATIONS ===

  const registerField = useCallback((name: string) => {
    fieldRegistry.current.add(name);
    setRegisteredFields(new Set(fieldRegistry.current));
  }, []);

  const unregisterField = useCallback((name: string) => {
    fieldRegistry.current.delete(name);
    setRegisteredFields(new Set(fieldRegistry.current));
  }, []);

  // === SUBSCRIPTION OPERATIONS ===

  const addSubscription = useCallback((target: string, subscriber: string) => {
    // Update inverted index
    if (!invertedSubscriptions.current.has(target)) {
      invertedSubscriptions.current.set(target, new Set());
    }
    invertedSubscriptions.current.get(target)!.add(subscriber);

    // Notify target field if mounted
    const setter = watcherSetters.current.get(target);
    if (setter) {
      setter((prev) => ({ ...prev, [subscriber]: true }));
    } else {
      // Queue for later
      if (!pendingWatcherUpdates.current.has(target)) {
        pendingWatcherUpdates.current.set(target, new Set());
      }
      pendingWatcherUpdates.current.get(target)!.add(subscriber);
    }
  }, []);

  const removeSubscription = useCallback(
    (target: string, subscriber: string) => {
      // Perform removal (keep original optional chaining for safety)
      invertedSubscriptions.current.get(target)?.delete(subscriber);

      // Update watcher setter
      const setter = watcherSetters.current.get(target);
      if (setter) {
        setter((prev) => {
          const next = { ...prev };
          delete next[subscriber];
          return next;
        });
      }
    },
    [],
  );

  const registerWatcherSetter = useCallback(
    (name: string, setter: WatcherSetterFn) => {
      watcherSetters.current.set(name, setter);

      // Process pending subscriptions
      const pending = pendingWatcherUpdates.current.get(name);
      if (pending?.size) {
        setter((prev) => {
          const next = { ...prev };
          pending.forEach((sub) => {
            next[sub] = true;
          });
          return next;
        });
        pendingWatcherUpdates.current.delete(name);
      }
    },
    [],
  );

  const unregisterWatcherSetter = useCallback((name: string) => {
    watcherSetters.current.delete(name);
  }, []);

  // === FIELD STATE OPERATIONS ===

  /**
   * Get all fields affected by a change to the given field.
   * This traverses the subscription graph to find all dependents,
   * including transitive dependencies (A -> B -> C).
   */
  const getAffectedFields = useCallback((changedField: string): Set<string> => {
    const affected = new Set<string>();
    const toProcess = [changedField];

    while (toProcess.length > 0) {
      const current = toProcess.pop()!;
      const subscribers = invertedSubscriptions.current.get(current);
      if (subscribers) {
        for (const subscriber of subscribers) {
          if (!affected.has(subscriber)) {
            affected.add(subscriber);
            toProcess.push(subscriber); // Check for transitive dependencies
          }
        }
      }
    }

    return affected;
  }, []);

  const changeField = useCallback(
    (name: string, value: unknown, inputConfig?: InputConfig) => {
      // Auto-save trigger
      if (autoSave) {
        // Accumulate this change
        pendingChangedFields.current.add(name);

        // Add affected fields (those that depend on this field via conditions)
        const affected = getAffectedFields(name);
        for (const field of affected) {
          pendingAffectedFields.current.add(field);
        }

        // Resolve the auto-save cadence for this field:
        //   inputConfig.debounce === false      → submit immediately (no timer)
        //   inputConfig.debounce === <number>   → per-field debounced timer at that ms
        //   inputConfig.debounce === undefined  → fall back to the Form-level debounce
        //     (debouncedSubmitRef already encodes debounceMs, including its false → immediate case)
        const fieldDebounce = inputConfig?.debounce;
        if (fieldDebounce === false) {
          // Immediate submission: bypass debounce entirely (field-level override)
          executeAutoSaveRef.current?.();
        } else if (typeof fieldDebounce === "number") {
          // Per-field numeric debounce: schedule at the field's own interval.
          // Previously this branch was dead config — any number fell through to
          // the single Form-level debounce. See autosave Issue 1.
          getOrCreateDebouncedRef.current?.(fieldDebounce)();
        } else {
          // No field-level override → Form-level debounced submission
          debouncedSubmitRef.current?.();
        }
      }
    },
    [autoSave, getAffectedFields],
  );

  const setFieldValidating = useCallback(
    (name: string, isValidating: boolean) => {
      validatingFields.current.set(name, isValidating);
    },
    [],
  );

  // === STATE ACCESS ===

  const getFormState = useCallback((): FormState => {
    const values = methods.getValues();
    const formState = methods.formState;

    // Build proxy-wrapped field states
    const fields: Record<string, any> = {};
    Object.keys(config).forEach((name) => {
      const fieldState = methods.getFieldState(name as any, formState);
      fields[name] = makeProxyState({
        value: values[name as keyof typeof values],
        isTouched: fieldState.isTouched,
        isDirty: fieldState.isDirty,
        isValidating: validatingFields.current.get(name) ?? false,
        error: fieldState.error
          ? {
              type: fieldState.error.type,
              message: fieldState.error.message,
            }
          : undefined,
        invalid: fieldState.invalid,
      });
    });

    return {
      fields,
      record: record ?? {},
      errors: formState.errors as any,
      defaultValues: defaultValues,
      touchedFields: formState.touchedFields as any,
      dirtyFields: formState.dirtyFields as any,
      isDirty: formState.isDirty,
      isTouched: Object.keys(formState.touchedFields).length > 0,
      isValid: formState.isValid,
      isSubmitting: formState.isSubmitting,
    };
  }, [methods, config, record, defaultValues]);

  // === SUBMISSION ===

  /**
   * Run the full submission pipeline (validate + transform) on already-collected
   * values, then invoke the supplied submit handler.
   *
   * Used by both auto-save and manual submit. When `overrideOnSubmit` is
   * provided (the manual-submit render-API path), it is called instead of the
   * `<Form onSubmit>` prop so a consumer using `methods.handleSubmit(handler)`
   * receives the transformed values.
   */
  const handleSubmit = useCallback(
    async (
      values: TFieldValues,
      overrideOnSubmit?: (
        values: Partial<TFieldValues>,
      ) => void | Promise<void>,
    ) => {
      // §8.5 Validation Blocking (subscriber-scoped).
      // Block submission only while a validating field has subscribers /
      // dependents in the inverted-subscription index. An in-flight validator
      // on a field with NO subscribers does NOT block (e.g. an unrelated async
      // validator must not stall a scoped auto-save of an independent edit).
      // PRD.md §8.5.
      for (const [fieldName, isValidating] of validatingFields.current) {
        if (!isValidating) continue;
        const subscribers = invertedSubscriptions.current.get(fieldName);
        if (subscribers && subscribers.size > 0) return;
      }

      // Run form-level validation
      if (validate) {
        const errors = await validate(values);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            methods.setError(field as any, { message });
          });
          return;
        }
      }

      // Transform values for submission
      const submitValues = transformValuesForSubmit(
        values,
        config,
        mergedInputs,
      );

      const sink = overrideOnSubmit ?? onSubmit;
      await sink?.(submitValues);
    },
    [validate, methods, onSubmit, config, mergedInputs],
  );

  /**
   * Render-API submit handler.
   *
   * Wraps React Hook Form's `methods.handleSubmit` so that the documented
   * submission pipeline (form-level `validate` + `transformValuesForSubmit`)
   * runs on the manual-submit path too — not just auto-save. RHF performs its
   * own field validation first; if it passes, values are routed through
   * `handleSubmit` (validate + transform) before reaching `userOnSubmit`.
   */
  const handleRenderSubmit = useCallback(
    (userOnSubmit: (values: Partial<TFieldValues>) => void | Promise<void>) => {
      return methods.handleSubmit(async (values) => {
        await handleSubmit(values as TFieldValues, userOnSubmit);
      });
    },
    [methods, handleSubmit],
  );

  // Debounced submit for auto-save
  const debouncedSubmitRef = useRef<DebouncedFunction>();

  // Ref to store executeAutoSave for use in changeField (to avoid initialization order issues)
  const executeAutoSaveRef = useRef<typeof executeAutoSave>();

  /**
   * Wait for specific fields to complete their validation.
   * Returns false if the version changed (new changes came in), true otherwise.
   */
  const waitForFieldValidation = useCallback(
    async (fields: string[], version: number): Promise<boolean> => {
      const maxWaitMs = 10000; // 10 second timeout
      const pollIntervalMs = 50;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitMs) {
        // Check if version changed (new changes came in)
        if (executionVersionRef.current !== version) {
          return false;
        }

        // Check if all fields have completed validation
        const allDone = fields.every(
          (field) => !validatingFields.current.get(field),
        );
        if (allDone) {
          return true;
        }

        // Wait and check again
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }

      // Timeout - proceed anyway
      return true;
    },
    [],
  );

  /**
   * Execute auto-save: validate only changed/affected fields, wait for completion, then submit.
   * This prevents the issue where handleSubmit() validates ALL fields.
   */
  const executeAutoSave = useCallback(async () => {
    // Capture and increment execution version
    executionVersionRef.current++;
    const executionVersion = executionVersionRef.current;

    // Copy and clear pending fields
    const changedFields = new Set(pendingChangedFields.current);
    const affectedFields = new Set(pendingAffectedFields.current);
    pendingChangedFields.current.clear();
    pendingAffectedFields.current.clear();

    // If no fields changed, nothing to do
    if (changedFields.size === 0) {
      return;
    }

    // Changed fields are validated in Gate 1 below; affected (dependent) fields
    // in Gate 2. Both are triggered explicitly (via methods.trigger, which
    // ignores `mode`) so auto-save is correct under ANY validation mode (§5.2),
    // not just `onChange`.
    const fieldsToWaitFor = [...changedFields, ...affectedFields];
    const fieldsToTrigger = [...affectedFields];

    // Wait for any in-flight validations on these fields to complete
    const validationsComplete = await waitForFieldValidation(
      fieldsToWaitFor,
      executionVersion,
    );

    // If version changed while waiting, abort (new changes came in)
    if (
      !validationsComplete ||
      executionVersionRef.current !== executionVersion
    ) {
      return;
    }

    // Gate 1: validate the CHANGED fields; if any has an error, block the save.
    //
    // We trigger explicitly (rather than reading a pre-computed error) so this
    // is correct under ANY `mode` (§5.2) — e.g. `onTouched`, where a field's
    // first edit (before it loses focus) is NOT auto-validated by RHF.
    // `methods.trigger` ignores `mode` and always validates. (Under `onChange`
    // this re-runs validation RHF already did on change — a minor, intentional
    // cost for mode-agnosticism.) See PRD §11.1 #5.
    const changedArray = [...changedFields];
    if (changedArray.length > 0) {
      const changedValid = await methods.trigger(changedArray as any);

      // A newer change superseded this save while we were validating.
      if (executionVersionRef.current !== executionVersion) {
        return;
      }
      if (!changedValid) {
        return;
      }

      // Wait for the just-triggered validators' bookkeeping to settle.
      const changedValidationsComplete = await waitForFieldValidation(
        changedArray,
        executionVersion,
      );
      if (
        !changedValidationsComplete ||
        executionVersionRef.current !== executionVersion
      ) {
        return;
      }
    }

    // Gate 2: re-validate dependent (affected) fields; if any fails, block.
    if (fieldsToTrigger.length > 0) {
      const isValid = await methods.trigger(fieldsToTrigger as any);

      // Check version again after async validation
      if (executionVersionRef.current !== executionVersion) {
        return;
      }

      if (!isValid) {
        // Validation failed, don't submit
        return;
      }

      // Wait for triggered validations to complete
      const postTriggerComplete = await waitForFieldValidation(
        fieldsToTrigger,
        executionVersion,
      );

      if (
        !postTriggerComplete ||
        executionVersionRef.current !== executionVersion
      ) {
        return;
      }
    }

    // All relevant validations passed.
    //
    // NOTE: we intentionally do NOT bail on whole-form errors here. The checks
    // above already validate exactly the fields this save can touch (changed
    // fields via onChange + affected fields via trigger()). Rejecting on *any*
    // unrelated field's error would silently drop a valid edit — e.g. editing
    // `notes` while an unrelated required `email` is empty — so the user's
    // change would sit unsaved with no feedback. Whole-form validity is still
    // enforced on a full manual submit. See autosave Issue 2.
    const values = methods.getValues();
    await handleSubmit(values as TFieldValues);
  }, [methods, handleSubmit, waitForFieldValidation]);

  // Keep the ref in sync with the latest executeAutoSave function
  executeAutoSaveRef.current = executeAutoSave;

  /**
   * Get (or lazily create) a debounced auto-save function for a specific
   * interval, used to honor per-field numeric `InputConfig.debounce` values.
   *
   * The cache is keyed by interval so fields sharing the same numeric
   * debounce coalesce into a single timer (mirroring the single-timer
   * behavior of the Form-level debounce); fields with different numeric
   * debounces each get their own timer and fire on their own cadence.
   *
   * This governs *auto-save timing only*. The field value is still committed
   * to React Hook Form on every change (see Field.handleChange); a numeric
   * debounce does NOT throttle value commits / re-renders.
   */
  const getOrCreateDebounced = useCallback((ms: number): DebouncedFunction => {
    const cached = fieldDebouncersRef.current.get(ms);
    if (cached) return cached;

    // Forward through executeAutoSaveRef so each cached debounced fn is
    // stable: it always invokes the latest executeAutoSave without rebuilding
    // the timer (and canceling any pending save) when executeAutoSave's
    // identity changes. The cache therefore stays valid for the field's
    // lifetime — no teardown/rebuild needed.
    //
    // Built via wrapDebounced so this per-field timer reports a correct
    // pending() (autosave Issue 3) — the cache therefore also stays
    // pending-accurate for its whole lifetime.
    const fn = wrapDebounced(() => {
      executeAutoSaveRef.current?.();
    }, ms);

    fieldDebouncersRef.current.set(ms, fn);
    return fn;
  }, []);

  // Keep the factory ref in sync so `changeField` (defined above) always
  // invokes the latest factory. Stable identity (no executeAutoSave dep), so
  // `changeField` and its context consumers are not churned.
  getOrCreateDebouncedRef.current = getOrCreateDebounced;

  // Cancel + clear all per-field debouncers on unmount. No rebuild is needed
  // on executeAutoSave changes — the cached fns forward through the ref above.
  useEffect(() => {
    return () => {
      fieldDebouncersRef.current.forEach((fn) => fn.cancel());
      fieldDebouncersRef.current.clear();
    };
  }, [getOrCreateDebounced]);

  // Form-level debounced submit, built once per `debounceMs`. It forwards
  // through executeAutoSaveRef so it (a) always invokes the latest
  // executeAutoSave without rebuilding/canceling the timer on every
  // executeAutoSave identity change, and (b) can be assigned during render —
  // making it available on the very first render, consistent with
  // executeAutoSaveRef / getOrCreateDebouncedRef. Previously this was wired
  // up inside an effect, leaving a first-render window where the ref was
  // undefined (the `?.()` no-ops). See autosave Issue 3.
  const debouncedSubmit = useMemo<DebouncedFunction>(() => {
    // When debounce is false, use immediate execution (no debouncing)
    if (debounceMs === false) {
      return Object.assign(
        () => {
          executeAutoSaveRef.current?.();
        },
        {
          cancel: () => {}, // No-op for immediate function
          flush: () => executeAutoSaveRef.current?.(), // Execute immediately on flush
          pending: () => false, // Never pending when immediate
        },
      ) as DebouncedFunction;
    }

    // Normal debounce behavior — wrapDebounced gives a correct pending().
    return wrapDebounced(() => {
      executeAutoSaveRef.current?.();
    }, debounceMs);
  }, [debounceMs]);

  // Assign during render (not in an effect) so the ref is populated on the
  // first render and never undefined.
  debouncedSubmitRef.current = debouncedSubmit;

  // Cancel the lodash timer when the interval changes or on unmount. (For the
  // immediate adapter, cancel() is a no-op.)
  useEffect(() => {
    return () => {
      debouncedSubmit.cancel();
    };
  }, [debouncedSubmit]);

  const submitImmediate = useCallback(() => {
    // Flush every pending auto-save immediately — both the per-field numeric
    // debounce timers (autosave Issue 1) and the Form-level debounce.
    //
    // Pending changes accumulate in a single shared set
    // (`pendingChangedFields`), so one `executeAutoSave` captures them all.
    // We therefore (a) detect any pending timer, (b) cancel every idle timer
    // so its trailing callback can't fire a second, version-bumping
    // invocation that would abort this flush (see executionVersionRef in
    // executeAutoSave), and (c) run the save pipeline exactly once.
    const anyPending =
      debouncedSubmitRef.current?.pending() === true ||
      [...fieldDebouncersRef.current.values()].some((fn) => fn.pending());
    if (!anyPending) return; // nothing scheduled — avoid a spurious empty save

    // Cancel the idle timers (no-op when not pending, and a no-op for the
    // immediate adapter) so their later callbacks don't race this manual flush.
    debouncedSubmitRef.current?.cancel();
    fieldDebouncersRef.current.forEach((fn) => fn.cancel());

    // Drain the shared pending-changes set in a single save. `executeAutoSave`
    // reads the latest values via `methods.getValues()`, so a canceled in-flight
    // save (if any) is superseded without data loss.
    executeAutoSaveRef.current?.();
  }, []);

  // === UNUSED FIELDS ===

  const unusedFields = useMemo(() => {
    const allFields = Object.keys(config);
    return allFields.filter((name) => !registeredFields.has(name));
  }, [config, registeredFields]);

  // === RESOLVED TITLE ===

  const resolvedTitle = useMemo(() => {
    if (!formConfig.selectTitle && !formConfig.title) {
      return undefined;
    }

    // If selectTitle exists, evaluate it
    if (formConfig.selectTitle) {
      const formState = getFormState();
      const context = buildFormContext(
        formState.fields,
        formState.record,
        formState.errors,
        formState.defaultValues,
        formState.touchedFields,
        formState.dirtyFields,
      );
      const evaluated = evaluateDescriptor(formConfig.selectTitle, context);
      return resolveFormTitle(formConfig.title, evaluated);
    }

    // Static title
    return resolveFormTitle(formConfig.title);
  }, [formConfig.title, formConfig.selectTitle, getFormState]);

  // === CONTEXT VALUE ===

  const contextValue = useMemo<FormContextValue<TFieldValues>>(
    () => ({
      config,
      formConfig,
      record,
      registerField,
      unregisterField,
      addSubscription,
      removeSubscription,
      registerWatcherSetter,
      unregisterWatcherSetter,
      changeField,
      setFieldValidating,
      getFormState,
      onSubmit,
      debouncedSubmit,
      submitImmediate,
      unusedFields,
      methods: methods as any,
    }),
    [
      config,
      formConfig,
      record,
      registerField,
      unregisterField,
      addSubscription,
      removeSubscription,
      registerWatcherSetter,
      unregisterWatcherSetter,
      changeField,
      setFieldValidating,
      getFormState,
      onSubmit,
      debouncedSubmit,
      submitImmediate,
      unusedFields,
      methods,
    ],
  );

  // === RENDER ===

  // CRITICAL: Only access methods.formState when children is a function
  // Accessing formState ANYWHERE creates a subscription to the entire form state
  // This would cause ALL children to re-render on ANY field change
  const isRenderFunction = typeof children === "function";

  return (
    <FormProvider {...methods}>
      <FormContext.Provider value={contextValue as any}>
        <GroupContext.Provider value={defaultGroupContext}>
          {isRenderFunction
            ? children({
                unusedFields,
                formState: methods.formState,
                methods: methods as any,
                handleSubmit: handleRenderSubmit,
                resolvedTitle,
              })
            : children}
        </GroupContext.Provider>
      </FormContext.Provider>
    </FormProvider>
  );
}

/**
 * Wrap a lodash debounced auto-save callback so it satisfies the
 * `DebouncedFunction` contract — including a CORRECT `pending()`.
 *
 * `lodash-es`'s `debounce` returns a function with `cancel` / `flush` but NO
 * `pending()` (the project's earlier comments assumed lodash tracked it
 * internally — it does not). We therefore track the pending state explicitly:
 *   - a scheduling call sets it,
 *   - the trailing invocation (after `wait`ms), `flush`, and `cancel` clear it.
 *
 * See autosave Issue 3 (`pending()` always returned false).
 */
function wrapDebounced(callback: () => void, ms: number): DebouncedFunction {
  let isPending = false;
  const debounced = debounce(() => {
    isPending = false;
    callback();
  }, ms);
  return Object.assign(
    () => {
      isPending = true;
      debounced();
    },
    {
      cancel: () => {
        isPending = false;
        debounced.cancel();
      },
      flush: () => {
        isPending = false;
        debounced.flush();
      },
      pending: () => isPending,
    },
  ) as DebouncedFunction;
}

/**
 * Transform values for submission
 *
 * Applies valueField extraction and field name transformation
 * based on input config settings.
 */
function transformValuesForSubmit<T extends FieldValues>(
  values: T,
  config: FormFieldsConfig,
  inputs: Record<string, InputConfig>,
): Partial<T> {
  const result: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(values)) {
    const fieldConfig = config[name];
    const type = fieldConfig?.type ?? "textField";
    const inputConfig = inputs[type];

    if (inputConfig) {
      // Get the submit field name (may be transformed)
      const submitName = transformFieldName(name, inputConfig.getSubmitField);

      // Extract value from complex object if valueField is specified
      const submitValue = extractValueField(value, inputConfig.valueField);

      result[submitName] = submitValue;
    } else {
      result[name] = value;
    }
  }

  return result as Partial<T>;
}

export type { FormContextValue };
