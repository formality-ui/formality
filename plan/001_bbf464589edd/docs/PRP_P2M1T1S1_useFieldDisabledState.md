# Product Requirement Prompt: useFieldDisabledState Hook

---

## Goal

**Feature Goal**: Create a `useFieldDisabledState` hook that resolves the final disabled state for a field by evaluating multiple sources with a priority order.

**Deliverable**: New hook at `/packages/react/src/hooks/useFieldDisabledState.ts` returning a boolean indicating whether the field should be disabled.

**Success Definition**:
- Hook correctly implements priority order: JSX prop > field config > conditions > group state > false
- Hook uses `useMemo` for performance optimization
- Hook evaluates conditions to extract `disabled` result
- Hook follows the exact pattern of `useConditions` for consistency
- TypeScript types are properly defined and exported
- Hook integrates cleanly with `useConditions` without circular dependencies

---

## Why

- **Enables `isDisabled` condition matcher**: Conditions need to reference the disabled state of other fields (e.g., `{ when: "source", isDisabled: true, disabled: true }`)
- **Resolves circular dependency**: Disabled state comes from condition evaluation, but condition evaluation needs disabled state for field states
- **Supports multi-field disabled conditions**: Part of fixing Issue 4 where `isDisabled` matcher only works for string `when` conditions
- **Maintains architectural consistency**: Follows established hook patterns in the codebase
- **Performance optimization**: Uses isolated subscriptions and memoization to prevent unnecessary re-renders

---

## What

A React hook that accepts field configuration parameters and returns a boolean disabled state by evaluating multiple sources in priority order.

### Input Parameters

```typescript
interface UseFieldDisabledStateOptions {
  /** Current field name */
  fieldName: string;

  /** Disabled prop from JSX (highest priority) */
  disabledProp?: boolean;

  /** Disabled from field config */
  fieldConfigDisabled?: boolean;

  /** Conditions to evaluate for disabled state */
  conditions?: ConditionDescriptor[];

  /** Group disabled state from parent FieldGroup */
  groupDisabled?: boolean;

  /** Explicit field subscriptions for conditions */
  subscribesTo?: string[];
}
```

### Output

```typescript
// Returns: boolean - whether the field should be disabled
```

### Priority Resolution Order

1. **JSX prop** (`disabledProp`) - Direct prop on `<Field disabled />`
2. **Field config** (`fieldConfigDisabled`) - `{ disabled: true }` in config
3. **Conditions** - Evaluated conditions with `disabled: true` action
4. **Group state** (`groupDisabled`) - Parent `FieldGroup` disabled state
5. **Default** - `false` (field is enabled)

### Success Criteria

- [ ] Hook correctly implements 4-layer priority order + default
- [ ] Uses `useInferredInputs` for automatic field dependency inference
- [ ] Uses `useWatch` with isolated subscriptions (not form-wide)
- [ ] Evaluates conditions to extract disabled result using `evaluateConditions`
- [ ] Returns `false` when no disabled conditions match
- [ ] Returns `true` when any disabled condition matches (OR logic)
- [ ] Uses `useMemo` for performance with correct dependencies
- [ ] Follows `useConditions` pattern exactly
- [ ] TypeScript types are exported from the file

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed?

✅ **YES** - This PRP provides:
- Exact file paths and line numbers for all reference patterns
- Complete code examples from existing hooks
- Type definitions with all properties
- Priority order implementation pattern
- Import/export patterns
- Testing patterns
- Known gotchas and circular dependency issues

### Documentation & References

