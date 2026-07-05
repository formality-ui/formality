# External Dependencies Research Report

## Formality Project - Comprehensive Library Analysis

**Document Version:** 1.0
**Research Date:** 2026-01-11
**Status:** Complete Analysis Based on Codebase + Existing Documentation

---

## Executive Summary

This report provides comprehensive research on external dependencies used in the Formality project, covering React Hook Form integration, expression engine architecture, debouncing strategies, React patterns, and testing infrastructure. The analysis is based on existing documentation in the codebase and source code examination due to external API limitations.

**Key Findings:**

- React Hook Form's `getFieldState()` does **NOT** include a `disabled` property
- Formality uses a custom expression engine built on `jsep` with sandboxed evaluation
- Debounce coordination requires careful async validation handling
- All input components require `forwardRef` for Controller integration
- Testing patterns follow React Testing Library best practices

---

## Table of Contents

1. [React Hook Form](#1-react-hook-form)
2. [Expression Engine](#2-expression-engine)
3. [Debounce Implementation](#3-debounce-implementation)
4. [React Patterns](#4-react-patterns)
5. [Testing Infrastructure](#5-testing-infrastructure)
6. [Integration Patterns](#6-integration-patterns)
7. [Limitations and Workarounds](#7-limitations-and-workarounds)
8. [Best Practices Summary](#8-best-practices-summary)

---

## 1. React Hook Form

### 1.1 Library Information

**Package:** `react-hook-form`
**Version:** `^7.0.0` (peer dependency), `^7.50.0` (dev dependency)
**License:** MIT
**Type:** Form state management library
**Documentation:** https://react-hook-form.com

### 1.2 `getFieldState()` Method

#### **CRITICAL FINDING: No `disabled` Property**

The `getFieldState()` method returns field state **without** the `disabled` property. This is a key limitation that affects Formality's architecture.

**Signature:**

```typescript
methods.getFieldState(
  fieldName: FieldPath<TFieldValues>,
  formState?: UseFormStateReturn<TFieldValues>
): FieldState
```

**Return Type:**

```typescript
interface FieldState {
  isTouched: boolean; // Field has been focused and blurred
  isDirty: boolean; // Field value has changed from default
  invalid: boolean; // Field has validation error
  error?: FieldError; // Validation error details
  // NOTE: disabled is NOT included
}
```

#### Usage in Formality

**Location:** `/packages/react/src/hooks/useConditions.ts` (lines 106-107)

```typescript
// getFieldState() reads current state without creating subscriptions
const fieldState = methods.getFieldState(fieldName as any);
states[fieldName] = {
  value: fieldValues[fieldName],
  isTouched: fieldState.isTouched,
  isDirty: fieldState.isDirty,
  error: fieldState.error,
  invalid: fieldState.invalid,
  isValidating: false, // Not easily available per-field
  // disabled is added from condition evaluation, not RHF
};
```

#### Why This Matters

1. **Non-Reactive Access:** `getFieldState()` provides field metadata without creating React subscriptions
2. **Performance:** Prevents unnecessary re-renders when checking field validity in conditions
3. **Disabled State Gap:** The `disabled` property must come from elsewhere (condition evaluation)

### 1.3 `useWatch` API

#### Purpose

Create **isolated field subscriptions** - components only re-render when specifically watched fields change.

#### Signature

```typescript
useWatch<TFieldValues extends FieldValues>(
  props: {
    name: string | string[];  // Field name(s) to watch
    control?: Control<TFieldValues>;  // Form control object
    disabled?: boolean;  // Optional: disable subscription
  }
): TFieldValues[keyof TFieldValues] | TFieldValues[keyof TFieldValues][]
```

#### Critical Behavior

**Single Field:**

```typescript
const value = useWatch({ name: "email" });
// Returns: string | undefined (single value)
```

**Multiple Fields:**

```typescript
const values = useWatch({ name: ["email", "name"] });
// Returns: [string, string] (ALWAYS an array)
```

**Usage in Formality**

**Location:** `/packages/react/src/hooks/useConditions.ts` (lines 66-92)

```typescript
// Watch inferred fields (only subscribe if there are fields to watch)
// CRITICAL: useWatch provides ISOLATED subscriptions
const watchedValues = useWatch({
  control: methods.control,
  name: watchFields.length > 0 ? (watchFields as any) : [],
});

// Build field values map from watched values
const fieldValues = useMemo(() => {
  const values: Record<string, unknown> = {};

  if (watchFields.length === 0) {
    return values;
  }

  // CRITICAL: useWatch with an array of names ALWAYS returns an array
  if (Array.isArray(watchedValues)) {
    watchFields.forEach((field, i) => {
      values[field] = watchedValues[i];
    });
  } else {
    // Fallback: single field, single value
    values[watchFields[0]] = watchedValues;
  }

  return values;
}, [watchFields, watchedValues]);
```

#### Performance Benefits

1. **Isolated Re-renders:** Only components using `useWatch` re-render when watched fields change
2. **Prevents Propagation:** Changes to unrelated fields don't trigger re-renders
3. **Explicit Dependencies:** Forces developers to declare which fields they need

### 1.4 `Controller` Component

#### Purpose

Integrates custom input components with React Hook Form, handling registration, validation, and value updates.

#### Signature

```typescript
<Controller
  control={Control<TFieldValues>>
  name: FieldPath<TFieldValues>
  rules?: RegisterOptions
  shouldUnregister?: boolean
  render={({
    field: {
      onChange: (value: any) => void,
      onBlur: () => void,
      value: any,
      name: string,
      ref: Ref
    },
    fieldState: {
      invalid: boolean,
      isTouched: boolean,
      isDirty: boolean,
      error?: FieldError
    },
    formState: UseFormStateReturn<TFieldValues>
  }) => ReactNode}
/>
```

#### `forwardRef` Requirement

**CRITICAL:** Input components MUST use `forwardRef` to receive the ref from Controller.

**Correct Pattern:**

```typescript
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref}  // Forward ref to DOM element
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  )
);
TestInput.displayName = "TestInput";
```

**Why Required:**

- Controller passes `ref` in the `field` object
- Without `forwardRef`, React warns: "Function components cannot be given refs"
- Ref must reach actual DOM element for focus/select operations

#### Usage in Formality

**Location:** `/packages/react/src/components/Field.tsx` (lines 380-453)

```typescript
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

    // Merge props (8 layers)
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
        ref: field.ref,  // Forward ref to input component
      },
    });

    const Component = inputConfig.component as React.ComponentType<any>;
    return <Component {...finalProps} />;
  }}
/>
```

### 1.5 Custom Field Implementations

#### Pattern for Custom Inputs

**Location:** Test files demonstrate the pattern

**File:** `/packages/react/src/__tests__/Field.test.tsx` (lines 22-39)

```typescript
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
  [key: string]: unknown;  // Critical: accept spread props
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}  // Forward ref
        data-testid={name}
        value={value ?? ""}  // Nullish coalescing for safety
        onChange={(e) => onChange?.(e.target.value)}  // Optional chaining
        disabled={disabled}
        {...props}  // Spread remaining props
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);

TestInput.displayName = "TestInput";  // Required for debugging
```

#### Best Practices

1. **Always use `forwardRef`** for components that receive ref from Controller
2. **Use index signature** `[key: string]: unknown` to accept spread props
3. **Use optional chaining** `onChange?.()` for callbacks that may be undefined
4. **Use nullish coalescing** `value ?? ""` for default values
5. **Set `displayName`** for better debugging in React DevTools
6. **Type parameters correctly:** `forwardRef<HTMLElementType, PropsType>`

---

## 2. Expression Engine

### 2.1 Library Information

**Primary Parser:** `jsep` (JavaScript Expression Parser)
**Version:** `^1.4.0`
**Purpose:** Parse expression strings into AST (Abstract Syntax Tree)
**License:** MIT
**GitHub:** https://github.com/EricSmekens/jsep

**Secondary (Unused):** `jse-eval`
**Version:** `^1.5.2`
**Status:** Included in dependencies but **not used** - Formality has custom evaluator

### 2.2 Custom Expression Architecture

Formality implements a **custom expression engine** built on top of `jsep` for security and control.

#### Evaluation Pipeline

**Flow:**

```
String Expression → jsep.parse() → AST → evaluateNode() → Result
```

**Implementation:** `/packages/core/src/expression/evaluate.ts`

```typescript
import jsep from "jsep";

// Parse and cache expression ASTs
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

export function evaluate(expr: string, context: EvaluationContext): unknown {
  try {
    const ast = parseExpression(expr);
    const result = evaluateNode(ast, context);
    const unwrapped = unwrapFieldProxy(result);
    return unwrapped;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Expression evaluation error for "${expr}":`, error);
    }
    return undefined;
  }
}
```

### 2.3 Security Constraints

#### Sandboxing Approach

**1. No Function Calls**

```typescript
case "CallExpression": {
  // We don't allow function calls for security
  throw new Error("Function calls are not allowed in expressions");
}
```

**2. Safe Evaluation Context**

- Only whitelisted properties are accessible
- No `eval()` or `Function` constructor
- No access to global objects (window, document, etc.)

**3. Error Handling**

- Errors caught and logged in development
- Returns `undefined` on errors in production
- Graceful degradation

#### Supported Operators

**Logical (with short-circuit evaluation):**

- `&&` - AND (short-circuits on falsy)
- `||` - OR (short-circuits on truthy)
- `??` - Nullish coalescing (short-circuits on non-null)

**Comparison:**

- `===`, `!==` - Strict equality
- `==`, `!=` - Loose equality
- `<`, `>`, `<=`, `>=` - Ordering

**Arithmetic:**

- `+`, `-`, `*`, `/`, `%`

**Unary:**

- `!` - NOT
- `-`, `+` - Negation/plus
- `typeof` - Type check

**Ternary:**

- `condition ? consequent : alternate`

**Member Access:**

- `obj.prop` - Dot notation
- `obj[prop]` - Bracket notation

### 2.4 Field State Proxy Pattern

#### Purpose

Enables both **value access** and **metadata access** in expressions using the same field reference.

**Implementation:** `/packages/core/src/expression/context.ts`

```typescript
const FIELD_STATE_PROPERTIES = new Set([
  "value",
  "isTouched",
  "isDirty",
  "isValidating",
  "error",
  "invalid",
  "disabled", // Formality-added property
]);

export function createFieldStateProxy(
  fieldState: FieldState | { value: unknown },
): unknown {
  const proxy = new Proxy(fieldState as object, {
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

  return proxy;
}
```

#### Usage Examples

```typescript
// Field state with proxy
const fieldState = {
  value: { id: 5, name: "Acme" },
  isTouched: true,
  isDirty: false,
};
const proxy = createFieldStateProxy(fieldState);

// In expressions:
evaluate("client.id", { client: proxy }); // → 5 (delegates to value.id)
evaluate("client.isTouched", { client: proxy }); // → true (accesses fieldState.isTouched)
evaluate("client", { client: proxy }); // → { id: 5, name: 'Acme' } (coerces to value)
evaluate("client && signed", { client: proxy, signed: proxy });
// → true (short-circuits with unwrapped values)
```

### 2.5 Caching Strategy

#### AST Cache

**Implementation:** `/packages/core/src/expression/evaluate.ts` (lines 223-234)

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
```

#### Benefits

1. **Performance:** Parsed ASTs are reused across evaluations
2. **Memory:** Shared AST references reduce memory footprint
3. **Consistency:** Same expression always produces same AST structure

#### Cache Management

```typescript
export function clearExpressionCache(): void {
  astCache.clear();
}
```

**Usage:** Call in tests for isolation

### 2.6 Field Dependency Inference

#### Purpose

Automatically extract field names from expressions to establish subscriptions.

**Implementation:** `/packages/core/src/expression/infer.ts`

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

#### Examples

```typescript
inferFieldsFromExpression("client.id"); // → ["client"]
inferFieldsFromExpression("client && signed"); // → ["client", "signed"]
inferFieldsFromExpression("record.name"); // → [] (qualified path)
inferFieldsFromExpression("true && false"); // → [] (keywords)
inferFieldsFromExpression("fields === null"); // → ["fields"] (not followed by dot)
```

---

## 3. Debounce Implementation

### 3.1 Library Information

**Package:** `lodash-es`
**Version:** `^4.17.21`
**Module:** ES modules version of Lodash
**Purpose:** Utility functions (debounce, etc.)
**License:** MIT
**Import:** `import { debounce } from "lodash-es"`

### 3.2 Lodash Debounce API

#### Signature

```typescript
debounce<T extends (...args: any[]) => any>(
  func: T,
  wait?: number,
  options?: {
    leading?: boolean;  // Execute on first call
    trailing?: boolean; // Execute after wait
    maxWait?: number;   // Maximum delay
  }
): T & {
  cancel(): void;      // Cancel pending execution
  flush(): void;       // Execute immediately
  pending(): boolean;  // Check if pending
}
```

#### Default Behavior

- **Wait:** `0` ms (if not specified)
- **Leading:** `false` (don't execute on first call)
- **Trailing:** `true` (execute after delay)

### 3.3 `wait: 0` Support

**Finding:** Lodash debounce **supports** `wait: 0` for immediate execution.

**Behavior with `wait: 0`:**

```typescript
const debouncedFn = debounce(() => {
  console.log("Executed");
}, 0);

debouncedFn(); // Executes immediately (next tick)
```

**Use Case:** Batching operations within the same React render cycle.

### 3.4 Formality's Debounce Implementation

#### Configuration Levels

**1. Form-level (default: 1000ms)**

```typescript
<Form autoSave debounce={2000}>
```

**2. Field-level override**

```typescript
textField: {
  debounce: 2000,  // Wait 2 seconds
}
switch: {
  debounce: false, // Immediate (no debounce)
}
```

#### Implementation

**Location:** `/packages/react/src/components/Form.tsx`

```typescript
useEffect(() => {
  const debouncedFn = debounce(() => {
    executeAutoSave();
  }, debounceMs);

  // Attach lodash-style methods
  const fn = Object.assign(debouncedFn, {
    pending: () => false,
  }) as DebouncedFunction;

  debouncedSubmitRef.current = fn;

  return () => {
    debouncedFn.cancel(); // Cleanup on unmount
  };
}, [executeAutoSave, debounceMs]);

const debouncedSubmit = useCallback(() => {
  debouncedSubmitRef.current?.();
}, []);

const submitImmediate = useCallback(() => {
  debouncedSubmitRef.current?.flush(); // Execute immediately
}, []);
```

### 3.5 Auto-Save Coordination

#### Challenge

Avoid submitting while field validation is in progress.

#### Solution: Execution Versioning

```typescript
const executeAutoSave = useCallback(async () => {
  // Capture and increment execution version
  executionVersionRef.current++;
  const executionVersion = executionVersionRef.current;

  // Copy and clear pending fields
  const changedFields = new Set(pendingChangedFields.current);
  pendingChangedFields.current.clear();

  // Wait for validations to complete
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

  // Check if changed fields have errors
  for (const fieldName of changedFields) {
    const fieldState = methods.getFieldState(fieldName as any);
    if (fieldState.error) {
      return; // Don't submit if validation failed
    }
  }

  // All validations passed, submit
  const values = methods.getValues();
  await handleSubmit(values as TFieldValues);
}, [methods, handleSubmit, waitForFieldValidation]);
```

### 3.6 Debounce Strategies and Trade-offs

#### Strategy 1: Standard Debounce

**Use Case:** Text fields where user types continuously

```typescript
const debouncedSave = debounce(() => save(), 1000);

// User types "h" (starts timer)
// User types "e" (resets timer)
// User types "l" (resets timer)
// User types "l" (resets timer)
// User types "o" (resets timer)
// User stops typing
// 1 second later: save() (only once)
```

**Trade-offs:**

- ✅ Reduces save operations
- ✅ Better UX for typing
- ❌ Delayed feedback

#### Strategy 2: Immediate Execution (`debounce: false`)

**Use Case:** Switches, toggles, buttons

```typescript
// Check inputConfig.debounce === false
if (inputConfig.debounce === false) {
  submitImmediate(); // Execute immediately
} else {
  debouncedSubmit(); // Use debounce
}
```

**Trade-offs:**

- ✅ Instant feedback
- ✅ No delay
- ❌ More save operations

#### Strategy 3: Coordinated with Validation

**Use Case:** Fields with async validation

```typescript
// Use execution version to detect stale operations
executionVersionRef.current++;
const version = executionVersionRef.current;

// ... async validation ...

if (executionVersionRef.current !== version) {
  return; // New changes came in, abort
}
```

**Trade-offs:**

- ✅ Prevents stale saves
- ✅ Waits for validation
- ❌ More complex logic
- ❌ Potential for abandoned validations

---

## 4. React Patterns

### 4.1 Version Information

**React:** `^18.0.0` (peer dependency), `^18.2.0` (dev dependency)
**ReactDOM:** `^18.0.0` (peer dependency), `^18.2.0` (dev dependency)

### 4.2 forwardRef Patterns

#### Basic Pattern

```typescript
import { forwardRef } from "react";

interface Props {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown;
}

const Component = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref}  // Forward ref to DOM element
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  )
);

Component.displayName = "Component";  // Required for DevTools
```

#### Why Required

1. **React Hook Form Controller** passes `ref` in render prop
2. **Focus management** requires ref to reach DOM element
3. **Avoids warnings** without `forwardRef`: "Function components cannot be given refs"

#### TypeScript Type Order

**CORRECT:**

```typescript
forwardRef<HTMLInputElement, Props>;
// Element type FIRST, then Props
```

**WRONG:**

```typescript
forwardRef<Props, HTMLInputElement>;
// Props first, then Element (incorrect)
```

#### displayName Best Practices

**Pattern 1: Named Function Expression**

```typescript
const MyComponent = forwardRef(function MyComponent(props, ref) {
  return <div ref={ref}>{props.children}</div>;
});
```

**Pattern 2: Anonymous Function + displayName Property**

```typescript
const MyComponent = forwardRef((props, ref) => {
  return <div ref={ref}>{props.children}</div>;
});

MyComponent.displayName = "MyComponent";
```

**Pattern 3: With HOCs**

```typescript
function logProps(Component) {
  const LoggedComponent = forwardRef((props, ref) => (
    <LogWrapper>
      <Component ref={ref} {...props} />
    </LogWrapper>
  ));

  const name = Component.displayName || Component.name;
  LoggedComponent.displayName = `logProps(${name})`;

  return LoggedComponent;
}
```

### 4.3 Hook Consistency Patterns

#### Rule: Hooks in Same Order

**CRITICAL:** All custom hooks must call React hooks in the same order on every render.

**Correct Pattern:**

```typescript
export function useConditions(options: UseConditionsOptions) {
  // Always called first
  const { record, methods } = useFormContext();

  // Always called second
  const watchFields = useInferredInputs({ conditions, subscribesTo });

  // Always called third
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields,
  });

  // Always called fourth
  const fieldValues = useMemo(() => {
    /* ... */
  }, [watchFields, watchedValues]);

  // Always called fifth
  const fieldStates = useMemo(() => {
    /* ... */
  }, [watchFields, fieldValues, methods]);

  // Always called last
  return useMemo(() => {
    /* ... */
  }, [conditions, fieldValues, fieldStates]);
}
```

#### Avoiding Circular Dependencies

**Problem:** Hook A depends on Hook B, Hook B depends on Hook A

**Solution:**

1. Extract shared state to context
2. Use refs for non-reactive values
3. Pass dependencies as parameters

**Example from Formality:**

```typescript
// useConditions uses useFormContext
export function useConditions(options: UseConditionsOptions) {
  const { record, methods } = useFormContext();
  // ...
}

// useFormState uses useRHFFormContext directly
export function useFormState(options: UseFormStateOptions) {
  const rhfContext = useRHFFormContext();
  // ...
}
```

### 4.4 Proxy State Pattern

#### Purpose

Reduce unnecessary re-renders in condition-heavy forms through lazy property access.

**Implementation:** `/packages/react/src/utils/makeProxyState.ts`

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

#### Benefits

1. **Lazy Property Access:** Only accessed properties create React dependencies
2. **Reduced Re-renders:** Changing one property doesn't trigger re-renders for all
3. **Expression Optimization:** Expressions only subscribe to used properties

#### Performance Impact

**Without Proxy:**

```typescript
// Accessing fieldState.value creates dependency on entire fieldState
const value = fieldState.value;
// Any change to fieldState triggers re-render
```

**With Proxy:**

```typescript
// Accessing proxyState.value only creates dependency on value
const value = proxyState.value;
// Only changes to value trigger re-render
```

---

## 5. Testing Infrastructure

### 5.1 Framework Information

**Vitest:** `^2.0.0`
**Testing Library:** `@testing-library/react` `^14.0.0`
**User Event:** `@testing-library/user-event` `^14.5.2`
**Test Environment:** jsdom `^24.0.0`
**Coverage:** `@vitest/coverage-v8` `^2.0.0`

### 5.2 Testing Patterns

#### Test Component Pattern

**All test components must use `forwardRef`:**

**File:** `/packages/react/src/__tests__/autosave-validation.test.tsx` (lines 27-66)

```typescript
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  ),
);
TestInput.displayName = "TestInput";
```

#### Testing React Hook Form Integration

**Pattern 1: Test Field State**

```typescript
it("should update field value on change", async () => {
  render(
    <Form config={{ name: { type: "textField" } }}>
      <Field name="name" />
    </Form>
  );

  const input = screen.getByTestId("name");
  await userEvent.type(input, "John");

  expect(input).toHaveValue("John");
});
```

**Pattern 2: Test Validation**

```typescript
it("should show validation error", async () => {
  const validator = async () => "Required";

  render(
    <Form config={{ name: { type: "textField", validator } }}>
      <Field name="name" />
    </Form>
  );

  const input = screen.getByTestId("name");
  await userEvent.type(input, "a");
  await userEvent.clear(input);

  await waitFor(() => {
    expect(screen.getByTestId("name-error")).toHaveTextContent("Required");
  });
});
```

**Pattern 3: Test Conditions**

```typescript
it("should disable field when condition is met", async () => {
  render(
    <Form
      config={{
        toggle: { type: "switch" },
        name: {
          type: "textField",
          conditions: [{ when: "toggle", is: true, disabled: true }],
        },
      }}
    >
      <Field name="toggle" />
      <Field name="name" />
    </Form>
  );

  const toggle = screen.getByTestId("toggle");
  const nameInput = screen.getByTestId("name");

  expect(nameInput).not.toBeDisabled();

  await userEvent.click(toggle);

  await waitFor(() => {
    expect(nameInput).toBeDisabled();
  });
});
```

#### Testing Debounce

**Using Fake Timers:**

```typescript
describe("AutoSave Debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce rapid changes", async () => {
    const submitHandler = vi.fn();

    render(
      <Form
        config={{ name: { type: "textField" } }}
        onSubmit={submitHandler}
        autoSave
        debounce={500}
      >
        <Field name="name" />
      </Form>
    );

    const input = screen.getByTestId("name");

    // Type multiple characters rapidly
    await act(async () => {
      await userEvent.type(input, "hello", { delay: null });
    });

    // Advance past debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // Should only submit once with final value
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ name: "hello" })
    );
  });
});
```

### 5.3 Best Practices

1. **Always use `data-testid`** for test selectors
2. **Use `forwardRef`** in test components
3. **Set `displayName`** for component identification
4. **Use optional chaining** for callbacks: `onChange?.()`
5. **Use nullish coalescing** for defaults: `value ?? ""`
6. **Fake timers** for debounce testing
7. **Use `act()`** for state updates
8. **Use `waitFor()`** for async assertions
9. **Clean up** in `beforeEach` and `afterEach`
10. **Clear expression cache** in expression tests: `clearExpressionCache()`

---

## 6. Integration Patterns

### 6.1 React Hook Form Integration

#### Pattern 1: Non-Reactive Field State Access

**Use `getFieldState` when you need field metadata without re-renders:**

```typescript
const fieldState = methods.getFieldState(fieldName);
// Returns: { isTouched, isDirty, invalid, error }
// Does NOT trigger re-render
```

**Benefits:**

- Access field validity in conditions
- Check if field is dirty before submitting
- Get error messages without subscriptions

#### Pattern 2: Isolated Field Subscriptions

**Use `useWatch` for specific field value subscriptions:**

```typescript
const values = useWatch({ name: ["field1", "field2"] });
// Only re-renders when field1 or field2 changes
```

**Benefits:**

- Prevents re-renders of unrelated fields
- Explicit dependency declaration
- Better performance for large forms

#### Pattern 3: Disabled State from Conditions

**Disabled state is NOT from RHF, but from condition evaluation:**

```typescript
// In condition evaluation
const fieldStates = {
  fieldName: {
    value: "...",
    isTouched: true,
    isDirty: false,
    disabled: true, // Added by Formality from conditions
  },
};

// In Field component
const isDisabled = useMemo(() => {
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
```

**Benefits:**

- Flexible disabled state resolution
- Multiple sources of disabled state
- Clear priority order

### 6.2 Expression Engine Integration

#### Pattern 1: Expression Context Building

**Always use dual context mapping for expressions:**

```typescript
const context = buildEvaluationContext(
  fieldValues,
  record,
  props,
  fieldStates, // Includes disabled, isTouched, etc.
);
```

**Benefits:**

- Both qualified and unqualified access
- Explicit data sources
- Type-safe context

#### Pattern 2: Field Dependency Inference

**Automatically extract field names from expressions:**

```typescript
const fields = inferFieldsFromExpression("client.id && signed");
// Returns: ["client", "signed"]

// Use with useWatch
const values = useWatch({ name: fields });
```

**Benefits:**

- Automatic subscriptions
- No manual dependency tracking
- Expressions drive re-renders

### 6.3 Debounce Integration

#### Pattern 1: Debounce with Async Coordination

**Use execution versioning to detect stale operations:**

```typescript
executionVersionRef.current++;
const version = executionVersionRef.current;

// ... async operations ...

if (executionVersionRef.current !== version) {
  return; // New changes came in, abort
}
```

**Benefits:**

- Prevents stale saves
- Handles rapid changes
- Coordinates with validation

---

## 7. Limitations and Workarounds

### 7.1 React Hook Form Limitations

#### Limitation 1: No `disabled` in `getFieldState`

**Problem:**

```typescript
const fieldState = methods.getFieldState(fieldName);
// fieldState.disabled is undefined
```

**Workaround:**

```typescript
// Formality adds disabled from condition evaluation
const fieldStates = {
  fieldName: {
    value: fieldValues[fieldName],
    isTouched: fieldState.isTouched,
    isDirty: fieldState.isDirty,
    error: fieldState.error,
    invalid: fieldState.invalid,
    disabled: conditionResult.disabled ?? false, // Added by Formality
  },
};
```

#### Limitation 2: `useWatch` Array Return

**Problem:**

```typescript
const values = useWatch({ name: ["field1", "field2"] });
// values is ALWAYS an array, even with one field
```

**Workaround:**

```typescript
const fieldValues = useMemo(() => {
  const values: Record<string, unknown> = {};

  if (Array.isArray(watchedValues)) {
    watchFields.forEach((field, i) => {
      values[field] = watchedValues[i];
    });
  } else {
    values[watchFields[0]] = watchedValues;
  }

  return values;
}, [watchFields, watchedValues]);
```

### 7.2 Expression Engine Limitations

#### Limitation 1: No Function Calls

**Problem:**

```typescript
evaluate("Math.max(1, 2)", {}); // Throws error
```

**Workaround:**

```typescript
// Use functions in selectProps instead
config: {
  field: {
    selectProps: {
      max: (ctx) => Math.max(ctx.a, ctx.b);
    }
  }
}
```

#### Limitation 2: Cannot Analyze Function Bodies

**Problem:**

```typescript
inferFieldsFromDescriptor(() => {
  // Cannot extract field names from function body
  return someGlobalVariable;
});
// Returns: []
```

**Workaround:**

```typescript
// Explicitly declare dependencies
config: {
  field: {
    subscribesTo: ['someGlobalVariable'],
    selectProps: () => {
      return someGlobalVariable;
    }
  }
}
```

### 7.3 Debounce Limitations

#### Limitation 1: Coordinating with Async Validation

**Problem:**

```typescript
// Validation is async, but debounce timer doesn't wait
const debouncedSave = debounce(() => {
  save(); // Might save before validation completes
}, 1000);
```

**Workaround:**

```typescript
// Use execution versioning
const executeAutoSave = async () => {
  executionVersionRef.current++;
  const version = executionVersionRef.current;

  await waitForFieldValidation(fieldsToWaitFor, version);

  if (executionVersionRef.current !== version) {
    return; // New changes came in, abort
  }

  save();
};
```

#### Limitation 2: `debounce: false` Implementation

**Problem:**

```typescript
// How to implement debounce: false with debounce function?
```

**Workaround:**

```typescript
// Check debounce config before calling debounced function
const handleSubmit = () => {
  if (inputConfig.debounce === false) {
    submitImmediate(); // Flush debounced function
  } else {
    debouncedSubmit(); // Use debounce
  }
};
```

---

## 8. Best Practices Summary

### 8.1 React Hook Form

1. **Use `getFieldState` for non-reactive field metadata access**
   - Accesses `isTouched`, `isDirty`, `error`, `invalid` without subscriptions
   - Does NOT trigger re-renders when field state changes
   - Perfect for condition evaluation that checks field validity

2. **Use `useWatch` for isolated field value subscriptions**
   - Only re-renders when specifically watched fields change
   - Prevents "subscribe to everything" anti-pattern
   - Array form: `useWatch({ name: ['field1', 'field2'] })` returns array

3. **NEVER access `methods.formState` directly in render paths**
   - Creates subscription to entire form state
   - Causes all fields to re-validate on any change
   - Only access in render function children or event handlers

4. **Disabled state comes from conditions, not RHF**
   - RHF's `getFieldState` does NOT return `disabled`
   - Formality adds `disabled` through `FieldStateInput.disabled`
   - Disabled state is computed from condition evaluation

### 8.2 Expression Engine

1. **Expression evaluation is safe and sandboxed**
   - No function calls allowed
   - No `eval()` or dangerous operations
   - Safe to use with user-provided expressions

2. **Field proxies enable dual access patterns**
   - Value properties: `client.id` accesses `value.id`
   - Metadata properties: `client.isTouched` accesses field state
   - Primitive coercion: `client` returns the value

3. **Context building follows dual mapping pattern**
   - Always provide both qualified and unqualified access
   - Qualified paths take precedence on collision
   - Use `buildEvaluationContext` for condition evaluation

4. **Expression caching improves performance**
   - ASTs are cached after first parse
   - Use `clearExpressionCache()` in tests for isolation

### 8.3 Debounce

1. **Always cleanup debounced functions on unmount**

   ```typescript
   useEffect(() => {
     const debouncedFn = debounce(callback, delay);
     return () => {
       debouncedFn.cancel(); // Prevent memory leaks
     };
   }, [callback, delay]);
   ```

2. **Use `flush()` for immediate submission**

   ```typescript
   submitImmediate() {
     debouncedSubmitRef.current?.flush();
   }
   ```

3. **Conditional debouncing:**
   - `debounce: false` → immediate execution (switches, toggles)
   - `debounce: 1000` → wait 1 second after last change (text fields)
   - Form-level debounce overrides field-level defaults

4. **Coordinate debounce with async validation**
   - Use execution versioning to detect stale saves
   - Wait for validation before submitting
   - Abort if new changes come in during validation

### 8.4 React Patterns

1. **Always use `forwardRef` for input components**
   - React Hook Form's Controller passes `ref` to render prop
   - Without `forwardRef`, React warns about refs on function components
   - Ref must reach actual DOM element for focus/select operations

2. **Set `displayName` for debugging**
   - Use named function expressions: `forwardRef(function ComponentName)`
   - Or set explicitly: `Component.displayName = "ComponentName"`
   - Critical for React DevTools and error messages

3. **Use index signature for spread props**
   - `[key: string]: unknown` in interface accepts any prop
   - Allows spreading unknown props to DOM element
   - Maintains type safety

4. **Hook consistency: Always call hooks in same order**
   - Never call hooks conditionally
   - Never call hooks in loops
   - Use `useMemo` for expensive computations

### 8.5 Testing

1. **All test components use `forwardRef`**
   - Matches production component patterns
   - Ensures Controller integration works

2. **Set `displayName` for component identification**
   - Helps debugging test failures
   - Matches production patterns

3. **Use `data-testid` for test selectors**
   - Stable selectors that don't depend on CSS classes
   - Works with any component structure

4. **Optional chaining for callbacks: `onChange?.()`**
   - Handles undefined callbacks gracefully
   - Prevents runtime errors

5. **Nullish coalescing for defaults: `value ?? ""`**
   - Provides safe defaults
   - Handles null and undefined

---

## 9. External Documentation References

### 9.1 React Hook Form

- **getFieldState API:** https://react-hook-form.com/docs/useform/getfieldstate
- **useWatch API:** https://react-hook-form.com/docs/usewatch
- **Controller API:** https://react-hook-form.com/docs/usecontroller
- **FormState API:** https://react-hook-form.com/docs/useform/formstate

### 9.2 React

- **forwardRef:** https://react.dev/reference/react/forwardRef (React 19)
- **Ref Forwarding:** https://legacy.reactjs.org/docs/forwarding-refs.html (React 18)
- **Hooks Rules:** https://react.dev/reference/react
- **useMemo:** https://react.dev/reference/react/useMemo

### 9.3 Lodash

- **debounce:** https://lodash.com/docs/4.17.15#debounce

### 9.4 JSEP

- **GitHub:** https://github.com/EricSmekens/jsep
- **Documentation:** https://ericsmekens.github.io/jsep/

### 9.5 Testing

- **Vitest:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **User Event:** https://testing-library.com/docs/user-event/intro

---

## 10. Conclusion

This comprehensive research report has documented the external dependencies used in the Formality project, focusing on:

1. **React Hook Form integration** - Key APIs, limitations, and workarounds
2. **Custom expression engine** - Security, performance, and proxy patterns
3. **Debounce implementation** - Lodash integration and async coordination
4. **React patterns** - forwardRef, hook consistency, and proxy state
5. **Testing infrastructure** - Patterns and best practices

### Key Takeaways

1. **`getFieldState` does NOT include `disabled`** - Formality adds this through condition evaluation
2. **Custom expression engine** - Built on jsep with sandboxed evaluation for security
3. **Debounce requires async coordination** - Execution versioning prevents stale saves
4. **forwardRef is required for all input components** - Controller integration depends on it
5. **Test components follow same patterns** - Use forwardRef in test fixtures

### Next Steps

For implementation guidance, refer to:

- `/packages/react/src/components/Field.tsx` - Field component patterns
- `/packages/react/src/hooks/useConditions.ts` - Condition evaluation
- `/packages/react/src/hooks/useFormState.ts` - Isolated subscriptions
- `/packages/core/src/expression/evaluate.ts` - Expression engine
- `/packages/react/src/__tests__/autosave-validation.test.tsx` - Testing patterns

---

**Document Status:** Complete
**Last Updated:** 2026-01-11
**Maintainer:** Formality Project Team
