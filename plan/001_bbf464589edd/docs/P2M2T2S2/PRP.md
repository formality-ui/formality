# PRP: Test Mixed Matchers

**Work Item**: P2.M2.T2.S2 - Test mixed matchers
**Parent Task**: P2.M2.T2 - Add Tests for Multi-Field isDisabled
**Parent Milestone**: P2.M2 - Multi-Field isDisabled Conditions
**Priority**: P2 (Major Issue)
**Story Points**: 2
**Status**: **COMPLETE** - Tests implemented in commit `95fca46`

---

## Implementation Status

**COMPLETED** - This work item has been fully implemented. The tests are present in:

- `packages/core/src/__tests__/conditions.test.ts` (lines 1230-1504)

**Commit**: `95fca46` - feat: Add comprehensive tests for multi-field isDisabled conditions with field state matchers

---

## Goal

**Feature Goal**: Add comprehensive tests for mixed matcher scenarios where value matchers (is, truthy) and field state matchers (isDisabled, isValid) are used together in the same object `when` with top-level `isDisabled`.

**Deliverable**:

1. Core package unit tests for mixed matcher scenarios in conditions.test.ts **[DONE]**
2. Tests that verify only fields with field state matchers are checked for top-level `isDisabled` **[DONE]**
3. Tests that verify value matcher fields are excluded from top-level `isDisabled` check **[DONE]**
4. React integration tests for mixed matcher scenarios **[PENDING - P2.M2.T2.S3]**

**Success Definition**:

- Tests verify the filtering logic from `isStateFieldMatcher()` works correctly
- Tests confirm value matcher fields are NOT checked for top-level `isDisabled`
- Tests confirm field state matcher fields ARE checked for top-level `isDisabled`
- Tests verify field-level matchers AND top-level `isDisabled` both must pass

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Enable conditional field disabled state based on a combination of field values (value matchers) and field states (state matchers).

**User Journey**:

1. Developer defines a condition with mixed matchers: some fields use value matchers like `{ is: "value" }`, some use state matchers like `{ isDisabled: true }`
2. When the top-level `isDisabled` check runs, only fields with state matchers are evaluated
3. Fields with value matchers are excluded from the top-level `isDisabled` check
4. The condition matches only when both field-level matchers pass AND top-level `isDisabled` check passes

**Pain Points Addressed**:

- Tests verify the filtering logic between value and state matchers works correctly
- Developers have confidence that mixed matcher scenarios work as expected
- Edge cases where value and state matchers are mixed have explicit test coverage

---

## Why

- **Test Coverage**: Existing test (lines 769-804 of conditions.test.ts) tested ONE specific mixed matcher scenario with a contradiction. Comprehensive tests for:
  1. Mixed matchers that successfully match
  2. Filtering behavior (value matcher fields excluded from isDisabled check)
  3. Multiple fields with different matcher types
- **Validation**: The `isStateFieldMatcher()` type guard filtering is now verified to work correctly
- **Regression Prevention**: Tests ensure future changes don't break mixed matcher functionality
- **Clarification**: The work item contract mentioned `{ field3: { isDirty: false } }` but `isDirty` is NOT a valid field state matcher. Tests use only valid matchers (`is`, `truthy`, `isValid`, `isDisabled`)

---

## What

Tests for mixed matcher scenarios using both value matchers and field state matchers.

### Current State

**Existing Tests** (conditions.test.ts):

- Lines 594-863: Pure value matchers with top-level isDisabled
- Lines 769-804: ONE mixed matcher test (field1 uses `is`, field2 uses `isDisabled: false`) - tests contradiction scenario
- **Lines 1230-1504: COMPREHENSIVE mixed matcher tests** [NEW - IMPLEMENTED]

**New Tests Added** (lines 1230-1504):

1. "should only check fields with state matchers when isDisabled: true" - Verifies field2 with state matcher is checked, field1 with value matcher is excluded
2. "should not match when state field is enabled (isDisabled: true)" - Tests negative case
3. "should only check fields with state matchers when isDisabled: false" - Tests with `isValid` matcher
4. "should not match when state field is disabled (isDisabled: false)" - Tests negative case for `isDisabled: false`
5. "should handle multiple fields with state matchers" - Three-field scenario
6. "should not match when any state field fails disabled check" - Tests that all state fields must match
7. "should handle value matchers with object syntax" - Tests `{ is: 5 }` format
8. "should handle mixed truthy and state matchers" - Tests `truthy` matcher
9. "should require field-level matchers to pass first" - Tests field-level matcher validation
10. "should handle complex mixed scenario with multiple state matchers" - Four-field scenario with both value and state matchers

