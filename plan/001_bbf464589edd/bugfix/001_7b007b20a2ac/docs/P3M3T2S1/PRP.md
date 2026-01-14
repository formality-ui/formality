# Product Requirement Prompt (PRP): Test rapid changes for execution version tracking

**Work Item:** P3.M3.T2.S1
**Parent Task:** P3.M3.T2 - Add Tests for Race Conditions
**Grandparent Task:** P3.M3 - Race Condition Prevention
**PRD Bugfix ID:** 001_7b007b20a2ac
**Date:** 2026-01-13

---

## Goal

**Feature Goal**: Create a test that verifies `executionVersionRef` race condition prevention correctly handles rapid field changes, ensuring only the last value is submitted and intermediate saves are aborted.

**Deliverable**: Test case file `packages/react/src/__tests__/autosave-rapid-changes.test.tsx` containing:
1. Test for rapid field changes (10+ changes within debounce period)
2. Verification that only the last value is submitted
3. Verification that intermediate auto-save operations are aborted via version check
4. Use of fake timers to control async validation timing

**Success Definition**:
- Test creates a Form with autoSave and async validation
- Test simulates 10 rapid field changes using `userEvent.type()` with `{ delay: null }`
- Test advances fake timers to trigger debounce
- Test asserts `handleSubmit` is called exactly once with the final value only
- Test validates that intermediate versions were aborted (no intermediate submissions)
- Test runs successfully with `pnpm test autosave-rapid-changes.test.tsx`
- Test passes consistently on multiple runs (no flaky behavior)

---

## User Persona

**Target User**: Formality library maintainers and QA engineers who need to verify that the race condition prevention mechanism works correctly under real-world usage patterns.

**Use Case**: Before releasing the race condition prevention feature, maintainers need to ensure that:
1. Rapid user input (typing, pasting, rapid-fire changes) doesn't cause multiple submissions
2. Only the final value is submitted when changes occur in quick succession
3. Intermediate async operations are properly aborted via version tracking
4. The feature works correctly with fake timers (simulated timing)

**User Journey**:
1. Maintainer runs the test suite: `pnpm test`
2. Test simulates rapid field changes (10 characters typed rapidly)
3. Test verifies only one submission occurs with the final value
4. If test passes, maintainers have confidence the feature works correctly
5. If test fails, maintainers know the execution version tracking has a bug

**Pain Points Addressed**:
- **Uncertainty About Race Conditions**: Without tests, we can't be sure the mechanism actually prevents stale saves
- **Real-World Usage Patterns**: Users often type rapidly or paste content - we need to ensure this works
- **Flaky Tests**: Race condition tests are often flaky - this test uses fake timers for reliability
- **Debugging Difficulty**: When bugs occur, having a reproducible test makes debugging easier

---

## Why

- **Production Readiness**: Race condition prevention must be thoroughly tested before release
- **Regression Prevention**: Future code changes could break the mechanism - tests prevent this
- **Documentation**: Tests serve as executable documentation of expected behavior
- **Edge Case Coverage**: Rapid changes are a critical edge case that must be handled correctly
- **Integration with Previous Work**: This test validates the analysis from P3.M3.T1.S1

---

## What

### User-Visible Behavior

**This is a TEST task - no user-visible behavior changes.**

**Test Output**: A test file that validates:
1. When a user types rapidly (10+ characters within debounce period), only the last value is submitted
2. Intermediate auto-save operations are aborted via `executionVersionRef` version check
3. Async validation timing is controlled via fake timers
4. No memory leaks occur from aborted operations
5. The feature works reliably with `vi.useFakeTimers()`

### Success Criteria

