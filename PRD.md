# Formality v1.0 - Complete Specification
## Comprehensive Framework Documentation

This document provides complete, unambiguous specifications for every aspect of the Formality framework based on analysis of the working implementation (sellario-ui-formality-base) and gap analysis from the rewrite attempt.

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
   - 1.1 [Core Principles](#11-core-principles)
   - 1.2 [Data Flow Summary](#12-data-flow-summary)
   - 1.3 [Package Architecture](#13-package-architecture)
2. [Performance Architecture](#2-performance-architecture)
3. [Type System](#3-type-system)
4. [Context System](#4-context-system)
5. [Expression Engine](#5-expression-engine)
6. [Component Specifications](#6-component-specifications)
7. [Field Configuration System](#7-field-configuration-system)
8. [Conditions System](#8-conditions-system)
9. [Subscription System](#9-subscription-system)
10. [Validation System](#10-validation-system)
11. [Value Transformation Pipeline](#11-value-transformation-pipeline)
12. [Auto-Save System](#12-auto-save-system)
13. [FieldGroup Mechanics](#13-fieldgroup-mechanics)
14. [Initial Value Resolution](#14-initial-value-resolution)
15. [Field Ordering](#15-field-ordering)
16. [Label Resolution Pipeline](#16-label-resolution-pipeline)
17. [Props Evaluation Pipeline](#17-props-evaluation-pipeline)
18. [Complete Data Flow](#18-complete-data-flow)
19. [Edge Cases and Behaviors](#19-edge-cases-and-behaviors)

---

## 1. Architecture Overview

### 1.1 Core Principles

**Three-Layer Architecture:**

```
┌─────────────────────────────────────────────────────┐
│              FormalityProvider (Global)             │
│  • Input type definitions                           │
│  • Formatters/Parsers                               │
│  • Validators                                       │
│  • Error messages                                   │
│  • Default props                                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│                Form (Instance)                      │
│  • React Hook Form integration                      │
│  • Field registry                                   │
│  • Subscription management                          │
│  • Condition evaluation                             │
│  • Form-level config overrides                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              Field (Component)                      │
│  • Controller integration                           │
│  • Props resolution & evaluation                    │
│  • Value transformation                             │
│  • Condition application                            │
│  • Watcher state management                         │
└─────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Summary

```
Record → Form → Field → Transform → Component → User Input
  ↓                                                    ↓
  └────────────────────────────────────────────────────┘
           Validation → Transform → Submit Value
```

### 1.3 Package Architecture

**DESIGN GOAL**: Formality is architected as a multi-package monorepo to enable framework-agnostic core logic with framework-specific adapters. This separation allows the same battle-tested logic to power React, Vue, and Svelte implementations.

#### 1.3.1 Package Structure

```
packages/
├── core/                    # @formality/core - Zero framework dependencies
│   ├── src/
│   │   ├── expression/      # Expression parsing & evaluation
│   │   │   ├── evaluate.ts      # Expression evaluation engine
│   │   │   ├── infer.ts         # Field dependency inference
│   │   │   └── context.ts       # Evaluation context building
│   │   ├── conditions/      # Condition evaluation (pure functions)
│   │   │   └── evaluate.ts      # (conditions, state) => { disabled, visible, value }
│   │   ├── validation/      # Validation pipeline
│   │   │   ├── validate.ts      # Validator composition & execution
│   │   │   └── messages.ts      # Error message resolution
│   │   ├── transform/       # Value transformation
│   │   │   └── pipeline.ts      # Parser/formatter application
│   │   ├── config/          # Configuration utilities
│   │   │   ├── merge.ts         # Config resolution & merging
│   │   │   ├── defaults.ts      # Default value resolution
│   │   │   └── ordering.ts      # Field ordering utilities
│   │   ├── labels/          # Label resolution
│   │   │   └── resolve.ts       # Label/title resolution pipeline
│   │   └── types/           # All TypeScript interfaces
│   │       ├── config.ts        # FieldConfig, InputConfig, etc.
│   │       ├── state.ts         # FormState, FieldState, etc.
│   │       ├── conditions.ts    # ConditionDescriptor, etc.
│   │       └── index.ts         # Re-exports all types
│   ├── package.json
│   └── tsconfig.json
│
├── react/                   # @formality/react - React/RHF implementation
│   ├── src/
│   │   ├── components/
│   │   │   ├── Form.tsx
│   │   │   ├── Field.tsx
│   │   │   ├── FieldGroup.tsx
│   │   │   ├── Provider.tsx
│   │   │   └── UnusedFields.tsx
│   │   ├── hooks/
│   │   │   ├── useConditions.ts
│   │   │   ├── useField.ts
│   │   │   ├── useSubscriptions.ts
│   │   │   ├── usePropsEvaluation.ts
│   │   │   └── useFormState.ts
│   │   ├── context/
│   │   │   ├── FormContext.ts
│   │   │   ├── ConfigContext.ts
│   │   │   └── GroupContext.ts
│   │   └── index.ts
│   ├── package.json         # Depends on @formality/core, react-hook-form
│   └── tsconfig.json
│
├── vue/                     # @formality/vue - Vue implementation (STUBBED)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Form.vue
│   │   │   ├── Field.vue
│   │   │   └── FieldGroup.vue
│   │   ├── composables/
│   │   │   ├── useConditions.ts
│   │   │   └── useField.ts
│   │   └── index.ts
│   ├── package.json         # Depends on @formality/core, vue
│   └── README.md            # "Coming soon" placeholder
│
└── svelte/                  # @formality/svelte - Svelte implementation (STUBBED)
    ├── src/
    │   ├── components/
    │   │   ├── Form.svelte
    │   │   ├── Field.svelte
    │   │   └── FieldGroup.svelte
    │   ├── stores/
    │   │   └── form.ts
    │   └── index.ts
    ├── package.json         # Depends on @formality/core, svelte
    └── README.md            # "Coming soon" placeholder
```

#### 1.3.2 What Belongs in `@formality/core`

The core package contains **pure functions with zero framework dependencies**. These modules MUST NOT import React, Vue, Svelte, or any framework-specific libraries.

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `expression/evaluate` | Evaluate string expressions against state | `evaluate(expr, context)` |
| `expression/infer` | Extract field dependencies from expressions | `inferFieldsFromDescriptor(descriptor)` |
| `expression/context` | Build evaluation context from state | `buildEvaluationContext(fields, record, props)` |
| `conditions/evaluate` | Evaluate conditions to get disabled/visible/value | `evaluateConditions(conditions, state)` |
| `validation/validate` | Run validators and compose results | `validate(value, rules, validators, formValues)` |
| `validation/messages` | Resolve error messages from types | `resolveErrorMessage(error, messages)` |
| `transform/pipeline` | Apply parsers and formatters | `parse(value, parser)`, `format(value, formatter)` |
| `config/merge` | Merge provider + form + field configs | `mergeConfigs(provider, form, field)` |
| `config/defaults` | Resolve initial/default values | `resolveInitialValue(record, config, inputConfig)` |
| `config/ordering` | Sort fields by order property | `sortFieldsByOrder(fields, config)` |
| `labels/resolve` | Resolve field labels/titles | `resolveLabel(config, fieldName)` |
| `types/*` | All TypeScript interfaces | All type definitions |

**Example - Pure condition evaluation in core:**

```typescript
// @formality/core/src/conditions/evaluate.ts
// NO framework imports allowed here

import type { ConditionDescriptor, ConditionResult } from '../types';
import { evaluate } from '../expression/evaluate';

export interface EvaluateConditionsInput {
  conditions: ConditionDescriptor[];
  fieldValues: Record<string, unknown>;
  record: Record<string, unknown>;
  props?: Record<string, unknown>;
}

export interface ConditionResult {
  disabled: boolean | undefined;
  visible: boolean | undefined;
  setValue: unknown | undefined;
  hasDisabledCondition: boolean;
  hasVisibleCondition: boolean;
  hasSetCondition: boolean;
}

export function evaluateConditions(input: EvaluateConditionsInput): ConditionResult {
  const { conditions, fieldValues, record, props } = input;

  let disabled: boolean | undefined;
  let visible: boolean | undefined;
  let setValue: unknown | undefined;
  let hasDisabledCondition = false;
  let hasVisibleCondition = false;
  let hasSetCondition = false;

  const context = buildEvaluationContext(fieldValues, record, props);

  for (const condition of conditions) {
    const isMatched = evaluateConditionMatch(condition, context);

    if (isMatched) {
      if (condition.disabled !== undefined) {
        hasDisabledCondition = true;
        disabled = disabled || condition.disabled; // OR logic
      }
      if (condition.visible !== undefined) {
        hasVisibleCondition = true;
        visible = visible === undefined ? condition.visible : visible && condition.visible; // AND logic
      }
      if (condition.set !== undefined || condition.selectSet !== undefined) {
        hasSetCondition = true;
        setValue = condition.selectSet
          ? evaluate(condition.selectSet, context)
          : condition.set;
      }
    }
  }

  return { disabled, visible, setValue, hasDisabledCondition, hasVisibleCondition, hasSetCondition };
}
```

#### 1.3.3 What Belongs in `@formality/react`

The React package contains **React-specific implementations** that use core functions internally.

| Module | Purpose | Uses Core |
|--------|---------|-----------|
| `components/Form` | RHF integration, context providers | config/merge |
| `components/Field` | Controller wrapper, state management | All core modules |
| `components/FieldGroup` | Group context provider | conditions/evaluate |
| `hooks/useConditions` | React hook wrapping condition evaluation | conditions/evaluate |
| `hooks/useField` | RHF Controller integration | transform/pipeline, validation/validate |
| `hooks/useSubscriptions` | Field dependency tracking | expression/infer |
| `hooks/usePropsEvaluation` | Evaluate selectProps with memoization | expression/evaluate |
| `context/*` | React Context definitions | types/* |

**Example - React hook calling core function:**

```typescript
// @formality/react/src/hooks/useConditions.ts
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { evaluateConditions, inferFieldsFromConditions } from '@formality/core';
import type { ConditionDescriptor } from '@formality/core';
import { useFormContext } from '../context/FormContext';

export function useConditions(
  conditions: ConditionDescriptor[],
  explicitSubscriptions?: string[]
) {
  const { record } = useFormContext();

  // Use core's inference to find dependencies
  const inferredFields = useMemo(
    () => inferFieldsFromConditions(conditions),
    [conditions]
  );

  const watchFields = explicitSubscriptions ?? inferredFields;

  // React-specific: subscribe to field changes
  // CRITICAL: Pass empty array (not undefined) when no fields to watch
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields.length > 0 ? watchFields : [],
  });

  // Build field values map
  // CRITICAL: useWatch with an array name ALWAYS returns an array of values,
  // even for a single field. Only useWatch({ name: 'string' }) returns scalar.
  const fieldValues = useMemo(() => {
    const values: Record<string, unknown> = {};
    if (Array.isArray(watchedValues)) {
      watchFields.forEach((field, i) => {
        values[field] = watchedValues[i];
      });
    }
    return values;
  }, [watchFields, watchedValues]);

  // Call core's pure function
  return useMemo(
    () => evaluateConditions({ conditions, fieldValues, record }),
    [conditions, fieldValues, record]
  );
}
```

#### 1.3.4 Framework Adapter Contracts

Each framework adapter (`@formality/react`, `@formality/vue`, `@formality/svelte`) MUST:

1. **Export identical component APIs** (as close as framework allows):
   - `Form` - Form container with state management
   - `Field` - Individual field with automatic wiring
   - `FieldGroup` - Conditional group wrapper
   - `FormalityProvider` / `createFormality` - Global configuration

2. **Accept identical configuration objects**:
   - `FieldConfig`, `FormConfig`, `InputConfig` from `@formality/core`
   - Same `conditions`, `selectProps`, `validator` structures

3. **Use core for all business logic**:
   - Expression evaluation
   - Condition evaluation
   - Validation
   - Value transformation
   - Config merging

4. **Handle framework-specific concerns**:
   - Reactivity/subscriptions (useWatch vs watch vs $:)
   - Context/dependency injection
   - Component rendering
   - Performance optimization (proxy pattern for React, not needed for Vue)

#### 1.3.5 Current Implementation Status

| Package | Status | Notes |
|---------|--------|-------|
| `@formality/core` | **In Development** | Build alongside React implementation |
| `@formality/react` | **In Development** | Primary implementation, full feature set |
| `@formality/vue` | **Stubbed** | Package structure only, README placeholder |
| `@formality/svelte` | **Stubbed** | Package structure only, README placeholder |

**Development Strategy:**

1. Build `@formality/react` as the primary implementation
2. Extract pure logic to `@formality/core` as you build
3. Test that core modules have zero React imports
4. Vue/Svelte adapters can be built later using the same core

#### 1.3.6 Import Rules

**In `@formality/core`:**
```typescript
// ✅ ALLOWED
import type { ConditionDescriptor } from '../types';
import { evaluate } from '../expression/evaluate';

// ❌ FORBIDDEN - No framework imports
import { useState } from 'react';           // NO
import { ref } from 'vue';                  // NO
import { writable } from 'svelte/store';    // NO
```

**In `@formality/react`:**
```typescript
// ✅ ALLOWED
import { evaluateConditions, inferFieldsFromDescriptor } from '@formality/core';
import type { FieldConfig, ConditionDescriptor } from '@formality/core';
import { useMemo, useCallback } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';

// ✅ Re-export core types for convenience
export type { FieldConfig, FormConfig, InputConfig } from '@formality/core';
```

#### 1.3.7 Testing Strategy

**Core package tests:**
- Pure unit tests, no framework test utilities
- Test expression evaluation with plain objects
- Test condition evaluation with mock state
- 100% coverage target for core logic

**React package tests:**
- React Testing Library
- Test hooks with `renderHook`
- Integration tests for Form/Field/FieldGroup
- Test that components correctly call core functions

**Cross-package tests:**
- Ensure React adapter produces identical results to calling core directly
- Validate that core has zero framework dependencies (build check)

---

## 2. Performance Architecture

### 2.1 The Proxy State Pattern

**CRITICAL REQUIREMENT**: All form state objects exposed to fields and expressions MUST use lazy property access via JavaScript Proxies to prevent unnecessary re-renders.

#### 2.1.1 The Problem

React Hook Form implements a sophisticated subscription system where components only re-render when watched fields change. However, there's a subtle performance issue:

```javascript
// Without proxy pattern:
const fieldState = { value: 5, isTouched: false, isDirty: false, error: null };

// When an expression accesses fieldState:
const result = evaluate("client.value", { state: { fields: { client: fieldState } } });

// React's dependency tracking registers a dependency on the ENTIRE fieldState object
// If ANY property changes (even isTouched: false → true), the component re-renders
// This happens even if the expression only uses 'value'
```

This causes **massive performance degradation** in forms with many fields and complex dependencies.

#### 2.1.2 The Solution

```typescript
function makeProxyState<T extends object>(formState: T): T {
  const result = {} as T;

  for (const key in formState) {
    Object.defineProperty(result, key, {
      get: () => formState[key],
      enumerable: true,
      configurable: true,
    });
  }

  return result;
}
```

**How it works:**
1. Instead of passing objects directly, wrap them in proxy objects with getter properties
2. Properties are only accessed when the expression actually uses them
3. React's dependency tracking only registers dependencies on **accessed properties**
4. If an expression only uses `value`, changes to `isTouched`, `isDirty`, or `error` don't trigger re-renders

#### 2.1.3 Where to Apply

**Field State Proxies** (REQUIRED):

```typescript
// In useFieldState hook
const makeCustomFieldState = ({
  name,
  value,
  fieldState,
  defaultValue,
  isValidating,
}) =>
  makeProxyState({
    ...fieldState,        // isTouched, isDirty, invalid, error
    value,                // Current field value
    defaultValue,         // Initial/default value
    isValidating,         // Async validation state
  });

// Usage in formState.fields
formState.fields = useMemo(() => {
  const values = {};

  for (const name of names) {
    values[name] = makeCustomFieldState({
      name,
      fieldState: getFieldState(name),
      value: watchedValues[names.findIndex((val) => val === name)],
      defaultValue: formState.defaultValues[name],
      isValidating: getIsFieldValidating(name),
    });
  }

  return values;
}, [names, watchedValues, getFieldState, getIsFieldValidating]);
```

**Record State Proxy** (REQUIRED):

```typescript
// In custom useFormState wrapper
const useFormState = (options) => {
  const formState = useRHFFormState(options);
  const record = useContext(FormFieldContext).record;

  // Add record property using lazy access
  Object.defineProperty(formState, 'record', {
    get: () => record,
    enumerable: true,
    configurable: true,
  });

  return formState;
};
```

**Why this matters:** Without the record proxy, accessing `record.clientName` in an expression creates a dependency on the entire record object, which never changes but still causes React to check it on every render.

#### 2.1.4 Performance Impact

**Without Proxy Pattern:**
- 100 field form with 20 fields having `selectProps`
- Every field change triggers re-evaluation in all 20 dependent fields
- Each re-evaluation creates dependencies on 5+ properties per field state
- Result: 100+ unnecessary re-renders per keystroke

**With Proxy Pattern:**
- Same 100 field form
- Field change triggers re-evaluation in 20 dependent fields
- Each re-evaluation only creates dependencies on actually used properties (typically 1-2)
- Result: 0-5 unnecessary re-renders per keystroke

**Performance improvement: 95%+ reduction in re-renders**

#### 2.1.5 Implementation Requirements

**ALL of the following MUST use makeProxyState:**

1. ✅ Individual field states in `formState.fields[name]`
2. ✅ The `record` property on formState
3. ✅ Any custom state objects passed to expression evaluator
4. ✅ Field states returned from `getFieldState` during inference

**Testing the implementation:**

```typescript
// Test that proxy works correctly
const state = makeProxyState({ value: 5, isTouched: false });

// Should create getter, not direct property
console.log(Object.getOwnPropertyDescriptor(state, 'value').get); // Should be a function

// Should still work like normal object
console.log(state.value); // 5
console.log(state.isTouched); // false

// Should be enumerable
console.log(Object.keys(state)); // ['value', 'isTouched']
```

### 2.2 Subscription Optimization

The framework implements an inverted subscription index to efficiently track which fields are watching other fields:

```typescript
// In Form component
const invertedSubscriptions = new Map<string, Set<string>>();
// Maps: targetField → Set<subscriberField>

// When Field B subscribes to Field A:
if (!invertedSubscriptions.has('fieldA')) {
  invertedSubscriptions.set('fieldA', new Set());
}
invertedSubscriptions.get('fieldA').add('fieldB');

// When Field A changes:
const subscribers = invertedSubscriptions.get('fieldA');
if (subscribers?.size) {
  // Trigger re-renders only in Fields B, C, D, etc.
  // React Hook Form's useWatch handles this automatically
}
```

This prevents the form from iterating through all fields to find subscribers on every change.

### 2.3 Memoization Strategy

**Critical memoization points:**

1. **Evaluated selectProps** - Memoize based on watched field values
2. **Resolved conditions** - Memoize based on condition dependencies
3. **Merged props** - Memoize based on config and evaluated selectProps
4. **Field state objects** - Memoize based on watched field names

```typescript
// Example: Field selectProps evaluation
const evaluatedSelectProps = useMemo(() => {
  return evaluateDescriptor(fieldConfig.selectProps, fieldContext);
}, [watchedValues, fieldConfig.selectProps]); // Re-evaluate only when dependencies change
```

---

## 3. Type System

### 3.1 Select Object Type (CRITICAL)

**FUNDAMENTAL CONCEPT**: Any property prefixed with `select` (selectProps, selectSet, selectWhen, selectTitle, selectDefaultFieldProps) can be:

1. **String** - Expression evaluated against form state
2. **Object** - Each value is recursively evaluated as a Select Object
3. **Array** - Each element is recursively evaluated as a Select Object
4. **Function** - Called with form state and methods, returns computed value

```typescript
/**
 * SelectValue - The core polymorphic type for all select* properties
 *
 * CRITICAL: When using functions, automatic field inference is NOT possible.
 * You MUST provide explicit `subscribesTo` to declare dependencies.
 */
type SelectValue<TReturn = unknown> =
  | string                                           // Expression: "client.id"
  | SelectFunction<TReturn>                          // Function callback
  | { [key: string]: SelectValue }                   // Nested object
  | SelectValue[];                                   // Array of values

/**
 * SelectFunction - Callback signature for function-based select values
 *
 * @param formState - Current form state with fields, record, errors, etc.
 * @param methods - React Hook Form methods (setValue, trigger, etc.)
 * @returns The computed value
 *
 * IMPORTANT: When using SelectFunction, you MUST specify subscribesTo
 * because automatic dependency inference cannot analyze function bodies.
 */
type SelectFunction<TReturn = unknown> = (
  formState: FormState,
  methods: UseFormReturn
) => TReturn;

// Examples:
// String expression
selectProps: { queryParams: "client.id" }

// Function callback (MUST have subscribesTo)
subscribesTo: ["client"],
selectProps: {
  queryParams: ({ fields }) => fields.client?.value?.id
}

// Mixed object with strings and functions
selectProps: {
  queryParams: "client.id",                          // String - auto-inferred
  customValue: ({ fields }) => fields.name?.value,   // Function - needs subscribesTo
}

// Nested structures
selectProps: {
  filters: {
    clientId: "client.id",
    isActive: "signed",
    computed: ({ fields }) => fields.a?.value + fields.b?.value,
  }
}
```

### 3.2 Core Configuration Types

```typescript
// Input component configuration
interface InputConfig<TValue = unknown> {
  component: React.ComponentType<any>;
  defaultValue: TValue;
  debounce?: number | false;
  inputFieldProp?: string;
  valueField?: string;
  getSubmitField?: (fieldName: string) => string;
  parser?: string | ((value: unknown) => TValue);
  formatter?: string | ((value: TValue) => unknown);
  validator?: ValidatorSpec;
  template?: React.ComponentType<InputTemplateProps>;
  props?: Record<string, unknown>;           // Default props for this input type
}

// Field-level configuration
interface FieldConfig {
  type?: string;
  label?: string;                            // Human-readable label (static)
  title?: string;                            // Alias for label (legacy support)
  disabled?: boolean;
  hidden?: boolean;
  order?: number;                            // Display order for config-driven rendering
  recordKey?: string;                        // Key to use when reading from record
  rules?: RegisterOptions;
  validator?: ValidatorSpec;
  props?: Record<string, unknown>;
  selectProps?: SelectValue<Record<string, unknown>>;  // Dynamic props - string, object, OR function
  conditions?: ConditionDescriptor[];
  subscribesTo?: string[];                   // REQUIRED when using functions in selectProps
  provideState?: boolean;                    // Pass field state to component
  passSubscriptions?: boolean;               // Pass subscribed field states to component
  passSubscriptionsAs?: string;              // Prop name for subscribed states (default: 'state')
}

// Select descriptor (DEPRECATED name - use SelectValue)
type SelectDescriptor = SelectValue;

// Condition descriptor - supports both strings AND functions
interface ConditionDescriptor {
  // Trigger - one of these is required
  when?: string;                             // Field to watch: "client"
  selectWhen?: SelectValue<boolean>;         // Expression OR function: "client.id > 5" or ({ fields }) => ...

  // Matchers
  is?: unknown;                              // Exact value match
  truthy?: boolean;                          // Truthy/falsy check

  // Actions when condition matches
  disabled?: boolean;                        // Set disabled state
  visible?: boolean;                         // Set visibility
  set?: unknown;                             // Set static value
  selectSet?: SelectValue;                   // Set dynamic value - string OR function

  // Dependencies (REQUIRED when using functions)
  subscribesTo?: string[];                   // Explicit subscriptions for function-based conditions
}

// Note: Either 'when' or 'selectWhen' must be provided, but not both.
// 'when' is for simple field references: "client"
// 'selectWhen' is for complex expressions OR functions

// Validator specification
type ValidatorSpec =
  | string                         // Named validator
  | ValidatorFunction              // Inline function
  | Array<string | ValidatorFunction>;  // Multiple validators

type ValidatorFunction = (
  value: unknown,
  formValues: Record<string, unknown>
) => ValidationResult | Promise<ValidationResult>;

type ValidationResult =
  | true                           // Valid
  | false                          // Invalid (generic message)
  | string                         // Invalid with message
  | undefined                      // Valid
  | { type: string; message?: string };  // Invalid with type
```

### 3.3 Provider Configuration

```typescript
interface FormalityProviderConfig {
  inputs: Record<string, InputConfig>;
  formatters?: Record<string, (value: unknown) => unknown>;
  parsers?: Record<string, (value: unknown) => unknown>;
  validators?: ValidatorsConfig;
  errorMessages?: ErrorMessagesConfig;
  defaultInputTemplate?: React.ComponentType<InputTemplateProps>;
  inputTemplates?: Record<string, React.ComponentType<InputTemplateProps>>;
  defaultSubscriptionPropName?: string;       // Default prop name for passSubscriptions (default: 'state')
  defaultFieldProps?: Record<string, unknown>;
  selectDefaultFieldProps?: SelectValue;      // Can be string, object, OR function
}

interface ValidatorsConfig {
  [name: string]: ValidatorFunction | ((arg: any) => ValidatorFunction);
}

interface ErrorMessagesConfig {
  [type: string]: string;
}
```

### 3.4 Form Configuration

```typescript
interface FormConfig {
  // Input type overrides - can be object OR function
  inputs?:
    | Record<string, Partial<InputConfig>>           // Static overrides
    | ((allInputs: Record<string, InputConfig>) =>   // Function for dynamic overrides
        Record<string, Partial<InputConfig>>);

  groups?: Record<string, GroupConfig>;
  defaultFieldProps?: Record<string, unknown>;
  selectDefaultFieldProps?: SelectValue;             // Can be string, object, OR function
  title?: string;
  selectTitle?: SelectValue<string>;                 // Can be string OR function
}

// Example: inputs as function for form-level customization
formConfig: {
  inputs: ({ switch: switchConfig, textField, ...rest }) => ({
    // Override switch component for this form only
    switch: {
      ...switchConfig,
      component: memo((props) => (
        <switchConfig.component {...props} customProp="value" />
      )),
    },
  }),
}

interface GroupConfig {
  conditions?: ConditionDescriptor[];
  subscribesTo?: string[];
}

interface FormFieldsConfig {
  [fieldName: string]: FieldConfig;
}
```

### 3.5 Form State

```typescript
interface FormState {
  fields: Record<string, FieldState>;
  record?: Record<string, unknown>;
  errors: Record<string, FieldError>;
  defaultValues: Record<string, unknown>;
  touchedFields: Record<string, boolean>;
  dirtyFields: Record<string, boolean>;
  isDirty: boolean;
  isTouched: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  props?: Record<string, unknown>;  // Field-level: { name: string }
}

interface FieldState {
  value: unknown;
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  error?: FieldError;
  invalid: boolean;
  watchers: Record<string, boolean>;  // Who is watching this field
}
```

---

## 4. Context System

### 4.1 FormContext

The FormContext provides the bridge between Form and Field components.

```typescript
interface FormContextValue {
  // Configuration
  config: FormFieldsConfig;
  formConfig: FormConfig;
  record?: Record<string, unknown>;

  // Registry operations
  registerField: (name: string) => void;
  unregisterField: (name: string) => void;

  // Subscription operations
  addSubscription: (target: string, subscriber: string) => void;
  removeSubscription: (target: string, subscriber: string) => void;
  registerWatcherSetter: (name: string, setter: WatcherSetterFn) => void;
  unregisterWatcherSetter: (name: string) => void;

  // Field state operations
  changeField: (name: string, value: unknown) => void;
  setFieldValidating: (name: string, isValidating: boolean) => void;

  // State access
  getFormState: () => FormState;

  // Submission operations
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  debouncedSubmit: DebouncedFunction;         // Debounced submit with lodash-style API
  submitImmediate: () => void;                 // Execute pending debounced submit immediately

  // Unused fields tracking
  unusedFields: string[];

  // React Hook Form methods passthrough
  methods: UseFormReturn;
}

/**
 * DebouncedFunction - Lodash-style debounced function API
 */
interface DebouncedFunction {
  (): void;                    // Call the debounced function
  cancel: () => void;          // Cancel any pending invocation
  flush: () => void;           // Execute pending invocation immediately
  pending: () => boolean;      // Check if there's a pending invocation
}

type WatcherSetterFn = React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
```

### 4.2 ConfigContext

The ConfigContext provides global configuration from FormalityProvider.

```typescript
interface ConfigContextValue {
  inputs: Record<string, InputConfig>;
  formatters: Record<string, (value: unknown) => unknown>;
  parsers: Record<string, (value: unknown) => unknown>;
  validators: ValidatorsConfig;
  errorMessages: ErrorMessagesConfig;
  defaultInputTemplate?: React.ComponentType<InputTemplateProps>;
  inputTemplates: Record<string, React.ComponentType<InputTemplateProps>>;
  defaultSubscriptionPropName: string;
  defaultFieldProps: Record<string, unknown>;
  selectDefaultFieldProps?: SelectValue;      // Can be string, object, OR function
}
```

### 4.3 GroupContext

The GroupContext provides FieldGroup state to nested fields and supports nesting.

```typescript
interface GroupContextValue {
  state: {
    isDisabled: boolean;
    isVisible: boolean;
    conditions: ConditionDescriptor[];
    subscriptions: string[];
  };
  subscriptions: string[];  // Root-level for default context
  inferredInputs: string[];
  config: GroupConfig;
}
```

**Default context** (provided by Form when no FieldGroup is present):

```typescript
const defaultGroupContext: GroupContextValue = {
  state: {
    isDisabled: false,
    isVisible: true,
    conditions: [],
    subscriptions: [],
  },
  subscriptions: [],
  inferredInputs: [],
  config: { conditions: [], subscribesTo: [] },
};
```

**CRITICAL BEHAVIORS**:

1. **Nesting support**: Child FieldGroups read parent context via `useContext(GroupContext)` and merge state.

2. **State propagation**: Does NOT render wrapper elements with disabled attributes. State propagates through context that child Fields read and merge with their own state.

3. **Accumulation**: When nested, `conditions` and `subscriptions` arrays accumulate from all ancestors.

---

## 5. Expression Engine

### 4.1 Path Resolution

The expression engine resolves string expressions to values from FormState.

#### 4.1.1 Qualified Path Prefixes

**Complete list of qualified prefixes** (paths that are NOT auto-transformed):

| Prefix | Resolution Path | Example |
|--------|-----------------|---------|
| `fields.` | `state.fields.{rest}` | `fields.client.value` → `state.fields.client.value` |
| `record.` | `state.record.{rest}` | `record.name` → `state.record.name` |
| `errors.` | `state.errors.{rest}` | `errors.client` → `state.errors.client` |
| `defaultValues.` | `state.defaultValues.{rest}` | `defaultValues.client` → `state.defaultValues.client` |
| `touchedFields.` | `state.touchedFields.{rest}` | `touchedFields.client` → `state.touchedFields.client` |
| `dirtyFields.` | `state.dirtyFields.{rest}` | `dirtyFields.client` → `state.dirtyFields.client` |
| `props.` | `state.props.{rest}` | `props.name` → `state.props.name` |

#### 4.1.2 Unqualified Path Transformation

Paths WITHOUT a qualified prefix are auto-transformed to field value paths:

```typescript
// Unqualified path
"client" → "fields.client.value"

// With property access
"client.id" → "fields.client.value.id"

// Why: Convenience for common case of accessing field values
```

#### 4.1.3 Resolution Algorithm

```typescript
function resolvePath(path: string, context: FormState): string {
  const QUALIFIED_KEYS = [
    'fields',
    'record',
    'errors',
    'defaultValues',
    'touchedFields',
    'dirtyFields',
    'props'
  ];

  const parts = path.split('.');
  const root = parts[0];

  if (QUALIFIED_KEYS.includes(root)) {
    // Already qualified - use as-is
    return path;
  }

  // Unqualified - transform to field value access
  // "client" → "fields.client.value"
  // "client.id" → "fields.client.value.id"
  return `fields.${path.split('.')[0]}.value${
    parts.length > 1 ? '.' + parts.slice(1).join('.') : ''
  }`;
}
```

#### 4.1.4 Implementation Strategy: Dual Context Mapping

**CRITICAL REQUIREMENT**: The expression evaluator MUST support both qualified and unqualified field access. There are two valid implementation approaches:

**Option A: Pre-Transform Paths (Complex)**
Before evaluating, scan the expression for unqualified identifiers and transform them:
```typescript
// Input expression
"client && client.id > 5"

// After transformation
"fields.client.value && fields.client.value.id > 5"
```
- Pros: Clean expressions match PRD semantics exactly
- Cons: Complex regex/AST transformation, edge cases with property names

**Option B: Dual Context Mapping (RECOMMENDED)**
Provide field values at BOTH qualified AND unqualified levels in the evaluation context:
```typescript
const context = {
  // Qualified access: fields.client.value
  fields: {
    client: { value: { id: 5, name: "Acme" } },
    signed: { value: true }
  },
  // Unqualified access: client, signed (direct shortcuts)
  client: { id: 5, name: "Acme" },
  signed: true,
  // Other qualified paths
  record: { clientName: "Hometown Heating" },
  props: { name: "fieldName" },
};
```
- Pros: Simpler implementation, no expression parsing needed
- Cons: Larger context object, potential name collisions

**DECISION: Use Option B (Dual Context Mapping) with Field State Proxies**

The implementation MUST:
1. Build context with all qualified paths (`fields`, `record`, `props`, `errors`, etc.)
2. Add shortcut properties for each field using **field state proxies** (see below)
3. Evaluate expressions directly against this merged context
4. Handle name collisions by giving qualified paths precedence

#### 4.1.5 Field State Proxy for Metadata Access

Unqualified field shortcuts MUST use a proxy that enables access to both the value AND field metadata:

```typescript
// Proxy behavior for context[fieldName]:
signed              // → true (coerces to value via Symbol.toPrimitive)
signed.value        // → true (explicit value access)
signed.isTouched    // → boolean (field metadata)
signed.isDirty      // → boolean (field metadata)
signed.id           // → value.id (delegates to value for object values)
```

**Why proxies are required:** Conditions like `selectSet: 'field && field.isTouched'` need access to field metadata within expressions. Without proxies, there's no way to access `isTouched` or `isDirty` in condition expressions.

**Example Implementation:**
```typescript
function createFieldStateProxy(fieldState) {
  return new Proxy(fieldState, {
    get(target, prop) {
      // Symbol.toPrimitive for value coercion in comparisons
      if (prop === Symbol.toPrimitive) {
        return () => target.value;
      }
      // Known metadata properties - read from field state
      if (['value', 'isTouched', 'isDirty', 'error', 'invalid'].includes(prop)) {
        return target[prop];
      }
      // Unknown properties - delegate to value (for object values)
      if (target.value && typeof target.value === 'object') {
        return target.value[prop];
      }
      return undefined;
    }
  });
}

function buildEvaluationContext(formState, record, props) {
  const context = {
    // Qualified paths
    fields: formState.fields,
    record: record,
    props: props,
    errors: formState.errors,
    // ... other qualified paths
  };

  // Add unqualified shortcuts as PROXIES (not raw values)
  for (const [fieldName, fieldState] of Object.entries(formState.fields)) {
    if (!(fieldName in context)) { // Don't override qualified paths
      context[fieldName] = createFieldStateProxy(fieldState);
    }
  }

  return context;
}
```

**Expression evaluator requirement:** The expression evaluator MUST unwrap proxies for all operations (arithmetic, comparison, logical) to ensure `field == value` comparisons work correctly.

This ensures expressions like `"client"` resolve to the field value while `"client.isTouched"` resolves to field metadata and `"record.name"` resolves to the record property.

### 4.2 Expression Evaluation

#### 4.2.1 Supported Expressions

```typescript
// Literals
"true"              → true
"false"             → false
"null"              → null
"undefined"         → undefined
"'string'"          → "string"
"42"                → 42

// Property access
"client"            → state.fields.client.value
"record.name"       → state.record.name
"client.id"         → state.fields.client.value.id

// Logical operators
"client && contact"              → both truthy
"client || contact"              → either truthy
"client ?? 'default'"            → nullish coalescing
"!client"                        → negation

// Equality
"placementType === 'TEMP'"       → strict equality
"signed == true"                 → loose equality
"!signed"                        → not signed

// Ternary
"signed ? 'Yes' : 'No'"         → conditional

// Complex
"client && client.id > 5"       → chained conditions
```

#### 4.2.2 Evaluation Context

When evaluating expressions, the context varies by **where** the expression is used:

**Form-level expressions** (e.g., conditions on FieldGroup):
```typescript
{
  state: {
    fields: { /* all fields */ },
    record: { /* initial record */ },
    errors: { /* all errors */ },
    // ... other state
  }
}
```

**Field-level expressions** (e.g., selectProps, selectDefaultFieldProps):
```typescript
{
  state: {
    fields: { /* all fields */ },
    record: { /* initial record */ },
    props: {
      name: "clientContact",  // Current field name
      // ... other field props
    },
    // ... other state
  }
}
```

**CRITICAL**: The `props` object is ONLY available in field-level expression contexts. This is what allows `"props.name"` to resolve to the field name.

### 4.3 Descriptor Evaluation

#### 4.3.1 Object Descriptors

When a SelectDescriptor is an object, each value is evaluated independently:

```typescript
// Input
selectProps: {
  queryParams: "client.id",
  shouldFetch: "!!client",
}

// Evaluation process
{
  queryParams: evaluate("client.id", context),      // → 5
  shouldFetch: evaluate("!!client", context),       // → true
}

// Result
{
  queryParams: 5,
  shouldFetch: true,
}
```

#### 4.3.2 String Descriptors

When a SelectDescriptor is a string, it's evaluated directly:

```typescript
// Input
selectTitle: "record.name"

// Evaluation
evaluate("record.name", context)  // → "Hometown Heating and Cooling"

// Result
"Hometown Heating and Cooling"
```

#### 4.3.3 Inference (Field Dependencies)

Before evaluating, the engine infers dependencies by scanning for field references:

```typescript
function inferFieldsFromDescriptor(descriptor: SelectDescriptor): string[] {
  const fields: string[] = [];

  // Scan all expression strings
  const expressions = typeof descriptor === 'string'
    ? [descriptor]
    : Object.values(descriptor);

  for (const expr of expressions) {
    // Extract unqualified identifiers (field names)
    const matches = expr.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g) || [];

    for (const match of matches) {
      // Skip keywords and qualified prefixes
      if (!KEYWORDS.includes(match) && !QUALIFIED_PREFIXES.includes(match)) {
        fields.push(match);
      }
    }
  }

  return [...new Set(fields)];  // Unique list
}
```

**Why inference matters**: These inferred fields become automatic subscriptions. If `selectProps: { queryParams: "client.id" }`, the field automatically subscribes to `client` changes.

---

## 6. Component Specifications

### 5.1 FormalityProvider

**Purpose**: Provides global configuration to all forms.

```typescript
interface FormalityProviderProps {
  children: React.ReactNode;
  inputs: Record<string, InputConfig>;
  formatters?: Record<string, (value: unknown) => unknown>;
  parsers?: Record<string, (value: unknown) => unknown>;
  validators?: ValidatorsConfig;
  errorMessages?: ErrorMessagesConfig;
  defaultInputTemplate?: React.ComponentType<InputTemplateProps>;
  inputTemplates?: Record<string, React.ComponentType<InputTemplateProps>>;
  defaultSubscriptionPropName?: string;
  defaultFieldProps?: Record<string, unknown>;
  selectDefaultFieldProps?: SelectDescriptor;
}
```

**Behavior**:
1. Creates ConfigContext with merged default values
2. Does NOT render any wrapper elements
3. Simply provides context for children

**Defaults**:
```typescript
{
  formatters: {},
  parsers: {},
  validators: {},
  errorMessages: {},
  inputTemplates: {},
  defaultSubscriptionPropName: 'state',
  defaultFieldProps: {},
  selectDefaultFieldProps: undefined,
}
```

### 5.2 Form Component

**Purpose**: Manages form state, subscriptions, conditions, and submission.

```typescript
interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  children: React.ReactNode | ((api: FormRenderAPI) => React.ReactNode);
  config: FormFieldsConfig;
  formConfig?: FormConfig;
  onSubmit?: (values: Partial<TFieldValues>) => void | Promise<void>;
  record?: Partial<TFieldValues>;
  autoSave?: boolean;
  debounce?: number;
  validate?: (values: Partial<TFieldValues>) =>
    ValidationErrors | Promise<ValidationErrors>;
}

interface FormRenderAPI {
  unusedFields: string[];
  formState: UseFormStateReturn;
  methods: UseFormReturn;
  resolvedTitle?: string;  // Evaluated form title from selectTitle/title
}
```

#### 5.2.1 Title Resolution

**CRITICAL**: The Form component does NOT render titles directly. Instead, it evaluates and EXPOSES the resolved title through the render function API.

**Resolution order** (first defined wins):
1. `formConfig.selectTitle` - Expression evaluated against form context
2. `formConfig.title` - Static string

**Implementation:**
```typescript
// In Form component
const resolvedTitle = useMemo(() => {
  if (formConfig.selectTitle) {
    // Evaluate expression with form context (no field props)
    const context = {
      fields: watchedFields,
      record: record,
      // NO props - form-level context
    };
    return evaluateDescriptor(formConfig.selectTitle, context);
  }
  return formConfig.title;
}, [formConfig.selectTitle, formConfig.title, watchedFields, record]);

// Exposed via render function
children({
  resolvedTitle,
  unusedFields,
  formState: methods.formState,
  methods,
})
```

**Usage example:**
```jsx
<Form
  config={fieldConfig}
  formConfig={{
    selectTitle: "record.clientName",  // Dynamic: "Hometown Heating"
    // OR
    title: "Edit Quote",               // Static fallback
  }}
  record={{ clientName: "Hometown Heating" }}
>
  {({ resolvedTitle, ...rest }) => (
    <Dialog title={resolvedTitle || "Edit Form"}>
      <Field name="clientContact" />
      {/* ... */}
    </Dialog>
  )}
</Form>
```

**IMPORTANT**: If the consuming application uses a Dialog or Modal wrapper, it MUST use the `resolvedTitle` from the render API. The Form component itself renders no UI chrome.

#### 5.2.2 Initialization Phase

**Order of operations**:

1. **Merge configuration**
   - Provider config + Form config + Field config

2. **Extract default values from config**
   ```typescript
   const defaultValues = {};
   for (const [name, fieldConfig] of Object.entries(config)) {
     const type = fieldConfig.type;
     const inputConfig = inputs[type];
     defaultValues[name] = inputConfig?.defaultValue;
   }
   ```

3. **Initialize React Hook Form**
   ```typescript
   const methods = useForm({
     mode: 'onChange',
     defaultValues,
     values: record,  // Initial values from record prop
   });
   ```

4. **Create state registries**
   ```typescript
   const fieldRegistry = new Set<string>();
   const invertedSubscriptions = new Map<string, Set<string>>();
   const watcherSetters = new Map<string, WatcherSetterFn>();
   const pendingWatcherUpdates = new Map<string, Set<string>>();
   const validatingFields = new Map<string, boolean>();
   ```

#### 5.2.2 Subscription Management

**Adding a subscription** (when Field B subscribes to Field A):

```typescript
function addSubscription(target: string, subscriber: string) {
  // Update inverted index
  if (!invertedSubscriptions.has(target)) {
    invertedSubscriptions.set(target, new Set());
  }
  invertedSubscriptions.get(target)!.add(subscriber);

  // Notify target field immediately if mounted
  const setter = watcherSetters.get(target);
  if (setter) {
    setter(prev => ({ ...prev, [subscriber]: true }));
  } else {
    // Target not mounted yet - queue for later
    if (!pendingWatcherUpdates.has(target)) {
      pendingWatcherUpdates.set(target, new Set());
    }
    pendingWatcherUpdates.get(target)!.add(subscriber);
  }
}
```

**Registering a watcher setter** (when Field A mounts):

```typescript
function registerWatcherSetter(name: string, setter: WatcherSetterFn) {
  watcherSetters.set(name, setter);

  // Process any pending subscriptions
  const pending = pendingWatcherUpdates.get(name);
  if (pending?.size) {
    setter(prev => {
      const next = { ...prev };
      pending.forEach(sub => { next[sub] = true; });
      return next;
    });
    pendingWatcherUpdates.delete(name);
  }
}
```

#### 5.2.3 Change Detection

**changeField notification**:

```typescript
function changeField(name: string, value: unknown) {
  // Get subscribers for this field
  const subscribers = invertedSubscriptions.get(name);

  if (subscribers?.size) {
    // Trigger re-renders in subscribing fields
    // (This happens automatically via useWatch in those fields)

    // Also trigger auto-save if enabled
    if (autoSave && subscribers.size > 0) {
      debouncedSubmit();
    }
  }
}
```

#### 5.2.4 Unused Fields Tracking

```typescript
// Track which fields are rendered
const declaredFields = new Set<string>();

// In Field component registration
registerField(name);  // Adds to declaredFields

// Calculate unused fields
const unusedFields = Object.keys(config).filter(
  name => !declaredFields.has(name)
);
```

**Purpose**: Allows `<UnusedFields />` component to render fields declared in config but not explicitly rendered.

#### 5.2.5 Submission Flow

```typescript
const handleSubmit = methods.handleSubmit(async (values) => {
  // 1. Check if any subscribed fields are validating
  if (isAnySubscribedFieldValidating) {
    return; // Block submission
  }

  // 2. Run form-level validation
  if (validate) {
    const errors = await validate(values);
    if (Object.keys(errors).length > 0) {
      // Set errors and block submission
      Object.entries(errors).forEach(([field, error]) => {
        methods.setError(field, { message: error });
      });
      return;
    }
  }

  // 3. Transform values for submission
  const submitValues = transformValuesForSubmit(values);

  // 4. Call onSubmit handler
  await onSubmit?.(submitValues);
});
```

**Value transformation for submission**:

```typescript
function transformValuesForSubmit(values: Record<string, unknown>) {
  const result: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(values)) {
    const fieldConfig = config[name];
    const type = fieldConfig?.type;
    const inputConfig = inputs[type];

    if (inputConfig?.getSubmitField) {
      // Use custom submit field name
      const submitName = inputConfig.getSubmitField(name);

      if (inputConfig.valueField && value && typeof value === 'object') {
        // Extract specific field from object
        result[submitName] = (value as any)[inputConfig.valueField];
      } else {
        result[submitName] = value;
      }
    } else {
      result[name] = value;
    }
  }

  return result;
}
```

**Example**:
```typescript
// Input values
{
  client: { id: 5, name: "Acme Inc" },
  signed: true
}

// Config
{
  client: {
    type: 'autocomplete',  // has valueField: 'id', getSubmitField: (k) => `${k}Id`
  },
  signed: {
    type: 'switch'
  }
}

// Submit values
{
  clientId: 5,  // Extracted and renamed
  signed: true
}
```

### 5.3 Field Component

**Purpose**: Renders an input field with full framework integration.

```typescript
interface FieldProps {
  name: string;
  type?: string;
  disabled?: boolean;
  hidden?: boolean;
  children?: React.ReactNode | ((api: FieldRenderAPI) => React.ReactNode);
  shouldRegister?: boolean;
  [key: string]: unknown;  // Additional props passed to input
}

interface FieldRenderAPI {
  fieldState: ControllerFieldState;
  renderedField: React.ReactNode;
  fieldProps: Record<string, unknown>;
  watchers: Record<string, boolean>;
  formState: UseFormStateReturn;
}
```

#### 5.3.1 Initialization Phase

**Order of operations**:

1. **Register with form**
   ```typescript
   useEffect(() => {
     registerField(name);
     return () => unregisterField(name);
   }, [name]);
   ```

2. **Resolve configuration**
   ```typescript
   const fieldConfig = config[name] || {};
   const type = typeProp || fieldConfig.type || 'textField';
   const inputConfig = inputs[type];
   ```

3. **Set up watcher state**
   ```typescript
   const [watchers, setWatchers] = useState<Record<string, boolean>>({});

   useEffect(() => {
     registerWatcherSetter(name, setWatchers);
     return () => unregisterWatcherSetter(name);
   }, [name]);
   ```

4. **Resolve subscriptions**
   ```typescript
   // Explicit subscriptions
   const explicitSubs = fieldConfig.subscribesTo || [];

   // Inferred from selectProps
   const inferredSubs = fieldConfig.selectProps
     ? inferFieldsFromDescriptor(fieldConfig.selectProps)
     : [];

   // Inferred from conditions
   const conditionSubs = (fieldConfig.conditions || [])
     .map(cond => cond.when);

   const allSubscriptions = [
     ...explicitSubs,
     ...inferredSubs,
     ...conditionSubs
   ];
   ```

5. **Subscribe to fields**
   ```typescript
   useEffect(() => {
     allSubscriptions.forEach(target => {
       addSubscription(target, name);
     });

     return () => {
       allSubscriptions.forEach(target => {
         removeSubscription(target, name);
       });
     };
   }, [name, JSON.stringify(allSubscriptions)]);
   ```

#### 5.3.2 Props Resolution Pipeline

**Execution order** (most specific to least specific):

```typescript
// 1. Get provider-level defaultFieldProps
const providerDefaults = providerConfig.defaultFieldProps || {};

// 2. Evaluate provider-level selectDefaultFieldProps
const providerSelectDefaults = providerConfig.selectDefaultFieldProps
  ? evaluateDescriptor(
      providerConfig.selectDefaultFieldProps,
      createFieldContext(name, formState)
    )
  : {};

// 3. Get form-level defaultFieldProps
const formDefaults = formConfig.defaultFieldProps || {};

// 4. Evaluate form-level selectDefaultFieldProps
const formSelectDefaults = formConfig.selectDefaultFieldProps
  ? evaluateDescriptor(
      formConfig.selectDefaultFieldProps,
      createFieldContext(name, formState)
    )
  : {};

// 5. Get input type props
const inputProps = inputConfig.props || {};

// 6. Get field config props
const fieldConfigProps = fieldConfig.props || {};

// 7. Evaluate field selectProps
const selectProps = fieldConfig.selectProps
  ? evaluateDescriptor(
      fieldConfig.selectProps,
      createFieldContext(name, formState)
    )
  : {};

// 8. Get component-level props (from JSX)
const componentProps = { ...restProps };

// MERGE ORDER (later overrides earlier)
const finalProps = {
  ...providerDefaults,        // Lowest priority
  ...providerSelectDefaults,
  ...formDefaults,
  ...formSelectDefaults,
  ...inputProps,
  ...fieldConfigProps,
  ...selectProps,
  ...componentProps,          // Highest priority

  // Core field props (always override)
  name,
  disabled: resolvedDisabled,
  error: fieldState.error?.message,
  [inputFieldProp || 'value']: formattedValue,
  onChange: handleChange,
  onBlur: controller.field.onBlur,
  ref: controller.field.ref,
};
```

**Field context for evaluation**:

```typescript
function createFieldContext(fieldName: string, formState: FormState) {
  return {
    state: {
      ...formState,
      props: {
        name: fieldName,
        // Could include other field-specific props
      },
    },
  };
}
```

This is how `selectDefaultFieldProps: { label: "props.name" }` resolves to the field name.

#### 5.3.3 Conditions Evaluation

```typescript
function evaluateConditions(
  conditions: ConditionDescriptor[],
  context: EvaluatorContext
): ConditionResult {
  let disabled = false;
  let visible = true;
  let setValue: unknown = undefined;
  let hasSetValue = false;

  for (const condition of conditions) {
    // Evaluate trigger condition
    const targetValue = evaluate(condition.when, context);

    let shouldApply = false;

    if ('is' in condition) {
      shouldApply = targetValue === condition.is;
    } else if ('truthy' in condition) {
      shouldApply = condition.truthy ? !!targetValue : !targetValue;
    } else {
      shouldApply = !!targetValue;
    }

    if (!shouldApply) continue;

    // Apply actions
    if ('disabled' in condition) {
      disabled = disabled || condition.disabled!;
    }

    if ('visible' in condition) {
      visible = visible && condition.visible!;
    }

    if ('set' in condition) {
      setValue = condition.set;
      hasSetValue = true;
    }

    if ('selectSet' in condition) {
      setValue = evaluate(condition.selectSet!, context);
      hasSetValue = true;
    }
  }

  return { disabled, visible, setValue: hasSetValue ? setValue : undefined };
}
```

**CRITICAL BEHAVIOR**: Condition actions are cumulative:
- `disabled` is OR-ed (any condition can disable)
- `visible` is AND-ed (any condition can hide)
- `set` uses last matching condition's value

#### 5.3.4 Disabled State Resolution

```typescript
const isDisabled =
  disabledProp ??                    // Explicit prop (highest priority)
  fieldConfig.disabled ??            // Field config
  conditionResult.disabled ??        // Condition evaluation
  groupContext.state.isDisabled ??   // FieldGroup
  false;                             // Default
```

**Key**: Group disabled state is OR-ed with field-level disabled, not overridden.

#### 5.3.5 Value Transformation

**Parse pipeline** (from user input to form value):

```typescript
function parseValue(rawValue: unknown, inputConfig: InputConfig): unknown {
  if (!inputConfig.parser) {
    return rawValue;
  }

  // Named parser
  if (typeof inputConfig.parser === 'string') {
    const parser = parsers[inputConfig.parser];
    if (!parser) {
      console.warn(`Parser "${inputConfig.parser}" not found`);
      return rawValue;
    }
    return parser(rawValue);
  }

  // Inline parser function
  return inputConfig.parser(rawValue);
}
```

**Format pipeline** (from form value to display value):

```typescript
function formatValue(formValue: unknown, inputConfig: InputConfig): unknown {
  if (!inputConfig.formatter) {
    return formValue;
  }

  // Named formatter
  if (typeof inputConfig.formatter === 'string') {
    const formatter = formatters[inputConfig.formatter];
    if (!formatter) {
      console.warn(`Formatter "${inputConfig.formatter}" not found`);
      return formValue;
    }
    return formatter(formValue);
  }

  // Inline formatter function
  return inputConfig.formatter(formValue);
}
```

**CRITICAL**: Parsing happens BEFORE setting RHF value, formatting happens AFTER getting RHF value.

#### 5.3.6 Change Handler

```typescript
const handleChange = useCallback((newValue: unknown) => {
  // 1. Parse value
  const parsedValue = parseValue(newValue, inputConfig);

  // 2. Update form value
  controller.field.onChange(parsedValue);

  // 3. Notify subscribers
  changeField(name, parsedValue);

  // 4. Trigger validation if debounce is false
  if (inputConfig.debounce === false) {
    methods.trigger(name);
  }
}, [name, inputConfig, controller.field.onChange]);
```

#### 5.3.7 Validation Integration

```typescript
// Build RHF register options
const rules: RegisterOptions = {
  ...fieldConfig.rules,
  validate: async (value) => {
    // Mark as validating
    setFieldValidating(name, true);

    try {
      // Layer 1: Field-level validator
      if (fieldConfig.validator) {
        const result = await runValidator(fieldConfig.validator, value);
        if (result !== true && result !== undefined) {
          return resolveErrorMessage(result, errorMessages);
        }
      }

      // Layer 2: Type-level validator
      if (inputConfig.validator) {
        const result = await runValidator(inputConfig.validator, value);
        if (result !== true && result !== undefined) {
          return resolveErrorMessage(result, errorMessages);
        }
      }

      return true;
    } finally {
      setFieldValidating(name, false);
    }
  },
};
```

#### 5.3.8 Template Rendering

```typescript
// Resolve template
const template =
  inputConfig.template ||
  inputTemplates[fieldConfig.template] ||
  defaultInputTemplate;

// Render through template
const renderedField = template ? (
  React.createElement(template, {
    Field: inputConfig.component,
    fieldProps: finalProps,
    fieldState: controller.fieldState,
    formState: methods.formState,
  })
) : (
  React.createElement(inputConfig.component, finalProps)
);

// Render children if provided
if (typeof children === 'function') {
  return children({
    fieldState: controller.fieldState,
    renderedField,
    fieldProps: finalProps,
    watchers,
    formState: methods.formState,
  });
}

return renderedField;
```

### 5.4 FieldGroup Component

**Purpose**: Applies conditional disabled/visible state to multiple fields.

```typescript
interface FieldGroupProps {
  name: string;
  children: React.ReactNode;
}
```

#### 5.4.1 Behavior

```typescript
function FieldGroup({ name, children }: FieldGroupProps) {
  const { formConfig } = useContext(FormContext);
  const parentContext = useContext(GroupContext);
  const groupConfig = formConfig.groups?.[name];

  if (!groupConfig) {
    console.error(`No field group config found for ${name}`);
    return null;
  }

  // Infer field names from conditions for subscription
  const inferredInputs = useInferredInputs({ conditions: groupConfig.conditions });

  // Evaluate conditions (returns { isDisabled, isVisible })
  const { isDisabled, isVisible } = useConditions({
    conditions: groupConfig.conditions || [],
    subscriptions: groupConfig.subscribesTo,
  });

  // Merge with parent context state (for nested FieldGroups)
  const mergedState = {
    isDisabled: isDisabled || parentContext.state.isDisabled,
    isVisible: isVisible && parentContext.state.isVisible,
    // setValue: this group's setValue takes priority, then parent's
    hasSetCondition: conditionResult.hasSetCondition || parentContext.state.hasSetCondition,
    setValue: conditionResult.hasSetCondition
      ? conditionResult.setValue
      : parentContext.state.setValue,
    // Accumulate conditions from all parent groups
    conditions: [
      ...parentContext.state.conditions,
      ...(groupConfig.conditions || []),
    ],
    // Accumulate subscriptions from all parent groups
    subscriptions: [
      ...parentContext.subscriptions,
      ...(groupConfig.subscribesTo || []),
    ],
  };

  // Provide group state to children
  const contextValue: GroupContextValue = {
    state: mergedState,
    subscriptions: mergedState.subscriptions,
    inferredInputs,
    config: groupConfig,
  };

  return (
    <GroupContext.Provider value={contextValue}>
      <span style={{ display: isVisible ? undefined : 'none' }}>
        {children}
      </span>
    </GroupContext.Provider>
  );
}
```

**CRITICAL BEHAVIORS**:

1. **Nesting support**: FieldGroups can be nested. Each child group reads parent context and merges state:
   - `isDisabled`: OR-ed (any parent can disable: `child || parent`)
   - `isVisible`: AND-ed (any parent can hide: `child && parent`)
   - `setValue`: Inner group takes priority, then parent's (field-level overrides all)
   - `conditions`: Accumulated array from all parents
   - `subscriptions`: Accumulated array from all parents

2. **Disabled propagation**: Does NOT use `<fieldset disabled>`. Instead, provides `isDisabled` through context which child Fields read.

3. **Visible handling**: DOES use a wrapper `<span>` with `display: none`. This hides entire group including all nested children.

4. **setValue propagation**: Group-level `set`/`selectSet` conditions propagate to ALL child fields. Priority order:
   - Field-level condition setValue (highest priority)
   - Immediate parent group setValue
   - Ancestor group setValue (lowest priority)

5. **State merging in children**:
   ```typescript
   // In Field component
   const groupContext = useContext(GroupContext);
   const isDisabled =
     fieldDisabled ||                      // Field's own disabled
     groupContext.state.isDisabled ||      // Group's disabled (merged from all parents)
     false;

   // setValue: field-level takes priority over group-level
   const effectiveSetValue = conditionResult.hasSetCondition
     ? conditionResult.setValue
     : groupContext.state.setValue;
   ```

5. **Utility hooks**:
   - `useInferredInputs({ conditions })`: Extracts field names from condition `when` clauses
   - `useConditions({ conditions, subscriptions })`: Evaluates conditions and watches dependencies

6. **Conditions re-evaluate**: On any watched field change (from conditions or subscribesTo), the group re-evaluates and updates context.

7. **subscribesTo property**: Allows manual subscription to fields not referenced in conditions. Useful for function-based conditions that don't use string expressions.

### 5.5 UnusedFields Component

**Purpose**: Renders all fields declared in config but not explicitly rendered.

```typescript
function UnusedFields() {
  const { unusedFields } = useContext(FormContext);

  return (
    <>
      {unusedFields.map(name => (
        <Field key={name} name={name} shouldRegister={false} />
      ))}
    </>
  );
}
```

**Why `shouldRegister={false}`**: These fields are rendered for validation purposes but shouldn't be counted as "declared" to avoid infinite loops.

---

## 7. Field Configuration System

### 6.1 Configuration Merging

**Priority order** (later overrides earlier):

1. Provider `inputs[type]` defaults
2. Provider `defaultFieldProps`
3. Provider `selectDefaultFieldProps` (evaluated)
4. Form `formConfig.defaultFieldProps`
5. Form `formConfig.selectDefaultFieldProps` (evaluated)
6. Field `config[name].props`
7. Field `config[name].selectProps` (evaluated)
8. Component props (JSX attributes)

### 6.2 Type Resolution

```typescript
// Determine field type
const type =
  props.type ||              // Explicit <Field type="...">
  config[name]?.type ||      // Config: { fieldName: { type: '...' }}
  'textField';               // Default fallback
```

### 6.3 InputConfig Properties

#### 6.3.1 component (Required)

```typescript
component: React.ComponentType<any>
```

The React component to render. Receives all merged props.

#### 6.3.2 defaultValue (Required)

```typescript
defaultValue: TValue
```

Used to initialize form fields on mount. **CRITICAL**: Must match the expected value type.

Examples:
- `textField`: `''`
- `switch`: `false`
- `autocomplete`: `null`
- `decimal`: `''` (not `0` - allows empty state)

#### 6.3.3 debounce (Optional)

```typescript
debounce?: number | false
```

- `false`: No debounce, validate/submit immediately
- `number`: Milliseconds to debounce before validation/auto-save
- Default: Provider-level setting or `1000`

#### 6.3.4 inputFieldProp (Optional)

```typescript
inputFieldProp?: string
```

The prop name for passing the value. Defaults to `'value'`.

Examples:
- `switch`: `'checked'`
- Most inputs: `'value'` (default)

#### 6.3.5 valueField (Optional)

```typescript
valueField?: string
```

For complex values (objects), which property contains the actual value.

Example:
```typescript
// Config
{
  valueField: 'id',
}

// Field value
{ id: 5, name: "Acme Inc", address: "..." }

// On submit → extracts to `5`
```

#### 6.3.6 getSubmitField (Optional)

```typescript
getSubmitField?: (fieldName: string) => string
```

Transforms the field name for submission.

Example:
```typescript
// Config
{
  valueField: 'id',
  getSubmitField: (key) => `${key}Id`,
}

// Field name: "client"
// Submit field: "clientId"
```

#### 6.3.7 parser (Optional)

```typescript
parser?: string | ((value: unknown) => TValue)
```

Transforms user input to form value.

Examples:
```typescript
// Named parser
parser: 'float'  // Uses parsers.float from provider

// Inline parser
parser: (value) => parseFloat(value) || 0
```

#### 6.3.8 formatter (Optional)

```typescript
formatter?: string | ((value: TValue) => unknown)
```

Transforms form value to display value.

Examples:
```typescript
// Named formatter
formatter: 'float'  // Uses formatters.float from provider

// Inline formatter
formatter: (value) => value?.toFixed(2) || ''
```

**Formatter precision**:
```typescript
// 2 decimals
float: (value) => typeof value === 'number' ? value.toFixed(2) : ''

// 3 decimals (for specific fields)
float3: (value) => typeof value === 'number' ? value.toFixed(3) : ''
```

#### 6.3.9 validator (Optional)

```typescript
validator?: ValidatorSpec
```

Type-level validation (applied after field validator).

#### 6.3.10 template (Optional)

```typescript
template?: React.ComponentType<InputTemplateProps>
```

Wrapper component for error display, labels, etc.

---

## 8. Conditions System

### 7.1 Condition Matching

A condition is evaluated in two steps:

**Step 1: Match the trigger**

```typescript
// Get the watched field value
// Use selectWhen if provided, otherwise use when
const targetValue = condition.selectWhen
  ? evaluate(condition.selectWhen, context)
  : evaluate(condition.when, context);

// Check if condition matches
let shouldApply = false;

if ('is' in condition) {
  // Exact match
  shouldApply = targetValue === condition.is;

} else if ('truthy' in condition) {
  // Truthy/falsy check
  shouldApply = condition.truthy
    ? !!targetValue
    : !targetValue;

} else {
  // No matcher specified - default to truthy
  shouldApply = !!targetValue;
}
```

**Step 2: Apply actions if matched**

```typescript
if (shouldApply) {
  // Apply specified actions
  if ('disabled' in condition) {
    applyDisabled(condition.disabled);
  }
  if ('visible' in condition) {
    applyVisible(condition.visible);
  }
  if ('set' in condition) {
    applySet(condition.set);
  }
  if ('selectSet' in condition) {
    applySet(evaluate(condition.selectSet, context));
  }
}
```

#### 7.1.1 setValue Application Mechanism

The `applySet` function MUST integrate with React Hook Form's `setValue`:

```typescript
// In Field component - apply setValue via useEffect
const setValueRef = useRef(methods.setValue);
setValueRef.current = methods.setValue;
const getValuesRef = useRef(methods.getValues);
getValuesRef.current = methods.getValues;

useEffect(() => {
  if (effectiveSetValue.hasCondition && effectiveSetValue.value !== undefined) {
    const currentValue = getValuesRef.current(name);
    // CRITICAL: Only update if value actually changed to prevent infinite loops
    if (currentValue !== effectiveSetValue.value) {
      setValueRef.current(name, effectiveSetValue.value, {
        shouldValidate: true,   // Trigger validation after setting
        shouldDirty: true,      // Mark as dirty
        shouldTouch: false,     // Don't mark as user-touched
      });
    }
  }
}, [effectiveSetValue.hasCondition, effectiveSetValue.value, name]);
```

**Key implementation requirements:**

1. **useRef for methods** - Store `methods.setValue` and `methods.getValues` in refs to avoid including `methods` in the dependency array, which would cause infinite loops
2. **Value comparison** - Always compare current value before calling `setValue` to prevent unnecessary updates and infinite loops
3. **shouldTouch: false** - Condition-set values should NOT mark the field as user-touched
4. **Trigger on value change** - The effect runs when `effectiveSetValue.value` changes, which happens when watched fields change and conditions re-evaluate

### 7.2 when vs selectWhen

Conditions support two ways to specify what to watch:

**`when` - Simple field reference:**
```typescript
{
  when: 'client',          // Watch the 'client' field
  truthy: true,
  disabled: true,
}
```
- Value: Simple field name as a string
- Resolves to: `fields.client.value` (using standard path resolution)
- Use for: Most common cases where you watch a single field

**`selectWhen` - Complex expression:**
```typescript
{
  selectWhen: 'client.id > 5 && signed',  // Watch expression result
  truthy: true,
  disabled: true,
}
```
- Value: Full expression string
- Resolves to: Evaluated expression result
- Use for: Complex conditions involving multiple fields or operators
- Dependencies: All referenced fields are automatically inferred for subscription

**Key Differences:**

| Feature | `when` | `selectWhen` |
|---------|--------|--------------|
| Syntax | Field name only | Full expression |
| Example | `"client"` | `"client.id > 5 && signed"` |
| Dependencies | Single field | All fields in expression |
| Use Case | Simple field watching | Complex multi-field logic |

**IMPORTANT**: Only one of `when` or `selectWhen` should be provided per condition. If both are present, `selectWhen` takes precedence.

**Example with selectWhen:**
```typescript
{
  selectWhen: 'placementType === "TEMP" && !signed',
  visible: false,
}
// This condition:
// 1. Watches both 'placementType' and 'signed' fields (inferred)
// 2. Evaluates the expression on every change to either field
// 3. If expression is truthy, hides the field
```

### 7.3 Condition Examples

```typescript
// Example 1: Disable when not signed
{
  when: 'signed',
  truthy: false,
  disabled: true,
}
// Reads: "When signed is falsy, set disabled to true"

// Example 2: Hide when placement is TEMP
{
  when: 'placementType',
  is: 'TEMP',
  visible: false,
}
// Reads: "When placementType equals 'TEMP', set visible to false"

// Example 3: Set value based on another field
{
  when: 'client',
  truthy: true,
  selectSet: 'client.defaultContact',
}
// Reads: "When client is truthy, set value to client.defaultContact"

// Example 4: Complex expression (string-based)
{
  when: 'davisBacon',
  truthy: true,
  selectSet: '!!operatingAgreement && operatingAgreement.isTouched',
}
// Reads: "When davisBacon is truthy, set value to expression result"
```

### 7.4 Function-Based Conditions

**ALL condition properties that accept strings can also accept functions.** When using functions, you MUST specify `subscribesTo` because automatic dependency inference cannot analyze function bodies.

```typescript
// Example 1: Function-based selectSet (equivalent to string version above)
{
  when: 'davisBacon',
  truthy: true,
  subscribesTo: ['operatingAgreement', 'davisBacon'],  // REQUIRED with functions
  selectSet: ({ fields }) =>
    fields.davisBacon?.value &&
    !!fields.operatingAgreement?.value &&
    fields.operatingAgreement?.isTouched,
}

// Example 2: Function-based selectWhen
{
  subscribesTo: ['client', 'signed'],
  selectWhen: ({ fields }) =>
    fields.client?.value?.tier === 'premium' && fields.signed?.value,
  disabled: true,
}

// Example 3: Complex function with RHF methods access
{
  when: 'placementType',
  is: 'DIRECT',
  subscribesTo: ['client', 'position'],
  selectSet: ({ fields, record }, methods) => {
    // Access both current form values and original record
    const currentClient = fields.client?.value;
    const originalClient = record?.client;

    // Can even trigger other form operations if needed
    if (currentClient?.id !== originalClient?.id) {
      methods.trigger('position');  // Re-validate position when client changes
    }

    return currentClient?.defaultBillRate || 0;
  },
}

// Example 4: Mixed string and function in same config
{
  creditApp: {
    type: 'switch',
    conditions: [
      // String-based condition (auto-infers subscription to 'signed')
      {
        when: 'signed',
        is: false,
        disabled: true,
      },
      // Function-based condition (MUST declare subscribesTo)
      {
        when: 'davisBacon',
        truthy: true,
        subscribesTo: ['operatingAgreement', 'davisBacon'],
        selectSet: ({ fields }) =>
          fields.davisBacon?.value &&
          !!fields.operatingAgreement?.value,
      },
    ],
  },
}
```

**When to use functions vs strings:**

| Use Strings When... | Use Functions When... |
|---------------------|----------------------|
| Simple field references | Complex business logic |
| Basic comparisons | Need access to RHF methods |
| Auto-subscription is desired | Need type safety (TypeScript) |
| Config is serializable (JSON) | Need to call other functions |

### 7.6 Visible vs Disabled

**Semantic difference**:

| Property | Effect | Use Case |
|----------|--------|----------|
| `visible: false` | Hides field (display: none) | Conditional field presence |
| `disabled: true` | Shows field but prevents editing | Locked fields |

**CRITICAL OBSERVATION**: In the authoritative implementation, the Quote form config uses:

```typescript
groups: {
  isSignedSwitches: {
    conditions: [{
      when: 'signed',
      is: false,
      visible: false,  // NOT disabled: true
    }],
  },
}
```

But the UI shows fields as **disabled**, not hidden. This suggests one of two things:

1. The old library interprets `visible: false` on FieldGroups as `disabled: true` (possible legacy behavior)
2. OR the config is actually using `disabled: true` in production but `visible: false` in the base version

**For the new implementation**: Follow the spec literally:
- `visible: false` → hide with `display: none`
- `disabled: true` → disable the field

Let consuming apps use the correct property for their intent.

### 7.7 Condition Action Independence

**CRITICAL REQUIREMENT**: Condition actions are INDEPENDENT of each other. A condition that sets `disabled: true` does NOT automatically affect visibility, and vice versa.

#### 7.7.1 Independence Rules

```typescript
// This condition ONLY affects disabled state
{ when: "status", is: "readonly", disabled: true }
// Result: disabled=true, visible=undefined (inherits default: true)

// This condition ONLY affects visibility
{ when: "archived", truthy: true, visible: false }
// Result: disabled=undefined (inherits default: false), visible=false

// This condition affects BOTH explicitly
{ when: "status", is: "archived", disabled: true, visible: false }
// Result: disabled=true, visible=false
```

#### 7.7.2 Default Value Resolution

When evaluating multiple conditions, the cumulative result for each action depends on:

| Action | Default (no conditions set it) | Cumulative Logic |
|--------|-------------------------------|------------------|
| `disabled` | `undefined` (use other sources) | OR-ed: any `true` → `true` |
| `visible` | `true` (field is shown) | AND-ed: any `false` → `false` |
| `setValue` | `undefined` (no change) | Last matching wins |

**Implementation pseudocode:**
```typescript
function evaluateConditions(conditions, context) {
  let disabled = undefined;
  let hasDisabled = false;
  let visible = true;  // Default to visible
  let hasVisible = false;
  let setValue = undefined;

  for (const condition of conditions) {
    if (!conditionMatches(condition, context)) continue;

    // disabled: OR logic
    if ('disabled' in condition) {
      hasDisabled = true;
      disabled = (disabled ?? false) || condition.disabled;
    }

    // visible: AND logic
    if ('visible' in condition) {
      hasVisible = true;
      visible = visible && condition.visible;
    }

    // setValue: last wins
    if ('set' in condition || 'selectSet' in condition) {
      setValue = condition.set ?? evaluate(condition.selectSet, context);
    }
  }

  return {
    disabled: hasDisabled ? disabled : undefined,
    visible: hasVisible ? visible : true,  // Default true if no condition touched it
    setValue,
  };
}
```

#### 7.7.3 Common Mistake: Confusing disabled with hidden

**Wrong assumption:**
> "Setting `disabled: true` should hide the field"

**Correct behavior:**
- `disabled: true` → Field is shown but greyed out, user cannot interact
- `visible: false` → Field is completely hidden from DOM

**Example of correct configuration:**
```typescript
// Fields that should be visible but non-editable (e.g., computed values)
{
  when: 'computed',
  truthy: true,
  disabled: true,    // Show but don't allow editing
  // NO visible property - remains visible
}

// Fields that should be completely hidden
{
  when: 'showAdvanced',
  truthy: false,
  visible: false,    // Hide completely
  // NO disabled property - not relevant when hidden
}

// Fields that are both hidden AND disabled (edge case)
{
  when: 'archived',
  truthy: true,
  disabled: true,    // Disable if somehow shown
  visible: false,    // But also hide
}
```

---

## 9. Subscription System

### 8.1 Subscription Types

**Forward subscription** (Field B watches Field A):
- Field B uses `useWatch({ name: 'fieldA' })`
- Field B re-renders when Field A changes

**Reverse subscription** (Field A knows Field B is watching):
- Field A maintains `watchers: { fieldB: true }` state
- Field A can show "watched by" indicators
- Form can block submission if Field A is validating and has watchers

### 8.2 Subscription Sources

A field automatically subscribes to other fields based on:

1. **Explicit**: `subscribesTo: ['fieldA', 'fieldB']`
2. **Inferred from selectProps**: If `selectProps: { queryParams: "client.id" }`, infers subscription to `client`
3. **Inferred from conditions**: If `conditions: [{ when: 'signed', ... }]`, infers subscription to `signed`

### 8.3 Subscription Lifecycle

```typescript
// Field B mounting
useEffect(() => {
  // Subscribe to all targets
  ['fieldA', 'fieldC'].forEach(target => {
    addSubscription(target, 'fieldB');
  });

  return () => {
    // Unsubscribe on unmount
    ['fieldA', 'fieldC'].forEach(target => {
      removeSubscription(target, 'fieldB');
    });
  };
}, ['fieldB']);

// Field A mounting
useEffect(() => {
  registerWatcherSetter('fieldA', setWatchers);

  return () => {
    unregisterWatcherSetter('fieldA');
  };
}, ['fieldA']);
```

### 8.4 Mount Order Resolution

**Problem**: Field B might mount before Field A, but needs to notify Field A.

**Solution**: Pending queue

```typescript
// When B subscribes but A isn't mounted yet
addSubscription('fieldA', 'fieldB');
// → Adds to pendingWatcherUpdates.get('fieldA')

// Later, when A mounts
registerWatcherSetter('fieldA', setWatchers);
// → Processes pending queue, calls setWatchers({ fieldB: true })
```

### 8.5 Validation Blocking

```typescript
// In Form submit handler
const isAnySubscribedFieldValidating = useMemo(() => {
  for (const [fieldName, isValidating] of validatingFields.entries()) {
    if (isValidating) {
      const subscribers = invertedSubscriptions.get(fieldName);
      if (subscribers && subscribers.size > 0) {
        return true;  // Block submission
      }
    }
  }
  return false;
}, [validatingFields, invertedSubscriptions]);

const handleSubmit = methods.handleSubmit(async (values) => {
  if (isAnySubscribedFieldValidating) {
    return;  // Don't submit while subscribed field validates
  }

  await onSubmit?.(values);
});
```

**Why**: If Field A is validating and Field B depends on it, we shouldn't submit until Field A completes validation.

---

## 10. Validation System

### 9.1 Validation Layers

Validation runs in sequence until one fails:

1. **RHF Built-in Rules**: `required`, `min`, `max`, `pattern`, etc.
2. **Field Validator**: `fieldConfig.validator`
3. **Type Validator**: `inputConfig.validator`
4. **Form Validator**: `FormProps.validate` (only on submit)

### 9.2 Validator Specification Formats

```typescript
// Named validator (string)
validator: 'required'

// Inline function
validator: (value, formValues) => {
  if (!value) return 'This field is required';
  return true;
}

// Async validator
validator: async (value) => {
  const exists = await checkExists(value);
  if (exists) return 'Already exists';
  return true;
}

// Array of validators (all must pass)
validator: [
  'required',
  async (value) => {
    await delay(2000);
    return true;
  },
]

// Validator factory (for parameterized validators)
validators: {
  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return { type: 'minLength', message: `Min ${min} chars` };
    }
  },
}

// Usage
validator: ['required', validators.minLength(5)]
```

### 9.3 Validator Return Values

| Return Value | Meaning | Error Message |
|--------------|---------|---------------|
| `true` | Valid | None |
| `undefined` | Valid | None |
| `false` | Invalid | "Invalid" |
| `string` | Invalid | Use string directly |
| `{ type: string }` | Invalid | Look up in `errorMessages[type]` |
| `{ type: string, message: string }` | Invalid | Use provided message |

### 9.4 Error Message Resolution

```typescript
function resolveErrorMessage(
  result: ValidationResult,
  errorMessages: ErrorMessagesConfig
): string | undefined {
  // Valid results
  if (result === true || result === undefined || result === null) {
    return undefined;
  }

  // Invalid without specific message
  if (result === false) {
    return 'Invalid';
  }

  // String message
  if (typeof result === 'string') {
    return result;
  }

  // Object with type
  if (typeof result === 'object' && 'type' in result) {
    // Use provided message, or lookup, or type as fallback
    return result.message
      ?? errorMessages[result.type]
      ?? result.type;
  }

  // Fallback
  return 'Invalid';
}
```

### 9.5 Validation State Tracking

```typescript
// In Field component
const validateField = async (value: unknown) => {
  // Mark as validating
  setFieldValidating(name, true);

  try {
    // Run validators
    const result = await runValidators(value);
    return result;
  } finally {
    // Always clear validating state
    setFieldValidating(name, false);
  }
};
```

**Why tracking matters**: Form submission checks if any subscribed fields are validating before allowing submit.

### 9.6 Async Validator Example

```typescript
// In config
{
  placementType: {
    type: 'exclusiveToggleButtonGroup',
    validator: [
      'required',
      async (value) => {
        // Simulate async validation (API call)
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      },
    ],
  },
}

// Behavior:
// 1. User selects value → onChange triggered
// 2. Field shows validating state (spinner, etc)
// 3. 2 seconds pass
// 4. Validation completes
// 5. Form submit is unblocked
```

---

## 11. Value Transformation Pipeline

### 10.1 Parse Pipeline (Input → Form Value)

```
User Input → Component → parse → RHF setValue → Form State
```

**When**: On every `onChange` event

**Example**:
```typescript
// Input config
{
  parser: 'float',
}

// Parsers
{
  float: (value) => parseFloat(String(value)) || 0,
}

// Flow
User types "42.69" → Component onChange("42.69")
→ parse("42.69") → 42.69 (number)
→ setValue(42.69) → Form state: { billRate: 42.69 }
```

### 10.2 Format Pipeline (Form Value → Display)

```
Form State → RHF getValue → format → Component
```

**When**: On every render

**Example**:
```typescript
// Input config
{
  formatter: 'float',
}

// Formatters
{
  float: (value) => typeof value === 'number' ? value.toFixed(2) : '',
}

// Flow
Form state: { billRate: 42.69 } → getValue() → 42.69
→ format(42.69) → "42.69" → Component receives value="42.69"
```

### 10.3 Submit Pipeline (Form Value → API)

```
Form State → Extract → Transform → Submit Value
```

**When**: On form submission

**Example**:
```typescript
// Input config
{
  valueField: 'id',
  getSubmitField: (key) => `${key}Id`,
}

// Flow
Form state: {
  client: { id: 5, name: "Acme" }
}
→ Extract valueField: 5
→ Transform field name: "client" → "clientId"
→ Submit value: { clientId: 5 }
```

### 10.4 Complete Example

```typescript
// Decimal field config
{
  billRate: {
    type: 'decimal',
  },
}

// Decimal input config
{
  decimal: {
    component: TextField,
    defaultValue: '',
    parser: 'float',
    formatter: 'float',
  },
}

// Parsers/Formatters
{
  parsers: {
    float: (value) => parseFloat(String(value)) || 0,
  },
  formatters: {
    float: (value) => typeof value === 'number' ? value.toFixed(2) : '',
  },
}

// Lifecycle
// 1. Initial render
defaultValue: '' → Component displays: ""

// 2. User types "42.69"
onChange("42.69") → parse → 42.69 → RHF state: 42.69

// 3. Re-render
RHF state: 42.69 → format → "42.69" → Component displays: "42.69"

// 4. User types "42.6"
onChange("42.6") → parse → 42.6 → RHF state: 42.6

// 5. Re-render
RHF state: 42.6 → format → "42.60" → Component displays: "42.60"

// 6. Submit
RHF state: 42.6 → submit value: 42.6
```

### 10.5 Formatter Precision Configuration

**Problem**: Need different decimal precisions for different fields (2 vs 3 decimals).

**Solution**: Multiple named formatters

```typescript
formatters: {
  float: (value) => typeof value === 'number' ? value.toFixed(2) : '',
  float3: (value) => typeof value === 'number' ? value.toFixed(3) : '',
  percent: (value) => typeof value === 'number' ? value.toFixed(2) : '',
  percent3: (value) => typeof value === 'number' ? value.toFixed(3) : '',
}

// Usage
{
  minBillRate: {
    type: 'decimal',
    props: { formatter: 'float3' },  // Override to 3 decimals
  },
}
```

### 10.6 Number Precision Preservation

**CRITICAL ISSUE**: Decimal precision can be lost between the OLD and NEW systems.

**Example from discrepancy report:**
```
OLD: Min Gross Margin (%) = 0.241
NEW: Min Gross Margin (%) = 0.24   ← Lost precision!
```

**Root Causes:**

1. **Formatter truncation**: Using `toFixed(2)` when data requires `toFixed(3)`
2. **JavaScript floating point**: `0.2409999...` displayed as `0.24`
3. **Inconsistent precision**: Different fields needing different precisions

**Solution: Precision-aware Formatters**

```typescript
// Define formatters with explicit precision
formatters: {
  // Standard 2 decimal places
  decimal2: (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return value.toFixed(2);
  },

  // 3 decimal places (for percentages that need more precision)
  decimal3: (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return value.toFixed(3);
  },

  // Auto-detect precision from value (preserves original precision)
  decimalAuto: (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    // Detect decimal places in original value
    const str = String(value);
    const decimalIndex = str.indexOf('.');
    if (decimalIndex === -1) return str;
    const decimals = str.length - decimalIndex - 1;
    // Cap at reasonable maximum (e.g., 6 places)
    return value.toFixed(Math.min(decimals, 6));
  },
}
```

**Field-level Precision Configuration:**

```typescript
// Input config with precision option
interface InputConfig {
  // ... existing properties
  precision?: number;  // Decimal places for number formatting
}

// Usage in formatters
formatters: {
  decimal: (value, inputConfig) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    const precision = inputConfig?.precision ?? 2;  // Default to 2
    return value.toFixed(precision);
  },
}

// Field config
config = {
  minGrossMarginPercent: {
    type: 'decimal',
    props: { precision: 3 },  // This field needs 3 decimals
  },
  minBillRate: {
    type: 'decimal',
    // Uses default 2 decimals
  },
};
```

**IMPORTANT**: Review ALL numeric fields in the form configuration and set appropriate `precision` values based on the data requirements.

### 10.7 Parser/Formatter Contract

**Parsers and formatters MUST be inverses of each other:**

```typescript
// Valid: parse(format(value)) === value
const parsed = parseFloat("42.69");  // 42.69
const formatted = parsed.toFixed(2);  // "42.69"
const reparsed = parseFloat(formatted);  // 42.69 ✓

// Invalid: precision loss breaks the contract
const parsed = parseFloat("42.691");  // 42.691
const formatted = parsed.toFixed(2);  // "42.69" ← Truncated!
const reparsed = parseFloat(formatted);  // 42.69 ✗ (lost .001)
```

**Test all parser/formatter pairs** with real data to ensure no precision loss.

---

## 12. Auto-Save System

### 11.1 Behavior

When `autoSave={true}`:
1. Any field change triggers a debounced submit
2. Debounce duration from field's `inputConfig.debounce`
3. If field has `debounce: false`, submit immediately
4. Only submits if form is valid

### 11.2 Implementation

```typescript
// In Form component
const debouncedSubmit = useDebouncedFn(
  () => {
    if (methods.formState.isValid) {
      methods.handleSubmit(onSubmit)();
    }
  },
  debounce || 1000
);

// In changeField
function changeField(name: string, value: unknown) {
  const fieldConfig = config[name];
  const inputConfig = inputs[fieldConfig?.type];

  if (autoSave) {
    if (inputConfig.debounce === false) {
      // No debounce - submit immediately
      if (methods.formState.isValid) {
        methods.handleSubmit(onSubmit)();
      }
    } else {
      // Debounced submit
      debouncedSubmit();
    }
  }
}
```

### 11.3 Debounce Behavior

```typescript
// Example 1: Debounced field
{
  textField: {
    debounce: 4000,
  },
}
// User types → wait 4s → auto-save

// Example 2: Immediate field
{
  switch: {
    debounce: false,
  },
}
// User clicks → auto-save immediately

// Example 3: Mixed form
<Form autoSave debounce={2000}>
  <Field name="name" />           {/* Uses 2000ms */}
  <Field name="signed" />         {/* Uses false - immediate */}
</Form>
```

---

## 13. FieldGroup Mechanics

### 12.1 Purpose

Apply shared conditions to multiple fields without repeating condition config. Supports nesting for complex conditional logic.

### 12.2 Behavior Details

**What FieldGroup DOES**:
1. Evaluates conditions based on watched fields
2. Provides `isDisabled` and `isVisible` state via context
3. Wraps children in a `<span>` that can be hidden with `display: none`
4. Supports nesting with state accumulation from parent groups
5. Watches fields referenced in conditions (`when` clauses)
6. Optionally watches additional fields via `subscribesTo`

**What FieldGroup DOES NOT DO**:
1. Does NOT render a `<fieldset>` element
2. Does NOT use the `disabled` attribute on a wrapper
3. Does NOT automatically disable inputs (children must read context)

**Why this matters**: The disabled state propagates through React context, not through DOM disabled attributes. This means:
- Easier to override in individual fields
- More flexible styling
- Supports nesting (parent groups can affect children)
- But requires children to cooperate by reading context

### 12.3 Nesting Mechanics

**Default Context** (when no FieldGroup is present):

```typescript
const defaultGroupContext: GroupContextValue = {
  state: {
    isDisabled: false,
    isVisible: true,
    conditions: [],
    subscriptions: [],
  },
  subscriptions: [],
  inferredInputs: [],
  config: { conditions: [], subscribesTo: [] },
};
```

**Nesting behavior**:

```typescript
// Parent FieldGroup
<FieldGroup name="parentGroup">  {/* isDisabled: true, isVisible: true */}
  {/* Child reads parent context */}
  <FieldGroup name="childGroup">  {/* own: isDisabled: false, isVisible: false */}
    {/* Merged state:
         isDisabled: false || true = true   (OR logic)
         isVisible: false && true = false   (AND logic)
    */}
    <Field name="field" />  {/* Receives: isDisabled: true, isVisible: false */}
  </FieldGroup>
</FieldGroup>
```

**State merging rules**:

| Property | Merge Logic | Why |
|----------|-------------|-----|
| `isDisabled` | `child \|\| parent` | Any ancestor can disable |
| `isVisible` | `child && parent` | Any ancestor can hide |
| `conditions` | `[...parent, ...child]` | Accumulate all conditions |
| `subscriptions` | `[...parent, ...child]` | Accumulate all subscriptions |

### 12.4 subscribesTo Property

**Purpose**: Manually declare field dependencies when conditions use functions instead of string expressions.

**Example**:

```typescript
// Config with function-based condition
{
  groups: {
    customGroup: {
      conditions: [{
        when: 'field1',
        truthy: true,
        disabled: (value, formState) => {
          // Complex logic referencing field2 and field3
          return formState.field2 && !formState.field3;
        },
      }],
      subscribesTo: ['field2', 'field3'],  // Must declare manually
    },
  },
}
```

Without `subscribesTo`, the group wouldn't re-evaluate when `field2` or `field3` change (since they're not in the `when` clause).

### 12.5 useInferredInputs Hook

**Purpose**: Extract field names from condition expressions for automatic subscription.

**Implementation**:

```typescript
function useInferredInputs({ conditions }: { conditions?: ConditionDescriptor[] }): string[] {
  return useMemo(() => {
    if (!conditions) return [];

    const fieldNames = new Set<string>();

    for (const condition of conditions) {
      // Add the 'when' field
      if (condition.when) {
        fieldNames.add(condition.when);
      }

      // Extract fields from selectSet expressions
      if (condition.selectSet && typeof condition.selectSet === 'string') {
        const inferred = inferFieldsFromDescriptor(condition.selectSet);
        inferred.forEach(name => fieldNames.add(name));
      }
    }

    return Array.from(fieldNames);
  }, [conditions]);
}
```

### 12.6 useConditions Hook

**Purpose**: Evaluate conditions and set up field watching.

**Implementation**:

```typescript
function useConditions({
  conditions,
  subscriptions,
}: {
  conditions: ConditionDescriptor[];
  subscriptions?: string[];
}): { isDisabled: boolean; isVisible: boolean } {
  // Combine inferred fields from conditions with manual subscriptions
  const inferredFields = useInferredInputs({ conditions });
  const allSubscriptions = useMemo(
    () => [...inferredFields, ...(subscriptions || [])],
    [inferredFields, subscriptions]
  );

  // Watch all subscribed fields
  const watchedValues = useWatch({ name: allSubscriptions });

  // Evaluate conditions whenever watched values change
  return useMemo(() => {
    const formState = buildFormStateFromContext();
    const result = evaluateConditions(conditions, { state: formState });

    return {
      isDisabled: result.disabled,
      isVisible: result.visible,
    };
  }, [watchedValues, conditions]);
}
```

### 12.7 Complete Example

**Simple usage**:

```typescript
// Config
{
  groups: {
    signedFields: {
      conditions: [{
        when: 'signed',
        is: false,
        disabled: true,
      }],
    },
  },
}

// Usage
<Form config={config} formConfig={formConfig}>
  <Field name="signed" />

  <FieldGroup name="signedFields">
    <Field name="creditApp" />
    <Field name="inCarvin" />
  </FieldGroup>
</Form>

// Behavior:
// 1. signed = false → FieldGroup.isDisabled = true
// 2. creditApp reads groupContext.isDisabled
// 3. creditApp computes: isDisabled = false || true → true
// 4. creditApp passes disabled={true} to component
// 5. Component renders disabled input

// User checks "signed"
// 1. signed = true → FieldGroup.isDisabled = false
// 2. creditApp reads groupContext.isDisabled
// 3. creditApp computes: isDisabled = false || false → false
// 4. creditApp passes disabled={false} to component
// 5. Component renders enabled input
```

**Nested groups example**:

```typescript
// Config
{
  groups: {
    outerGroup: {
      conditions: [{
        when: 'enableOuter',
        truthy: false,
        disabled: true,
      }],
    },
    innerGroup: {
      conditions: [{
        when: 'enableInner',
        truthy: false,
        disabled: true,
      }],
    },
  },
}

// Usage
<Form config={config} formConfig={formConfig}>
  <Field name="enableOuter" />  {/* switch */}
  <Field name="enableInner" />  {/* switch */}

  <FieldGroup name="outerGroup">
    <Field name="field1" />

    <FieldGroup name="innerGroup">
      <Field name="field2" />
      <Field name="field3" />
    </FieldGroup>
  </FieldGroup>
</Form>

// State table:
// enableOuter | enableInner | field1 disabled | field2 disabled
// ------------|-------------|-----------------|----------------
// false       | false       | true            | true (outer || inner)
// false       | true        | true            | true (outer disabled)
// true        | false       | false           | true (inner disabled)
// true        | true        | false           | false
```

**subscribesTo example**:

```typescript
// Config
{
  groups: {
    complexGroup: {
      conditions: [{
        when: 'primaryField',
        truthy: true,
        selectSet: 'secondaryField && tertiaryField > 5',
      }],
      subscribesTo: ['secondaryField', 'tertiaryField'],
    },
  },
}

// Without subscribesTo, group wouldn't re-evaluate when
// secondaryField or tertiaryField change
```

---

## 14. Initial Value Resolution

### 13.1 Sources of Initial Values

**Priority order** (later overrides earlier):

1. **Input type default**: `inputConfig.defaultValue`
2. **Record prop**: `record[fieldName]`
3. **Default values prop**: `defaultValues[fieldName]`

### 13.2 Record Value Extraction

For simple types:
```typescript
// Record
{ name: "John" }

// Field: name
// Initial value: "John"
```

For complex types with `valueField`:
```typescript
// Record
{
  client: { id: 5, name: "Acme Inc" }
}

// Input config
{
  autocomplete: {
    valueField: 'id',
  },
}

// Field: client
// Initial value: ???

// CRITICAL QUESTION: Should initial value be:
// A) The full object: { id: 5, name: "Acme Inc" }
// B) Just the id: 5
```

**Answer from observation**: In the authoritative version, autocomplete fields display the full object label ("Carl Davis"), so the initial value is the **full object**.

This means `valueField` is ONLY used for:
1. **Submission**: Extract `id` field for API
2. **getSubmitField**: Transform field name for API

But NOT for:
1. **Initial value**: Always use full object from record
2. **Display**: Component receives full object

### 13.3 Initial Value Pipeline

```typescript
// 1. Build default values
const defaultValues: Record<string, unknown> = {};
for (const [name, fieldConfig] of Object.entries(config)) {
  const type = fieldConfig.type;
  const inputConfig = inputs[type];
  defaultValues[name] = inputConfig?.defaultValue;
}

// 2. Initialize RHF
const methods = useForm({
  defaultValues,           // Sets initial form state
  values: record,          // Overrides with record data (if provided)
});

// 3. In Field render
const fieldValue = methods.watch(name);
// This gives us the merged value:
// - record[name] if record was provided
// - defaultValues[name] otherwise
```

### 13.4 Record Field Name Mapping

**CRITICAL ISSUE**: API records often use different field names than form fields.

**Problem scenario:**
```typescript
// API returns:
const record = {
  clientContactId: 5,        // API uses "Id" suffix
  positionId: 42069,
  // ...
};

// Form config expects:
config = {
  clientContact: { type: 'autocomplete' },  // No "Id" suffix
  position: { type: 'autocomplete' },
};

// Result: Fields are EMPTY because record.clientContact is undefined
```

**Solution: Field-level `recordKey` Configuration**

Add a `recordKey` property to field configuration for explicit mapping:

```typescript
interface FieldConfig {
  // ... existing properties ...
  recordKey?: string;  // Key to use when reading from record (defaults to field name)
}

// Usage:
config = {
  clientContact: {
    type: 'autocomplete',
    recordKey: 'clientContactId',  // Read from record.clientContactId
  },
  position: {
    type: 'autocomplete',
    recordKey: 'positionId',
  },
};
```

**Implementation in Form:**
```typescript
// Build values mapping
const recordValues: Record<string, unknown> = {};
for (const [fieldName, fieldConfig] of Object.entries(config)) {
  const recordKey = fieldConfig.recordKey || fieldName;
  if (record && recordKey in record) {
    recordValues[fieldName] = record[recordKey];
  }
}

const methods = useForm({
  defaultValues,
  values: recordValues,  // Use mapped values, not raw record
});
```

### 13.5 Complex Type Initial Value Resolution

**Problem**: Autocomplete/lookup fields expect full objects `{ id, label }` but the API might provide:
- Just an ID: `clientContactId: 5`
- A partial object: `clientContact: { id: 5 }` (missing label)

**Solution Options:**

#### Option A: Pre-resolved Records (RECOMMENDED)

The consuming application resolves objects BEFORE passing to Form:

```typescript
// In parent component
const { data: record } = useGetQuote(id);
const { data: contacts } = useGetContacts();
const { data: positions } = useGetPositions();

// Build resolved record
const resolvedRecord = useMemo(() => ({
  ...record,
  clientContact: contacts?.find(c => c.id === record.clientContactId),
  position: positions?.find(p => p.id === record.positionId),
}), [record, contacts, positions]);

<Form record={resolvedRecord} config={config}>
  {/* fields */}
</Form>
```

**Pros**: Simple, explicit, no magic
**Cons**: Requires consuming app to handle resolution

#### Option B: Field-level Resolver Function

Add optional resolver to field config:

```typescript
interface FieldConfig {
  // ... existing properties ...
  resolveInitialValue?: (
    recordValue: unknown,
    record: Record<string, unknown>
  ) => unknown | Promise<unknown>;
}

// Usage:
config = {
  clientContact: {
    type: 'autocomplete',
    recordKey: 'clientContactId',
    resolveInitialValue: async (id, record) => {
      if (!id) return null;
      return await fetchContact(id);  // Returns { id, fullName, ... }
    },
  },
};
```

**Pros**: Self-contained field configuration
**Cons**: Adds complexity, async handling

#### Option C: Component-level Resolution (CURRENT BEHAVIOR)

Let the input component handle unresolved values:

```typescript
// Autocomplete component
function Autocomplete({ value, useOptions, queryParams, labelKey }) {
  const { data: options } = useOptions(queryParams);

  // If value is just an ID, find the full object
  const resolvedValue = useMemo(() => {
    if (!value) return null;
    if (typeof value === 'object') return value;
    // value is primitive - lookup in options
    return options?.find(opt => opt.id === value) || null;
  }, [value, options]);

  return <MuiAutocomplete value={resolvedValue} options={options} />;
}
```

**Pros**: No framework changes needed
**Cons**: Component must handle multiple value types, options must be loaded first

**DECISION: Use Option A (Pre-resolved Records) as primary approach**

The Form component SHOULD NOT perform async data fetching. Consuming applications should resolve complex values before passing the record. Document this clearly.

### 13.6 Record Path Resolution

For nested record values:

```typescript
// Record
{
  clientContact: {
    id: 1,
    fullName: "Carl Davis",
    client: {
      id: 2,
      name: "Hometown Heating"
    }
  }
}

// Field: clientContact
// Initial value: { id: 1, fullName: "Carl Davis", client: { ... } }

// Expression: "record.clientContact.client.id"
// Resolution: state.record.clientContact.client.id → 2
```

**CRITICAL**: The `record` in expressions refers to the ORIGINAL record prop, not the current form values. This allows:
- Comparing current values to original
- Accessing nested properties not in form fields
- Conditional logic based on original state

---

## 15. Field Ordering

### 14.1 Ordering Mechanisms

Fields can be ordered through two mechanisms:

#### 14.1.1 Explicit JSX Order (Primary)

When fields are rendered explicitly in JSX, they appear in JSX order:

```jsx
<Form config={config}>
  <Field name="clientContact" />   {/* 1st */}
  <Field name="placementType" />   {/* 2nd */}
  <Field name="position" />        {/* 3rd */}
  <Field name="signed" />          {/* 4th */}
</Form>
```

This is the **recommended approach** for most use cases.

#### 14.1.2 Config-based Order (for UnusedFields)

When using `<UnusedFields />` to render fields not explicitly placed in JSX, ordering comes from the config object.

**Problem**: JavaScript object key order depends on insertion order and key type:
- String keys: insertion order (ES2015+)
- Integer keys: ascending numeric order

**Solution: Add `order` property to FieldConfig**

```typescript
interface FieldConfig {
  order?: number;  // Display order for config-driven rendering
  // ... other properties
}

// Usage:
config = {
  clientContact: { type: 'autocomplete', order: 1 },
  placementType: { type: 'buttonGroup', order: 2 },
  position: { type: 'autocomplete', order: 3 },
  signed: { type: 'switch', order: 4 },
  davisBacon: { type: 'switch', order: 5 },
  // ...
};
```

### 14.2 UnusedFields Ordering Implementation

The `<UnusedFields />` component MUST sort fields by `order` before rendering:

```typescript
function UnusedFields() {
  const { config, unusedFields } = useFormContext();

  // Sort by order property (undefined orders go last)
  const sortedFields = useMemo(() => {
    return [...unusedFields].sort((a, b) => {
      const orderA = config[a]?.order ?? Infinity;
      const orderB = config[b]?.order ?? Infinity;
      return orderA - orderB;
    });
  }, [unusedFields, config]);

  return (
    <>
      {sortedFields.map(name => (
        <Field key={name} name={name} shouldRegister={false} />
      ))}
    </>
  );
}
```

### 14.3 Mixed Ordering (Explicit + Config)

When combining explicit JSX fields with `<UnusedFields />`:

```jsx
<Form config={config}>
  {/* These appear first, in JSX order */}
  <Field name="clientContact" />
  <Field name="placementType" />

  {/* Remaining fields appear here, sorted by config order */}
  <UnusedFields />
</Form>
```

The `order` property on fields rendered explicitly in JSX is **ignored** - JSX order takes precedence.

### 14.4 Order Gaps and Conventions

**Recommended convention**: Use increments of 10 to allow insertion:

```typescript
config = {
  clientContact: { order: 10 },
  placementType: { order: 20 },
  // Later, can add field at position 15
  newField: { order: 15 },
  position: { order: 30 },
};
```

**Negative orders**: Supported for fields that should appear before others:

```typescript
config = {
  priority: { order: -10 },  // Appears first
  normal: { order: 10 },
};
```

---

## 16. Label Resolution Pipeline

### 15.1 The Label Problem

**CRITICAL ISSUE**: Field labels in the OLD system display human-readable text like "Client Contact", "Min Gross Margin (%)", while the NEW system displays raw field names like "clientContact", "minGrossMarginPercent".

This happens because there is no automatic label generation from field names.

### 15.2 Label Sources (Priority Order)

Labels are resolved from the following sources (first defined wins):

1. **Component prop**: `<Field name="client" label="Client Name" />`
2. **Field config props**: `config.client.props.label = "Client Name"`
3. **Field config selectProps**: `config.client.selectProps.label = "props.name"` (evaluated)
4. **Field config label**: `config.client.label = "Client Name"`
5. **Field config title**: `config.client.title = "Client Name"` (legacy alias)
6. **Auto-generated**: `humanizeLabel("clientContact")` → "Client Contact"

### 15.3 Label Auto-Generation (humanizeLabel)

When no explicit label is provided, generate one from the field name:

```typescript
/**
 * Converts camelCase or PascalCase field names to human-readable labels
 *
 * @example
 * humanizeLabel("clientContact") → "Client Contact"
 * humanizeLabel("minGrossMarginPercent") → "Min Gross Margin Percent"
 * humanizeLabel("CCIP/CCOP") → "CCIP/CCOP"
 * humanizeLabel("firstName") → "First Name"
 * humanizeLabel("HTMLParser") → "HTML Parser"
 */
function humanizeLabel(fieldName: string): string {
  // Handle special characters (preserve as-is)
  if (/[^a-zA-Z0-9]/.test(fieldName)) {
    // Contains special chars - might be intentional (e.g., "CCIP/CCOP")
    // Just capitalize first letter if needed
    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  }

  // Split on camelCase boundaries
  // "clientContact" → ["client", "Contact"]
  // "HTMLParser" → ["HTML", "Parser"]
  const words = fieldName
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // HTMLParser → HTML Parser
    .split(' ');

  // Capitalize each word
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
```

### 15.4 Label Resolution Implementation

In the Field component, resolve label during props merge:

```typescript
// In Field component, during props resolution
const resolvedLabel = useMemo(() => {
  // Priority 1: Component prop
  if (restProps.label) return restProps.label;

  // Priority 2: Field config props.label
  if (fieldConfig.props?.label) return fieldConfig.props.label;

  // Priority 3: Evaluated selectProps.label
  if (evaluatedSelectProps?.label) return evaluatedSelectProps.label;

  // Priority 4: Field config label
  if (fieldConfig.label) return fieldConfig.label;

  // Priority 5: Field config title (legacy)
  if (fieldConfig.title) return fieldConfig.title;

  // Priority 6: Auto-generate from field name
  return humanizeLabel(name);
}, [
  restProps.label,
  fieldConfig.props?.label,
  evaluatedSelectProps?.label,
  fieldConfig.label,
  fieldConfig.title,
  name,
]);

// Add to final props
const finalProps = {
  // ... other props
  label: resolvedLabel,
};
```

### 15.5 Special Label Formatting

For fields with special formatting requirements (e.g., units, symbols):

```typescript
config = {
  minGrossMarginPercent: {
    type: 'number',
    label: 'Min Gross Margin (%)',  // Explicit with unit
  },
  minGrossMarginDollars: {
    type: 'number',
    label: 'Min Gross Margin ($)',
  },
};
```

**IMPORTANT**: Auto-generation cannot add units or special formatting. Fields requiring specific labels MUST define them explicitly in config.

### 15.6 Label vs Name in Props

The resolved label is passed to the input component as the `label` prop. The field name remains available as `name`:

```typescript
// Component receives:
{
  name: "clientContact",        // For form registration
  label: "Client Contact",      // For display
  // ... other props
}
```

Components should use `label` for display and `name` for form operations.

---

## 17. Props Evaluation Pipeline

### 16.1 Evaluation Contexts

**Provider-level** (no field context):
```typescript
// evaluateDescriptor(providerConfig.selectDefaultFieldProps, context)
{
  state: {
    fields: { /* all fields */ },
    record: { /* record */ },
    errors: { /* errors */ },
    // NO props - this is global config
  }
}
```

**Form-level** (no field context):
```typescript
// evaluateDescriptor(formConfig.selectDefaultFieldProps, context)
{
  state: {
    fields: { /* all fields */ },
    record: { /* record */ },
    errors: { /* errors */ },
    // NO props - this is form-wide config
  }
}
```

**Field-level** (with field context):
```typescript
// evaluateDescriptor(fieldConfig.selectProps, context)
{
  state: {
    fields: { /* all fields */ },
    record: { /* record */ },
    errors: { /* errors */ },
    props: {
      name: "clientContact",  // Current field name
    },
  }
}
```

This is why:
- `providerConfig.selectDefaultFieldProps: { label: "props.name" }` works
- `formConfig.selectDefaultFieldProps: { label: "props.name" }` works
- But they evaluate in field context, not provider/form context

### 14.2 selectProps Integration with useOptions

**Problem**: How does `selectProps: { queryParams: "client.id" }` connect to a component's `useOptions` hook?

**Answer**: Through props merging.

```typescript
// 1. Field config
{
  clientContact: {
    type: 'expandingAuto',
    props: {
      labelKey: 'fullName',
      useOptions: useGetContactsByClient,
    },
    selectProps: {
      queryParams: 'client.id',
    },
  },
}

// 2. When client field changes to { id: 5 }
// Field watches 'client' (inferred from selectProps)
// selectProps re-evaluates:
evaluate('client.id', context) → 5

// 3. Props merge
const finalProps = {
  labelKey: 'fullName',
  useOptions: useGetContactsByClient,
  queryParams: 5,  // From evaluated selectProps
  // ... other props
};

// 4. Component receives
<ExpandingAutocomplete
  labelKey="fullName"
  useOptions={useGetContactsByClient}
  queryParams={5}
/>

// 5. Component calls hook
const options = useOptions(queryParams);  // Called with 5
```

**Key insight**: The component MUST call `useOptions(props.queryParams)` itself. The framework doesn't call hooks - it just passes evaluated values as props.

### 14.3 Component Contract for useOptions

Components that accept `useOptions` props must:

1. Accept `useOptions` as a prop (function reference)
2. Accept query params as a prop (e.g., `queryParams`)
3. Call the hook internally: `useOptions(queryParams)`
4. Handle loading/error states
5. Pass options to underlying component

Example:
```typescript
function ExpandingAutocomplete({ useOptions, queryParams, ...props }) {
  // Call the hook with evaluated params
  const { data: options, isLoading, error } = useOptions(queryParams, {
    skip: !queryParams,  // Don't fetch if no params
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;

  return <Autocomplete {...props} options={options || []} />;
}
```

### 14.4 selectProps Re-evaluation

**When does selectProps re-evaluate?**

1. **Mount**: Initial evaluation
2. **Dependency change**: When any inferred field changes
3. **Watch trigger**: Via `useWatch` on subscribed fields

```typescript
// In Field component
const subscribedFields = inferFieldsFromDescriptor(fieldConfig.selectProps);
const watchedValues = useWatch({ name: subscribedFields });

const evaluatedSelectProps = useMemo(() => {
  return evaluateDescriptor(fieldConfig.selectProps, fieldContext);
}, [watchedValues, fieldConfig.selectProps]);
```

**Example flow**:
```typescript
// Initial state: client = null
selectProps: { queryParams: "client.id" }
→ evaluate("client.id") → undefined
→ finalProps.queryParams = undefined
→ useOptions(undefined, { skip: true }) → no fetch

// User selects client = { id: 5 }
→ Field watches 'client' changes
→ selectProps re-evaluates
→ evaluate("client.id") → 5
→ finalProps.queryParams = 5
→ useOptions(5, { skip: false }) → fetches contacts for client 5
```

---

## 18. Complete Data Flow

### 17.1 Initialization Flow

```
1. FormalityProvider mounts
   ↓
2. ConfigContext created with global config
   ↓
3. Form mounts
   ↓
4. Merge provider + form config
   ↓
5. Extract defaultValues from config
   ↓
6. Initialize React Hook Form with defaultValues and record
   ↓
7. Create FormContext with registries
   ↓
8. Field mounts
   ↓
9. Register with form
   ↓
10. Resolve type and config
    ↓
11. Set up watcher state
    ↓
12. Subscribe to dependencies
    ↓
13. Evaluate conditions
    ↓
14. Merge and evaluate props
    ↓
15. Create Controller
    ↓
16. Format value for display
    ↓
17. Render component
```

### 17.2 Change Flow

```
1. User interacts with input
   ↓
2. Component calls onChange(newValue)
   ↓
3. Field's handleChange receives newValue
   ↓
4. Parse value
   ↓
5. Update RHF value: controller.field.onChange(parsedValue)
   ↓
6. Trigger validation (if no debounce)
   ↓
7. Call changeField(name, parsedValue)
   ↓
8. Notify subscribers (via RHF watch system)
   ↓
9. Subscribing fields re-render
   ↓
10. Re-evaluate conditions/selectProps in subscribers
    ↓
11. Update subscriber props
    ↓
12. Trigger auto-save (if enabled)
```

### 17.3 Validation Flow

```
1. Field value changes
   ↓
2. RHF triggers validation (based on mode)
   ↓
3. Run RHF rules (if any)
   ↓
4. If rules pass, run field validator
   ↓
5. Set fieldValidating(name, true)
   ↓
6. Run validator function(s)
   ↓
7. If validator returns error, stop and return error
   ↓
8. If field validator passes, run type validator
   ↓
9. If type validator returns error, stop and return error
   ↓
10. All validators passed
    ↓
11. Set fieldValidating(name, false)
    ↓
12. Update field state (error or success)
```

### 17.4 Submit Flow

```
1. User triggers submit (button click or auto-save)
   ↓
2. Check if any subscribed field is validating
   ↓
3. If yes, block submission
   ↓
4. If no, proceed
   ↓
5. RHF runs all field validations
   ↓
6. If validation errors, stop and show errors
   ↓
7. Run form-level validate function (if provided)
   ↓
8. If form validation errors, stop and show errors
   ↓
9. Transform values for submission
   ↓
10. Extract valueField (if specified)
    ↓
11. Rename fields (if getSubmitField specified)
    ↓
12. Call onSubmit with transformed values
```

### 17.5 FieldGroup Flow

```
1. FieldGroup mounts
   ↓
2. Extract group config from formConfig.groups
   ↓
3. Extract condition dependencies (when fields)
   ↓
4. Set up useWatch for dependencies
   ↓
5. Evaluate conditions
   ↓
6. Create GroupContext with state
   ↓
7. Render children wrapped in context
   ↓
8. Child Field mounts
   ↓
9. Child reads groupContext.state
   ↓
10. Child merges group disabled/visible with own
    ↓
11. Dependency field changes
    ↓
12. FieldGroup re-evaluates conditions
    ↓
13. Updates GroupContext state
    ↓
14. Children re-render with new context
```

---

## 19. Edge Cases and Behaviors

### 18.1 Mounting Race Conditions

**Scenario**: Field B subscribes to Field A, but Field B mounts before Field A.

**Solution**: Pending queue

```typescript
// B mounts first
addSubscription('fieldA', 'fieldB');
// fieldA watcher setter not registered yet
// → Add to pendingWatcherUpdates.get('fieldA')

// A mounts later
registerWatcherSetter('fieldA', setWatchers);
// → Check pending queue
// → Process pending: setWatchers({ fieldB: true })
```

### 18.2 Circular Dependencies

**Scenario**: Field A subscribes to Field B, Field B subscribes to Field A.

**Behavior**: Both fields watch each other, causing infinite render loop.

**Prevention**: None built-in. Developers must avoid circular subscriptions in config.

**Detection**: React will error with "Maximum update depth exceeded".

### 18.3 Condition Set Value vs User Input

**Scenario**: Condition sets field value, then user edits field, then condition triggers again.

**Behavior**:
1. Condition applies: `set: 'default'` → field value = 'default'
2. User types 'custom' → field value = 'custom'
3. Condition triggers again → field value = 'default' (overwrites user input)

**Why**: Conditions evaluate on every watched field change, always applying their actions.

**Solution**: Use conditions carefully. If you want to set an initial value but allow user override, use `defaultValues` instead of condition `set`.

### 18.4 Empty vs Null vs Undefined

Different field types use different "empty" values:

| Type | Empty Value | Why |
|------|-------------|-----|
| textField | `''` | Standard for text inputs |
| switch | `false` | Boolean default |
| autocomplete | `null` | Indicates "no selection" |
| decimal | `''` | Allows truly empty field (vs 0) |

**CRITICAL**: Match the empty value to the expected type. Using `0` for decimal prevents distinguishing between "empty" and "zero".

### 18.5 Formatter Display vs Submit Value

**Scenario**: User types "42.6" in a decimal field with 2-decimal formatter.

**Display**: "42.60" (formatted)
**Form value**: 42.6 (number)
**Submit value**: 42.6 (number)

**Why**: Formatter only affects display, not the underlying value.

### 18.6 Debounce Edge Cases

**Scenario 1**: User types "abc", waits 3s (debounce), then types "d".

**Behavior**:
- After 3s: Validation runs for "abc"
- After typing "d": New 3s debounce starts
- After 3s more: Validation runs for "abcd"

**Scenario 2**: User types "abc", debounce timer running, user submits form.

**Behavior**:
- Submit triggers immediate validation (ignores debounce)
- If valid, submits "abc"

### 18.7 Record vs Form Values

**Scenario**: Record has `{ name: "John" }`, user changes to "Jane".

**State**:
- `record.name`: "John" (original, unchanged)
- `fields.name.value`: "Jane" (current)

**Expressions**:
- `"record.name"` → "John"
- `"name"` → "Jane" (resolves to fields.name.value)

**Why**: `record` is the original data, useful for comparisons and conditional logic based on initial state.

### 18.8 ValueField on Submit Only

**Scenario**: Autocomplete field with `valueField: 'id'`.

**Form state**: `{ client: { id: 5, name: "Acme" } }`
**Submit value**: `{ clientId: 5 }`

**Why**: During editing, field needs full object for display. Only on submit do we extract the ID for the API.

### 18.9 UnusedFields Registration Loop

**Scenario**: `<UnusedFields />` renders fields not explicitly declared, but those fields call `registerField`.

**Problem**: Would make them no longer "unused", causing re-render loop.

**Solution**: `shouldRegister={false}` prop on Field prevents registration, breaking the loop.

### 18.10 FieldGroup Visible vs Display

**Scenario**: FieldGroup has `visible: false`, but children have their own visibility.

**Behavior**: FieldGroup wrapper has `display: none`, hiding all children regardless of their individual visibility.

**Why**: CSS display:none on parent hides all descendants.

**Solution**: If child needs independent visibility, don't use FieldGroup visibility. Use field-level conditions instead.

### 18.11 Nested FieldGroup State Merging

**Scenario**: Parent FieldGroup has `isDisabled: true`, child FieldGroup has `isDisabled: false`.

**Behavior**: Child's merged state is `isDisabled: false || true = true` (parent wins).

**Why**: OR logic for disabled means any ancestor can disable. This prevents accidentally enabling fields that a parent disabled.

**Example**:
```typescript
<FieldGroup name="parentGroup">  {/* disables when userRole !== 'admin' */}
  <FieldGroup name="childGroup">  {/* disables when formLocked === true */}
    <Field name="sensitiveField" />
  </FieldGroup>
</FieldGroup>

// If userRole !== 'admin', sensitiveField is disabled
// EVEN IF formLocked === false (child condition passes)
// Parent's security restriction overrides child
```

**Visible uses opposite logic**: AND (`child && parent`) so any ancestor can hide.

### 18.12 FieldGroup subscribesTo vs Inferred

**Scenario**: Group has conditions referencing `field1`, but `subscribesTo: ['field2']`.

**Behavior**: Group watches BOTH `field1` (inferred from conditions) AND `field2` (explicit).

**Why**: `subscribesTo` is additive, not replacement. It supplements inferred dependencies.

**Use case**: Condition uses a function that references fields not in the `when` clause:
```typescript
{
  conditions: [{
    when: 'primaryField',
    truthy: true,
    selectSet: (value, state) => state.fields.secondaryField.value && value,
  }],
  subscribesTo: ['secondaryField'],  // Not inferred from function
}
```

---

## Appendix A: Complete Type Reference

```typescript
// === Core Configuration ===

interface FormalityProviderConfig {
  inputs: Record<string, InputConfig>;
  formatters?: Record<string, (value: unknown) => unknown>;
  parsers?: Record<string, (value: unknown) => unknown>;
  validators?: ValidatorsConfig;
  errorMessages?: ErrorMessagesConfig;
  defaultInputTemplate?: React.ComponentType<InputTemplateProps>;
  inputTemplates?: Record<string, React.ComponentType<InputTemplateProps>>;
  defaultSubscriptionPropName?: string;
  defaultFieldProps?: Record<string, unknown>;
  selectDefaultFieldProps?: SelectDescriptor;
}

interface InputConfig<TValue = unknown> {
  component: React.ComponentType<any>;
  defaultValue: TValue;
  debounce?: number | false;
  inputFieldProp?: string;
  valueField?: string;
  getSubmitField?: (fieldName: string) => string;
  parser?: string | ((value: unknown) => TValue);
  formatter?: string | ((value: TValue) => unknown);
  validator?: ValidatorSpec;
  template?: React.ComponentType<InputTemplateProps>;
}

interface FormConfig {
  groups?: Record<string, GroupConfig>;
  defaultFieldProps?: Record<string, unknown>;
  selectDefaultFieldProps?: SelectDescriptor;
  title?: string;
  selectTitle?: SelectDescriptor;
}

interface GroupConfig {
  conditions?: ConditionDescriptor[];
  subscribesTo?: string[];
}

interface FormFieldsConfig {
  [fieldName: string]: FieldConfig;
}

interface FieldConfig {
  type?: string;
  disabled?: boolean;
  hidden?: boolean;
  rules?: RegisterOptions;
  validator?: ValidatorSpec;
  props?: Record<string, unknown>;
  selectProps?: SelectDescriptor;
  conditions?: ConditionDescriptor[];
  subscribesTo?: string[];
  provideState?: boolean;
}

// === Descriptors ===

type SelectDescriptor =
  | Record<string, string>
  | string;

interface ConditionDescriptor {
  when?: string;                   // Field to watch (simple field name)
  selectWhen?: string;             // Expression to watch (alternative to when)
  is?: unknown;
  truthy?: boolean;
  disabled?: boolean;
  visible?: boolean;
  set?: unknown;
  selectSet?: string;
}

// === Validation ===

type ValidatorSpec =
  | string
  | ValidatorFunction
  | Array<string | ValidatorFunction>;

type ValidatorFunction = (
  value: unknown,
  formValues: Record<string, unknown>
) => ValidationResult | Promise<ValidationResult>;

type ValidationResult =
  | true
  | false
  | string
  | undefined
  | { type: string; message?: string };

interface ValidatorsConfig {
  [name: string]: ValidatorFunction | ((...args: any[]) => ValidatorFunction);
}

interface ErrorMessagesConfig {
  [type: string]: string;
}

// === Context Values ===

interface FormContextValue {
  config: FormFieldsConfig;
  formConfig: FormConfig;
  registerField: (name: string) => void;
  unregisterField: (name: string) => void;
  addSubscription: (target: string, subscriber: string) => void;
  removeSubscription: (target: string, subscriber: string) => void;
  registerWatcherSetter: (name: string, setter: WatcherSetterFn) => void;
  unregisterWatcherSetter: (name: string) => void;
  changeField: (name: string, value: unknown) => void;
  setFieldValidating: (name: string, isValidating: boolean) => void;
  getFormState: () => FormState;
  unusedFields: string[];
}

interface ConfigContextValue {
  inputs: Record<string, InputConfig>;
  formatters: Record<string, (value: unknown) => unknown>;
  parsers: Record<string, (value: unknown) => unknown>;
  validators: ValidatorsConfig;
  errorMessages: ErrorMessagesConfig;
  defaultInputTemplate?: React.ComponentType<InputTemplateProps>;
  inputTemplates: Record<string, React.ComponentType<InputTemplateProps>>;
  defaultSubscriptionPropName: string;
  defaultFieldProps: Record<string, unknown>;
  selectDefaultFieldProps?: SelectDescriptor;
}

interface GroupContextValue {
  state: {
    isDisabled: boolean;
    isVisible: boolean;
    conditions: ConditionDescriptor[];
    subscriptions: string[];
  };
  subscriptions: string[];  // Root-level for default context
  inferredInputs: string[];
  config: GroupConfig;
}

// === Form State ===

interface FormState {
  fields: Record<string, FieldState>;
  record?: Record<string, unknown>;
  errors: Record<string, FieldError>;
  defaultValues: Record<string, unknown>;
  touchedFields: Record<string, boolean>;
  dirtyFields: Record<string, boolean>;
  props?: Record<string, unknown>;
}

interface FieldState {
  value: unknown;
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  error?: FieldError;
  watchers: Record<string, boolean>;
}

interface FieldError {
  type: string;
  message?: string;
}

// === Component Props ===

interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  children: React.ReactNode | ((api: FormRenderAPI) => React.ReactNode);
  config: FormFieldsConfig;
  formConfig?: FormConfig;
  onSubmit?: (values: Partial<TFieldValues>) => void | Promise<void>;
  record?: Partial<TFieldValues>;
  autoSave?: boolean;
  debounce?: number;
  validate?: (values: Partial<TFieldValues>) =>
    ValidationErrors | Promise<ValidationErrors>;
}

interface FormRenderAPI {
  unusedFields: string[];
  formState: UseFormStateReturn;
  methods: UseFormReturn;
}

interface FieldProps {
  name: string;
  type?: string;
  disabled?: boolean;
  hidden?: boolean;
  children?: React.ReactNode | ((api: FieldRenderAPI) => React.ReactNode);
  shouldRegister?: boolean;
  [key: string]: unknown;
}

interface FieldRenderAPI {
  fieldState: ControllerFieldState;
  renderedField: React.ReactNode;
  fieldProps: Record<string, unknown>;
  watchers: Record<string, boolean>;
  formState: UseFormStateReturn;
}

interface FieldGroupProps {
  name: string;
  children: React.ReactNode;
}

interface InputTemplateProps {
  Field: React.ComponentType<any>;
  fieldProps: Record<string, unknown>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn;
}

// === Expression Engine ===

interface EvaluatorContext {
  state: FormState;
  resolvePath?: (path: string) => string;
}

// === Utilities ===

type WatcherSetterFn = React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

type ValidationErrors = Record<string, string>;
```

---

## Appendix B: Implementation Checklist

Use this checklist to ensure every aspect is implemented:

### Performance Architecture (CRITICAL)
- [ ] **makeProxyState utility function**
- [ ] **Proxy state for formState.fields[name] objects**
- [ ] **Proxy state for record property on formState**
- [ ] **Proxy state during field inference (useInferredInputs)**
- [ ] **Inverted subscription index (Map<target, Set<subscriber>>)**
- [ ] **Memoization of evaluated selectProps**
- [ ] **Memoization of resolved conditions**
- [ ] **Memoization of merged props**
- [ ] **Memoization of field state objects**
- [ ] **Custom useFormState hook wrapping RHF's useFormState**
- [ ] **Testing: Verify Object.defineProperty creates getters**
- [ ] **Testing: Verify proxy objects enumerate correctly**

### Configuration System
- [ ] FormalityProvider component
- [ ] ConfigContext creation and provision
- [ ] Config merging (provider + form + field)
- [ ] Default values extraction
- [ ] All InputConfig properties supported
- [ ] Named formatters/parsers/validators registry

### Form Component
- [ ] React Hook Form integration
- [ ] FormContext creation and provision
- [ ] Field registry (registerField/unregisterField)
- [ ] Subscription registry (addSubscription/removeSubscription)
- [ ] Watcher setter registry (registerWatcherSetter/unregisterWatcherSetter)
- [ ] Pending watcher queue for mount order issues
- [ ] changeField notification system
- [ ] Validation state tracking (setFieldValidating)
- [ ] Unused fields calculation
- [ ] Auto-save with debounce
- [ ] Submit value transformation (valueField, getSubmitField)
- [ ] Form-level validation blocking
- [ ] Subscribed field validation blocking

### Field Component
- [ ] Controller integration
- [ ] Type resolution (prop → config → default)
- [ ] Config merging (all 8 layers)
- [ ] Watcher state management
- [ ] Subscription setup (explicit + inferred)
- [ ] Condition evaluation
- [ ] Disabled state resolution (prop → config → condition → group)
- [ ] Visibility handling
- [ ] Props evaluation (selectProps)
- [ ] Value parsing (input → form)
- [ ] Value formatting (form → display)
- [ ] Change handler with changeField notification
- [ ] Validation integration (field + type validators)
- [ ] Template rendering
- [ ] Children render prop support
- [ ] provideState prop handling

### FieldGroup Component
- [ ] GroupContext provision
- [ ] Parent context reading (for nesting)
- [ ] Condition evaluation
- [ ] Dependency watching (useWatch)
- [ ] subscribesTo support for manual subscriptions
- [ ] State propagation (isDisabled, isVisible, conditions, subscriptions)
- [ ] State merging with parent (OR for disabled, AND for visible)
- [ ] Conditions/subscriptions accumulation from parents
- [ ] Visibility wrapper (display:none)
- [ ] useInferredInputs hook
- [ ] useConditions hook
- [ ] Default GroupContext in Form (when no groups present)
- [ ] Children rendering

### Expression Engine
- [ ] Tokenizer implementation
- [ ] Parser implementation
- [ ] Evaluator implementation
- [ ] Path resolution (qualified vs unqualified)
- [ ] All qualified prefixes supported (7 total)
- [ ] Descriptor evaluation (object and string)
- [ ] Field inference from descriptors
- [ ] Props context for field-level expressions

### Subscription System
- [ ] Forward subscriptions (useWatch)
- [ ] Reverse subscriptions (watchers state)
- [ ] Inverted subscriptions registry
- [ ] Pending queue for mount order
- [ ] changeField bridge
- [ ] Validation state integration

### Validation System
- [ ] RHF rules integration
- [ ] Field validator layer
- [ ] Type validator layer
- [ ] Form validator layer
- [ ] Async validator support
- [ ] Validator array support
- [ ] Error message resolution
- [ ] Named validator registry
- [ ] Validation state tracking

### Value Transformation
- [ ] Parse pipeline (input → form)
- [ ] Format pipeline (form → display)
- [ ] Submit pipeline (form → API)
- [ ] Named parser registry
- [ ] Named formatter registry
- [ ] Inline parser/formatter support
- [ ] ValueField extraction on submit
- [ ] getSubmitField renaming

### Conditions System
- [ ] Condition evaluation (is, truthy, default)
- [ ] Condition trigger support (when and selectWhen)
- [ ] selectWhen expression evaluation for complex triggers
- [ ] Action application (disabled, visible, set, selectSet)
- [ ] Cumulative action logic (OR for disabled, AND for visible)
- [ ] Field-level conditions
- [ ] Group-level conditions
- [ ] Dependency watching

### Additional Components
- [ ] Fields component (renders array of fields)
- [ ] UnusedFields component with shouldRegister
- [ ] Input template system

### Hooks
- [ ] useDebounce/useDebouncedFn
- [ ] usePrevious
- [ ] useStableCallback

### Edge Cases
- [ ] Mount order race conditions
- [ ] Circular dependency detection
- [ ] Empty value handling (null vs undefined vs '')
- [ ] Record vs form values separation
- [ ] UnusedFields registration loop prevention
- [ ] FieldGroup visibility wrapper behavior

---

**END OF COMPLETE SPECIFICATION**
