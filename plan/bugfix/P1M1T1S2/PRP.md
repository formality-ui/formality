# PRP: P1.M1.T1.S2 - Implement form-level evaluation

---

## Goal

**Feature Goal**: Implement evaluation logic for `formDefaultFieldProps` parameter in the `usePropsEvaluation` hook, enabling dynamic form-level default field props that are evaluated against current form state.

**Deliverable**: Modified `usePropsEvaluation` hook with working `formDefaultFieldProps` evaluation logic that supports both function callbacks and expression strings.

**Success Definition**:
- `formDefaultFieldProps` is evaluated when provided
- Function callbacks receive `formState` and `methods` parameters
- Expression strings are evaluated using `evaluateDescriptor()` with proper context
- Evaluated result is returned (not yet merged - merge happens in P1.M1.T2.S2)
- `evaluate()` is properly mocked in unit tests
- All existing tests continue to pass (backward compatibility)

---

## Why

### Business Value
- **Bug Fix Continuation**: This is the second step in fixing Bug #1 (selectDefaultFieldProps Not Evaluated)
- **Layer 4 Evaluation**: Enables evaluation of formSelectDefaultFieldProps in the 8-layer priority system
- **User Impact**: Allows form-level dynamic default props (e.g., `{ disabled: "!signed" }` at the Form config level)

### Integration with Existing Features
- Builds on the parameter added in P1.M1.T1.S1
- Follows the existing `selectProps` evaluation pattern
- Uses the expression evaluation engine from `@formality-ui/core`
- Maintains consistency with the `evaluateDescriptor()` pattern

### Problems Solved
- **Current Issue**: `formDefaultFieldProps` parameter exists but is not evaluated
- **After This Subtask**: Form-level props are evaluated and ready for merging

---

## What

Implement evaluation logic for `formDefaultFieldProps` in the `usePropsEvaluation` hook:

1. **If `formDefaultFieldProps` is a function**: Call it with `formState` and `methods`
2. **If `formDefaultFieldProps` is a descriptor** (string/object/array): Evaluate using `evaluateDescriptor()` with context
3. **Return the evaluated result** (merging with other layers happens in P1.M1.T2.S2)

### Success Criteria

- [ ] `formDefaultFieldProps` is evaluated when provided (non-undefined)
- [ ] Function callbacks are called with `(formState, methods)` signature
- [ ] Expression strings are evaluated using `evaluateDescriptor()`
- [ ] Context is built using `buildFieldContext(formState, fieldName)`
- [ ] Evaluated result is cast to `Record<string, unknown>`
- [ ] `evaluate()` is mocked in unit tests (if added)
- [ ] Backward compatibility maintained (undefined parameters handled gracefully)

---

## All Needed Context

### Context Completeness Check

*"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"*

**YES** - This PRP provides:
- Exact implementation location and current code state
- Complete reference implementation (selectProps evaluation)
- Expression evaluation engine details with function signatures
- Context building patterns with exact parameters
- Test patterns for mocking evaluate()
- All file paths and line numbers

### Documentation & References

