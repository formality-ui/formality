# PRP: Verify FieldGroup.test.tsx forwardRef Implementation

**Work Item**: P1.M1.T1.S2 - Update FieldGroup.test.tsx test components
**Status**: Verification Required (Implementation Already Complete)
**Confidence Score**: 10/10

---

## Goal

**Feature Goal**: Verify that TestInput and TestSwitch components in FieldGroup.test.tsx properly use React.forwardRef to eliminate React warnings about function components receiving refs.

**Deliverable**: Confirmed verification that both test components correctly implement forwardRef pattern, with clean test output showing zero React ref warnings.

**Success Definition**:
- Both TestInput and TestCheck components are wrapped with `forwardRef<HTMLInputElement, PropsInterface>`
- Both components have `displayName` properly set
- Tests run without "Function components cannot be given refs" warnings
- Test output shows all FieldGroup tests passing

**Context Note**: **This work is already complete.** Commit `b2a9a2f` on 2025-01-05 contains the implementation: "fix: Update FieldGroup test components with forwardRef support". This PRP focuses on verification and documentation.

---

## Why

- **Bug Fix Context**: React Hook Form's `Controller` component passes refs to input components. Without forwardRef wrapping, function components trigger React warnings in test output.
- **Consistent Pattern**: This task is part of P1.M1.T1 (Fix React Ref Warnings in Test Output), which aims to update 8 test files with the same forwardRef pattern.
- **Clean Test Output**: Eliminating console warnings makes it easier to spot real issues during development and testing.
- **Already Implemented**: The implementation was done in commit b2a9a2f but task status still shows "Researching" - needs verification and status update.

---

## What

### Current State (Verification Target)

The following components in `packages/react/src/__tests__/FieldGroup.test.tsx` should already have forwardRef implemented:

**TestInput Component (lines 24-37)**:
```typescript
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}
    />
  ),
);

TestInput.displayName = "TestInput";
```

**TestSwitch Component (lines 48-62)**:
```typescript
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
      ref={ref}
      type="checkbox"
      data-testid={name}
      checked={value ?? false}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={disabled}
      {...props}
    />
  ),
);

TestSwitch.displayName = "TestSwitch";
```

### Success Criteria

- [ ] Verify TestInput uses `forwardRef<HTMLInputElement, TestInputProps>`
- [ ] Verify TestSwitch uses `forwardRef<HTMLInputElement, TestSwitchProps>`
- [ ] Verify both components forward `ref` parameter to underlying `<input>` element
- [ ] Verify both components have `displayName` set correctly
- [ ] Run tests: `pnpm test FieldGroup.test.tsx` - all pass, no warnings
- [ ] Update task status from "Researching" to "Complete" in bug_fix_tasks.json

---

## All Needed Context

### Context Completeness Check

**Question**: "If someone knew nothing about this codebase, would they have everything needed to verify this implementation successfully?"

**Answer**: Yes. The implementation is already complete. This PRP provides all context needed to verify the work is correct and run validation tests.

### Documentation & References

```yaml
# PRIMARY TARGET - The file to verify
- file: packages/react/src/__tests__/FieldGroup.test.tsx
  why: This is the file containing TestInput and TestSwitch components that should already have forwardRef
  lines: 24-37 (TestInput), 48-62 (TestSwitch)
  pattern: Verify both use forwardRef wrapper with proper generic types and displayName

# REFERENCE PATTERN - How it should look (from completed P1.M1.T1.S1)
- file: packages/react/src/__tests__/Field.test.tsx
  why: Shows the exact forwardRef pattern applied in the previous subtask
  pattern: Same TestInput and TestSwitch structure with forwardRef
  gotcha: Field.test.tsx has additional props (label, error) not needed in FieldGroup.test.tsx

# CONSISTENCY CHECK - Other completed test files
- file: packages/react/src/__tests__/Form.test.tsx
  why: Verify consistency across all updated test files
  completed: S3 (Complete)

- file: packages/react/src/__tests__/FormalityProvider.test.tsx
  why: Verify minimal forwardRef pattern for simple test components
  completed: S4 (Complete)

- file: packages/react/src/__tests__/UnusedFields.test.tsx
  why: Verify basic TestInput pattern
  completed: S5 (Complete)

- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: Verify both TestInput and TestSwitch patterns
  completed: S6 (Complete)

- file: packages/react/src/__tests__/render-isolation.test.tsx
  why: Verify comprehensive test component patterns
  completed: S7 (Complete)

# REACT DOCUMENTATION
- url: https://react.dev/reference/react/forwardRef
  why: Official documentation on forwardRef usage
  critical: Always set displayName for debugging and React DevTools clarity

- url: https://react.dev/learn/referencing-values-with-refs
  why: Understanding why refs are needed and how they work
  critical: Refs must be forwarded to actual DOM elements, not wrapper divs

# TESTING FRAMEWORK
- file: packages/react/vitest.config.ts
  why: Configuration for running React tests with jsdom environment
  pattern: Tests use jsdom for browser-like testing environment

- file: packages/react/src/__tests__/setup.ts
  why: Test setup file with @testing-library/jest-dom matchers
  pattern: Cleanup runs after each test

# TASK TRACKING
- file: bug_fix_tasks.json
  why: Contains task status that needs to be updated after verification
  action: Change P1.M1.T1.S2 status from "Researching" to "Complete"

# GIT HISTORY
- commit: b2a9a2f
  why: This commit implemented the forwardRef pattern for FieldGroup.test.tsx
  message: "fix: Update FieldGroup test components with forwardRef support"
  date: 2025-01-05 (before 6982bff)
```