```yaml
# MUST READ - Hook Pattern Reference
- file: /home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts
  why: This is THE reference pattern to follow exactly
  pattern: Subscription inference, useWatch isolation, field state building, useMemo usage
  critical: |
    - Lines 58-62: useInferredInputs pattern for dependency inference
    - Lines 65-69: useWatch with isolated subscriptions (empty array optimization)
    - Lines 72-92: Build fieldValues map from watched values
    - Lines 98-119: Build fieldStates with metadata (MISSING disabled property)
    - Lines 122-142: Final useMemo for condition evaluation

# MUST READ - Disabled Resolution Pattern
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows exact disabled priority resolution logic to replicate
  pattern: useMemo for priority evaluation, undefined checks
  section: Lines 265-278 (isDisabled resolution)
  gotcha: |
    Order is: prop > config > condition > group > false
    Each uses undefined check: `if (value !== undefined) return value`
    This ensures falsy values (false) are properly distinguished from undefined

# MUST READ - Field State Type
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: FieldStateInput interface definition
  section: Interface FieldStateInput (lines 1-18)
  gotcha: |
    disabled?: boolean is in the interface but NOT populated in useConditions
    This is the root cause of Issue 3

# MUST READ - Condition Evaluation Logic
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Core evaluateConditions function to extract disabled from conditions
  section: evaluateConditions function
  pattern: OR logic for disabled (any true = disabled)

# MUST READ - Subscription Inference
- file: /home/dustin/projects/formality/packages/react/src/hooks/useInferredInputs.ts
  why: Automatic field dependency inference from conditions
  pattern: useMemo with deduplication via Set

# MUST READ - FormContext Access Pattern
- file: /home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts
  why: Shows how to access useFormContext for methods and record
  section: Lines 55-56

# Codebase Analysis Documentation
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/docs/codebase_analysis.md
  why: Architectural patterns and implementation guidance
  section: Hook Consistency Pattern (lines 419-436)
  critical: |
    - Subscription Inference: Use useInferredInputs
    - Isolated Watching: Use useWatch with specific field names
    - State Building: Build minimal required state on change
    - Memoization: Cache results with proper dependencies

# React Hooks Best Practices
- url: https://react.dev/reference/react#custom-hooks
  why: Official React custom hooks documentation
  section: Custom Hooks section

- url: https://react.dev/reference/react/useMemo
  why: Official useMemo documentation for performance optimization
  section: Skipping expensive recalculations
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/packages/react/src/
├── components/
│   ├── Field.tsx              # Reference for disabled resolution (lines 265-278)
│   ├── FieldGroup.tsx         # Group context for disabled state
│   ├── Form.tsx
│   └── FormalityProvider.tsx
├── context/
│   ├── FormContext.ts         # useFormContext() hook
│   ├── ConfigContext.ts
│   └── GroupContext.ts        # useGroupContext() hook
├── hooks/
│   ├── useConditions.ts       # PRIMARY REFERENCE PATTERN
│   ├── useFormState.ts
│   ├── useInferredInputs.ts   # Dependency inference
│   ├── usePropsEvaluation.ts
│   └── useSubscriptions.ts
├── __tests__/                 # Test files
└── types.ts
```

### Desired Codebase Tree

