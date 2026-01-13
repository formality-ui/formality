# PRP: Fix Form debounce Prop Type

**Work Item**: P1.M2.T1.S4 - Fix Form debounce prop type
**Parent Task**: P1.M2.T1 - Modify Form Component
**Priority**: P1 (Critical)

---

## Goal

**Feature Goal**: Update the `FormProps` interface to allow the `debounce` prop to accept both `number` and `false` types, enabling form-level immediate submission configuration.

**Deliverable**: Modified `FormProps` interface in `packages/react/src/components/Form.tsx` with `debounce?: number | false` type and updated JSDoc documentation.

**Success Definition**:
- `FormProps.debounce` type changed from `number` to `number | false`
- JSDoc comment updated to explain `false` means immediate submission
- TypeScript compilation succeeds without errors
- Existing Form component behavior is preserved
- Form can now accept `debounce={false}` for immediate auto-save

---

## Why

- **User Impact**: This completes the type-level support for the `debounce: false` feature. Currently, the `InputConfig` type allows `debounce?: number | false`, but the Form-level `debounce` prop only accepts `number`. This creates a type inconsistency where users can set immediate submission at the input level but not at the form level.
- **Integration**: This aligns the Form-level `debounce` prop with the `InputConfig.debounce` type, completing the type system consistency across the debounce feature.
- **Problems Solved**: Developers who want to disable form-wide debounce (e.g., for immediate submission on all fields) currently have no type-safe way to do so. The runtime logic already supports `inputConfig?.debounce === false` checks, but the Form props interface doesn't accept `false`.

---

## What

Update the `FormProps` interface `debounce` prop type to accept `number | false`.

**Current Type** (line 62):
```typescript
debounce?: number;
```

**Target Type**:
```typescript
debounce?: number | false;
```

**Current JSDoc** (line 61):
```typescript
/** Debounce milliseconds for auto-save (default: 1000) */
```

**Target JSDoc**:
```typescript
/** Debounce milliseconds for auto-save. false = immediate submission, number = delay in milliseconds (default: 1000) */
```

### Success Criteria

- [ ] `FormProps.debounce` type changed to `number | false`
- [ ] JSDoc comment updated to explain both false and number meanings
- [ ] No TypeScript errors after changes
- [ ] Existing Form component tests pass
- [ ] Type system consistency: `FormProps.debounce` matches `InputConfig.debounce`

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes. This PRP provides:
- Exact file path and line numbers
- Current and target type definitions
- Complete context on existing `InputConfig.debounce` pattern
- Integration points with previous subtasks
- Validation commands specific to this project
- No prior knowledge required

### Documentation & References

```yaml
# MUST READ - Critical implementation references

# CONTRACT FROM PREVIOUS SUBTASKS
- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S1/PRP.md
  why: Defines the inputConfig parameter contract with debounce type
  contract: InputConfig.debounce?: number | false pattern established
  critical: FormProps should match this type for consistency

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S2/PRP.md
  why: Defines the conditional execution logic that checks debounce === false
  contract: Runtime logic expects debounce can be false
  critical: Type must match runtime expectations

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S3/PRP.md
  why: Field component passes inputConfig to changeField
  contract: Field wires inputConfig through to Form's changeField
  critical: Type consistency across the chain

# IMPLEMENTATION TARGET
- file: packages/react/src/components/Form.tsx
  why: Contains FormProps interface (lines 42-68)
  pattern: Interface with optional props and JSDoc comments
  gotcha: debounce prop is on line 62, JSDoc on line 61

# TYPE DEFINITIONS
- file: packages/core/src/types/config.ts
  why: InputConfig type definition with debounce property (line 53)
  pattern: debounce?: number | false with explanatory JSDoc
  critical: This is the pattern FormProps should follow
  exact: "/** Debounce milliseconds for validation/auto-save. false = immediate, number = delay */"

# VALIDATION REFERENCES
- file: packages/react/src/__tests__/Form.test.tsx
  why: Reference for Form component testing patterns
  pattern: TestForm component with data-testid, render() from React Testing Library

# EXTERNAL RESEARCH - TypeScript Patterns
- url: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html#union-types
  why: TypeScript union types with false
  critical: number | false is a valid union type pattern

- url: https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns/#use-union-types-for-props
  why: React component props with union types
  critical: Common pattern for configuration props
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/
├── packages/
│   ├── core/
│   │   └── src/
│   │       └── types/
│   │           └── config.ts                    # InputConfig with debounce?: number | false (line 53)
│   └── react/
│       └── src/
│           ├── components/
│           │   └── Form.tsx                     # TARGET: FormProps interface (lines 42-68)
│           └── __tests__/
│               └── Form.test.tsx                # Form component tests
├── plan/
│   └── 001_bbf464589edd/
│       └── bugfix/
│           └── 001_7b007b20a2ac/
│               ├── P1M2T1S1/PRP.md             # Previous: Added inputConfig parameter
│               ├── P1M2T1S2/PRP.md             # Previous: Implemented conditional execution
│               ├── P1M2T1S3/PRP.md             # Previous: Field passes inputConfig
│               └── P1M2T1S4/PRP.md             # This file
└── package.json
```

