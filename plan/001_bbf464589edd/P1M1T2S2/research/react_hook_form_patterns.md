# React Hook Form Integration Patterns for Library Authors

Research document examining how to properly integrate react-hook-form as a library author, including peer dependency patterns, type exports, context handling, and common wrapper patterns.

**Last Updated:** 2025-01-12
**Research Scope:** Library authoring patterns for react-hook-form v7+

---

## Table of Contents

1. [Peer Dependency Configuration](#1-peer-dependency-configuration)
2. [Common Integration Patterns](#2-common-integration-patterns)
3. [Examples of Libraries Using RHF](#3-examples-of-libraries-using-rhf)
4. [Type Export Best Practices](#4-type-export-best-practices)
5. [Context Handling Patterns](#5-context-handling-patterns)
6. [Advanced Patterns](#6-advanced-patterns)
7. [Testing Strategies](#7-testing-strategies)
8. [Performance Considerations](#8-performance-considerations)
9. [Resources and References](#9-resources-and-references)

---

## 1. Peer Dependency Configuration

### 1.1 Basic Peer Dependency Setup

The most common and recommended pattern is to specify react-hook-form as a peer dependency:

```json
{
  "name": "@your-library/react",
  "version": "1.0.0",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "react-hook-form": "^7.0.0"
  },
  "devDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.50.0"
  }
}
```

**Key Points:**

- Use `^7.0.0` to allow any 7.x version (backward compatible within major version)
- Include react-hook-form in `devDependencies` for your library's tests
- Use semver ranges that match typical usage patterns
- Don't bundle react-hook-form in your library

### 1.2 Version Range Strategy

Different approaches based on library goals:

**Conservative (Breaking changes OK):**

```json
{
  "peerDependencies": {
    "react-hook-form": "^7.40.0"
  }
}
```

- Use when you rely on newer features
- Forces users to upgrade RHF
- Allows you to use latest APIs

**Liberal (Maximum compatibility):**

```json
{
  "peerDependencies": {
    "react-hook-form": ">=7.0.0"
  }
}
```

- Use for maximum compatibility
- Must ensure your code works with older 7.x versions
- Risk: newer APIs may not exist

**Current Best Practice (2025):**

```json
{
  "peerDependencies": {
    "react-hook-form": "^7.0.0"
  }
}
```

- Balances compatibility and API availability
- Works with all 7.x versions
- Users get latest compatible version via dependency resolution

### 1.3 Optional Peer Dependencies

For libraries that can work with OR without react-hook-form:

```json
{
  "peerDependencies": {
    "react-hook-form": "^7.0.0"
  },
  "peerDependenciesMeta": {
    "react-hook-form": {
      "optional": true
    }
  }
}
```

**Use Cases:**

- Libraries that offer enhanced features when RHF is present
- Migration libraries supporting both Formik and RHF
- UI libraries with optional form integration

### 1.4 Example from Formality

**File:** `/home/dustin/projects/formality/packages/react/package.json`

```json
{
  "name": "@formality-ui/react",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-hook-form": "^7.0.0"
  },
  "devDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.50.0"
  }
}
```

**Analysis:**

- ✅ Correctly specifies RHF as peer dependency
- ✅ Includes RHF in devDependencies for testing
- ✅ Uses `^7.0.0` for broad compatibility
- ✅ Explicitly lists React versions
- ℹ️ Could update to `^18.0.0 || ^19.0.0` for React 19 support

---

## 2. Common Integration Patterns

### 2.1 Pattern 1: Form Wrapper Component

Create a wrapper component that manages the `useForm` hook internally:

```typescript
import { useForm, FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';

interface FormProps<T extends FieldValues> {
  children: React.ReactNode | ((methods: UseFormReturn<T>) => React.ReactNode);
  onSubmit: (data: T) => void;
  defaultValues?: Partial<T>;
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'all' | 'default';
}

export function Form<T extends FieldValues = FieldValues>({
  children,
  onSubmit,
  defaultValues,
  mode = 'onChange'
}: FormProps<T>) {
  const methods = useForm<T>({
    mode,
    defaultValues: defaultValues as T
  });

  const handleSubmit = methods.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit}>
        {typeof children === 'function' ? children(methods) : children}
      </form>
    </FormProvider>
  );
}
```

**Pros:**

- Encapsulates RHF setup
- Provides clean API
- Supports render props for advanced usage
- Easy to add cross-cutting concerns (auto-save, etc.)

**Cons:**

- Less flexibility than direct RHF usage
- May need to expose all RHF methods

### 2.2 Pattern 2: Controller Wrapper

Create wrapper components for controlled inputs:

```typescript
import { Controller, type ControllerProps, type FieldValues } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues>
  extends Omit<ControllerProps<T>, 'render'> {
  label?: string;
  render: (field: {
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    name: string;
  }) => React.ReactNode;
}

export function FormField<T extends FieldValues = FieldValues>({
  label,
  render,
  ...controllerProps
}: FormFieldProps<T>) {
  return (
    <Controller
      {...controllerProps}
      render={({ field }) => (
        <div className="form-field">
          {label && <label>{label}</label>}
          {render(field)}
        </div>
      )}
    />
  );
}
```

**Usage:**

```tsx
<FormField
  name="email"
  rules={{ required: "Email is required" }}
  render={({ value, onChange }) => (
    <input
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )}
/>
```

### 2.3 Pattern 3: Context Provider Pattern

Create a custom context that wraps RHF's FormProvider:

```typescript
import {
  createContext,
  useContext,
  type UseFormReturn,
  type FieldValues,
} from "react-hook-form";

interface EnhancedFormContextValue<T extends FieldValues> {
  methods: UseFormReturn<T>;
  // Add your library-specific features
  autoSave?: boolean;
  validate?: (
    data: T,
  ) => Record<string, string> | Promise<Record<string, string>>;
}

const EnhancedFormContext = createContext<EnhancedFormContextValue<any> | null>(
  null,
);

export function useEnhancedForm<T extends FieldValues = FieldValues>() {
  const context = useContext(EnhancedFormContext);
  if (!context) {
    throw new Error("useEnhancedForm must be used within EnhancedFormProvider");
  }
  return context as EnhancedFormContextValue<T>;
}
```

**Example from Formality:**

**File:** `/home/dustin/projects/formality/packages/react/src/context/FormContext.ts`

```typescript
import { createContext, useContext } from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";

export interface FormContextValue<
  TFieldValues extends FieldValues = FieldValues,
> {
  // Configuration
  config: FormFieldsConfig;
  formConfig: FormConfig;
  record?: Record<string, unknown>;

  // Registry Operations
  registerField: (name: string) => void;
  unregisterField: (name: string) => void;

  // Subscription Operations (for conditions)
  addSubscription: (target: string, subscriber: string) => void;
  removeSubscription: (target: string, subscriber: string) => void;
  registerWatcherSetter: (name: string, setter: WatcherSetterFn) => void;
  unregisterWatcherSetter: (name: string) => void;

  // Field State Operations
  changeField: (name: string, value: unknown) => void;
  setFieldValidating: (name: string, isValidating: boolean) => void;

  // State Access
  getFormState: () => FormState;

  // Submission Operations
  onSubmit?: (values: Partial<TFieldValues>) => void | Promise<void>;
  debouncedSubmit: DebouncedFunction;
  submitImmediate: () => void;

  // Unused Fields Tracking
  unusedFields: string[];

  // React Hook Form Integration
  methods: UseFormReturn<TFieldValues>;
}

export const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext<
  TFieldValues extends FieldValues = FieldValues,
>(): FormContextValue<TFieldValues> {
  const context = useContext(
    FormContext,
  ) as FormContextValue<TFieldValues> | null;

  if (!context) {
    throw new Error(
      "useFormContext must be used within a Form component. " +
        "Make sure your component is wrapped in a <Form> component.",
    );
  }

  return context;
}
```

**Key Features:**

- Extends RHF functionality with custom features
- Provides registry operations for field tracking
- Manages subscriptions for conditional logic
- Exposes RHF methods directly via `methods` property
- Type-safe with generic FieldValues parameter

### 2.4 Pattern 4: Composable Hooks

Export custom hooks that wrap RHF hooks:

```typescript
import { useFormContext, type FieldValues } from "react-hook-form";

export function useFormField<T extends FieldValues = FieldValues>(
  name: string,
) {
  const {
    register,
    formState: { errors },
    getFieldState,
  } = useFormContext<T>();

  const fieldState = getFieldState(name as any);

  return {
    register,
    error: errors[name as keyof T],
    isDirty: fieldState?.isDirty,
    isTouched: fieldState?.isTouched,
  };
}
```

---

## 3. Examples of Libraries Using RHF

### 3.1 Official RHF Ecosystem Libraries

**@hookform/resolvers** (https://github.com/react-hook-form/resolvers)

**Purpose:** Validation schema integration for popular validators

**Pattern:** Standalone resolver functions

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

function App() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  });

  return <form onSubmit={handleSubmit((data) => console.log(data))}>...</form>;
}
```

**Key Pattern:**

- Exports resolver functions compatible with RHF's `resolver` option
- No peer dependency on RHF in package.json (function is compatible)
- User provides RHF instance
- Simple function exports, no components

**Package.json:**

```json
{
  "name": "@hookform/resolvers",
  "peerDependencies": {
    "react-hook-form": "^7.0.0"
  }
}
```

**@hookform/devtools** (https://github.com/react-hook-form/devtools)

**Purpose:** Development tools for debugging RHF forms

**Pattern:** Component-based, consumes RHF context

```typescript
import { DevTool } from '@hookform/devtools';

function App() {
  const methods = useForm();

  return (
    <>
      <FormProvider {...methods}>
        {/* form content */}
      </FormProvider>
      <DevTool control={methods.control} />
    </>
  );
}
```

**Key Pattern:**

- Takes `control` object as prop
- Doesn't need to be inside FormProvider
- Standalone debugging component
- Reads form state without re-rendering form

### 3.2 UI Library Integrations

**MUI Hook Form** (https://github.com/dohomi/mui-hook-form)

**Purpose:** React Hook Form integration for Material-UI

**Pattern:** Controlled input wrappers

```typescript
import { FormContainer, TextFieldElement } from 'mui-hook-form';

function App() {
  return (
    <FormContainer
      defaultValues={{ firstName: '', lastName: '' }}
      onSuccess={handleSubmit}
    >
      <TextFieldElement name="firstName" label="First Name" required />
      <TextFieldElement name="lastName" label="Last Name" required />
      <Button type="submit">Submit</Button>
    </FormContainer>
  );
}
```

**Key Patterns:**

- Wrapper components for each MUI input type
- `FormContainer` manages RHF instance internally
- Components auto-register with parent form
- Simplified API compared to raw RHF

**react-hook-form-mui** (https://github.com/react-hook-form/react-hook-form-mui)

**Alternative MUI integration with different API design:**

```typescript
import { FormContainer, TextFieldElement } from 'react-hook-form-mui';

function App() {
  return (
    <FormContainer
      defaultValues={{ name: '' }}
      onSuccess={data => console.log(data)}
    >
      <TextFieldElement name="name" label="Name" required />
    </FormContainer>
  );
}
```

### 3.3 Form Builder Libraries

**Formality** (This Project)

**Purpose:** Config-driven form library built on RHF

**Pattern:** Configuration-driven with context management

**File:** `/home/dustin/projects/formality/packages/react/src/components/Form.tsx`

```typescript
import { Form } from '@formality-ui/react';

function App() {
  return (
    <Form
      config={{
        name: { type: 'textField', label: 'Name' },
        email: { type: 'textField', label: 'Email' },
      }}
      onSubmit={(values) => console.log(values)}
    >
      <Field name="name" />
      <Field name="email" />
      <button type="submit">Submit</button>
    </Form>
  );
}
```

**Key Patterns:**

- Uses `useForm` internally to create RHF instance
- Wraps children in `FormProvider` for context access
- Creates custom `FormContext` for library-specific features
- Manages field registration and subscription tracking
- Provides auto-save with debouncing
- Tracks unused fields for config-driven rendering

**Integration Points:**

1. **Peer Dependency:** RHF as peer dep
2. **Internal Usage:** `useForm()` hook in Form component
3. **Context Passthrough:** `FormProvider` wraps children
4. **Type Exports:** Re-exports RHF types
5. **Custom Context:** Additional FormContext for features

**react-jsonschema-form** (with RHF backend)

**Purpose:** Generate forms from JSON Schema

**Pattern:** Schema-to-form transformation

```typescript
import { withReactHookForm } from '@rjsf/react';

const Form = withReactHookForm(JsonSchemaForm);

function App() {
  return (
    <Form
      schema={schema}
      formData={formData}
      onChange={({ formData }) => setFormData(formData)}
    />
  );
}
```

### 3.4 Headless Form Libraries

**react-form-builder** (Pattern example)

```typescript
import { FormBuilder, Fieldset } from 'react-form-builder';

function App() {
  return (
    <FormBuilder onSubmit={handleSubmit}>
      <Fieldset fields={[
        { name: 'email', type: 'email', required: true },
        { name: 'password', type: 'password', required: true }
      ]} />
    </FormBuilder>
  );
}
```

---

## 4. Type Export Best Practices

### 4.1 Re-export RHF Types

Provide convenient access to commonly-used RHF types:

```typescript
// types.ts
export type {
  // Core types
  FieldValues,
  FieldPath,
  FieldPathValue,
  FieldPathValues,

  // Form types
  UseFormReturn,
  UseFormProps,
  UseFormRegister,
  UseFormHandleSubmit,
  UseFormWatch,
  UseFormSetValue,
  UseFormTrigger,
  UseFormReset,
  UseFormClearErrors,
  UseFormSetError,

  // Field state types
  FieldState,
  ControllerProps,
  ControllerFieldState,

  // Form state types
  UseFormStateReturn,
  FormState,

  // Error types
  FieldError,
  FieldErrors,

  // Validation types
  RegisterOptions,
} from "react-hook-form";
```

**Example from Formality:**

**File:** `/home/dustin/projects/formality/packages/react/src/types.ts`

```typescript
import type {
  ControllerFieldState,
  UseFormStateReturn,
  FieldValues,
} from "react-hook-form";

export interface InputTemplateProps {
  Field: ComponentType<any>;
  fieldProps: Record<string, unknown>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<FieldValues>;
}

export interface CustomFieldState {
  value: unknown;
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  error?: FieldError;
  invalid: boolean;
}
```

### 4.2 Create Library-Specific Type Extensions

Extend RHF types with your library's features:

```typescript
// library-types.ts
import type { UseFormReturn, FieldValues } from "react-hook-form";

export interface EnhancedFormReturn<
  T extends FieldValues,
> extends UseFormReturn<T> {
  // Add your library-specific methods
  autoSave: (enabled: boolean) => void;
  validateField: (name: string) => Promise<boolean>;
  getFieldValue: <TField extends FieldPath<T>>(
    name: TField,
  ) => FieldPathValue<T, TField>;
}
```

### 4.3 Generic Type Parameters

Maintain type safety through generics:

```typescript
import type { FieldValues } from "react-hook-form";

interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  defaultValues?: Partial<TFieldValues>;
  onSubmit: (data: TFieldValues) => void;
  children: React.ReactNode;
}

export function Form<T extends FieldValues = FieldValues>(props: FormProps<T>) {
  // Implementation
}
```

**Example from Formality:**

**File:** `/home/dustin/projects/formality/packages/react/src/context/FormContext.ts`

```typescript
export interface FormContextValue<
  TFieldValues extends FieldValues = FieldValues,
> {
  config: FormFieldsConfig;
  formConfig: FormConfig;
  record?: Record<string, unknown>;

  // ... methods

  methods: UseFormReturn<TFieldValues>;
}

export function useFormContext<
  TFieldValues extends FieldValues = FieldValues,
>(): FormContextValue<TFieldValues> {
  // Implementation
}
```

**Benefits:**

- Maintains type inference
- Default `FieldValues` for flexibility
- Allows specific typing when needed
- Preserves autocomplete/intellisense

### 4.4 Conditional Type Exports

For libraries that work with/without RHF:

```typescript
import type { UseFormReturn, FieldValues } from 'react-hook-form';

// Base types (always available)
export interface BaseFormProps {
  children: React.ReactNode;
}

// RHF-specific types (only when RHF is installed)
export interface RHFFormProps<T extends FieldValues> extends BaseFormProps {
  methods: UseFormReturn<T>;
}

// Conditional export
export type FormProps<T extends FieldValues> =
  typeof useFormReturn !== 'undefined'
    ? RHFFormProps<T>
    : BaseFormProps;
```

### 4.5 Type Utilities

Create helper types for common patterns:

```typescript
import type { FieldValues, FieldPath, FieldPathValue } from "react-hook-form";

// Extract field names from schema
export type FieldNames<T> = keyof T & string;

// Create typed form state
export type TypedFormState<T extends FieldValues> = {
  values: T;
  errors: Partial<Record<FieldPath<T>, string>>;
  touched: Partial<Record<FieldPath<T>, boolean>>;
};

// Extract value type from field path
export type GetFieldType<T, K extends keyof T> = T[K];
```

### 4.6 Best Practices Summary

**DO:**

- ✅ Re-export commonly used RHF types
- ✅ Maintain generic type parameters
- ✅ Extend RHF types rather than replacing them
- ✅ Provide sensible defaults (`= FieldValues`)
- ✅ Document type requirements
- ✅ Use proper type constraints (`extends FieldValues`)

**DON'T:**

- ❌ Create duplicate type definitions
- ❌ Break type inference from RHF
- ❌ Use `any` unnecessarily
- ❌ Hide RHF types from consumers
- ❌ Create incompatible type signatures

---

## 5. Context Handling Patterns

### 5.1 Using FormProvider

The standard approach to provide RHF context:

```typescript
import { FormProvider, useForm } from 'react-hook-form';

function MyForm() {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      <ChildComponent />
    </FormProvider>
  );
}

function ChildComponent() {
  const { register } = useFormContext(); // From RHF
  return <input {...register('field')} />;
}
```

**Key Points:**

- Spread all `useForm` return values to `FormProvider`
- Children access via `useFormContext()` from RHF
- Single source of truth for form state
- Works with nested forms (each has its own context)

### 5.2 Extending FormProvider

Create wrapper with additional context:

```typescript
import { FormProvider, useForm, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { createContext, useContext } from 'react';

interface EnhancedFormValue<T extends FieldValues> {
  methods: UseFormReturn<T>;
  // Your additions
  autoSave?: boolean;
  validate?: (data: T) => void;
}

const EnhancedFormContext = createContext<EnhancedFormValue<any> | null>(null);

export function EnhancedForm<T extends FieldValues>({
  children,
  ...formProps
}: FormProps<T>) {
  const methods = useForm<T>(formProps);

  const contextValue: EnhancedFormValue<T> = {
    methods,
    // ... your additions
  };

  return (
    <FormProvider {...methods}>
      <EnhancedFormContext.Provider value={contextValue}>
        {children}
      </EnhancedFormContext.Provider>
    </FormProvider>
  );
}
```

**Example from Formality:**

**File:** `/home/dustin/projects/formality/packages/react/src/components/Form.tsx` (simplified)

```typescript
export function Form<TFieldValues extends FieldValues = FieldValues>({
  children,
  config,
  onSubmit,
  autoSave = false,
}: FormProps<TFieldValues>): JSX.Element {
  // Initialize RHF
  const methods = useForm<TFieldValues>({
    mode: "onChange",
    defaultValues: defaultValues as any,
  });

  // Create custom context value
  const contextValue = useMemo<FormContextValue<TFieldValues>>(
    () => ({
      config,
      registerField,
      unregisterField,
      addSubscription,
      removeSubscription,
      changeField,
      getFormState,
      onSubmit,
      debouncedSubmit: debouncedSubmitRef.current!,
      submitImmediate,
      unusedFields,
      methods: methods as any, // Pass through RHF methods
    }),
    [/* deps */],
  );

  return (
    <FormProvider {...methods}>
      <FormContext.Provider value={contextValue as any}>
        <GroupContext.Provider value={defaultGroupContext}>
          {children}
        </GroupContext.Provider>
      </FormContext.Provider>
    </FormProvider>
  );
}
```

**Pattern Highlights:**

1. **Dual Context:** Uses both `FormProvider` (RHF) and `FormContext` (custom)
2. **Context Composition:** Wraps additional contexts (e.g., `GroupContext`)
3. **Passthrough:** Exposes `methods` directly in custom context
4. **Isolation:** Custom features don't interfere with RHF

### 5.3 Context Isolation Pattern

For libraries that may be used alongside other RHF forms:

```typescript
import { createContext, useContext } from "react";

const FORM_CONTEXT_KEY = Symbol("your-library-form");

export function createIsolatedContext<T extends FieldValues>() {
  const context = createContext<UseFormReturn<T> | null>(null);

  return {
    Provider: context.Provider,
    useContext: () => {
      const formContext = useContext(context);
      if (!formContext) {
        throw new Error("Must be used within form provider");
      }
      return formContext;
    },
  };
}
```

### 5.4 Nested Context Handling

Handle nested forms (forms within forms):

```typescript
import { createContext, useContext, useMemo } from 'react';
import { useFormContext as useRHFContext } from 'react-hook-form';

// Create context stack for nested forms
const FormStackContext = createContext<UseFormReturn<any>[]>([]);

export function useFormStack() {
  const stack = useContext(FormStackContext);
  const current = useRHFContext();

  return {
    // Get current form
    currentForm: current,

    // Get parent form
    parentForm: stack[stack.length - 2],

    // Get all forms in stack
    allForms: [...stack, current],
  };
}

export function FormStackProvider({ children }: { children: React.ReactNode }) {
  const current = useRHFContext();
  const parentStack = useContext(FormStackContext);

  const stack = useMemo(() => [...parentStack, current], [parentStack, current]);

  return (
    <FormStackContext.Provider value={stack}>
      {children}
    </FormStackContext.Provider>
  );
}
```

### 5.5 Performance-Optimized Context

Prevent unnecessary re-renders with selective context:

```typescript
import { createContext, useContext, useMemo } from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";

interface FormContextValue<T extends FieldValues> {
  methods: UseFormReturn<T>;
}

const FormContext = createContext<FormContextValue<any> | null>(null);

// Split into separate contexts to avoid re-renders
const FormMethodsContext = createContext<UseFormReturn<any> | null>(null);
const FormMetadataContext = createContext<{ isSubmitting: boolean } | null>(
  null,
);

export function useFormMethods<T extends FieldValues>() {
  const methods = useContext(FormMethodsContext);
  if (!methods) throw new Error("Must be in form");
  return methods as UseFormReturn<T>;
}

export function useFormMetadata() {
  const metadata = useContext(FormMetadataContext);
  if (!metadata) throw new Error("Must be in form");
  return metadata;
}
```

**Example from Formality - Performance Optimization:**

**File:** `/home/dustin/projects/formality/packages/react/src/components/Form.tsx` (performance section)

```typescript
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
              formState: methods.formState,  // Only accessed for render functions
              methods: methods as any,
              resolvedTitle,
            })
          : children}
      </GroupContext.Provider>
    </FormContext.Provider>
  </FormProvider>
);
```

**Key Pattern:**

- Only access `methods.formState` when needed (render function)
- Static children don't subscribe to form state
- Prevents unnecessary re-renders of child components

### 5.6 Context Validation

Provide helpful errors for context misuse:

```typescript
import { useContext } from "react";
import { useFormContext as useRHFContext } from "react-hook-form";

export function useFormContext<T extends FieldValues = FieldValues>() {
  try {
    return useRHFContext<T>() as UseFormReturn<T>;
  } catch (error) {
    if (error instanceof Error && error.message.includes("useFormContext")) {
      throw new Error(
        "useFormContext must be used within a Form component. " +
          "Wrap your component in <Form>...</Form>",
      );
    }
    throw error;
  }
}
```

---

## 6. Advanced Patterns

### 6.1 Auto-Save Implementation

```typescript
import { useForm, useFormState } from "react-hook-form";
import { useEffect, useRef } from "react";
import { debounce } from "lodash-es";

export function useAutoSave(
  onSubmit: (data: any) => Promise<void>,
  debounceMs = 1000,
) {
  const { dirtyFields } = useFormState();
  const isSavingRef = useRef(false);

  const debouncedSave = useRef(
    debounce(async (data) => {
      if (!isSavingRef.current && Object.keys(dirtyFields).length > 0) {
        isSavingRef.current = true;
        try {
          await onSubmit(data);
        } finally {
          isSavingRef.current = false;
        }
      }
    }, debounceMs),
  ).current;

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return debouncedSave;
}
```

**Example from Formality:**

**File:** `/home/dustin/projects/formality/packages/react/src/components/Form.tsx` (auto-save)

```typescript
// Auto-save tracking
const pendingChangedFields = useRef(new Set<string>());
const pendingAffectedFields = useRef(new Set<string>());
const executionVersionRef = useRef(0);

// Wait for field validation before auto-save
const waitForFieldValidation = useCallback(
  async (fields: string[], version: number): Promise<boolean> => {
    const maxWaitMs = 10000;
    const pollIntervalMs = 50;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      if (executionVersionRef.current !== version) {
        return false; // New changes came in
      }

      const allDone = fields.every(
        (field) => !validatingFields.current.get(field),
      );
      if (allDone) return true;

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    return true; // Timeout - proceed anyway
  },
  [],
);

// Execute auto-save with validation awareness
const executeAutoSave = useCallback(async () => {
  executionVersionRef.current++;
  const executionVersion = executionVersionRef.current;

  const changedFields = new Set(pendingChangedFields.current);
  const affectedFields = new Set(pendingAffectedFields.current);
  pendingChangedFields.current.clear();
  pendingAffectedFields.current.clear();

  if (changedFields.size === 0) return;

  const fieldsToWaitFor = [...changedFields, ...affectedFields];
  const validationsComplete = await waitForFieldValidation(
    fieldsToWaitFor,
    executionVersion,
  );

  if (
    !validationsComplete ||
    executionVersionRef.current !== executionVersion
  ) {
    return; // Abort - new changes came in
  }

  // Submit
  const values = methods.getValues();
  await handleSubmit(values as TFieldValues);
}, [methods, handleSubmit, waitForFieldValidation]);
```

**Advanced Features:**

- Version tracking to abort stale saves
- Validation completion waiting
- Field dependency tracking
- Debouncing with cancellation

### 6.2 Conditional Field Rendering

```typescript
import { useFormContext, useFormState } from "react-hook-form";
import { useMemo } from "react";

export function useConditionalField(
  name: string,
  condition: (values: any) => boolean,
) {
  const { watch } = useFormContext();
  const formValues = watch();

  const isVisible = useMemo(() => {
    return condition(formValues);
  }, [formValues, condition]);

  return { isVisible };
}
```

### 6.3 Field Subscription Management

```typescript
import { useCallback, useRef } from "react";

export function useFieldSubscriptions() {
  // Inverted index: target -> Set<subscribers>
  const invertedSubscriptions = useRef(new Map<string, Set<string>>());

  const addSubscription = useCallback((target: string, subscriber: string) => {
    if (!invertedSubscriptions.current.has(target)) {
      invertedSubscriptions.current.set(target, new Set());
    }
    invertedSubscriptions.current.get(target)!.add(subscriber);
  }, []);

  const removeSubscription = useCallback(
    (target: string, subscriber: string) => {
      invertedSubscriptions.current.get(target)?.delete(subscriber);
    },
    [],
  );

  const getSubscribers = useCallback((target: string) => {
    return invertedSubscriptions.current.get(target) || new Set();
  }, []);

  return { addSubscription, removeSubscription, getSubscribers };
}
```

**Example from Formality:**

**File:** `/home/dustin/projects/formality/packages/react/src/components/Form.tsx` (subscriptions)

```typescript
// Subscription management (inverted index: target → subscribers)
const invertedSubscriptions = useRef(new Map<string, Set<string>>());

const addSubscription = useCallback((target: string, subscriber: string) => {
  if (!invertedSubscriptions.current.has(target)) {
    invertedSubscriptions.current.set(target, new Set());
  }
  invertedSubscriptions.current.get(target)!.add(subscriber);

  // Notify target field if mounted
  const setter = watcherSetters.current.get(target);
  if (setter) {
    setter((prev) => ({ ...prev, [subscriber]: true }));
  }
}, []);

/**
 * Get all fields affected by a change to the given field.
 * Traverses subscription graph for transitive dependencies.
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
```

### 6.4 Dynamic Form Schemas

```typescript
import { useForm } from "react-hook-form";
import { useMemo } from "react";

export function useDynamicForm<T extends FieldValues>(
  schemaFactory: (values: Partial<T>) => T,
  initialValues: Partial<T>,
) {
  const form = useForm<T>({
    defaultValues: initialValues as T,
  });

  const currentValues = form.watch();

  // Recompute schema when values change
  const schema = useMemo(() => {
    return schemaFactory(currentValues);
  }, [currentValues, schemaFactory]);

  return { form, schema };
}
```

### 6.5 Cross-Field Validation

```typescript
import { useFormContext } from "react-hook-form";
import { useCallback } from "react";

export function useCrossFieldValidation() {
  const { trigger, watch } = useFormContext();

  const validateRelatedFields = useCallback(
    async (fieldName: string, relatedFields: string[]) => {
      const values = watch();

      // Trigger validation for all related fields
      await trigger([fieldName, ...relatedFields] as any);

      return values;
    },
    [trigger, watch],
  );

  return { validateRelatedFields };
}
```

---

## 7. Testing Strategies

### 7.1 Testing with React Testing Library

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { Form } from './Form';

describe('Form component', () => {
  it('submits form data', async () => {
    const handleSubmit = jest.fn();

    render(
      <Form onSubmit={handleSubmit}>
        <input name="email" />
        <button type="submit">Submit</button>
      </Form>
    );

    await userEvent.type(screen.getByRole('textbox'), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });
});
```

### 7.2 Testing with Custom RHF Context

```typescript
import { renderHook } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { useCustomFormHook } from './useCustomFormHook';

const wrapper = ({ children }) => {
  const methods = useForm({ defaultValues: { name: '' } });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('useCustomFormHook', () => {
  it('registers fields correctly', () => {
    const { result } = renderHook(() => useCustomFormHook(), { wrapper });

    expect(result.current.register).toBeDefined();
  });
});
```

### 7.3 Example from Formality

**File:** `/home/dustin/projects/formality/packages/react/src/__tests__/priorityOrder.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Form, Field } from '@formality-ui/react';
import userEvent from '@testing-library/user-event';

describe('Priority Order Tests', () => {
  it('respects field-level validation priority', async () => {
    let submittedData: any = null;

    const { getByText, getByLabelText } = render(
      <Form
        config={{
          name: {
            type: 'textField',
            validate: { required: 'Name is required' },
          },
        }}
        onSubmit={(data) => { submittedData = data; }}
      >
        <Field name="name">
          {(props) => <input {...props.field} />}
        </Field>
        <button type="submit">Submit</button>
      </Form>
    );

    await userEvent.click(getByText('Submit'));

    await waitFor(() => {
      expect(getByText('Name is required')).toBeInTheDocument();
    });
  });
});
```

---

## 8. Performance Considerations

### 8.1 Minimize Re-renders

**Problem:** Accessing `formState` creates subscriptions.

**Solution:**

```typescript
// ❌ BAD - Subscribes to all form state
function MyComponent() {
  const { formState } = useFormContext();
  return <div>{formState.isDirty ? 'Dirty' : 'Clean'}</div>;
}

// ✅ GOOD - Use selectors
function MyComponent() {
  const isDirty = useFormState({
    name: 'isDirty' // Only subscribe to isDirty
  });
  return <div>{isDirty ? 'Dirty' : 'Clean'}</div>;
}

// ✅ BETTER - Use isolated context
function MyComponent() {
  const { isDirty } = useOptimizedFormContext();
  return <div>{isDirty ? 'Dirty' : 'Clean'}</div>;
}
```

### 8.2 Memoize Context Values

```typescript
const contextValue = useMemo(
  () => ({
    methods,
    registerField,
    unregisterField,
    // ... other values
  }),
  [methods, registerField, unregisterField],
);
```

**Example from Formality:**

```typescript
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
  ],
);
```

### 8.3 Lazy Field Registration

```typescript
const fieldRegistry = useRef(new Set<string>());

const registerField = useCallback((name: string) => {
  fieldRegistry.current.add(name);
  setRegisteredFields(new Set(fieldRegistry.current));
}, []);

const unregisterField = useCallback((name: string) => {
  fieldRegistry.current.delete(name);
  setRegisteredFields(new Set(fieldRegistry.current));
}, []);
```

### 8.4 Debounce Expensive Operations

```typescript
import { debounce } from "lodash-es";
import { useRef, useEffect } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const debouncedRef = useRef<ReturnType<typeof debounce>>();

  useEffect(() => {
    debouncedRef.current = debounce(callback, delay);
    return () => {
      debouncedRef.current?.cancel();
    };
  }, [callback, delay]);

  return debouncedRef.current as any;
}
```

---

## 9. Resources and References

### 9.1 Official Documentation

**React Hook Form**

- Website: https://react-hook-form.com
- GitHub: https://github.com/react-hook-form/react-hook-form
- Documentation: https://react-hook-form.com/docs

**Key Documentation Sections:**

- `useForm` API: https://react-hook-form.com/docs/useform
- `useFormContext` API: https://react-hook-form.com/docs/useformcontext
- `FormProvider` API: https://react-hook-form.com/docs/useformcontext
- `Controller` API: https://react-hook-form.com/docs/controller
- TypeScript Guide: https://react-hook-form.com/ts

### 9.2 Official RHF Packages

**@hookform/resolvers**

- Repository: https://github.com/react-hook-form/resolvers
- npm: https://www.npmjs.com/package/@hookform/resolvers
- Purpose: Validation schema integration (Zod, Yup, Joi, etc.)

**@hookform/devtools**

- Repository: https://github.com/react-hook-form/devtools
- npm: https://www.npmjs.com/package/@hookform/devtools
- Purpose: Development tools for debugging

### 9.3 Community Libraries

**MUI Integrations:**

- mui-hook-form: https://github.com/dohomi/mui-hook-form
- react-hook-form-mui: https://github.com/react-hook-form/react-hook-form-mui

**Other UI Libraries:**

- rhf-mui: Material-UI components for RHF
- chakra-ui-hook-form: Chakra UI integration
- mantine-hook-form: Mantine UI integration

### 9.4 Best Practices

**Peer Dependency Management:**

- npm docs on peerDependencies: https://docs.npmjs.com/cli/v9/configuring-npm/package-json#v748
- Semantic Versioning: https://semver.org/

**TypeScript Patterns:**

- React Hook Form TypeScript: https://react-hook-form.com/ts
- TypeScript Generics: https://www.typescriptlang.org/docs/handbook/2/generics.html

**Testing:**

- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Testing RHF Forms: https://react-hook-form.com/advanced-use#testing

### 9.5 Articles and Tutorials

**Integration Patterns:**

- Building a Form Library with React Hook Form (various blog posts)
- Advanced React Hook Form Patterns (community articles)

**Performance:**

- Optimizing React Hook Form Performance
- Minimizing Re-renders with React Hook Form

### 9.6 Code Examples

**This Project (Formality):**

- Repository: `/home/dustin/projects/formality`
- React Package: `/home/dustin/projects/formality/packages/react`
- Key Files:
  - Form component: `/home/dustin/projects/formality/packages/react/src/components/Form.tsx`
  - FormContext: `/home/dustin/projects/formality/packages/react/src/context/FormContext.ts`
  - Types: `/home/dustin/projects/formality/packages/react/src/types.ts`
  - Index exports: `/home/dustin/projects/formality/packages/react/src/index.ts`
  - package.json: `/home/dustin/projects/formality/packages/react/package.json`

### 9.7 Version Compatibility

**React Hook Form v7:**

- Released: 2021
- Current: v7.51.x (as of 2025)
- Minimum React: 16.8.0 (hooks)
- Recommended React: 18.0.0+

**React Version Support:**

- React 16.8: Supported
- React 17.x: Supported
- React 18.x: Supported
- React 19.x: Supported (verify latest RHF version)

### 9.8 Common Issues and Solutions

**Issue 1: Multiple RHF Instances**

- Problem: Conflicting form contexts
- Solution: Use `FormProvider` consistently

**Issue 2: Type Inference Lost**

- Problem: Generic types not propagating
- Solution: Maintain type parameters through component hierarchy

**Issue 3: Unnecessary Re-renders**

- Problem: Accessing `formState` in components
- Solution: Use `useFormState` with selectors or isolated context

**Issue 4: Peer Dependency Conflicts**

- Problem: Multiple versions of RHF
- Solution: Use `^7.0.0` for compatibility, dedupe dependencies

---

## 10. Summary and Recommendations

### 10.1 Recommended Package Configuration

```json
{
  "name": "@your-library/react",
  "version": "1.0.0",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "react-hook-form": "^7.0.0"
  },
  "devDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.50.0"
  }
}
```

### 10.2 Recommended Code Structure

```
packages/react/
├── src/
│   ├── components/
│   │   ├── Form.tsx          # Main form wrapper
│   │   ├── Field.tsx         # Field component
│   │   └── FormProvider.tsx  # Context provider
│   ├── context/
│   │   ├── FormContext.tsx   # Custom context
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useFormState.ts   # Custom hooks
│   │   └── index.ts
│   ├── types.ts              # Type definitions
│   └── index.ts              # Public exports
├── package.json
└── tsconfig.json
```

### 10.3 Key Takeaways

1. **Peer Dependency:** Always use RHF as a peer dependency
2. **Type Safety:** Maintain generic type parameters throughout
3. **Context Management:** Use `FormProvider` + custom context
4. **Performance:** Minimize formState subscriptions
5. **Testing:** Test with React Testing Library + RHF helpers
6. **Documentation:** Document RHF version requirements
7. **Type Exports:** Re-export commonly used RHF types
8. **API Design:** Provide both high-level and low-level APIs

### 10.4 Decision Matrix

**When to use each pattern:**

| Scenario                  | Pattern            | Why                          |
| ------------------------- | ------------------ | ---------------------------- |
| Simple form wrapper       | Pattern 1          | Basic RHF encapsulation      |
| Custom input library      | Pattern 2          | Controlled input integration |
| Feature-rich form library | Pattern 3          | Extended context needed      |
| Composable hooks          | Pattern 4          | Reusable field logic         |
| Config-driven forms       | Formality approach | Dynamic field rendering      |

---

**End of Research Document**

_This document is a living resource. Update as new patterns emerge and React Hook Form evolves._
