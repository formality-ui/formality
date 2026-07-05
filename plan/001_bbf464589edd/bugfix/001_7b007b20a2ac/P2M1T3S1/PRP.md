# PRP: Test Disabled from JSX Prop

**Work Item**: P2.M1.T3.S1 - Test disabled from JSX prop
**Parent Task**: P2.M1.T3 - Add Tests for Disabled Property
**Parent Milestone**: P2.M1 - Disabled Property in Field States
**Priority**: P2 (Major Issue)
**Story Points**: 2

---

## Goal

**Feature Goal**: Create comprehensive integration tests that verify JSX `disabled` prop has the highest priority for disabled state, overriding ALL other sources (field config and conditions) simultaneously.

**Deliverable**:

1. Integration tests in `Field.test.tsx` for JSX disabled prop priority
2. Test cases covering all combinations of conflicting disabled sources
3. Test cases for dynamic prop changes while all sources are active
4. DOM verification tests using `@testing-library/jest-dom` matchers
5. User interaction tests verifying disabled fields cannot be interacted with

**Success Definition**:

- JSX `disabled={true}` prop forces field disabled regardless of config (`disabled: false`) and conditions (`disabled: false`)
- JSX `disabled={false}` prop forces field enabled regardless of config (`disabled: true`) and conditions (`disabled: true`)
- Dynamic prop changes immediately update field state while all other sources remain active
- Input element has correct `disabled` attribute in DOM
- User cannot interact with disabled fields (typing, clicking, etc.)
- All tests pass: `pnpm test --filter @formality-ui/react Field.test.tsx`

---

## User Persona (if applicable)

**Target User**: Developers using Formality UI form library

**Use Case**: Developers need to override disabled state at render time using JSX props, regardless of form configuration or conditional logic.

**User Journey**:

1. Developer has field with `disabled: false` in config
2. Developer has conditions that would set `disabled: false`
3. Developer renders `<Field name="field" disabled={true} />` to force disable
4. Field is rendered as disabled, JSX prop overrides all other sources
5. Developer changes prop to `disabled={false}`
6. Field becomes enabled immediately

**Pain Points Addressed**:

- Developers need runtime control over disabled state
- JSX props should provide absolute override capability
- Priority must be predictable and documented
- Existing tests don't verify ALL sources active simultaneously

---

## Why

- **Contract Definition**: JSX prop is documented as having highest priority but lacks comprehensive integration testing
- **Test Coverage Gap**: `useFieldDisabledState.test.tsx` tests hook in isolation, `Field.test.tsx` only tests 1-2 sources at a time
- **Integration Testing**: Hook tests don't catch integration bugs between hook and Field component
- **DOM Verification**: Hook tests don't verify actual DOM state or user-facing behavior
- **Real-World Scenario**: Conflicting disabled sources from all layers is a valid use case (e.g., force disable a field that would normally be enabled)
- **Previous Work**: P2.M1.T1.S1-S3 implemented useFieldDisabledState hook with priority logic, P2.M1.T2.S1 verified types, now we need integration tests

---

## What

Create comprehensive integration tests for JSX disabled prop priority in the Field component.

### Current State

**Existing Tests (Insufficient)**:

1. `useFieldDisabledState.test.tsx` (hook tests):
   - Tests JSX prop over config (lines 47-60)
   - Tests JSX prop false over config true (lines 62-74)
   - **Limitation**: Uses `renderHook`, doesn't test Field component integration
   - **Limitation**: Never has ALL sources active simultaneously

2. `Field.test.tsx` (component tests):
   - Tests disabled prop over condition result (lines 429-450)
   - Tests disabled prop to force disable (lines 452-467)
   - **Limitation**: Only tests 1-2 sources at a time
   - **Limitation**: No test for JSX prop vs config + conditions simultaneously

### Test Scenarios to Add

**Scenario 1: JSX disabled={true} overrides ALL sources with disabled={false}**

