# PRP: Add Cleanup Ordering Verification and Logging

**Work Item**: P3.M1.T1.S2 - Add cleanup ordering
**Parent Task**: P3.M1.T1 - Improve Subscription Tracking
**Parent Milestone**: P3.M1 - Memory Leak Prevention
**Priority**: P3 (Medium Priority Issue)
**Story Points**: 1
**Status**: **READY FOR IMPLEMENTATION**

---

## Goal

**Feature Goal**: Add development logging for subscription lifecycle tracking and verify that LIFO cleanup ordering is correct to prevent orphaned subscriptions and double-cleanup issues.

**Deliverable**:
1. Development logging in `packages/react/src/hooks/useSubscriptions.ts` for subscription lifecycle events
2. Development logging in `packages/react/src/components/Form.tsx` for subscription registry operations
3. Double-cleanup detection with warnings when attempting to remove non-existent subscriptions
4. Documentation confirming LIFO ordering is the correct approach for this subscription model
5. Tests verifying logging behavior and double-cleanup detection

**Success Definition**:
- Subscription lifecycle (add/remove/cleanup) is logged in development mode
- Double-cleanup attempts are detected and warned about
- LIFO ordering is verified and documented as correct
- All existing tests continue to pass
- New tests verify logging and detection behavior
- Zero production code changes (logging only in development)

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Debugging complex forms with many field subscriptions, particularly when:
- Fields dynamically change their subscriptions
- Forms have deep dependency chains
- Unusual subscription patterns cause issues

**User Journey**:
1. Developer creates form with complex field dependencies
2. In development mode, subscription lifecycle is logged
3. Developer sees warnings if double-cleanup is attempted
4. Developer can trace subscription graph and ordering issues

**Pain Points Addressed**:
- **Debugging difficulty**: Currently no visibility into subscription lifecycle
- **Silent failures**: Double-cleanup attempts are silently ignored
- **Uncertainty**: No verification that cleanup ordering is correct

---

## Why

- **Debugging Support**: Development logging provides visibility into subscription lifecycle for complex forms
- **Error Detection**: Double-cleanup detection helps identify bugs in subscription management
- **Verification**: Confirms that LIFO ordering (from P3.M1.T1.S1) is the correct approach
- **Zero Production Impact**: All changes are development-only via `process.env.NODE_ENV` checks
- **React Best Practices**: Aligns with React's LIFO cleanup pattern

---

## What

### Current State Analysis

**From P3.M1.T1.S1 Contract**:

The previous work item (P3.M1.T1.S1) implements per-effect tracking with:
- `runIdRef`: Incrementing counter for each effect run
- `runSubscriptionsRef`: `Map<number, string[]>` storing subscriptions per run
- LIFO cleanup: `[...thisRunSubscriptions].reverse().forEach(...)`
- Map entry deletion: `runSubscriptionsRef.current.delete(currentRunId)`

**Current Implementation** (packages/react/src/hooks/useSubscriptions.ts):
```typescript
// Lines 42-71: Per-effect tracking with LIFO cleanup
useEffect(() => {
  const currentRunId = ++runIdRef.current;
  runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

  subscriptions.forEach((target) => {
    addSubscription(target, fieldName);
  });

  return () => {
    const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId);
    if (thisRunSubscriptions) {
      [...thisRunSubscriptions].reverse().forEach((target) => {
        removeSubscription(target, fieldName);
      });
      runSubscriptionsRef.current.delete(currentRunId);
    }
  };
}, [fieldName, subscriptions, addSubscription, removeSubscription]);
```

**Current Form.tsx Implementation** (packages/react/src/components/Form.tsx):
```typescript
// Lines 232-246: removeSubscription - silently ignores non-existent subscriptions
const removeSubscription = useCallback(
  (target: string, subscriber: string) => {
    invertedSubscriptions.current.get(target)?.delete(subscriber);

    const setter = watcherSetters.current.get(target);
    if (setter) {
      setter((prev) => {
        const next = { ...prev };
        delete next[subscriber];
        return next;
      });
    }
  },
  [],
);
```

