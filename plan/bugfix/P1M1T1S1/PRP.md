# PRP: Update Field.test.tsx Test Components with forwardRef

**Work Item**: P1.M1.T1.S1
**Title**: Update Field.test.tsx test components
**Status**: DOCUMENTED COMPLETED (Implemented in commit 35cd0be)
**Points**: 1

---

## Goal

**Feature Goal**: Eliminate React warnings caused by test components not accepting refs passed by React Hook Form's Controller component.

**Deliverable**: Updated test components (`TestInput` and `TestSwitch`) in `packages/react/src/__tests__/Field.test.tsx` that properly forward refs using `React.forwardRef`.

**Success Definition**:
- All tests pass without React ref warnings
- Test components accept and forward refs to underlying DOM elements
- Components follow the established forwardRef pattern used in sibling test files
- displayName is set for proper debugging in React DevTools

---

## User Persona

**Target User**: Developer running the test suite

**Use Case**: Running the Field component test suite should produce clean output without React warnings about function components receiving refs.

**User Journey**:
1. Developer runs `pnpm test` or `pnpm test packages/react/src/__tests__/Field.test.tsx`
2. All Field tests execute successfully
3. Console output shows zero React warnings
4. Test coverage remains at 100%

**Pain Points Addressed**:
- Confusing console warnings during test execution
- Unclear whether warnings indicate actual problems
- Developer time spent investigating spurious warnings

---

## Why

- **Test Reliability**: React warnings obscure actual test failures and make test output noisy
- **RHF Integration**: React Hook Form's Controller passes refs to all wrapped components for DOM manipulation and validation tracking
- **Developer Experience**: Clean test output builds confidence in code quality
- **Consistency**: Aligns with forwardRef pattern already used in 6 other test files (Form.test.tsx, FieldGroup.test.tsx, UnusedFields.test.tsx, autosave-validation.test.tsx, render-isolation.test.tsx, FormalityProvider.test.tsx)

---

## What

Update `TestInput` and `TestSwitch` test components in `packages/react/src/__tests__/Field.test.tsx` to use `React.forwardRef` with proper TypeScript generics.

### Success Criteria

- [x] `TestInput` wrapped with `forwardRef<HTMLInputElement, TestInputProps>`
- [x] `TestSwitch` wrapped with `forwardRef<HTMLInputElement, TestSwitchProps>`
- [x] Ref forwarded to underlying `<input>` element
- [x] displayName set for debugging
- [x] All tests pass: `pnpm test packages/react/src/__tests__/Field.test.tsx`
- [x] No React warnings in console output

---

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: Yes - this PRP provides the exact pattern to follow, file locations, validation commands, and external documentation references.

### Documentation & References

