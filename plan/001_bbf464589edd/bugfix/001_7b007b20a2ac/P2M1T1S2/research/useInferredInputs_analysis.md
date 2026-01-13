# useInferredInputs Hook Analysis

## Overview

The `useInferredInputs` hook is a dependency inference utility that automatically determines which fields a component should subscribe to for reactive updates.

---

## 1. How useInferredInputs Works

**Location**: `/packages/react/src/hooks/useInferredInputs.ts`

### Purpose

Infers field dependencies from multiple sources to determine which fields should be watched for reactive updates.

### Sources Analyzed

1. **selectProps**: Dynamic props descriptor (string, object, array) containing field references
2. **formDefaultFieldProps**: Form-level default field props with field references
3. **providerDefaultFieldProps**: Provider-level default field props with field references
4. **conditions**: Condition descriptors that reference fields via `when`, `selectWhen`, and `selectSet`
5. **subscribesTo**: Explicit field subscriptions (highest priority - these are always included)

### Processing Flow

```typescript
const inferred: string[] = [...subscribesTo]; // Start with explicit subscriptions

// Add fields from each source (if exists)
if (providerDefaultFieldProps) {
  inferred.push(...inferFieldsFromDescriptor(providerDefaultFieldProps));
}
if (formDefaultFieldProps) {
  inferred.push(...inferFieldsFromDescriptor(formDefaultFieldProps));
}
if (selectProps) {
  inferred.push(...inferFieldsFromDescriptor(selectProps));
}
if (conditions.length > 0) {
  inferred.push(...inferFieldsFromConditions(conditions));
}

// Return unique field names
return [...new Set(inferred)];
```

---

## 2. What It Returns and How It's Used

### Return Value

- **Type**: `string[]` - Array of unique field names to subscribe to
- **Purpose**: Provides the list of fields that should be watched for changes

### Usage in useConditions

```typescript
// 1. Infer fields to watch from conditions and explicit subscriptions
const watchFields = useInferredInputs({
  conditions,
  subscribesTo,
});

// 2. Watch inferred fields with isolated subscriptions
const watchedValues = useWatch({
  control: methods.control,
  name: watchFields.length > 0 ? (watchFields as any) : [],
});

// 3. Build field values map from watched values
const fieldValues = useMemo(() => {
  const values: Record<string, unknown> = {};
  watchFields.forEach((field, i) => {
    values[field] = watchedValues[i];
  });
  return values;
}, [watchFields, watchedValues]);
```

### Usage in useFieldDisabledState

Same pattern as useConditions:

```typescript
// 1. Infer fields to watch from conditions
const watchFields = useInferredInputs({
  conditions,
  subscribesTo,
});

// 2. Watch inferred fields (same pattern as useConditions)
const watchedValues = useWatch({
  control: methods.control,
  name: watchFields.length > 0 ? (watchFields as any) : [],
});

// 3. Build field values and states for condition evaluation
const fieldValues = useMemo(/* same as useConditions */);
const fieldStates = useMemo(/* same as useConditions */);

// 4. Evaluate conditions
const conditionResult = useMemo(() => {
  return evaluateConditions({
    conditions,
    fieldValues,
    fieldStates,
    record,
    props: { name: fieldName }, // Pass current field name
  });
}, [conditions, fieldValues, fieldStates, record, fieldName]);
```

---

## 3. How It Handles Condition Inference

The hook uses two complementary inference functions:

### inferFieldsFromDescriptor (for expressions)

Analyzes string expressions like `"client.id && signed"` to extract field references.

- Uses regex to extract JavaScript identifiers representing field names
- Skips:
  - JavaScript keywords (true, false, null, undefined, etc.)
  - String literal contents
  - Qualified prefixes followed by dots (e.g., "client" in "client.id" is skipped, but "client" standalone is included)

### inferFieldsFromConditions (for condition objects)

Extracts field references from:
- `when` field (single string or object with multiple fields)
- `selectWhen` expressions (via `inferFieldsFromDescriptor`)
- `selectSet` expressions (via `inferFieldsFromDescriptor`)
- `subscribesTo` arrays

### Example Inference

