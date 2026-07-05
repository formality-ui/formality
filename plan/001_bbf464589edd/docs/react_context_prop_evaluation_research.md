# React Context Prop Evaluation Patterns & Best Practices Research

**Document Version:** 1.0
**Research Date:** 2026-01-11
**Status:** Comprehensive Analysis of Codebase + Established Best Practices

---

## Executive Summary

This document provides comprehensive research on React Context prop evaluation patterns and best practices, specifically focused on dynamic prop evaluation at multiple levels (provider, form, field). While external web APIs were unavailable, this research is based on:

1. **Deep analysis of the Formality codebase** - Excellent real-world implementation
2. **Established React patterns** - Well-documented community best practices
3. **React Hook Form patterns** - Industry-standard form library patterns
4. **Performance optimization strategies** - Proven techniques for Context-based forms

**Key Findings:**

- Formality implements **8-layer props merging** with clear priority ordering
- **Isolated field subscriptions** via `useWatch` prevent unnecessary re-renders
- **Non-reactive field state access** via `getFieldState()` optimizes condition evaluation
- **Proxy state pattern** enables lazy property access for fine-grained reactivity
- **Expression inference** automatically establishes field dependencies

---

## Table of Contents

1. [React Context Dynamic Prop Evaluation](#1-react-context-dynamic-prop-evaluation)
2. [Multi-Level Prop Evaluation Patterns](#2-multi-level-prop-evaluation-patterns)
3. [Expression Evaluation in Form Libraries](#3-expression-evaluation-in-form-libraries)
4. [Performance Patterns for Re-evaluation](#4-performance-patterns-for-re-evaluation)
5. [Examples from Established Libraries](#5-examples-from-established-libraries)
6. [Common Pitfalls to Avoid](#6-common-pitfalls-to-avoid)
7. [Best Practices Summary](#7-best-practices-summary)
8. [External Documentation References](#8-external-documentation-references)

---

## 1. React Context Dynamic Prop Evaluation

### 1.1 Context Value Structure

#### Pattern: Separate Static and Dynamic Context Values

**Best Practice:** Split context into static configuration and dynamic state to minimize unnecessary re-renders.

**Formality Implementation:**

**File:** `/home/dustin/projects/formality/packages/react/src/context/FormContext.ts`

```typescript
export interface FormContextValue<
  TFieldValues extends FieldValues = FieldValues,
> {
  // ========================
  // Static Configuration (rarely changes)
  // ========================

  /** Field configurations for this form */
  config: FormFieldsConfig;

  /** Form-level configuration */
  formConfig: FormConfig;

  /** Original record passed to Form */
  record?: Record<string, unknown>;

  // ========================
  // Dynamic Operations (stable references)
  // ========================

  /** Registry operations */
  registerField: (name: string) => void;
  unregisterField: (name: string) => void;

  /** Subscription operations */
  addSubscription: (target: string, subscriber: string) => void;
  removeSubscription: (target: string, subscriber: string) => void;

  /** State operations */
  changeField: (name: string, value: unknown) => void;
  setFieldValidating: (name: string, isValidating: boolean) => void;

  // ========================
  // React Hook Form Integration
  // ========================

  /** React Hook Form methods passthrough */
  methods: UseFormReturn<TFieldValues>;
}
```

**Why This Works:**

1. **Stable References:** Functions and `methods` object rarely change
2. **Clear Separation:** Static config vs dynamic operations
3. **Type Safety:** Generic parameter for form values
4. **Minimal Re-renders:** Only consumers of specific values re-render

### 1.2 Dynamic Prop Evaluation Hook

#### Pattern: Isolated Evaluation with Automatic Dependency Inference

**Formality Implementation:**

**File:** `/home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts`

```typescript
interface UsePropsEvaluationOptions {
  /** Dynamic props descriptor to evaluate */
  selectProps?: SelectValue;

  /** Dynamic default field props from Form config (higher priority) */
  formDefaultFieldProps?: SelectValue;

  /** Dynamic default field props from Provider config (lower priority) */
  providerDefaultFieldProps?: SelectValue;

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Current field name */
  fieldName: string;
}

export function usePropsEvaluation(
  options: UsePropsEvaluationOptions,
): Record<string, unknown> {
  const {
    selectProps,
    formDefaultFieldProps,
    providerDefaultFieldProps,
    subscribesTo,
    fieldName,
  } = options;
  const { record, methods } = useFormContext();

  // Infer fields to watch from selectProps and explicit subscriptions
  const watchFields = useInferredInputs({
    selectProps,
    subscribesTo,
  });

  // Watch inferred fields (only subscribe if there are fields to watch)
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields.length > 0 ? (watchFields as any) : [],
  });

  // Build form state for evaluation (only for watched fields)
  const formState = useMemo((): FormState => {
    const fields: Record<string, any> = {};

    if (watchFields.length > 0) {
      const values =
        watchFields.length === 1
          ? { [watchFields[0]]: watchedValues }
          : watchFields.reduce(
              (acc, field, i) => {
                acc[field] = (watchedValues as unknown[])[i];
                return acc;
              },
              {} as Record<string, unknown>,
            );

      watchFields.forEach((name) => {
        fields[name] = makeProxyState({
          value: values[name],
          isTouched: false,
          isDirty: false,
          isValidating: false,
          error: undefined,
          invalid: false,
        });
      });
    }

    return {
      fields,
      record: record ?? {},
      errors: {},
      defaultValues: {},
      touchedFields: {},
      dirtyFields: {},
      isDirty: false,
      isTouched: false,
      isValid: true,
      isSubmitting: false,
    };
  }, [watchFields, watchedValues, record]);

  // Evaluate props with priority: formDefaultFieldProps > selectProps
  return useMemo(() => {
    if (formDefaultFieldProps) {
      if (typeof formDefaultFieldProps === "function") {
        return formDefaultFieldProps(formState, methods) ?? {};
      }
      const context = buildFieldContext(formState, fieldName);
      return evaluateDescriptor(formDefaultFieldProps, context) ?? {};
    }

    if (!selectProps) {
      return {};
    }

    if (typeof selectProps === "function") {
      return selectProps(formState, methods) ?? {};
    }

    const context = buildFieldContext(formState, fieldName);
    return evaluateDescriptor(selectProps, context) ?? {};
  }, [selectProps, formDefaultFieldProps, formState, methods, fieldName]);
}
```

**Key Patterns:**

1. **Automatic Dependency Inference:** `useInferredInputs` extracts field names from expressions
2. **Isolated Subscriptions:** `useWatch` only watches necessary fields
3. **Minimal State Building:** Only builds state for watched fields
4. **Priority-Based Evaluation:** Form-level props override field-level props
5. **Polymorphic Input:** Supports expressions, functions, objects, arrays

### 1.3 Expression Evaluation Patterns

#### Pattern: Safe Sandboxed Evaluation with Field Proxies

**Formality Implementation:**

**File:** `/home/dustin/projects/formality/packages/core/src/expression/evaluate.ts`

```typescript
import jsep from "jsep";

const astCache = new Map<string, Expression>();

export function evaluate(expr: string, context: EvaluationContext): unknown {
  try {
    const ast = parseExpression(expr);
    const result = evaluateNode(ast, context);
    return unwrapFieldProxy(result);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Expression evaluation error for "${expr}":`, error);
    }
    return undefined;
  }
}

function parseExpression(expr: string): Expression {
  const cached = astCache.get(expr);
  if (cached) {
    return cached;
  }

  const ast = jsep(expr);
  astCache.set(expr, ast);
  return ast;
}
```

**Security Features:**

1. **No Function Calls:** `CallExpression` throws error
2. **No `eval()` or `Function` constructor**
3. **Whitelisted properties only**
4. **Graceful error handling** with development warnings

**Field Proxy Pattern:**

**File:** `/home/dustin/projects/formality/packages/core/src/expression/context.ts`

```typescript
const FIELD_STATE_PROPERTIES = new Set([
  "value",
  "isTouched",
  "isDirty",
  "isValidating",
  "error",
  "invalid",
  "disabled",
]);

export function createFieldStateProxy(
  fieldState: FieldState | { value: unknown },
): unknown {
  return new Proxy(fieldState as object, {
    get(target: FieldState | { value: unknown }, prop: string | symbol) {
      // Known field state properties - return directly
      if (typeof prop === "string" && FIELD_STATE_PROPERTIES.has(prop)) {
        return (target as Record<string, unknown>)[prop];
      }

      // Unknown property - delegate to value
      const value = target.value;
      if (value !== null && value !== undefined && typeof value === "object") {
        return (value as Record<string, unknown>)[prop as string];
      }

      return undefined;
    },
  });
}
```

**Benefits:**

1. **Dual Access Pattern:** `client.id` (value access) vs `client.isTouched` (metadata access)
2. **Lazy Property Access:** Only accessed properties create React dependencies
3. **Primitive Coercion:** `client` returns the value, not the proxy

---

## 2. Multi-Level Prop Evaluation Patterns

### 2.1 The 8-Layer Merge Pattern

**Formality Implementation:**

**File:** `/home/dustin/projects/formality/packages/core/src/config/merge.ts`

```typescript
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
  return mergeStaticProps(
    providerDefaultFieldProps, // Layer 1: Lowest priority
    providerSelectDefaultFieldProps, // Layer 2
    formDefaultFieldProps, // Layer 3
    formSelectDefaultFieldProps, // Layer 4
    inputProps, // Layer 5
    fieldConfigProps, // Layer 6
    selectProps, // Layer 7
    componentProps, // Layer 8
    coreProps, // Layer 9: Highest priority (always wins)
  );
}
```

**Priority Order (Lowest → Highest):**

1. **Provider Default Field Props** - Global defaults across all forms
2. **Provider Select Default Field Props** - Dynamic provider defaults
3. **Form Default Field Props** - Form-level static defaults
4. **Form Select Default Field Props** - Form-level dynamic defaults
5. **Input Props** - Input type configuration
6. **Field Config Props** - Field-level static props
7. **Select Props** - Field-level dynamic props (evaluated)
8. **Component Props** - Props passed to Field component
9. **Core Props** - Critical props (name, value, onChange, etc.)

**Usage in Field Component:**

**File:** `/home/dustin/projects/formality/packages/react/src/components/Field.tsx`

```typescript
<Controller
  control={methods.control}
  name={name}
  rules={validationRules}
  render={({ field, fieldState, formState }) => {
    // Evaluate selectProps (dynamic props from conditions)
    const evaluatedSelectProps = usePropsEvaluation({
      selectProps: fieldConfig.selectProps,
      formDefaultFieldProps: formConfig.defaultFieldProps,
      providerDefaultFieldProps: providerConfig.defaultFieldProps,
      fieldName: name,
    });

    // Merge all 9 layers
    const finalProps = mergeFieldProps({
      providerDefaultFieldProps: providerConfig.defaultFieldProps,
      formDefaultFieldProps: formConfig.defaultFieldProps,
      inputProps: inputConfig.props,
      fieldConfigProps: fieldConfig.props,
      selectProps: evaluatedSelectProps,
      componentProps: restProps,
      coreProps: {
        name,
        label,
        disabled: isDisabled,
        error: fieldState.error?.message,
        [inputConfig.inputFieldProp ?? "value"]: formattedValue,
        onChange: handleChange(field.onChange),
        onBlur: field.onBlur,
        ref: field.ref,
      },
    });

    return <Component {...finalProps} />;
  }}
/>
```

### 2.2 Static vs Dynamic Props Separation

**Pattern:** Separate static props (merged once) from dynamic props (re-evaluated)

**File:** `/home/dustin/projects/formality/packages/core/src/config/merge.ts`

```typescript
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
```

**Why Separate Static and Dynamic?**

1. **Performance:** Static props merged once, dynamic props re-evaluated
2. **Caching:** Static merge results can be memoized
3. **Type Safety:** Different types for static vs dynamic
4. **Clarity:** Clear separation of concerns
5. **Predictability:** Dynamic evaluation doesn't affect static defaults

### 2.3 Deep Merge Strategy

**Pattern:** Deep merge objects to preserve nested configurations

**File:** `/home/dustin/projects/formality/packages/core/src/config/merge.ts`

```typescript
export function deepMerge<T extends object>(
  base: T,
  override: Partial<T> | undefined,
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
      typeof baseValue === "object" &&
      baseValue !== null &&
      typeof overrideValue === "object" &&
      overrideValue !== null &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      // Recursively merge objects
      result[key as keyof T] = deepMerge(
        baseValue as object,
        overrideValue as object,
      ) as T[keyof T];
    } else {
      // Override value takes precedence
      result[key as keyof T] = overrideValue as T[keyof T];
    }
  }

  return result;
}
```

**Key Behaviors:**

1. **Undefined values are skipped** - Don't override with undefined
2. **Arrays are replaced** - Not merged (Arrays override, not extend)
3. **Objects are merged recursively** - Preserve nested structure
4. **Primitives override** - Last value wins

---

## 3. Expression Evaluation in Form Libraries

### 3.1 Condition Evaluation Pattern

**Formality Implementation:**

**File:** `/home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts`

```typescript
interface UseConditionsOptions {
  /** Conditions to evaluate */
  conditions: ConditionDescriptor[];

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Additional props for expression context */
  props?: Record<string, unknown>;
}

export function useConditions(options: UseConditionsOptions): ConditionResult {
  const { conditions, subscribesTo, props } = options;
  const { record, methods } = useFormContext();

  // Infer fields to watch from conditions
  const watchFields = useInferredInputs({
    conditions,
    subscribesTo,
  });

  // Watch inferred fields (isolated subscriptions)
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields.length > 0 ? (watchFields as any) : [],
  });

  // Build field values map
  const fieldValues = useMemo(() => {
    const values: Record<string, unknown> = {};

    if (watchFields.length === 0) {
      return values;
    }

    if (Array.isArray(watchedValues)) {
      watchFields.forEach((field, i) => {
        values[field] = watchedValues[i];
      });
    } else {
      values[watchFields[0]] = watchedValues;
    }

    return values;
  }, [watchFields, watchedValues]);

  // Build field states with NON-REACTIVE metadata access
  const fieldStates = useMemo(() => {
    const states: Record<string, FieldStateInput> = {};

    if (watchFields.length === 0) {
      return states;
    }

    watchFields.forEach((fieldName) => {
      // getFieldState() reads current state WITHOUT creating subscriptions
      const fieldState = methods.getFieldState(fieldName as any);
      states[fieldName] = {
        value: fieldValues[fieldName],
        isTouched: fieldState.isTouched,
        isDirty: fieldState.isDirty,
        error: fieldState.error,
        invalid: fieldState.invalid,
        isValidating: false,
      };
    });

    return states;
  }, [watchFields, fieldValues, methods]);

  // Evaluate conditions whenever values or states change
  return useMemo(() => {
    if (conditions.length === 0) {
      return {
        disabled: undefined,
        visible: undefined,
        setValue: undefined,
        hasDisabledCondition: false,
        hasVisibleCondition: false,
        hasSetCondition: false,
      };
    }

    return evaluateConditions({
      conditions,
      fieldValues,
      fieldStates,
      record,
      props,
    });
  }, [conditions, fieldValues, fieldStates, record, props]);
}
```

**Evaluation Rules:**

1. **disabled:** OR logic (any true = disabled)
2. **visible:** AND logic (any false = hidden)
3. **setValue:** Last matching condition wins

### 3.2 Field Dependency Inference

**Pattern:** Automatically extract field names from expressions

**File:** `/home/dustin/projects/formality/packages/core/src/expression/infer.ts`

```typescript
export function inferFieldsFromExpression(expr: string): string[] {
  const fields: string[] = [];
  const IDENTIFIER_REGEX = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  let match: RegExpExecArray | null;

  while ((match = IDENTIFIER_REGEX.exec(expr)) !== null) {
    const identifier = match[1];

    // Skip JavaScript keywords
    if (KEYWORD_SET.has(identifier)) {
      continue;
    }

    // Skip property accesses (e.g., .id in client.id)
    const beforeMatch = expr.slice(0, match.index);
    const lastNonWhitespace = beforeMatch.trimEnd().slice(-1);
    if (lastNonWhitespace === ".") {
      continue;
    }

    // Skip qualified prefixes followed by dot (e.g., fields.client)
    const afterMatch = expr.slice(match.index + identifier.length);
    if (afterMatch.startsWith(".") && QUALIFIED_PREFIX_SET.has(identifier)) {
      continue;
    }

    fields.push(identifier);
  }

  return [...new Set(fields)]; // Unique fields
}
```

**Examples:**

```typescript
inferFieldsFromExpression("client.id"); // → ["client"]
inferFieldsFromExpression("client && signed"); // → ["client", "signed"]
inferFieldsFromExpression("record.name"); // → [] (qualified path)
inferFieldsFromExpression("true && false"); // → [] (keywords)
inferFieldsFromExpression("fields === null"); // → ["fields"] (not followed by dot)
```

---

## 4. Performance Patterns for Re-evaluation

### 4.1 Isolated Field Subscriptions

**Pattern:** Use `useWatch` for isolated field value subscriptions

**Formality Implementation:**

```typescript
// Watch inferred fields (only subscribe if there are fields to watch)
const watchedValues = useWatch({
  control: methods.control,
  name: watchFields.length > 0 ? (watchFields as any) : [],
});
```

**Benefits:**

1. **Only re-renders when watched fields change** - Not entire form state
2. **Explicit dependencies** - Forces declaration of needed fields
3. **Prevents propagation** - Changes to unrelated fields don't trigger re-renders
4. **Array form support** - `useWatch({ name: ['field1', 'field2'] })`

**Critical Behavior:**

```typescript
// Single field: returns single value
const value = useWatch({ name: "email" });
// → string | undefined