```typescript
// Given: Field with JSX disabled={true}, config disabled: false, conditions disabled: false
const config = {
  field: {
    type: "textField",
    disabled: false,  // Config says enabled
    conditions: [
      { when: "other", is: "value", disabled: false }  // Condition says enabled
    ],
  },
};

// When: Render field with disabled={true} prop
<Field name="field" disabled={true} />

// Then: Field should be disabled (JSX wins)
expect(screen.getByTestId("field")).toBeDisabled();
```

**Scenario 2: JSX disabled={false} overrides ALL sources with disabled={true}**

```typescript
// Given: Field with JSX disabled={false}, config disabled: true, conditions disabled: true
const config = {
  field: {
    type: "textField",
    disabled: true,  // Config says disabled
    conditions: [
      { when: "other", is: "value", disabled: true }  // Condition says disabled
    ],
  },
};

// When: Render field with disabled={false} prop
<Field name="field" disabled={false} />

// Then: Field should be enabled (JSX wins)
expect(screen.getByTestId("field")).not.toBeDisabled();
```

**Scenario 3: Dynamic prop change while all sources active**

```typescript
// Given: Field with JSX disabled={true}, all other sources disabled={false}
const { rerender } = render(
  <Form config={config}>
    <Field name="field" disabled={true} />
  </Form>
);

// Initially: Field is disabled
expect(screen.getByTestId("field")).toBeDisabled();

// When: Change JSX prop to disabled={false}
rerender(
  <Form config={config}>
    <Field name="field" disabled={false} />
  </Form>
);

// Then: Field becomes enabled immediately
expect(screen.getByTestId("field")).not.toBeDisabled();
```

**Scenario 4: User cannot interact with disabled field**

```typescript
// Given: Field is disabled via JSX prop
const user = userEvent.setup();
render(
  <Form config={config}>
    <Field name="field" disabled={true} />
  </Form>
);

// When: User tries to type in disabled field
await user.type(screen.getByTestId("field"), "test");

// Then: Value should not change (field remains empty or original value)
expect(screen.getByTestId("field")).toHaveValue("");
```

### Success Criteria

- [ ] Test for JSX `disabled={true}` overriding config `disabled: false` + conditions `disabled: false`
- [ ] Test for JSX `disabled={false}` overriding config `disabled: true` + conditions `disabled: true`
- [ ] Test for dynamic prop changes while all sources active
- [ ] Test for user interaction verification (cannot type in disabled field)
- [ ] Test verifies DOM `disabled` attribute is correct
- [ ] All tests use Field component (not hook in isolation)
- [ ] All tests use `@testing-library/react` patterns
- [ ] All tests pass: `pnpm test --filter @formality-ui/react Field.test.tsx`

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:

- Exact file location for tests (`Field.test.tsx`)
- Complete test patterns from existing tests
- All dependencies on previous work items (P2.M1.T1, P2.M1.T2)
- Specific test scenarios with code examples
- Validation commands specific to this project
- Known gotchas and anti-patterns to avoid

### Documentation & References

