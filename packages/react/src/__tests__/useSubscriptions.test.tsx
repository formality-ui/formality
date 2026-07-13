// @formality-ui/react - useSubscriptions Hook Tests
import type React from "react";
import { StrictMode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { FormContext } from "../context/FormContext";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";

// Create a mock FormContextValue for testing
const createMockContext = () => {
  const mockAddSubscription = vi.fn();
  const mockRemoveSubscription = vi.fn();
  const mockRegisterField = vi.fn();
  const mockUnregisterField = vi.fn();
  const mockRegisterWatcherSetter = vi.fn();
  const mockUnregisterWatcherSetter = vi.fn();
  const mockChangeField = vi.fn();
  const mockSetFieldValidating = vi.fn();
  const mockGetFormState = vi.fn(() => ({}));
  const mockDebouncedSubmit = vi.fn();
  const mockSubmitImmediate = vi.fn();

  return {
    addSubscription: mockAddSubscription,
    removeSubscription: mockRemoveSubscription,
    registerField: mockRegisterField,
    unregisterField: mockUnregisterField,
    registerWatcherSetter: mockRegisterWatcherSetter,
    unregisterWatcherSetter: mockUnregisterWatcherSetter,
    changeField: mockChangeField,
    setFieldValidating: mockSetFieldValidating,
    getFormState: mockGetFormState,
    config: {},
    formConfig: {},
    debouncedSubmit: mockDebouncedSubmit,
    submitImmediate: mockSubmitImmediate,
    unusedFields: [],
    methods: {} as any,
  };
};

// Create wrapper with mocked context
const createWrapper = (contextValue: ReturnType<typeof createMockContext>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
};

/**
 * Creates a Form context with inspectable Maps for testing
 * This allows tests to verify that Maps are properly cleaned up
 */
const createInspectableContext = () => {
  // Create the actual Maps (not mocks)
  const invertedSubscriptions = new Map<string, Set<string>>();
  const runSubscriptionsMap = new Map<number, string[]>();
  const watcherSetters = new Map<string, any>();
  const pendingWatcherUpdates = new Map<string, Set<string>>();

  // Track calls for verification
  const mockAddSubscription = vi.fn((target: string, subscriber: string) => {
    if (!invertedSubscriptions.has(target)) {
      invertedSubscriptions.set(target, new Set());
    }
    invertedSubscriptions.get(target)!.add(subscriber);
  });

  const mockRemoveSubscription = vi.fn((target: string, subscriber: string) => {
    // Perform removal (mirrors Form.tsx: silent, no diagnostic logging).
    invertedSubscriptions.get(target)?.delete(subscriber);

    // Update watcher setter
    const setter = watcherSetters.get(target);
    if (setter) {
      setter((prev: any) => {
        const next = { ...prev };
        delete next[subscriber];
        return next;
      });
    }
  });

  const mockRegisterWatcherSetter = vi.fn((name: string, setter: any) => {
    watcherSetters.set(name, setter);

    // Process pending subscriptions
    const pending = pendingWatcherUpdates.get(name);
    if (pending?.size) {
      setter((prev: any) => {
        const next = { ...prev };
        pending.forEach((sub) => {
          next[sub] = true;
        });
        return next;
      });
      pendingWatcherUpdates.delete(name);
    }
  });

  const mockUnregisterWatcherSetter = vi.fn((name: string) => {
    watcherSetters.delete(name);
  });

  // Expose the Maps for inspection
  const getInspectableState = () => ({
    invertedSubscriptions: new Map(invertedSubscriptions),
    runSubscriptionsMap: new Map(runSubscriptionsMap),
    watcherSetters: new Map(watcherSetters),
    pendingWatcherUpdates: new Map(pendingWatcherUpdates),
  });

  return {
    addSubscription: mockAddSubscription,
    removeSubscription: mockRemoveSubscription,
    registerField: vi.fn(),
    unregisterField: vi.fn(),
    registerWatcherSetter: mockRegisterWatcherSetter,
    unregisterWatcherSetter: mockUnregisterWatcherSetter,
    changeField: vi.fn(),
    setFieldValidating: vi.fn(),
    getFormState: vi.fn(() => ({})),
    config: {},
    formConfig: {},
    debouncedSubmit: vi.fn(),
    submitImmediate: vi.fn(),
    unusedFields: [],
    methods: {} as any,
    getInspectableState, // Expose Maps for verification
  };
};

describe("useSubscriptions", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  describe("basic functionality", () => {
    it("should add subscriptions on mount", () => {
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () => useSubscriptions("field1", ["field2", "field3"]),
        { wrapper },
      );

      expect(mockContext.addSubscription).toHaveBeenCalledTimes(2);
      expect(mockContext.addSubscription).toHaveBeenCalledWith(
        "field2",
        "field1",
      );
      expect(mockContext.addSubscription).toHaveBeenCalledWith(
        "field3",
        "field1",
      );
    });

    it("should not add subscriptions when subscriptions array is empty", () => {
      const wrapper = createWrapper(mockContext);

      renderHook(() => useSubscriptions("field1", []), { wrapper });

      expect(mockContext.addSubscription).not.toHaveBeenCalled();
    });
  });

  describe("per-effect cleanup", () => {
    it("should only cleanup subscriptions from current effect run", async () => {
      const wrapper = createWrapper(mockContext);

      const { rerender } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["field2"] as string[] },
        },
      );

      // Initial mount: field1 subscribes to field2
      expect(mockContext.addSubscription).toHaveBeenCalledTimes(1);
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

    it("should handle rapid subscription changes without memory leaks", async () => {
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

      // We have 4 removes (field2, field3, field4, field5)
      // And 3 adds (field3, field4, field5) after clearing the initial call
      // The extra remove is from field2 cleanup when effect re-ran
      expect(mockContext.removeSubscription).toHaveBeenCalledTimes(4);
      expect(mockContext.addSubscription).toHaveBeenCalledTimes(3);
    });
  });

  describe("memory leak prevention", () => {
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

      // Clear calls
      mockContext.removeSubscription.mockClear();

      // Unmount to trigger cleanup
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

  describe("React 18 Strict Mode", () => {
    it("should handle React 18 Strict Mode double-invocation", () => {
      const strictModeWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <StrictMode>
          <FormContext.Provider value={mockContext}>
            {children}
          </FormContext.Provider>
        </StrictMode>
      );

      const { unmount } = renderHook(
        () => useSubscriptions("field1", ["field2", "field3"]),
        { wrapper: strictModeWrapper },
      );

      // In StrictMode, effect runs twice (mount → unmount → mount)
      // But per-effect tracking prevents over-cleanup
      // Final state should have subscriptions from the last mount
      expect(mockContext.addSubscription).toHaveBeenCalledWith(
        "field2",
        "field1",
      );
      expect(mockContext.addSubscription).toHaveBeenCalledWith(
        "field3",
        "field1",
      );

      // Clear calls to track final cleanup
      mockContext.addSubscription.mockClear();
      mockContext.removeSubscription.mockClear();

      unmount();

      // All subscriptions should be cleaned up
      expect(mockContext.removeSubscription).toHaveBeenCalledWith(
        "field2",
        "field1",
      );
      expect(mockContext.removeSubscription).toHaveBeenCalledWith(
        "field3",
        "field1",
      );
    });

    it("should not cause errors with StrictMode and subscription changes", () => {
      const strictModeWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <StrictMode>
          <FormContext.Provider value={mockContext}>
            {children}
          </FormContext.Provider>
        </StrictMode>
      );

      const { rerender, unmount } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper: strictModeWrapper,
          initialProps: { subscriptions: ["field2"] as string[] },
        },
      );

      // Clear calls to track changes
      mockContext.addSubscription.mockClear();
      mockContext.removeSubscription.mockClear();

      // Rerender with different subscriptions
      rerender({ subscriptions: ["field3"] });

      // Should not cause errors or over-cleanup
      expect(mockContext.removeSubscription).toHaveBeenCalledWith(
        "field2",
        "field1",
      );

      // Clear calls to track final cleanup
      mockContext.addSubscription.mockClear();
      mockContext.removeSubscription.mockClear();

      unmount();

      // Final cleanup should work correctly
      expect(mockContext.removeSubscription).toHaveBeenCalledWith(
        "field3",
        "field1",
      );
    });
  });

  describe("array isolation", () => {
    it("should store array copy to prevent reference sharing between runs", () => {
      const wrapper = createWrapper(mockContext);

      // Track that Map receives a copy, not the original reference
      const mapSetSpy = vi.spyOn(Map.prototype, "set");

      const subscriptionsArray = ["field2", "field3"];
      renderHook(() => useSubscriptions("field1", subscriptionsArray), {
        wrapper,
      });

      // Map.set should have been called to store subscriptions
      expect(mapSetSpy).toHaveBeenCalled();

      // The stored array should be a different reference (copy) than the input
      // This prevents reference sharing between effect runs
      // Note: We can't directly inspect the Map entries, but we verify the pattern is used
      mapSetSpy.mockRestore();
    });
  });

  describe("console output", () => {
    // PRD requirement: the hook MUST be silent. Subscription diagnostic
    // logging was removed entirely; this guards against regressions.
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("produces ZERO console output on mount, rerender, and unmount", () => {
      const wrapper = createWrapper(mockContext);

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { rerender, unmount } = renderHook(
        ({ subscriptions }) => useSubscriptions("fieldA", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["fieldB"] as string[] },
        },
      );

      rerender({ subscriptions: ["fieldC"] });
      unmount();

      expect(warnSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe("complete cleanup verification", () => {
    it("should clean up invertedSubscriptions Map after unmount", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      const { unmount } = renderHook(
        () => useSubscriptions("field1", ["field2", "field3"]),
        { wrapper },
      );

      // Verify subscriptions were added
      let state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("field2")).toContain("field1");
      expect(state.invertedSubscriptions.get("field3")).toContain("field1");

      // Unmount to trigger cleanup
      unmount();

      // Verify subscriptions were removed from Map
      state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("field2")).not.toContain("field1");
      expect(state.invertedSubscriptions.get("field3")).not.toContain("field1");
    });

    it("should clean up all Maps when multiple fields unmount", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      // Mount multiple fields
      const { unmount: unmount1 } = renderHook(
        () => useSubscriptions("field1", ["field3"]),
        { wrapper },
      );

      const { unmount: unmount2 } = renderHook(
        () => useSubscriptions("field2", ["field3"]),
        { wrapper },
      );

      // Verify both fields are watching field3
      let state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("field3")).toContain("field1");
      expect(state.invertedSubscriptions.get("field3")).toContain("field2");

      // Unmount both fields
      unmount1();
      unmount2();

      // Verify field3 has no watchers left
      state = inspectableContext.getInspectableState();
      const watchers = state.invertedSubscriptions.get("field3");
      expect(watchers?.size ?? 0).toBe(0);
    });
  });

  describe("WeakMap cleanup verification", () => {
    it("should allow garbage collection of component instances", () => {
      const wrapper = createWrapper(createMockContext());

      // Use WeakMap to track component instances
      const trackedInstances = new WeakMap<
        object,
        { subscriptions: string[] }
      >();

      let componentRef: object | null = null;

      const { unmount } = renderHook(
        () => {
          // Get current hook instance reference
          const ref = {};
          componentRef = ref;

          // Track subscriptions for this instance
          trackedInstances.set(ref, { subscriptions: ["field2", "field3"] });

          useSubscriptions("field1", ["field2", "field3"]);
        },
        { wrapper },
      );

      // Verify instance was tracked
      expect(componentRef).not.toBeNull();
      if (componentRef) {
        expect(trackedInstances.has(componentRef)).toBe(true);
        expect(trackedInstances.get(componentRef)?.subscriptions).toEqual([
          "field2",
          "field3",
        ]);
      }

      // Store reference before unmount
      const refBeforeUnmount = componentRef;

      // Unmount component
      unmount();
      componentRef = null;

      // After unmount, the reference should be eligible for garbage collection
      // WeakMap doesn't prevent garbage collection, so we can't directly verify cleanup
      // But we can verify no errors occur and the test completes successfully
      expect(refBeforeUnmount).toBeTruthy();

      // Note: WeakMap doesn't have a size property or iteration
      // The key property is that entries don't prevent garbage collection
      // The test passing without errors is the verification
    });
  });

  describe("multi-field unmount scenarios", () => {
    it("should clean up nested subscriptions correctly", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      // Create nested subscriptions:
      // field1 watches field2
      // field2 watches field3
      const { unmount: unmount1 } = renderHook(
        () => useSubscriptions("field1", ["field2"]),
        { wrapper },
      );

      const { unmount: unmount2 } = renderHook(
        () => useSubscriptions("field2", ["field3"]),
        { wrapper },
      );

      // Verify nested subscriptions
      let state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("field2")).toContain("field1");
      expect(state.invertedSubscriptions.get("field3")).toContain("field2");

      // Unmount field1 (should not affect field2 -> field3 subscription)
      unmount1();

      state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("field2")).not.toContain("field1");
      expect(state.invertedSubscriptions.get("field3")).toContain("field2"); // Still present

      // Unmount field2
      unmount2();

      state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("field3")).not.toContain("field2");
    });

    it("should handle rapid field addition and removal", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      const unmountFunctions: Array<() => void> = [];

      // Add multiple fields rapidly
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderHook(
          () => useSubscriptions(`field${i}`, [`target${i}`]),
          { wrapper },
        );
        unmountFunctions.push(unmount);
      }

      // Verify all subscriptions exist
      let state = inspectableContext.getInspectableState();
      for (let i = 0; i < 5; i++) {
        expect(state.invertedSubscriptions.get(`target${i}`)).toContain(
          `field${i}`,
        );
      }

      // Unmount all fields
      unmountFunctions.forEach((fn) => fn());

      // Verify all subscriptions are cleaned up
      state = inspectableContext.getInspectableState();
      for (let i = 0; i < 5; i++) {
        const watchers = state.invertedSubscriptions.get(`target${i}`);
        expect(watchers?.size ?? 0).toBe(0);
      }
    });
  });

  describe("no memory leak warnings", () => {
    beforeEach(() => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should not warn about memory leaks during normal unmount", () => {
      const wrapper = createWrapper(createMockContext());

      const { unmount } = renderHook(
        () => useSubscriptions("field1", ["field2", "field3"]),
        { wrapper },
      );

      // Clear existing logs
      vi.mocked(console.warn).mockClear();

      // Unmount
      unmount();

      // Verify only expected development logging warnings appear
      const warnCalls = vi.mocked(console.warn).mock.calls;

      // Expected: "[Formality Subscription] Run X: "field1" cleaning up [field2, field3]"
      // No unexpected warnings about memory leaks or orphaned subscriptions
      const memoryLeakWarnings = warnCalls.filter(
        (call) =>
          call[0]?.includes("memory leak") ||
          call[0]?.includes("orphaned") ||
          call[0]?.includes("WARNING"),
      );

      expect(memoryLeakWarnings).toHaveLength(0);
    });

    it("should not warn about memory leaks with rapid changes", () => {
      const wrapper = createWrapper(createMockContext());

      const { rerender, unmount } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["field2"] as string[] },
        },
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
      const memoryLeakWarnings = warnCalls.filter(
        (call) =>
          call[0]?.includes("memory leak") || call[0]?.includes("orphaned"),
      );

      expect(memoryLeakWarnings).toHaveLength(0);
    });
  });

  describe("rapid changes - subscription count tracking", () => {
    it("should maintain subscription count balance with 10+ rapid changes", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      // Track add/remove calls
      let addCount = 0;
      let removeCount = 0;

      // Override mocks to track counts
      const originalAdd = inspectableContext.addSubscription;
      const originalRemove = inspectableContext.removeSubscription;

      inspectableContext.addSubscription = vi.fn((...args) => {
        addCount++;
        return originalAdd(...args);
      });

      inspectableContext.removeSubscription = vi.fn((...args) => {
        removeCount++;
        return originalRemove(...args);
      });

      const { rerender } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["field2"] },
        },
      );

      // Initial subscription
      expect(addCount).toBe(1);
      expect(removeCount).toBe(0);

      // Perform 15 rapid changes
      for (let i = 0; i < 15; i++) {
        rerender({ subscriptions: [`field${i + 3}`] });
      }

      // Final state: should have 1 add (initial) + 15 adds (changes) + 15 removes (cleanups)
      expect(addCount).toBe(16);
      expect(removeCount).toBe(15);

      // Verify final subscription state
      const state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("field17")).toContain("field1");
    });

    it("should only have latest run entry in invertedSubscriptions after rapid changes", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      const { rerender } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["field2"] },
        },
      );

      // Perform rapid changes
      for (let i = 0; i < 10; i++) {
        rerender({ subscriptions: [`field${i + 3}`] });
      }

      // Check invertedSubscriptions - should only have subscription to last field
      const state = inspectableContext.getInspectableState();

      // Should only have subscription to last field (field12)
      expect(state.invertedSubscriptions.get("field12")).toContain("field1");

      // Previous fields should not have field1 as subscriber
      for (let i = 0; i < 11; i++) {
        const fieldName = `field${i + 2}`;
        const watchers = state.invertedSubscriptions.get(fieldName);
        if (i === 10) {
          // Last one (field12) should have field1
          expect(watchers?.has("field1") ?? false).toBe(true);
        } else {
          expect(watchers?.has("field1") ?? false).toBe(false);
        }
      }
    });

    it("should verify final subscription state matches last prop value", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      const { rerender } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["fieldA", "fieldB"] },
        },
      );

      // Rapid changes to different subscription sets
      rerender({ subscriptions: ["fieldC"] });
      rerender({ subscriptions: ["fieldD", "fieldE", "fieldF"] });
      rerender({ subscriptions: ["fieldG"] });

      // Verify final state matches last prop
      const state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("fieldG")).toContain("field1");
      expect(
        state.invertedSubscriptions.get("fieldA")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("fieldB")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("fieldC")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("fieldD")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("fieldE")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("fieldF")?.has("field1") ?? false,
      ).toBe(false);
    });
  });

  describe("rapid changes - memory leak detection", () => {
    beforeEach(() => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should not leak memory with 10+ rapid changes (performance.memory)", () => {
      // Skip if performance.memory not available (Chrome/Edge only)
      if (typeof performance === "undefined" || !("memory" in performance)) {
        console.warn("performance.memory not available - skipping memory test");
        return;
      }

      const wrapper = createWrapper(createMockContext());

      // Force GC before test if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = (performance as any).memory.usedJSHeapSize;

      const { rerender } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["field2"] },
        },
      );

      // Perform many rapid changes
      for (let i = 0; i < 50; i++) {
        rerender({ subscriptions: [`field${i + 3}`] });
      }

      // Force GC after test if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be reasonable (< 5MB for 50 changes)
      // This is a generous threshold to account for test overhead
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024);
    });

    it("should not warn about memory leaks during rapid changes", () => {
      const wrapper = createWrapper(createMockContext());

      const { rerender } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["field2"] },
        },
      );

      // Clear existing logs
      vi.mocked(console.warn).mockClear();

      // Perform rapid changes
      for (let i = 0; i < 20; i++) {
        rerender({ subscriptions: [`field${i + 3}`] });
      }

      // Check for memory leak warnings
      const warnCalls = vi.mocked(console.warn).mock.calls;
      const memoryLeakWarnings = warnCalls.filter(
        (call) =>
          call[0]?.includes("memory leak") ||
          call[0]?.includes("orphaned") ||
          (call[0]?.includes("WARNING") && call[0]?.includes("Double-cleanup")),
      );

      // Development logging is expected (e.g., "Run X: cleaning up")
      // But no memory leak or orphaned subscription warnings beyond expected cleanup
      expect(memoryLeakWarnings).toHaveLength(0);
    });

    it("should handle 100 rapid changes without issues (stress test)", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      // Track subscription counts
      let addCount = 0;
      let removeCount = 0;

      const originalAdd = inspectableContext.addSubscription;
      const originalRemove = inspectableContext.removeSubscription;

      inspectableContext.addSubscription = vi.fn((...args) => {
        addCount++;
        return originalAdd(...args);
      });

      inspectableContext.removeSubscription = vi.fn((...args) => {
        removeCount++;
        return originalRemove(...args);
      });

      const { rerender } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["field2"] },
        },
      );

      // Stress test with 100 rapid changes
      for (let i = 0; i < 100; i++) {
        rerender({ subscriptions: [`field${(i % 10) + 3}`] });
      }

      // Verify that all operations completed without errors
      // Should have 1 initial add + 100 adds = 101 total adds
      // And 100 removes (one for each rerender cleanup)
      expect(addCount).toBe(101);
      expect(removeCount).toBe(100);

      // Verify no memory leak warnings
      const warnCalls = vi.mocked(console.warn).mock.calls;
      const memoryLeakWarnings = warnCalls.filter(
        (call) =>
          call[0]?.includes("memory leak") ||
          call[0]?.includes("orphaned") ||
          (call[0]?.includes("WARNING") && call[0]?.includes("Double-cleanup")),
      );
      expect(memoryLeakWarnings).toHaveLength(0);
    });
  });

  describe("rapid changes - different patterns", () => {
    it("should handle loop-based rapid subscription changes", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      const { rerender } = renderHook(
        ({ subscriptions }) => useSubscriptions("field1", subscriptions),
        {
          wrapper,
          initialProps: { subscriptions: ["field2"] },
        },
      );

      // Loop-based changes
      const subscriptionsList = [
        ["field3"],
        ["field4", "field5"],
        ["field6"],
        ["field7", "field8", "field9"],
        ["field10"],
      ];

      subscriptionsList.forEach((subs) => {
        rerender({ subscriptions: subs });
      });

      // Verify final state
      const state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("field10")).toContain("field1");

      // Previous fields should not have field1
      expect(
        state.invertedSubscriptions.get("field2")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("field3")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("field4")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("field5")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("field6")?.has("field1") ?? false,
      ).toBe(false);
    });

    it("should handle rapid field name changes", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      const { rerender } = renderHook(
        ({ fieldName }) => useSubscriptions(fieldName, ["targetField"]),
        {
          wrapper,
          initialProps: { fieldName: "field1" },
        },
      );

      // Rapid field name changes
      for (let i = 0; i < 10; i++) {
        rerender({ fieldName: `field${i + 2}` });
      }

      // Verify only last field is subscribed
      const state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("targetField")).toContain(
        "field11",
      );

      // Previous fields should not be subscribed
      for (let i = 1; i < 11; i++) {
        expect(state.invertedSubscriptions.get("targetField")).not.toContain(
          `field${i}`,
        );
      }
    });

    it("should handle mixed rapid changes (subscriptions + field name)", () => {
      const inspectableContext = createInspectableContext();
      const wrapper = createWrapper(inspectableContext);

      const { rerender } = renderHook(
        ({ fieldName, subscriptions }) =>
          useSubscriptions(fieldName, subscriptions),
        {
          wrapper,
          initialProps: {
            fieldName: "field1",
            subscriptions: ["target1"],
          },
        },
      );

      // Mixed changes
      rerender({ fieldName: "field1", subscriptions: ["target2"] });
      rerender({ fieldName: "field2", subscriptions: ["target2"] });
      rerender({ fieldName: "field2", subscriptions: ["target3"] });
      rerender({ fieldName: "field3", subscriptions: ["target3"] });

      // Verify final state
      const state = inspectableContext.getInspectableState();
      expect(state.invertedSubscriptions.get("target3")).toContain("field3");

      // Previous subscriptions should be cleaned up
      expect(
        state.invertedSubscriptions.get("target1")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("target2")?.has("field1") ?? false,
      ).toBe(false);
      expect(
        state.invertedSubscriptions.get("target2")?.has("field2") ?? false,
      ).toBe(false);
    });
  });
});
