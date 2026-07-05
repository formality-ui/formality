# PRP: Test Rapid Changes

**Work Item**: P3.M1.T2.S2 - Test rapid changes
**Parent Task**: P3.M1.T2 - Add Tests for Memory Leaks
**Parent Milestone**: P3.M1 - Memory Leak Prevention
**Priority**: P3 (Medium Priority Issue)
**Story Points**: 2
**Status**: **READY FOR IMPLEMENTATION**

---

## Goal

**Feature Goal**: Create comprehensive tests that verify rapid prop/config changes don't cause memory leaks, subscription count imbalances, or performance degradation in the useSubscriptions hook.

**Deliverable**:

1. Test suite verifying subscription count balance during rapid changes (10+ iterations)
2. Tests tracking subscription lifecycle through inspectable Maps
3. Tests verifying final subscription count matches expected state
4. Tests detecting memory growth using performance APIs when available
5. Tests verifying no console warnings during rapid changes

**Success Definition**:

- Subscription counts remain balanced after 10+ rapid changes
- `runSubscriptionsRef` Map doesn't accumulate entries (old runs are deleted)
- Final subscription state matches the last prop value
- No console warnings about memory leaks or orphaned subscriptions
- Memory growth (if measurable) remains within acceptable bounds
- All tests pass with the per-effect tracking from P3.M1.T1.S1

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Developing dynamic forms where field configurations change rapidly at runtime, ensuring:

- Forms handle rapid field config changes without memory leaks
- Dynamic field updates (e.g., conditional fields showing/hiding) don't accumulate subscriptions
- Long-running applications with frequent config updates remain stable

**User Journey**:

1. Developer creates form with dynamic field configuration
2. Field configuration changes rapidly (e.g., user selects different options, fields show/hide)
3. Subscriptions are added and removed correctly for each config change
4. No orphaned subscriptions remain after rapid changes
5. Memory usage remains stable

**Pain Points Addressed**:

- **Memory leak anxiety**: Uncertainty if rapid changes leave orphaned subscriptions
- **Performance degradation**: Forms becoming slower as subscriptions accumulate
- **Difficult debugging**: Hard to detect subscription leaks without proper tests

---

## Why

- **Memory Safety**: Prevents memory leaks from rapid configuration changes
- **Dynamic Forms**: Essential for forms with conditional field visibility
- **Production Stability**: Catches subscription accumulation issues before deployment
- **Performance**: Verifies the per-effect tracking from P3.M1.T1.S1 works correctly under stress
- **Documentation**: Tests serve as documentation of expected rapid change behavior

---

## What

### Current State Analysis

**From P3.M1.T1.S1 Contract**:
The previous work item (P3.M1.T1.S1) implements per-effect tracking with:

- `runIdRef`: Incrementing counter for each effect run
- `runSubscriptionsRef`: `Map<number, string[]>` storing subscriptions per run
- LIFO cleanup: `[...thisRunSubscriptions].reverse().forEach(...)`
- Map entry deletion: `runSubscriptionsRef.current.delete(currentRunId)`

**From P3.M1.T2.S1 Contract**:
The parallel work item (P3.M1.T2.S1) tests unmount cleanup scenarios:

- Tests verify Maps are empty after unmount
- Tests use WeakMap for component instance tracking
- Tests verify no console warnings during unmount

**Existing Tests** (packages/react/src/**tests**/useSubscriptions.test.tsx):
The test file already includes:

- Basic functionality tests
- Per-effect cleanup tests
- LIFO ordering tests
- Strict Mode tests
- Array isolation tests
- Development logging tests
- Double-cleanup detection tests
- **Lines 213-230**: Basic rapid changes test (only 3 changes)

**Problem**:

1. Existing rapid changes test only does 3 iterations (not stress testing)
2. No tests tracking subscription count balance
3. No tests verifying `runSubscriptionsRef` Map doesn't accumulate
4. No tests using performance.memory for memory growth detection
5. No tests for very rapid changes (10+ iterations)
6. No tests verifying final subscription count matches expected

### Success Criteria

