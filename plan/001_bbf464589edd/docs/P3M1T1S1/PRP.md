# PRP: Add Per-Effect Subscription Tracking

**Work Item**: P3.M1.T1.S1 - Add per-effect tracking
**Parent Task**: P3.M1.T1 - Improve Subscription Tracking
**Parent Milestone**: P3.M1 - Memory Leak Prevention
**Priority**: P3 (Medium Priority Issue)
**Story Points**: 2
**Status**: **READY FOR IMPLEMENTATION**

---

## Goal

**Feature Goal**: Implement per-effect subscription tracking in the `useSubscriptions` hook to prevent memory leaks caused by over-cleanup when the useEffect re-runs or React 18 Strict Mode double-invocation occurs.

**Deliverable**:

1. Modified `packages/react/src/hooks/useSubscriptions.ts` with per-effect run tracking
2. Subscriptions stored in a Map keyed by effect run ID
3. Cleanup function only removes subscriptions added in the current effect invocation
4. LIFO (Last In, First Out) cleanup ordering for dependent subscriptions
5. Tracking data cleanup to prevent memory leaks in the Map itself

**Success Definition**:

- Subscriptions added in each effect run are tracked independently
- Cleanup function only removes subscriptions from its own effect run
- React 18 Strict Mode double-invocation does not cause over-cleanup
- Tracking Map is properly cleaned up to prevent memory growth
- All existing tests continue to pass
- New tests verify per-effect cleanup behavior

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Forms with dynamic field subscriptions where field A may change its subscriptions to other fields multiple times during its lifecycle (e.g., based on user selections, conditions, or dynamic form structures).

**User Journey**:

1. Developer defines a form with fields that have dynamic subscriptions
2. Field subscriptions change based on conditions or user interactions
3. useEffect re-runs when subscriptions change
4. Cleanup should only remove subscriptions added in the current effect run
5. No memory leaks occur from orphaned subscriptions or over-cleanup

**Pain Points Addressed**:

- **Memory Leaks**: Current implementation may remove subscriptions from newer effect runs during cleanup
- **React 18 Strict Mode Issues**: Double-invocation causes subscription churn
- **Rapid Subscription Changes**: Fields with frequently changing subscriptions may leak subscriptions

---

## Why

- **Memory Leak Prevention**: Current cleanup function removes ALL current subscriptions, not just those from the current effect run. When the effect re-runs, the previous cleanup can remove subscriptions added by a newer run.
- **React 18 Strict Mode Compatibility**: Strict Mode double-invocation (mount → unmount → mount) exacerbates the over-cleanup problem.
- **Race Condition Prevention**: Rapid subscription changes can cause cleanup from run N to interfere with subscriptions from run N+1.
- **Proven Pattern**: The codebase already uses similar version tracking patterns (e.g., `executionVersionRef` in Form.tsx) for preventing stale operations.
- **Developer Confidence**: Proper subscription cleanup ensures forms don't leak memory or have orphaned subscriptions.

---

## What

Per-effect subscription tracking using a Map keyed by incrementing run IDs. Each effect invocation stores its subscriptions independently, and cleanup only removes subscriptions from its own run.

### Current State

**File:** `packages/react/src/hooks/useSubscriptions.ts`
**Lines:** 28-70

Current implementation uses a single ref to track previous subscriptions:

```typescript
const prevSubscriptionsRef = useRef<string[]>([]);

useEffect(() => {
  const prevSubscriptions = prevSubscriptionsRef.current;

  // Find subscriptions to add/remove based on diff
  const toRemove = prevSubscriptions.filter(
    (target) => !subscriptions.includes(target),
  );
  const toAdd = subscriptions.filter(
    (target) => !prevSubscriptions.includes(target),
  );

  // Remove old, add new
  toRemove.forEach((target) => removeSubscription(target, fieldName));
  toAdd.forEach((target) => addSubscription(target, fieldName));

  prevSubscriptionsRef.current = subscriptions;

  // PROBLEM: Cleanup removes ALL current subscriptions
  return () => {
    subscriptions.forEach((target) => removeSubscription(target, fieldName));
  };
}, [fieldName, subscriptions, addSubscription, removeSubscription]);
```

**Problem:** Cleanup at line 65-68 uses the current `subscriptions` closure value. If the effect has re-run, this may remove subscriptions from a newer effect run.

### Success Criteria

