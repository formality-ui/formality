# PRP: Test Immediate Submission

**Work Item**: P1.M2.T2.S1 - Test immediate submission
**Parent Task**: P1.M2.T2 - Add Tests for debounce: false
**Priority**: P1 (Critical)

---

## Goal

**Feature Goal**: Create a test case that verifies immediate submission behavior when `inputConfig.debounce: false` is configured on a field with auto-save enabled.

**Deliverable**: A new test case in the existing `packages/react/src/__tests__/autosave-validation.test.tsx` file that verifies `onSubmit` is called immediately without delay when `debounce: false` is set via `inputConfig`.

**Success Definition**:
- Test case added to existing autosave-validation.test.tsx file
- Test verifies `submitHandler` is called immediately after field value change
- Test uses `vi.advanceTimersByTimeAsync(0)` to confirm no pending debounce timers
- No fake timers needed for immediate submission verification
- Test follows existing patterns from the autosave test file
- Test passes when run with `pnpm test`

---

## Why

- **Validation of Feature**: The previous subtasks (P1.M2.T1.S1-S4) implemented the runtime logic and type system for `debounce: false`. This test validates that the feature works as specified.
- **Prevent Regression**: Without explicit tests, future changes could break the immediate submission behavior without detection.
- **Documentation**: Tests serve as executable documentation showing how `inputConfig.debounce: false` behaves.
- **Integration Verification**: Confirms the integration between Field component (passing inputConfig), Form component (receiving inputConfig), and the conditional execution logic (checking `debounce === false`).

---

## What

Create a test case that verifies immediate submission when `inputConfig.debounce: false` is set on a field.

**Test Scenario**:
1. Form with `autoSave` enabled
2. Field configured with `inputConfig={{ debounce: false }}`
3. Mock `onSubmit` handler
4. Change field value
5. Verify `onSubmit` is called immediately without waiting for debounce timer
6. Use `vi.advanceTimersByTimeAsync(0)` to confirm no pending debounce

### Success Criteria

- [ ] Test case added to `packages/react/src/__tests__/autosave-validation.test.tsx`
- [ ] Test follows existing patterns (beforeEach/afterEach, submitHandler mock, fake timers setup)
- [ ] Test verifies `submitHandler` is called immediately after field change
- [ ] Test uses `vi.advanceTimersByTimeAsync(0)` to confirm no pending timers
- [ ] Test passes when run with `pnpm test`
- [ ] Test is clearly named to describe the immediate submission behavior

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes. This PRP provides:
- Exact file path and location for the new test
- Complete working test template from existing tests
- All required imports and setup patterns
- Specific assertion patterns for immediate execution
- Validation commands for running tests
- References to previous implementation PRPs
- No prior knowledge required

### Documentation & References

