# External Research: Cleanup Ordering Best Practices

## Overview

This document compiles external research on useEffect cleanup ordering, dependency management, and subscription lifecycle patterns relevant to P3.M1.T1.S2 implementation.

## Key Findings

### 1. React's Built-in LIFO Cleanup Ordering

React's `useEffect` cleanup functions run in **LIFO (Last-In, First-Out) order** by design.

**Example**:
```javascript
useEffect(() => {
  console.log('Effect 1 setup');
  return () => console.log('Effect 1 cleanup');
}, []);

useEffect(() => {
  console.log('Effect 2 setup');
  return () => console.log('Effect 2 cleanup');
}, []);

useEffect(() => {
  console.log('Effect 3 setup');
  return () => console.log('Effect 3 cleanup');
}, []);
```

**On unmount, output is**:
```
Effect 3 cleanup  // Last in, first out
Effect 2 cleanup
Effect 1 cleanup  // First in, last out
```

**Source**: https://react.dev/learn/synchronizing-with-effects

### 2. When LIFO vs FIFO Matters

**LIFO is critical when**:
- **Effect B depends on Effect A**: B's cleanup runs first, preventing access to already-cleanup resources
- **Resource allocation**: Stack-like behavior ensures resources are released in reverse order
- **Event propagation**: Removing listeners in reverse prevents intermediate handlers from seeing events after cleanup

**Example where order matters**:
```javascript
useEffect(() => {
  // Setup global event handler
  document.addEventListener('click', handleGlobalClick);
  return () => document.removeEventListener('click', handleGlobalClick);
}, []);

useEffect(() => {
  // Setup local element-specific handler
  element.addEventListener('click', handleElementClick);
  return () => element.removeEventListener('click', handleElementClick);
}, []);
```

If the element handler (Effect 2) is cleaned up after the global handler (Effect 1), clicks might still trigger the global handler after the element-specific handler is removed.

### 3. Subscription Dependency Patterns

#### Explicit Dependency Arrays

```javascript
useEffect(() => {
  const subscription = dataSource.subscribe(callback);
  return () => subscription.unsubscribe();
}, [dataSource]); // Re-run when dataSource changes
```

#### Dependency Injection Pattern

```javascript
function useSubscription(dataSource, callback) {
  useEffect(() => {
    const subscription = dataSource.subscribe(callback);
    return () => subscription.unsubscribe();
  }, [dataSource, callback]);
}
```

#### Dependency Graph Pattern

```javascript
const subscriptions = useRef(new Map());

useEffect(() => {
  // Register dependencies
  subscriptions.current.set('child', childSubscription);
  subscriptions.current.set('parent', parentSubscription);

  return () => {
    // Cleanup in reverse dependency order
    subscriptions.current.delete('child');
    subscriptions.current.delete('parent');
  };
}, []);
```

### 4. Double-Cleanup Prevention Patterns

#### Ref-Based Tracking

```javascript
const isSubscribed = useRef(true);

useEffect(() => {
  const subscription = api.subscribe((data) => {
    if (isSubscribed.current) {
      setState(data);
    }
  });

  return () => {
    isSubscribed.current = false;
    subscription.unsubscribe();
  };
}, []);
```

#### Cleanup Guards

```javascript
useEffect(() => {
  let cleanupCalled = false;
  const subscription = api.subscribe();

  return () => {
    if (!cleanupCalled) {
      cleanupCalled = true;
      subscription.unsubscribe();
    }
  };
}, []);
```

#### Subscription Manager Pattern

```javascript
const useSubscriptionManager = () => {
  const subscriptions = useRef(new Set());

  const add = (subscription) => {
    subscriptions.current.add(subscription);
    return subscription;
  };

  const cleanup = () => {
    subscriptions.current.forEach(sub => sub.unsubscribe());
    subscriptions.current.clear();
  };

  return { add, cleanup };
};
```

### 5. React-Specific Gotchas

