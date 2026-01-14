# Codebase Test Patterns Research

**Work Item:** P3.M3.T2.S1 - Test rapid changes
**Date:** 2026-01-13

## Summary

This document summarizes the test patterns found in the Formality codebase that are relevant for testing rapid changes, fake timers, and race conditions.

---

## 1. Primary Test Files

### autosave-validation.test.tsx

**Location:** `packages/react/src/__tests__/autosave-validation.test.tsx`

This file is the PRIMARY reference for fake timer usage and auto-save testing patterns.

**Key Patterns:**

#### Fake Timer Setup (lines 87-95)
```typescript
beforeEach(() => {
  validationCalls = [];
  submitHandler = vi.fn();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});
```

**Critical Note:** `{ shouldAdvanceTime: true }` is REQUIRED for reliable timer behavior.

#### Timer Advancement Pattern
```typescript
// Always wrap in act() for React state updates
await act(async () => {
  await vi.advanceTimersByTimeAsync(600); // debounce + buffer
});
```

#### Debounce Testing (lines 272-312)
```typescript
it("should debounce multiple rapid changes and only submit once", async () => {
  // Type multiple characters rapidly
  await act(async () => {
    await userEvent.type(fieldA, "hello", { delay: null });
  });

  // Advance past debounce
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });

  // Should only submit ONCE with final value
  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });
});
```

#### Debounce Reset Testing (lines 313-375)
```typescript
it("should reset debounce timer when new change comes in", async () => {
  // First change
  await act(async () => {
    await userEvent.type(fieldA, "a", { delay: null });
  });

  // Wait less than debounce
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  // No submit yet
  expect(submitHandler).not.toHaveBeenCalled();

  // Second change resets timer
  await act(async () => {
    await userEvent.type(fieldB, "b", { delay: null });
  });

  // Still no submit after 600ms total (300 + 300)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(submitHandler).not.toHaveBeenCalled();

  // Submit after full debounce from second change
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(submitHandler).toHaveBeenCalledTimes(1);
});
```

#### Immediate Submission Pattern (lines 415-460)
```typescript
it("should call submitHandler immediately when inputConfig.debounce is false", async () => {
  // Wait for initial render
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  submitHandler.mockClear();

  // Change field with debounce: false
  await userEvent.type(field, "x");

  // Should submit IMMEDIATELY
  expect(submitHandler).toHaveBeenCalledTimes(1);
});
```

---

### useSubscriptions.test.tsx

**Location:** `packages/react/src/__tests__/useSubscriptions.test.tsx`

This file is the PRIMARY reference for rapid changes testing and stress testing.

#### Rapid Changes Test (lines 213-247)
```typescript
it("should handle rapid changes without memory leaks", () => {
  const wrapper = createWrapper(inspectableContext);

  // Track subscription counts
  let addCount = 0;
  let removeCount = 0;

  const originalAdd = inspectableContext.addSubscription;
  const originalRemove = inspectableContext.removeSubscription;

  inspectableContext.addSubscription = vi.fn((...args) => {
    addCount++;
    return originalAdd(...args);
  });

  inspectableContext.removeSubscription = vi.fn((...args) => {
    removeCount++;
    return originalRemove(...args);
  });

  const { rerender } = renderHook(
    ({ subscriptions }) => useSubscriptions("field1", subscriptions),
    {
      wrapper,
      initialProps: { subscriptions: ["field2"] },
    }
  );

  // Simulate rapid changes
  rerender({ subscriptions: ["field3"] });
  rerender({ subscriptions: ["field4"] });
  rerender({ subscriptions: ["field5"] });

  // Verify operations completed
  expect(addCount).toBe(4);  // 1 initial + 3 changes
  expect(removeCount).toBe(3); // 3 cleanup calls
});
```

#### Stress Test with 100 Rapid Changes (lines 903-951)
```typescript
it("should handle 100 rapid changes without issues (stress test)", () => {
  const { rerender } = renderHook(
    ({ subscriptions }) => useSubscriptions("field1", subscriptions),
    {
      wrapper,
      initialProps: { subscriptions: ["field2"] },
    }
  );

  // Stress test with 100 rapid changes
  for (let i = 0; i < 100; i++) {
    rerender({ subscriptions: [`field${(i % 10) + 3}`] });
  }

  // Verify no memory leak warnings
  const warnCalls = vi.mocked(console.warn).mock.calls;
  const memoryLeakWarnings = warnCalls.filter(call =>
    call[0]?.includes('memory leak') ||
    call[0]?.includes('orphaned')
  );
  expect(memoryLeakWarnings).toHaveLength(0);
});
```

---

## 2. Helper Component Patterns

### TestInput Component Pattern

From `autosave-validation.test.tsx`:

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
```

**Key Points:**
- Always include `data-testid` for reliable element selection
- Use `forwardRef` for ref forwarding
- Handle `value` being undefined with `?? ""`

---

## 3. Mock Function Patterns

### Mock Clear for Tracking New Calls

```typescript
// Clear calls to track only new operations
submitHandler.mockClear();

// Now perform operations
await userEvent.type(field, "test");