```yaml
# MUST READ - Test patterns and existing tests

# TARGET FILE - Add tests here
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Main test file for Field component - add JSX disabled prop priority tests
  exact: Add new describe block after "disabled prop override" (after line 467)
  pattern: Follow existing test structure with describe/it blocks
  gotcha: Use `data-testid` for element selection, not CSS selectors

# EXISTING TESTS TO REFERENCE - Similar patterns
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Existing disabled prop tests (lines 429-467) - follow this pattern
  exact: Lines 429-467 ("disabled prop override" describe block)
  pattern: Render Field with config, verify disabled state with toBeDisabled()
  critical: Tests JSX prop over conditions, but not config + conditions simultaneously

# HOOK TESTS - For reference (do NOT copy - wrong approach)
- file: /home/dustin/projects/formality/packages/react/src/__tests__/useFieldDisabledState.test.tsx
  why: Shows disabled priority logic - use for understanding, NOT for patterns
  exact: Lines 47-87 (JSX prop priority tests)
  pattern: Uses renderHook - DO NOT USE THIS for integration tests
  critical: Integration tests must use Field component, not renderHook

# FIELD COMPONENT - Understanding disabled resolution
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows how disabled prop flows through Field component
  exact: Lines 265-278 (isDisabled resolution logic)
  pattern: Priority order: prop > config > condition > group > false
  critical: JSX prop (disabledProp) is checked FIRST, returns immediately if defined

# PREVIOUS WORK - Type definitions
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T2S1/PRP.md
  why: Previous PRP that verified FieldState.disabled property exists
  contract: Assumes FieldState and FieldStateInput have disabled property
  critical: Types now support disabled property after P2.M1.T2.S1

# PREVIOUS WORK - Hook implementation
- file: /home/dustin/projects/formality/packages/react/src/hooks/useFieldDisabledState.ts
  why: Hook that implements disabled priority logic
  exact: Lines 177-196 (final priority resolution)
  pattern: useMemo with dependency array for performance
  critical: Priority is JSX prop > config > conditions > group > false

# TEST SETUP - Configuration
- file: /home/dustin/projects/formality/packages/react/src/__tests__/setup.ts
  why: Test setup file with @testing-library/jest-dom configuration
  action: NO CHANGE - just for reference
  critical: Automatically imports custom matchers like toBeDisabled()

# TEST INPUT PATTERN - Reusable test components
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: TestInput component pattern to follow
  exact: Lines 12-39 (TestInput component definition)
  pattern: forwardRef with disabled prop, data-testid attribute
  critical: Must use forwardRef for Field components

# TESTING LIBRARY DOCUMENTATION
- url: https://testing-library.com/docs/react-testing-library/intro/
  why: React Testing Library best practices
  section: Queries (getByTestId, etc.)

- url: https://github.com/testing-library/jest-dom#tobedisabled
  why: Custom matcher for disabled state
  section: toBeDisabled() / not.toBeDisabled()

- url: https://testing-library.com/docs/user-event/intro
  why: User interaction simulation for testing disabled fields
  section: userEvent.type() for keyboard input simulation

# RESEARCH DOCUMENTATION
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T3S1/research/test_coverage_analysis.md
  why: Analysis of existing test coverage gaps
  section: Test Coverage Gap

- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T3S1/research/testing_patterns.md
  why: React testing patterns for disabled state
  section: Testing Best Practices
```

### Current Codebase tree (react package tests)

```bash
packages/react/src/
├── __tests__/
│   ├── setup.ts                    # Test configuration (jsdom, jest-dom)
│   ├── Field.test.tsx              # ← TARGET: Add JSX disabled prop tests here
│   ├── useFieldDisabledState.test.tsx  # Hook tests (for reference, not modification)
│   ├── Form.test.tsx               # Form component tests
│   ├── FieldGroup.test.tsx         # FieldGroup tests
│   └── [other test files]
├── components/
│   ├── Field.tsx                   # Field component with disabled resolution (lines 265-278)
│   └── [other components]
└── hooks/
    └── useFieldDisabledState.ts    # Hook implementing priority logic
```

### Desired Codebase tree with tests to be added

