# PRP: Handle Mixed Matchers

**Work Item**: P2.M2.T1.S3 - Handle mixed matchers
**Parent Task**: P2.M2.T1 - Modify Condition Evaluation
**Parent Milestone**: P2.M2 - Multi-Field isDisabled Conditions
**Priority**: P2 (Major Issue)
**Story Points**: 2

---

## Goal

**Feature Goal**: Enable top-level `isDisabled` matcher for object `when` conditions with mixed matchers (value matchers and field state matchers), where only fields using field state matchers are checked for disabled state.

**Deliverable**:

1. New `isFieldMatcher()` type guard function to detect FieldMatcher objects
2. Modified top-level `isDisabled` check in `evaluateConditionMatch()` that filters to only check fields with field state matchers
3. Updated code comments explaining the mixed matcher behavior
4. Comprehensive tests for mixed matcher scenarios

**Success Definition**:

- Object `when` with mixed matchers (value + field state) correctly evaluates top-level `isDisabled`
- Only fields using field state matchers (object values) are checked for disabled state
- Fields with value matchers (primitive values) are skipped in isDisabled check
- All existing tests pass without modification
- No breaking changes to the public API

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Enable flexible multi-field conditions where some fields match based on value and others match based on state, with a top-level isDisabled check that only applies to state-based fields.

**User Journey**:

1. Developer defines a condition with object `when` containing mixed matchers
2. Some fields use value matchers (e.g., `{ field1: 5 }`)
3. Some fields use field state matchers (e.g., `{ field2: { isDisabled: true } }`)
4. Top-level `isDisabled` only checks fields with field state matchers
5. Condition evaluates correctly based on the filtered field set

**Pain Points Addressed**:

- Currently, top-level `isDisabled` checks ALL fields, including those with value matchers
- No way to express "only check state-based fields for disabled state"
- Inconsistent behavior: value matchers don't care about disabled state but are still checked

---

## Why

- **Logical Consistency**: Value matchers (e.g., `{ field: 5 }`) compare field values, not field state. They shouldn't be included in disabled state checks.
- **Flexibility**: Developers can now mix value and state matchers freely without unexpected behavior from top-level isDisabled.
- **Bug Fix**: The current implementation incorrectly checks all fields for disabled state, even when using value matchers.
- **Contract Completion**: P2.M2.T1.S2 added top-level isDisabled for object when, but didn't handle the mixed matcher case.

---

## What

Add support for mixed matchers in object `when` conditions with top-level `isDisabled`.

### Current State

**Current Implementation (Lines 152-162 of evaluate.ts)**:

```typescript
// Check top-level isDisabled matcher for object when
if (condition.isDisabled !== undefined && fieldStates) {
  const allFieldsDisabled = Object.keys(condition.when).every(
    (fieldName) => fieldStates[fieldName]?.disabled === true,
  );
  if (condition.isDisabled !== allFieldsDisabled) {
    return false;
  }
}
```

**Problem**: This checks ALL fields in the object `when`, regardless of matcher type.

**Example of Problematic Behavior**:

```typescript
// Mixed matchers: field1 uses value matcher, field2 uses field state matcher
{
  when: {
    field1: 5,                    // Value matcher - just checks if field1 === 5
    field2: { isDisabled: true }  // Field state matcher - checks if field2 is disabled
  },
  isDisabled: true                // Should only check field2's disabled state
}
```

Current behavior: Checks if BOTH field1 AND field2 are disabled.
Expected behavior: Only checks if field2 is disabled (field1 is ignored).

### Desired State

**New Implementation**:

```typescript
// Check top-level isDisabled matcher for object when
// Only check fields that use field state matchers (object values)
// Skip fields with value matchers (primitive values)
if (condition.isDisabled !== undefined && fieldStates) {
  const fieldsWithStateMatchers = Object.entries(condition.when)
    .filter(([, matcher]) => isFieldMatcher(matcher))
    .map(([fieldName]) => fieldName);

  const allStateFieldsDisabled =
    fieldsWithStateMatchers.length > 0
      ? fieldsWithStateMatchers.every(
          (fieldName) => fieldStates[fieldName]?.disabled === true,
        )
      : true; // No state matchers = vacuously true

  if (condition.isDisabled !== allStateFieldsDisabled) {
    return false;
  }
}
```

**New Behavior**:

- Object `when` with mixed matchers: Only fields with field state matchers are checked
- Fields with value matchers are excluded from the isDisabled check
- If no fields use field state matchers, the isDisabled check passes (vacuously true)

### Success Criteria

- [ ] Object `when` with value matchers only + top-level `isDisabled: true` matches (vacuously true)
- [ ] Object `when` with field state matchers + top-level `isDisabled: true` checks only those fields
- [ ] Object `when` with mixed matchers + top-level `isDisabled: true` only checks state matcher fields
- [ ] Object `when` with mixed matchers + top-level `isDisabled: false` checks only state matcher fields
- [ ] All existing tests pass without modification
- [ ] New tests cover mixed matcher scenarios

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:

- Exact file location and line numbers for code to modify
- Complete context on the mixed matcher problem
- Type guard function specification with examples
- All test patterns and validation commands
- Specific examples of expected behavior
- Integration points with previous work items
- Known gotchas and anti-patterns

### Documentation & References

```yaml
# MUST READ - Core implementation file

# TARGET FILE - Modify this function
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Main condition evaluation logic - contains the code to modify
  exact: Lines 152-162 (top-level isDisabled check for object when)
  pattern: Follow existing function structure and error handling
  critical: Must filter fields to only check those with field state matchers

# TYPE DEFINITIONS - Understand the data structures
- file: /home/dustin/projects/formality/packages/core/src/types/conditions.ts
  why: FieldMatcher interface and WhenMultiField type definitions
  exact: Lines 12-27 (FieldMatcher interface)
  exact: Lines 35 (WhenMultiField type)
  exact: Lines 44-130 (ConditionDescriptor interface)
  pattern: FieldMatcher has optional properties: is, truthy, isTruthy, isValid, isDisabled
  critical: Value matchers are primitives, field state matchers are objects

# PREVIOUS PRP - Understanding the contract
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M2T1S2/PRP.md
  why: Previous PRP that implemented top-level isDisabled for object when
  contract: Assumes all fields are checked for disabled state
  critical: This PRP fixes the limitation where mixed matchers weren't considered
  notes: Lines 152-162 were added by P2.M2.T1.S2, now need refinement

# TEST FILE - Understand test patterns
- file: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  why: Contains all tests for condition evaluation
  exact: Lines 464-536 (existing multi-field tests)
  pattern: Tests show field-level isDisabled in object when
  critical: No tests for mixed matchers with top-level isDisabled yet

# UTILITY FUNCTIONS - For type guard implementation
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: See existing patterns for type checking
  exact: Lines 103-108 (hasAnyMatcher check pattern)
  pattern: Property presence detection pattern
  critical: Use similar pattern for isFieldMatcher type guard
```

### Current Codebase tree (core package conditions)

```bash
packages/core/src/
├── conditions/
│   └── evaluate.ts                 # ← TARGET: Modify evaluateConditionMatch function
│       ├── Lines 20-28: FieldStateInput interface
│       ├── Lines 59-115: evaluateFieldMatcher function
│       ├── Lines 143-165: Object when handling
│       │   └── Lines 152-162: Top-level isDisabled check (MODIFY THIS)
│       └── Lines 244-475: Other functions
├── types/
│   └── conditions.ts               # Type definitions
│       ├── Lines 12-27: FieldMatcher interface
│       └── Lines 35: WhenMultiField type
└── __tests__/
    └── conditions.test.ts          # Tests for condition evaluation
        └── [ADD NEW TESTS HERE]
```

### Desired Codebase tree with files to be modified

````bash
packages/core/src/conditions/
├── evaluate.ts                     # ← MODIFY: Add isFieldMatcher and update isDisabled check
│   ├── ADD NEW FUNCTION (after evaluateFieldMatcher, around line 116):
│   │   └── isFieldMatcher(type guard):
│   │       ```typescript
│   │       function isFieldMatcher(value: unknown): value is FieldMatcher {
│   │         return typeof value === "object" &&
│   │           value !== null &&
│   │           ("is" in value || "truthy" in value || "isTruthy" in value ||
│   │            "isValid" in value || "isDisabled" in value);
│   │       }
│   │       ```
│   │
│   └── MODIFY: Lines 152-162 (top-level isDisabled check):
│       └── CHANGE: Filter to only check fields with field state matchers
│           ```typescript
│           // Check top-level isDisabled matcher for object when
│           // Only check fields that use field state matchers (object values)
│           // Skip fields with value matchers (primitive values)
│           if (condition.isDisabled !== undefined && fieldStates) {
│             const fieldsWithStateMatchers = Object.entries(condition.when)
│               .filter(([, matcher]) => isFieldMatcher(matcher))
│               .map(([fieldName]) => fieldName);
│
│             const allStateFieldsDisabled = fieldsWithStateMatchers.length > 0
│               ? fieldsWithStateMatchers.every(
│                   (fieldName) => fieldStates[fieldName]?.disabled === true
│                 )
│               : true; // No state matchers = vacuously true
│
│             if (condition.isDisabled !== allStateFieldsDisabled) {
│               return false;
│             }
│           }
│           ```