### Success Criteria

- [x] Mixed matcher test: value matcher field excluded from isDisabled check
- [x] Mixed matcher test: state matcher field included in isDisabled check
- [x] Mixed matcher test: successful match with mixed matchers
- [x] Mixed matcher test: three-field scenario with multiple matcher types
- [ ] React integration test: mixed matchers work in actual form (P2.M2.T2.S3)
- [x] All existing tests pass without modification

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to understand this work?_

**Answer**: Yes. This PRP provides:

- Exact test file locations and patterns to follow
- Complete test scenarios with expected results
- Detailed explanation of filtering logic
- All dependencies and constraints documented
- Known gotchas and anti-patterns

### Documentation & References

```yaml
# MUST READ - Test patterns to follow

# CORE PACKAGE TESTS - Tests added here
- file: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  why: Main condition evaluation test file - tests added at lines 1230-1504
  exact: Lines 1230-1504 (new mixed matcher tests)
  pattern: Use describe blocks, expect() for assertions, fieldStates for state matchers
  critical: Tests verify SUCCESSFUL matches, not just contradictions

# PREVIOUS PRP - Understanding the implementation being tested
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M2T2S1/PRP.md
  why: Previous PRP that tests pure field state matchers
  contract: Pure field state matcher tests provide baseline patterns
  critical: This PRP builds on those patterns for mixed matchers
  notes: P2.M2.T2.S1 tests pure field state matchers, this PRP tests mixed

# IMPLEMENTATION BEING TESTED
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Contains the evaluateConditionMatch and isStateFieldMatcher functions
  exact: Lines 134-141 (isStateFieldMatcher type guard)
  exact: Lines 189-198 (filtering logic for top-level isDisabled)
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

# REACT INTEGRATION TESTS (PENDING - P2.M2.T2.S3)
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: React component integration tests
  exact: Lines 869-911 (multi-field when conditions test)
  pattern: Use renderHook, render, screen, waitFor for React testing
  critical: Integration tests should verify actual DOM behavior
```

### Current Codebase tree (core package tests)

```bash
packages/core/src/__tests__/
├── conditions.test.ts              # ← TARGET: Mixed matcher tests added
│   ├── Lines 594-863: Existing "object when with top-level isDisabled" tests
│   ├── Lines 769-804: Existing mixed matcher test (contradiction scenario)
│   └── Lines 1230-1504: NEW - Comprehensive mixed matcher tests
```

### Desired Codebase tree with tests to be added

```bash
packages/core/src/__tests__/
├── conditions.test.ts              # ← MODIFY: Add mixed matcher tests
│   ├── [EXISTING TESTS UNCHANGED]
│   └── ADDED NEW DESCRIBE BLOCK (after line 863):
│       └── describe("object when with top-level isDisabled and mixed matchers", () => {
│           ├── it("should only check fields with state matchers when isDisabled: true")
│           ├── it("should not match when state field is enabled (isDisabled: true)")
│           ├── it("should only check fields with state matchers when isDisabled: false")
│           ├── it("should not match when state field is disabled (isDisabled: false)")
│           ├── it("should handle multiple fields with state matchers")
│           ├── it("should not match when any state field fails disabled check")
│           ├── it("should handle value matchers with object syntax")
│           ├── it("should handle mixed truthy and state matchers")
│           ├── it("should require field-level matchers to pass first")
│           └── it("should handle complex mixed scenario with multiple state matchers")
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Value matcher vs Field state matcher distinction

// VALUE MATCHERS (check the field's value):
// { field1: { is: "a" } } - checks if field1.value === "a"
// { field1: { truthy: true } } - checks if field1.value is truthy
// { field1: { isTruthy: true } } - checks if field1.value is truthy (alias)

// FIELD STATE MATCHERS (check the field's state):
// { field1: { isDisabled: true } } - checks if field1.disabled === true
// { field1: { isValid: true } } - checks if field1.invalid === false

// GOTCHA: isDirty is NOT a valid field matcher
// isDirty exists in FieldStateInput but NOT in FieldMatcher interface
// The work item contract mentions { field3: { isDirty: false } } but this is INVALID
// Valid field state matchers are ONLY: isValid, isDisabled

// CRITICAL: Filtering behavior for top-level isDisabled (lines 189-198 of evaluate.ts)
// When isDisabled is specified at top level, the code filters to only check fields with state matchers
// This is the KEY behavior that mixed matcher tests verify

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

// CRITICAL: isStateFieldMatcher type guard (lines 134-141 of evaluate.ts)
// This function determines if a field should be included in top-level isDisabled check
// Returns true if "isValid" in value || "isDisabled" in value
// Primitives always return false
// Objects with only is/truthy/isTruthy return false

// CRITICAL: Backward compatibility (lines 193-198 of evaluate.ts)
// If NO state matchers exist, check ALL fields (backward compatible behavior)
// If state matchers exist, ONLY check those fields (new mixed matcher behavior)
// Tests verify this behavior
```

