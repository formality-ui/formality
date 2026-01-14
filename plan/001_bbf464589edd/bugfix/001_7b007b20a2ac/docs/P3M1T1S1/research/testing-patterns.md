# Testing Patterns for Memory Leak Prevention

## Overview

This document documents existing testing patterns in the Formality codebase relevant to memory leak prevention, subscription cleanup, and rapid change handling.

## Existing Test Infrastructure

### Test Setup

**File:** `packages/react/src/__tests__/setup.ts`

- Uses `@testing-library/react` cleanup after each test
- Standard vitest configuration

### Test Utilities

**Common imports:**
```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
```

## Relevant Testing Patterns Found

### 1. Timer Testing for Rapid Changes

**File:** `packages/react/src/__tests__/autosave-validation.test.tsx`
**Lines:** 87-95, 273-376

**Pattern:** Using fake timers to control time and test rapid typing

```typescript
describe("autosave with validation", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runAllTimersAsync();
    vi.useRealTimers();
  });

  it("should handle cascading changes with rapid typing", async () => {
    const user = userEvent.setup({ delay: null });

    render(<TestComponent />);

    const field1 = screen.getByTestId("field1");
    const field2 = screen.getByTestId("field2");

    // Rapid typing without delays
    await user.type(field1, "test");
    await user.type(field2, "value");

    // Advance time to trigger debounce
    await vi.advanceTimersByTimeAsync(500);

    // Assert results
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });
});
```

**Key Takeaways:**
- `vi.useFakeTimers({ shouldAdvanceTime: true })` - Enable fake timers
- `userEvent.setup({ delay: null })` - Remove typing delays
- `vi.advanceTimersByTimeAsync(ms)` - Advance time programmatically
- `vi.runAllTimersAsync()` - Run all pending timers in cleanup

### 2. Render Isolation Testing

**File:** `packages/react/src/__tests__/render-isolation.test.tsx`
**Lines:** 627-761

**Pattern:** Tracking render counts with useRef

```typescript
it("should not re-render unrelated fields", () => {
  const renderSpy = vi.fn();

  const TrackedField = ({ name }: { name: string }) => {
    const renderCountRef = useRef(0);
    renderCountRef.current++;
    renderSpy(name, renderCountRef.current);

    return <Field name={name} />;
  };

  render(
    <Form config={{ field1: { type: "textField" }, field2: { type: "textField" } }}>
      <TrackedField name="field1" />
      <TrackedField name="field2" />
    </Form>
  );

  renderSpy.mockClear();

  // Type in field1
  const user = userEvent.setup();
  await user.type(screen.getByTestId("field1"), "test");

  // field1 should have re-rendered, field2 should not
  expect(renderSpy).toHaveBeenCalledWith("field1", expect.any(Number));
  expect(renderSpy).not.toHaveBeenCalledWith("field2", expect.any(Number));
});
```

