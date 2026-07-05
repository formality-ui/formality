# Field Component Patterns Analysis

## Overview

Analysis of the Field component and its relationship to useConditions, focusing on disabled state resolution patterns relevant for P2.M1.T1.S2.

---

## 1. How Field Currently Consumes Disabled State

**Location**: `/packages/react/src/components/Field.tsx` (lines 265-278)

The Field component has a clear priority order for disabled state resolution:

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

### Key Points

1. **Priority Order**:
   - JSX prop (highest)
   - Field config
   - Conditions (from useConditions)
   - Group state
   - Default: false

2. **Condition Result Source**:
   - Comes from `useConditions` hook (line 215)
   - `conditionResult.disabled` is used for priority 3

3. **Current Limitation**:
   - Field resolves its own disabled state
   - Other fields cannot reference this field's disabled state in conditions
   - `isDisabled` matcher in conditions doesn't work because fieldStates don't include disabled

---

## 2. Pattern for Condition Evaluation

### useConditions Integration

**Location**: `/packages/react/src/components/Field.tsx` (line 215)

```typescript
const conditionResult = useConditions({
  conditions: fieldConfig.conditions ?? [],
  subscribesTo: fieldConfig.subscribesTo,
  props: { name },
});
```

### How useConditions Builds Field States

**Location**: `/packages/react/src/hooks/useConditions.ts` (lines 98-119)

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
      isValidating: false,
      // ❌ NO disabled property currently
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);
```

### Key Patterns

1. **Isolated Subscriptions**:
   - Uses `useWatch` with array of field names
   - Only re-renders when specifically watched values change
   - Prevents cascading re-renders

2. **Non-Reactive State Access**:
   - Uses `getFieldState()` for field metadata
   - Doesn't subscribe to entire form state
   - Prevents all fields from re-validating on any change

3. **Field States Without Disabled**:
   - Currently doesn't include `disabled` property
   - This is the target of P2.M1.T1.S2

---

## 3. How Field Passes Props to Child Components

**Location**: `/packages/react/src/components/Field.tsx` (lines 403-422)

The Field uses an 8-layer prop merging system:

```typescript
const finalProps = mergeFieldProps({
  providerDefaultFieldProps: providerConfig.defaultFieldProps,
  providerSelectDefaultFieldProps: providerSelectProps,
  formDefaultFieldProps: formConfig.defaultFieldProps,
  formSelectDefaultFieldProps: formSelectProps,
  inputProps: inputConfig.props,
  fieldConfigProps: fieldConfig.props,
  selectProps: fieldSelectProps,
  componentProps: restProps,
  coreProps: {
    name,
    label,
    disabled: isDisabled, // ← Disabled prop passed here
    error: fieldState.error?.message,
    [inputConfig.inputFieldProp ?? "value"]: formattedValue,
    onChange: handleChange(field.onChange),
    onBlur: field.onBlur,
    ref: field.ref,
  },
});
```

### Priority Order

1. **Core props** (highest priority) - including `disabled: isDisabled`
2. Component props (restProps from JSX)
3. Field config props
4. Input props
5. Form select props
6. Form default props
7. Provider select props
8. Provider default props (lowest priority)

### Key Points

- **Core props always win**: The `disabled` prop from coreProps overrides all other sources
- **Dynamic evaluation**: `usePropsEvaluation` hook evaluates dynamic props
- **Final props**: Passed to either template component or directly to input component

---

## 4. Relevant Patterns for useConditions Integration

### Pattern 1: Separation of Concerns

The Field already separates:

- **Condition evaluation**: `useConditions` hook
- **Disabled state resolution**: Local `isDisabled` useMemo
- **Props merging**: `mergeFieldProps` function

This suggests `useFieldDisabledState` could be integrated cleanly.

### Pattern 2: Isolated Subscriptions

All watches use isolated subscriptions:

```typescript
const watchFields = useInferredInputs({
  conditions,
  subscribesTo,
});

