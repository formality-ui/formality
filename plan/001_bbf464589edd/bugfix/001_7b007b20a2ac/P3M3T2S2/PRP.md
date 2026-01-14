# Product Requirement Prompt (PRP): Test async timing edge cases

**Work Item:** P3.M3.T2.S2
**Parent Task:** P3.M3.T2 - Add Tests for Race Conditions
**Grandparent Task:** P3.M3 - Race Condition Prevention
**PRD Bugfix ID:** 001_7b007b20a2ac
**Date:** 2026-01-13

---

## Goal

**Feature Goal**: Create tests that verify `executionVersionRef` race condition prevention correctly handles async timing edge cases where field value changes occur while async validation is in progress, ensuring that:
1. The first validation is ignored when a second value change occurs
2. A third value change during the second validation results in the correct (third) value being submitted
3. All intermediate async operations are properly aborted via version checkpoints

**Deliverable**: Test case file `packages/react/src/__tests__/autosave-async-timing.test.tsx` containing:
1. Test for "start validation, change value before validation completes" scenario
2. Test for "change value again during second validation" scenario (triple-change scenario)
3. Verification that correct (final) value is ultimately submitted
4. Verification that intermediate validations are aborted at version checkpoints
5. Use of fake timers to precisely control async validation timing (500ms delay)

**Success Definition**:
- Test creates a Form with autoSave and a slow async validator (500ms delay)
- Test simulates: Start validation → Change value before validation completes → Change again during second validation
- Test advances fake timers at precise points to control when validation completes
- Test asserts `handleSubmit` is called exactly once with the FINAL (third) value only
- Test validates that intermediate validations were aborted (no intermediate submissions)
- Test validates validation order tracked via `validationCalls` array
- Test runs successfully with `pnpm test autosave-async-timing.test.tsx`
- Test passes consistently on multiple runs (no flaky behavior)

---

## User Persona

**Target User**: Formality library maintainers and QA engineers who need to verify that the race condition prevention mechanism correctly handles the specific timing edge case of "value changes during async validation."

**Use Case**: Before releasing the race condition prevention feature, maintainers need to ensure that:
1. When async validation is in progress and the value changes, the first validation result is ignored
2. When a second validation starts and the value changes again, the second validation is also ignored
3. Only the final (third) value validation completes and submits
4. All version checkpoints correctly abort intermediate operations

**User Journey**:
1. Maintainer runs the test suite: `pnpm test`
2. Test simulates precise timing: Value1 → (start validation) → Value2 (during validation) → Value3 (during second validation)
3. Test verifies only Value3 is submitted after all validations complete
4. If test passes, maintainers have confidence the version checkpoint mechanism handles async timing correctly
5. If test fails, maintainers know a version checkpoint is missing or broken

**Pain Points Addressed**:
- **Async Timing Uncertainty**: Without precise timing control, it's hard to test "change during validation" scenarios
- **Edge Case Coverage**: The triple-change scenario (value1→validate→value2→validate→value3) is a critical edge case
- **Verification Difficulty**: Proving that intermediate validations are actually aborted requires precise test design
- **Flaky Tests**: Async timing tests are notoriously flaky - this test uses fake timers for reliability

---

## Why

- **Production Readiness**: The "change during async validation" scenario is common in real-world usage (e.g., slow API validation while user keeps typing)
- **Edge Case Coverage**: This is the most complex timing scenario for the version checkpoint mechanism
- **Regression Prevention**: Future code changes could break the version checkpoint logic - tests prevent this
- **Documentation**: Tests serve as executable documentation of expected async timing behavior
- **Integration with Previous Work**: This test complements P3.M3.T2.S1 (rapid changes) by testing a different timing scenario

---

## What

### User-Visible Behavior

**This is a TEST task - no user-visible behavior changes.**

**Test Output**: A test file that validates:
1. When validation starts (Value1), then value changes to Value2 before validation completes, the first validation is ignored
2. When a second validation starts for Value2, then value changes to Value3 during that validation, the second validation is also ignored
3. Only the final (Value3) validation completes and submits
4. All three version checkpoints correctly abort intermediate operations
5. Fake timers provide precise timing control (500ms validation delay)

### Success Criteria

