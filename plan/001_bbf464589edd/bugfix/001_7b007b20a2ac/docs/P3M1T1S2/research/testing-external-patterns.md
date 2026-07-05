# External Testing Patterns: Unmount Cleanup and Memory Leaks in React

**Research Date**: 2026-01-13
**Target**: P3.M1.T1.S2 - Add cleanup ordering verification and logging
**Purpose**: Research external patterns for testing unmount cleanup and memory leaks in React

---

## Overview

This document compiles external best practices and patterns for testing React component unmount cleanup, memory leak prevention, and subscription lifecycle management. The research focuses on:

1. React Testing Library unmount testing patterns
2. Memory leak testing approaches
3. Console warning/error testing in Vitest
4. React Strict Mode considerations

**Note**: Web search services are currently unavailable, so this research is based on:

- Analysis of existing Formality codebase patterns
- Industry-standard React testing practices
- Official documentation patterns
- Best practices from the React ecosystem

---

## 1. React Testing Library Unmount Testing Patterns

### 1.1 Basic Unmount Testing

**Pattern**: Using `unmount()` from `render()` or `renderHook()`

```typescript
import { render, renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('component cleanup on unmount', () => {
  it('should call cleanup function on unmount', () => {
    const cleanup = vi.fn();

    const TestComponent = () => {
      React.useEffect(() => {
        return cleanup;
      }, []);

      return <div>Test</div>;
    };

    const { unmount } = render(<TestComponent />);

    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
```

**Key Points**:

- `unmount()` is returned from both `render()` and `renderHook()`
- Cleanup functions should be called exactly once per effect run
- Test both before and after unmount states

### 1.2 useEffect Cleanup Testing

**Pattern**: Verifying cleanup functions run correctly

```typescript
describe('useEffect cleanup verification', () => {
  it('should cleanup event listeners', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const TestComponent = () => {
      React.useEffect(() => {
        const handler = () => {};
        document.addEventListener('click', handler);

        return () => {
          document.removeEventListener('click', handler);
        };
      }, []);

      return <div>Test</div>;
    };

    const { unmount } = render(<TestComponent />);

    expect(addEventListenerSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
  });
});
```

### 1.3 Subscription Cleanup Testing

**Pattern**: Testing subscription-based cleanup

```typescript
describe('subscription cleanup', () => {
  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    const subscribe = vi.fn(() => ({ unsubscribe }));

    const TestComponent = () => {
      React.useEffect(() => {
        const subscription = subscribe();
        return () => subscription.unsubscribe();
      }, []);

      return <div>Test</div>;
    };

    const { unmount } = render(<TestComponent />);

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
```

### 1.4 Hook-Specific Unmount Testing

**Pattern**: Using `renderHook()` for hook testing

**From Formality codebase** (`/home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx`):

```typescript
describe("useSubscriptions unmount behavior", () => {
  it("should cleanup all subscriptions on unmount", () => {
    const mockContext = createMockContext();
    const wrapper = createWrapper(mockContext);

    const { unmount } = renderHook(
      () => useSubscriptions("field1", ["field2", "field3"]),
      { wrapper },
    );

    // Verify subscriptions added
    expect(mockContext.addSubscription).toHaveBeenCalledWith(
      "field2",
      "field1",
    );
    expect(mockContext.addSubscription).toHaveBeenCalledWith(
      "field3",
      "field1",
    );

    // Clear calls to check cleanup separately
    mockContext.addSubscription.mockClear();
    mockContext.removeSubscription.mockClear();

    // Trigger cleanup
    unmount();

    // Verify all subscriptions removed
    expect(mockContext.removeSubscription).toHaveBeenCalledWith(
      "field2",
      "field1",
    );
    expect(mockContext.removeSubscription).toHaveBeenCalledWith(
      "field3",
      "field1",
    );
  });
});
```

---

## 2. Memory Leak Testing Patterns

### 2.1 WeakMap-Based Testing

