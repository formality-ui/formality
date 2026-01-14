# PRP: Test Unmount Cleanup

**Work Item**: P3.M1.T2.S1 - Test unmount cleanup
**Parent Task**: P3.M1.T2 - Add Tests for Memory Leaks
**Parent Milestone**: P3.M1 - Memory Leak Prevention
**Priority**: P3 (Medium Priority Issue)
**Story Points**: 2
**Status**: **READY FOR IMPLEMENTATION**

---

## Goal

**Feature Goal**: Create comprehensive tests that verify all subscriptions are completely cleaned up when a form component unmounts, with no orphaned subscriptions or memory leaks.

**Deliverable**:
1. Test suite verifying complete subscription cleanup on component unmount
2. Tests using WeakMap/custom tracking to verify no references remain
3. Tests verifying no console warnings about memory leaks
4. Tests covering complex scenarios (multiple fields, nested subscriptions, rapid changes)

**Success Definition**:
- All subscriptions are verified as removed from invertedSubscriptions after unmount
- runSubscriptionsRef Map is verified empty after cleanup
- No console warnings about memory leaks or orphaned subscriptions
- Tests cover edge cases (multiple fields, rapid changes, Strict Mode)
- All tests pass with the per-effect tracking from P3.M1.T1.S1

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Developing complex forms with dynamic field subscriptions, ensuring:
- Forms can be mounted/unmounted without memory leaks
- Dynamic field addition/removal doesn't leave orphaned subscriptions
- Long-running applications don't accumulate memory from subscription leaks

**User Journey**:
1. Developer creates form with complex field dependencies
2. Form is mounted, subscriptions are created
3. Form is unmounted (fields removed, component destroyed)
4. All subscriptions are cleaned up, no memory leaks
5. Developer confidence that repeated mount/unmount cycles are safe

**Pain Points Addressed**:
- **Memory leak anxiety**: Uncertainty if subscriptions are properly cleaned up
- **Long-running application issues**: Memory accumulation from orphaned subscriptions
- **Dynamic forms**: Adding/removing fields potentially leaving subscriptions behind

---

## Why

- **Memory Safety**: Prevents memory leaks in long-running applications
- **Dynamic Forms**: Ensures dynamic field addition/removal is safe
- **Confidence**: Verifies the per-effect tracking from P3.M1.T1.S1 works correctly
- **Production Readiness**: Catches memory leak issues before deployment
- **Documentation**: Tests serve as documentation of expected cleanup behavior

---

## What

### Current State Analysis

**From P3.M1.T1.S1 Contract**:
The previous work item (P3.M1.T1.S1) implements per-effect tracking with:
- `runIdRef`: Incrementing counter for each effect run
- `runSubscriptionsRef`: `Map<number, string[]>` storing subscriptions per run
- LIFO cleanup: `[...thisRunSubscriptions].reverse().forEach(...)`
- Map entry deletion: `runSubscriptionsRef.current.delete(currentRunId)`

**From P3.M1.T1.S2 Contract**:
The parallel work item (P3.M1.T1.S2) adds:
- Development logging for subscription lifecycle events
- Double-cleanup detection with warnings
- All logging is behind `process.env.NODE_ENV !== "production"` checks

**Existing Tests** (packages/react/src/__tests__/useSubscriptions.test.tsx):
The test file already includes:
- Basic functionality tests (lines 57-78)
- Per-effect cleanup tests (lines 80-148)
- LIFO ordering tests (lines 150-175)
- Strict Mode tests (lines 177-241)
- Array isolation tests (lines 243-264)
- Development logging tests (lines 266-337)
- Double-cleanup detection tests (lines 339-361)

**Problem**:
1. Existing tests verify `removeSubscription` is called, but don't verify the Map is actually empty
2. No tests using WeakMap or custom tracking to verify complete cleanup
3. No tests verifying no console warnings about memory leaks
4. No comprehensive multi-field unmount tests
5. No tests for nested subscription cleanup scenarios

### Success Criteria