```bash
/home/dustin/projects/formality/packages/react/src/
├── hooks/
│   ├── useConditions.ts              # Existing
│   ├── useFieldDisabledState.ts      # NEW - This PRP deliverable
│   ├── useInferredInputs.ts          # Existing
│   └── ...
├── __tests__/
│   ├── useFieldDisabledState.test.tsx  # NEW - Tests for the hook
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Circular Dependency Issue
// The disabled state comes FROM condition evaluation, but condition evaluation
// needs disabled state IN field states for isDisabled matcher.
// SOLUTION: This hook breaks the cycle by NOT building full field states.
// It only evaluates conditions to extract the disabled result, not the other way around.

// CRITICAL: useWatch Array Return Value
// useWatch with an array of names ALWAYS returns an array of values
// Even with a single field: useWatch({ name: ['field'] }) returns [value]
// Do NOT expect a single value when passing an array name.

// CRITICAL: Empty Array Optimization
// Always check if watchFields.length > 0 before calling useWatch
// Passing an empty array prevents unnecessary subscriptions

// CRITICAL: Undefined vs False
// Priority resolution MUST check !== undefined, not just truthy
// if (disabledProp !== undefined) return disabledProp;
// This allows disabled: false to properly override disabled: true from lower priority

// CRITICAL: getFieldState() Does NOT Include Disabled
// methods.getFieldState() from react-hook-form does NOT return disabled property
// Disabled state is computed separately from conditions, props, config, and group

// CRITICAL: Condition Disabled Logic
// Conditions use OR logic: any matching condition with disabled: true = disabled
// evaluateConditions returns { disabled: boolean | undefined, hasDisabledCondition: boolean }

// PATTERN: Return Types
// When no conditions exist, evaluateConditions returns undefined for all properties
// Always check hasDisabledCondition before using disabled value

// GOTCHA: Context Access
// useFormContext() may throw if used outside Form component
// Wrap in try-catch if hook needs to work standalone (not needed for this hook)
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// Input interface (matches useConditions pattern)
interface UseFieldDisabledStateOptions {
  fieldName: string;
  disabledProp?: boolean;
  fieldConfigDisabled?: boolean;
  conditions?: ConditionDescriptor[];
  groupDisabled?: boolean;
  subscribesTo?: string[];
}

// Return type: simple boolean
// This hook returns boolean, not an object (unlike useConditions)
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE /packages/react/src/hooks/useFieldDisabledState.ts
  - IMPLEMENT: useFieldDisabledState hook with UseFieldDisabledStateOptions interface
  - FOLLOW pattern: /packages/react/src/hooks/useConditions.ts (exact structure)
  - IMPORT: useMemo from react
  - IMPORT: useWatch from react-hook-form
  - IMPORT: evaluateConditions, ConditionResult, FieldStateInput from @formality-ui/core
  - IMPORT: ConditionDescriptor from @formality-ui/core
  - IMPORT: useFormContext from ../context/FormContext
  - IMPORT: useInferredInputs from ./useInferredInputs
  - NAMING: useFieldDisabledState function name, UseFieldDisabledStateOptions interface
  - PLACEMENT: /packages/react/src/hooks/useFieldDisabledState.ts
  - EXPORT: export function useFieldDisabledState

Task 2: IMPLEMENT Hook Signature and Context Access
  - DESTRUCTURE: options parameter into all properties
  - ACCESS CONTEXT: const { record, methods } = useFormContext()
  - FOLLOW pattern: useConditions.ts lines 54-56
  - GOTCHA: No try-catch needed - this hook is only used within Form

Task 3: IMPLEMENT Priority Resolution (Non-Conditional Sources)
  - CREATE useMemo for priority resolution
  - EVALUATE: prop > config > group > false (conditions evaluated separately)
  - PATTERN: Field.tsx lines 265-278
  - RETURN: baseDisabled state from non-conditional sources
  - DEPENDENCIES: disabledProp, fieldConfigDisabled, groupDisabled

Task 4: IMPLEMENT Condition Evaluation for Disabled
  - CALL: useInferredInputs({ conditions, subscribesTo })
  - CALL: useWatch with isolated subscriptions
  - BUILD: fieldValues map (follow useConditions pattern)
  - BUILD: fieldStates WITHOUT disabled property (use getFieldState)
  - CALL: evaluateConditions() to extract disabled result
  - FOLLOW: useConditions.ts lines 58-142
  - GOTCHA: fieldStates must NOT include disabled (creates circular dependency)

Task 5: IMPLEMENT Final Disabled Resolution
  - CREATE useMemo for final resolution
  - MERGE: baseDisabled (from Task 3) with condition disabled (from Task 4)
  - PRIORITY: non-conditional sources > conditions > false
  - RETURN: boolean (final disabled state)
  - PATTERN: Field.tsx isDisabled resolution but with conditions

Task 6: ADD JSDoc Documentation
  - DOCUMENT: Purpose, parameters, return value, example usage
  - FOLLOW: useConditions.ts JSDoc pattern (lines 26-52)
  - INCLUDE: Priority order explanation

Task 7: VERIFY EXPORT
  - ADD: export statement for useFieldDisabledState function
  - VERIFY: TypeScript types are properly defined
  - CHECK: All imports are correct
```