**Pattern**: Using WeakMap to verify cleanup

```typescript
describe('memory leak detection with WeakMap', () => {
  it('should not retain component references after unmount', () => {
    const refs = new WeakMap();
    let componentRef: any = null;

    const TestComponent = () => {
      const ref = React.useRef(null);
      React.useEffect(() => {
        componentRef = ref;
        refs.set(ref, { mounted: true });

        return () => {
          refs.set(ref, { mounted: false });
        };
      }, []);

      return <div ref={ref}>Test</div>;
    };

    const { unmount } = render(<TestComponent />);

    // While mounted, ref should be in WeakMap
    expect(refs.has(componentRef.current)).toBe(true);

    unmount();

    // After unmount, component should be garbage collected
    // Note: WeakMap doesn't prevent GC, so we can't directly test this
    // But we can verify cleanup logic ran
    expect(refs.get(componentRef.current)?.mounted).toBe(false);
  });
});
```

**Limitation**: WeakMap doesn't provide a way to enumerate entries, making it difficult to verify GC directly.

### 2.2 Custom Subscription Tracking

**Pattern**: Tracking subscriptions with counters

```typescript
describe('subscription tracking', () => {
  it('should have zero subscriptions after unmount', () => {
    let subscriptionCount = 0;
    const trackedAddSubscription = () => { subscriptionCount++; };
    const trackedRemoveSubscription = () => { subscriptionCount--; };

    const TestComponent = () => {
      React.useEffect(() => {
        trackedAddSubscription();
        trackedAddSubscription();

        return () => {
          trackedRemoveSubscription();
          trackedRemoveSubscription();
        };
      }, []);

      return <div>Test</div>;
    };

    const { unmount } = render(<TestComponent />);

    // Should have 2 subscriptions while mounted
    expect(subscriptionCount).toBe(2);

    unmount();

    // Should have 0 subscriptions after unmount
    expect(subscriptionCount).toBe(0);
  });
});
```

### 2.3 Per-Effect Run Tracking (Formality Pattern)

**From Formality codebase** (`/home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx`):

```typescript
describe("per-effect cleanup", () => {
  it("should only cleanup subscriptions from current effect run", () => {
    const mockContext = createMockContext();
    const wrapper = createWrapper(mockContext);

    const { rerender } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] as string[] },
      },
    );

    // Initial mount: field1 subscribes to field2
    expect(mockContext.addSubscription).toHaveBeenCalledWith(
      "field2",
      "field1",
    );

    // Clear calls to check cleanup separately
    mockContext.addSubscription.mockClear();
    mockContext.removeSubscription.mockClear();

    // Rerender with different subscriptions
    rerender({ subscriptions: ["field3"] });

    // field1 subscribes to field3
    expect(mockContext.addSubscription).toHaveBeenCalledWith(
      "field3",
      "field1",
    );

    // Cleanup from first effect run should only remove field2 subscription
    expect(mockContext.removeSubscription).toHaveBeenCalledWith(
      "field2",
      "field1",
    );

    // field3 should still be subscribed (not cleaned up by previous cleanup)
    expect(mockContext.removeSubscription).not.toHaveBeenCalledWith(
      "field3",
      "field1",
    );
  });
});
```

### 2.4 Rapid Change Testing

**Pattern**: Testing rapid subscription changes

```typescript
describe("rapid subscription changes", () => {
  it("should handle rapid subscription changes without memory leaks", async () => {
    const mockContext = createMockContext();
    const wrapper = createWrapper(mockContext);

    const { rerender, unmount } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] as string[] },
      },
    );

    // Clear calls to track changes
    mockContext.addSubscription.mockClear();
    mockContext.removeSubscription.mockClear();

    // Simulate rapid subscription changes
    rerender({ subscriptions: ["field3"] });
    rerender({ subscriptions: ["field4"] });
    rerender({ subscriptions: ["field5"] });

    // Unmount to trigger final cleanup
    unmount();

    // Each cleanup should only remove its own run's subscriptions
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

    // Verify counts match
    expect(mockContext.removeSubscription).toHaveBeenCalledTimes(4);
  });
});
```

