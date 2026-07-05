# PRP: Test Mixed Debounce Settings

**Work Item**: P1.M2.T2.S3 - Test mixed debounce settings
**Parent Task**: P1.M2.T2 - Add Tests for debounce: false
**Priority**: P1 (Critical)

---

## Goal

**Feature Goal**: Verify that different fields within the same form can have different debounce behaviors operating simultaneously and correctly.

**Deliverable**: Integration tests that validate per-field debounce override functionality when multiple fields with mixed debounce settings coexist in a single form.

**Success Definition**:

- Tests verify fields with `inputConfig={{ debounce: false }}` submit immediately
- Tests verify fields with form-level debounce wait for their debounce period
- Tests verify fields without debounce config use form-level default
- Tests verify rapid changes across multiple fields work correctly
- All existing tests continue to pass (no regression)

---

## Why

- **Feature Validation**: The per-field debounce override feature (inputConfig.debounce) needs comprehensive testing to validate it works correctly alongside normal debounced fields
- **Real-World Use Case**: Forms commonly contain both text fields (benefiting from debounce) and switches/toggles (requiring immediate submission). Users need confidence that mixing these behaviors works correctly
- **Integration Test**: This validates the complete pipeline from Field component through Form's changeField method to the autoSave execution logic
- **Regression Prevention**: Ensures future changes don't break the coexistence of different debounce behaviors
- **Documentation**: Tests serve as executable documentation of how to use mixed debounce settings

---

## What

Create integration tests for a form containing multiple fields with different debounce settings:

- **textField** with custom debounce (1000ms) via `inputConfig={{ debounce: 1000 }}`
- **switch** with immediate submission via `inputConfig={{ debounce: false }}`
- **anotherField** with no debounce config (uses form-level default)

**Test Scenarios**:

1. **Immediate field submits first**: Verify switch submits immediately while other fields wait
2. **Debounced field waits**: Verify textField waits for its 1000ms debounce before submitting
3. **Form-level default**: Verify anotherField uses form-level debounce when no override
4. **Coordinated submission**: Verify all field values are included in final submission
5. **Rapid mixed changes**: Verify rapid changes across mixed debounce fields work correctly
6. **No timer conflicts**: Verify immediate field doesn't interfere with debounced field timers

### Success Criteria

- [ ] Immediate field (switch) triggers submitHandler immediately after change
- [ ] Debounced field (textField) waits for 1000ms before triggering submitHandler
- [ ] Form-level default field (anotherField) uses form debounce setting
- [ ] Final submission includes all field values from all three fields
- [ ] Rapid changes across mixed fields work without errors
- [ ] All existing tests in autosave-validation.test.tsx still pass
- [ ] `pnpm test` runs successfully with all tests passing

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes. This PRP provides:

- Exact test file location with line number context
- Complete test templates with specific assertions for mixed debounce scenarios
- All existing test patterns to follow from the established test suite
- Specific debounce values and timing expectations
- Integration points with previous implementation PRPs
- Research documents explaining implementation details and testing patterns
- Known gotchas specific to mixed debounce testing

### Documentation & References