```bash
packages/react/src/__tests__/
├── Field.test.tsx                  # ← MODIFY: Add new test describe block
│   ├── [existing tests]
│   └── describe("JSX disabled prop highest priority - ALL sources active")  # ← ADD THIS
│       ├── it("should disable field when JSX={true} overrides config={false} + conditions={false}")
│       ├── it("should enable field when JSX={false} overrides config={true} + conditions={true}")
│       ├── it("should update disabled state when JSX prop changes while all sources active")
│       └── it("should prevent user interaction when JSX disabled={true}")
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Use Field component, NOT renderHook
// renderHook tests the hook in isolation
// We need integration tests with full Field component rendering
// WRONG: renderHook(() => useFieldDisabledState(...))
// RIGHT: render(<Form><Field name="field" disabled={true} /></Form>)

// CRITICAL: Test components MUST use forwardRef
// Field components require forwardRef for react-hook-form integration
// Pattern: forwardRef<HTMLInputElement, Props>(({ value, onChange, disabled, ... }, ref) => ...)

// CRITICAL: Use data-testid for element selection
// Pattern: <input data-testid={name} />
// Query: screen.getByTestId("field")
// DO NOT use CSS selectors like screen.getByRole("input")

// GOTCHA: Condition evaluation depends on field values
// Condition { when: "other", is: "value", disabled: true } only matches when other field = "value"
// Must include other field in config and set its value via record prop

// GOTCHA: JSX prop shorthand disabled={true} vs disabled
// <Field disabled /> is equivalent to <Field disabled={true} />
// Both should work in tests

// GOTCHA: toBeDisabled() checks actual DOM attribute
// @testing-library/jest-dom toBeDisabled() checks <input disabled> attribute
// This is the correct way to test disabled state

// GOTCHA: User interaction on disabled fields
// userEvent.type() on disabled field will NOT change value
// Test verifies that typing has no effect (value stays empty)

// GOTCHA: Condition evaluation order
// Conditions are evaluated AFTER prop and config resolution
// This means JSX prop wins even if conditions would disable

// CRITICAL: Priority order in Field.tsx (lines 265-278)
// 1. JSX prop (disabledProp) - checked FIRST
// 2. Field config (fieldConfig.disabled)
// 3. Conditions (conditionResult.disabled)
// 4. Group state (groupContext.state.isDisabled)
// 5. Default: false

// GOTCHA: Test file location
// Add tests to Field.test.tsx, NOT useFieldDisabledState.test.tsx
// We need Field component integration tests

// GOTCHA: Test structure
// Follow existing describe/it structure in Field.test.tsx
// Add new describe block after "disabled prop override" (line 467)

// CRITICAL: Run specific test file during development
// Command: pnpm test --filter @formality-ui/react Field.test.tsx
// This runs only Field tests, faster feedback during development

// GOTCHA: Rerender for dynamic prop changes
// Use rerender() from render() return value to test prop changes
// Pattern: const { rerender } = render(...); rerender(<NewProps />);
```

---

## Implementation Blueprint

### Data models and structure

**No new data models needed** - this PRP is purely testing existing functionality.

**Test Data Structure**:

```typescript
// Form config with all disabled sources
const config: FormFieldsConfig = {
  // Other field for condition evaluation
  otherField: { type: "textField" },

  // Target field with conflicting disabled sources
  field: {
    type: "textField",
    disabled: boolean,  // Config disabled
    conditions: [
      {
        when: "otherField",
        is: "value",
        disabled: boolean,  // Condition disabled
      },
    ],
  },
};

// JSX prop (highest priority)
<Field name="field" disabled={boolean} />
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing Field.test.tsx test file
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - READ: Lines 1-610 (entire file)
  - UNDERSTAND: Test structure, TestInput component, test patterns
  - IDENTIFY: Where to add new tests (after line 467, in new describe block)
  - PATTERN: Follow existing describe/it structure
  - OUTPUT: Understanding of test file structure

Task 2: ANALYZE existing disabled prop tests
  - READ: Lines 429-467 ("disabled prop override" describe block)
  - UNDERSTAND: How JSX prop is tested against conditions
  - IDENTIFY: Gap - config + conditions never tested together with JSX prop
  - PATTERN: render(<Form><Field disabled /></Form>); expect(screen.getByTestId()).toBeDisabled();
  - OUTPUT: Pattern to follow for new tests

Task 3: ADD new describe block for JSX disabled prop priority
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - LOCATION: After line 467 (after "disabled prop override" describe block)
  - ADD: describe("JSX disabled prop highest priority - ALL sources active", () => { ... })
  - PATTERN: Follow existing describe block structure
  - PLACEMENT: Before "render prop" describe block (line 469)

Task 4: IMPLEMENT test - JSX disabled={true} overrides ALL sources
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should disable field when JSX={true} overrides config={false} + conditions={false}", () => { ... })
  - CONFIG: field with disabled: false, conditions with disabled: false
  - RECORD: Set otherField to match condition
  - JSX: <Field name="field" disabled={true} />
  - VERIFY: expect(screen.getByTestId("field")).toBeDisabled()
  - PATTERN: |
    it("should disable field when JSX={true} overrides config={false} + conditions={false}", () => {
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: false,  // Config says enabled
          conditions: [
            { when: "otherField", is: "match", disabled: false },  // Condition says enabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" disabled={true} />  {/* JSX forces disabled */}
          </Form>
        </FormalityProvider>,
      );

      // JSX prop (true) should override config (false) + conditions (false)
      expect(screen.getByTestId("field")).toBeDisabled();
    });

Task 5: IMPLEMENT test - JSX disabled={false} overrides ALL sources
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should enable field when JSX={false} overrides config={true} + conditions={true}", () => { ... })
  - CONFIG: field with disabled: true, conditions with disabled: true
  - RECORD: Set otherField to match condition
  - JSX: <Field name="field" disabled={false} />
  - VERIFY: expect(screen.getByTestId("field")).not.toBeDisabled()
  - PATTERN: Similar to Task 4, but inverted boolean values

Task 6: IMPLEMENT test - Dynamic prop changes while all sources active
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should update disabled state when JSX prop changes while all sources active", () => { ... })
  - USE: const { rerender } = render(...)
  - INITIAL: disabled={true}, verify toBeDisabled()
  - RERENDER: disabled={false}, verify not.toBeDisabled()
  - VERIFY: State changes immediately on prop change
  - PATTERN: |
    it("should update disabled state when JSX prop changes while all sources active", () => {
      const config: FormFieldsConfig = {
        field: {
          type: "textField",
          disabled: false,
          conditions: [{ when: "other", is: "x", disabled: false }],
        },
        other: { type: "textField" },
      };

      const { rerender } = render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ other: "x" }}>
            <Field name="other" />
            <Field name="field" disabled={true} />
          </Form>
        </FormalityProvider>,
      );

      // Initially disabled by JSX prop
      expect(screen.getByTestId("field")).toBeDisabled();

      // Change JSX prop to false
      rerender(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ other: "x" }}>
            <Field name="other" />
            <Field name="field" disabled={false} />
          </Form>
        </FormalityProvider>,
      );

      // Should now be enabled
      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

Task 7: IMPLEMENT test - User cannot interact with disabled field
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should prevent user interaction when JSX disabled={true}", async () => { ... })
  - USE: const user = userEvent.setup()
  - RENDER: Field with disabled={true}
  - ACTION: await user.type(screen.getByTestId("field"), "test")
  - VERIFY: Value stays empty (typing has no effect)
  - PATTERN: |
    it("should prevent user interaction when JSX disabled={true}", async () => {
      const user = userEvent.setup();
      const config: FormFieldsConfig = {
        field: {
          type: "textField",
          disabled: false,  // Config says enabled
          conditions: [{ when: "other", is: "x", disabled: false }],
        },
        other: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ other: "x" }}>
            <Field name="other" />
            <Field name="field" disabled={true} />  {/* JSX forces disabled */}
          </Form>
        </FormalityProvider>,
      );

      // Try to type in disabled field
      await user.type(screen.getByTestId("field"), "test");

      // Value should not change (field remains empty)
      expect(screen.getByTestId("field")).toHaveValue("");
    });

Task 8: RUN tests to verify implementation
  - COMMAND: pnpm test --filter @formality-ui/react Field.test.tsx
  - VERIFY: All new tests pass
  - VERIFY: All existing tests still pass (no regressions)
  - EXPECTED: Zero failures
  - IF_FAILURES: Read output and fix implementation

Task 9: VERIFY test coverage (optional but recommended)
  - COMMAND: pnpm test --filter @formality-ui/react --coverage
  - CHECK: Field.test.tsx coverage for disabled prop scenarios
  - VERIFY: All new code paths are covered
  - NOTE: Coverage should be high since we're testing existing functionality
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Test structure for Field component tests
// ============================================================================

describe("JSX disabled prop highest priority - ALL sources active", () => {
  // Test 1: JSX true overrides all false sources
  // Test 2: JSX false overrides all true sources
  // Test 3: Dynamic prop changes
  // Test 4: User interaction verification
});

// ============================================================================
// PATTERN: Config with conflicting disabled sources
// ============================================================================

const config: FormFieldsConfig = {
  // Other field for condition evaluation
  otherField: { type: "textField" },

  // Target field with ALL sources active
  field: {
    type: "textField",
    disabled: boolean,  // Config level
    conditions: [
      {
        when: "otherField",
        is: "value",
        disabled: boolean,  // Condition level
      },
    ],
  },
};

// ============================================================================
// PATTERN: Render Field with all sources active
// ============================================================================

render(
  <FormalityProvider inputs={testInputs}>
    <Form config={config} record={{ otherField: "value" }}>
      <Field name="otherField" />  {/* For condition evaluation */}
      <Field name="field" disabled={boolean} />  {/* JSX prop (highest priority) */}
    </Form>
  </FormalityProvider>,
);

// ============================================================================
// PATTERN: Verify disabled state with DOM matchers
// ============================================================================

// Field is disabled
expect(screen.getByTestId("field")).toBeDisabled();

// Field is enabled
expect(screen.getByTestId("field")).not.toBeDisabled();

// ============================================================================
// PATTERN: Dynamic prop changes with rerender
// ============================================================================

const { rerender } = render(
  <Form config={config}>
    <Field name="field" disabled={true} />
  </Form>
);

// Verify initial state
expect(screen.getByTestId("field")).toBeDisabled();

// Rerender with new prop
rerender(
  <Form config={config}>
    <Field name="field" disabled={false} />
  </Form>
);

// Verify updated state
expect(screen.getByTestId("field")).not.toBeDisabled();

// ============================================================================
// PATTERN: User interaction testing
// ============================================================================

const user = userEvent.setup();

// Try to type in disabled field
await user.type(screen.getByTestId("field"), "test");

// Verify value didn't change
expect(screen.getByTestId("field")).toHaveValue("");

// ============================================================================
// CRITICAL: Test ALL sources active simultaneously
// ============================================================================

// Key difference from existing tests:
// OLD: Only JSX vs config, or JSX vs conditions (2 sources)
// NEW: JSX vs config vs conditions (3 sources simultaneously)

// Example: JSX disabled={true} overrides:
// - Config: disabled: false
// - Conditions: disabled: false (when condition matches)
// Result: Field is disabled (JSX wins)

// Example: JSX disabled={false} overrides:
// - Config: disabled: true
// - Conditions: disabled: true (when condition matches)
// Result: Field is enabled (JSX wins)

// ============================================================================
// GOTCHA: Condition must match for it to be active
// ============================================================================

// Condition: { when: "otherField", is: "match", disabled: true }
// For condition to be active, otherField must equal "match"
// Use record prop to set initial value: record={{ otherField: "match" }}

render(
  <Form config={config} record={{ otherField: "match" }}>
    <Field name="otherField" />
    <Field name="field" disabled={boolean} />
  </Form>
);

// ============================================================================
// PATTERN: Test naming convention
// ============================================================================

// Good: "should disable field when JSX={true} overrides config={false} + conditions={false}"
// - Describes what happens
// - Specifies input values
// - Clear expected outcome

// Avoid: "should work" or "test disabled"
// - Too vague
// - Doesn't specify scenario

// ============================================================================
// CRITICAL: Use Field component, NOT renderHook
// ============================================================================

// WRONG: Tests hook in isolation
const { result } = renderHook(() => useFieldDisabledState({
  fieldName: "field",
  disabledProp: true,
  fieldConfigDisabled: false,
}));

// RIGHT: Tests Field component integration
render(
  <Form config={config}>
    <Field name="field" disabled={true} />
  </Form>
);
```