```typescript
const conditions = [
  { when: "client", disabled: true }, // → ["client"]
  { selectWhen: "signed && approved", visible: false }, // → ["signed", "approved"]
  { when: { email: true, name: true }, disabled: true }, // → ["email", "name"]
];

inferFieldsFromConditions(conditions);
// → ["client", "signed", "approved", "email", "name"]
```

---

## 4. Important Patterns and Gotchas

### Critical Patterns

#### 1. Isolated Subscriptions

```typescript
// useWatch with array of names provides isolated subscriptions
const watchedValues = useWatch({
  control: methods.control,
  name: watchFields.length > 0 ? (watchFields as any) : [],
});

// Only re-renders when watched values change
```

**Benefit**: Prevents cascading re-renders across form fields.

#### 2. Two-Phase Field State Access

- **Reactive**: `useWatch` for values (triggers re-renders)
- **Non-reactive**: `getFieldState()` for metadata (no subscriptions)

**Benefit**: Prevents cascading validation updates.

#### 3. Circular Dependency Prevention

In `useFieldDisabledState`, `disabled` is excluded from `fieldStates`:

```typescript
states[fieldName] = {
  value: fieldValues[fieldName],
  isTouched: fieldState.isTouched,
  isDirty: fieldState.isDirty,
  error: fieldState.error,
  invalid: fieldState.invalid,
  isValidating: false,
  // ❌ NO disabled property - this prevents infinite loops
};
```

**Benefit**: Prevents infinite loops during condition evaluation.

### Gotchas

#### 1. Function Descriptors Cannot Be Analyzed

```typescript
// ❌ This won't work - functions need explicit subscribesTo
selectProps: () => client.id

// ✅ Explicit subscription required
subscribesTo: ["client"]
```

#### 2. Qualified Prefix Handling

```typescript
// ❌ Not inferred - "record" is a qualified prefix
selectProps: "record.client.name"

// ✅ "client" is inferred
selectProps: "client.name"
```

#### 3. Multi-field When Objects

```typescript
// ✅ All fields are extracted
{ when: { email: true, name: true }, disabled: true }
// → ["email", "name"]
```

#### 4. String Literal Content is Ignored

```typescript
// ❌ "target-on" is not inferred (it's in a string)
selectProps: 'signed ? "target-on" : "target-off"'
// → ["signed"] only
```

#### 5. Unique Field Names Only

Returns `["client", "signed"]` even if multiple sources reference the same field.

**Benefit**: Ensures efficient subscription without duplicates.

---

## 5. Performance Considerations

- The hook uses `useMemo` with dependencies on all source props
- Field inference is pure function with no side effects
- Avoid re-running inference unless sources actually change
- Empty conditions/props arrays return early to prevent unnecessary work

**Benefit**: This hook is fundamental to the reactive system, enabling automatic field subscriptions while maintaining performance isolation between form fields.

---

## 6. Integration with P2.M1.T1.S2

### For useConditions Two-Pass Evaluation

The `useInferredInputs` hook continues to work as before:

```typescript
// Pass 1: No changes - same inference pattern
const watchFields = useInferredInputs({
  conditions,
  subscribesTo,
});

// watchFields used in all three passes
// Pass 1: baseFieldStates
// Pass 2: disabledStates
// Pass 3: final fieldStates merge
```

### Key Points

1. **No changes required** to `useInferredInputs` for P2.M1.T1.S2
2. **Same watchFields** used across all passes of two-pass evaluation
3. **Isolated subscriptions** maintained for performance
4. **Field inference** works identically for disabled state computation

---

## 7. Summary

The `useInferredInputs` hook is a well-designed dependency inference system that:

1. **Automatically determines** which fields to watch from multiple sources
2. **Prevents cascading re-renders** through isolated subscriptions
3. **Handles complex expressions** via regex-based field extraction
4. **Supports explicit subscriptions** via `subscribesTo` parameter
5. **Returns unique field names** to avoid duplicate subscriptions

For P2.M1.T1.S2, this hook requires no changes - it continues to provide the list of fields to watch, and the two-pass evaluation uses this list for building field states with disabled property.