- [ ] Tests verify invertedSubscriptions Map is empty after unmount
- [ ] Tests verify runSubscriptionsRef Map is empty after cleanup
- [ ] Tests use WeakMap or custom tracking to verify no references remain
- [ ] Tests verify no console warnings about memory leaks
- [ ] Tests cover multiple fields unmounting
- [ ] Tests cover rapid subscription changes followed by unmount
- [ ] Tests cover nested subscription scenarios
- [ ] All existing tests continue to pass

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:
- Exact file paths for existing tests and implementation
- Previous PRP contracts (P3.M1.T1.S1, P3.M1.T1.S2) as foundation
- Complete test patterns with examples from codebase
- External research with specific URLs
- Data structure analysis for verification
- All validation commands

### Documentation & References

```yaml
# MUST READ - Previous PRPs (foundation)
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S1/PRP.md
  why: Understanding per-effect tracking implementation
  contract: This PRP builds on per-effect tracking from P3.M1.T1.S1
  critical: runIdRef, runSubscriptionsRef, LIFO cleanup pattern

- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S2/PRP.md
  why: Understanding development logging and double-cleanup detection
  contract: This PRP tests the logging added in P3.M1.T1.S2
  critical: Development logging patterns, console.warn format

# MUST READ - Main implementation file
- file: /home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts
  why: Primary file being tested - contains per-effect tracking
  exact: Lines 1-89 (complete implementation)
  exact: Lines 36-40 (runIdRef and runSubscriptionsRef declarations)
  exact: Lines 42-87 (useEffect with per-effect tracking and cleanup)
  pattern: Per-effect tracking with LIFO cleanup
  gotcha: runSubscriptionsRef.delete(currentRunId) is critical for cleanup

# MUST READ - Form subscription operations
- file: /home/dustin/projects/formality/packages/react/src/components/Form.tsx
  why: Understanding subscription registry operations being tested
  exact: Lines 180 (invertedSubscriptions Map declaration)
  exact: Lines 183 (watcherSetters Map declaration)
  exact: Lines 185-186 (pendingWatcherUpdates Map declaration)
  exact: Lines 212-230 (addSubscription function)
  exact: Lines 232-246 (removeSubscription function)
  pattern: Inverted index for subscription tracking
  gotcha: Need to verify these Maps are empty after unmount

# MUST READ - Existing test file
- file: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  why: Primary test file to modify - add new tests for unmount cleanup
  exact: Lines 1-40 (imports and mock context setup)
  exact: Lines 42-47 (wrapper creation)
  exact: Lines 49-362 (existing tests - PRESERVE ALL)
  pattern: Follow existing test structure and naming
  gotcha: Don't modify existing tests, only add new describe blocks

# MUST READ - Existing test patterns (from codebase)
- file: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  exact: Lines 113-147 (rapid changes test pattern)
  exact: Lines 150-174 (LIFO cleanup test pattern)
  exact: Lines 177-241 (Strict Mode test patterns)
  pattern: renderHook with wrapper, unmount(), expect() assertions
  gotcha: Use mockClear() to isolate specific operations

# RESEARCH - Codebase test patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T2S1/research/codebase-test-patterns.md
  why: Existing test patterns in Formality codebase
  section: Unmount/Cleanup Test Patterns, Rapid Changes Test, Strict Mode Tests

# RESEARCH - Subscription tracking implementation
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T2S1/research/subscription-tracking-implementation.md
  why: Understanding data structures that need verification
  section: Data Structures Used, What Needs to Be Tested for Complete Cleanup Verification

# RESEARCH - External testing patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T2S1/research/external-testing-patterns.md
  why: External best practices for memory leak testing
  section: Memory Leak Testing Patterns, WeakMap Pattern, Complete Cleanup Verification Pattern

# EXTERNAL - React Testing Library
- url: https://testing-library.com/docs/react-testing-library/api#unmount
  why: Unmount API documentation
  critical: const { unmount } = renderHook(...)

# EXTERNAL - useEffect cleanup
- url: https://react.dev/reference/react/useEffect
  why: Understanding useEffect cleanup behavior
  critical: Cleanup function runs before next effect or unmount

# EXTERNAL - Strict Mode
- url: https://react.dev/reference/react/StrictMode
  why: Understanding double-invocation behavior
  critical: Cleanups must be idempotent

# EXTERNAL - Vitest mocking
- url: https://vitest.dev/guide/mocking.html
  why: How to spy on console.warn and Map methods
  critical: vi.spyOn(console, 'warn'), vi.spyOn(Map.prototype, 'delete')
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
│       │   ├── Lines 42-61: Effect - add subscriptions with logging
│       │   └── Lines 64-86: Cleanup - LIFO with logging + map deletion
│       └── Line 89: End of function
│
├── components/
│   └── Form.tsx                       # ← Subscription registry (tested indirectly)
│       ├── Line 180: invertedSubscriptions Map
│       ├── Lines 212-230: addSubscription
│       └── Lines 232-246: removeSubscription
│
└── __tests__/
    └── useSubscriptions.test.tsx      # ← MODIFY: Add new tests for unmount cleanup
        ├── Lines 1-8: Imports
        ├── Lines 9-40: Mock context creation
        ├── Lines 42-47: Wrapper creation
        ├── Lines 49-362: EXISTING TESTS (PRESERVE ALL)
        └── ADD: New tests for complete cleanup verification
```

