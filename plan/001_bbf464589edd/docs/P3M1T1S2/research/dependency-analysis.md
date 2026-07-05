# Subscription Dependency Analysis

## Overview

This document analyzes subscription dependency patterns in the Formality codebase to inform the implementation of dependency-aware cleanup ordering for P3.M1.T1.S2.

## Current Subscription Architecture

### Subscription Registry Structure

**Location**: `packages/react/src/components/Form.tsx:180`

```typescript
const invertedSubscriptions = useRef<Map<string, Set<string>>>(new Map());
```

**Data Structure**: `Map<string, Set<string>>`

- **Key**: Target field name (the field being watched)
- **Value**: Set of subscriber field names (fields watching the target)

**Example**: If field "firstName" subscribes to field "user":

```typescript
Map { 'user' => Set { 'firstName' } }
```

### Subscription Operations

**addSubscription(target, subscriber)**: Lines 212-230

- Registers a dependency: subscriber watches target
- Updates the invertedSubscriptions map
- Notifies target field about new subscriber

**removeSubscription(target, subscriber)**: Lines 232-246

- Removes a dependency
- Cleans up empty sets from the map
- Handles pending updates for unmounted targets

**getAffectedFields(changedField)**: Lines 279-297

- **BFS traversal** to find all transitive subscribers
- Returns a Set of all fields that need updates when one field changes
- **Already handles dependency chains**

### Subscription Inference

**Location**: `packages/react/src/hooks/useInferredInputs.ts`

The `useInferredInputs` hook automatically determines dependencies from:

1. **selectProps expressions**: Field references in computed properties
2. **conditions**: Field references in when/selectWhen conditions
3. **subscribesTo array**: Explicit subscription declarations

Returns a unique array of field names to subscribe to.

## Dependency Types

### 1. Direct Dependencies

```
Field A subscribes to Field B
```

When B changes, A updates.

### 2. Transitive Dependencies

```
Field A subscribes to Field B
Field B subscribes to Field C
```

When C changes:

- getAffectedFields('C') returns {B, A}
- Both A and B receive updates

**Critical**: This shows that dependencies can form chains.

### 3. Circular Dependencies (Not Handled)

```
Field A subscribes to Field B
Field B subscribes to Field A
```

**Current behavior**: The system does NOT detect or prevent circular dependencies.

**Related research**: `/docs/research/circular_dependency_patterns.md` acknowledges this gap and proposes two-pass evaluation patterns.

## Cleanup Ordering Implications

### Current LIFO-Only Approach

**Location**: `packages/react/src/hooks/useSubscriptions.ts` (as modified by P3.M1.T1.S1)

```typescript
[...thisRunSubscriptions].reverse().forEach((target) => {
  removeSubscription(target, fieldName);
});
```

This reverses the order subscriptions were added to this field.

### When LIFO is Sufficient

For **local dependencies** (subscriptions within a single field):

```typescript
// Field "fullName" subscribes to ["firstName", "lastName"]
// LIFO cleanup removes lastName first, then firstName
// This is fine - there's no dependency between firstName and lastName
```

### When LIFO is NOT Sufficient

For **transitive field dependencies**:

```typescript
// Field "displayName" subscribes to ["fullName"]
// Field "fullName" subscribes to ["firstName", "lastName"]
//
// If both fields unmount:
// - displayName's LIFO cleanup removes fullName subscription
// - fullName's LIFO cleanup removes firstName, lastName
// - PROBLEM: fullName may still need firstName/lastName for its own cleanup
```

However, **this scenario is actually handled correctly** because:

1. Each field's cleanup is independent
2. The invertedSubscriptions map tracks relationships
3. Removing a subscription doesn't destroy the target field

### Real Ordering Concern: Race Conditions

The actual issue is **concurrent cleanup during rapid changes**:

```typescript
// Effect Run 1: Field subscribes to ["A", "B", "C"]
// Effect Run 2 (before Run 1 cleanup): Field subscribes to ["D", "E", "F"]
// Run 1 cleanup fires: removes A, B, C
// Run 2 cleanup fires: removes D, E, F
//
// If Run 1 cleanup happens AFTER Run 2 adds subscriptions,
// we might have timing issues
```

**P3.M1.T1.S1's per-effect tracking SOLVES this**: Each run has its own cleanup scope.

## What P3.M1.T1.S2 Should Address

Based on the analysis, P3.M1.T1.S2 should focus on:

### 1. Development Logging for Subscription Lifecycle

Track when subscriptions are added/removed to detect issues:

- Which field is subscribing to what
- When cleanup happens
- Any unusual patterns (rapid add/remove cycles)

### 2. Double-Cleanup Prevention

Add guards to ensure we don't try to remove a subscription that doesn't exist:

```typescript
// Check if subscription exists before removing
if (invertedSubscriptions.current.get(target)?.has(subscriber)) {
  removeSubscription(target, subscriber);
}
```

### 3. Dependency Graph Logging (Development Only)

For complex forms, log the dependency graph:

- Which fields depend on which
- Detect potential circular dependencies
- Visualize update propagation

## Key Files for Implementation

### Files to Modify

1. **packages/react/src/hooks/useSubscriptions.ts**
   - Add development logging for subscription lifecycle
   - Add double-cleanup guards
   - Add dependency-aware ordering logic (if needed)

2. **packages/react/src/components/Form.tsx**
   - Add development logging for addSubscription/removeSubscription
   - Consider adding cycle detection

### Files to Reference

1. **packages/react/src/components/Form.tsx:279-297**
   - getAffectedFields implementation
   - Shows BFS traversal for transitive dependencies

2. **packages/core/src/expression/evaluate.ts**
   - Cycle detection patterns (if any exist)

3. **packages/react/src/hooks/useInferredInputs.ts**
   - How subscriptions are inferred
   - Dependency extraction logic

## Recommendations

### For P3.M1.T1.S2 Implementation

1. **Development Logging**:
   - Log subscription additions with field names
   - Log cleanup operations with run IDs
   - Use `process.env.NODE_ENV !== "production"` checks

2. **Double-Cleanup Guards**:
   - Check if subscription exists before removal
   - Log if double-cleanup is attempted

3. **Cycle Detection** (Optional, may be future work):
   - Detect circular dependencies in subscription graph
   - Warn in development mode

### NOT Recommended for P3.M1.T1.S2

- **Full topological sort**: Overkill for current needs
- **Breaking changes to subscription API**: External API should remain stable
- **Complex dependency resolution**: Current system handles most cases correctly

## Conclusion

The current subscription system is well-designed for its use cases. P3.M1.T1.S2 should focus on **observability** (logging) and **safety** (double-cleanup guards) rather than major architectural changes.

The per-effect tracking from P3.M1.T1.S1 already solves the primary ordering issue by isolating cleanup scopes.