- [ ] Per-effect run tracking using incrementing run ID
- [ ] Subscriptions stored in `Map<number, string[]>` keyed by run ID
- [ ] Cleanup only removes subscriptions from its own run ID
- [ ] Map entry deleted after cleanup to prevent memory growth
- [ ] LIFO cleanup ordering (reverse iteration)
- [ ] All existing tests pass
- [ ] New tests verify per-effect cleanup behavior

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:

- Exact file path and line numbers for modification
- Complete before/after code examples
- Similar patterns from the codebase (executionVersionRef)
- All existing test patterns and utilities
- Validation commands specific to this project
- Known gotchas and limitations

### Documentation & References

```yaml
# MUST READ - Main implementation file
- file: /home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts
  why: Primary file to modify - contains the subscription management hook
  exact: Lines 28-70 (current implementation)
  modification: Replace prevSubscriptionsRef pattern with per-effect tracking
  critical: The cleanup function (lines 63-68) is the source of the bug

# MUST READ - Similar pattern in codebase
- file: /home/dustin/projects/formality/packages/react/src/components/Form.tsx
  why: Similar version tracking pattern to follow (executionVersionRef)
  exact: Lines 195-196 (executionVersionRef declaration)
  exact: Lines 496-529 (waitForFieldValidation with version checking)
  pattern: Using incrementing counter to detect stale operations
  insight: Use similar pattern: ++runIdRef.current for each effect run

# MUST READ - Form subscription registry
- file: /home/dustin/projects/formality/packages/react/src/components/Form.tsx
  why: Understanding how subscriptions are stored at Form level
  exact: Lines 179-180 (invertedSubscriptions ref)
  exact: Lines 212-230 (addSubscription function)
  exact: Lines 232-246 (removeSubscription function)
  pattern: Subscriptions stored as Map<string, Set<string>> (target → subscribers)

# MUST READ - Field component usage
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Understanding how useSubscriptions hook is consumed
  exact: Lines 34 (import useSubscriptions)
  exact: Lines 196-233 (useInferredInputs call - derives subscriptions)
  pattern: Field subscribes to fields based on conditions, selectProps, subscribesTo

# RESEARCH - Codebase analysis
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S1/research/codebase-analysis.md
  why: Complete analysis of existing useRef patterns and subscription architecture
  section: Current Implementation Analysis, Similar Patterns in Codebase

# RESEARCH - Best practices
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S1/research/useeffect-cleanup-best-practices.md
  why: Comprehensive best practices for useEffect cleanup and per-effect tracking
  section: Pattern 1: Per-Effect Run Tracking with Incrementing IDs

# RESEARCH - Testing patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S1/research/testing-patterns.md
  why: Existing test patterns and what tests need to be added
  section: Missing Test Patterns (To Be Added)

# EXTERNAL - React documentation
- url: https://react.dev/learn/synchronizing-with-effects#each-effect-represents-a-separate-synchronization-process
  why: Understanding that each effect invocation is independent
  critical: Cleanup function should only clean up its own effect's work

# EXTERNAL - React 18 Strict Mode
- url: https://react.dev/reference/react/StrictMode
  why: Understanding double-invocation behavior in development
  critical: Effects run twice in Strict Mode - cleanup must be idempotent

# TEST FILE - Where tests will be added
- file: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  why: New test file for useSubscriptions hook tests
  creation: This file will be created as part of this PRP
  pattern: Follow testing patterns from Field.test.tsx

# TEST FILE - Existing test patterns to follow
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Reference for React Testing Library patterns
  exact: Lines 1-50 (test imports and setup)
  exact: Lines 869-911 (multi-field condition tests - async pattern)
  exact: Lines 1112-1140 (rerender test pattern)
  pattern: render, userEvent.setup, waitFor, toBeDisabled assertions

# CONTEXT TYPES - TypeScript types
- file: /home/dustin/projects/formality/packages/react/src/types.ts
  why: Understanding WatcherSetterFn and related types
  pattern: FormContextValue contains addSubscription/removeSubscription signatures

# CONTEXT - FormContext
- file: /home/dustin/projects/formality/packages/react/src/context/FormContext.tsx
  why: Understanding FormContextValue interface
  pattern: addSubscription(target: string, subscriber: string): void
  pattern: removeSubscription(target: string, subscriber: string): void
```

### Current Codebase tree (React package hooks)