**Problem**:
1. No logging of subscription lifecycle events
2. Double-cleanup attempts are silently ignored
3. No verification that LIFO is the correct ordering

### Success Criteria

- [ ] Development logging for subscription additions (field name + target)
- [ ] Development logging for subscription removals (field name + target + run ID)
- [ ] Development logging for cleanup operations (run ID + subscriptions cleaned)
- [ ] Double-cleanup detection with warnings
- [ ] LIFO ordering documented as correct for this use case
- [ ] All existing tests pass
- [ ] New tests verify logging and detection behavior
- [ ] Zero production code impact (all logs behind `process.env.NODE_ENV !== "production"`)

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:
- Exact file paths and line numbers for modification
- Previous PRP contract (P3.M1.T1.S1) as foundation
- Complete logging pattern from existing codebase
- External research confirming LIFO is correct
- All test patterns and validation commands
- Known gotchas and anti-patterns

### Documentation & References

```yaml
# MUST READ - Previous PRP (foundation)
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S1/PRP.md
  why: Understanding per-effect tracking implementation from P3.M1.T1.S1
  contract: This PRP builds on the per-effect tracking implemented in P3.M1.T1.S1
  critical: runIdRef, runSubscriptionsRef, LIFO cleanup pattern

# MUST READ - Main implementation file (modified by P3.M1.T1.S1)
- file: /home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts
  why: Primary file to modify - add logging to subscription lifecycle
  exact: Lines 42-71 (useEffect with per-effect tracking)
  exact: Lines 51-53 (addSubscription calls - ADD LOGGING HERE)
  exact: Lines 56-70 (cleanup function - ADD LOGGING HERE)
  pattern: Follow P3.M1.T1.S1's implementation, add logging
  gotcha: Don't modify the per-effect tracking logic, only add logging

# MUST READ - Form subscription operations
- file: /home/dustin/projects/formality/packages/react/src/components/Form.tsx
  why: Add logging to addSubscription and removeSubscription functions
  exact: Lines 212-230 (addSubscription - ADD LOGGING HERE)
  exact: Lines 232-246 (removeSubscription - ADD LOGGING + DETECTION HERE)
  pattern: Optional chaining at line 234 silently ignores missing subscriptions
  gotcha: Add existence check before deletion to detect double-cleanup

# MUST READ - Existing logging pattern
- file: /home/dustin/projects/formality/packages/react/src/components/FieldGroup.tsx
  why: Reference for development logging pattern in this codebase
  exact: Line 74 (console.warn with environment check)
  pattern: if (process.env.NODE_ENV !== "production") { console.warn(...); }

# MUST READ - Core package logging patterns
- file: /home/dustin/projects/formality/packages/core/src/validation/validate.ts
  why: Additional reference for logging pattern
  exact: Lines 112, 120 (validator warnings)
  pattern: Development-only warnings with context

# RESEARCH - Codebase analysis
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S2/research/dependency-analysis.md
  why: Analysis of subscription dependencies and cleanup ordering
  section: Cleanup Ordering Implications, When LIFO is Sufficient

# RESEARCH - Logging patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S2/research/logging-patterns.md
  why: Existing logging patterns and recommendations
  section: Existing Logging Patterns, Recommended Subscription Logging Pattern

# RESEARCH - External best practices
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S2/research/external-research.md
  why: External research confirming LIFO is correct
  section: React's Built-in LIFO Cleanup Ordering, When LIFO vs FIFO Matters

# EXTERNAL - React documentation
- url: https://react.dev/learn/synchronizing-with-effects#how-react-processes-effects
  why: React's LIFO cleanup ordering is by design
  critical: Confirms LIFO is the standard and correct approach

# EXTERNAL - React Strict Mode
- url: https://react.dev/reference/react/StrictMode
  why: Understanding double-invocation behavior
  critical: Cleanups must be idempotent

# TEST FILE - Where tests will be added
- file: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  why: Created by P3.M1.T1.S1, will add new tests for logging
  exact: Lines created in P3.M1.T1.S1
  pattern: Follow existing test patterns
```

