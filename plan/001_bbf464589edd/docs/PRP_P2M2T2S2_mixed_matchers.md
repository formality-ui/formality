# PRP: Test Mixed Matchers

**Work Item**: P2.M2.T2.S2 - Test mixed matchers
**Parent Task**: P2.M2.T2 - Add Tests for Multi-Field isDisabled
**Parent Milestone**: P2.M2 - Multi-Field isDisabled Conditions
**Priority**: P2 (Major Issue)
**Story Points**: 2

---

## Goal

**Feature Goal**: Add comprehensive tests for mixed matcher scenarios where value matchers (is, truthy) and field state matchers (isDisabled, isValid) are used together in the same object `when` with top-level `isDisabled`.

**Deliverable**:

1. Core package unit tests for mixed matcher scenarios in conditions.test.ts
2. Tests that verify only fields with field state matchers are checked for top-level `isDisabled`
3. Tests that verify value matcher fields are excluded from top-level `isDisabled` check
4. React integration tests for mixed matcher scenarios

**Success Definition**:

- Tests verify the filtering logic from `isStateFieldMatcher()` works correctly
- Tests confirm value matcher fields are NOT checked for top-level `isDisabled`
- Tests confirm field state matcher fields ARE checked for top-level `isDisabled`
- Tests verify field-level matchers AND top-level `isDisabled` both must pass
- All existing tests continue to pass
- Test coverage is complete for mixed matcher scenarios

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Enable conditional field disabled state based on a combination of field values (value matchers) and field states (state matchers).

**User Journey**:

1. Developer defines a condition with mixed matchers: some fields use value matchers like `{ is: "value" }`, some use state matchers like `{ isDisabled: true }`
2. When the top-level `isDisabled` check runs, only fields with state matchers should be evaluated
3. Fields with value matchers should be excluded from the top-level `isDisabled` check
4. The condition matches only when both field-level matchers pass AND top-level `isDisabled` check passes

**Pain Points Addressed**:

- Without these tests, the filtering logic between value and state matchers is not verified
- Developers need confidence that mixed matcher scenarios work correctly
- Edge cases where value and state matchers are mixed need explicit test coverage

---

## Why

- **Test Coverage**: Existing test (lines 769-804) tests ONE specific mixed matcher scenario with a contradiction. Need comprehensive tests for:
  1. Mixed matchers that successfully match
  2. Filtering behavior (value matcher fields excluded from isDisabled check)
  3. Multiple fields with different matcher types
- **Validation**: Need to verify the `isStateFieldMatcher()` type guard filtering works correctly
- **Regression Prevention**: Tests ensure future changes don't break mixed matcher functionality
- **Clarification**: The work item contract mentions `{ field3: { isDirty: false } }` but `isDirty` is NOT a valid field state matcher. Tests should use only valid matchers (`is`, `truthy`, `isValid`, `isDisabled`)

---

## What

Add tests for mixed matcher scenarios using both value matchers and field state matchers.

### Current State

**Existing Tests** (conditions.test.ts):

- Lines 594-863: Pure value matchers with top-level isDisabled
- Lines 769-804: ONE mixed matcher test (field1 uses `is`, field2 uses `isDisabled: false`) - tests contradiction scenario
- No tests for successful mixed matcher matches
- No tests explicitly verifying filtering behavior

**Gap**: No comprehensive tests for mixed matcher scenarios where:

- Multiple fields use different matcher types
- The condition successfully matches (not just contradiction scenarios)
- The filtering logic is explicitly verified

### Desired State

**New Tests**:

1. Mixed matchers with successful match: field1 with value matcher, field2 with state matcher, top-level `isDisabled: true` - should match when field2 is disabled
2. Filtering verification: value matcher fields excluded from top-level `isDisabled` check
3. Three-field mixed matcher scenario: field1 with `is`, field2 with `isDisabled`, field3 with `isValid`
4. React integration test with actual mixed matcher conditions

### Success Criteria

