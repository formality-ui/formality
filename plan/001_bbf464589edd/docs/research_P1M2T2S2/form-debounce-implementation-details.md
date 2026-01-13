# Form Debounce Implementation Details

## Overview

This document provides a detailed analysis of the Form component's debounce implementation, specifically focused on understanding how normal debounce behavior works and how the `debounce: false` feature integrates without breaking existing behavior.

## File: packages/react/src/components/Form.tsx

---

## 1. Default Debounce Value

**Location**: Line 136

```typescript
const { debounce = 1000, ...otherProps } = props;
```

**Default**: `1000ms` (1 second)

**Behavior**:
- When no `debounce` prop is provided, defaults to 1000ms
- This is the form-level default for all auto-save submissions
- Can be overridden by explicit `debounce` prop on Form

---

## 2. Debounce Type Definition

**Location**: packages/react/src/components/Form.tsx, lines 58-62

```typescript
/** Enable auto-save on field changes */
autoSave?: boolean;

/** Debounce milliseconds for auto-save. false = immediate submission, number = delay in milliseconds (default: 1000) */
debounce?: number | false;
```

**Key Points**:
- `debounce` can be a `number` (milliseconds) or `false` (immediate)
- When `false`, auto-save submissions happen immediately
- When a number, submissions are debounced by that many milliseconds

---

## 3. Debounce State Management

**Location**: Lines 191-196

```typescript
// Auto-save tracking
// pendingChanges accumulates field changes while debounce is pending
const pendingChangedFields = useRef(new Set<string>());
const pendingAffectedFields = useRef(new Set<string>());
// executionVersion is incremented when a new auto-save starts, used to abort if new changes come in
const executionVersionRef = useRef(0);
```

**Purpose**:
- Track which fields have changed during debounce period
- Support partial field validation (only changed + dependent fields)
- Prevent race conditions with execution versioning

**Relevance to Normal Debounce**:
- These refs are used regardless of debounce mode
- Critical for validation coordination
- Must continue working with normal debounce

---

## 4. Debounce Function Creation (useEffect)

**Location**: Lines 534-567

```typescript
useEffect(() => {
  // When debounce is false, use immediate execution (no debouncing)
  if (debounceMs === false) {
    const immediateFn = Object.assign(() => {
      executeAutoSave();
    }, {
      cancel: () => {}, // No-op for immediate function
      flush: () => executeAutoSave(), // Execute immediately on flush
      pending: () => false, // Never pending when immediate
    }) as DebouncedFunction;

    debouncedSubmitRef.current = immediateFn;
    return () => {};
  }

  // Normal debounce behavior
  const debouncedFn = debounce(() => {
    executeAutoSave();
  }, debounceMs);

  // Attach lodash-style methods
  const fn = Object.assign(debouncedFn, {
    pending: () => false,
  }) as DebouncedFunction;

  debouncedSubmitRef.current = fn;

  return () => {
    debouncedFn.cancel();
  };
}, [executeAutoSave, debounceMs]);
```

### Key Analysis

**Immediate Path (`debounceMs === false`)**:
- Creates a function that calls `executeAutoSave()` immediately
- `cancel()` is a no-op (nothing to cancel)
- `flush()` executes immediately
- `pending()` always returns false
- No cleanup needed (return empty function)

**Normal Debounce Path (`debounceMs` is number)**:
- Uses lodash `debounce()` function
- Waits for `debounceMs` milliseconds before calling `executeAutoSave()`
- `cancel()` cancels pending debounce
- `pending()` returns whether debounce is pending
- Cleanup cancels debounce on unmount

**Critical Point**: The two paths are mutually exclusive. When `debounceMs` is a number, only the normal debounce code runs.

---

## 5. changeField Function - Conditional Execution

**Location**: Lines 299-324

```typescript
const changeField = useCallback(
  (name: string, value: unknown, inputConfig?: InputConfig) => {
    // ... (field value updates)

    // Auto-save trigger
    if (autoSave) {
      // Accumulate this change
      pendingChangedFields.current.add(name);

      // Add affected fields (those that depend on this field via conditions)
      const affected = getAffectedFields(name);
      for (const field of affected) {
        pendingAffectedFields.current.add(field);
      }

      // Trigger auto-save (immediate or debounced based on inputConfig)
      if (inputConfig?.debounce === false) {
        // Immediate submission: bypass debounce entirely
        // This is for field-level debounce: false override
        executeAutoSaveRef.current?.();
      } else {
        // Normal debounced submission
        debouncedSubmitRef.current?.();
      }
    }
  },
  [autoSave, getAffectedFields],
);
```