### Current Codebase tree (relevant files)

```bash
packages/react/src/
├── hooks/
│   └── useSubscriptions.ts           # ← MODIFY: Add development logging
│       ├── Lines 1-27: Imports and JSDoc (UNCHANGED)
│       ├── Lines 28-71: Per-effect tracking implementation
│       │   ├── Lines 51-53: Add subscriptions (ADD LOGGING)
│       │   └── Lines 56-70: Cleanup function (ADD LOGGING)
│       └── Line 72: End of function
│
├── components/
│   └── Form.tsx                       # ← MODIFY: Add logging to subscription operations
│       ├── Lines 212-230: addSubscription (ADD LOGGING)
│       └── Lines 232-246: removeSubscription (ADD LOGGING + DETECTION)
│
└── __tests__/
    └── useSubscriptions.test.tsx      # ← MODIFY: Add tests for logging and detection
        # (Created by P3.M1.T1.S1, will add new tests)
```

### Desired Codebase tree with modifications

```bash
packages/react/src/
├── hooks/
│   └── useSubscriptions.ts           # ← MODIFY: Add development logging
│       ├── [EXISTING: Lines 1-71 - UNCHANGED except for logging additions]
│       ├── ADD: Development logging for subscription additions
│       ├── ADD: Development logging for cleanup operations
│       └── [NO PRODUCTION CODE CHANGES]
│
├── components/
│   └── Form.tsx                       # ← MODIFY: Add logging + detection
│       ├── [EXISTING: Lines 212-230 - ADD LOGGING to addSubscription]
│       ├── [EXISTING: Lines 232-246 - ADD LOGGING + DETECTION to removeSubscription]
│       └── [NO PRODUCTION CODE CHANGES]
│
└── __tests__/
    └── useSubscriptions.test.tsx      # ← MODIFY: Add new tests
        ├── ADD: describe("development logging")
        ├── ADD: describe("double-cleanup detection")
        └── [EXISTING TESTS UNCHANGED]
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Use process.env.NODE_ENV !== "production" for all logging
// This ensures logs are stripped in production builds
// Pattern from FieldGroup.tsx:74 and validate.ts:112

// CRITICAL: LIFO ordering is CORRECT for this use case
// React uses LIFO for cleanup by design
// Don't change to FIFO without strong justification
// See external-research.md section 1

// GOTCHA: removeSubscription uses optional chaining (?.delete)
// This silently ignores missing subscriptions
// We need to add explicit existence check for double-cleanup detection
// Current: invertedSubscriptions.current.get(target)?.delete(subscriber)
// New: Check if subscription exists BEFORE deletion, log if not

// GOTCHA: Console.warn is used, not console.log
// Codebase consistently uses console.warn for development messages
// Never use console.log in library code

// GOTCHA: No external logging libraries
// Don't import debug, loglevel, or similar
// Use direct console.warn with environment checks

// CRITICAL: Double-cleanup in Strict Mode
// React 18 Strict Mode double-invokes effects
// Per-effect tracking handles this, but logging will show it
// This is EXPECTED behavior, not a bug

// GOTCHA: Test environment
// Vitest with console.warn mocking
// Tests need to spy on console.warn and verify calls
```

---

## Implementation Blueprint

### Data models and structure