- [ ] Test file created at `packages/react/src/__tests__/autosave-async-timing.test.tsx`
- [ ] Test uses `vi.useFakeTimers({ shouldAdvanceTime: true })` for precise timing control
- [ ] Test creates slow async validator (500ms delay) to enable controlled timing
- [ ] Test tracks validation calls via `validationCalls` array for order verification
- [ ] Test simulates: Value1 → (advance 200ms) → Value2 → (advance 200ms) → Value3 → (advance to complete)
- [ ] Test asserts `handleSubmit` is called exactly once with Value3 only
- [ ] Test asserts no submissions for Value1 or Value2 (intermediate values ignored)
- [ ] Test validates validation order via `validationCalls` array (value1:start, value2:start, value3:start/end)
- [ ] Test uses `waitFor()` for async assertions
- [ ] Test cleans up with `vi.useRealTimers()` in afterEach
- [ ] Test runs successfully with `pnpm test autosave-async-timing.test.tsx`
- [ ] Test passes consistently (no flaky behavior)

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact implementation location and file path
- Complete test structure with code examples for triple-change scenario
- Specific patterns from existing tests to follow
- Fake timer setup and cleanup patterns
- Async validator creation with configurable delay
- Validation call tracking patterns
- Triple-change timing test pattern
- Assertion patterns for verifying behavior
- External research references for async timing testing

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Previous PRP (Contract Context)
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M3T2S1/PRP.md
  why: Defines the rapid changes test - this PRP builds on that by testing async timing
  section: "Goal" for understanding what tests already exist
  section: "Implementation Patterns & Key Details" for test patterns to follow
  section: "Known Gotchas" for fake timer usage patterns

# Previous Task Research (Version Checkpoint Analysis)
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/docs/P3M3T1S1/research/external-race-condition-research.md
  why: Explains the version token pattern and three checkpoint architecture
  section: "Version/Token Pattern Research" for pattern explanation
  section: "Common Pitfalls and Solutions" for what to test
  section: "Recommended Testing Approach" for test categories (Async Timing Test)

# Primary Implementation File (What we're testing)
- file: /home/dustin/projects/formality/packages/react/src/components/Form.tsx
  why: Contains the executeAutoSave implementation with executionVersionRef
  pattern: Lines 195-196 (executionVersionRef declaration)
  pattern: Lines 441-469 (waitForFieldValidation with version check in polling loop)
  pattern: Lines 475-556 (executeAutoSave function with three version checkpoints)
  gotcha: waitForFieldValidation checks version INSIDE polling loop (line 449) - this is CRITICAL for aborting mid-validation
  gotcha: Three checkpoints ensure no stale saves (lines 503-508, 524-526, 539-544)
  gotcha: Version is incremented BEFORE capturing fields (line 477-478)

# Reference Test: Async Validation Patterns
- file: /home/dustin/projects/formality/packages/react/src/__tests__/autosave-validation.test.tsx
  why: Shows exact pattern for async validator creation with tracking
  pattern: Lines 13-24 (createAsyncValidator helper with validationCalls tracking)
  pattern: Lines 17-23 (async validator that tracks start/end calls)
  pattern: Lines 87-95 (beforeEach/afterEach for timer setup)
  pattern: Lines 26-45 (TestInput component with data-testid)
  gotcha: Always use `validationCalls.push()` to track validation order
  gotcha: Always reset `validationCalls = []` in beforeEach

# Reference Test: Fake Timer Usage
- file: /home/dustin/projects/formality/packages/react/src/__tests__/autosave-validation.test.tsx
  why: Shows exact pattern for fake timer setup and usage
  pattern: Lines 87-95 (beforeEach/afterEach for timer setup)
  pattern: Lines 129, 141, 191, 203 (advanceTimersByTimeAsync usage)
  pattern: Lines 272-312 (debounce timing test example)
  gotcha: Always use `{ shouldAdvanceTime: true }` for reliable tests
  gotcha: Always wrap in `act()` when advancing timers
  gotcha: Use buffer time (debounce + 100ms) for reliable assertions

# Reference Test: Previous Task (Rapid Changes)
- file: /home/dustin/projects/formality/packages/react/src/__tests__/autosave-rapid-changes.test.tsx
  why: Created by P3.M3.T2.S1 - shows patterns for race condition tests
  pattern: Lines 1-50 (import structure and helper functions)
  pattern: Lines 589-676 (rapid changes during async validation test)
  gotcha: Use `{ delay: null }` in userEvent.type() for fastest input
  gotcha: Clear mock calls before rapid changes to track only new calls
  gotcha: Use `waitFor()` for async assertions after rapid changes

# External Research: Async Timing Test Patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M3T2S2/research/async-timing-test-patterns.md
  why: Comprehensive research on testing async timing edge cases
  section: "Change During Async Operation Patterns" for testing value changes during validation
  section: "Request Sequencing with Version/Token Tracking" for version checkpoint testing
  section: "Best Practices for Async Timing Tests" for reliable test patterns
  section: "Precise Timer Control" for fake timer usage with overlapping operations