- [ ] Mixed matcher test: value matcher field excluded from isDisabled check
- [ ] Mixed matcher test: state matcher field included in isDisabled check
- [ ] Mixed matcher test: successful match with mixed matchers
- [ ] Mixed matcher test: three-field scenario with multiple matcher types
- [ ] React integration test: mixed matchers work in actual form
- [ ] All existing tests pass without modification

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:

- Exact test file locations and patterns to follow
- Complete test scenarios with expected results
- Detailed explanation of filtering logic
- All dependencies and constraints documented
- Known gotchas and anti-patterns

### Documentation & References

```yaml
# MUST READ - Test patterns to follow

# CORE PACKAGE TESTS - Add mixed matcher tests here
- file: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  why: Main condition evaluation test file - add new tests here
  exact: Lines 769-804 (existing mixed matcher test)
  pattern: Use describe blocks, expect() for assertions, fieldStates for state matchers
  critical: New tests should test SUCCESSFUL matches, not just contradictions

# PREVIOUS PRP - Understanding the implementation being tested
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M2T2S1/PRP.md
  why: Previous PRP that tests pure field state matchers
  contract: Pure field state matcher tests provide baseline patterns
  critical: This PRP builds on those patterns for mixed matchers
  notes: P2.M2.T2.S1 tests pure field state matchers, this PRP tests mixed

# IMPLEMENTATION BEING TESTED
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Contains the evaluateConditionMatch and isStateFieldMatcher functions
  exact: Lines 123-141 (isStateFieldMatcher type guard)
  exact: Lines 187-198 (filtering logic for top-level isDisabled)
  pattern: Type guard checks for isValid/isDisabled properties
  critical: Tests must verify the filtering works correctly

# TYPE DEFINITIONS - Valid field matchers
- file: /home/dustin/projects/formality/packages/core/src/types/conditions.ts
  why: FieldMatcher interface defines valid matchers
  exact: Lines 12-27 (FieldMatcher interface)
  pattern: is, truthy, isTruthy = value matchers; isValid, isDisabled = state matchers
  critical: isDirty is NOT a valid field matcher (only exists in FieldStateInput)

# FIELD STATE INPUT
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: FieldStateInput defines available field state properties
  exact: Lines 20-30 (FieldStateInput interface)
  pattern: value, isTouched, isDirty, isValidating, error, invalid, disabled
  critical: isDirty exists in FieldStateInput but NOT as a FieldMatcher

# REACT INTEGRATION TESTS
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: React component integration tests
  exact: Lines 869-911 (multi-field when conditions test)
  pattern: Use renderHook, render, screen, waitFor for React testing
  critical: Integration tests should verify actual DOM behavior
```

### Current Codebase tree (core package tests)

```bash
packages/core/src/__tests__/
├── conditions.test.ts              # ← TARGET: Add mixed matcher tests
│   ├── Lines 594-863: Existing "object when with top-level isDisabled" tests
│   ├── Lines 769-804: Existing mixed matcher test (contradiction scenario)
│   └── [ADD NEW TESTS HERE]
```

### Current Codebase tree (react package tests)

```bash
packages/react/src/__tests__/
├── Field.test.tsx                  # ← TARGET: Add integration tests
│   ├── Lines 869-911: Multi-field when conditions test
│   └── [ADD NEW INTEGRATION TESTS HERE]
```

### Desired Codebase tree with tests to be added

