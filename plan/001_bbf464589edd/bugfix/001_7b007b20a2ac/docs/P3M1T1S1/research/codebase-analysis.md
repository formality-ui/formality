# Codebase Analysis: Per-Effect Subscription Tracking

## Overview

This document summarizes the research findings on useEffect subscription tracking patterns in the Formality codebase, focusing on the memory leak prevention issue in the `useSubscriptions` hook.

## Current Implementation Analysis

### File: `packages/react/src/hooks/useSubscriptions.ts`

**Current Implementation (Lines 28-70):**

```typescript
export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  // Track previous subscriptions to properly cleanup on change
  const prevSubscriptionsRef = useRef<string[]>([]);

  useEffect(() => {
    const prevSubscriptions = prevSubscriptionsRef.current;

    // Find subscriptions to remove (in prev but not in current)
    const toRemove = prevSubscriptions.filter(
      (target) => !subscriptions.includes(target),
    );

    // Find subscriptions to add (in current but not in prev)
    const toAdd = subscriptions.filter(
      (target) => !prevSubscriptions.includes(target),
    );

    // Remove old subscriptions
    toRemove.forEach((target) => {
      removeSubscription(target, fieldName);
    });

    // Add new subscriptions
    toAdd.forEach((target) => {
      addSubscription(target, fieldName);
    });

    // Update ref for next comparison
    prevSubscriptionsRef.current = subscriptions;

    // Cleanup on unmount - remove all current subscriptions
    return () => {
      subscriptions.forEach((target) => {
        removeSubscription(target, fieldName);
      });
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
```

### Identified Problem

**Lines 63-68: Cleanup removes ALL current subscriptions**

The cleanup function removes all subscriptions from the current `subscriptions` array. This causes issues when:

1. The effect re-runs multiple times in quick succession
2. React 18 Strict Mode double-invocation causes mount → unmount → mount
3. The cleanup from a previous effect run removes subscriptions added by a newer run

**Specific Issue:**

- When the cleanup function runs, it uses the current `subscriptions` closure value
- If the effect has re-run, the `subscriptions` value may have changed
- The cleanup removes subscriptions that might have been added by a NEWER effect run
- This causes "over-cleanup" - removing subscriptions that should still be active

## Similar Patterns in Codebase

### 1. Execution Version Tracking (`Form.tsx`)

**File:** `packages/react/src/components/Form.tsx`
**Lines:** 195-196, 496-529

**Pattern:** Using an incrementing version number to detect stale operations

```typescript
const executionVersionRef = useRef(0);

const waitForFieldValidation = useCallback(
  async (fields: string[], version: number): Promise<boolean> => {
    // ...
    if (executionVersionRef.current !== version) {
      return false; // Abort - new changes came in
    }
    // ...
  },
  [],
);

const executeAutoSave = useCallback(async () => {
  executionVersionRef.current++;
  const executionVersion = executionVersionRef.current;

  // ... later check if version changed
  if (executionVersionRef.current !== executionVersion) {
    return; // Abort - new changes came in
  }
}, [methods, handleSubmit, waitForFieldValidation]);
```

**Key Insight:** Using an incrementing counter to track operation versions and detect staleness.

### 2. Method Reference Pattern (`Field.tsx`)

**File:** `packages/react/src/components/Field.tsx`
**Lines:** 145-148, 247-262

**Pattern:** Storing methods in refs to avoid dependency issues

```typescript
const setValueRef = useRef(methods.setValue);
setValueRef.current = methods.setValue;

useEffect(() => {
  if (effectiveSetValue.hasCondition && effectiveSetValue.value !== undefined) {
    const currentValue = getValuesRef.current(name);
    if (currentValue !== effectiveSetValue.value) {
      setValueRef.current(name, effectiveSetValue.value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: false,
      });
    }
  }
}, [effectiveSetValue.hasCondition, effectiveSetValue.value, name]);
```

**Key Insight:** Using refs to maintain stable references across effect runs.

### 3. Debounce Cleanup Pattern (`Form.tsx`)