# External Research: Race Condition Prevention
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/docs/P3M3T1S1/research/external-race-condition-research.md
  why: Explains the three version checkpoint architecture being tested
  section: "Recommended Testing Approach" - "Async Timing Test" category
  section: "Version Token (Formality's Approach)" for pattern explanation
  section: "Common Pitfalls" - "Missing Version Check After Async Operation"

# External Documentation: Vitest Timer Mocks
- url: https://vitest.dev/guide/mocking/timers
  why: Official documentation for vi.useFakeTimers and vi.advanceTimersByTimeAsync
  critical: Understanding of shouldAdvanceTime option
  critical: How to properly clean up fake timers
  critical: How to advance timers precisely for controlled timing

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
│   ├── setup.ts                                     # Test configuration
│   ├── autosave-validation.test.tsx                 # REFERENCE - Async validator patterns
│   ├── autosave-rapid-changes.test.tsx              # REFERENCE - Rapid changes test (P3.M3.T2.S1)
│   └── autosave-async-timing.test.tsx               # CREATE - New test file
├── components/
│   └── Form.tsx                                     # PRIMARY - Implementation being tested
│                                                       # Line 196: executionVersionRef
│                                                       # Line 441-469: waitForFieldValidation
│                                                       # Line 447-450: Version check in polling loop
│                                                       # Line 475-556: executeAutoSave
└── context/
    └── FormContext.ts                                # Form context types
```

### Desired Codebase Tree with Changes

```bash
packages/react/src/
└── __tests__/
    └── autosave-async-timing.test.tsx                # CREATE - New test file
                                                          # Test: change during validation (value1→validate→value2→validate→value3)
                                                          # Verify: only value3 submitted
                                                          # Verify: intermediate validations aborted
                                                          # Uses: fake timers for precise timing control
                                                          # Uses: 500ms async validator delay
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: waitForFieldValidation checks version INSIDE polling loop
// This is what allows aborting mid-validation when value changes
// See Form.tsx lines 447-450:
const waitForFieldValidation = useCallback(
  async (fields: string[], version: number): Promise<boolean> => {
    while (Date.now() - startTime < maxWaitMs) {
      // CRITICAL: Version check INSIDE loop - aborts immediately if version changes
      if (executionVersionRef.current !== version) {
        return false;  // Abort mid-wait if version changed
      }
      // Check validation status...
    }
  },
  [],
);

// CRITICAL: Three version checkpoints in executeAutoSave
// Checkpoint 1: After first waitForFieldValidation (line 503-508)
// Checkpoint 2: After methods.trigger (line 524-526)
// Checkpoint 3: After second waitForFieldValidation (line 539-544)
// All three must be tested to ensure complete coverage

// CRITICAL: Version is incremented BEFORE capturing fields
executionVersionRef.current++;
const executionVersion = executionVersionRef.current;  // GOOD: After increment
const changedFields = new Set(pendingChangedFields.current);
pendingChangedFields.current.clear();  // Cleared after capture

// CRITICAL: Fake timers MUST use { shouldAdvanceTime: true }
vi.useFakeTimers({ shouldAdvanceTime: true });  // GOOD: Reliable timing
// vi.useFakeTimers();                            // BAD: Unreliable, may hang

// CRITICAL: Always wrap timer advances in act()
await act(async () => {
  await vi.advanceTimersByTimeAsync(200);
});  // GOOD: Proper React state update
// await vi.advanceTimersByTimeAsync(200);        // BAD: May cause warnings

// CRITICAL: Use 500ms delay for async validator in this test
// This enables precise timing control:
// - Value1 → start validation
// - Advance 200ms (validation still running)
// - Value2 (version increments, first validation aborts)
// - Advance 200ms (second validation still running)
// - Value3 (version increments, second validation aborts)
// - Advance to complete (third validation completes)
const slowValidator = async (value: unknown) => {
  validationCalls.push(`${value}:start`);
  await new Promise((resolve) => setTimeout(resolve, 500));  // 500ms delay
  validationCalls.push(`${value}:end`);
  return true;
};

// CRITICAL: Track validation calls with specific values
// This allows verifying validation order:
// ["a:start", "b:start", "c:start", "c:end"]
// Note: "a:end" and "b:end" are missing because those validations were aborted
let validationCalls: string[] = [];

// CRITICAL: Always clean up fake timers in afterEach
afterEach(() => {
  vi.useRealTimers();  // REQUIRED: Prevents test pollution
});

// CRITICAL: Use waitFor() for async assertions
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});  // GOOD: Waits for async operation
// expect(submitHandler).toHaveBeenCalledTimes(1);  // BAD: May be flaky

// CRITICAL: Test file naming convention
// Use <feature>.test.tsx for React component tests
// Use descriptive name: autosave-async-timing.test.tsx