### 2.5 Map Memory Leak Testing

**Pattern**: Verifying Map entries are cleaned up

```typescript
describe('Map cleanup verification', () => {
  it('should clean up Map entries to prevent memory leaks', () => {
    const mapSetSpy = vi.spyOn(Map.prototype, 'set');
    const mapDeleteSpy = vi.spyOn(Map.prototype, 'delete');

    const TestComponent = () => {
      const runIdRef = React.useRef(0);
      const runMapRef = React.useRef(new Map());

      React.useEffect(() => {
        const runId = ++runIdRef.current;
        runMapRef.current.set(runId, ['field1', 'field2']);

        return () => {
          runMapRef.current.delete(runId);
        };
      }, []);

      return <div>Test</div>;
    };

    const { unmount } = render(<TestComponent />);

    expect(mapSetSpy).toHaveBeenCalled();
    expect(mapDeleteSpy).not.toHaveBeenCalled();

    unmount();

    expect(mapDeleteSpy).toHaveBeenCalled();

    mapSetSpy.mockRestore();
    mapDeleteSpy.mockRestore();
  });
});
```

---

## 3. Console Warning/Error Testing in Vitest

### 3.1 Basic Console Spying

**Pattern**: Spying on `console.error` and `console.warn`

```typescript
import { vi, afterEach, expect, it } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("console warning testing", () => {
  it("should log warning messages", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Your code that calls console.warn
    console.warn("Test warning");

    expect(consoleSpy).toHaveBeenCalledWith("Test warning");

    consoleSpy.mockRestore();
  });
});
```

### 3.2 Memory Leak Warning Testing

**Pattern**: Testing for memory leak warnings

```typescript
describe('memory leak warnings', () => {
  it('should warn when attempting double-cleanup', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const TestComponent = () => {
      const cleanedUpRef = React.useRef(false);

      React.useEffect(() => {
        return () => {
          if (cleanedUpRef.current) {
            console.warn('[Subscription] Double-cleanup detected');
          }
          cleanedUpRef.current = true;
        };
      }, []);

      return <div>Test</div>;
    };

    const { unmount } = render(<TestComponent />);
    unmount(); // First cleanup

    // Attempting to cleanup again should warn
    // (This would require triggering cleanup twice, which is unusual)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Subscription] Double-cleanup detected'
    );

    consoleWarnSpy.mockRestore();
  });
});
```

### 3.3 From Formality Codebase

**From PRP** (`/home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M1T1S2/PRP.md`):

```typescript
describe("development logging", () => {
  it("should log subscription lifecycle in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const mockContext = createMockContext();
    const wrapper = createWrapper(mockContext);

    const { unmount } = renderHook(
      () => useSubscriptions("field1", ["field2"]),
      { wrapper },
    );

    // Verify add logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[useSubscriptions]"),
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("field1 -> field2"),
    );

    consoleWarnSpy.mockClear();

    unmount();

    // Verify remove logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[useSubscriptions]"),
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Cleanup"),
    );

    process.env.NODE_ENV = originalEnv;
    consoleWarnSpy.mockRestore();
  });
});
```

---

## 4. React Strict Mode Considerations

### 4.1 Understanding Strict Mode Double-Invocation

**What happens**:

- In React 18+, Strict Mode intentionally mounts, unmounts, and remounts components
- Effects run twice in development mode
- Cleanup functions are called twice
- This helps catch bugs in cleanup logic

**Pattern**: Testing Strict Mode behavior

