# Form Component Debounce and InputConfig Implementation Analysis

Based on analysis of `/home/dustin/projects/formality/packages/react/src/components/Form.tsx`, here are the key findings:

## 1. changeField Function (Lines 299-321)

The `changeField` function receives an optional `inputConfig` parameter:

```typescript
const changeField = useCallback(
  (name: string, value: unknown, inputConfig?: InputConfig) => {
    // Auto-save trigger
    if (autoSave) {
      // Accumulate this change
      pendingChangedFields.current.add(name);

      // Add affected fields (those that depend on this field via conditions)
      const affected = getAffectedFields(name);
      for (const field of affected) {
        pendingAffectedFields.current.add(field);
      }

      // Trigger auto-save (immediate or debounced based on inputConfig)
      if (inputConfig?.debounce === false) {
        submitImmediate();
      } else {
        debouncedSubmit();
      }
    }
  },
  [autoSave, getAffectedFields],
);
```

**Key Points:**

- The function checks `inputConfig?.debounce === false` to determine if immediate submission is needed
- If `debounce: false` is set in inputConfig, it calls `submitImmediate()`
- Otherwise, it calls `debouncedSubmit()`

## 2. Immediate vs Debounced Submission Logic

The `useEffect` hook (Lines 525-558) handles the debounce configuration:

```typescript
useEffect(() => {
  // When debounce is false, use immediate execution (no debouncing)
  if (debounceMs === false) {
    const immediateFn = Object.assign(
      () => {
        executeAutoSave();
      },
      {
        cancel: () => {}, // No-op for immediate function
        flush: () => executeAutoSave(), // Execute immediately on flush
        pending: () => false, // Never pending when immediate
      },
    ) as DebouncedFunction;

    debouncedSubmitRef.current = immediateFn;

    return () => {
      // No cleanup needed for immediate function
    };
  }

  // Normal debounce behavior
  const debouncedFn = debounce(() => {
    executeAutoSave();
  }, debounceMs);

  // Attach lodash-style methods
  const fn = Object.assign(debouncedFn, {
    pending: () => false, // lodash debounce handles this internally
  }) as DebouncedFunction;

  debouncedSubmitRef.current = fn;

  return () => {
    debouncedFn.cancel();
  };
}, [executeAutoSave, debounceMs]);
```

## 3. autoSave and submitImmediate Functions

**autoSave**: This is a prop that defaults to `false`. When enabled, it triggers auto-saving on field changes.

**submitImmediate function** (Lines 564-566):

```typescript
const submitImmediate = useCallback(() => {
  debouncedSubmitRef.current?.flush();
}, []);
```

**Key Points:**

- When `debounce: false` is configured at the form level, the useEffect creates an immediate function
- This immediate function's `flush()` method directly calls `executeAutoSave()`
- When `debounce: false` is set at the field level via inputConfig, it calls `submitImmediate()` which flushes the debounced function
- For immediate functions, flush() just executes immediately since there's no delay

## 4. Code Paths Summary

**Immediate Submission Path:**

1. Field change triggers `changeField()` with `inputConfig?.debounce === false`
2. `changeField()` calls `submitImmediate()`
3. `submitImmediate()` calls `debouncedSubmitRef.current?.flush()`
4. For immediate functions, this directly executes `executeAutoSave()`

**Debounced Submission Path:**

1. Field change triggers `changeField()` without `debounce: false` in inputConfig
2. `changeField()` calls `debouncedSubmit()`
3. `debouncedSubmit()` calls `debouncedSubmitRef.current?.()`
4. This triggers the lodash debounce function with the configured delay

**Form Level Configuration:**

- Form-level `debounce: false` creates an immediate function in the useEffect
- Form-level `debounce: number` creates a standard debounce function
- Field-level `inputConfig.debounce: false` overrides form-level behavior for that specific field

## 5. Key Implementation Details

- **Two-layer debouncing**: Form-level debounce (via useEffect) and field-level debounce override (via inputConfig)
- **Immediate execution**: When `debounce: false` is used, the flush method executes immediately without delay
- **Context propagation**: The `submitImmediate` function is provided to the FormContext for use by child components
- **Execution version tracking**: The system uses `executionVersionRef` to handle race conditions when multiple auto-save operations are pending

## 6. Testing Implications

For testing `inputConfig.debounce === false` (immediate submission):

1. **When field has `inputConfig.debounce: false`**: The submitHandler should be called immediately after field change, WITHOUT advancing timers
2. **No fake timers needed**: Since execution is immediate, we can verify the submitHandler was called right after user interaction
3. **Use `vi.advanceTimersByTimeAsync(0)`**: To confirm no pending debounce timers exist
4. **Compare with debounced behavior**: Tests should show the contrast between immediate and debounced submission
