# Code Examples: Testing Race Conditions and Timing Edge Cases

Supplementary examples and patterns for testing async operations, race conditions, and timing issues in JavaScript/TypeScript applications.

---

## Table of Contents

1. [Setup and Utilities](#setup-and-utilities)
2. [Debounce Testing Examples](#debounce-testing-examples)
3. [Throttle Testing Examples](#throttle-testing-examples)
4. [Race Condition Testing Examples](#race-condition-testing-examples)
5. [Async Validation Testing](#async-validation-testing)
6. [AbortController Testing](#abortcontroller-testing)
7. [Form Library Testing Patterns](#form-library-testing-patterns)

---

## Setup and Utilities

### Test Timer Setup

```typescript
// Vitest setup with fake timers
import { vi, beforeEach, afterEach } from "vitest";

describe("Async Tests", () => {
  beforeEach(() => {
    // CRITICAL: Enable time advancement for realistic async behavior
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    // CRITICAL: Always restore real timers to prevent cross-test pollution
    vi.useRealTimers();
  });
});
```

### Delay Helper

```typescript
// Utility for creating delay promises
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Usage in tests
await delay(100);
```

### Async Operation Tracker

```typescript
// Track async operation lifecycle
export class AsyncOperationTracker {
  private operations = new Map<
    string,
    {
      startTime: number;
      endTime?: number;
      status: "pending" | "resolved" | "rejected" | "aborted";
    }
  >();

  start(operationId: string) {
    this.operations.set(operationId, {
      startTime: Date.now(),
      status: "pending",
    });
  }

  complete(operationId: string, success: boolean) {
    const op = this.operations.get(operationId);
    if (op) {
      op.endTime = Date.now();
      op.status = success ? "resolved" : "rejected";
    }
  }

  abort(operationId: string) {
    const op = this.operations.get(operationId);
    if (op) {
      op.endTime = Date.now();
      op.status = "aborted";
    }
  }

  getOperationCount(status?: string) {
    if (!status) return this.operations.size;
    return Array.from(this.operations.values()).filter(
      (op) => op.status === status,
    ).length;
  }

  getOperationDuration(operationId: string) {
    const op = this.operations.get(operationId);
    return op && op.endTime ? op.endTime - op.startTime : null;
  }
}
```

---

## Debounce Testing Examples

### Implementation

```typescript
// Debounce implementation
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}
```

### Basic Tests

```typescript
describe("debounce", () => {
  let mockFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFn = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should delay function execution", () => {
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn("test");

    // Not called immediately
    expect(mockFn).not.toHaveBeenCalled();

    // Advance to exactly debounce time
    vi.advanceTimersByTimeAsync(500);

    // Should be called now
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("test");
  });

  it("should reset delay on subsequent calls", () => {
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn("first");
    vi.advanceTimersByTimeAsync(300);

    // Not called yet
    expect(mockFn).not.toHaveBeenCalled();

    // Second call resets the timer
    debouncedFn("second");
    vi.advanceTimersByTimeAsync(300);

    // Still not called (300ms since second call)
    expect(mockFn).not.toHaveBeenCalled();

    // Advance to complete debounce period
    vi.advanceTimersByTimeAsync(200);

    // Should be called now
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("second");
  });

  it("should handle rapid successive calls", () => {
    const debouncedFn = debounce(mockFn, 500);

    // Rapid calls
    debouncedFn("call1");
    debouncedFn("call2");
    debouncedFn("call3");
    debouncedFn("call4");

    vi.advanceTimersByTimeAsync(500);

    // Only called once with last value
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("call4");
  });
});
```

### Integration Tests with User Input

```typescript
describe('debounce - User Input Integration', () => {
  it('should debounce search input', async () => {
    const searchHandler = vi.fn();
    const debouncedSearch = debounce(searchHandler, 500);

    const { getByRole } = render(
      <input
        role="searchbox"
        onChange={(e) => debouncedSearch(e.target.value)}
      />
    );

    const input = getByRole('searchbox');

    // Simulate typing
    await userEvent.type(input, 'hello', { delay: null });

    // Not called yet (within debounce)
    expect(searchHandler).not.toHaveBeenCalled();

    // Wait for debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Called once with complete value
    expect(searchHandler).toHaveBeenCalledTimes(1);
    expect(searchHandler).toHaveBeenCalledWith('hello');
  });

  it('should reset debounce on continued typing', async () => {
    const searchHandler = vi.fn();
    const debouncedSearch = debounce(searchHandler, 500);

    const { getByRole } = render(
      <input
        role="searchbox"
        onChange={(e) => debouncedSearch(e.target.value)}
      />
    );

    const input = getByRole('searchbox');

    // Type first part
    await userEvent.type(input, 'hello', { delay: null });
    await vi.advanceTimersByTimeAsync(300);

    // Continue typing (resets debounce)
    await userEvent.type(input, ' world', { delay: null });
    await vi.advanceTimersByTimeAsync(300);

    // Still not called (reset by second input)
    expect(searchHandler).not.toHaveBeenCalled();

    // Complete debounce period
    await vi.advanceTimersByTimeAsync(200);

    // Called with final value
    expect(searchHandler).toHaveBeenCalledTimes(1);
    expect(searchHandler).toHaveBeenCalledWith('hello world');
  });
});
```

### Leading Edge Debounce Tests

```typescript
describe("debounce - Leading Edge", () => {
  it("should call immediately on leading edge", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500, { leading: true });

    debouncedFn("test");

    // Called immediately on leading edge
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("test");

    // Subsequent calls within debounce period are ignored
    debouncedFn("test2");
    debouncedFn("test3");

    vi.advanceTimersByTimeAsync(500);

    // Still only called once
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

---

## Throttle Testing Examples

### Implementation

```typescript
// Throttle implementation
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

### Basic Tests

```typescript
describe("throttle", () => {
  let mockFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFn = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should call function immediately", () => {
    const throttledFn = throttle(mockFn, 1000);

    throttledFn("test");

    // Called immediately (leading edge)
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("test");
  });

  it("should ignore calls within throttle period", () => {
    const throttledFn = throttle(mockFn, 1000);

    throttledFn("call1");
    throttledFn("call2"); // Ignored
    throttledFn("call3"); // Ignored

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("call1");
  });

  it("should allow calls after throttle period", () => {
    const throttledFn = throttle(mockFn, 1000);

    throttledFn("call1");

    vi.advanceTimersByTimeAsync(1000);

    // Throttle period over, can call again
    throttledFn("call2");

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenNthCalledWith(1, "call1");
    expect(mockFn).toHaveBeenNthCalledWith(2, "call2");
  });

  it("should handle rapid scroll events", () => {
    const scrollHandler = vi.fn();
    const throttledScroll = throttle(scrollHandler, 100);

    // Simulate 10 rapid scroll events
    for (let i = 0; i < 10; i++) {
      throttledScroll(i);
    }

    // Only first call executed
    expect(scrollHandler).toHaveBeenCalledTimes(1);
    expect(scrollHandler).toHaveBeenCalledWith(0);

    // Advance past throttle period
    vi.advanceTimersByTimeAsync(100);

    // Next call can execute
    throttledScroll(10);
    expect(scrollHandler).toHaveBeenCalledTimes(2);
    expect(scrollHandler).toHaveBeenLastCalledWith(10);
  });
});
```

### Trailing Edge Tests

```typescript
describe("throttle - Trailing Edge", () => {
  it("should call on trailing edge", () => {
    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 1000, { trailing: true });

    throttledFn("call1");
    vi.advanceTimersByTimeAsync(100);
    throttledFn("call2"); // Queued for trailing edge

    expect(mockFn).toHaveBeenCalledTimes(1); // Only leading call

    vi.advanceTimersByTimeAsync(900);

    // Trailing call executed
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith("call2");
  });
});
```

---

## Race Condition Testing Examples

### Version Tracking Implementation

```typescript
// Version tracker for preventing race conditions
export class VersionTracker {
  private version = 0;

  getVersion(): number {
    return this.version;
  }

  increment(): number {
    return ++this.version;
  }

  isStale(version: number): boolean {
    return version !== this.version;
  }
}

// Async operation with version checking
export async function performOperation<T>(
  tracker: VersionTracker,
  operation: (version: number) => Promise<T>,
): Promise<T | null> {
  const version = tracker.increment();

  try {
    const result = await operation(version);

    // Check if operation is still valid
    if (tracker.isStale(version)) {
      return null; // Operation was superseded
    }

    return result;
  } catch (error) {
    // Check if error is relevant
    if (tracker.isStale(version)) {
      return null; // Ignore errors from stale operations
    }
    throw error;
  }
}
```

### Version Tracking Tests

```typescript
describe("Version Tracking - Race Conditions", () => {
  it("should abort stale operations", async () => {
    const tracker = new VersionTracker();
    const results: string[] = [];

    async function operation(version: number): Promise<string> {
      await delay(100);
      return `result-${version}`;
    }

    // Start multiple operations
    const op1 = performOperation(tracker, operation);
    await delay(50); // Let first start

    tracker.increment(); // Increment version (op1 now stale)
    const op2 = performOperation(tracker, operation);

    await delay(50); // Let second start
    tracker.increment(); // Increment version (op2 now stale)
    const op3 = performOperation(tracker, operation);

    const [result1, result2, result3] = await Promise.all([op1, op2, op3]);

    // Only latest operation should return result
    expect(result1).toBeNull(); // Aborted
    expect(result2).toBeNull(); // Aborted
    expect(result3).toBe("result-3"); // Success
  });

  it("should handle rapid version changes", async () => {
    const tracker = new VersionTracker();
    const executionLog: string[] = [];

    async function trackedOperation(id: string): Promise<void> {
      const version = tracker.increment();
      executionLog.push(`${id}:start:v${version}`);

      await delay(100);

      if (!tracker.isStale(version)) {
        executionLog.push(`${id}:complete:v${version}`);
      } else {
        executionLog.push(`${id}:aborted:v${version}`);
      }
    }

    // Start multiple operations rapidly
    await Promise.all([
      trackedOperation("op1"),
      trackedOperation("op2"),
      trackedOperation("op3"),
    ]);

    // Verify only last operation completed
    const completions = executionLog.filter((log) => log.includes("complete"));
    const abortions = executionLog.filter((log) => log.includes("aborted"));

    expect(completions).toHaveLength(1);
    expect(completions[0]).toContain("v3"); // Last version
    expect(abortions).toHaveLength(2); // Previous two aborted
  });
});
```

### Promise Race Tests

```typescript
describe('Promise.race - Race Conditions', () => {
  it('should resolve with fastest promise', async () => {
    const fastPromise = delay(100).then(() => 'fast');
    const slowPromise = delay(200).then(() => ' 'slow');

    const result = await Promise.race([fastPromise, slowPromise]);

    expect(result).toBe('fast');
  });

  it('should handle timeout races', async () => {
    const withTimeout = async <T>(
      promise: Promise<T>,
      timeoutMs: number,
      timeoutValue: T
    ): Promise<T> => {
      const timeoutPromise = delay(timeoutMs).then(() => timeoutValue);
      return Promise.race([promise, timeoutPromise]);
    };

    const slowOperation = delay(1000).then(() => 'done');

    const result = await withTimeout(slowOperation, 100, 'timeout');

    expect(result).toBe('timeout');
  });

  it('should race multiple operations and use first result', async () => {
    const tracker = new VersionTracker();
    const results: (string | null)[] = [];

    async function fetchDataWithCache(
      source: string,
      delayMs: number
    ): Promise<string | null> {
      const version = tracker.increment();

      await delay(delayMs);

      if (tracker.isStale(version)) {
        return null;
      }

      return source;
    }

    // Start fetching from multiple sources
    const promises = [
      fetchDataWithCache('cache', 50),
      fetchDataWithCache('network1', 100),
      fetchDataWithCache('network2', 150),
    ];

    // Race them - use first successful result
    const result = await Promise.any(
      promises.map(p => p.then(r => r ?? Promise.reject('stale')))
    );

    expect(result).toBe('cache'); // Fastest source
  });
});
```

### Request Deduplication Tests

```typescript
describe("Request Deduplication", () => {
  it("should deduplicate concurrent requests", async () => {
    const requestCache = new Map<string, Promise<any>>();

    async function fetchWithDedupe(key: string): Promise<string> {
      // Check if request already in flight
      if (requestCache.has(key)) {
        return requestCache.get(key)!;
      }

      // Create new request
      const promise = delay(100).then(() => `data:${key}`);
      requestCache.set(key, promise);

      try {
        return await promise;
      } finally {
        requestCache.delete(key);
      }
    }

    // Start multiple concurrent requests for same key
    const [result1, result2, result3] = await Promise.all([
      fetchWithDedupe("user-123"),
      fetchWithDedupe("user-123"),
      fetchWithDedupe("user-123"),
    ]);

    // All should resolve with same data
    expect(result1).toBe("data:user-123");
    expect(result2).toBe("data:user-123");
    expect(result3).toBe("data:user-123");

    // Only one actual request should have been made
    // (In real implementation, verify fetch was called once)
  });
});
```

---

## Async Validation Testing

### Validation State Machine Tests

```typescript
describe("Async Validation - State Machine", () => {
  it("should track validation states correctly", async () => {
    type ValidationState = "idle" | "validating" | "valid" | "invalid";
    const stateChanges: ValidationState[] = [];

    let currentState: ValidationState = "idle";

    const setState = (newState: ValidationState) => {
      currentState = newState;
      stateChanges.push(newState);
    };

    async function validate(value: string): Promise<boolean> {
      setState("validating");
      await delay(100);

      if (value.length < 3) {
        setState("invalid");
        return false;
      }

      setState("valid");
      return true;
    }

    // First validation
    await validate("ab");
    expect(stateChanges).toEqual(["validating", "invalid"]);

    // Second validation
    stateChanges.length = 0;
    await validate("abc");
    expect(stateChanges).toEqual(["validating", "valid"]);
  });

  it("should handle validation interruption", async () => {
    const validationResults: Array<{ value: string; valid: boolean }> = [];

    async function validateAndTrack(value: string): Promise<void> {
      await delay(100);
      validationResults.push({ value, valid: value.length >= 3 });
    }

    // Start validation (will be interrupted)
    const validation1 = validateAndTrack("ab");
    await delay(50);

    // New validation starts (should supersede)
    const validation2 = validateAndTrack("abc");

    await Promise.all([validation1, validation2]);

    // Both validations complete, but we should only use the latest
    expect(validationResults).toHaveLength(2);
    expect(validationResults[0]).toEqual({ value: "ab", valid: false });
    expect(validationResults[1]).toEqual({ value: "abc", valid: true });
  });
});
```

### Field-Level Validation Tests

```typescript
describe('Field Validation - Rapid Changes', () => {
  it('should only validate final value after rapid changes', async () => {
    const validationCalls: string[] = [];

    const validator = async (value: unknown): Promise<boolean> => {
      validationCalls.push(`start:${value}`);
      await delay(50);
      validationCalls.push(`end:${value}`);
      return true;
    };

    const { getByRole } = render(
      <input
        role="textbox"
        onChange={async (e) => {
          await validator(e.target.value);
        }}
      />
    );

    const input = getByRole('textbox');

    // Rapid input changes
    await userEvent.type(input, 'test', { delay: 10 });

    // Wait for all validations to complete
    await waitFor(() => {
      expect(validationCalls.filter(c => c.includes('end')).length).toBe(4);
    });

    // All validations should complete
    expect(validationCalls).toEqual([
      'start:t',
      'end:t',
      'start:te',
      'end:te',
      'start:tes',
      'end:tes',
      'start:test',
      'end:test',
    ]);
  });

  it('should debounce validation', async () => {
    const validator = vi.fn().mockResolvedValue(true);
    const debouncedValidator = debounce(validator, 200);

    const { getByRole } = render(
      <input
        role="textbox"
        onChange={(e) => debouncedValidator(e.target.value)}
      />
    );

    const input = getByRole('textbox');

    // Type rapidly
    await userEvent.type(input, 'test', { delay: null });

    // Not called yet (debouncing)
    expect(validator).not.toHaveBeenCalled();

    // Wait for debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Called once with final value
    expect(validator).toHaveBeenCalledTimes(1);
    expect(validator).toHaveBeenCalledWith('test');
  });
});
```

### Cross-Field Validation Tests

```typescript
describe("Cross-Field Validation", () => {
  it("should revalidate dependent fields when source changes", async () => {
    const validations = new Map<string, boolean>();

    const validatePassword = async (password: string): Promise<boolean> => {
      await delay(50);
      const valid = password.length >= 8;
      validations.set("password", valid);
      return valid;
    };

    const validateConfirmPassword = async (
      password: string,
      confirmPassword: string,
    ): Promise<boolean> => {
      await delay(50);
      const valid = password === confirmPassword;
      validations.set("confirmPassword", valid);
      return valid;
    };

    // Enter password
    await validatePassword("password123");
    await validateConfirmPassword("password123", "password123");

    expect(validations.get("password")).toBe(true);
    expect(validations.get("confirmPassword")).toBe(true);

    // Change password (should invalidate confirmPassword)
    await validatePassword("newpassword456");

    // Revalidate confirmPassword
    await validateConfirmPassword("newpassword456", "password123");

    expect(validations.get("confirmPassword")).toBe(false); // No longer matches
  });
});
```

---

## AbortController Testing

### AbortController Implementation Tests

```typescript
describe("AbortController", () => {
  it("should abort fetch requests", async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPromise = fetch("/api/data", { signal });

    // Abort the request
    controller.abort();

    await expect(fetchPromise).rejects.toThrow("AbortError");
  });

  it("should handle aborted operations gracefully", async () => {
    let cleanupCalled = false;

    async function operationWithCleanup(signal: AbortSignal): Promise<string> {
      try {
        await delay(100);
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        return "success";
      } finally {
        cleanupCalled = true;
      }
    }

    const controller = new AbortController();

    // Start operation
    const promise = operationWithCleanup(controller.signal);

    // Abort immediately
    controller.abort();

    await expect(promise).rejects.toThrow("AbortError");
    expect(cleanupCalled).toBe(true); // Cleanup still runs
  });

  it("should chain AbortControllers", async () => {
    const parentController = new AbortController();
    const childController = new AbortController();

    // Child aborts when parent aborts
    parentController.signal.addEventListener("abort", () => {
      childController.abort();
    });

    const operationPromise = fetch("/api/data", {
      signal: childController.signal,
    });

    // Abort parent
    parentController.abort();

    // Child should also be aborted
    expect(childController.signal.aborted).toBe(true);
    await expect(operationPromise).rejects.toThrow("AbortError");
  });
});
```

### AbortController with Retry Logic

```typescript
describe("AbortController with Retry", () => {
  it("should retry with new AbortController", async () => {
    let attemptCount = 0;

    async function fetchWithRetry(maxRetries: number = 3): Promise<string> {
      for (let i = 0; i < maxRetries; i++) {
        attemptCount++;
        const controller = new AbortController();

        try {
          // Simulate fetch that fails first two times
          if (attemptCount < 3) {
            await delay(50);
            controller.abort();
            throw new DOMException("Aborted", "AbortError");
          }

          return "success";
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          // Retry
        }
      }

      throw new Error("Max retries exceeded");
    }

    const result = await fetchWithRetry();
    expect(result).toBe("success");
    expect(attemptCount).toBe(3);
  });
});
```

---

## Form Library Testing Patterns

### Auto-Save Testing Pattern

```typescript
describe('Form Auto-Save - Race Conditions', () => {
  it('should only submit final value after rapid changes', async () => {
    const submitLog: Array<{ timestamp: number; data: any }> = [];
    const handleSubmit = (data: any) => {
      submitLog.push({ timestamp: Date.now(), data });
    };

    const { getByTestId } = render(
      <Form onSubmit={handleSubmit} autoSave debounce={500}>
        <Field name="username" component="input" />
      </Form>
    );

    const input = getByTestId('username');

    // Rapid changes
    await userEvent.type(input, 'user1', { delay: null });
    await vi.advanceTimersByTimeAsync(100);

    await userEvent.clear(input);
    await userEvent.type(input, 'user2', { delay: null });
    await vi.advanceTimersByTimeAsync(100);

    await userEvent.clear(input);
    await userEvent.type(input, 'user3', { delay: null });

    // Wait for debounce
    await vi.advanceTimersByTimeAsync(500);

    // Only one submission with final value
    expect(submitLog).toHaveLength(1);
    expect(submitLog[0].data.username).toBe('user3');
  });

  it('should abort in-flight saves on new changes', async () => {
    const saveOperations: string[] = [];

    async function mockSave(data: any): Promise<void> {
      const operationId = data.value;
      saveOperations.push(`${operationId}:start`);

      await delay(200);

      // Version check would happen here
      saveOperations.push(`${operationId}:complete`);
    }

    const { getByTestId } = render(
      <Form
        onSubmit={mockSave}
        autoSave
        debounce={100}
      >
        <Field name="value" component="input" />
      </Form>
    );

    const input = getByTestId('value');

    // First change
    await userEvent.type(input, 'value1', { delay: null });
    await vi.advanceTimersByTimeAsync(50);

    // Second change (first save still in flight)
    await userEvent.clear(input);
    await userEvent.type(input, 'value2', { delay: null });

    // Wait for operations
    await vi.advanceTimersByTimeAsync(300);

    // Verify only final save completed
    expect(saveOperations).toEqual([
      'value1:start',
      'value1:complete', // Completed but result ignored
      'value2:start',
      'value2:complete', // Only this result used
    ]);
  });
});
```

### Validation Queue Testing

```typescript
describe("Form Validation Queue", () => {
  it("should process validations in order", async () => {
    const validationOrder: string[] = [];

    const queue = new ValidationQueue();

    // Add validations to queue
    await queue.validate("field1", async () => {
      validationOrder.push("field1:start");
      await delay(50);
      validationOrder.push("field1:end");
      return true;
    });

    await queue.validate("field2", async () => {
      validationOrder.push("field2:start");
      await delay(30);
      validationOrder.push("field2:end");
      return true;
    });

    await queue.validate("field3", async () => {
      validationOrder.push("field3:start");
      await delay(20);
      validationOrder.push("field3:end");
      return true;
    });

    // Wait for queue to process
    await queue.waitForIdle();

    // Verify sequential execution
    expect(validationOrder).toEqual([
      "field1:start",
      "field1:end",
      "field2:start",
      "field2:end",
      "field3:start",
      "field3:end",
    ]);
  });
});
```

---

## Advanced Patterns

### Observable State with Versioning

```typescript
describe("Observable State - Versioned Updates", () => {
  it("should ignore stale state updates", () => {
    const state = {
      version: 0,
      data: null as any,
    };

    const updates: Array<{ version: number; data: any }> = [];

    function updateState(newData: any) {
      const version = ++state.version;
      setTimeout(() => {
        // Only update if still current version
        if (version === state.version) {
          state.data = newData;
          updates.push({ version, data: newData });
        }
      }, 100);
    }

    // Start multiple updates
    updateState("data1");
    updateState("data2");
    updateState("data3");

    vi.advanceTimersByTimeAsync(150);

    // Only last update should apply
    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual({ version: 3, data: "data3" });
  });
});
```

### React Query-Style Cache Invalidation

```typescript
describe("Query Cache - Invalidation Patterns", () => {
  it("should invalidate stale cache on mutation", async () => {
    const cache = new Map<string, { data: any; version: number }>();
    let queryVersion = 0;

    async function fetchQuery(key: string): Promise<any> {
      const version = ++queryVersion;
      await delay(100);

      // Check if still current
      if (cache.get(key)?.version !== version) {
        return cache.get(key)?.data;
      }

      const data = { key, value: "fetched" };
      cache.set(key, { data, version });
      return data;
    }

    async function mutate(key: string): Promise<void> {
      // Increment version to invalidate cache
      queryVersion++;
      cache.delete(key);

      await delay(50);

      // Refetch
      await fetchQuery(key);
    }

    // Initial fetch
    const result1 = await fetchQuery("user-123");
    expect(result1.value).toBe("fetched");

    // Mutation
    await mutate("user-123");

    // Cache should be invalidated and refetched
    const result2 = await fetchQuery("user-123");
    expect(result2.version).not.toBe(result1.version);
  });
});
```

---

## Summary

This document provides comprehensive code examples for testing race conditions, timing issues, and async operations. Key patterns include:

1. **Fake Timers** - Use `vi.useFakeTimers({ shouldAdvanceTime: true })`
2. **Version Tracking** - Atomic increment with checkpoint validation
3. **Debounce Testing** - Verify delay, reset, and rapid input behavior
4. **Throttle Testing** - Verify call frequency and edge timing
5. **AbortController** - Test request cancellation and cleanup
6. **Validation States** - Track validation lifecycle and interruptions
7. **Form Auto-Save** - Test that only final values are submitted

For implementation reference, see:

- `/home/dustin/projects/formality/packages/react/src/__tests__/autosave-rapid-changes.test.tsx`
- `/home/dustin/projects/formality/packages/react/src/components/Form.tsx` (executionVersionRef pattern)