```yaml
# MUST READ - Critical implementation references

# CONTRACT FROM PREVIOUS SUBTASKS - MUST RESPECT
- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S1/PRP.md
  why: Defines the debounce: false immediate submission feature
  contract: Tests exist at lines 411-506 in autosave-validation.test.tsx
  critical: Our new tests must NOT interfere with existing immediate submission tests

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T2S2/PRP.md
  why: Defines normal debounce preserved regression tests
  contract: Tests exist at lines 530-770 in autosave-validation.test.tsx
  critical: Our new tests build upon these patterns, add after this block
  exact: Tests verify default 1000ms, form-level override, undefined inputConfig

# IMPLEMENTATION CONTRACT - INPUTCONFIG PARAMETER
- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S1/PRP.md
  why: Defines inputConfig parameter contract for changeField
  contract: inputConfig?: InputConfig, optional parameter passed from Field to Form
  critical: debounce?: number | false is the key property for this test

# IMPLEMENTATION CONTRACT - CONDITIONAL EXECUTION
- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S2/PRP.md
  why: Defines the conditional execution logic in Form's changeField
  contract: if (inputConfig?.debounce === false) { immediate } else { debounced }
  exact: Located at Form.tsx lines 313-320

# IMPLEMENTATION TARGET - TEST FILE
- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: This is where mixed debounce tests will be added
  pattern: Follow existing test structure with describe blocks
  gotcha: Must use same beforeEach/afterEach setup with vi.useFakeTimers({ shouldAdvanceTime: true })
  exact: File has existing tests at lines 94-770, add new describe block at end
  structure: Lines 1-79: Imports and setup, Lines 80-528: Existing tests, Lines 530-770: Normal debounce tests

# REFERENCE - FORM COMPONENT DEBOUNCE IMPLEMENTATION
- file: packages/react/src/components/Form.tsx
  why: Contains the debounce implementation being tested
  pattern: changeField function (lines 313-320) with conditional logic
  pattern: useEffect hook (lines 536-549) creating debounced function
  exact: Default debounce value is 1000ms (line 136)
  critical: The if/else determines which execution path to take based on inputConfig?.debounce

# REFERENCE - FIELD COMPONENT INPUTCONFIG PASSING
- file: packages/react/src/components/Field.tsx
  why: Shows how Field passes inputConfig to Form's changeField
  exact: Line 377 - changeField(name, parsedValue, inputConfig)
  pattern: inputConfig is merged from provider, form, and prop sources
  critical: Field-level inputConfig prop has highest priority

# REFERENCE - INPUTCONFIG TYPE DEFINITION
- file: packages/core/src/types/config.ts
  why: Contains the InputConfig interface with debounce property
  exact: Lines 45-78, debounce?: number | false at line 50
  critical: false means immediate submission, number means delay in milliseconds

# EXISTING TEST PATTERNS - IMMEDIATE VS DEBOUNCED
- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: Contains existing pattern for testing immediate vs debounced fields together
  exact: Lines 462-527 - "should contrast with normal debounce behavior"
  pattern: Shows how to test immediateField and debouncedField in same form
  critical: This is the closest existing pattern to our required test

# EXTERNAL RESEARCH - VITEST TIMER TESTING
- url: https://vitest.dev/guide/mocking/timers
  why: Official vitest timer documentation for fake timers
  critical: vi.useFakeTimers(), vi.advanceTimersByTimeAsync()
  section: Timer Mocks, Modern Fake Timers

- url: https://vitest.dev/api/vi
  why: Complete vi API reference for timer operations
  critical: vi.getTimerCount(), vi.runAllTimersAsync(), vi.useRealTimers()
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/
├── packages/
│   ├── core/
│   │   └── src/
│   │       └── types/
│   │           └── config.ts                    # InputConfig type definition (line 50: debounce?: number | false)
│   └── react/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Form.tsx                     # changeField (lines 313-320), useEffect (lines 536-549)
│       │   │   └── Field.tsx                    # Passes inputConfig to changeField (line 377)
│       │   └── __tests__/
│       │       └── autosave-validation.test.tsx  # TARGET: Add mixed debounce tests here
│       │           ├── Lines 1-79: Imports, helpers, test components
│       │           ├── Lines 80-153: Root cause tests
│       │           ├── Lines 155-208: Dependent field tests
│       │           ├── Lines 210-266: Async validation tests
│       │           ├── Lines 268-372: Cascading changes tests
│       │           ├── Lines 374-409: Validation errors tests
│       │           ├── Lines 411-528: Immediate submission tests (P1.M2.T2.S1)
│       │           ├── Lines 530-770: Normal debounce preserved tests (P1.M2.T2.S2)
│       │           └── [ADD HERE]: Mixed debounce settings tests (P1.M2.T2.S3)
├── plan/
│   └── 001_bbf464589edd/
│       └── bugfix/
│           └── 001_7b007b20a2ac/
│               ├── P1M2T1S1/PRP.md              # Previous: inputConfig parameter
│               ├── P1M2T1S2/PRP.md              # Previous: conditional execution
│               ├── P1M2T1S3/PRP.md              # Previous: Field integration
│               ├── P1M2T1S4/PRP.md              # Previous: FormProps type
│               ├── P1M2T2S1/PRP.md              # Previous: Immediate submission tests
│               ├── P1M2T2S2/PRP.md              # Previous: Normal debounce preserved tests
│               └── P1M2T2S3/
│                   ├── PRP.md                   # This file
│                   └── research/                # Research documents (optional)
└── package.json                                  # Test scripts
```

