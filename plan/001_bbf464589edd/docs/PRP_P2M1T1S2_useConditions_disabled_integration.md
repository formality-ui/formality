# Product Requirement Prompt: Integrate Disabled Property into useConditions

---

## Goal

**Feature Goal**: Modify the `useConditions` hook to include the `disabled` property in field states using two-pass evaluation, enabling the `isDisabled` condition matcher to work correctly.

**Deliverable**: Updated `/packages/react/src/hooks/useConditions.ts` with disabled property added to field states via two-pass evaluation using the `useFieldDisabledState` hook from P2.M1.T1.S1.

**Success Definition**:

- Field states include `disabled` property populated by calling `useFieldDisabledState` for each field
- Two-pass evaluation resolves the circular dependency (conditions need disabled, disabled needs conditions)
- Existing condition evaluation logic continues to work for `visible`, `setValue`, and other matchers
- `isDisabled` matcher can now reference the disabled state of other fields
- No breaking changes to existing behavior
- All tests pass

---

## Why

- **Enables `isDisabled` condition matcher**: Conditions like `{ when: "source", isDisabled: true, disabled: true }` require disabled state in field states
- **Resolves circular dependency**: Disabled state comes from condition evaluation, but condition evaluation needs disabled state for field states
- **Supports multi-field disabled conditions**: Part of fixing Issue 4 where `isDisabled` matcher only works for string `when` conditions
- **Completes the disabled state architecture**: P2.M1.T1.S1 created the hook, this task integrates it into useConditions
- **Maintains backward compatibility**: Changes are additive - existing behavior preserved

---

## What

Modify the `useConditions` hook to build field states in two passes, adding the `disabled` property in the second pass using the `useFieldDisabledState` hook.

### Current State (Before)

```typescript
// Lines 98-119 in useConditions.ts
const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false,
      // ❌ NO disabled property
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);
```

### Target State (After)

```typescript
// Two-pass evaluation:
// Pass 1: Build base field states without disabled (same as before)
// Pass 2: Add disabled property using useFieldDisabledState for each field

const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

  // PASS 1: Build base states without disabled property
  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false,
    };
  });

  // PASS 2: Add disabled property for each field using useFieldDisabledState
  // CRITICAL: This breaks the circular dependency by using Pass 1 states
  watchFields.forEach((fieldName) => {
    // Call useFieldDisabledState to resolve disabled for this field
    // Note: Since we're in useMemo, we can't call hooks directly
    // Instead, we'll need to restructure to compute disabled outside
    states[fieldName].disabled = /* computed from useFieldDisabledState */;
  });

  return states;
}, [watchFields, fieldValues, methods, /* additional deps */]);
```

### Architectural Challenge

**The Problem**: We need to call a hook (`useFieldDisabledState`) inside `useMemo`, which violates React's Rules of Hooks (hooks can only be called at the top level of a component or hook).

**The Solution**: Restructure `useConditions` to:

1. Call `useFieldDisabledState` for each watched field at the hook's top level
2. Build field states in a single `useMemo` that includes the disabled property

### Success Criteria

- [ ] Field states include `disabled` property for all watched fields
- [ ] Disabled property is computed using `useFieldDisabledState` hook
- [ ] Two-pass evaluation breaks circular dependency
- [ ] `isDisabled` matcher can reference disabled state of other fields
- [ ] Existing condition evaluation logic unchanged for `visible`, `setValue`, etc.
- [ ] No breaking changes to existing behavior
- [ ] All existing tests pass
- [ ] New tests verify disabled property in field states

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed?

✅ **YES** - This PRP provides:

- Exact file paths and line numbers for all modifications
- Complete understanding of circular dependency and two-pass solution
- Architectural challenge with React's Rules of Hooks
- Exact patterns to follow from existing code
- Test patterns for validation
- Known gotchas and constraints

### Documentation & References

