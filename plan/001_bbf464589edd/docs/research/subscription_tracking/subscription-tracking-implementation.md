# Subscription Tracking Implementation

## Overview

The `useSubscriptions` hook implements per-effect tracking to prevent memory leaks during rapid dependency changes.

## Core Implementation

### Per-Effect Tracking System

```typescript
// packages/react/src/hooks/useSubscriptions.ts

const runIdRef = useRef<number>(0);
const runSubscriptionsRef = useRef<Map<number, string[]>>(new Map());
```

**Key Components**:

- `runIdRef`: Increments on each effect run (unique ID per subscription batch)
- `runSubscriptionsRef`: Maps run ID to subscriptions array for that run

### Effect Run Tracking

```typescript
useEffect(() => {
  const currentRunId = ++runIdRef.current;
  runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

  subscriptions.forEach((target) => {
    addSubscription(target, fieldName);
  });

  return () => {
    const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId);

    if (thisRunSubscriptions) {
      // LIFO cleanup
      [...thisRunSubscriptions].reverse().forEach((target) => {
        removeSubscription(target, fieldName);
      });

      // CRITICAL: Clean up tracking map
      runSubscriptionsRef.current.delete(currentRunId);
    }
  };
}, [fieldName, subscriptions, addSubscription, removeSubscription]);
```

## Rapid Change Scenarios

### Scenario 1: Rapid Subscription Changes

When `subscriptions` prop changes rapidly:

1. Each change triggers a new effect run with new `currentRunId`
2. Previous effect's cleanup runs, removing old subscriptions
3. New effect adds new subscriptions
4. Each cleanup only affects its own subscriptions (per-effect isolation)

### Scenario 2: Rapid Field Name Changes

When `fieldName` changes rapidly:

1. Each change creates a new subscriber identity
2. Old subscriptions are cleaned up (old fieldName)
3. New subscriptions are added (new fieldName)
4. Risk: Multiple subscriptions to same target if cleanup doesn't complete

### Scenario 3: React 18 Strict Mode

- Effects run twice (mount → unmount → mount)
- Per-effect tracking ensures no over-cleanup
- Each mount gets its own run ID

## What Needs to Be Tested

### 1. Subscription Count Balance

- After rapid changes, subscription count should match final state
- No orphaned subscriptions from intermediate states
- `runSubscriptionsRef` Map should only have current run's entry

### 2. Memory Leak Detection

- `runSubscriptionsRef` should not accumulate entries
- Old run IDs should be deleted after cleanup
- No console warnings about memory leaks

### 3. Cleanup Verification

- Each cleanup should remove only its own subscriptions
- LIFO order should be maintained
- No double-cleanup errors

### 4. Performance (Optional)

- `performance.memory` if available to check for memory growth
- Subscription operations should complete within reasonable time

## Critical Implementation Details

1. **Line 48**: `runSubscriptionsRef.current.set(currentRunId, [...subscriptions])`
   - Creates array copy to prevent reference sharing

2. **Line 66**: `const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId)`
   - Gets only subscriptions for this run (isolation)

3. **Line 79**: `[...thisRunSubscriptions].reverse().forEach(...)`
   - LIFO cleanup for dependent subscriptions

4. **Line 84**: `runSubscriptionsRef.current.delete(currentRunId)`
   - CRITICAL: Prevents memory leak by removing tracking entry
