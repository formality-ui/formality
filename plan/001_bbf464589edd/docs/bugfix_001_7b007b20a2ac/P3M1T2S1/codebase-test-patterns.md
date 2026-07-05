# Research: Existing Test Patterns in Formality Codebase

**Work Item**: P3.M1.T2.S1 - Test unmount cleanup
**Research Date**: 2026-01-13

## Summary

This document summarizes existing test patterns in the Formality codebase relevant to testing unmount cleanup and subscription management.

## 1. Unmount/Cleanup Test Patterns

### Location

`/home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx`

### Basic Unmount Test Pattern

```typescript
const { rerender, unmount } = renderHook(
  ({ subscriptions }) => useSubscriptions("field1", subscriptions),
  {
    wrapper,
    initialProps: { subscriptions: ["field2"] as string[] },
  },
);

// Unmount to trigger cleanup
unmount();

// Assert cleanup was called
expect(mockContext.removeSubscription).toHaveBeenCalledWith("field2", "field1");
```

## 2. Per-Effect Cleanup Testing

### Test Pattern

```typescript
it("should only cleanup subscriptions from current effect run", async () => {
  const { rerender } = renderHook(
    ({ subscriptions }) => useSubscriptions("field1", subscriptions),
    {
      wrapper,
      initialProps: { subscriptions: ["field2"] as string[] },
    },
  );

  // Clear calls to check cleanup separately
  mockContext.addSubscription.mockClear();
  mockContext.removeSubscription.mockClear();

  // Rerender with different subscriptions
  rerender({ subscriptions: ["field3"] });

  // Only previous subscriptions should be cleaned up
  expect(mockContext.removeSubscription).toHaveBeenCalledWith(
    "field2",
    "field1",
  );
  // new subscriptions should not be cleaned up
  expect(mockContext.removeSubscription).not.toHaveBeenCalledWith(
    "field3",
    "field1",
  );
});
```

## 3. LIFO Cleanup Ordering Test

### Test Pattern

```typescript
it("should use LIFO cleanup ordering", () => {
  const { unmount } = renderHook(
    () => useSubscriptions("field1", ["field2", "field3", "field4"]),
    { wrapper },
  );

  // Subscriptions added in order: field2, field3, field4
  expect(mockContext.addSubscription).toHaveBeenNthCalledWith(
    1,
    "field2",
    "field1",
  );
  expect(mockContext.addSubscription).toHaveBeenNthCalledWith(
    2,
    "field3",
    "field1",
  );
  expect(mockContext.addSubscription).toHaveBeenNthCalledWith(
    3,
    "field4",
    "field1",
  );

  // Clear calls
  mockContext.removeSubscription.mockClear();

  // Unmount to trigger cleanup
  unmount();

  // LIFO cleanup: field4, field3, field2 (reverse order)
  expect(mockContext.removeSubscription).toHaveBeenNthCalledWith(
    1,
    "field4",
    "field1",
  );
  expect(mockContext.removeSubscription).toHaveBeenNthCalledWith(
    2,
    "field3",
    "field1",
  );
  expect(mockContext.removeSubscription).toHaveBeenNthCalledWith(
    3,
    "field2",
    "field1",
  );
});
```

## 4. Rapid Changes Memory Leak Test

### Test Pattern

```typescript
it("should handle rapid subscription changes without memory leaks", async () => {
  const { rerender, unmount } = renderHook(
    ({ subscriptions }) => useSubscriptions("field1", subscriptions),
    {
      wrapper,
      initialProps: { subscriptions: ["field2"] as string[] },
    },
  );

  // Simulate rapid subscription changes
  rerender({ subscriptions: ["field3"] });
  rerender({ subscriptions: ["field4"] });
  rerender({ subscriptions: ["field5"] });

  // Unmount to trigger final cleanup
  unmount();

  // All subscriptions should be cleaned up properly
  expect(mockContext.removeSubscription).toHaveBeenCalledWith(
    "field2",
    "field1",
  );
  expect(mockContext.removeSubscription).toHaveBeenCalledWith(
    "field3",
    "field1",
  );
  expect(mockContext.removeSubscription).toHaveBeenCalledWith(
    "field4",
    "field1",
  );
  expect(mockContext.removeSubscription).toHaveBeenCalledWith(
    "field5",
    "field1",
  );
});
```

## 5. React 18 Strict Mode Tests

### Double-Invocation Handling

```typescript
it("should handle React 18 Strict Mode double-invocation", () => {
  const strictModeWrapper = ({ children }: { children: React.ReactNode }) => (
    <StrictMode>
      <FormContext.Provider value={mockContext}>{children}</FormContext.Provider>
    </StrictMode>
  );

  const { unmount } = renderHook(
    () => useSubscriptions("field1", ["field2", "field3"]),
    { wrapper: strictModeWrapper },
  );

  // In StrictMode, effect runs twice (mount → unmount → mount)
  // But per-effect tracking prevents over-cleanup

  unmount();

  // All subscriptions should be cleaned up
  expect(mockContext.removeSubscription).toHaveBeenCalledWith("field2", "field1");
  expect(mockContext.removeSubscription).toHaveBeenCalledWith("field3", "field1");
});
```

## 6. Test Setup Patterns

### Mock Context Creation

```typescript
const createMockContext = () => {
  const mockAddSubscription = vi.fn();
  const mockRemoveSubscription = vi.fn();

  return {
    addSubscription: mockAddSubscription,
    removeSubscription: mockRemoveSubscription,
    // ... other context values
  };
};
```

### Wrapper Creation

```typescript
const createWrapper = (contextValue: ReturnType<typeof createMockContext>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
};
```

### Global Cleanup (setup.ts)

```typescript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

## 7. Test File Structure and Naming

- Test files: `packages/react/src/__tests__/`
- Naming: `[ComponentName].test.tsx` or `[HookName].test.tsx`
- Framework: Vitest
- Setup: `/home/dustin/projects/formality/packages/react/src/__tests__/setup.ts`

## Key Patterns for P3.M1.T2.S1

For testing unmount cleanup, follow these patterns:

1. **Use `unmount()` from renderHook()** to trigger cleanup
2. **Spy on `removeSubscription`** to verify cleanup calls
3. **Test rapid changes** to ensure no memory leaks
4. **Test in Strict Mode** for double-invocation handling
5. **Verify LIFO ordering** for correct cleanup sequence
6. **Use `mockClear()`** to isolate specific cleanup operations
7. **Test with multiple fields** to verify complete cleanup

## Data Structures to Verify

For complete cleanup verification in P3.M1.T2.S1:

1. **invertedSubscriptions** (Map): Should be empty after unmount
2. **runSubscriptionsRef** (Map): Should be empty after cleanup
3. **pendingWatcherUpdates** (Map): Should not contain unmounted subscriptions
4. **watcherSetters** (Map): Should not contain setters for unmounted fields