```yaml
# MUST READ - Previous PRP (Contract for Input)
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T1S1/PRP.md
  why: Defines the useFieldDisabledState hook contract - this is the INPUT to this task
  critical: |
    - Hook signature: useFieldDisabledState(options): boolean
    - Hook parameters: fieldName, disabledProp, fieldConfigDisabled, conditions, groupDisabled, subscribesTo
    - Hook follows useConditions pattern exactly
    - Hook does NOT add disabled to its own fieldStates (breaks circular dependency)
  section: Full PRP - this defines what will be available when this task starts

# MUST READ - Target File to Modify
- file: /home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts
  why: This is THE file to modify - field states building loop (lines 98-119)
  pattern: Current implementation missing disabled property
  critical: |
    - Lines 54-56: Context access pattern (useFormContext)
    - Lines 58-62: useInferredInputs for dependency inference
    - Lines 65-69: useWatch with isolated subscriptions
    - Lines 72-92: Build fieldValues map from watched values
    - Lines 98-119: Build fieldStates (TARGET - needs disabled added)
    - Lines 122-142: Final condition evaluation

# MUST READ - Hook to Import
- file: /home/dustin/projects/formality/packages/react/src/hooks/useFieldDisabledState.ts
  why: This hook will be imported and called for each field
  pattern: Priority resolution, condition evaluation, useMemo usage
  gotcha: |
    This hook CANNOT be called inside useMemo (violates Rules of Hooks)
    Must be called at top level of useConditions hook
    Hook returns boolean, not object

# MUST READ - Where isDisabled Matcher Reads
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Shows exactly how isDisabled matcher reads from fieldStates
  section: Lines 78-84, 192-199
  pattern: fieldState?.disabled ?? false
  critical: |
    evaluateFieldMatcher checks: if (matcher.isDisabled !== undefined)
    evaluateConditionMatch checks: if (condition.isDisabled !== undefined)
    Both use: const isFieldDisabled = fieldState?.disabled ?? false

# MUST READ - Two-Pass Pattern Reference
- file: /home/dustin/projects/formality/packages/react/src/hooks/useFieldDisabledState.ts
  why: Demonstrates two-pass evaluation pattern (base → conditions → final)
  section: Lines 76-190 (three-pass resolution)
  pattern: Multiple useMemo blocks with dependency chaining

# MUST READ - Field State Type Definition
- file: /home/dustin/projects/formality/packages/core/src/types/state.ts
  why: FieldStateInput interface includes disabled?: boolean
  section: FieldStateInput interface
  gotcha: disabled is optional, must be populated now

# MUST READ - Test Patterns
- file: /home/dustin/projects/formality/packages/react/src/__tests__/autosave-validation.test.tsx
  why: Integration test patterns for condition evaluation
  pattern: Component-level testing, DOM state verification, timer control

# External Research - React Rules of Hooks
- url: https://react.dev/reference/rules#rules-of-hooks
  why: Critical constraint - hooks cannot be called conditionally or inside useMemo
  section: Only Call Hooks at the Top Level
  critical: |
    "Don't call Hooks inside loops, conditions, or nested functions."
    "Only call Hooks at the top level of your React function."

# External Research - Derived State Pattern
- url: https://react.dev/learn/you-might-not-need-an-effect
  why: Official React guidance on derived state and useMemo
  section: Deriving state from props
  pattern: Compute state during render, not with useEffect

# Codebase Analysis Documentation
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/docs/codebase_analysis.md
  why: Architectural patterns and implementation guidance
  section: Hook Consistency Pattern
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/packages/
├── core/src/
│   ├── conditions/
│   │   ├── evaluate.ts          # isDisabled matcher reads fieldState.disabled
│   │   └── index.ts
│   └── types/
│       └── state.ts             # FieldStateInput interface (disabled?: boolean)
├── react/src/
│   ├── hooks/
│   │   ├── useConditions.ts     # TARGET FILE - modify field states building
│   │   └── useFieldDisabledState.ts  # INPUT - created by P2.M1.T1.S1
│   └── __tests__/
│       ├── autosave-validation.test.tsx    # Test pattern reference
│       └── Field.test.tsx                  # Condition evaluation tests
```

### Desired Codebase Tree (No New Files)