```yaml
# MUST READ - Critical implementation references

# CONTRACT FROM PREVIOUS SUBTASKS
- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S1/PRP.md
  why: Defines the inputConfig parameter contract with debounce type
  contract: changeField accepts inputConfig?: InputConfig with debounce?: number | false
  critical: Field component passes inputConfig to Form's changeField

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S2/PRP.md
  why: Defines the conditional execution logic
  contract: if (inputConfig?.debounce === false) { submitImmediate(); }
  critical: This is the code path being tested

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S3/PRP.md
  why: Field component integration
  contract: Field passes inputConfig to changeField
  critical: Field is the component where inputConfig is specified

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S4/PRP.md
  why: FormProps type definition updated
  contract: debounce?: number | false is now type-safe
  critical: Type system supports the feature being tested

# IMPLEMENTATION TARGET - TEST FILE
- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: This is where the new test case will be added
  pattern: Follow existing test structure with describe blocks, beforeEach/afterEach
  gotcha: Must use vi.useFakeTimers({ shouldAdvanceTime: true }) in beforeEach
  exact: "describe('AutoSave Validation Coordination', () => {"

# REFERENCE - FORM COMPONENT
- file: packages/react/src/components/Form.tsx
  why: Contains the implementation being tested
  pattern: changeField function (lines 299-321)
  exact: "if (inputConfig?.debounce === false) { submitImmediate(); }"
  critical: This conditional is what the test verifies

# RESEARCH DOCUMENTATION
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S1/research/autosave-test-patterns.md
  why: Complete patterns from existing autosave tests
  section: Timer Setup and Teardown, User Interaction Simulation, Assertion Patterns

- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S1/research/form-debounce-implementation.md
  why: Detailed analysis of how immediate submission works
  section: Code Paths Summary, Testing Implications

- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S1/research/vitest-fake-timers-research.md
  why: Vitest patterns for testing immediate execution
  section: Testing Immediate Execution (No Delay)

# EXTERNAL RESEARCH - Vitest Testing
- url: https://vitest.dev/api/#vi-advancetimersbytimeasync
  why: vi.advanceTimersByTimeAsync for verifying no pending timers
  critical: Use vi.advanceTimersByTimeAsync(0) to confirm immediate execution

- url: https://vitest.dev/api/#vi-gettimercount
  why: Verify no timers are pending after immediate submission
  critical: expect(vi.getTimerCount()).toBe(0)

- url: https://testing-library.com/docs/react-testing-library/api/act
  why: React Testing Library act() for wrapping state updates
  critical: User interactions must be wrapped in act()

- url: https://testing-library.com/docs/user-event/convenience
  why: userEvent API for simulating realistic user input
  critical: userEvent.type with delay: null for rapid typing
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/
├── packages/
│   ├── core/
│   │   └── src/
│   │       └── types/
│   │           └── config.ts                    # InputConfig with debounce?: number | false (line 53)
│   └── react/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Form.tsx                     # changeField with inputConfig (lines 299-321)
│       │   │   ├── Field.tsx                    # Passes inputConfig to changeField
│       │   │   └── FormalityProvider.tsx        # Provider for test inputs
│       │   └── __tests__/
│       │       ├── autosave-validation.test.tsx  # TARGET: Add test here
│       │       └── Form.test.tsx                # Form component tests
├── plan/
│   └── 001_bbf464589edd/
│       └── bugfix/
│           └── 001_7b007b20a2ac/
│               ├── P1M2T1S1/PRP.md              # Previous: inputConfig parameter
│               ├── P1M2T1S2/PRP.md              # Previous: conditional execution
│               ├── P1M2T1S3/PRP.md              # Previous: Field integration
│               ├── P1M2T1S4/PRP.md              # Previous: FormProps type
│               └── P1M2T2S1/
│                   ├── PRP.md                   # This file
│                   └── research/
│                       ├── autosave-test-patterns.md
│                       ├── debounce-test-patterns.md
│                       ├── form-debounce-implementation.md
│                       └── vitest-fake-timers-research.md
└── package.json                                  # Test scripts
```

### Desired Codebase Tree (Files to Modify)

