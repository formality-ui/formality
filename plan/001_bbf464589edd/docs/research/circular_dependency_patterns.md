# Research: Circular Dependency Patterns in Form Systems

## Executive Summary

This research documents how major form libraries handle circular dependencies in field state evaluation, with specific focus on patterns applicable to Formality UI's challenge: enabling the `isDisabled` matcher in conditions without creating infinite loops.

---

## The Formality UI Circular Dependency Challenge

```
┌─────────────────────────────────────────────────────────────┐
│                     THE PROBLEM                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User wants:                                                 │
│  { when: { field1: { isDisabled: true } }, disabled: true } │
│                                                              │
│  This creates a cycle:                                       │
│  ┌─────────────────────────────────────────────────┐        │
│  │                                                  │        │
│  │  field2.conditions → needs field1.disabled       │        │
│  │         │                                        │        │
│  │         ▼                                        │        │
│  │  field1.disabled → comes from field1.conditions  │        │
│  │         │                                        │        │
│  │         ▼                                        │        │
│  │  field1.conditions → might need field2.state     │        │
│  │         │                                        │        │
│  │         └────────────────────────────────────────┘        │
│                    │                                         │
│                    ▼                                         │
│              INFINITE LOOP                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Pattern 1: Two-Pass Evaluation (RECOMMENDED)

### Concept

Evaluate the dependency graph in two passes:
- **Pass 1**: Compute all base states (excluding the cyclic property)
- **Pass 2**: Compute the cyclic property using Pass 1 results

### Application to isDisabled Matcher

```typescript
// ============================================================================
// THE CYCLE
// ============================================================================
// isDisabled matcher needs: fieldState.disabled
// fieldState.disabled comes from: condition evaluation
// condition evaluation uses: isDisabled matcher
// → INFINITE LOOP

// ============================================================================
// THE SOLUTION: Two-Pass Evaluation
// ============================================================================

// PASS 1: Build field states WITHOUT disabled property
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
      isValidating: false,
      // ❌ NO disabled property
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);

// PASS 2: Compute disabled using PASS 1 states
const disabledStates = useMemo(() => {
  const disabled: Record<string, boolean> = {};

  watchFields.forEach((fieldName) => {
    const result = evaluateConditions({
      conditions: fieldConditions[fieldName],
      fieldValues,
      fieldStates: baseFieldStates, // ← Use Pass 1 (no disabled)
      record,
      props: { name: fieldName },
    });

    disabled[fieldName] = result.disabled ?? false;
  });

  return disabled;
}, [watchFields, fieldConditions, fieldValues, baseFieldStates, record]);

// PASS 3: Merge for final result
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

### Why This Works

```
┌─────────────────────────────────────────────────────────────┐
│              TWO-PASS BREAKS THE CYCLE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PASS 1: baseFieldStates = { value, touched, dirty, ... }   │
│          (NO disabled property)                              │
│                         │                                    │
│                         ▼                                    │
│  PASS 2: disabledStates = evaluateConditions(                │
│            fieldStates: baseFieldStates  ← Uses Pass 1       │
│          )                                                   │
│                         │                                    │
│                         ▼                                    │
│  PASS 3: fieldStates = merge(baseFieldStates, disabledStates)│
│          (NOW has disabled property)                         │
│                                                              │
│  Next render: Same pattern, using fresh Pass 1 states        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Insight

**Pass 1 states don't have disabled**, so conditions evaluated in Pass 2 can't check `isDisabled` matcher for those states. But that's OK because:
- Pass 2 is computing disabled for each field
- It uses Pass 1 states (without disabled) as input
- This breaks the cycle while still computing correct disabled values

---

## Pattern 2: Fixed-Point Iteration

### Concept

Iteratively evaluate until convergence (values stop changing).

```typescript
let fieldStates = initialStates;
let changed = true;
let iterations = 0;
const MAX_ITERATIONS = 10;

while (changed && iterations < MAX_ITERATIONS) {
  const newStates = { ...fieldStates };

  for (const field of watchFields) {
    const result = evaluateConditions({
      conditions: fieldConditions[field],
      fieldValues,
      fieldStates: newStates, // Use current iteration's states
      record,
      props: { name: field },
    });

    newStates[field] = {
      ...newStates[field],
      disabled: result.disabled ?? false,
    };
  }

  changed = JSON.stringify(newStates) !== JSON.stringify(fieldStates);
  fieldStates = newStates;
  iterations++;
}