```bash
packages/core/src/__tests__/
├── conditions.test.ts              # ← MODIFY: Add mixed matcher tests
│   ├── [EXISTING TESTS UNCHANGED]
│   └── ADD NEW DESCRIBE BLOCK (after line 863):
│       └── describe("object when with top-level isDisabled and mixed matchers", () => {
│           ├── it("should only check fields with state matchers for top-level isDisabled")
│           ├── it("should exclude value matcher fields from top-level isDisabled check")
│           ├── it("should match when mixed matchers pass and state fields meet isDisabled")
│           ├── it("should work with three fields using different matcher types")
│           └── it("should require both field-level and top-level matchers to pass")

packages/react/src/__tests__/
├── Field.test.tsx                  # ← MODIFY: Add integration tests
│   ├── [EXISTING TESTS UNCHANGED]
│   └── ADD NEW DESCRIBE BLOCK (after line 911):
│       └── describe("mixed matcher conditions", () => {
│           ├── it("should work with value and state matchers combined")
│           └── it("should only check state matcher fields for disabled condition")
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Value matcher vs Field state matcher distinction

// VALUE MATCHERS (check the field's value):
// { field1: { is: "a" } } - checks if field1.value === "a"
// { field1: { truthy: true } } - checks if field1.value is truthy
// { field1: { isTruthy: false } } - checks if field1.value is falsy

// FIELD STATE MATCHERS (check the field's state):
// { field1: { isDisabled: true } } - checks if field1.disabled === true
// { field1: { isValid: true } } - checks if field1.invalid === false

// GOTCHA: isDirty is NOT a valid field matcher
// isDirty exists in FieldStateInput but NOT in FieldMatcher interface
// The work item contract mentions { field3: { isDirty: false } } but this is INVALID
// Valid field state matchers are ONLY: isValid, isDisabled

// CRITICAL: Filtering behavior for top-level isDisabled (lines 187-198 of evaluate.ts)
// When isDisabled is specified at top level, the code filters to only check fields with state matchers
// This is the KEY behavior that mixed matcher tests must verify

// Example:
// {
//   when: {
//     field1: { is: "a" },           // Value matcher - EXCLUDED from isDisabled check
//     field2: { isDisabled: true }   // State matcher - INCLUDED in isDisabled check
//   },
//   isDisabled: true,
//   disabled: true
// }
//
// Evaluation order:
// 1. Check field1 value matches "a" (line 147)
// 2. Check field2.isDisabled matches field2.disabled (line 147)
// 3. Filter to fields with state matchers: [field2] only (line 189-190)
// 4. Check if field2.disabled === true (line 201-203)
// 5. If all pass, condition matches

// GOTCHA: Existing mixed matcher test (lines 769-804) tests CONTRADICTION scenario
// It doesn't test successful matches
// field2: { isDisabled: false } with top-level isDisabled: true creates contradiction
// New tests should test SUCCESSFUL match scenarios

// CRITICAL: isStateFieldMatcher type guard (lines 134-141 of evaluate.ts)
// This function determines if a field should be included in top-level isDisabled check
// Returns true if "isValid" in value || "isDisabled" in value
// Primitives always return false
// Objects with only is/truthy/isTruthy return false

// CRITICAL: Backward compatibility (lines 193-198 of evaluate.ts)
// If NO state matchers exist, check ALL fields (backward compatible behavior)
// If state matchers exist, ONLY check those fields (new mixed matcher behavior)
// Tests should verify this behavior

// GOTCHA: Test setup for mixed matchers
// Must provide both fieldValues AND fieldStates
// fieldValues: For value matchers to check
// fieldStates: For state matchers to check

// CRITICAL: React integration test setup
// Must use FormalityProvider with test inputs
// Must use Form component with config
// Some fields must use value matchers, some must use state matchers
// Result field must have mixed matcher condition
```

---

## Implementation Blueprint

### Data models and structure

**No new data models needed** - this PRP adds tests only.

**Existing Data Structures Used**:

```typescript
// FieldMatcher - Per-field matchers in object when
interface FieldMatcher {
  is?: unknown; // Value matcher ← USED IN THIS PRP
  truthy?: boolean; // Value matcher ← USED IN THIS PRP
  isTruthy?: boolean; // Value matcher (alias) ← USED IN THIS PRP
  isValid?: boolean; // Field state matcher ← USED IN THIS PRP
  isDisabled?: boolean; // Field state matcher ← USED IN THIS PRP
}

// isStateFieldMatcher - Type guard for filtering
function isStateFieldMatcher(value: unknown): value is FieldMatcher {
  return "isValid" in value || "isDisabled" in value;
}

// FieldStateInput - Field state for condition evaluation
export interface FieldStateInput {
  value: unknown;
  isTouched?: boolean;
  isDirty?: boolean; // NOTE: NOT a FieldMatcher!
  isValidating?: boolean;
  error?: unknown;
  invalid?: boolean;
  disabled?: boolean; // ← USED IN THIS PRP
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD core package tests for mixed matchers
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  - ADD: New describe block after line 863
  - NAME: "object when with top-level isDisabled and mixed matchers"
  - TEST CASES:
    1. Value matcher field excluded from top-level isDisabled check
    2. State matcher field included in top-level isDisabled check
    3. Successful match with mixed matchers (field1 value, field2 state, both pass)
    4. Three-field scenario with different matcher types
    5. Both field-level and top-level matchers must pass
  - PATTERN: Follow existing test pattern from lines 769-804
  - USE: fieldValues for value matchers, fieldStates for state matchers
  - VERIFY: Filtering logic works correctly
  - PLACEMENT: After "object when with top-level isDisabled" tests

Task 2: ADD React integration tests for mixed matchers
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: New describe block after line 911
  - NAME: "mixed matcher conditions"
  - TEST CASES:
    1. Mixed matchers with value and state matchers combined
    2. Only state matcher fields checked for disabled condition
  - PATTERN: Follow existing test pattern from lines 869-911
  - USE: Test inputs (TestInput), FormalityProvider, Form, Field
  - VERIFY: DOM elements have correct disabled state
  - PLACEMENT: After "multi-field when conditions" tests

Task 3: RUN all tests to verify no regressions
  - COMMAND: pnpm test --filter @formality-ui/core conditions.test.ts -v
  - VERIFY: All new tests pass
  - VERIFY: All existing tests pass
  - EXPECTED: Zero test failures
  - IF_FAILURES: Debug and fix test implementation

Task 4: RUN React integration tests
  - COMMAND: pnpm test --filter @formality-ui/react Field.test.tsx -t "mixed matcher"
  - VERIFY: All new integration tests pass
  - VERIFY: All existing Field tests pass
  - EXPECTED: Zero test failures
  - IF_FAILURES: Debug and fix test implementation
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Core package test structure for mixed matchers
// ============================================================================

// Add new describe block after line 863 in conditions.test.ts
describe("object when with top-level isDisabled and mixed matchers", () => {
  it("should only check fields with state matchers for top-level isDisabled", () => {
    // TEST: Value matcher field excluded, state matcher field included
    // EXPECT: Only field2 checked for isDisabled
    const conditions: ConditionDescriptor[] = [
      {
        when: {
          field1: { is: "a" },           // Value matcher
          field2: { isDisabled: true }   // State matcher
        },
        isDisabled: true,                // Top-level isDisabled
        disabled: true,
      },
    ];

    // field1 disabled but field2 enabled - should NOT match
    // (Only field2 is checked for isDisabled since field1 uses value matcher)
    expect(
      evaluateConditions({
        conditions,
        fieldValues: { field1: "a", field2: "b" },
        fieldStates: {
          field1: { value: "a", disabled: true },   // Ignored by isDisabled check
          field2: { value: "b", disabled: false },  // Checked by isDisabled check
        },
      }).disabled,
    ).toBeUndefined();

    // field1 enabled but field2 disabled - should MATCH
    // (Only field2 is checked for isDisabled)
    expect(
      evaluateConditions({
        conditions,
        fieldValues: { field1: "a", field2: "b" },
        fieldStates: {
          field1: { value: "a", disabled: false },  // Ignored by isDisabled check
          field2: { value: "b", disabled: true },   // Checked by isDisabled check
        },
      }).disabled,
    ).toBe(true);
  });

  it("should exclude value matcher fields from top-level isDisabled check", () => {
    // TEST: Explicitly verify value matcher fields are excluded
    // EXPECT: field1 with value matcher NOT checked for disabled state
    const conditions: ConditionDescriptor[] = [
      {
        when: {
          field1: { truthy: true },        // Value matcher
          field2: { isDisabled: true }     // State matcher
        },
        isDisabled: true,
        disabled: true,
      },
    ];

    // field1 falsy (field-level fails), field2 disabled - should NOT match
    // (Field-level matchers must pass first)
    expect(
      evaluateConditions({
        conditions,
        fieldValues: { field1: "", field2: "b" },
        fieldStates: {
          field1: { value: "", disabled: true },
          field2: { value: "b", disabled: true },
        },
      }).disabled,
    ).toBeUndefined();
  });

  it("should match when mixed matchers pass and state fields meet isDisabled", () => {
    // TEST: Successful match with mixed matchers
    // EXPECT: Condition matches when all criteria met
    const conditions: ConditionDescriptor[] = [
      {
        when: {
          field1: { is: "value" },         // Value matcher
          field2: { isDisabled: true }     // State matcher
        },
        isDisabled: true,
        disabled: true,
      },
    ];

    // field1 matches "a", field2 disabled - should MATCH
    expect(
      evaluateConditions({
        conditions,
        fieldValues: { field1: "value", field2: "b" },
        fieldStates: {
          field1: { value: "value", disabled: false },  // Ignored
          field2: { value: "b", disabled: true },       // Checked
        },
      }).disabled,
    ).toBe(true);
  });

  it("should work with three fields using different matcher types", () => {
    // TEST: Three-field scenario with multiple matcher types
    // EXPECT: Only state matcher fields checked for isDisabled
    const conditions: ConditionDescriptor[] = [
      {
        when: {
          field1: { is: 5 },               // Value matcher (number)
          field2: { isDisabled: true },    // State matcher
          field3: { isValid: true }        // State matcher
        },
        isDisabled: true,
        disabled: true,
      },
    ];

    // All matchers pass, field2 disabled, field3 disabled - should MATCH
    expect(
      evaluateConditions({
        conditions,
        fieldValues: { field1: 5, field2: "b", field3: "c" },
        fieldStates: {
          field1: { value: 5, disabled: false },
          field2: { value: "b", disabled: true },
          field3: { value: "c", disabled: true, invalid: false },
        },
      }).disabled,
    ).toBe(true);

    // field3 enabled - should NOT match
    expect(
      evaluateConditions({
        conditions,
        fieldValues: { field1: 5, field2: "b", field3: "c" },
        fieldStates: {
          field1: { value: 5, disabled: false },
          field2: { value: "b", disabled: true },
          field3: { value: "c", disabled: false, invalid: false },
        },
      }).disabled,
    ).toBeUndefined();
  });

  it("should require both field-level and top-level matchers to pass", () => {
    // TEST: Both field-level matchers AND top-level isDisabled must pass
    // EXPECT: No match if either fails
    const conditions: ConditionDescriptor[] = [
      {
        when: {
          field1: { is: "a" },           // Value matcher
          field2: { isDisabled: true }   // State matcher
        },
        isDisabled: true,
        disabled: true,
      },
    ];

    // field1 value doesn't match - should NOT match (field-level fails)
    expect(
      evaluateConditions({
        conditions,
        fieldValues: { field1: "wrong", field2: "b" },
        fieldStates: {
          field1: { value: "wrong", disabled: false },
          field2: { value: "b", disabled: true },
        },
      }).disabled,
    ).toBeUndefined();

    // field2 not disabled - should NOT match (top-level fails)
    expect(
      evaluateConditions({
        conditions,
        fieldValues: { field1: "a", field2: "b" },
        fieldStates: {
          field1: { value: "a", disabled: false },
          field2: { value: "b", disabled: false },
        },
      }).disabled,
    ).toBeUndefined();
  });
});

// ============================================================================
// PATTERN: React integration test structure
// ============================================================================

// Add new describe block after line 911 in Field.test.tsx
describe("mixed matcher conditions", () => {
  it("should work with value and state matchers combined", () => {
    // TEST: Mixed matchers in React integration
    // EXPECT: Result field disabled when conditions met
    const config: FormFieldsConfig = {
      status: { type: "textField" },
      disableField: { type: "switch" },
      field1: {
        type: "textField",
        conditions: [
          { when: "disableField", truthy: true, disabled: true },
        ],
      },
      result: {
        type: "textField",
        conditions: [
          {
            when: {
              status: { is: "active" },      // Value matcher
              field1: { isDisabled: true }    // State matcher
            },
            isDisabled: true,
            disabled: true,
          },
        ],
      },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config} record={{ status: "active", disableField: true }}>
          <Field name="status" />
          <Field name="disableField" />
          <Field name="field1" />
          <Field name="result" />
        </Form>
      </FormalityProvider>,
    );

    // status is "active", field1 is disabled
    // Only field1 is checked for top-level isDisabled
    expect(screen.getByTestId("field1")).toBeDisabled();
    expect(screen.getByTestId("result")).toBeDisabled();
  });

  it("should only check state matcher fields for disabled condition", () => {
    // TEST: Verify value matcher fields excluded from isDisabled check
    // EXPECT: Only state matcher fields determine top-level isDisabled
    const config: FormFieldsConfig = {
      toggle1: { type: "switch" },
      toggle2: { type: "switch" },
      field1: {
        type: "textField",
        conditions: [
          { when: "toggle1", truthy: true, disabled: true },
        ],
      },
      result: {
        type: "textField",
        conditions: [
          {
            when: {
              toggle1: { truthy: true },    // Value matcher - excluded
              field1: { isDisabled: true }  // State matcher - checked
            },
            isDisabled: true,
            disabled: true,
          },
        ],
      },
    };

    // toggle1 is false (value matcher fails), field1 disabled
    // Should NOT match because toggle1 field-level matcher fails
    const { rerender } = render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config} record={{ toggle1: false, toggle2: true }}>
          <Field name="toggle1" />
          <Field name="field1" />
          <Field name="result" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("result")).not.toBeDisabled();

    // toggle1 is true (value matcher passes), field1 disabled
    // Should MATCH because toggle1 passes and field1 is disabled
    rerender(
      <FormalityProvider inputs={testInputs}>
        <Form config={config} record={{ toggle1: true, toggle2: true }}>
          <Field name="toggle1" />
          <Field name="field1" />
          <Field name="result" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("result")).toBeDisabled();
  });
});

// ============================================================================
// CRITICAL: Test patterns to follow
// ============================================================================

// From conditions.test.ts:
// - Use describe blocks for grouping related tests
// - Test both positive (match) and negative (no match) cases
// - Use descriptive test names that explain the scenario
// - Include fieldValues AND fieldStates for mixed matcher tests
// - Check specific result properties (disabled, visible, setValue)

// From Field.test.tsx:
// - Use FormalityProvider with test inputs
// - Use Form component with config
// - Use render() from @testing-library/react
// - Use screen.getByTestId() to query elements
// - Use toBeDisabled() to check disabled state
// - Use waitFor for async state updates
```