### Desired Codebase Tree (Files to Modify)

```bash
# Modified files:
packages/react/src/__tests__/autosave-validation.test.tsx  # ADD: Mixed debounce settings tests

# No new files created in this subtask
# All tests added to existing autosave-validation.test.tsx file
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: The existing test file uses vi.useFakeTimers({ shouldAdvanceTime: true })
// in beforeEach. This MUST be preserved for all new tests.

// GOTCHA: When testing mixed debounce, the key is understanding that:
// - Fields with inputConfig={{ debounce: false }} trigger executeAutoSaveRef.current?.() IMMEDIATELY
// - Fields with inputConfig={{ debounce: 1000 }} trigger debouncedSubmitRef.current?.() AFTER delay
// - Fields without inputConfig use the form-level debounce setting

// PATTERN: For testing mixed fields, change the immediate field FIRST and verify it submits
// immediately, then change debounced fields and verify they wait for debounce.

// CRITICAL: The submitHandler should be called TWICE in a mixed scenario:
// 1. Once immediately after changing the immediate field (switch)
// 2. Once after debounce completes for debounced fields
// The second submission should include ALL field values.

// GOTCHA: When advancing timers for the debounced field, the immediate field should NOT
// trigger another submission (it already submitted). Verify submitHandler call count.

// PATTERN: Follow the existing test structure from lines 462-527 ("should contrast with
// normal debounce behavior") as a template for mixed field testing.

// CRITICAL: Use TestSwitch component for the immediate field (switch type) to match
// real-world usage where switches typically need immediate submission.

// PATTERN: For comprehensive testing, verify:
// 1. Immediate field submits first (before debounce)
// 2. Debounced field waits for its debounce period
// 3. Final submission includes all field values
// 4. No duplicate submissions for any field

// GOTCHA: The key assertion pattern for mixed debounce:
// expect(submitHandler).toHaveBeenCalledTimes(1) // After immediate field change
// expect(submitHandler).toHaveBeenCalledTimes(2) // After debounced field debounce
// expect(submitHandler).toHaveBeenCalledWith(expect.objectContaining({
//   textField: "value",
//   switch: true,
//   anotherField: "value"
// })) // Final submission has all values

// CRITICAL: Do NOT modify existing tests. Only ADD new tests in a new describe block.
// The existing tests at lines 411-528 and lines 530-770 must remain untouched.

// PATTERN: Add a new describe block at the end of the file:
// describe("Mixed Debounce Settings (Integration)", () => { ... })
// This clearly communicates the purpose of these tests as integration testing.
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - this task adds integration tests to an existing test file.

**Test Structure**:

```typescript
describe("Mixed Debounce Settings (Integration)", () => {
  it("should submit immediately for debounce: false field while waiting for debounced fields", async () => {
    // Test implementation
  });

  it("should use custom field-level debounce when specified", async () => {
    // Test implementation
  });

  it("should use form-level debounce for fields without inputConfig override", async () => {
    // Test implementation
  });

  it("should include all field values in final submission after debounce", async () => {
    // Test implementation
  });

  it("should handle rapid changes across mixed debounce fields correctly", async () => {
    // Test implementation
  });

  it("should not cause timer conflicts between immediate and debounced fields", async () => {
    // Test implementation
  });
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY existing tests pass
  - RUN: pnpm test packages/react/src/__tests__/autosave-validation.test.tsx
  - VERIFY: All existing tests pass (lines 94-770)
  - VERIFY: No test failures related to debounce behavior
  - COUNT: Should have 13 tests (8 original + 2 immediate + 3 normal debounce)
  - DEPENDENCIES: None

Task 2: IDENTIFY location for new tests
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - FIND: End of file (after line 770)
  - DECIDE: Add new describe block "Mixed Debounce Settings (Integration)"
  - RECOMMENDATION: Place after "Normal Debounce Preserved (Regression)" block
  - DEPENDENCIES: Task 1

Task 3: WRITE test for immediate vs debounced field submission timing
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying immediate field submits first, debounced waits
  - IMPLEMENT: Render form with switch (debounce: false) and textField (debounce: 1000)
  - VERIFY: submitHandler called immediately after switch change
  - VERIFY: submitHandler NOT called again after textField change (until debounce)
  - VERIFY: submitHandler called second time after 1000ms debounce
  - PATTERN: Follow existing test structure from file
  - NAMING: "should submit immediately for debounce: false field while waiting for debounced fields"
  - DEPENDENCIES: Task 2

Task 4: WRITE test for custom field-level debounce
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying custom 1000ms debounce works for textField
  - IMPLEMENT: Field with inputConfig={{ debounce: 1000 }} should wait 1000ms
  - VERIFY: submitHandler NOT called before 1000ms
  - VERIFY: submitHandler called after 1100ms (1000ms + buffer)
  - PATTERN: Follow existing test structure
  - NAMING: "should use custom field-level debounce when specified"
  - DEPENDENCIES: Task 3

Task 5: WRITE test for form-level default debounce
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying field without inputConfig uses form-level debounce
  - IMPLEMENT: Form with debounce={500}, Field without inputConfig override
  - VERIFY: Field uses 500ms debounce from form prop
  - PATTERN: Follow existing test structure
  - NAMING: "should use form-level debounce for fields without inputConfig override"
  - DEPENDENCIES: Task 4

Task 6: WRITE test for all field values in final submission
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying final submission includes all field values
  - IMPLEMENT: Change all three fields, verify final submitHandler call includes all
  - VERIFY: expect.objectContaining({ textField, switch, anotherField })
  - PATTERN: Follow existing test structure
  - NAMING: "should include all field values in final submission after debounce"
  - DEPENDENCIES: Task 5

Task 7: WRITE test for rapid mixed changes
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying rapid changes across mixed debounce fields work
  - IMPLEMENT: Change all fields rapidly, verify correct submission behavior
  - VERIFY: Immediate field triggers immediate submission
  - VERIFY: Debounced fields coalesce changes
  - PATTERN: Follow existing test structure
  - NAMING: "should handle rapid changes across mixed debounce fields correctly"
  - DEPENDENCIES: Task 6

Task 8: WRITE test for no timer conflicts
  - FILE: packages/react/src/__tests__/autosave-validation.test.tsx
  - ADD: Test case verifying immediate field doesn't interfere with debounced timers
  - IMPLEMENT: Change immediate field, verify no pending timers for it
  - VERIFY: Changing debounced field doesn't re-trigger immediate field submission
  - PATTERN: Follow existing test structure
  - NAMING: "should not cause timer conflicts between immediate and debounced fields"
  - DEPENDENCIES: Task 7

Task 9: VERIFY all tests pass including new ones
  - RUN: pnpm test packages/react/src/__tests__/autosave-validation.test.tsx
  - EXPECT: All tests pass (13 existing + 6 new = 19 total)
  - VALIDATE: No regressions, new tests verify mixed debounce behavior
  - DEPENDENCIES: Task 8

Task 10: RUN full test suite
  - RUN: pnpm test
  - EXPECT: All tests in project pass
  - VALIDATE: No other test files affected by changes
  - DEPENDENCIES: Task 9
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Complete test template for mixed debounce settings

describe("Mixed Debounce Settings (Integration)", () => {
  // These tests verify that different fields in the same form can have
  // different debounce behaviors operating simultaneously and correctly.
  // This is crucial for forms containing both text fields (debounced)
  // and switches/toggles (immediate submission).

  beforeEach(() => {
    // Use the same setup from existing tests
    validationCalls = [];
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should submit immediately for debounce: false field while waiting for debounced fields", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
            switch: { type: "switch" },
            anotherField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          {/* Custom debounce: 1000ms */}
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
          {/* Immediate submission */}
          <Field name="switch" inputConfig={{ debounce: false }} />
          {/* Uses form-level default: 500ms */}
          <Field name="anotherField" />
        </Form>
      </FormalityProvider>,
    );

    // Wait for initial render
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    submitHandler.mockClear();

    // CRITICAL: Change switch FIRST (immediate field)
    const switchField = screen.getByTestId("switch");
    await act(async () => {
      await userEvent.click(switchField);
    });

    // Advance a small amount for async validation
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // CRITICAL ASSERTION: submitHandler should be called IMMEDIATELY (1st call)
    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        switch: true,
      }),
    );

    // Now change textField (debounced field)
    const textField = screen.getByTestId("textField");
    await act(async () => {
      await userEvent.type(textField, "test", { delay: null });
    });

    // CRITICAL: submitHandler should NOT be called yet (waiting for debounce)
    expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1

    // Advance less than textField's custom 1000ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // STILL no submission from textField
    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Advance past textField's 1000ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // NOW submitHandler should be called again (2nd call) with all values
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(2);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        textField: "test",
        switch: true,
        anotherField: "", // Empty default value
      }),
    );
  });

  it("should use custom field-level debounce when specified", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          {/* Custom debounce: 1000ms overrides form-level 500ms */}
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const textField = screen.getByTestId("textField");
    await act(async () => {
      await userEvent.type(textField, "test", { delay: null });
    });

    // No immediate submission
    expect(submitHandler).not.toHaveBeenCalled();

    // Advance less than custom 1000ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // STILL no submission (form-level 500ms is overridden by field-level 1000ms)
    expect(submitHandler).not.toHaveBeenCalled();

    // Advance past custom 1000ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // NOW submission happens
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        textField: "test",
      }),
    );
  });

  it("should use form-level debounce for fields without inputConfig override", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            anotherField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          {/* No inputConfig override - uses form-level 500ms */}
          <Field name="anotherField" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const anotherField = screen.getByTestId("anotherField");
    await act(async () => {
      await userEvent.type(anotherField, "test", { delay: null });
    });

    // No immediate submission
    expect(submitHandler).not.toHaveBeenCalled();

    // Advance past form-level 500ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // NOW submission happens
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should include all field values in final submission after debounce", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
            switch: { type: "switch" },
            anotherField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
          <Field name="switch" inputConfig={{ debounce: false }} />
          <Field name="anotherField" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    // Change all fields
    const textField = screen.getByTestId("textField");
    const switchField = screen.getByTestId("switch");
    const anotherField = screen.getByTestId("anotherField");

    // Change switch (immediate)
    await act(async () => {
      await userEvent.click(switchField);
    });

    // Immediate submission with switch value
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ switch: true }),
    );

    // Change textField and anotherField (both debounced)
    await act(async () => {
      await userEvent.type(textField, "hello", { delay: null });
      await userEvent.type(anotherField, "world", { delay: null });
    });

    // Wait for textField's longer debounce (1000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    // Final submission should include ALL field values
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(2);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        textField: "hello",
        switch: true,
        anotherField: "world",
      }),
    );
  });

  it("should handle rapid changes across mixed debounce fields correctly", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
            switch: { type: "switch" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
          <Field name="switch" inputConfig={{ debounce: false }} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const textField = screen.getByTestId("textField");
    const switchField = screen.getByTestId("switch");

    // Rapid changes across both fields
    await act(async () => {
      await userEvent.click(switchField); // Immediate submit
      await userEvent.type(textField, "a", { delay: null });
      await userEvent.click(switchField); // Another immediate submit
      await userEvent.type(textField, "b", { delay: null });
    });

    // Should have 2 immediate submissions from switch changes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(submitHandler).toHaveBeenCalledTimes(2);

    // Advance past textField debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    // Final submission with textField's last value
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(3);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        textField: "ab",
        switch: false, // Switch was toggled twice, back to false
      }),
    );
  });

  it("should not cause timer conflicts between immediate and debounced fields", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
            switch: { type: "switch" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
          <Field name="switch" inputConfig={{ debounce: false }} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const textField = screen.getByTestId("textField");
    const switchField = screen.getByTestId("switch");

    // Change switch first
    await act(async () => {
      await userEvent.click(switchField);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Immediate submission for switch
    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Verify no pending timers would trigger another immediate submission
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1

    // Change textField
    await act(async () => {
      await userEvent.type(textField, "test", { delay: null });
    });

    // Verify switch doesn't trigger another submission
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1

    // Complete textField debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // Now we get the second submission from textField
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(2);
    });
  });
});

