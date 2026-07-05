# PRP: Test Normal Debounce Preserved

**Work Item**: P1.M2.T2.S2 - Test normal debounce preserved
**Parent Task**: P1.M2.T2 - Add Tests for debounce: false
**Priority**: P1 (Critical)

---

## Goal

**Feature Goal**: Verify that normal debounce behavior is preserved and continues to work correctly after the `inputConfig.debounce: false` feature implementation.

**Deliverable**: Regression tests that explicitly verify normal debounce behavior remains unchanged, plus confirmation that all existing autosave tests continue to pass.

**Success Definition**:

- All existing autosave-validation tests pass without modification
- New regression tests explicitly verify normal debounce timing (1000ms default, form-level override)
- Tests document the expected debounce behavior for future reference
- No regressions introduced by the `debounce: false` feature

---

## Why

- **Regression Prevention**: The `debounce: false` feature adds a new code path (`inputConfig?.debounce === false`). Without explicit tests, future changes could accidentally break the normal debounce path.
- **Documentation**: Explicit tests serve as documentation for what "normal debounce" means in this codebase.
- **Confidence**: Ensures the new feature didn't accidentally modify existing behavior.
- **Contract Validation**: Validates that when `inputConfig` is undefined or doesn't contain `debounce: false`, the normal debounce path is taken.

---

## What

Verify that normal debounce behavior works as expected when fields do NOT have `inputConfig.debounce: false` configured.

**Test Scenarios**:

1. **Default debounce value (1000ms)**: Verify form uses 1000ms default when no debounce prop provided
2. **Form-level override**: Verify form-level debounce prop is used when provided
3. **No inputConfig**: Verify fields without inputConfig use normal debounce
4. **inputConfig without debounce**: Verify fields with inputConfig but no debounce setting use normal debounce
5. **Existing test suite**: Run all existing autosave tests to confirm no regression

### Success Criteria

- [ ] All existing autosave-validation tests pass
- [ ] New test verifies 1000ms default debounce value
- [ ] New test verifies form-level debounce override works
- [ ] New test verifies undefined inputConfig uses normal debounce
- [ ] New test verifies empty inputConfig uses normal debounce
- [ ] Tests explicitly state "normal debounce preserved" for clarity
- [ ] `pnpm test` runs successfully with all tests passing

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes. This PRP provides:

- Exact test file location and structure
- Complete test templates with specific assertions
- All existing test patterns to follow
- Specific debounce values and timing expectations
- Integration points with previous implementation
- Research documents explaining implementation details

### Documentation & References