if (iterations >= MAX_ITERATIONS) {
  console.warn('Disabled state evaluation did not converge');
}
```

### Pros and Cons

**Pros**:
- Can handle complex multi-field dependencies
- Detects when evaluation doesn't converge

**Cons**:
- More complex implementation
- Potential performance impact with many fields
- Harder to reason about

---

## Pattern 3: Topological Sort

### Concept

Order fields by dependency, then evaluate in order.

```typescript
// Build dependency graph
const graph = new Map<string, Set<string>>();

for (const field of watchFields) {
  const dependencies = extractFieldDependencies(
    fieldConditions[field]
  );
  graph.set(field, new Set(dependencies));
}

// Topological sort (Kahn's algorithm)
const sortedFields = topologicalSort(graph);

// Evaluate in sorted order
const fieldStates: Record<string, FieldStateInput> = {};

for (const field of sortedFields) {
  const fieldState = methods.getFieldState(field as any);
  fieldStates[field] = {
    value: fieldValues[field],
    isTouched: fieldState.isTouched,
    isDirty: fieldState.isDirty,
    error: fieldState.error,
    invalid: fieldState.invalid,
    isValidating: false,
  };
}

// Add disabled in topological order
for (const field of sortedFields) {
  const result = evaluateConditions({
    conditions: fieldConditions[field],
    fieldValues,
    fieldStates, // Includes disabled of previously evaluated fields
    record,
    props: { name: field },
  });

  fieldStates[field].disabled = result.disabled ?? false;
}
```

### Pros and Cons

**Pros**:
- Efficient (single pass in correct order)
- Detects cycles explicitly

**Cons**:
- Requires dependency extraction from conditions
- More complex implementation
- May need to handle circular dependency errors

---

## Pattern 4: Limit Condition Depth

### Concept

Restrict conditions from referencing computed properties.

```typescript
// When evaluating conditions for disabled state
// Build field states WITHOUT disabled property
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
      // ❌ NO disabled property - prevents circular dependency
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);
```

### What This Means

- ✅ You can check `field.value`, `field.isTouched`, `field.error`, etc.
- ✅ You can use `isValid` matcher (uses `invalid` and `error`)
- ❌ You **cannot** use `isDisabled` matcher (requires `disabled` property)

### Pros and Cons

**Pros**:
- Simple implementation
- No circular dependency possible

**Cons**:
- Limits condition expressiveness
- `isDisabled` matcher doesn't work for cross-field conditions

---

## Pattern 5: Global State Computation

### Concept

Compute ALL field states (including disabled) at form level, not per-field.

```typescript
// At Form component level
const allFieldStates = useMemo(() => {
  // Compute disabled for ALL fields in one pass
  const disabled: Record<string, boolean> = {};

  // First, compute all disabled states
  for (const field of allFieldNames) {
    const result = evaluateConditions({
      conditions: fieldConfig[field].conditions,
      fieldValues,
      fieldStates: baseFieldStates, // Without disabled
      record,
      props: { name: field },
    });

    disabled[field] = result.disabled ?? false;
  }

  // Then, merge with base states
  return Object.entries(baseFieldStates).reduce(
    (acc, [name, state]) => {
      acc[name] = {
        ...state,
        disabled: disabled[name],
      };
      return acc;
    },
    {} as Record<string, FieldStateInput>
  );
}, [fieldValues, fieldConfig, record]);

// Provide via context
<FormContext value={{ allFieldStates }}>
  {children}