### Implementation Patterns & Key Details

```typescript
// ============================================
// PATTERN 1: Hook Structure (Follow useConditions)
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

interface UseFieldDisabledStateOptions {
  fieldName: string;
  disabledProp?: boolean;
  fieldConfigDisabled?: boolean;
  conditions?: ConditionDescriptor[];
  groupDisabled?: boolean;
  subscribesTo?: string[];
}

export function useFieldDisabledState(
  options: UseFieldDisabledStateOptions
): boolean {
  const {
    fieldName,
    disabledProp,
    fieldConfigDisabled,
    conditions = [],
    groupDisabled,
    subscribesTo,
  } = options;

  const { record, methods } = useFormContext();

  // ... implementation
}

// ============================================
// PATTERN 2: Priority Resolution (Field.tsx pattern)
// ============================================
const baseDisabled = useMemo(() => {
  // Resolution order: prop > config > group > false
  if (disabledProp !== undefined) return disabledProp;
  if (fieldConfigDisabled !== undefined) return fieldConfigDisabled;
  if (groupDisabled) return true;
  return false;
}, [disabledProp, fieldConfigDisabled, groupDisabled]);

// GOTCHA: Use !== undefined, not truthy check
// This allows false to properly override true from lower priority

// ============================================
// PATTERN 3: Condition Evaluation (useConditions pattern)
// ============================================
// Infer fields to watch from conditions
const watchFields = useInferredInputs({
  conditions,
  subscribesTo,
});

// Watch inferred fields (ISOLATED subscriptions)
const watchedValues = useWatch({
  control: methods.control,
  name: watchFields.length > 0 ? (watchFields as any) : [],
});

// Build field values map
const fieldValues = useMemo(() => {
  const values: Record<string, unknown> = {};

  if (watchFields.length === 0) {
    return values;
  }

  if (Array.isArray(watchedValues)) {
    watchFields.forEach((field, i) => {
      values[field] = watchedValues[i];
    });
  } else {
    values[watchFields[0]] = watchedValues;
  }

  return values;
}, [watchFields, watchedValues]);

// Build field states WITHOUT disabled property
// CRITICAL: Do NOT add disabled to fieldStates (creates circular dependency)
const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

  watchFields.forEach((fieldName) => {
    // getFieldState() reads current state without creating subscriptions
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false,
      // ❌ NO disabled property - this breaks the circular dependency
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);

// Evaluate conditions
const conditionResult = useMemo(() => {
  if (conditions.length === 0) {
    return {
      disabled: undefined,
      visible: undefined,
      setValue: undefined,
      hasDisabledCondition: false,
      hasVisibleCondition: false,
      hasSetCondition: false,
    };
  }

  return evaluateConditions({
    conditions,
    fieldValues,
    fieldStates,
    record,
    props: { name: fieldName },
  });
}, [conditions, fieldValues, fieldStates, record, fieldName]);

// ============================================
// PATTERN 4: Final Disabled Resolution
// ============================================
return useMemo(() => {
  // Priority: non-conditional (base) > conditions > false
  // If base is true or false (not undefined), it wins
  if (baseDisabled !== undefined) {
    return baseDisabled;
  }

  // Check conditions
  if (conditionResult.hasDisabledCondition) {
    return conditionResult.disabled ?? false;
  }

  // Default: enabled
  return false;
}, [baseDisabled, conditionResult]);

// ============================================
// PATTERN 5: JSDoc Documentation
// ============================================
/**
 * Resolves the disabled state for a field from multiple sources
 *
 * This hook implements the priority order for disabled state resolution:
 * 1. JSX prop (highest priority)
 * 2. Field config
 * 3. Condition evaluation
 * 4. Group state
 * 5. Default: false (field is enabled)
 *
 * Evaluates conditions using the same logic as useConditions but only
 * returns the disabled state as a boolean.
 *
 * @param options - Field configuration for disabled state resolution
 * @returns boolean - Whether the field should be disabled
 *
 * @example
 * ```tsx
 * const isDisabled = useFieldDisabledState({
 *   fieldName: 'email',
 *   disabledProp: props.disabled,
 *   fieldConfigDisabled: config.email?.disabled,
 *   conditions: config.email?.conditions,
 *   groupDisabled: groupContext.state.isDisabled,
 * });
 * ```
 */
export function useFieldDisabledState(
  options: UseFieldDisabledStateOptions
): boolean
```