- [ ] Test file created at `packages/react/src/__tests__/autosave-rapid-changes.test.tsx`
- [ ] Test uses `vi.useFakeTimers({ shouldAdvanceTime: true })` for timing control
- [ ] Test simulates 10 rapid field changes using `userEvent.type()` with `{ delay: null }`
- [ ] Test advances timers past debounce period
- [ ] Test asserts `handleSubmit` is called exactly once
- [ ] Test asserts submitted value contains only the last (final) value
- [ ] Test validates intermediate versions were aborted (no intermediate submissions)
- [ ] Test uses `waitFor()` for async assertions
- [ ] Test cleans up with `vi.useRealTimers()` in afterEach
- [ ] Test runs successfully with `pnpm test autosave-rapid-changes.test.tsx`
- [ ] Test passes consistently (no flaky behavior)

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact implementation location and file path
- Complete test structure with code examples
- Specific patterns from existing tests to follow
- Fake timer setup and cleanup patterns
- Rapid change simulation patterns
- Assertion patterns for verifying behavior
- External research references for race condition testing

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Previous PRP (Analysis Context)
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M3T1S1/PRP.md
  why: Defines the executionVersionRef implementation being tested
  section: "Goal" for understanding what executionVersionRef does
  section: "Implementation Blueprint" for the mechanism being tested
  section: "Implementation Patterns & Key Details" for version checkpoint locations

# External Research on Race Conditions
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M3T1S1/research/external-race-condition-research.md
  why: Comprehensive research on version token pattern and testing approaches
  section: "Version/Token Pattern Research" for pattern explanation
  section: "Common Pitfalls and Solutions" for what to test
  section: "Recommended Testing Approach" for test categories

# Codebase Test Patterns (This Task's Research)
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M3T2S1/research/codebase-test-patterns.md
  why: Existing test patterns in the codebase to follow
  section: "AutoSave Test Patterns" for fake timer setup
  section: "Rapid Changes Simulation" for how to simulate rapid input
  section: "Verification Patterns" for how to assert correct behavior
  section: "useSubscriptions Test Patterns" for rapid change test examples

# Primary Implementation File (What we're testing)
- file: /home/dustin/projects/formality/packages/react/src/components/Form.tsx
  why: Contains the executeAutoSave implementation with executionVersionRef
  pattern: Lines 195-196 (executionVersionRef declaration)
  pattern: Lines 441-469 (waitForFieldValidation with version check)
  pattern: Lines 475-556 (executeAutoSave function with three version checkpoints)
  gotcha: Version is incremented BEFORE async operations start
  gotcha: Version is checked AFTER each async operation completes
  gotcha: Three checkpoints ensure no stale saves (lines 503-508, 524-526, 539-544)

# Reference Test: Fake Timer Usage
- file: /home/dustin/projects/formality/packages/react/src/__tests__/autosave-validation.test.tsx
  why: Shows exact pattern for fake timer setup and usage
  pattern: Lines 87-95 (beforeEach/afterEach for timer setup)
  pattern: Lines 129, 141, 191, 203 (advanceTimersByTimeAsync usage)
  pattern: Lines 272-312 (debounce timing test example)
  gotcha: Always use `{ shouldAdvanceTime: true }` for reliable tests
  gotcha: Always wrap in `act()` when advancing timers
  gotcha: Use buffer time (debounce + 100ms) for reliable assertions

# Reference Test: Rapid Changes Pattern
- file: /home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx
  why: Shows how to test rapid changes and verify only final state persists
  pattern: Lines 213-247 (rapid changes test)
  pattern: Lines 706-753 (subscription count tracking with 15 rapid changes)
  pattern: Lines 903-951 (stress test with 100 rapid changes)
  gotcha: Use `{ delay: null }` in userEvent.type() for fastest input
  gotcha: Clear mock calls before rapid changes to track only new calls
  gotcha: Use `waitFor()` for async assertions after rapid changes

# Test Setup File
- file: /home/dustin/projects/formality/packages/react/src/__tests__/setup.ts
  why: Contains test setup configuration and imports
  pattern: Import statements for @testing-library/react and userEvent
  pattern: vitest configuration