```yaml
# MUST READ - Critical implementation references

# CONTRACT FROM PREVIOUS SUBTASKS
- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S1/PRP.md
  why: Defines the debounce: false feature that was added
  contract: Tests for immediate submission exist at lines 411-506
  critical: Our tests must NOT interfere with those tests

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S1/PRP.md
  why: Defines inputConfig parameter contract
  contract: inputConfig?: InputConfig, optional parameter
  critical: Undefined inputConfig should use normal debounce

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S2/PRP.md
  why: Defines the conditional execution logic
  contract: if (inputConfig?.debounce === false) { immediate } else { debounced }
  critical: The else branch is what we're testing

# IMPLEMENTATION TARGET - TEST FILE
- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: This is where regression tests will be added
  pattern: Follow existing test structure with describe blocks
  gotcha: New tests must use same beforeEach/afterEach setup
  exact: File contains 8 existing tests, add new describe block at end

# REFERENCE - FORM COMPONENT
- file: packages/react/src/components/Form.tsx
  why: Contains the debounce implementation being tested
  pattern: changeField function (lines 299-324) with conditional logic
  pattern: useEffect hook (lines 525-558) creating debounced function
  exact: Default debounce value is 1000ms (line 136)
  critical: Normal debounce path is the `else` branch in changeField

# RESEARCH DOCUMENTATION
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S2/research/existing-debounce-tests-catalog.md
  why: Complete catalog of all existing debounce tests
  section: Existing Tests in autosave-validation.test.tsx, Key Insights

- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S2/research/vitest-timer-api-reference.md
  why: Vitest timer APIs for testing debounce behavior
  section: Testing Patterns, Pattern 1: Test Normal Debounce

- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S2/research/form-debounce-implementation-details.md
  why: Detailed analysis of normal debounce code path
  section: Normal Debounce Code Path, Backward Compatibility

- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S1/research/autosave-test-patterns.md
  why: Existing autosave test patterns to follow
  section: Timer Setup and Teardown, Assertion Patterns

# EXTERNAL RESEARCH - Vitest Testing
- url: https://vitest.dev/guide/mocking/timers
  why: Official vitest timer documentation
  critical: vi.useFakeTimers, vi.advanceTimersByTimeAsync

- url: https://vitest.dev/api/vi
  why: Complete vi API reference
  critical: vi.getTimerCount(), vi.runAllTimersAsync

- url: https://lodash.com/docs/4.17.15#debounce
  why: Lodash debounce behavior documentation
  critical: Trailing edge execution, reset on call behavior
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/
├── packages/
│   ├── core/
│   │   └── src/
│   │       └── types/
│   │           └── config.ts                    # InputConfig type definition
│   └── react/
│       ├── src/
│       │   ├── components/
│       │   │   └── Form.tsx                     # changeField (lines 299-324), useEffect (lines 525-558)
│       │   └── __tests__/
│       │       └── autosave-validation.test.tsx  # TARGET: Add regression tests here
│                   ├── Lines 94-408: Existing normal debounce tests
│                   ├── Lines 411-506: Immediate submission tests (P1.M2.T2.S1)
│                   └── [ADD HERE]: Normal debounce preserved tests
├── plan/
│   └── 001_bbf464589edd/
│       └── bugfix/
│           └── 001_7b007b20a2ac/
│               ├── P1M2T1S1/PRP.md              # Previous: inputConfig parameter
│               ├── P1M2T1S2/PRP.md              # Previous: conditional execution
│               ├── P1M2T1S3/PRP.md              # Previous: Field integration
│               ├── P1M2T1S4/PRP.md              # Previous: FormProps type
│               ├── P1M2T2S1/PRP.md              # Previous: Immediate submission tests
│               └── P1M2T2S2/
│                   ├── PRP.md                   # This file
│                   └── research/
│                       ├── existing-debounce-tests-catalog.md
│                       ├── vitest-timer-api-reference.md
│                       └── form-debounce-implementation-details.md
└── package.json                                  # Test scripts
```

### Desired Codebase Tree (Files to Modify)

