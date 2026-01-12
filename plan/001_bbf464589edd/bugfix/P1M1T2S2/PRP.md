# PRP: P1.M1.T2.S2 - Pass to mergeFieldProps

---

## Goal

**Feature Goal**: Modify `usePropsEvaluation` hook to return separate evaluated results for each prop layer (provider, form, field), then update Field.tsx to pass each evaluated layer to `mergeFieldProps` maintaining the correct 8-layer priority order.

**Deliverable**: Modified `usePropsEvaluation` hook with new return type and updated Field.tsx that passes evaluated props correctly to `mergeFieldProps`.

**Success Definition**:
- `usePropsEvaluation` returns an object containing three separate evaluated props: `providerSelectProps`, `formSelectProps`, and `fieldSelectProps`
- Field.tsx passes each evaluated layer to the correct parameter in `mergeFieldProps`
- The 8-layer priority order is maintained correctly
- All existing tests continue to pass
- TypeScript compilation succeeds with no errors

---

## Why

### Business Value
- **Critical Bug Fix**: Completes the integration of dynamic `selectDefaultFieldProps` evaluation
- **8-Layer Priority System**: Enables proper merging of all prop sources according to PRD specification
- **User Impact**: Allows form-level and provider-level dynamic props like `{ disabled: "!signed" }` to work correctly

### Integration with Existing Features
- Completes P1.M1.T2 (Integrate into Field Component)
- Maintains backward compatibility with existing static `defaultFieldProps`
- Follows the existing props evaluation pattern established for `selectProps`

### Problems Solved
- **Current Issue**: The `usePropsEvaluation` hook uses early-return pattern (lines 191-226) that only returns the highest priority prop source
- **Missing Information**: Lower-priority layers are lost, preventing `mergeFieldProps` from correctly implementing the 8-layer priority system
- **After This Subtask**: Each layer is evaluated separately and passed to `mergeFieldProps` for proper merging

---

## What

This subtask requires TWO coordinated changes:

### Change 1: Modify `usePropsEvaluation` return type and logic

**File**: `/home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts`

**Current Behavior** (lines 171-227):
- Uses early-return pattern: returns immediately when `formDefaultFieldProps` or `selectProps` is found
- Only returns a single `SelectedProps` object with the highest priority source
- Lower-priority layers are lost

**New Behavior**:
- Evaluates ALL three prop sources (provider, form, field) without early returns
- Returns a new type `EvaluatedPropsResult` containing all three evaluated results
- Each result can be empty object `{}` if that source has no props

### Change 2: Update Field.tsx to pass evaluated props to mergeFieldProps

**File**: `/home/dustin/projects/formality/packages/react/src/components/Field.tsx`

**Current Behavior** (lines 289-295 and 395-414):
- Calls `usePropsEvaluation` and receives single `evaluatedSelectProps` object
- Passes empty objects `{}` for `providerSelectDefaultFieldProps` and `formSelectDefaultFieldProps`
- Only uses `evaluatedSelectProps` for `selectProps` parameter

**New Behavior**:
- Destructures the new `EvaluatedPropsResult` to get three separate evaluated props
- Passes each evaluated prop to the correct parameter in `mergeFieldProps`

### Success Criteria

- [ ] New `EvaluatedPropsResult` type defined in `usePropsEvaluation.ts`
- [ ] `usePropsEvaluation` returns object with `providerSelectProps`, `formSelectProps`, `fieldSelectProps`
- [ ] All three prop sources are evaluated (no early returns that skip evaluation)
- [ ] Field.tsx destructures the new return value correctly
- [ ] `providerSelectProps` passed to `mergeFieldProps` as `providerSelectDefaultFieldProps`
- [ ] `formSelectProps` passed to `mergeFieldProps` as `formSelectDefaultFieldProps`
- [ ] `fieldSelectProps` passed to `mergeFieldProps` as `selectProps`
- [ ] All existing Field component tests pass
- [ ] TypeScript compilation succeeds with no errors

---

## All Needed Context

### Context Completeness Check

*"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"*

**YES** - This PRP provides:
- Exact file locations and line numbers for both changes
- Complete current implementation code
- Complete target implementation code
- The 8-layer priority order definition
- All type definitions needed
- Test patterns and validation commands

### Documentation & References