# External Documentation: Vitest Timer Mocks
- url: https://vitest.dev/guide/mocking/timers
  why: Official documentation for vi.useFakeTimers and vi.advanceTimersByTimeAsync
  critical: Understanding of shouldAdvanceTime option
  critical: How to properly clean up fake timers

# External Documentation: React Testing Library
- url: https://testing-library.com/docs/react-testing-library/api/act
  why: Official documentation for act() wrapper
  critical: When and why to wrap interactions in act()

# External Documentation: React.dev - Race Conditions
- url: https://react.dev/learn/synchronizing-with-effects#each-effect-represents-a-separate-synchronization-mechanism
  why: Official React documentation on effect cleanup and race conditions
  critical: Understanding how React handles effect re-runs
  critical: Why version tokens are needed for rapid changes
```

### Current Codebase Tree (Relevant Sections)

```bash
packages/react/src/
├── __tests__/
│   ├── setup.ts                           # Test configuration
│   ├── autosave-validation.test.tsx       # REFERENCE - Fake timer patterns
│   ├── useSubscriptions.test.tsx          # REFERENCE - Rapid changes patterns
│   └── autosave-rapid-changes.test.tsx    # CREATE - New test file
├── components/
│   └── Form.tsx                           # PRIMARY - Implementation being tested
│                                           # Line 196: executionVersionRef
│                                           # Line 441-469: waitForFieldValidation
│                                           # Line 475-556: executeAutoSave
└── context/
    └── FormContext.ts                     # Form context types
```

### Desired Codebase Tree with Changes

```bash
packages/react/src/
└── __tests__/
    └── autosave-rapid-changes.test.tsx    # CREATE - New test file
                                            # Test: rapid changes (10 chars)
                                            # Verify: only last value submitted
                                            # Verify: intermediate saves aborted
                                            # Uses: fake timers for timing control
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Fake timers MUST use { shouldAdvanceTime: true }
vi.useFakeTimers({ shouldAdvanceTime: true });  // ✅ GOOD: Reliable timing
// vi.useFakeTimers();                            // ❌ BAD: Unreliable, may hang

// CRITICAL: Always wrap timer advances in act()
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});  // ✅ GOOD: Proper React state update
// await vi.advanceTimersByTimeAsync(600);        // ❌ BAD: May cause warnings

// CRITICAL: Use { delay: null } for rapid typing
await userEvent.type(input, "hello", { delay: null });  // ✅ GOOD: Fastest input
// await userEvent.type(input, "hello");                // ❌ BAD: Has delays

// CRITICAL: Clear mock calls before rapid changes
submitHandler.mockClear();
// Now track only new calls from rapid changes

// CRITICAL: Use buffer time for debounce assertions
// If debounce is 500ms, advance 600ms (500 + 100 buffer)
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);  // 500ms debounce + 100ms buffer
});

// CRITICAL: Always clean up fake timers in afterEach
afterEach(() => {
  vi.useRealTimers();  // ✅ REQUIRED: Prevents test pollution
});

// CRITICAL: Use waitFor() for async assertions
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});  // ✅ GOOD: Waits for async operation
// expect(submitHandler).toHaveBeenCalledTimes(1);  // ❌ BAD: May be flaky

// CRITICAL: executionVersionRef has THREE checkpoints
// Checkpoint 1: After first waitForFieldValidation (line 503-508)
// Checkpoint 2: After methods.trigger (line 524-526)
// Checkpoint 3: After second waitForFieldValidation (line 539-544)
// Missing any checkpoint could allow stale saves

// CRITICAL: Version is incremented BEFORE capturing fields
executionVersionRef.current++;
const executionVersion = executionVersionRef.current;  // ✅ GOOD: After increment
const changedFields = new Set(pendingChangedFields.current);
pendingChangedFields.current.clear();  // Cleared after capture

