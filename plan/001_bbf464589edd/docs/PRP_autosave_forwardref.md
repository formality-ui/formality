# Product Requirement Prompt (PRP): Update autosave-validation.test.tsx Test Components with forwardRef

---

## Goal

**Feature Goal**: Update TestInput and TestSwitch components in autosave-validation.test.tsx to use React.forwardRef pattern, eliminating React ref forwarding warnings in test output.

**Deliverable**: Modified `packages/react/src/__tests__/autosave-validation.test.tsx` with TestInput and TestSwitch components wrapped in forwardRef.

**Success Definition**:

- All tests in autosave-validation.test.tsx pass without warnings
- No "Function components cannot be given refs" warnings in test output
- Components follow the established pattern from completed subtasks (S1-S5)

---

## User Persona (if applicable)

**Target User**: Developer maintaining the test suite

**Use Case**: Running the autosave validation test suite without React ref warnings cluttering the output

**User Journey**:

1. Developer runs `pnpm test` or `pnpm test:watch`
2. Tests execute without React ref forwarding warnings
3. Clean test output allows easy identification of real issues

**Pain Points Addressed**:

- React warnings about refs on function components clutter test output
- Warnings indicate potential ref-passing issues when used with React Hook Form's Controller

---

## Why

- **Integration Consistency**: React Hook Form's Controller component passes refs to input components. Without forwardRef, React warns that refs cannot be accessed.
- **Test Suite Hygiene**: Clean test output allows developers to quickly identify real issues vs. benign warnings.
- **Pattern Alignment**: This subtask (S6) must follow the same pattern established in completed subtasks S1-S5 for consistency across the codebase.
- **React Best Practices**: Proper ref forwarding enables component composition and ref-based operations like focus(), select(), etc.

---

## What

Update two test components in `packages/react/src/__tests__/autosave-validation.test.tsx`:

1. **TestInput** (lines 27-34) - Text input wrapper
2. **TestSwitch** (lines 36-44) - Checkbox input wrapper

Each component must be wrapped with `React.forwardRef`, forward the ref to the underlying input element, and set displayName for debugging.

### Success Criteria

- [ ] TestInput component wrapped with forwardRef
- [ ] TestSwitch component wrapped with forwardRef
- [ ] Both components have displayName set
- [ ] Props interfaces defined with `[key: string]: unknown` for spread props
- [ ] All tests pass: `pnpm --filter @formality-ui/react test autosave-validation`
- [ ] No React ref warnings in test output

---

## All Needed Context

### Context Completeness Check

Before writing this PRP, validated: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: Yes. This PRP includes:

- Exact file locations and line numbers
- Complete before/after code patterns
- Links to React documentation
- Established pattern from 4 completed similar tasks
- Project-specific testing commands

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://react.dev/reference/react/forwardRef
  why: Official React forwardRef API reference
  critical: React 19 note: forwardRef is legacy but still required for this React 18 project

- url: https://legacy.reactjs.org/docs/forwarding-refs.html
  why: Detailed explanation of ref forwarding pattern
  critical: Shows why ref must be passed to DOM element, not wrapper

- file: packages/react/src/__tests__/Field.test.tsx
  why: Reference for established TestInput/TestSwitch pattern (completed S1)
  pattern: Lines with TestInput and TestSwitch components using forwardRef
  gotcha: Note the `[key: string]: unknown` in props interface for spread props

- file: packages/react/src/__tests__/FieldGroup.test.tsx
  why: Additional reference for consistent pattern (completed S2)
  pattern: Same forwardRef structure with displayName

- file: packages/react/src/__tests__/Form.test.tsx
  why: Additional reference for consistent pattern (completed S3)
  pattern: Same forwardRef structure

- file: packages/react/src/__tests__/UnusedFields.test.tsx
  why: Additional reference for consistent pattern (completed S5)
  pattern: Same forwardRef structure with TestSwitch

- file: plan/docs/research/react_forwardref_best_practices.md
  why: Project-specific research document with established patterns
  section: "Pattern to Follow" section has the exact template to use