**Critical Gotchas**:
1. **Effect runs twice in Strict Mode**: Cleanups must be idempotent
2. **Stale closures**: Cleanup functions capture initial render values
3. **Dependency array mistakes**: Missing deps cause stale subscriptions
4. **Race conditions**: Fast dependency changes can cause overlapping subscriptions

### 6. Development Logging Patterns

#### Lifecycle Logging

```javascript
useEffect(() => {
  console.log('[Subscription] Subscribed to', source.id);

  return () => {
    console.log('[Subscription] Unsubscribed from', source.id);
  };
}, [source]);
```

#### Dependency Tracking Log

```javascript
useEffect(() => {
  console.log('[Effect] Running with deps:', { source, callback });
  const subscription = source.subscribe(callback);

  return () => {
    console.log('[Effect] Cleanup for', source.id);
    subscription.unsubscribe();
  };
}, [source, callback]);
```

#### Subscription Registry for Debugging

```javascript
const subscriptionRegistry = useRef(new Map());

useEffect(() => {
  const id = Symbol('subscription');
  subscriptionRegistry.current.set(id, {
    source: source.id,
    created: performance.now(),
    active: true
  });

  console.table([...subscriptionRegistry.current.values()]);

  return () => {
    const record = subscriptionRegistry.current.get(id);
    record.active = false;
    record.destroyed = performance.now();
    record.lifespan = record.destroyed - record.created;

    console.log('[Subscription] Lifecycle:', record);
    subscriptionRegistry.current.delete(id);
  };
}, [source]);
```

#### Cleanup Order Visualization

```javascript
useEffect(() => {
  const depth = 1;
  console.log('  '.repeat(depth) + '└─ Setup Effect A');

  return () => {
    console.log('  '.repeat(depth) + '└─ Cleanup Effect A');
  };
}, []);

useEffect(() => {
  const depth = 2;
  console.log('  '.repeat(depth) + '└─ Setup Effect B (depends on A)');

  return () => {
    console.log('  '.repeat(depth) + '└─ Cleanup Effect B');
  };
}, []);
```

## Key URLs to Reference

1. **React useEffect Documentation**: https://react.dev/reference/react/useEffect
   - Official documentation on effect lifecycle and cleanup

2. **React Effects Learning Guide**: https://react.dev/learn/synchronizing-with-effects
   - Comprehensive guide on effect patterns and best practices

3. **A Complete Guide to useEffect**: https://overreacted.io/a-complete-guide-to-useeffect/
   - Deep dive by Dan Abramov on effect behavior

4. **React Strict Mode**: https://react.dev/reference/react/StrictMode
   - Understanding double-invocation behavior

## Core Principles Summary

1. **React uses LIFO for cleanup** (reverse order of mounting)
2. **Track dependencies explicitly** in dependency arrays
3. **Implement cleanup guards** to prevent double-cleanup
4. **Use refs for mutable state** that doesn't trigger re-renders
5. **Log lifecycle events** in development to track ordering issues
6. **Test cleanup behavior** in React Strict Mode (runs twice)
7. **LIFO mirrors stack unwinding** - ensures dependent resources are cleaned up before their dependencies

## Application to P3.M1.T1.S2

### What This Means for Formality

1. **LIFO is generally correct**: The previous PRP's LIFO cleanup aligns with React's design
2. **Per-effect tracking prevents race conditions**: P3.M1.T1.S1's approach handles rapid changes
3. **Logging should track lifecycle**: Add development logs for subscription add/remove/cleanup
4. **Double-cleanup guards are important**: Add checks before removing subscriptions

### Recommended Implementation Approach

1. **Keep LIFO ordering** - it's the standard pattern
2. **Add development logging** - track subscription lifecycle
3. **Add existence checks** - prevent double-cleanup attempts
4. **Test in Strict Mode** - ensure idempotent cleanup

## Conclusion

The external research confirms that:
- LIFO ordering is the standard and correct approach for most cleanup scenarios
- Per-effect tracking (from P3.M1.T1.S1) handles the main race condition concerns
- Development logging and cleanup guards are the primary additions needed for P3.M1.T1.S2
