# Research: External Testing Patterns for Unmount Cleanup and Memory Leaks

**Work Item**: P3.M1.T2.S1 - Test unmount cleanup
**Research Date**: 2026-01-13

## Summary

This document provides external research on testing patterns for unmount cleanup and memory leaks in React, with specific references and URLs.

## 1. React Testing Library Unmount Testing Patterns

### Basic Pattern

```typescript
const { unmount } = render(<Component />);
// ... test behavior
unmount();
// ... verify cleanup occurred
```

### For Hooks

```typescript
const { unmount } = renderHook(() => useCustomHook());
expect(cleanupSpy).not.toHaveBeenCalled();
unmount();
expect(cleanupSpy).toHaveBeenCalledTimes(1);
```

**Documentation**:

- [React Testing Library API - unmount](https://testing-library.com/docs/react-testing-library/api#unmount)
- [useEffect Documentation](https://react.dev/reference/react/useEffect)
- [React Effects Guide](https://react.dev/learn/synchronizing-with-effects)

## 2. Memory Leak Testing Patterns

### Key Approaches

1. **Subscription Count Tracking**: Verify counts return to zero after unmount
2. **Per-Effect Run Tracking**: Use unique IDs for each effect run
3. **Map Cleanup Verification**: Spy on `Map.prototype.delete` to verify cleanup
4. **Rapid Change Testing**: Test multiple rerenders to ensure no leaks

### WeakMap Pattern for Memory Leak Testing

```typescript
// Create a WeakMap to track component instances
const trackedInstances = new WeakMap();

// Track component mount
useEffect(() => {
  trackedInstances.set(componentInstance, true);

  return () => {
    // On unmount, verify cleanup
    trackedInstances.delete(componentInstance);
  };
});
```

### Map Cleanup Verification

```typescript
// Spy on Map operations
const deleteSpy = vi.spyOn(Map.prototype, "delete");

// Run test
const { unmount } = renderHook(() => useSubscriptions("field1", ["field2"]));
unmount();

// Verify cleanup
expect(deleteSpy).toHaveBeenCalled();
```

## 3. Console Warning/Error Testing in Vitest

### Pattern

```typescript
describe("console testing", () => {
  const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  // Trigger warning
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining("[useSubscriptions]"),
  );

  consoleSpy.mockRestore();
});
```

**Documentation**:

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)

### For P3.M1.T2.S1, Test:

- Development logging for subscription additions
- Development logging for subscription removals
- Double-cleanup detection warnings (from P3.M1.T1.S2)
- No console warnings about memory leaks

## 4. React Strict Mode Considerations

### Key Points

- Strict Mode mounts, unmounts, and remounts components in development
- Effects run twice
- Cleanup must be **idempotent** (safe to call multiple times)

### Testing Pattern

```typescript
const strictModeWrapper = ({ children }) => (
  <StrictMode>
    <FormContext.Provider value={mockContext}>
      {children}
    </FormContext.Provider>
  </StrictMode>
);

const { unmount } = renderHook(
  () => useSubscriptions('field1', ['field2']),
  { wrapper: strictModeWrapper }
);

// Should handle double-invocation gracefully
expect(() => unmount()).not.toThrow();
```

**Documentation**:

- [React Strict Mode](https://react.dev/reference/react/StrictMode)

## 5. Complete Cleanup Verification Pattern

### Pattern from React Testing Library

```typescript
it("should completely clean up all subscriptions on unmount", () => {
  // Track all subscription additions
  const subscriptionsAdded: string[] = [];
  const addSubscription = vi.fn((target, subscriber) => {
    subscriptionsAdded.push(`${subscriber}->${target}`);
  });

  // Track all subscription removals
  const subscriptionsRemoved: string[] = [];
  const removeSubscription = vi.fn((target, subscriber) => {
    subscriptionsRemoved.push(`${subscriber}->${target}`);
  });

  const wrapper = createWrapper({ addSubscription, removeSubscription });
  const { unmount } = renderHook(
    () => useSubscriptions("field1", ["field2", "field3", "field4"]),
    { wrapper },
  );

  // Verify subscriptions were added
  expect(subscriptionsAdded).toHaveLength(3);

  // Clear tracking
  subscriptionsRemoved.length = 0;

  // Unmount
  unmount();

  // Verify all subscriptions were removed
  expect(subscriptionsRemoved).toHaveLength(3);
  expect(subscriptionsAdded).toEqual(
    expect.arrayContaining(subscriptionsRemoved),
  );
});
```

## 6. Best Practices Summary

1. **Always test unmount cleanup** - Verify cleanup functions are called
2. **Use per-effect tracking** - Each effect run gets a unique ID
3. **Test in Strict Mode** - Ensure idempotent cleanup
4. **Spy on console methods** - Use `vi.spyOn(console, 'warn')` for logging tests
5. **Verify LIFO ordering** - Cleanup should happen in reverse order
6. **Test rapid changes** - Ensure no memory leaks during fast prop changes
7. **Check Map cleanup** - Verify tracking Maps are properly deleted
8. **Use WeakMap for tracking** - Allows garbage collection verification

## 7. URLs and References

### Official Documentation

- **React Testing Library API**: https://testing-library.com/docs/react-testing-library/api#unmount
- **useEffect Documentation**: https://react.dev/reference/react/useEffect
- **React Effects Guide**: https://react.dev/learn/synchronizing-with-effects
- **Strict Mode**: https://react.dev/reference/react/StrictMode
- **Vitest Mocking**: https://vitest.dev/guide/mocking.html

### External Resources

- **A Complete Guide to useEffect**: https://overreacted.io/a-complete-guide-to-useeffect/ (Dan Abramov)
- **Common Testing Mistakes**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- **Testing Library Cleanup**: https://testing-library.com/docs/react-testing-library/api#cleanup

### WeakMap Documentation

- **MDN WeakMap**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
- **Using WeakMap for Memory Leak Detection**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management

## 8. Recommended Tests for P3.M1.T2.S1

Based on external research, the following tests should be added:

1. **Complete cleanup verification** - All subscriptions removed after unmount
2. **WeakMap tracking test** - Using WeakMap to verify no references remain
3. **Map cleanup verification** - Verify runSubscriptionsRef is cleared
4. **Rapid changes stress test** - Multiple rapid rerenders + unmount
5. **Strict Mode double-invocation** - Ensure idempotent cleanup
6. **Console warning verification** - No memory leak warnings
7. **Multiple fields cleanup** - All fields in form clean up properly
8. **Nested subscriptions cleanup** - Complex dependency chains