```yaml
# MUST READ - Primary Implementation File 1
- file: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  why: This file needs modification to return separate evaluated results
  section: Lines 46-228 (complete file context needed)
  pattern: The current early-return evaluation pattern (lines 171-227)
  critical: Must evaluate ALL three sources, not just return the highest priority one

# MUST READ - Primary Implementation File 2
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: This file needs modification to use the new return type
  section: Lines 289-295 (usePropsEvaluation call) and 395-414 (mergeFieldProps call)
  pattern: Current usage of evaluatedSelectProps variable
  critical: Must destructure new return value and pass to mergeFieldProps correctly

# MERGE FUNCTION REFERENCE
- file: /home/dustin/projects/formality/packages/core/src/config/merge.ts
  why: Shows the exact parameter names and priority order for mergeFieldProps
  section: Lines 180-215 define mergeFieldProps function signature
  critical: The 8-layer priority order and parameter names must match exactly

# 8-LAYER PRIORITY ORDER DEFINITION
- file: /home/dustin/projects/formality/packages/core/src/config/merge.ts
  why: Documents the priority order that must be maintained
  section: Lines 137-148 contain the priority order comment
  order:
    1. Component props (JSX) - highest
    2. Field config selectProps (evaluated) - our `fieldSelectProps`
    3. Field config props (static)
    4. Input config props (static)
    5. Form config selectDefaultFieldProps (evaluated) - our `formSelectProps`
    6. Form config defaultFieldProps (static)
    7. Provider config selectDefaultFieldProps (evaluated) - our `providerSelectProps`
    8. Provider config defaultFieldProps (static) - lowest

# TYPE DEFINITIONS
- file: /home/dustin/projects/formality/packages/core/src/types/config.ts
  why: Contains SelectValue type definition for dynamic props
  section: Lines 18-22 define SelectValue type
  note: SelectValue can be: string | SelectFunction | object | array

# PREVIOUS SUBTASK PRP
- file: /home/dustin/projects/formality/plan/bugfix/P1M1T2S1/PRP.md
  why: Shows the previous step where usePropsEvaluation was called with all three sources
  note: That subtask added the parameters, this subtask fixes the return value

# TEST PATTERNS
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Shows existing Field component test patterns
  pattern: render with FormalityProvider, use data-testid, waitFor for async
  note: Tests for new functionality will be added in P1.M1.T3

# CORE TESTS
- file: /home/dustin/projects/formality/packages/core/src/__tests__/config.test.ts
  why: Shows tests for mergeFieldProps priority order
  section: Lines 158-192 test the 8-layer merge
  note: These tests verify the merge logic works correctly
```

### Current Codebase tree

```bash
packages/
├── core/
│   └── src/
│       ├── config/
│       │   └── merge.ts                    # mergeFieldProps function (8-layer priority)
│       └── types/
│           └── config.ts                    # SelectValue, FormConfig, FormalityProviderConfig
└── react/
    └── src/
        ├── components/
        │   └── Field.tsx                    # MODIFY: Update usePropsEvaluation usage and mergeFieldProps call
        ├── hooks/
        │   └── usePropsEvaluation.ts        # MODIFY: Change return type and evaluation logic
        ├── context/
        │   ├── FormContext.ts               # Provides formConfig
        │   └── ConfigContext.ts             # Provides providerConfig
        └── __tests__/
            ├── Field.test.tsx               # Existing tests - must pass
            └── setup.ts                     # Test setup with cleanup
```

### Desired Codebase tree with files to be modified

```bash
# Modified files (not new files)
packages/react/src/
├── hooks/
│   └── usePropsEvaluation.ts        # MODIFY: Add EvaluatedPropsResult type, change return logic
└── components/
    └── Field.tsx                    # MODIFY: Destructure new return type, update mergeFieldProps call
```

### Current Implementation (for reference)