// GOTCHA: Key differences from single-field tests
//
// Single-field tests:
// - Focus on one field's debounce behavior
// - Expect 1 submission total
//
// Mixed-field tests (this file):
// - Focus on interaction between fields with different debounce settings
// - Expect 2+ submissions (immediate field + debounced fields)
// - Must verify which field triggers which submission
// - Must verify final submission includes all field values
```

### Integration Points

```yaml
TEST_FILE:
  - file: packages/react/src/__tests__/autosave-validation.test.tsx
  - add: New describe block "Mixed Debounce Settings (Integration)"
  - location: After line 770 (after "Normal Debounce Preserved" block)
  - follow: Existing test structure and patterns
  - preserve: All existing tests (lines 94-770)

FORM_COMPONENT:
  - file: packages/react/src/components/Form.tsx
  - test: changeField function (lines 313-320)
  - verify: if/else branching based on inputConfig?.debounce === false

FIELD_COMPONENT:
  - file: packages/react/src/components/Field.tsx
  - test: Line 377 - changeField(name, parsedValue, inputConfig)
  - verify: inputConfig prop is correctly passed to Form

PREVIOUS_TESTS:
  - file: packages/react/src/__tests__/autosave-validation.test.tsx
  - respect: Tests at lines 411-528 (immediate submission)
  - respect: Tests at lines 530-770 (normal debounce preserved)
  - verify: All existing tests still pass without modification
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

