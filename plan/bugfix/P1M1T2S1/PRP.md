# PRP: P1.M1.T2.S1 - Consume evaluated props in Field

---

## Goal

**Feature Goal**: Consume the extended `usePropsEvaluation` hook in the Field component to evaluate both `formConfig.selectDefaultFieldProps` and `providerConfig.selectDefaultFieldProps`, enabling dynamic default field props at both form and provider levels.

**Deliverable**: Modified Field component that calls `usePropsEvaluation` with all three prop sources (provider, form, field) and receives properly merged evaluated props.

**Success Definition**:
- `usePropsEvaluation` is called with `providerDefaultFieldProps` from `providerConfig.selectDefaultFieldProps`
- `usePropsEvaluation` is called with `formDefaultFieldProps` from `formConfig.selectDefaultFieldProps`
- The hook receives all three prop sources (provider, form, selectProps) via single call
- Evaluated props object is returned from the hook (merging into `mergeFieldProps` happens in P1.M1.T2.S2)
- Existing Field component tests continue to pass

---

## Why

### Business Value
- **Bug Fix Continuation**: This is the first step of P1.M1.T2 (Integrate into Field Component)
- **Critical Path**: Enables dynamic default field props that were previously ignored
- **User Impact**: Allows form-level and provider-level dynamic props like `{ disabled: "!signed" }`

### Integration with Existing Features
- Completes the integration of `usePropsEvaluation` hook from P1.M1.T1
- Maintains backward compatibility with existing static `defaultFieldProps`
- Follows the existing props evaluation pattern established for `selectProps`

### Problems Solved
- **Current Issue**: Lines 289-293 of Field.tsx only pass `selectProps` to `usePropsEvaluation`, completely ignoring form and provider-level dynamic defaults
- **After This Subtask**: All three prop sources (provider, form, field) are evaluated through the hook

---

## What

Modify the Field component to consume the extended `usePropsEvaluation` hook:

1. **Replace the current `evaluatedSelectProps` useMemo call** (lines 289-293)
2. **Pass `formDefaultFieldProps`** from `formConfig.selectDefaultFieldProps`
3. **Pass `providerDefaultFieldProps`** from `providerConfig.selectDefaultFieldProps`
4. **Receive evaluated props** containing all three sources merged with correct priority

### Success Criteria

- [ ] `usePropsEvaluation` call includes `providerDefaultFieldProps` parameter
- [ ] `usePropsEvaluation` call includes `formDefaultFieldProps` parameter
- [ ] `providerDefaultFieldProps` is sourced from `providerConfig.selectDefaultFieldProps`
- [ ] `formDefaultFieldProps` is sourced from `formConfig.selectDefaultFieldProps`
- [ ] `selectProps` continues to be passed from `fieldConfig.selectProps`
- [ ] `subscribesTo` continues to be passed from `fieldConfig.subscribesTo`
- [ ] All existing Field component tests pass
- [ ] TypeScript compilation succeeds with no errors

---

## All Needed Context

### Context Completeness Check

*"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"*

**YES** - This PRP provides:
- Exact implementation location with current code state (lines 289-293)
- Complete reference to extended `usePropsEvaluation` hook interface
- Exact source locations for all config properties
- Existing test patterns and validation commands
- All file paths and line numbers

### Documentation & References

