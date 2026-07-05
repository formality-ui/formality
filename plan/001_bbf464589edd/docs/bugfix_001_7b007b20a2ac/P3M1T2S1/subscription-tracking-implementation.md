# Research: Subscription Tracking Implementation Analysis

**Work Item**: P3.M1.T2.S1 - Test unmount cleanup
**Research Date**: 2026-01-13

## Summary

This document analyzes the subscription tracking implementation in Formality to understand what needs to be tested for complete cleanup verification.

## 1. Data Structures Used

### Inverted Subscriptions Map (Form.tsx, line 180)

```typescript
const invertedSubscriptions = useRef(new Map<string, Set<string>>());
```

- **Structure**: Map of target field names → Set of subscriber field names
- **Purpose**: Creates an inverted index (target → subscribers)
- **Key**: Target field name being watched
- **Value**: Set of fields that are watching this target

### Run Tracking References (useSubscriptions.ts, lines 36-40)

```typescript
const runIdRef = useRef<number>(0);
const runSubscriptionsRef = useRef<Map<number, string[]>>(new Map());
```

- **runIdRef**: Auto-incrementing counter for effect runs
- **runSubscriptionsRef**: Map of run ID → subscriptions array for that specific run

## 2. Subscription Management Functions

### addSubscription(target, subscriber) (Form.tsx, lines 212-230)

```typescript
const addSubscription = useCallback((target: string, subscriber: string) => {
  // Update inverted index
  if (!invertedSubscriptions.current.has(target)) {
    invertedSubscriptions.current.set(target, new Set());
  }
  invertedSubscriptions.current.get(target)!.add(subscriber);

  // Notify target field if mounted
  const setter = watcherSetters.current.get(target);
  if (setter) {
    setter((prev) => ({ ...prev, [subscriber]: true }));
  } else {
    // Queue for later
    if (!pendingWatcherUpdates.current.has(target)) {
      pendingWatcherUpdates.current.set(target, new Set());
    }
    pendingWatcherUpdates.current.get(target)!.add(subscriber);
  }
}, []);
```

### removeSubscription(target, subscriber) (Form.tsx, lines 232-246)

```typescript
const removeSubscription = useCallback((target: string, subscriber: string) => {
  invertedSubscriptions.current.get(target)?.delete(subscriber);

  const setter = watcherSetters.current.get(target);
  if (setter) {
    setter((prev) => {
      const next = { ...prev };
      delete next[subscriber];
      return next;
    });
  }
}, []);
```

## 3. Per-Effect Tracking Mechanism (useSubscriptions.ts, lines 42-71)

```typescript
useEffect(() => {
  // Increment run ID for this effect invocation
  const currentRunId = ++runIdRef.current;

  // CRITICAL: Store subscriptions for THIS specific effect run
  runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

  // Add all subscriptions
  subscriptions.forEach((target) => {
    addSubscription(target, fieldName);
  });

  // Cleanup only removes subscriptions added in THIS run
  return () => {
    // Get subscriptions for THIS specific run
    const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId);

    if (thisRunSubscriptions) {
      // LIFO cleanup (Last In, First Out)
      [...thisRunSubscriptions].reverse().forEach((target) => {
        removeSubscription(target, fieldName);
      });

      // CRITICAL: Clean up tracking map to prevent memory leaks
      runSubscriptionsRef.current.delete(currentRunId);
    }
  };
}, [fieldName, subscriptions, addSubscription, removeSubscription]);
```

## 4. Key Implementation Details

### Execution Version Ref (Form.tsx, line 196)

```typescript
const executionVersionRef = useRef(0);
```

- Used in auto-save to prevent stale saves
- Incremented before async operations, checked after to abort stale executions

### Pending Updates (Form.tsx, lines 185-186)

```typescript
const pendingWatcherUpdates = useRef(new Map<string, Set<string>>());
```

- Handles subscription updates for fields not yet mounted
- Queues subscriptions until the target field mounts

### Watcher Setters (Form.tsx, line 183)

```typescript
const watcherSetters = useRef(new Map<string, WatcherSetterFn>());
```

- Stores React state setters for each field's watchers
- Used to notify fields about who is watching them

## 5. What Needs to Be Tested for Complete Cleanup Verification

### Data Structures to Check

1. **invertedSubscriptions**: Should be empty after unmount
2. **runSubscriptionsRef**: Should be empty after cleanup
3. **pendingWatcherUpdates**: Should not contain subscriptions for unmounted fields
4. **watcherSetters**: Should not contain setters for unmounted fields

### Function Signatures to Test

1. `addSubscription(target, subscriber)` - adds subscription correctly
2. `removeSubscription(target, subscriber)` - removes subscription correctly
3. `registerWatcherSetter(name, setter)` - registers setter
4. `unregisterWatcherSetter(name)` - removes setter

### Cleanup Mechanisms

1. **Per-Effect Cleanup**: Only subscriptions from current effect run are removed
2. **LIFO Order**: Dependencies are cleaned up in reverse order
3. **Tracking Map Cleanup**: `runSubscriptionsRef` entries are deleted
4. **Watcher Setters**: Cleaned up when fields unmount

### Edge Cases to Test

1. **Multiple Effects**: Multiple useEffect calls in same component
2. **Rapid Changes**: Rapid subscription changes don't cause double-cleanup
3. **Unmount During Subscription**: Unmounting while subscriptions are being added
4. **Circular Subscriptions**: Fields that watch each other
5. **No Subscriptions**: Component with no subscriptions still cleans up properly

## 6. Critical Files

### Primary Files

- `/home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts`
- `/home/dustin/projects/formality/packages/react/src/components/Form.tsx`

### Test Files

- `/home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx`
- `/home/dustin/projects/formality/packages/react/src/__tests__/setup.ts`

## 7. Contract Dependencies from P3.M1.T1.S2

The P3.M1.T1.S2 PRP adds:

- Development logging for subscription lifecycle events
- Double-cleanup detection with warnings
- These will be tested in P3.M1.T2.S1