```bash
# Modified files:
packages/react/src/__tests__/autosave-validation.test.tsx  # ADD: Regression tests for normal debounce

# No new files created in this subtask
# All tests added to existing autosave-validation.test.tsx file
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: The existing test file uses vi.useFakeTimers({ shouldAdvanceTime: true })
// in beforeEach. This MUST be preserved for all new tests.

// CRITICAL: When testing normal debounce with default value (1000ms), advance timers
// by at least 1100ms to be safe. The form default is 1000ms, but existing tests use
// 500ms debounce prop for faster testing.

// GOTCHA: Most existing tests use debounce={500} for faster execution.
// Only test the 1000ms default if you explicitly want to test the default value.
// Otherwise, use 500ms for consistency with existing tests.

// PATTERN: The key assertion for normal debounce is that submitHandler is NOT called
// immediately after field change. You MUST verify:
// expect(submitHandler).not.toHaveBeenCalled()
// BEFORE advancing timers.

// GOTCHA: When advancing past debounce, always add a buffer (e.g., +100ms).
// For 500ms debounce, advance 600ms. For 1000ms debounce, advance 1100ms.

// CRITICAL: The Field component without inputConfig should use normal debounce.
// <Field name="fieldA" /> -> normal debounce
// <Field name="fieldA" inputConfig={{}} /> -> normal debounce (empty object)
// <Field name="fieldA" inputConfig={{ debounce: false }} /> -> immediate submission

// PATTERN: Follow the existing test structure:
// 1. Use beforeEach/afterEach from the existing file
// 2. Use the same TestInput component and testInputs config
// 3. Use the same submitHandler = vi.fn() pattern
// 4. Add a new describe block for clarity

// GOTCHA: The test file already has tests for normal debounce behavior (lines 94-408).
// These tests implicitly verify normal debounce works. Our new tests should be
// EXPLICIT regression tests that clearly state "normal debounce is preserved".

// CRITICAL: Do NOT modify existing tests. Only ADD new tests in a new describe block.
// The existing tests serve as the primary regression check. Our new tests provide
// explicit documentation of expected behavior.

// PATTERN: For comprehensive regression testing, add a describe block:
// describe("Normal Debounce Preserved (Regression)", () => { ... })
// This clearly communicates the purpose of these tests.
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - this task adds regression tests to an existing test file.

**Test Structure**:

```typescript
describe("Normal Debounce Preserved (Regression)", () => {
  it("should use default 1000ms debounce when no debounce prop provided", async () => {
    // Test implementation
  });

  it("should use form-level debounce prop when provided", async () => {
    // Test implementation
  });

  it("should use normal debounce when inputConfig is undefined", async () => {
    // Test implementation
  });

  it("should use normal debounce when inputConfig exists without debounce", async () => {
    // Test implementation
  });

  it("should wait for debounce period before submitting", async () => {
    // Test implementation
  });
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY existing tests pass
  - RUN: pnpm test packages/react/src/__tests__/autosave-validation.test.tsx
  - VERIFY: All 8 existing tests pass (lines 94-506)
  - VERIFY: No test failures related to debounce behavior
  - DEPENDENCIES: None

Task 2: IDENTIFY location for new tests
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - FIND: End of file (after line 506)
  - DECIDE: Add new describe block "Normal Debounce Preserved (Regression)"
  - RECOMMENDATION: Place after "Immediate Submission (debounce: false)" block
  - DEPENDENCIES: Task 1

Task 3: WRITE regression test for default debounce value
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying 1000ms default when no debounce prop
  - IMPLEMENT: Render Form without debounce prop, change field, verify no immediate submission, advance 1100ms, verify submission
  - PATTERN: Follow existing test structure from file
  - NAMING: "should use default 1000ms debounce when no debounce prop provided"
  - DEPENDENCIES: Task 2

Task 4: WRITE regression test for form-level override
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying form-level debounce prop is used
  - IMPLEMENT: Render Form with debounce={750}, verify 750ms delay
  - PATTERN: Follow existing test structure, use 750ms to distinguish from default
  - NAMING: "should use form-level debounce prop when provided"
  - DEPENDENCIES: Task 3

Task 5: WRITE regression test for undefined inputConfig
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying undefined inputConfig uses normal debounce
  - IMPLEMENT: Render Form with autoSave, Field without inputConfig, verify debounce behavior
  - PATTERN: Follow existing test structure
  - NAMING: "should use normal debounce when inputConfig is undefined"
  - DEPENDENCIES: Task 4

Task 6: WRITE regression test for empty inputConfig
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying empty inputConfig uses normal debounce
  - IMPLEMENT: Render Field with inputConfig={{}}, verify normal debounce
  - PATTERN: Follow existing test structure
  - NAMING: "should use normal debounce when inputConfig exists without debounce"
  - DEPENDENCIES: Task 5

Task 7: WRITE explicit "wait for debounce" test
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case that explicitly states normal debounce waits for delay period
  - IMPLEMENT: Clear test stating "should wait for debounce period before submitting"
  - PATTERN: This documents the expected behavior explicitly
  - NAMING: "should wait for debounce period before submitting (regression)"
  - DEPENDENCIES: Task 6

Task 8: VERIFY all tests pass including new ones
  - RUN: pnpm test packages/react/src/__tests__/autosave-validation.test.tsx
  - EXPECT: All tests pass (existing 8 + new 5 = 13 total)
  - VALIDATE: No regressions, new tests verify normal debounce behavior
  - DEPENDENCIES: Task 7

Task 9: RUN full test suite
  - RUN: pnpm test
  - EXPECT: All tests in project pass
  - VALIDATE: No other test files affected by changes
  - DEPENDENCIES: Task 8
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Complete test template for normal debounce regression

describe("Normal Debounce Preserved (Regression)", () => {
  // These tests explicitly verify that normal debounce behavior is preserved
  // after adding the debounce: false feature. They serve as regression tests
  // and documentation for expected behavior.

  it("should use default 1000ms debounce when no debounce prop provided", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          // Note: No debounce prop - should use default 1000ms
        >
          <Field name="fieldA" />
        </Form>
      </FormalityProvider>,
    );

    // Wait for initial render
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    submitHandler.mockClear();

    // Change field value
    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    // CRITICAL: No immediate submission (normal debounce is active)
    expect(submitHandler).not.toHaveBeenCalled();

    // Advance past default 1000ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100); // 1000ms + buffer
    });

    // NOW submission should happen
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldA: "test",
      }),
    );
  });

  it("should use form-level debounce prop when provided", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={750} // Custom debounce value
        >
          <Field name="fieldA" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    // No immediate submission
    expect(submitHandler).not.toHaveBeenCalled();

    // Advance past 750ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(850); // 750ms + buffer
    });

    // NOW submission should happen
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should use normal debounce when inputConfig is undefined", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          {/* Field without inputConfig - uses normal debounce */}
          <Field name="fieldA" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    // CRITICAL: No immediate submission
    expect(submitHandler).not.toHaveBeenCalled();

    // Advance past debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // NOW submission should happen
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should use normal debounce when inputConfig exists without debounce", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          {/* Field with empty inputConfig - uses normal debounce */}
          <Field name="fieldA" inputConfig={{}} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    // No immediate submission
    expect(submitHandler).not.toHaveBeenCalled();

    // Advance past debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // NOW submission should happen
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should wait for debounce period before submitting (regression)", async () => {
    // This test explicitly documents that normal debounce waits for the
    // configured delay period before submitting. This is the key difference
    // from the debounce: false behavior (which submits immediately).

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="fieldA" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");

    // Change field value
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    // CRITICAL ASSERTION: submitHandler should NOT be called immediately
    // This is the key difference from debounce: false behavior
    expect(submitHandler).not.toHaveBeenCalled();

    // Partial debounce (300ms of 500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // STILL no submission
    expect(submitHandler).not.toHaveBeenCalled();

    // Complete debounce (remaining 200ms + buffer)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // NOW submission should happen
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldA: "test",
      }),
    );
  });
});