```yaml
# MUST READ - Primary Implementation File
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: This is the ONLY file to modify for this subtask
  section: Lines 289-293 contain the current usePropsEvaluation call to modify
  pattern: The existing hook call pattern - just add two new parameters
  gotcha: Do NOT modify mergeFieldProps call yet - that's P1.M1.T2.S2

# EXTENDED HOOK INTERFACE
- file: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  why: Contains the extended UsePropsEvaluationOptions interface with new parameters
  section: Lines 48-63 define the complete interface
  critical: formDefaultFieldProps (line 53) and providerDefaultFieldProps (line 56) are the new params
  signature: usePropsEvaluation({ selectProps?, formDefaultFieldProps?, providerDefaultFieldProps?, subscribesTo?, fieldName })

# FORM CONFIG SOURCE
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows where formConfig is accessed in Field component
  section: Line 123 shows formConfig destructured from FormContext
  pattern: const { formConfig } = useFormContext();
  property: formConfig.selectDefaultFieldProps contains the dynamic form-level props

# PROVIDER CONFIG SOURCE
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows where providerConfig is accessed in Field component
  section: Line 133 shows providerConfig accessed via useConfigContext()
  pattern: const providerConfig = useConfigContext();
  property: providerConfig.selectDefaultFieldProps contains the dynamic provider-level props

# TYPE DEFINITIONS
- file: /home/dustin/projects/formality/packages/core/src/types/config.ts
  why: Contains SelectValue type definition for dynamic props
  section: Lines 18-22 define SelectValue as: string | SelectFunction | { [key: string]: SelectValue } | SelectValue[]
  critical: Lines 175 and 218 show selectDefaultFieldProps in FormConfig and FormalityProviderConfig

# CURRENT IMPLEMENTATION (TO BE REPLACED)
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Lines 289-293 show the current hook call that needs modification
  pattern: const evaluatedSelectProps = usePropsEvaluation({ selectProps, subscribesTo, fieldName });

# MERGE FIELD PROPS (CONTEXT FOR NEXT STEP)
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Lines 393-412 show mergeFieldProps call - NOT modified in this subtask but shows the end goal
  section: Lines 395-397 currently pass empty objects for selectDefaultFieldProps
  gotcha: P1.M1.T2.S2 will modify this - DO NOT touch in this subtask

# PREVIOUS SUBTASK PRP
- file: /home/dustin/projects/formality/plan/bugfix/P1M1T1S4/PRP.md
  why: Shows the TypeScript exports that enable this integration
  note: Hook signature is complete and ready to consume

# TEST PATTERNS
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Shows existing Field component test patterns
  pattern: render with FormalityProvider, use data-testid, waitFor for async
  note: Tests for new functionality will be added in P1.M1.T3
```

### Current Codebase tree

```bash
packages/
├── core/
│   └── src/
│       └── types/
│           └── config.ts                    # SelectValue, FormConfig, FormalityProviderConfig
└── react/
    └── src/
        ├── components/
        │   └── Field.tsx                    # MODIFY: Update usePropsEvaluation call
        ├── hooks/
        │   └── usePropsEvaluation.ts        # REFERENCE: Extended hook interface
        ├── context/
        │   ├── FormContext.ts               # Provides formConfig
        │   └── ConfigContext.ts             # Provides providerConfig
        └── __tests__/
            ├── Field.test.tsx               # Existing tests - must pass
            └── setup.ts                     # Test setup with cleanup
```

### Desired Codebase tree with files to be added

```bash
# No new files - only modification of existing file
packages/react/src/components/Field.tsx  # MODIFY: Add providerDefaultFieldProps and formDefaultFieldProps to usePropsEvaluation call
```

### Current Implementation (for reference)

```typescript
// File: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
// Lines 289-293: CURRENT IMPLEMENTATION (TO BE REPLACED)

const evaluatedSelectProps = usePropsEvaluation({
  selectProps: fieldConfig.selectProps,
  subscribesTo: fieldConfig.subscribesTo,
  fieldName: name,
});
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: usePropsEvaluation hook signature was extended in P1.M1.T1
// The hook now accepts formDefaultFieldProps and providerDefaultFieldProps
// UsePropsEvaluationOptions interface (lines 48-63 of usePropsEvaluation.ts)

// CRITICAL: formConfig is already destructured from FormContext on line 123
// const { formConfig } = useFormContext();
// Access form-level dynamic defaults via: formConfig.selectDefaultFieldProps

// CRITICAL: providerConfig is already accessed via useConfigContext() on line 133
// const providerConfig = useConfigContext();
// Access provider-level dynamic defaults via: providerConfig.selectDefaultFieldProps

// CRITICAL: selectDefaultFieldProps type is SelectValue (not Record<string, unknown>)
// SelectValue can be: string | function | object | array
// The usePropsEvaluation hook handles all these types internally

// CRITICAL: The evaluated props are returned as SelectedProps (Record<string, unknown>)
// The hook internally evaluates all SelectValue types and returns merged props

// CRITICAL: DO NOT modify the mergeFieldProps call (lines 393-412) in this subtask
// That's P1.M1.T2.S2 - this subtask only modifies the usePropsEvaluation call

// CRITICAL: The priority order is: provider < form < selectProps (field-level)
// The usePropsEvaluation hook handles this priority internally
// We just need to pass all three sources and let the hook do the merging

// GOTCHA: The return value will contain evaluated props from all three sources
// In this subtask we receive it - in P1.M1.T2.S2 we'll pass to mergeFieldProps

// GOTCHA: formConfig.selectDefaultFieldProps may be undefined
// This is expected - the hook handles undefined gracefully

// GOTCHA: providerConfig.selectDefaultFieldProps may be undefined
// This is expected - the hook handles undefined gracefully

// GOTCHA: Existing tests must continue to pass
// We're adding parameters but not changing behavior when they're undefined

// GOTCHA: TypeScript will verify type correctness
// SelectValue is the correct type for both selectDefaultFieldProps properties
```

