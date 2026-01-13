# PRP: Add inputConfig Parameter to changeField

**Work Item**: P1.M2.T1.S1 - Add inputConfig parameter to changeField
**Parent Task**: P1.M2 - debounce: false Immediate Submission
**Priority**: P1 (Critical)

---

## Goal

**Feature Goal**: Extend the `changeField` callback function to accept an optional `inputConfig` parameter, enabling per-field auto-save behavior control based on the `InputConfig.debounce` property.

**Deliverable**: Updated `changeField` function signature `(name: string, value: unknown, inputConfig?: InputConfig) => void` with proper TypeScript typing and dependency array configuration.

**Success Definition**:
- Function signature updated with optional `inputConfig` parameter
- Type imports added for `InputConfig` from `@formality-ui/core`
- Dependency array includes `inputConfig` (when used in conditional logic in next subtask)
- No breaking changes to existing calls (parameter is optional)
- TypeScript compilation succeeds

---

## Why

- **User Impact**: Enables developers to specify per-field auto-save behavior via `InputConfig.debounce: false` for immediate submission on specific fields while maintaining debounce for others
- **Integration**: Foundation for P1.M2.T1.S2 (conditional execution) and P1.M2.T1.S3 (Field component integration)
- **Problems Solved**: Currently, all fields share the same debounce setting; this allows granular control for fields that need immediate submission (e.g., dangerous actions, instant feedback)

---

## What

Add an optional third parameter to the `changeField` callback function:

**Current Signature**:
```typescript
changeField: (name: string, value: unknown) => void;
```

**Target Signature**:
```typescript
changeField: (name: string, value: unknown, inputConfig?: InputConfig) => void;
```

### Success Criteria

- [ ] `changeField` function accepts optional `inputConfig` parameter
- [ ] TypeScript type `InputConfig` imported from `@formality-ui/core`
- [ ] `FormContextValue` interface updated with new signature
- [ ] Existing `changeField` calls remain functional (backward compatible)
- [ ] No TypeScript errors after changes

---

## All Needed Context

### Context Completeness Check

✅ **Passes "No Prior Knowledge" test**: This PRP provides all necessary context including:
- Exact file paths and line numbers
- Complete type definitions
- Import patterns used in the codebase
- Testing patterns and commands
- Dependency management approach

### Documentation & References

```yaml
# MUST READ - Critical implementation references

- url: https://react.dev/reference/react/useCallback
  why: Understanding React useCallback dependency arrays with optional parameters
  critical: Optional parameters in dependency arrays can cause infinite loops if not handled correctly

- url: https://www.typescriptlang.org/docs/handbook/2/functions.html#optional-parameters
  why: TypeScript optional parameter syntax and best practices
  critical: Use `?` suffix for optional parameters, must come after required parameters

- file: packages/react/src/components/Form.tsx
  why: Contains changeField implementation (lines 299-317) and FormContextValue creation (lines 581-619)
  pattern: useCallback function with dependency array
  gotcha: InputConfig is already imported at line 31 for mergedInputs - reuse this import

- file: packages/react/src/context/FormContext.ts
  why: Contains FormContextValue interface definition where changeField signature is declared (line 91)
  pattern: Interface method signature declarations
  gotcha: Must update both the interface AND the implementation

- file: packages/react/src/components/Field.tsx
  why: Shows how changeField is called (line 369) and how inputConfig is computed (lines 143-168)
  pattern: inputConfig computation via useMemo with resolveInputConfig
  gotcha: Field already has inputConfig available - will pass it in P1.M2.T1.S3

- file: packages/core/src/types/config.ts
  why: InputConfig type definition (lines 45-78)
  pattern: Interface with optional properties using `?` suffix
  critical: The `debounce?: number | false` property is the key for P1.M2.T1.S2

- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: Reference for testing auto-save behavior with fake timers
  pattern: vi.useFakeTimers(), vi.advanceTimersByTimeAsync(), waitFor expectations
  gotcha: Always clean up with vi.useRealTimers() in afterEach
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── types/
│   │       │   ├── config.ts          # InputConfig type definition (line 45)
│   │       │   └── index.ts           # Type exports
│   │       └── index.ts               # Main package exports
│   └── react/
│       └── src/
│           ├── components/
│           │   ├── Form.tsx           # changeField implementation (line 299)
│           │   └── Field.tsx          # changeField caller (line 369)
│           ├── context/
│           │   └── FormContext.ts     # FormContextValue interface (line 91)
│           └── __tests__/
│               └── autosave-validation.test.tsx  # Auto-save test patterns
├── plan/
│   └── 001_bbf464589edd/
│       └── bugfix/
│           └── 001_7b007b20a2ac/
│               └── P1M2T1S1/
│                   └── PRP.md         # This file
└── package.json                        # pnpm workspace config
```

### Desired Codebase Tree (Files to Modify)