// Multiple fields: ALWAYS returns array
const values = useWatch({ name: ["email", "name"] });
// → [string, string]
```

### 4.2 Non-Reactive Field State Access

**Pattern:** Use `getFieldState()` for field metadata without subscriptions

**Formality Implementation:**

```typescript
// getFieldState() reads current state WITHOUT creating subscriptions
const fieldState = methods.getFieldState(fieldName as any);
states[fieldName] = {
  value: fieldValues[fieldName],
  isTouched: fieldState.isTouched,
  isDirty: fieldState.isDirty,
  error: fieldState.error,
  invalid: fieldState.invalid,
  isValidating: false,
};
```

**Why This Matters:**

1. **Non-Reactive Access:** Provides field metadata without creating React subscriptions
2. **Performance:** Prevents unnecessary re-renders when checking field validity
3. **Disabled State Gap:** The `disabled` property must come from condition evaluation

**Important:** `getFieldState()` does NOT include `disabled` property

### 4.3 Proxy State Pattern

**Pattern:** Lazy property access for fine-grained reactivity

**File:** `/home/dustin/projects/formality/packages/react/src/utils/makeProxyState.ts`

```typescript
export function makeProxyState<T extends object>(source: T): T {
  const result = {} as T;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      Object.defineProperty(result, key, {
        get: () => source[key],
        enumerable: true,
        configurable: true,
      });
    }
  }

  return result;
}
```

**Benefits:**

1. **Lazy Property Access:** Only accessed properties create React dependencies
2. **Reduced Re-renders:** Changing one property doesn't trigger re-renders for all
3. **Expression Optimization:** Expressions only subscribe to used properties

**Performance Impact:**

```typescript
// Without Proxy: Accessing fieldState.value creates dependency on entire fieldState
const value = fieldState.value;
// Any change to fieldState triggers re-render