// CRITICAL: Import order matters
// 1. Vitest imports first (describe, it, expect, vi, beforeEach, afterEach)
// 2. React imports (React, StrictMode if needed)
// 3. Testing library imports (render, screen, act, waitFor)
// 4. userEvent import
// 5. Component imports
// 6. Type imports

// CRITICAL: debounce period is 500ms by default
// When advancing timers, use 600ms (500 + 100 buffer) for reliable assertions

// CRITICAL: Triple-change scenario timing
// 1. Type "a" → starts validation (500ms)
// 2. Advance 200ms → validation still running
// 3. Type "b" → version increments, first validation aborts
// 4. Advance 200ms → second validation still running
// 5. Type "c" → version increments, second validation aborts
// 6. Advance 600ms → debounce + third validation completes
// 7. Assert: only "c" submitted, no "a" or "b" submissions
```

---

## Implementation Blueprint

### Data Models and Structure

**No new data models needed** - This is a test file that uses existing Form components and types.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE packages/react/src/__tests__/autosave-async-timing.test.tsx
  - ADD: Import statements (vitest, React, testing-library, userEvent)
  - ADD: Form component imports
  - CREATE: describe block for test suite
  - NAMING: "AutoSave Race Condition - Async Timing Edge Cases"
  - PATTERN: Follow autosave-validation.test.tsx import structure

Task 2: ADD test setup and teardown
  - IMPLEMENT: beforeEach to setup fake timers and mocks
  - IMPLEMENT: afterEach to restore real timers
  - PATTERN: Follow autosave-validation.test.tsx lines 87-95
  - USE: vi.useFakeTimers({ shouldAdvanceTime: true })
  - CLEANUP: vi.useRealTimers() in afterEach
  - RESET: validationCalls = [] in beforeEach

Task 3: ADD helper functions
  - IMPLEMENT: createSlowAsyncValidator helper (500ms delay)
  - IMPLEMENT: TestInput component with data-testid
  - PATTERN: Follow autosave-validation.test.tsx lines 16-24 (createAsyncValidator)
  - TRACK: validationCalls array for order verification
  - DELAY: 500ms for slow validator (enables precise timing control)

Task 4: IMPLEMENT first test - single change during validation
  - CREATE: test case "should ignore first validation when value changes during validation"
  - RENDER: Form with autoSave, debounce={500}, single field with 500ms async validator
  - SIMULATE: Type "a" → start validation
  - ADVANCE: 200ms (validation still running, 300ms remaining)
  - SIMULATE: Type "b" (version should increment, first validation aborts)
  - ADVANCE: 600ms (past debounce + remaining validation)
  - ASSERT: handleSubmit called exactly once with "b" only
  - ASSERT: No submission for "a" (first value ignored)
  - ASSERT: validationCalls shows "a:start", "b:start/end" (no "a:end")
  - PATTERN: Use fake timers for precise timing control

Task 5: IMPLEMENT second test - triple-change scenario (main test for work item)
  - CREATE: test case "should submit only final value after multiple changes during validations"
  - RENDER: Form with autoSave, debounce={500}, single field with 500ms async validator
  - TRACK: Submit handler calls with values
  - SIMULATE: Type "a" → start validation (500ms duration)
  - ADVANCE: 200ms (validation still running)
  - SIMULATE: Type "ab" → version increments, first validation aborts
  - ADVANCE: 200ms (second validation still running)
  - SIMULATE: Type "abc" → version increments, second validation aborts
  - ADVANCE: 600ms (past debounce + third validation completes)
  - ASSERT: handleSubmit called exactly once with "abc" only
  - ASSERT: No submissions for "a" or "ab" (intermediate values ignored)
  - ASSERT: validationCalls shows "a:start", "ab:start", "abc:start/end" (no "a:end" or "ab:end")
  - PATTERN: This is the PRIMARY test for the work item

Task 6: IMPLEMENT third test - verify version checkpoint during validation
  - CREATE: test case "should abort at version checkpoint inside waitForFieldValidation"
  - RENDER: Form with autoSave, debounce={500}, single field
  - VERIFY: That waitForFieldValidation polling loop checks version
  - SIMULATE: Value change during validation wait
  - ASSERT: waitForFieldValidation returns false (aborted)
  - ASSERT: No submission occurs
  - PATTERN: Tests the version check at Form.tsx line 449

Task 7: IMPLEMENT fourth test - verify all three version checkpoints
  - CREATE: test case "should check version at all three checkpoints"
  - RENDER: Form with autoSave, debounce={500}, single field with cross-field dependency
  - SIMULATE: Changes that trigger all three checkpoints
  - ASSERT: Each checkpoint correctly aborts stale operations
  - ASSERT: Only final value submitted
  - PATTERN: Tests all three version checkpoints (lines 503-508, 524-526, 539-544)

Task 8: ADD comprehensive documentation
  - ADD: Comments explaining what each test verifies
  - ADD: Comments on why fake timers are needed
  - ADD: Comments on the triple-change scenario being tested
  - ADD: Comments on version checkpoint behavior being tested
  - DOCUMENT: The race condition scenario each test covers
  - DOCUMENT: The expected validation call order
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: File Structure and Imports
// Follow this exact import order

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { forwardRef } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, Field } from "../components/Form";
import { FormalityProvider } from "../components/FormalityProvider";
import type { FormFieldsConfig } from "@formality-ui/core";

// PATTERN 2: Test Suite Structure
describe("AutoSave Race Condition - Async Timing Edge Cases", () => {
  let submitHandler: ReturnType<typeof vi.fn>;
  let validationCalls: string[];

  beforeEach(() => {
    submitHandler = vi.fn();
    validationCalls = [];
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Tests go here...
});

// PATTERN 3: Slow Async Validator Helper (500ms delay)
// Use this pattern for precise timing control

function createSlowAsyncValidator(fieldName: string) {
  return async (value: unknown) => {
    validationCalls.push(`${value}:start`);
    // CRITICAL: 500ms delay enables precise timing control
    await new Promise((resolve) => setTimeout(resolve, 500));
    validationCalls.push(`${value}:end`);
    return true;
  };
}

// PATTERN 4: Test Input Component
// Use this pattern for test input components

const TestInput = forwardRef<HTMLInputElement, {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
}>(({ name, value = "", onChange = () => {} }, ref) => (
  <input
    ref={ref}
    data-testid={name}
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
));

TestInput.displayName = "TestInput";

// PATTERN 5: Single Change During Validation Test
// This tests: start validation → change value → verify first validation ignored

it("should ignore first validation when value changes during validation", async () => {
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
          fieldA: {
            type: "textField",
            validator: createSlowAsyncValidator("fieldA"),
          },
        }}
        onSubmit={trackedSubmitHandler}
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
  submitHandler.mockClear();

  const fieldA = screen.getByTestId("fieldA");

  // CRITICAL: Type first value (starts 500ms validation)
  await act(async () => {
    await userEvent.type(fieldA, "a", { delay: null });
  });

  // CRITICAL: Advance 200ms (validation still running, 300ms remaining)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });

  // CRITICAL ASSERTION: First validation started but not completed
  expect(validationCalls).toContain("a:start");
  expect(validationCalls).not.toContain("a:end");

  // CRITICAL: Type second value (version increments, first validation aborts)
  await act(async () => {
    await userEvent.type(fieldA, "b", { delay: null });
  });

  // CRITICAL ASSERTION: Second validation started
  expect(validationCalls).toContain("ab:start");

  // Advance past debounce + second validation
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });

  // Wait for async operations to complete
  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  // CRITICAL ASSERTION: Only ONE submission occurred
  expect(submitHandler).toHaveBeenCalledTimes(1);

  // CRITICAL ASSERTION: Submitted value is "ab" (final value)
  expect(submitHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      fieldA: "ab",
    })
  );

  // CRITICAL ASSERTION: First validation was aborted (no "a:end")
  expect(validationCalls).not.toContain("a:end");
  // Second validation completed
  expect(validationCalls).toContain("ab:end");
});

// PATTERN 6: Triple-Change Scenario Test (PRIMARY TEST for work item)
// This tests: start validation → change → change again → verify only final value submitted

it("should submit only final value after multiple changes during validations", async () => {
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
          fieldA: {
            type: "textField",
            validator: createSlowAsyncValidator("fieldA"),
          },
        }}
        onSubmit={trackedSubmitHandler}
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
  submitHandler.mockClear();

  const fieldA = screen.getByTestId("fieldA");

  // STEP 1: Type first value (starts 500ms validation)
  await act(async () => {
    await userEvent.type(fieldA, "a", { delay: null });
  });

  // CRITICAL ASSERTION: First validation started
  expect(validationCalls).toContain("a:start");

  // STEP 2: Advance 200ms (validation still running, 300ms remaining)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });

  // CRITICAL ASSERTION: First validation NOT completed yet
  expect(validationCalls).not.toContain("a:end");

  // STEP 3: Type second value (version increments, first validation aborts)
  await act(async () => {
    await userEvent.type(fieldA, "b", { delay: null });
  });

  // CRITICAL ASSERTION: Second validation started
  expect(validationCalls).toContain("ab:start");

  // STEP 4: Advance 200ms (second validation still running, 300ms remaining)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });

  // CRITICAL ASSERTION: Second validation NOT completed yet
  expect(validationCalls).not.toContain("ab:end");

  // STEP 5: Type third value (version increments, second validation aborts)
  await act(async () => {
    await userEvent.type(fieldA, "c", { delay: null });
  });

  // CRITICAL ASSERTION: Third validation started
  expect(validationCalls).toContain("abc:start");

  // STEP 6: Advance past debounce + third validation
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });

  // Wait for async operations to complete
  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  // CRITICAL ASSERTION: Only ONE submission occurred
  expect(submitHandler).toHaveBeenCalledTimes(1);

  // CRITICAL ASSERTION: Submitted value is "abc" (FINAL value only)
  expect(submitHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      fieldA: "abc",
    })
  );

  // CRITICAL ASSERTION: No submissions for "a" or "ab" (intermediate values ignored)
  expect(submitLog).toHaveLength(1);
  expect(submitLog[0]).toBe("submit:abc");

  // CRITICAL ASSERTION: First validation was aborted (no "a:end")
  expect(validationCalls).not.toContain("a:end");
  // Second validation was aborted (no "ab:end")
  expect(validationCalls).not.toContain("ab:end");
  // Third validation completed
  expect(validationCalls).toContain("abc:end");

  // CRITICAL ASSERTION: Validation order is correct
  const startIndex = validationCalls.indexOf("a:start");
  const abStartIndex = validationCalls.indexOf("ab:start");
  const abcStartIndex = validationCalls.indexOf("abc:start");
  expect(startIndex).toBeLessThan(abStartIndex);
  expect(abStartIndex).toBeLessThan(abcStartIndex);
});

// PATTERN 7: Verify Version Checkpoint During Validation Test
// This tests that waitForFieldValidation polling loop checks version

it("should abort at version checkpoint inside waitForFieldValidation", async () => {
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
          fieldA: {
            type: "textField",
            validator: createSlowAsyncValidator("fieldA"),
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

  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  validationCalls = [];
  submitHandler.mockClear();

  const fieldA = screen.getByTestId("fieldA");

  // Start validation
  await act(async () => {
    await userEvent.type(fieldA, "a", { delay: null });
  });

  // Advance to start debounce
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });

  // Change value during validation wait
  // This should trigger version checkpoint in waitForFieldValidation polling loop
  await act(async () => {
    await userEvent.type(fieldA, "b", { delay: null });
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
});

// PATTERN 8: Verify All Three Version Checkpoints Test
// This tests that all three version checkpoints work correctly

it("should check version at all three checkpoints in executeAutoSave", async () => {
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
          fieldA: {
            type: "textField",
            validator: createSlowAsyncValidator("fieldA"),
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

  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  validationCalls = [];
  submitHandler.mockClear();

  const fieldA = screen.getByTestId("fieldA");

  // Simulate multiple changes that trigger all checkpoints
  await act(async () => {
    await userEvent.type(fieldA, "a", { delay: null });
    await vi.advanceTimersByTimeAsync(200); // During first validation
    await userEvent.type(fieldA, "b", { delay: null }); // Triggers checkpoint 1
    await vi.advanceTimersByTimeAsync(200); // During second validation
    await userEvent.type(fieldA, "c", { delay: null }); // Triggers checkpoint 2 or 3
    await vi.advanceTimersByTimeAsync(600); // Complete
  });

  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  // CRITICAL ASSERTION: All checkpoints worked, only final value submitted
  expect(submitHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      fieldA: "abc",
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
  - packages/react/src/__tests__/autosave-async-timing.test.tsx (new test file)
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
pnpm test autosave-async-timing.test.tsx

# Expected: Tests run (may fail initially, but should execute)

# Run all tests to ensure no regressions
pnpm test

# Expected: All tests pass (existing tests should not be affected)
```

