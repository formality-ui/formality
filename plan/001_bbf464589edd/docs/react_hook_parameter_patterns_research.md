# React Hook Parameter Patterns & Best Practices Research

**Document Version:** 1.0
**Research Date:** 2026-01-11
**Status:** Comprehensive Analysis of Codebase Patterns + Documented Best Practices

---

## Executive Summary

This document provides comprehensive research on React hook parameter patterns and best practices, with specific focus on extending hook signatures with new parameters while maintaining backward compatibility. The analysis is based on:

1. **Pattern analysis** of the Formality codebase (@formality-ui/react)
2. **Established best practices** from React and TypeScript communities
3. **Real-world implementations** of hooks with optional parameters and union types
4. **Props merging patterns** with priority-based override systems

**Key Findings:**

- Formality demonstrates excellent backward compatibility through **options object patterns**
- Union types with optional parameters enable **flexible hook signatures**
- **8-layer props merging** with priority ordering provides predictable override behavior
- **TypeScript discriminated unions** enable type-safe conditional parameters
- **Function overloads** provide backward-compatible API evolution

---

## Table of Contents

1. [Best Practices for Extending Hook Signatures](#1-best-practices-for-extending-hook-signatures)
2. [Backward Compatibility Strategies](#2-backward-compatibility-strategies)
3. [TypeScript Patterns for Optional Parameters](#3-typescript-patterns-for-optional-parameters)
4. [Props Merging with Priority](#4-props-merging-with-priority)
5. [Real-World Examples from Formality](#5-real-world-examples-from-formality)
6. [External Documentation References](#6-external-documentation-references)
7. [Implementation Patterns](#7-implementation-patterns)

---

## 1. Best Practices for Extending Hook Signatures

### 1.1 Options Object Pattern (Preferred)

**The options object pattern is the most flexible and maintainable approach** for extending React hooks with new parameters.

#### Structure

```typescript
interface UseMyHookOptions {
  /** Required parameter */
  required: string;

  /** Optional parameter with default */
  optional?: number;

  /** New parameter (backward compatible) */
  newParameter?: boolean;

  /** Union type parameter */
  mode?: 'light' | 'dark' | 'auto';
}

function useMyHook(options: UseMyHookOptions) {
  const {
    required,
    optional = 42,
    newParameter = false,
    mode = 'auto'
  } = options;

  // Implementation
}
```

#### Benefits

1. **Named parameters** - No need to remember parameter order
2. **Easy to extend** - Add new optional properties without breaking existing code
3. **Self-documenting** - Property names describe their purpose
4. **Default values** - Clear default behavior through destructuring
5. **Type safety** - TypeScript catches missing required properties

#### Real-World Example from Formality

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
  // All three properties are optional except conditions
  // Adding new properties later would be backward compatible
}
```

### 1.2 Curried Pattern for Configuration

**Separate configuration from runtime values** when the hook has both static config and dynamic runtime parameters.

```typescript
// Configure hook with static options
function useMyHook(config: UseMyHookConfig) {
  // Return a hook that accepts runtime parameters
  return useCallback((runtime: RuntimeParams) => {
    // Implementation with both config and runtime
  }, [config]);
}

// Usage
const useConfiguredHook = useMyHook({ staticOption: true });
useConfiguredHook({ runtimeValue: 42 });
```

### 1.3 Parameter Object with Defaults

**Provide sensible defaults** while allowing complete customization.

```typescript
interface UseDebounceOptions {
  /** Delay in milliseconds (default: 300) */
  delay?: number;

  /** Execute on leading edge (default: false) */
  leading?: boolean;

  /** Execute on trailing edge (default: true) */
  trailing?: boolean;

  /** Maximum wait time (optional) */
  maxWait?: number;
}

function useDebounce(callback: Function, options: UseDebounceOptions = {}) {
  const {
    delay = 300,
    leading = false,
    trailing = true,
    maxWait
  } = options;

  // Implementation
}

// All parameters are optional - fully backward compatible
```

---

## 2. Backward Compatibility Strategies

### 2.1 Strategy 1: Optional Properties (Recommended)

**Add new optional properties to existing options interfaces.** This is the safest approach as existing code continues to work without changes.

```typescript
// Version 1.0
interface UseFetchOptions {
  url: string;
  method?: 'GET' | 'POST';
}

// Version 2.0 - Adding new optional properties (backward compatible!)
interface UseFetchOptions {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;  // NEW - optional
  timeout?: number;                  // NEW - optional
  retry?: number;                    // NEW - optional
}

// Version 1.0 code still works
useFetch({ url: '/api/data' });

// Version 2.0 code can use new features
useFetch({
  url: '/api/data',
  headers: { 'Authorization': 'Bearer token' },
  timeout: 5000
});
```

### 2.2 Strategy 2: Union Types for Signatures

**Use union types to support multiple call patterns** while maintaining type safety.

```typescript
// Support both string and object forms
type UseFetchInput =
  | string  // Simple: just URL
  | { url: string; options?: UseFetchOptions };  // Advanced: URL + options

function useFetch(input: UseFetchInput) {
  // Handle both forms
  const url = typeof input === 'string' ? input : input.url;
  const options = typeof input === 'string' ? {} : input.options ?? {};

  // Implementation
}

// Both work
useFetch('/api/data');
useFetch({ url: '/api/data', options: { timeout: 5000 } });
```

### 2.3 Strategy 3: Function Overloads

**Use TypeScript function overloads** to provide multiple signatures while implementing one function.

```typescript
// Overload 1: Simple form
function useMyHook(required: string): Result;

// Overload 2: With options
function useMyHook(required: string, options: UseMyHookOptions): Result;

// Implementation
function useMyHook(required: string, options?: UseMyHookOptions): Result {
  const actualOptions = options ?? {};
  // Implementation
}

// Both work
useMyHook('value');
useMyHook('value', { enabled: true });
```

### 2.4 Strategy 4: Discriminated Unions

**Use discriminated unions** for mutually exclusive parameter combinations.

```typescript
interface BaseOptions {
  mode: 'simple';
  value: string;
}

interface AdvancedOptions {
  mode: 'advanced';
  value: number;
  precision?: number;
}

type UseMyHookOptions = BaseOptions | AdvancedOptions;

function useMyHook(options: UseMyHookOptions) {
  if (options.mode === 'simple') {
    // options.value is string
    return options.value.toUpperCase();
  } else {
    // options.value is number
    return options.value.toFixed(options.precision ?? 2);
  }
}

// Type-safe usage
useMyHook({ mode: 'simple', value: 'hello' });      // OK
useMyHook({ mode: 'advanced', value: 42 });         // OK
useMyHook({ mode: 'simple', value: 42 });           // TYPE ERROR!
```

### 2.5 Deprecation Pattern

**Deprecate old parameters gradually** while maintaining compatibility.

```typescript
interface UseMyHookOptions {
  /** @deprecated Use newParameter instead */
  oldParameter?: boolean;

  /** New parameter - replaces oldParameter */
  newParameter?: boolean;
}

function useMyHook(options: UseMyHookOptions) {
  // Support both with deprecation warning
  if (options.oldParameter !== undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('oldParameter is deprecated. Use newParameter instead.');
    }
  }

  const effectiveValue = options.newParameter ?? options.oldParameter ?? false;
  // Implementation
}
```

---

## 3. TypeScript Patterns for Optional Parameters

### 3.1 Optional Properties with Union Types

**Formality demonstrates this pattern extensively** in configuration types.

**File:** `/home/dustin/projects/formality/packages/core/src/types/config.ts`

```typescript
/**
 * SelectValue - Polymorphic type for dynamic values
 * Supports expressions, functions, objects, and arrays
 */
export type SelectValue<TReturn = unknown> =
  | string                                    // Expression: "client.id"
  | SelectFunction<TReturn>                   // Function callback
  | { [key: string]: SelectValue }            // Nested object
  | SelectValue[];                            // Array of values

/**
 * SelectFunction - Callback signature
 */
export type SelectFunction<TReturn = unknown> = (
  formState: FormState,
  methods: unknown,
) => TReturn;
```

**Usage:**

```typescript
interface UsePropsEvaluationOptions {
  /** Dynamic props descriptor - supports multiple forms */
  selectProps?: SelectValue;

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Current field name */
  fieldName: string;
}

// All valid:
selectProps: "client.id"                                    // string expression
selectProps: ({ fields }) => fields.client.value            // function
selectProps: { disabled: "!signed", placeholder: "name" }   // object
selectProps: ["option1", "option2"]                         // array
```

### 3.2 Union Types for Special Values

**Use unions to include special sentinel values** alongside regular types.

**File:** `/home/dustin/projects/formality/packages/core/src/types/config.ts`

```typescript
interface InputConfig<TValue = unknown> {
  /**
   * Debounce milliseconds for validation/auto-save
   * - number: wait time in milliseconds
   * - false: immediate execution (no debounce)
   */
  debounce?: number | false;

  /**
   * Parser can be:
   * - string: named parser from config
   * - function: inline parser implementation
   */
  parser?: string | ((value: unknown) => TValue);

  /**
   * Formatter can be:
   * - string: named formatter from config
   * - function: inline formatter implementation
   */
  formatter?: string | ((value: TValue) => unknown);
}
```

**Benefits:**

1. **Explicit special cases** - `false` is clearly "no debounce"
2. **Type safety** - Can't pass arbitrary values
3. **Self-documenting** - Union shows all valid options
4. **IDE autocomplete** - Editors suggest valid options

### 3.3 Conditional Types with Parameters

**Use conditional types** to change return type based on parameters.

```typescript
interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncOptions<T> {
  initialData?: T;
  enabled?: boolean;
}

// Conditional return type based on enabled
function useAsync<T>(
  url: string,
  options: UseAsyncOptions<T> & { enabled: true }
): UseAsyncResult<T>;

function useAsync<T>(
  url: string,
  options?: UseAsyncOptions<T>
): UseAsyncResult<T | null>;

// Implementation
function useAsync<T>(url: string, options?: UseAsyncOptions<T>) {
  // Type guard implementation
  if (options?.enabled) {
    // Return type is UseAsyncResult<T>
  } else {
    // Return type is UseAsyncResult<T | null>
  }
}
```

### 3.4 Generic Constraints

**Constrain generics** to ensure type-safe parameters.

**File:** `/home/dustin/projects/formality/packages/react/src/components/Form.tsx`

```typescript
export interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  /** Form configuration */
  config?: FormConfig;

  /** Initial form values */
  defaultValues?: TFieldValues;

  /** Submit handler */
  onSubmit?: (values: Partial<TFieldValues>) => void | Promise<void>;

  /** Auto-save enabled */
  autoSave?: boolean;

  /** Debounce delay */
  debounce?: number;
}

// Generic constraint ensures TFieldValues is a valid form state
// Default = FieldValues allows generic usage
```

### 3.5 Recursive Types for Nested Structures

**Support nested configurations** with recursive type definitions.

```typescript
// Recursive SelectValue allows nested objects
type SelectValue =
  | string
  | SelectFunction
  | { [key: string]: SelectValue }  // Recursive!
  | SelectValue[];

// Valid nested structures:
const nested: SelectValue = {
  disabled: "!signed",
  props: {
    placeholder: "client.name",
    className: "field-{client.status}"
  }
};
```

---

## 4. Props Merging with Priority

### 4.1 The 8-Layer Merge Pattern

**Formality implements a sophisticated 8-layer props merging system** with clear priority ordering.

**File:** `/home/dustin/projects/formality/packages/core/src/config/merge.ts` (lines 180-215)

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
    providerDefaultFieldProps,           // Layer 1: Lowest priority
    providerSelectDefaultFieldProps,     // Layer 2
    formDefaultFieldProps,               // Layer 3
    formSelectDefaultFieldProps,         // Layer 4
    inputProps,                          // Layer 5
    fieldConfigProps,                    // Layer 6
    selectProps,                         // Layer 7
    componentProps,                      // Layer 8
    coreProps,                           // Layer 9: Highest priority (always wins)
  );
}
```

**Priority Order (Lowest → Highest):**

1. **Provider Default Field Props** - Global defaults
2. **Provider Select Default Field Props** - Dynamic provider defaults
3. **Form Default Field Props** - Form-level static defaults
4. **Form Select Default Field Props** - Form-level dynamic defaults
5. **Input Props** - Input type configuration
6. **Field Config Props** - Field-level static props
7. **Select Props** - Field-level dynamic props (evaluated)
8. **Component Props** - Props passed to Field component
9. **Core Props** - Critical props (name, value, onChange, etc.)

### 4.2 Static vs Dynamic Props

**Separate static and dynamic props** for optimal performance.

**File:** `/home/dustin/projects/formality/packages/core/src/config/merge.ts` (lines 136-167)

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

1. **Performance** - Static props merged once, dynamic props re-evaluated
2. **Caching** - Static merge results can be memoized
3. **Type safety** - Different types for static vs dynamic
4. **Clarity** - Clear separation of concerns

### 4.3 Deep Merge Strategy

**Deep merge objects** to preserve nested configurations.

**File:** `/home/dustin/projects/formality/packages/core/src/config/merge.ts` (lines 19-57)

```typescript
/**
 * Deep merge two objects, with the second object taking precedence
 */
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

### 4.4 Merge Utility with Tests

**Comprehensive tests** document merge behavior.

**File:** `/home/dustin/projects/formality/packages/core/src/__tests__/config.test.ts` (lines 158-192)

```typescript
describe("mergeFieldProps", () => {
  it("should merge all prop layers", () => {
    const merged = mergeFieldProps({
      providerDefaultFieldProps: { size: "small" },
      providerSelectDefaultFieldProps: { variant: "outlined" },
      formDefaultFieldProps: { margin: "dense" },
      inputProps: { type: "text" },
      fieldConfigProps: { required: true },
      selectProps: { disabled: false },
      componentProps: { className: "custom" },
      coreProps: { name: "myField", value: "test" },
    });

    expect(merged).toEqual({
      size: "small",
      variant: "outlined",
      margin: "dense",
      type: "text",
      required: true,
      disabled: false,
      className: "custom",
      name: "myField",
      value: "test",
    });
  });

  it("should let later layers override earlier", () => {
    const merged = mergeFieldProps({
      providerDefaultFieldProps: { disabled: true },
      selectProps: { disabled: false },
    });

    expect(merged.disabled).toBe(false);
  });
});
```

---

## 5. Real-World Examples from Formality

### 5.1 useConditions Hook

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

/**
 * Evaluates conditions against current field values
 *
 * This hook:
 * 1. Infers which fields to watch from conditions
 * 2. Subscribes to those fields via useWatch
 * 3. Evaluates conditions whenever watched values change
 *
 * @example
 * ```tsx
 * const result = useConditions({
 *   conditions: [
 *     { when: 'signed', is: false, disabled: true },
 *     { when: 'archived', truthy: true, visible: false },
 *   ],
 * });
 * ```
 */
export function useConditions(options: UseConditionsOptions): ConditionResult {
  const { conditions, subscribesTo, props } = options;
  // Implementation...
}
```

**Pattern Highlights:**

1. **Clear interface** - All parameters documented
2. **Optional parameters** - `subscribesTo` and `props` are optional
3. **JSDoc examples** - Usage examples in documentation
4. **Type-safe return** - `ConditionResult` type

### 5.2 usePropsEvaluation Hook

**File:** `/home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts`

```typescript
interface UsePropsEvaluationOptions {
  /** Dynamic props descriptor to evaluate */
  selectProps?: SelectValue;

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Current field name */
  fieldName: string;
}

/**
 * Evaluates selectProps against current field values
 *
 * Handles both expression-based selectProps and function-based selectProps.
 *
 * @example
 * ```tsx
 * const props = usePropsEvaluation({
 *   selectProps: {
 *     options: "client.id ? clientOptions : allOptions",
 *     disabled: "!signed",
 *   },
 *   fieldName: 'contact',
 * });
 * ```
 */
export function usePropsEvaluation(
  options: UsePropsEvaluationOptions,
): Record<string, unknown> {
  const { selectProps, subscribesTo, fieldName } = options;
  // Implementation...
}
```

**Pattern Highlights:**

1. **Polymorphic input** - `selectProps` accepts multiple types
2. **Explicit field tracking** - `fieldName` required for context
3. **Flexible subscriptions** - Can override automatic inference

### 5.3 Field Component Props

**File:** `/home/dustin/projects/formality/packages/react/src/components/Field.tsx` (lines 40-61)

```typescript
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
```

**Pattern Highlights:**

1. **Required parameter first** - `name` is required
2. **Optional overrides** - `type`, `disabled`, `hidden` override config
3. **Flexible children** - Union type for render prop or React node
4. **Index signature** - Accept any additional props via `[key: string]: unknown`
5. **Clear documentation** - Each property has JSDoc comment

### 5.4 Condition Descriptor Types

**File:** `/home/dustin/projects/formality/packages/core/src/types/conditions.ts`

```typescript
export interface ConditionDescriptor {
  /**
   * Field reference trigger - can be:
   * - string: Single field reference (e.g., "client")
   * - object: Multi-field with per-field matchers
   */
  when?: string | WhenMultiField;

  /**
   * Expression or function trigger
   * Example: "client.id > 5" or ({ fields }) => fields.client?.value?.id > 5
   */
  selectWhen?: SelectValue<boolean>;

  /** Exact value match */
  is?: unknown;

  /** Truthy/falsy check */
  truthy?: boolean;

  /** Field validity check (requires 'when' trigger) */
  isValid?: boolean;

  /** Disabled state result */
  disabled?: boolean;

  /** Visibility state result */
  visible?: boolean;

  /** Value to set (requires 'when' trigger) */
  set?: unknown;

  /** Dynamic value via expression or function */
  selectSet?: SelectValue;
}
```

**Pattern Highlights:**

1. **Union types** - `when` accepts string or object
2. **Optional properties** - All properties are optional
3. **Polymorphic values** - `selectSet` accepts `SelectValue` (string/function/object/array)
4. **Multiple trigger types** - `when` vs `selectWhen`
5. **Rich matchers** - `is`, `truthy`, `isValid` for different comparisons

---

## 6. External Documentation References

### 6.1 React Official Documentation

#### Custom Hooks
- **URL:** https://react.dev/reference/react
- **Section:** Building Your Own Hooks
- **Key Topics:**
  - Custom hooks start with "use"
  - Can call other hooks
  - Reuse stateful logic between components
  - Accept parameters and return values

#### Hooks Rules
- **URL:** https://react.dev/reference/react
- **Section:** Rules of Hooks
- **Key Topics:**
  - Only call hooks at the top level
  - Only call hooks from React functions
  - Consistent hook order across renders

#### forwardRef
- **URL:** https://react.dev/reference/react/forwardRef
- **Key Topics:**
  - Passing refs through components
  - Required for Controller integration
  - Type parameters: `forwardRef<HTMLElement, Props>`

### 6.2 TypeScript + React Patterns

#### Generic Component Types
- **Best Practice:** Use generic constraints for props
  ```typescript
  interface Props<T extends FieldValues> {
    data: T;
    onSubmit: (values: T) => void;
  }
  ```

#### Union Types for Props
- **Best Practice:** Discriminated unions for mutually exclusive props
  ```typescript
  type Props =
    | { mode: 'simple'; value: string }
    | { mode: 'advanced'; value: number };
  ```

#### Optional Properties
- **Best Practice:** Use optional properties with defaults
  ```typescript
  interface Options {
    required: string;
    optional?: number;
  }

  function useHook({ required, optional = 42 }: Options) {
    // ...
  }
  ```

### 6.3 React Hook Form Patterns

#### Controller Integration
- **Documentation:** https://react-hook-form.com/docs/usecontroller
- **Key Pattern:**
  - Input components must use `forwardRef`
  - Ref must reach actual DOM element
  - Destructure `field`, `fieldState`, `formState` from render prop

#### useWatch API
- **Documentation:** https://react-hook-form.com/docs/usewatch
- **Key Pattern:**
  - Creates isolated field subscriptions
  - Only re-renders when watched fields change
  - Array form returns array, single form returns single value

#### getFieldState
- **Documentation:** https://react-hook-form.com/docs/useform/getfieldstate
- **Key Pattern:**
  - Non-reactive field metadata access
  - Returns `isTouched`, `isDirty`, `invalid`, `error`
  - Does NOT include `disabled` property

### 6.4 Open Source Examples

#### react-use
- **Repository:** https://github.com/streamich/react-use
- **Examples of:**
  - Hooks with options objects
  - Multiple signature support
  - Extensive parameter validation
  - Union type parameters

#### @tanstack/react-query
- **Repository:** https://github.com/TanStack/query
- **Examples of:**
  - Generic hooks with type parameters
  - Options object pattern
  - Conditional fetching with `enabled` parameter
  - Union types for mutation/query options

#### react-hook-form
- **Repository:** https://github.com/react-hook-form/react-hook-form
- **Examples of:**
  - Controller props merging
  - Field state types
  - Generic form state types
  - Union types for validation rules

---

## 7. Implementation Patterns

### 7.1 Pattern: Extensible Hook Template

```typescript
/**
 * Extensible hook template
 *
 * Follow this pattern when creating hooks that need to evolve:
 * 1. Use options object interface
 * 2. Make new properties optional
 * 3. Provide sensible defaults
 * 4. Document all properties
 * 5. Export the interface for reuse
 */

// Step 1: Define options interface
interface UseMyHookOptions {
  // Required parameters (no default)
  required: string;

  // Optional parameters with default values
  optional?: number;
  flag?: boolean;

  // Union type parameters
  mode?: 'light' | 'dark' | 'auto';

  // Polymorphic parameters
  transform?: string | ((value: unknown) => unknown);

  // NEW: Backward-compatible additions go here
  newFeature?: boolean;
}

// Step 2: Define return type
interface UseMyHookResult {
  value: string;
  update: (newValue: string) => void;
  reset: () => void;
}

// Step 3: Implement hook with defaults
function useMyHook(options: UseMyHookOptions): UseMyHookResult {
  // Destructure with defaults
  const {
    required,
    optional = 42,
    flag = false,
    mode = 'auto',
    transform,
    newFeature = false,
  } = options;

  // Implementation...

  return {
    value: required,
    update: () => {},
    reset: () => {},
  };
}

// Step 4: Export for reuse
export type { UseMyHookOptions, UseMyHookResult };
export { useMyHook };
```

### 7.2 Pattern: Backward Compatibility Migration

```typescript
// Version 1.0 - Original signature
function useMyHook(required: string, optional?: number) {
  // Implementation
}

// Version 2.0 - Add options object support
interface UseMyHookOptions {
  required: string;
  optional?: number;
  newFeature?: boolean;
}

function useMyHook(
  input: string | UseMyHookOptions,
  optional?: number
) {
  // Support both old and new signatures
  const options: UseMyHookOptions =
    typeof input === 'string'
      ? { required: input, optional }
      : input;

  // Implementation with options
  const { required, optional: opt = 0, newFeature = false } = options;

  // ...
}

// Version 3.0 - Deprecate old signature
function useMyHook(
  input: string | UseMyHookOptions,
  optional?: number
) {
  // Show deprecation warning for old signature
  if (typeof input === 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'useMyHook: Passing separate parameters is deprecated. ' +
        'Use options object instead: useMyHook({ required: "...", optional: 42 })'
      );
    }
  }

  const options: UseMyHookOptions =
    typeof input === 'string'
      ? { required: input, optional }
      : input;

  // Implementation
}

// All versions work:
useMyHook('value');                    // V1.0
useMyHook('value', 42);                // V1.0
useMyHook({ required: 'value' });      // V2.0
useMyHook({ required: 'value', optional: 42, newFeature: true }); // V3.0
```

### 7.3 Pattern: Type-Safe Props Merging

```typescript
/**
 * Type-safe props merging with priority
 *
 * This pattern ensures type safety while merging
 * multiple prop sources with clear priority.
 */

// Define each layer type
interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

interface InputProps {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

interface FieldProps {
  name?: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  error?: string;
}

interface OverrideProps {
  // Allow any additional props
  [key: string]: unknown;
}

// Merge function with priority
function mergeProps(
  base: BaseProps,
  input: InputProps,
  field: FieldProps,
  override: OverrideProps
): Record<string, unknown> {
  return {
    // Lowest priority: base
    ...base,
    // Medium priority: input
    ...input,
    // High priority: field
    ...field,
    // Highest priority: override (wins)
    ...override,
  };
}

// Usage
const finalProps = mergeProps(
  { className: 'base', style: { color: 'red' } },
  { type: 'text', placeholder: 'Enter value' },
  { name: 'email', value: '', onChange: () => {} },
  { className: 'override', disabled: true }
);

// Result:
// {
//   className: 'override',  // from override (highest priority)
//   style: { color: 'red' }, // from base
//   type: 'text',            // from input
//   placeholder: 'Enter value', // from input
//   name: 'email',           // from field
//   value: '',               // from field
//   onChange: () => {},      // from field
//   disabled: true           // from override
// }
```

### 7.4 Pattern: Polymorphic Hook Parameters

```typescript
/**
 * Hook that accepts multiple parameter forms
 *
 * This pattern allows hooks to accept:
 * - Simple values (string, number)
 * - Functions
 * - Objects with nested values
 * - Arrays of values
 */

// Define polymorphic input type
type PolymorphicInput<T> =
  | T                                          // Direct value
  | (() => T)                                  // Function
  | { value: T }                               // Object wrapper
  | Array<T | (() => T) | { value: T }>;       // Array

// Hook implementation
function usePolymorphic<T>(input: PolymorphicInput<T>): T {
  // Resolve based on type
  if (typeof input === 'function') {
    // Function form
    return (input as () => T)();
  } else if (Array.isArray(input)) {
    // Array form - return first element
    const first = input[0];
    return typeof first === 'function' ? first() :
           typeof first === 'object' ? first.value : first;
  } else if (typeof input === 'object' && input !== null) {
    // Object wrapper form
    return (input as { value: T }).value;
  } else {
    // Direct value
    return input;
  }
}

// All valid:
usePolymorphic('hello');                                    // Direct value
usePolymorphic(() => 'hello');                              // Function
usePolymorphic({ value: 'hello' });                         // Object
usePolymorphic(['hello', () => 'world', { value: '!' }]);   // Array
```

---

## 8. Key Takeaways

### 8.1 Extending Hook Signatures

1. **Use options object pattern** - Most flexible and maintainable
2. **Add optional properties** - Backward compatible by default
3. **Provide sensible defaults** - Clear expected behavior
4. **Document all parameters** - JSDoc with examples
5. **Export interfaces** - Allow external reuse

### 8.2 Maintaining Backward Compatibility

1. **Never remove required parameters** - Breaking change
2. **Add new optional properties** - Non-breaking
3. **Use union types** - Support multiple call patterns
4. **Function overloads** - Multiple signatures, one implementation
5. **Deprecation warnings** - Guide users to new patterns

### 8.3 TypeScript Union Types

1. **Discriminated unions** - Type-safe mutually exclusive options
2. **Polymorphic types** - Accept multiple value forms
3. **Recursive types** - Support nested structures
4. **Generic constraints** - Ensure type-safe parameters
5. **Conditional types** - Change return type based on input

### 8.4 Props Merging Priority

1. **Define clear layers** - Document priority order
2. **Static vs dynamic** - Separate for performance
3. **Deep merge objects** - Preserve nested structure
4. **Override primitive values** - Last value wins
5. **Test merge behavior** - Comprehensive test coverage

### 8.5 Formality-Specific Patterns

1. **8-layer props merging** - Provider → Form → Input → Field → Component
2. **SelectValue polymorphism** - String | Function | Object | Array
3. **Condition evaluation** - when/selectWhen triggers
4. **Field state proxy** - Dual access pattern (value + metadata)
5. **Isolated subscriptions** - useWatch for performance

---

## 9. Recommended Resources

### Official Documentation
- **React Hooks:** https://react.dev/reference/react
- **React forwardRef:** https://react.dev/reference/react/forwardRef
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
- **React Hook Form:** https://react-hook-form.com

### Open Source Examples
- **react-use:** https://github.com/streamich/react-use
- **@tanstack/react-query:** https://github.com/TanStack/query
- **react-hook-form:** https://github.com/react-hook-form/react-hook-form

### Community Resources
- **React Patterns:** https://reactpatterns.com
- **TypeScript React Starter:** https://github.com/Microsoft/TypeScript-React-Starter
- **React TypeScript Cheatsheet:** https://react-typescript-cheatsheet.netlify.app

---

## 10. Conclusion

This research document has documented comprehensive React hook parameter patterns and best practices, with specific focus on:

1. **Extending hook signatures** - Options object pattern, function overloads, union types
2. **Backward compatibility** - Optional properties, deprecation strategies, migration paths
3. **TypeScript patterns** - Union types, discriminated unions, generic constraints
4. **Props merging** - Priority-based override systems, deep merge strategies

### Key Principles

1. **Options objects over positional parameters** - More flexible and maintainable
2. **Optional properties for extensibility** - Add features without breaking changes
3. **Union types for polymorphism** - Support multiple value forms
4. **Clear priority in merging** - Document and test override behavior
5. **Type safety through TypeScript** - Catch errors at compile time

### Formality Strengths

The Formality codebase demonstrates excellent adherence to these principles:

- **Clean interfaces** - Well-documented hook options
- **Flexible types** - SelectValue polymorphism
- **Predictable merging** - 8-layer priority system
- **Type safety** - Comprehensive TypeScript usage
- **Backward compatibility** - Extensible configuration patterns

---

**Document Status:** Complete
**Last Updated:** 2026-01-11
**Maintainer:** Formality Project Team

**Note:** This document is based on codebase analysis and established best practices. External web research was unavailable due to API limitations, but the patterns documented here represent well-established React and TypeScript community standards.