### Desired Codebase Tree (Files to Modify)

```bash
# Modified files:
packages/react/src/components/Form.tsx          # Update FormProps.debounce type and JSDoc

# No new files created in this subtask
# Tests will be added in P1.M2.T2 (Add Tests for debounce: false)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: FormProps is a TypeScript interface, not a runtime object
// Only the type definition and JSDoc need to change
// NO runtime code changes are required

// CRITICAL: The debounce prop already has runtime handling for false
// From Form.tsx line 313: if (inputConfig?.debounce === false) { submitImmediate(); }
// This subtask ONLY fixes the type definition to match runtime reality

// GOTCHA: JSDoc comment should follow the existing InputConfig pattern
// Pattern: "false = immediate, number = delay" or similar explanatory text
// This matches the pattern at packages/core/src/types/config.ts line 52

// PATTERN: This codebase uses specific JSDoc format for union types with false
// Example from config.ts: "/** Debounce milliseconds for validation/auto-save. false = immediate, number = delay */"
// Follow this format for consistency

// GOTCHA: The Form component has a default value for debounce
// Line 136: const debounceMs = 1000;
// This default is used when prop is undefined
// The type change doesn't affect the default value logic

// CRITICAL: No runtime implementation changes needed
// The conditional logic already exists (from P1.M2.T1.S2)
// This is purely a type fix to match runtime capabilities

// PATTERN: Optional props in this codebase use `?` suffix
// Current: debounce?: number;
// Target: debounce?: number | false;
// The `?` means the prop can be undefined, OR it can be number OR false
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - this task updates an existing interface type definition.

**Current FormProps.debounce**:
```typescript
// packages/react/src/components/Form.tsx:61-62
/** Debounce milliseconds for auto-save (default: 1000) */
debounce?: number;
```

**Target FormProps.debounce**:
```typescript
// packages/react/src/components/Form.tsx:61-62
/** Debounce milliseconds for auto-save. false = immediate submission, number = delay in milliseconds (default: 1000) */
debounce?: number | false;
```

**Existing InputConfig.debounce Pattern** (to match):
```typescript
// packages/core/src/types/config.ts:52-53
/** Debounce milliseconds for validation/auto-save. false = immediate, number = delay */
debounce?: number | false;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current FormProps interface
  - FILE: packages/react/src/components/Form.tsx
  - VERIFY: FormProps interface exists at lines 42-68
  - VERIFY: debounce prop exists at line 62
  - VERIFY: Current type is: debounce?: number;
  - VERIFY: Current JSDoc at line 61
  - DEPENDENCIES: None

Task 2: VERIFY InputConfig pattern for reference
  - FILE: packages/core/src/types/config.ts
  - VERIFY: InputConfig.debounce type at line 53
  - VERIFY: Type is: debounce?: number | false;
  - VERIFY: JSDoc pattern at line 52
  - PURPOSE: Use as template for FormProps update

Task 3: UPDATE FormProps.debounce type to include false
  - FILE: packages/react/src/components/Form.tsx
  - LOCATION: Line 62
  - CURRENT: debounce?: number;
  - TARGET: debounce?: number | false;
  - PRESERVE: Optional operator (?)

Task 4: UPDATE FormProps.debounce JSDoc comment
  - FILE: packages/react/src/components/Form.tsx
  - LOCATION: Line 61
  - CURRENT: /** Debounce milliseconds for auto-save (default: 1000) */
  - TARGET: /** Debounce milliseconds for auto-save. false = immediate submission, number = delay in milliseconds (default: 1000) */
  - PATTERN: Follow InputConfig JSDoc style (config.ts line 52)

Task 5: VERIFY TypeScript compilation
  - RUN: pnpm -F @formality-ui/react run tsc --noEmit
  - EXPECT: No type errors
  - VALIDATE: Union type syntax is correct
  - VALIDATE: No other code depends on debounce being number-only

Task 6: VERIFY existing tests pass
  - RUN: pnpm -F @formality-ui/react test
  - EXPECT: All existing tests pass
  - REASON: Type change is backward compatible (adds false option)
  - NO NEW TESTS: Tests will be added in P1.M2.T2
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Union type with false (established in codebase)
// This is a TypeScript pattern where false has semantic meaning