---

## Implementation Blueprint

### Data models and structure

**No new data models needed** - this PRP documents completed test implementation.

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

### Implementation Summary

**IMPLEMENTATION COMPLETE** - Tests added in commit `95fca46`

```yaml
Task 1: ADD core package tests for mixed matchers [COMPLETE]
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  - ADDED: New describe block at line 1230
  - NAME: "object when with top-level isDisabled and mixed matchers"
  - TEST CASES ADDED:
    1. Value matcher field excluded from top-level isDisabled check
    2. State matcher field included in top-level isDisabled check
    3. Successful match with mixed matchers (field1 value, field2 state, both pass)
    4. Three-field scenario with different matcher types
    5. Both field-level and top-level matchers must pass
    6. Value matchers with object syntax ({ is: 5 })
    7. Mixed truthy and state matchers
    8. Complex four-field scenario
  - PATTERN: Followed existing test pattern from lines 769-804
  - USE: fieldValues for value matchers, fieldStates for state matchers
  - VERIFY: Filtering logic works correctly
  - PLACEMENT: After "object when with top-level isDisabled and pure field state matchers" tests

Task 2: ADD React integration tests for mixed matchers [PENDING - P2.M2.T2.S3]
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: New describe block (after line 911)
  - NAME: "mixed matcher conditions"
  - TEST CASES:
    1. Mixed matchers with value and state matchers combined
    2. Only state matcher fields checked for disabled condition
  - PATTERN: Follow existing test pattern from lines 869-911
  - USE: Test inputs (TestInput), FormalityProvider, Form, Field
  - VERIFY: DOM elements have correct disabled state
  - PLACEMENT: After "two-field isDisabled conditions" tests

Task 3: RUN all tests to verify no regressions [COMPLETE]
  - COMMAND: pnpm test --filter @formality-ui/core conditions.test.ts -v
  - VERIFY: All new tests pass
  - VERIFY: All existing tests pass
  - EXPECTED: Zero test failures
  - RESULT: All tests pass successfully

Task 4: RUN React integration tests [PENDING - P2.M2.T2.S3]
  - COMMAND: pnpm test --filter @formality-ui/react Field.test.tsx -t "mixed matcher"
  - VERIFY: All new integration tests pass
  - VERIFY: All existing Field tests pass
  - EXPECTED: Zero test failures
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Core package test structure for mixed matchers (IMPLEMENTED)
// ============================================================================

// Tests added at lines 1230-1504 in conditions.test.ts
describe("object when with top-level isDisabled and mixed matchers", () => {
  it("should only check fields with state matchers when isDisabled: true", () => {
    // TEST: Value matcher field excluded, state matcher field included
    // EXPECT: Only field2 checked for isDisabled
    const conditions: ConditionDescriptor[] = [
      {
        when: {
          field1: 5, // Value matcher (primitive)
          field2: { isDisabled: true }, // State matcher
        },
        isDisabled: true, // Top-level isDisabled
        disabled: true,
      },
    ];

    // field2 is disabled - should match (only field2 checked)
    expect(
      evaluateConditions({
        conditions,
        fieldValues: { field1: 5, field2: "value" },
        fieldStates: {
          field1: { value: 5, disabled: false }, // Not checked (value matcher)
          field2: { value: "value", disabled: true }, // Checked (state matcher)
        },
      }).disabled,
    ).toBe(true);
  });

  // ... 9 more test cases covering all mixed matcher scenarios
});
```

### Integration Points