### Current Codebase Structure (Relevant Portions)

```bash
packages/react/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts                    # Test setup with cleanup
│   │   ├── FieldGroup.test.tsx         # TARGET FILE (lines 24-37, 48-62)
│   │   ├── Field.test.tsx              # REFERENCE (S1 - Complete)
│   │   ├── Form.test.tsx               # REFERENCE (S3 - Complete)
│   │   ├── FormalityProvider.test.tsx  # REFERENCE (S4 - Complete)
│   │   ├── UnusedFields.test.tsx       # REFERENCE (S5 - Complete)
│   │   ├── autosave-validation.test.tsx # REFERENCE (S6 - Complete)
│   │   └── render-isolation.test.tsx   # REFERENCE (S7 - Complete)
│   └── components/
│       ├── Form.tsx
│       ├── Field.tsx
│       ├── FieldGroup.tsx
│       └── FormalityProvider.tsx
├── vitest.config.ts                     # Test configuration
└── package.json

plan/bugfix/
└── P1M1T1S2/
    └── PRP.md                           # This file
```

### Known Gotchas of React forwardRef

```typescript
// CRITICAL: forwardRef requires proper generic types
// ❌ WRONG - No generics, loses type safety
const TestInput = forwardRef((props, ref) => <input ref={ref} />);

// ✅ CORRECT - Proper generic types
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  (props, ref) => <input ref={ref} />
);

// CRITICAL: Always set displayName for debugging
// ❌ WRONG - Shows as "ForwardRef" in React DevTools and test output
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(...);

// ✅ CORRECT - Shows as "TestInput" in React DevTools
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(...);
TestInput.displayName = "TestInput";

// CRITICAL: Ref type must match the actual DOM element
// ❌ WRONG - Type mismatch
forwardRef<HTMLDivElement, Props>((props, ref) => <input ref={ref} />)

// ✅ CORRECT - Type matches actual element
forwardRef<HTMLInputElement, Props>((props, ref) => <input ref={ref} />)

// GOTCHA: Test components often use [key: string]: unknown for flexibility
// This allows passing through arbitrary props without TypeScript errors
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown;  // Critical for test component flexibility
}

// GOTCHA: React Testing Library's data-testid pattern
// All test components use data-testid={name} for consistent test selectors
<input data-testid={name} ref={ref} />
// Tests then use: screen.getByTestId("fieldName")
```

---

## Implementation Blueprint

### Data Models and Structure

**No data model changes needed** - This is a verification task for existing test components.

The existing test component interfaces:

```typescript
// TestInput Props Interface
interface TestInputProps {
  value?: any;                              // Controlled input value
  onChange?: (value: any) => void;          // Change handler
  disabled?: boolean;                       // Disabled state
  name: string;                             // Field identifier (required)
  [key: string]: unknown;                   // Allow arbitrary props
}

// TestSwitch Props Interface
interface TestSwitchProps {
  value?: any;                              // Boolean checked state
  onChange?: (value: any) => void;          // Change handler
  disabled?: boolean;                       // Disabled state
  name: string;                             // Field identifier (required)
  [key: string]: unknown;                   // Allow arbitrary props
}
```

### Implementation Tasks (Verification Workflow)