- [ ] Tests verify subscription count balance after 10+ rapid changes
- [ ] Tests verify `runSubscriptionsRef` Map only has current run's entry
- [ ] Tests track subscription lifecycle through inspectable Maps
- [ ] Tests verify final subscription state matches last prop value
- [ ] Tests include memory growth detection when performance.memory available
- [ ] Tests verify no console warnings during rapid changes
- [ ] Tests cover different rapid change patterns (loop-based, rerender-based)
- [ ] All existing tests continue to pass

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:

- Exact file paths and existing test structure
- Previous PRP contracts (P3.M1.T1.S1, P3.M1.T2.S1) as foundation
- Complete implementation patterns with code examples
- External research with specific URLs
- All validation commands
- Clear distinction between P3.M1.T2.S1 (unmount) and P3.M1.T2.S2 (rapid changes)

### Documentation & References

```yaml
# MUST READ - Previous PRPs (foundation)
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S1/PRP.md
  why: Understanding per-effect tracking implementation
  contract: Per-effect tracking with runIdRef, runSubscriptionsRef, LIFO cleanup

- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T2S1/PRP.md
  why: Understanding unmount cleanup tests (avoid duplication)
  contract: P3.M1.T2.S1 tests unmount scenarios; P3.M1.T2.S2 tests rapid changes
  critical: DO NOT duplicate unmount tests - focus on rapid prop changes

# MUST READ - Main implementation file
- file: /home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts
  why: Primary file being tested - per-effect tracking for rapid changes
  exact: Lines 36-40 (runIdRef and runSubscriptionsRef declarations)
  exact: Lines 42-61 (Effect - add subscriptions with tracking)
  exact: Lines 64-86 (Cleanup - LIFO with map deletion)
  pattern: Per-effect tracking isolates each rapid change
  gotcha: Line 48 creates array copy - prevents reference sharing

# MUST READ - Existing test file
- file: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  why: Primary test file to modify - add rapid changes tests
  exact: Lines 1-40 (imports and mock context setup)
  exact: Lines 42-47 (wrapper creation)
  exact: Lines 49-1040 (existing tests - PRESERVE ALL)
  exact: Lines 213-230 (existing rapid changes test - NEEDS ENHANCEMENT)
  pattern: renderHook with rerender(), expect() assertions
  gotcha: Don't modify existing tests, only add new describe blocks

# RESEARCH - Codebase test patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T2S2/research/codebase-test-patterns.md
  why: Existing rapid change test patterns in Formality
  section: Existing Rapid Change Tests, Subscription Tracking Patterns

# RESEARCH - Subscription tracking implementation
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T2S2/research/subscription-tracking-implementation.md
  why: Understanding what needs to be tested for rapid changes
  section: Rapid Change Scenarios, What Needs to Be Tested

# RESEARCH - External testing patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T2S2/research/external-testing-patterns.md
  why: External best practices for rapid change testing
  section: Memory Leak Detection Patterns, Best Practices Summary

# EXTERNAL - React Testing Library
- url: https://testing-library.com/docs/react-testing-library/api#rerender
  why: rerender() API documentation for rapid prop changes
  critical: const { rerender } = renderHook(..., { initialProps })

# EXTERNAL - Performance API
- url: https://developer.mozilla.org/en-US/docs/Web/API/Performance
  why: performance.memory for memory leak detection (Chrome/Edge only)
  critical: performance.memory.usedJSHeapSize - measure before/after

# EXTERNAL - Vitest
- url: https://vitest.dev/guide/mocking.html
  why: How to spy on console methods
  critical: vi.spyOn(console, 'warn'), vi.restoreAllMocks()
```

### Current Codebase tree (relevant files)

```bash
packages/react/src/
├── hooks/
│   └── useSubscriptions.ts           # ← Implementation being tested
│       ├── Lines 1-6: Imports
│       ├── Lines 7-27: JSDoc
│       ├── Lines 28-88: useSubscriptions hook
│       │   ├── Lines 36-40: runIdRef, runSubscriptionsRef (PER-EFFECT TRACKING)
│       │   ├── Lines 42-61: Effect - add subscriptions
│       │   └── Lines 64-86: Cleanup - LIFO with map deletion
│       └── Line 89: End of function
│
└── __tests__/
    └── useSubscriptions.test.tsx      # ← MODIFY: Add rapid changes tests
        ├── Lines 1-8: Imports
        ├── Lines 9-40: Mock context creation
        ├── Lines 42-47: Wrapper creation
        ├── Lines 49-1040: EXISTING TESTS (PRESERVE ALL)
        └── ADD: New tests for rapid changes (10+ iterations, tracking)
```