```typescript
// File: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
// Lines 46-228: CURRENT IMPLEMENTATION

export type SelectedProps = Record<string, unknown>;

export interface UsePropsEvaluationOptions {
  selectProps?: SelectValue;
  formDefaultFieldProps?: SelectValue;
  providerDefaultFieldProps?: SelectValue;
  subscribesTo?: string[];
  fieldName: string;
}

export function usePropsEvaluation(
  options: UsePropsEvaluationOptions,
): SelectedProps {
  const {
    selectProps,
    formDefaultFieldProps,
    providerDefaultFieldProps,
    subscribesTo,
    fieldName,
  } = options;
  const { record, methods } = useFormContext();

  // ... watchFields logic ...

  // ... formState construction ...

  // CURRENT: Early-return pattern that loses lower-priority layers
  return useMemo(() => {
    // Step 1: Evaluate providerDefaultFieldProps
    let providerResult: Record<string, unknown> | null = null;
    if (providerDefaultFieldProps) {
      if (typeof providerDefaultFieldProps === "function") {
        providerResult = (providerDefaultFieldProps(formState, methods) as Record<string, unknown>) ?? {};
      } else {
        const context = buildFieldContext(formState, fieldName);
        providerResult = (evaluateDescriptor(providerDefaultFieldProps, context) as Record<string, unknown>) ?? {};
      }
    }

    // Step 2: Early return if formDefaultFieldProps exists
    if (formDefaultFieldProps) {
      if (typeof formDefaultFieldProps === "function") {
        const result = formDefaultFieldProps(formState, methods);
        return (result as Record<string, unknown>) ?? {};  // EARLY RETURN - loses providerResult
      }
      const context = buildFieldContext(formState, fieldName);
      const result = evaluateDescriptor(formDefaultFieldProps, context);
      return (result as Record<string, unknown>) ?? {};  // EARLY RETURN - loses providerResult
    }

    // Step 3: Early return if selectProps exists
    if (selectProps) {
      if (typeof selectProps === "function") {
        const result = selectProps(formState, methods);
        return (result as Record<string, unknown>) ?? {};  // EARLY RETURN - loses form and provider
      }
      const context = buildFieldContext(formState, fieldName);
      const result = evaluateDescriptor(selectProps, context);
      return (result as Record<string, unknown>) ?? {};  // EARLY RETURN - loses form and provider
    }

    // Step 4: Return only provider result
    return providerResult ?? {};
  }, [providerDefaultFieldProps, formDefaultFieldProps, selectProps, formState, methods, fieldName]);
}

// File: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
// Lines 289-295: CURRENT usePropsEvaluation call
const evaluatedSelectProps = usePropsEvaluation({
  selectProps: fieldConfig.selectProps,
  formDefaultFieldProps: formConfig.selectDefaultFieldProps,
  providerDefaultFieldProps: providerConfig.selectDefaultFieldProps,
  subscribesTo: fieldConfig.subscribesTo,
  fieldName: name,
});

// Lines 395-414: CURRENT mergeFieldProps call
const finalProps = mergeFieldProps({
  providerDefaultFieldProps: providerConfig.defaultFieldProps,
  providerSelectDefaultFieldProps: {}, // TODO: Should use evaluated provider props
  formDefaultFieldProps: formConfig.defaultFieldProps,
  formSelectDefaultFieldProps: {}, // TODO: Should use evaluated form props
  inputProps: inputConfig.props,
  fieldConfigProps: fieldConfig.props,
  selectProps: evaluatedSelectProps, // Only gets field-level props currently
  componentProps: restProps,
  coreProps: { ... },
});
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: The 8-layer priority order MUST be maintained exactly
// mergeFieldProps in merge.ts expects specific parameter names:
// - providerSelectDefaultFieldProps (layer 7)
// - formSelectDefaultFieldProps (layer 5)
// - selectProps (layer 2)

// CRITICAL: usePropsEvaluation currently uses early-return pattern
// Lines 191-226 show "return" statements that skip evaluation of lower-priority layers
// This must be changed to evaluate ALL layers and return all results

// CRITICAL: SelectValue can be four types (from @formality-ui/core):
// 1. string: "client.id ? clientOptions : allOptions"
// 2. function: (formState, methods) => ({ disabled: true })
// 3. object: { disabled: "!signed", placeholder: "fields.type" }
// 4. array: [ ... ]

// CRITICAL: The hook uses evaluateDescriptor() for non-function props
// evaluateDescriptor handles string expressions, objects with expressions, and arrays
// It's imported from @formality-ui/core

// CRITICAL: buildFieldContext() creates the evaluation context
// It provides access to field values, errors, and other state for expressions

// CRITICAL: formState is a minimal proxy with ONLY watched fields
// This is for performance - we don't want to subscribe to the entire form

// GOTCHA: The return value change is a BREAKING CHANGE for the hook
// But since usePropsEvaluation is only used within Field component (line 289),
// this is contained and safe to change

// GOTCHA: TypeScript will need the new type exported
// Field.tsx imports usePropsEvaluation, so the new return type must be accessible

// GOTCHA: Empty objects {} are valid evaluated results
// If a prop source is undefined or evaluates to undefined, return {} not undefined

// GOTCHA: The priority order in hook evaluation vs mergeFieldProps
// usePropsEvaluation evaluates: provider (lowest) < form < selectProps (highest)
// mergeFieldProps merges: provider (lowest) < form < selectProps (highest)
// These must align!

// GOTCHA: Existing tests must continue to pass
// We're changing implementation, not the externally observable behavior
// When all props are undefined, all three results should be {}

// CRITICAL: DO NOT modify mergeFieldProps function
// That function is in the core package and already works correctly
// We only need to pass it the correct evaluated values
```

