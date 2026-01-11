# External Dependencies and Patterns for Bug Fixes

**Document Version:** 1.0
**Last Updated:** 2026-01-11
**Researcher:** External Documentation Research Agent

---

## Table of Contents

1. [React Hook Form Integration](#react-hook-form-integration)
2. [Expression Engine](#expression-engine)
3. [Debounce Patterns](#debounce-patterns)
4. [Lodash-es Utilities](#lodash-es-utilities)
5. [React Integration](#react-integration)
6. [Testing Infrastructure](#testing-infrastructure)

---

## 1. React Hook Form Integration

### Library Information

- **Library:** `react-hook-form`
- **Version:** `^7.0.0` (peer dependency), `^7.50.0` (dev dependency)
- **Purpose:** Form state management and validation
- **Integration Point:** `/packages/react/src/components/Form.tsx`

### Key APIs Used

#### 1.1 `getFieldState` Method

**Location:** Used in `useConditions.ts` and `Form.tsx`

**Signature:**
```typescript
methods.getFieldState(fieldName: FieldPath, formState?: UseFormStateReturn): FieldState
```

**Purpose:** Provides NON-REACTIVE access to field state without creating subscriptions

**Return Properties:**
```typescript
interface FieldState {
  isTouched: boolean;        // Field has been focused and blurred
  isDirty: boolean;          // Field value has changed from default
  invalid: boolean;          // Field has validation error
  error?: FieldError;        // Validation error details
  // Note: disabled is NOT part of RHF's getFieldState return
}
```

**Critical Usage Pattern:**
```typescript
// CORRECT: Use getFieldState for non-reactive metadata access
const fieldState = methods.getFieldState(fieldName as any);
const isFieldDisabled = fieldState?.disabled ?? false; // disabled comes from condition evaluation, not RHF

// WRONG: Don't use for reactive subscriptions
const formState = methods.formState; // This creates subscription to entire form state
```

**Key Implementation in `/packages/react/src/hooks/useConditions.ts` (lines 98-119):**
```typescript
const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

  watchFields.forEach((fieldName) => {
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
  });

  return states;
}, [watchFields, fieldValues, methods]);
```

#### 1.2 `useWatch` Hook

**Purpose:** Create ISOLATED field subscriptions (only re-renders when watched fields change)

**Signature:**
```typescript
useWatch<TFieldValues extends FieldValues>(
  props: {
    name: string | string[];  // Field names to watch
    control?: Control;        // Form control object
  }
): TFieldValues[keyof TFieldValues] | TFieldValues[keyof TFieldValues][]
```

**Critical Behavior:**
```typescript
// Single field: returns single value
const value = useWatch({ name: 'email' });

// Multiple fields (array): ALWAYS returns array of values
const values = useWatch({ name: ['email', 'name'] });
// values is [emailValue, nameValue]
```

**Implementation in `/packages/react/src/hooks/useConditions.ts` (lines 66-92):**
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

  // CRITICAL: useWatch with an array of names ALWAYS returns an array of values
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

#### 1.3 `Controller` Component

**Location:** `/packages/react/src/components/Field.tsx`

**Purpose:** Integrates custom input components with RHF

**Key Props:**
```typescript
<Controller
  control={methods.control}
  name={fieldName}
  rules={validationRules}
  render={({ field, fieldState, formState }) => (
    // field: { onChange, onBlur, value, name, ref }
    // fieldState: { invalid, isTouched, isDirty, error }
    // formState: Complete form state (AVOID - creates subscription)
  )}
/>
```

**Critical Gotcha - forwardRef Required:**
```typescript
// Input components MUST use forwardRef to receive ref from Controller
const TestInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, ...props }, ref) => (
    <input ref={ref} value={value} onChange={onChange} {...props} />
  )
);
TestInput.displayName = 'TestInput';
```

### Disabled State Handling

**IMPORTANT:** React Hook Form does NOT include `disabled` in `getFieldState` return value.

**Formality's Approach:**
1. Disabled state is managed through **condition evaluation** (`useConditions` hook)
2. Disabled state is stored in `FieldStateInput.disabled` (added by Formality, not from RHF)
3. Disabled state is resolved from conditions in `/packages/react/src/components/Field.tsx` (lines 257-270):
```typescript
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
```

### Best Practices for Bug Fixes

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

---

## 2. Expression Engine

### Library Information

**Formality uses a CUSTOM expression engine** built on top of two parsing libraries:

- **jsep** (`^1.4.0`): JavaScript Expression Parser - parses expressions into AST
- **jse-eval** (`^1.5.2`): JavaScript Expression Evaluator (unused - Formality has custom evaluator)

**Implementation Location:** `/packages/core/src/expression/`

### Custom Expression Architecture

#### 2.1 Expression Evaluation Pipeline

**File:** `/packages/core/src/expression/evaluate.ts`

**Process Flow:**
```
String Expression → jsep.parse() → AST → evaluateNode() → Result
```

**Example:**
```typescript
evaluate("client.id", { client: { id: 5 } }) // → 5
evaluate("client && signed", { client: { id: 5 }, signed: true }) // → true
evaluate("signed ? 'Yes' : 'No'", { signed: true }) // → 'Yes'
```

#### 2.2 Supported Expression Features

**Operators:**
- **Logical:** `&&`, `||`, `??` (with short-circuit evaluation)
- **Comparison:** `===`, `!==`, `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Arithmetic:** `+`, `-`, `*`, `/`, `%`
- **Unary:** `!`, `-`, `+`, `typeof`
- **Ternary:** `condition ? consequent : alternate`
- **Member access:** `obj.prop` (dot), `obj[prop]` (bracket)

**NO Function Calls:** Function calls are explicitly blocked for security:
```typescript
case "CallExpression": {
  throw new Error("Function calls are not allowed in expressions");
}
```

#### 2.3 Field State Proxy Pattern

**File:** `/packages/core/src/expression/context.ts`

**Purpose:** Enables both value access and metadata access in expressions

**How It Works:**
```typescript
// Field state with proxy
const fieldState = { value: { id: 5 }, isTouched: true, isDirty: false };
const proxy = createFieldStateProxy(fieldState);

// In expressions:
"client.id"        // → 5 (delegates to value.id)
"client.isTouched" // → true (accesses fieldState.isTouched)
"client"           // → { id: 5 } (coerces to value)
```

**Proxy Implementation** (lines 70-107):
```typescript
export function createFieldStateProxy(
  fieldState: FieldState | { value: unknown },
): unknown {
  const proxy = new Proxy(fieldState as object, {
    get(target: FieldState | { value: unknown }, prop: string | symbol) {
      // Known field state properties
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

**FIELD_STATE_PROPERTIES Set:**
```typescript
const FIELD_STATE_PROPERTIES = new Set([
  "value",
  "isTouched",
  "isDirty",
  "isValidating",
  "error",
  "invalid",
  "disabled",  // Formality-added property
]);
```

#### 2.4 Evaluation Context Building

**File:** `/packages/core/src/expression/context.ts`

**Dual Context Mapping Pattern:**

```typescript
// Context provides BOTH qualified and unqualified access
const context = buildFormContext({
  fields: { client: { value: { id: 5 }, isTouched: true } },
  record: { original: 'data' }
});

// Unqualified access (shortcut)
evaluate("client.id", context)  // → 5

// Qualified access (explicit)
evaluate("fields.client.id", context)  // → 5

// Record access
evaluate("record.original", context)  // → 'data'
```

**Context Structure:**
```typescript
{
  fields: { ... },      // All field states (qualified)
  record: { ... },      // Original record data
  errors: { ... },      // Form errors
  defaultValues: { ... }, // Initial values
  touchedFields: { ... }, // Touched field map
  dirtyFields: { ... },   // Dirty field map
  props: { ... },         // Field-specific props (in field context)
  // + unqualified shortcuts for each field name
}
```

### Best Practices for Bug Fixes

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

---

## 3. Debounce Patterns

### Library Information

**Library:** `lodash-es`
**Version:** `^4.17.21`
**Module:** ES modules version of Lodash
**Import:** `import { debounce } from "lodash-es"`

### Debounce Implementation

**Location:** `/packages/react/src/components/Form.tsx`

**Debounce Configuration:**

1. **Form-level debounce** (default: 1000ms)
   ```typescript
   <Form debounce={2000} autoSave={true}>
   ```

2. **Field-level debounce override** (via InputConfig)
   ```typescript
   textField: {
     debounce: 2000,  // Wait 2s
   }
   switch: {
     debounce: false, // Immediate (no debounce)
   }
   ```

### Debounce Function Interface

**Formality Type:** `DebouncedFunction` (in `/packages/react/src/types.ts`)

```typescript
export interface DebouncedFunction {
  (): void;           // Call the debounced function
  cancel: () => void; // Cancel pending execution
  flush: () => void;  // Execute immediately
  pending: () => boolean; // Check if pending
}
```

**Implementation in Form.tsx** (lines 521-544):

```typescript
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

### Auto-Save Coordination with Debounce

**Challenge:** Avoid submitting while field validation is in progress

**Solution:**
1. Accumulate changed fields during debounce period
2. Wait for validation to complete
3. Check if new changes came in (abort if so)
4. Submit only if all validations pass

**Implementation** (lines 438-519):

```typescript
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

  // Wait for validations to complete
  const validationsComplete = await waitForFieldValidation(
    fieldsToWaitFor,
    executionVersion,
  );

  // If version changed while waiting, abort (new changes came in)
  if (!validationsComplete || executionVersionRef.current !== executionVersion) {
    return;
  }

  // Check if changed fields have errors
  for (const fieldName of changedFields) {
    const fieldState = methods.getFieldState(fieldName as any);
    if (fieldState.error) {
      return; // Don't submit if validation failed
    }
  }

  // Trigger validation for affected fields
  if (fieldsToTrigger.length > 0) {
    const isValid = await methods.trigger(fieldsToTrigger as any);

    // Check version again after async validation
    if (executionVersionRef.current !== executionVersion) {
      return;
    }

    if (!isValid) {
      return; // Validation failed
    }
  }

  // All validations passed, submit
  const values = methods.getValues();
  await handleSubmit(values as TFieldValues);
}, [methods, handleSubmit, waitForFieldValidation]);
```

### Debounce Reset Behavior

**Lodash debounce automatically resets timer on new calls:**

```typescript
const debouncedFn = debounce(() => {
  console.log('Saved!');
}, 1000);

// User types "h" (starts timer)
// User types "e" (resets timer)
// User types "l" (resets timer)
// User types "l" (resets timer)
// User types "o" (resets timer)
// User stops typing
// 1 second later: "Saved!" (only once)
```

**Formality leverages this for auto-save:**
- Every field change calls `debouncedSubmit()`
- Lodash resets the timer
- Save only happens after user stops typing for debounce period

### Best Practices for Bug Fixes

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
   - Use execution version to detect stale saves
   - Wait for validation before submitting
   - Abort if new changes come in during validation

---

## 4. Lodash-es Utilities

### Library Information

**Library:** `lodash-es`
**Version:** `^4.17.21`
**Purpose:** Utility functions (debounce, etc.)
**Import Style:** ES modules tree-shakeable

### Usage in Formality

**Debounce Function:**
```typescript
import { debounce } from "lodash-es";

const debouncedFn = debounce(() => {
  console.log("Executed after delay");
}, 1000);
```

**Methods Available:**
- `debouncedFn.cancel()` - Cancel pending execution
- `debouncedFn.flush()` - Execute immediately
- `debouncedFn.pending()` - Check if pending

### Best Practices

1. **Tree-shaking:** lodash-es allows tree-shaking unused functions
2. **Type Safety:** Use TypeScript types for better inference
3. **Cleanup:** Always cancel debounced functions on unmount

---

## 5. React Integration

### Version Information

**React:** `^18.0.0` (peer dependency), `^18.2.0` (dev dependency)
**ReactDOM:** `^18.0.0` (peer dependency), `^18.2.0` (dev dependency)

### forwardRef Pattern

**Critical for React Hook Form Controller integration**

**Pattern:**
```typescript
import React, { forwardRef } from "react";

interface Props {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown; // For spread props
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

Component.displayName = "Component"; // For DevTools
```

**Why Required:**
- React Hook Form's Controller passes `ref` to render prop
- Without forwardRef, React warns: "Function components cannot be given refs"
- Ref must reach actual DOM element for focus/select operations

**Generic Type Order:**
```typescript
// CORRECT: Element type FIRST, then Props
forwardRef<HTMLInputElement, Props>

// WRONG: Props first, then Element
forwardRef<Props, HTMLInputElement>
```

### Best Practices

1. **Always use forwardRef for input components**
2. **Forward ref to actual DOM element, not wrapper**
3. **Set displayName for debugging**
4. **Use index signature for spread props**

---

## 6. Testing Infrastructure

### Testing Framework

**Vitest:** `^2.0.0`
**Testing Library:** `@testing-library/react` `^14.0.0`
**Test Environment:** jsdom `^24.0.0`

### Test Utilities

**Location:** `/packages/react/src/__tests__/setup.ts`

### forwardRef in Test Components

**All test input components must use forwardRef:**

```typescript
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  )
);
TestInput.displayName = "TestInput";
```

### Best Practices

1. **All test components use forwardRef**
2. **Set displayName for component identification**
3. **Use data-testid for test selectors**
4. **Optional chaining for callbacks: `onChange?.()`**
5. **Nullish coalescing for defaults: `value ?? ""`**

---

## Summary of Key Patterns

### Pattern 1: Non-Reactive Field State Access

**Use `getFieldState` when you need field metadata without re-renders:**
```typescript
const fieldState = methods.getFieldState(fieldName);
// Returns: { isTouched, isDirty, invalid, error }
// Does NOT trigger re-render
```

### Pattern 2: Isolated Field Subscriptions

**Use `useWatch` for specific field value subscriptions:**
```typescript
const values = useWatch({ name: ['field1', 'field2'] });
// Only re-renders when field1 or field2 changes
```

### Pattern 3: Disabled State from Conditions

**Disabled state is NOT from RHF, but from condition evaluation:**
```typescript
// In condition evaluation
const fieldStates = {
  fieldName: {
    value: "...",
    isTouched: true,
    isDirty: false,
    disabled: true, // Added by Formality from conditions
  }
};
```

### Pattern 4: Expression Context Building

**Always use dual context mapping for expressions:**
```typescript
const context = buildEvaluationContext(
  fieldValues,
  record,
  props,
  fieldStates // Includes disabled, isTouched, etc.
);
```

### Pattern 5: Debounce with Async Coordination

**Use execution version to detect stale operations:**
```typescript
executionVersionRef.current++;
const version = executionVersionRef.current;

// ... async operations ...

if (executionVersionRef.current !== version) {
  return; // New changes came in, abort
}
```

### Pattern 6: forwardRef for Input Components

**Always use forwardRef for components receiving ref from Controller:**
```typescript
const Component = forwardRef<HTMLElementType, PropsType>(
  (props, ref) => <element ref={ref} {...props} />
);
Component.displayName = "ComponentName";
```

---

## Version Compatibility Matrix

| Library | Version | Purpose |
|---------|---------|---------|
| react | ^18.0.0 | UI framework |
| react-dom | ^18.0.0 | DOM rendering |
| react-hook-form | ^7.0.0 | Form management |
| lodash-es | ^4.17.21 | Utilities (debounce) |
| jsep | ^1.4.0 | Expression parsing |
| jse-eval | ^1.5.2 | Expression evaluation (unused) |
| vitest | ^2.0.0 | Test framework |
| @testing-library/react | ^14.0.0 | React testing |

---

## External Documentation References

### React Hook Form
- ** getFieldState API**: https://react-hook-form.com/docs/useform/getfieldstate
- ** useWatch API**: https://react-hook-form.com/docs/usewatch
- ** Controller API**: https://react-hook-form.com/docs/controller

### React
- ** forwardRef**: https://react.dev/reference/react/forwardRef
- ** Ref Forwarding**: https://legacy.reactjs.org/docs/forwarding-refs.html

### Lodash
- ** debounce**: https://lodash.com/docs/4.17.15#debounce

### JSEP
- ** GitHub**: https://github.com/EricSmekens/jsep

---

## Conclusion

This document provides a comprehensive reference for the external dependencies and patterns used in the Formality project that are relevant to the bug fixes. Key takeaways:

1. **React Hook Form's `getFieldState` does NOT include `disabled`** - disabled state comes from condition evaluation
2. **Use `useWatch` for isolated field subscriptions** - prevents re-renders of unrelated fields
3. **Expression engine is custom and safe** - built on jsep with custom evaluation
4. **Debounce requires async coordination** - use execution versioning to detect stale operations
5. **forwardRef is required for all input components** - Controller passes ref that must reach DOM element
6. **Test components follow same patterns as production** - use forwardRef in test fixtures

For specific implementation details, refer to the source files mentioned in each section.