# Expected: All 19 tests pass (13 existing + 6 new)
# Breakdown:
# - 8 original tests (lines 94-408)
# - 2 immediate submission tests (lines 411-506)
# - 3 normal debounce preserved tests (lines 530-770)
# - 6 mixed debounce settings tests (new)
#
# If new tests fail:
# 1. Check that field with inputConfig={{ debounce: false }} submits immediately
# 2. Check that field with inputConfig={{ debounce: 1000 }} waits 1000ms
# 3. Check that field without inputConfig uses form-level debounce
# 4. Verify submitHandler call count matches expected (2+ for mixed scenarios)
# 5. Check timer advancement matches debounce values + buffer

# Run all react package tests
pnpm test --run

# Expected: All tests pass
# Any failures indicate issues with new tests or regressions
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify the new describe block was added
grep -n "Mixed Debounce Settings (Integration)" packages/react/src/__tests__/autosave-validation.test.tsx

# Expected output should show the line number of new describe block

# Verify all new test cases exist
grep -n "should submit immediately for debounce: false field" packages/react/src/__tests__/autosave-validation.test.tsx
grep -n "should use custom field-level debounce when specified" packages/react/src/__tests__/autosave-validation.test.tsx
grep -n "should use form-level debounce for fields without inputConfig" packages/react/src/__tests__/autosave-validation.test.tsx
grep -n "should include all field values in final submission" packages/react/src/__tests__/autosave-validation.test.tsx
grep -n "should handle rapid changes across mixed debounce fields" packages/react/src/__tests__/autosave-validation.test.tsx
grep -n "should not cause timer conflicts between immediate and debounced fields" packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: All 6 test cases found