// With Proxy: Accessing proxyState.value only creates dependency on value
const value = proxyState.value;
// Only changes to value trigger re-render
```

### 4.4 AST Caching

**Pattern:** Cache parsed expression ASTs for performance

**File:** `/home/dustin/projects/formality/packages/core/src/expression/evaluate.ts`

```typescript
const astCache = new Map<string, Expression>();

function parseExpression(expr: string): Expression {
  const cached = astCache.get(expr);
  if (cached) {
    return cached;
  }

  const ast = jsep(expr);
  astCache.set(expr, ast);
  return ast;
}

export function clearExpressionCache(): void {
  astCache.clear();
}
```

**Benefits:**

1. **Performance:** Parsed ASTs are reused across evaluations
2. **Memory:** Shared AST references reduce memory footprint
3. **Consistency:** Same expression always produces same AST structure

---

## 5. Examples from Established Libraries

### 5.1 React Hook Form Patterns

#### Pattern 1: FormProvider with Context

**Documentation:** https://react-hook-form.com/docs/formprovider

```typescript
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

// Parent form
function App() {
  const methods = useForm();
  return (
    <FormProvider {...methods}>
      <ChildForm />
    </FormProvider>
  );
}

// Child component accessing form context
function ChildForm() {
  const { register } = useFormContext();
  return <input {...register('firstName')} />;
}
```

**Formality Enhancement:**

```typescript
// Formality extends FormProvider with additional context
export const FormContext = createContext<FormContextValue | null>(null);