```bash
# Modified files:
packages/react/src/__tests__/autosave-validation.test.tsx  # ADD: Test for immediate submission

# No new files created in this subtask
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Even though immediate submission doesn't need fake timers technically,
// the existing test file uses vi.useFakeTimers({ shouldAdvanceTime: true })
// in beforeEach. This MUST be preserved for consistency with other tests.

// CRITICAL: To verify immediate execution, check submitHandler was called
// BEFORE advancing any timers. This is the key assertion pattern.

// GOTCHA: Use vi.advanceTimersByTimeAsync(0) to confirm no pending debounce timers.
// This advances timers by 0ms, which flushes any microtasks but doesn't trigger
// actual debounce delays.

// PATTERN: The test should verify submitHandler was called with expect(submitHandler).toHaveBeenCalledTimes(1)
// immediately after the user interaction, WITHOUT calling vi.advanceTimersByTimeAsync() first.

// GOTCHA: When using inputConfig on a Field, the prop name is 'inputConfig' not 'debounce'.
// The Field component accepts an inputConfig prop that contains the debounce setting.
// Example: <Field name="fieldA" inputConfig={{ debounce: false }} />

// CRITICAL: The Field component passes inputConfig to changeField internally.
// The test doesn't need to manually call changeField - just use the Field component
// with the inputConfig prop.

// PATTERN: Follow existing test structure:
// 1. Add a new describe block or add to existing "AutoSave Validation Coordination"
// 2. Use beforeEach/afterEach from the existing test file
// 3. Use the same TestInput component and testInputs config
// 4. Use the same submitHandler = vi.fn() pattern

// GOTCHA: The test file has multiple describe blocks. Consider adding a new describe
// block specifically for debounce: false tests, or add to an existing block.
// Recommendation: Add a new describe block "Immediate Submission (debounce: false)"

// CRITICAL: The test must use the FormalityProvider with testInputs that include
// the TestInput component. This is already defined in the existing test file.

// PATTERN: For immediate submission testing, the key is to verify that:
// 1. submitHandler is called immediately after user interaction
// 2. No timer advancement is needed
// 3. vi.advanceTimersByTimeAsync(0) confirms no pending timers
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - this task adds a test case to an existing test file.

**Test Case Structure**:
```typescript
describe("Immediate Submission (debounce: false)", () => {
  it("should call submitHandler immediately when inputConfig.debounce is false", async () => {
    // Test implementation
  });
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY existing test file structure
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - VERIFY: File exists and has describe blocks
  - VERIFY: beforeEach/afterEach with fake timers setup
  - VERIFY: TestInput component and testInputs config exist
  - DEPENDENCIES: None

Task 2: IDENTIFY location for new test
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - FIND: Existing describe blocks structure
  - DECIDE: Add new describe block or add to existing
  - RECOMMENDATION: Create new describe block "Immediate Submission (debounce: false)"
  - DEPENDENCIES: Task 1

Task 3: WRITE test case for immediate submission
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: New describe block "Immediate Submission (debounce: false)"
  - IMPLEMENT: Test case that:
    1. Renders Form with autoSave enabled
    2. Configures Field with inputConfig={{ debounce: false }}
    3. Mocks submitHandler with vi.fn()
    4. Simulates user input with userEvent.type()
    5. Verifies submitHandler called immediately (no timer advancement)
    6. Uses vi.advanceTimersByTimeAsync(0) to confirm no pending timers
  - PATTERN: Follow existing test structure from file
  - NAMING: "should call submitHandler immediately when inputConfig.debounce is false"
  - DEPENDENCIES: Task 2

Task 4: VERIFY test compiles with no TypeScript errors
  - RUN: pnpm typecheck
  - EXPECT: No type errors
  - VALIDATE: All imports are correct
  - DEPENDENCIES: Task 3

Task 5: RUN the test to verify it passes
  - RUN: pnpm test packages/react/src/__tests__/autosave-validation.test.tsx
  - EXPECT: Test passes
  - VALIDATE: submitHandler is called immediately
  - DEPENDENCIES: Task 4

Task 6: VERIFY all existing tests still pass
  - RUN: pnpm test
  - EXPECT: All tests pass, including the new one
  - VALIDATE: No regressions introduced
  - DEPENDENCIES: Task 5
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Complete test case for immediate submission

describe("Immediate Submission (debounce: false)", () => {
  it("should call submitHandler immediately when inputConfig.debounce is false", async () => {
    // Render Form with autoSave and Field with debounce: false
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            fieldA: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500} // Form has normal debounce, but field overrides
        >
          <Field name="fieldA" inputConfig={{ debounce: false }} />
        </Form>
      </FormalityProvider>,
    );

    // Wait for initial render
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Clear any initial submit calls
    submitHandler.mockClear();

    // Change field value
    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    // CRITICAL ASSERTION: submitHandler should be called IMMEDIATELY
    // WITHOUT advancing any timers
    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldA: "test",
      }),
    );

    // Verify no pending timers
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1 call
  });
});

// PATTERN: Compare with normal debounce behavior (for documentation)

describe("Immediate Submission (debounce: false)", () => {
  it("should NOT wait for debounce when inputConfig.debounce is false", async () => {
    // This test demonstrates the difference between:
    // 1. Normal debounce behavior (wait 500ms)
    // 2. Immediate submission (no wait)

    // Test with debounce: false
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            immediateField: { type: "textField" },
            debouncedField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="immediateField" inputConfig={{ debounce: false }} />
          <Field name="debouncedField" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    // Change immediateField
    const immediateField = screen.getByTestId("immediateField");
    await act(async () => {
      await userEvent.type(immediateField, "now", { delay: null });
    });

    // Should submit IMMEDIATELY
    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Change debouncedField
    const debouncedField = screen.getByTestId("debouncedField");
    await act(async () => {
      await userEvent.type(debouncedField, "later", { delay: null });
    });

    // Should NOT submit yet (waiting for debounce)
    expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1

    // Advance past debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // Now should submit again
    expect(submitHandler).toHaveBeenCalledTimes(2);
  });
});

// GOTCHA: The inputConfig prop on Field
// <Field name="fieldName" inputConfig={{ debounce: false }} />
// NOT: <Field name="fieldName" debounce={false} />