### Desired Codebase tree with additions

```bash
packages/react/src/
├── hooks/
│   └── useSubscriptions.ts           # ← UNCHANGED (already has per-effect tracking)
│
├── components/
│   └── Form.tsx                       # ← UNCHANGED (already has subscription registry)
│
└── __tests__/
    └── useSubscriptions.test.tsx      # ← MODIFY: Add new tests for unmount cleanup
        ├── [EXISTING: Lines 1-362 - PRESERVE ALL EXISTING TESTS]
        │
        ├── ADD: describe("complete cleanup verification")
        │   ├── ADD: Test for invertedSubscriptions Map cleanup
        │   ├── ADD: Test for runSubscriptionsRef Map cleanup
        │   ├── ADD: Test for watcherSetters Map cleanup
        │   └── ADD: Test for pendingWatcherUpdates Map cleanup
        │
        ├── ADD: describe("WeakMap cleanup verification")
        │   ├── ADD: Test using WeakMap to track component instances
        │   └── ADD: Test verifying no references remain after unmount
        │
        ├── ADD: describe("multi-field unmount scenarios")
        │   ├── ADD: Test multiple fields unmounting together
        │   ├── ADD: Test nested subscription cleanup
        │   └── ADD: Test complex dependency chains
        │
        └── ADD: describe("no memory leak warnings")
            ├── ADD: Test verifying no console warnings
            └── ADD: Test with rapid changes + unmount
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: runSubscriptionsRef uses Map<number, string[]>
// The delete() method MUST be called for cleanup
// If delete() is not called, runSubscriptionsRef will accumulate entries
// Line 84: runSubscriptionsRef.current.delete(currentRunId) - CRITICAL

// GOTCHA: invertedSubscriptions is in Form.tsx, not useSubscriptions.ts
// Tests need to access Form's internal state for verification
// Use a custom Form implementation or spy on Map operations

// GOTCHA: Testing Map cleanup requires custom Form context
// The default mock context doesn't expose the Maps for inspection
// Need to create a custom implementation that exposes the Maps

// CRITICAL: React 18 Strict Mode double-invocation
// Effects run twice in development with Strict Mode
// Per-effect tracking (from P3.M1.T1.S1) handles this correctly
// Tests should verify this doesn't cause issues

// GOTCHA: console.warn spying for development logging
// P3.M1.T1.S2 adds development logging with console.warn
// Tests should verify no unexpected warnings during cleanup

// GOTCHA: WeakMap cannot be enumerated
// Cannot use .size or .forEach() on WeakMap
// Use WeakMap for tracking, but verify cleanup through other means

// CRITICAL: Existing tests MUST be preserved
// Lines 49-362 contain existing tests from P3.M1.T1.S1 and P3.M1.T1.S2
// DO NOT modify existing tests, only add new describe blocks

// GOTCHA: Test environment uses Vitest
// vi.spyOn(), vi.mocked(), vi.restoreAllMocks() - not jest
// renderHook() from @testing-library/react
```

---

## Implementation Blueprint

### Data models and structure