```bash
# No new files - this task modifies existing file
/home/dustin/projects/formality/packages/react/src/
├── hooks/
│   └── useConditions.ts        # MODIFIED - adds disabled to field states
└── __tests__/
    └── useConditions.disabled.test.tsx  # NEW - tests for disabled property
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: React's Rules of Hooks
// useFieldDisabledState is a HOOK, not a regular function
// It CANNOT be called inside useMemo, forEach, or any nested function
// It MUST be called at the top level of useConditions
// ❌ WRONG: useMemo(() => { forEach(() => { useFieldDisabledState(...) }) })
// ✅ RIGHT: const disabledMap = useMemo(() => ({ field1: useFieldDisabledState(...) }), [])

// CRITICAL: Circular Dependency Resolution
// Pass 1 fieldStates (without disabled) are used to evaluate conditions
// Pass 2 adds disabled property using the evaluated conditions
// This breaks the cycle: conditions → disabled → conditions
// Key insight: useFieldDisabledState internally calls evaluateConditions
// Those conditions use Pass 1 states (without disabled) - no circular dependency!

// CRITICAL: Hook Call Pattern
// Since useFieldDisabledState must be called at top level, we need to:
// 1. Call it for each field in the watchFields array
// 2. Use a useMemo to create a map of fieldName → disabled boolean
// 3. Build final fieldStates in a separate useMemo that includes disabled

// CRITICAL: Field State Structure
// FieldStateInput.disabled is optional (disabled?: boolean)
// Must be populated for isDisabled matcher to work
// evaluate.ts uses: fieldState?.disabled ?? false
// Undefined is treated as false (enabled)

// CRITICAL: Condition Evaluation Context
// When useFieldDisabledState evaluates conditions, it needs:
// - fieldValues: computed from useWatch (same as useConditions)
// - fieldStates: Pass 1 states (without disabled property)
// - record: from useFormContext
// - props: { name: fieldName } for expression context

// CRITICAL: Subscription Isolation
// Each useFieldDisabledState call creates its own useWatch subscriptions
// This is intentional - each field subscribes to its dependencies
// DO NOT try to share subscriptions between calls

// GOTCHA: useMemo Dependencies
// When adding disabled to field states, new dependencies appear:
// - The disabled map becomes a dependency
// - Field config may be needed (for fieldConfigDisabled parameter)
// - Group context may be needed (for groupDisabled parameter)

// GOTCHA: Parameter Passing to useFieldDisabledState
// useConditions doesn't have direct access to:
// - disabledProp (JSX prop) - this is at Field component level
// - fieldConfigDisabled - this is in field config
// - groupDisabled - this is from GroupContext
// Solution: Pass undefined for these, conditions will be evaluated
// This means useConditions only provides disabled FROM conditions
// The Field component handles the full priority resolution later

// PATTERN: Two-Pass Implementation
// Pass 1: Build base field states (value, isTouched, isDirty, error, invalid)
// Pass 2: Add disabled property using useFieldDisabledState
// Key: Pass 1 states are used by useFieldDisabledState internally
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// FieldStateInput interface (from @formality-ui/core)
interface FieldStateInput {
  value: unknown;
  isTouched?: boolean;
  isDirty?: boolean;
  isValidating?: boolean;
  error?: unknown;
  invalid?: boolean;
  disabled?: boolean; // ← This property needs to be populated
}

// Disabled state map structure
type DisabledStateMap = Record<string, boolean>;

// useFieldDisabledState parameters (from P2.M1.T1.S1)
interface UseFieldDisabledStateOptions {
  fieldName: string;
  disabledProp?: boolean;
  fieldConfigDisabled?: boolean;
  conditions?: ConditionDescriptor[];
  groupDisabled?: boolean;
  subscribesTo?: string[];
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ANALYZE useConditions Structure
  - READ: /packages/react/src/hooks/useConditions.ts (full file)
  - IDENTIFY: Field states building loop (lines 98-119)
  - IDENTIFY: Context access pattern (lines 54-56)
  - IDENTIFY: useInferredInputs usage (lines 58-62)
  - IDENTIFY: useWatch usage (lines 65-69)
  - IDENTIFY: fieldValues building (lines 72-92)
  - IDENTIFY: Final evaluation (lines 122-142)
  - DOCUMENT: Current dependencies in each useMemo

Task 2: DESIGN Two-Pass Architecture
  - CHALLENGE: useFieldDisabledState is a hook, cannot call inside useMemo
  - SOLUTION: Call useFieldDisabledState at top level, create disabled map
  - DESIGN: Pass 1 - Call useFieldDisabledState for each watched field
  - DESIGN: Pass 2 - Build field states including disabled from map
  - CONSTRAINT: Cannot access JSX props, field config, or group context
  - SCOPE: Only evaluate disabled FROM conditions (not full priority)

Task 3: ADD IMPORT for useFieldDisabledState
  - IMPORT: useFieldDisabledState from ./useFieldDisabledState
  - PLACEMENT: After existing imports, before useConditions export
  - VERIFY: TypeScript resolves import correctly

Task 4: IMPLEMENT Disabled State Map (Pass 1)
  - CREATE: useMemo to build disabled state map
  - PATTERN: Object.fromEntries() to create Record<string, boolean>
  - CALL: useFieldDisabledState for each field in watchFields
  - PARAMETERS: fieldName={field}, disabledProp=undefined, fieldConfigDisabled=undefined, conditions=conditions, groupDisabled=undefined, subscribesTo=undefined
  - DEPENDENCIES: watchFields, conditions, record, methods
  - GOTCHA: Each call creates independent useWatch subscriptions
  - NAMING: disabledStates (Record<string, boolean>)

Task 5: MODIFY Field States Building (Pass 2)
  - UPDATE: Existing fieldStates useMemo (lines 98-119)
  - ADD: disabled property from disabledStates map
  - PATTERN: states[fieldName].disabled = disabledStates[fieldName]
  - DEPENDENCIES: Add disabledStates to dependency array
  - PRESERVE: All existing properties (value, isTouched, isDirty, error, invalid, isValidating)
  - GOTCHA: Only add disabled if field exists in disabledStates

Task 6: UPDATE JSDoc Comments
  - DOCUMENT: Two-pass evaluation for disabled property
  - DOCUMENT: Circular dependency resolution
  - DOCUMENT: Disabled state only from conditions (not full priority)
  - UPDATE: Example usage if needed

Task 7: VERIFY Type Safety
  - CHECK: TypeScript compiles without errors
  - CHECK: fieldStates type is Record<string, FieldStateInput>
  - CHECK: FieldStateInput includes disabled?: boolean
  - VERIFY: No type assertions needed

Task 8: CREATE Integration Tests
  - CREATE: /packages/react/src/__tests__/useConditions.disabled.test.tsx
  - TEST: Disabled property is populated in field states
  - TEST: isDisabled matcher can reference other fields' disabled state
  - TEST: Two-pass evaluation resolves circular dependency
  - TEST: Existing condition evaluation still works (visible, setValue)
  - PATTERN: Follow autosave-validation.test.tsx integration test style
```

