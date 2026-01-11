# PRP: P1.M1.T1.S4 - Update TypeScript Types

---

## Goal

**Feature Goal**: Create and export explicit TypeScript type aliases for the `usePropsEvaluation` hook's parameters and return type, improving type documentation and developer ergonomics.

**Deliverable**: Updated TypeScript type definitions exported from `/packages/react/src/hooks/usePropsEvaluation.ts` including `SelectedProps` type alias and properly exported `UsePropsEvaluationOptions` interface.

**Success Definition**:
- `SelectedProps` type alias is created as `Record<string, unknown>`
- `UsePropsEvaluationOptions` interface is exported for external use
- All hook parameters use appropriate optional types (`?:`)
- Return type is explicit and exportable
- TypeScript compilation passes without errors
- Type definitions appear in package `.d.ts` files after build

---

## Why

### Business Value
- **Type Safety**: Explicit exported types improve TypeScript IDE autocomplete and type checking
- **Developer Experience**: Type aliases make the API more self-documenting
- **Contract Clarity**: Clear type definitions serve as documentation for the hook's contract

### Integration with Existing Features
- Builds on S1 (parameter addition), S2 (form-level evaluation), and S3 (provider-level evaluation)
- Maintains backward compatibility with existing `SelectValue` type from `@formality-ui/core`
- No runtime changes - pure TypeScript type definitions

### Problems Solved
- **Current Issue**: Return type `Record<string, unknown>` is implicit and not exported
- **After This Subtask**: Type is explicit, exportable, and can be referenced externally
- **Better DX**: Developers can import and reuse types in their code

---

## What

Create and export TypeScript type definitions for the `usePropsEvaluation` hook:

1. **`SelectedProps` type**: Alias for `Record<string, unknown>` - the evaluated props object
2. **Export `UsePropsEvaluationOptions`**: Make the options interface importable
3. **Explicit return type**: Use `SelectedProps` as the return type annotation

### Success Criteria

- [ ] `SelectedProps` type alias created as `Record<string, unknown>`
- [ ] `UsePropsEvaluationOptions` is exported (if not already)
- [ ] Hook function signature uses explicit `SelectedProps` return type
- [ ] TypeScript compiles without errors: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] Types appear in `.d.ts` files after build
- [ ] No runtime behavior changes (type-only change)

---

## All Needed Context

### Context Completeness Check

*"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"*

**YES** - This PRP provides:
- Exact file location for modifications
- Current implementation state (post-S1, S2, S3)
- Type definitions to reference
- Export patterns to follow
- Validation commands

### Documentation & References

```yaml
# MUST READ - Primary Implementation File
- file: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  why: This is the ONLY file to modify for this subtask
  pattern: Add type alias at top of file, export interface, update return type annotation
  gotcha: This is a TYPE-ONLY change - no runtime logic modifications
  section: Lines 1-65 contain imports, interface, and function signature

# TYPE DEFINITIONS TO REFERENCE
- file: /home/dustin/projects/formality/packages/core/src/types/config.ts
  why: Contains SelectValue type used in UsePropsEvaluationOptions
  section: Lines 18-22 define SelectValue
  critical: SelectValue must remain as the parameter type (no change needed)

# EXPORT PATTERNS IN CODEBASE
- file: /home/dustin/projects/formality/packages/react/src/hooks/useInferredInputs.ts
  why: Shows pattern for exported hook interfaces
  pattern: interface is defined, exported inline with export function
  gotcha: Some interfaces use "export interface", others don't

# TYPE ALIAS PATTERNS
- file: /home/dustin/projects/formality/packages/react/src/types/index.ts
  why: Shows existing type alias patterns in the codebase
  pattern: Type aliases for commonly used types
  gotcha: May add SelectedProps here OR in usePropsEvaluation.ts

# CURRENT IMPLEMENTATION STATE (Post-S1, S2, S3)
- file: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  why: Current implementation already has formDefaultFieldProps and providerDefaultFieldProps evaluation
  pattern: Lines 16-31 show current UsePropsEvaluationOptions interface
  note: S1 added parameters, S2/S3 implemented evaluation - S4 only updates types
```

### Current Codebase Tree

```bash
packages/
├── core/
│   └── src/
│       └── types/
│           └── config.ts                    # SelectValue type definition
└── react/
    └── src/
        ├── hooks/
        │   └── usePropsEvaluation.ts        # MODIFY: Add type alias and exports
        ├── types/
        │   └── index.ts                     # OPTIONAL: May add SelectedProps here
        └── index.ts                         # Re-exports public API
```

### Desired Codebase Tree

