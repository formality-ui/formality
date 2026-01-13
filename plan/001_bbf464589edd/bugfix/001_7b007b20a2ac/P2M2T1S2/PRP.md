# PRP: Implement for object when

**Work Item**: P2.M2.T1.S2 - Implement for object when
**Parent Task**: P2.M2.T1 - Modify Condition Evaluation
**Parent Milestone**: P2.M2 - Multi-Field isDisabled Conditions
**Priority**: P2 (Major Issue)
**Story Points**: 2

---

## Goal

**Feature Goal**: Implement top-level `isDisabled` matcher support for object `when` conditions, enabling multi-field disabled state checks where a condition matches only when ALL fields in the object are disabled.

**Deliverable**:
1. Modified `evaluateConditionMatch` function in `/packages/core/src/conditions/evaluate.ts` to support `isDisabled` matcher with object `when` conditions
2. New logic that checks if ALL fields in the object `when` have `disabled: true` in their field states
3. Updated code comments to clarify the multi-field isDisabled behavior
4. Comprehensive tests for the new functionality

**Success Definition**:
- Object `when` conditions with top-level `isDisabled: true` match when ALL fields are disabled
- Object `when` conditions with top-level `isDisabled: false` match when ALL fields are enabled
- Field-level `isDisabled` in object `when` continues to work independently
- All existing tests pass without modification
- No breaking changes to the public API

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Enable complex multi-field disabled conditions where an action should only occur when multiple fields are all in the same disabled state.

**User Journey**:
1. Developer defines a condition with object `when` and top-level `isDisabled`
2. Condition evaluation checks if ALL fields in the object are disabled
3. If all fields match the disabled state requirement, the condition's action is applied

**Pain Points Addressed**:
- Previously, top-level `isDisabled` only worked with string `when` (single field)
- No way to check "all fields must be disabled" without complex nested conditions
- Inconsistent behavior between string and object `when` for state matchers

---

## Why

- **Feature Parity**: Top-level `isDisabled` currently works with string `when` but not object `when`, creating an API inconsistency
- **Common Use Case**: Forms often need to disable fields based on multiple other fields all being disabled (e.g., "disable submit when all required fields are disabled")
- **Bug Reference**: Related to Bug #4 (isDisabled multi-field) - this implements the core multi-field isDisabled check
- **Consistency**: Aligns object `when` behavior with the capabilities already present for string `when`

---

## What

Add support for top-level `isDisabled` matcher in object `when` conditions.

### Current State

**Current Implementation (Lines 143-151 of evaluate.ts)**:
```typescript
// Handle multi-field 'when' (object form)
if (condition.when !== undefined && typeof condition.when === "object") {
  // All field conditions must match (AND logic)
  for (const [fieldName, matcher] of Object.entries(condition.when)) {
    if (!evaluateFieldMatcher(fieldName, matcher, fieldValues, fieldStates)) {
      return false;
    }
  }
  return true;
}
```

**Current Behavior**:
- Object `when` with field-level `isDisabled`: ✅ Works
  ```typescript
  { when: { field1: { isDisabled: true }, field2: { is: "x" } } }
  ```
- Object `when` with top-level `isDisabled`: ❌ Not supported
  ```typescript
  { when: { field1: { ... }, field2: { ... } }, isDisabled: true }
  ```

**String `when` with top-level `isDisabled`**: ✅ Works
```typescript
{ when: "field1", isDisabled: true, disabled: true }
```

### Desired State

**New Implementation**:
After the object `when` field matcher loop, add a check for top-level `isDisabled`:

```typescript
// Handle multi-field 'when' (object form)
if (condition.when !== undefined && typeof condition.when === "object") {
  // All field conditions must match (AND logic)
  for (const [fieldName, matcher] of Object.entries(condition.when)) {
    if (!evaluateFieldMatcher(fieldName, matcher, fieldValues, fieldStates)) {
      return false;
    }
  }

  // NEW: Check top-level isDisabled matcher for object when
  if (condition.isDisabled !== undefined && fieldStates) {
    const allFieldsDisabled = Object.keys(condition.when).every(
      (fieldName) => fieldStates[fieldName]?.disabled === true
    );
    if (condition.isDisabled !== allFieldsDisabled) {
      return false;
    }
  }

  return true;
}
```