// GOTCHA: Key differences from debounce: false tests
//
// debounce: false (immediate submission):
// - expect(submitHandler).toHaveBeenCalledTimes(1) // IMMEDIATELY after field change
// - No timer advancement needed
//
// normal debounce (this file):
// - expect(submitHandler).not.toHaveBeenCalled() // NOT called immediately
// - Must advance timers past debounce period
// - expect(submitHandler).toHaveBeenCalledTimes(1) // AFTER timer advancement
```

### Integration Points

```yaml
TEST_FILE:
  - file: packages/react/src/__tests__/autosave-validation.test.tsx
  - add: New describe block "Normal Debounce Preserved (Regression)"
  - location: After line 506 (after "Immediate Submission" block)
  - follow: Existing test structure and patterns

FORM_COMPONENT:
  - file: packages/react/src/components/Form.tsx
  - test: changeField function (lines 299-324)
  - verify: else branch (debouncedSubmit()) is executed when inputConfig?.debounce !== false

PREVIOUS_TESTS:
  - file: packages/react/src/__tests__/autosave-validation.test.tsx
  - respect: Tests at lines 94-408 (existing normal debounce tests)
  - respect: Tests at lines 411-506 (debounce: false tests from P1.M2.T2.S1)
  - verify: All existing tests still pass
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type checking - Run after adding tests
pnpm typecheck

# Expected: Zero type errors
# Common errors to fix:
# - Missing imports (should already be in file)
# - Type mismatches with Field component props
# - Incorrect usage of inputConfig prop