- docfile: plan_bugfix/P1M1T1S6/research/codebase_pattern_analysis.md
  why: Extracted pattern from completed tasks S1-S5
  section: Complete pattern definitions for TestInput and TestSwitch
```

### Current Codebase Tree

```bash
packages/react/src/__tests__/
├── autosave-validation.test.tsx    # TARGET FILE - lines 27-44 need updates
├── Field.test.tsx                  # REFERENCE - completed S1
├── FieldGroup.test.tsx             # REFERENCE - completed S2
├── Form.test.tsx                   # REFERENCE - completed S3
├── FormalityProvider.test.tsx      # REFERENCE - completed S4
├── UnusedFields.test.tsx           # REFERENCE - completed S5
└── setup.ts                        # Test setup file
```

### Desired Codebase Tree

```bash
# No new files - only modifications to existing file:
packages/react/src/__tests__/
└── autosave-validation.test.tsx    # MODIFIED - TestInput and TestSwitch with forwardRef
```

### Known Gotchas of Our Codebase & Library Quirks

```tsx
// CRITICAL: forwardRef import must be alongside React import
// Correct: import React, { forwardRef } from 'react';
// Wrong: import { forwardRef } from 'react'; (separate import)

// CRITICAL: Generic type order matters - Element type FIRST, then Props
// Correct: forwardRef<HTMLInputElement, TestInputProps>
// Wrong: forwardRef<TestInputProps, HTMLInputElement>

// CRITICAL: displayName must be set AFTER component definition
// Correct: const TestInput = forwardRef(...); TestInput.displayName = 'TestInput';
// Wrong: const TestInput = forwardRef(...); (missing displayName)

// CRITICAL: Props interface must include index signature for spread props
// Correct: interface TestInputProps { ..., [key: string]: unknown; }
// Wrong: interface TestInputProps { ... } (missing index signature)

// CRITICAL: Use nullish coalescing (??) not logical OR (||) for defaults
// Correct: value ?? ''
// Wrong: value || '' (fails for zero/false values)

// CRITICAL: Use optional chaining for optional callbacks
// Correct: onChange?.(e.target.value)
// Wrong: onChange(e.target.value) (throws if onChange is undefined)

// CRITICAL: Ref parameter is SECOND parameter in forwardRef
// Correct: ({ value, onChange, ...props }, ref)
// Wrong: ({ value, onChange, ref, ...props }) or ({ value, onChange, ...props }, _ref)

// GOTCHA: TestSwitch uses 'checked' attribute, not 'value'
// TestInput: value={value ?? ''}
// TestSwitch: checked={value ?? false}

// GOTCHA: TestSwitch onChange receives e.target.checked (boolean), not e.target.value (string)
// TestInput: onChange={(e) => onChange?.(e.target.value)}
// TestSwitch: onChange={(e) => onChange?.(e.target.checked)}
```

---

## Implementation Blueprint

### Data Models and Structure

No data models - this is a test component update only.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: UPDATE React import on line 5
  - MODIFY: packages/react/src/__tests__/autosave-validation.test.tsx line 5
  - CHANGE FROM: import React from 'react';
  - CHANGE TO: import React, { forwardRef } from 'react';
  - PRESERVE: All other imports (vitest, testing-library, components)

Task 2: ADD TestInputProps interface before TestInput
  - INSERT: After line 25 (after createAsyncValidator function, before TestInput)
  - IMPLEMENT:
    interface TestInputProps {
      value?: any;
      onChange?: (value: any) => void;
      name: string;
      [key: string]: unknown;
    }

Task 3: ADD TestSwitchProps interface before TestSwitch
  - INSERT: After TestInputProps interface (before TestSwitch)
  - IMPLEMENT:
    interface TestSwitchProps {
      value?: any;
      onChange?: (value: any) => void;
      name: string;
      [key: string]: unknown;
    }

Task 4: REWRITE TestInput component (lines 27-34)
  - REPLACE: Existing TestInput with forwardRef version
  - IMPLEMENT:
    const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
      ({ value, onChange, name, ...props }, ref) => (
        <input
          ref={ref}
          data-testid={name}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />
      )
    );
    TestInput.displayName = 'TestInput';
  - FOLLOW: Pattern from packages/react/src/__tests__/Field.test.tsx
  - PRESERVE: All existing behavior and test compatibility

Task 5: REWRITE TestSwitch component (lines 36-44)
  - REPLACE: Existing TestSwitch with forwardRef version
  - IMPLEMENT:
    const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(
      ({ value, onChange, name, ...props }, ref) => (
        <input
          ref={ref}
          type="checkbox"
          data-testid={name}
          checked={value ?? false}
          onChange={(e) => onChange?.(e.target.checked)}
          {...props}
        />
      )
    );
    TestSwitch.displayName = 'TestSwitch';
  - FOLLOW: Pattern from packages/react/src/__tests__/UnusedFields.test.tsx
  - NOTE: Uses 'checked' attribute and e.target.checked for onChange
```

