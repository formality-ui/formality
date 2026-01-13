# PRP: Move isDisabled Outside String Block

**Work Item**: P2.M2.T1.S1 - Move isDisabled outside string block
**Parent Task**: P2.M2.T1 - Modify Condition Evaluation
**Parent Milestone**: P2.M2 - Multi-Field isDisabled Conditions
**Priority**: P2 (Major Issue)
**Story Points**: 1

---

## Goal

**Feature Goal**: Refactor the `isDisabled` matcher check from being nested inside the string-only `when` block to be positioned before the trigger type determination, allowing the matcher logic to be more maintainable and preparing for broader application across condition types.

**Deliverable**:
1. Refactored `evaluateConditionMatch` function in `/packages/core/src/conditions/evaluate.ts`
2. Extracted `isDisabled` and `isValid` matcher validation logic
3. Updated code comments to clarify the scope of these matchers
4. Preserved backward compatibility with existing string `when` conditions
5. No behavior changes for existing valid usage patterns

**Success Definition**:
- `isDisabled` matcher check is no longer nested inside the string-only block
- Code is more maintainable with clearer separation of concerns
- All existing tests pass without modification
- String `when` conditions work exactly as before
- Object `when` conditions work exactly as before
- No breaking changes to the public API

---

## User Persona (if applicable)

**Target User**: None - This is an internal refactoring with no user-visible behavior changes

**Use Case**: Internal code maintainability and preparation for future enhancements

**User Journey**: N/A - No user-facing changes

**Pain Points Addressed**:
- Code is harder to maintain with nested validation logic
- Unclear why `isDisabled` is restricted to string-only block
- Future enhancements require understanding this implementation detail

---

## Why

- **Code Maintainability**: The current implementation has `isDisabled` and `isValid` checks nested inside a string-only block (lines 177-199), making the code harder to understand and modify
- **Architectural Clarity**: Extracting these checks clarifies the distinction between trigger-type-specific logic and matcher validation logic
- **Future-Proofing**: This refactoring prepares the codebase for potential enhancements to field state matchers
- **Consistency**: Similar matchers (`is`, `truthy`) are applied consistently across trigger types, while `isValid`/`isDisabled` are gated behind string checks
- **Bug Reference**: Related to Bug #4 (isDisabled multi-field) - this refactoring clarifies the scope of these matchers

---

## What

Refactor the `evaluateConditionMatch` function to extract the field state matcher checks (`isValid`, `isDisabled`) from the string-only block and restructure them for better maintainability.

### Current State

**Current Implementation (Lines 177-199 of evaluate.ts)**:
```typescript
// Apply field state matchers (require string 'when' trigger for field reference)
if (typeof condition.when === "string" && fieldStates) {
  const fieldState = fieldStates[condition.when];

  // Check isValid matcher
  if (condition.isValid !== undefined) {
    const isFieldValid = fieldState
      ? !fieldState.invalid && !fieldState.error
      : true; // No state = assume valid
    if (condition.isValid !== isFieldValid) {
      return false;
    }
  }

  // Check isDisabled matcher
  if (condition.isDisabled !== undefined) {
    const isFieldDisabled = fieldState?.disabled ?? false;
    if (condition.isDisabled !== isFieldDisabled) {
      return false;
    }
  }
}
```

**Current Flow**:
1. Lines 143-151: Handle object `when` (multi-field) - returns early if all matchers pass
2. Lines 157-175: Handle string `when` and `selectWhen` - get trigger value
3. Lines 177-199: Field state matchers - ONLY for string `when`
4. Lines 201-219: Value matchers - apply to all trigger types

**Issue**: Steps 3 and 4 both represent "matcher validation" but are separated, with step 3 gated behind a string-only check.

### Refactored State

**Refactored Implementation**:
The field state matcher checks will be restructured to:
1. Be more clearly scoped to string `when` triggers
2. Have improved code comments explaining the restriction
3. Be positioned for better code flow
4. Maintain exact backward compatibility