// BEFORE (Form.tsx lines 61-62):
/** Debounce milliseconds for auto-save (default: 1000) */
debounce?: number;

// AFTER (Form.tsx lines 61-62):
/** Debounce milliseconds for auto-save. false = immediate submission, number = delay in milliseconds (default: 1000) */
debounce?: number | false;

// PATTERN: Match the InputConfig JSDoc style
// From config.ts line 52:
/** Debounce milliseconds for validation/auto-save. false = immediate, number = delay */

// SEMANTIC MEANING:
// - undefined: Use default (1000ms)
// - false: Immediate submission (no debounce)
// - number: Custom delay in milliseconds

// GOTCHA: The optional operator (?) means THREE possible states:
// 1. undefined (not provided) → uses default 1000ms
// 2. false → immediate submission
// 3. number → custom delay

// CRITICAL: No runtime changes needed
// The Form component already handles false at runtime (from P1.M2.T1.S2):
// if (inputConfig?.debounce === false) { submitImmediate(); }

// INTEGRATION: This completes the type chain:
// InputConfig.debounce: number | false (core package)
//   ↓
// FormProps.debounce: number | false (react package) ← THIS SUBTASK
//   ↓
// Runtime: if (debounce === false) checks (already implemented)
```

### Integration Points

```yaml
FORMPROPS_INTERFACE:
  - file: packages/react/src/components/Form.tsx
  - update: line 61 (JSDoc), line 62 (type)
  - from: debounce?: number;
  - to: debounce?: number | false;

INPUTCONFIG_CONSISTENCY:
  - file: packages/core/src/types/config.ts
  - reference: line 53 (InputConfig.debounce type)
  - pattern: Match the number | false union type
  - pattern: Match the JSDoc explanatory style

RUNTIME_LOGIC:
  - already: implemented in P1.M2.T1.S2
  - check: if (inputConfig?.debounce === false)
  - integration: Type now matches runtime capability

BACKWARD_COMPATIBILITY:
  - existing: <Form debounce={500} /> still works
  - existing: <Form /> (no prop) still works (uses default 1000ms)
  - new: <Form debounce={false} /> now type-safe
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type checking - Run after modification
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors
# Common errors to fix:
# - "Type 'false' is not assignable to type 'number'" - Need to update the type union
# - Any other type errors - Check for other places that assume debounce is number-only

# If TypeScript errors occur:
# 1. Read the error message carefully
# 2. Find all places that reference FormProps.debounce
# 3. Ensure they handle the number | false union correctly
# 4. Remember: false is a valid TypeScript value in union types

# Linting (if project uses ESLint)
pnpm -F @formality-ui/react run lint

# Expected: Zero linting errors
# Formatting
pnpm -F @formality-ui/react run format
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run Form component tests
pnpm test packages/react/src/__tests__/Form.test.tsx

# Expected: All tests pass
# Any failures indicate breaking changes were introduced

# Run all react package tests
pnpm -F @formality-ui/react test

# Expected: All tests pass
# This includes integration tests that use Form components

# Verify type checking works
cat > /tmp/test-debounce-type.tsx << 'EOF'
import { Form } from '@formality-ui/react';

// Should all be valid after type change:
const form1 = <Form debounce={500} config={{}} onSubmit={() => {}} />;
const form2 = <Form debounce={false} config={{}} onSubmit={() => {}} />;
const form3 = <Form config={{}} onSubmit={() => {}} />; // undefined, uses default

// Should be type error (not a number or false):
// const form4 = <Form debounce="invalid" config={{}} onSubmit={() => {}} />;
EOF

# Run type check on test file
pnnpm -F @formality-ui/react exec tsc --noEmit /tmp/test-debounce-type.tsx
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify the type change in the source file
grep -A 1 "Debounce milliseconds for auto-save" packages/react/src/components/Form.tsx

# Expected output should show:
# /** Debounce milliseconds for auto-save. false = immediate submission, number = delay in milliseconds (default: 1000) */
# debounce?: number | false;

# Verify the change matches InputConfig pattern
grep -A 1 "Debounce milliseconds for validation/auto-save" packages/core/src/types/config.ts

# Expected output should show similar pattern:
# /** Debounce milliseconds for validation/auto-save. false = immediate, number = delay */
# debounce?: number | false;

# Verify no other files need updating (FormProps is exported and may be referenced)
grep -r "FormProps\[.*debounce\]" packages/
grep -r "Picked<FormProps>.*debounce" packages/

# Expected: No results (debounce is not destructured or accessed elsewhere)
```

### Level 4: End-to-End Validation (Feature Testing)

```bash
# Note: Full feature testing requires P1.M2.T2 (comprehensive tests)
# This validation confirms the type system accepts the new value