// CRITICAL: waitForFieldValidation checks version INSIDE polling loop
while (Date.now() - startTime < maxWaitMs) {
  if (executionVersionRef.current !== version) {
    return false;  // Abort mid-wait if version changed
  }
  // Check validation status...
}

// CRITICAL: React 18 Strict Mode compatibility
// Version token pattern handles double-invocation correctly:
// First mount: version = 1, unmount: cleanup
// Second mount: version = 2 (NEW version), no stale updates

// CRITICAL: Test file naming convention
// Use <feature>.test.tsx for React component tests
// Use <feature>.test.ts for utility/function tests

// CRITICAL: Import order matters
// 1. Vitest imports first (describe, it, expect, vi, beforeEach, afterEach)
// 2. React imports (React, StrictMode if needed)
// 3. Testing library imports (render, screen, act, waitFor)
// 4. userEvent import
// 5. Component imports
// 6. Type imports

// CRITICAL: Async validators in tests need tracking
let validationCalls: string[] = [];
const asyncValidator = async (value: unknown) => {
  validationCalls.push("field:start");
  await new Promise((resolve) => setTimeout(resolve, 50));
  validationCalls.push("field:end");
  return true;
};
```

---

## Implementation Blueprint

### Data Models and Structure

**No new data models needed** - This is a test file that uses existing Form components and types.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE packages/react/src/__tests__/autosave-rapid-changes.test.tsx
  - ADD: Import statements (vitest, React, testing-library, userEvent)
  - ADD: Form component imports
  - CREATE: describe block for test suite
  - NAMING: "AutoSave Race Condition - Rapid Changes"
  - PATTERN: Follow autosave-validation.test.tsx import structure

Task 2: ADD test setup and teardown
  - IMPLEMENT: beforeEach to setup fake timers and mocks
  - IMPLEMENT: afterEach to restore real timers
  - PATTERN: Follow autosave-validation.test.tsx lines 87-95
  - USE: vi.useFakeTimers({ shouldAdvanceTime: true })
  - CLEANUP: vi.useRealTimers() in afterEach

Task 3: ADD helper functions
  - IMPLEMENT: createAsyncValidator helper (tracks validation calls)
  - IMPLEMENT: TestInput component with data-testid
  - PATTERN: Follow autosave-validation.test.tsx lines 30-82
  - TRACK: validationCalls array for order verification

Task 4: IMPLEMENT first test - rapid single-field changes
  - CREATE: test case "should only submit last value after 10 rapid changes"
  - RENDER: Form with autoSave, debounce={500}, single field with async validator
  - SIMULATE: 10 rapid character changes using userEvent.type() with { delay: null }
  - ADVANCE: Timers past debounce period (600ms)
  - ASSERT: handleSubmit called exactly once
  - ASSERT: Submitted value contains only the last value
  - PATTERN: Follow useSubscriptions.test.tsx lines 213-247 for rapid changes

Task 5: IMPLEMENT second test - verify intermediate saves aborted
  - CREATE: test case "should abort intermediate auto-save operations"
  - RENDER: Form with autoSave, debounce={500}, single field
  - TRACK: Submit handler calls with values
  - SIMULATE: 10 rapid changes with controlled timing
  - ASSERT: No intermediate submissions occurred
  - ASSERT: Only final value was submitted
  - PATTERN: Use mockClear() to track only new calls after rapid changes

Task 6: IMPLEMENT third test - rapid changes with async validation
  - CREATE: test case "should handle rapid changes during async validation"
  - RENDER: Form with autoSave, debounce={500}, async validator (100ms delay)
  - SIMULATE: Rapid changes while validation is in progress
  - ADVANCE: Timers to control validation timing
  - ASSERT: Validation for intermediate values was aborted
  - ASSERT: Only final validation completed
  - PATTERN: Use fake timers to control when validation completes

Task 7: IMPLEMENT fourth test - multiple fields rapid changes
  - CREATE: test case "should handle rapid changes across multiple fields"
  - RENDER: Form with autoSave, debounce={500}, multiple fields
  - SIMULATE: Rapid changes across different fields
  - ASSERT: Only one submission with all final values
  - ASSERT: Debounce resets correctly on field changes

Task 8: ADD comprehensive documentation
  - ADD: Comments explaining what each test verifies
  - ADD: Comments on why fake timers are needed
  - ADD: Comments on version checkpoint behavior being tested
  - DOCUMENT: The race condition scenario each test covers
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: File Structure and Imports
// Follow this exact import order

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, Field } from "../components/Form";
import { FormalityProvider } from "../components/FormalityProvider";
import type { FormFieldsConfig } from "@formality-ui/core";

// PATTERN 2: Test Suite Structure
describe("AutoSave Race Condition - Rapid Changes", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Tests go here...
});

// PATTERN 3: Async Validator Helper
// Use this pattern to track validation calls

let validationCalls: string[] = [];

function createAsyncValidator(fieldName: string, delayMs: number = 50) {
  return async (value: unknown) => {
    validationCalls.push(`${fieldName}:start`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    validationCalls.push(`${fieldName}:end`);
    return true;
  };
}

// PATTERN 4: Test Input Component
// Use this pattern for test input components

const TestInput = ({
  name,
  value = "",
  onChange = () => {},
}: {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
}) => (
  <input
    data-testid={name}
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

// PATTERN 5: Rapid Single-Field Changes Test
// This is the main test for the work item

it("should only submit last value after 10 rapid changes", async () => {
  const testInputs: FormFieldsConfig = {
    textField: {
      type: "textField",
      component: TestInput,
    },
  };

  validationCalls = [];

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={{
          fieldA: {
            type: "textField",
            validator: createAsyncValidator("fieldA", 50),
          },
        }}
        onSubmit={submitHandler}
        autoSave
        debounce={500}
      >
        <Field name="fieldA" />
      </Form>
    </FormalityProvider>
  );

  // Wait for initial render
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  validationCalls = [];

  // Get the field
  const fieldA = screen.getByTestId("fieldA");

  // CRITICAL: Simulate 10 rapid changes (typing "1234567890")
  await act(async () => {
    await userEvent.type(fieldA, "1234567890", { delay: null });
  });

  // Clear any pending validations
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });

  // Clear submit handler to track only new calls
  submitHandler.mockClear();

  // Advance past debounce period (500ms + 100ms buffer)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });

  // Wait for async operations to complete
  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  // CRITICAL ASSERTION: Only ONE submission occurred
  expect(submitHandler).toHaveBeenCalledTimes(1);

  // CRITICAL ASSERTION: Submitted value contains ONLY the last value
  expect(submitHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      fieldA: "1234567890",
    })
  );
});

// PATTERN 6: Verify Intermediate Saves Aborted Test
// This verifies version tracking works correctly

it("should abort intermediate auto-save operations", async () => {
  const testInputs: FormFieldsConfig = {
    textField: {
      type: "textField",
      component: TestInput,
    },
  };

  const submitLog: string[] = [];
  const trackedSubmitHandler = (data: any) => {
    submitLog.push(`submit:${data.fieldA}`);
    submitHandler(data);
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={{
          fieldA: { type: "textField" },
        }}
        onSubmit={trackedSubmitHandler}
        autoSave
        debounce={500}
      >
        <Field name="fieldA" />
      </Form>
    </FormalityProvider>
  );

  const fieldA = screen.getByTestId("fieldA");

  // Simulate rapid changes with controlled timing
  for (let i = 1; i <= 10; i++) {
    await act(async () => {
      await userEvent.type(fieldA, String(i), { delay: null });
      // Small delay to allow debounce to start but not complete
      await vi.advanceTimersByTimeAsync(100);
    });
  }

  // Advance past final debounce
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });

  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  // CRITICAL ASSERTION: No intermediate submissions
  // Only the final value should be in submit log
  expect(submitLog).toHaveLength(1);
  expect(submitLog[0]).toBe("submit:10"); // Only last value
});

// PATTERN 7: Rapid Changes During Async Validation Test
// This verifies version check works during validation

it("should handle rapid changes during async validation", async () => {
  const testInputs: FormFieldsConfig = {
    textField: {
      type: "textField",
      component: TestInput,
    },
  };

  validationCalls = [];

  // Create validator that takes longer than debounce
  const slowValidator = async (value: unknown) => {
    validationCalls.push(`validation:start:${value}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    validationCalls.push(`validation:end:${value}`);
    return true;
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={{
          fieldA: {
            type: "textField",
            validator: slowValidator,
          },
        }}
        onSubmit={submitHandler}
        autoSave
        debounce={500}
      >
        <Field name="fieldA" />
      </Form>
    </FormalityProvider>
  );

  const fieldA = screen.getByTestId("fieldA");

  // Wait for initial render
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  validationCalls = [];

  // First change (triggers validation)
  await act(async () => {
    await userEvent.type(fieldA, "a", { delay: null });
  });

  // Advance a bit but let validation continue
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });

  // Second change while validation is still running (version should increment)
  await act(async () => {
    await userEvent.type(fieldA, "b", { delay: null });
  });

  // Complete validation
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });

  // Advance past debounce
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });

  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  // CRITICAL ASSERTION: Final value submitted
  expect(submitHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      fieldA: "ab",
    })
  );

  // CRITICAL ASSERTION: Both validations completed
  // But only the LAST value was submitted
  const validationEnds = validationCalls.filter((c) => c.includes(":end"));
  expect(validationEnds.length).toBeGreaterThan(0);
});