**File:** `packages/react/src/components/Form.tsx`
**Lines:** 534-567

**Pattern:** Proper cleanup of debounced functions

```typescript
useEffect(() => {
  if (debounceMs === false) {
    const immediateFn = Object.assign(
      () => {
        executeAutoSave();
      },
      {
        cancel: () => {},
        flush: () => executeAutoSave(),
        pending: () => false,
      },
    ) as DebouncedFunction;

    debouncedSubmitRef.current = immediateFn;

    return () => {
      // No cleanup needed for immediate function
    };
  }

  const debouncedFn = debounce(() => {
    executeAutoSave();
  }, debounceMs);

  const fn = Object.assign(debouncedFn, {
    pending: () => false,
  }) as DebouncedFunction;

  debouncedSubmitRef.current = fn;

  return () => {
    debouncedFn.cancel();
  };
}, [executeAutoSave, debounceMs]);
```

**Key Insight:** Cleanup only cancels operations created in the current effect run.

## Subscription Management Architecture

### Form-Level Subscription Tracking

**File:** `packages/react/src/components/Form.tsx`
**Lines:** 179-186, 212-270

The Form component maintains:

1. `invertedSubscriptions` - inverted index mapping target → subscribers
2. `watcherSetters` - functions to notify fields about their subscribers
3. `pendingWatcherUpdates` - updates for fields not yet mounted

**Subscription Operations:**

- `addSubscription(target, subscriber)` - Registers a subscription
- `removeSubscription(target, subscriber)` - Removes a subscription
- `registerWatcherSetter(name, setter)` - Registers a field's watcher state setter
- `getAffectedFields(changedField)` - Traverses subscription graph to find dependents

## Related Files

| File                                            | Purpose                                      | Lines of Interest |
| ----------------------------------------------- | -------------------------------------------- | ----------------- |
| `packages/react/src/hooks/useSubscriptions.ts`  | Subscription management hook                 | 28-70             |
| `packages/react/src/components/Field.tsx`       | Field component using subscriptions          | 180-194, 247-262  |
| `packages/react/src/components/Form.tsx`        | Form-level subscription registry             | 179-297           |
| `packages/react/src/context/FormContext.tsx`    | Form context with subscription methods       | -                 |
| `packages/react/src/hooks/useInferredInputs.ts` | Hook inferring subscriptions from conditions | -                 |

## Key Findings

1. **No Per-Effect Tracking:** Current implementation uses a single ref to track previous subscriptions, not per-effect tracking.

2. **Over-Cleanup Issue:** Cleanup function removes all current subscriptions, not just those added in the current effect run.

3. **Existing Version Tracking Pattern:** The codebase already uses incrementing IDs for version tracking in auto-save logic.

4. **React 18 Strict Mode:** No handling for double-invocation scenario (mount → unmount → mount).

5. **No Direct Subscription Tests:** Subscription behavior is only tested indirectly through integration tests.

## Recommended Implementation Pattern

Based on the codebase analysis, the per-effect tracking should:

1. **Use incrementing run IDs** (similar to `executionVersionRef` pattern)
2. **Store subscriptions per run** in a Map
3. **Cleanup only the current run's subscriptions**
4. **Clean up tracking data** to prevent memory leaks

```typescript
const runIdRef = useRef(0);
const runSubscriptionsRef = useRef<Map<number, string[]>>(new Map());

useEffect(() => {
  const currentRunId = ++runIdRef.current;

  // Store subscriptions for THIS specific effect run
  runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

  // Add all subscriptions
  subscriptions.forEach((target) => {
    addSubscription(target, fieldName);
  });

  // Cleanup only removes subscriptions added in THIS run
  return () => {
    const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId);

    if (thisRunSubscriptions) {
      thisRunSubscriptions.forEach((target) => {
        removeSubscription(target, fieldName);
      });

      // Clean up tracking map
      runSubscriptionsRef.current.delete(currentRunId);
    }
  };
}, [fieldName, subscriptions, addSubscription, removeSubscription]);
```
