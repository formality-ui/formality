# Testing Patterns for Type Changes in Formality

## Overview

This document describes the testing patterns used in the Formality codebase for type-related changes, specifically for verifying and testing the addition of properties to interfaces.

## Current Testing Approach

### Behavioral Testing (Primary Pattern)

The codebase uses **behavioral testing** rather than explicit type checking. Types are tested implicitly by running actual code that uses the types.

### Test File Locations

**Core Package Tests:**
- `/home/dustin/projects/formality/packages/core/src/__tests__/conditions.test.ts`
- `/home/dustin/projects/formality/packages/core/src/__tests__/expression.test.ts`
- `/home/dustin/projects/formality/packages/core/src/__tests__/validation.test.ts`

**React Package Tests:**
- `/home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx`
- `/home/dustin/projects/formality/packages/react/src/__tests__/Form.test.tsx`
- `/home/dustin/projects/formality/packages/react/src/__tests__/useFieldDisabledState.test.tsx`
- `/home/dustin/projects/formality/packages/react/src/__tests__/integration/complete-form.test.tsx`

### Mock Object Testing Pattern

Tests create mock objects that match type interfaces:

```typescript
// Example from conditions.test.ts
const fieldStates = {
  email: {
    value: "test@example.com",
    invalid: false,
    error: undefined,
    isTouched: false,
    isDirty: false,
    isValidating: false,
    watchers: {}
  }
};
```

## Testing Type Changes: Recommended Patterns

### 1. Behavioral Test for New Property

Test that the new property works correctly in context:

```typescript
it("should handle disabled property in field state", () => {
  const conditions: ConditionDescriptor[] = [
    { when: "field1", isDisabled: true, disabled: true }
  ];

  const fieldStates = {
    field1: {
      value: "test",
      invalid: false,
      disabled: true  // ← New property being tested
    }
  };

  const result = evaluateConditions({
    conditions,
    fieldValues: { field1: "test" },
    fieldStates
  });

  expect(result.disabled).toBe(true);
});
```

### 2. Integration Test

Test the property in context with related functionality:

```typescript
it("should work with isDisabled matcher", () => {
  const conditions = [
    { when: "email", isDisabled: true, visible: false }
  ];

  const fieldStates = {
    email: {
      value: "test@example.com",
      invalid: false,
      disabled: true  // ← Property affects condition evaluation
    }
  };

  const result = evaluateConditions({
    conditions,
    fieldValues: { email: "test@example.com" },
    fieldStates
  });

  expect(result.visible).toBe(false);
});
```

### 3. Type Compiler Test

Rely on TypeScript compiler to catch type errors:

```typescript
it("should accept FieldState with disabled property", () => {
  const fieldState: FieldState = {
    value: "test",
    isTouched: false,
    isDirty: false,
    isValidating: false,
    invalid: false,
    disabled: true  // ← Should compile without error
  };

  expect(fieldState.disabled).toBe(true);
});
```

### 4. Optional Property Test

Test that the property is truly optional:

```typescript
it("should work without disabled property (backward compatibility)", () => {
  const fieldState: FieldState = {
    value: "test",
    isTouched: false,
    isDirty: false,
    isValidating: false,
    invalid: false
    // disabled not provided
  };

  expect(fieldState.disabled).toBeUndefined();
});
```

## Test Configuration

**Test Runner**: Vitest with `globals: true`
**Environment**: Node.js for core, jsdom for React
**Type Checking**: TypeScript compiler with `"strict": true`
**Testing Libraries**:
- `@testing-library/react` for React components
- `@testing-library/jest-dom` for DOM assertions
- `vitest` for test assertions

## Validation Commands

```bash
# Type checking (verifies types compile correctly)
pnpm typecheck

# Linting (verifies code style)
pnpm lint --fix

# Run tests (verifies behavior)
pnpm test --filter @formality-ui/core

# Run specific test file
pnpm test packages/core/src/__tests__/conditions.test.ts
```

## What NOT Found (Intentionally)

The codebase does **NOT** use:
- ❌ Explicit type assertion tests (expectType, expectNotType, etc.)
- ❌ Type-only test files (`.test-d.ts`)
- ❌ TypeScript type utility library usage
- ❌ Compile-time type error testing patterns

## Recommendations for P2.M1.T2.S1

Since `FieldStateInput` already has `disabled?: boolean`, the verification test should:

1. **Verify existing property**: Test that FieldStateInput accepts disabled property
2. **Test isDisabled matcher**: Verify the matcher works with disabled property
3. **Integration test**: Test condition evaluation with disabled field states

Example test structure:

```typescript
describe("FieldStateInput Type Verification", () => {
  it("should accept disabled property", () => {
    const fieldState: FieldStateInput = {
      value: "test",
      disabled: true
    };
    expect(fieldState.disabled).toBe(true);
  });

  it("should work with isDisabled matcher", () => {
    const conditions = [{ when: "field", isDisabled: true, disabled: true }];
    const fieldStates = { field: { value: "test", disabled: true } };

    const result = evaluateConditions({
      conditions,
      fieldValues: { field: "test" },
      fieldStates
    });

    expect(result.disabled).toBe(true);
  });
});
```

## Summary

For P2.M1.T2.S1 (Verify FieldStateInput type):
- **FieldStateInput already has `disabled?: boolean`** (✅ Complete)
- **Verification needed**: Test that existing property works correctly
- **Use behavioral tests**: Create objects with the property and test behavior
- **No explicit type tests**: Rely on TypeScript compiler for type verification