No new data models needed. Adding logging to existing structures:
```typescript
// Existing types from P3.M1.T1.S1
type RunId = number;
type RunSubscriptionsMap = Map<RunId, string[]>;

// Logging messages (development only)
type LogMessage = string; // Formatted console.warn messages
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY packages/react/src/hooks/useSubscriptions.ts - Add subscription logging
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts
  - LOCATION: Lines 51-53 (after addSubscription calls)
  - ADD: Development logging for each subscription added
  - PATTERN: if (process.env.NODE_ENV !== "production") { console.warn(...); }
  - MESSAGE: "[Formality Subscription] Run {currentRunId}: '{fieldName}' subscribing to '{target}'"
  - PRESERVE: All existing per-effect tracking logic
  - ZERO_PRODUCTION_IMPACT: All logging behind environment check

Task 2: MODIFY packages/react/src/hooks/useSubscriptions.ts - Add cleanup logging
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts
  - LOCATION: Lines 56-70 (cleanup function)
  - ADD: Development logging for cleanup operations
  - ADD: Log before LIFO cleanup starts
  - ADD: Log each subscription removal
  - MESSAGE: "[Formality Subscription] Run {currentRunId}: '{fieldName}' cleaning up [{subscriptions}]"
  - PRESERVE: All existing cleanup logic
  - ZERO_PRODUCTION_IMPACT: All logging behind environment check

Task 3: MODIFY packages/react/src/components/Form.tsx - Add addSubscription logging
  - FILE: /home/dustin/projects/formality/packages/react/src/components/Form.tsx
  - LOCATION: Lines 212-230 (addSubscription function)
  - ADD: Development logging after subscription is added to inverted index
  - MESSAGE: "[Formality Subscription] '{subscriber}' added to watch '{target}'"
  - PRESERVE: All existing subscription logic
  - ZERO_PRODUCTION_IMPACT: All logging behind environment check

Task 4: MODIFY packages/react/src/components/Form.tsx - Add removeSubscription logging + detection
  - FILE: /home/dustin/projects/formality/packages/react/src/components/Form.tsx
  - LOCATION: Lines 232-246 (removeSubscription function)
  - ADD: Existence check BEFORE deletion
  - ADD: Warning if subscription doesn't exist (double-cleanup detection)
  - ADD: Development logging for successful removal
  - MESSAGE_SUCCESS: "[Formality Subscription] '{subscriber}' removed from watching '{target}'"
  - MESSAGE_WARNING: "[Formality Subscription] WARNING: Double-cleanup - '{subscriber}' not watching '{target}'"
  - PRESERVE: All existing removal logic (use optional chaining as before)
  - ZERO_PRODUCTION_IMPACT: All logging behind environment check

Task 5: MODIFY packages/react/src/__tests__/useSubscriptions.test.tsx - Add logging tests
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - ADD: describe("development logging")
  - ADD: Test for subscription addition logging
  - ADD: Test for cleanup logging
  - PATTERN: Spy on console.warn, assert calls with correct messages
  - ADD: describe("double-cleanup detection")
  - ADD: Test for double-cleanup warning
  - PATTERN: Call removeSubscription twice, verify warning on second call
  - PRESERVE: All existing tests from P3.M1.T1.S1

Task 6: RUN tests to verify implementation
  - COMMAND: pnpm test --filter @formality-ui/react useSubscriptions.test.tsx
  - VERIFY: All new tests pass
  - VERIFY: No existing tests break

Task 7: RUN full React test suite for regressions
  - COMMAND: pnpm test --filter @formality-ui/react
  - VERIFY: All React tests pass
  - EXPECTED: Zero test failures
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Development-Only Logging (from FieldGroup.tsx:74)
// ============================================================================

if (process.env.NODE_ENV !== "production") {
  console.warn(`[Formality Subscription] ${message}`);
}

// Use this EXACT pattern for all logging additions
// Never use console.log in library code
// Always include context (field names, target names, run IDs)

// ============================================================================
// PATTERN 2: Subscription Addition Logging (useSubscriptions.ts)
// ============================================================================

// BEFORE (lines 51-53):
subscriptions.forEach((target) => {
  addSubscription(target, fieldName);
});

// AFTER:
subscriptions.forEach((target) => {
  addSubscription(target, fieldName);

  // Log subscription addition (development only)
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Formality Subscription] Run ${currentRunId}: ` +
      `"${fieldName}" subscribing to "${target}"`
    );
  }
});

// ============================================================================
// PATTERN 3: Cleanup Logging (useSubscriptions.ts cleanup function)
// ============================================================================