### Level 2: Test Execution (Component Validation)

```bash
# Run the specific test file
pnpm test autosave-async-timing.test.tsx

# Expected Output:
# AutoSave Race Condition - Async Timing Edge Cases
#   should ignore first validation when value changes during validation
#   should submit only final value after multiple changes during validations
#   should abort at version checkpoint inside waitForFieldValidation
#   should check version at all three checkpoints in executeAutoSave
#
# Test Files  1 passed (1)
# Tests  4 passed (4)

# Run with coverage (if available)
pnpm test autosave-async-timing.test.tsx --coverage

# Expected: Coverage report shows executeAutoSave function is tested
# Expected: Coverage shows all three version checkpoints are exercised

# Run tests multiple times to check for flakiness
for i in {1..5}; do pnpm test autosave-async-timing.test.tsx; done

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
#   - waitForFieldValidation function: covered

# Expected: executeAutoSave has increased coverage due to new tests
# Expected: All three version checkpoints are executed during tests
# Expected: waitForFieldValidation polling loop version check is covered

# Specifically check for version checkpoint coverage:
# The tests should exercise:
# - Version increment (line 477)
# - Version check in waitForFieldValidation polling loop (line 449)
# - Version check after first validation (line 503-508)
# - Version check after trigger (line 524-526)
# - Version check after second validation (line 539-544)

# Expected: All version checkpoints are executed during tests
```