### Integration Points

```yaml
CORE_PACKAGE_TESTS:
  - file: packages/core/src/__tests__/conditions.test.ts
  - add: New describe block for mixed matchers
  - pattern: Follow existing "object when with top-level isDisabled" pattern
  - requires: All existing tests pass
  - validates: isStateFieldMatcher filtering logic
  - validates: Top-level isDisabled only checks state matcher fields

REACT_INTEGRATION_TESTS:
  - file: packages/react/src/__tests__/Field.test.tsx
  - add: New describe block for mixed matcher conditions
  - pattern: Follow existing multi-field when test pattern
  - requires: Core package tests pass
  - validates: End-to-end behavior with actual components

ISEVALUATECONDITIONMATCH:
  - file: packages/core/src/conditions/evaluate.ts
  - function: evaluateConditionMatch (lines 163-211)
  - behavior: Filters fields using isStateFieldMatcher for top-level isDisabled
  - test: Core tests verify filtering behavior

ISSTATEFIELDMATCHER:
  - file: packages/core/src/conditions/evaluate.ts
  - function: isStateFieldMatcher (lines 134-141)
  - behavior: Returns true if "isValid" in value || "isDisabled" in value
  - test: Core tests verify type guard works correctly
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after test file creation - fix before proceeding
pnpm lint --fix                    # Auto-format and fix linting issues
pnpm typecheck                     # Type checking

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test core condition evaluation
pnpm test --filter @formality-ui/core conditions.test.ts -v

# Test specific describe blocks (after adding tests)
pnpm test --filter @formality-ui/core conditions.test.ts -t "mixed matchers"

# Test all core tests
pnpm test --filter @formality-ui/core -v

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test React integration (uses evaluateConditions and useConditions)
pnpm test --filter @formality-ui/react Field.test.tsx -t "mixed matcher"

# Test full react package
pnpm test --filter @formality-ui/react -v

# Expected: All integration tests pass, condition evaluation works correctly.
```