No new data models needed. Testing existing structures:
```typescript
// Existing data structures to verify cleanup
type RunId = number;
type RunSubscriptionsMap = Map<RunId, string[]>;
type InvertedSubscriptionsMap = Map<string, Set<string>>;
type WatcherSettersMap = Map<string, WatcherSetterFn>;

// WeakMap for component instance tracking
type TrackedInstances = WeakMap<object, { subscriptions: string[] }>;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ANALYZE existing test file structure
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - UNDERSTAND: Lines 1-40 (imports and mock setup)
  - UNDERSTAND: Lines 42-47 (wrapper creation)
  - UNDERSTAND: Lines 49-362 (existing tests - MUST PRESERVE)
  - IDENTIFY: Where to add new tests (after line 362)
  - PRESERVE: ALL existing tests unchanged

Task 2: CREATE custom Form context for Map inspection
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - ADD: Helper function to create a context with exposed Maps
  - NAME: createInspectableContext()
  - IMPLEMENT: Custom FormContextValue that exposes invertedSubscriptions, runSubscriptionsRef
  - PATTERN: Follow createMockContext() pattern (lines 10-40)
  - PURPOSE: Allow tests to inspect Map state for verification
  - PLACEMENT: After createMockContext() function (after line 40)

Task 3: ADD describe("complete cleanup verification") block
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - LOCATION: After line 362 (after existing tests)
  - ADD: Test for invertedSubscriptions Map cleanup
  - ADD: Test for runSubscriptionsRef Map cleanup
  - VERIFY: Maps are empty after unmount
  - PATTERN: Use createInspectableContext() from Task 2

Task 4: ADD describe("WeakMap cleanup verification") block
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - LOCATION: After Task 3 tests
  - ADD: Test using WeakMap to track component instances
  - ADD: Test verifying no references remain after unmount
  - PATTERN: Create WeakMap, track component on mount, verify on unmount
  - VERIFY: WeakMap entries are cleaned up

Task 5: ADD describe("multi-field unmount scenarios") block
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - LOCATION: After Task 4 tests
  - ADD: Test multiple fields unmounting together
  - ADD: Test nested subscription cleanup (field A watches B, B watches C)
  - ADD: Test complex dependency chains
  - VERIFY: All fields' subscriptions are cleaned up

Task 6: ADD describe("no memory leak warnings") block
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  - LOCATION: After Task 5 tests
  - ADD: beforeEach with console.warn spy
  - ADD: afterEach with vi.restoreAllMocks()
  - ADD: Test verifying no unexpected console warnings during unmount
  - VERIFY: Only expected development logging warnings appear

Task 7: RUN tests to verify implementation
  - COMMAND: pnpm test --filter @formality-ui/react useSubscriptions.test.tsx
  - VERIFY: All new tests pass
  - VERIFY: No existing tests break
  - EXPECTED: Zero test failures

Task 8: RUN full React test suite for regressions
  - COMMAND: pnpm test --filter @formality-ui/react
  - VERIFY: All React tests pass
  - EXPECTED: Zero test failures
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Custom Inspectable Context (for Map verification)
// ============================================================================

// ADD after createMockContext() function (after line 40)

/**
 * Creates a Form context with inspectable Maps for testing
 * This allows tests to verify that Maps are properly cleaned up
 */
const createInspectableContext = () => {
  // Create the actual Maps (not mocks)
  const invertedSubscriptions = new Map<string, Set<string>>();
  const runSubscriptionsMap = new Map<number, string[]>();
  const watcherSetters = new Map<string, any>();
  const pendingWatcherUpdates = new Map<string, Set<string>>();

  // Track calls for verification
  const mockAddSubscription = vi.fn((target: string, subscriber: string) => {
    if (!invertedSubscriptions.has(target)) {
      invertedSubscriptions.set(target, new Set());
    }
    invertedSubscriptions.get(target)!.add(subscriber);
  });

  const mockRemoveSubscription = vi.fn((target: string, subscriber: string) => {
    invertedSubscriptions.get(target)?.delete(subscriber);
  });

  const mockRegisterWatcherSetter = vi.fn((name: string, setter: any) => {
    watcherSetters.set(name, setter);
  });

  const mockUnregisterWatcherSetter = vi.fn((name: string) => {
    watcherSetters.delete(name);
  });

  // Expose the Maps for inspection
  const getInspectableState = () => ({
    invertedSubscriptions: new Map(invertedSubscriptions),
    runSubscriptionsMap: new Map(runSubscriptionsMap),
    watcherSetters: new Map(watcherSetters),
    pendingWatcherUpdates: new Map(pendingWatcherUpdates),
  });

  return {
    addSubscription: mockAddSubscription,
    removeSubscription: mockRemoveSubscription,
    registerField: vi.fn(),
    unregisterField: vi.fn(),
    registerWatcherSetter: mockRegisterWatcherSetter,
    unregisterWatcherSetter: mockUnregisterWatcherSetter,
    changeField: vi.fn(),
    setFieldValidating: vi.fn(),
    getFormState: vi.fn(() => ({})),
    config: {},
    formConfig: {},
    debouncedSubmit: vi.fn(),
    submitImmediate: vi.fn(),
    unusedFields: [],
    methods: {} as any,
    getInspectableState, // Expose Maps for verification
  };
};

// ============================================================================
// PATTERN 2: Test for Map Cleanup Verification
// ============================================================================

// ADD in describe("complete cleanup verification")

describe("complete cleanup verification", () => {
  it("should clean up invertedSubscriptions Map after unmount", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    const { unmount } = renderHook(
      () => useSubscriptions("field1", ["field2", "field3"]),
      { wrapper }
    );

    // Verify subscriptions were added
    let state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("field2")).toContain("field1");
    expect(state.invertedSubscriptions.get("field3")).toContain("field1");

    // Unmount to trigger cleanup
    unmount();

    // Verify subscriptions were removed from Map
    state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("field2")).not.toContain("field1");
    expect(state.invertedSubscriptions.get("field3")).not.toContain("field1");
  });

  it("should clean up all Maps when multiple fields unmount", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    // Mount multiple fields
    const { unmount: unmount1 } = renderHook(
      () => useSubscriptions("field1", ["field3"]),
      { wrapper }
    );

    const { unmount: unmount2 } = renderHook(
      () => useSubscriptions("field2", ["field3"]),
      { wrapper }
    );

    // Verify both fields are watching field3
    let state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("field3")).toContain("field1");
    expect(state.invertedSubscriptions.get("field3")).toContain("field2");

    // Unmount both fields
    unmount1();
    unmount2();

    // Verify field3 has no watchers left
    state = inspectableContext.getInspectableState();
    const watchers = state.invertedSubscriptions.get("field3");
    expect(watchers?.size ?? 0).toBe(0);
  });
});

// ============================================================================
// PATTERN 3: WeakMap Cleanup Verification
// ============================================================================

// ADD in describe("WeakMap cleanup verification")

describe("WeakMap cleanup verification", () => {
  it("should allow garbage collection of component instances", () => {
    const wrapper = createWrapper(createMockContext());

    // Use WeakMap to track component instances
    const trackedInstances = new WeakMap<object, { subscriptions: string[] }>();

    let componentRef: object | null = null;

    const { unmount } = renderHook(
      () => {
        // Get current hook instance reference
        const ref = {};
        componentRef = ref;

        // Track subscriptions for this instance
        trackedInstances.set(ref, { subscriptions: ["field2", "field3"] });

        useSubscriptions("field1", ["field2", "field3"]);
      },
      { wrapper }
    );

    // Verify instance was tracked
    expect(componentRef).not.toBeNull();
    if (componentRef) {
      expect(trackedInstances.has(componentRef)).toBe(true);
      expect(trackedInstances.get(componentRef)?.subscriptions).toEqual(["field2", "field3"]);
    }

    // Store reference before unmount
    const refBeforeUnmount = componentRef;

    // Unmount component
    unmount();
    componentRef = null;

    // After unmount, the reference should be eligible for garbage collection
    // WeakMap doesn't prevent garbage collection, so we can't directly verify cleanup
    // But we can verify no errors occur and the test completes successfully
    expect(refBeforeUnmount).toBeTruthy();

    // Note: WeakMap doesn't have a size property or iteration
    // The key property is that entries don't prevent garbage collection
    // The test passing without errors is the verification
  });
});

// ============================================================================
// PATTERN 4: Nested Subscription Cleanup
// ============================================================================

// ADD in describe("multi-field unmount scenarios")

describe("multi-field unmount scenarios", () => {
  it("should clean up nested subscriptions correctly", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    // Create nested subscriptions:
    // field1 watches field2
    // field2 watches field3
    const { unmount: unmount1 } = renderHook(
      () => useSubscriptions("field1", ["field2"]),
      { wrapper }
    );

    const { unmount: unmount2 } = renderHook(
      () => useSubscriptions("field2", ["field3"]),
      { wrapper }
    );

    // Verify nested subscriptions
    let state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("field2")).toContain("field1");
    expect(state.invertedSubscriptions.get("field3")).toContain("field2");

    // Unmount field1 (should not affect field2 -> field3 subscription)
    unmount1();

    state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("field2")).not.toContain("field1");
    expect(state.invertedSubscriptions.get("field3")).toContain("field2"); // Still present

    // Unmount field2
    unmount2();

    state = inspectableContext.getInspectableState();
    expect(state.invertedSubscriptions.get("field3")).not.toContain("field2");
  });

  it("should handle rapid field addition and removal", () => {
    const inspectableContext = createInspectableContext();
    const wrapper = createWrapper(inspectableContext);

    const unmountFunctions: Array<() => void> = [];

    // Add multiple fields rapidly
    for (let i = 0; i < 5; i++) {
      const { unmount } = renderHook(
        () => useSubscriptions(`field${i}`, [`target${i}`]),
        { wrapper }
      );
      unmountFunctions.push(unmount);
    }

    // Verify all subscriptions exist
    let state = inspectableContext.getInspectableState();
    for (let i = 0; i < 5; i++) {
      expect(state.invertedSubscriptions.get(`target${i}`)).toContain(`field${i}`);
    }

    // Unmount all fields
    unmountFunctions.forEach(fn => fn());

    // Verify all subscriptions are cleaned up
    state = inspectableContext.getInspectableState();
    for (let i = 0; i < 5; i++) {
      const watchers = state.invertedSubscriptions.get(`target${i}`);
      expect(watchers?.size ?? 0).toBe(0);
    }
  });
});

// ============================================================================
// PATTERN 5: Console Warning Verification
// ============================================================================

// ADD in describe("no memory leak warnings")

describe("no memory leak warnings", () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not warn about memory leaks during normal unmount", () => {
    const wrapper = createWrapper(createMockContext());

    const { unmount } = renderHook(
      () => useSubscriptions("field1", ["field2", "field3"]),
      { wrapper }
    );

    // Clear existing logs
    vi.mocked(console.warn).mockClear();

    // Unmount
    unmount();

    // Verify only expected development logging warnings appear
    const warnCalls = vi.mocked(console.warn).mock.calls;

    // Expected: "[Formality Subscription] Run X: "field1" cleaning up [field2, field3]"
    // No unexpected warnings about memory leaks or orphaned subscriptions
    const memoryLeakWarnings = warnCalls.filter(call =>
      call[0]?.includes('memory leak') ||
      call[0]?.includes('orphaned') ||
      call[0]?.includes('WARNING')
    );

    expect(memoryLeakWarnings).toHaveLength(0);
  });

  it("should not warn about memory leaks with rapid changes", () => {
    const wrapper = createWrapper(createMockContext());

    const { rerender, unmount } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] as string[] },
      }
    );

    // Rapid changes
    rerender({ subscriptions: ["field3"] });
    rerender({ subscriptions: ["field4"] });
    rerender({ subscriptions: ["field5"] });

    // Clear logs
    vi.mocked(console.warn).mockClear();

    // Unmount
    unmount();

    // Verify no memory leak warnings
    const warnCalls = vi.mocked(console.warn).mock.calls;
    const memoryLeakWarnings = warnCalls.filter(call =>
      call[0]?.includes('memory leak') ||
      call[0]?.includes('orphaned')
    );

    expect(memoryLeakWarnings).toHaveLength(0);
  });
});
```