### Integration Points

```yaml
FIELD COMPONENT:
  - file: /packages/react/src/components/Field.tsx
  - replace: Lines 265-278 (isDisabled resolution)
  - integration: Replace inline useMemo with useFieldDisabledState hook
  - pattern: const isDisabled = useFieldDisabledState({...})

USE_CONDITIONS HOOK:
  - file: /packages/react/src/hooks/useConditions.ts
  - future_integration: In P2.M1.T1.S2, useConditions will call this hook
  - circular_dependency: This hook intentionally avoids building full fieldStates with disabled

TYPES:
  - import: ConditionDescriptor, ConditionResult, FieldStateInput from @formality-ui/core
  - import: useFormContext from ../context/FormContext
  - import: useInferredInputs from ./useInferredInputs
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation
cd /home/dustin/projects/formality
pnpm --filter @formality-ui/react exec ruff check packages/react/src/hooks/useFieldDisabledState.ts --fix
pnpm --filter @formality-ui/react exec ruff format packages/react/src/hooks/useFieldDisabledState.ts

# Type checking
pnpm --filter @formality-ui/react exec tsc --noEmit

# Expected: Zero errors. Fix any issues before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Create test file
touch packages/react/src/__tests__/useFieldDisabledState.test.tsx

# Run tests
pnpm --filter @formality-ui/react test useFieldDisabledState

# Expected: All tests pass
```

**Test Coverage Required**:

```typescript
describe("useFieldDisabledState", () => {
  it("should return false when no sources provide disabled", () => {
    // Test default case
  });

  it("should prioritize JSX prop over config", () => {
    // Test disabledProp: true overrides fieldConfigDisabled: false
  });

  it("should prioritize config over conditions", () => {
    // Test fieldConfigDisabled: true overrides condition disabled: false
  });

  it("should prioritize conditions over group", () => {
    // Test condition disabled: true overrides groupDisabled: false
  });

  it("should use group state when no other sources", () => {
    // Test groupDisabled: true when others undefined
  });

  it("should evaluate conditions with OR logic", () => {
    // Test: any condition with disabled: true = disabled
  });

  it("should handle disabled: false properly", () => {
    // Test: disabled: false overrides disabled: true from lower priority
  });

  it("should not create subscriptions when no conditions", () => {
    // Test: useWatch not called when conditions empty
  });

  it("should infer field dependencies from conditions", () => {
    // Test: useInferredInputs called with conditions
  });
});
```

### Level 3: Integration Testing (System Validation)

```bash
# Run React package tests
pnpm --filter @formality-ui/react test

# Run integration tests
pnpm --filter @formality-ui/react test integration

# Expected: All existing tests still pass (no breaking changes)
```

### Level 4: Manual Testing