---

## Implementation Blueprint

### Data models and structure

New return type for `usePropsEvaluation`:

```typescript
/**
 * Result of evaluating all three prop sources separately
 *
 * Each layer is evaluated independently so that mergeFieldProps
 * can correctly apply the 8-layer priority order.
 */
export interface EvaluatedPropsResult {
  /** Evaluated provider-level selectDefaultFieldProps (layer 7 priority) */
  providerSelectProps: Record<string, unknown>;

  /** Evaluated form-level selectDefaultFieldProps (layer 5 priority) */
  formSelectProps: Record<string, unknown>;

  /** Evaluated field-level selectProps (layer 2 priority) */
  fieldSelectProps: Record<string, unknown>;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY usePropsEvaluation return type
  - ADD: New EvaluatedPropsResult interface (lines 46-55 area)
  - ADD: Export the new type for use in Field.tsx
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  - LOCATION: After SelectedProps type definition (around line 46)

Task 2: MODIFY usePropsEvaluation function signature
  - CHANGE: Return type from SelectedProps to EvaluatedPropsResult
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  - LOCATION: Line 95 (function signature)

Task 3: MODIFY usePropsEvaluation evaluation logic (remove early returns)
  - REMOVE: Early return statements on lines 196, 205, 213, 222
  - ADD: Evaluate ALL three sources without early returns
  - ADD: Store results in separate variables for each layer
  - RETURN: Object with all three results: { providerSelectProps, formSelectProps, fieldSelectProps }
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  - LOCATION: Lines 171-227 (the useMemo return)

Task 4: MODIFY Field.tsx to destructure new return value
  - CHANGE: Replace "const evaluatedSelectProps = usePropsEvaluation(...)"
  - ADD: Destructure all three results: "const { providerSelectProps, formSelectProps, fieldSelectProps } = usePropsEvaluation(...)"
  - FILE: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  - LOCATION: Lines 289-295

Task 5: MODIFY Field.tsx mergeFieldProps call
  - CHANGE: "providerSelectDefaultFieldProps: {}" to "providerSelectDefaultFieldProps: providerSelectProps"
  - CHANGE: "formSelectDefaultFieldProps: {}" to "formSelectDefaultFieldProps: formSelectProps"
  - CHANGE: "selectProps: evaluatedSelectProps" to "selectProps: fieldSelectProps"
  - FILE: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  - LOCATION: Lines 395-414

Task 6: UPDATE TypeScript exports
  - VERIFY: EvaluatedPropsResult is exported from usePropsEvaluation.ts
  - VERIFY: Field.tsx can access the new type
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  - LOCATION: Export statement (around end of file)

Task 7: VALIDATE TypeScript compilation
  - RUN: pnpm -F @formality-ui/react run tsc --noEmit
  - EXPECT: Zero type errors
  - IF ERRORS: Check that all three destructured variables match EvaluatedPropsResult type

Task 8: RUN existing tests
  - RUN: pnpm -F @formality-ui/react test -- src/__tests__/Field.test.tsx
  - EXPECT: All existing tests pass
  - REASON: Behavior unchanged when all props are undefined

Task 9: BUILD verification
  - RUN: pnpm -F @formality-ui/react build
  - EXPECT: Successful build with no errors
  - VERIFY: dist files are generated correctly
```

### Implementation Patterns & Key Details

