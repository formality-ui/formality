# Product Requirement Prompt (PRP): Add inputConfig Parameter to changeField

## Goal

**Feature Goal**: Enable `changeField` callback to receive `InputConfig` parameter to support per-field conditional execution based on `debounce: false` setting (immediate submission bypass).

**Deliverable**: Updated `changeField` function signature accepting optional `inputConfig?: InputConfig` parameter across Form.tsx and FormContext.ts with proper TypeScript typing and dependency array management.

**Success Definition**:

- `changeField` signature updated to `(name: string, value: unknown, inputConfig?: InputConfig) => void`
- `InputConfig` type imported from `@formality-ui/core` package
- Dependency array includes `inputConfig` where applicable
- TypeScript compiles without errors: `pnpm exec tsc --noEmit`
- Existing tests pass: `pnpm test`
- No runtime errors when calling `changeField` with or without `inputConfig`

## Why

**Business Context**:
The Form component supports auto-save with debounced submission to prevent excessive submits. However, some input types need immediate submission (e.g., when `debounce: false` is set on InputConfig). To enable this conditional behavior in the next subtask (P1.M2.T1.S2), `changeField` must receive the field's `InputConfig` to check its `debounce` setting.

**Technical Justification**:

- Currently, `changeField` only receives `name` and `value` parameters
- Field component has access to `inputConfig` but cannot pass it to `changeField`
- This change enables per-field auto-save behavior control
- Follows existing callback patterns in the codebase (optional parameters)

**Integration Points**:

- Called by: `Field.tsx` handleChange function (line 369)
- Used by: Auto-save trigger logic in `Form.tsx` (lines 299-317)
- Next step: P1.M2.T1.S2 will use `inputConfig?.debounce === false` for conditional immediate submission

## What

### Scope of Changes

**Files to Modify**:

1. `packages/react/src/components/Form.tsx` - Update `changeField` function definition
2. `packages/react/src/context/FormContext.ts` - Update `FormContextValue` interface

### Current State

```typescript
// packages/react/src/components/Form.tsx (lines 299-317)
const changeField = useCallback(
  (name: string, value: unknown) => {
    // Auto-save trigger
    if (autoSave) {
      // Accumulate this change
      pendingChangedFields.current.add(name);

      // Add affected fields (those that depend on this field via conditions)
      const affected = getAffectedFields(name);
      for (const field of affected) {
        pendingAffectedFields.current.add(field);
      }

      // Trigger debounced auto-save
      debouncedSubmit();
    }
  },
  [autoSave, getAffectedFields],
);
```

```typescript
// packages/react/src/context/FormContext.ts (lines 86-91)
/**
 * Programmatically change a field's value
 * @param name - Field name
 * @param value - New value
 */
changeField: (name: string, value: unknown) => void;
```

### Target State

```typescript
// packages/react/src/components/Form.tsx (lines 299-317)
const changeField = useCallback(
  (name: string, value: unknown, inputConfig?: InputConfig) => {
    // Auto-save trigger
    if (autoSave) {
      // Accumulate this change
      pendingChangedFields.current.add(name);

      // Add affected fields (those that depend on this field via conditions)
      const affected = getAffectedFields(name);
      for (const field of affected) {
        pendingAffectedFields.current.add(field);
      }

      // Trigger debounced auto-save
      debouncedSubmit();
    }
  },
  [autoSave, getAffectedFields],
);
```

```typescript
// packages/react/src/context/FormContext.ts (lines 86-92)
/**
 * Programmatically change a field's value
 * @param name - Field name
 * @param value - New value
 * @param inputConfig - Optional input config for the field (for conditional execution)
 */
changeField: (name: string, value: unknown, inputConfig?: InputConfig) => void;
```

### Success Criteria

- [ ] `changeField` accepts optional third parameter `inputConfig?: InputConfig`
- [ ] `InputConfig` imported from `@formality-ui/core` in both files
- [ ] JSDoc comments updated to document the new parameter
- [ ] TypeScript compilation succeeds: `pnpm exec tsc --noEmit`
- [ ] All existing tests pass: `pnpm test`
- [ ] No breaking changes to existing `changeField` calls (backward compatible)

## All Needed Context

### Context Completeness Check

**Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Exact file locations and line numbers
- Current and target code states
- InputConfig type definition and import path
- Existing useCallback patterns to follow
- Test patterns and validation commands
- Known gotchas specific to this codebase