```yaml
# MUST READ - Primary Implementation File
- file: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  why: This is the ONLY file to modify for this subtask. Lines 137-155 contain the selectProps evaluation pattern to follow.
  pattern: The existing selectProps evaluation logic (lines 137-155) is the exact pattern to replicate for formDefaultFieldProps
  gotcha: Do NOT evaluate providerDefaultFieldProps yet - that's P1.M1.T1.S3
  section: Lines 137-155 show the complete selectProps evaluation pattern

# EXPRESSION EVALUATION ENGINE
- file: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  why: Contains evaluate() and evaluateDescriptor() functions needed for expression evaluation
  section: Lines 274-304 define evaluateDescriptor() which handles string/function/object/array recursively
  critical: evaluateDescriptor() returns unknown - must cast to Record<string, unknown>
  pattern: typeof === "string" → evaluate(), typeof === "function" → return as-is, object/array → recursive evaluation

# CONTEXT BUILDING
- file: /home/dustin/projects/formality/packages/core/src/expression/context.ts
  why: Contains buildFieldContext() function for building evaluation context
  section: Lines 104-116 define buildFieldContext(formState, fieldName, additionalProps?)
  signature: buildFieldContext(formState: FormState, fieldName: string): Record<string, unknown>
  gotcha: The third parameter (additionalProps) is optional - we only need formState and fieldName

# TYPE DEFINITIONS
- file: /home/dustin/projects/formality/packages/core/src/types/config.ts
  why: Contains SelectValue type definition
  section: Lines 18-22 define SelectValue as: string | SelectFunction | { [key: string]: SelectValue } | SelectValue[]
  critical: SelectFunction is defined as: (formState: FormState, methods: unknown) => TReturn

# CURRENT IMPLEMENTATION REFERENCE
- file: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  why: Lines 137-155 show the EXACT pattern to follow for formDefaultFieldProps evaluation
  pattern: Check if undefined → Check typeof === "function" → evaluateDescriptor for strings/objects → cast and return
  gotcha: The context is already built on line 149 - reuse it for formDefaultFieldProps evaluation

# FORM STATE TYPE
- file: /home/dustin/projects/formality/packages/core/src/types/state.ts
  why: Defines FormState type that's passed to function callbacks
  section: Lines 1-35 define FormState interface
  critical: FormState includes: fields, record, errors, defaultValues, touchedFields, dirtyFields, and various boolean flags

# EVALUATION PATTERN REFERENCE
- file: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  why: Shows how evaluateDescriptor() handles different SelectValue types
  section: Lines 277-304 show the type narrowing pattern: string → evaluate(), function → return, object/array → recurse
  pattern: Always check typeof first, then handle each type appropriately

# TEST PATTERNS FOR MOCKING
- file: /home/dustin/projects/formality/packages/react/src/__tests__/render-isolation.test.tsx
  why: Shows vi.fn() mocking pattern used in this codebase
  pattern: vi.fn().mockReturnValue() for simple mocks, factory functions for dynamic behavior
  gotcha: Use vi.clearAllMocks() in beforeEach if needed

# PREVIOUS SUBTASK PRP
- file: /home/dustin/projects/formality/plan/bugfix/P1M1T1S1/PRP.md
  why: Shows how the parameter was added in P1.M1.T1.S1
  note: Parameter signature is already in place - this subtask adds the evaluation logic

# ARCHITECTURE CONTEXT
- file: /home/dustin/projects/formality/plan/bugfix/architecture/codebase_analysis.md
  why: Explains Bug #1 and the 8-layer priority system
  section: Lines 100-137 detail Bug #1: selectDefaultFieldProps Not Evaluated
  critical: Understanding which layer (4 = formSelectDefaultFieldProps) we're implementing
```

### Current Codebase tree

```bash
packages/
├── core/
│   └── src/
│       ├── types/
│       │   ├── config.ts                    # SelectValue type definition
│       │   └── state.ts                     # FormState type definition
│       └── expression/
│           ├── evaluate.ts                  # evaluate() and evaluateDescriptor()
│           └── context.ts                   # buildFieldContext()
└── react/
    └── src/
        ├── hooks/
        │   └── usePropsEvaluation.ts        # MODIFY: Add formDefaultFieldProps evaluation
        └── __tests__/
            ├── Field.test.tsx               # Integration test patterns
            └── render-isolation.test.tsx    # Mocking patterns (vi.fn)
```

### Desired Codebase tree with files to be added

```bash
# No new files - only modification of existing file
packages/react/src/hooks/usePropsEvaluation.ts  # MODIFY: Add formDefaultFieldProps evaluation logic
```

### Current Implementation (for reference)

