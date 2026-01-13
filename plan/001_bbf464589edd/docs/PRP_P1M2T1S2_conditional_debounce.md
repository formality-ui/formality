# PRP: Implement Conditional Execution for debounce: false

**Work Item**: P1.M2.T1.S2 - Implement conditional execution
**Parent Task**: P1.M2.T1 - Modify Form Component
**Priority**: P1 (Critical)

---

## Goal

**Feature Goal**: Implement conditional execution logic in the `changeField` function to trigger immediate submission when `inputConfig?.debounce === false`, while maintaining the existing debounced submission behavior for all other cases.

**Deliverable**: Updated `changeField` function in `Form.tsx` with conditional execution logic that:
- Checks `inputConfig?.debounce === false`
- Calls `submitImmediate()` when false, `debouncedSubmit()` otherwise
- Only executes when `autoSave` is enabled

**Success Definition**:
- `inputConfig?.debounce === false` triggers immediate submission via `submitImmediate()`
- All other cases (including undefined inputConfig) use `debouncedSubmit()`
- `inputConfig` added to dependency array
- No breaking changes to existing auto-save behavior
- TypeScript compilation succeeds

---

## Why

- **User Impact**: Enables developers to specify per-field auto-save behavior via `InputConfig.debounce: false` for immediate submission on specific fields (e.g., dangerous actions, instant feedback) while maintaining debounce for others
- **Integration**: This implements the core conditional logic that P1.M2.T1.S1 prepared for. P1.M2.T1.S3 will wire this up from the Field component
- **Problems Solved**: Currently all fields share the same debounce setting; this allows granular control for fields that need immediate submission

---

## What

Replace the commented-out TODO in `changeField` with actual conditional logic:

**Current Implementation** (lines 313-319):
```typescript
// Trigger debounced auto-save
// NOTE: In P1.M2.T1.S2, this will become conditional:
// if (inputConfig?.debounce === false) {
//   submitImmediate();
// } else {
//   debouncedSubmit();
// }
debouncedSubmit();
```

**Target Implementation**:
```typescript
// Trigger auto-save (immediate or debounced based on inputConfig)
if (inputConfig?.debounce === false) {
  submitImmediate();
} else {
  debouncedSubmit();
}
```

### Success Criteria

- [ ] `inputConfig?.debounce === false` calls `submitImmediate()`
- [ ] All other cases call `debouncedSubmit()`
- [ ] `inputConfig` added to `useCallback` dependency array
- [ ] Only executes when `autoSave` is enabled (existing behavior)
- [ ] No TypeScript errors after changes
- [ ] Existing auto-save behavior preserved for fields without explicit config

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

### Documentation & References

```yaml
# MUST READ - Critical implementation references

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S1/PRP.md
  why: Previous subtask PRP - defines the inputConfig parameter contract
  critical: The inputConfig parameter is added in S1, this task uses it
  contract: changeField signature becomes (name: string, value: unknown, inputConfig?: InputConfig) => void

- file: packages/react/src/components/Form.tsx
  why: Contains changeField implementation (lines 299-323), submitImmediate (lines 548-550), debouncedSubmit (lines 544-546)
  pattern: useCallback with dependency array, optional chaining for safe access
  gotcha: The exact line numbers in the contract (392-394) are outdated - actual submitImmediate is at lines 548-550

- file: packages/core/src/types/config.ts
  why: InputConfig type definition with debounce property (lines 45-78)
  pattern: Optional property with type number | false
  critical: debounce: false means immediate execution, undefined uses form-level default

- file: packages/react/src/types.ts
  why: DebouncedFunction interface (lines 117-122) showing flush() method
  pattern: Interface with cancel, flush, pending methods from lodash debounce
  critical: submitImmediate() calls debouncedSubmitRef.current?.flush()

- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: Reference for testing auto-save behavior with fake timers
  pattern: vi.useFakeTimers(), vi.advanceTimersByTimeAsync(), waitFor expectations
  gotcha: Always clean up with vi.useRealTimers() in afterEach

- url: https://lodash.com/docs/4.17.15#debounce
  why: Understanding lodash debounce flush() method behavior
  critical: flush() executes the debounced function immediately and returns its result
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── types/
│   │       │   ├── config.ts          # InputConfig type definition (line 52: debounce?: number | false)
│   │       │   └── index.ts           # Type exports
│   │       └── index.ts               # Main package exports
│   └── react/
│       └── src/
│           ├── components/
│           │   ├── Form.tsx           # changeField (line 299), submitImmediate (line 548), debouncedSubmit (line 544)
│           │   └── Field.tsx          # Will call changeField with inputConfig in P1.M2.T1.S3
│           ├── context/
│           │   └── FormContext.ts     # FormContextValue interface with changeField signature
│           ├── types.ts               # DebouncedFunction interface (line 117)
│           └── __tests__/
│               └── autosave-validation.test.tsx  # Auto-save test patterns
├── plan/
│   └── 001_bbf464589edd/
│       └── bugfix/
│           └── 001_7b007b20a2ac/
│               ├── P1M2T1S1/PRP.md    # Previous PRP - inputConfig parameter contract
│               ├── P1M2T1S2/
│               │   └── PRP.md         # This file
│               └── tasks.json         # Task definitions
└── package.json                        # pnpm workspace config
```