### Documentation & References

```yaml
# MUST READ - Core Implementation Files

- file: packages/react/src/components/Form.tsx
  why: Contains changeField function definition that needs updating
  pattern: useCallback with dependency array pattern (lines 299-317)
  critical: changeField is memoized with [autoSave, getAffectedFields] dependencies
  gotcha: InputConfig must be imported but NOT added to dependency array (not used in function body yet)

- file: packages/react/src/context/FormContext.ts
  why: Contains FormContextValue interface that defines changeField type
  pattern: Interface method signatures with JSDoc comments (lines 86-91)
  critical: Type must match implementation in Form.tsx
  gotcha: Update JSDoc to document the new optional parameter

- file: packages/react/src/components/Field.tsx
  why: Shows how changeField is called (will use inputConfig in P1.M2.T1.S3)
  pattern: handleChange calls changeField(name, parsedValue) (line 369)
  critical: Field has access to inputConfig via useMemo (lines 143-168)
  note: Next subtask will update Field to pass inputConfig

# TYPE DEFINITIONS

- file: packages/core/src/types/config.ts
  why: Contains InputConfig interface definition
  pattern: Interface with optional properties (lines 45-78)
  critical: Import statement: `import type { InputConfig } from "@formality-ui/core";`
  section: Lines 45-78 (InputConfig interface)
  gotcha: The debounce property (line 53) is the key property for future use

# EXISTING PATTERNS - Follow These Examples

- file: packages/react/src/components/Form.tsx
  why: Shows multiple useCallback patterns with dependency arrays
  pattern: All callbacks follow same structure - useCallback(fn, [deps])
  critical: Empty dependency array when function uses only refs (e.g., setFieldValidating)
  gotcha: Don't add inputConfig to deps - it's a parameter, not a closure variable

# TEST PATTERNS

- file: packages/react/src/__tests__/Form.test.tsx
  why: Shows Form component test structure and patterns
  pattern: render with FormalityProvider wrapper, vi.fn() for mocks
  critical: Tests verify props are passed correctly and context is accessible

- file: packages/react/src/__tests__/Field.test.tsx
  why: Shows Field component change handler testing
  pattern: userEvent.setup() for user interaction, waitFor for async updates
  critical: Tests use data-testid attributes for element selection

# EXTERNAL DOCUMENTATION

- url: https://react.dev/reference/react/useCallback
  why: React useCallback hook documentation
  critical: Understand dependency array rules - only include values from component scope

- url: https://www.typescriptlang.org/docs/handbook/2/functions.html#optional-parameters
  why: TypeScript optional parameter syntax
  critical: Use `parameter?: Type` for optional parameters

# PREVIOUS WORK ITEM CONTEXT

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M1T3S4/PRP.md
  why: Previous PRP shows PRP structure and patterns used in this codebase
  pattern: PRP template usage, validation commands, context structure
  critical: Follows same information density standards
```

### Current Codebase Tree (Relevant Sections)

```bash
packages/
├── core/
│   └── src/
│       └── types/
│           └── config.ts              # InputConfig type definition (lines 45-78)
└── react/
    └── src/
        ├── components/
        │   ├── Form.tsx               # changeField implementation (lines 299-317)
        │   └── Field.tsx              # changeField usage (line 369)
        └── context/
            └── FormContext.ts         # FormContextValue interface (lines 86-91)

plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/
└── P1M2T1S1/
    ├── PRP.md                         # This file
    └── research/                      # External research (if needed)
```

### Desired Codebase Tree with Changes