</FormContext>
```

### Pros and Cons

**Pros**:
- Single source of truth
- Full field state available everywhere

**Cons**:
- Requires significant architecture change
- All field states computed on any field change

---

## Comparison Table

| Pattern | Complexity | Performance | Expressiveness | Recommended |
|---------|-----------|--------------|----------------|-------------|
| Two-Pass Evaluation | Low | High | Medium | ✅ YES |
| Fixed-Point Iteration | Medium | Medium | High | ⚠️ Maybe |
| Topological Sort | High | High | High | ⚠️ Maybe |
| Limit Condition Depth | Low | High | Low | ❌ No |
| Global State Computation | High | Low | High | ❌ No |

---

## Recommendation: Two-Pass Evaluation

### Why Two-Pass is Best for Formality UI

1. **Simplicity**: Straightforward implementation with clear separation of concerns
2. **Performance**: O(n) complexity with proper memoization
3. **Expressiveness**: Enables `isDisabled` matcher without infinite loops
4. **Maintainability**: Easy to understand and debug
5. **React Best Practices**: Uses `useMemo` correctly, follows derived state patterns

### Implementation Checklist

- [ ] Pass 1: Build `baseFieldStates` without disabled property
- [ ] Pass 2: Compute `disabledStates` using `evaluateConditions` with Pass 1 states
- [ ] Pass 3: Merge `baseFieldStates` + `disabledStates` into final `fieldStates`
- [ ] Correct `useMemo` dependencies (Pass 2 → Pass 1, Pass 3 → Pass 1 + Pass 2)
- [ ] No Rules of Hooks violations (use `evaluateConditions`, not `useFieldDisabledState`)
- [ ] Handle edge cases (empty arrays, undefined values)

---

## Example: Circular Dependency Scenario

### The Scenario

```typescript
// Field configuration
const config = {
  field1: {
    conditions: [
      {
        when: { field2: { isDisabled: true } },
        disabled: true,
      },
    ],
  },
  field2: {
    conditions: [
      {
        when: { field1: { value: 'disable' } },
        disabled: true,
      },
    ],
  },
};
```

### The Cycle

1. `field1.disabled` needs to know `field2.disabled` (via `isDisabled` matcher)
2. `field2.disabled` depends on `field1.value` (no dependency on `field1.disabled`)

### Two-Pass Resolution

```
Initial state:
  field1: { value: 'disable', touched: false, dirty: false, ... }
  field2: { value: null, touched: false, dirty: false, ... }

PASS 1: baseFieldStates (no disabled)
  field1: { value: 'disable', touched: false, dirty: false, ... }
  field2: { value: null, touched: false, dirty: false, ... }

PASS 2: Compute disabled using baseFieldStates
  field1.conditions: when(field2.isDisabled === true) → field2.disabled is undefined → false
  field1.disabled = false

  field2.conditions: when(field1.value === 'disable') → true
  field2.disabled = true

PASS 3: Merge
  field1: { value: 'disable', ..., disabled: false }
  field2: { value: null, ..., disabled: true }

Result: field1 is enabled, field2 is disabled ✅
```

---

## Gotchas and Edge Cases

### 1. Self-Referencing Conditions

```typescript
{
  when: { field1: { isDisabled: true } },  // References itself!
  disabled: true,
}
```

**Two-Pass Resolution**: Pass 1 `field1` has no `disabled`, so `isDisabled` matcher returns `false`. Field becomes enabled (correct behavior).

### 2. Circular Chain

```typescript
// field1 references field2, field2 references field1
field1: { when: { field2: { isDisabled: true } }, disabled: true }
field2: { when: { field1: { isDisabled: true } }, disabled: true }
```

**Two-Pass Resolution**:
- Pass 1: Neither has `disabled`
- Pass 2: Both evaluate `isDisabled` as `false` (undefined in Pass 1)
- Result: Both fields enabled (stable state, no infinite loop)

### 3. Empty Conditions

```typescript
field1: { conditions: [] }
```

**Two-Pass Resolution**:
- Pass 2: `evaluateConditions` returns `{ disabled: undefined, hasDisabledCondition: false }`
- Convert to `false`: `result.disabled ?? false`
- Result: Field enabled (correct)

---

## References

### External Documentation

- [React Derived State](https://react.dev/learn/you-might-not-need-an-effect)
- [React useMemo](https://react.dev/reference/react/useMemo)
- [Circular Dependency Detection](https://en.wikipedia.org/wiki/Cycle_detection)

### Internal Documentation

- [useFieldDisabledState Hook](/home/dustin/projects/formality/packages/react/src/hooks/useFieldDisabledState.ts)
- [useConditions Hook](/home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts)
- [Condition Evaluation](/home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts)