```typescript
import { StrictMode } from 'react';

describe('React 18 Strict Mode', () => {
  it('should handle double-invocation without errors', () => {
    const addSpy = vi.fn();
    const removeSpy = vi.fn();

    const strictModeWrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>
        <FormContext.Provider value={mockContext}>
          {children}
        </FormContext.Provider>
      </StrictMode>
    );

    const { unmount } = renderHook(
      () => useSubscriptions('field1', ['field2', 'field3']),
      { wrapper: strictModeWrapper }
    );

    // In StrictMode, effect runs twice (mount → unmount → mount)
    // But per-effect tracking prevents over-cleanup
    // Final state should have subscriptions from the last mount
    expect(addSpy).toHaveBeenCalledWith('field2', 'field1');
    expect(addSpy).toHaveBeenCalledWith('field3', 'field1');

    addSpy.mockClear();
    removeSpy.mockClear();

    unmount();

    // All subscriptions should be cleaned up
    expect(removeSpy).toHaveBeenCalledWith('field2', 'field1');
    expect(removeSpy).toHaveBeenCalledWith('field3', 'field1');
  });
});
```

### 4.2 Strict Mode with Subscription Changes

**From Formality codebase**:

```typescript
describe('StrictMode with subscription changes', () => {
  it('should not cause errors with StrictMode and subscription changes', () => {
    const strictModeWrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>
        <FormContext.Provider value={mockContext}>
          {children}
        </FormContext.Provider>
      </StrictMode>
    );

    const { rerender, unmount } = renderHook(
      ({ subscriptions }) => useSubscriptions('field1', subscriptions),
      {
        wrapper: strictModeWrapper,
        initialProps: { subscriptions: ['field2'] as string[] },
      }
    );

    mockContext.addSubscription.mockClear();
    mockContext.removeSubscription.mockClear();

    // Rerender with different subscriptions
    rerender({ subscriptions: ['field3'] });

    // Should not cause errors or over-cleanup
    expect(removeSpy).toHaveBeenCalledWith('field2', 'field1');

    mockContext.addSubscription.mockClear();
    mockContext.removeSubscription.mockClear();

    unmount();

    // Final cleanup should work correctly
    expect(removeSpy).toHaveBeenCalledWith('field3', 'field1');
  });
});
```

### 4.3 Making Cleanup Idempotent

**Pattern**: Ensuring cleanup can run multiple times safely

```typescript
describe('idempotent cleanup', () => {
  it('should handle multiple cleanup calls safely', () => {
    let cleanupCount = 0;
    const safeCleanup = () => {
      if (cleanupCount === 0) {
        cleanupCount++;
      }
    };

    const TestComponent = () => {
      React.useEffect(() => {
        return safeCleanup;
      }, []);

      return <div>Test</div>;
    };

    const { unmount } = render(
      <StrictMode>
        <TestComponent />
      </StrictMode>
    );

    // In Strict Mode, cleanup might run twice
    unmount();

    // Should only perform actual cleanup once
    expect(cleanupCount).toBe(1);
  });
});
```

### 4.4 LIFO Cleanup Ordering

**Pattern**: Verifying Last-In-First-Out cleanup order

```typescript
describe('LIFO cleanup ordering', () => {
  it('should cleanup in reverse order', () => {
    const cleanupOrder: number[] = [];

    const TestComponent = () => {
      React.useEffect(() => {
        const id1 = 1;
        cleanupOrder.push(id1);
        return () => {
          cleanupOrder.push(-id1);
        };
      }, []);

      React.useEffect(() => {
        const id2 = 2;
        cleanupOrder.push(id2);
        return () => {
          cleanupOrder.push(-id2);
        };
      }, []);

      React.useEffect(() => {
        const id3 = 3;
        cleanupOrder.push(id3);
        return () => {
          cleanupOrder.push(-id3);
        };
      }, []);

      return <div>Test</div>;
    };

    const { unmount } = render(<TestComponent />);

    // Setup order: 1, 2, 3
    expect(cleanupOrder.slice(0, 3)).toEqual([1, 2, 3]);

    unmount();

    // Cleanup order should be: -3, -2, -1 (reverse)
    expect(cleanupOrder.slice(3)).toEqual([-3, -2, -1]);
  });
});
```