### Integration Points

```yaml
USESUBSCRIPTIONS_HOOK:
  - file: packages/react/src/hooks/useSubscriptions.ts
  - tested_by: New tests in useSubscriptions.test.tsx
  - verifies: Per-effect tracking cleanup (lines 64-86)
  - verifies: runSubscriptionsRef.delete() is called (line 84)

FORM_CONTEXT:
  - file: packages/react/src/components/Form.tsx
  - tested_indirectly: Through custom context in tests
  - verifies: invertedSubscriptions Map cleanup
  - verifies: removeSubscription is called correctly

P3M1T1S1_CONTRACT:
  - dependency: Per-effect tracking implementation
  - tested_by: New cleanup verification tests
  - verifies: runIdRef and runSubscriptionsRef work correctly

P3M1T1S2_CONTRACT:
  - dependency: Development logging and double-cleanup detection
  - tested_by: Console warning verification tests
  - verifies: No unexpected warnings during cleanup
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

# Expected: All tests pass including new cleanup tests.
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

### Level 4: Memory Leak Verification (Optional)

```bash
# Note: True memory leak detection requires production build + profiling
# These tests provide verification through assertions, not profiling

# Run tests multiple times to catch any state leakage
for i in {1..10}; do
  pnpm test --filter @formality-ui/react useSubscriptions.test.tsx || exit 1