// BEFORE (lines 56-70):
return () => {
  const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId);

  if (thisRunSubscriptions) {
    [...thisRunSubscriptions].reverse().forEach((target) => {
      removeSubscription(target, fieldName);
    });
    runSubscriptionsRef.current.delete(currentRunId);
  }
};

// AFTER:
return () => {
  const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId);

  if (thisRunSubscriptions) {
    // Log cleanup start (development only)
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[Formality Subscription] Run ${currentRunId}: ` +
        `"${fieldName}" cleaning up [${thisRunSubscriptions.join(', ')}]`
      );
    }

    // LIFO cleanup
    [...thisRunSubscriptions].reverse().forEach((target) => {
      removeSubscription(target, fieldName);
    });

    // Clean up tracking map
    runSubscriptionsRef.current.delete(currentRunId);
  }
};

// ============================================================================
// PATTERN 4: addSubscription Logging (Form.tsx)
// ============================================================================

// BEFORE (lines 212-230):
const addSubscription = useCallback((target: string, subscriber: string) => {
  if (!invertedSubscriptions.current.has(target)) {
    invertedSubscriptions.current.set(target, new Set());
  }
  invertedSubscriptions.current.get(target)!.add(subscriber);

  const setter = watcherSetters.current.get(target);
  if (setter) {
    setter((prev) => ({ ...prev, [subscriber]: true }));
  } else {
    if (!pendingWatcherUpdates.current.has(target)) {
      pendingWatcherUpdates.current.set(target, new Set());
    }
    pendingWatcherUpdates.current.get(target)!.add(subscriber);
  }
}, []);

// AFTER (add logging after subscription is added):
const addSubscription = useCallback((target: string, subscriber: string) => {
  if (!invertedSubscriptions.current.has(target)) {
    invertedSubscriptions.current.set(target, new Set());
  }
  invertedSubscriptions.current.get(target)!.add(subscriber);

  // Log subscription addition (development only)
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Formality Subscription] "${subscriber}" added to watch "${target}"`
    );
  }

  const setter = watcherSetters.current.get(target);
  if (setter) {
    setter((prev) => ({ ...prev, [subscriber]: true }));
  } else {
    if (!pendingWatcherUpdates.current.has(target)) {
      pendingWatcherUpdates.current.set(target, new Set());
    }
    pendingWatcherUpdates.current.get(target)!.add(subscriber);
  }
}, []);

// ============================================================================
// PATTERN 5: removeSubscription Logging + Double-Cleanup Detection (Form.tsx)
// ============================================================================

// BEFORE (lines 232-246):
const removeSubscription = useCallback(
  (target: string, subscriber: string) => {
    invertedSubscriptions.current.get(target)?.delete(subscriber);

    const setter = watcherSetters.current.get(target);
    if (setter) {
      setter((prev) => {
        const next = { ...prev };
        delete next[subscriber];
        return next;
      });
    }
  },
  [],
);

// AFTER (add detection and logging):
const removeSubscription = useCallback(
  (target: string, subscriber: string) => {
    // Check if subscription exists before removal (for double-cleanup detection)
    const subscribers = invertedSubscriptions.current.get(target);
    const subscriptionExists = subscribers?.has(subscriber) ?? false;

    // Perform removal (keep original optional chaining for safety)
    invertedSubscriptions.current.get(target)?.delete(subscriber);

    // Log removal or warn about double-cleanup (development only)
    if (process.env.NODE_ENV !== "production") {
      if (subscriptionExists) {
        console.warn(
          `[Formality Subscription] "${subscriber}" removed from watching "${target}"`
        );
      } else {
        console.warn(
          `[Formality Subscription] WARNING: Double-cleanup attempt - ` +
          `"${subscriber}" was not watching "${target}"`
        );
      }
    }

    // Update watcher setter
    const setter = watcherSetters.current.get(target);
    if (setter) {
      setter((prev) => {
        const next = { ...prev };
        delete next[subscriber];
        return next;
      });
    }
  },
  [],
);

// ============================================================================
// KEY INSIGHTS
// ============================================================================