```typescript
// File: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
// Lines 137-155: Current selectProps evaluation (THE PATTERN TO FOLLOW)

return useMemo(() => {
  if (!selectProps) {
    return {};
  }

  // Handle function selectProps
  if (typeof selectProps === "function") {
    const result = selectProps(formState, methods);
    return (result as Record<string, unknown>) ?? {};
  }

  // Build evaluation context
  const context = buildFieldContext(formState, fieldName);

  // Evaluate descriptor (string expression, object with expressions, or array)
  const result = evaluateDescriptor(selectProps, context);

  return (result as Record<string, unknown>) ?? {};
}, [selectProps, formState, methods, fieldName]);
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: evaluateDescriptor() is already imported from @formality-ui/core
// No additional imports needed for this subtask

// CRITICAL: The context variable is already built on line 149 for selectProps
// Reuse this exact same context for formDefaultFieldProps evaluation
const context = buildFieldContext(formState, fieldName);

// CRITICAL: SelectValue can be 4 types - must check typeof before handling
// 1. string → evaluate expression
// 2. function → call with (formState, methods)
// 3. object → recursive evaluation
// 4. array → recursive evaluation

// CRITICAL: evaluateDescriptor() handles types 2, 3, 4 internally
// Only need to check: if undefined → skip, if function → call, else → evaluateDescriptor

// CRITICAL: Functions in SelectValue receive (formState, methods) parameters
// FormState is defined in @formality-ui/core/types/state.ts
// methods is from useFormContext() - it's the Controller methods from react-hook-form

// CRITICAL: evaluateDescriptor() returns unknown - MUST cast to Record<string, unknown>
// Pattern: (result as Record<string, unknown>) ?? {}

// CRITICAL: Context building uses buildFieldContext(formState, fieldName)
// Do NOT use buildFormContext() - that's for different use cases

// CRITICAL: The useMemo dependencies must include formDefaultFieldProps
// Current deps: [selectProps, formState, methods, fieldName]
// New deps: [selectProps, formDefaultFieldProps, formState, methods, fieldName]

// GOTCHA: providerDefaultFieldProps should NOT be evaluated in this subtask
// That's P1.M1.T1.S3 - only evaluate formDefaultFieldProps here

// GOTCHA: Don't merge the evaluated props yet - that's P1.M1.T2.S2
// For now, we're evaluating and returning. Merging with selectProps happens later.

// GOTCHA: The return value for this subtask is NOT the final merged result
// In this subtask, we're adding evaluation logic. The return structure will be updated in P1.M1.T2.S2.

// GOTCHA: Mocking evaluate() for tests requires specific pattern
// Use vi.mock() with module path, not individual function mocking
// See test patterns in /home/dustin/projects/formality/packages/react/src/__tests__/render-isolation.test.tsx

// GOTCHA: clearExpressionCache() should be called in test beforeEach
// This prevents cached ASTs from interfering between tests
```

---

## Implementation Blueprint

### Data models and structure

No new data models. Using existing types from `@formality-ui/core`:

```typescript
// From @formality-ui/core/types/config.ts (already imported)
export type SelectValue<TReturn = unknown> =
  | string                    // Expression: "client.id"
  | SelectFunction<TReturn>   // Function callback
  | { [key: string]: SelectValue }  // Nested object
  | SelectValue[];            // Array of values

// From @formality-ui/core/types/state.ts (for context)
export interface FormState {
  fields: Record<string, FieldState>;
  record: Record<string, unknown>;
  errors: Record<string, unknown>;
  defaultValues: Record<string, unknown>;
  touchedFields: Record<string, boolean>;
  dirtyFields: Record<string, boolean>;
  isDirty: boolean;
  isTouched: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY useMemo return logic in usePropsEvaluation
  - ADD: Check for formDefaultFieldProps existence before selectProps check
  - ADD: Evaluate formDefaultFieldProps if present (following selectProps pattern)
  - PRESERVE: Existing selectProps evaluation logic
  - DEPS: None - parameters already added in P1.M1.T1.S1
  - FILE: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  - LINES: Modify lines 137-155 (the useMemo return)
  - PATTERN: Follow the exact selectProps evaluation pattern

Task 2: UPDATE useMemo dependencies array
  - ADD: formDefaultFieldProps to dependency array
  - PRESERVE: Existing dependencies (selectProps, formState, methods, fieldName)
  - PLACEMENT: Line 155 (dependency array of useMemo)
  - PATTERN: [selectProps, formDefaultFieldProps, formState, methods, fieldName]

Task 3: (OPTIONAL) Add unit tests for formDefaultFieldProps evaluation
  - CREATE: Test file or add to existing test
  - MOCK: evaluate() function using vi.fn()
  - TEST: Function callback receives correct parameters
  - TEST: Expression strings are evaluated correctly
  - TEST: Undefined returns empty object
  - PATTERN: Follow vi.fn() pattern from render-isolation.test.tsx
  - NOTE: Tests are added in P1.M1.T3 - this is optional for this subtask

Task 4: VALIDATE TypeScript compilation
  - RUN: pnpm -F @formality-ui/react run tsc --noEmit
  - EXPECT: Zero type errors
  - IF ERRORS: Check cast to Record<string, unknown> and function signature
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Function callback evaluation (from selectProps, lines 143-146)
if (typeof formDefaultFieldProps === "function") {
  const result = formDefaultFieldProps(formState, methods);
  return (result as Record<string, unknown>) ?? {};
}

// PATTERN: Expression/Descriptor evaluation (from selectProps, lines 148-154)
// Reuse the context that's already built for selectProps
const context = buildFieldContext(formState, fieldName);
const result = evaluateDescriptor(formDefaultFieldProps, context);
return (result as Record<string, unknown>) ?? {};

// PATTERN: Complete formDefaultFieldProps evaluation block
// Add this BEFORE the selectProps check (or restructure - see Integration Points)
if (!formDefaultFieldProps) {
  // Skip evaluation if not provided
} else if (typeof formDefaultFieldProps === "function") {
  const result = formDefaultFieldProps(formState, methods);
  return (result as Record<string, unknown>) ?? {};
} else {
  const context = buildFieldContext(formState, fieldName);
  const result = evaluateDescriptor(formDefaultFieldProps, context);
  return (result as Record<string, unknown>) ?? {};
}

// GOTCHA: The return structure will change in P1.M1.T2.S2
// For now, we can either:
// Option A: Return formDefaultFieldProps if selectProps is undefined
// Option B: Return empty object and handle merge in P1.M1.T2.S2
// RECOMMENDED: Option B - defer merge logic to P1.M1.T2.S2

// REVISED PATTERN: Return structure for this subtask
return useMemo(() => {
  // Evaluate formDefaultFieldProps if provided
  if (formDefaultFieldProps) {
    if (typeof formDefaultFieldProps === "function") {
      const result = formDefaultFieldProps(formState, methods);
      // For now, store this - merge happens in P1.M1.T2.S2
      return (result as Record<string, unknown>) ?? {};
    }
    const context = buildFieldContext(formState, fieldName);
    const result = evaluateDescriptor(formDefaultFieldProps, context);
    return (result as Record<string, unknown>) ?? {};
  }

  // Evaluate selectProps if provided (existing logic)
  if (!selectProps) {
    return {};
  }

  if (typeof selectProps === "function") {
    const result = selectProps(formState, methods);
    return (result as Record<string, unknown>) ?? {};
  }

  const context = buildFieldContext(formState, fieldName);
  const result = evaluateDescriptor(selectProps, context);
  return (result as Record<string, unknown>) ?? {};
}, [selectProps, formDefaultFieldProps, formState, methods, fieldName]);
```

### Integration Points