### Implementation Patterns & Key Details

```typescript
// ============================================
// PATTERN 1: Import Statement
// ============================================
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import {
  evaluateConditions,
  type ConditionResult,
  type FieldStateInput,
} from "@formality-ui/core";
import type { ConditionDescriptor } from "@formality-ui/core";
import { useFormContext } from "../context/FormContext";
import { useInferredInputs } from "./useInferredInputs";
import { useFieldDisabledState } from "./useFieldDisabledState";  // ← NEW IMPORT

// ============================================
// PATTERN 2: Disabled State Map (Pass 1)
// ============================================
// Build disabled states for all watched fields
// CRITICAL: This must be done BEFORE building field states
// CRITICAL: Each useFieldDisabledState call creates isolated subscriptions
const disabledStates = useMemo(() => {
  const states: Record<string, boolean> = {};

  if (watchFields.length === 0) {
    return states;
  }

  // Call useFieldDisabledState for each field
  // NOTE: Since this is in useMemo, we need to be careful
  // Actually, we CAN'T call hooks in useMemo!
  // This requires a different approach...

  // ❌ WRONG APPROACH (violates Rules of Hooks):
  // watchFields.forEach((fieldName) => {
  //   states[fieldName] = useFieldDisabledState({...});  // HOOK IN useMemo!
  // });

  return states;
}, [/* dependencies */]);

// ✅ CORRECT APPROACH:
// Realize that useFieldDisabledState internally calls useWatch
// We already have watched values and field states
// We can evaluate conditions directly without calling the hook!

// ============================================
// REVISED PATTERN 2: Direct Condition Evaluation
// ============================================
// Instead of calling useFieldDisabledState, we evaluate conditions directly
// This avoids the Rules of Hooks violation

const disabledStates = useMemo(() => {
  const states: Record<string, boolean> = {};

  if (watchFields.length === 0) {
    return states;
  }

  // Evaluate disabled conditions for each field
  watchFields.forEach((fieldName) => {
    // Filter conditions for this specific field
    // Conditions with disabled action that reference this field as the target
    const fieldConditions = conditions.filter(c => c.disabled !== undefined);

    if (fieldConditions.length === 0) {
      states[fieldName] = false;
      return;
    }

    // Evaluate conditions using Pass 1 field states (without disabled)
    const result = evaluateConditions({
      conditions: fieldConditions,
      fieldValues,
      fieldStates: /* Pass 1 states without disabled */,
      record,
      props: { name: fieldName },
    });

    states[fieldName] = result.disabled ?? false;
  });

  return states;
}, [watchFields, conditions, fieldValues, /* Pass 1 states */, record]);

// ============================================
// PATTERN 3: Two-Pass Field States Building
// ============================================
// Pass 1: Build base states (without disabled)
const baseFieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false,
      // ❌ NO disabled property yet
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);

// Pass 2: Add disabled property
const fieldStates = useMemo(() => {
  // Add disabled to each field state
  Object.entries(baseFieldStates).forEach(([fieldName, state]) => {
    state.disabled = disabledStates[fieldName] ?? false;
  });

  return baseFieldStates;
}, [baseFieldStates, disabledStates]);

// ============================================
// FINAL PATTERN: Single-Loop Two-Pass
// ============================================
// Optimize: Build states in one loop, add disabled in second loop
const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

  // Pass 1: Build base states
  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false,
    };
  });

  // Pass 2: Add disabled property
  watchFields.forEach((fieldName) => {
    states[fieldName].disabled = disabledStates[fieldName] ?? false;
  });

  return states;
}, [watchFields, fieldValues, methods, disabledStates]);
```