// Assert only new calls
expect(submitHandler).toHaveBeenCalledTimes(1);
```

### Mock with Call Tracking

```typescript
const submitLog: string[] = [];
const trackedSubmitHandler = (data: any) => {
  submitLog.push(`submit:${data.fieldA}`);
  submitHandler(data);
};

// Later verify submission order
expect(submitLog).toEqual(["submit:value1", "submit:value2"]);
```

### Validation Call Tracking

```typescript
let validationCalls: string[] = [];

const asyncValidator = async (value: unknown) => {
  validationCalls.push("field:start");
  await new Promise((resolve) => setTimeout(resolve, 50));
  validationCalls.push("field:end");
  return true;
};

// Later verify validation sequence
expect(validationCalls).toEqual([
  "fieldA:start",
  "fieldA:end",
]);
```

---

## 4. Async Validation Testing

### Slow Validator Pattern

```typescript
// Create validator that takes longer than debounce
const slowValidator = async (value: unknown) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return true;
};

// Use with short debounce to create overlap
<Form validator={slowValidator} debounce={100} autoSave>
```

This pattern allows testing rapid changes that occur while validation is in progress.

---

## 5. Common Timer Values

| Scenario | Debounce | Buffer | Advance Time |
|----------|----------|--------|--------------|
| Default form | 1000ms | +100ms | 1100ms |
| Fast testing | 500ms | +100ms | 600ms |
| Very fast | 100ms | +50ms | 150ms |
| Immediate | 0ms | 0ms | 0ms |
| Initial render | - | - | 100ms |

---

## 6. Test Structure Convention

### Import Order

```typescript
// 1. Vitest imports
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// 2. React imports
import React from "react";
import { forwardRef } from "react";

// 3. Testing library imports
import { render, screen, act, waitFor } from "@testing-library/react";

// 4. userEvent import
import userEvent from "@testing-library/user-event";

// 5. Component imports
import { Form, Field } from "../components/Form";
import { FormalityProvider } from "../components/FormalityProvider";

// 6. Type imports
import type { FormFieldsConfig } from "@formality-ui/core";
```

### Test Suite Structure

```typescript
describe("Feature Name - Specific Scenario", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should do something specific", async () => {
    // Test implementation
  });
});
```

---

## 7. Critical Gotchas

### Fake Timers
```typescript
// ✅ GOOD: Use shouldAdvanceTime
vi.useFakeTimers({ shouldAdvanceTime: true });

// ❌ BAD: Without this option, timers may not fire
vi.useFakeTimers();
```

### Timer Advancement
```typescript
// ✅ GOOD: Wrap in act()
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});

// ❌ BAD: Without act(), React may warn
await vi.advanceTimersByTimeAsync(600);
```

### Buffer Time
```typescript
// ✅ GOOD: Add buffer to debounce
await vi.advanceTimersByTimeAsync(600); // 500ms + 100ms buffer

// ❌ BAD: Exact timing may be flaky
await vi.advanceTimersByTimeAsync(500); // Exact debounce
```

### Rapid Input
```typescript
// ✅ GOOD: Fastest input simulation
await userEvent.type(field, "test", { delay: null });

// ❌ BAD: Has artificial delays
await userEvent.type(field, "test");
```

### Cleanup
```typescript
// ✅ GOOD: Always restore real timers
afterEach(() => {
  vi.useRealTimers();
});

// ❌ BAD: Pollutes other tests
afterEach(() => {
  // No cleanup
});
```

---

## 8. Assertion Patterns

### Call Count Verification
```typescript
// Specific count
expect(submitHandler).toHaveBeenCalledTimes(1);

// Not called yet
expect(submitHandler).not.toHaveBeenCalled();
```

### Value Verification
```typescript
// Partial object match
expect(submitHandler).toHaveBeenCalledWith(
  expect.objectContaining({
    fieldA: "expected value",
  })
);

// Exact match
expect(submitHandler).toHaveBeenCalledWith({
  fieldA: "value",
  fieldB: "value",
});
```

### Async Assertions
```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});
```

### Sequence Verification
```typescript
// Verify call order
expect(mockFn).toHaveBeenNthCalledWith(1, "first");
expect(mockFn).toHaveBeenNthCalledWith(2, "second");
```

---

## 9. Related Files

### Implementation Files
- `packages/react/src/components/Form.tsx` - Main Form component with executeAutoSave
- `packages/react/src/components/Field.tsx` - Field component with change handlers
- `packages/react/src/hooks/useSubscriptions.ts` - Subscription management

### Test Files
- `packages/react/src/__tests__/autosave-validation.test.tsx` - Fake timer patterns
- `packages/react/src/__tests__/useSubscriptions.test.tsx` - Rapid changes patterns
- `packages/react/src/__tests__/setup.ts` - Test configuration

### Research Files
- `plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M3T1S1/ANALYSIS.md` - executionVersionRef analysis
- `plan/001_bbf464589edd/docs/research/vitest-fake-timers-research.md` - Vitest timer research
- `plan/001_bbf464589edd/docs/research_P1M2T2S2/vitest-timer-api-reference.md` - Timer API reference