```yaml
CORE_PACKAGE_TESTS:
  - file: packages/core/src/__tests__/conditions.test.ts
  - status: COMPLETE - Tests added at lines 1230-1504
  - pattern: Follow existing "object when with top-level isDisabled" pattern
  - validates: isStateFieldMatcher filtering logic
  - validates: Top-level isDisabled only checks state matcher fields

REACT_INTEGRATION_TESTS:
  - file: packages/react/src/__tests__/Field.test.tsx
  - status: PENDING - Will be added in P2.M2.T2.S3
  - pattern: Follow existing multi-field when test pattern
  - requires: Core package tests pass (DONE)

ISEVALUATECONDITIONMATCH:
  - file: packages/core/src/conditions/evaluate.ts
  - function: evaluateConditionMatch (lines 163-211)
  - behavior: Filters fields using isStateFieldMatcher for top-level isDisabled
  - test: Core tests verify filtering behavior (DONE)

ISSTATEFIELDMATCHER:
  - file: packages/core/src/conditions/evaluate.ts
  - function: isStateFieldMatcher (lines 134-141)
  - behavior: Returns true if "isValid" in value || "isDisabled" in value
  - test: Core tests verify type guard works correctly (DONE)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after test file creation - fix before proceeding
pnpm lint --fix                    # Auto-format and fix linting issues
pnpm typecheck                     # Type checking

# Expected: Zero errors.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test core condition evaluation
pnpm test --filter @formality-ui/core conditions.test.ts -v

# Test specific describe blocks
pnpm test --filter @formality-ui/core conditions.test.ts -t "mixed matchers"

# Test all core tests
pnpm test --filter @formality-ui/core -v

# Expected: All tests pass.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test React integration (PENDING - P2.M2.T2.S3)
pnpm test --filter @formality-ui/react Field.test.tsx -t "mixed matcher"

# Test full react package
pnpm test --filter @formality-ui/react -v

# Expected: All integration tests pass.
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

- [x] All 4 validation levels completed successfully (core tests)
- [x] Core package tests for mixed matchers pass
- [ ] React integration tests for mixed matchers pass (P2.M2.T2.S3)
- [x] All core tests pass: `pnpm test --filter @formality-ui/core`
- [x] No linting errors: `pnpm lint`
- [x] No type errors: `pnpm typecheck`
- [x] No regressions in existing functionality

### Feature Validation

- [x] Value matcher field excluded from top-level isDisabled check
- [x] State matcher field included in top-level isDisabled check
- [x] Successful match with mixed matchers works
- [x] Three-field scenario with different matcher types works
- [x] Both field-level and top-level matchers must pass
- [ ] React integration test passes (P2.M2.T2.S3)
- [x] Filtering logic verified to work correctly
- [x] No breaking changes to the public API

### Code Quality Validation

- [x] Tests follow existing patterns from conditions.test.ts
- [x] Test names are descriptive and follow naming conventions
- [x] Tests are independent and isolated
- [x] Edge cases handled (backward compatibility, etc.)
- [x] Tests cover positive and negative cases

---

## Anti-Patterns to Avoid

- **Don't use isDirty as a field matcher** - `isDirty` exists in FieldStateInput but NOT in FieldMatcher. Valid field state matchers are only `isValid` and `isDisabled`.
- **Don't duplicate existing test** - Lines 769-804 already test one mixed matcher scenario. The new tests focus on comprehensive coverage.
- **Don't forget fieldStates** - Mixed matcher tests require both fieldValues AND fieldStates.
- **Don't test only contradictions** - Existing test (lines 769-804) tests contradiction. The new tests test SUCCESSFUL matches too.
- **Don't skip filtering verification** - The key behavior is that value matcher fields are excluded from isDisabled check. Tests explicitly verify this.
- **Don't ignore backward compatibility** - When no state matchers exist, all fields should be checked (backward compatible).
- **Don't break existing tests** - All existing tests must continue to pass.
- **Don't over-complicate** - Focus on clear, understandable test scenarios.
- **Don't mix with pure field state matchers** - That's P2.M2.T2.S1. This PRP is for mixed matchers only.
- **Don't assume contract is correct** - The work item mentions `{ field3: { isDirty: false } }` but this is INVALID. Tests use only valid matchers.

---

## Related Work Items

- **Previous**: P2.M1 - Disabled Property in Field States (Complete)
- **Previous**: P2.M1.T1.S3 - Handle circular dependency (Complete)
- **Previous**: P2.M2.T1.S1 - Move isDisabled outside string block (Complete)
- **Previous**: P2.M2.T1.S2 - Implement for object when (Complete)
- **Previous**: P2.M2.T1.S3 - Handle mixed matchers (Complete)
- **Previous**: P2.M2.T2.S1 - Test two-field conditions (Complete)
- **Current**: P2.M2.T2.S2 - Test mixed matchers (THIS ITEM - CORE TESTS COMPLETE)
- **Future**: P2.M2.T2.S3 - Test React integration (Planned)

---

## Contract Dependencies

### From P2.M2.T1.S3 - Handle Mixed Matchers (Complete)

The P2.M2.T1.S3 PRP specifies that:

1. `isStateFieldMatcher()` type guard is added to distinguish value vs state matchers
2. Top-level isDisabled check filters to only check fields with field state matchers
3. Mixed matcher scenarios are handled correctly

**This PRP's Contract**:

1. Tests for MIXED matcher scenarios (some fields use value matchers, some use state matchers) [DONE]
2. Verify the filtering logic from P2.M2.T1.S3 works correctly [DONE]
3. Test that ONLY fields with state matchers are checked for top-level isDisabled [DONE]
4. Test that fields with value matchers are EXCLUDED from top-level isDisabled check [DONE]

**Integration Point**: P2.M2.T1.S3 adds the filtering logic. This PRP tests that the filtering works correctly for mixed matcher scenarios.

### From P2.M2.T2.S1 - Test Two-Field Conditions (Complete)

The P2.M2.T2.S1 PRP tests PURE field state matcher scenarios.

**This PRP's Contract**:

1. Test MIXED matcher scenarios (value + state matchers) [DONE]
2. Build on test patterns established in P2.M2.T2.S1 [DONE]
3. Verify filtering behavior not covered in P2.M2.T2.S1 [DONE]
4. Don't duplicate pure field state matcher tests [DONE]

**Integration Point**: P2.M2.T2.S1 tests pure scenarios. This PRP tests mixed scenarios.

### To P2.M2.T2.S3 - Test React Integration (Planned)

The P2.M2.T2.S3 work item will test React integration for mixed matchers.

**This PRP's Contract**:

1. Core tests for mixed matchers are complete [DONE]
2. Test patterns established for P2.M2.T2.S3 to follow [AVAILABLE]
3. React integration tests will verify end-to-end behavior [PENDING]

---

## Confidence Score

**10/10** - Implementation is complete and all tests pass

**Reasoning**:

- Implementation is complete (commit `95fca46`)
- All core tests pass successfully
- Filtering logic verified to work correctly
- All dependencies and constraints documented
- Clear success criteria met
- Comprehensive test coverage
- No implementation changes needed (tests are complete)
- Filtering logic well understood from source code review

---

## References

### Internal Documentation

- [Condition Types](../../../../packages/core/src/types/conditions.ts) - Type definitions
- [Condition Evaluation](../../../../packages/core/src/conditions/evaluate.ts) - Implementation
- [Condition Tests](../../../../packages/core/src/__tests__/conditions.test.ts) - Test coverage (lines 1230-1504)
- [P2.M2.T1.S3 PRP](../P2M2T1S3/PRP.md) - Previous PRP for mixed matchers implementation
- [P2.M2.T2.S1 PRP](../P2M2T2S1/PRP.md) - Parallel PRP for pure field state matchers

### Key Implementation Details

- **isStateFieldMatcher()** (lines 134-141 of evaluate.ts): Type guard that checks for `isValid` or `isDisabled` properties
- **Filtering Logic** (lines 189-198 of evaluate.ts): Filters to only fields with state matchers for top-level `isDisabled` check
- **Backward Compatibility** (lines 193-198 of evaluate.ts): If no state matchers exist, check all fields; otherwise, only check state matcher fields

### Test Coverage

This PRP documents tests that fill the following gaps:

1. Explicit test verifying value matcher fields are excluded from isDisabled check
2. Tests for successful mixed matcher matches (not just contradictions)
3. Tests for three+ field mixed matcher scenarios
4. Tests for complex mixed scenarios with multiple state matchers

### Commit Reference

- **Commit**: `95fca46` - feat: Add comprehensive tests for multi-field isDisabled conditions with field state matchers
- **Files Modified**: `packages/core/src/__tests__/conditions.test.ts`
- **Lines Added**: 1230-1504 (10 test cases)
- **Test Status**: All passing