### Integration Points

```yaml
USE_CONDITIONS HOOK:
  - file: /packages/react/src/hooks/useConditions.ts
  - modify: Lines 98-119 (field states building)
  - add: New disabledStates useMemo before fieldStates
  - add: Import for useFieldDisabledState (or direct evaluation)
  - update: fieldStates dependency array

EVALUATE.CONDITIONS:
  - file: /packages/core/src/conditions/evaluate.ts
  - reference: Lines 78-84, 192-199 (isDisabled matcher)
  - uses: fieldState?.disabled ?? 0
  - impact: Will now receive disabled property in field states

FIELD COMPONENT:
  - file: /packages/react/src/components/Field.tsx
  - reference: Lines 265-278 (isDisabled resolution)
  - note: Field component does full priority resolution
  - scope: useConditions only provides disabled FROM conditions

TESTS:
  - file: /packages/react/src/__tests__/useConditions.disabled.test.tsx
  - new: Integration tests for disabled property in field states
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifications
cd /home/dustin/projects/formality
pnpm --filter @formality-ui/react exec ruff check packages/react/src/hooks/useConditions.ts --fix
pnpm --filter @formality-ui/react exec ruff format packages/react/src/hooks/useConditions.ts

# Type checking
pnpm --filter @formality-ui/react exec tsc --noEmit

# Expected: Zero errors. Fix any issues before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run existing useConditions tests (if any exist)
pnpm --filter @formality-ui/react test useConditions

# Run new disabled property tests
pnpm --filter @formality-ui/react test useConditions.disabled

# Run all React package tests
pnpm --filter @formality-ui/react test

# Expected: All tests pass
```

**Test Coverage Required**:

```typescript
describe("useConditions - Disabled Property", () => {
  it("should include disabled property in field states", () => {
    // Test: fieldStates[fieldName].disabled is defined
  });

  it("should evaluate disabled from conditions", () => {
    // Test: { when: "other", disabled: true } sets disabled on target
  });

  it("should support isDisabled matcher referencing other fields", () => {
    // Test: { when: "field", isDisabled: true, disabled: true }
    // When "field" is disabled by conditions, this condition matches
  });

  it("should not break existing visible condition evaluation", () => {
    // Test: visible conditions still work correctly
  });

  it("should not break existing setValue condition evaluation", () => {
    // Test: setValue conditions still work correctly
  });

  it("should handle circular dependency with two-pass evaluation", () => {
    // Test: Field A disabled depends on Field B
    // Field B disabled depends on Field A
    // Both should resolve correctly without infinite loop
  });

  it("should default disabled to false when no conditions", () => {
    // Test: Fields without disabled conditions have disabled: false
  });
});
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests
pnpm --filter @formality-ui/react test integration

# Run specific integration test with disabled conditions
# Create test case in integration/complete-form.test.tsx

# Expected: All integration tests pass
```