---

## Implementation Blueprint

### Data models and structure

No new data models. Using existing types:

```typescript
// From @formality-ui/core/types/config.ts (already imported)
export type SelectValue<TReturn = unknown> =
  | string                    // Expression: "client.id"
  | SelectFunction<TReturn>   // Function callback
  | { [key: string]: SelectValue }  // Nested object
  | SelectValue[];            // Array of values

// From usePropsEvaluation.ts (extended in P1.M1.T1)
export interface UsePropsEvaluationOptions {
  selectProps?: SelectValue;
  formDefaultFieldProps?: SelectValue;      // NEW in P1.M1.T1
  providerDefaultFieldProps?: SelectValue;   // NEW in P1.M1.T1
  subscribesTo?: string[];
  fieldName: string;
}

// Return type from hook
export type SelectedProps = Record<string, unknown>;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY usePropsEvaluation call in Field component
  - ADD: providerDefaultFieldProps parameter from providerConfig.selectDefaultFieldProps
  - ADD: formDefaultFieldProps parameter from formConfig.selectDefaultFieldProps
  - PRESERVE: Existing selectProps parameter from fieldConfig.selectProps
  - PRESERVE: Existing subscribesTo parameter from fieldConfig.subscribesTo
  - PRESERVE: Existing fieldName parameter
  - FILE: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  - LINES: Modify lines 289-293
  - DEPENDENCIES: P1.M1.T1.S1-S4 must be complete

Task 2: VALIDATE TypeScript compilation
  - RUN: pnpm -F @formality-ui/react run tsc --noEmit
  - EXPECT: Zero type errors
  - IF ERRORS: Check that config properties are correct (selectDefaultFieldProps)

Task 3: RUN existing tests
  - RUN: pnpm -F @formality-ui/react test -- src/__tests__/Field.test.tsx
  - EXPECT: All existing tests pass
  - REASON: Undefined parameters should behave identically to before

Task 4: BUILD verification
  - RUN: pnpm -F @formality-ui/react build
  - EXPECT: Successful build with no errors
  - VERIFY: dist/components/Field.js exists and is valid
```

### Implementation Patterns & Key Details

```typescript
// CURRENT CODE (lines 289-293) - TO BE REPLACED
const evaluatedSelectProps = usePropsEvaluation({
  selectProps: fieldConfig.selectProps,
  subscribesTo: fieldConfig.subscribesTo,
  fieldName: name,
});

// NEW CODE - Add the two new parameters
const evaluatedSelectProps = usePropsEvaluation({
  selectProps: fieldConfig.selectProps,
  formDefaultFieldProps: formConfig.selectDefaultFieldProps,      // NEW
  providerDefaultFieldProps: providerConfig.selectDefaultFieldProps, // NEW
  subscribesTo: fieldConfig.subscribesTo,
  fieldName: name,
});

// PATTERN: Access formConfig (already destructured on line 123)
// const { formConfig, methods, ... } = useFormContext();
// formConfig.selectDefaultFieldProps is the source

// PATTERN: Access providerConfig (already accessed on line 133)
// const providerConfig = useConfigContext();
// providerConfig.selectDefaultFieldProps is the source

// GOTCHA: The variable name evaluatedSelectProps stays the same
// Even though it now contains provider and form props too
// Renaming it would require changes in multiple places (line 297, line 400)

// GOTCHA: In P1.M1.T2.S2, we'll pass this to mergeFieldProps
// For now, just receive it - the hook does the merging internally
```

### Integration Points

