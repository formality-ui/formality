// @formality-ui/react - Form Component
// Core form component with React Hook Form integration

import {
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  useForm,
  FormProvider,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { debounce } from 'lodash-es';
import {
  resolveAllInitialValues,
  resolveFormTitle,
  evaluateDescriptor,
  buildFormContext,
  extractValueField,
  transformFieldName,
} from '@formality-ui/core';
import type {
  FormFieldsConfig,
  FormConfig,
  FormState,
  InputConfig,
} from '@formality-ui/core';
import { FormContext, type FormContextValue } from '../context/FormContext';
import { GroupContext } from '../context/GroupContext';
import { useConfigContext } from '../context/ConfigContext';
import { makeProxyState } from '../utils/makeProxyState';
import type { WatcherSetterFn, DebouncedFunction } from '../types';

/**
 * Form component props
 */
export interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  /** Form content - can be static children or render function */
  children: ReactNode | ((api: FormRenderAPI<TFieldValues>) => ReactNode);

  /** Field configurations */
  config: FormFieldsConfig;

  /** Form-level configuration (title, groups, input overrides) */
  formConfig?: FormConfig;

  /** Submit handler */
  onSubmit?: (values: Partial<TFieldValues>) => void | Promise<void>;

  /** Initial record data */
  record?: Partial<TFieldValues>;

  /** Enable auto-save on field changes */
  autoSave?: boolean;

  /** Debounce milliseconds for auto-save (default: 1000) */
  debounce?: number;

  /** Form-level validation */
  validate?: (
    values: Partial<TFieldValues>
  ) => Record<string, string> | Promise<Record<string, string>>;
}

/**
 * API passed to render function children
 */
export interface FormRenderAPI<TFieldValues extends FieldValues = FieldValues> {
  /** Fields in config but not rendered */
  unusedFields: string[];

  /** React Hook Form formState */
  formState: UseFormReturn<TFieldValues>['formState'];

  /** React Hook Form methods */
  methods: UseFormReturn<TFieldValues>;

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
  validate,
}: FormProps<TFieldValues>): JSX.Element {
  // Get provider configuration
  const providerConfig = useConfigContext();

  // Merge input configs (form overrides provider)
  const mergedInputs = useMemo((): Record<string, InputConfig> => {
    const formInputs =
      typeof formConfig.inputs === 'function'
        ? formConfig.inputs(providerConfig.inputs)
        : formConfig.inputs ?? {};

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
  const defaultValues = useMemo(() => {
    return resolveAllInitialValues(config, mergedInputs, record ?? {});
  }, [config, mergedInputs, record]);

  // Initialize React Hook Form
  const methods = useForm<TFieldValues>({
    mode: 'onChange',
    defaultValues: defaultValues as any,
    values: record as any,
  });

  // === REGISTRIES ===

  // Field registration
  const fieldRegistry = useRef(new Set<string>());
  const [registeredFields, setRegisteredFields] = useState<Set<string>>(
    new Set()
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
      invertedSubscriptions.current.get(target)?.delete(subscriber);

      const setter = watcherSetters.current.get(target);
      if (setter) {
        setter((prev) => {
          const next = { ...prev };
          delete next[subscriber];
          return next;
        });
      }
    },
    []
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
    []
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
    (name: string, value: unknown) => {
      // Auto-save trigger
      if (autoSave) {
        // Accumulate this change
        pendingChangedFields.current.add(name);

        // Add affected fields (those that depend on this field via conditions)
        const affected = getAffectedFields(name);
        for (const field of affected) {
          pendingAffectedFields.current.add(field);
        }

        // Trigger debounced auto-save
        debouncedSubmit();
      }
    },
    [autoSave, getAffectedFields]
  );

  const setFieldValidating = useCallback(
    (name: string, isValidating: boolean) => {
      validatingFields.current.set(name, isValidating);
    },
    []
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

  const handleSubmit = useCallback(
    async (values: TFieldValues) => {
      // Check if any field is validating
      for (const [, isValidating] of validatingFields.current) {
        if (isValidating) return;
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
      const submitValues = transformValuesForSubmit(values, config, mergedInputs);

      await onSubmit?.(submitValues);
    },
    [validate, methods, onSubmit, config, mergedInputs]
  );

  // Debounced submit for auto-save
  const debouncedSubmitRef = useRef<DebouncedFunction>();

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
          (field) => !validatingFields.current.get(field)
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
    []
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

    // Changed fields: already validated by RHF's onChange mode
    // Affected fields: may need validation for cross-field validation
    const fieldsToWaitFor = [...changedFields, ...affectedFields];
    const fieldsToTrigger = [...affectedFields]; // Only affected, not changed

    // Wait for any in-flight validations on these fields to complete
    const validationsComplete = await waitForFieldValidation(
      fieldsToWaitFor,
      executionVersion
    );

    // If version changed while waiting, abort (new changes came in)
    if (!validationsComplete || executionVersionRef.current !== executionVersion) {
      return;
    }

    // Check if changed fields have errors (from onChange validation)
    for (const fieldName of changedFields) {
      const fieldState = methods.getFieldState(fieldName as any);
      if (fieldState.error) {
        // Changed field has validation error, don't submit
        return;
      }
    }

    // Only trigger affected fields (changed fields already validated by onChange)
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
        executionVersion
      );

      if (!postTriggerComplete || executionVersionRef.current !== executionVersion) {
        return;
      }
    }

    // Check if form is valid (may have other errors from other fields)
    const formState = methods.formState;
    if (Object.keys(formState.errors).length > 0) {
      return;
    }

    // All validations passed, submit
    const values = methods.getValues();
    await handleSubmit(values as TFieldValues);
  }, [methods, handleSubmit, waitForFieldValidation]);

  useEffect(() => {
    const debouncedFn = debounce(() => {
      executeAutoSave();
    }, debounceMs);

    // Attach lodash-style methods
    const fn = Object.assign(debouncedFn, {
      pending: () => false, // lodash debounce handles this internally
    }) as DebouncedFunction;

    debouncedSubmitRef.current = fn;

    return () => {
      debouncedFn.cancel();
    };
  }, [executeAutoSave, debounceMs]);

  const debouncedSubmit = useCallback(() => {
    debouncedSubmitRef.current?.();
  }, []);

  const submitImmediate = useCallback(() => {
    debouncedSubmitRef.current?.flush();
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
        formState.dirtyFields
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
      debouncedSubmit: debouncedSubmitRef.current!,
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
      submitImmediate,
      unusedFields,
      methods,
    ]
  );

  // === RENDER ===

  // CRITICAL: Only access methods.formState when children is a function
  // Accessing formState ANYWHERE creates a subscription to the entire form state
  // This would cause ALL children to re-render on ANY field change
  const isRenderFunction = typeof children === 'function';

  return (
    <FormProvider {...methods}>
      <FormContext.Provider value={contextValue as any}>
        <GroupContext.Provider value={defaultGroupContext}>
          {isRenderFunction
            ? children({
                unusedFields,
                formState: methods.formState,
                methods: methods as any,
                resolvedTitle,
              })
            : children}
        </GroupContext.Provider>
      </FormContext.Provider>
    </FormProvider>
  );
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
  inputs: Record<string, InputConfig>
): Partial<T> {
  const result: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(values)) {
    const fieldConfig = config[name];
    const type = fieldConfig?.type ?? 'textField';
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