```bash
# No new files - only modifications

packages/react/src/hooks/usePropsEvaluation.ts  # MODIFY: Add SelectedProps type alias

# Alternative (if centralizing types):
packages/react/src/types/index.ts               # OPTIONAL: Add SelectedProps here
```

### Current Implementation (Post-S1, S2, S3)

```typescript
// File: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import {
  evaluateDescriptor,
  buildFieldContext,
  type FormState,
} from "@formality-ui/core";
import type { SelectValue } from "@formality-ui/core";
import { useFormContext } from "../context/FormContext";
import { useInferredInputs } from "./useInferredInputs";
import { makeProxyState } from "../utils/makeProxyState";

// Lines 16-31: Current interface (S1 added the new params)
interface UsePropsEvaluationOptions {
  selectProps?: SelectValue;
  formDefaultFieldProps?: SelectValue;
  providerDefaultFieldProps?: SelectValue;
  subscribesTo?: string[];
  fieldName: string;
}

// Lines 63-65: Current function signature (implicit return type)
export function usePropsEvaluation(
  options: UsePropsEvaluationOptions,
): Record<string, unknown> {
  // ... implementation (S2/S3 complete)
}
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: This is a TYPE-ONLY change
// Do NOT modify any runtime logic
// Do NOT change evaluation order or implementation

// CRITICAL: SelectValue is the correct type for parameters
// Do NOT change parameter types - they must remain SelectValue
// The task description mentioning "SelectPropsDescriptor" is a placeholder name
// Actual type in codebase is SelectValue

// CRITICAL: Return type IS Record<string, unknown>
// SelectedProps should be a type alias, not a new structure
// Pattern: type SelectedProps = Record<string, unknown>

// CRITICAL: Export patterns in this codebase
// Option A: export type { SelectedProps } from "./usePropsEvaluation"
// Option B: export type { SelectedProps } from "./types"
// Either is acceptable - choose based on existing patterns

// GOTCHA: The hook function is already exported
// We're adding explicit return type annotation and exporting the interface

// GOTCHA: Interface export may already exist
// Check if "export interface UsePropsEvaluationOptions" is already present
// If yes, no change needed. If no, add export keyword.

// GOTCHA: Type aliases go at TOP of file, after imports
// Before the interface definition

// GOTCHA: Build process generates .d.ts files
// After running build, verify types appear in dist/hooks/usePropsEvaluation.d.ts
```

---

## Implementation Blueprint

### Data Models and Structure

**New Type Alias to Create**:
```typescript
/**
 * Evaluated props object returned by usePropsEvaluation
 *
 * Result of evaluating SelectValue expressions against current form state.
 * Contains the merged, evaluated props ready for field component use.
 *
 * @example
 * ```ts
 * const props: SelectedProps = usePropsEvaluation({
 *   selectProps: { disabled: '!signed' },
 *   fieldName: 'contact',
 * });
 * // props = { disabled: boolean }
 * ```
 */
export type SelectedProps = Record<string, unknown>;
```

**Updated Interface (ensure export)**:
```typescript
export interface UsePropsEvaluationOptions {
  selectProps?: SelectValue;
  formDefaultFieldProps?: SelectValue;
  providerDefaultFieldProps?: SelectValue;
  subscribesTo?: string[];
  fieldName: string;
}
```