```bash
packages/react/src/hooks/
├── useSubscriptions.ts           # ← MODIFY: Add per-effect tracking
│   ├── Lines 1-27: Imports and JSDoc
│   ├── Lines 28-70: Current implementation (TO BE MODIFIED)
│   │   ├── Line 35: prevSubscriptionsRef declaration (REMOVE)
│   │   ├── Lines 37-58: useEffect body (MODIFY)
│   │   └── Lines 63-68: Cleanup function (MODIFY)
│   └── Lines 71: End of function
│
├── useConditions.ts              # Consumer of useSubscriptions
├── usePropsEvaluation.ts         # Consumer of useSubscriptions
├── useInferredInputs.ts          # Derives subscriptions from conditions
└── useFieldDisabledState.ts      # Related disabled state hook
```

### Desired Codebase tree with modification

```bash
packages/react/src/hooks/
├── useSubscriptions.ts           # ← MODIFY: Per-effect tracking
│   ├── [EXISTING: Lines 1-27: Imports and JSDoc - UNCHANGED]
│   ├── Lines 28-70: MODIFIED IMPLEMENTATION
│   │   ├── ADD: runIdRef with incrementing counter
│   │   ├── ADD: runSubscriptionsRef with Map<number, string[]>
│   │   ├── MODIFY: useEffect to use per-effect tracking
│   │   │   ├── Increment runIdRef.current for each run
│   │   │   ├── Store subscriptions in Map with run ID as key
│   │   │   └── Cleanup only removes subscriptions from current run ID
│   │   └── REMOVE: prevSubscriptionsRef pattern
│   └── Lines 71: End of function
│
├── [OTHER HOOKS UNCHANGED]

packages/react/src/__tests__/
├── useSubscriptions.test.tsx     # ← CREATE: New test file
│   ├── Imports: render, screen, waitFor, userEvent, vi, etc.
│   ├── Mock: FormContext with subscription tracking
│   ├── describe("basic functionality")
│   ├── describe("per-effect cleanup")
│   ├── describe("memory leak prevention")
│   ├── describe("React 18 Strict Mode")
│   └── describe("rapid changes")
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: React Hook Form subscriptions
// Accessing methods.formState creates a subscription to entire form state
// Never access formState in useEffect dependencies or callback bodies
// See: Form.tsx lines 660-662 comment

// CRITICAL: Map cleanup
// Always delete Map entries after cleanup to prevent memory leaks
// runSubscriptionsRef.current.delete(currentRunId) is mandatory

// CRITICAL: LIFO cleanup ordering
// Use [...subs].reverse() for cleanup to handle dependent subscriptions
// First in = last out when cleaning up

// GOTCHA: React 18 Strict Mode double-invocation
// In development with Strict Mode, effects run: mount → unmount → mount
// Per-effect tracking handles this naturally - each run gets its own ID

// GOTCHA: runIdRef counter growth
// Counter increments on each effect run
// Practically never overflows (Number.MAX_SAFE_INTEGER is huge)
// No need to reset counter

// GOTCHA: Map key type
// Use number for run ID (simple, explicit)
// Symbol is alternative but less readable for debugging

// GOTCHA: Array spread for isolation
// Use [...subscriptions] to create a copy before storing in Map
// Prevents reference sharing between effect runs

// GOTCHA: Closure value in cleanup
// The key insight: cleanup function closes over currentRunId
// Even if subscriptions prop changes, cleanup uses its own run's ID
// This is why per-effect tracking works!

// GOTCHA: Form-level subscription registry
// invertedSubscriptions is Map<string, Set<string>> (target → subscribers)
// Multiple fields can subscribe to the same target
// Each field's cleanup should only remove its own subscriptions

// CRITICAL: Test utilities
// useEvent.setup() - always create user instance
// waitFor() - for async state updates
// toBeDisabled() - for disabled state verification
// rerender() - for simulating prop changes
```

---

## Implementation Blueprint

### Data models and structure

No new data models needed. Using existing types:

```typescript
// Existing types from FormContext
type addSubscription = (target: string, subscriber: string) => void;
type removeSubscription = (target: string, subscriber: string) => void;

// New internal types for per-effect tracking
type RunId = number;
type RunSubscriptionsMap = Map<RunId, string[]>;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY packages/react/src/hooks/useSubscriptions.ts
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts
  - LOCATION: Lines 28-70
  - REMOVE: prevSubscriptionsRef (line 35)
  - ADD: runIdRef with useRef<number>(0)
  - ADD: runSubscriptionsRef with useRef<Map<number, string[]>>(new Map())
  - MODIFY: useEffect body (lines 37-62)
  - IMPLEMENT: Increment run ID: const currentRunId = ++runIdRef.current
  - IMPLEMENT: Store subscriptions: runSubscriptionsRef.current.set(currentRunId, [...subscriptions])
  - IMPLEMENT: Add subscriptions (keep existing toAdd/toRemove logic)
  - MODIFY: Cleanup function (lines 63-68)
  - IMPLEMENT: Get subscriptions for current run: runSubscriptionsRef.current.get(currentRunId)
  - IMPLEMENT: LIFO cleanup: [...thisRunSubscriptions].reverse().forEach(...)
  - IMPLEMENT: Delete Map entry: runSubscriptionsRef.current.delete(currentRunId)
  - PRESERVE: All existing imports and JSDoc
  - PRESERVE: Function signature and export

Task 2: CREATE packages/react/src/__tests__/useSubscriptions.test.tsx
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - IMPLEMENT: Unit tests for useSubscriptions hook
  - IMPORTS: render, screen, waitFor, userEvent, vi, describe, it, expect
  - IMPORTS: useSubscriptions from ../hooks/useSubscriptions
  - MOCK: FormContext with subscription tracking spies
  - PATTERN: Follow Field.test.tsx test structure
  - NAMING: describe blocks: "basic functionality", "per-effect cleanup", "memory leak prevention"
  - COVERAGE: All scenarios mentioned in Success Criteria

Task 3: ADD test "should add subscriptions on mount"
  - VERIFY: Subscriptions are added when component mounts
  - VERIFY: addSubscription called for each subscription
  - PATTERN: Mock addSubscription, render component, assert calls

Task 4: ADD test "should only cleanup subscriptions from current effect run"
  - VERIFY: Cleanup only removes subscriptions from its own run
  - VERIFY: Rapid rerender doesn't cause over-cleanup
  - PATTERN: Track run IDs, rerender with different subscriptions, verify cleanup

Task 5: ADD test "should handle React 18 Strict Mode double-invocation"
  - VERIFY: Double mount/unmount doesn't cause errors
  - VERIFY: No duplicate subscriptions in registry
  - PATTERN: Wrap component in StrictMode, verify behavior

Task 6: ADD test "should clean up Map entries to prevent memory growth"
  - VERIFY: Map entries are deleted after cleanup
  - VERIFY: Map size doesn't grow indefinitely
  - PATTERN: Access runSubscriptionsRef, check size after unmount

Task 7: ADD test "should handle rapid subscription changes without memory leaks"
  - VERIFY: Rapid rerender with different subscriptions works
  - VERIFY: No orphaned subscriptions
  - PATTERN: Loop with rerender, verify final cleanup

Task 8: RUN tests to verify implementation
  - COMMAND: pnpm test --filter @formality-ui/react useSubscriptions.test.tsx
  - VERIFY: All new tests pass
  - VERIFY: No existing tests break

Task 9: RUN full React test suite for regressions
  - COMMAND: pnpm test --filter @formality-ui/react
  - VERIFY: All React tests pass
  - EXPECTED: Zero test failures
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// BEFORE: Current implementation (useSubscriptions.ts lines 28-70)
// ============================================================================

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

// ============================================================================
// AFTER: Per-effect tracking implementation
// ============================================================================

export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  // PATTERN: Per-effect subscription tracking (similar to executionVersionRef in Form.tsx)
  // Track the current effect run ID
  const runIdRef = useRef<number>(0);

  // Store subscriptions added in each effect run
  // Key: run ID, Value: subscriptions array for that run
  const runSubscriptionsRef = useRef<Map<number, string[]>>(new Map());

  useEffect(() => {
    // Increment run ID for this effect invocation
    const currentRunId = ++runIdRef.current;

    // CRITICAL: Store subscriptions for THIS specific effect run
    // Use [...subscriptions] to create a copy (prevent reference sharing)
    runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

    // Add all subscriptions
    subscriptions.forEach((target) => {
      addSubscription(target, fieldName);
    });

    // Cleanup only removes subscriptions added in THIS run
    return () => {
      // Get subscriptions for THIS specific run (not current subscriptions value)
      const thisRunSubscriptions =
        runSubscriptionsRef.current.get(currentRunId);

      if (thisRunSubscriptions) {
        // PATTERN: LIFO cleanup (Last In, First Out)
        // Reverse order for dependent subscriptions
        [...thisRunSubscriptions].reverse().forEach((target) => {
          removeSubscription(target, fieldName);
        });

        // CRITICAL: Clean up tracking map to prevent memory leaks
        runSubscriptionsRef.current.delete(currentRunId);
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}

// ============================================================================
// KEY INSIGHTS
// ============================================================================

// 1. Closure over currentRunId
// The cleanup function closes over currentRunId from when the effect ran
// Even if subscriptions prop changes, cleanup uses its own run's ID
// This is the core mechanism that prevents over-cleanup!

// 2. Map for storage
// Map<number, string[]> stores subscriptions per run
// Key: run ID (unique per effect invocation)
// Value: array of subscription targets for that run

// 3. LIFO cleanup
// [...thisRunSubscriptions].reverse() reverses the array
// Last subscription added is first to be removed
// Safer for dependent subscriptions

// 4. Map cleanup
// runSubscriptionsRef.current.delete(currentRunId) is mandatory
// Prevents Map from growing indefinitely
// Prevents memory leak in the tracking structure itself

// 5. React 18 Strict Mode compatibility
// Each Strict Mode invocation gets its own run ID
// Cleanup from first run doesn't affect second run
// Double-mount works correctly
```