### Desired Codebase tree with additions

```bash
packages/react/src/
├── hooks/
│   └── useSubscriptions.ts           # ← UNCHANGED (already has per-effect tracking)
│
└── __tests__/
    └── useSubscriptions.test.tsx      # ← MODIFY: Add rapid changes tests
        ├── [EXISTING: Lines 1-1040 - PRESERVE ALL EXISTING TESTS]
        │
        ├── ADD: describe("rapid changes - subscription count tracking")
        │   ├── ADD: Test with 10+ rapid changes
        │   ├── ADD: Test subscription count balance
        │   ├── ADD: Test runSubscriptionsRef doesn't accumulate
        │   └── ADD: Test final subscription state matches expected
        │
        ├── ADD: describe("rapid changes - memory leak detection")
        │   ├── ADD: Test with performance.memory if available
        │   ├── ADD: Test no console warnings during rapid changes
        │   └── ADD: Test with 100 rapid changes (stress test)
        │
        └── ADD: describe("rapid changes - different patterns")
            ├── ADD: Test loop-based rapid changes
            ├── ADD: Test rerender-based rapid changes
            └── ADD: Test mixed rapid change patterns
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Distinction from P3.M1.T2.S1
// P3.M1.T2.S1 tests UNMOUNT scenarios (component destruction)
// P3.M1.T2.S2 tests RAPID CHANGES (component stays mounted, props change)
// DO NOT duplicate unmount tests in this work item

// GOTCHA: Existing rapid changes test (line 213) only does 3 iterations
// This is insufficient for stress testing - need 10+ iterations
// Don't modify the existing test - add new tests instead

// CRITICAL: runSubscriptionsRef uses Map<number, string[]>
// After rapid changes, only the LATEST run's entry should exist
// Old run entries should be deleted by their cleanup functions

// GOTCHA: Testing subscription count balance requires inspectable context
// The default mock context doesn't expose the Maps
// Use createInspectableContext() pattern from P3.M1.T2.S1

// CRITICAL: performance.memory is Chrome/Edge only
// Must check if performance.memory exists before using
// Skip tests gracefully if not available

// GOTCHA: Rerender with new prop reference vs same reference
// React only re-runs effect when dependencies change (reference equality)
// Test both scenarios: changing reference and same reference

// CRITICAL: Existing tests MUST be preserved
// Lines 49-1040 contain existing tests
// DO NOT modify existing tests, only add new describe blocks

// GOTCHA: Test environment uses Vitest
// vi.spyOn(), vi.mocked(), vi.restoreAllMocks() - not jest
// renderHook() from @testing-library/react

// CRITICAL: Field name changes create new subscriber identity
// If fieldName changes rapidly, each change creates new subscriptions
// Tests should verify old subscriptions are removed
```

---

## Implementation Blueprint

### Data models and structure

No new data models needed. Testing existing structures:

```typescript
// Existing data structures to verify during rapid changes
type RunId = number;
type RunSubscriptionsMap = Map<RunId, string[]>;
type InvertedSubscriptionsMap = Map<string, Set<string>>;

// For tracking subscription counts in tests
type SubscriptionCountTracker = {
  addCount: number;
  removeCount: number;
};

// For memory tracking (when available)
type MemorySnapshot = {
  before: number;
  after: number;
  growth: number;
};
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ANALYZE existing test file and rapid changes test
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - UNDERSTAND: Lines 1-40 (imports and mock setup)
  - UNDERSTAND: Lines 42-47 (wrapper creation)
  - UNDERSTAND: Lines 49-1040 (existing tests - MUST PRESERVE)
  - UNDERSTAND: Lines 213-230 (existing rapid changes test - only 3 iterations)
  - IDENTIFY: Where to add new tests (after line 1040)
  - PRESERVE: ALL existing tests unchanged
  - NOTE: createInspectableContext() should already exist from P3.M1.T2.S1

Task 2: ADD describe("rapid changes - subscription count tracking") block
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - LOCATION: After line 1040 (after existing tests)
  - ADD: Test with 10+ rapid subscription changes
  - ADD: Test verifying subscription count balance
  - ADD: Test verifying runSubscriptionsRef only has latest entry
  - ADD: Test verifying final subscription state matches last prop
  - PATTERN: Use createInspectableContext() from P3.M1.T2.S1
  - VERIFY: Subscription counts balance after all changes

Task 3: ADD describe("rapid changes - memory leak detection") block
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - LOCATION: After Task 2 tests
  - ADD: Test with performance.memory if available (check for existence)
  - ADD: Test verifying no console warnings during rapid changes
  - ADD: Stress test with 100 rapid changes
  - VERIFY: No memory leak warnings
  - VERIFY: Memory growth within acceptable bounds (if measurable)

Task 4: ADD describe("rapid changes - different patterns") block
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - LOCATION: After Task 3 tests
  - ADD: Test loop-based rapid changes (for loop with rerender)
  - ADD: Test rapid field name changes
  - ADD: Test mixed patterns (subscriptions + fieldName changes)
  - VERIFY: All patterns maintain subscription balance

Task 5: RUN tests to verify implementation
  - COMMAND: pnpm test --filter @formality-ui/react useSubscriptions.test.tsx
  - VERIFY: All new tests pass
  - VERIFY: No existing tests break
  - EXPECTED: Zero test failures

Task 6: RUN full React test suite for regressions
  - COMMAND: pnpm test --filter @formality-ui/react
  - VERIFY: All React tests pass
  - EXPECTED: Zero test failures
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Rapid Changes with Subscription Count Tracking
// ============================================================================

// ADD in describe("rapid changes - subscription count tracking")

describe("rapid changes - subscription count tracking", () => {
  it("should maintain subscription count balance with 10+ rapid changes", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    // Track add/remove calls
    let addCount = 0;
    let removeCount = 0;

    // Override mocks to track counts
    const originalAdd = inspectableContext.addSubscription;
    const originalRemove = inspectableContext.removeSubscription;

    inspectableContext.addSubscription = vi.fn((...args) => {
      addCount++;
      return originalAdd(...args);
    });

    inspectableContext.removeSubscription = vi.fn((...args) => {
      removeCount++;
      return originalRemove(...args);
    });

    const { rerender } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] },
      },
    );

    // Initial subscription
    expect(addCount).toBe(1);
    expect(removeCount).toBe(0);

    // Perform 10+ rapid changes
    for (let i = 0; i < 15; i++) {
      rerender({ subscriptions: [`field${i + 3}`] });
    }

    // Final state: should have 1 add (initial) + 15 adds (changes) + 15 removes (cleanups)
    expect(addCount).toBe(16);
    expect(removeCount).toBe(15);

    // Verify final subscription state
    const state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("field17")).toContain("field1");
  });

  it("should only have latest run entry in runSubscriptionsRef after rapid changes", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    const { rerender } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] },
      },
    );

    // Perform rapid changes
    for (let i = 0; i < 10; i++) {
      rerender({ subscriptions: [`field${i + 3}`] });
    }

    // Check runSubscriptionsRef - should only have latest entry
    // Note: This requires the hook to expose runSubscriptionsRef for inspection
    // If not exposed, verify through invertedSubscriptions state instead
    const state = inspectableContext.getInspectableState();

    // Should only have subscription to last field
    expect(state.invertedSubscriptions.get("field12")).toContain("field1");
    // Previous fields should not have field1 as subscriber
    for (let i = 0; i < 11; i++) {
      if (i !== 10) {
        // Skip the last one
        const fieldName = `field${i + 2}`;
        const watchers = state.invertedSubscriptions.get(fieldName);
        expect(watchers?.contains("field1") ?? false).toBe(false);
      }
    }
  });

  it("should verify final subscription state matches last prop value", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    const { rerender } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["fieldA", "fieldB"] },
      },
    );

    // Rapid changes to different subscription sets
    rerender({ subscriptions: ["fieldC"] });
    rerender({ subscriptions: ["fieldD", "fieldE", "fieldF"] });
    rerender({ subscriptions: ["fieldG"] });

    // Verify final state matches last prop
    const state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("fieldG")).toContain("field1");
    expect(
      state.invertedSubscriptions.get("fieldA")?.has("field1") ?? false,
    ).toBe(false);
    expect(
      state.invertedSubscriptions.get("fieldB")?.has("field1") ?? false,
    ).toBe(false);
    expect(
      state.invertedSubscriptions.get("fieldC")?.has("field1") ?? false,
    ).toBe(false);
    expect(
      state.invertedSubscriptions.get("fieldD")?.has("field1") ?? false,
    ).toBe(false);
    expect(
      state.invertedSubscriptions.get("fieldE")?.has("field1") ?? false,
    ).toBe(false);
    expect(
      state.invertedSubscriptions.get("fieldF")?.has("field1") ?? false,
    ).toBe(false);
  });
});

// ============================================================================
// PATTERN 2: Memory Leak Detection with Performance API
// ============================================================================

// ADD in describe("rapid changes - memory leak detection")

describe("rapid changes - memory leak detection", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not leak memory with 10+ rapid changes (performance.memory)", () => {
    // Skip if performance.memory not available (Chrome/Edge only)
    if (!performance.memory) {
      console.warn("performance.memory not available - skipping memory test");
      return;
    }

    const wrapper = createWrapper(createMockContext());

    // Force GC before test if available
    if (global.gc) {
      global.gc();
    }

    const initialMemory = performance.memory.usedJSHeapSize;

    const { rerender } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] },
      },
    );

    // Perform many rapid changes
    for (let i = 0; i < 50; i++) {
      rerender({ subscriptions: [`field${i + 3}`] });
    }

    // Force GC after test if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryGrowth = finalMemory - initialMemory;

    // Memory growth should be reasonable (< 5MB for 50 changes)
    // This is a generous threshold to account for test overhead
    expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024);
  });

  it("should not warn about memory leaks during rapid changes", () => {
    const wrapper = createWrapper(createMockContext());

    const { rerender } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] },
      },
    );

    // Clear existing logs
    vi.mocked(console.warn).mockClear();

    // Perform rapid changes
    for (let i = 0; i < 20; i++) {
      rerender({ subscriptions: [`field${i + 3}`] });
    }

    // Check for memory leak warnings
    const warnCalls = vi.mocked(console.warn).mock.calls;
    const memoryLeakWarnings = warnCalls.filter(
      (call) =>
        call[0]?.includes("memory leak") ||
        call[0]?.includes("orphaned") ||
        call[0]?.includes("WARNING"),
    );

    // Development logging is expected (e.g., "Run X: cleaning up")
    // But no memory leak or orphaned subscription warnings
    expect(memoryLeakWarnings).toHaveLength(0);
  });

  it("should handle 100 rapid changes without issues (stress test)", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    const { rerender } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] },
      },
    );

    // Stress test with 100 rapid changes
    for (let i = 0; i < 100; i++) {
      rerender({ subscriptions: [`field${(i % 10) + 3}`] });
    }

    // Verify final state is correct
    const state = inspectableContext.getInspectableState();
    // Last subscription would be to field3 (100 % 10 = 0, so field(0+3) = field3)
    expect(state.invertedSubscriptions.get("field3")).toContain("field1");

    // Verify no warnings
    const warnCalls = vi.mocked(console.warn).mock.calls;
    const memoryLeakWarnings = warnCalls.filter(
      (call) =>
        call[0]?.includes("memory leak") || call[0]?.includes("orphaned"),
    );
    expect(memoryLeakWarnings).toHaveLength(0);
  });
});

// ============================================================================
// PATTERN 3: Different Rapid Change Patterns
// ============================================================================

// ADD in describe("rapid changes - different patterns")

describe("rapid changes - different patterns", () => {
  it("should handle loop-based rapid subscription changes", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    const { rerender } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] },
      },
    );

    // Loop-based changes
    const subscriptionsList = [
      ["field3"],
      ["field4", "field5"],
      ["field6"],
      ["field7", "field8", "field9"],
      ["field10"],
    ];

    subscriptionsList.forEach((subs) => {
      rerender({ subscriptions: subs });
    });

    // Verify final state
    const state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("field10")).toContain("field1");
  });

  it("should handle rapid field name changes", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    const { rerender } = renderHook(
      ({ fieldName }) => useSubscriptions(fieldName, ["targetField"]),
      {
        wrapper,
        initialProps: { fieldName: "field1" },
      },
    );

    // Rapid field name changes
    for (let i = 0; i < 10; i++) {
      rerender({ fieldName: `field${i + 2}` });
    }

    // Verify only last field is subscribed
    const state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("targetField")).toContain("field11");

    // Previous fields should not be subscribed
    for (let i = 1; i < 11; i++) {
      expect(state.invertedSubscriptions.get("targetField")).not.toContain(
        `field${i}`,
      );
    }
  });

  it("should handle mixed rapid changes (subscriptions + field name)", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    const { rerender } = renderHook(
      ({ fieldName, subscriptions }) =>
        useSubscriptions(fieldName, subscriptions),
      {
        wrapper,
        initialProps: {
          fieldName: "field1",
          subscriptions: ["target1"],
        },
      },
    );

    // Mixed changes
    rerender({ fieldName: "field1", subscriptions: ["target2"] });
    rerender({ fieldName: "field2", subscriptions: ["target2"] });
    rerender({ fieldName: "field2", subscriptions: ["target3"] });
    rerender({ fieldName: "field3", subscriptions: ["target3"] });

    // Verify final state
    const state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("target3")).toContain("field3");

    // Previous subscriptions should be cleaned up
    expect(
      state.invertedSubscriptions.get("target1")?.has("field1") ?? false,
    ).toBe(false);
    expect(
      state.invertedSubscriptions.get("target2")?.has("field1") ?? false,
    ).toBe(false);
    expect(
      state.invertedSubscriptions.get("target2")?.has("field2") ?? false,
    ).toBe(false);
  });
});
```

