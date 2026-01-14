# Codebase Test Patterns for Rapid Changes

## Existing Rapid Change Tests

### useSubscriptions.test.tsx

The most relevant existing tests for rapid changes are in `useSubscriptions.test.tsx`:

#### 1. Basic Rapid Changes Test (Line ~213)

```typescript
it("should handle rapid subscription changes without memory leaks", async () => {
  const { rerender, unmount } = renderHook(
    ({ subscriptions }) => useSubscriptions("field1", subscriptions),
    {
      wrapper,
      initialProps: { subscriptions: ["field2"] },
    }
  );

  // Simulate rapid subscription changes
  rerender({ subscriptions: ["field3"] });
  rerender({ subscriptions: ["field4"] });
  rerender({ subscriptions: ["field5"] });
});
```

**Pattern**: Uses `renderHook` with `rerender()` to rapidly change the subscriptions prop.

#### 2. Rapid Field Addition/Removal (Line ~603)

```typescript
it("should handle rapid field addition and removal", () => {
  const unmountFunctions: Array<() => void> = [];

  // Add multiple fields rapidly
  for (let i = 0; i < 5; i++) {
    const { unmount } = renderHook(
      () => useSubscriptions(`field${i}`, [`target${i}`]),
      { wrapper }
    );
    unmountFunctions.push(unmount);
  }

  // Unmount all fields
  unmountFunctions.forEach(fn => fn());
});
```

**Pattern**: Uses a loop to create multiple hook instances rapidly.

#### 3. Memory Leak Warning Detection (Line ~636)

```typescript
describe("no memory leak warnings", () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not warn about memory leaks with rapid changes", () => {
    const { rerender, unmount } = renderHook(
      ({ subscriptions }) => useSubscriptions("field1", subscriptions),
      {
        wrapper,
        initialProps: { subscriptions: ["field2"] },
      }
    );

    // Rapid changes
    rerender({ subscriptions: ["field3"] });
    rerender({ subscriptions: ["field4"] });
    rerender({ subscriptions: ["field5"] });

    // Clear logs
    vi.mocked(console.warn).mockClear();

    // Unmount
    unmount();

    // Verify no memory leak warnings
    const warnCalls = vi.mocked(console.warn).mock.calls;
    const memoryLeakWarnings = warnCalls.filter(call =>
      call[0]?.includes('memory leak') ||
      call[0]?.includes('orphaned')
    );

    expect(memoryLeakWarnings).toHaveLength(0);
  });
});
```

**Pattern**: Spies on `console.warn` to detect memory leak warnings.

### Field.test.tsx

Multiple uses of `rerender()` for testing prop changes:

- **Line 535**: Testing JSX prop overrides with rapid changes
- **Line 703**: Testing config prop changes with rerender
- **Line 889**: Testing field state changes with multiple rerenders
- **Line 1112**: Testing disabled state changes

## Subscription Tracking Patterns

### Inspectable Context Pattern

The `createInspectableContext()` helper allows tests to inspect Map state:

```typescript
const createInspectableContext = () => {
  const invertedSubscriptions = new Map<string, Set<string>>();
  const runSubscriptionsMap = new Map<number, string[]>();

  const mockAddSubscription = vi.fn((target: string, subscriber: string) => {
    if (!invertedSubscriptions.has(target)) {
      invertedSubscriptions.set(target, new Set());
    }
    invertedSubscriptions.get(target)!.add(subscriber);
  });

  const mockRemoveSubscription = vi.fn((target: string, subscriber: string) => {
    invertedSubscriptions.get(target)?.delete(subscriber);
  });

  const getInspectableState = () => ({
    invertedSubscriptions: new Map(invertedSubscriptions),
    runSubscriptionsMap: new Map(runSubscriptionsMap),
  });

  return {
    addSubscription: mockAddSubscription,
    removeSubscription: mockRemoveSubscription,
    getInspectableState,
  };
};
```

## Key Patterns to Follow

1. **Use `renderHook` with `rerender()`** for rapid prop changes
2. **Use inspectable Maps** to track subscription state
3. **Spy on `console.warn`** to detect memory leak warnings
4. **Test with 10+ rapid changes** to stress test the cleanup mechanism
5. **Verify final subscription count** matches expected state
6. **Use loops** to simulate rapid changes programmatically