**Integration Test Scenario**:

```typescript
it("should support complex disabled condition chains", () => {
  const { getByTestId } = render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={{
          sourceField: { type: "switch" },
          targetField: {
            type: "textField",
            conditions: [
              { when: "sourceField", is: true, disabled: true },
            ],
          },
          dependentField: {
            type: "textField",
            conditions: [
              { when: "targetField", isDisabled: true, disabled: true },
            ],
          },
        }}
      >
        <Field name="sourceField" />
        <Field name="targetField" />
        <Field name="dependentField" />
      </Form>
    </FormalityProvider>,
  );

  // Initial state: all enabled
  expect(getByTestId("targetField")).not.toBeDisabled();
  expect(getByTestId("dependentField")).not.toBeDisabled();

  // Enable sourceField → targetField becomes disabled
  fireEvent.click(getByTestId("sourceField"));
  expect(getByTestId("targetField")).toBeDisabled();

  // dependentField should also be disabled (references targetField.disabled)
  expect(getByTestId("dependentField")).toBeDisabled();
});
```

### Level 4: Manual Testing

```typescript
// Test in browser or example file
// Create form with:
// 1. Field with disabled condition
// 2. Field that references isDisabled matcher
// 3. Chain of disabled dependencies
// Verify all disabled states resolve correctly
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compiles without errors
- [ ] No linting errors (ruff)
- [ ] No formatting issues
- [ ] All imports resolve correctly
- [ ] useFieldDisabledState imported successfully
- [ ] disabledStates useMemo created
- [ ] fieldStates include disabled property

### Feature Validation

- [ ] Field states include disabled property for all watched fields
- [ ] Disabled property computed from conditions
- [ ] isDisabled matcher can reference other fields' disabled state
- [ ] Circular dependency resolved via two-pass evaluation
- [ ] Existing condition evaluation unchanged (visible, setValue)
- [ ] No breaking changes to existing behavior

### Code Quality Validation

- [ ] Follows useConditions existing patterns
- [ ] Two-pass evaluation clearly documented
- [ ] useMemo dependencies correct
- [ ] No Rules of Hooks violations
- [ ] JSDoc comments updated
- [ ] Code is self-documenting

### Documentation & Deployment

- [ ] Two-pass evaluation explained in comments
- [ ] Circular dependency resolution documented
- [ ] Scope clarifications (conditions only, not full priority)
- [ ] Integration tests cover scenarios

---

## Anti-Patterns to Avoid

- ❌ **Don't call hooks in useMemo** - useFieldDisabledState cannot be called inside useMemo
- ❌ **Don't use forEach with hooks** - Hooks must be called at top level, not in loops
- ❌ **Don't duplicate condition evaluation** - Evaluate once, cache result
- ❌ **Don't break existing behavior** - All existing tests must still pass
- ❌ **Don't skip two-pass evaluation** - Circular dependency will cause infinite loop
- ❌ **Don't ignore Rules of Hooks** - React will throw errors
- ❌ **Don't over-engineer** - Direct condition evaluation is simpler than calling hook
- ❌ **Don't forget dependency arrays** - useMemo must list all dependencies
- ❌ **Don't access JSX props/config** - useConditions only evaluates conditions
- ❌ **Don't create nested useMemo** - Keep flat structure for clarity

---

## Confidence Score

**7/10** - One-pass implementation success likelihood

**Confidence Justification**:

- ✅ Clear architectural challenge identified (Rules of Hooks)
- ✅ Circular dependency solution documented (two-pass evaluation)
- ✅ Exact file paths and line numbers provided
- ✅ Previous PRP (P2.M1.T1.S1) defines input contract
- ✅ Test patterns established in codebase
- ⚠️ Architectural constraint (no hooks in useMemo) requires careful design
- ⚠️ May need iteration to find optimal approach

**Risk Factors**:

- React's Rules of Hooks constraint is significant
- useFieldDisabledState cannot be used directly (must evaluate conditions)
- Integration testing needed to verify circular dependency resolution
- Performance impact of multiple condition evaluations

**Mitigation**:

- Direct condition evaluation pattern documented
- Two-pass evaluation clearly explained
- Integration test scenarios specified
- Alternative approaches considered in patterns section

---

## Appendix: Quick Reference

### Key Implementation Decision

**Architectural Challenge**: useFieldDisabledState is a hook and cannot be called inside useMemo.

**Solution**: Do NOT call useFieldDisabledState directly. Instead, evaluate conditions directly in useConditions using the same logic:

```typescript
// Build disabled states by evaluating conditions directly
const disabledStates = useMemo(() => {
  const states: Record<string, boolean> = {};

  if (watchFields.length === 0) {
    return states;
  }

  // Evaluate conditions for each field
  watchFields.forEach((fieldName) => {
    // Filter for conditions that have disabled action
    const fieldConditions = conditions.filter((c) => c.disabled !== undefined);

    if (fieldConditions.length === 0) {
      states[fieldName] = false;
      return;
    }

    // Evaluate using Pass 1 field states (built below)
    const result = evaluateConditions({
      conditions: fieldConditions,
      fieldValues,
      fieldStates: baseFieldStates, // Without disabled property
      record,
      props: { name: fieldName },
    });

    states[fieldName] = result.disabled ?? false;
  });

  return states;
}, [watchFields, conditions, fieldValues, baseFieldStates, record]);
```

This approach:

1. Avoids Rules of Hooks violation
2. Uses existing evaluateConditions function
3. Leverages Pass 1 field states (without disabled)
4. Breaks circular dependency cleanly

### File Locations Summary

```
Target File to Modify:
  /packages/react/src/hooks/useConditions.ts