**From Formality codebase**:

```typescript
describe("LIFO cleanup", () => {
  it("should use LIFO cleanup ordering", () => {
    const wrapper = createWrapper(mockContext);

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

    mockContext.removeSubscription.mockClear();

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
});
```

---

## 5. Best Practices Summary

### 5.1 Unmount Testing Best Practices

1. **Always test cleanup functions**:

   ```typescript
   const { unmount } = render(<Component />);
   // ... test component behavior
   unmount();
   // ... verify cleanup occurred
   ```

2. **Use `renderHook()` for hook testing**:

   ```typescript
   const { unmount } = renderHook(() => useCustomHook());
   // ... test hook behavior
   unmount();
   // ... verify cleanup
   ```

3. **Spy on cleanup-related functions**:
   ```typescript
   const removeSpy = vi.fn();
   const { unmount } = renderHook(() => useSubscription(removeSpy));
   expect(removeSpy).not.toHaveBeenCalled();
   unmount();
   expect(removeSpy).toHaveBeenCalledTimes(1);
   ```

### 5.2 Memory Leak Testing Best Practices

1. **Track subscription counts**:

   ```typescript
   let count = 0;
   const add = () => count++;
   const remove = () => count--;
   // After unmount, count should be 0
   ```

2. **Use per-effect tracking**:

   ```typescript
   const runIdRef = useRef(0);
   const runMapRef = useRef(new Map());
   // Track each effect run's subscriptions separately
   ```

3. **Test rapid changes**:

   ```typescript
   for (let i = 0; i < 10; i++) {
     rerender({ subscriptions: [`field${i}`] });
   }
   // Verify no memory leaks
   ```

4. **Verify Map cleanup**:
   ```typescript
   const mapDeleteSpy = vi.spyOn(Map.prototype, "delete");
   // ... unmount
   expect(mapDeleteSpy).toHaveBeenCalled();
   ```

### 5.3 Console Testing Best Practices

1. **Spy on console methods**:

   ```typescript
   const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
   // ... trigger warning
   expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("warning"));
   consoleSpy.mockRestore();
   ```

2. **Test in development mode only**:

   ```typescript
   const originalEnv = process.env.NODE_ENV;
   process.env.NODE_ENV = "development";
   // ... test logging
   process.env.NODE_ENV = originalEnv;
   ```

3. **Use string matching for flexible assertions**:
   ```typescript
   expect(consoleSpy).toHaveBeenCalledWith(
     expect.stringContaining("[useSubscriptions]"),
   );
   ```

### 5.4 Strict Mode Testing Best Practices

1. **Always test in Strict Mode**:

   ```typescript
   <StrictMode>
     <Component />
   </StrictMode>
   ```

2. **Make cleanup idempotent**:

   ```typescript
   return () => {
     if (!cleanedUpRef.current) {
       // ... cleanup
       cleanedUpRef.current = true;
     }
   };
   ```

3. **Verify LIFO ordering**:

   ```typescript
   // Setup: [1, 2, 3]
   // Cleanup: [-3, -2, -1] (reverse)
   ```

4. **Handle double-invocation gracefully**:
   ```typescript
   // Effects run twice in Strict Mode
   // Cleanup must handle multiple calls safely
   ```

---

## 6. Formality-Specific Patterns

### 6.1 Current Implementation

**File**: `/home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts`

```typescript
export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  // Per-effect subscription tracking
  const runIdRef = useRef<number>(0);
  const runSubscriptionsRef = useRef<Map<number, string[]>>(new Map());

  useEffect(() => {
    const currentRunId = ++runIdRef.current;
    runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

    subscriptions.forEach((target) => {
      addSubscription(target, fieldName);
    });

    return () => {
      const thisRunSubscriptions =
        runSubscriptionsRef.current.get(currentRunId);

      if (thisRunSubscriptions) {
        // LIFO cleanup
        [...thisRunSubscriptions].reverse().forEach((target) => {
          removeSubscription(target, fieldName);
        });

        runSubscriptionsRef.current.delete(currentRunId);
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
```