**Updated Function Signature**:
```typescript
export function usePropsEvaluation(
  options: UsePropsEvaluationOptions,
): SelectedProps {
  // ... implementation unchanged
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD SelectedProps type alias
  - CREATE: type SelectedProps = Record<string, unknown>
  - ADD: JSDoc documentation explaining the type
  - PLACEMENT: Top of file, after imports, before interface
  - EXPORT: Use "export type" to make it importable
  - PATTERN: Follow existing type alias patterns in codebase
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts

Task 2: VERIFY UsePropsEvaluationOptions is exported
  - CHECK: If interface has "export" keyword
  - ADD: "export" keyword if missing
  - PRESERVE: All existing properties and their types
  - PATTERN: export interface UsePropsEvaluationOptions
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts

Task 3: UPDATE function return type annotation
  - CHANGE: Return type from implicit to explicit SelectedProps
  - PRESERVE: All function logic unchanged (runtime behavior identical)
  - BEFORE: export function usePropsEvaluation(options: UsePropsEvaluationOptions): Record<string, unknown>
  - AFTER: export function usePropsEvaluation(options: UsePropsEvaluationOptions): SelectedProps
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts

Task 4: (OPTIONAL) Add to types/index.ts for centralized exports
  - DECIDE: Whether to export SelectedProps from types/index.ts
  - ADD: export type { SelectedProps } from "../hooks/usePropsEvaluation"
  - OR: Define SelectedProps directly in types/index.ts
  - PATTERN: Follow existing export patterns in the file
  - FILE: /home/dustin/projects/formality/packages/react/src/types/index.ts

Task 5: VERIFY TypeScript compilation
  - RUN: pnpm -F @formality-ui/react run tsc --noEmit
  - EXPECT: Zero type errors
  - IF ERRORS: Check export syntax and type alias definition

Task 6: VERIFY type definitions in build output
  - RUN: pnpm -F @formality-ui/react build
  - CHECK: packages/react/dist/hooks/usePropsEvaluation.d.ts
  - VERIFY: SelectedProps type appears in .d.ts file
  - VERIFY: UsePropsEvaluationOptions is exported in .d.ts file
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Type alias definition with documentation
// ============================================================================

/**
 * Evaluated props object returned by usePropsEvaluation
 *
 * Result of evaluating SelectValue expressions (selectProps, formDefaultFieldProps,
 * providerDefaultFieldProps) against current form state.
 *
 * The evaluation follows the 8-layer priority system where higher-priority
 * props override lower-priority ones:
 * 1. Field-level selectProps (highest)
 * 2. Form-level formDefaultFieldProps
 * 3. Provider-level providerDefaultFieldProps (lowest)
 *
 * @example
 * ```ts
 * // Expression evaluation
 * const props = usePropsEvaluation({
 *   selectProps: { disabled: '!signed' },
 *   fieldName: 'contact',
 * });
 * // When signed=false, props = { disabled: true }
 *
 * // Function callback evaluation
 * const props = usePropsEvaluation({
 *   selectProps: (formState) => ({
 *     variant: formState.fields.type?.value === 'premium' ? 'filled' : 'outlined'
 *   }),
 *   fieldName: 'variant',
 * });
 * ```
 */
export type SelectedProps = Record<string, unknown>;

// ============================================================================
// PATTERN: Exported interface
// ============================================================================

export interface UsePropsEvaluationOptions {
  /** Dynamic props descriptor to evaluate (field-level, highest priority) */
  selectProps?: SelectValue;

  /** Dynamic default field props from Form config (medium priority) */
  formDefaultFieldProps?: SelectValue;

  /** Dynamic default field props from Provider config (lowest priority) */
  providerDefaultFieldProps?: SelectValue;

  /** Explicit field subscriptions */
  subscribesTo?: string[];

  /** Current field name */
  fieldName: string;
}

// ============================================================================
// PATTERN: Function with explicit return type
// ============================================================================

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

  // ... rest of implementation unchanged
  // (S2 and S3 already implemented the evaluation logic)
}
```

### Integration Points

```yaml
NO RUNTIME INTEGRATION CHANGES:
  - This is a type-only change
  - No component modifications needed
  - No test modifications needed (existing tests should pass)
  - No config changes needed

TYPE-LEVEL CHANGES:
  - SelectedProps becomes importable by external code
  - UsePropsEvaluationOptions becomes importable by external code
  - Return type is explicit and self-documenting

OPTIONAL: Re-export from package index
  - FILE: packages/react/src/index.ts
  - ADD: export type { SelectedProps, UsePropsEvaluationOptions } from "./hooks/usePropsEvaluation"
  - PATTERN: Follow existing export patterns in index.ts
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check the modified file
cd /home/dustin/projects/formality
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors
# Common errors to watch for:
# - "Duplicate identifier" → Export already exists, remove duplicate
# - "Cannot find name 'SelectedProps'" → Type alias not defined or not imported
# - "Exported type alias has or is using private name" → Add export keyword

# Lint check
pnpm -F @formality-ui/react run lint

# Expected: No linting errors
# Watch for: unused exports (if SelectedProps is used immediately, no issue)
```

### Level 2: Type Definition Verification

```bash
# Build the package to generate .d.ts files
pnpm -F @formality-ui/react build

# Verify SelectedProps appears in type definitions
cat packages/react/dist/hooks/usePropsEvaluation.d.ts | grep -A2 "SelectedProps"

# Expected output:
# export declare type SelectedProps = Record<string, unknown>;
# export declare interface UsePropsEvaluationOptions { ... }
# export declare function usePropsEvaluation(options: UsePropsEvaluationOptions): SelectedProps;

# Verify UsePropsEvaluationOptions is exported
cat packages/react/dist/hooks/usePropsEvaluation.d.ts | grep "UsePropsEvaluationOptions"

# Expected: Interface should be exported with all properties
```

### Level 3: Import Verification