**New Behavior**:
- Object `when` with field-level `isDisabled`: ✅ Still works
- Object `when` with top-level `isDisabled`: ✅ Now supported
  ```typescript
  { when: { field1: { ... }, field2: { ... } }, isDisabled: true }
  ```
  - Matches only when ALL fields (field1, field2) have `disabled: true`

### Success Criteria

- [ ] Object `when` with top-level `isDisabled: true` matches when all fields are disabled
- [ ] Object `when` with top-level `isDisabled: false` matches when all fields are enabled
- [ ] Object `when` with top-level `isDisabled: false` fails when any field is disabled
- [ ] Field-level `isDisabled` in object `when` continues to work
- [ ] String `when` with `isDisabled` continues to work
- [ ] All existing tests pass without modification
- [ ] New tests cover the new functionality

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:
- Exact file location and line numbers for the code to modify
- Complete context on the current implementation and its limitations
- Clear explanation of the logic to add with code examples
- All test patterns and validation commands
- Specific examples of expected behavior
- Integration points and dependencies
- Known gotchas and anti-patterns to avoid

### Documentation & References

```yaml
# MUST READ - Core implementation file

# TARGET FILE - Modify this function
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Main condition evaluation logic - contains the code to modify
  exact: Lines 143-151 (object when handling in evaluateConditionMatch)
  pattern: Follow existing function structure and error handling
  critical: After line 150 (after field matcher loop), add top-level isDisabled check

# FIELD MATCHER FUNCTION - For reference on per-field isDisabled handling
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Shows how isDisabled is handled per-field in evaluateFieldMatcher
  exact: Lines 59-115 (evaluateFieldMatcher function)
  pattern: isDisabled check at lines 78-84 for per-field validation
  critical: fieldState?.disabled ?? false (defaults to false for missing state)

# FIELD STATE TYPE - Understand the data structure
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: FieldStateInput interface defines what state is available
  exact: Lines 20-28 (FieldStateInput interface)
  pattern: Includes disabled, invalid, error properties
  critical: disabled property is optional (defaults to false)

# TYPE DEFINITIONS - Understand ConditionDescriptor structure
- file: /home/dustin/projects/formality/packages/core/src/types/conditions.ts
  why: Type definitions show ConditionDescriptor and FieldMatcher
  exact: Lines 44-130 (ConditionDescriptor interface)
  pattern: Top-level isDisabled at lines 86-91 (requires 'when' trigger)
  critical: Object when with top-level matchers should be supported

# TEST FILE - Understand expected behavior and test patterns
- file: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  why: Contains all tests for condition evaluation
  exact: Lines 464-498 (existing multi-field isDisabled test with field-level matcher)
  pattern: Tests show field-level isDisabled in object when
  critical: No tests for top-level isDisabled with object when yet

# PREVIOUS PRP - Understanding the refactoring
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M2T1S1/PRP.md
  why: Previous PRP that refactored isDisabled outside string block
  contract: Assumes field state matcher checks are clearer after refactoring
  critical: Shows design intent for why isDisabled was restricted to string when

# PREVIOUS WORK - useConditions hook integration
- file: /home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts
  why: Shows how fieldStates are built with disabled property
  exact: Lines 104-186 (two-pass evaluation implementation)
  pattern: Pass 1 builds states without disabled, Pass 2 adds disabled
  critical: Two-pass evaluation prevents circular dependency infinite loops
```

### Current Codebase tree (core package conditions)

