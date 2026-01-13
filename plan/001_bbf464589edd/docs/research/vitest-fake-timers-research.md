# Vitest Fake Timers Research for Testing Immediate Execution vs Debounce

## Overview

This research document covers Vitest fake timer functionality for testing scenarios involving immediate execution versus debounced execution. Based on the existing codebase patterns and Vitest best practices, this guide provides comprehensive patterns for testing timer-dependent behavior.

## 1. Core Vitest Timer Functions

### vi.useFakeTimers()
Enables fake timers for testing, replacing `setTimeout`, `setInterval`, `clearTimeout`, and `clearInterval` with controlled versions.

```typescript
// Basic setup
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// With advanced options
beforeEach(() => {
  vi.useFakeTimers({
    shouldAdvanceTime: true, // Automatically advance time when timers are run
    advanceTimeDelta: 20    // Default time increment when auto-advancing
  });
});
```

### vi.advanceTimersByTimeAsync(ms)
Advances timers by a specific number of milliseconds asynchronously. This is the primary method for testing debounced behavior.

```typescript
// Advance past debounce period
await act(async () => {
  await vi.advanceTimersByTimeAsync(600); // 500ms debounce + buffer
});

// Advance multiple times
await act(async () => {
  await vi.advanceTimersByTimeAsync(300);  // Partial debounce
  // Perform another action
  await vi.advanceTimersByTimeAsync(300);  // Complete debounce
});
```

### vi.runAllTimersAsync()
Runs all pending timers immediately (regardless of their scheduled time).

```typescript
// Run all timers immediately
await act(async () => {
  await vi.runAllTimersAsync();
});
```

## 2. Testing Immediate Execution (No Delay)

### Pattern 1: Verify Immediate Call Without Timer Advancement

To test that a function was called immediately without waiting for any timers, check the mock call count before advancing any timers:

```typescript
describe('Immediate Execution', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFunction = vi.fn();
  });

  it('should call function immediately without debounce', async () => {
    const debouncedFunction = debounce(mockFunction, 500);

    // Call the function
    debouncedFunction('test');

    // Assert it was called immediately
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith('test');

    // No timers should have been set
    expect(vi.getTimerCount()).toBe(0);

    // Restore real timers
    vi.useRealTimers();
  });
});
```

### Pattern 2: Verify No Debounce Timer Was Started

To verify that NO debounce timer was started, check that no timers are pending:

```typescript
describe('No Debounce Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should not create any timers when debounce is disabled', () => {
    const debouncedFunction = debounce(mockFunction, 500);

    // Call with debounce disabled
    debouncedFunction('test', { immediate: true });

    // Verify no timers were created
    expect(vi.getTimerCount()).toBe(0);

    // Function was called immediately
    expect(mockFunction).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
```

## 3. Testing Debounced Execution

### Pattern 1: Standard Debounce Testing

```typescript
describe('Debounced Execution', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFunction = vi.fn();
  });

  it('should not call function immediately with debounce', () => {
    const debouncedFunction = debounce(mockFunction, 500);

    debouncedFunction('test');

    // Function should NOT have been called yet
    expect(mockFunction).not.toHaveBeenCalled();

    // Timer should be set
    expect(vi.getTimerCount()).toBe(1);

    vi.useRealTimers();
  });

  it('should call function after debounce period', async () => {
    const debouncedFunction = debounce(mockFunction, 500);

    debouncedFunction('test');

    // Function should not be called yet
    expect(mockFunction).not.toHaveBeenCalled();

    // Advance past debounce period
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // Function should now be called
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith('test');

    vi.useRealTimers();
  });
});
```

### Pattern 2: Debounce Reset Testing

```typescript
describe('Debounce Reset', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should reset debounce timer on subsequent calls', async () => {
    const debouncedFunction = debounce(mockFunction, 500);

    // First call
    debouncedFunction('first');

    // Advance partially (should not trigger)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mockFunction).not.toHaveBeenCalled();

    // Second call - should reset timer
    debouncedFunction('second');

    // Advance past original debounce (should still not trigger)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mockFunction).not.toHaveBeenCalled();

    // Advance past new debounce period
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // Should be called with latest value
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith('second');

    vi.useRealTimers();
  });
});
```

## 4. Advanced Timer Testing Patterns

### Pattern 1: Multiple Concurrent Timers