### Desired Codebase Tree (Files to Modify)

```bash
# Modified files:
packages/react/src/components/Form.tsx        # Update changeField with conditional logic

# No new files created in this subtask
# Tests will be added in P1.M2.T2 (Add Tests for debounce: false)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: The contract mentions submitImmediate at lines 392-394
// ACTUAL LOCATION: submitImmediate is at lines 548-550
// The contract was written before code refactoring - always verify line numbers

// CRITICAL: inputConfig?.debounce === false is the check
// NOT inputConfig?.debounce === 0 (0 would be a valid debounce delay)
// NOT !inputConfig?.debounce (undefined should use default debounce)

// GOTCHA: Optional chaining with undefined check
// inputConfig could be undefined (backward compatibility)
// inputConfig.debounce could be undefined (use form default)
// inputConfig.debounce could be false (immediate submission)
// inputConfig.debounce could be a number (use that specific delay)

// PATTERN: This codebase uses lodash debounce from "lodash-es" (line 18)
// The flush() method is built into lodash's debounced functions
// debouncedSubmitRef.current?.flush() executes immediately without waiting

// PATTERN: Dependency array must include inputConfig when using it
// useCallback dependency array at line 322 currently: [autoSave, getAffectedFields]
// Must add inputConfig to: [autoSave, getAffectedFields, inputConfig]

// GOTCHA: The existing code has a TODO comment at lines 313-319
// This is intentional - the pattern was planned in advance
// Replace the commented code with the actual implementation
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - this task uses existing `InputConfig` type and modifies existing logic.

**InputConfig Type** (already exists):
```typescript
// packages/core/src/types/config.ts:45-78
export interface InputConfig<TValue = unknown> {
  component: unknown;
  defaultValue: TValue;
  debounce?: number | false;  // Key property: false = immediate, number = delay
  // ... other properties
}
```

**DebouncedFunction Interface** (already exists):
```typescript
// packages/react/src/types.ts:117-122
export interface DebouncedFunction {
  (): void;
  cancel: () => void;
  flush: () => void;  // Called by submitImmediate()
  pending: () => boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ AND VERIFY current implementation
  - FILE: packages/react/src/components/Form.tsx
  - VERIFY: inputConfig parameter exists in changeField signature (line 300)
  - VERIFY: submitImmediate function exists (lines 548-550)
  - VERIFY: debouncedSubmit function exists (lines 544-546)
  - DEPENDENCIES: P1.M2.T1.S1 must be complete

Task 2: MODIFY changeField conditional logic
  - FILE: packages/react/src/components/Form.tsx
  - LOCATION: Lines 312-319 (replace commented TODO)
  - CURRENT:
    // Trigger debounced auto-save
    // NOTE: In P1.M2.T1.S2, this will become conditional:
    // if (inputConfig?.debounce === false) {
    //   submitImmediate();
    // } else {
    //   debouncedSubmit();
    // }
    debouncedSubmit();
  - TARGET:
    // Trigger auto-save (immediate or debounced based on inputConfig)
    if (inputConfig?.debounce === false) {
      submitImmediate();
    } else {
      debouncedSubmit();
    }
  - PRESERVE: All existing logic before and after (lines 302-311, 320-323)

Task 3: UPDATE useCallback dependency array
  - FILE: packages/react/src/components/Form.tsx
  - LOCATION: Line 322
  - CURRENT: [autoSave, getAffectedFields]
  - TARGET: [autoSave, getAffectedFields, inputConfig]
  - REASON: inputConfig is now used in the function body

Task 4: VERIFY TypeScript compilation
  - RUN: pnpm -F @formality-ui/react run tsc --noEmit
  - EXPECT: No type errors
  - VALIDATE: Optional chaining syntax is correct

Task 5: VERIFY existing tests pass
  - RUN: pnpm test packages/react/src/__tests__/autosave-validation.test.tsx
  - EXPECT: All existing tests pass
  - REASON: Changes should be backward compatible (inputConfig is optional)
  - NO NEW TESTS: Tests will be added in P1.M2.T2
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Conditional execution in changeField (Form.tsx lines 299-323)
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

