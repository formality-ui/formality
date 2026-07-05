# Two-Pass Evaluation Research for Circular Dependency Resolution

## Overview

This document summarizes research on two-pass evaluation patterns for resolving circular dependencies in condition evaluation systems, specifically for the Formality UI form library.

---

## The Circular Dependency Problem

In the Formality UI codebase:

1. **Conditions need disabled state**: The `isDisabled` matcher in conditions checks if a field is disabled
2. **Disabled comes from conditions**: The disabled state of a field is computed by evaluating its conditions
3. **This creates a cycle**: `conditions → disabled → conditions`

Without resolution, this causes infinite loops during condition evaluation.

---

## Pattern: Two-Pass Field State Building

### Concept

Build field states in two separate phases:

- **Pass 1**: Build base field states WITHOUT the computed property (disabled)
- **Pass 2**: Add the computed property using Pass 1 states as input
- **Pass 3** (optional): Merge Pass 1 and Pass 2 into final result

### Implementation Pattern

```typescript
// Pass 1: Base states (without disabled)
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
      // ❌ NO disabled property - this breaks the cycle
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);

// Pass 2: Compute disabled for each field
// IMPORTANT: Uses baseFieldStates (without disabled) to avoid circular dependency
const disabledStates = useMemo(() => {
  const disabled: Record<string, boolean> = {};

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

// Pass 3: Merge base states with disabled
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

### Key Insights

1. **Pass 1 states don't include disabled** - This is critical for breaking the cycle
2. **Pass 2 depends on Pass 1** - Correct dependency ordering ensures proper evaluation
3. **Each pass is memoized** - Prevents unnecessary recalculations
4. **No infinite loops** - Conditions evaluate using base states, never triggering re-evaluation

---

## Codebase References

### useFieldDisabledState Hook

**Location**: `/packages/react/src/hooks/useFieldDisabledState.ts`

This hook implements a similar three-pass pattern for priority resolution:

```typescript
// Pass 1: Non-conditional sources (prop, config)
const baseDisabled = useMemo(() => {
  if (disabledProp !== undefined) return disabledProp;
  if (fieldConfigDisabled !== undefined) return fieldConfigDisabled;
  return undefined;
}, [disabledProp, fieldConfigDisabled]);

// Pass 2: Condition evaluation (using base states)
const conditionResult = useMemo(() => {
  return evaluateConditions({
    conditions,
    fieldValues,
    fieldStates: baseFieldStates, // Pass 1 states
    record,
    props: { name: fieldName },
  });
}, [conditions, fieldValues, baseFieldStates, record]);

// Pass 3: Final priority resolution
const finalDisabled = useMemo(() => {
  if (baseDisabled !== undefined) return baseDisabled;
  if (conditionResult.hasDisabledCondition) return conditionResult.disabled;
  if (groupDisabled) return true;
  return false;
}, [baseDisabled, conditionResult, groupDisabled]);
```

### Current useConditions Hook

**Location**: `/packages/react/src/hooks/useConditions.ts` (lines 98-119)

Currently builds field states in a single pass without disabled:

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

**Note**: This becomes Pass 1 (baseFieldStates) in the two-pass implementation.

---

## External Research: React Derived State Patterns

### Official React Guidance

**Source**: [React - You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

**Key Principle**: Compute derived state during render rather than storing it in state.

```typescript
// ❌ WRONG: Storing derived state
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ RIGHT: Computing during render
const fullName = `${firstName} ${lastName}`;

// ✅ RIGHT: Expensive derivation with useMemo
const filteredItems = useMemo(() => {
  return items.filter((item) => item.active);
}, [items]);
```

**Application**: The `disabled` state should be computed using `useMemo`, not stored in component state.

---

## External Research: Circular Dependency Detection

### DFS with Recursion Stack Algorithm

For detecting circular dependencies in field subscriptions:

```typescript
class CircularDependencyDetector {
  private visiting = new Set<string>();
  private visited = new Set<string>();

  wouldCreateCycle(
    graph: Map<string, Set<string>>,
    target: string,
    subscriber: string,
  ): boolean {
    const tempGraph = this.cloneGraph(graph);
    if (!tempGraph.has(subscriber)) {
      tempGraph.set(subscriber, new Set());
    }
    tempGraph.get(subscriber)!.add(target);

    return this.hasCycle(tempGraph, subscriber);
  }

  private hasCycle(graph: Map<string, Set<string>>, start: string): boolean {
    if (this.visiting.has(start)) return true;
    if (this.visited.has(start)) return false;

    this.visiting.add(start);

    for (const neighbor of graph.get(start) || []) {
      if (this.hasCycle(graph, neighbor)) return true;
    }

    this.visiting.delete(start);
    this.visited.add(start);
    return false;
  }
}
```

**Application**: Can detect problematic `subscribesTo` configurations at runtime.

---

## Implementation Considerations

### Rules of Hooks Constraint

**Problem**: Cannot call hooks in loops

```typescript
// ❌ WRONG: Rules of Hooks violation
watchFields.forEach((fieldName) => {
  const isDisabled = useFieldDisabledState({ fieldName }); // Error!
});
```

**Solution**: Use pure functions (evaluateConditions) or restructure logic

```typescript
// ✅ RIGHT: Call evaluateConditions (pure function) in loop
watchFields.forEach((fieldName) => {
  const result = evaluateConditions({
    conditions,
    fieldValues,
    fieldStates: baseFieldStates,
    record,
    props: { name: fieldName },
  });
});
```

### useMemo Dependency Ordering

Critical for correct two-pass evaluation:

```typescript
// Pass 1: No dependencies on other passes
const baseFieldStates = useMemo(() => {
  /* ... */
}, [watchFields, fieldValues, methods]);

// Pass 2: MUST depend on Pass 1
const disabledStates = useMemo(() => {
  /* uses baseFieldStates */
}, [baseFieldStates /* ... */]);

// Pass 3: MUST depend on Pass 1 AND Pass 2
const fieldStates = useMemo(() => {
  /* merges baseFieldStates + disabledStates */
}, [baseFieldStates, disabledStates]);
```

### Performance Considerations

- Each pass creates a new object (not mutating previous states)
- Memoization prevents recalculations unless dependencies change
- Isolated subscriptions (useWatch) prevent cascading re-renders
- getFieldState() provides non-reactive access to field metadata

---

## Summary

Two-pass evaluation is the standard pattern for resolving circular dependencies where:

1. A computed value (disabled) depends on condition evaluation
2. Condition evaluation needs access to that computed value (isDisabled matcher)

The solution:

1. Build base states without the computed property
2. Compute the property using base states as input
3. Merge results into final states

This pattern is successfully used in `useFieldDisabledState` and should be applied to `useConditions` for consistent behavior.