```typescript
describe('Multiple Concurrent Timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should handle multiple timers independently', async () => {
    const mock1 = vi.fn();
    const mock2 = vi.fn();

    const debounce1 = debounce(mock1, 300);
    const debounce2 = debounce(mock2, 500);

    // Start both timers
    debounce1('first');
    debounce2('second');

    // Check timers exist
    expect(vi.getTimerCount()).toBe(2);

    // Advance past first debounce but not second
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    // Only first should have fired
    expect(mock1).toHaveBeenCalledTimes(1);
    expect(mock2).not.toHaveBeenCalled();

    // Advance past second debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Both should have fired
    expect(mock1).toHaveBeenCalledTimes(1);
    expect(mock2).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
```

### Pattern 2: Conditional Execution Testing

```typescript
describe('Conditional Execution', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should skip timers when condition is met', () => {
    const mockFunction = vi.fn();
    const shouldSkip = vi.fn().mockReturnValue(true);

    const conditionalDebounce = debounce(mockFunction, 500, {
      shouldSkip,
    });

    conditionalDebounce('test');

    // Verify skip was checked
    expect(shouldSkip).toHaveBeenCalledWith('test');

    // No timer should be set when condition is true
    expect(vi.getTimerCount()).toBe(0);
    expect(mockFunction).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
```

## 5. Testing with React Act

When testing React components with debounced functions, wrap timer advancements in `act()`:

```typescript
describe('React Component with Debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    submitHandler = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce form submission', async () => {
    render(
      <Form onSubmit={submitHandler} debounce={500}>
        <Field name="fieldA" />
      </Form>
    );

    const input = screen.getByTestId("fieldA");

    // User types
    await act(async () => {
      await userEvent.type(input, "hello", { delay: null });
    });

    // Function should not be called yet
    expect(submitHandler).not.toHaveBeenCalled();

    // Advance past debounce period
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // Should be called with final value
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "hello",
        })
      );
    });
  });
});
```

## 6. Debugging Timer Issues

### Debug Pattern 1: Log Timer State

```typescript
const logTimerState = () => {
  console.log('Active timers:', vi.getTimerCount());
  console.log('Timer details:', vi.getTimerMock().getTimerCounts());
};
```

### Debug Pattern 2: Step-by-Step Advancement

```typescript
// Instead of jumping to final time:
await act(async () => {
  await vi.advanceTimersByTimeAsync(100);
  logTimerState();
  await vi.advanceTimersByTimeAsync(100);
  logTimerState();
  // Continue in small increments
});
```

## 7. Best Practices

1. **Always use `act()` with timer advancements** when testing React components
2. **Check timer counts** to verify expected timer behavior
3. **Use async/await** with `vi.advanceTimersByTimeAsync()` for proper sequencing
4. **Clean up timers** with `vi.useRealTimers()` in `afterEach`
5. **Test both positive and negative cases** (immediate vs debounced)
6. **Verify timer counts change** as expected during test execution
7. **Use small time increments** for debugging timer issues
8. **Combine with `waitFor()`** for testing async timer completion

## 8. Common Anti-Patterns to Avoid

1. **Don't call `vi.advanceTimersByTimeAsync()` without `act()`** when testing React
2. **Don't forget to restore real timers** in `afterEach`
3. **Don't assume timers are cleared automatically** - always verify with `vi.getTimerCount()`
4. **Don't use large time jumps** without understanding intermediate states
5. **Don't mix timer advancement patterns** (use consistently `async` or synchronous)

## 9. Real-world Examples from Codebase

Based on the existing autosave test patterns in `/packages/react/src/__tests__/autosave-validation.test.tsx`:

```typescript
// Example from codebase: Testing debounce reset
it("should reset debounce timer when new change comes in", async () => {
  // ... setup code

  // Change fieldA
  await act(async () => {
    await userEvent.type(fieldA, "a", { delay: null });
  });

  // Wait 300ms (less than debounce)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  // No submit yet
  expect(submitHandler).not.toHaveBeenCalled();

  // Change fieldB before debounce completes
  await act(async () => {
    await userEvent.type(fieldB, "b", { delay: null });
  });

  // Timer should have been reset, so no submit yet
  expect(submitHandler).not.toHaveBeenCalled();
});
```

## 10. Key Takeaways

1. **Immediate execution testing**: Verify calls before timer advancement and check for zero timers
2. **Debounce testing**: Verify no immediate calls, check timer count, then advance and verify delayed execution
3. **Reset testing**: Use partial timer advancement to verify timers are properly reset
4. **React integration**: Always wrap timer operations in `act()`
5. **Cleanup**: Always restore real timers in `afterEach`

This research provides comprehensive patterns for testing both immediate and debounced execution scenarios using Vitest fake timers, with practical examples based on real codebase patterns.