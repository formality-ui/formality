# Form Component Debounce Implementation Details

## Overview
This document details how the Form component implements normal debounce behavior.

## Default Debounce Value

**Location**: `packages/react/src/components/Form.tsx:136`

```typescript
export function Form<TFieldValues extends FieldValues = FieldValues>({
  // ...other props
  debounce: debounceMs = 1000,
  // ...
}): JSX.Element
```

**Default**: 1000ms (1 second) when no debounce prop is provided.

## Normal Debounce Code Path

### 1. Field Change Trigger (Lines 299-321)

```typescript
const changeField = useCallback(
  (name: string, value: unknown, inputConfig?: InputConfig) => {
    if (autoSave) {
      pendingChangedFields.current.add(name);

      const affected = getAffectedFields(name);
      for (const field of affected) {
        pendingAffectedFields.current.add(field);
      }

      // CRITICAL: This is where debounce decision is made
      if (inputConfig?.debounce === false) {
        submitImmediate(); // NEW: Immediate path
      } else {
        debouncedSubmit(); // EXISTING: Normal debounce path
      }
    }
  },
  [autoSave, getAffectedFields],
);
```

**Key Points**:
- When `inputConfig?.debounce === false`, calls `submitImmediate()`
- Otherwise (including when `inputConfig` is undefined), calls `debouncedSubmit()`
- **This means the default behavior is preserved** - undefined inputConfig uses normal debounce

### 2. Debounced Function Creation (Lines 525-558)

```typescript
useEffect(() => {
  // Immediate execution path (when form-level debounce: false)
  if (debounceMs === false) {
    const immediateFn = Object.assign(() => {
      executeAutoSave();
    }, {
      cancel: () => {},
      flush: () => executeAutoSave(),
      pending: () => false,
    }) as DebouncedFunction;

    debouncedSubmitRef.current = immediateFn;
    return () => {};
  }

  // NORMAL DEBOUNCE PATH (default behavior)
  const debouncedFn = debounce(() => {
    executeAutoSave();
  }, debounceMs);

  const fn = Object.assign(debouncedFn, {
    pending: () => false,
  }) as DebouncedFunction;

  debouncedSubmitRef.current = fn;

  return () => {
    debouncedFn.cancel();
  };
}, [executeAutoSave, debounceMs]);
```

**Key Points**:
- Uses lodash `debounce` function for normal debounce
- Creates `DebouncedFunction` with cancel method for cleanup
- Cleanup on unmount prevents memory leaks

### 3. Debounced Submit Wrapper

```typescript
const debouncedSubmit = useCallback(() => {
  debouncedSubmitRef.current?.();
}, []);
```

## Testing Implications

### Normal Debounce Behavior (Default)

When a field changes without `inputConfig`:

```typescript
<Field name="fieldA" /> // No inputConfig
```

Expected behavior:
1. `changeField("fieldA", value, undefined)` is called
2. `inputConfig` is `undefined`, so `inputConfig?.debounce === false` is falsy
3. `debouncedSubmit()` is called
4. Submission happens after configured debounce delay (default 1000ms or form-level prop)

### Immediate Submission Behavior (New)

When a field has `inputConfig={{ debounce: false }}`:

```typescript
<Field name="fieldA" inputConfig={{ debounce: false }} />
```

Expected behavior:
1. `changeField("fieldA", value, { debounce: false })` is called
2. `inputConfig?.debounce === false` is truthy
3. `submitImmediate()` is called
4. Submission happens immediately without delay

## Backward Compatibility

The implementation preserves backward compatibility:

1. **No inputConfig**: Uses normal debounce (existing behavior)
2. **inputConfig without debounce**: Uses normal debounce (existing behavior)
3. **inputConfig.debounce = number**: Uses normal debounce with override value (future enhancement)
4. **inputConfig.debounce = false**: Uses immediate submission (new behavior)

## Lodash Debounce Behavior

The code uses `lodash-es` debounce:

```typescript
import { debounce } from "lodash-es";
```

Lodash debounce characteristics:
- **Trailing edge**: Executes after delay period
- **Leading edge**: Does NOT execute immediately (unless configured)
- **Coalescing**: Multiple rapid calls result in single execution
- **Reset on call**: Timer restarts with each call during delay period

## Pending Fields Tracking

```typescript
const pendingChangedFields = useRef(new Set<string>());
const pendingAffectedFields = useRef(new Set<string>());
const executionVersionRef = useRef(0);
```

These Refs track:
- Which fields changed during debounce
- Which fields are affected by conditions
- Execution version for race condition handling
