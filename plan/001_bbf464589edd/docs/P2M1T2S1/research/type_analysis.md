# Type Analysis for P2.M1.T2.S1 - FieldStateInput Verification

## Overview

This document analyzes the current state of `FieldStateInput` and `FieldState` types in the Formality codebase, focusing on the `disabled` property.

## Current Type Definitions

### FieldStateInput (packages/core/src/conditions/evaluate.ts)

```typescript
export interface FieldStateInput {
  value: unknown;
  isTouched?: boolean;
  isDirty?: boolean;
  isValidating?: boolean;
  error?: unknown;
  invalid?: boolean;
  disabled?: boolean;  // ← Already exists at line 27
}
```

**Status**: ✅ **`disabled?: boolean` property already exists**

### FieldState (packages/core/src/types/state.ts)

```typescript
export interface FieldState {
  value: unknown;
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  error?: FieldError;
  invalid: boolean;
  watchers?: Record<string, boolean>;
}
```

**Status**: ❌ **Missing `disabled` property**

## Type Consistency Analysis

| Property | FieldState | FieldStateInput | FIELD_STATE_PROPERTIES |
|----------|------------|----------------|----------------------|
| value | ✅ | ✅ | ✅ |
| isTouched | ✅ | ✅ | ✅ |
| isDirty | ✅ | ✅ | ✅ |
| isValidating | ✅ | ✅ | ✅ |
| error | FieldError | unknown | ✅ |
| invalid | ✅ | ✅ | ✅ |
| disabled | ❌ | ✅ | ✅ |

## Critical Finding: FIELD_STATE_PROPERTIES Inconsistency

In `packages/core/src/expression/context.ts` line 46:

```typescript
const FIELD_STATE_PROPERTIES = new Set([
  "value",
  "isTouched",
  "isDirty",
  "isValidating",
  "error",
  "invalid",
  "disabled",  // ❌ This property doesn't exist in FieldState interface!
]);
```

**Impact**: Accessing `field.disabled` on a field state proxy returns `undefined`, even though the expression system expects it to work.

## Related Types with disabled Property

The `disabled` property already exists in these related types:

1. **FieldConfig** (packages/core/src/types/config.ts line 97):
   ```typescript
   export interface FieldConfig {
     // ...
     disabled?: boolean;
   }
   ```

2. **ConditionResult** (packages/core/src/types/conditions.ts line 143):
   ```typescript
   export interface ConditionResult {
     disabled?: boolean;
     // ...
   }
   ```

3. **ConditionDescriptor** (packages/core/src/types/conditions.ts line 101):
   ```typescript
   export interface ConditionDescriptor {
     disabled?: boolean;
     // ...
   }
   ```

## Usage Patterns

### FieldStateInput Usage
- **Location**: `packages/core/src/conditions/evaluate.ts`
- **Purpose**: Input type for condition evaluation
- **Consumers**: `useConditions.ts`, `useFieldDisabledState.ts` in React package
- **Context**: Represents field state with optional properties for condition evaluation

### FieldState Usage
- **Location**: `packages/core/src/types/state.ts`
- **Purpose**: Canonical field state type for form state tracking
- **Consumers**: Expression evaluation, form context, state management
- **Context**: Represents complete field state during runtime

## isDisabled Matcher Implementation

In `packages/core/src/conditions/evaluate.ts` lines 78-84:

```typescript
// Check isDisabled matcher
if (matcher.isDisabled !== undefined) {
  const isFieldDisabled = fieldState?.disabled ?? false;
  if (matcher.isDisabled !== isFieldDisabled) {
    return false;
  }
}
```

**Current Behavior**: Returns `false` when `disabled` is `undefined` (fallback to `false`).

**Expected Behavior After Fix**: Returns actual `disabled` state when populated.

## Recommendations

### Immediate Fix
Add `disabled?: boolean` to `FieldState` interface:

```typescript
export interface FieldState {
  value: unknown;
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  error?: FieldError;
  invalid: boolean;
  disabled?: boolean;  // ← Add this property
  watchers?: Record<string, boolean>;
}
```

### Consistency Improvements
1. Make `disabled` optional to maintain backward compatibility
2. Consider standardizing `error` type to `FieldError` in `FieldStateInput`
3. Ensure `FIELD_STATE_PROPERTIES` matches `FieldState` interface exactly

## Conclusion

**FieldStateInput** already has the `disabled?: boolean` property (✅ Complete).

**FieldState** is missing the `disabled` property and should be updated for consistency (❌ Needs Fix).

The `disabled` property is critical for:
- isDisabled matcher functionality
- Multi-field disabled conditions
- Expression evaluation of field.disabled
- Two-pass evaluation in useConditions hook