const watchedValues = useWatch({
  control: methods.control,
  name: watchFields.length > 0 ? (watchFields as any) : [],
});
```

**Benefit**: Prevents cascading re-renders across form fields.

### Pattern 3: Priority System

Clear priority system works well:

1. JSX prop (highest)
2. Field config
3. Conditions
4. Group state
5. Default: false

**Application**: Same priority order should be maintained when integrating disabled into field states.

### Pattern 4: Memoization with Dependencies

All state resolutions use `useMemo` with explicit dependencies:

```typescript
const isDisabled = useMemo(() => {
  // priority resolution logic
}, [
  disabledProp,
  fieldConfig.disabled,
  conditionResult,
  groupContext.state.isDisabled,
]);
```

**Benefit**: Prevents unnecessary recalculations.

### Pattern 5: Context Integration

Field properly integrates with multiple contexts:

- `useFormContext` for form methods
- `useConfigContext` for provider config
- `useGroupContext` for group state
- `useConditions` for condition evaluation

**Implication**: useConditions integration should maintain context compatibility.

---

## 5. Integration Points for P2.M1.T1.S2

### Current State

1. **Field gets `conditionResult` from `useConditions`**
   - `conditionResult.disabled` is used in Field's disabled resolution
   - `conditionResult` doesn't include field states with disabled property

2. **Field's own disabled state**:
   - Computed locally using priority order
   - NOT exposed to other fields via field states
   - This is why `isDisabled` matcher doesn't work

### Target State (After P2.M1.T1.S2)

1. **useConditions returns field states with disabled**:

   ```typescript
   interface FieldStateInput {
     value: unknown;
     isTouched?: boolean;
     isDirty?: boolean;
     isValidating?: boolean;
     error?: unknown;
     invalid?: boolean;
     disabled?: boolean; // ← Will be populated
   }
   ```

2. **Conditions can reference disabled state**:

   ```typescript
   { when: { field1: { isDisabled: true } }, disabled: true }
   ```

3. **Field component behavior**:
   - Initially: No change (continues to use local `isDisabled` computation)
   - Future: Could potentially use `fieldStates.disabled` from useConditions

### What Changes in P2.M1.T1.S2

1. **useConditions hook**:
   - Adds `disabled` property to field states for each watched field
   - Uses two-pass evaluation to compute disabled
   - No API changes to the hook itself

2. **Field component**:
   - NO immediate changes required
   - Continues to use existing disabled resolution pattern
   - Benefits: field states now include disabled for `isDisabled` matcher

3. **Condition evaluation**:
   - `isDisabled` matcher now works correctly
   - Can reference disabled state of other fields
   - Multi-field disabled conditions become possible

---

## 6. Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Field Component                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. useConditions({                                             │
│       conditions: fieldConfig.conditions,                       │
│       subscribesTo: fieldConfig.subscribesTo,                   │
│       props: { name },                                          │
│     })                                                          │
│     │                                                           │
│     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              useConditions Hook                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  1. useInferredInputs → watchFields                     │   │
│  │  2. useWatch → watchedValues                            │   │
│  │  3. Build fieldValues from watchedValues                │   │
│  │  4. Build fieldStates (CURRENTLY WITHOUT DISABLED)      │   │
│  │  5. evaluateConditions → conditionResult               │   │
│  └─────────────────────────────────────────────────────────┘   │
│     │                                                           │
│     ├─────────────────────┐                                     │
│     ▼                     ▼                                     │
│  conditionResult      fieldStates (no disabled)                 │
│  .disabled            .not exposed externally                   │
│     │                                                           │
│     ▼                                                           │
│  2. isDisabled = useMemo(() => {                                │
│       if (disabledProp) return disabledProp;                    │
│       if (fieldConfig.disabled) return fieldConfig.disabled;   │
│       if (conditionResult.hasDisabledCondition)                │
│         return conditionResult.disabled;                        │
│       if (groupDisabled) return true;                           │
│       return false;                                             │
│     }, [dependencies]);                                         │
│                                                                   │
│     ▼                                                           │
│  3. finalProps = mergeFieldProps({                              │
│       coreProps: { disabled: isDisabled, ... },                 │
│       ...                                                       │
│     })                                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

AFTER P2.M1.T1.S2 (Two-Pass Evaluation):

┌─────────────────────────────────────────────────────────────────┐
│              useConditions Hook (MODIFIED)                       │
├─────────────────────────────────────────────────────────────────┤
│  1. useInferredInputs → watchFields                             │
│  2. useWatch → watchedValues                                    │
│  3. Build fieldValues from watchedValues                        │
│  4. Pass 1: baseFieldStates (without disabled)                  │
│  5. Pass 2: disabledStates (evaluate with Pass 1 states)        │
│  6. Pass 3: fieldStates (merge base + disabled)                 │
│  7. evaluateConditions → conditionResult (uses Pass 3 states)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Summary

The Field component is well-structured for integrating disabled state into useConditions:

1. **Clear separation** between condition evaluation and disabled resolution
2. **Isolated subscriptions** prevent performance issues
3. **Priority system** is consistent and well-documented
4. **No immediate changes** to Field component required
5. **Integration point** is the field states returned by useConditions

The key insight: Field currently resolves its own disabled state, but this state isn't exposed to other fields via field states. P2.M1.T1.S2 fixes this by adding `disabled` to field states, enabling the `isDisabled` matcher to work correctly.