### Integration Points

```yaml
TEST_FILE:
  - modify: packages/react/src/__tests__/Field.test.tsx
    file: Field.test.tsx
    change: Add new describe block after line 467
    placement: After "disabled prop override" describe block
    structure: |
      describe("JSX disabled prop highest priority - ALL sources active", () => {
        // Test 1: JSX true overrides all false sources
        // Test 2: JSX false overrides all true sources
        // Test 3: Dynamic prop changes
        // Test 4: User interaction verification
      });

DEPENDENCIES:
  - no_code_changes: This PRP only adds tests, no code modifications
  - requires: P2.M1.T1.S1-S3 (useFieldDisabledState implementation)
  - requires: P2.M1.T2.S1 (FieldState.disabled type verification)
  - assumes: Field component disabled resolution works (lines 265-278 of Field.tsx)

TESTING:
  - framework: vitest + @testing-library/react
  - matchers: @testing-library/jest-dom (toBeDisabled, not.toBeDisabled)
  - user_events: @testing-library/user-event (userEvent.setup, userEvent.type)
  - environment: jsdom (configured in vitest.config.ts)

VALIDATION:
  - command: pnpm test --filter @formality-ui/react Field.test.tsx
  - expected: All tests pass, including new tests
  - coverage: Should increase coverage for disabled prop scenarios
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after adding tests - fix before proceeding
pnpm typecheck                    # Type checking
pnpm lint --fix                   # Lint and auto-fix

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific test file with new tests
pnpm test --filter @formality-ui/react Field.test.tsx -v

# Test specific describe block
pnpm test --filter @formality-ui/react Field.test.tsx -t "JSX disabled prop highest priority"

# Run all react tests to ensure no regressions
pnpm test --filter @formality-ui/react -v

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test disabled prop priority in browser-like environment
pnpm test --filter @formality-ui/react Field.test.tsx --reporter=verbose

# Verify DOM state is correct
pnpm test --filter @formality-ui/react Field.test.tsx -t "should disable field when JSX={true}"

# Verify user interaction is prevented
pnpm test --filter @formality-ui/react Field.test.tsx -t "should prevent user interaction"

# Expected: All integration tests pass, DOM state verified, user interaction blocked.
```