// 1. LIFO Ordering is CORRECT
// React uses LIFO (Last-In, First-Out) for cleanup by design
// This mirrors stack unwinding - dependent resources are cleaned up first
// See: https://react.dev/learn/synchronizing-with-effects
// Don't change to FIFO without strong justification

// 2. Double-Cleanup Detection
// Current code silently ignores missing subscriptions via optional chaining
// We add explicit check BEFORE deletion to detect double-cleanup
// This helps identify bugs in subscription management

// 3. Development-Only Logging
// All logging is behind process.env.NODE_ENV !== "production"
// Zero production code impact
// Follows existing codebase pattern from FieldGroup.tsx

// 4. Message Format
// Prefix: "[Formality Subscription]"
// Context: Field names, target names, run IDs
- Clear: What operation is happening
// Warnings: Clearly marked as WARNING

// 5. Per-Effect Tracking (from P3.M1.T1.S1)
// Run IDs correlate subscription adds with cleanup
// Logging includes run ID for tracing
// This is critical for debugging complex scenarios
```

### Integration Points

```yaml
USESUBSCRIPTIONS_HOOK:
  - file: packages/react/src/hooks/useSubscriptions.ts
  - modification: Add development logging (no logic changes)
  - consumers: Field component (unchanged)
  - depends: FormContext.addSubscription, FormContext.removeSubscription

FORM_CONTEXT:
  - file: packages/react/src/components/Form.tsx
  - modification: Add logging + detection to addSubscription and removeSubscription
  - impact: All subscription operations now visible in development
  - unchanged: Function signatures and external behavior

TEST_FILE:
  - file: packages/react/src/__tests__/useSubscriptions.test.tsx
  - modification: Add tests for logging and double-cleanup detection
  - pattern: Spy on console.warn, verify calls
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
pnpm lint --fix                    # Auto-format and fix linting issues
pnpm typecheck                     # Type checking

# Expected: Zero errors.
# If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific hook with new tests
pnpm test --filter @formality-ui/react useSubscriptions.test.tsx

# Test all hooks
pnpm test --filter @formality-ui/react --run src/__tests__/use*.test.tsx

# Expected: All tests pass including new logging tests.
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

### Level 4: Production Build Verification