```yaml
DEPENDENCIES (must be complete):
  - P1.M1.T1.S1: Hook parameters added to interface
  - P1.M1.T1.S2: Form-level evaluation implemented
  - P1.M1.T1.S3: Provider-level evaluation implemented
  - P1.M1.T1.S4: TypeScript exports added

CONTEXT ACCESS (already in place):
  - Line 123: formConfig destructured from useFormContext()
  - Line 133: providerConfig accessed via useConfigContext()
  - Lines 289-293: usePropsEvaluation call location

NO EXTERNAL INTEGRATION NEEDED:
  - No config changes required
  - No new files created
  - No test changes in this subtask (tests come in P1.M1.T3)

FUTURE INTEGRATION (subsequent subtasks):
  - P1.M1.T2.S2: Will pass evaluatedSelectProps to mergeFieldProps
  - P1.M1.T3.S2: Will add tests for form-level evaluation
  - P1.M1.T3.S3: Will add tests for provider-level evaluation
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check the modified file
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors
# Common errors to watch for:
# - "Property 'selectDefaultFieldProps' does not exist" → Check: formConfig type
# - "Type 'X' is not assignable to type 'SelectValue'" → Check: Using correct property

# Full project type check
pnpm run typecheck

# Expected: All packages type-check successfully
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run Field component tests
pnpm -F @formality-ui/react test -- src/__tests__/Field.test.tsx

# Expected: All existing tests pass
# Reason: Undefined parameters should behave identically to before

# Run all React package tests
pnpm -F @formality-ui/react test

# Expected: All tests pass (184 tests in react package)
# Note: Tests for new functionality will be added in P1.M1.T3

# Check test count remains the same
# Should still be 184 tests passing in @formality-ui/react
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the package to verify no compilation errors
pnpm -F @formality-ui/react build

# Expected: Successful build with no TypeScript errors
# Verify output files exist:
ls -la packages/react/dist/components/Field.js
ls -la packages/react/dist/components/Field.d.ts

# Build all packages
pnpm run build

# Expected: All packages build successfully
```

### Level 4: Manual Verification