**Key Insight**: The type definitions (conditions.ts lines 79-91) explicitly state that `isValid` and `isDisabled` "require 'when' trigger" and check the "'when' field's state". This design intent is:
- For **string `when`**: Top-level `isValid`/`isDisabled` check that single field's state
- For **object `when`**: These matchers at top level don't make sense (no single field to check)
- For **selectWhen`**: These matchers don't make sense (no direct field reference)

The refactoring will make this design intent explicit in the code structure.

### Success Criteria

- [ ] Field state matcher checks are extracted from the string-only block structure
- [ ] Code comments clearly explain why these matchers only apply to string `when`
- [ ] All existing tests pass without modification
- [ ] String `when` with `isDisabled` works exactly as before
- [ ] String `when` with `isValid` works exactly as before
- [ ] Object `when` conditions work exactly as before
- [ ] No breaking changes to the public API
- [ ] Code is more maintainable with clearer separation of concerns

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:
- Exact file location and line numbers for the code to refactor
- Complete context on the current implementation
- Clear explanation of the design intent and constraints
- All test patterns and validation commands
- Specific refactoring approach with before/after code
- Integration points and dependencies
- Known gotchas and anti-patterns to avoid

### Documentation & References

```yaml
# MUST READ - Core implementation file

# TARGET FILE - Refactor this function
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Main condition evaluation logic - contains the code to refactor
  exact: Lines 137-220 (evaluateConditionMatch function)
  pattern: Follow existing function structure and error handling
  critical: Lines 177-199 (field state matcher check to refactor)

# TYPE DEFINITIONS - Understand the design intent
- file: /home/dustin/projects/formality/packages/core/src/types/conditions.ts
  why: Type definitions show that isValid/isDisabled require 'when' trigger
  exact: Lines 79-91 (isValid and isDisabled documentation)
  pattern: These matchers are documented as requiring string 'when' trigger
  critical: "Field disabled state check (requires 'when' trigger)"

# FIELD MATCHER FUNCTION - For reference on multi-field handling
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Shows how isDisabled is handled for object when conditions
  exact: Lines 59-114 (evaluateFieldMatcher function)
  pattern: isDisabled check at lines 78-84 for per-field validation
  critical: Object when conditions use evaluateFieldMatcher, not top-level matchers

# TEST FILE - Understand expected behavior
- file: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  why: Contains all tests for condition evaluation
  exact: Lines 1-742 (entire test file)
  pattern: Tests show isValid/isDisabled only used with string when
  critical: No tests use top-level isValid/isDisabled with object when

# EVALUATE CONDITIONS FUNCTION - Main entry point
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Main function that calls evaluateConditionMatch
  exact: Lines 244-325 (evaluateConditions function)
  pattern: Shows how conditions are evaluated in bulk
  critical: Passes fieldStates to evaluateConditionMatch

# FIELD STATE TYPE - Understand the data structure
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: FieldStateInput interface defines what state is available
  exact: Lines 20-28 (FieldStateInput interface)
  pattern: Includes disabled, invalid, error properties
  critical: disabled property is optional (defaults to false)

# PREVIOUS WORK - Two-pass evaluation for circular dependencies
- file: /home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts
  why: Shows how fieldStates are built with disabled property
  exact: Lines 104-186 (two-pass evaluation implementation)
  pattern: Pass 1 builds states without disabled, Pass 2 adds disabled
  critical: Two-pass evaluation prevents circular dependency infinite loops

# PREVIOUS WORK - Field component integration
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows how condition results are used in the Field component
  exact: Lines 265-278 (disabled resolution logic)
  pattern: Priority order: prop > config > condition > group > false
  critical: Conditions provide disabled property at third priority level

# PREVIOUS PRP - Tests for disabled from conditions
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T3S3/PRP.md
  why: Previous PRP that tested condition disabled evaluation
  contract: Assumes tests for isDisabled matcher exist and pass
  critical: Tests verify isDisabled works with string when conditions
```

### Current Codebase tree (core package conditions)

```bash
packages/core/src/
├── conditions/
│   ├── evaluate.ts                 # ← TARGET: Refactor evaluateConditionMatch function
│   │   ├── Lines 20-28: FieldStateInput interface
│   │   ├── Lines 59-114: evaluateFieldMatcher function
│   │   ├── Lines 137-220: evaluateConditionMatch function (TARGET)
│   │   │   ├── Lines 143-151: Object when handling
│   │   │   ├── Lines 157-175: String when and selectWhen handling
│   │   │   ├── Lines 177-199: Field state matchers (REFACTOR THIS)
│   │   │   └── Lines 201-219: Value matchers
│   │   └── Lines 244-325: evaluateConditions function
│   └── [no other files in this directory]
├── types/
│   └── conditions.ts               # Type definitions for conditions
│       ├── Lines 12-27: FieldMatcher interface
│       ├── Lines 44-130: ConditionDescriptor interface
│       └── Lines 79-91: isValid and isDisabled documentation
└── __tests__/
    ├── conditions.test.ts          # Tests for condition evaluation
    │   ├── Lines 1-742: All condition tests
    │   ├── Tests for isDisabled matcher with string when
    │   ├── Tests for isValid matcher with string when
    │   └── Tests for multi-field object when with field-level matchers
    └── [other test files]