### Integration Points

```yaml
USESUBSCRIPTIONS_HOOK:
  - file: packages/react/src/hooks/useSubscriptions.ts
  - tested_by: New rapid changes tests in useSubscriptions.test.tsx
  - verifies: Per-effect tracking handles rapid changes correctly
  - verifies: runSubscriptionsRef.delete() is called for old runs

P3M1T1S1_CONTRACT:
  - dependency: Per-effect tracking implementation
  - tested_by: New rapid changes tests
  - verifies: runIdRef increments on each rapid change
  - verifies: runSubscriptionsRef only has latest entry

P3M1T2S1_CONTRACT:
  - dependency: Unmount cleanup tests (sibling work item)
  - distinction: P3.M1.T2.S1 tests unmount; P3.M1.T2.S2 tests rapid changes
  - avoids: Duplication of unmount scenarios
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after test file modifications - fix before proceeding
pnpm lint --fix                    # Auto-format and fix linting issues
pnpm typecheck                     # Type checking

# Expected: Zero errors.
# If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific test file with new tests
pnpm test --filter @formality-ui/react useSubscriptions.test.tsx

# Run with verbose output to see all test results
pnpm test --filter @formality-ui/react useSubscriptions.test.tsx --reporter=verbose

# Expected: All tests pass including new rapid changes tests.
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test full react package
pnpm test --filter @formality-ui/react

# Focus on related tests
pnpm test --filter @formality-ui/react --run src/__tests__/use*.test.tsx

# Expected: All React tests pass, no regressions.
```