```yaml
Task 1: VERIFY Current Implementation in FieldGroup.test.tsx
  - CHECK: Lines 24-37 contain TestInput component with forwardRef
  - VERIFY: forwardRef<HTMLInputElement, TestInputProps> is used
  - VERIFY: ref parameter is destructured: ({ value, onChange, disabled, name, ...props }, ref)
  - VERIFY: ref is forwarded to <input ref={ref}>
  - VERIFY: TestInput.displayName = "TestInput" is set
  - CHECK: Lines 48-62 contain TestSwitch component with forwardRef
  - VERIFY: forwardRef<HTMLInputElement, TestSwitchProps> is used
  - VERIFY: ref is forwarded to <input ref={ref} type="checkbox">
  - VERIFY: TestSwitch.displayName = "TestSwitch" is set

Task 2: RUN Tests to Verify No React Warnings
  - COMMAND: cd packages/react && pnpm test FieldGroup.test.tsx
  - VERIFY: All FieldGroup tests pass (expect 9 tests)
  - VERIFY: No "Function components cannot be given refs" warnings in output
  - VERIFY: No "forwardRef render functions accept exactly two parameters" warnings
  - CHECK: Console output is clean except for vitest summary

Task 3: COMPARE Pattern with Other Completed Test Files
  - READ: Field.test.tsx TestInput pattern (lines 16-43)
  - READ: Form.test.tsx TestInput pattern (lines 15-37)
  - VERIFY: FieldGroup.test.tsx follows same pattern structure
  - VERIFY: Generic type format matches: forwardRef<HTMLInputElement, PropsInterface>
  - VERIFY: displayName format matches: ComponentName.displayName = "ComponentName"

Task 4: UPDATE Task Status in bug_fix_tasks.json
  - FILE: bug_fix_tasks.json
  - FIND: P1.M1.T1.S2 entry (line 35-40)
  - CHANGE: status from "Researching" to "Complete"
  - VERIFY: JSON remains valid after edit
  - COMMIT: Status update commit with message "docs: mark P1.M1.T1.S2 as Complete"

Task 5: RUN Final Validation (All P1.M1.T1 Tests)
  - COMMAND: cd packages/react && pnpm test
  - VERIFY: All 329+ tests pass
  - VERIFY: Zero React ref warnings across entire test suite
  - DOCUMENT: Test results for P1.M1.T1.S9 (Verify all tests pass with no warnings)
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CORRECT forwardRef Pattern (Already Implemented in FieldGroup.test.tsx)
// ============================================================================

// Pattern 1: TestInput with forwardRef
// Location: FieldGroup.test.tsx lines 24-37

// Step 1: Import forwardRef from React
import React, { forwardRef } from "react";

// Step 2: Define props interface with index signature for flexibility
interface TestInputProps {
  value?: any;                              // Controlled value
  onChange?: (value: any) => void;          // Change callback
  disabled?: boolean;                       // Optional disabled state
  name: string;                             // Required field identifier
  [key: string]: unknown;                   // Catch-all for additional props
}

// Step 3: Wrap component with forwardRef, specifying element and props types
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  // Step 4: Component function receives props and ref as two parameters
  ({ value, onChange, disabled, name, ...props }, ref) => (
    // Step 5: Forward ref to the actual DOM element
    <input
      ref={ref}                              // Critical: forward ref here
      data-testid={name}                     // Test selector pattern
      value={value ?? ""}                    // Default to empty string
      onChange={(e) => onChange?.(e.target.value)}  // Handler with optional chaining
      disabled={disabled}                    // Disabled state
      {...props}                             // Spread additional props
    />
  ),
);

// Step 6: Set displayName for debugging and React DevTools
TestInput.displayName = "TestInput";

// Pattern 2: TestSwitch with forwardRef
// Location: FieldGroup.test.tsx lines 48-62

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
      ref={ref}                              // Critical: forward ref
      type="checkbox"                        // Switch renders as checkbox
      data-testid={name}                     // Test selector pattern
      checked={value ?? false}               // Boolean checked state
      onChange={(e) => onChange?.(e.target.checked)}  // Checkbox uses .checked
      disabled={disabled}
      {...props}
    />
  ),
);

TestSwitch.displayName = "TestSwitch";

// ============================================================================
// Key Differences: TestInput vs TestSwitch
// ============================================================================

// TestInput:
// - Renders: <input> (default text input)
// - Value prop: value={value ?? ""}
// - Change event: e.target.value (string)
// - Display: Shows text value

// TestSwitch:
// - Renders: <input type="checkbox">
// - Value prop: checked={value ?? false}
// - Change event: e.target.checked (boolean)
// - Display: Shows checkbox

// ============================================================================
// Common Gotchas and How to Avoid Them
// ============================================================================

// GOTCHA 1: Forgetting displayName
// Problem: React DevTools shows "ForwardRef" instead of component name
// Solution: Always set displayName after component definition

// GOTCHA 2: Wrong ref type
// Problem: TypeScript error if ref type doesn't match actual element
// Solution: Use HTMLInputElement for <input>, HTMLSelectElement for <select>, etc.

// GOTCHA 3: Not forwarding ref to DOM element
// Problem: Ref is received but not passed to actual DOM element
// Solution: Always add ref={ref} to the actual HTML element, not wrapper divs

// GOTCHA 4: Missing [key: string]: unknown
// Problem: Can't pass additional props like className, id, etc.
// Solution: Add index signature to props interface

// GOTCHA 5: Using wrong event property
// Problem: Checkbox uses .checked, text input uses .value
// Solution: Match event property to input type
```