```typescript
// ============================================================
// FILE 1: usePropsEvaluation.ts - Add new type
// ============================================================

// ADD after line 46 (after SelectedProps type)
export interface EvaluatedPropsResult {
  /** Evaluated provider-level selectDefaultFieldProps (layer 7 priority) */
  providerSelectProps: Record<string, unknown>;

  /** Evaluated form-level selectDefaultFieldProps (layer 5 priority) */
  formSelectProps: Record<string, unknown>;

  /** Evaluated field-level selectProps (layer 2 priority) */
  fieldSelectProps: Record<string, unknown>;
}

// ============================================================
// FILE 1: usePropsEvaluation.ts - Change function signature
// ============================================================

// CHANGE line 95 from:
export function usePropsEvaluation(
  options: UsePropsEvaluationOptions,
): SelectedProps {

// TO:
export function usePropsEvaluation(
  options: UsePropsEvaluationOptions,
): EvaluatedPropsResult {

// ============================================================
// FILE 1: usePropsEvaluation.ts - Change evaluation logic
// ============================================================

// REPLACE lines 171-227 with:

return useMemo(() => {
  // Step 1: Evaluate providerDefaultFieldProps (lowest priority, layer 7)
  let providerResult: Record<string, unknown> = {};
  if (providerDefaultFieldProps) {
    if (typeof providerDefaultFieldProps === "function") {
      providerResult = (providerDefaultFieldProps(formState, methods) as Record<string, unknown>) ?? {};
    } else {
      const context = buildFieldContext(formState, fieldName);
      providerResult = (evaluateDescriptor(providerDefaultFieldProps, context) as Record<string, unknown>) ?? {};
    }
  }

  // Step 2: Evaluate formDefaultFieldProps (medium priority, layer 5)
  let formResult: Record<string, unknown> = {};
  if (formDefaultFieldProps) {
    if (typeof formDefaultFieldProps === "function") {
      formResult = (formDefaultFieldProps(formState, methods) as Record<string, unknown>) ?? {};
    } else {
      const context = buildFieldContext(formState, fieldName);
      formResult = (evaluateDescriptor(formDefaultFieldProps, context) as Record<string, unknown>) ?? {};
    }
  }

  // Step 3: Evaluate selectProps (highest priority, layer 2)
  let fieldResult: Record<string, unknown> = {};
  if (selectProps) {
    if (typeof selectProps === "function") {
      fieldResult = (selectProps(formState, methods) as Record<string, unknown>) ?? {};
    } else {
      const context = buildFieldContext(formState, fieldName);
      fieldResult = (evaluateDescriptor(selectProps, context) as Record<string, unknown>) ?? {};
    }
  }

  // Step 4: Return all three results for mergeFieldProps to handle priority
  return {
    providerSelectProps: providerResult,
    formSelectProps: formResult,
    fieldSelectProps: fieldResult,
  };
}, [providerDefaultFieldProps, formDefaultFieldProps, selectProps, formState, methods, fieldName]);

// KEY PATTERN CHANGE: No more early returns!
// Each layer is evaluated independently and stored in its own variable
// All three results are returned in the new EvaluatedPropsResult type

// ============================================================
// FILE 2: Field.tsx - Change hook call
// ============================================================

// REPLACE lines 289-295:
// const evaluatedSelectProps = usePropsEvaluation({
//   selectProps: fieldConfig.selectProps,
//   formDefaultFieldProps: formConfig.selectDefaultFieldProps,
//   providerDefaultFieldProps: providerConfig.selectDefaultFieldProps,
//   subscribesTo: fieldConfig.subscribesTo,
//   fieldName: name,
// });

// WITH:
const { providerSelectProps, formSelectProps, fieldSelectProps } = usePropsEvaluation({
  selectProps: fieldConfig.selectProps,
  formDefaultFieldProps: formConfig.selectDefaultFieldProps,
  providerDefaultFieldProps: providerConfig.selectDefaultFieldProps,
  subscribesTo: fieldConfig.subscribesTo,
  fieldName: name,
});

// KEY PATTERN: Destructure all three results from the new return type

// ============================================================
// FILE 2: Field.tsx - Change mergeFieldProps call
// ============================================================

// REPLACE lines 395-414:
// const finalProps = mergeFieldProps({
//   providerDefaultFieldProps: providerConfig.defaultFieldProps,
//   providerSelectDefaultFieldProps: {}, // TODO
//   formDefaultFieldProps: formConfig.defaultFieldProps,
//   formSelectDefaultFieldProps: {}, // TODO
//   inputProps: inputConfig.props,
//   fieldConfigProps: fieldConfig.props,
//   selectProps: evaluatedSelectProps,
//   componentProps: restProps,
//   coreProps: { ... },
// });

// WITH:
const finalProps = mergeFieldProps({
  providerDefaultFieldProps: providerConfig.defaultFieldProps,
  providerSelectDefaultFieldProps: providerSelectProps,  // CHANGED: Use evaluated provider props
  formDefaultFieldProps: formConfig.defaultFieldProps,
  formSelectDefaultFieldProps: formSelectProps,          // CHANGED: Use evaluated form props
  inputProps: inputConfig.props,
  fieldConfigProps: fieldConfig.props,
  selectProps: fieldSelectProps,                         // CHANGED: Use evaluated field props
  componentProps: restProps,
  coreProps: {
    name,
    label,
    disabled: isDisabled,
    error: fieldState.error?.message,
    [inputConfig.inputFieldProp ?? "value"]: formattedValue,
    onChange: handleChange(field.onChange),
    onBlur: field.onBlur,
    ref: field.ref,
  },
});

// KEY PATTERN: Each evaluated prop goes to its correct mergeFieldProps parameter
```