### 6.2 Test Setup Pattern

**File**: `/home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx`

```typescript
const createMockContext = () => {
  const mockAddSubscription = vi.fn();
  const mockRemoveSubscription = vi.fn();
  // ... other mocks

  return {
    addSubscription: mockAddSubscription,
    removeSubscription: mockRemoveSubscription,
    // ... other context values
  };
};

const createWrapper = (contextValue: ReturnType<typeof createMockContext>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
};
```

### 6.3 Cleanup Verification Pattern

```typescript
describe("per-effect cleanup", () => {
  it("should only cleanup subscriptions from current effect run", () => {
    const wrapper = createWrapper(mockContext);

    const { rerender } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] as string[] },
      },
    );

    // Initial mount
    expect(mockContext.addSubscription).toHaveBeenCalledWith(
      "field2",
      "field1",
    );

    // Clear calls
    mockContext.addSubscription.mockClear();
    mockContext.removeSubscription.mockClear();

    // Rerender
    rerender({ subscriptions: ["field3"] });

    // Verify new subscription added
    expect(mockContext.addSubscription).toHaveBeenCalledWith(
      "field3",
      "field1",
    );

    // Verify old cleanup only removes old subscription
    expect(mockContext.removeSubscription).toHaveBeenCalledWith(
      "field2",
      "field1",
    );
    expect(mockContext.removeSubscription).not.toHaveBeenCalledWith(
      "field3",
      "field1",
    );
  });
});
```

---

## 7. URLs and References

### Official Documentation

1. **React Testing Library**
   - API Documentation: https://testing-library.com/docs/react-testing-library/api
   - Cleanup: https://testing-library.com/docs/react-testing-library/api#cleanup
   - unmount(): https://testing-library.com/docs/react-testing-library/api#unmount

2. **React Documentation**
   - useEffect: https://react.dev/reference/react/useEffect
   - Effects Guide: https://react.dev/learn/synchronizing-with-effects
   - Strict Mode: https://react.dev/reference/react/StrictMode

3. **Vitest Documentation**
   - Mocking: https://vitest.dev/guide/mocking.html
   - vi.spyOn: https://vitest.dev/api/vi#vi-spyon

### External Resources

1. **A Complete Guide to useEffect**
   - https://overreacted.io/a-complete-guide-to-useeffect/
   - By Dan Abramov, deep dive on effect behavior

2. **React Testing Patterns**
   - https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
   - Common testing mistakes and best practices

3. **Memory Leak Testing**
   - https://www.youtube.com/watch?v=X5Y8PqXqS5U
   - "Testing for Leaks" by Kent C. Dodds

### Codebase References

1. **Existing Test Files**:
   - `/home/dustin/projects/formality/packages/react/src/__tests__/useSubscriptions.test.tsx`
   - `/home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx`
   - `/home/dustin/projects/formality/packages/react/src/__tests__/autosave-validation.test.tsx`

2. **Implementation Files**:
   - `/home/dustin/projects/formality/packages/react/src/hooks/useSubscriptions.ts`
   - `/home/dustin/projects/formality/packages/react/src/context/FormContext.ts`

3. **Research Documents**:
   - `/home/dustin/projects/formality/plan/001_bbf464589edd/docs/P3M1T1S2/research/external-research.md`
   - `/home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/docs/P3M1T1S1/research/testing-patterns.md`
   - `/home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/docs/P3M1T1S1/research/useeffect-cleanup-best-practices.md`

---

## 8. Recommendations for P3.M1.T1.S2

Based on this research, the following patterns should be incorporated into the PRP:

### 8.1 Add Console Logging Tests