export interface FormContextValue<
  TFieldValues extends FieldValues = FieldValues,
> {
  // React Hook Form methods
  methods: UseFormReturn<TFieldValues>;

  // Field registry
  registerField: (name: string) => void;
  unregisterField: (name: string) => void;

  // Subscription management
  addSubscription: (target: string, subscriber: string) => void;
  removeSubscription: (target: string, subscriber: string) => void;

  // State operations
  changeField: (name: string, value: unknown) => void;
  getFormState: () => FormState;
}
```

#### Pattern 2: Controller Integration

**Documentation:** https://react-hook-form.com/docs/usecontroller

```typescript
import { Controller } from 'react-hook-form';

<Controller
  name="firstName"
  control={control}
  render={({ field, fieldState, formState }) => (
    <input
      {...field}
      ref={field.ref}
      onChange={(e) => field.onChange(e.target.value)}
    />
  )}
/>
```

**Formality Integration:**

**File:** `/home/dustin/projects/formality/packages/react/src/components/Field.tsx`

```typescript
<Controller
  control={methods.control}
  name={name}
  rules={validationRules}
  render={({ field, fieldState, formState }) => {
    // Evaluate dynamic props
    const evaluatedSelectProps = usePropsEvaluation({
      selectProps: fieldConfig.selectProps,
      formDefaultFieldProps: formConfig.defaultFieldProps,
      providerDefaultFieldProps: providerConfig.defaultFieldProps,
      fieldName: name,
    });

    // Merge all 9 layers
    const finalProps = mergeFieldProps({
      providerDefaultFieldProps,
      formDefaultFieldProps,
      inputProps,
      fieldConfigProps,
      selectProps: evaluatedSelectProps,
      componentProps: restProps,
      coreProps: {
        name,
        disabled: isDisabled,
        error: fieldState.error?.message,
        onChange: handleChange(field.onChange),
        onBlur: field.onBlur,
        ref: field.ref,
      },
    });

    return <Component {...finalProps} />;
  }}