### Level 4: Cross-Framework Validation

```bash
# Test all packages for regressions
pnpm test -v

# Expected: All tests pass across all packages.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Core package tests for mixed matchers pass
- [ ] React integration tests for mixed matchers pass
- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] No regressions in existing functionality

### Feature Validation

- [ ] Value matcher field excluded from top-level isDisabled check
- [ ] State matcher field included in top-level isDisabled check
- [ ] Successful match with mixed matchers works
- [ ] Three-field scenario with different matcher types works
- [ ] Both field-level and top-level matchers must pass
- [ ] React integration test passes
- [ ] Filtering logic verified to work correctly
- [ ] No breaking changes to the public API

### Code Quality Validation

- [ ] Tests follow existing patterns from conditions.test.ts
- [ ] Tests follow existing patterns from Field.test.tsx
- [ ] Test names are descriptive and follow naming conventions
- [ ] Tests are independent and isolated
- [ ] Edge cases handled (backward compatibility, etc.)
- [ ] Tests cover positive and negative cases

### Documentation & Deployment

- [ ] Test names describe the scenario being tested
- [ ] Test comments explain the expected behavior
- [ ] No deployment changes needed (tests only)

```

---

## Anti-Patterns to Avoid

- **Don't use isDirty as a field matcher** - `isDirty` exists in FieldStateInput but NOT in FieldMatcher. Valid field state matchers are only `isValid` and `isDisabled`.
- **Don't duplicate existing test** - Lines 769-804 already test one mixed matcher scenario. Focus on comprehensive coverage.
- **Don't forget fieldStates** - Mixed matcher tests require both fieldValues AND fieldStates.
- **Don't test only contradictions** - Existing test (lines 769-804) tests contradiction. Test SUCCESSFUL matches too.
- **Don't skip filtering verification** - The key behavior is that value matcher fields are excluded from isDisabled check. Explicitly test this.
- **Don't ignore backward compatibility** - When no state matchers exist, all fields should be checked (backward compatible).
- **Don't break existing tests** - All existing tests must continue to pass.
- **Don't over-complicate** - Focus on clear, understandable test scenarios.
- **Don't mix with pure field state matchers** - That's P2.M2.T2.S1. This PRP is for mixed matchers only.
- **Don't assume contract is correct** - The work item mentions `{ field3: { isDirty: false } }` but this is INVALID. Use only valid matchers.

