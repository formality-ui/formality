# External Testing Patterns for Rapid State Changes

## React Testing Library Patterns

### Pattern 1: Rapid State Updates with `act()`

```javascript
import { render, act } from '@testing-library/react';

test('handles rapid prop changes without memory leaks', async () => {
  const { rerender } = render(<Component data="initial" />);

  // Rapid prop changes
  for (let i = 0; i < 100; i++) {
    await act(async () => {
      rerender(<Component data={`update-${i}`} />);
    });
  }

  // Assert component still works correctly
  expect(screen.getByText(/update-99/)).toBeInTheDocument();
});
```

### Pattern 2: Testing Effect Cleanup on Rapid Changes

```javascript
test('cleanup function called on each rapid prop change', () => {
  const cleanup = jest.fn();
  const { rerender } = render(<Component id={1} onCleanup={cleanup} />);

  // Rapid updates
  for (let i = 0; i < 10; i++) {
    rerender(<Component id={i} onCleanup={cleanup} />);
  }

  // Should have called cleanup for each change
  expect(cleanup).toHaveBeenCalledTimes(10);
});
```

## Memory Leak Detection Patterns

### Pattern 3: Tracking Active Subscriptions

```javascript
test('does not leak subscriptions with rapid remounts', () => {
  let activeSubscriptions = 0;
  const createSubscription = () => {
    activeSubscriptions++;
    return () => { activeSubscriptions--; };
  };

  // Mount and unmount rapidly
  for (let i = 0; i < 50; i++) {
    const { unmount } = render(<Component subscribe={createSubscription} />);
    unmount();
  }

  // All subscriptions should be cleaned up
  expect(activeSubscriptions).toBe(0);
});
```

### Pattern 4: Memory Snapshot Comparison

```javascript
test('memory usage does not grow with rapid updates', () => {
  if (!performance.memory) {
    console.warn('performance.memory not available');
    return;
  }

  const initialMemory = performance.memory.usedJSHeapSize;

  const { rerender } = render(<Component data="test" />);

  // Perform rapid updates
  for (let i = 0; i < 100; i++) {
    rerender(<Component data={`test-${i}`} />);
  }

  const finalMemory = performance.memory.usedJSHeapSize;
  const memoryGrowth = finalMemory - initialMemory;

  // Memory growth should be reasonable (< 1MB)
  expect(memoryGrowth).toBeLessThan(1024 * 1024);
});
```

### Pattern 5: Subscription Counter

```javascript
test('subscription count remains balanced', () => {
  let subscribeCount = 0;
  let unsubscribeCount = 0;

  const mockSubscription = {
    subscribe: () => {
      subscribeCount++;
      return { unsubscribe: () => unsubscribeCount++ };
    }
  };

  const { rerender, unmount } = render(<Component source={mockSubscription} />);

  // Initial subscription
  expect(subscribeCount).toBe(1);
  expect(unsubscribeCount).toBe(0);

  // Rerender with same dependency - no new subscription
  rerender(<Component source={mockSubscription} />);
  expect(subscribeCount).toBe(1);

  // Rerender with new dependency - cleanup and resubscribe
  const newSource = {
    subscribe: () => {
      subscribeCount++;
      return { unsubscribe: () => unsubscribeCount++ };
    }
  };
  rerender(<Component source={newSource} />);
  expect(subscribeCount).toBe(2);
  expect(unsubscribeCount).toBe(1);

  // Unmount - final cleanup
  unmount();
  expect(subscribeCount).toBe(2);
  expect(unsubscribeCount).toBe(2);
});
```

## Best Practices Summary

1. **Always test cleanup functions** - Ensure every subscription/timer/listener is cleaned up
2. **Test rapid changes** - Use loops to simulate rapid prop/state changes
3. **Use `act()` wrapper** - Ensure all state updates are properly tracked
4. **Track subscription counts** - Verify no subscriptions leak over time
5. **Test remount scenarios** - Components should handle unmount/remount cycles
6. **Double-cleanup detection** - Add guards to prevent cleanup functions running twice
7. **Performance monitoring** - Use Performance API when available to detect memory growth
8. **Mock for deterministic tests** - Use jest.fn() to verify cleanup calls

## Relevant Documentation URLs

- [React Testing Library - rerender](https://testing-library.com/docs/react-testing-library/api#rerender)
- [useEffect Documentation](https://react.dev/reference/react/useEffect)
- [Performance API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Vitest Mocking](https://vitest.dev/guide/mocking.html)
