# Debounce Test Patterns in Codebase

## Summary of Existing Debounce Testing Patterns

After searching the entire codebase for debounce testing patterns, here are the findings:

### 1. No Explicit "debounce" Tests Exist

- There are no test files specifically named or dedicated to debounce functionality
- No tests explicitly searching for "debounce" in test file contents
- The codebase doesn't have dedicated debounce test files

### 2. Fake Timer Patterns Found

The primary testing pattern for timing/async behavior is found in:

- **File**: `/home/dustin/projects/formality/packages/react/src/__tests__/autosave-validation.test.tsx`

This file contains comprehensive examples of:

- `vi.useFakeTimers({ shouldAdvanceTime: true })` - Setting up fake timers
- `vi.advanceTimersByTimeAsync(ms)` - Advancing timers by milliseconds
- `await act()` wrapper around timer operations
- `waitFor()` for assertions after timing

### 3. Key Testing Patterns Identified

#### Timer Setup Pattern (autosave-validation.test.tsx:86-91):

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

#### Debounce Testing Pattern (autosave-validation.test.tsx:124-138):

```typescript
// Wait for initial render and clear any initial validations
await act(async () => {
  await vi.advanceTimersByTimeAsync(100);
});
validationCalls = [];

// Change field
const fieldA = screen.getByTestId("fieldA");
await act(async () => {
  await userEvent.type(fieldA, "x", { delay: null });
});

// Advance past debounce period
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});
```

#### Multiple Rapid Changes Pattern (autosave-validation.test.tsx:309-371):

Tests for debounce timer reset when new changes come in, including:

- Changing one field, waiting partial debounce time
- Changing another field before debounce completes
- Verifying debounce timer restarts
- Testing final submission with all values

### 4. Async Validation Patterns

- `await new Promise((r) => setTimeout(r, delay))` for creating async validators
- `validationLog` array to track validation execution order
- Verification that submit happens AFTER validation completes

### 5. SubmitHandler Verification Patterns

The codebase uses these key patterns for verifying when submitHandler is called:

1. **Not called before debounce completes:**

```typescript
// No submit yet
expect(submitHandler).not.toHaveBeenCalled();
```

2. **Called once after debounce:**

```typescript
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});
```

3. **Called with expected data:**

```typescript
expect(submitHandler).toHaveBeenCalledWith(
  expect.objectContaining({
    fieldA: "hello",
  }),
);
```

4. **Not called when validation fails:**

```typescript
// Submit should NOT be called (validation failed)
expect(submitHandler).not.toHaveBeenCalled();
```

5. **Timing verification (submit after validation):**

```typescript
// Verify submit happened AFTER validation completed
const submitIndex = validationLog.indexOf("submit");
const validationEndIndex = validationLog.lastIndexOf("validation:end");
expect(submitIndex).toBeGreaterThan(validationEndIndex);
```

### 6. No Immediate vs Delayed Execution Tests

- No existing tests specifically for `inputConfig.debounce === false` vs `inputConfig.debounce = number`
- No tests for immediate submission vs delayed submission
- No tests comparing behavior with and without debounce

### 7. Conclusion

The codebase has a solid foundation for testing debounce behavior through the autosave-validation test file, which demonstrates:

1. Proper fake timer setup and cleanup
2. Testing both single and multiple rapid field changes
3. Verifying debounce timing and reset behavior
4. Testing coordination between validation and submission
5. Using `act()` wrapper around timer operations

However, there are no specific tests for the immediate execution behavior (`inputConfig.debounce === false`) that will be needed for the current feature implementation. The existing patterns provide an excellent template to build upon for creating comprehensive tests for the new debounce: false functionality.