### Key Analysis

**Immediate Path** (`inputConfig?.debounce === false`):
- Calls `executeAutoSaveRef.current?.()` directly
- Bypasses `debouncedSubmitRef` entirely
- Used for field-level immediate submission

**Normal Debounce Path** (else branch):
- Calls `debouncedSubmitRef.current?.()`
- Uses the debounced function created in useEffect
- This is the **DEFAULT behavior** when `inputConfig` is undefined or doesn't contain `debounce: false`

**Critical Point**: The normal debounce path is the `else` branch. It executes when:
- `inputConfig` is `undefined` (most common case)
- `inputConfig` exists but doesn't have `debounce: false`
- `inputConfig.debounce` is a number (future enhancement possibility)

---

## 6. Backward Compatibility Analysis

### What Changes with `debounce: false` Feature?

**Before** (only normal debounce):
```typescript
// Old code path (simplified)
const changeField = (name, value) => {
  if (autoSave) {
    debouncedSubmitRef.current?.();
  }
};
```

**After** (with debounce: false support):
```typescript
// New code path
const changeField = (name, value, inputConfig?) => {
  if (autoSave) {
    if (inputConfig?.debounce === false) {
      executeAutoSaveRef.current?.(); // NEW: immediate path
    } else {
      debouncedSubmitRef.current?.(); // EXISTING: normal path
    }
  }
};
```

### Backward Compatibility Guarantees

1. **Parameter is Optional**: `inputConfig?` is optional
   - Existing code that doesn't pass `inputConfig` works unchanged
   - `undefined?.debounce` is `undefined`, which is `!== false`

2. **Default is Normal Debounce**: The `else` branch preserves existing behavior
   - When `inputConfig` is `undefined`, normal debounce runs
   - When `inputConfig` is `{}`, normal debounce runs
   - When `inputConfig.debounce` is anything other than `false`, normal debounce runs

3. **No Changes to Debounce Function**: The normal debounce implementation is unchanged
   - Still uses lodash `debounce()`
   - Still has same timing behavior
   - Still has same coalescing behavior

---

## 7. Execution Flow for Normal Debounce

### Step-by-Step: What Happens When a Field Changes

**Input**: User types in a field with normal debounce (no `inputConfig` override)

```
1. User types character 'x' in field
   ↓
2. Field component calls onChange('x')
   ↓
3. Field component calls changeField('fieldName', 'x', undefined)
   ↓
4. changeField adds 'fieldName' to pendingChangedFields
   ↓
5. changeField checks: inputConfig?.debounce === false?
   - inputConfig is undefined
   - undefined?.debounce is undefined
   - undefined === false? NO
   ↓
6. Executes else branch: debouncedSubmitRef.current?.()
   ↓
7. lodash debounce starts timer (e.g., 500ms)
   ↓
8. [User types more characters]
   - Each call restarts the debounce timer
   - lodash coalesces rapid changes
   ↓
9. After 500ms of no changes:
   - lodash calls executeAutoSave()
   ↓
10. executeAutoSave() validates and submits
```

### Key Points

- **Step 5 is the critical decision point**: When `inputConfig` is `undefined`, the condition `inputConfig?.debounce === false` evaluates to `false`, causing the `else` branch to execute.

- **Normal debounce uses lodash**: The `debouncedSubmitRef` contains a lodash-debounced function that has all the normal debounce behaviors (coalescing, timer reset, etc.).

- **No changes to existing flow**: The only difference is an optional parameter that most code won't use.

---

## 8. Testing Implications

### What Tests Need to Verify

For P1.M2.T2.S2 (Test Normal Debounce Preserved), tests must verify:

1. **undefined inputConfig uses normal debounce**
   ```typescript
   <Field name="fieldA" /> // No inputConfig prop
   // Should use form-level debounce
   ```

2. **Empty inputConfig uses normal debounce**
   ```typescript
   <Field name="fieldA" inputConfig={{}} /> // Empty object
   // Should use form-level debounce
   ```

3. **Form-level debounce prop is respected**
   ```typescript
   <Form debounce={750}> // Custom debounce value
   <Field name="fieldA" />
   // Should use 750ms debounce
   ```

4. **Default 1000ms debounce is used**
   ```typescript
   <Form> // No debounce prop
   <Field name="fieldA" />
   // Should use 1000ms default debounce
   ```