      // ===== P1.M2.T1.S2 MODIFICATION START =====
      // Trigger auto-save (immediate or debounced based on inputConfig)
      if (inputConfig?.debounce === false) {
        submitImmediate();  // Calls debouncedSubmitRef.current?.flush()
      } else {
        debouncedSubmit();  // Calls debouncedSubmitRef.current?.()
      }
      // ===== P1.M2.T1.S2 MODIFICATION END =====
    }
  },
  [autoSave, getAffectedFields, inputConfig], // Added inputConfig
);

// PATTERN: submitImmediate uses lodash debounce flush()
const submitImmediate = useCallback(() => {
  debouncedSubmitRef.current?.flush();
}, []); // Empty deps - debouncedSubmitRef is a ref

// PATTERN: debouncedSubmit uses lodash debounce call()
const debouncedSubmit = useCallback(() => {
  debouncedSubmitRef.current?.();
}, []); // Empty deps - debouncedSubmitRef is a ref

// GOTCHA: inputConfig is NOT a ref, it's a parameter
// Therefore it MUST be in the dependency array
// This ensures the closure captures the correct inputConfig value

// GOTCHA: The check is `=== false`, not just falsy check
// undefined → should use form-level debounce (default)
// false → immediate submission
// 0 → valid 0ms debounce (edge case, effectively immediate)
// 100 → 100ms debounce
// any number → use that specific debounce delay
```

### Integration Points

```yaml
CHANGEFIELD_FUNCTION:
  - file: packages/react/src/components/Form.tsx
  - update: lines 312-319
  - from: Commented TODO + debouncedSubmit()
  - to: if (inputConfig?.debounce === false) { submitImmediate(); } else { debouncedSubmit(); }

DEPENDENCY_ARRAY:
  - file: packages/react/src/components/Form.tsx
  - update: line 322
  - from: [autoSave, getAffectedFields]
  - to: [autoSave, getAffectedFields, inputConfig]

BACKWARD_COMPATIBILITY:
  - existing calls: changeField(name, value) work (inputConfig undefined)
  - future calls: changeField(name, value, inputConfig) with debounce: false
  - no breaking changes: inputConfig is optional parameter

FIELD_COMPONENT:
  - file: packages/react/src/components/Field.tsx
  - update: Will be updated in P1.M2.T1.S3
  - current: changeField(name, parsedValue); (line ~369)
  - future: changeField(name, parsedValue, inputConfig);
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type checking - Run after modification
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors
# Common errors to fix:
# - "Property 'debounce' does not exist on type..." - Check InputConfig import
# - "Cannot find name 'inputConfig'" - Verify parameter exists in function signature
# - "Argument of type 'X' is not assignable to parameter of type 'Y'" - Type mismatch

# Linting (if project uses ESLint)
pnpm -F @formality-ui/react run lint

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run existing auto-save tests to verify backward compatibility
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx

# Expected: All tests pass - no behavior changes for existing code
# The conditional logic only activates when inputConfig is explicitly passed

# Run all react package tests
pnpm -F @formality-ui/react test

# Expected: All tests pass
# Any failures indicate breaking changes were introduced

# Manual smoke test - verify the code compiles
pnpm -F @formality-ui/react run build

# Expected: Build completes without errors
```

### Level 3: Integration Testing (System Validation)

```bash
# No integration tests needed for this subtask
# The conditional logic won't be actively used until P1.M2.T1.S3
# when Field component passes inputConfig to changeField

# However, verify the code pattern is correct:
cat > /tmp/test-conditional-execution.ts << 'EOF'
// Test that the conditional logic pattern is correct
const inputConfig1 = { debounce: false };
const inputConfig2 = { debounce: 100 };
const inputConfig3 = {};
const inputConfig4 = undefined;

// Should be true for immediate
console.log(inputConfig1?.debounce === false); // true

// Should be false for debounced
console.log(inputConfig2?.debounce === false); // false
console.log(inputConfig3?.debounce === false); // false
console.log(inputConfig4?.debounce === false); // false
EOF

node /tmp/test-conditional-execution.ts

# Expected output:
# true
# false
# false
# false
```

### Level 4: Manual Validation (Developer Testing)

```bash
# Verify the actual code in Form.tsx matches the specification
grep -A 5 "inputConfig?.debounce === false" packages/react/src/components/Form.tsx