```typescript
// Test in example file or browser
// Create test case with:
// 1. Field with disabled prop
// 2. Field with config disabled
// 3. Field with condition disabled
// 4. Field with group disabled
// 5. Field with multiple sources (verify priority)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Hook file created at correct path
- [ ] Hook exported properly
- [ ] TypeScript compiles without errors
- [ ] No linting errors (ruff)
- [ ] No formatting issues
- [ ] All imports resolve correctly

### Feature Validation

- [ ] JSX prop has highest priority
- [ ] Field config has second priority
- [ ] Conditions have third priority
- [ ] Group state has fourth priority
- [ ] Default (false) returned when no sources match
- [ ] disabled: false properly overrides disabled: true
- [ ] Conditions use OR logic for disabled
- [ ] No subscriptions created when conditions empty
- [ ] Field dependencies inferred from conditions

### Code Quality Validation

- [ ] Follows useConditions pattern exactly
- [ ] Uses useMemo for performance
- [ ] Uses useInferredInputs for dependency inference
- [ ] Uses useWatch with isolated subscriptions
- [ ] Empty array optimization for useWatch
- [ ] Correct dependency arrays in all useMemo
- [ ] JSDoc documentation complete
- [ ] No circular dependency created
- [ ] fieldStates do NOT include disabled property

### Documentation & Deployment

- [ ] Hook has descriptive JSDoc
- [ ] Priority order documented in comments
- [ ] Example usage in JSDoc
- [ ] Interface exported if used externally
- [ ] File follows naming convention (useFieldDisabledState.ts)

---

## Anti-Patterns to Avoid

- ❌ **Don't add disabled to fieldStates** - Creates circular dependency with condition evaluation
- ❌ **Don't use truthy checks** - Must use `!== undefined` for priority resolution
- ❌ **Don't skip empty array check** - Must check `watchFields.length > 0` before useWatch
- ❌ **Don't watch entire form** - Must use isolated subscriptions via useInferredInputs
- ❌ **Don't return object** - Returns boolean, not object (unlike useConditions)
- ❌ **Don't forget undefined vs false** - `undefined` means "not set", `false` means "explicitly enabled"
- ❌ **Don't use complex logic** - Priority resolution is straightforward, don't over-engineer
- ❌ **Don't ignore conditions** - Must evaluate conditions even when other sources provide disabled
- ❌ **Don't duplicate useConditions** - This hook is specifically for disabled state, not general conditions
- ❌ **Don't skip useMemo** - Performance critical - use useMemo for all derived state

---

## Confidence Score

**8/10** - One-pass implementation success likelihood

**Confidence Justification**:
- ✅ Reference pattern (useConditions) is well-documented and consistent
- ✅ All file paths and line numbers provided
- ✅ Type definitions are clear
- ✅ Priority order is well-defined
- ✅ Gotchas are documented (circular dependency, undefined vs false)
- ⚠️ Some complexity in condition evaluation integration
- ✅ Testing patterns are established in codebase

**Risk Factors**:
- Circular dependency with condition evaluation is complex but documented
- Priority order must be implemented precisely
- Integration with useConditions in future tasks must be considered

**Mitigation**:
- Comprehensive gotcha documentation
- Exact line number references for all patterns
- Step-by-step implementation tasks
- Test coverage requirements specified

---

## Appendix: Quick Reference

### File Locations Summary

```
Reference Pattern:
  /packages/react/src/hooks/useConditions.ts

New Hook to Create:
  /packages/react/src/hooks/useFieldDisabledState.ts

Priority Resolution Pattern:
  /packages/react/src/components/Field.tsx (lines 265-278)

Core Evaluation:
  /packages/core/src/conditions/evaluate.ts

Dependency Inference:
  /packages/react/src/hooks/useInferredInputs.ts

Context Access:
  /packages/react/src/context/FormContext.ts
```

### Key Import Statements

```typescript
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
```

### Priority Order Summary

```
1. disabledProp (JSX)           - <Field disabled={true} />
2. fieldConfigDisabled          - { email: { disabled: true } }
3. conditions (evaluated)       - { when: "x", disabled: true }
4. groupDisabled                - <FieldGroup disabled />
5. default: false               - Field is enabled by default
```