### Integration Points

```yaml
USESUBSCRIPTIONS_HOOK:
  - file: packages/react/src/hooks/useSubscriptions.ts
  - modification: Replace prevSubscriptionsRef pattern with per-effect tracking
  - consumers: Field component (via useInferredInputs)
  - depends: FormContext.addSubscription, FormContext.removeSubscription

FIELD_COMPONENT:
  - file: packages/react/src/components/Field.tsx
  - usage: Line 198 (useInferredInputs derives subscriptions)
  - usage: Line 234 (passes to useSubscriptions)
  - unchanged: Field component doesn't need modification

FORM_CONTEXT:
  - file: packages/react/src/context/FormContext.tsx
  - provides: addSubscription, removeSubscription functions
  - unchanged: Context interface doesn't change

TEST_FILE:
  - file: packages/react/src/__tests__/useSubscriptions.test.tsx
  - creation: New test file for hook testing
  - pattern: Follow Field.test.tsx structure
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
pnpm lint --fix                    # Auto-format and fix linting issues
pnpm typecheck                     # Type checking

# Expected: Zero errors.
# If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific hook
pnpm test --filter @formality-ui/react useSubscriptions.test.tsx

# Test all hooks
pnpm test --filter @formality-ui/react --run src/__tests__/use*.test.tsx

# Expected: All tests pass.
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test full react package
pnpm test --filter @formality-ui/react

# Focus on Field component (consumer of useSubscriptions)
pnpm test --filter @formality-ui/react Field.test.tsx

# Expected: All React tests pass, no regressions.
```

### Level 4: Cross-Framework Validation

```bash
# Test all packages for regressions
pnpm test

# Expected: All tests pass across all packages.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Per-effect tracking implemented with runIdRef and runSubscriptionsRef
- [ ] Cleanup only removes subscriptions from current effect run
- [ ] Map entries deleted after cleanup
- [ ] LIFO cleanup ordering implemented
- [ ] All tests pass: `pnpm test --filter @formality-ui/react`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`

### Feature Validation

- [ ] Subscriptions tracked independently per effect run
- [ ] Over-cleanup prevented when effect re-runs
- [ ] React 18 Strict Mode double-invocation handled correctly
- [ ] Map cleanup prevents memory leaks in tracking structure
- [ ] Rapid subscription changes don't cause orphaned subscriptions

### Code Quality Validation

- [ ] Follows existing codebase patterns (executionVersionRef style)
- [ ] File placement matches desired codebase tree
- [ ] External API unchanged (function signature same)
- [ ] Tests follow existing patterns from Field.test.tsx
- [ ] Tests cover all success criteria

---

## Anti-Patterns to Avoid