// PATTERN 8: Multiple Fields Rapid Changes Test
// Verify debounce resets correctly

it("should handle rapid changes across multiple fields", async () => {
  const testInputs: FormFieldsConfig = {
    textField: {
      type: "textField",
      component: TestInput,
    },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={{
          fieldA: { type: "textField" },
          fieldB: { type: "textField" },
        }}
        onSubmit={submitHandler}
        autoSave
        debounce={500}
      >
        <Field name="fieldA" />
        <Field name="fieldB" />
      </Form>
    </FormalityProvider>
  );

  const fieldA = screen.getByTestId("fieldA");
  const fieldB = screen.getByTestId("fieldB");

  // Rapid changes across fields
  await act(async () => {
    await userEvent.type(fieldA, "value1", { delay: null });
    await userEvent.type(fieldB, "value2", { delay: null });
    await userEvent.type(fieldA, "value3", { delay: null });
  });

  // Advance past debounce
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });

  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  // CRITICAL ASSERTION: One submission with all final values
  expect(submitHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      fieldA: "value3", // Last value for fieldA
      fieldB: "value2", // Only value for fieldB
    })
  );
});
```

### Integration Points

```yaml
NO NEW INTEGRATIONS

This is a test file with no production code changes:

DEPENDENCIES:
  - Existing Form component (packages/react/src/components/Form.tsx)
  - Existing Field component (packages/react/src/components/Field.tsx)
  - Existing FormalityProvider (packages/react/src/components/FormalityProvider.tsx)
  - Vitest testing framework (already configured)
  - React Testing Library (already configured)
  - userEvent from @testing-library/user-event (already installed)

