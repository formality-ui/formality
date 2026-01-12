# PRP: P1.M1.T1.S1 - Add new parameters to usePropsEvaluation hook signature

---

## Goal

**Feature Goal**: Extend the `usePropsEvaluation` hook signature to accept `formDefaultFieldProps` and `providerDefaultFieldProps` parameters, enabling the infrastructure for evaluating default props at form and provider levels.

**Deliverable**: Modified `UsePropsEvaluationOptions` interface and hook signature with two new optional parameters (`formDefaultFieldProps?: SelectValue`, `providerDefaultFieldProps?: SelectValue`).

**Success Definition**:
- Hook signature accepts both new parameters
- TypeScript compiles without errors
- New parameters follow the exact same type pattern as existing `selectProps` parameter
- Backward compatibility maintained (existing calls continue to work)
- Parameters are added to the options interface but NOT yet implemented (implementation is in subsequent subtasks)

---

## Why

### Business Value
- **Bug Fix Foundation**: This is the first step in fixing Bug #1 (selectDefaultFieldProps Not Evaluated) - a CRITICAL issue blocking dynamic default props functionality
- **8-Layer Priority System**: Enables proper evaluation of layers 2 and 4 in the props merging pipeline (providerSelectDefaultFieldProps and formSelectDefaultFieldProps)
- **User Impact**: Allows form developers to specify dynamic default props that change based on form state (e.g., `{ disabled: "!signed" }`)

### Integration with Existing Features
- Builds on the existing `usePropsEvaluation` hook pattern for `selectProps`
- Follows the established 8-layer props merging system in `/packages/core/src/config/merge.ts`
- Maintains consistency with the expression evaluation engine from `@formality-ui/core`

### Problems Solved
- **Current Bug**: Expressions in `selectDefaultFieldProps` are passed through as-is instead of being evaluated
- **After This Subtask**: Infrastructure exists for evaluation (implementation in subsequent subtasks)

---

## What

Modify the `usePropsEvaluation` hook to accept two new optional parameters in its options object:

1. **`formDefaultFieldProps`**: Dynamic default props from Form-level config (higher priority)
2. **`providerDefaultFieldProps`**: Dynamic default props from Provider-level config (lower priority)

Both parameters accept the same type as `selectProps`: `SelectValue` (string expression | function | object | array)

### Success Criteria

- [ ] `UsePropsEvaluationOptions` interface extended with `formDefaultFieldProps?: SelectValue`
- [ ] `UsePropsEvaluationOptions` interface extended with `providerDefaultFieldProps?: SelectValue`
- [ ] Hook function signature compiles with TypeScript without errors
- [ ] Existing calls to `usePropsEvaluation` continue to work (backward compatibility)
- [ ] New parameters are destructured from options object (not yet implemented)
- [ ] JSDoc comments added for new parameters following existing pattern
- [ ] No runtime errors when hook is called with or without new parameters

---

## All Needed Context

### Context Completeness Check

*"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"*

**YES** - This PRP provides:
- Exact file location and line numbers for modifications
- Complete current implementation code
- Exact type definitions to reference
- Naming conventions to follow
- Test patterns (hooks tested via integration tests)
- Validation commands that work in this project

### Documentation & References

```yaml
# MUST READ - Core Implementation File
- file: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  why: This is the ONLY file to modify for this subtask. Contains the hook signature and options interface.
  pattern: Options object pattern with interface named UsePropsEvaluationOptions
  gotcha: Do NOT implement evaluation logic yet - only add parameters to signature

# TYPE DEFINITIONS
- file: /home/dustin/projects/formality/packages/core/src/types/config.ts
  why: Contains SelectValue type definition that new parameters must use
  section: Lines 18-22 define SelectValue as: string | SelectFunction | { [key: string]: SelectValue } | SelectValue[]
  critical: Both new parameters MUST use this exact type

# HOOK PARAMETER PATTERN REFERENCE
- file: /home/dustin/projects/formality/packages/react/src/hooks/useInferredInputs.ts
  why: Shows the pattern for multiple SelectValue parameters in options object
  pattern: interface UseInferredInputsOptions has selectProps, conditions, subscribesTo - all optional
  gotcha: Follow this exact pattern for destructuring: const { selectProps, conditions = [], subscribesTo = [] } = options;

# FIELD COMPONENT USAGE
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows how usePropsEvaluation is currently called (line 289) - will be updated in later subtask
  pattern: const evaluatedSelectProps = usePropsEvaluation({ selectProps, subscribesTo, fieldName });
  note: This file will be modified in P1.M1.T2.S1, NOT this subtask

# ARCHITECTURE CONTEXT
- file: /home/dustin/projects/formality/plan/bugfix/architecture/codebase_analysis.md
  why: Explains Bug #1 and the 8-layer priority system context
  section: Lines 100-137 detail Bug #1: selectDefaultFieldProps Not Evaluated
  critical: Understanding the bug helps ensure correct implementation

# TEST PATTERNS
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Shows how hooks are tested in this codebase (via component integration tests)
  pattern: Hooks are tested by creating components that use them, not with renderHook
  note: Tests for this change will be added in P1.M1.T3, NOT this subtask

# 8-LAYER MERGE SYSTEM
- file: /home/dustin/projects/formality/packages/core/src/config/merge.ts
  why: Shows where evaluated props will eventually merge (lines 180-215)
  section: mergeFieldProps function defines priority order
  note: This file shows the destination for evaluated props, not modified in this subtask
```

