# External Dependencies & Research

**Generated:** 2026-01-10
**Purpose:** Guide implementation of Issue #3 (Circular Dependency Detection)

---

## Circular Dependency Detection Algorithms

### Recommended Algorithm: DFS with Recursion Stack

**Why:** Most efficient for directed graphs, easy to implement, provides clear cycle paths.

**Implementation Pattern:**

```typescript
class CircularDependencyDetector {
  private visiting = new Set<string>(); // Nodes in current DFS path
  private visited = new Set<string>(); // Fully processed nodes

  wouldCreateCycle(
    graph: Map<string, Set<string>>,
    target: string,
    subscriber: string,
  ): boolean {
    // Temporarily add the edge
    const tempGraph = this.cloneGraph(graph);
    if (!tempGraph.has(subscriber)) {
      tempGraph.set(subscriber, new Set());
    }
    tempGraph.get(subscriber)!.add(target);

    // Check for cycles starting from subscriber
    return this.hasCycle(tempGraph, subscriber);
  }

  private hasCycle(graph: Map<string, Set<string>>, start: string): boolean {
    if (this.visiting.has(start)) {
      return true; // Found a cycle
    }

    if (this.visited.has(start)) {
      return false; // Already processed, no cycle from here
    }

    this.visiting.add(start);

    for (const neighbor of graph.get(start) || []) {
      if (this.hasCycle(graph, neighbor)) {
        return true;
      }
    }

    this.visiting.delete(start);
    this.visited.add(start);
    return false;
  }

  private cloneGraph(
    graph: Map<string, Set<string>>,
  ): Map<string, Set<string>> {
    const clone = new Map<string, Set<string>>();
    for (const [key, value] of graph) {
      clone.set(key, new Set(value));
    }
    return clone;
  }
}
```

### Alternative: Kahn's Algorithm (BFS-based)

**Use Case:** Better memory efficiency for very large graphs (100+ fields).

**Trade-off:** More complex implementation, doesn't provide cycle path directly.

---

## Error Message Best Practices

### 1. Show the Complete Cycle Path

**Good:**

```
Circular dependency detected in form subscriptions:
  fieldA → fieldB → fieldC → fieldA

This can cause infinite render loops and performance issues.
```

**Bad:**

```
Circular dependency detected.
```

### 2. Provide Contextual Suggestions

**Pattern:**

```typescript
function createCircularDependencyError(
  cyclePath: string,
  suggestions: string[],
): Error {
  return new Error(
    `[CircularDependencyError] ${cyclePath}\n\n` +
      `Possible solutions:\n` +
      suggestions.map((s) => `  - ${s}`).join("\n") +
      `\n\nLearn more: https://formality.dev/docs/circular-deps`,
  );
}
```

**Suggestions to Include:**

- "Refactor your field dependencies to break the circular reference"
- "Use computed fields for derived values instead of subscriptions"
- "Consider consolidating related fields into a FieldGroup"
- "Review your subscribesTo configuration"

### 3. Include Developer-Friendly Metadata

**Pattern:**

```typescript
throw new Error(
  `Circular dependency detected: ${cyclePath}\n\n` +
    `Field configurations:\n` +
    `- fieldA.subscribesTo: ['fieldB']\n` +
    `- fieldB.subscribesTo: ['fieldC']\n` +
    `- fieldC.subscribesTo: ['fieldA']\n\n` +
    `Fix: Remove one subscription from the cycle.`,
);
```

---

## React forwardRef Best Practices

### React 18+ Pattern (Current Project)

**Standard Implementation:**

```typescript
import React, { forwardRef } from 'react';

interface TestInputProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => {
    return (
      <div data-testid={`field-wrapper-${name}`}>
        {label && <label htmlFor={name}>{label}</label>}
        <input
          ref={ref}  // Critical: Forward the ref
          id={name}
          data-testid={name}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error}
          {...props}
        />
        {error && <span data-testid={`${name}-error`}>{error}</span>}
      </div>
    );
  }
);

TestInput.displayName = 'TestInput';  // Critical: For debugging
```

**Key Points:**

1. **Generic Type:** `forwardRef<RefType, PropsType>`
2. **Ref Parameter:** Second parameter after props
3. **Ref Forwarding:** Pass ref to the underlying HTML element
4. **DisplayName:** Set for React DevTools
5. **TypeScript:** Properly type both ref and props

### Pattern for Switch/Checkbox

```typescript
const TestSwitch = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        data-testid={name}
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        {...props}
      />
    );
  }
);

TestSwitch.displayName = 'TestSwitch';
```

### Pattern for Select

```typescript
interface TestSelectProps extends TestInputProps {
  options: Array<{ value: string; label: string }>;
}

const TestSelect = forwardRef<HTMLSelectElement, TestSelectProps>(
  ({ value, onChange, disabled, name, options, ...props }, ref) => {
    return (
      <select
        ref={ref}
        data-testid={name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

TestSelect.displayName = 'TestSelect';
```

---

## Testing Patterns

### Verify Ref Forwarding

```typescript
test('TestInput forwards ref correctly', () => {
  const ref = { current: null };

  render(
    <Form>
      <Field
        name="testField"
        inputConfig={{ component: TestInput }}
        inputRef={ref}
      />
    </Form>
  );

  expect(ref.current).toBeInstanceOf(HTMLInputElement);
});
```

### Verify RHF Controller Integration

```typescript
test('TestInput works with RHF Controller', () => {
  const { result } = renderHook(() => useForm());

  render(
    <Form>
      <Field
        name="testField"
        inputConfig={{ component: TestInput }}
      />
    </Form>
  );

  const input = screen.getByTestId('testField');
  fireEvent.change(input, { target: { value: 'test' } });

  expect(result.current.getValues().testField).toBe('test');
});
```

---

## Performance Considerations

### Cycle Detection Performance

**Time Complexity:** O(V + E) where V = vertices (fields), E = edges (subscriptions)

**Typical Form Sizes:**

- Small form (10 fields): < 1ms
- Medium form (50 fields): < 5ms
- Large form (100+ fields): < 10ms

**Optimization Strategy:**

- Only run detection when subscriptions are **added**, not on every render
- Cache visited nodes during form initialization
- Early exit on first cycle found

### Memory Optimization

**Graph Structure:**

```typescript
// Use Map for O(1) lookups
const graph = new Map<string, Set<string>>();

// Efficiently check for existing edges
if (graph.has(subscriber) && graph.get(subscriber)!.has(target)) {
  // Already subscribed, skip
}
```

---

## Additional Resources

### Circular Dependency Algorithms

- [Detect cycle in Directed Graph using DFS](https://www.geeksforgeeks.org/detect-cycle-in-directed-graph-using-topological-sort/)
- [Kahn's Algorithm for Topological Sort](https://takeuforward.org/data-structure/detect-a-cycle-in-directed-graph-topological-sort-kahns-algorithm-g-23/)

### React Hook Form Integration

- [React Hook Form Controller Documentation](https://react-hook-form.com/docs/usecontroller/controller)
- [Controller ref Prop](https://react-hook-form.com/docs/usecontroller/controller)

### React forwardRef

- [React Ref Forwarding Guide](https://react.dev/reference/react/forwardRef)
- [TypeScript forwardRef Examples](https://dev.to/kirbyaguilar/reusable-form-inputs-with-react-hook-form-and-typescript-naj)

### Error Message Design

- [Writing Helpful Error Messages](https://cloudblog.microsoft.com/software-design/how-to-write-better-error-messages-98a5babf9/)
- [Developer Experience Patterns](https://www.writethedocs.org/guide/docs-best-practices/writing-for-developers/)