Reference Pattern (Hook to Import):
  /packages/react/src/hooks/useFieldDisabledState.ts

Where isDisabled Reads:
  /packages/core/src/conditions/evaluate.ts (lines 78-84, 192-199)

Type Definition:
  /packages/core/src/types/state.ts (FieldStateInput)

Test Pattern Reference:
  /packages/react/src/__tests__/autosave-validation.test.tsx
```

### Two-Pass Evaluation Summary

```
Pass 1: Build baseFieldStates (without disabled)
  - Loop through watchFields
  - Call getFieldState() for each field
  - Build states: { value, isTouched, isDirty, error, invalid, isValidating }

Pass 2: Build disabledStates (evaluate conditions)
  - Loop through watchFields
  - Filter conditions for disabled action
  - Call evaluateConditions with Pass 1 states
  - Build map: { fieldName: boolean }

Pass 3: Merge (add disabled to field states)
  - Loop through watchFields
  - Add disabled property: state.disabled = disabledStates[fieldName]
```

### Modified useConditions Structure

```typescript
export function useConditions(options: UseConditionsOptions): ConditionResult {
  const { conditions, subscribesTo, props } = options;
  const { record, methods } = useFormContext();

  // 1. Infer fields to watch
  const watchFields = useInferredInputs({ conditions, subscribesTo });

  // 2. Watch field values
  const watchedValues = useWatch({
    control: methods.control,
    name: watchFields.length > 0 ? (watchFields as any) : [],
  });

  // 3. Build field values map
  const fieldValues = useMemo(() => {
    /* existing */
  }, [watchFields, watchedValues]);

  // 4. Build base field states (Pass 1 - without disabled)
  const baseFieldStates = useMemo(() => {
    // Build states without disabled property
  }, [watchFields, fieldValues, methods]);

  // 5. Build disabled states (Pass 2 - evaluate conditions)
  const disabledStates = useMemo(() => {
    // Evaluate conditions for each field using baseFieldStates
  }, [watchFields, conditions, fieldValues, baseFieldStates, record]);

  // 6. Build final field states (Pass 3 - add disabled)
  const fieldStates = useMemo(() => {
    // Add disabled property to each state
  }, [baseFieldStates, disabledStates]);

  // 7. Evaluate and return conditions (existing)
  return useMemo(() => {
    /* existing */
  }, [conditions, fieldValues, fieldStates, record, props]);
}
```