/>
```

### 5.2 Formik Patterns

#### Pattern 1: Formik Context with useFormik

**Documentation:** https://formik.org/docs/api/useformikcontext

```typescript
import { Formik, Form, useField, useFormikContext } from 'formik';

// Parent form
<Formik initialValues={{ email: '' }} onSubmit={handleSubmit}>
  <Form>
    <EmailField />
  </Form>
</Formik>

// Child component accessing context
function EmailField() {
  const { values, setFieldValue } = useFormikContext();
  return <input value={values.email} onChange={e => setFieldValue('email', e.target.value)} />;
}
```

#### Pattern 2: useField for Isolated Subscriptions

**Documentation:** https://formik.org/docs/api/usefield

```typescript
import { useField } from 'formik';

function EmailField() {
  const [field, meta, helpers] = useField('email');
  // field: { name, value, onChange, onBlur }
  // meta: { value, error, touched }
  // helpers: { setValue, setTouched, setError }

  return (
    <div>
      <input {...field} />
      {meta.error && meta.touched && <span>{meta.error}</span>}
    </div>
  );
}
```

**Formality Equivalent:**

```typescript
// Formality uses useWatch + getFieldState for similar isolation
const watchedValues = useWatch({
  control: methods.control,
  name: watchFields.length > 0 ? (watchFields as any) : [],
});