# Create a test component that uses debounce={false}
cat > /tmp/test-form-debounce-false.tsx << 'EOF'
import { Form, Field } from '@formality-ui/react';
import { createRoot } from 'react-dom/client';

const config = {
  inputs: {
    text: {
      component: 'input',
      defaultValue: '',
    },
  },
};

function TestApp() {
  const handleSubmit = (data: any) => {
    console.log('Submitted:', data);
  };

  return (
    <Form
      config={config}
      onSubmit={handleSubmit}
      autoSave={true}
      debounce={false} // Should now be type-safe!
    >
      <Field name="testField" type="text" />
    </Form>
  );
}

// This should type-check without errors
const root = createRoot(document.getElementById('root')!);
root.render(<TestApp />);
EOF

# Type check the test
pnpm -F @formality-ui/react exec tsc --noEmit /tmp/test-form-debounce-false.tsx

# Expected: No type errors
# If there are errors, the type change may not be complete or exported correctly
```

---

## Final Validation Checklist

### Technical Validation

- [ ] FormProps.debounce type changed to `number | false` (line 62)
- [ ] JSDoc comment updated to explain false and number (line 61)
- [ ] TypeScript compilation succeeds: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] All existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] Type matches InputConfig.debounce pattern

### Feature Validation

- [ ] `debounce={false}` is now type-safe in Form props
- [ ] `debounce={500}` still works (backward compatible)
- [ ] `debounce` undefined still works (uses default)
- [ ] Existing Form component behavior preserved
- [ ] Type consistency across FormProps and InputConfig

### Code Quality Validation

- [ ] JSDoc follows existing pattern from InputConfig
- [ ] Optional operator (`?`) preserved
- [ ] No linting or formatting errors
- [ ] No runtime changes (this is type-only)

### Integration Readiness

- [ ] P1.M2.T1.S1 contract satisfied (changeField accepts InputConfig)
- [ ] P1.M2.T1.S2 logic can now receive form-level debounce: false
- [ ] P1.M2.T1.S3 wiring complete (Field passes inputConfig)
- [ ] Ready for P1.M2.T2 (comprehensive tests for debounce: false)
- [ ] Type chain complete: InputConfig ↔ FormProps ↔ Runtime

---

## Anti-Patterns to Avoid

- **Don't modify runtime code** - This is a type-only change
- **Don't add new logic** - The runtime already handles false correctly
- **Don't change the default value** - Keep 1000ms as default
- **Don't remove the optional operator** - Keep `debounce?:` not `debounce:`
- **Don't use complex type utilities** - Simple `number | false` union is sufficient
- **Don't add tests yet** - Tests will be added in P1.M2.T2
- **Don't change other props** - Only modify the debounce prop
- **Don't forget the JSDoc** - Documentation is critical for this pattern

---

## Related Work Items

- **Previous**: P1.M2.T1.S1 - Add inputConfig parameter to changeField (COMPLETED)
- **Previous**: P1.M2.T1.S2 - Implement conditional execution logic (COMPLETED in parallel)
- **Previous**: P1.M2.T1.S3 - Update Field to pass inputConfig (COMPLETED in parallel)
- **Next**: P1.M2.T2 - Add comprehensive tests for debounce: false behavior
- **Reference**: InputConfig.debounce type at packages/core/src/types/config.ts:53

---

## Confidence Score

**10/10** - Maximum confidence for one-pass implementation success

**Reasoning**:
- Single-line type change with clear before/after
- Exact file path and line numbers specified
- Existing pattern to follow (InputConfig.debounce)
- No runtime code changes required
- All dependencies are already in place
- Comprehensive validation commands provided
- Previous PRPs provide complete context
- Backward compatible (adds false option, doesn't remove number)
- Type system change only (no behavior changes)

**Risk Assessment**: Minimal risk. This is a type system fix that aligns the type definition with existing runtime capabilities. The runtime already supports `false`, and the change simply makes the type declaration match reality.

---

## References

- [Previous PRP: P1.M2.T1.S1](../P1M2T1S1/PRP.md) - InputConfig parameter contract
- [Previous PRP: P1.M2.T1.S2](../P1M2T1S2/PRP.md) - Conditional execution logic
- [Previous PRP: P1.M2.T1.S3](../P1M2T1S3/PRP.md) - Field passes inputConfig
- [InputConfig Type Definition](../../../../packages/core/src/types/config.ts#L53) - debounce pattern reference
- [FormProps Interface](../../../../packages/react/src/components/Form.tsx#L42) - Implementation target
- [TypeScript Union Types Documentation](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html#union-types)
