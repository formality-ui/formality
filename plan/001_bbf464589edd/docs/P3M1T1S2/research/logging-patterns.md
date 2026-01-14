# Logging Patterns Research

## Overview

This document documents existing logging patterns in the Formality codebase and provides recommendations for adding subscription lifecycle logging in P3.M1.T1.S2.

## Existing Logging Patterns

### Pattern: Development-Only Warnings

**Consistent pattern throughout codebase**:

```typescript
if (process.env.NODE_ENV !== "production") {
  console.warn(message);
}
```

### Usage Locations

#### React Package

**packages/react/src/components/FieldGroup.tsx:74**
```typescript
if (process.env.NODE_ENV !== "production" && !formConfig.groups?.[name]) {
  console.warn(
    `FieldGroup: No config found for group "${name}". ` +
    `Make sure to define it in formConfig.groups.`,
  );
}
```

#### Core Package

**packages/core/src/validation/validate.ts:112,120**
- Validator warnings for missing validators

**packages/core/src/transform/pipeline.ts:71,79,91,134,144,156**
- Parser/formatter warnings for missing parsers

**packages/core/src/expression/evaluate.ts:262**
- Expression evaluation errors

## Logging Characteristics

### What IS Used

- ✅ `console.warn()` - For development warnings
- ✅ `process.env.NODE_ENV !== "production"` checks
- ✅ Descriptive messages with context

### What is NOT Used

- ❌ `console.log()` - Not used in library code
- ❌ `console.error()` - Not used (throws instead)
- ❌ `console.debug()` - Not used
- ❌ Centralized logging utilities
- ❌ External logging libraries (debug, loglevel, etc.)
- ❌ Structured logging (JSON, etc.)

## Recommended Subscription Logging Pattern

### Basic Pattern

Following existing conventions:

```typescript
if (process.env.NODE_ENV !== "production") {
  console.warn(`[Formality Subscription] ${message}`);
}
```

### Subscription Lifecycle Events

#### 1. Subscription Addition

```typescript
// In addSubscription or useSubscriptions hook
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `[Formality Subscription] "${subscriber}" subscribing to "${target}"`
  );
}
```

#### 2. Subscription Removal

```typescript
// In removeSubscription or cleanup
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `[Formality Subscription] "${subscriber}" unsubscribing from "${target}"`
  );
}
```

#### 3. Per-Effect Run Tracking

```typescript
// In useSubscriptions hook
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `[Formality Subscription] Run ${currentRunId}: "${fieldName}" ` +
    `subscribing to [${subscriptions.join(', ')}]`
  );
}

// In cleanup
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `[Formality Subscription] Run ${currentRunId}: "${fieldName}" ` +
    `cleaning up [${thisRunSubscriptions.join(', ')}]`
  );
}
```

#### 4. Double-Cleanup Detection

```typescript
// If trying to remove non-existent subscription
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `[Formality Subscription] WARNING: Double-cleanup attempt - ` +
    `"${subscriber}" tried to unsubscribe from "${target}" ` +
    `but subscription doesn't exist`
  );
}
```

#### 5. Dependency Graph Visualization

```typescript
// For debugging complex forms
if (process.env.NODE_ENV !== "production") {
  const graph = Array.from(invertedSubscriptions.current.entries())
    .map(([target, subscribers]) =>
      `${target} <- [${Array.from(subscribers).join(', ')}]`
    );
  console.warn(
    `[Formality Subscription] Dependency Graph:\n  ` +
    graph.join('\n  ')
  );
}
```

## Performance Considerations

### When to Log

**DO Log**:
- ✅ Subscription additions
- ✅ Subscription removals
- ✅ Effect run IDs
- ✅ Double-cleanup attempts
- ✅ Suspicious patterns (rapid add/remove cycles)

**DON'T Log** (too verbose):
- ❌ Every form state change
- ❌ Field value updates
- ❌ Validation runs
- ❌ Every re-render

### Conditional Logging

```typescript
// Only log if debug flag is set
const DEBUG_SUBSCRIPTIONS = false; // Could be environment variable

if (process.env.NODE_ENV !== "production" && DEBUG_SUBSCRIPTIONS) {
  console.warn(`[Formality Subscription] ${message}`);
}
```

## Implementation Recommendations

### 1. Add Logging to useSubscriptions Hook

**File**: `packages/react/src/hooks/useSubscriptions.ts`

**Locations**:
- When subscriptions are added (after `runSubscriptionsRef.current.set()`)
- When subscriptions are removed (in cleanup function)
- When Map entries are deleted

### 2. Add Logging to Form Context

**File**: `packages/react/src/components/Form.tsx`

**Locations**:
- In `addSubscription()` function
- In `removeSubscription()` function
- When detecting empty subscriber sets

### 3. Create Logging Utility (Optional)

If logging becomes complex, consider a small utility:

```typescript
// packages/react/src/utils/debug.ts

export function logSubscription(
  event: 'add' | 'remove' | 'cleanup' | 'warning',
  details: {
    subscriber?: string;
    target?: string;
    runId?: number;
    message?: string;
  }
) {
  if (process.env.NODE_ENV !== "production") {
    const prefix = `[Formality Subscription] ${event.toUpperCase()}`;
    const context = [
      details.subscriber && `subscriber="${details.subscriber}"`,
      details.target && `target="${details.target}"`,
      details.runId !== undefined && `run=${details.runId}`,
    ].filter(Boolean).join(' ');

    const suffix = details.message ? ` - ${details.message}` : '';
    console.warn(`${prefix}: ${context}${suffix}`);
  }
}
```

Usage:
```typescript
logSubscription('add', { subscriber: fieldName, target: 'user.name' });
logSubscription('warning', { message: 'Double-cleanup detected' });
```

## Testing Logged Output

### Vitest Pattern for Testing Logs

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('subscription logging', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should log subscription addition', () => {
    // ... test code
    expect(console.warn).toHaveBeenCalledWith(
      '[Formality Subscription] ADD: subscriber="fieldA" target="fieldB"'
    );
  });
});
```

## Summary

**Follow existing patterns**:
- Use `process.env.NODE_ENV !== "production"` checks
- Use `console.warn()` with descriptive messages
- Keep logging minimal but informative
- Prefix messages with `[Formality Subscription]`

**Log subscription lifecycle**:
- Addition events with field names
- Removal events with field names
- Effect run IDs for correlation
- Warning events for issues

**Avoid**:
- Creating a complex logging framework
- Using external logging libraries
- Logging in production builds
- Over-logging (too much noise)