```bash
# MODIFIED FILES:
packages/react/src/components/Form.tsx
  - Line 27-32: Add InputConfig to imports from @formality-ui/core
  - Lines 299-317: Update changeField signature to include inputConfig?: InputConfig

packages/react/src/context/FormContext.ts
  - Line 10: Add InputConfig to imports from @formality-ui/core
  - Lines 86-92: Update changeField type signature to include inputConfig?: InputConfig

# NO NEW FILES CREATED
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: InputConfig is a TYPE, not a value
// Use 'import type { InputConfig }' for type-only import
// This enables tree-shaking and prevents runtime import errors

// CRITICAL: Optional parameter comes AFTER required parameters
// Correct: (name: string, value: unknown, inputConfig?: InputConfig)
// Wrong: (name: string, inputConfig?: InputConfig, value: unknown)

// CRITICAL: Do NOT add inputConfig to useCallback dependency array
// inputConfig is a function PARAMETER, not a closure variable
// Only values from component scope go in dependency array
// Current deps: [autoSave, getAffectedFields] - KEEP THESE

// CRITICAL: The function body doesn't use inputConfig yet
// This PRP only ADDS the parameter - P1.M2.T1.S2 will use it
// TypeScript allows unused parameters with the _ prefix or eslint-disable

// GOTCHA: InputConfig.debounce can be number | false
// When checking in P1.M2.T1.S2: inputConfig?.debounce === false (not !inputConfig.debounce)
// This distinguishes "undefined" from explicit "false"

// GOTCHA: Field.tsx already computes inputConfig via useMemo (lines 143-168)
// This merge logic resolves provider + form inputs for the field type
// P1.M2.T1.S3 will pass this computed inputConfig to changeField

// GOTCHA: FormContextValue is a generic interface
// <TFieldValues extends FieldValues = FieldValues>
// changeField signature update doesn't affect generic type parameter

// PATTERN: All callbacks in Form.tsx use useCallback
// registerField, unregisterField, addSubscription, etc.
 changeField should follow the same pattern

// PATTERN: JSDoc comments use @param format
// Update JSDoc to document the new inputConfig parameter

// PATTERN: Tests use React Testing Library
// data-testid for element selection
// waitFor for async state updates
```

## Implementation Blueprint

### Type Safety Strategy

The `InputConfig` type provides full TypeScript IntelliSense and type checking:

```typescript
// InputConfig interface (from packages/core/src/types/config.ts)
export interface InputConfig<TValue = unknown> {
  component: unknown;
  defaultValue: TValue;
  debounce?: number | false; // <-- Key property for P1.M2.T1.S2
  inputFieldProp?: string;
  valueField?: string;
  getSubmitField?: (fieldName: string) => string;
  parser?: string | ((value: unknown) => TValue);
  formatter?: string | ((value: TValue) => unknown);
  validator?: ValidatorSpec;
  template?: unknown;
  props?: Record<string, unknown>;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY packages/react/src/components/Form.tsx - Update Imports
  - ADD: InputConfig to type imports from "@formality-ui/core"
  - FIND: Line 27-32 (import section)
  - BEFORE: import type { FormFieldsConfig, FormConfig, FormState, InputConfig } from "@formality-ui/core";
  - AFTER: (InputConfig already imported - verify present)
  - VERIFY: InputConfig is in the import list

Task 2: MODIFY packages/react/src/components/Form.tsx - Update changeField Signature
  - FIND: Lines 299-317 (changeField useCallback)
  - UPDATE: Function signature to include third parameter
  - BEFORE: const changeField = useCallback((name: string, value: unknown) => {
  - AFTER: const changeField = useCallback((name: string, value: unknown, inputConfig?: InputConfig) => {
  - PRESERVE: All existing function body logic
  - PRESERVE: Dependency array [autoSave, getAffectedFields]
  - NOTE: Do NOT add inputConfig to dependency array (function parameter, not closure variable)

Task 3: MODIFY packages/react/src/context/FormContext.ts - Update Imports
  - ADD: InputConfig to type imports from "@formality-ui/core"
  - FIND: Line 6-10 (import section)
  - BEFORE: import type { FormFieldsConfig, FormConfig, FormState } from "@formality-ui/core";
  - AFTER: import type { FormFieldsConfig, FormConfig, FormState, InputConfig } from "@formality-ui/core";

Task 4: MODIFY packages/react/src/context/FormContext.ts - Update FormContextValue Interface
  - FIND: Lines 86-91 (changeField in FormContextValue interface)
  - UPDATE: Method signature to include third parameter
  - BEFORE: changeField: (name: string, value: unknown) => void;
  - AFTER: changeField: (name: string, value: unknown, inputConfig?: InputConfig) => void;
  - UPDATE: JSDoc comment to document new parameter
  - ADD: @param inputConfig - Optional input config for the field

Task 5: VERIFY TypeScript Compilation
  - EXECUTE: pnpm exec tsc --noEmit --project packages/react/tsconfig.json
  - EXPECTED: Zero type errors
  - VERIFY: InputConfig type is recognized in both files
  - VERIFY: Type signatures match between implementation and interface

Task 6: RUN Existing Tests
  - EXECUTE: pnpm test
  - EXPECTED: All tests pass
  - VERIFY: No breaking changes to existing changeField calls
  - VERIFY: Backward compatibility maintained (calls without inputConfig still work)

Task 7: RUN Linting
  - EXECUTE: pnpm exec eslint packages/react/src/components/Form.tsx --fix
  - EXECUTE: pnpm exec eslint packages/react/src/context/FormContext.ts --fix
  - EXPECTED: Zero linting errors
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: useCallback with Optional Parameter
// Source: packages/react/src/components/Form.tsx:299-317

const changeField = useCallback(
  (name: string, value: unknown, inputConfig?: InputConfig) => {
    // Function body unchanged for this PRP
    // P1.M2.T1.S2 will add: if (inputConfig?.debounce === false) { /* immediate submit */ }

    if (autoSave) {
      pendingChangedFields.current.add(name);
      const affected = getAffectedFields(name);
      for (const field of affected) {
        pendingAffectedFields.current.add(field);
      }
      debouncedSubmit();
    }
  },
  [autoSave, getAffectedFields], // NOTE: inputConfig NOT in deps (it's a parameter)
);

// Pattern 2: Interface Method Signature with Optional Parameter
// Source: packages/react/src/context/FormContext.ts:86-92

export interface FormContextValue<
  TFieldValues extends FieldValues = FieldValues,
> {
  // ... other properties

  /**
   * Programmatically change a field's value
   * @param name - Field name
   * @param value - New value
   * @param inputConfig - Optional input config for the field (for conditional execution)
   */
  changeField: (
    name: string,
    value: unknown,
    inputConfig?: InputConfig,
  ) => void;

  // ... other properties
}

// Pattern 3: Type Import Statement
// Source: packages/react/src/components/Form.tsx:27-32

import type {
  FormFieldsConfig,
  FormConfig,
  FormState,
  InputConfig, // Ensure this is present
} from "@formality-ui/core";
```

