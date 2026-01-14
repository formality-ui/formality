# Research: Async Timing Test Patterns

**Work Item:** P3.M3.T2.S2 - Test async timing edge cases
**Date:** 2026-01-13

---

## Overview

This document compiles research findings on testing async timing edge cases in React/Vitest applications, specifically focused on the scenario where field value changes occur while async validation is in progress.

---

## 1. Change During Async Operation Patterns

### Core Pattern: Request Sequencing with Version/Token Tracking

```typescript
test('tracks operation versions to prevent staleness', async () => {
  let executionVersion = 0

  const validator = vi.fn(async (value) => {
    const myVersion = ++executionVersion
    await new Promise(resolve => setTimeout(resolve, 100))
    return { value, version: myVersion }
  })

  // Trigger multiple validations
  validator('a')
  await vi.advanceTimersByTimeAsync(50)
  validator('b')
  await vi.advanceTimersByTimeAsync(50)
  validator('c')
  await vi.runAllTimersAsync()

  // Only latest should be used
  const results = await validator.mock.results
  expect(results[2].value.version).toBe(3)
})
```

### Pattern: Latest-Only State Management

```typescript
test('only applies latest async result', async () => {
  let isLatest = false

  const asyncOperation = (id: number) =>
    new Promise(resolve =>
      setTimeout(() => {
        if (isLatest) resolve({ id, applied: true })
        else resolve({ id, applied: false })
      }, 100)
    )

  // Start operation 1
  const op1 = asyncOperation(1)

  // Mark operation 2 as latest and start it
  isLatest = true
  const op2 = asyncOperation(2)

  const [result1, result2] = await Promise.all([op1, op2])

  expect(result1.applied).toBe(false)
  expect(result2.applied).toBe(true)
})
```

---

## 2. Vitest Fake Timers with Overlapping Async Operations

### Pattern: Precise Timer Control

```typescript
test('overlapping async operations with fake timers', async () => {
  vi.useFakeTimers()

  const timestamps: number[] = []

  const scheduleOperation = (name: string, delay: number) => {
    setTimeout(() => {
      timestamps.push(Date.now())
    }, delay)
  }

  scheduleOperation('op1', 100)
  scheduleOperation('op2', 150)
  scheduleOperation('op3', 200)

  // Advance to first operation
  await vi.advanceTimersByTimeAsync(100)
  expect(timestamps).toHaveLength(1)

  // Advance to second operation
  await vi.advanceTimersByTimeAsync(50)
  expect(timestamps).toHaveLength(2)

  // Advance to final operation
  await vi.advanceTimersByTimeAsync(50)
  expect(timestamps).toHaveLength(3)

  vi.useRealTimers()
})
```

### Pattern: Async Timer Callbacks

```typescript
test('async timer callbacks with fake timers', async () => {
  vi.useFakeTimers()

  const results: string[] = []

  const asyncTimeout = (ms: number, value: string) =>
    new Promise(resolve =>
      setTimeout(() => {
        resolve(value)
      }, ms)
    )

  const promise1 = asyncTimeout(100, 'first')
  const promise2 = asyncTimeout(200, 'second')

  // Process first timer
  await vi.runAllTimersAsync()

  results.push(await promise1)
  results.push(await promise2)

  expect(results).toEqual(['first', 'second'])
  vi.useRealTimers()
})
```

---

## 3. React Testing Library Patterns for Async Timing Tests

### Pattern: waitFor with Custom Timeout

```typescript
test('async validation with waitFor', async () => {
  render(<FormWithAsyncValidation />)

  const input = screen.getByLabelText('Email')
  fireEvent.change(input, { target: { value: 'test@example.com' } })

  // Wait for validation to complete
  await waitFor(
    () => {
      expect(screen.getByText('Valid email')).toBeInTheDocument()
    },
    { timeout: 3000 }
  )
})
```

### Pattern: Loading State Testing

```typescript
test('shows loading during async validation', async () => {
  render(<FormWithAsyncValidation />)

  const input = screen.getByLabelText('Username')
  fireEvent.change(input, { target: { value: 'testuser' } })

  // Should show loading immediately
  expect(screen.getByText('Checking...')).toBeInTheDocument()

  // Wait for loading to disappear
  await waitFor(() => {
    expect(screen.queryByText('Checking...')).not.toBeInTheDocument()
  })

  // Should show result
  expect(screen.getByText('Username available')).toBeInTheDocument()
})
```

### Pattern: Multiple Async Updates

