# Vitest Timer API Reference

## Overview

This document provides a comprehensive reference for Vitest's fake timer APIs, specifically focused on testing debounce behavior in the Formality codebase.

## Official Documentation

- **Vitest Timer Mocks**: https://vitest.dev/guide/mocking/timers
- **Vitest vi API**: https://vitest.dev/api/vi

---

## Timer Setup APIs

### vi.useFakeTimers()

Enables fake timers for the test suite.

```typescript
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
```

**Options**:

- `shouldAdvanceTime: boolean` - Whether time should advance automatically (default: false)
- `toFake: string[]` - Specific APIs to fake (default: all timers)
- `now: number | Date` - Initial time value

**Usage in Formality**:

```typescript
// From autosave-validation.test.tsx
beforeEach(() => {
  validationCalls = [];
  submitHandler = vi.fn();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
```

**Why `shouldAdvanceTime: true`?**

- Allows `setTimeout` callbacks to run synchronously when time advances
- Necessary for testing debounced functions that use `setTimeout`
- Without it, timers wouldn't fire even when advancing time

---

### vi.useRealTimers()

Restores real timers after fake timers are no longer needed.

```typescript
afterEach(() => {
  vi.useRealTimers();
});
```

**Critical**: Always call this in `afterEach` to prevent timer pollution between tests.

---

## Timer Advancement APIs

### vi.advanceTimersByTimeAsync(ms)

Advances fake timers by a specified number of milliseconds asynchronously.

```typescript
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});
```

**Parameters**:

- `ms`: number - Milliseconds to advance

**Returns**: Promise<void>

**Usage Pattern**:

```typescript
// Change field value
await userEvent.type(field, "test");

// No submission yet (debounce active)
expect(submitHandler).not.toHaveBeenCalled();

// Advance past debounce period
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});

// NOW submission happens
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});
```

**Key Point**: Must be wrapped in `act()` when used with React components.

---

### vi.advanceTimersByTime(ms)

Synchronous version of `advanceTimersByTimeAsync`.

```typescript
vi.advanceTimersByTime(600);
```

**When to use**: Only for non-React code or when you're certain no React state updates will occur.

**In Formality**: Always use `advanceTimersByTimeAsync` wrapped in `act()`.

---

### vi.runAllTimersAsync()

Runs ALL pending timers, including nested timers.

```typescript
await act(async () => {
  await vi.runAllTimersAsync();
});
```

**Warning**: Can cause infinite loops if timers recursively schedule themselves.

**Usage in Formality**: Avoid - use `advanceTimersByTimeAsync` with specific time values instead.

---

### vi.runOnlyPendingTimersAsync()

Runs only currently pending timers, not timers scheduled during execution.

```typescript
await act(async () => {
  await vi.runOnlyPendingTimersAsync();
});
```

**Usage in Formality**: Rarely needed - `advanceTimersByTimeAsync` is more predictable.

---

## Timer Inspection APIs

### vi.getTimerCount()

Returns the number of pending timers.

```typescript
expect(vi.getTimerCount()).toBe(0);
```

**Usage**: Verify no timers are pending after a test.

**In Formality**:

```typescript
// After immediate submission, no debounce timers should be pending
expect(vi.getTimerCount()).toBe(0);
```

---

### vi.getTimerCounts()

Returns count of each timer type.

```typescript
const counts = vi.getTimerCounts();
// { setTimeout: 2, setInterval: 0, setImmediate: 0 }
```

**Usage**: Detailed timer inspection for debugging.

---

## Testing Patterns for Debounce

### Pattern 1: Test Normal Debounce

```typescript
it("should debounce submission", async () => {
  render(<Form debounce={500} autoSave />);

  // Change field
  await userEvent.type(field, "test");

  // CRITICAL: No immediate submission
  expect(submitHandler).not.toHaveBeenCalled();

  // Advance to just before debounce completes
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });

  // STILL no submission
  expect(submitHandler).not.toHaveBeenCalled();

  // Advance past debounce
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });

  // NOW submission happens
  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });
});
```

**Key Assertions**:

1. `expect(submitHandler).not.toHaveBeenCalled()` before debounce completes
2. `expect(submitHandler).toHaveBeenCalledTimes(1)` after debounce completes

---

### Pattern 2: Test Debounce Coalescing

```typescript
it("should coalesce rapid changes", async () => {
  render(<Form debounce={500} autoSave />);

  // Type multiple characters rapidly
  await userEvent.type(field, "hello");

  // Advance past debounce
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });

  // Should only submit ONCE with final value
  expect(submitHandler).toHaveBeenCalledTimes(1);
  expect(submitHandler).toHaveBeenCalledWith(
    expect.objectContaining({ field: "hello" })
  );
});
```

**Key Point**: Rapid changes should result in single submission.

---

### Pattern 3: Test Debounce Timer Reset

```typescript
it("should reset debounce timer on new changes", async () => {
  render(<Form debounce={500} autoSave />);

  // First change
  await userEvent.type(field, "a");

  // Wait 300ms (less than debounce)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  // No submission yet
  expect(submitHandler).not.toHaveBeenCalled();

  // Second change before debounce completes
  await userEvent.type(field, "b");

  // Wait another 300ms (600ms total from first change)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  // STILL no submission (timer reset!)
  expect(submitHandler).not.toHaveBeenCalled();

  // Wait full debounce from second change
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  // NOW submission happens
  expect(submitHandler).toHaveBeenCalledTimes(1);
});
```