---

## Related Work Items

- **Previous**: P2.M1 - Disabled Property in Field States (Complete)
- **Previous**: P2.M1.T1.S3 - Handle circular dependency (Complete)
- **Previous**: P2.M2.T1.S1 - Move isDisabled outside string block (Complete)
- **Previous**: P2.M2.T1.S2 - Implement for object when (Complete)
- **Previous**: P2.M2.T1.S3 - Handle mixed matchers (In Parallel)
- **Previous**: P2.M2.T2.S1 - Test two-field conditions (THIS ITEM)
- **Current**: P2.M2.T2.S2 - Test mixed matchers (THIS ITEM)
- **Future**: P2.M2.T2.S3 - Test React integration (Planned)

---

## Contract Dependencies

### From P2.M2.T1.S3 - Handle Mixed Matchers (In Parallel)

The P2.M2.T1.S3 PRP specifies that:
1. `isStateFieldMatcher()` type guard is added to distinguish value vs state matchers
2. Top-level isDisabled check filters to only check fields with field state matchers
3. Mixed matcher scenarios are handled correctly

**This PRP's Contract**:
1. Add tests for MIXED matcher scenarios (some fields use value matchers, some use state matchers)
2. Verify the filtering logic from P2.M2.T1.S3 works correctly
3. Test that ONLY fields with state matchers are checked for top-level isDisabled
4. Test that fields with value matchers are EXCLUDED from top-level isDisabled check