### Integration Points

```yaml
DEPENDENCIES (must be complete):
  - P1.M1.T1.S1: Hook parameters added to interface (Complete)
  - P1.M1.T1.S2: Form-level evaluation implemented (Complete)
  - P1.M1.T1.S3: Provider-level evaluation implemented (Complete)
  - P1.M1.T1.S4: TypeScript exports added (Complete)
  - P1.M1.T2.S1: Hook called with all three sources (Complete)

FILES TO MODIFY:
  - /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
    - Add EvaluatedPropsResult type
    - Change return type from SelectedProps to EvaluatedPropsResult
    - Remove early returns in evaluation logic
    - Return object with all three results

  - /home/dustin/projects/formality/packages/react/src/components/Field.tsx
    - Destructure new return value from usePropsEvaluation
    - Pass each evaluated prop to correct mergeFieldProps parameter

NO EXTERNAL INTEGRATION NEEDED:
  - No config changes required
  - No core package changes (mergeFieldProps already works correctly)
  - No new files created
  - No test changes in this subtask (tests come in P1.M1.T3)

FUTURE INTEGRATION (subsequent subtasks):
  - P1.M1.T3.S1: Will add tests for provider-level evaluation
  - P1.M1.T3.S2: Will add tests for form-level evaluation
  - P1.M1.T3.S3: Will add tests for 8-layer priority order
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check the modified files
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors
# Common errors to watch for:
# - "Property 'providerSelectProps' does not exist" → Check: EvaluatedPropsResult type exported
# - "Type 'EvaluatedPropsResult' is not assignable" → Check: Return type matches interface
# - "Cannot destructure property 'formSelectProps'" → Check: Hook returns correct type

# Full project type check
pnpm run typecheck

# Expected: All packages type-check successfully
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run Field component tests
pnpm -F @formality-ui/react test -- src/__tests__/Field.test.tsx

# Expected: All existing tests pass
# Reason: When all props are undefined, all three results should be {} (same as before)

# Run all React package tests
pnpm -F @formality-ui/react test

# Expected: All tests pass (184 tests in react package)
# Note: Tests for new functionality will be added in P1.M1.T3

# Run core package tests (mergeFieldProps tests)
pnpm -F @formality-ui/core test

# Expected: All tests pass (145 tests in core package)
# These verify mergeFieldProps works correctly with separate layers
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the package to verify no compilation errors
pnpm -F @formality-ui/react build

# Expected: Successful build with no TypeScript errors
# Verify output files exist:
ls -la packages/react/dist/hooks/usePropsEvaluation.js
ls -la packages/react/dist/hooks/usePropsEvaluation.d.ts
ls -la packages/react/dist/components/Field.js
ls -la packages/react/dist/components/Field.d.ts

# Build all packages
pnpm run build

# Expected: All packages build successfully
```

### Level 4: Manual Verification