```typescript
test('handles rapid value changes', async () => {
  render(<FormWithAsyncValidation />)

  const input = screen.getByLabelText('Search')

  // Type multiple characters rapidly
  fireEvent.change(input, { target: { value: 'a' } })
  fireEvent.change(input, { target: { value: 'ab' } })
  fireEvent.change(input, { target: { value: 'abc' } })

  // Should debounce and only validate final value
  await waitFor(() => {
    expect(screen.getByText('Results for "abc"')).toBeInTheDocument()
  })

  // Earlier values should not trigger results
  expect(screen.queryByText('Results for "a"')).not.toBeInTheDocument()
  expect(screen.queryByText('Results for "ab"')).not.toBeInTheDocument()
})
```

---

## 4. Best Practices for Async Timing Tests

### 1. Always Use Async/Await

```typescript
// ❌ BAD: Fire and forget
fireEvent.change(input, { target: { value: 'test' } })

// ✅ GOOD: Await all async operations
await fireEvent.change(input, { target: { value: 'test' } })
await waitFor(() => {
  expect(result).toBe('expected')
})
```

### 2. Prefer findBy Queries Over getBy

```typescript
// ❌ BAD: Manual waiting with delay
await waitFor(() => {
  expect(screen.getByText('Result')).toBeInTheDocument()
}, { timeout: 1000 })

// ✅ GOOD: findBy automatically waits
const result = await screen.findByText('Result')
expect(result).toBeInTheDocument()
```

### 3. Control Time Explicitly

```typescript
// ❌ BAD: Real timers are unpredictable
await new Promise(resolve => setTimeout(resolve, 500))

// ✅ GOOD: Fake timers are deterministic
vi.useFakeTimers()
await vi.advanceTimersByTimeAsync(500)
vi.useRealTimers()
```

### 4. Test Race Conditions Explicitly

```typescript
test('handles concurrent operations', async () => {
  // Start multiple async operations concurrently
  const op1 = startOperation('a')
  const op2 = startOperation('b')
  const op3 = startOperation('c')

  // Verify correct operation wins
  await waitFor(() => {
    expect(result).toBe('c') // Latest value
  })
})
```

### 5. Mock Async Delays Appropriately

```typescript
// ✅ GOOD: Predictable delays in tests
const testValidator = async (value: string) => {
  await new Promise(resolve => setTimeout(resolve, 500)) // Fixed delay
  return validate(value)
}

// ❌ BAD: Variable delays make tests flaky
const testValidator = async (value: string) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))
  return validate(value)
}
```

### 6. Verify Intermediate States

```typescript
test('validates state transitions', async () => {
  const input = screen.getByTestId('field')

  // Initial state
  expect(input).toHaveValue('')
  expect(screen.queryByText('Validating')).not.toBeInTheDocument()

  // Start validation
  await userEvent.type(input, 'test')

  // Loading state
  expect(screen.getByText('Validating')).toBeInTheDocument()

  // Complete state
  await waitFor(() => {
    expect(screen.queryByText('Validating')).not.toBeInTheDocument()
    expect(screen.getByText('Valid')).toBeInTheDocument()
  })
})
```

---

## 5. Common Pitfalls and Solutions

### Pitfall 1: Not Using Fake Timers

**Problem:** Real timers cause flaky tests due to variable timing.

```typescript
// ❌ BAD: Real timers
test('validates async', async () => {
  await userEvent.type(input, 'test')
  await new Promise(resolve => setTimeout(resolve, 500)) // Unreliable
  expect(result).toBe('valid')
})
```

**Solution:** Always use fake timers for async timing tests.

```typescript
// ✅ GOOD: Fake timers
test('validates async', async () => {
  vi.useFakeTimers()
  await userEvent.type(input, 'test')
  await vi.advanceTimersByTimeAsync(500) // Reliable
  expect(result).toBe('valid')
  vi.useRealTimers()
})
```

### Pitfall 2: Not Wrapping Timer Advances in act()

**Problem:** React warnings about state updates outside act().

```typescript
// ❌ BAD: No act() wrapper
await vi.advanceTimersByTimeAsync(500)
```

**Solution:** Always wrap in act() for React components.

```typescript
// ✅ GOOD: act() wrapper
await act(async () => {
  await vi.advanceTimersByTimeAsync(500)
})
```

### Pitfall 3: Not Tracking Async Operation Order

**Problem:** Can't verify that operations were aborted.

```typescript
// ❌ BAD: No tracking
await userEvent.type(input, 'a')
await userEvent.type(input, 'b')
// Did 'a' validation complete? We don't know!
```

**Solution:** Track validation calls with arrays.