```bash
# Modified files:
packages/react/src/components/Form.tsx        # Add inputConfig parameter to changeField useCallback
packages/react/src/context/FormContext.ts     # Update FormContextValue.changeField signature

# No new files created in this subtask
# Tests will be added in P1.M2.T2 (Add Tests for debounce: false)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: TypeScript optional parameter ordering
// Optional parameters MUST come after required parameters
// CORRECT: (name: string, value: unknown, inputConfig?: InputConfig)
// WRONG:   (name: string, inputConfig?: InputConfig, value: unknown)

// CRITICAL: Dependency array with optional parameters
// When inputConfig is used in conditional logic (P1.M2.T1.S2), it MUST be in dependency array
// Current task: Just add parameter, don't use it yet
// Next task (P1.M2.T1.S2): Will add inputConfig to dependency array

// GOTCHA: InputConfig already imported in Form.tsx (line 31)
// Don't add duplicate import - the type is already available
// Existing import: import type { InputConfig } from "@formality-ui/core";

// GOTCHA: FormContextValue is used in FormContext.ts and created in Form.tsx
// BOTH locations must be updated for consistency
// 1. FormContext.ts line 91: Interface declaration
// 2. Form.tsx lines 299-317: useCallback implementation

// PATTERN: This codebase prefers object-based optional parameters over direct optional params
// However, for this specific case, direct optional parameter is appropriate because:
// - It's a callback passed through context
// - Backward compatibility is required (existing calls must work)
// - The parameter comes from an existing computed value (inputConfig in Field)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - this task modifies an existing callback signature.

**InputConfig Type** (already exists in core package):
```typescript
// packages/core/src/types/config.ts:45-78
export interface InputConfig<TValue = unknown> {
  component: unknown;
  defaultValue: TValue;
  debounce?: number | false;  // Key property for P1.M2.T1.S2
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
Task 1: UPDATE packages/react/src/context/FormContext.ts
  - MODIFY: FormContextValue.changeField type signature (line 91)
  - CURRENT: changeField: (name: string, value: unknown) => void;
  - TARGET: changeField: (name: string, value: unknown, inputConfig?: InputConfig) => void;
  - IMPORT: Add InputConfig to existing type imports from @formality-ui/core
  - NAMING: Follow existing optional parameter pattern with `?` suffix
  - PLACEMENT: Interface declaration line 91

Task 2: UPDATE packages/react/src/components/Form.tsx changeField implementation
  - MODIFY: changeField useCallback function signature (line 299)
  - CURRENT: const changeField = useCallback((name: string, value: unknown) => {
  - TARGET: const changeField = useCallback((name: string, value: unknown, inputConfig?: InputConfig) => {
  - IMPORT: No new import needed - InputConfig already imported at line 31
  - DEPENDENCIES: Task 1 must be complete (interface definition)
  - PLACEMENT: useCallback declaration at lines 299-317
  - GOTCHA: Don't add inputConfig to dependency array yet - will happen in P1.M2.T1.S2

Task 3: VERIFY TypeScript compilation
  - RUN: pnpm -F @formality-ui/react run tsc --noEmit
  - EXPECT: No type errors
  - VALIDATE: Existing changeField calls still compile (backward compatibility)
  - FILE: Check packages/react/src/components/Field.tsx line 369

Task 4: VERIFY existing tests pass
  - RUN: pnpm test packages/react/src/__tests__/autosave-validation.test.tsx
  - EXPECT: All existing tests pass
  - REASON: Changes should be backward compatible
  - NO NEW TESTS: Tests will be added in P1.M2.T2
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Optional parameter in callback (Form.tsx line 299)
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
      // NOTE: In P1.M2.T1.S2, this will become conditional:
      // if (inputConfig?.debounce === false) {
      //   submitImmediate();
      // } else {
      //   debouncedSubmit();
      // }
      debouncedSubmit();
    }
  },
  [autoSave, getAffectedFields], // inputConfig added in P1.M2.T1.S2
);

// PATTERN: Interface signature with optional parameter (FormContext.ts line 91)
export interface FormContextValue<TFieldValues extends FieldValues = FieldValues> {
  // ... other properties ...

  /**
   * Programmatically change a field's value
   * @param name - Field name
   * @param value - New value
   * @param inputConfig - Optional input configuration for this field type
   */
  changeField: (name: string, value: unknown, inputConfig?: InputConfig) => void;
  //                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ADDED
}

// GOTCHA: Import statement already exists in Form.tsx line 31
// import type { InputConfig } from "@formality-ui/core";
// Do NOT add duplicate import

// GOTCHA: FormContext.ts needs to import InputConfig
// Add to line 6-10 (existing type imports from @formality-ui/core)
```

### Integration Points

```yaml
TYPE_IMPORTS:
  - file: packages/react/src/context/FormContext.ts
    add: "import type { InputConfig } from \"@formality-ui/core\";"
    to: "Existing type imports section (lines 6-10)"

  - file: packages/react/src/components/Form.tsx
    action: NO ACTION NEEDED
    reason: InputConfig already imported at line 31

CONTEXT_VALUE:
  - file: packages/react/src/components/Form.tsx
    update: contextValue useMemo (lines 581-619)
    reason: changeField is included in dependency array
    gotcha: No changes needed - changeField reference remains the same

FIELD_COMPONENT:
  - file: packages/react/src/components/Field.tsx
    update: handleChange function (lines 356-372)
    action: Will be updated in P1.M2.T1.S3 to pass inputConfig
    current: changeField(name, parsedValue);
    future: changeField(name, parsedValue, inputConfig);
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type checking - Run after each file modification
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors
# Common errors to fix:
# - "Property 'inputConfig' does not exist on type..." - Add to interface
# - "Cannot find name 'InputConfig'" - Add import statement
# - "Parameter 'inputConfig' implicitly has 'any' type" - Add type annotation

# Linting (if project uses ESLint)
pnpm -F @formality-ui/react run lint

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run existing auto-save tests to verify backward compatibility
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: All tests pass - no behavior changes yet
# This task is just adding the parameter, not using it

# Run all react package tests
pnpm -F @formality-ui/react test

# Expected: All tests pass
# Any failures indicate breaking changes were introduced
```

### Level 3: Integration Testing (System Validation)

```bash
# No integration tests needed for this subtask
# The parameter is not used yet - just added to signature
# Integration testing will happen in P1.M2.T1.S2 and P1.M2.T1.S3

# Verify package builds successfully
pnpm -F @formality-ui/react run build

# Expected: Build completes without errors
```

### Level 4: Manual Validation (Developer Testing)

```bash
# Create a simple test component to verify type checking
cat > /tmp/test-inputconfig-param.tsx << 'EOF'
import { Form } from '@formality-ui/react';
import type { InputConfig } from '@formality-ui/core';

// Test that the type signature is correct
const testChangeField = (
  changeField: (name: string, value: unknown, inputConfig?: InputConfig) => void
) => {
  // Should work without inputConfig
  changeField('test', 'value');

  // Should work with inputConfig
  const config: InputConfig = {
    component: 'input',
    defaultValue: '',
  };
  changeField('test', 'value', config);
};

console.log('Type checking passed!');
EOF

# Run TypeScript check on the test file
pnpm exec tsc --noEmit /tmp/test-inputconfig-param.tsx

# Expected: No type errors
```

---

## Final Validation Checklist

### Technical Validation

- [ ] FormContext.ts interface updated with new signature
- [ ] Form.tsx useCallback updated with new signature
- [ ] TypeScript compilation succeeds: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] All existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] No duplicate InputConfig imports in Form.tsx
- [ ] InputConfig import added to FormContext.ts

### Feature Validation

- [ ] changeField accepts calls without inputConfig parameter (backward compatible)
- [ ] changeField accepts calls with inputConfig parameter
- [ ] TypeScript IntelliSense shows new parameter as optional
- [ ] No breaking changes to existing Field component usage

### Code Quality Validation

- [ ] Follows existing TypeScript optional parameter conventions
- [ ] JSDoc comment updated if present
- [ ] No eslint/prettier warnings introduced
- [ ] Parameter order: required params first, optional last

### Documentation & Readiness

- [ ] Code is self-documenting with clear parameter names
- [ ] Ready for P1.M2.T1.S2 (implement conditional execution)
- [ ] Ready for P1.M2.T1.S3 (update Field to pass inputConfig)

---

## Anti-Patterns to Avoid

- ❌ **Don't add inputConfig to dependency array yet** - That happens in P1.M2.T1.S2 when we actually use it
- ❌ **Don't make inputConfig required** - Must be optional for backward compatibility
- ❌ **Don't add duplicate InputConfig import in Form.tsx** - Already imported at line 31
- ❌ **Don't forget to update FormContext.ts** - Both interface and implementation must match
- ❌ **Don't put required parameters after optional** - TypeScript requires all optional params come last
- ❌ **Don't add any logic using inputConfig yet** - This task is just adding the parameter

---

## Related Work Items

- **Next**: P1.M2.T1.S2 - Implement conditional execution using `inputConfig?.debounce === false`
- **Then**: P1.M2.T1.S3 - Update Field component to pass inputConfig to changeField
- **Then**: P1.M2.T1.S4 - Fix Form debounce prop type to allow `false`
- **Finally**: P1.M2.T2 - Add comprehensive tests for debounce: false behavior

---

## Confidence Score

**8/10** - High confidence for one-pass implementation success

**Reasoning**:
- ✅ Clear, bounded scope (single parameter addition)
- ✅ All file paths and line numbers specified
- ✅ Type definitions provided
- ✅ Existing patterns documented
- ✅ Validation commands verified
- ⚠️ Minor risk: Developer must be careful to update both FormContext.ts AND Form.tsx
- ⚠️ Minor risk: Forgetting that InputConfig is already imported in Form.tsx

**Mitigation**: Detailed context provided for both modification locations with explicit "gotcha" warnings.

---

## References

- [React useCallback Documentation](https://react.dev/reference/react/useCallback)
- [TypeScript Optional Parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#optional-parameters)
- [Formality PRD - Auto-Save Section](../../prd_snapshot.md#12-auto-save-system)
- [InputConfig Type Definition](../../../../packages/core/src/types/config.ts#L45)
- [Parent Task: P1.M2.T1](../tasks.json#L1)