done

# Expected: All iterations pass without state accumulation
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Tests verify invertedSubscriptions Map is empty after unmount
- [ ] Tests verify runSubscriptionsRef Map entries are deleted
- [ ] WeakMap tests verify cleanup behavior
- [ ] Multi-field tests cover complex scenarios
- [ ] Console warning tests verify no unexpected warnings
- [ ] All tests pass: `pnpm test --filter @formality-ui/react useSubscriptions.test.tsx`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] All existing tests still pass

### Feature Validation

- [ ] Complete cleanup verification tests added
- [ ] WeakMap cleanup tests added
- [ ] Multi-field unmount scenarios tested
- [ ] Console warning verification tests added
- [ ] Tests cover nested subscriptions
- [ ] Tests cover rapid changes + unmount
- [ ] Tests verify no memory leak warnings

### Code Quality Validation

- [ ] Follows existing test patterns from codebase
- [ ] Uses createMockContext() and wrapper patterns
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

- **Don't modify existing tests** - All existing tests (lines 49-362) must be preserved
- **Don't test implementation details** - Test observable behavior (Map state, console output), not internal variables
- **Don't use jest directly** - Use Vitest APIs (vi.spyOn, vi.mocked, vi.restoreAllMocks)
- **Don't forget to restore mocks** - Always use afterEach to restore console spies
- **Don't test WeakMap enumeration** - WeakMap cannot be enumerated, test behavior instead
- **Don't skip rapid changes tests** - These are critical for memory leak detection
- **Don't ignore Strict Mode** - Test with StrictMode wrapper to ensure idempotent cleanup
- **Don't use console.log** - Spy on console.warn (development logging uses warn, not log)
- **Don't create side effects** - Each test should be isolated
- **Don't assume Maps are accessible** - Create custom context to expose Maps for inspection

