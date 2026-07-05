# React Memoization Patterns Research

## Overview

Research on React hooks memoization patterns for preventing unnecessary re-renders, specifically for the Formality UI useConditions hook implementation.

---

## Key React Documentation URLs

### Official React Resources

- [React useMemo Reference](https://react.dev/reference/react/useMemo) - Official useMemo documentation
- [React useCallback Reference](https://react.dev/reference/react/useCallback) - Function memoization
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) - Derived state patterns (CRITICAL)
- [Render and Commit](https://react.dev/learn/render-and-commit) - Understanding re-renders
- [Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs) - Non-reactive values
- [React Hooks Reference](https://react.dev/reference/react) - Complete hooks reference

### React Hook Form Resources

- [getFieldState Documentation](https://react-hook-form.com/docs/useform/getfieldstate) - Non-reactive state access
- [Performance Documentation](https://react-hook-form.com/advanced-queries#performance) - Performance best practices
- [FormState API](https://react-hook-form.com/docs/useform/formstate) - Form state management

---

## useMemo Best Practices

### 1. When to Use useMemo

**Use useMemo for**:

- Expensive calculations (filtering large arrays, complex transformations)
- Maintaining stable references for dependencies in other hooks
- Passing objects to pure child components wrapped in `React.memo`

**Example**:

```typescript
// ✅ Good: Expensive calculation
const sortedList = useMemo(() => {
  return items.sort((a, b) => a.value - b.value);
}, [items]);

// ✅ Good: Reference stability matters
const config = useMemo(
  () => ({
    endpoint: "/api/data",
    headers: { Authorization: token },
  }),
  [token],
);
```

**Don't use useMemo for**:

- Simple derivations (string concatenation, basic arithmetic)
- Values that change on every render anyway

```typescript
// ❌ Bad: Simple derivation doesn't need memoization
const fullName = useMemo(() => {
  return `${firstName} ${lastName}`;
}, [firstName, lastName]);
// Better: const fullName = `${firstName} ${lastName}`;
```

### 2. Patterns for Memoizing Objects/Arrays

**Stable References Pattern**:

```typescript
// Memoize objects passed to optimized children
const formContext = useMemo(
  () => ({
    register,
    unregister,
    errors,
  }),
  [register, unregister, errors],
);
```

**Custom Hook Pattern**:

```typescript
function useFieldState(name) {
  const { getFieldState } = useForm();
  const [, forceUpdate] = useState({});

  const state = useMemo(() => {
    // Access field state without subscription
    return getFieldState(name);
  }, [name, getFieldState]);

  return state;
}
```

### 3. Structuring Dependencies to Avoid Infinite Loops

**Essential Rules**:

- Include ALL reactive values used in the callback
- Use `useCallback` to stabilize functions that are dependencies
- Use `useRef` for values that change but shouldn't trigger re-renders

```typescript
// ✅ Correct: All dependencies included
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// ✅ Correct: Using ref for non-reactive value
const latestCallback = useRef(callback);
latestCallback.current = callback;

const memoizedCallback = useCallback(() => {
  latestCallback.current(data);
}, [data]);

// ❌ Wrong: Missing dependency
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a]); // Missing 'b' dependency
```

### 4. Derived State Without useEffect

**Official React Guidance** (from "You Might Not Need an Effect"):

```typescript
// ❌ Bad: Using useEffect for derived state
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ Good: Direct computation
const fullName = `${firstName} ${lastName}`;

// ✅ Good: Expensive derivation with useMemo
const filteredItems = useMemo(() => {
  return items.filter((item) => item.active);
}, [items]);
```

**Application**: The `disabled` state in useConditions should be computed with useMemo, not useEffect.

---

## React Hook Form: getFieldState Pattern

### Key Insight

`getFieldState` allows you to access field state without subscribing to changes, preventing unnecessary re-renders.

### API Signature

```typescript
getFieldState(name: string, formState?: FormState): FieldState
```

### Returns

```typescript
{
  invalid: boolean
  isDirty: boolean
  isTouched: boolean
  error?: FieldError
}
```

### Usage Patterns

```typescript
// ❌ Bad: Causes re-render on every field change
const formState = useFormState();
const isEmailDirty = formState.dirtyFields.email;

// ✅ Good: No subscription, no re-render
const { getFieldState } = useForm();
const emailState = getFieldState("email");
const isEmailDirty = emailState.isDirty;

// ✅ Good: In event handlers (no re-render)
const onSubmit = () => {
  const emailState = getFieldState("email");
  if (emailState.isDirty && !emailState.invalid) {
    submitForm();
  }
};

// ✅ Good: In useMemo for derived state
const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};
  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
    };
  });
  return states;
}, [watchFields, fieldValues, methods]);
```

### Performance Benefits

- **No subscription**: Unlike `watch()` or `useFormState()`, it doesn't trigger re-renders
- **Direct access**: Retrieves current state immediately
- **Conditional usage**: Perfect for validation logic, form submission, or conditional UI decisions

---

## Two-Pass Evaluation with useMemo

### Dependency Ordering

Critical for correct two-pass evaluation:

```typescript
// Pass 1: No dependencies on other passes
const baseFieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};
  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      // No disabled property in Pass 1
    };
  });
  return states;
}, [watchFields, fieldValues, methods]);

// Pass 2: MUST depend on Pass 1
const disabledStates = useMemo(() => {
  const disabled: Record<string, boolean> = {};
  watchFields.forEach((fieldName) => {
    // Evaluate using baseFieldStates (without disabled)
    const result = evaluateConditions({
      conditions,
      fieldValues,
      fieldStates: baseFieldStates, // ← Pass 1 dependency
      record,
      props: { name: fieldName },
    });
    disabled[fieldName] = result.disabled ?? false;
  });
  return disabled;
}, [watchFields, conditions, fieldValues, baseFieldStates, record]);

// Pass 3: MUST depend on Pass 1 AND Pass 2
const fieldStates = useMemo(() => {
  return Object.entries(baseFieldStates).reduce(
    (acc, [name, state]) => {
      acc[name] = {
        ...state,
        disabled: disabledStates[name], // ← Pass 2 dependency
      };
      return acc;
    },
    {} as Record<string, FieldStateInput>,
  );
}, [baseFieldStates, disabledStates]);
```

### Key Principles

1. **Pass 1 depends only on primitive/watched values** (watchFields, fieldValues, methods)
2. **Pass 2 depends on Pass 1 result** (baseFieldStates)
3. **Pass 3 depends on both Pass 1 and Pass 2** (baseFieldStates, disabledStates)
4. **Each pass is independently memoized** - no unnecessary recalculations

---

## Quick Reference Checklist

### ✅ When to memoize

- Expensive calculations (O(n+) complexity)
- Reference stability required by child components
- Dependencies in other hooks (useEffect, useMemo)
- Objects/arrays passed to React.memo wrapped components

### ❌ When NOT to memoize

- Simple calculations (string concatenation, basic arithmetic)
- Primitives that don't need reference stability
- Values that change on every render anyway
- Premature optimization without profiling

### 🎯 Best Practice

Start without memoization, profile with React DevTools, then optimize hot paths only.

---

## Application to useConditions

### Current Implementation

```typescript
const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};
  watchFields.forEach((fieldName) => {
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
```

### Two-Pass Implementation

```typescript
// Pass 1: Base states (rename existing to baseFieldStates)
const baseFieldStates = useMemo(() => {
  // ... same as above ...
}, [watchFields, fieldValues, methods]);

// Pass 2: Add disabled property
const disabledStates = useMemo(() => {
  const disabled: Record<string, boolean> = {};
  watchFields.forEach((fieldName) => {
    const result = evaluateConditions({
      conditions: getFieldConditions(fieldName), // TODO: Where from?
      fieldValues,
      fieldStates: baseFieldStates,
      record,
      props: { name: fieldName },
    });
    disabled[fieldName] = result.disabled ?? false;
  });
  return disabled;
}, [watchFields /* fieldConditions */, , fieldValues, baseFieldStates, record]);

// Pass 3: Merge
const fieldStates = useMemo(() => {
  return Object.entries(baseFieldStates).reduce(
    (acc, [name, state]) => {
      acc[name] = {
        ...state,
        disabled: disabledStates[name],
      };
      return acc;
    },
    {} as Record<string, FieldStateInput>,
  );
}, [baseFieldStates, disabledStates]);
```

### Dependencies Summary

| Pass                     | Dependencies                                                  | Notes                               |
| ------------------------ | ------------------------------------------------------------- | ----------------------------------- |
| Pass 1 (baseFieldStates) | watchFields, fieldValues, methods                             | Independent, no circular dependency |
| Pass 2 (disabledStates)  | watchFields, conditions, fieldValues, baseFieldStates, record | Depends on Pass 1                   |
| Pass 3 (fieldStates)     | baseFieldStates, disabledStates                               | Depends on Pass 1 and Pass 2        |