### Level 4: Stress Testing (Optional)

```bash
# Run rapid changes tests multiple times to catch any state leakage
for i in {1..20}; do
  pnpm test --filter @formality-ui/react useSubscriptions.test.tsx -t "rapid changes" || exit 1
done

# Expected: All iterations pass without state accumulation
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Tests verify subscription count balance after 10+ rapid changes
- [ ] Tests verify runSubscriptionsRef only has latest entry
- [ ] Tests verify final subscription state matches last prop
- [ ] Memory leak tests included (with performance.memory check)
- [ ] Console warning tests verify no unexpected warnings
- [ ] All tests pass: `pnpm test --filter @formality-ui/react useSubscriptions.test.tsx`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] All existing tests still pass

### Feature Validation

- [ ] Subscription count tracking tests added
- [ ] Memory leak detection tests added
- [ ] Different rapid change patterns tested
- [ ] Tests cover 10+ rapid changes
- [ ] Tests cover 100 rapid changes (stress test)
- [ ] Tests verify no console warnings
- [ ] Tests use performance.memory when available
- [ ] No duplication with P3.M1.T2.S1 unmount tests

### Code Quality Validation

- [ ] Follows existing test patterns from codebase
- [ ] Uses createInspectableContext() pattern
- [ ] Tests are readable and well-documented
- [ ] No existing tests modified
- [ ] New tests follow naming conventions
- [ ] Test structure matches existing patterns

### Documentation & Deployment

- [ ] Test names clearly describe what is being verified
- [ ] Test assertions are specific and meaningful
- [ ] Research documents stored in work item directory
- [ ] PRP includes all context and references

---

## Anti-Patterns to Avoid

- **Don't duplicate P3.M1.T2.S1 tests** - P3.M1.T2.S1 tests unmount; P3.M1.T2.S2 tests rapid changes
- **Don't modify existing tests** - All existing tests (lines 49-1040) must be preserved
- **Don't use only 3 iterations** - Use 10+ iterations for stress testing (existing test only does 3)
- **Don't forget performance.memory check** - Must check if available before using
- **Don't skip subscription count verification** - Critical for detecting leaks
- **Don't use jest directly** - Use Vitest APIs (vi.spyOn, vi.mocked, vi.restoreAllMocks)
- **Don't forget to restore mocks** - Always use afterEach to restore console spies
- **Don't test implementation details** - Test observable behavior (subscription counts, Map state)
- **Don't assume performance.memory exists** - Must check and skip gracefully if not available
- **Don't create side effects** - Each test should be isolated

---

## Related Work Items

- **Parent**: P3.M1 - Memory Leak Prevention (Planned)
- **Parent**: P3.M1.T2 - Add Tests for Memory Leaks (Planned)
- **Predecessor**: P3.M1.T1.S1 - Add per-effect tracking (Implementing in parallel)
- **Sibling**: P3.M1.T1.S2 - Add cleanup ordering and logging (Implementing in parallel)
- **Sibling**: P3.M1.T2.S1 - Test unmount cleanup (Implementing in parallel)

---

## Contract Dependencies

### From P3.M1.T1.S1 - Add Per-Effect Tracking (Implementing in Parallel)

The P3.M1.T1.S1 PRP implements per-effect subscription tracking.

**This PRP's Contract**:

1. This PRP TESTS the per-effect tracking from P3.M1.T1.S1
2. This PRP VERIFIES that runIdRef increments correctly during rapid changes
3. This PRP VERIFIES that runSubscriptionsRef only has the latest entry after rapid changes
4. This PRP VERIFIES that old run entries are deleted (no accumulation)
5. This PRP DOES NOT modify the implementation, only adds tests

**Integration Point**: When P3.M1.T1.S1 is complete, P3.M1.T2.S2 tests verify the implementation works correctly under rapid changes.

### From P3.M1.T2.S1 - Test Unmount Cleanup (Implementing in Parallel)

The P3.M1.T2.S1 PRP adds tests for unmount cleanup scenarios.

**This PRP's Contract**:

1. This PRP is DISTINCT from P3.M1.T2.S1 (no overlap)
2. P3.M1.T2.S1 tests UNMOUNT scenarios (component destruction)
3. P3.M1.T2.S2 tests RAPID CHANGES (component stays mounted, props change)
4. This PRP DOES NOT duplicate unmount tests
5. This PRP FOCUSES on rapid prop/config changes

**Integration Point**: P3.M1.T2.S1 and P3.M1.T2.S2 together provide comprehensive memory leak testing coverage.

### From P3.M1.T1.S2 - Add Cleanup Ordering and Logging (Implementing in Parallel)

The P3.M1.T1.S2 PRP adds development logging and double-cleanup detection.

**This PRP's Contract**:

1. This PRP TESTS the development logging from P3.M1.T1.S2
2. This PRP VERIFIES that console.warn is called correctly during rapid changes
3. This PRP VERIFIES that no unexpected warnings appear during rapid changes
4. This PRP DOES NOT modify the implementation, only adds tests

**Integration Point**: When P3.M1.T1.S2 is complete, P3.M1.T2.S2 tests verify the logging works correctly during rapid changes.

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:

- Clear scope: Add tests only, no implementation changes
- Previous PRPs (P3.M1.T1.S1, P3.M1.T1.S2, P3.M1.T2.S1) provide solid foundation
- Comprehensive research documented with code examples
- Clear test patterns exist in codebase
- External research provides best practices
- All file paths and line numbers specified
- Test patterns documented with examples
- Known gotchas and anti-patterns identified
- Validation commands specific to project
- Clear distinction from P3.M1.T2.S1 (unmount vs rapid changes)

**Remaining 1 point uncertainty**: The performance.memory tests may behave differently across browsers/environments, but the check-and-skip pattern handles this gracefully.

---

## References

### Internal Documentation

- [Codebase Test Patterns](./research/codebase-test-patterns.md) - Existing rapid change test patterns in Formality
- [Subscription Tracking Implementation](./research/subscription-tracking-implementation.md) - Per-effect tracking mechanisms
- [External Testing Patterns](./research/external-testing-patterns.md) - Best practices from React community

### Internal Code Files

- [useSubscriptions.test.tsx](../../../../packages/react/src/__tests__/useSubscriptions.test.tsx) - Test file to modify
- [useSubscriptions.ts](../../../../packages/react/src/hooks/useSubscriptions.ts) - Implementation being tested
- [Form.tsx](../../../../packages/react/src/components/Form.tsx) - Subscription registry operations

### External Documentation

- [React Testing Library - rerender](https://testing-library.com/docs/react-testing-library/api#rerender) - Rerender API documentation
- [useEffect Documentation](https://react.dev/reference/react/useEffect) - Understanding cleanup behavior
- [React Effects Guide](https://react.dev/learn/synchronizing-with-effects) - Effect lifecycle and cleanup
- [Performance API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance) - Memory measurement
- [Vitest Mocking](https://vitest.dev/guide/mocking.html) - How to spy on console methods

### Research Artifacts

- `/home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T2S2/research/` - All research documentation

---

## Appendix: Quick Reference

### Test File Structure

```typescript
// File: packages/react/src/__tests__/useSubscriptions.test.tsx