**Integration Point**: P2.M2.T1.S3 adds the filtering logic. This PRP tests that the filtering works correctly for mixed matcher scenarios.

### From P2.M2.T2.S1 - Test Two-Field Conditions (In Parallel)

The P2.M2.T2.S1 PRP tests PURE field state matcher scenarios.

**This PRP's Contract**:
1. Test MIXED matcher scenarios (value + state matchers)
2. Build on test patterns established in P2.M2.T2.S1
3. Verify filtering behavior not covered in P2.M2.T2.S1
4. Don't duplicate pure field state matcher tests

**Integration Point**: P2.M2.T2.S1 tests pure scenarios. This PRP tests mixed scenarios.

### From P2.M1 - Disabled Property in Field States (Complete)

The P2.M1 work items specify that:
1. FieldState.disabled property exists and is used by condition evaluation
2. Two-pass evaluation prevents circular dependencies
3. useFieldDisabledState hook computes disabled state from conditions

**This PRP's Contract**:
1. Use the existing FieldState.disabled property
2. Test conditions that check isDisabled in field state
3. Test React integration with useFieldDisabledState
4. Don't modify the two-pass evaluation logic

**Integration Point**: The disabled property flow is already established. This PRP tests mixed matcher scenarios using the existing disabled property.

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:
- Well-scoped testing task with clear requirements
- Exact test file locations and patterns to follow
- Comprehensive understanding of existing tests and implementation
- All dependencies and constraints documented
- Clear success criteria and validation approach
- Known gotchas documented with solutions
- Anti-patterns identified to avoid
- Test patterns established from existing tests
- No implementation changes needed (tests only)
- Filtering logic well understood from source code review

**Deduction**: -1 for potential confusion about valid field matchers. The work item contract mentions `isDirty` which is NOT a valid field matcher. The PRP clarifies this distinction, but care is needed during implementation to use only valid matchers (`is`, `truthy`, `isValid`, `isDisabled`).

---

## References

### Internal Documentation

- [Condition Types](../../../../packages/core/src/types/conditions.ts) - Type definitions
- [Condition Evaluation](../../../../packages/core/src/conditions/evaluate.ts) - Implementation
- [Condition Tests](../../../../packages/core/src/__tests__/conditions.test.ts) - Test coverage
- [P2.M2.T1.S3 PRP](../P2M2T1S3/PRP.md) - Previous PRP for mixed matchers implementation
- [P2.M2.T2.S1 PRP](../P2M2T2S1/PRP.md) - Parallel PRP for pure field state matchers
- [useConditions Hook](../../../../packages/react/src/hooks/useConditions.ts) - Hook usage
- [useFieldDisabledState Hook](../../../../packages/react/src/hooks/useFieldDisabledState.ts) - Disabled state computation
- [Field Component](../../../../packages/react/src/components/Field.tsx) - Component integration
- [Field Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - React test patterns

### Key Implementation Details

- **isStateFieldMatcher()** (lines 134-141 of evaluate.ts): Type guard that checks for `isValid` or `isDisabled` properties
- **Filtering Logic** (lines 187-198 of evaluate.ts): Filters to only fields with state matchers for top-level `isDisabled` check
- **Backward Compatibility** (lines 193-198 of evaluate.ts): If no state matchers exist, check all fields; otherwise, only check state matcher fields

### Test Coverage Gaps

This PRP fills the following gaps:
1. No explicit test verifying value matcher fields are excluded from isDisabled check
2. No test for successful mixed matcher match (existing test only covers contradiction)
3. No test for three-field mixed matcher scenario
4. No React integration test for mixed matchers
```