```yaml
# MUST READ - Internal Codebase Patterns

- file: packages/react/src/__tests__/Field.test.tsx
  why: The target file to update; already has forwardRef implemented (commit 35cd0be)
  pattern: Lines 22-39 (TestInput), lines 50-64 (TestSwitch)
  gotcha: This fix was already applied; use this file as the reference pattern

- file: packages/react/src/__tests__/Form.test.tsx
  why: Reference implementation for forwardRef test components
  pattern: Lines 20-33 (TestInput), lines 44-58 (TestSwitch)
  gotcha: Uses minimal pattern without wrapper div

- file: packages/react/src/__tests__/render-isolation.test.tsx
  why: Enhanced pattern with label and error display
  pattern: Lines 43-63 (TestInput), lines 65-79 (TestSwitch)
  gotcha: Shows wrapper div pattern for label/error elements

- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: Validates auto-save functionality with forwardRef components
  pattern: Lines 34-45 (TestInput), lines 54-66 (TestSwitch)
  gotcha: Includes onBlur prop for blur event handling

- file: packages/react/src/__tests__/UnusedFields.test.tsx
  why: Demonstrates forwardRef with tracking input
  pattern: Lines 19-31 (TrackingInput with render count)
  gotcha: Shows useRef usage within forwardRef component

- file: packages/react/src/__tests__/FieldGroup.test.tsx
  why: FieldGroup-specific test pattern with forwardRef
  pattern: Lines 24-37 (TestInput), lines 48-61 (TestSwitch)
  gotcha: Follows same structure as Field.test.tsx

- file: packages/react/src/__tests__/FormalityProvider.test.tsx
  why: Minimal forwardRef pattern
  pattern: Lines 28-32 (Simple TestInput)
  gotcha: Shows minimal viable implementation

# MUST READ - External Documentation

- url: https://react.dev/reference/react/forwardRef
  why: Official React documentation on forwardRef API
  critical: Always set displayName on forwardRef components for debugging

- url: https://react.dev/learn/manipulating-the-dom-with-refs
  why: Deep dive on refs and forwarding through multiple components
  critical: Understanding why Controller needs ref access

- url: https://react.dev/learn/referencing-values-with-refs
  why: Comprehensive guide on ref usage patterns
  section: "Forwarding refs" section specifically

- url: https://react-hook-form.com/docs/usecontroller/controller
  why: Controller documentation explaining why it passes refs
  critical: Controller's render prop provides field.ref that must be forwarded

- url: https://www.typescriptlang.org/docs/handbook/2/generics.html
  why: TypeScript generics for forwardRef type parameters
  section: Generic Classes and Components
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/packages/react/src/__tests__/
├── autosave-validation.test.tsx     # forwardRef implemented
├── FieldGroup.test.tsx              # forwardRef implemented
├── Field.test.tsx                   # forwardRef implemented (THIS FILE)
├── FormalityProvider.test.tsx       # forwardRef implemented
├── Form.test.tsx                    # forwardRef implemented
├── integration/
│   └── complete-form.test.tsx       # NEEDS forwardRef (P1.M1.T1.S8)
├── makeProxyState.test.ts           # (no forwardRef needed)
├── render-isolation.test.tsx        # forwardRef implemented
├── sample.test.tsx                  # (no forwardRef needed)
├── setup.ts                         # Test setup file
└── UnusedFields.test.tsx            # forwardRef implemented
```

### Desired Codebase Tree (No Changes - Already Complete)

```bash
# File: packages/react/src/__tests__/Field.test.tsx
# Status: forwardRef already implemented
#
# TestInput component (lines 22-39):
#   - Wrapped with forwardRef<HTMLInputElement, TestInputProps>
#   - Ref forwarded to <input> element
#   - displayName = "TestInput"
#
# TestSwitch component (lines 50-64):
#   - Wrapped with forwardRef<HTMLInputElement, TestSwitchProps>
#   - Ref forwarded to <input type="checkbox"> element
#   - displayName = "TestSwitch"
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: React Hook Form Controller ALWAYS passes field.ref
// Files: packages/react/src/components/Field.tsx (lines 380-435)
// The Controller component from react-hook-form passes field.ref in finalProps
// Any component receiving these props MUST accept and forward the ref

// CRITICAL: displayName MUST be set for React DevTools
// Without displayName, components appear as "ForwardRef" in DevTools
// Pattern: ComponentName.displayName = "ComponentName";

// GOTCHA: TypeScript generics order matters
// CORRECT: forwardRef<HTMLInputElement, TestInputProps>
// WRONG: forwardRef<TestInputProps, HTMLInputElement>

// GOTCHA: Ref must be forwarded to the actual DOM element
// CORRECT: <input ref={ref} />
// WRONG: <div><input /></div>  // ref goes to wrapper, not input

// GOTCHA: Use checked for checkboxes, value for text inputs
// Checkbox: checked={value ?? false}
// Text: value={value ?? ""}

// GOTCHA: Index signature allows additional props
// [key: string]: unknown  // Enables data-testid, aria-*, etc.

// GOTCHA: Optional chaining for callbacks
// onChange?.(e.target.value)  // Handles undefined onChange

// PATTERN: Null coalescing for defaults
// value={value ?? ""}  // Better than value || "" (handles 0, false)

// PATTERN: Spread props at the end
// {...props}  // Allows overriding earlier props if needed
```

---

## Implementation Blueprint

### Data Models and Structure

The test components use simple TypeScript interfaces for props:

```typescript
// TestInputProps - text input component properties
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;  // REQUIRED
  [key: string]: unknown;  // Additional props (data-testid, aria-*, etc.)
}

// TestSwitchProps - checkbox/switch component properties
interface TestSwitchProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;  // REQUIRED
  [key: string]: unknown;  // Additional props
}
```

### Implementation Tasks

```yaml
# NOTE: This implementation was completed in commit 35cd0be
# The following tasks document what was done

Task 1: ADD forwardRef import to Field.test.tsx
  - ADD: import React, { forwardRef } from "react";
  - LOCATION: Line 2
  - PATTERN: Destructured import from "react"

Task 2: UPDATE TestInput component with forwardRef
  - CREATE: TestInputProps interface (lines 12-20)
  - WRAP: Component with forwardRef<HTMLInputElement, TestInputProps>
  - ADD: ref parameter to render function signature
  - FORWARD: ref to <input> element with ref={ref}
  - SET: TestInput.displayName = "TestInput"
  - LOCATION: Lines 12-39
  - PATTERN: Follow packages/react/src/__tests__/Form.test.tsx

Task 3: UPDATE TestSwitch component with forwardRef
  - CREATE: TestSwitchProps interface (lines 42-48)
  - WRAP: Component with forwardRef<HTMLInputElement, TestSwitchProps>
  - ADD: ref parameter to render function signature
  - FORWARD: ref to <input type="checkbox"> element with ref={ref}
  - SET: TestSwitch.displayName = "TestSwitch"
  - LOCATION: Lines 42-64
  - PATTERN: Follow packages/react/src/__tests__/Form.test.tsx

Task 4: VERIFY tests pass
  - RUN: pnpm test packages/react/src/__tests__/Field.test.tsx
  - EXPECT: All 23 tests pass, zero warnings
  - VALIDATE: No React warnings in console output
```

### Implementation Patterns & Key Details

```typescript
// TestInput Component Pattern (lines 22-39)

interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}  // PATTERN: Forward ref to input element
        data-testid={name}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        {...props}
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);

TestInput.displayName = "TestInput";  // CRITICAL: Set for DevTools

// TestSwitch Component Pattern (lines 50-64)

interface TestSwitchProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => (
    <input
      ref={ref}  // PATTERN: Forward ref to checkbox element
      type="checkbox"
      data-testid={name}
      checked={value ?? false}  // GOTCHA: Use checked, not value
      onChange={(e) => onChange?.(e.target.checked)}  // GOTCHA: Pass boolean
      disabled={disabled}
      {...props}
    />
  ),
);

TestSwitch.displayName = "TestSwitch";  // CRITICAL: Set for DevTools
```

### Integration Points

```yaml
TEST_FRAMEWORK:
  - runner: vitest v2.1.9
  - config: packages/react/vitest.config.ts
  - environment: jsdom

TEST_UTILS:
  - library: @testing-library/react
  - setup: packages/react/src/__tests__/setup.ts

TYPE_CHECKING:
  - command: pnpm typecheck
  - verifies: TypeScript compilation

LINTING:
  - command: pnpm lint
  - tool: ESLint

BUILD:
  - command: pnpm build
  - verifies: All packages compile successfully
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check the modified file
pnpm typecheck

# Expected output:
# > formality@0.1.0 typecheck
# > tsc -p tsconfig.json --noEmit
# (no errors)

# Lint the file
pnpm lint -- packages/react/src/__tests__/Field.test.tsx

# Expected output: No ESLint errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run Field.test.tsx specifically
pnpm test packages/react/src/__tests__/Field.test.tsx

# Expected output:
# RUN  v2.1.9 /home/dustin/projects/formality
#
# ✓ |@formality-ui/react| src/__tests__/Field.test.tsx (23 tests) ~1000ms
#
# Test Files  1 passed (1)
#      Tests  23 passed (23)
#   Start at  01:02:40
#   Duration  ~3s

# Run with watch mode for development
pnpm test:watch packages/react/src/__tests__/Field.test.tsx

# Run with coverage
pnpm test:coverage packages/react/src/__tests__/Field.test.tsx
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all react package tests
pnpm test packages/react/

# Expected: All tests pass, no warnings

# Run full test suite
pnpm test

# Expected output summary:
# Test Files  18 passed (18)
#      Tests  329 passed (329)
#    Start at  HH:MM:SS
#   Duration  ~3s

# Verify no React warnings in console
# The console should be clean, no warnings like:
# "Warning: Function components cannot be given refs..."
```