// Lines 1-8: Imports (UNCHANGED)
// Lines 9-40: createMockContext() (UNCHANGED)
// Lines 42-47: createWrapper() (UNCHANGED)

// Lines 49-1040: All existing tests (UNCHANGED - PRESERVE ALL)
// This includes P3.M1.T1.S1, P3.M1.T1.S2, and P3.M1.T2.S1 tests

// ADD: New tests for rapid changes (after line 1040)

describe("rapid changes - subscription count tracking", () => {
  // ... tests for subscription count balance
});

describe("rapid changes - memory leak detection", () => {
  // ... tests for memory growth and warnings
});

describe("rapid changes - different patterns", () => {
  // ... tests for various rapid change patterns
});
```

### Key Test Patterns

```typescript
// Pattern 1: Subscription Count Tracking
let addCount = 0;
let removeCount = 0;

const { rerender } = renderHook(
  ({ subscriptions }) => useSubscriptions("field1", subscriptions),
  { wrapper, initialProps: { subscriptions: ["field2"] } },
);

for (let i = 0; i < 15; i++) {
  rerender({ subscriptions: [`field${i + 3}`] });
}

expect(addCount).toBe(16); // Initial + 15 changes
expect(removeCount).toBe(15); // 15 cleanups

// Pattern 2: Memory Growth Detection
if (performance.memory) {
  const before = performance.memory.usedJSHeapSize;

  // ... rapid changes ...

  const after = performance.memory.usedJSHeapSize;
  expect(after - before).toBeLessThan(5 * 1024 * 1024); // < 5MB
}

// Pattern 3: Console Warning Spy
beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ... rapid changes ...

const memoryLeakWarnings = vi
  .mocked(console.warn)
  .mock.calls.filter((call) => call[0]?.includes("memory leak"));
expect(memoryLeakWarnings).toHaveLength(0);
```

### Distinction from P3.M1.T2.S1

| Aspect        | P3.M1.T2.S1 (Unmount)         | P3.M1.T2.S2 (Rapid Changes)      |
| ------------- | ----------------------------- | -------------------------------- |
| Focus         | Component unmount/destruction | Rapid prop changes while mounted |
| Key Operation | `unmount()`                   | `rerender()`                     |
| Scenario      | Field removed from form       | Field config changes rapidly     |
| Verification  | Maps empty after unmount      | Subscription count balance       |
| Stress Test   | Multiple fields unmounting    | 10+ rapid changes                |

**DO NOT duplicate unmount tests in P3.M1.T2.S2**