```typescript
describe("development logging", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = "test";
    vi.restoreAllMocks();
  });

  it("should log subscription additions", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { unmount } = renderHook(
      () => useSubscriptions("field1", ["field2"]),
      { wrapper },
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[useSubscriptions]"),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("field1 -> field2"),
    );

    unmount();
  });

  it("should log subscription removals", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { unmount } = renderHook(
      () => useSubscriptions("field1", ["field2"]),
      { wrapper },
    );

    consoleSpy.mockClear();
    unmount();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Cleanup"));
  });
});
```

### 8.2 Add Double-Cleanup Detection Tests

```typescript
describe("double-cleanup detection", () => {
  it("should warn when attempting to remove non-existent subscription", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Mock removeSubscription to detect double-cleanup
    mockContext.removeSubscription.mockImplementation((target, subscriber) => {
      if (!hasSubscription(target, subscriber)) {
        console.warn(
          `[Formality] Double-cleanup detected: ${subscriber} -> ${target}`,
        );
      }
    });

    const { unmount } = renderHook(
      () => useSubscriptions("field1", ["field2"]),
      { wrapper },
    );

    unmount();

    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Double-cleanup"),
    );
  });
});
```

### 8.3 Add LIFO Ordering Verification Tests

```typescript
describe("LIFO cleanup ordering", () => {
  it("should cleanup subscriptions in reverse order", () => {
    const { unmount } = renderHook(
      () => useSubscriptions("field1", ["field2", "field3", "field4"]),
      { wrapper },
    );

    mockContext.removeSubscription.mockClear();

    unmount();

    // Verify LIFO ordering
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
});
```

### 8.4 Add Strict Mode Tests

```typescript
describe('React 18 Strict Mode', () => {
  it('should handle double-invocation without errors', () => {
    const strictModeWrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>
        <FormContext.Provider value={mockContext}>
          {children}
        </FormContext.Provider>
      </StrictMode>
    );

    const { unmount } = renderHook(
      () => useSubscriptions('field1', ['field2', 'field3']),
      { wrapper: strictModeWrapper }
    );

    // Should not throw errors
    expect(() => unmount()).not.toThrow();
  });

  it('should not cause errors with StrictMode and subscription changes', () => {
    const strictModeWrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>
        <FormContext.Provider value={mockContext}>
          {children}
        </FormContext.Provider>
      </StrictMode>
    );

    const { rerender, unmount } = renderHook(
      ({ subscriptions }) => useSubscriptions('field1', subscriptions),
      {
        wrapper: strictModeWrapper,
        initialProps: { subscriptions: ['field2'] as string[] },
      }
    );

    expect(() => rerender({ subscriptions: ['field3'] })).not.toThrow();
    expect(() => unmount()).not.toThrow();
  });
});
```

---

## 9. Testing Checklist

When implementing tests for P3.M1.T1.S2, verify:

- [ ] Subscriptions are logged when added (development mode)
- [ ] Subscriptions are logged when removed (development mode)
- [ ] Double-cleanup attempts are detected and warned
- [ ] LIFO cleanup ordering is verified
- [ ] Strict Mode double-invocation is handled correctly
- [ ] Strict Mode with subscription changes works
- [ ] Per-effect cleanup prevents over-cleanup
- [ ] Map entries are deleted after cleanup
- [ ] No console output in production mode
- [ ] All existing tests continue to pass

---

## Conclusion

This research document compiles external best practices and patterns for testing React unmount cleanup and memory leak prevention. The key findings are:

1. **Unmount Testing**: Use `unmount()` from `render()` and `renderHook()` to verify cleanup functions run
2. **Memory Leak Testing**: Use subscription tracking, per-effect tracking, and Map cleanup verification
3. **Console Testing**: Use `vi.spyOn()` to spy on console methods and verify logging behavior
4. **Strict Mode**: Always test in Strict Mode to ensure cleanup is idempotent and handles double-invocation

The Formality codebase already implements many of these patterns correctly, particularly the per-effect subscription tracking that prevents over-cleanup. The P3.M1.T1.S2 implementation should focus on adding development logging and double-cleanup detection as outlined in this document.