### Integration Points

```yaml
TEST_FRAMEWORK:
  - runner: Vitest v2.0.0+
  - environment: jsdom (browser-like testing)
  - config: packages/react/vitest.config.ts
  - setup: packages/react/src/__tests__/setup.ts

TEST_UTILITIES:
  - library: @testing-library/react v14.0.0
  - matchers: @testing-library/jest-dom v6.0.0
  - user_event: @testing-library/user-event v14.5.2

TEST_COMMANDS:
  - single file: pnpm test FieldGroup.test.tsx
  - all react tests: pnpm test (from packages/react)
  - all tests: pnpm test (from root)
  - coverage: pnpm test:coverage

TASK_TRACKING:
  - file: bug_fix_tasks.json
  - update: Change P1.M1.T1.S2 status from "Researching" to "Complete"
  - location: Line 37 (status field)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Verify TypeScript compilation (should have no errors)
pnpm typecheck

# Expected: Zero TypeScript errors
# If errors exist in FieldGroup.test.tsx, review forwardRef implementation

# Verify code formatting (optional, for consistency)
pnpm format  # Runs Prettier if configured

# Expected: Files are formatted correctly
# FieldGroup.test.tsx should match codebase formatting standards
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run FieldGroup tests specifically
cd packages/react
pnpm test FieldGroup.test.tsx

# Expected output:
# ✓ FieldGroup (9 tests)
#   ✓ visibility
#     ✓ should render children with span wrapper when visible
#     ✓ should always render children in DOM (span wrapper preserves children)
#     ✓ should have span wrapper element (not return null when hidden)
#   ✓ disabled propagation
#     ✓ should provide group context to child fields
#   ✓ nesting
#     ✓ should support nested FieldGroup components
#     ✓ should render nested groups with correct hierarchy
#   ✓ group without config
#     ✓ should work with undefined group config (defaults to visible and enabled)
#   ✓ data attribute
#     ✓ should have data-formality-group attribute for testing
#
# Test Files  1 passed (1)
# Tests  9 passed (9)

# CRITICAL: Verify NO warnings like:
# - "Function components cannot be given refs"
# - "forwardRef render functions accept exactly two parameters"
# - "Warning: forwardRef requires a render function"

# If warnings appear, the forwardRef implementation is incomplete
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all React package tests to verify no regressions
cd packages/react
pnpm test

# Expected: All tests pass (184+ tests in React package)
# Verify: No React ref warnings in any test output

# Run full test suite to verify cross-package consistency
cd /home/dustin/projects/formality
pnpm test

# Expected: All 329+ tests pass across all packages
# Verify: Clean console output with only vitest summary

# Check git status to confirm no unexpected changes
git status

# Expected: FieldGroup.test.tsx shows no modifications (already correct)
# If changes exist, verify they are intentional (e.g., status update)
```

### Level 4: Verification & Documentation