**Key Point**: Each change resets the debounce timer.

---

### Pattern 4: Test Immediate Submission (debounce: false)

```typescript
it("should submit immediately when debounce: false", async () => {
  render(
    <Form debounce={500} autoSave>
      <Field name="field" inputConfig={{ debounce: false }} />
    </Form>
  );

  // Wait for initial render
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  submitHandler.mockClear();

  // Change field
  await userEvent.type(field, "test");

  // CRITICAL: Should submit IMMEDIATELY
  // (only minimal delay for React state updates)
  expect(submitHandler).toHaveBeenCalledTimes(1);

  // Verify no pending timers
  expect(vi.getTimerCount()).toBe(0);
});
```

**Key Point**: No debounce delay, submission happens immediately.

---

## Timer Values Reference

### Common Debounce Values

| Value  | Use Case                | Test Buffer | Advance Time |
| ------ | ----------------------- | ----------- | ------------ |
| 1000ms | Default form debounce   | +100ms      | 1100ms       |
| 500ms  | Fast testing debounce   | +100ms      | 600ms        |
| 100ms  | Very fast debounce      | +50ms       | 150ms        |
| 0ms    | Immediate (no debounce) | 0ms         | 0ms          |

### Buffer Calculation

```typescript
const debounceMs = 500;
const bufferMs = 100; // Safety buffer
const advanceTime = debounceMs + bufferMs; // 600ms

await vi.advanceTimersByTimeAsync(advanceTime);
```

**Why add buffer?**

- Ensures timer callback has time to execute
- Accounts for microtask queue processing
- Prevents flaky tests due to timing edge cases

---

## React Testing Integration

### Always Use act()

```typescript
// CORRECT: Wrap timer advancement in act()
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});

// INCORRECT: Direct timer advancement without act()
await vi.advanceTimersByTimeAsync(600);
```

**Why?** React's `act()` ensures all state updates are flushed before assertions.

---

### waitFor with Timers

```typescript
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});
```

**When to use**:

- When timer advancement triggers async state updates
- When you need to wait for callback execution
- Default timeout is 1000ms (configurable)

---

## Common Gotchas

### Gotcha 1: Forgetting to Wrap in act()

```typescript
// WRONG
await vi.advanceTimersByTimeAsync(600);
expect(submitHandler).toHaveBeenCalled();

// RIGHT
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalled();
});
```

---

### Gotcha 2: Using Real Timers in Test

```typescript
// WRONG - Test will take actual time to run
it("test debounce", async () => {
  render(<Form debounce={500} />);
  await userEvent.type(field, "test");
  await new Promise(resolve => setTimeout(resolve, 600));
});

// RIGHT - Use fake timers
it("test debounce", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  render(<Form debounce={500} />);
  await userEvent.type(field, "test");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });
});
```

---

### Gotcha 3: Not Cleaning Up Timers

```typescript
// WRONG - Timers leak to next test
afterEach(() => {
  // No cleanup
});

// RIGHT - Always restore real timers
afterEach(() => {
  vi.useRealTimers();
});
```

---

### Gotcha 4: Advancing Exact Debounce Value

```typescript
// RISKY - May fail due to timing edge cases
await vi.advanceTimersByTimeAsync(500); // Exact debounce value

// SAFE - Always add buffer
await vi.advanceTimersByTimeAsync(600); // 500 + 100 buffer
```

---

## Formality-Specific Patterns

### Initial Render Pattern

```typescript
// Wait for initial render and clear any initial state
await act(async () => {
  await vi.advanceTimersByTimeAsync(100);
});
validationCalls = [];
submitHandler.mockClear();
```

**Why 100ms?**

- Allows React to complete initial render
- Flushes any initial useEffect callbacks
- Clears any startup timers

---

### userEvent with delay: null

```typescript
// Type without artificial delay between characters
await userEvent.type(field, "test", { delay: null });
```

**Why `delay: null`?**

- Default is to type with realistic delays
- `delay: null` types all characters instantly
- Prevents tests from taking longer than necessary
- More deterministic for testing debounce

---

### Validation + Debounce Pattern

```typescript
// When testing async validation with debounce
const asyncValidator = async (value: unknown) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return true;
};

render(<Form validator={asyncValidator} debounce={500} />);

// Change field
await userEvent.type(field, "test");

// Advance past debounce
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});

// Advance past async validation
await act(async () => {
  await vi.advanceTimersByTimeAsync(100);
});

// Now submit should have happened
expect(submitHandler).toHaveBeenCalledTimes(1);
```

**Key Point**: Must advance timers for BOTH debounce AND validation.

---

## Summary

**Primary APIs for Formality Testing**:

1. `vi.useFakeTimers({ shouldAdvanceTime: true })` - Setup
2. `vi.useRealTimers()` - Cleanup
3. `vi.advanceTimersByTimeAsync(ms)` - Advance time
4. `vi.getTimerCount()` - Inspect timers

**Always**:

- Wrap timer operations in `act()`
- Use `waitFor()` for assertions after timer advancement
- Add buffer to debounce values when advancing
- Clean up with `useRealTimers()` in `afterEach()`

**Never**:

- Use exact debounce values without buffer
- Forget to wrap timer operations in `act()`
- Skip cleanup in `afterEach()`
- Use `setTimeout` with real delays in tests