### Level 4: Manual Verification

```bash
# Check that ref forwarding works correctly
# Add a temporary test to verify ref is passed:

# In Field.test.tsx, add:
it("should forward ref to input element", () => {
  const ref = { current: null };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form config={{ name: { type: "textField" } }}>
        <TestInput ref={ref} name="test-input" />
      </Form>
    </FormalityProvider>,
  );

  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.nodeName).toBe("INPUT");
});

# Run test: pnpm test packages/react/src/__tests__/Field.test.tsx
# Expected: Test passes, ref.current points to the input element
```

---

## Final Validation Checklist

### Technical Validation

- [x] All validation levels completed successfully
- [x] All tests pass: `pnpm test packages/react/src/__tests__/Field.test.tsx` (23/23 passed)
- [x] No linting errors: `pnpm lint -- packages/react/src/__tests__/Field.test.tsx`
- [x] No type errors: `pnpm typecheck`
- [x] No formatting issues: `pnpm format`

### Feature Validation

- [x] All success criteria from "What" section met
- [x] Manual testing successful: All Field tests pass
- [x] Error cases handled gracefully with proper error messages
- [x] Integration points work as specified
- [x] React warnings eliminated from test output

### Code Quality Validation

- [x] Follows existing codebase patterns and naming conventions
- [x] displayName set on both components
- [x] Ref forwarded to actual DOM element, not wrapper
- [x] TypeScript generics properly ordered
- [x] Props include index signature for flexibility

### Documentation & Deployment

- [x] Implementation documented in this PRP
- [x] Pattern consistent across all sibling test files (S2-S7)
- [x] Commit message: "fix: Update Field.test.tsx with forwardRef support"

---

## Anti-Patterns to Avoid

- ❌ Don't set displayName to a different name than the component variable
- ❌ Don't wrap the forwardRef in another function component
- ❌ Don't use `any` type for props - define proper interfaces
- ❌ Don't forward ref to a wrapper div instead of the input element
- ❌ Don't forget the index signature `[key: string]: unknown`
- ❌ Don't use `value || ""` instead of `value ?? ""` (different behavior for 0, false)
- ❌ Don't forget optional chaining for callbacks: `onChange?.(value)`
- ❌ Don't swap the generic type parameter order in forwardRef

---

## Implementation Status

**COMPLETED** - This work was implemented in commit `35cd0be` ("fix: Add comprehensive bug fixes and documentation with circular dependency detection")

**Git Diff**: The diff between before and after is shown in the research section, documenting:
- Added `forwardRef` import
- Created `TestInputProps` and `TestSwitchProps` interfaces
- Wrapped both components with `forwardRef<HTMLInputElement, PropsType>`
- Added ref forwarding to input elements
- Set displayName for both components

**Verification**: Run `pnpm test packages/react/src/__tests__/Field.test.tsx` to verify all 23 tests pass without warnings.

---

## References

### Completed Sibling Tasks

The following tasks use the identical forwardRef pattern:
- P1.M1.T1.S2: FieldGroup.test.tsx (Complete)
- P1.M1.T1.S3: Form.test.tsx (Complete)
- P1.M1.T1.S4: FormalityProvider.test.tsx (Complete)
- P1.M1.T1.S5: UnusedFields.test.tsx (Complete)
- P1.M1.T1.S6: autosave-validation.test.tsx (Complete)
- P1.M1.T1.S7: render-isolation.test.tsx (Complete)

### Remaining Work

- P1.M1.T1.S8: complete-form.test.tsx integration test (Planned) - Still needs forwardRef implementation
- P1.M1.T1.S9: Verify all tests pass with no warnings (Planned)