```bash
# Verify forwardRef implementation matches pattern from other test files
grep -A 15 "const TestInput = forwardRef" packages/react/src/__tests__/FieldGroup.test.tsx

# Expected output:
# const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
#   ({ value, onChange, disabled, name, ...props }, ref) => (
#     <input
#       ref={ref}
#       data-testid={name}
#       value={value ?? ""}
#       onChange={(e) => onChange?.(e.target.value)}
#       disabled={disabled}
#       {...props}
#     />
#   ),
# );
# TestInput.displayName = "TestInput";

# Verify TestSwitch implementation
grep -A 15 "const TestSwitch = forwardRef" packages/react/src/__tests__/FieldGroup.test.tsx

# Expected output:
# const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(
#   ({ value, onChange, disabled, name, ...props }, ref) => (
#     <input
#       ref={ref}
#       type="checkbox"
#       data-testid={name}
#       checked={value ?? false}
#       onChange={(e) => onChange?.(e.target.checked)}
#       disabled={disabled}
#       {...props}
#     />
#   ),
# );
# TestSwitch.displayName = "TestSwitch";

# Verify git commit history shows implementation
git log --oneline -5 -- packages/react/src/__tests__/FieldGroup.test.tsx

# Expected output includes:
# b2a9a2f fix: Update FieldGroup test components with forwardRef support

# Update task status in bug_fix_tasks.json
# Edit line 37: Change "status": "Researching" to "status": "Complete"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TestInput component uses `forwardRef<HTMLInputElement, TestInputProps>`
- [ ] TestSwitch component uses `forwardRef<HTMLInputElement, TestSwitchProps>`
- [ ] Both components forward `ref` parameter to underlying `<input>` element
- [ ] TestInput.displayName = "TestInput" is set
- [ ] TestSwitch.displayName = "TestSwitch" is set
- [ ] All FieldGroup tests pass: `pnpm test FieldGroup.test.tsx`
- [ ] No React ref warnings in test output
- [ ] TypeScript compilation succeeds: `pnpm typecheck`
- [ ] Implementation matches pattern from other completed test files

### Feature Validation

- [ ] Success criteria from "What" section met
- [ ] FieldGroup.test.tsx tests run without warnings
- [ ] Test output shows 9 passing tests
- [ ] Git history confirms commit b2a9a2f contains the implementation
- [ ] Implementation consistent with P1.M1.T1.S1 (Field.test.tsx) pattern

### Documentation & Task Tracking

- [ ] Task status updated from "Researching" to "Complete" in bug_fix_tasks.json
- [ ] JSON file remains valid after status update
- [ ] Git commit created for status update (if applicable)
- [ ] PRP documentation stored at plan/bugfix/P1M1T1S2/PRP.md

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Implementation consistent with other completed test files (S1, S3-S7)
- [ ] TypeScript types are correct (HTMLInputElement for both components)
- [ ] displayName values match component variable names
- [ ] Props interfaces include `[key: string]: unknown` for flexibility

---

## Anti-Patterns to Avoid

- ❌ **Don't modify the forwardRef implementation** - It's already correct
- ❌ **Don't skip running tests** - Verification requires actual test execution
- ❌ **Don't forget to update task status** - The "Researching" status needs to change to "Complete"
- ❌ **Don't assume without verification** - Even though git history shows the commit, verify the code is still correct
- ❌ **Don't ignore warnings** - If React warnings appear, investigate the root cause
- ❌ **Don't break JSON syntax** - When updating bug_fix_tasks.json, ensure valid JSON

---

## Appendix: forwardRef Quick Reference

```typescript
// ============================================================================
// forwardRef Implementation Checklist
// ============================================================================

// 1. Import forwardRef
import { forwardRef } from "react";

// 2. Define props interface with index signature
interface ComponentProps {
  // ... specific props
  [key: string]: unknown;  // Allow arbitrary props
}

// 3. Wrap component with forwardRef
const Component = forwardRef<HTMLRefElement, ComponentProps>(
  // 4. Component function receives props and ref
  (props, ref) => {
    // 5. Forward ref to actual DOM element
    return <element ref={ref} {...props} />;
  }
);

// 6. Set displayName
Component.displayName = "Component";

// ============================================================================
// Common HTML Element Types for Refs
// ============================================================================

HTMLInputElement      // <input>, <input type="checkbox">, etc.
HTMLTextAreaElement   // <textarea>
HTMLSelectElement     // <select>
HTMLButtonElement     // <button>
HTMLDivElement        // <div>
HTMLSpanElement       // <span>
HTMLFormElement       // <form>
HTMLLabelElement      // <label>

// ============================================================================
// Event Handler Patterns
// ============================================================================

// Text input value change
onChange={(e) => onChange?.(e.target.value)}  // e.target.value is string

// Checkbox checked change
onChange={(e) => onChange?.(e.target.checked)}  // e.target.checked is boolean

// Select value change
onChange={(e) => onChange?.(e.target.value)}  // e.target.value is string

// ============================================================================
// displayName Format
// ============================================================================

// Simple component
TestInput.displayName = "TestInput";

// Nested or HOC component
WrappedComponent.displayName = "withTestRef(TestInput)";

// Test component prefix
TestInput.displayName = "Test.TestInput";
```

---

**PRP Version**: 1.0
**Last Updated**: 2025-01-11
**Implementation Status**: Already Complete (commit b2a9a2f)
**PRP Purpose**: Verification and Documentation
