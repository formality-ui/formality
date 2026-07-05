# useEffect Cleanup Best Practices for Subscription Tracking

## Overview

This document compiles best practices for React useEffect subscription tracking and per-effect cleanup strategies, specifically applied to preventing memory leaks in the `useSubscriptions` hook.

## The Core Problem

### "Cleanup Removes Too Many Subscriptions"

When a useEffect's cleanup function runs, it typically has access to the closure variables from when the effect was created. However, when subscriptions change and the effect re-runs:

1. **Effect Run N** creates subscriptions `['A', 'B']` and stores them in cleanup closure
2. **Subscriptions change** to `['A', 'C']`
3. **Effect Run N cleanup** runs, removing `['A', 'C']` (the NEW current value!)
4. **Effect Run N+1** adds subscriptions `['A', 'C']`
5. **Result:** Subscription 'C' was removed and re-added unnecessarily

### React 18 Strict Mode Complication

React 18's Strict Mode double-invocation exacerbates this:

1. **Mount:** Effect runs, adds subscriptions
2. **Unmount (Strict Mode):** Cleanup runs, removes subscriptions
3. **Mount (Strict Mode):** Effect runs again, adds subscriptions
4. **Unmount:** Cleanup runs again

If timing is unlucky, cleanup from run 1 can remove subscriptions from run 2.

## Solution Patterns

### Pattern 1: Per-Effect Run Tracking with Incrementing IDs

**When to use:** When you need to track which subscriptions were added in each specific effect invocation.

**Implementation:**

```typescript
export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  // Track the current effect run ID
  const effectRunIdRef = useRef<number>(0);
  const subscriptionsMapRef = useRef<Map<number, string[]>>(new Map());

  useEffect(() => {
    // Increment run ID for this effect invocation
    const currentRunId = ++effectRunIdRef.current;

    // Store subscriptions for this specific run
    subscriptionsMapRef.current.set(currentRunId, [...subscriptions]);

    // Add subscriptions
    subscriptions.forEach((target) => {
      addSubscription(target, fieldName);
    });

    // Cleanup only removes subscriptions from THIS run
    return () => {
      const runSubscriptions = subscriptionsMapRef.current.get(currentRunId);
      if (runSubscriptions) {
        runSubscriptions.forEach((target) => {
          removeSubscription(target, fieldName);
        });
        subscriptionsMapRef.current.delete(currentRunId);
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
```

**Why this works:**

- Each effect run gets a unique ID
- Subscriptions are stored in a Map keyed by run ID
- Cleanup only accesses subscriptions from its own run ID
- Map cleanup prevents memory leaks

**Caveats:**

- Multiple effect runs can exist simultaneously during Strict Mode
- Map must be cleaned up to prevent memory growth
- Run ID counter grows indefinitely (but practically never overflows)

### Pattern 2: Using Symbol for Unique Run Identification

**When to use:** When you want guaranteed unique identifiers without counter management.

**Implementation:**

```typescript
export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  const runSubscriptionsRef = useRef<Map<symbol, string[]>>(new Map());

  useEffect(() => {
    // Create a unique symbol for this effect run
    const runKey = Symbol("useSubscriptions-run");

    // Store subscriptions for this run
    runSubscriptionsRef.current.set(runKey, [...subscriptions]);

    // Add subscriptions
    subscriptions.forEach((target) => {
      addSubscription(target, fieldName);
    });

    return () => {
      const runSubscriptions = runSubscriptionsRef.current.get(runKey);
      if (runSubscriptions) {
        runSubscriptions.forEach((target) => {
          removeSubscription(target, fieldName);
        });
        runSubscriptionsRef.current.delete(runKey);
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
```

**Why this works:**

- Symbols are guaranteed unique
- No counter management needed
- Automatic garbage collection when symbols are discarded

**Caveats:**

- Slightly less explicit than numeric IDs
- Can't be serialized (but not needed here)

### Pattern 3: LIFO Cleanup Ordering

**When to use:** When subscriptions have dependencies and cleanup order matters.

**Implementation:**

```typescript
export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  const runIdRef = useRef(0);
  const runSubscriptionsRef = useRef<Map<number, string[]>>(new Map());

  useEffect(() => {
    const currentRunId = ++runIdRef.current;

    runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

    subscriptions.forEach((target) => {
      addSubscription(target, fieldName);
    });

    return () => {
      const thisRunSubscriptions =
        runSubscriptionsRef.current.get(currentRunId);

      if (thisRunSubscriptions) {
        // LIFO cleanup - reverse order
        [...thisRunSubscriptions].reverse().forEach((target) => {
          removeSubscription(target, fieldName);
        });

        runSubscriptionsRef.current.delete(currentRunId);
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
```

**Why LIFO (Last In, First Out):**

- If subscription B depends on subscription A, cleanup B before A
- More natural for dependency hierarchies
- Prevents "cleanup during cleanup" issues

### Pattern 4: React 18 Strict Mode Safe with Active Run Tracking

**When to use:** When you need explicit tracking of which runs are still active.

**Implementation:**