**Key Takeaways:**
- Use `useRef` to track render counts (doesn't trigger re-render)
- Use mock functions to capture render calls
- Test both positive (should render) and negative (should not render) cases

### 3. Rerender Testing

**File:** `packages/react/src/__tests__/Field.test.tsx`
**Lines:** 535-558, 703-722, 889-910, 1112-1140

**Pattern:** Using `rerender()` to test prop changes

```typescript
it("should update disabled state when conditions change", () => {
  const config: FormFieldsConfig = {
    field1: { type: "textField" },
    field2: {
      type: "textField",
      conditions: [
        {
          when: { field1: { is: "active" } },
          disabled: true,
        },
      ],
    },
  };

  const { rerender } = render(
    <Form config={config} record={{ field1: "inactive" }}>
      <Field name="field1" />
      <Field name="field2" />
    </Form>
  );

  // Initially not disabled
  expect(screen.getByTestId("field2")).not.toBeDisabled();

  // Rerender with different value
  rerender(
    <Form config={config} record={{ field1: "active" }}>
      <Field name="field1" />
      <Field name="field2" />
    </Form>
  );

  // Now disabled
  expect(screen.getByTestId("field2")).toBeDisabled();
});
```

**Key Takeaways:**
- Use `rerender()` to simulate prop changes
- Test state transitions (enabled → disabled, etc.)
- Use `toBeDisabled()` / `not.toBeDisabled()` for state verification

### 4. Async State Update Testing

**File:** `packages/react/src/__tests__/Field.test.tsx`
**Lines:** 869-911

**Pattern:** Using `waitFor` for async state updates

```typescript
it("should use AND logic for multi-field when conditions", async () => {
  const user = userEvent.setup();

  const config: FormFieldsConfig = {
    field1: { type: "textField" },
    field2: { type: "textField" },
    result: {
      type: "textField",
      conditions: [
        {
          when: { field1: { is: "active" }, field2: { is: "go" } },
          disabled: true,
        },
      ],
    },
  };

  render(
    <Form config={config}>
      <Field name="field1" />
      <Field name="field2" />
      <Field name="result" />
    </Form>
  );

  // Initially not disabled (conditions not met)
  expect(screen.getByTestId("result")).not.toBeDisabled();

  // Type in field1
  await user.type(screen.getByTestId("field1"), "active");

  // Still not disabled (field2 condition not met)
  expect(screen.getByTestId("result")).not.toBeDisabled();

  // Type in field2
  await user.type(screen.getByTestId("field2"), "go");

  // Wait for state update
  await waitFor(() => {
    expect(screen.getByTestId("result")).toBeDisabled();
  });
});
```

**Key Takeaways:**
- React state updates are async
- Use `waitFor()` to wait for DOM updates
- Test intermediate states, not just final state

## Missing Test Patterns (To Be Added)

### 1. Memory Leak Tests

**Pattern:** Verify no memory leaks after unmount

```typescript
describe("memory leak prevention", () => {
  it("should clean up all subscriptions on unmount", () => {
    // Track subscriptions using Form context
    let subscriptionCount = 0;

    const MockForm = () => {
      const { invertedSubscriptions } = useFormContext();
      subscriptionCount = invertedSubscriptions.current.size;

      return (
        <Form config={{ field1: { type: "textField" } }}>
          <Field name="field1" />
        </Form>
      );
    };

    const { unmount } = render(<MockForm />);

    // Subscriptions exist while mounted
    expect(subscriptionCount).toBeGreaterThan(0);

    unmount();

    // All subscriptions cleaned up
    expect(subscriptionCount).toBe(0);
  });

  it("should prevent memory leaks during rapid unmounts", async () => {
    const TestComponent = () => (
      <Form config={{ field1: { type: "textField" } }}>
        <Field name="field1" />
      </Form>
    );

    // Rapid mount/unmount cycles
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(<TestComponent />);
      await vi.advanceTimersByTimeAsync(10);
      unmount();
    }

    // Should not cause errors or memory growth
    expect(() => render(<TestComponent />)).not.toThrow();
  });
});
```

### 2. Per-Effect Cleanup Tests

**Pattern:** Verify per-effect cleanup works correctly

```typescript
describe("per-effect subscription tracking", () => {
  it("should only cleanup subscriptions from current effect run", () => {
    const addSpy = vi.fn();
    const removeSpy = vi.fn();

    // Mock addSubscription/removeSubscription
    const TestComponent = ({ subscriptions }: { subscriptions: string[] }) => {
      useSubscriptions("field1", subscriptions, {
        addSubscription: addSpy,
        removeSubscription: removeSpy,
      });

      return <div>Test</div>;
    };

    const { rerender } = render(<TestComponent subscriptions={["A", "B"]} />);

    // Initial subscriptions added
    expect(addSpy).toHaveBeenCalledTimes(2);

    addSpy.mockClear();
    removeSpy.mockClear();

    // Rerender with different subscriptions
    rerender(<TestComponent subscriptions={["A", "C"]} />);

    // Old cleanup (B removed) + new additions (C added)
    expect(removeSpy).toHaveBeenCalledWith("B", "field1");
    expect(addSpy).toHaveBeenCalledWith("C", "field1");

    // Cleanup on unmount should only remove current subscriptions
    const { unmount } = render(<TestComponent subscriptions={["X", "Y"]} />);
    unmount();

    // Should only clean up ["X", "Y"], not previous ["A", "C"]
    expect(removeSpy).toHaveBeenCalledWith("X", "field1");
    expect(removeSpy).toHaveBeenCalledWith("Y", "field1");
  });
});
```

### 3. React 18 Strict Mode Tests

**Pattern:** Verify behavior under Strict Mode double-invocation

```typescript
describe("React 18 Strict Mode", () => {
  it("should handle double-invocation without errors", () => {
    const addSpy = vi.fn();
    const removeSpy = vi.fn();

    const TestComponent = () => (
      <StrictMode>
        <Form config={{ field1: { type: "textField" } }}>
          <Field name="field1" />
        </Form>
      </StrictMode>
    );

    render(<TestComponent />);

    // In Strict Mode, effects run twice
    // Should handle cleanup correctly
    expect(() => render(<TestComponent />)).not.toThrow();
  });

  it("should not duplicate subscriptions in Strict Mode", () => {
    const TestComponent = () => (
      <StrictMode>
        <Form config={{ field1: { type: "textField" } }}>
          <Field name="field1" />
        </Form>
      </StrictMode>
    );

    const { unmount } = render(<TestComponent />);

    // Verify no duplicate subscriptions
    // (Implementation depends on how to inspect subscription registry)

    unmount();
    // Verify cleanup runs once per effect run
  });
});
```

### 4. Rapid Subscription Change Tests

**Pattern:** Test rapid subscription changes don't cause leaks

```typescript
describe("rapid subscription changes", () => {
  it("should handle rapid subscription changes without memory leaks", async () => {
    const TestComponent = ({ subscriptions }: { subscriptions: string[] }) => {
      return (
        <Form config={{ field1: { type: "textField" } }}>
          <Field name="field1" subscribesTo={subscriptions} />
        </Form>
      );
    };

    const { rerender } = render(<TestComponent subscriptions={["A"]} />);

    // Rapid subscription changes
    await waitFor(() => rerender(<TestComponent subscriptions={["A", "B"]} />));
    await waitFor(() => rerender(<TestComponent subscriptions={["B"]} />));
    await waitFor(() => rerender(<TestComponent subscriptions={["B", "C"]} />));
    await waitFor(() => rerender(<TestComponent subscriptions={["C"]} />));

    // Should not cause memory leaks or errors
    expect(() => rerender(<TestComponent subscriptions={[]} />)).not.toThrow();
  });
});
```

## Test Helper Functions

### Subscription Tracker

```typescript
// Helper to track subscription calls
function createSubscriptionTracker() {
  const additions: { target: string; subscriber: string }[] = [];
  const removals: { target: string; subscriber: string }[] = [];

  return {
    addSubscription: (target: string, subscriber: string) => {
      additions.push({ target, subscriber });
    },
    removeSubscription: (target: string, subscriber: string) => {
      removals.push({ target, subscriber });
    },
    getAdditions: () => [...additions],
    getRemovals: () => [...removals],
    clear: () => {
      additions.length = 0;
      removals.length = 0;
    },
    getNetSubscriptions: (target: string) => {
      const added = additions.filter((a) => a.target === target).length;
      const removed = removals.filter((r) => r.target === target).length;
      return added - removed;
    },
  };
}
```

### Memory Leak Detector (Conceptual)

```typescript
// Helper to detect potential memory leaks
function useMemoryLeakDetector(componentName: string) {
  const instanceCountRef = useRef(0);
  const mountCountRef = useRef(0);
  const unmountCountRef = useRef(0);

  useEffect(() => {
    instanceCountRef.current++;
    mountCountRef.current++;

    if (process.env.NODE_ENV === "development") {
      console.log(`[${componentName}] Mount #${mountCountRef.current}, Active: ${instanceCountRef.current}`);
    }

    return () => {
      instanceCountRef.current--;
      unmountCountRef.current++;

      if (process.env.NODE_ENV === "development") {
        console.log(`[${componentName}] Unmount #${unmountCountRef.current}, Active: ${instanceCountRef.current}`);
      }

      // Detect potential leak
      if (instanceCountRef.current < 0) {
        console.error(`[${componentName}] Memory leak detected! Negative instance count.`);
      }
    };
  });

  return {
    getActiveCount: () => instanceCountRef.current,
    getMountCount: () => mountCountRef.current,
    getUnmountCount: () => unmountCountRef.current,
  };
}
```

## Testing Checklist for Memory Leak Prevention

When implementing the per-effect subscription tracking, verify:

- [ ] Subscriptions are added when component mounts
- [ ] Subscriptions are removed when component unmounts
- [ ] Only subscriptions from the current effect run are cleaned up
- [ ] Rapid subscription changes don't cause memory leaks
- [ ] Empty subscriptions array is handled gracefully
- [ ] React 18 Strict Mode double-invocation works correctly
- [ ] Multiple components can subscribe to the same target
- [ ] Subscription cleanup order is correct (LIFO)
- [ ] Tracking data (Map) is cleaned up to prevent memory growth
- [ ] No errors occur during rapid mount/unmount cycles

## Recommended Test File Structure

```
packages/react/src/__tests__/
├── useSubscriptions.test.tsx        # Unit tests for the hook
│   ├── describe("basic functionality")
│   ├── describe("per-effect cleanup")
│   ├── describe("memory leak prevention")
│   ├── describe("React 18 Strict Mode")
│   └── describe("rapid changes")
│
└── memory-leaks.test.tsx            # Integration tests
    ├── describe("unmount cleanup")
    ├── describe("subscription lifecycle")
    └── describe("stress tests")
```