# Count total tests in file
grep -c "it(" packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: 19 (13 existing + 6 new)

# Run test with verbose output
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx --reporter=verbose

# Expected: All 19 tests pass with clear test names
```

### Level 4: Mixed Scenario Validation (Feature Testing)

```bash
# Verify specific mixed debounce scenarios
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx -t "should submit immediately for debounce: false field"

# Expected: Test passes, verifying immediate field submits before debounced fields

# Verify custom field-level debounce works
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx -t "should use custom field-level debounce when specified"

# Expected: Test passes, verifying field-level 1000ms debounce overrides form-level

# Verify all field values included in final submission
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx -t "should include all field values in final submission"

# Expected: Test passes, verifying final submitHandler call includes all fields

# Verify no interference with existing tests
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx -t "Immediate Submission"

# Expected: Both immediate submission tests still pass

# Verify normal debounce tests still pass
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx -t "Normal Debounce Preserved"

# Expected: All normal debounce preserved tests still pass

# Run full test suite to ensure no project-wide regressions
pnpm test

# Expected: All tests in entire project pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] New tests added to autosave-validation.test.tsx
- [ ] Tests follow existing patterns (beforeEach/afterEach, submitHandler mock)
- [ ] Tests use Field with different inputConfig debounce settings
- [ ] Tests verify immediate field submits without timer advancement
- [ ] Tests verify debounced fields wait for their debounce period
- [ ] Tests verify final submission includes all field values
- [ ] TypeScript compilation succeeds: `pnpm typecheck`
- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`

### Feature Validation

- [ ] Immediate field (debounce: false) triggers submitHandler immediately
- [ ] Custom debounce field (debounce: 1000) waits for 1000ms before submitting
- [ ] Form-level default field uses form debounce setting
- [ ] Final submission includes all field values from all fields
- [ ] Rapid changes across mixed fields work without errors
- [ ] No timer conflicts between immediate and debounced fields
- [ ] All existing tests (13 original) still pass

### Code Quality Validation

- [ ] Follows existing test patterns from the file
- [ ] Uses existing TestInput, TestSwitch components and testInputs config
- [ ] Properly uses act() for React state updates
- [ ] Uses userEvent for realistic user interaction
- [ ] Includes clear assertions with comments
- [ ] Tests are clearly named for documentation purposes
- [ ] New describe block clearly indicates "Integration" testing

### Documentation & Completeness

- [ ] Test names clearly describe mixed debounce behavior
- [ ] Tests include comments explaining key assertions
- [ ] Tests can be understood without additional context
- [ ] Tests serve as integration validation for the feature
- [ ] Tests document the three-tier priority: field > form > default

---

## Anti-Patterns to Avoid

- **Don't modify existing tests** - Only add new tests in a new describe block
- **Don't test only one field type** - Must test mixed scenarios with immediate + debounced
- **Don't forget to verify submitHandler call count** - Mixed scenarios should have 2+ submissions
- **Don't skip the final value check** - Must verify all field values are included
- **Don't use exact debounce values** - Always add buffer (e.g., 1100ms for 1000ms debounce)
- **Don't forget to use act()** - All timer operations must be wrapped in act()
- **Don't test in isolation only** - Must verify fields work together in same form
- **Don't assume form-level default** - Explicitly test field without inputConfig override
- **Don't ignore timer conflicts** - Verify immediate field doesn't cause extra submissions
- **Don't skip rapid change testing** - Real users type rapidly, must handle this

---

## Related Work Items

- **Previous**: P1.M2.T1.S1 - Add inputConfig parameter to changeField (COMPLETED)
- **Previous**: P1.M2.T1.S2 - Implement conditional execution logic (COMPLETED)
- **Previous**: P1.M2.T1.S3 - Update Field to pass inputConfig (COMPLETED)
- **Previous**: P1.M2.T1.S4 - Fix Form debounce prop type (COMPLETED)
- **Previous**: P1.M2.T2.S1 - Test immediate submission (COMPLETED)
- **Previous**: P1.M2.T2.S2 - Test normal debounce preserved (COMPLETED)
- **Current**: P1.M2.T2.S3 - Test mixed debounce settings (THIS ITEM)

---

## Complete Test Case Templates

Copy these templates and adapt as needed:

```typescript
describe("Mixed Debounce Settings (Integration)", () => {
  // These tests verify that different fields in the same form can have
  // different debounce behaviors operating simultaneously and correctly.

  beforeEach(() => {
    validationCalls = [];
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should submit immediately for debounce: false field while waiting for debounced fields", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
            switch: { type: "switch" },
            anotherField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
          <Field name="switch" inputConfig={{ debounce: false }} />
          <Field name="anotherField" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    // Change switch (immediate field)
    const switchField = screen.getByTestId("switch");
    await act(async () => {
      await userEvent.click(switchField);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // CRITICAL: Immediate submission
    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ switch: true }),
    );

    // Change textField (debounced field)
    const textField = screen.getByTestId("textField");
    await act(async () => {
      await userEvent.type(textField, "test", { delay: null });
    });

    // No submission yet
    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Advance past textField's 1000ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    // NOW second submission with all values
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(2);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        textField: "test",
        switch: true,
        anotherField: "",
      }),
    );
  });

  it("should use custom field-level debounce when specified", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const textField = screen.getByTestId("textField");
    await act(async () => {
      await userEvent.type(textField, "test", { delay: null });
    });

    expect(submitHandler).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // STILL no submission (field-level 1000ms overrides form-level 500ms)
    expect(submitHandler).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should use form-level debounce for fields without inputConfig override", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            anotherField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="anotherField" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const anotherField = screen.getByTestId("anotherField");
    await act(async () => {
      await userEvent.type(anotherField, "test", { delay: null });
    });

    expect(submitHandler).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should include all field values in final submission after debounce", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
            switch: { type: "switch" },
            anotherField: { type: "textField" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
          <Field name="switch" inputConfig={{ debounce: false }} />
          <Field name="anotherField" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const textField = screen.getByTestId("textField");
    const switchField = screen.getByTestId("switch");
    const anotherField = screen.getByTestId("anotherField");

    // Change switch (immediate)
    await act(async () => {
      await userEvent.click(switchField);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Change textField and anotherField (debounced)
    await act(async () => {
      await userEvent.type(textField, "hello", { delay: null });
      await userEvent.type(anotherField, "world", { delay: null });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(2);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        textField: "hello",
        switch: true,
        anotherField: "world",
      }),
    );
  });

  it("should handle rapid changes across mixed debounce fields correctly", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
            switch: { type: "switch" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
          <Field name="switch" inputConfig={{ debounce: false }} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const textField = screen.getByTestId("textField");
    const switchField = screen.getByTestId("switch");

    // Rapid changes across both fields
    await act(async () => {
      await userEvent.click(switchField);
      await userEvent.type(textField, "a", { delay: null });
      await userEvent.click(switchField);
      await userEvent.type(textField, "b", { delay: null });
    });

    // 2 immediate submissions from switch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(submitHandler).toHaveBeenCalledTimes(2);

    // Final submission with textField's last value
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(3);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        textField: "ab",
        switch: false,
      }),
    );
  });

  it("should not cause timer conflicts between immediate and debounced fields", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            textField: { type: "textField" },
            switch: { type: "switch" },
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="textField" inputConfig={{ debounce: 1000 }} />
          <Field name="switch" inputConfig={{ debounce: false }} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const textField = screen.getByTestId("textField");
    const switchField = screen.getByTestId("switch");

    // Change switch first
    await act(async () => {
      await userEvent.click(switchField);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Verify no extra timers for switch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Change textField
    await act(async () => {
      await userEvent.type(textField, "test", { delay: null });
    });

    // Switch doesn't trigger another submission
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Complete textField debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(2);
    });
  });
});
```

---

## Confidence Score

**10/10** - Maximum confidence for one-pass implementation success

**Reasoning**:

- Adding tests to existing, well-understood test file
- Complete test templates provided with all assertions
- All existing test patterns documented and referenced
- Specific assertion patterns specified for mixed scenarios
- No new infrastructure needed
- Previous implementation PRPs provide complete context
- Closest existing pattern (lines 462-527) serves as template
- Test file structure is well-established
- Primary validation is running existing tests (minimal risk)

**Risk Assessment**: Minimal risk. This task adds integration tests to an existing test file. The tests follow established patterns and validate behavior that already exists. The key complexity is understanding that mixed scenarios produce multiple submissions (immediate + debounced), which is clearly documented in the templates.

---

## References

- [Previous PRP: P1.M2.T2.S1](../P1M2T2S1/PRP.md) - Immediate submission tests
- [Previous PRP: P1.M2.T2.S2](../P1M2T2S2/PRP.md) - Normal debounce preserved tests
- [Previous PRP: P1.M2.T1.S1](../P1M2T1S1/PRP.md) - InputConfig parameter contract
- [Previous PRP: P1.M2.T1.S2](../P1M2T1S2/PRP.md) - Conditional execution logic
- [Test File](../../../../packages/react/src/__tests__/autosave-validation.test.tsx) - Implementation target
- [Form Component](../../../../packages/react/src/components/Form.tsx#L313) - changeField function
- [Field Component](../../../../packages/react/src/components/Field.tsx#L377) - inputConfig passing
- [Vitest Timers](https://vitest.dev/guide/mocking/timers) - Official timer documentation