```bash
packages/core/src/
├── conditions/
│   ├── evaluate.ts                 # ← TARGET: Modify evaluateConditionMatch function
│   │   ├── Lines 20-28: FieldStateInput interface
│   │   ├── Lines 59-115: evaluateFieldMatcher function
│   │   ├── Lines 143-151: Object when handling (MODIFY THIS - add top-level isDisabled check)
│   │   ├── Lines 177-199: Field state matchers (string when only)
│   │   └── Lines 244-325: evaluateConditions function
│   └── [no other files in this directory]
├── types/
│   └── conditions.ts               # Type definitions for conditions
│       ├── Lines 12-27: FieldMatcher interface
│       ├── Lines 44-130: ConditionDescriptor interface
│       └── Lines 79-91: isValid and isDisabled documentation
└── __tests__/
    ├── conditions.test.ts          # Tests for condition evaluation
    │   ├── Lines 464-498: Multi-field with field-level isDisabled
    │   └── [ADD NEW TESTS HERE]
    └── [other test files]
```

### Desired Codebase tree with files to be modified

```bash
packages/core/src/conditions/
├── evaluate.ts                     # ← MODIFY: Add top-level isDisabled check for object when
│   ├── evaluateConditionMatch function:
│   │   ├── Lines 143-151: Object when handling (MODIFY - add after line 150)
│   │   │   └── ADD: Top-level isDisabled check after field matcher loop
│   │   │       ```typescript
│   │   │       // Check top-level isDisabled matcher
│   │   │       if (condition.isDisabled !== undefined && fieldStates) {
│   │   │         const allFieldsDisabled = Object.keys(condition.when).every(
│   │   │           (fieldName) => fieldStates[fieldName]?.disabled === true
│   │   │         );
│   │   │         if (condition.isDisabled !== allFieldsDisabled) {
│   │   │           return false;
│   │   │         }
│   │   │       }
│   │   │       ```
│   │   ├── Lines 177-199: Field state matchers (UNCHANGED)
│   │   └── [REST UNCHANGED]
│   └── [NO OTHER CHANGES]

packages/core/src/__tests__/
├── conditions.test.ts              # ← MODIFY: Add tests for top-level isDisabled
│   ├── [EXISTING TESTS UNCHANGED]
│   └── ADD NEW DESCRIBE BLOCK:
│       └── describe("object when with top-level isDisabled", () => {
│           ├── it("should match when all fields are disabled (isDisabled: true)")
│           ├── it("should not match when any field is enabled (isDisabled: true)")
│           ├── it("should match when all fields are enabled (isDisabled: false)")
│           ├── it("should not match when any field is disabled (isDisabled: false)")
│           ├── it("should handle missing fieldStates gracefully")
│           └── it("should combine with field-level matchers")
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Top-level vs field-level isDisabled in object when
// These are DIFFERENT and serve different purposes:

// FIELD-LEVEL isDisabled (already works):
// { when: { field1: { isDisabled: true }, field2: { is: "x" } } }
// Meaning: field1 must be disabled AND field2 must equal "x"

// TOP-LEVEL isDisabled (NEW - this PRP):
// { when: { field1: { ... }, field2: { ... } }, isDisabled: true }
// Meaning: All fields (field1, field2) must be disabled for condition to match

// GOTCHA: Top-level isDisabled requires ALL fields to be disabled
// If ANY field is enabled, the condition does NOT match

// CRITICAL: fieldStates parameter is optional
// If fieldStates is undefined, the condition should NOT match when isDisabled is defined
// Pattern: Check `if (condition.isDisabled !== undefined && fieldStates)`

// GOTCHA: fieldState?.disabled defaults to false if undefined
// Use `fieldStates[fieldName]?.disabled === true` for strict true check
// Use `fieldStates[fieldName]?.disabled ?? false` for false default

// CRITICAL: Two-pass evaluation for circular dependencies
// Pass 1: Build fieldStates WITHOUT disabled property
// Pass 2: Compute disabled using Pass 1 states
// This prevents: A.disabled → B.disabled → A.disabled (infinite loop)
// The new code works within this existing pattern

// GOTCHA: Backward compatibility requirement
// All existing tests must pass without modification
// No breaking changes to the public API
// Field-level isDisabled in object when must continue to work

// CRITICAL: The logic is AFTER the field matcher loop
// First check if all field-level matchers pass (lines 146-150)
// THEN check if all fields are disabled (new code after line 150)
// Both must pass for the condition to match

// GOTCHA: Interaction between field-level and top-level isDisabled
// { when: { field1: { isDisabled: false }, field2: { isDisabled: false } }, isDisabled: true }
// This is a CONTRADICTION and will never match (field-level says not disabled, top-level says disabled)
// This is expected behavior - both checks must pass

// CRITICAL: Test coverage
// conditions.test.ts has comprehensive tests for field-level isDisabled
// New tests should follow the same patterns
// Test both positive and negative cases
// Test with missing fieldStates
```