### Level 4: Coverage Validation

```bash
# Check test coverage for disabled scenarios
pnpm test --filter @formality-ui/react --coverage

# Verify Field.test.tsx covers disabled prop scenarios
# Look for high coverage percentage on Field component disabled logic

# Expected: Coverage increases or stays high for disabled state code paths.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] New tests added to Field.test.tsx (not useFieldDisabledState.test.tsx)
- [ ] Tests use Field component (not renderHook)
- [ ] All tests pass: `pnpm test --filter @formality-ui/react Field.test.tsx`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] No regressions in existing tests

### Feature Validation

- [ ] Test for JSX `disabled={true}` overriding config `disabled: false` + conditions `disabled: false`
- [ ] Test for JSX `disabled={false}` overriding config `disabled: true` + conditions `disabled: true`
- [ ] Test for dynamic prop changes while all sources active
- [ ] Test for user interaction verification (cannot type in disabled field)
- [ ] DOM `disabled` attribute is correct in all scenarios
- [ ] User cannot interact with disabled fields

### Code Quality Validation

- [ ] Tests follow existing Field.test.tsx patterns
- [ ] Tests use `data-testid` for element selection
- [ ] Tests use `@testing-library/jest-dom` matchers (toBeDisabled)
- [ ] Tests use `@testing-library/user-event` for interaction tests
- [ ] Test names are descriptive and specific
- [ ] Tests are isolated (no dependencies between tests)

### Documentation & Deployment

- [ ] Test names clearly describe scenario and expected outcome
- [ ] Comments explain why JSX prop should win (highest priority)
- [ ] No additional deployment needed (tests only)

---

## Anti-Patterns to Avoid

- ❌ **Don't use renderHook** - Integration tests must use Field component, not hook in isolation
- ❌ **Don't test only 2 sources** - Test ALL sources active simultaneously (JSX + config + conditions)
- ❌ **Don't use CSS selectors** - Use `data-testid` for reliable element selection
- ❌ **Don't forget user interaction tests** - Verify users can't interact with disabled fields
- ❌ **Don't skip dynamic prop changes** - Test that prop changes update state while other sources active
- ❌ **Don't modify useFieldDisabledState.test.tsx** - Add tests to Field.test.tsx for integration testing
- ❌ **Don't ignore condition matching** - Ensure condition values match record values for conditions to be active
- ❌ **Don't use vague test names** - Be specific: "should disable when JSX={true} overrides config={false} + conditions={false}"
- ❌ **Don't test hook behavior** - Test Field component behavior and DOM state
- ❌ **Don't forget to verify DOM** - Use `toBeDisabled()` to verify actual DOM attribute

---

## Related Work Items

- **Previous**: P2.M1.T1.S1 - Create useFieldDisabledState hook (implements priority logic)
- **Previous**: P2.M1.T1.S2 - Integrate disabled into useConditions
- **Previous**: P2.M1.T1.S3 - Handle circular dependency with two-pass evaluation
- **Previous**: P2.M1.T2.S1 - Verify FieldStateInput type (ensures types support disabled property)
- **Current**: P2.M1.T3.S1 - Test disabled from JSX prop (THIS ITEM)
- **Future**: P2.M1.T3.S2 - Test disabled from config
- **Future**: P2.M1.T3.S3 - Test disabled from conditions

---

## Contract Dependencies

### From P2.M1.T1.S1-S3 (Hook Implementation)

The P2.M1.T1 PRPs specify that:

1. `useFieldDisabledState` hook implements priority logic: prop > config > conditions > group > false
2. Hook uses two-pass evaluation to prevent circular dependencies
3. Hook returns boolean for disabled state

**This PRP's Contract**:

1. Tests verify JSX prop has highest priority at Field component level
2. Tests verify ALL sources active simultaneously (not just 1-2 sources)
3. Tests verify DOM state and user interaction
4. Tests verify dynamic prop changes work correctly

**Integration Point**: Hook implementation is tested in isolation (useFieldDisabledState.test.tsx). This PRP adds Field component integration tests to verify end-to-end behavior.

### From P2.M1.T2.S1 (Type Verification)

The P2.M1.T2.S1 PRP specifies that:

1. `FieldState.disabled?: boolean` property exists
2. `FieldStateInput.disabled?: boolean` property exists
3. Type consistency across all field state types

**This PRP's Contract**:

1. Tests verify disabled state flows correctly through Field component
2. Tests verify DOM reflects disabled state accurately
3. No type errors when using disabled prop in tests

**Integration Point**: Types support disabled property, so tests can use JSX `disabled={boolean}` prop without type errors.

---

## Confidence Score

**10/10** - Maximum confidence for one-pass implementation success

**Reasoning**:

- Well-scoped testing task (no code changes, only tests)
- Clear file location and exact placement for new tests
- Comprehensive test patterns from existing tests to follow
- Specific test scenarios with code examples provided
- All dependencies (hook implementation, type verification) complete
- Clear validation commands and expected outcomes
- Known gotchas documented with solutions
- Anti-patterns identified to avoid

**No Deduction**: This is a straightforward testing task with clear patterns to follow, comprehensive examples, and minimal risk.

---

## References

### Internal Documentation

- [Test Coverage Analysis](./research/test_coverage_analysis.md) - Analysis of existing test coverage gaps
- [Testing Patterns Research](./research/testing_patterns.md) - React testing patterns for disabled state
- [P2.M1.T1.S1 PRP](../P2M1T1S1/PRP.md) - useFieldDisabledState hook implementation
- [P2.M1.T2.S1 PRP](../P2M1T2S1/PRP.md) - FieldState type verification
- [Field Component Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - Existing Field tests
- [useFieldDisabledState Hook Tests](../../../../packages/react/src/__tests__/useFieldDisabledState.test.tsx) - Hook tests (reference only)
- [Field Component](../../../../packages/react/src/components/Field.tsx) - Lines 265-278 (disabled resolution)

### External Documentation

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing patterns
- [jest-dom toBeDisabled](https://github.com/testing-library/jest-dom#tobedisabled) - Disabled state matcher
- [user-event](https://testing-library.com/docs/user-event/intro) - User interaction simulation

### Example Code

- [Existing Disabled Prop Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - Lines 429-467 (similar patterns)
- [useFieldDisabledState Hook](../../../../packages/react/src/hooks/useFieldDisabledState.ts) - Lines 177-196 (priority logic)