### Level 4: Integration Testing (Feature Validation)

```bash
# Verify the tests work with the actual Form component

# Test that the triple-change scenario works correctly in real usage
# This is validated by the test itself - if it passes, the feature works

# Verify the tests catch regressions
# To test this, temporarily break a version checkpoint:

# In Form.tsx, comment out a version checkpoint:
# if (executionVersionRef.current !== executionVersion) {
#   return;  # <-- Comment this out
# }

# Run tests again:
# pnpm test autosave-async-timing.test.tsx

# Expected: Tests FAIL (detect the regression)
# This proves the tests are validating the correct behavior

# Restore the code and verify tests pass again

# Expected: Tests PASS after restoring the code

# Test the waitForFieldValidation version checkpoint specifically:
# Comment out the version check in the polling loop (line 449):
# if (executionVersionRef.current !== version) {
#   return false;  # <-- Comment this out
# }

# Run tests again:
# pnpm test autosave-async-timing.test.tsx

# Expected: Tests FAIL (intermediate validations are not aborted)

# Restore the code and verify tests pass again
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test file created at correct location: `packages/react/src/__tests__/autosave-async-timing.test.tsx`
- [ ] All imports are correct and in proper order
- [ ] Test suite structure follows existing patterns
- [ ] beforeEach/afterEach properly set up and tear down fake timers
- [ ] All 4 test cases implemented
- [ ] All tests use `act()` wrapper for state updates
- [ ] All async assertions use `waitFor()` for reliability
- [ ] Tests use `{ delay: null }` for rapid input simulation
- [ ] Tests use 500ms async validator delay for precise timing control
- [ ] All assertions are specific and verify correct behavior

### Feature Validation

- [ ] Test 1: Single change during validation - first validation ignored
- [ ] Test 2: Triple-change scenario - only final value submitted (PRIMARY TEST)
- [ ] Test 3: Version checkpoint in waitForFieldValidation - aborts correctly
- [ ] Test 4: All three version checkpoints - all work correctly
- [ ] All tests pass consistently on multiple runs
- [ ] No flaky behavior observed
- [ ] Tests catch intentional regressions (validation of test quality)
- [ ] Validation call tracking verifies correct order (start/end calls)

### Code Quality Validation

- [ ] Test file follows existing codebase patterns
- [ ] Test names are descriptive and follow convention
- [ ] Comments explain what each test verifies
- [ ] Helper functions are well-documented
- [ ] No code duplication (helpers used where appropriate)
- [ ] Test isolation (each test is independent)
- [ ] Proper cleanup (afterEach restores state)
- [ ] Validation call tracking is clear and verifiable

### Documentation & Deployment

- [ ] Test file has clear describe block explaining what's being tested
- [ ] Each test has descriptive name matching the scenario
- [ ] Comments explain why fake timers are needed
- [ ] Comments explain the triple-change scenario
- [ ] Comments explain the version checkpoint behavior
- [ ] Test serves as executable documentation
- [ ] Expected validation call order is documented

---

## Anti-Patterns to Avoid

- Don't use real timers in tests - must use fake timers for precise timing control
- Don't use short async delays (< 500ms) - makes it hard to control timing
- Don't skip `{ delay: null }` in userEvent.type() - tests will be slow
- Don't forget `act()` wrapper when advancing timers - causes React warnings
- Don't use exact debounce timing without buffer - tests may be flaky
- Don't forget `vi.useRealTimers()` in afterEach - pollutes other tests
- Don't use `expect(submitHandler).toHaveBeenCalled()` without count - too vague
- Don't skip `waitFor()` for async assertions - tests may be flaky
- Don't test implementation details - test behavior (submission count and values)
- Don't create multiple test files - all async timing tests in one file
- Don't skip tracking validation calls - critical for verifying abort behavior
- Don't assume validations complete - verify with validationCalls array
- Don't skip testing the triple-change scenario - this is the PRIMARY test for the work item
- Don't use generic delays - use precise 200ms advances for controlled testing
- Don't forget to reset validationCalls between tests - causes false assertions

---

## Additional Context

### Relationship to Previous Work

This test task (P3.M3.T2.S2) is part of the Race Condition Prevention milestone:

**P3.M3.T1: Review Existing Logic** (Complete)
- P3.M3.T1.S1: Analyze executionVersionRef (provides analysis for tests)

**P3.M3.T2: Add Tests for Race Conditions** (This Task)
- P3.M3.T2.S1: Test rapid changes (Complete - creates autosave-rapid-changes.test.tsx)
- P3.M3.T2.S2: Test async timing (THIS SUBTASK - creates autosave-async-timing.test.tsx)

### Key Difference from P3.M3.T2.S1

| Aspect | P3.M3.T2.S1 (Rapid Changes) | P3.M3.T2.S2 (Async Timing) |
|--------|----------------------------|----------------------------|
| **Scenario** | 10 rapid changes within debounce period | Change DURING async validation |
| **Focus** | Debounce timing + version increment | Version checkpoint during validation |
| **Timing Control** | Simulate rapid typing, advance debounce | Precise 200ms advances during validation |
| **Validator Delay** | 50ms (fast) | 500ms (slow) |
| **Test Name** | autosave-rapid-changes.test.tsx | autosave-async-timing.test.tsx |
| **Primary Assertion** | Only last value submitted after rapid typing | Only final value after multiple mid-validation changes |

### Why This Test is Critical

The async timing test is critical because:

1. **Real-World Scenario**: Slow API validation (e.g., username availability check) while user keeps typing
2. **Version Checkpoint Verification**: Proves version checkpoints work DURING async operations, not just at the start
3. **waitForFieldValidation Validation**: Tests the version check in the polling loop (line 449)
4. **Edge Case Coverage**: Triple-change scenario is the most complex timing edge case
5. **Regression Prevention**: Future changes won't break the checkpoint mechanism

### Expected Test Outcomes

Based on the analysis from P3.M3.T1.S1:

1. **Test will PASS**: The executionVersionRef implementation is correct
2. **Only final value submitted**: All three version checkpoints prevent stale saves
3. **Intermediate validations aborted**: Version check in polling loop aborts mid-validation
4. **Validation call order correct**: "a:start", "ab:start", "abc:start/end" (no "a:end" or "ab:end")
5. **No memory leaks**: Tracking data is properly cleaned up

### Test Naming and Location

**File:** `packages/react/src/__tests__/autosave-async-timing.test.tsx`

**Naming Rationale:**
- `autosave-` prefix: Indicates it's testing auto-save functionality
- `async-timing`: Indicates the specific scenario being tested (async timing edge cases)
- `.test.tsx`: Standard test file suffix for React components

**Final Choice:** `autosave-async-timing.test.tsx` (clear, descriptive, follows patterns)

### Triple-Change Scenario Timing Diagram

```
Time    | Action                              | Version | Validation State          | Checkpoint
--------|-------------------------------------|---------|---------------------------|------------
0ms     | Type "a"                            | 0->1     | Start validation (500ms)  | -
200ms   | Advance timers                      | 1       | Validation running        | -
201ms   | Type "b"                            | 1->2     | First validation ABORTED   | Checkpoint 1 (line 449)
401ms   | Advance timers                      | 2       | Second validation running | -
402ms   | Type "c"                            | 2->3     | Second validation ABORTED  | Checkpoint 1 (line 449)
1002ms  | Advance 600ms (past debounce)       | 3       | Third validation completes| All checkpoints pass
1003ms  | Submit "abc"                        | 3       | DONE                      | Success
```

### Expected Validation Call Order

```
Expected validationCalls array: ["a:start", "ab:start", "abc:start", "abc:end"]