```bash
# Create a test file to verify types are importable
cat > /tmp/test-type-imports.ts << 'EOF'
import {
  usePropsEvaluation,
  type SelectedProps,
  type UsePropsEvaluationOptions,
} from '@formality-ui/react';

// Test that types can be used in annotations
const options: UsePropsEvaluationOptions = {
  selectProps: { disabled: '!signed' },
  fieldName: 'test',
};

const result: SelectedProps = usePropsEvaluation(options);

// Test that SelectedProps is Record<string, unknown>
const propValue: unknown = result.disabled;
console.log(propValue);
EOF

# Type check the test file
pnpm -F @formality-ui/react exec tsc --noEmit /tmp/test-type-imports.ts

# Expected: No type errors
# If errors: Check export syntax and build output
```

### Level 4: Runtime Verification (No Changes Expected)

```bash
# Run existing tests to verify no runtime changes
pnpm -F @formality-ui/react test

# Expected: All tests pass
# Reason: Type-only changes should not affect runtime behavior

# Verify hook still works correctly
# (If integration tests exist for usePropsEvaluation)
pnpm -F @formality-ui/react test -- usePropsEvaluation
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compiles without errors: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] Package builds successfully: `pnpm -F @formality-ui/react build`
- [ ] `SelectedProps` appears in `.d.ts` files
- [ ] `UsePropsEvaluationOptions` is exported in `.d.ts` files
- [ ] Return type annotation uses `SelectedProps`
- [ ] No linting errors introduced

### Feature Validation

- [ ] `SelectedProps` type alias created as `Record<string, unknown>`
- [ ] `UsePropsEvaluationOptions` interface is exported
- [ ] Function signature uses explicit `SelectedProps` return type
- [ ] Types are importable from `@formality-ui/react`
- [ ] No runtime behavior changes (all tests pass)

### Code Quality Validation

- [ ] JSDoc comments added for `SelectedProps`
- [ ] Follows existing type alias patterns in codebase
- [ ] Export syntax follows existing patterns
- [ ] File unchanged except for type additions
- [ ] No duplicate exports

### Documentation & Handoff

- [ ] Types are self-documenting with clear names
- [ ] JSDoc explains 8-layer priority system
- [ ] Ready for consumer use (external types can import)
- [ ] P1.M1.T2 (Field integration) can use these types
- [ ] P1.M1.T3 (Tests) can reference these types

---

## Anti-Patterns to Avoid

- **Do NOT change runtime logic** - This is a type-only change
- **Do NOT modify SelectValue** - Keep parameter types as SelectValue
- **Do NOT create new structures** - SelectedProps is an alias, not a new type
- **Do NOT change evaluation order** - S2/S3 logic is final
- **Do NOT add to types/index.ts unless necessary** - Keep types local if not used elsewhere
- **Do NOT create duplicate exports** - Check if export already exists before adding
- **Do NOT forget to build** - Type definitions only appear after build
- **Do NOT skip verification** - Always check .d.ts output file
- **Do NOT use "SelectPropsDescriptor"** - That was a placeholder name, use SelectValue
- **Do NOT change the return structure** - SelectedProps is just an alias

---

## Related Work Items

### Prerequisites
- **P1.M1.T1.S1**: Add new parameters to hook signature (Complete)
- **P1.M1.T1.S2**: Implement form-level evaluation (Complete)
- **P1.M1.T1.S3**: Implement provider-level evaluation (Complete)

### This Task Enables
- **P1.M1.T2**: Integrate into Field Component (Field can use exported types)
- **P1.M1.T3**: Add Tests (Tests can reference exported types)

### Blocked By
- **None** - S1, S2, S3 are complete

---

## Confidence Score

**9/10** for one-pass implementation success

**Rationale**:
- Type-only change (minimal risk)
- Clear scope (single file modification)
- Existing patterns to follow
- No runtime logic changes
- Straightforward validation

**Risk Factors**:
- Export pattern may need verification (check existing exports first)
- Build step required to verify .d.ts output

---

## Research Summary

### Type Definitions Analysis

The `usePropsEvaluation` hook uses:
- **Parameter Types**: `SelectValue` from `@formality-ui/core` (a polymorphic type supporting strings, functions, objects, arrays)
- **Return Type**: `Record<string, unknown>` (evaluated props object)
- **Interface**: `UsePropsEvaluationOptions` (options object pattern)

### Contract Definition Alignment

The task description mentions `SelectPropsDescriptor` and `SelectedProps` types. Based on codebase analysis:
- `SelectPropsDescriptor` does not exist - the actual type is `SelectValue`
- `SelectedProps` is being created in this subtask as an alias for `Record<string, unknown>`

### Current State (Post-S1, S2, S3)

The implementation is complete:
- Parameters added to interface (S1)
- Form-level evaluation implemented (S2)
- Provider-level evaluation implemented (S3)
- S4 adds explicit type definitions for better developer experience