# Linting
pnpm lint

# Expected: Zero linting errors

# Formatting
pnpm format
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the specific test file
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: All 13 tests pass (8 existing + 5 new)
# If new tests fail:
# 1. Check that debounce timing assertions are correct
# 2. Verify Field components don't have inputConfig={{ debounce: false }}
# 3. Check that timer advancement matches debounce value + buffer

# Run all react package tests
pnpm test --run

# Expected: All tests pass
# Any failures indicate issues with new tests or regressions
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify the new describe block was added
grep -n "Normal Debounce Preserved (Regression)" packages/react/src/__tests__/autosave-validation.test.tsx

# Expected output should show the line number of new describe block

# Verify all new test cases exist
grep -n "should use default 1000ms debounce" packages/react/src/__tests__/autosave-validation.test.tsx
grep -n "should use form-level debounce prop" packages/react/src/__tests__/autosave-validation.test.tsx
grep -n "should use normal debounce when inputConfig is undefined" packages/react/src/__tests__/autosave-validation.test.tsx
grep -n "should use normal debounce when inputConfig exists without debounce" packages/react/src/__tests__/autosave-validation.test.tsx
grep -n "should wait for debounce period before submitting (regression)" packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: All 5 test cases found

# Count total tests in file
grep -c "it(" packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: 13 (8 existing + 5 new)

# Run test with verbose output
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx --reporter=verbose

# Expected: All 13 tests pass with clear test names
```

### Level 4: Regression Verification (Feature Testing)

```bash
# Verify all existing tests still pass (critical for regression check)
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: Original 8 tests (lines 94-408) still pass without modification
# This is the PRIMARY regression check

# Verify no interference with debounce: false tests
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx -t "Immediate Submission"

# Expected: Both debounce: false tests still pass

# Verify specific test scenarios
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx -t "should NOT validate ALL fields"

# Expected: Original validation coordination test still passes

# Run full test suite to ensure no project-wide regressions
pnpm test