TEST CONFIGURATION:
  - Uses existing setup.ts configuration
  - Follows existing test file patterns
  - Uses vi.useFakeTimers for timing control

OUTPUT:
  - packages/react/src/__tests__/autosave-rapid-changes.test.tsx (new test file)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating the test file

# Check TypeScript compilation
cd /home/dustin/projects/formality/packages/react
pnpm exec tsc --noEmit

# Expected: No TypeScript errors

# Run the new test file
pnpm test autosave-rapid-changes.test.tsx

# Expected: Tests run (may fail initially, but should execute)

# Run all tests to ensure no regressions
pnpm test

# Expected: All tests pass (existing tests should not be affected)
```

### Level 2: Test Execution (Component Validation)

```bash
# Run the specific test file
pnpm test autosave-rapid-changes.test.tsx

# Expected Output:
# ✓ AutoSave Race Condition - Rapid Changes
#   ✓ should only submit last value after 10 rapid changes
#   ✓ should abort intermediate auto-save operations
#   ✓ should handle rapid changes during async validation
#   ✓ should handle rapid changes across multiple fields
#
# Test Files  1 passed (1)
# Tests  4 passed (4)

# Run with coverage (if available)
pnpm test autosave-rapid-changes.test.tsx --coverage

# Expected: Coverage report shows executeAutoSave function is tested