---

## Implementation Blueprint

### Data models and structure

**No new data models needed** - this PRP uses existing data structures.

**Existing Data Structures**:
```typescript
// FieldStateInput - Field state with metadata
interface FieldStateInput {
  value: unknown;
  isTouched?: boolean;
  isDirty?: boolean;
  isValidating?: boolean;
  error?: unknown;
  invalid?: boolean;
  disabled?: boolean;  // The property we're checking
}

// ConditionDescriptor - Condition definition
interface ConditionDescriptor {
  when?: string | WhenMultiField;  // Trigger: string or object
  selectWhen?: SelectValue<boolean>;  // Expression trigger
  is?: unknown;  // Value matcher
  truthy?: boolean;  // Truthy matcher
  isValid?: boolean;  // Field state matcher (requires string when)
  isDisabled?: boolean;  // Field state matcher (NEW: now supports object when)
  disabled?: boolean;  // Action to apply when matched
  visible?: boolean;  // Action to apply when matched
  set?: unknown;  // Action to set value
  selectSet?: SelectValue;  // Action to set value from expression
}

// WhenMultiField - Object when with field-level matchers
type WhenMultiField = Record<string, FieldMatcher>;

// FieldMatcher - Per-field matchers in object when
interface FieldMatcher {
  is?: unknown;
  truthy?: boolean;
  isTruthy?: boolean;
  isValid?: boolean;
  isDisabled?: boolean;  // Field-level isDisabled (already works)
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ and UNDERSTAND current implementation
  - FILE: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  - READ: Lines 143-151 (object when handling)
  - READ: Lines 59-115 (evaluateFieldMatcher function)
  - UNDERSTAND: Current flow of object when condition matching
  - UNDERSTAND: How field-level isDisabled works in evaluateFieldMatcher
  - OUTPUT: Clear understanding of current implementation

Task 2: PLAN the implementation approach
  - DECIDE: Where to insert the new top-level isDisabled check
  - DECIDE: How to handle missing fieldStates (should not match)
  - DECIDE: How to check if ALL fields are disabled
  - CONSTRAINT: Must preserve exact backward compatibility
  - CONSTRAINT: Must not break field-level isDisabled
  - OUTPUT: Detailed implementation plan

Task 3: IMPLEMENT the top-level isDisabled check
  - FILE: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  - MODIFY: Lines 143-151 (object when handling block)
  - ADD: After line 150 (after field matcher loop)
  - CODE: |
    // Check top-level isDisabled matcher for object when
    if (condition.isDisabled !== undefined && fieldStates) {
      const allFieldsDisabled = Object.keys(condition.when).every(
        (fieldName) => fieldStates[fieldName]?.disabled === true
      );
      if (condition.isDisabled !== allFieldsDisabled) {
        return false;
      }
    }
  - PRESERVE: All existing logic and behavior
  - PRESERVE: Field matcher loop at lines 146-150
  - PATTERN: Follow existing isDisabled check pattern from lines 193-198
  - NAMING: Use descriptive variable names (allFieldsDisabled)

Task 4: VERIFY all existing tests pass
  - COMMAND: pnpm test --filter @formality-ui/core conditions.test.ts
  - VERIFY: All existing tests pass
  - VERIFY: No regressions in condition evaluation
  - VERIFY: Field-level isDisabled still works
  - VERIFY: String when with isDisabled still works
  - EXPECTED: Zero test failures
  - IF_FAILURES: Debug and fix implementation

Task 5: ADD tests for top-level isDisabled with object when
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  - ADD: New describe block for object when with top-level isDisabled
  - FOLLOW: Test patterns from lines 464-498 (existing multi-field tests)
  - TEST CASES:
    - All fields disabled with isDisabled: true → match
    - One field enabled with isDisabled: true → no match
    - All fields enabled with isDisabled: false → match
    - One field disabled with isDisabled: false → no match
    - Missing fieldStates with isDisabled → no match
    - Combine with field-level matchers → both must pass
  - COVERAGE: Positive and negative cases
  - PLACEMENT: After existing multi-field tests (after line 498)

Task 6: RUN full test suite
  - COMMAND: pnpm test
  - VERIFY: All tests across all packages pass
  - VERIFY: No breaking changes in react package
  - VERIFY: No breaking changes in other framework packages
  - EXPECTED: Zero test failures
  - IF_FAILURES: Debug and fix implementation

Task 7: UPDATE code comments if needed
  - FILE: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  - REVIEW: Comments in evaluateConditionMatch function
  - UPDATE: Add comment explaining top-level isDisabled for object when
  - UPDATE: Document the multi-field isDisabled behavior
  - OUTPUT: Clear, well-documented code
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Top-level isDisabled for object when conditions
// ============================================================================

// CURRENT IMPLEMENTATION (Lines 143-151):
// Handle multi-field 'when' (object form)
if (condition.when !== undefined && typeof condition.when === "object") {
  // All field conditions must match (AND logic)
  for (const [fieldName, matcher] of Object.entries(condition.when)) {
    if (!evaluateFieldMatcher(fieldName, matcher, fieldValues, fieldStates)) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// NEW IMPLEMENTATION: Add top-level isDisabled check
// ============================================================================

// Insert AFTER line 150 (after the for loop):
// Handle multi-field 'when' (object form)
if (condition.when !== undefined && typeof condition.when === "object") {
  // All field conditions must match (AND logic)
  for (const [fieldName, matcher] of Object.entries(condition.when)) {
    if (!evaluateFieldMatcher(fieldName, matcher, fieldValues, fieldStates)) {
      return false;
    }
  }

  // Check top-level isDisabled matcher for object when
  // When isDisabled: true, ALL fields must be disabled for condition to match
  // When isDisabled: false, ALL fields must be enabled for condition to match
  if (condition.isDisabled !== undefined && fieldStates) {
    const allFieldsDisabled = Object.keys(condition.when).every(
      (fieldName) => fieldStates[fieldName]?.disabled === true
    );
    if (condition.isDisabled !== allFieldsDisabled) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// LOGIC EXPLANATION: How top-level isDisabled works
// ============================================================================

// Example 1: isDisabled: true (all fields must be disabled)
// Condition: { when: { field1: { ... }, field2: { ... } }, isDisabled: true, disabled: true }
// fieldStates: { field1: { disabled: true }, field2: { disabled: true } }
// Result: Condition matches (allFieldsDisabled = true), field is disabled

// Example 2: isDisabled: true but one field is enabled
// Condition: { when: { field1: { ... }, field2: { ... } }, isDisabled: true, disabled: true }
// fieldStates: { field1: { disabled: true }, field2: { disabled: false } }
// Result: Condition does NOT match (allFieldsDisabled = false), no action taken

// Example 3: isDisabled: false (all fields must be enabled)
// Condition: { when: { field1: { ... }, field2: { ... } }, isDisabled: false, set: "ready" }
// fieldStates: { field1: { disabled: false }, field2: { disabled: false } }
// Result: Condition matches (allFieldsDisabled = false), value is set

// Example 4: isDisabled: false but one field is disabled
// Condition: { when: { field1: { ... }, field2: { ... } }, isDisabled: false, set: "ready" }
// fieldStates: { field1: { disabled: false }, field2: { disabled: true } }
// Result: Condition does NOT match (allFieldsDisabled = true), no action taken

// ============================================================================
// GOTCHA: Missing fieldStates handling
// ============================================================================

// When fieldStates is undefined or a field is missing:
// fieldStates[fieldName]?.disabled === undefined
// The .every() check will fail (undefined !== true)
// This is CORRECT behavior - without state info, can't verify disabled status

// Example with missing fieldStates:
// Condition: { when: { field1: { ... }, field2: { ... } }, isDisabled: true }
// fieldStates: undefined
// Result: Condition does NOT match (fieldStates check fails)

// ============================================================================
// CRITICAL: Interaction with field-level isDisabled
// ============================================================================

// Field-level isDisabled (per-field check):
// { when: { field1: { isDisabled: true }, field2: { isDisabled: false } } }
// Meaning: field1 must be disabled AND field2 must be enabled

// Top-level isDisabled (all-fields check):
// { when: { field1: { ... }, field2: { ... } }, isDisabled: true }
// Meaning: All fields must be disabled

// COMBINED (both must pass):
// { when: { field1: { isDisabled: true }, field2: { is: "x" } }, isDisabled: true }
// Meaning: field1 must be disabled AND field2 must equal "x" AND all fields must be disabled

// ============================================================================
// TEST PATTERNS to follow
// ============================================================================

// From conditions.test.ts lines 464-498:
// Use describe blocks for grouping related tests
// Test both positive (match) and negative (no match) cases
// Use descriptive test names
// Include fieldStates when testing state matchers
// Check specific result properties (disabled, visible, setValue)
```