### Current Codebase tree

```bash
packages/
├── core/
│   └── src/
│       ├── types/
│       │   └── config.ts                    # SelectValue type definition
│       └── config/
│           └── merge.ts                     # 8-layer merge system (for context)
└── react/
    └── src/
        ├── hooks/
        │   ├── usePropsEvaluation.ts        # ONLY FILE TO MODIFY in this subtask
        │   ├── useInferredInputs.ts         # Pattern reference for multi-param options
        │   └── useConditions.ts             # Another pattern reference
        ├── components/
        │   ├── Field.tsx                    # Will use new params (modified in P1.M1.T2)
        │   └── Form.tsx
        └── __tests__/
            ├── Field.test.tsx               # Hook testing pattern reference
            └── Form.test.tsx
```

### Desired Codebase tree with files to be added

```bash
# No new files - only modification of existing file
packages/react/src/hooks/usePropsEvaluation.ts  # MODIFY: Add two new parameters to interface
```

### Current Implementation (for reference)

```typescript
// File: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
// Lines 16-25: Current UsePropsEvaluationOptions interface

interface UsePropsEvaluationOptions {
  /** Dynamic props descriptor to evaluate */
  selectProps?: SelectValue;

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Current field name */
  fieldName: string;
}
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: SelectValue is a union type from @formality-ui/core
// Do NOT redefine locally - import from core package
import type { SelectValue } from "@formality-ui/core";

// CRITICAL: All hook parameters in this codebase use the Options Object pattern
// NEVER use multiple positional parameters (e.g., don't do: function usePropsEvaluation(selectProps, fieldName))
// Always use: function usePropsEvaluation(options: UsePropsEvaluationOptions)

// CRITICAL: Optional properties in interfaces must use "?:" syntax
// Correct: formDefaultFieldProps?: SelectValue
// Wrong: formDefaultFieldProps: SelectValue | undefined

// CRITICAL: Default values are set in destructuring, NOT in the interface
// Pattern: const { selectProps, formDefaultFieldProps, fieldName } = options;
// Do NOT add defaults in interface type definition

// CRITICAL: JSDoc comments follow /** */ style with @param tags for each parameter
// Follow the existing pattern for selectProps and fieldName

// CRITICAL: Type imports use "import type { }" syntax (ESLint rule)
// NOT: "import { }" for type-only imports

// GOTCHA: This subtask ONLY modifies the type signature
// Implementation of evaluation logic is in subsequent subtasks (P1.M1.T1.S2, P1.M1.T1.S3)
// Do NOT add evaluation logic for the new parameters in this subtask

// GOTCHA: React hooks must be called in the same order every render
// Do NOT add conditional React hook calls based on the new parameters
```

---

## Implementation Blueprint

### Data models and structure

No new data models. The `SelectValue` type from `@formality-ui/core` is used for both new parameters:

```typescript
// From @formality-ui/core (already imported)
export type SelectValue<TReturn = unknown> =
  | string                    // Expression: "client.id"
  | SelectFunction<TReturn>   // Function callback
  | { [key: string]: SelectValue }  // Nested object
  | SelectValue[];            // Array of values
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY UsePropsEvaluationOptions interface
  - ADD: formDefaultFieldProps?: SelectValue parameter
  - ADD: providerDefaultFieldProps?: SelectValue parameter
  - PRESERVE: All existing parameters (selectProps, subscribesTo, fieldName)
  - PLACEMENT: After selectProps, before subscribesTo (grouping related props together)
  - PATTERN: Follow existing optional parameter syntax with "?:"
  - JSDOC: Add documentation comments matching existing style
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts

Task 2: UPDATE function destructuring
  - DESTRUCTURE: formDefaultFieldProps from options object
  - DESTRUCTURE: providerDefaultFieldProps from options object
  - PRESERVE: Existing destructuring pattern
  - PATTERN: const { selectProps, formDefaultFieldProps, providerDefaultFieldProps, subscribesTo, fieldName } = options;
  - PLACEMENT: Line 55 (after current destructuring)
  - GOTCHA: Do NOT add default values in destructuring for this subtask
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts

Task 3: UPDATE JSDoc comments
  - ADD: @param documentation for formDefaultFieldProps
  - ADD: @param documentation for providerDefaultFieldProps
  - PATTERN: Follow existing @param style: /** @param {SelectValue} [formDefaultFieldProps] - Description */
  - PLACEMENT: In the hook's JSDoc block (lines 27-50)
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts

Task 4: VALIDATE TypeScript compilation
  - RUN: pnpm -F @formality-ui/react run tsc --noEmit
  - EXPECT: Zero type errors
  - IF ERRORS: Read output and fix type mismatches
  - VERIFY: Import of SelectValue is correct (from @formality-ui/core)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Options Object Interface (follow existing pattern exactly)
interface UsePropsEvaluationOptions {
  // Existing parameter
  /** Dynamic props descriptor to evaluate */
  selectProps?: SelectValue;

  // NEW: Add these two parameters
  /** Dynamic default field props from Form config (higher priority) */
  formDefaultFieldProps?: SelectValue;

  /** Dynamic default field props from Provider config (lower priority) */
  providerDefaultFieldProps?: SelectValue;

  // Existing parameters
  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Current field name */
  fieldName: string;
}

// PATTERN: Destructuring from options object
export function usePropsEvaluation(
  options: UsePropsEvaluationOptions,
): Record<string, unknown> {
  const {
    selectProps,
    formDefaultFieldProps,  // NEW
    providerDefaultFieldProps,  // NEW
    subscribesTo,
    fieldName,
  } = options;
  // ... rest of hook unchanged
}

// PATTERN: JSDoc comment style
/**
 * Evaluates selectProps against current field values
 *
 * @param {UsePropsEvaluationOptions} options - Hook options
 * @param {SelectValue} [options.selectProps] - Dynamic props descriptor to evaluate
 * @param {SelectValue} [options.formDefaultFieldProps] - Dynamic default props from Form config
 * @param {SelectValue} [options.providerDefaultFieldProps] - Dynamic default props from Provider config
 * @param {string[]} [options.subscribesTo] - Explicit field subscriptions
 * @param {string} options.fieldName - Current field name
 * @returns {Record<string, unknown>} Evaluated props object
 */

// GOTCHA: Do NOT add evaluation logic for new parameters yet
// That will be done in P1.M1.T1.S2 (form-level) and P1.M1.T1.S3 (provider-level)
// This subtask ONLY adds the parameters to the signature
```

### Integration Points

```yaml
NONE FOR THIS SUBTASK:
  - This subtask only modifies type signatures
  - No integration points are changed
  - No tests need to be updated (backward compatible)
  - No config changes needed

FUTURE INTEGRATION (subsequent subtasks):
  - P1.M1.T1.S2: Will implement formDefaultFieldProps evaluation
  - P1.M1.T1.S3: Will implement providerDefaultFieldProps evaluation
  - P1.M1.T2.S1: Will update Field.tsx to pass the new parameters
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check the modified file
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors
# Common errors to watch for:
# - "Cannot find name 'SelectValue'" → Fix: Add import from @formality-ui/core
# - "Property 'formDefaultFieldProps' does not exist" → Fix: Add to interface

# Lint check (if using ESLint)
pnpm -F @formality-ui/react run lint

# Expected: No linting errors
# Watch for: unused variables (expected for this subtask - will be used in later subtasks)
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run existing hook tests to verify backward compatibility
pnpm -F @formality-ui/react test -- src/__tests__/Field.test.tsx

# Expected: All existing tests pass
# Reason: New parameters are optional, so existing calls still work

# Run all React package tests
pnpm -F @formality-ui/react test

# Expected: All tests pass
# Note: Tests for the new functionality will be added in P1.M1.T3
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the package to verify no compilation errors
pnpm -F @formality-ui/react build

# Expected: Successful build with no TypeScript errors

# Verify the type definitions are exported correctly
cat packages/react/dist/hooks/usePropsEvaluation.d.ts | grep -E "(formDefaultFieldProps|providerDefaultFieldProps)"

# Expected: Should see the new parameters in the .d.ts file
```

### Level 4: Manual Verification