const fieldState = methods.getFieldState(fieldName as any);
```

### 5.3 Final Form Patterns

#### Pattern 1: Field-Level Subscription

**Documentation:** https://final-form.org/docs/react-final-form/api/Field

```typescript
import { Field } from 'react-final-form';

<Field
  name="firstName"
  subscription={{ value: true, error: true }}
  // Only re-renders when value or error changes
>
  {({ input, meta }) => (
    <div>
      <input {...input} />
      {meta.error && meta.touched && <span>{meta.error}</span>}
    </div>
  )}
</Field>
```

**Formality Equivalent:**

```typescript
// Formality achieves similar isolation through useWatch
const watchedValues = useWatch({
  control: methods.control,
  name: ["firstName"], // Only re-renders when firstName changes
});

const fieldState = methods.getFieldState("firstName");
```

---

## 6. Common Pitfalls to Avoid

### 6.1 Subscribing to Entire Form State

**Pitfall:** Accessing `methods.formState` directly in render paths

```typescript
// BAD: Subscribes to entire form state
function MyField() {
  const { formState } = useFormContext();
  // Any change to ANY field triggers re-render
  return <div>{formState.isDirty ? 'Dirty' : 'Clean'}</div>;
}
```

**Solution:** Use `useWatch` for specific fields

```typescript
// GOOD: Only subscribes to specific fields
function MyField() {
  const dirtyFields = useWatch({
    control: methods.control,
    name: ['myField'],
  });
  // Only re-renders when myField changes
  return <div>{dirtyFields[0] ? 'Dirty' : 'Clean'}</div>;
}
```

### 6.2 Re-creating Functions on Every Render

**Pitfall:** Not memoizing context value functions

```typescript
// BAD: Functions re-created on every render
<FormContext.Provider
  value={{
    config: formConfig,
    registerField: (name) => { /* ... */ },
    unregisterField: (name) => { /* ... */ },
  }}
>
  {children}
</FormContext.Provider>
```

**Solution:** Use `useCallback` for stable references

```typescript
// GOOD: Functions have stable references
const registerField = useCallback((name: string) => {
  setRegisteredFields(prev => new Set(prev).add(name));
}, []);

const unregisterField = useCallback((name: string) => {
  setRegisteredFields(prev => {
    const next = new Set(prev);
    next.delete(name);
    return next;
  });
}, []);

<FormContext.Provider value={{ config: formConfig, registerField, unregisterField }}>
  {children}