```bash
# Create a test file to verify the integration works
cat > /tmp/test-p1m1t2s2-integration.tsx << 'EOF'
import { render, screen } from '@testing-library/react';
import { FormalityProvider, Form, Field } from '@formality-ui/react';

// Test input component
const TestInput = ({ value, onChange, disabled, placeholder, ...props }: any) => (
  <input
    data-testid="test-field"
    value={value ?? ''}
    onChange={(e) => onChange?.(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    {...props}
  />
);

const testInputs = {
  textField: { component: TestInput, defaultValue: '' },
};

// Test: 8-layer priority order with all layers
const providerConfig = {
  inputs: testInputs,
  defaultFieldProps: { size: 'small' },           // Layer 8 (static)
  selectDefaultFieldProps: { variant: 'outlined' }, // Layer 7 (dynamic)
};

const formConfig = {
  defaultFieldProps: { margin: 'dense' },          // Layer 6 (static)
  selectDefaultFieldProps: { placeholder: 'form' }, // Layer 5 (dynamic)
};

const fieldConfig = {
  type: 'textField',
  props: { required: true },                        // Layer 3 (static)
  selectProps: { disabled: false },                 // Layer 2 (dynamic)
};

const { container } = render(
  <FormalityProvider inputs={providerConfig.inputs}
                     defaultFieldProps={providerConfig.defaultFieldProps}
                     selectDefaultFieldProps={providerConfig.selectDefaultFieldProps}>
    <Form config={formConfig} defaultFieldProps={formConfig.defaultFieldProps}
                          selectDefaultFieldProps={formConfig.selectDefaultFieldProps}>
      <Field name="test" {...fieldConfig} className="jsx-prop" />
    </Form>
  </FormalityProvider>
);

const field = screen.getByTestId('test-field');
console.log('size (layer 8):', field.getAttribute('size'));
console.log('variant (layer 7):', field.getAttribute('variant'));
console.log('margin (layer 6):', field.style.margin);
console.log('placeholder (layer 5):', field.getAttribute('placeholder'));
console.log('required (layer 3):', field.required);
console.log('disabled (layer 2):', field.disabled);
console.log('className (layer 1):', field.className);

// All should be present and correct
EOF

# Type check the test file
pnpm -F @formality-ui/react exec tsc --noEmit /tmp/test-p1m1t2s2-integration.tsx

# Expected: No type errors
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compiles without errors: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] Package builds successfully: `pnpm -F @formality-ui/react build`
- [ ] Existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] `EvaluatedPropsResult` type defined and exported
- [ ] `usePropsEvaluation` returns `EvaluatedPropsResult`
- [ ] All three prop sources evaluated (no early returns)
- [ ] Field.tsx destructures all three results
- [ ] mergeFieldProps receives correct evaluated props for each layer

### Feature Validation

- [ ] `providerSelectProps` evaluated and passed to `mergeFieldProps` as `providerSelectDefaultFieldProps`
- [ ] `formSelectProps` evaluated and passed to `mergeFieldProps` as `formSelectDefaultFieldProps`
- [ ] `fieldSelectProps` evaluated and passed to `mergeFieldProps` as `selectProps`
- [ ] 8-layer priority order maintained correctly
- [ ] Backward compatibility maintained (existing tests pass)
- [ ] Empty objects `{}` returned when prop sources are undefined

### Code Quality Validation

- [ ] Follows existing codebase patterns
- [ ] No unnecessary refactoring beyond required changes
- [ ] TypeScript types satisfied
- [ ] No React hook rule violations
- [ ] Evaluation logic handles all SelectValue types (string, function, object, array)
- [ ] Proper memoization dependencies maintained

### Dependencies & Handoff

- [ ] P1.M1.T1.S1 complete (hook parameters added)
- [ ] P1.M1.T1.S2 complete (form-level evaluation)
- [ ] P1.M1.T1.S3 complete (provider-level evaluation)
- [ ] P1.M1.T1.S4 complete (TypeScript exports)
- [ ] P1.M1.T2.S1 complete (hook called with all sources)
- [ ] Ready for P1.M1.T3 (testing)

---

## Anti-Patterns to Avoid

- **Do NOT modify mergeFieldProps function** - it's in core package and already works correctly
- **Do NOT add early returns** - evaluate ALL three layers and return all results
- **Do NOT return undefined** - return empty objects `{}` when a prop source is undefined
- **Do NOT skip TypeScript check** - the new type must be properly defined
- **Do NOT change the priority order** - the 8-layer order is critical
- **Do NOT merge the results in the hook** - let mergeFieldProps handle the merging
- **Do NOT add tests** - tests are added in P1.M1.T3
- **Do NOT refactor surrounding code** - only make the required changes
- **Do NOT use SelectedProps as return type** - use the new EvaluatedPropsResult
- **Do NOT forget to export the new type** - Field.tsx needs to access it

---

## Related Work Items

### Prerequisites
- **P1.M1.T1.S1**: Add new parameters to hook signature (Complete)
- **P1.M1.T1.S2**: Implement form-level evaluation (Complete)
- **P1.M1.T1.S3**: Implement provider-level evaluation (Complete)
- **P1.M1.T1.S4**: Update TypeScript types (Complete)
- **P1.M1.T2.S1**: Consume evaluated props in Field (Complete)

### This Task Enables
- **P1.M1.T3.S1**: Test provider-level evaluation (will verify this integration)
- **P1.M1.T3.S2**: Test form-level evaluation (will verify this integration)
- **P1.M1.T3.S3**: Test 8-layer priority order (will verify this integration)

### Blocked By
- **P1.M1.T1** - All subtasks (S1-S4) must be complete
- **P1.M1.T2.S1** - Must be complete

---

## Research Findings Summary

### The Core Problem

The current `usePropsEvaluation` hook uses an **early-return pattern** that only returns the highest priority prop source:

```typescript
// Lines 191-226: Current implementation with early returns
if (formDefaultFieldProps) {
  // ... evaluate ...
  return result; // EARLY RETURN - loses providerResult
}
if (selectProps) {
  // ... evaluate ...
  return result; // EARLY RETURN - loses form and provider
}
return providerResult ?? {};
```

This means:
- If `formDefaultFieldProps` exists, only form result is returned (provider lost)
- If `selectProps` exists, only field result is returned (form and provider lost)
- Only when neither exists do we get the provider result

### Why This Breaks the 8-Layer Priority System

The `mergeFieldProps` function expects **separate evaluated results** for each layer:

```typescript
// mergeFieldProps signature (merge.ts lines 180-190)
mergeFieldProps({
  providerSelectDefaultFieldProps: ...,  // Layer 7
  formSelectDefaultFieldProps: ...,      // Layer 5
  selectProps: ...,                      // Layer 2
  // ... other layers ...
})
```

With early returns, we can't provide all three layers - we only get one!

### The Solution

Evaluate ALL three layers and return ALL results:

```typescript
// New: Evaluate all layers without early returns
let providerResult: Record<string, unknown> = {};
if (providerDefaultFieldProps) {
  // ... evaluate and store in providerResult
}