packages/core/src/__tests__/
├── conditions.test.ts              # ← MODIFY: Add tests for mixed matchers
│   ├── [EXISTING TESTS UNCHANGED]
│   └── ADD NEW DESCRIBE BLOCK:
│       └── describe("object when with top-level isDisabled and mixed matchers", () => {
│           ├── it("should ignore value matchers in isDisabled check")
│           ├── it("should only check fields with field state matchers")
│           ├── it("should handle all value matchers (vacuously true)")
│           ├── it("should handle all field state matchers")
│           ├── it("should handle mixed isDisabled: true")
│           ├── it("should handle mixed isDisabled: false")
│           └── it("should handle complex mixed scenarios")
````

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Value matcher vs Field state matcher distinction
// These are DIFFERENT and must be detected at runtime:

// VALUE MATCHER (primitive):
// { when: { field1: 5 } }
// Meaning: field1 must equal 5
// The value 5 is a primitive, NOT a FieldMatcher object

// FIELD STATE MATCHER (object):
// { when: { field1: { isDisabled: true } } }
// Meaning: field1 must be disabled
// The value { isDisabled: true } IS a FieldMatcher object

// GOTCHA: Type narrowing is required
// TypeScript sees `WhenMultiField = Record<string, FieldMatcher>`
// But at runtime, values can be primitives OR FieldMatcher objects
// Need a type guard to distinguish

// CRITICAL: isFieldMatcher type guard
// Must check for ALL FieldMatcher properties to be safe
// Use "in" operator for property existence check
// Must handle null and non-object values

function isFieldMatcher(value: unknown): value is FieldMatcher {
  return (
    typeof value === "object" &&
    value !== null &&
    ("is" in value ||
      "truthy" in value ||
      "isTruthy" in value ||
      "isValid" in value ||
      "isDisabled" in value)
  );
}

// GOTCHA: Empty state matcher list = vacuously true
// If ALL fields use value matchers, there are no state matchers to check
// The isDisabled check should pass (no fields to fail the check)
// Example: { when: { field1: 5, field2: "x" }, isDisabled: true }
// Result: Condition matches (no state fields, so all are "disabled")

// CRITICAL: Backward compatibility
// All existing tests must pass without modification
// The new logic should only affect mixed matcher scenarios
// Pure value matcher or pure state matcher scenarios work the same

// GOTCHA: Interaction with field-level isDisabled
// { when: { field1: { isDisabled: true }, field2: 5 }, isDisabled: true }
// field1: Uses field state matcher, checked in top-level isDisabled
// field2: Uses value matcher, SKIPPED in top-level isDisabled
// Both fields must still pass their individual matchers via evaluateFieldMatcher

// CRITICAL: The check is AFTER the field matcher loop (line 150)
// First: All field-level matchers must pass (lines 146-150)
// Then: Only state matcher fields are checked for top-level isDisabled (new logic)
// Both must pass for the condition to match

// GOTCHA: Type safety with Record<string, FieldMatcher>
// The type says all values are FieldMatcher, but runtime allows primitives
// This is intentional for the shorthand syntax: { field: value } === { field: { is: value } }
// The type guard handles this runtime discrepancy
```

---

## Implementation Blueprint

### Data models and structure

**No new data models needed** - this PRP uses existing data structures.

**Existing Data Structures**:

```typescript
// FieldMatcher - Per-field matchers in object when
interface FieldMatcher {
  is?: unknown; // Value matcher
  truthy?: boolean; // Value matcher
  isTruthy?: boolean; // Value matcher (alias)
  isValid?: boolean; // Field state matcher
  isDisabled?: boolean; // Field state matcher
}

// WhenMultiField - Object when with field-level matchers
// At runtime, values can be primitives OR FieldMatcher objects
type WhenMultiField = Record<string, FieldMatcher | unknown>;

// ConditionDescriptor - Condition definition
interface ConditionDescriptor {
  when?: string | WhenMultiField;
  isDisabled?: boolean; // Top-level field state matcher
  disabled?: boolean; // Action to apply
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD isFieldMatcher type guard function
  - FILE: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  - LOCATION: After evaluateFieldMatcher function (around line 116)
  - IMPLEMENT: Type guard function to detect FieldMatcher objects
  - CODE: |
    /**
     * Type guard to check if a value is a FieldMatcher object
     *
     * Distinguishes between value matchers (primitives) and field state matchers (objects).
     * Value matchers: { field: 5 } - the value 5 is a primitive
     * Field state matchers: { field: { isDisabled: true } } - the value is a FieldMatcher
     *
     * @param value - The value to check
     * @returns true if the value is a FieldMatcher object
     */
    function isFieldMatcher(value: unknown): value is FieldMatcher {
      return typeof value === "object" &&
        value !== null &&
        ("is" in value || "truthy" in value || "isTruthy" in value ||
         "isValid" in value || "isDisabled" in value);
    }
  - PATTERN: Follow existing hasAnyMatcher pattern (lines 103-108)
  - USES: "in" operator for property existence check
  - RETURNS: TypeScript type predicate (value is FieldMatcher)
  - DEPENDENCIES: Import FieldMatcher type from types

Task 2: MODIFY top-level isDisabled check for object when
  - FILE: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  - LOCATION: Lines 152-162 (in evaluateConditionMatch function)
  - MODIFY: Filter to only check fields with field state matchers
  - CODE: |
    // Check top-level isDisabled matcher for object when
    // Only check fields that use field state matchers (object values)
    // Skip fields with value matchers (primitive values)
    if (condition.isDisabled !== undefined && fieldStates) {
      const fieldsWithStateMatchers = Object.entries(condition.when)
        .filter(([, matcher]) => isFieldMatcher(matcher))
        .map(([fieldName]) => fieldName);

      const allStateFieldsDisabled = fieldsWithStateMatchers.length > 0
        ? fieldsWithStateMatchers.every(
            (fieldName) => fieldStates[fieldName]?.disabled === true
          )
        : true; // No state matchers = vacuously true

      if (condition.isDisabled !== allStateFieldsDisabled) {
        return false;
      }
    }
  - PRESERVE: All existing logic before and after this block
  - PRESERVE: Field matcher loop at lines 146-150
  - PATTERN: Use Object.entries().filter().map() for clean transformation
  - LOGIC: Only check fields where isFieldMatcher(matcher) is true
  - EDGE: Handle empty state matcher list (vacuously true)

Task 3: VERIFY all existing tests pass
  - COMMAND: pnpm test --filter @formality-ui/core conditions.test.ts
  - VERIFY: All existing tests pass
  - VERIFY: No regressions in condition evaluation
  - VERIFY: Pure value matcher scenarios work
  - VERIFY: Pure state matcher scenarios work
  - EXPECTED: Zero test failures
  - IF_FAILURES: Debug and fix implementation

Task 4: ADD tests for mixed matchers with top-level isDisabled
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  - ADD: New describe block for mixed matchers
  - FOLLOW: Test patterns from lines 464-536
  - TEST CASES:
    - All value matchers + isDisabled: true → match (vacuously true)
    - All value matchers + isDisabled: false → match (vacuously true)
    - All state matchers + isDisabled: true → check all fields
    - Mixed matchers + isDisabled: true → only check state fields
    - Mixed matchers + isDisabled: false → only check state fields
    - Complex mixed scenarios
  - COVERAGE: Positive and negative cases
  - PLACEMENT: After existing multi-field tests (after line 536)

Task 5: RUN full test suite
  - COMMAND: pnpm test
  - VERIFY: All tests across all packages pass
  - VERIFY: No breaking changes in react package
  - VERIFY: No breaking changes in other framework packages
  - EXPECTED: Zero test failures
  - IF_FAILURES: Debug and fix implementation

Task 6: UPDATE code comments
  - FILE: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  - REVIEW: Comments in evaluateConditionMatch function
  - UPDATE: Add comment explaining mixed matcher handling
  - UPDATE: Document the value matcher vs state matcher distinction
  - OUTPUT: Clear, well-documented code
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Type guard for FieldMatcher detection
// ============================================================================

// PROBLEM: At runtime, WhenMultiField values can be primitives OR FieldMatcher objects
// Example: { field1: 5, field2: { isDisabled: true } }
// - field1: value is 5 (primitive number, NOT a FieldMatcher)
// - field2: value is { isDisabled: true } (IS a FieldMatcher object)

// SOLUTION: Type guard function with property existence check
function isFieldMatcher(value: unknown): value is FieldMatcher {
  // Check if value is an object (not null, not primitive)
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Check if ANY FieldMatcher property exists
  const matcher = value as Record<string, unknown>;
  return (
    "is" in matcher ||
    "truthy" in matcher ||
    "isTruthy" in matcher ||
    "isValid" in matcher ||
    "isDisabled" in matcher
  );
}

// USAGE IN TOP-LEVEL isDisabled CHECK:
// ============================================================================
// CURRENT (Lines 152-162) - checks ALL fields:
// const allFieldsDisabled = Object.keys(condition.when).every(
//   (fieldName) => fieldStates[fieldName]?.disabled === true
// );

// NEW - filters to only check state matcher fields:
// const fieldsWithStateMatchers = Object.entries(condition.when)
//   .filter(([, matcher]) => isFieldMatcher(matcher))
//   .map(([fieldName]) => fieldName);
//
// const allStateFieldsDisabled = fieldsWithStateMatchers.length > 0
//   ? fieldsWithStateMatchers.every(
//       (fieldName) => fieldStates[fieldName]?.disabled === true
//     )
//   : true; // No state matchers = vacuously true

// ============================================================================
// LOGIC EXPLANATION: How mixed matcher isDisabled works
// ============================================================================

// Example 1: All value matchers (vacuously true for isDisabled check)
// Condition: { when: { field1: 5, field2: "x" }, isDisabled: true }
// fieldStates: { field1: { disabled: false }, field2: { disabled: false } }
// fieldsWithStateMatchers: [] (no field state matchers)
// allStateFieldsDisabled: true (vacuously - empty list)
// Result: Condition matches (isDisabled check passes), field-level matchers checked

// Example 2: Mixed matchers with isDisabled: true
// Condition: { when: { field1: 5, field2: { isDisabled: true } }, isDisabled: true }
// fieldStates: { field1: { disabled: false }, field2: { disabled: true } }
// fieldsWithStateMatchers: ["field2"] (only field2 has a state matcher)
// allStateFieldsDisabled: true (field2 is disabled)
// Result: Condition matches (isDisabled check passes)

// Example 3: Mixed matchers with isDisabled: true, but state field is enabled
// Condition: { when: { field1: 5, field2: { isDisabled: true } }, isDisabled: true }
// fieldStates: { field1: { disabled: false }, field2: { disabled: false } }
// fieldsWithStateMatchers: ["field2"] (only field2 has a state matcher)
// allStateFieldsDisabled: false (field2 is NOT disabled)
// Result: Condition does NOT match (isDisabled check fails)

// Example 4: All state matchers with isDisabled: true
// Condition: { when: { field1: { isDisabled: true }, field2: { isDisabled: true } }, isDisabled: true }
// fieldStates: { field1: { disabled: true }, field2: { disabled: true } }
// fieldsWithStateMatchers: ["field1", "field2"] (both have state matchers)
// allStateFieldsDisabled: true (both are disabled)
// Result: Condition matches

// ============================================================================
// GOTCHA: Empty state matcher list handling
// ============================================================================

// When NO fields use field state matchers, the isDisabled check passes vacuously.
// This is CORRECT behavior - there are no state fields to fail the check.
// Example: { when: { age: 25, name: "John" }, isDisabled: true }
// fieldsWithStateMatchers: []
// allStateFieldsDisabled: true (empty list = vacuously true)
// The condition still needs to match the field-level value matchers.

// ============================================================================
// CRITICAL: Test patterns to follow
// ============================================================================

// From conditions.test.ts lines 464-536:
// - Use describe blocks for grouping related tests
// - Test both positive (match) and negative (no match) cases
// - Use descriptive test names
// - Include fieldStates when testing state matchers
// - Check specific result properties (disabled, visible, setValue)

// NEW TEST STRUCTURE:
describe("object when with top-level isDisabled and mixed matchers", () => {
  it("should handle all value matchers (vacuously true for isDisabled)", () => {
    // Test: { when: { field1: 5, field2: "x" }, isDisabled: true }
    // Expected: Matches (no state fields to check)
  });

  it("should only check fields with field state matchers", () => {
    // Test: { when: { field1: 5, field2: { isDisabled: true } }, isDisabled: true }
    // fieldStates: { field2: { disabled: true } }
    // Expected: Matches (only field2 checked)
  });

  it("should fail when state field is not disabled", () => {
    // Test: { when: { field1: 5, field2: { isDisabled: true } }, isDisabled: true }
    // fieldStates: { field2: { disabled: false } }
    // Expected: No match (field2 is not disabled)
  });
});
```

### Integration Points

```yaml
EVALUATE_CONDITIONS:
  - calls: evaluateConditionMatch for each condition
  - passes: fieldStates with disabled property
  - expects: ConditionResult with resolved disabled state
  - change: Now correctly handles mixed matchers in top-level isDisabled

USE_CONDITIONS_HOOK:
  - file: packages/react/src/hooks/useConditions.ts
  - uses: evaluateConditions from core package
  - provides: fieldStates with disabled property
  - benefit: Can now use mixed matchers with top-level isDisabled

FIELD_COMPONENT:
  - file: packages/react/src/components/Field.tsx
  - consumes: ConditionResult.disabled property
  - change: Can now use mixed matcher conditions

TEST_SUITE:
  - file: packages/core/src/__tests__/conditions.test.ts
  - tests: All condition evaluation scenarios
  - add: Tests for mixed matchers with top-level isDisabled
  - requires: All tests pass after implementation

TYPE_SYSTEM:
  - file: packages/core/src/types/conditions.ts
  - change: No type changes needed (FieldMatcher already supports this)
  - note: Type says Record<string, FieldMatcher> but runtime allows primitives
  - resolution: isFieldMatcher type guard handles the runtime distinction
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
pnpm typecheck                    # Type checking
pnpm lint --fix                   # Lint and auto-fix

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
# Test React integration (uses evaluateConditions)
pnpm test --filter @formality-ui/react Field.test.tsx -t "isDisabled"

# Test useConditions hook integration
pnpm test --filter @formality-ui/react useConditions.test.ts -v

# Test full react package
pnpm test --filter @formality-ui/react -v

# Expected: All integration tests pass, condition evaluation works correctly.
```

### Level 4: Cross-Framework Validation

```bash
# Test all packages for regressions
pnpm test -v

# Expected: All tests pass across all framework packages (react, svelte, vue).
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] isFieldMatcher type guard correctly identifies FieldMatcher objects
- [ ] Top-level isDisabled check filters to state matcher fields only
- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] No regressions in existing functionality

### Feature Validation

- [ ] Object `when` with all value matchers + `isDisabled: true` works (vacuously true)
- [ ] Object `when` with all state matchers + `isDisabled: true` works
- [ ] Object `when` with mixed matchers + `isDisabled: true` only checks state fields
- [ ] Object `when` with mixed matchers + `isDisabled: false` only checks state fields
- [ ] Field-level matchers still work correctly
- [ ] String `when` with `isDisabled` still works
- [ ] No breaking changes to the public API

### Code Quality Validation

- [ ] Code follows existing patterns and naming conventions
- [ ] Type guard follows TypeScript best practices
- [ ] Code is self-documenting with clear variable names
- [ ] Comments explain the mixed matcher behavior
- [ ] Tests cover positive and negative cases
- [ ] Edge cases handled (empty state matcher list)

### Documentation & Deployment

- [ ] Code comments are clear and informative
- [ ] Test names describe the scenario being tested
- [ ] No deployment changes needed (feature addition)

---

## Anti-Patterns to Avoid

- ❌ **Don't change the field matcher loop** - Keep lines 146-150 as-is
- ❌ **Don't break field-level isDisabled** - Per-field matchers must still work
- ❌ **Don't skip the fieldStates check** - Must handle undefined fieldStates
- ❌ **Don't use `==` for comparison** - Use strict `===` for boolean checks
- ❌ **Don't forget the empty list case** - Handle when no state matchers exist
- ❌ **Don't break backward compatibility** - All existing tests must pass
- ❌ **Don't use complex type narrowing** - Simple property check is sufficient
- ❌ **Don't over-engineer the type guard** - Check for any FieldMatcher property
- ❌ **Don't modify type definitions** - The types are correct as-is
- ❌ **Don't forget to return false on mismatch** - Must return false when isDisabled check fails

---

## Related Work Items

- **Previous**: P2.M1 - Disabled Property in Field States (Complete)
- **Previous**: P2.M1.T1.S3 - Handle circular dependency (Complete)
- **Previous**: P2.M2.T1.S1 - Move isDisabled outside string block (Complete)
- **Previous**: P2.M2.T1.S2 - Implement for object when (THIS ITEM - in parallel)
- **Current**: P2.M2.T1.S3 - Handle mixed matchers (THIS ITEM)
- **Future**: P2.M2.T2 - Add Tests for Multi-Field isDisabled (Planned)

---

## Contract Dependencies

### From P2.M2.T1.S2 - Implement for object when (In Parallel)

The P2.M2.T1.S2 PRP specifies that:

1. Top-level isDisabled check is added at lines 152-162 of evaluate.ts
2. The check uses `Object.keys(condition.when).every()` to check ALL fields
3. This doesn't account for mixed matchers

**This PRP's Contract**:

1. Refine the isDisabled check from P2.M2.T1.S2 to handle mixed matchers
2. Add isFieldMatcher type guard to distinguish value vs state matchers
3. Filter the fields to only check those with field state matchers
4. Handle the edge case of no state matchers (vacuously true)

**Integration Point**: P2.M2.T1.S2 adds the basic top-level isDisabled check. This PRP refines it to handle mixed matchers correctly. The two items can be worked in parallel, but this PRP assumes P2.M2.T1.S2 will be completed.

### From P2.M1 - Disabled Property in Field States (Complete)

The P2.M1 work items specify that:

1. FieldState.disabled property exists and is used by condition evaluation
2. Two-pass evaluation prevents circular dependencies
3. Tests verify isDisabled matcher works with string when conditions

**This PRP's Contract**:

1. Use the existing FieldState.disabled property
2. Work within the two-pass evaluation framework
3. Add tests for mixed matchers with top-level isDisabled
4. Don't modify the two-pass evaluation logic

**Integration Point**: The disabled property flow is already established. This PRP refines how it's checked for mixed matchers, without changing how the property flows through the system.

### To P2.M2.T2 - Add Tests for Multi-Field isDisabled (Planned)

The P2.M2.T2 work item will add comprehensive tests for multi-field isDisabled.

**This PRP's Contract**:

1. Add tests specifically for mixed matcher scenarios
2. Cover edge cases like all value matchers, all state matchers, and mixed
3. Provide test patterns for P2.M2.T2 to follow
4. Document expected behavior clearly

**Integration Point**: This PRP adds mixed matcher tests. P2.M2.T2 can build on these patterns for additional multi-field test coverage.

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:

- Well-scoped feature addition with clear requirements
- Exact file location and specific lines to modify
- Comprehensive understanding of current implementation
- All dependencies and constraints documented
- Clear success criteria and validation approach
- Known gotchas documented with solutions
- Anti-patterns identified to avoid
- Test patterns established from existing tests
- Type guard pattern is standard TypeScript practice

**Deduction**: -1 for potential edge cases in the isFieldMatcher type guard. The "in" operator check must be precise to avoid false positives. Empty arrays or objects without FieldMatcher properties must be handled correctly.

---

## References

### Internal Documentation

- [Condition Types](../../../../packages/core/src/types/conditions.ts) - Type definitions
- [Condition Evaluation](../../../../packages/core/src/conditions/evaluate.ts) - Implementation
- [Condition Tests](../../../../packages/core/src/__tests__/conditions.test.ts) - Test coverage
- [P2.M2.T1.S2 PRP](../P2M2T1S2/PRP.md) - Previous PRP for object when isDisabled
- [P2.M2.T1.S1 PRP](../P2M2T1S1/PRP.md) - Previous PRP for refactoring
- [P2.M1.T1.S3 PRP](../P2M1T1S3/PRP.md) - Two-pass evaluation implementation
- [useConditions Hook](../../../../packages/react/src/hooks/useConditions.ts) - Hook usage
- [Field Component](../../../../packages/react/src/components/Field.tsx) - Component integration

### External Documentation

- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) - Type guard patterns
- [Typeof operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof) - Type checking
- [In operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in) - Property existence check

### Example Code

- [Existing isDisabled Tests](../../../../packages/core/src/__tests__/conditions.test.ts) - Test patterns
- [evaluateFieldMatcher](../../../../packages/core/src/conditions/evaluate.ts) - Per-field handling
- [hasAnyMatcher Pattern](../../../../packages/core/src/conditions/evaluate.ts) - Property check pattern
