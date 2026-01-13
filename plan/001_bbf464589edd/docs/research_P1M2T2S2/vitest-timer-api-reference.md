# Vitest Timer API Reference for Debounce Testing

## Overview
This document provides a comprehensive reference for Vitest timer APIs used in testing debounce behavior.

## Core Timer APIs

### 1. vi.useFakeTimers({ shouldAdvanceTime: true })

**Purpose**: Replaces real timers with fake timers that can be controlled manually.

```typescript
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});
```

**Key Points**:
- `shouldAdvanceTime: true` allows timers to advance automatically when awaited
- Must be paired with `vi.useRealTimers()` for cleanup
- All setTimeout/setInterval calls use fake timers during test

### 2. vi.advanceTimersByTimeAsync(ms)

**Purpose**: Advances fake timers by a specified number of milliseconds.

```typescript
// Advance time by 600ms
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});
```

**Key Points**:
- Returns a Promise that resolves after timers execute
- Must be used when timer callbacks are async
- Should be wrapped in `act()` for React components
- Used to advance past debounce periods

### 3. vi.advanceTimersByTimeAsync(0)

**Purpose**: Advances timers by 0ms to flush microtasks without triggering delays.

```typescript
// Verify no pending timers
await act(async () => {
  await vi.advanceTimersByTimeAsync(0);
});
expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1 call
```

**Key Points**:
- Flushes Promise microtasks without triggering setTimeout callbacks
- Used to verify no pending debounce timers
- Confirms immediate execution occurred

### 4. vi.getTimerCount()

**Purpose**: Returns the number of pending timers.

```typescript
expect(vi.getTimerCount()).toBe(0); // No pending timers
expect(vi.getTimerCount()).toBe(1); // One pending timer
```

**Key Points**:
- Useful for debugging timer issues
- Verifies timer cleanup
- Confirms no timers created for immediate execution

## Testing Patterns

### Pattern 1: Test Normal Debounce

```typescript
it("should wait for debounce period before submitting", async () => {
  // Change field
  await act(async () => {
    await userEvent.type(field, "test", { delay: null });
  });

  // CRITICAL: No immediate submission
  expect(submitHandler).not.toHaveBeenCalled();

  // Advance past debounce (500ms + buffer)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });

  // NOW submission happens
  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });
});
```

### Pattern 2: Test Immediate Execution (debounce: false)

```typescript
it("should submit immediately with debounce: false", async () => {
  // Change field with debounce: false
  await act(async () => {
    await userEvent.type(field, "test", { delay: null });
  });

  // CRITICAL: Immediate submission WITHOUT timer advancement
  expect(submitHandler).toHaveBeenCalledTimes(1);

  // Verify no pending timers
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1
});
```

### Pattern 3: Test Debounce Reset

```typescript
it("should reset debounce timer on new changes", async () => {
  // First change
  await act(async () => {
    await userEvent.type(fieldA, "a", { delay: null });
  });

  // Partial debounce (300ms of 500ms)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  // Still no submission
  expect(submitHandler).not.toHaveBeenCalled();

  // Second change before debounce completes
  await act(async () => {
    await userEvent.type(fieldB, "b", { delay: null });
  });

  // Another 300ms (600ms total from first, 300ms from second)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  // STILL no submission (debounce restarted)
  expect(submitHandler).not.toHaveBeenCalled();

  // Final 300ms (completes debounce from second change)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  // NOW submission happens
  await waitFor(() => {
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });
});
```

## Common Gotchas

### Gotcha 1: Forgetting act() Wrapper

```typescript
// ❌ WRONG
await vi.advanceTimersByTimeAsync(600);

// ✅ CORRECT
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});
```

### Gotcha 2: Not Using Async Version

```typescript
// ❌ WRONG (sync version)
vi.advanceTimersByTime(600);

// ✅ CORRECT (async version for async callbacks)
await vi.advanceTimersByTimeAsync(600);
```

### Gotcha 3: Not Restoring Real Timers

```typescript
// ❌ WRONG (missing cleanup)
beforeEach(() => {
  vi.useFakeTimers();
});
// No afterEach!

// ✅ CORRECT
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});
```

### Gotcha 4: Wrong Time Advancement

```typescript
// For 500ms debounce:

// ❌ WRONG (exactly 500ms might race)
await vi.advanceTimersByTimeAsync(500);

// ✅ CORRECT (add buffer for reliability)
await vi.advanceTimersByTimeAsync(600);
```

## Timer Values Reference

| Scenario | Debounce | Advance By | Buffer |
|----------|----------|------------|--------|
| Normal debounce | 500ms | 600ms | +100ms |
| Normal debounce | 1000ms | 1100ms | +100ms |
| Short debounce | 100ms | 200ms | +100ms |
| Partial check | 500ms | 300ms | -200ms |
| Immediate check | 0ms | 0ms | 0ms |

## Official Documentation

- [Vitest Timers](https://vitest.dev/guide/mocking/timers)
- [vi API Reference](https://vitest.dev/api/vi)