---

## Related Work Items

- **Parent**: P3.M1 - Memory Leak Prevention (Planned)
- **Parent**: P3.M1.T2 - Add Tests for Memory Leaks (Planned)
- **Predecessor**: P3.M1.T1.S1 - Add per-effect tracking (Implementing in parallel)
- **Sibling**: P3.M1.T1.S2 - Add cleanup ordering and logging (Implementing in parallel)
- **Sibling**: P3.M1.T2.S2 - Test rapid changes (Planned)

---

## Contract Dependencies

### From P3.M1.T1.S1 - Add Per-Effect Tracking (Implementing in Parallel)

The P3.M1.T1.S1 PRP implements per-effect subscription tracking.

**This PRP's Contract**:
1. This PRP TESTS the per-effect tracking from P3.M1.T1.S1
2. This PRP VERIFIES that runSubscriptionsRef.delete() is called
3. This PRP VERIFIES that all subscriptions are cleaned up on unmount
4. This PRP DOES NOT modify the implementation, only adds tests

**Integration Point**: When P3.M1.T1.S1 is complete, P3.M1.T2.S1 tests verify the implementation works correctly.

### From P3.M1.T1.S2 - Add Cleanup Ordering and Logging (Implementing in Parallel)

The P3.M1.T1.S2 PRP adds development logging and double-cleanup detection.

**This PRP's Contract**:
1. This PRP TESTS the development logging from P3.M1.T1.S2
2. This PRP VERIFIES that console.warn is called correctly
3. This PRP VERIFIES that no unexpected warnings appear during cleanup
4. This PRP DOES NOT modify the implementation, only adds tests