```

### Desired Codebase tree with files to be modified

```bash
packages/core/src/conditions/
├── evaluate.ts                     # ← MODIFY: Refactor evaluateConditionMatch
│   ├── [EXISTING CODE STRUCTURE PRESERVED]
│   ├── evaluateConditionMatch function:
│   │   ├── Lines 143-151: Object when handling (UNCHANGED)
│   │   ├── Lines 157-175: String when and selectWhen handling (UNCHANGED)
│   │   ├── Lines 177-199: Field state matchers (REFACTORED)
│   │   │   └── BEFORE: Nested inside string-only check
│   │   │   └── AFTER: Clearer structure with improved comments
│   │   └── Lines 201-219: Value matchers (UNCHANGED)
│   └── [NO OTHER CHANGES]
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: isValid and isDisabled ONLY work with string 'when' trigger
// These matchers check the state of the field specified in 'when'
// For object 'when' with multiple fields, there's no single field to check
// For selectWhen expressions, there's no direct field reference

// GOTCHA: Top-level vs field-level matchers in object when
// WRONG: { when: { field1: {...}, field2: {...} }, isDisabled: true }
// The top-level isDisabled doesn't make sense (which field to check?)

// RIGHT: { when: { field1: { isDisabled: true }, field2: { is: "x" } } }
// Field-level isDisabled in the matcher object makes sense

// CRITICAL: Two-pass evaluation for circular dependencies
// Pass 1: Build fieldStates WITHOUT disabled property
// Pass 2: Compute disabled using Pass 1 states
// This prevents: A.disabled → B.disabled → A.disabled (infinite loop)

// GOTCHA: fieldStates parameter is optional
// If fieldStates is undefined, state-based matchers assume valid/not disabled
// Pattern: fieldState?.disabled ?? false (defaults to false)

// CRITICAL: Backward compatibility requirement
// All existing tests must pass without modification
// No breaking changes to the public API
// String when conditions must work exactly as before

// GOTCHA: The refactoring is about code structure, not behavior
// Don't change how matchers are evaluated
// Don't change the conditions under which they apply
// Just improve code organization and clarity

// CRITICAL: Type definitions are the source of truth
// conditions.ts lines 79-91 explicitly state: "requires 'when' trigger"
// This design intent should be reflected in the code structure

// GOTCHA: Multi-field conditions use evaluateFieldMatcher
// Object when conditions don't go through the field state matcher block
// They use evaluateFieldMatcher which handles isDisabled per-field
// The top-level isDisabled/isValid matchers are only for string when