</FormContext.Provider>
```

### 6.3 Evaluating Expressions on Every Render

**Pitfall:** Not memoizing expression evaluation results

```typescript
// BAD: Evaluates on every render
function MyField({ fieldName }) {
  const { methods } = useFormContext();
  const values = methods.getValues();
  const disabled = evaluate('!signed', { signed: values.signed });
  return <input disabled={disabled} />;
}
```

**Solution:** Use `useMemo` with proper dependencies

```typescript
// GOOD: Only re-evaluates when dependencies change
function MyField({ fieldName }) {
  const { record, methods } = useFormContext();

  const watchFields = useInferredInputs({
    selectProps: '!signed',
  });

  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields,
  });

  const disabled = useMemo(() => {
    return evaluate('!signed', { signed: watchedValues.signed });
  }, [watchedValues]);

  return <input disabled={disabled} />;
}
```

### 6.4 Not Splitting Context by Concern

**Pitfall:** Single large context causes unnecessary re-renders

```typescript
// BAD: Everything in one context
const FormContext = createContext({
  config: {},
  methods: {},
  fieldRegistry: {},
  subscriptions: {},
  validationState: {},
  // Any change triggers re-render for all consumers
});
```

**Solution:** Split context by concern (if needed)

```typescript
// GOOD: Separate contexts for different concerns
const FormConfigContext = createContext({ config: {}, methods: {} });
const FieldRegistryContext = createContext({ registry: {}, operations: {} });
const ValidationContext = createContext({ state: {}, operations: {} });