```bash
# Create a test file to verify the new signature is callable
cat > /tmp/test-hook-signature.ts << 'EOF'
import { usePropsEvaluation } from '@formality-ui/react';

// Test 1: Existing call pattern (backward compatibility)
const result1 = usePropsEvaluation({
  selectProps: { disabled: '!signed' },
  fieldName: 'testField',
});

// Test 2: Call with new formDefaultFieldProps parameter
const result2 = usePropsEvaluation({
  selectProps: { placeholder: 'test' },
  formDefaultFieldProps: { disabled: 'false' },
  fieldName: 'testField',
});

// Test 3: Call with both new parameters
const result3 = usePropsEvaluation({
  selectProps: { placeholder: 'test' },
  formDefaultFieldProps: { className: 'form-default' },
  providerDefaultFieldProps: { className: 'provider-default' },
  fieldName: 'testField',
});

// Test 4: All parameters
const result4 = usePropsEvaluation({
  selectProps: { disabled: '!signed' },
  formDefaultFieldProps: { readonly: 'true' },
  providerDefaultFieldProps: { variant: 'outlined' },
  subscribesTo: ['client', 'signed'],
  fieldName: 'contact',
});
EOF

# Type check the test file
pnpm -F @formality-ui/react exec tsc --noEmit /tmp/test-hook-signature.ts

# Expected: No type errors
# If errors: Fix the interface definition or parameter types
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compiles without errors: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] Package builds successfully: `pnpm -F @formality-ui/react build`
- [ ] Type definitions (.d.ts) include new parameters
- [ ] Existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] No linting errors: `pnpm -F @formality-ui/react run lint`
- [ ] Manual signature verification passes (Level 4 test)

### Feature Validation

- [ ] `formDefaultFieldProps` parameter added to UsePropsEvaluationOptions interface
- [ ] `providerDefaultFieldProps` parameter added to UsePropsEvaluationOptions interface
- [ ] Both parameters use `SelectValue` type from `@formality-ui/core`
- [ ] Both parameters are optional (using `?:` syntax)
- [ ] JSDoc comments added for both parameters
- [ ] Backward compatibility maintained (existing calls work)
- [ ] No implementation logic added (that's for subsequent subtasks)

### Code Quality Validation

- [ ] Follows existing options object pattern
- [ ] Parameter grouping logical (props together, subscriptions together)
- [ ] Naming matches existing pattern (descriptive, camelCase)
- [ ] Import statements correct (SelectValue from @formality-ui/core)
- [ ] File unchanged except for the specific modifications
- [ ] No side effects or React hook order changes

### Dependencies & Handoff

- [ ] Changes isolated to single file (usePropsEvaluation.ts)
- [ ] Ready for P1.M1.T1.S2 (implement form-level evaluation)
- [ ] Ready for P1.M1.T1.S3 (implement provider-level evaluation)
- [ ] Ready for P1.M1.T2 (integrate into Field component)

---

## Anti-Patterns to Avoid

- **Do NOT add evaluation logic** for the new parameters in this subtask - that's P1.M1.T1.S2 and P1.M1.T1.S3
- **Do NOT modify Field.tsx** - that's P1.M1.T2.S1
- **Do NOT add tests** - tests are added in P1.M1.T3
- **Do NOT use positional parameters** - always use options object pattern
- **Do NOT make parameters required** - they must be optional for backward compatibility
- **Do NOT add default values in destructuring** - optional properties handle this
- **Do NOT create new types** - use existing SelectValue from @formality-ui/core
- **Do NOT add conditional React hook calls** - hooks must be called in same order every render
- **Do NOT re-order existing parameters** - add new ones without changing position of existing
- **Do NOT skip JSDoc comments** - follow existing documentation style

---

## Related Work Items

### Prerequisites
- **None** - This is the first task in the bug fix sprint

### This Task Enables
- **P1.M1.T1.S2**: Implement form-level evaluation (uses formDefaultFieldProps parameter)
- **P1.M1.T1.S3**: Implement provider-level evaluation (uses providerDefaultFieldProps parameter)
- **P1.M1.T1.S4**: Update TypeScript types (may need additional type updates)
- **P1.M1.T2**: Integrate into Field Component (passes these parameters to hook)
- **P1.M1.T3**: Add Tests for selectDefaultFieldProps

### Blocked By
- **None**

---

## Confidence Score

**8/10** for one-pass implementation success

**Rationale**:
- ✅ Clear, single-file scope (only usePropsEvaluation.ts)
- ✅ Exact type to use is known (SelectValue from @formality-ui/core)
- ✅ Pattern exists in codebase (useInferredInputs has multiple SelectValue params)
- ✅ Backward compatible change (optional parameters)
- ⚠️ Minor risk: Ensure JSDoc comments match exact format
- ⚠️ No implementation logic yet - but that's intentional for this subtask

**Confidence would be 10/10 if**:
- Implementation logic was included (but that's split across S2 and S3)
- Tests were added (but that's T3)
