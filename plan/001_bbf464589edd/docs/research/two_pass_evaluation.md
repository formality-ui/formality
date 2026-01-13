# Research: Two-Pass Evaluation Patterns for Circular Dependency Resolution

## Executive Summary

This research document compiles findings on two-pass evaluation patterns for resolving circular dependencies in form systems and React hooks, specifically applied to the Formality UI form library's challenge: **conditions need `disabled` state, and `disabled` state comes from conditions**.

---

## Table of Contents

1. [The Circular Dependency Problem](#the-circular-dependency-problem)
2. [Pattern 1: Two-Pass Field State Building](#pattern-1-two-pass-field-state-building)
3. [Pattern 2: React Derived State with useMemo](#pattern-2-react-derived-state-with-usememo)
4. [Pattern 3: Isolated Subscriptions (React Hook Form Pattern)](#pattern-3-isolated-subscriptions-react-hook-form-pattern)
5. [Pattern 4: Priority-Based Resolution](#pattern-4-priority-based-resolution)
6. [Implementation Guidance](#implementation-guidance)
7. [Actionable Gotchas and Best Practices](#actionable-gotchas-and-best-practices)

---

## The Circular Dependency Problem

### In Formality UI

**Location**: `/packages/core/src/conditions/evaluate.ts` (lines 78-84)

```typescript
// Check isDisabled matcher
if (matcher.isDisabled !== undefined) {
  const isFieldDisabled = fieldState?.disabled ?? false;
  if (matcher.isDisabled !== isFieldDisabled) {
    return false;
  }
}
```

**The Cycle**:
1. **Conditions need `disabled`**: The `isDisabled` matcher checks `fieldState.disabled`
2. **`disabled` comes from conditions**: Disabled state is computed by evaluating conditions
3. **Result**: `conditions → disabled → conditions` = **infinite loop**

**Without Resolution**:
- Condition evaluation attempts to check `isDisabled` matcher
- `isDisabled` needs `fieldState.disabled`
- `fieldState.disabled` is computed from condition evaluation
- **Infinite recursion or stale values**

---

## Pattern 1: Two-Pass Field State Building

### Concept

Build field states in separate phases to break circular dependencies:

- **Pass 1**: Build base field states WITHOUT the computed property
- **Pass 2**: Add the computed property using Pass 1 states as input
- **Pass 3** (optional): Merge Pass 1 and Pass 2 into final result

### Implementation Pattern

**Source**: Based on existing implementation in `/packages/react/src/hooks/useFieldDisabledState.ts` (lines 76-196)

```typescript
// ============================================================================
// Pass 1: Base states (without disabled)
// ============================================================================
const baseFieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false,
      // ❌ NO disabled property - this breaks the cycle
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);

// ============================================================================
// Pass 2: Compute disabled for each field
// ============================================================================
// IMPORTANT: Uses baseFieldStates (without disabled) to avoid circular dependency
const disabledStates = useMemo(() => {
  const disabled: Record<string, boolean> = {};

  if (watchFields.length === 0) {
    return disabled;
  }

  watchFields.forEach((fieldName) => {
    const result = evaluateConditions({
      conditions: fieldConditions,
      fieldValues,
      fieldStates: baseFieldStates, // ← Use Pass 1 states!
      record,
      props: { name: fieldName },
    });

    disabled[fieldName] = result.disabled ?? false;
  });

  return disabled;
}, [watchFields, conditions, fieldValues, baseFieldStates, record]);

// ============================================================================
// Pass 3: Merge base states with disabled
// ============================================================================
const fieldStates = useMemo(() => {
  return Object.entries(baseFieldStates).reduce(
    (acc, [name, state]) => {
      acc[name] = {
        ...state,
        disabled: disabledStates[name],
      };
      return acc;
    },
    {} as Record<string, FieldStateInput>
  );
}, [baseFieldStates, disabledStates]);
```

### Key Insights

1. **Pass 1 states don't include disabled** - This is critical for breaking the cycle
2. **Pass 2 depends on Pass 1** - Correct dependency ordering ensures proper evaluation
3. **Each pass is memoized** - Prevents unnecessary recalculations
4. **No infinite loops** - Conditions evaluate using base states, never triggering re-evaluation

### Gotchas

⚠️ **Rules of Hooks Violation**: Cannot call `useFieldDisabledState` in a loop

```typescript
// ❌ WRONG - This violates Rules of Hooks
watchFields.forEach((fieldName) => {
  const isDisabled = useFieldDisabledState({ fieldName }); // Error!
});

// ✅ RIGHT - Call evaluateConditions directly (it's a pure function)
watchFields.forEach((fieldName) => {
  const result = evaluateConditions({
    conditions,
    fieldValues,
    fieldStates: baseFieldStates,
    record,
    props: { name: fieldName },
  });
  disabled[fieldName] = result.disabled ?? false;
});
```

---

## Pattern 2: React Derived State with useMemo

### Official React Guidance

**Source**: [React - You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

**Key Principle**: Compute derived state during render rather than storing it in state.

```typescript
// ❌ WRONG: Storing derived state
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ RIGHT: Computing during render
const fullName = `${firstName} ${lastName}`;

// ✅ RIGHT: Expensive derivation with useMemo
const filteredItems = useMemo(() => {
  return items.filter(item => item.active);
}, [items]);
```

### Application to Disabled State

The `disabled` state should be computed using `useMemo`, not stored in component state.

**Location**: `/packages/react/src/components/Field.tsx` (lines 265-278)

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

### Dependency Ordering for Two-Pass Evaluation

**Critical for correct two-pass evaluation**:

```typescript
// Pass 1: No dependencies on other passes
const baseFieldStates = useMemo(() => {
  // ... build states without disabled
}, [watchFields, fieldValues, methods]);

// Pass 2: MUST depend on Pass 1
const disabledStates = useMemo(() => {
  // ... compute disabled using baseFieldStates
}, [watchFields, conditions, fieldValues, baseFieldStates, record]);

// Pass 3: MUST depend on Pass 1 AND Pass 2
const fieldStates = useMemo(() => {
  // ... merge baseFieldStates + disabledStates
}, [baseFieldStates, disabledStates]);
```

---

## Pattern 3: Isolated Subscriptions (React Hook Form Pattern)

### The Pattern

**Source**: [React Hook Form getFieldState Documentation](https://react-hook-form.com/docs/useform/getfieldstate)

**Key Insight**: `getFieldState` allows accessing field state without subscribing to changes, preventing unnecessary re-renders.

### Usage Patterns

**Location**: `/packages/react/src/hooks/useConditions.ts` (lines 98-119)

```typescript
// ❌ Bad: Causes re-render on every field change
const formState = useFormState();
const isEmailDirty = formState.dirtyFields.email;

// ✅ Good: No subscription, no re-render
const { getFieldState } = useForm();
const emailState = getFieldState('email');
const isEmailDirty = emailState.isDirty;

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

### Isolated Subscriptions Pattern

```typescript
// useWatch with array of names provides isolated subscriptions
const watchedValues = useWatch({
  control: methods.control,
  name: watchFields.length > 0 ? (watchFields as any) : [],
});

// Only re-renders when watched values change
```

---

## Pattern 4: Priority-Based Resolution

### Concept

Resolve state from multiple sources using a clear priority order, processing non-conditional sources first, then conditional sources.

### Implementation Pattern

**Location**: `/packages/react/src/hooks/useFieldDisabledState.ts` (lines 76-196)

```typescript
// ============================================================================
// Pass 1: Non-Conditional Source Resolution (prop and config only)
// ============================================================================
const baseDisabled = useMemo(() => {
  if (disabledProp !== undefined) return disabledProp;
  if (fieldConfigDisabled !== undefined) return fieldConfigDisabled;
  return undefined; // No explicit non-conditional source set
}, [disabledProp, fieldConfigDisabled]);

// ============================================================================
// Pass 2: Condition Evaluation (using base states)
// ============================================================================
const conditionResult = useMemo(() => {
  return evaluateConditions({
    conditions,
    fieldValues,
    fieldStates: baseFieldStates, // Pass 1 states
    record,
    props: { name: fieldName },
  });
}, [conditions, fieldValues, baseFieldStates, record]);

// ============================================================================
// Pass 3: Final Priority Resolution
// ============================================================================
const finalDisabled = useMemo(() => {
  if (baseDisabled !== undefined) return baseDisabled;
  if (conditionResult.hasDisabledCondition) return conditionResult.disabled;
  if (groupDisabled) return true;
  return false;
}, [baseDisabled, conditionResult, groupDisabled]);
```

### Priority Order

1. **JSX prop** (highest priority)
2. **Field config**
3. **Conditions** (from useConditions)
4. **Group state**
5. **Default: false**

---

## Implementation Guidance

### Recommended Approach for Formality UI

Based on research findings, here's the recommended implementation:

#### Step 1: Modify useConditions Hook

**Location**: `/packages/react/src/hooks/useConditions.ts`

**Current** (lines 98-119):
```typescript
const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

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

**Modified** (Two-Pass):
```typescript
// ============================================================================
// Pass 1: Base field states (without disabled)
// ============================================================================
const baseFieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false,
      // ❌ NO disabled property - this breaks the cycle
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);

// ============================================================================
// Pass 2: Compute disabled for each field
// ============================================================================
const disabledStates = useMemo(() => {
  const disabled: Record<string, boolean> = {};

  if (watchFields.length === 0) {
    return disabled;
  }

  watchFields.forEach((fieldName) => {
    const result = evaluateConditions({
      conditions: fieldConditions,
      fieldValues,
      fieldStates: baseFieldStates, // ← Use Pass 1 states!
      record,
      props: { name: fieldName },
    });

    disabled[fieldName] = result.disabled ?? false;
  });

  return disabled;
}, [watchFields, conditions, fieldValues, baseFieldStates, record]);

// ============================================================================
// Pass 3: Merge base states with disabled
// ============================================================================
const fieldStates = useMemo(() => {
  return Object.entries(baseFieldStates).reduce(
    (acc, [fieldName, state]) => {
      acc[fieldName] = {
        ...state,
        disabled: disabledStates[fieldName],
      };
      return acc;
    },
    {} as Record<string, FieldStateInput>
  );
}, [baseFieldStates, disabledStates]);
```

---

## Actionable Gotchas and Best Practices

### Critical Gotchas

#### 1. Rules of Hooks - Cannot Call Hooks in Loops

```typescript
// ❌ WRONG - Violates Rules of Hooks
watchFields.forEach((fieldName) => {
  const isDisabled = useFieldDisabledState({ fieldName }); // Error!
});

// ✅ RIGHT - Call evaluateConditions directly (pure function)
watchFields.forEach((fieldName) => {
  const result = evaluateConditions({
    conditions,
    fieldValues,
    fieldStates: baseFieldStates,
    record,
    props: { name: fieldName },
  });
  disabled[fieldName] = result.disabled ?? false;
});
```

#### 2. useWatch with Array Returns Array

```typescript
// ❌ WRONG - Array access, not object access
const watchedValues = useWatch({ control, name: ['field1', 'field2'] });
const value1 = watchedValues.field1; // undefined!

// ✅ RIGHT - Array index access
const value1 = watchedValues[0]; // correct
```

#### 3. getFieldState() vs useFormState()

```typescript
// ❌ WRONG - Subscribes to entire form state
const formState = useFormState();
const isDirty = formState.dirtyFields.email;

// ✅ RIGHT - No subscription, no re-render
const { getFieldState } = useForm();
const emailState = getFieldState('email');
const isDirty = emailState.isDirty;
```

#### 4. Memoization Dependency Ordering

```typescript
// ❌ WRONG - Missing dependency
const disabledStates = useMemo(() => {
  // uses baseFieldStates
}, [watchFields, conditions]); // Missing baseFieldStates

// ✅ RIGHT - All dependencies included
const disabledStates = useMemo(() => {
  // uses baseFieldStates
}, [watchFields, conditions, baseFieldStates, record]);
```

#### 5. Don't Add Disabled to Pass 1 States

```typescript
// ❌ WRONG - Defeats the purpose of two-pass evaluation
const baseFieldStates = useMemo(() => {
  // ...
  states[fieldName] = {
    // ...
    disabled: false, // ❌ Don't do this!
  };
}, []);

// ✅ RIGHT - No disabled in Pass 1
const baseFieldStates = useMemo(() => {
  // ...
  states[fieldName] = {
    // ...
    // disabled property omitted
  };
}, []);
```

---

## Summary

### Key Takeaways

1. **Two-Pass Evaluation is the Standard Pattern** for resolving circular dependencies where computed values depend on condition evaluation.

2. **Pass 1 builds base states without the computed property** (disabled), breaking the cycle.

3. **Pass 2 computes the property using Pass 1 states** as input, preventing circular dependency.

4. **Pass 3 merges results** into final field states with all properties.

5. **useMemo dependency ordering is critical** for correct two-pass evaluation.

6. **Rules of Hooks must be respected** - cannot call hooks in loops.

7. **Isolated subscriptions prevent cascading re-renders** across form fields.

8. **getFieldState() provides non-reactive access** to field metadata.

---

## References

### External Documentation

- [React useMemo Reference](https://react.dev/reference/react/useMemo) - Official useMemo documentation
- [React Derived State](https://react.dev/learn/you-might-not-need-an-effect) - Derived state patterns
- [React Hook Form getFieldState](https://react-hook-form.com/docs/useform/getfieldstate) - Non-reactive state access
- [React Hook Form useWatch](https://react-hook-form.com/docs/usewatch) - Isolated subscriptions

### Implementation Files

- [useFieldDisabledState Hook](/home/dustin/projects/formality/packages/react/src/hooks/useFieldDisabledState.ts) - Pattern reference
- [useConditions Hook](/home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts) - Target file
- [FieldStateInput Type](/home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts) - Type definition
- [isDisabled Matcher](/home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts) - Lines 78-84