### Implementation Patterns & Key Details

```tsx
// ============================================================
// BEFORE (Current - lines 27-34)
// ============================================================
const TestInput = ({ value, onChange, name, ...props }: any) => (
  <input
    data-testid={name}
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  />
);

// ============================================================
// AFTER (Target)
// ============================================================
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref} // ADD: Forward ref to input
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)} // ADD: Optional chaining
      {...props}
    />
  ),
);
TestInput.displayName = "TestInput"; // ADD: displayName

// ============================================================
// BEFORE (Current - lines 36-44)
// ============================================================
const TestSwitch = ({ value, onChange, name, ...props }: any) => (
  <input
    type="checkbox"
    data-testid={name}
    checked={!!value}
    onChange={(e) => onChange(e.target.checked)}
    {...props}
  />
);

// ============================================================
// AFTER (Target)
// ============================================================
const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref} // ADD: Forward ref to input
      type="checkbox"
      data-testid={name}
      checked={value ?? false} // CHANGE: Use ?? instead of !!
      onChange={(e) => onChange?.(e.target.checked)} // ADD: Optional chaining
      {...props}
    />
  ),
);
TestSwitch.displayName = "TestSwitch"; // ADD: displayName
```

### Integration Points

```yaml
NONE: This change is isolated to test components only
  - No production code affected
  - No API changes
  - No database changes
  - Tests should pass without modification
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run from project root
# Type checking for the react package
pnpm --filter @formality-ui/react exec tsc --noEmit

# Linting check
pnpm --filter @formality-ui/react exec eslint src/__tests__/autosave-validation.test.tsx

# Format check (optional - only if project uses Prettier)
pnpm --filter @formality-ui/react exec prettier --check src/__tests__/autosave-validation.test.tsx

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the specific test file
pnpm --filter @formality-ui/react test autosave-validation

# Expected: All tests pass (12 tests in AutoSave Validation Coordination suite)
# Test suite includes:
# - "should NOT validate ALL fields when ONE field changes with autoSave"
# - "should validate dependent fields but NOT independent fields"
# - "should wait for async validators to complete before submitting"
# - "should debounce multiple rapid changes and only submit once"
# - "should reset debounce timer when new change comes in"
# - "should NOT submit if validation fails"

# Run with verbose output to see test names
pnpm --filter @formality-ui/react test autosave-validation --reporter=verbose

# Watch mode for iterative development
pnpm --filter @formality-ui/react test autosave-validation --watch
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all react package tests to ensure no regression
pnpm --filter @formality-ui/react test

# Run full test suite to ensure project-wide compatibility
pnpm test

# Expected: All tests pass, no warnings about refs in test output
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Check for React warnings in test output
# Run test with --silent flag and capture stderr
pnpm --filter @formality-ui/react test autosave-validation 2>&1 | grep -i "warning:.*ref" || echo "No ref warnings found"

# Visual inspection of test output for clean execution
pnpm --filter @formality-ui/react test autosave-validation --reporter=verbose

# Expected Output Pattern:
# ✓ AutoSave Validation Coordination (6)
#   ✓ ROOT CAUSE: All fields validating on any change
#     ✓ should NOT validate ALL fields when ONE field changes with autoSave
#   ✓ Dependent Field Validation
#     ✓ should validate dependent fields but NOT independent fields
#   ✓ Async Validation Waiting
#     ✓ should wait for async validators to complete before submitting
#   ✓ Cascading Changes
#     ✓ should debounce multiple rapid changes and only submit once
#     ✓ should reset debounce timer when new change comes in
#   ✓ Validation Errors
#     ✓ should NOT submit if validation fails

# Test Files  1 passed (1)
# Tests  12 passed (12)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] forwardRef imported from React on line 5
- [ ] TestInputProps interface defined with `[key: string]: unknown`
- [ ] TestSwitchProps interface defined with `[key: string]: unknown`
- [ ] TestInput wrapped with `forwardRef<HTMLInputElement, TestInputProps>`
- [ ] TestSwitch wrapped with `forwardRef<HTMLInputElement, TestSwitchProps>`
- [ ] `ref` parameter is second parameter in both components
- [ ] `ref={ref}` passed to underlying input elements
- [ ] Both components have displayName set
- [ ] Optional chaining used: `onChange?.(...)`
- [ ] Nullish coalescing used: `value ?? ''` and `value ?? false`

### Feature Validation

- [ ] All 12 tests pass: `pnpm --filter @formality-ui/react test autosave-validation`
- [ ] No "Function components cannot be given refs" warnings
- [ ] Test behavior unchanged (all assertions still pass)
- [ ] TypeScript compilation succeeds: `pnpm --filter @formality-ui/react exec tsc --noEmit`

### Code Quality Validation

- [ ] Follows established pattern from S1-S5 (compare with Field.test.tsx)
- [ ] No additional files created or modified
- [ ] Props interface placement (before component definitions)
- [ ] Import statement format matches other test files

### Pattern Compliance

- [ ] Import: `import React, { forwardRef } from 'react';`
- [ ] Generic order: `forwardRef<HTMLElement, PropsInterface>`
- [ ] displayName format: `ComponentName.displayName = 'ComponentName';`
- [ ] Props spread: `{...props}` with `[key: string]: unknown` in interface

---

## Anti-Patterns to Avoid

- ❌ Don't modify production code - this is test-only
- ❌ Don't add `disabled` prop to TestInput/TestSwitch (not in original)
- ❌ Don't change test behavior or assertions
- ❌ Don't use `memo` - only forwardRef is needed
- ❌ Don't put ref in destructured props - it's the second parameter
- ❌ Don't forget displayName - required for React DevTools
- ❌ Don't use `||` for defaults - use `??` (nullish coalescing)
- ❌ Don't call onChange directly - use optional chaining `onChange?.()`
- ❌ Don't mix up generic type order - Element first, then Props
- ❌ Don't skip the index signature `[key: string]: unknown` in props interface

---

## Confidence Score

**Score: 10/10**

**Rationale**:

- Pattern is well-established from 5 completed subtasks (S1-S5)
- Only 2 components need modification
- Changes are mechanical and straightforward
- Comprehensive validation commands provided
- No dependencies on other unfinished tasks
- All necessary context, patterns, and documentation provided

---

## Appendix: Complete Reference Code

### TestInput Component (Final Version)

```tsx
import React, { forwardRef } from "react";

interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  ),
);

TestInput.displayName = "TestInput";
```

### TestSwitch Component (Final Version)

```tsx
import React, { forwardRef } from "react";

interface TestSwitchProps {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown;
}

const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      data-testid={name}
      checked={value ?? false}
      onChange={(e) => onChange?.(e.target.checked)}
      {...props}
    />
  ),
);

TestSwitch.displayName = "TestSwitch";
```