### Integration Points

```yaml
FIELD COMPONENT USAGE:
  - file: packages/react/src/components/Field.tsx
  - line: 369
  - current: changeField(name, parsedValue)
  - future: changeField(name, parsedValue, inputConfig)
  - note: Updated in P1.M2.T1.S3

CONTEXT PROVIDER:
  - file: packages/react/src/components/Form.tsx
  - lines: 581-619
  - changeField is included in contextValue useMemo
  - dependency array includes changeField
  - no changes needed for this PRP

FUTURE WORK - P1.M2.T1.S2:
  - will add conditional execution: if (inputConfig?.debounce === false)
  - will call submitImmediate() instead of debouncedSubmit()
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# TypeScript type checking
cd /home/dustin/projects/formality
pnpm exec tsc --noEmit --project packages/react/tsconfig.json

# Expected: Zero type errors. InputConfig type must be recognized.

# ESLint checking
pnpm exec eslint packages/react/src/components/Form.tsx --fix
pnpm exec eslint packages/react/src/context/FormContext.ts --fix

# Expected: Zero linting errors. Auto-fix should handle any formatting.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run all React package tests
pnpm test --filter=react

# Run Form component tests specifically
pnpm test Form.test

# Run Field component tests
pnpm test Field.test

# Expected: All tests pass. No breaking changes to existing functionality.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run complete test suite
pnpm test

# Build all packages to verify no compilation issues
pnpm build

# Expected: All tests pass, build succeeds without TypeScript errors.
```

### Level 4: Manual Verification

```bash
# Verify InputConfig is accessible in Form.tsx
grep -n "InputConfig" packages/react/src/components/Form.tsx

# Should show:
# - Import statement (around line 27-32)
# - Function signature (line 299)

# Verify InputConfig is accessible in FormContext.ts
grep -n "InputConfig" packages/react/src/context/FormContext.ts

# Should show:
# - Import statement (around line 6-10)
# - Interface signature (around line 86-92)

# Verify changeField signature matches
grep -A 2 "changeField:" packages/react/src/context/FormContext.ts
grep -A 2 "const changeField" packages/react/src/components/Form.tsx

# Both should show: (name: string, value: unknown, inputConfig?: InputConfig)
```

## Final Validation Checklist

### Technical Validation

- [ ] InputConfig imported in Form.tsx (line 27-32)
- [ ] InputConfig imported in FormContext.ts (line 6-10)
- [ ] changeField signature updated in Form.tsx (line 299)
- [ ] changeField signature updated in FormContext.ts (line 91)
- [ ] JSDoc comments updated in FormContext.ts
- [ ] TypeScript compiles: `pnpm exec tsc --noEmit` (zero errors)
- [ ] ESLint passes: `pnpm exec eslint packages/react/src --fix`
- [ ] All tests pass: `pnpm test`
- [ ] No inputConfig in useCallback dependency array
- [ ] Backward compatibility maintained