// CRITICAL: The test file already has all the setup needed:
// - TestInput component with data-testid
// - testInputs config for FormalityProvider
// - beforeEach with vi.useFakeTimers
// - afterEach with vi.useRealTimers
// - submitHandler mock

// PATTERN: Add the new describe block after existing blocks
// or inside the main "AutoSave Validation Coordination" describe
```

### Integration Points

```yaml
TEST_FILE:
  - file: packages/react/src/__tests__/autosave-validation.test.tsx
  - add: New describe block for immediate submission tests
  - follow: Existing test structure and patterns

FORM_COMPONENT:
  - file: packages/react/src/components/Form.tsx
  - test: changeField function (lines 299-321)
  - verify: if (inputConfig?.debounce === false) path works

FIELD_COMPONENT:
  - file: packages/react/src/components/Field.tsx
  - test: Passes inputConfig prop to changeField
  - verify: inputConfig prop works correctly

INPUTCONFIG_TYPE:
  - file: packages/core/src/types/config.ts
  - reference: InputConfig.debounce?: number | false
  - test: Field accepts inputConfig with debounce: false
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type checking - Run after adding the test
pnpm typecheck

# Expected: Zero type errors
# Common errors to fix:
# - Missing imports (should already be in file)
# - Type mismatches with inputConfig prop
# - Incorrect usage of Field component

# Linting (if project uses ESLint)
pnpm lint

# Expected: Zero linting errors
# Formatting
pnpm format
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the specific test file
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: All tests pass, including the new one
# If the new test fails:
# 1. Check that submitHandler is being called
# 2. Verify the Field component has inputConfig={{ debounce: false }}
# 3. Check that Form has autoSave enabled
# 4. Verify the implementation from P1.M2.T1.S2 is complete

# Run all react package tests
pnpm test --run

# Expected: All tests pass
# Any failures indicate issues with the test or implementation
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify the test case was added to the file
grep -n "should call submitHandler immediately" packages/react/src/__tests__/autosave-validation.test.tsx

# Expected output should show the new test line number

# Verify the describe block was added
grep -n "Immediate Submission (debounce: false)" packages/react/src/__tests__/autosave-validation.test.tsx

# Expected output should show the new describe block

# Verify inputConfig usage in the test
grep -A 5 "inputConfig.*debounce.*false" packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: Should show the Field component with inputConfig prop

# Run test with verbose output to see test execution
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx --reporter=verbose

# Expected: Test passes and shows assertions
```

### Level 4: Manual Verification (Feature Testing)

```bash
# Note: This is a test-only task, so manual testing is not required.
# The test itself validates the feature implementation.

# However, you can verify the test behavior by:

# 1. Temporarily break the implementation to see the test fail
# 2. Fix the implementation to see the test pass
# 3. This confirms the test is actually testing the right thing

# Example: Comment out the conditional in Form.tsx
# if (inputConfig?.debounce === false) { submitImmediate(); }
# The test should fail because submitHandler won't be called immediately