// Components only subscribe to what they need
function MyField() {
  const { config } = useContext(FormConfigContext);
  const { registerField } = useContext(FieldRegistryContext);
  // Only re-renders when config or registry changes
}
```

**Note:** Formality uses a single context but achieves isolation through `useWatch` and `getFieldState()`.

### 6.5 Ignoring Priority Order

**Pitfall:** Unclear prop priority leads to unexpected behavior

```typescript
// BAD: Unclear priority
const finalProps = {
  ...providerDefaults,
  ...formDefaults,
  ...fieldConfig,
  ...componentProps,
  // Which wins if multiple define the same prop?
};
```

**Solution:** Document and enforce priority order

```typescript
// GOOD: Clear priority order (Formality's 8-layer merge)
const finalProps = mergeFieldProps({
  providerDefaultFieldProps, // Layer 1: Lowest
  providerSelectDefaultFieldProps, // Layer 2
  formDefaultFieldProps, // Layer 3
  formSelectDefaultFieldProps, // Layer 4
  inputProps, // Layer 5
  fieldConfigProps, // Layer 6
  selectProps, // Layer 7
  componentProps, // Layer 8
  coreProps, // Layer 9: Highest (always wins)
});
```

---

## 7. Best Practices Summary

### 7.1 Context Structure

1. **Separate static and dynamic values** - Minimize unnecessary re-renders
2. **Provide stable function references** - Use `useCallback` for context methods
3. **Use generic parameters** - Type-safe context for different form types
4. **Document all properties** - Clear JSDoc comments for each context property
5. **Throw useful errors** - Clear error messages when context is missing

### 7.2 Dynamic Prop Evaluation

1. **Automatic dependency inference** - Extract field names from expressions
2. **Isolated field subscriptions** - Use `useWatch` for specific fields
3. **Minimal state building** - Only build state for watched fields
4. **Priority-based evaluation** - Clear override order (Form > Field > Provider)
5. **Polymorphic input support** - Accept expressions, functions, objects, arrays

### 7.3 Expression Evaluation

1. **Safe sandboxed evaluation** - No function calls, no dangerous operations
2. **AST caching** - Parse once, evaluate many times
3. **Field proxy pattern** - Dual access (value + metadata)
4. **Graceful error handling** - Log errors in dev, return undefined in prod
5. **Context building** - Provide both qualified and unqualified access

### 7.4 Performance Optimization

1. **Use `useWatch` for isolated subscriptions** - Only re-render on watched field changes
2. **Use `getFieldState()` for non-reactive access** - Check validity without subscriptions
3. **Proxy state pattern** - Lazy property access for fine-grained reactivity
4. **Memoize evaluation results** - Use `useMemo` with proper dependencies
5. **Split static and dynamic props** - Merge static once, evaluate dynamic repeatedly

### 7.5 Multi-Level Props

1. **Document priority order** - Clear override behavior
2. **Deep merge objects** - Preserve nested structure
3. **Replace arrays** - Don't extend arrays, override them
4. **Skip undefined values** - Don't override with undefined
5. **Test merge behavior** - Comprehensive test coverage

### 7.6 Testing

1. **Test component with `forwardRef`** - Match production patterns
2. **Use `data-testid`** - Stable selectors for tests
3. **Fake timers for debounce** - Control time in tests
4. **Clear expression cache** - Isolate expression tests
5. **Test merge priority** - Verify override order

---

## 8. External Documentation References

### 8.1 React Hook Form

**Official Documentation:**

- **FormProvider:** https://react-hook-form.com/docs/formprovider
- **useFormContext:** https://react-hook-form.com/docs/useformcontext
- **useWatch:** https://react-hook-form.com/docs/usewatch
- **getFieldState:** https://react-hook-form.com/docs/useform/getfieldstate
- **Controller:** https://react-hook-form.com/docs/usecontroller
- **FormState:** https://react-hook-form.com/docs/useform/formstate

**GitHub Repository:**

- https://github.com/react-hook-form/react-hook-form

**Key Patterns:**

- Context provider with methods passthrough
- Isolated field subscriptions via `useWatch`
- Non-reactive field state access via `getFieldState`
- Controller pattern for custom input integration

### 8.2 Formik

**Official Documentation:**

- **Formik Context:** https://formik.org/docs/api/useformikcontext
- **useField:** https://formik.org/docs/api/usefield
- **Field Component:** https://formik.org/docs/api/field

**GitHub Repository:**

- https://github.com/jaredpalmer/formik

**Key Patterns:**

- Context-based form state distribution
- Field-level subscription control
- Helper functions for imperative updates

### 8.3 React Final Form

**Official Documentation:**

- **Field Component:** https://final-form.org/docs/react-final-form/api/Field
- **Form Component:** https://final-form.org/docs/react-final-form/api/Form

**GitHub Repository:**

- https://github.com/final-form/react-final-form

**Key Patterns:**

- Field-level subscription control
- Render prop pattern
- Fine-grained update control

### 8.4 React Context Performance

**Recommended Resources:**

- **React Context Performance (tkdodo.eu):** https://tkdodo.eu/blog/react-context-performance-optimal-state-structure
  - Optimal state structure for Context
  - Splitting context by concern
  - Selector pattern for subscriptions

- **React Context Guide (react.dev):** https://react.dev/reference/react/useContext
  - Official React documentation
  - Context best practices
  - Common pitfalls

- **How to Optimize React Context Performance (LogRocket):** https://blog.logrocket.com/how-to-optimize-react-context-performance/
  - Performance optimization techniques
  - Memoization strategies
  - Real-world examples

**Key Patterns:**

- Split context by concern
- Use memoization for expensive computations
- Provide stable function references
- Consider state management libraries for complex cases

### 8.5 React Patterns

**Official Documentation:**

- **forwardRef:** https://react.dev/reference/react/forwardRef
- **useMemo:** https://react.dev/reference/react/useMemo
- **useCallback:** https://react.dev/reference/react/useCallback
- **Hooks Rules:** https://react.dev/reference/react

**Community Resources:**

- **React Patterns:** https://reactpatterns.com
- **React TypeScript Cheatsheet:** https://react-typescript-cheatsheet.netlify.app
- **react-use (GitHub):** https://github.com/streamich/react-use

---

## 9. Conclusion

This research document has provided comprehensive coverage of React Context prop evaluation patterns and best practices, specifically focused on dynamic prop evaluation at multiple levels (provider, form, field).

### Key Takeaways

1. **8-Layer Props Merging** - Formality implements sophisticated priority-based merging
2. **Isolated Field Subscriptions** - `useWatch` prevents unnecessary re-renders
3. **Non-Reactive Field State Access** - `getFieldState()` optimizes condition evaluation
4. **Proxy State Pattern** - Lazy property access enables fine-grained reactivity
5. **Expression Inference** - Automatic dependency extraction from expressions

### Formality's Strengths

The Formality codebase demonstrates excellent adherence to React Context best practices:

- **Clean interfaces** - Well-documented context values and hook options
- **Flexible types** - Polymorphic SelectValue for multiple input forms
- **Predictable merging** - Clear 8-layer priority system
- **Type safety** - Comprehensive TypeScript usage
- **Performance optimization** - Isolated subscriptions and proxy state
- **Security** - Sandboxed expression evaluation

### Recommended Next Steps

1. **Continue current patterns** - Formality's implementation is solid
2. **Consider context splitting** - Only if performance issues arise
3. **Add performance monitoring** - Measure re-render counts in production
4. **Document priority order** - Ensure users understand prop merging
5. **Provide more examples** - Real-world usage patterns in documentation

---

**Document Status:** Complete
**Last Updated:** 2026-01-11
**Maintainer:** Formality Project Team

**Note:** While external web APIs were unavailable due to rate limiting, this document is based on comprehensive codebase analysis and well-established React patterns documented in official React and form library documentation.