// CRITICAL: Test coverage
// conditions.test.ts has comprehensive tests for isDisabled
// All tests use isDisabled with string when (not object when)
- // No tests should be added in this PRP (that's P2.M2.T2)
```

---

## Implementation Blueprint

### Data models and structure

**No new data models needed** - this PRP is a pure refactoring with no behavior changes.

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
  disabled?: boolean;  // The property we're checking with isDisabled matcher
}

// ConditionDescriptor - Condition definition
interface ConditionDescriptor {
  when?: string | WhenMultiField;  // Trigger: string or object
  selectWhen?: SelectValue<boolean>;  // Expression trigger
  is?: unknown;  // Value matcher
  truthy?: boolean;  // Truthy matcher
  isValid?: boolean;  // Field state matcher (requires string when)
  isDisabled?: boolean;  // Field state matcher (requires string when)
  disabled?: boolean;  // Action to apply when matched
  visible?: boolean;  // Action to apply when matched
  set?: unknown;  // Action to set value
  selectSet?: SelectValue;  // Action to set value from expression
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ and UNDERSTAND current implementation
  - FILE: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  - READ: Lines 137-220 (evaluateConditionMatch function)
  - UNDERSTAND: Current flow of condition matching
  - UNDERSTAND: Why field state matchers are in string-only block
  - IDENTIFY: The exact lines that need refactoring
  - OUTPUT: Clear understanding of current implementation

Task 2: READ and UNDERSTAND type definitions
  - FILE: /home/dustin/projects/formality/packages/core/src/types/conditions.ts
  - READ: Lines 79-91 (isValid and isDisabled documentation)
  - UNDERSTAND: Design intent for these matchers
  - UNDERSTAND: Why they require string 'when' trigger
  - OUTPUT: Clear understanding of design constraints

Task 3: ANALYZE existing test coverage
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts
  - READ: Tests for isDisabled matcher
  - READ: Tests for isValid matcher
  - VERIFY: All tests use these matchers with string when
  - VERIFY: No tests use these matchers with object when
  - OUTPUT: Understanding of test coverage and expected behavior

Task 4: PLAN the refactoring approach
  - DECIDE: How to restructure the field state matcher checks
  - DECIDE: What comments to add to clarify the design
  - DECIDE: Whether to add any validation warnings
  - CONSTRAINT: Must preserve exact backward compatibility
  - CONSTRAINT: Must not change behavior for any valid usage
  - OUTPUT: Detailed refactoring plan

Task 5: IMPLEMENT the refactoring
  - FILE: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  - MODIFY: Lines 177-199 (field state matcher block)
  - EXTRACT: Restructure the code for better maintainability
  - ADD: Clear comments explaining the scope restriction
  - PRESERVE: All existing logic and behavior
  - PRESERVE: The condition `if (typeof condition.when === "string" && fieldStates)`
  - PATTERN: |
    // BEFORE (Current implementation):
    // Apply field state matchers (require string 'when' trigger for field reference)
    if (typeof condition.when === "string" && fieldStates) {
      const fieldState = fieldStates[condition.when];
      if (condition.isValid !== undefined) { ... }
      if (condition.isDisabled !== undefined) { ... }
    }

    // AFTER (Refactored implementation):
    // Apply field state matchers (isValid, isDisabled)
    // NOTE: These matchers require string 'when' trigger to identify which field to check
    // For object 'when', use field-level matchers in the WhenMultiField object
    if (typeof condition.when === "string" && fieldStates) {
      const fieldState = fieldStates[condition.when];

      // Check isValid matcher
      if (condition.isValid !== undefined) {
        const isFieldValid = fieldState
          ? !fieldState.invalid && !fieldState.error
          : true;
        if (condition.isValid !== isFieldValid) {
          return false;
        }
      }

      // Check isDisabled matcher
      if (condition.isDisabled !== undefined) {
        const isFieldDisabled = fieldState?.disabled ?? false;
        if (condition.isDisabled !== isFieldDisabled) {
          return false;
        }
      }
    }

Task 6: VERIFY all tests pass
  - COMMAND: pnpm test --filter @formality-ui/core conditions.test.ts
  - VERIFY: All existing tests pass
  - VERIFY: No regressions in condition evaluation
  - VERIFY: String when with isDisabled works
  - VERIFY: String when with isValid works
  - VERIFY: Object when conditions work
  - EXPECTED: Zero test failures
  - IF_FAILURES: Debug and fix implementation

Task 7: RUN full test suite
  - COMMAND: pnpm test
  - VERIFY: All tests across all packages pass
  - VERIFY: No breaking changes in react package
  - VERIFY: No breaking changes in other framework packages
  - EXPECTED: Zero test failures
  - IF_FAILURES: Debug and fix implementation

Task 8: UPDATE code comments if needed
  - FILE: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  - REVIEW: All comments in evaluateConditionMatch function
  - UPDATE: Add clarifying comments about field state matchers
  - UPDATE: Document why these matchers require string when
  - OUTPUT: Clear, well-documented code
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Field state matcher validation (isValid, isDisabled)
// ============================================================================

// CURRENT IMPLEMENTATION (Lines 177-199):
// Apply field state matchers (require string 'when' trigger for field reference)
if (typeof condition.when === "string" && fieldStates) {
  const fieldState = fieldStates[condition.when];

  // Check isValid matcher
  if (condition.isValid !== undefined) {
    const isFieldValid = fieldState
      ? !fieldState.invalid && !fieldState.error
      : true; // No state = assume valid
    if (condition.isValid !== isFieldValid) {
      return false;
    }
  }

  // Check isDisabled matcher
  if (condition.isDisabled !== undefined) {
    const isFieldDisabled = fieldState?.disabled ?? false;
    if (condition.isDisabled !== isFieldDisabled) {
      return false;
    }
  }
}

// ============================================================================
// DESIGN INTENT: Why these matchers require string 'when'
// ============================================================================

// The isValid and isDisabled matchers check the STATE of the 'when' field
// For string 'when': { when: "email", isValid: true }
//   → Checks if the "email" field is valid

// For object 'when': { when: { email: {...}, name: {...} }, isValid: true }
//   → Which field to check? email? name? Both?
//   → This doesn't make sense at the top level

// For selectWhen: { selectWhen: "count > 5", isValid: true }
//   → Which field to check? The expression might reference multiple fields
//   → This doesn't make sense without a direct field reference

// SOLUTION: Use field-level matchers in object 'when'
// { when: { email: { isValid: true }, name: { isTruthy: true } } }
//   → Each field has its own matchers
//   → Clear which field's state to check

// ============================================================================
// REFACTORING GOAL: Improve code clarity, not change behavior
// ============================================================================

// The refactoring should:
// 1. Make the design intent explicit in code comments
// 2. Improve code structure for maintainability
// 3. Keep all existing logic and behavior
// 4. Not add new features or change scope

// The refactoring should NOT:
// 1. Change how matchers are evaluated
// 2. Change when matchers are applied
// 3. Add support for object when with top-level matchers
// 4. Break backward compatibility

// ============================================================================
// GOTCHA: Multi-field conditions use evaluateFieldMatcher
// ============================================================================

// Object 'when' conditions are handled by evaluateFieldMatcher (lines 143-151)
// Each field in the object has its own FieldMatcher with isDisabled
// This is the correct way to use isDisabled with multi-field conditions

// Example: { when: { field1: { isDisabled: true }, field2: { is: "x" } } }
// evaluateFieldMatcher is called for each field
// Lines 78-84: isDisabled check for each field's matcher

// ============================================================================
// CRITICAL: Test patterns to follow
// ============================================================================

// All existing tests use isDisabled/isValid with string 'when'
// No tests use top-level isDisabled/isValid with object 'when'
// This confirms the design intent: these matchers require string 'when'

// Test example from conditions.test.ts:
// { when: "source", isDisabled: true, visible: false }
// → This is the correct usage pattern

// Test example for object when:
// { when: { source: { isDisabled: false } }, set: "ready" }
// → Field-level isDisabled in the matcher object
```