# Restore the implementation and test should pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test case added to autosave-validation.test.tsx
- [ ] Test follows existing patterns (beforeEach/afterEach, submitHandler mock)
- [ ] Test uses Field with inputConfig={{ debounce: false }}
- [ ] Test verifies submitHandler called immediately
- [ ] Test uses vi.advanceTimersByTimeAsync(0) to confirm no pending timers
- [ ] TypeScript compilation succeeds: `pnpm typecheck`
- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`

### Feature Validation

- [ ] Test validates `inputConfig.debounce: false` causes immediate submission
- [ ] Test shows contrast with normal debounce behavior
- [ ] Test is clearly named and documented
- [ ] Test assertions are specific and meaningful
- [ ] Test integrates with existing test structure

### Code Quality Validation

- [ ] Follows existing test patterns from the file
- [ ] Uses existing TestInput component and testInputs config
- [ ] Properly uses act() for React state updates
- [ ] Uses userEvent for realistic user interaction
- [ ] Includes clear assertions with comments

### Documentation & Completeness

- [ ] Test name clearly describes what is being tested
- [ ] Test includes comments explaining key assertions
- [ ] Test can be understood without additional context
- [ ] Test serves as documentation for the feature

---

## Anti-Patterns to Avoid

- **Don't create a new test file** - Add to existing autosave-validation.test.tsx
- **Don't remove vi.useFakeTimers()** - Keep existing beforeEach/afterEach setup
- **Don't use waitFor for immediate assertions** - Immediate means no waiting needed
- **Don't forget to use inputConfig prop** - Field takes inputConfig, not debounce directly
- **Don't skip the comparison test** - Show contrast with normal debounce behavior
- **Don't use real timers** - Fake timers are already set up, use them
- **Don't add async validators** - Keep test focused on debounce behavior
- **Don't test multiple scenarios in one test** - One test per scenario
- **Don't skip clearing submitHandler** - Use mockClear() to isolate test behavior
- **Don't forget to advance timers for initial render** - Clear initial state before testing

---

## Related Work Items

- **Previous**: P1.M2.T1.S1 - Add inputConfig parameter to changeField (COMPLETED)
- **Previous**: P1.M2.T1.S2 - Implement conditional execution logic (COMPLETED in parallel)
- **Previous**: P1.M2.T1.S3 - Update Field to pass inputConfig (COMPLETED in parallel)
- **Previous**: P1.M2.T1.S4 - Fix Form debounce prop type (COMPLETED in parallel)
- **Next**: P1.M2.T2.S2 - Test normal debounce preserved (PLANNED)
- **Next**: P1.M2.T2.S3 - Test mixed debounce settings (PLANNED)

---

## Complete Test Case Template

Copy this template and adapt as needed:

```typescript
describe("Immediate Submission (debounce: false)", () => {
  it("should call submitHandler immediately when inputConfig.debounce is false", async () => {
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
          <Field name="fieldA" inputConfig={{ debounce: false }} />
        </Form>
      </FormalityProvider>,
    );

    // Wait for initial render
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Clear any initial state
    submitHandler.mockClear();

    // Change field value
    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "test", { delay: null });
    });

    // CRITICAL: submitHandler should be called IMMEDIATELY
    // WITHOUT advancing any debounce timers
    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldA: "test",
      }),
    );

    // Verify no pending timers
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1 call
  });

  it("should contrast with normal debounce behavior", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            immediateField: { type: "textField" },
            debouncedField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="immediateField" inputConfig={{ debounce: false }} />
          <Field name="debouncedField" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    // Change immediateField
    const immediateField = screen.getByTestId("immediateField");
    await act(async () => {
      await userEvent.type(immediateField, "now", { delay: null });
    });

    // Should submit IMMEDIATELY
    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Change debouncedField
    const debouncedField = screen.getByTestId("debouncedField");
    await act(async () => {
      await userEvent.type(debouncedField, "later", { delay: null });
    });

    // Should NOT submit yet (waiting for debounce)
    expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1

    // Advance past debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // Now should submit again
    expect(submitHandler).toHaveBeenCalledTimes(2);
  });
});
```

---

## Confidence Score

**10/10** - Maximum confidence for one-pass implementation success

**Reasoning**:
- Single test case addition to existing test file
- Complete working template provided
- All existing patterns documented and referenced
- Exact assertion patterns specified
- No new files or infrastructure needed
- Previous implementation PRPs provide complete context
- Research documents provide comprehensive patterns
- Test file structure is well-established

**Risk Assessment**: Minimal risk. This is adding a test case to an existing, well-structured test file. The test follows established patterns and validates functionality that has already been implemented in previous subtasks.

---

## References

- [Previous PRP: P1.M2.T1.S1](../P1M2T1S1/PRP.md) - InputConfig parameter contract
- [Previous PRP: P1.M2.T1.S2](../P1M2T1S2/PRP.md) - Conditional execution logic
- [Previous PRP: P1.M2.T1.S3](../P1M2T1S3/PRP.md) - Field passes inputConfig
- [Previous PRP: P1.M2.T1.S4](../P1M2T1S4/PRP.md) - FormProps type definition
- [Test File](../../../../packages/react/src/__tests__/autosave-validation.test.tsx) - Implementation target
- [Form Component](../../../../packages/react/src/components/Form.tsx#L299) - changeField function
- [Research: Autosave Test Patterns](./research/autosave-test-patterns.md) - Existing test patterns
- [Research: Form Debounce Implementation](./research/form-debounce-implementation.md) - Implementation details
- [Research: Vitest Fake Timers](./research/vitest-fake-timers-research.md) - Timer testing patterns
- [Vitest Timer API](https://vitest.dev/api/#vi-advancetimersbytimeasync) - vi.advanceTimersByTimeAsync
- [React Testing Library act()](https://testing-library.com/docs/react-testing-library/api/act) - act() wrapper