### Integration Points

```yaml
EVALUATE_CONDITIONS:
  - calls: evaluateConditionMatch for each condition
  - passes: fieldStates with disabled property
  - expects: ConditionResult with resolved disabled state
  - change: Now supports top-level isDisabled with object when

USE_CONDITIONS_HOOK:
  - file: packages/react/src/hooks/useConditions.ts
  - uses: evaluateConditions from core package
  - provides: fieldStates with disabled property
  - implements: Two-pass evaluation for circular dependencies
  - benefit: Can now use top-level isDisabled with object when

FIELD_COMPONENT:
  - file: packages/react/src/components/Field.tsx
  - consumes: ConditionResult.disabled property
  - priority: Third highest (prop > config > condition > group)
  - change: Can now use multi-field isDisabled conditions

TEST_SUITE:
  - file: packages/core/src/__tests__/conditions.test.ts
  - tests: All condition evaluation scenarios
  - add: Tests for top-level isDisabled with object when
  - requires: All tests pass after implementation
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
pnpm test --filter @formality-ui/core conditions.test.ts -t "object when with top-level isDisabled"

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
- [ ] Modified code follows existing patterns
- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] No regressions in existing functionality

### Feature Validation

- [ ] Object `when` with top-level `isDisabled: true` works
- [ ] Object `when` with top-level `isDisabled: false` works
- [ ] Field-level `isDisabled` in object `when` still works
- [ ] String `when` with `isDisabled` still works
- [ ] Missing fieldStates handled gracefully
- [ ] No breaking changes to the public API

### Code Quality Validation

- [ ] Code follows existing patterns and naming conventions
- [ ] File placement matches desired codebase tree structure
- [ ] Code is self-documenting with clear variable names
- [ ] Comments explain the multi-field isDisabled behavior
- [ ] Tests cover positive and negative cases

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
- ❌ **Don't forget to check all fields** - Use `.every()` to verify ALL fields
- ❌ **Don't break backward compatibility** - All existing tests must pass
- ❌ **Don't add the check in the wrong place** - Must be after line 150, after field matcher loop
- ❌ **Don't forget to return false on mismatch** - Must return false when isDisabled check fails
- ❌ **Don't modify type definitions** - The types are correct as-is
- ❌ **Don't over-engineer** - Simple check for all fields disabled/enabled

---

## Related Work Items

- **Previous**: P2.M1 - Disabled Property in Field States (Complete)
- **Previous**: P2.M1.T1.S3 - Handle circular dependency (Complete)
- **Previous**: P2.M2.T1.S1 - Move isDisabled outside string block (Complete)
- **Current**: P2.M2.T1.S2 - Implement for object when (THIS ITEM)
- **Future**: P2.M2.T1.S3 - Handle mixed matchers (Planned)
- **Future**: P2.M2.T2 - Add Tests for Multi-Field isDisabled (Planned)

---

## Contract Dependencies

### From P2.M2.T1.S1 - Move isDisabled Outside String Block (Complete)

The P2.M2.T1.S1 PRP specifies that:
1. Field state matcher checks are clearer after refactoring
2. isDisabled is positioned for better code flow
3. The refactoring clarifies the design intent
4. String when with isDisabled works exactly as before

**This PRP's Contract**:
1. Build upon the clearer code structure from P2.M2.T1.S1
2. Add top-level isDisabled support for object when
3. Maintain the same isDisabled check pattern as string when
4. Follow the established code patterns from the refactoring

**Integration Point**: The previous PRP made the code more maintainable. This PRP adds the new feature using the established patterns, making it easier to understand and maintain.

### From P2.M1 - Disabled Property in Field States (Complete)

The P2.M1 work items specify that:
1. FieldState.disabled property exists and is used by condition evaluation
2. Two-pass evaluation prevents circular dependencies
3. Tests verify isDisabled matcher works with string when conditions

**This PRP's Contract**:
1. Use the existing FieldState.disabled property
2. Work within the two-pass evaluation framework
3. Add tests for top-level isDisabled with object when
4. Don't modify the two-pass evaluation logic

**Integration Point**: The disabled property flow is already established. This PRP adds a new way to check that property (all fields must be disabled), without changing how the property flows through the system.

### To P2.M2.T1.S3 - Handle Mixed Matchers (Planned)

The P2.M2.T1.S3 work item will handle mixed matchers in object when conditions.

**This PRP's Contract**:
1. Implement the basic top-level isDisabled check
2. Focus on the all-fields-disabled/enabled logic
3. Don't handle complex mixed scenarios (that's P2.M2.T1.S3)
4. Provide the foundation for future enhancements

**Integration Point**: This PRP establishes the pattern for top-level matchers with object when. The next work item can build on this pattern for more complex scenarios.

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

**Deduction**: -1 for potential edge cases in handling missing fieldStates or undefined disabled values. The interaction between field-level and top-level isDisabled must be carefully tested to avoid unexpected behavior.

---

## References

### Internal Documentation

- [Condition Types](../../../../packages/core/src/types/conditions.ts) - Type definitions
- [Condition Evaluation](../../../../packages/core/src/conditions/evaluate.ts) - Implementation
- [Condition Tests](../../../../packages/core/src/__tests__/conditions.test.ts) - Test coverage
- [P2.M2.T1.S1 PRP](../P2M2T1S1/PRP.md) - Previous PRP for refactoring
- [P2.M1.T1.S3 PRP](../P2M1T1S3/PRP.md) - Two-pass evaluation implementation
- [P2.M1.T3.S3 PRP](../P2M1T3S3/PRP.md) - Tests for disabled from conditions
- [useConditions Hook](../../../../packages/react/src/hooks/useConditions.ts) - Hook usage
- [Field Component](../../../../packages/react/src/components/Field.tsx) - Component integration

### External Documentation

No external documentation needed - this is an internal feature addition building on existing patterns.

### Example Code

- [Existing isDisabled Tests](../../../../packages/core/src/__tests__/conditions.test.ts) - Test patterns
- [evaluateFieldMatcher](../../../../packages/core/src/conditions/evaluate.ts) - Per-field handling
- [Two-Pass Evaluation](../../../../packages/react/src/hooks/useConditions.ts) - Circular dependency resolution
