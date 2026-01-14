# Codebase Test Patterns Research

**Work Item:** P3.M3.T2.S1 - Test rapid changes
**Date:** 2026-01-13

---

## Overview

This document summarizes existing test patterns in the Formality codebase that are relevant for testing race conditions and rapid changes with autoSave.

---

## 1. Form Test Patterns

**File:** `packages/react/src/__tests__/Form.test.tsx`

### Key Patterns

1. **Wrapper Pattern**: Always wrap Form components with `FormalityProvider` for proper context
2. **Test Input Components**: Create custom test components with data-testid attributes
3. **Context Verification**: Use context consumer components to verify form state changes
4. **Render Function Testing**: Test that Form exposes methods via render prop children

```typescript
render(
  <FormalityProvider inputs={testInputs}>
    <Form config={config}>
      {({ methods, formState }) => (
        <div>
          <span data-testid="value">{methods.getValues("field")}</span>
        </div>
      )}
    </Form>
  </FormalityProvider>
);
```

---

## 2. AutoSave Test Patterns

**File:** `packages/react/src/__tests__/autosave-validation.test.tsx`

### Fake Timer Setup

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

### Rapid Changes Simulation

**Rapid Typing:**
```typescript
await act(async () => {
  await userEvent.type(fieldA, "hello", { delay: null });
});
```

**Rapid Clicks:**
```typescript
await act(async () => {
  await userEvent.click(switchField);
  await userEvent.type(textField, "a", { delay: null });
  await userEvent.click(switchField);
});
```

### Debounce Timing Control

```typescript
// Wait exactly past debounce period
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});

// Partial wait (should not submit)
await act(async () => {
  await vi.advanceTimersByTimeAsync(300);
});
```

### Verification Patterns

```typescript
// Only one submission for all typing
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});

// Verify final value
expect(submitHandler).toHaveBeenCalledWith(
  expect.objectContaining({
    fieldA: "hello",
  })
);
```

---

## 3. useSubscriptions Test Patterns

**File:** `packages/react/src/__tests__/useSubscriptions.test.tsx`

### Rapid Changes Test Pattern

```typescript
it("should handle rapid subscription changes without memory leaks", async () => {
  const { rerender, unmount } = renderHook(
    ({ subscriptions }) => useSubscriptions("field1", subscriptions),
    {
      wrapper,
      initialProps: { subscriptions: ["field2"] },
    },
  );

  // Simulate rapid subscription changes
  rerender({ subscriptions: ["field3"] });
  rerender({ subscriptions: ["field4"] });
  rerender({ subscriptions: ["field5"] });

  // Unmount to trigger final cleanup
  unmount();

  // Each cleanup should only remove its own run's subscriptions
  expect(mockContext.removeSubscription).toHaveBeenCalledWith("field2", "field1");
  expect(mockContext.removeSubscription).toHaveBeenCalledWith("field3", "field1");
  expect(mockContext.removeSubscription).toHaveBeenCalledWith("field4", "field1");
  expect(mockContext.removeSubscription).toHaveBeenCalledWith("field5", "field1");
});
```

### Subscription Count Tracking

```typescript
it("should maintain subscription count balance with 10+ rapid changes", () => {
  let addCount = 0;
  let removeCount = 0;

  // Override mocks to track counts
  const originalAdd = inspectableContext.addSubscription;
  inspectableContext.addSubscription = vi.fn((...args) => {
    addCount++;
    return originalAdd(...args);
  });

  // Perform 15 rapid changes
  for (let i = 0; i < 15; i++) {
    rerender({ subscriptions: [`field${i + 3}`] });
  }

  // Final state: should have balanced adds and removes
  expect(addCount).toBe(16);
  expect(removeCount).toBe(15);
});
```

---

## 4. Common Test Utilities

### Mock Context with Inspection

```typescript
const createInspectableContext = () => {
  const invertedSubscriptions = new Map<string, Set<string>>();

  const getInspectableState = () => ({
    invertedSubscriptions: new Map(invertedSubscriptions),
  });

  return {
    addSubscription: vi.fn((target, subscriber) => {
      if (!invertedSubscriptions.has(target)) {
        invertedSubscriptions.set(target, new Set());
      }
      invertedSubscriptions.get(target)!.add(subscriber);
    }),
    getInspectableState,
  };
};
```

### Async Validator with Tracking

```typescript
let validationCalls: string[] = [];

function createAsyncValidator(fieldName: string, delayMs: number = 50) {
  return async (value: unknown) => {
    validationCalls.push(`${fieldName}:start`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    validationCalls.push(`${fieldName}:end`);
    return true;
  };
}
```

---

## 5. Key Testing Principles

1. **Timer Control**: Always use `vi.useFakeTimers({ shouldAdvanceTime: true })` for timing-dependent tests
2. **Act Wrapping**: Wrap user interactions and timer advances in `act()` for proper React updates
3. **Rapid Input**: Use `{ delay: null }` in `userEvent.type()` for fastest input simulation
4. **WaitFor Assertions**: Use `waitFor()` for async assertions to ensure stability
5. **Partial Matching**: Use `expect.objectContaining()` for partial object matches
6. **Call Count Verification**: Verify exact number of submit/handler calls

---

## 6. Test File Naming and Location

Tests are located in: `packages/react/src/__tests__/`

Naming convention: `<feature>.test.tsx` or `<feature>.test.ts`

---

## References

- `packages/react/src/__tests__/useSubscriptions.test.tsx` - Lines 213-247 (rapid changes)
- `packages/react/src/__tests__/autosave-validation.test.tsx` - Lines 272-312 (debounce testing)
- `packages/react/src/components/Form.tsx` - Lines 475-556 (executeAutoSave implementation)