### Feature Validation

- [ ] changeField accepts 2 parameters (backward compatible)
- [ ] changeField accepts 3 parameters with inputConfig
- [ ] InputConfig type provides IntelliSense for debounce property
- [ ] Field component can still call changeField(name, value) without error
- [ ] Type signatures match between Form.tsx and FormContext.ts

### Code Quality Validation

- [ ] Follows existing useCallback pattern in Form.tsx
- [ ] Follows existing interface pattern in FormContext.ts
- [ ] Optional parameter syntax correct (?:)
- [ ] Parameter order correct (required before optional)
- [ ] No unused variable warnings (inputConfig will be used in P1.M2.T1.S2)
- [ ] JSDoc comments present and accurate

### Documentation & Deployment

- [ ] JSDoc @param added for inputConfig
- [ ] Import statements use 'type' keyword for type-only import
- [ ] No runtime changes (type-only modification)
- [ ] No breaking changes to existing API

## Anti-Patterns to Avoid

- ❌ Don't add inputConfig to useCallback dependency array (it's a parameter, not a closure variable)
- ❌ Don't make inputConfig required (must be optional for backward compatibility)
- ❌ Don't change parameter order (required params must come before optional)
- ❌ Don't use value-based import for InputConfig (use `import type`)
- ❌ Don't add implementation logic for inputConfig in this PRP (P1.M2.T1.S2 will do that)
- ❌ Don't forget to update both Form.tsx AND FormContext.ts
- ❌ Don't skip JSDoc comment updates
- ❌ Don't break backward compatibility (calls without inputConfig must still work)
- ❌ Don't use `inputConfig!` non-null assertion (use optional chaining `inputConfig?.`)
- ❌ Don't modify Field.tsx in this PRP (that's P1.M2.T1.S3)

## Implementation Notes

### Relationship to Other Work Items

**This PRP is Part Of**: P1.M2.T1 (Modify Form Component)

- P1.M2.T1.S1 (This PRP): Add inputConfig parameter to changeField
- P1.M2.T1.S2 (Next): Implement conditional execution based on inputConfig.debounce
- P1.M2.T1.S3 (After): Update Field to pass inputConfig to changeField
- P1.M2.T1.S4 (After): Fix Form debounce prop type

**Dependency Chain**:

1. P1.M2.T1.S1 (This) → Adds parameter infrastructure
2. P1.M2.T1.S2 → Uses parameter for conditional logic
3. P1.M2.T1.S3 → Passes parameter from Field component
4. P1.M2.T2.\* → Tests the complete debounce: false feature

### Why This Approach

**Separation of Concerns**:

- This PRP only ADDS the parameter (pure type change)
- P1.M2.T1.S2 ADDS the logic using the parameter
- Each PRP is independently testable and verifiable

**Type-First Development**:

- Adding parameter first ensures type safety
- Subsequent implementation is guided by types
- TypeScript catches mismatches at compile time

**Backward Compatibility**:

- Optional parameter = no breaking changes
- Existing calls work without modification
- New behavior is opt-in via passing inputConfig

### Test Command Reference

```bash
# TypeScript type checking
pnpm exec tsc --noEmit --project packages/react/tsconfig.json

# Run all tests
pnpm test

# Run React package tests only
pnpm test --filter=react

# Run specific test files
pnpm test Form.test
pnpm test Field.test

# ESLint
pnpm exec eslint packages/react/src --fix

# Build verification
pnpm build

# Watch mode during development
pnpm test:watch --filter=react
```

---

## Summary

This PRP provides complete context for adding the `inputConfig` parameter to the `changeField` callback. The changes are:

1. **Form.tsx**: Add `inputConfig?: InputConfig` parameter to `changeField` function
2. **FormContext.ts**: Update `FormContextValue.changeField` type signature

The implementation is straightforward type-only modification with no runtime logic changes in this PRP. The parameter will be used in P1.M2.T1.S2 for conditional immediate submission when `inputConfig.debounce === false`.

**Confidence Score**: 10/10 for one-pass implementation success - all necessary context, patterns, file locations, and validation approaches are provided in this PRP.
