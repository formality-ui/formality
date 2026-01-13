# AutoSave Validation Test Patterns

## Overview
This document outlines the testing patterns used in the autosave-validation.test.tsx file for testing coordinated validation during auto-save functionality.

## 1. Imports and Setup

### Core Imports
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { forwardRef } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig } from "@formality-ui/core";
```

### Test Components Pattern
Custom test components are created with `forwardRef` and include `data-testid` for easy targeting:

```typescript
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

## 2. Mocking and Tracking Patterns

### Validation Tracking
Global tracking array to monitor validation calls across tests:

```typescript
// Track validation calls
let validationCalls: string[] = [];

// Helper to create an async validator that tracks calls
function createAsyncValidator(fieldName: string, delayMs: number = 50) {
  return async (value: unknown) => {
    validationCalls.push(`${fieldName}:start`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    validationCalls.push(`${fieldName}:end`);
    return true;
  };
}
```

### Submit Handler Mocking
```typescript
// In beforeEach:
let submitHandler: ReturnType<typeof vi.fn>;

beforeEach(() => {
  validationCalls = [];
  submitHandler = vi.fn();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});
```

## 3. Timer Setup and Teardown

### Fake Timers Configuration
```typescript
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});
```

## 4. User Interaction Simulation

### Text Input Simulation
```typescript
const fieldA = screen.getByTestId("fieldA");
await act(async () => {
  await userEvent.type(fieldA, "x", { delay: null });
});
```

### Click Interaction (for checkboxes/switches)
```typescript
const fieldA = screen.getByTestId("fieldA");
await act(async () => {
  await userEvent.click(fieldA);
});
```

### Rapid Typing Simulation
```typescript
const fieldA = screen.getByTestId("fieldA");
await act(async () => {
  await userEvent.type(fieldA, "hello", { delay: null });
});
```

## 5. Timer Advancement Patterns

### Past Debounce Period
```typescript
await act(async () => {
  await vi.advanceTimersByTimeAsync(600); // 500ms debounce + buffer
});
```

### Past Async Validation Delay
```typescript
await act(async () => {
  await vi.advanceTimersByTimeAsync(200); // 100ms validation delay + buffer
});
```

### Partial Debounce (for reset timer testing)
```typescript
// Wait 300ms (less than debounce)
await act(async () => {
  await vi.advanceTimersByTimeAsync(300);
});
```

## 6. Async Testing Patterns

### Using `act` and `waitFor` Together
```typescript
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});
```

### Sequential Timer Advancement
```typescript
// Wait for initial render and clear any initial validations
await act(async () => {
  await vi.advanceTimersByTimeAsync(100);
});
validationCalls = [];

// Change field
const fieldA = screen.getByTestId("fieldA");
await act(async () => {
  await userEvent.type(fieldA, "test", { delay: null });
});

// Advance past debounce
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});

// Advance past async validation delay
await act(async () => {
  await vi.advanceTimersByTimeAsync(200);
});
```

## 7. Assertion Patterns

### Validation Call Filtering
```typescript
// CRITICAL ASSERTION: Only fieldA should have validated, NOT fieldB or fieldC
const fieldBValidations = validationCalls.filter((c) =>
  c.startsWith("fieldB"),
);
const fieldCValidations = validationCalls.filter((c) =>
  c.startsWith("fieldC"),
);

// These should be empty - fieldB and fieldC should NOT validate when only fieldA changed
expect(fieldBValidations).toHaveLength(0);
expect(fieldCValidations).toHaveLength(0);
```

### Submit Handler Verification
```typescript
// Should only submit ONCE with final value
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});

expect(submitHandler).toHaveBeenCalledWith(
  expect.objectContaining({
    fieldA: "hello",
  }),
);
```

### Async Ordering Verification
```typescript
// Verify submit happened AFTER validation completed
const submitIndex = validationLog.indexOf("submit");
const validationEndIndex = validationLog.lastIndexOf("validation:end");
expect(submitIndex).toBeGreaterThan(validationEndIndex);
```

### Negative Assertions
```typescript
// No submit yet
expect(submitHandler).not.toHaveBeenCalled();

// Submit should NOT be called (validation failed)
expect(submitHandler).not.toHaveBeenCalled();
```

## 8. Test Structure Conventions

### Test Naming
- Feature-focused naming: "should NOT validate ALL fields when ONE field changes"
- Clear intent: "should wait for async validators to complete before submitting"
- Specific behavior: "should reset debounce timer when new change comes in"

### Test Organization
```typescript
describe("AutoSave Validation Coordination", () => {
  // Setup shared mocks
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset state and setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe("ROOT CAUSE: All fields validating on any change", () => {
    // Specific test for root cause
  });

  describe("Dependent Field Validation", () => {
    // Tests for conditional validation
  });

  describe("Async Validation Waiting", () => {
    // Tests for async behavior
  });

  describe("Cascading Changes", () => {
    // Tests for debounce reset
  });

  describe("Validation Errors", () => {
    // Tests for error handling
  });
});
```

## 9. Common Test Scenarios

### 1. Root Cause Testing
Tests that verify the specific bug scenario - only changed fields should validate.

### 2. Dependent Field Testing
Tests conditional validation based on field dependencies.

### 3. Async Validation Ordering
Tests that async validation completes before submission.

### 4. Debounce Reset Testing
Tests that debounce timer resets on new changes.

### 5. Error Prevention Testing
Tests that submission doesn't happen on validation failure.

## 10. Key Patterns Summary

1. **Global tracking arrays** for monitoring validation/call patterns
2. **Structured test components** with `data-testid` attributes
3. **Consistent timer setup/teardown** with `vi.useFakeTimers`
4. **Sequential `act` wrapping** for async operations
5. **Clear assertion labeling** explaining what's being tested
6. **Negative assertions** to prove absence of unwanted behavior
7. **Order-based assertions** for async sequences
8. **Realistic user interaction** simulation with `userEvent`
9. **Debounce timing** that matches actual implementation
10. **Test isolation** through proper beforeEach/afterEach cleanup

These patterns ensure comprehensive testing of auto-save validation behavior, particularly focusing on preventing the root cause bug where all fields validate on any change.