```bash
# Create a test file to verify the integration works
cat > /tmp/test-field-integration.tsx << 'EOF'
import { render, screen } from '@testing-library/react';
import { FormalityProvider, Form, Field } from '@formality-ui/react';

// Test input component
const TestInput = ({ value, onChange, disabled, ...props }: any) => (
  <input
    data-testid="test-field"
    value={value ?? ''}
    onChange={(e) => onChange?.(e.target.value)}
    disabled={disabled}
    {...props}
  />
);

const testInputs = {
  textField: { component: TestInput, defaultValue: '' },
};

// Test 1: Provider-level dynamic default props
const providerConfig = {
  inputs: testInputs,
  selectDefaultFieldProps: {
    disabled: '!signed',
  },
};

const { rerender } = render(
  <FormalityProvider inputs={providerConfig.inputs} selectDefaultFieldProps={providerConfig.selectDefaultFieldProps}>
    <Form>
      <Field name="testField" />
    </Form>
  </FormalityProvider>
);

const field = screen.getByTestId('test-field');
console.log('Provider default field props - disabled:', field.disabled);

// Test 2: Form-level dynamic default props
const formConfig = {
  selectDefaultFieldProps: {
    placeholder: 'type === "premium" ? "Premium User" : "Standard"',
  },
};

render(
  <FormalityProvider inputs={testInputs}>
    <Form config={formConfig}>
      <Field name="testField" />
    </Form>
  </FormalityProvider>
);

const field2 = screen.getByTestId('test-field');
console.log('Form default field props - placeholder:', field2.placeholder);
EOF

# Type check the test file
pnpm -F @formality-ui/react exec tsc --noEmit /tmp/test-field-integration.tsx

# Expected: No type errors
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compiles without errors: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] Package builds successfully: `pnpm -F @formality-ui/react build`
- [ ] Existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] `formDefaultFieldProps` parameter added to hook call
- [ ] `providerDefaultFieldProps` parameter added to hook call
- [ ] No changes to mergeFieldProps call (that's P1.M1.T2.S2)

### Feature Validation

- [ ] `providerDefaultFieldProps` sourced from `providerConfig.selectDefaultFieldProps`
- [ ] `formDefaultFieldProps` sourced from `formConfig.selectDefaultFieldProps`
- [ ] `selectProps` continues from `fieldConfig.selectProps`
- [ ] `subscribesTo` continues from `fieldConfig.subscribesTo`
- [ ] `fieldName` unchanged
- [ ] Backward compatibility maintained (existing tests pass)

### Code Quality Validation

- [ ] Only modifies lines 289-293 of Field.tsx
- [ ] Follows existing hook call pattern
- [ ] No new files created
- [ ] No unnecessary refactoring
- [ ] TypeScript types satisfied
- [ ] No React hook rule violations

### Dependencies & Handoff

- [ ] P1.M1.T1.S1 complete (hook parameters added)
- [ ] P1.M1.T1.S2 complete (form-level evaluation)
- [ ] P1.M1.T1.S3 complete (provider-level evaluation)
- [ ] P1.M1.T1.S4 complete (TypeScript exports)
- [ ] Ready for P1.M1.T2.S2 (pass to mergeFieldProps)
- [ ] Ready for P1.M1.T3 (testing)

---

## Anti-Patterns to Avoid

- **Do NOT modify mergeFieldProps call** - that's P1.M1.T2.S2
- **Do NOT change the variable name** `evaluatedSelectProps` - used in multiple places
- **Do NOT add tests** - tests are added in P1.M1.T3
- **Do NOT refactor surrounding code** - only modify the hook call
- **Do NOT use `defaultFieldProps`** - use `selectDefaultFieldProps` (dynamic version)
- **Do NOT add new imports** - all necessary imports exist
- **Do NOT change context access patterns** - formConfig and providerConfig access is correct
- **Do NOT skip TypeScript check** - verify types are correct
- **Do NOT assume tests are optional** - existing tests must pass
- **Do NOT modify the hook** - hook is complete from P1.M1.T1

---

## Related Work Items

### Prerequisites
- **P1.M1.T1.S1**: Add new parameters to hook signature (MUST be complete)
- **P1.M1.T1.S2**: Implement form-level evaluation (MUST be complete)
- **P1.M1.T1.S3**: Implement provider-level evaluation (MUST be complete)
- **P1.M1.T1.S4**: Update TypeScript types (MUST be complete)

### This Task Enables
- **P1.M1.T2.S2**: Pass to mergeFieldProps (needs the evaluated props object)
- **P1.M1.T3.S2**: Test form-level evaluation (will verify this integration)
- **P1.M1.T3.S3**: Test provider-level evaluation (will verify this integration)

### Blocked By
- **P1.M1.T1** - All subtasks (S1-S4) must be complete

---

## Research Findings Summary

### Field Component Context Access

**Form Config Access** (Field.tsx line 123):
```typescript
const { formConfig } = useFormContext();
// formConfig.selectDefaultFieldProps contains dynamic form-level props
```

**Provider Config Access** (Field.tsx line 133):
```typescript
const providerConfig = useConfigContext();
// providerConfig.selectDefaultFieldProps contains dynamic provider-level props
```

### Extended Hook Interface

**From P1.M1.T1** (usePropsEvaluation.ts lines 48-63):
```typescript
export interface UsePropsEvaluationOptions {
  selectProps?: SelectValue;
  formDefaultFieldProps?: SelectValue;      // Added in S1, evaluated in S2
  providerDefaultFieldProps?: SelectValue;   // Added in S1, evaluated in S3
  subscribesTo?: string[];
  fieldName: string;
}
```

### Hook Return Value

The hook returns `SelectedProps` (Record<string, unknown>) which contains:
1. Provider-level evaluated props (lowest priority)
2. Form-level evaluated props (overrides provider)
3. Field-level evaluated props (overrides both)

The hook handles the priority merging internally.

### Test Framework

**Vitest Configuration**:
- Test runner: Vitest v2.0.0
- Environment: jsdom
- Test location: `src/**/*.test.{ts,tsx}`
- Setup file: `src/__tests__/setup.ts` (includes cleanup)

**Test Count Reference**:
- @formality-ui/react: 184 tests
- @formality-ui/core: 145 tests
- Total: 329 tests

---

## Confidence Score

**10/10** for one-pass implementation success

**Rationale**:
- ✅ Single, well-defined change (add two parameters to existing call)
- ✅ All dependencies complete (P1.M1.T1 fully done)
- ✅ Exact source locations documented
- ✅ Existing code pattern to follow
- ✅ No new logic or algorithms
- ✅ Backward compatible (undefined params behave same as before)
- ✅ TypeScript will catch type errors
- ✅ Existing tests verify no regressions

**This is a straightforward parameter addition to an existing function call.**