```yaml
DEPENDENCIES (already satisfied):
  - P1.M1.T1.S1: formDefaultFieldProps parameter added to interface
  - @formality-ui/core: evaluateDescriptor() function exists
  - @formality-ui/core: buildFieldContext() function exists

NO EXTERNAL INTEGRATION NEEDED:
  - No config changes required
  - No component changes required (those are P1.M1.T2)
  - No test file changes required (those are P1.M1.T3)

FUTURE INTEGRATION (subsequent subtasks):
  - P1.M1.T1.S3: Will evaluate providerDefaultFieldProps
  - P1.M1.T2.S2: Will merge formDefaultFieldProps with other layers
  - P1.M1.T3.S2: Will add tests for form-level evaluation
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check the modified file
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors
# Common errors to watch for:
# - "Type 'unknown' is not assignable to type 'Record<string, unknown>'" → Fix: Add cast (result as Record<string, unknown>)
# - "Property 'formDefaultFieldProps' does not exist" → Fix: Ensure P1.M1.T1.S1 is complete
# - "Expected 2 arguments, but got 1" → Fix: Ensure function callback receives (formState, methods)

# Lint check
pnpm -F @formality-ui/react run lint

# Expected: No linting errors
# Watch for: unused variables (formDefaultFieldProps should be used)
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run existing tests to verify backward compatibility
pnpm -F @formality-ui/react test -- src/__tests__/Field.test.tsx

# Expected: All existing tests pass
# Reason: Undefined formDefaultFieldProps should work same as before

# Run all React package tests
pnpm -F @formality-ui/react test

# Expected: All tests pass
# Note: Tests for new functionality will be added in P1.M1.T3.S2
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the package to verify no compilation errors
pnpm -F @formality-ui/react build

# Expected: Successful build with no TypeScript errors

# Verify the implementation compiles correctly
ls -la packages/react/dist/hooks/usePropsEvaluation.js
ls -la packages/react/dist/hooks/usePropsEvaluation.d.ts
```

### Level 4: Manual Verification

```bash
# Create a test file to verify the evaluation logic works
cat > /tmp/test-form-evaluation.tsx << 'EOF'
import { renderHook } from '@testing-library/react';
import { usePropsEvaluation } from '@formality-ui/react';

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useWatch: () => ({}),
  useFormContext: () => ({
    record: {},
    methods: { control: {} },
  }),
}));

// Test 1: Function callback evaluation
const { result } = renderHook(() =>
  usePropsEvaluation({
    formDefaultFieldProps: (formState, methods) => ({
      disabled: !formState.fields.client?.value,
    }),
    fieldName: 'testField',
  })
);
console.log('Function callback result:', result.current);

// Test 2: Expression string evaluation
const { result: result2 } = renderHook(() =>
  usePropsEvaluation({
    formDefaultFieldProps: { disabled: '!client' },
    fieldName: 'testField',
  })
);
console.log('Expression string result:', result2.current);

// Test 3: Undefined parameter (backward compatibility)
const { result: result3 } = renderHook(() =>
  usePropsEvaluation({
    selectProps: { placeholder: 'test' },
    fieldName: 'testField',
  })
);
console.log('Undefined parameter result:', result3.current);
EOF

# Type check the test file
pnpm -F @formality-ui/react exec tsc --noEmit /tmp/test-form-evaluation.tsx

# Expected: No type errors
# If errors: Fix function signature or cast operations
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compiles without errors: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] Package builds successfully: `pnpm -F @formality-ui/react build`
- [ ] Existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] No linting errors: `pnpm -F @formality-ui/react run lint`
- [ ] `formDefaultFieldProps` added to useMemo dependencies

### Feature Validation

- [ ] Function callbacks are called with `(formState, methods)` parameters
- [ ] Expression strings are evaluated using `evaluateDescriptor()`
- [ ] Context is built using `buildFieldContext(formState, fieldName)`
- [ ] Evaluated result is cast to `Record<string, unknown>`
- [ ] Undefined `formDefaultFieldProps` returns empty object
- [ ] Backward compatibility maintained (existing tests pass)

### Code Quality Validation

- [ ] Follows existing `selectProps` evaluation pattern exactly
- [ ] Context is reused (not rebuilt) for efficiency
- [ ] Type narrowing uses `typeof` checks
- [ ] `evaluate()` is properly mocked in tests (if tests added)
- [ ] No side effects or React hook rule violations
- [ ] File unchanged except for the specific modifications

### Dependencies & Handoff

- [ ] P1.M1.T1.S1 is complete (parameter added to interface)
- [ ] Ready for P1.M1.T1.S3 (implement provider-level evaluation)
- [ ] Ready for P1.M1.T2.S2 (merge evaluated props)
- [ ] Ready for P1.M1.T3.S2 (add tests for form-level evaluation)

---

## Anti-Patterns to Avoid

- **Do NOT evaluate `providerDefaultFieldProps`** - that's P1.M1.T1.S3
- **Do NOT implement merge logic** - that's P1.M1.T2.S2
- **Do NOT modify Field.tsx** - that's P1.M1.T2.S1
- **Do NOT use `eval()`** - always use `evaluateDescriptor()` from @formality-ui/core
- **Do NOT rebuild context** - reuse the `context` variable built for selectProps
- **Do NOT skip the cast** - `evaluateDescriptor()` returns `unknown`, must cast to `Record<string, unknown>`
- **Do NOT add tests** - tests are added in P1.M1.T3.S2 (optional unit tests here are fine)
- **Do NOT change the return structure** - merge logic comes later
- **Do NOT forget to update dependencies** - add `formDefaultFieldProps` to useMemo deps
- **Do NOT use `buildFormContext()`** - use `buildFieldContext(formState, fieldName)`

---

## Related Work Items

### Prerequisites
- **P1.M1.T1.S1**: Add new parameters to hook signature (MUST be complete)

### This Task Enables
- **P1.M1.T1.S3**: Implement provider-level evaluation (will follow same pattern)
- **P1.M1.T2.S2**: Pass to mergeFieldProps (needs evaluated form-level props)
- **P1.M1.T3.S2**: Test form-level evaluation (will verify this implementation)

### Blocked By
- **P1.M1.T1.S1** - Parameter signature must be in place first

---

## Research Findings Summary

### Expression Evaluation System Research

**File**: `/home/dustin/projects/formality/packages/core/src/expression/evaluate.ts`

**Key Functions**:
```typescript
// Main evaluation function
export function evaluate(expr: string, context: EvaluationContext): unknown