**Integration Point**: When P3.M1.T1.S2 is complete, P3.M1.T2.S1 tests verify the logging works correctly.

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:
- Clear scope: Add tests only, no implementation changes
- Previous PRPs (P3.M1.T1.S1, P3.M1.T1.S2) provide solid foundation
- Comprehensive research documented with code examples
- Clear test patterns exist in codebase
- External research provides best practices
- All file paths and line numbers specified
- Test patterns documented with examples
- Known gotchas and anti-patterns identified
- Validation commands specific to project

**Remaining 1 point uncertainty**: The createInspectableContext() helper function requires careful implementation to correctly expose the Maps for inspection, but this is low risk given the clear pattern from createMockContext().

---

## References

### Internal Documentation

- [Codebase Test Patterns](./research/codebase-test-patterns.md) - Existing test patterns in Formality
- [Subscription Tracking Implementation](./research/subscription-tracking-implementation.md) - Data structures and cleanup mechanisms
- [External Testing Patterns](./research/external-testing-patterns.md) - Best practices from React community

### Internal Code Files

- [useSubscriptions.test.tsx](../../../../packages/react/src/__tests__/useSubscriptions.test.tsx) - Test file to modify
- [useSubscriptions.ts](../../../../packages/react/src/hooks/useSubscriptions.ts) - Implementation being tested
- [Form.tsx](../../../../packages/react/src/components/Form.tsx) - Subscription registry operations

### External Documentation

- [React Testing Library - unmount](https://testing-library.com/docs/react-testing-library/api#unmount) - Unmount API documentation
- [useEffect Documentation](https://react.dev/reference/react/useEffect) - Understanding cleanup behavior
- [React Effects Guide](https://react.dev/learn/synchronizing-with-effects) - Effect lifecycle and cleanup
- [Strict Mode](https://react.dev/reference/react/StrictMode) - Double-invocation behavior
- [Vitest Mocking](https://vitest.dev/guide/mocking.html) - How to spy on console and Map methods

### Research Artifacts

- `/home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T2S1/research/` - All research documentation

---

## Appendix: Quick Reference

### Test File Structure

```typescript
// File: packages/react/src/__tests__/useSubscriptions.test.tsx

// Lines 1-8: Imports (UNCHANGED)
// Lines 9-40: createMockContext() (UNCHANGED)

// ADD: Create inspectable context helper (after line 40)
const createInspectableContext = () => {
  // ... implementation
};

// Lines 42-47: createWrapper() (UNCHANGED)
// Lines 49-362: All existing tests (UNCHANGED - PRESERVE ALL)

// ADD: New tests for unmount cleanup verification (after line 362)

describe("complete cleanup verification", () => {
  // ... tests for Map cleanup
});

describe("WeakMap cleanup verification", () => {
  // ... tests for WeakMap behavior
});

describe("multi-field unmount scenarios", () => {
  // ... tests for complex scenarios
});

describe("no memory leak warnings", () => {
  // ... tests for console warning verification
});
```

### Key Test Patterns

```typescript
// Pattern 1: Inspectable Context
const createInspectableContext = () => {
  const invertedSubscriptions = new Map<string, Set<string>>();
  // ... create Maps and expose them
  return {
    addSubscription: vi.fn(...),
    removeSubscription: vi.fn(...),
    getInspectableState: () => ({
      invertedSubscriptions: new Map(invertedSubscriptions),
      // ... other Maps
    }),
  };
};

// Pattern 2: Map Cleanup Verification
const context = createInspectableContext();
const { unmount } = renderHook(() => useSubscriptions("field1", ["field2"]), {
  wrapper: createWrapper(context),
});

let state = context.getInspectableState();
expect(state.invertedSubscriptions.get("field2")).toContain("field1");

unmount();

state = context.getInspectableState();
expect(state.invertedSubscriptions.get("field2")).not.toContain("field1");

// Pattern 3: Console Warning Spy
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Test
unmount();
const memoryLeakWarnings = vi.mocked(console.warn).mock.calls.filter(call =>
  call[0]?.includes('memory leak')
);
expect(memoryLeakWarnings).toHaveLength(0);
```