- **Don't use current subscriptions in cleanup** - Always use stored subscriptions from current run ID
- **Don't forget to delete Map entries** - Causes memory leak in tracking structure
- **Don't skip LIFO ordering** - May cause issues with dependent subscriptions
- **Don't change function signature** - External API must remain unchanged
- **Don't break existing tests** - All existing tests must continue to pass
- **Don't ignore React 18 Strict Mode** - Double-invocation must be handled correctly
- **Don't use array reference directly** - Always use `[...subscriptions]` to create a copy
- **Don't store component references in Map** - Causes circular references and memory leaks
- **Don't skip testing** - Comprehensive tests are critical for memory leak prevention
- **Don't add unnecessary dependencies** - Keep effect dependencies minimal

---

## Related Work Items

- **Parent**: P3.M1 - Memory Leak Prevention (Planned)
- **Parent**: P3.M1.T1 - Improve Subscription Tracking (Planned)
- **Sibling**: P3.M1.T1.S2 - Add cleanup ordering (Planned)
- **Sibling**: P3.M1.T2 - Add Tests for Memory Leaks (Planned)
- **Unrelated**: P2.M2.T2.S3 - Test React Integration for Multi-Field isDisabled (Implementing in parallel)

---

## Contract Dependencies

### From P2.M2.T2.S3 - Test React Integration (Implementing in Parallel)

The P2.M2.T2.S3 PRP is implementing React integration tests for multi-field isDisabled conditions.

**This PRP's Contract**:

1. This PRP modifies `useSubscriptions.ts` independently
2. No overlap with P2.M2.T2.S3 implementation
3. Both work items can proceed in parallel
4. This PRP improves subscription tracking for all fields, including those with isDisabled conditions

**Integration Point**: When P3.M1.T1.S1 is complete, the improved subscription tracking will benefit all fields including those with multi-field isDisabled conditions tested in P2.M2.T2.S3.

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:

- Clear problem statement and solution design
- Similar pattern exists in codebase (executionVersionRef)
- Comprehensive research documented
- Complete before/after code examples provided
- All file paths and line numbers specified
- Test patterns documented with examples
- Known gotchas and anti-patterns identified
- Validation commands specific to project

**Remaining 1 point uncertainty**: New test file creation may need minor adjustments to vitest configuration or test patterns, but this is low risk given existing test infrastructure.

---

## References

### Internal Documentation

- [Codebase Analysis](./research/codebase-analysis.md) - useRef patterns and subscription architecture
- [useEffect Cleanup Best Practices](./research/useeffect-cleanup-best-practices.md) - Per-effect tracking patterns
- [Testing Patterns](./research/testing-patterns.md) - Existing test patterns and what to add

### Internal Code Files

- [useSubscriptions.ts](../../../../packages/react/src/hooks/useSubscriptions.ts) - Main implementation file
- [Form.tsx](../../../../packages/react/src/components/Form.tsx) - Similar executionVersionRef pattern
- [Field.tsx](../../../../packages/react/src/components/Field.tsx) - Hook consumer
- [FormContext.tsx](../../../../packages/react/src/context/FormContext.tsx) - Context definitions

### External Documentation

- [React Effects Documentation](https://react.dev/learn/synchronizing-with-effects) - Understanding effect lifecycle
- [React Strict Mode](https://react.dev/reference/react/StrictMode) - Double-invocation behavior
- [useRef Hook](https://react.dev/reference/react/useRef) - Ref patterns for tracking

### Research Artifacts

- `/home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S1/research/` - All research documentation

---

## Appendix: Quick Reference

### Modified File Structure

```typescript
// File: packages/react/src/hooks/useSubscriptions.ts

// Lines 1-27: Imports and JSDoc (UNCHANGED)
import { useEffect, useRef } from "react";
import { useFormContext } from "../context/FormContext";

/**
 * Manages field subscriptions
 * ... (existing JSDoc)
 */
export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  // NEW: Per-effect tracking
  const runIdRef = useRef<number>(0);
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
        [...thisRunSubscriptions].reverse().forEach((target) => {
          removeSubscription(target, fieldName);
        });

        runSubscriptionsRef.current.delete(currentRunId);
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
```

### Test File Template

```typescript
// File: packages/react/src/__tests__/useSubscriptions.test.tsx

import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { FormalityProvider, Form, Field } from "../components";

// Mock FormContext
const mockAddSubscription = vi.fn();
const mockRemoveSubscription = vi.fn();

describe("useSubscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add subscriptions on mount", () => {
    // Test implementation
  });

  it("should only cleanup subscriptions from current effect run", () => {
    // Test implementation
  });

  // ... more tests
});
```