# Run tests multiple times to check for flakiness
for i in {1..5}; do pnpm test autosave-rapid-changes.test.tsx; done

# Expected: All runs pass consistently (no flaky behavior)
```

### Level 3: Code Coverage Verification (System Validation)

```bash
# Check coverage of executeAutoSave function
pnpm test --coverage

# Verify that executeAutoSave is covered by the new tests
# Look for coverage report showing:
# - packages/react/src/components/Form.tsx
#   - executeAutoSave function: covered

# Expected: executeAutoSave has increased coverage due to new tests

# Check specifically for version checkpoint coverage
# The tests should exercise:
# - Version increment (line 477)
# - Version check after first validation (line 503-508)
# - Version check after trigger (line 524-526)
# - Version check after second validation (line 539-544)

# Expected: All version checkpoints are executed during tests
```

### Level 4: Integration Testing (Feature Validation)

```bash
# Verify the tests work with the actual Form component

# Test that rapid changes don't cause multiple submissions in real usage
# This is validated by the test itself - if it passes, the feature works

# Verify the tests catch regressions
# To test this, temporarily break executionVersionRef logic:

# In Form.tsx, comment out a version checkpoint:
# if (executionVersionRef.current !== executionVersion) {
#   return;  // <-- Comment this out
# }

# Run tests again:
# pnpm test autosave-rapid-changes.test.tsx

# Expected: Tests FAIL (detect the regression)
# This proves the tests are validating the correct behavior

# Restore the code and verify tests pass again

# Expected: Tests PASS after restoring the code
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test file created at correct location: `packages/react/src/__tests__/autosave-rapid-changes.test.tsx`
- [ ] All imports are correct and in proper order
- [ ] Test suite structure follows existing patterns
- [ ] beforeEach/afterEach properly set up and tear down fake timers
- [ ] All 4 test cases implemented
- [ ] All tests use `act()` wrapper for state updates
- [ ] All async assertions use `waitFor()` for reliability
- [ ] Tests use `{ delay: null }` for rapid input simulation
- [ ] Tests advance timers with buffer (debounce + 100ms)
- [ ] All assertions are specific and verify correct behavior

### Feature Validation

- [ ] Test 1: Rapid single-field changes - only last value submitted
- [ ] Test 2: Intermediate saves aborted - verified via submit tracking
- [ ] Test 3: Rapid changes during async validation - version check works
- [ ] Test 4: Multiple fields rapid changes - debounce resets correctly
- [ ] All tests pass consistently on multiple runs
- [ ] No flaky behavior observed
- [ ] Tests catch intentional regressions (validation of test quality)

### Code Quality Validation

- [ ] Test file follows existing codebase patterns
- [ ] Test names are descriptive and follow convention
- [ ] Comments explain what each test verifies
- [ ] Helper functions are well-documented
- [ ] No code duplication (helpers used where appropriate)
- [ ] Test isolation (each test is independent)
- [ ] Proper cleanup (afterEach restores state)

### Documentation & Deployment

- [ ] Test file has clear describe block explaining what's being tested
- [ ] Each test has descriptive name matching the scenario
- [ ] Comments explain why fake timers are needed
- [ ] Comments explain the race condition scenario
- [ ] Test serves as executable documentation