### Integration Points

```yaml
EVALUATE_CONDITIONS:
  - calls: evaluateConditionMatch for each condition
  - passes: fieldStates with disabled property
  - expects: ConditionResult with resolved disabled state

USE_CONDITIONS_HOOK:
  - file: packages/react/src/hooks/useConditions.ts
  - uses: evaluateConditions from core package
  - provides: fieldStates with disabled property
  - implements: Two-pass evaluation for circular dependencies

FIELD_COMPONENT:
  - file: packages/react/src/components/Field.tsx
  - consumes: ConditionResult.disabled property
  - priority: Third highest (prop > config > condition > group)
  - verifies: DOM disabled attribute matches condition result

TEST_SUITE:
  - file: packages/core/src/__tests__/conditions.test.ts
  - tests: All condition evaluation scenarios
  - coverage: isDisabled, isValid, multi-field, expressions
  - requires: All tests pass after refactoring
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after refactoring - fix before proceeding
pnpm typecheck                    # Type checking
pnpm lint --fix                   # Lint and auto-fix

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test core condition evaluation
pnpm test --filter @formality-ui/core conditions.test.ts -v

# Test specific describe blocks
pnpm test --filter @formality-ui/core conditions.test.ts -t "isDisabled"

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

# Test useFieldDisabledState hook
pnpm test --filter @formality-ui/react useFieldDisabledState.test.tsx -v

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
- [ ] Refactored code follows existing patterns
- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] No regressions in existing functionality

### Feature Validation

- [ ] String `when` with `isDisabled` works exactly as before
- [ ] String `when` with `isValid` works exactly as before
- [ ] Object `when` conditions work exactly as before
- [ ] `selectWhen` conditions work exactly as before
- [ ] No behavior changes for any valid usage patterns
- [ ] No breaking changes to the public API

### Code Quality Validation

- [ ] Code comments clearly explain the scope restriction
- [ ] Design intent is explicit in the code
- [ ] Code is more maintainable with clearer structure
- [ ] Separation of concerns is improved
- [ ] No anti-patterns introduced

### Documentation & Deployment

- [ ] Code is self-documenting with clear comments
- [ ] No deployment changes needed (pure refactoring)
- [ ] No migration guide needed (no breaking changes)

---

## Anti-Patterns to Avoid

- ❌ **Don't change behavior** - This is a refactoring, not a feature addition
- ❌ **Don't break backward compatibility** - All existing tests must pass
- ❌ **Don't add new features** - Save object when support for future work items
- ❌ **Don't change the condition logic** - Keep the exact same evaluation flow
- ❌ **Don't over-engineer** - Simple refactoring for clarity, not complexity
- ❌ **Don't skip tests** - Run all tests after every change
- ❌ **Don't change type definitions** - The types are correct as-is
- ❌ **Don't modify evaluateFieldMatcher** - That function works correctly
- ❌ **Don't add new validation** - Don't throw errors for invalid usage
- ❌ **Don't optimize prematurely** - Focus on clarity, not performance

---

## Related Work Items

- **Previous**: P2.M1 - Disabled Property in Field States (Complete)
- **Previous**: P2.M1.T3.S3 - Test disabled from conditions (Complete)
- **Current**: P2.M2.T1.S1 - Move isDisabled outside string block (THIS ITEM)
- **Future**: P2.M2.T1.S2 - Implement for object when (Planned)
- **Future**: P2.M2.T1.S3 - Handle mixed matchers (Planned)
- **Future**: P2.M2.T2 - Add Tests for Multi-Field isDisabled (Planned)

---

## Contract Dependencies

### From P2.M1 - Disabled Property in Field States (Complete)

The P2.M1 work items specify that:
1. `FieldState.disabled` property exists and is used by condition evaluation
2. Two-pass evaluation prevents circular dependencies
3. Tests verify `isDisabled` matcher works with string `when` conditions

**This PRP's Contract**:
1. Refactor the existing `isDisabled` matcher implementation
2. Do NOT change how `isDisabled` is evaluated
3. Do NOT add support for new usage patterns
4. Preserve all existing behavior and tests

**Integration Point**: The P2.M1 work established that `isDisabled` works correctly with string `when`. This PRP refactors the code structure for maintainability without changing the behavior.

### From P2.M1.T3.S3 - Test Disabled from Conditions (Complete)

The P2.M1.T3.S3 PRP specifies that:
1. Tests for `isDisabled` matcher with string `when` exist
2. Tests for `isDisabled` with object `when` do NOT exist
3. Tests verify the current behavior is correct

**This PRP's Contract**:
1. All existing tests continue to pass
2. No new tests are added (that's P2.M2.T2)
3. Test coverage remains the same

**Integration Point**: The test suite validates that the refactoring doesn't change behavior. All tests should pass without modification.

### To P2.M2.T1.S2 - Implement for Object When (Planned)

The P2.M2.T1.S2 work item will implement `isDisabled` for object `when` conditions.

**This PRP's Contract**:
1. This refactoring clarifies the current scope restriction
2. Makes the code easier to extend for P2.M2.T1.S2
3. Does NOT implement the feature itself (that's P2.M2.T1.S2)

**Integration Point**: This refactoring prepares the codebase for the next work item by improving clarity and structure, without implementing the feature.

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:
- Well-scoped refactoring task (no behavior changes)
- Clear file location and exact lines to modify
- Comprehensive understanding of current implementation
- All dependencies and constraints documented
- Clear success criteria and validation approach
- Known gotchas documented with solutions
- Anti-patterns identified to avoid

**Deduction**: -1 for potential complexity in clarifying the design intent without changing behavior. The line between "improving clarity" and "changing behavior" must be carefully maintained.

---

## References

### Internal Documentation

- [Condition Types](../../../../packages/core/src/types/conditions.ts) - Type definitions
- [Condition Evaluation](../../../../packages/core/src/conditions/evaluate.ts) - Implementation
- [Condition Tests](../../../../packages/core/src/__tests__/conditions.test.ts) - Test coverage
- [P2.M1.T1.S3 PRP](../P2M1T1S3/PRP.md) - Two-pass evaluation implementation
- [P2.M1.T3.S3 PRP](../P2M1T3S3/PRP.md) - Tests for disabled from conditions
- [useConditions Hook](../../../../packages/react/src/hooks/useConditions.ts) - Hook usage
- [Field Component](../../../../packages/react/src/components/Field.tsx) - Component integration

### External Documentation

No external documentation needed - this is an internal refactoring.

### Example Code

- [Existing isDisabled Tests](../../../../packages/core/src/__tests__/conditions.test.ts) - Test patterns
- [evaluateFieldMatcher](../../../../packages/core/src/conditions/evaluate.ts) - Multi-field handling
- [Two-Pass Evaluation](../../../../packages/react/src/hooks/useConditions.ts) - Circular dependency resolution