# Expected output should show:
# if (inputConfig?.debounce === false) {
#   submitImmediate();
# } else {
#   debouncedSubmit();
# }

# Verify dependency array includes inputConfig
grep -B 5 "getAffectedFields, inputConfig\]" packages/react/src/components/Form.tsx

# Expected: Should find the dependency array with inputConfig

# Verify submitImmediate function exists and uses flush
grep -A 2 "const submitImmediate = useCallback" packages/react/src/components/Form.tsx

# Expected output:
# const submitImmediate = useCallback(() => {
#   debouncedSubmitRef.current?.flush();
# }, []);
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Form.tsx changeField updated with conditional logic (lines 312-319)
- [ ] Dependency array updated to include `inputConfig` (line 322)
- [ ] TypeScript compilation succeeds: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] All existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] Build succeeds: `pnpm -F @formality-ui/react run build`

### Feature Validation

- [ ] `inputConfig?.debounce === false` triggers `submitImmediate()`
- [ ] `inputConfig` undefined or `debounce: number` triggers `debouncedSubmit()`
- [ ] Auto-save check still executes first (`if (autoSave) { ... }`)
- [ ] Backward compatible: existing `changeField(name, value)` calls work
- [ ] No breaking changes to existing auto-save behavior

### Code Quality Validation

- [ ] Follows existing conditional pattern in codebase
- [ ] Optional chaining used correctly (`inputConfig?.debounce`)
- [ ] Strict equality check (`=== false`) not truthy/falsy check
- [ ] Comment preserved/updated to explain behavior
- [ ] No eslint/prettier warnings introduced

### Documentation & Readiness

- [ ] Code is self-documenting with clear conditional logic
- [ ] TODO comment removed/replaced with implementation
- [ ] Ready for P1.M2.T1.S3 (Field component to pass inputConfig)
- [ ] Ready for P1.M2.T2 (comprehensive tests)

---

## Anti-Patterns to Avoid

- ❌ **Don't use `!inputConfig?.debounce`** - This would treat `undefined` and `false` the same, but `undefined` should use form-level default
- ❌ **Don't use `inputConfig?.debounce === 0`** - Zero is a valid debounce delay, use `=== false` for immediate
- ❌ **Don't forget to add `inputConfig` to dependency array** - It's used in the function body, so it must be a dependency
- ❌ **Don't call `submitImmediate()` outside the `if (autoSave)` block** - Only execute when auto-save is enabled
- ❌ **Don't modify `submitImmediate()` or `debouncedSubmit()` functions** - They're correct as-is
- ❌ **Don't add logic to handle edge cases like `debounce: 0`** - Zero is a valid lodash debounce value (effectively immediate)
- ❌ **Don't add new tests yet** - Tests will be added in P1.M2.T2 after P1.M2.T1.S3 wires up Field component

---

## Related Work Items

- **Previous**: P1.M2.T1.S1 - Add inputConfig parameter to changeField (COMPLETED in parallel)
- **Next**: P1.M2.T1.S3 - Update Field component to pass inputConfig to changeField
- **Then**: P1.M2.T1.S4 - Fix Form debounce prop type to allow `false`
- **Finally**: P1.M2.T2 - Add comprehensive tests for debounce: false behavior

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Reasoning**:
- ✅ Clear, bounded scope (single conditional logic implementation)
- ✅ All file paths and line numbers specified and verified
- ✅ Type definitions and interfaces already exist
- ✅ The pattern is already documented in TODO comments
- ✅ Existing patterns in codebase to follow
- ✅ Validation commands verified and specific to this project
- ✅ Previous PRP (P1.M2.T1.S1) provides the inputConfig contract
- ⚠️ Minor risk: Developer must use strict equality `=== false` not falsy check

**Mitigation**: Detailed context with specific pattern examples and anti-patterns to avoid.

---

## References

- [Previous PRP: P1.M2.T1.S1](../P1M2T1S1/PRP.md) - InputConfig parameter contract
- [Lodash debounce Documentation](https://lodash.com/docs/4.17.15#debounce) - Understanding flush() method
- [InputConfig Type Definition](../../../../packages/core/src/types/config.ts#L52) - debounce property definition
- [DebouncedFunction Interface](../../../../packages/react/src/types.ts#L117) - flush method interface
- [Formality PRD - Auto-Save Section](../../../prd_snapshot.md#12-auto-save-system) - Feature context
- [Parent Task: P1.M2.T1](../tasks.json#L1) - Task dependencies