// Recursive descriptor evaluator (use this one)
export function evaluateDescriptor(
  descriptor: unknown,
  context: EvaluationContext,
): unknown
```

**Evaluation Context** (from `/home/dustin/projects/formality/packages/core/src/expression/context.ts`):
```typescript
export function buildFieldContext(
  formState: FormState,
  fieldName: string,
  additionalProps?: Record<string, unknown>,
): Record<string, unknown>
```

**Supported Expression Patterns**:
- Identifiers: `client`, `signed`
- Member expressions: `client.id`, `client.name`
- Binary expressions: `a + b`, `a > 10`
- Logical expressions: `a && b`, `a || b`
- Conditional expressions: `signed ? 'Yes' : 'No'`
- Array expressions: `[a, b, 3]`

**Security Features**:
- AST-based parsing (no `eval()`)
- No function calls allowed
- Safe property access with null checks
- Graceful error handling (returns `undefined` on errors in production)

### Test Patterns for Mocking

**Framework**: Vitest with `vi.fn()`

**Mock Pattern** (from `render-isolation.test.tsx`):
```typescript
const validators = {
  fieldA: vi.fn().mockReturnValue(true),
  formatToLower: vi.fn((value: string) =>
    typeof value === "string" ? value.toLowerCase() : value,
  ),
};

// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

**For Mocking `evaluate()`**:
```typescript
import { vi } from 'vitest';
import * as expressionModule from '@formality-ui/core/expression';

vi.mock('@formality-ui/core/expression', () => ({
  evaluate: vi.fn(),
  evaluateDescriptor: vi.fn(),
}));

// In tests
evaluate.mockReturnValue('mocked value');
expect(evaluate).toHaveBeenCalledWith('client.id', expect.any(Object));
```

---

## Confidence Score

**9/10** for one-pass implementation success

**Rationale**:
- ✅ Clear, single-file scope (only usePropsEvaluation.ts)
- ✅ Exact pattern to follow exists (selectProps evaluation)
- ✅ All dependencies are in place (P1.M1.T1.S1 complete)
- ✅ Expression evaluation engine is well-documented
- ✅ Test patterns are established in codebase
- ⚠️ Minor risk: Return structure will change in P1.M1.T2.S2
- ⚠️ Must remember to update useMemo dependencies

**Confidence would be 10/10 if**:
- Return structure was final (but merge logic is intentionally separate)
- Provider-level was also included (but that's a separate subtask)