# Expected: All tests in entire project pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] New tests added to autosave-validation.test.tsx
- [ ] Tests follow existing patterns (beforeEach/afterEach, submitHandler mock)
- [ ] Tests use Field without inputConfig or with empty inputConfig
- [ ] Tests verify submitHandler NOT called immediately
- [ ] Tests verify submitHandler called after debounce period
- [ ] TypeScript compilation succeeds: `pnpm typecheck`
- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`

### Feature Validation

- [ ] All existing tests (8 original) still pass
- [ ] New tests verify default 1000ms debounce value
- [ ] New tests verify form-level debounce override works
- [ ] New tests verify undefined inputConfig uses normal debounce
- [ ] New tests verify empty inputConfig uses normal debounce
- [ ] Tests explicitly document "normal debounce preserved"

### Code Quality Validation

- [ ] Follows existing test patterns from the file
- [ ] Uses existing TestInput component and testInputs config
- [ ] Properly uses act() for React state updates
- [ ] Uses userEvent for realistic user interaction
- [ ] Includes clear assertions with comments
- [ ] Tests are clearly named for documentation purposes

### Documentation & Completeness

- [ ] Test names clearly describe normal debounce behavior
- [ ] Tests include comments explaining key assertions
- [ ] Tests can be understood without additional context
- [ ] Tests serve as regression checks for future changes
- [ ] Research documents provide implementation context

---

## Anti-Patterns to Avoid

- **Don't modify existing tests** - Only add new tests in a new describe block
- **Don't use inputConfig={{ debounce: false }}** - That's the immediate submission feature, not normal debounce
- **Don't skip the negative assertion** - Must verify submitHandler NOT called immediately
- **Don't use exact debounce values** - Always add buffer (e.g., 600ms for 500ms debounce)
- **Don't forget to use act()** - All timer operations must be wrapped in act()
- **Don't test rapid changes** - Existing tests already cover debounce coalescing
- **Don't test validation coordination** - Existing tests already cover that
- **Don't mix with debounce: false tests** - Keep normal debounce tests separate
- **Don't skip default debounce test** - Verify 1000ms default explicitly
- **Don't forget to run existing tests** - They are the primary regression check

---

## Related Work Items

- **Previous**: P1.M2.T1.S1 - Add inputConfig parameter to changeField (COMPLETED)
- **Previous**: P1.M2.T1.S2 - Implement conditional execution logic (COMPLETED in parallel)
- **Previous**: P1.M2.T1.S3 - Update Field to pass inputConfig (COMPLETED in parallel)
- **Previous**: P1.M2.T1.S4 - Fix Form debounce prop type (COMPLETED in parallel)
- **Previous**: P1.M2.T2.S1 - Test immediate submission (COMPLETED)
- **Current**: P1.M2.T2.S2 - Test normal debounce preserved (THIS ITEM)
- **Next**: P1.M2.T2.S3 - Test mixed debounce settings (PLANNED)

---

## Complete Test Case Templates

Copy these templates and adapt as needed:

```typescript
describe("Normal Debounce Preserved (Regression)", () => {
  // These tests explicitly verify that normal debounce behavior is preserved
  // after adding the debounce: false feature. They serve as regression tests
  // and documentation for expected behavior.

  beforeEach(() => {
    // Use the same setup from existing tests
    validationCalls = [];
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should use default 1000ms debounce when no debounce prop provided", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
        >
          <Field name="fieldA" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    // CRITICAL: No immediate submission
    expect(submitHandler).not.toHaveBeenCalled();

    // Advance past 1000ms default debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should use form-level debounce prop when provided", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={750}
        >
          <Field name="fieldA" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    expect(submitHandler).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(850);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should use normal debounce when inputConfig is undefined", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="fieldA" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    expect(submitHandler).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should use normal debounce when inputConfig exists without debounce", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="fieldA" inputConfig={{}} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    expect(submitHandler).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should wait for debounce period before submitting (regression)", async () => {
    // This test explicitly documents the key difference between normal
    // debounce and debounce: false behavior.

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="fieldA" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");

    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    // CRITICAL: Normal debounce waits, unlike debounce: false
    expect(submitHandler).not.toHaveBeenCalled();

    // Partial debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // STILL no submission
    expect(submitHandler).not.toHaveBeenCalled();

    // Complete debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // NOW submission happens
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });
});
```

---

## Confidence Score

**10/10** - Maximum confidence for one-pass implementation success

**Reasoning**:

- Adding tests to existing, well-understood test file
- Complete test templates provided
- All existing test patterns documented
- Specific assertion patterns specified
- No new infrastructure needed
- Previous implementation PRPs provide complete context
- Research documents provide comprehensive patterns
- Test file structure is well-established
- Primary validation is running existing tests (minimal risk)

**Risk Assessment**: Minimal risk. This task adds regression tests to an existing test file. The tests follow established patterns and validate behavior that already exists. The primary validation is ensuring existing tests still pass, which confirms no regression was introduced by the `debounce: false` feature.

---

## References

- [Previous PRP: P1.M2.T2.S1](../P1M2T2S1/PRP.md) - Immediate submission tests
- [Previous PRP: P1.M2.T1.S1](../P1M2T1S1/PRP.md) - InputConfig parameter contract
- [Previous PRP: P1.M2.T1.S2](../P1M2T1S2/PRP.md) - Conditional execution logic
- [Test File](../../../../packages/react/src/__tests__/autosave-validation.test.tsx) - Implementation target
- [Form Component](../../../../packages/react/src/components/Form.tsx#L299) - changeField function
- [Research: Existing Tests](./research/existing-debounce-tests-catalog.md) - Catalog of all debounce tests
- [Research: Vitest Timers](./research/vitest-timer-api-reference.md) - Timer API reference
- [Research: Form Implementation](./research/form-debounce-implementation-details.md) - Debounce implementation details
- [Vitest Timers](https://vitest.dev/guide/mocking/timers) - Official timer documentation
- [Lodash Debounce](https://lodash.com/docs/4.17.15#debounce) - Debounce behavior