NOT present (aborted):
- "a:end" (first validation aborted at checkpoint 1)
- "ab:end" (second validation aborted at checkpoint 1)

This proves that the version checkpoint in waitForFieldValidation polling loop
correctly aborts validations when the version changes.
```

---

## Confidence Score

**10/10** for one-pass test implementation success

**Reasoning**:
- Exact file path and naming convention provided
- Complete test structure with 4 specific test cases
- Code examples for every test pattern including triple-change scenario
- Fake timer setup and cleanup patterns from existing tests
- Precise timing control with 500ms async validator delay
- Validation call tracking patterns for order verification
- Assertion patterns for verifying correct behavior
- External research on async timing test patterns
- Specific validation commands with expected outputs
- Anti-patterns section to avoid common mistakes
- Integration with previous analysis (P3.M3.T1.S1)
- Clear distinction from P3.M3.T2.S1 (different scenario)
- Timing diagram for triple-change scenario
- Expected validation call order documented

**Validation**: The completed PRP includes exact code patterns, comprehensive test examples, specific validation commands, clear success criteria, and detailed context from both codebase analysis and external research. A test developer unfamiliar with the codebase should be able to implement these tests successfully using only the PRP content and codebase access.

---

**PRP Version:** 1.0
**Last Updated:** 2026-01-13
**Status:** Ready for Implementation