```bash
# Verify logging is stripped from production builds
pnpm build
# Check that console.warn calls are behind environment checks
# Verify no production code changes (only development logging)

# Expected: Clean build with no production code impact.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Development logging added for subscription additions
- [ ] Development logging added for cleanup operations
- [ ] Double-cleanup detection implemented with warnings
- [ ] All logging behind `process.env.NODE_ENV !== "production"` checks
- [ ] LIFO ordering documented as correct
- [ ] All tests pass: `pnpm test --filter @formality-ui/react`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] Zero production code impact verified

### Feature Validation

- [ ] Subscription lifecycle is logged in development mode
- [ ] Double-cleanup attempts are detected and warned about
- [ ] LIFO ordering is confirmed as correct approach
- [ ] Run IDs are included in logs for correlation
- [ ] All existing tests continue to pass
- [ ] New tests verify logging and detection behavior

### Code Quality Validation

- [ ] Follows existing logging pattern from FieldGroup.tsx
- [ ] Uses console.warn (not console.log) consistently
- [ ] Messages include context (field names, target names, run IDs)
- [ ] No external logging libraries introduced
- [ ] Production build unchanged (logging stripped)

---

## Anti-Patterns to Avoid

- **Don't use console.log** - Always use console.warn for library code
- **Don't log in production** - All logging must be behind environment checks
- **Don't change cleanup ordering** - LIFO is correct, don't change to FIFO
- **Don't break existing tests** - All existing tests must continue to pass
- **Don't add external logging libraries** - Use direct console.warn
- **Don't modify per-effect tracking logic** - Only add logging, don't change algorithm
- **Don't forget to spy on console.warn in tests** - Tests need to verify logging
- **Don't log too verbosely** - Only important lifecycle events
- **Don't change function signatures** - External API must remain unchanged
- **Don't add production code** - All additions are development-only

---

## Related Work Items

- **Parent**: P3.M1 - Memory Leak Prevention (Planned)
- **Parent**: P3.M1.T1 - Improve Subscription Tracking (Planned)
- **Predecessor**: P3.M1.T1.S1 - Add per-effect tracking (Implementing in parallel)
- **Sibling**: P3.M1.T2 - Add Tests for Memory Leaks (Planned)

---

## Contract Dependencies

### From P3.M1.T1.S1 - Add Per-Effect Tracking (Implementing in Parallel)

The P3.M1.T1.S1 PRP implements per-effect subscription tracking.

**This PRP's Contract**:
1. This PRP ADDS development logging to the per-effect tracking from P3.M1.T1.S1
2. This PRP ADDS double-cleanup detection
3. This PRP DOES NOT modify the per-effect tracking logic
4. This PRP VERIFIES that LIFO ordering is correct

**Integration Point**: When P3.M1.T1.S1 is complete, P3.M1.T1.S2 adds observability and safety features on top of the per-effect tracking foundation.

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:
- Clear scope: Add logging and detection, no algorithm changes
- Previous PRP (P3.M1.T1.S1) provides solid foundation
- Comprehensive research documented
- Clear logging pattern exists in codebase
- LIFO ordering is confirmed correct by external research
- All file paths and line numbers specified
- Test patterns documented with examples
- Known gotchas and anti-patterns identified
- Validation commands specific to project

**Remaining 1 point uncertainty**: Double-cleanup detection may need minor adjustments based on testing scenarios, but this is low risk given the straightforward check implementation.

---

## References

### Internal Documentation

- [Dependency Analysis](./research/dependency-analysis.md) - Subscription dependencies and cleanup ordering
- [Logging Patterns](./research/logging-patterns.md) - Existing logging patterns and recommendations
- [External Research](./research/external-research.md) - External best practices confirming LIFO is correct

### Internal Code Files

- [useSubscriptions.ts](../../../../packages/react/src/hooks/useSubscriptions.ts) - Main implementation file (modified by P3.M1.T1.S1)
- [Form.tsx](../../../../packages/react/src/components/Form.tsx) - Subscription registry operations
- [FieldGroup.tsx](../../../../packages/react/src/components/FieldGroup.tsx) - Logging pattern reference

### External Documentation

- [React Effects Documentation](https://react.dev/learn/synchronizing-with-effects) - Understanding effect lifecycle and LIFO cleanup
- [React Strict Mode](https://react.dev/reference/react/StrictMode) - Double-invocation behavior

### Research Artifacts

- `/home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S2/research/` - All research documentation

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

  // Per-effect tracking (from P3.M1.T1.S1)
  const runIdRef = useRef<number>(0);
  const runSubscriptionsRef = useRef<Map<number, string[]>>(new Map());

  useEffect(() => {
    const currentRunId = ++runIdRef.current;
    runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

    // Add subscriptions with logging (NEW)
    subscriptions.forEach((target) => {
      addSubscription(target, fieldName);

      // NEW: Development logging
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Formality Subscription] Run ${currentRunId}: ` +
          `"${fieldName}" subscribing to "${target}"`
        );
      }
    });

    // Cleanup with logging (NEW)
    return () => {
      const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId);

      if (thisRunSubscriptions) {
        // NEW: Development logging
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[Formality Subscription] Run ${currentRunId}: ` +
            `"${fieldName}" cleaning up [${thisRunSubscriptions.join(', ')}]`
          );
        }

        // LIFO cleanup (from P3.M1.T1.S1)
        [...thisRunSubscriptions].reverse().forEach((target) => {
          removeSubscription(target, fieldName);
        });

        runSubscriptionsRef.current.delete(currentRunId);
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
```

```typescript
// File: packages/react/src/components/Form.tsx

// Lines 232-246: removeSubscription (MODIFIED)

const removeSubscription = useCallback(
  (target: string, subscriber: string) => {
    // NEW: Check if subscription exists before removal
    const subscribers = invertedSubscriptions.current.get(target);
    const subscriptionExists = subscribers?.has(subscriber) ?? false;

    // Perform removal (keep original optional chaining)
    invertedSubscriptions.current.get(target)?.delete(subscriber);

    // NEW: Log removal or warn about double-cleanup
    if (process.env.NODE_ENV !== "production") {
      if (subscriptionExists) {
        console.warn(
          `[Formality Subscription] "${subscriber}" removed from watching "${target}"`
        );
      } else {
        console.warn(
          `[Formality Subscription] WARNING: Double-cleanup attempt - ` +
          `"${subscriber}" was not watching "${target}"`
        );
      }
    }

    // Update watcher setter
    const setter = watcherSetters.current.get(target);
    if (setter) {
      setter((prev) => {
        const next = { ...prev };
        delete next[subscriber];
        return next;
      });
    }
  },
  [],
);
```

### Test Pattern for Logging

```typescript
// File: packages/react/src/__tests__/useSubscriptions.test.tsx

describe("development logging", () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log subscription additions in development", () => {
    renderTestHook(() => useSubscriptions('fieldA', ['fieldB']));

    expect(console.warn).toHaveBeenCalledWith(
      '[Formality Subscription] Run 1: "fieldA" subscribing to "fieldB"'
    );
  });

  it("should log cleanup operations in development", () => {
    const { unmount } = renderTestHook(() => useSubscriptions('fieldA', ['fieldB']));
    unmount();

    expect(console.warn).toHaveBeenCalledWith(
      '[Formality Subscription] Run 1: "fieldA" cleaning up [fieldB]'
    );
  });
});

describe("double-cleanup detection", () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should warn about double-cleanup attempts", () => {
    const { removeSubscription } = setupMockFormContext();

    // Add subscription
    removeSubscription('fieldB', 'fieldA'); // First removal (subscription exists)

    // Try to remove again
    removeSubscription('fieldB', 'fieldA'); // Second removal (subscription doesn't exist)

    expect(console.warn).toHaveBeenCalledWith(
      '[Formality Subscription] WARNING: Double-cleanup attempt - "fieldA" was not watching "fieldB"'
    );
  });
});
```

---

## LIFO Ordering Verification

### Why LIFO is Correct

1. **React Design**: React uses LIFO for cleanup by design (https://react.dev/learn/synchronizing-with-effects)

2. **Stack Unwinding**: LIFO mirrors stack unwinding behavior - dependent resources are released first

3. **Formality's Use Case**:
   - Subscriptions within a field are independent (e.g., subscribing to firstName and lastName)
   - LIFO cleanup (reverse order) is appropriate for independent subscriptions
   - Cross-field dependencies are handled by the invertedSubscriptions map, not by cleanup order

4. **No Dependencies Between Subscriptions**:
   - When Field A subscribes to [B, C, D], the subscriptions are independent
   - Removing D before C before B is safe because B, C, D don't depend on each other
   - The subscription registry (invertedSubscriptions) handles the dependency graph

5. **Per-Effect Tracking Handles Race Conditions**:
   - P3.M1.T1.S1's per-effect tracking ensures cleanup is scoped to each effect run
   - Run IDs prevent cross-contamination between effect runs
   - This is the primary defense against ordering issues

### When FIFO Might Be Considered (But Not Needed Here)

FIFO ordering would be needed if:
- Subscriptions had acquisition dependencies (must acquire A before B)
- Cleanup needed to happen in dependency order (must cleanup A before B)

**This is NOT the case for Formality** because:
- Subscriptions are independent registration operations
- The invertedSubscriptions map tracks relationships, not the cleanup order
- Field-level dependencies are handled by getAffectedFields, not cleanup order

### Conclusion

**LIFO is correct for Formality's subscription cleanup.**
- Matches React's design
- Safe for independent subscriptions
- Per-effect tracking provides additional safety
- No change to ordering needed in P3.M1.T1.S2