let formResult: Record<string, unknown> = {};
if (formDefaultFieldProps) {
  // ... evaluate and store in formResult (NOT return!)
}

let fieldResult: Record<string, unknown> = {};
if (selectProps) {
  // ... evaluate and store in fieldResult (NOT return!)
}

// Return all three results
return {
  providerSelectProps: providerResult,
  formSelectProps: formResult,
  fieldSelectProps: fieldResult,
};
```

### The 8-Layer Priority Order

From `merge.ts` lines 137-148:

1. **Component props** (JSX attributes) - Highest priority
2. **Field config selectProps** (evaluated) - Our `fieldSelectProps`
3. **Field config props** (static)
4. **Input config props** (static)
5. **Form config selectDefaultFieldProps** (evaluated) - Our `formSelectProps`
6. **Form config defaultFieldProps** (static)
7. **Provider config selectDefaultFieldProps** (evaluated) - Our `providerSelectProps`
8. **Provider config defaultFieldProps** (static) - Lowest priority

### SelectValue Types

From `@formality-ui/core` types:

```typescript
export type SelectValue<TReturn = unknown> =
  | string                    // Expression: "client.id ? clientOptions : allOptions"
  | SelectFunction<TReturn>   // Function: (formState, methods) => ({ disabled: true })
  | { [key: string]: SelectValue }  // Object: { disabled: "!signed", placeholder: "fields.type" }
  | SelectValue[];            // Array
```

The hook must handle all four types via `evaluateDescriptor()` (for non-functions) or direct call (for functions).

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

**9/10** for one-pass implementation success

**Rationale**:
- ✅ Well-defined changes with exact file locations
- ✅ All dependencies complete (P1.M1.T1 and P1.M1.T2.S1 fully done)
- ✅ Clear before/after code provided
- ✅ Existing patterns to follow
- ✅ TypeScript will catch type errors
- ⚠️ Requires coordinated changes in TWO files (usePropsEvaluation and Field)
- ✅ Backward compatible (empty objects when undefined)
- ✅ Existing tests verify no regressions

**Why not 10/10**: Requires understanding that the early-return pattern is the root cause and that all three layers must be evaluated independently. Once this concept is understood, the implementation is straightforward.