```typescript
// ✅ GOOD: Track calls
const validationCalls: string[] = []

const validator = async (value: unknown) => {
  validationCalls.push(`${value}:start`)
  await validate(value)
  validationCalls.push(`${value}:end`)
}

// Now we can verify order
expect(validationCalls).toEqual(['a:start', 'b:start', 'b:end'])
// Note: 'a:end' is missing because it was aborted
```

### Pitfall 4: Using Short Delays

**Problem:** Short delays make it hard to control timing for "change during operation" tests.

```typescript
// ❌ BAD: 50ms delay (too fast for precise control)
const validator = async (value: unknown) => {
  await new Promise(resolve => setTimeout(resolve, 50))
  return true
}
```

**Solution:** Use longer delays (500ms) for precise timing control.

```typescript
// ✅ GOOD: 500ms delay (enables precise control)
const validator = async (value: unknown) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  return true
}

// Now we can:
// 1. Start validation (0ms)
// 2. Advance 200ms (validation still running)
// 3. Change value (version increments, validation aborts)
// 4. Advance to complete
```

---

## 6. Triple-Change Scenario Pattern

The most critical test pattern for P3.M3.T2.S2:

```typescript
test('handles triple-change scenario', async () => {
  vi.useFakeTimers()

  const validationCalls: string[] = []

  // Create slow validator (500ms delay)
  const validator = async (value: unknown) => {
    validationCalls.push(`${value}:start`)
    await new Promise(resolve => setTimeout(resolve, 500))
    validationCalls.push(`${value}:end`)
    return true
  }

  render(<Form validator={validator} />)

  // STEP 1: Type "a" → start validation (500ms)
  await userEvent.type(input, 'a', { delay: null })

  // STEP 2: Advance 200ms (validation still running)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200)
  })

  // STEP 3: Type "b" → version increments, first validation aborts
  await userEvent.type(input, 'b', { delay: null })

  // STEP 4: Advance 200ms (second validation still running)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200)
  })

  // STEP 5: Type "c" → version increments, second validation aborts
  await userEvent.type(input, 'c', { delay: null })

  // STEP 6: Advance to complete
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600)
  })

  // ASSERT: Only final value submitted
  expect(submitHandler).toHaveBeenCalledWith({ field: 'abc' })

  // ASSERT: Intermediate validations were aborted
  expect(validationCalls).toEqual(['a:start', 'ab:start', 'abc:start', 'abc:end'])
  // Note: 'a:end' and 'ab:end' are missing (aborted)

  vi.useRealTimers()
})
```

---

## 7. Key Differences: Rapid Changes vs Async Timing

| Aspect | Rapid Changes Test | Async Timing Test |
|--------|-------------------|-------------------|
| **Scenario** | 10+ rapid changes within debounce | Change DURING async validation |
| **Validator Delay** | 50ms (fast) | 500ms (slow) |
| **Timing Control** | Simulate rapid typing | Precise 200ms advances |
| **Focus** | Debounce + version increment | Version checkpoints during validation |
| **Key Assertion** | Only last value submitted | Only final value after mid-validation changes |
| **Validation Calls** | Multiple start/end pairs | Missing end calls (aborted) |

---

## 8. Expected Test Outcomes

### Validation Call Order (Triple-Change Scenario)

```
Expected: ["a:start", "ab:start", "abc:start", "abc:end"]

NOT present (aborted):
- "a:end" (aborted at checkpoint 1)
- "ab:end" (aborted at checkpoint 1)

This proves that the version checkpoint in waitForFieldValidation
polling loop correctly aborts validations when version changes.
```

### Submission Behavior

```
Expected: 1 submission with value "abc"

NOT submitted:
- "a" (first validation aborted)
- "ab" (second validation aborted)

This proves all three version checkpoints work correctly.
```

---

## 9. References

### Internal Documentation

- `plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/docs/P3M3T1S1/research/external-race-condition-research.md` - Version token pattern research
- `plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M3T2S1/PRP.md` - Rapid changes test PRP

### Codebase References

- `packages/react/src/components/Form.tsx` - executionVersionRef implementation
  - Lines 441-469: waitForFieldValidation with version check in polling loop
  - Lines 475-556: executeAutoSave with three version checkpoints
- `packages/react/src/__tests__/autosave-validation.test.tsx` - Async validator patterns

### External Documentation

- [Vitest Timer Mocks](https://vitest.dev/guide/mocking/timers)
- [React Testing Library - act](https://testing-library.com/docs/react-testing-library/api/act)
- [React.dev - Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)

---

**Conclusion:** The async timing test patterns documented here provide a comprehensive foundation for testing the triple-change scenario (value1→validate→value2→validate→value3) with precise timing control using fake timers and validation call tracking.