5. **All existing tests still pass**
   - Tests 1-6 from autosave-validation.test.tsx
   - These don't use `inputConfig` at all
   - Any failure indicates regression

---

## 9. Common Pitfalls to Avoid

### Pitfall 1: Assuming inputConfig is Always Defined

```typescript
// WRONG: Assumes inputConfig exists
if (inputConfig.debounce === false) { // TypeError if inputConfig is undefined
  // immediate
}

// CORRECT: Uses optional chaining
if (inputConfig?.debounce === false) {
  // immediate
}
```

**Current Implementation**: ✅ Correct - uses `inputConfig?.debounce`

---

### Pitfall 2: Changing Default Behavior

```typescript
// WRONG: Makes debounce: false the default
if (inputConfig?.debounce !== true) { // Inverted logic
  // immediate
}

// CORRECT: Keeps normal debounce as default
if (inputConfig?.debounce === false) { // Explicit false check
  // immediate
} else {
  // normal debounce (default)
}
```

**Current Implementation**: ✅ Correct - normal debounce is the `else` branch (default)

---

### Pitfall 3: Breaking Lodash Debounce Features

```typescript
// WRONG: Bypasses lodash debounce coalescing
const changeField = (name, value, inputConfig?) => {
  if (inputConfig?.debounce === false) {
    executeAutoSave();
  }
  // Always calls debouncedSubmit, even when immediate
  debouncedSubmitRef.current?.();
};

// CORRECT: Mutual exclusive paths
const changeField = (name, value, inputConfig?) => {
  if (inputConfig?.debounce === false) {
    executeAutoSave();
  } else {
    debouncedSubmitRef.current?.(); // Only for normal debounce
  }
};
```

**Current Implementation**: ✅ Correct - uses if/else, not both paths

---

## 10. Summary

### Normal Debounce Implementation

1. **Default Value**: 1000ms (configurable via Form prop)
2. **Implementation**: lodash `debounce()` function
3. **Code Path**: `changeField()` → `debouncedSubmitRef.current?.()` → lodash debounce → `executeAutoSave()`
4. **Features**:
   - Coalesces rapid changes into single submission
   - Resets timer on each new change
   - Supports cancellation on unmount
   - Validates only changed + dependent fields

### Integration with debounce: false

1. **Optional Parameter**: `inputConfig?: InputConfig` added to `changeField`
2. **Conditional Check**: `if (inputConfig?.debounce === false)`
3. **Default Preserved**: `else` branch maintains normal debounce
4. **No Breaking Changes**: Existing code without `inputConfig` works unchanged

### Backward Compatibility

✅ **Guaranteed** because:
- `inputConfig` is optional
- Default behavior is in `else` branch
- Existing debounce implementation unchanged
- All existing tests should pass without modification

---

## Code References

| Component | File | Lines | Description |
|-----------|------|-------|-------------|
| Form Props | packages/react/src/components/Form.tsx | 58-62 | debounce?: number \| false type |
| Default Value | packages/react/src/components/Form.tsx | 136 | `debounce = 1000` |
| State Refs | packages/react/src/components/Form.tsx | 191-196 | pendingChangedFields, executionVersionRef |
| changeField | packages/react/src/components/Form.tsx | 299-324 | Conditional execution logic |
| Debounce Setup | packages/react/src/components/Form.tsx | 534-567 | useEffect with immediate/debounce paths |
| InputConfig Type | packages/core/src/types/config.ts | 45-78 | InputConfig interface |

---

## Test Coverage Matrix

| Scenario | inputConfig | debounce Prop | Expected Behavior | Test Coverage |
|----------|-------------|---------------|-------------------|---------------|
| Default debounce | undefined | undefined | 1000ms debounce | ⚠️ Need test |
| Custom debounce | undefined | 750 | 750ms debounce | ⚠️ Need test |
| Field override | `{ debounce: false }` | 500 | Immediate | ✅ Test exists (P1.M2.T2.S1) |
| Normal field | undefined | 500 | 500ms debounce | ✅ Test exists (multiple) |
| Empty inputConfig | `{}` | 500 | 500ms debounce | ⚠️ Need test |

**Legend**: ✅ Covered | ⚠️ Needs coverage | ❌ Missing

**P1.M2.T2.S2 Goal**: Add tests for the ⚠️ scenarios to explicitly verify normal debounce is preserved.