```typescript
export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  const runIdRef = useRef(0);
  const activeRunsRef = useRef<Set<number>>(new Set());
  const runSubscriptionsRef = useRef<Map<number, string[]>>(new Map());

  useEffect(() => {
    const currentRunId = ++runIdRef.current;
    activeRunsRef.current.add(currentRunId);

    runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

    subscriptions.forEach((target) => {
      addSubscription(target, fieldName);
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[useSubscriptions] Run ${currentRunId}: Added`,
        subscriptions,
      );
    }

    return () => {
      // Only cleanup if this run is still active
      if (activeRunsRef.current.has(currentRunId)) {
        const thisRunSubscriptions =
          runSubscriptionsRef.current.get(currentRunId);

        if (thisRunSubscriptions) {
          thisRunSubscriptions.forEach((target) => {
            removeSubscription(target, fieldName);
          });

          runSubscriptionsRef.current.delete(currentRunId);
        }

        activeRunsRef.current.delete(currentRunId);

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[useSubscriptions] Run ${currentRunId}: Cleaned up`,
            thisRunSubscriptions,
          );
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[useSubscriptions] Run ${currentRunId}: Skipped cleanup (already cleaned)`,
          );
        }
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
```

**Why this works:**

- Active runs Set prevents double-cleanup in Strict Mode
- Development logging helps debug subscription lifecycle
- Cleanup is idempotent (can run multiple times safely)

## Best Practices Summary

### 1. Always Track Per-Effect Subscriptions

**❌ Anti-pattern:**

```typescript
useEffect(() => {
  subscriptions.forEach(add);
  return () => subscriptions.forEach(remove); // Uses current subscriptions!
}, [subscriptions]);
```

**✅ Correct:**

```typescript
useEffect(() => {
  const runId = ++runIdRef.current;
  runMap.set(runId, [...subscriptions]);

  subscriptions.forEach(add);

  return () => {
    const subs = runMap.get(runId);
    if (subs) subs.forEach(remove);
    runMap.delete(runId);
  };
}, [subscriptions]);
```

### 2. Use Unique Identifiers for Each Effect Run

Options:

- **Incrementing counter** - Simple, explicit, most common
- **Symbol** - Guaranteed unique, no counter management
- **WeakMap with object keys** - Automatic GC, but less explicit

### 3. Handle React 18 Strict Mode

- Expect double-invocation in development
- Make cleanup idempotent
- Use active run tracking if needed
- Add development logging for debugging

### 4. Consider Cleanup Ordering

- Use LIFO (reverse order) for dependent subscriptions
- Test rapid subscription changes
- Verify no orphaned subscriptions

### 5. Clean Up Tracking Data

- Delete Map entries after cleanup
- Prevent memory leaks from tracking structures
- Don't let tracking maps grow indefinitely

### 6. Add Development Logging

For debugging subscription lifecycle:

```typescript
if (process.env.NODE_ENV === "development") {
  console.log(
    `[useSubscriptions:${fieldName}] Run ${runId} START`,
    subscriptions,
  );
}

// ... in cleanup
if (process.env.NODE_ENV === "development") {
  console.log(
    `[useSubscriptions:${fieldName}] Run ${runId} CLEANUP`,
    subscriptions,
  );
}
```

### 7. Test Edge Cases

- **Empty subscriptions array** - should handle gracefully
- **Duplicate subscriptions** - should deduplicate or handle
- **Rapid subscription changes** - should not leak
- **Component unmount during effect execution** - should cleanup correctly
- **Multiple fields subscribing to same target** - should track independently

## Recommended Implementation for Formality

Based on codebase patterns and best practices, the recommended implementation for `useSubscriptions`:

```typescript
export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  // Track per-effect subscriptions to prevent over-cleanup
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
      const thisRunSubscriptions =
        runSubscriptionsRef.current.get(currentRunId);

      if (thisRunSubscriptions) {
        // LIFO cleanup - reverse order for dependencies
        [...thisRunSubscriptions].reverse().forEach((target) => {
          removeSubscription(target, fieldName);
        });

        // Clean up tracking map
        runSubscriptionsRef.current.delete(currentRunId);
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
```

This implementation:

- ✅ Tracks subscriptions per effect run
- ✅ Prevents cleanup from removing subscriptions from other runs
- ✅ Uses LIFO ordering for safe cleanup
- ✅ Handles React 18 Strict Mode double-invocation
- ✅ Cleans up tracking data to prevent memory leaks
- ✅ Maintains the same external API
- ✅ Follows existing codebase patterns (similar to `executionVersionRef`)

## Additional Considerations

### Memory Leak Prevention

1. **Map cleanup:** Always `delete` Map entries after cleanup
2. **Ref growth:** Run ID counter grows but practically never overflows
3. **Circular references:** Avoid storing component references in Maps

### Performance

1. **Map operations:** O(1) for get/set/delete
2. **Array spread:** `[...subscriptions]` creates a copy - necessary for isolation
3. **LIFO iteration:** `[...subs].reverse()` creates temporary array - acceptable for typical subscription counts

### TypeScript Types

```typescript
// Type for tracking subscriptions per effect run
type RunSubscriptionsMap = Map<number, string[]>;

// Type for tracking active runs (optional, for Strict Mode safety)
type ActiveRunsSet = Set<number>;
```