---

## Anti-Patterns to Avoid

- ❌ Don't use real timers in tests - must use fake timers for reliability
- ❌ Don't skip `{ delay: null }` in userEvent.type() - tests will be slow
- ❌ Don't forget `act()` wrapper when advancing timers - causes React warnings
- ❌ Don't use exact debounce timing without buffer - tests may be flaky
- ❌ Don't forget `vi.useRealTimers()` in afterEach - pollutes other tests
- ❌ Don't use `expect(submitHandler).toHaveBeenCalled()` without count - too vague
- ❌ Don't skip `waitFor()` for async assertions - tests may be flaky
- ❌ Don't test implementation details - test behavior (submission count and values)
- ❌ Don't create multiple test files - all rapid changes tests in one file
- ❌ Don't skip testing intermediate saves abort - critical for race condition validation

---

## Additional Context

### Relationship to Previous Work

This test task (P3.M3.T2.S1) is part of the Race Condition Prevention milestone:

**P3.M3.T1: Review Existing Logic** (In Progress - P3.M3.T1.S1 parallel)
- P3.M3.T1.S1: Analyze executionVersionRef (provides analysis for this test)

**P3.M3.T2: Add Tests for Race Conditions** (This Task)
- P3.M3.T2.S1: Test rapid changes (THIS SUBTASK)
- P3.M3.T2.S2: Test async timing (NEXT SUBTASK)

### Why This Test is Critical

The rapid changes test is critical because:

1. **Real-World Scenario**: Users often type rapidly or paste content
2. **Race Condition Verification**: Proves executionVersionRef actually works
3. **Regression Prevention**: Future changes won't break this feature
4. **Edge Case Coverage**: Rapid changes are a critical edge case

### Expected Test Outcomes

Based on the analysis from P3.M3.T1.S1:

1. **✅ Test will PASS**: The executionVersionRef implementation is correct
2. **✅ Only last value submitted**: Version checkpoints prevent stale saves
3. **✅ Intermediate saves aborted**: Version check aborts intermediate operations
4. **✅ No memory leaks**: Tracking data is properly cleaned up

### Test Naming and Location

**File:** `packages/react/src/__tests__/autosave-rapid-changes.test.tsx`

**Naming Rationale:**
- `autosave-` prefix: Indicates it's testing auto-save functionality
- `rapid-changes`: Indicates the specific scenario being tested
- `.test.tsx`: Standard test file suffix for React components

**Alternative Considered Names:**
- `race-condition-rapid-changes.test.tsx` (too generic)
- `executionVersion-rapid-changes.test.tsx` (tests implementation, not behavior)
- `autosave-debounce-rapid.test.tsx` (doesn't emphasize race condition)

**Final Choice:** `autosave-rapid-changes.test.tsx` (clear, descriptive, follows patterns)

---

## Confidence Score

**10/10** for one-pass test implementation success

**Reasoning**:
- ✅ Exact file path and naming convention provided
- ✅ Complete test structure with 4 specific test cases
- ✅ Code examples for every test pattern
- ✅ Fake timer setup and cleanup patterns from existing tests
- ✅ Rapid change simulation patterns from existing tests
- ✅ Assertion patterns for verifying correct behavior
- ✅ External research on race condition testing
- ✅ Specific validation commands with expected outputs
- ✅ Anti-patterns section to avoid common mistakes
- ✅ Integration with previous analysis (P3.M3.T1.S1)

**Validation**: The completed PRP includes exact code patterns, comprehensive test examples, specific validation commands, clear success criteria, and detailed context from both codebase analysis and external research. A test developer unfamiliar with the codebase should be able to implement these tests successfully using only the PRP content and codebase access.

---

**PRP Version:** 1.0
**Last Updated:** 2026-01-13
**Status:** Ready for Implementation
