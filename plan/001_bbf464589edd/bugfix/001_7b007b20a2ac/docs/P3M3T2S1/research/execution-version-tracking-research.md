# Execution Version Tracking Research

**Work Item:** P3.M3.T2.S1 - Test rapid changes
**Date:** 2026-01-13

## Summary

This document summarizes the `executionVersionRef` race condition prevention mechanism that needs to be tested.

---

## 1. Implementation Location

**File:** `packages/react/src/components/Form.tsx`

**Key Sections:**
- Line 196: `executionVersionRef` declaration
- Lines 441-469: `waitForFieldValidation` with version check
- Lines 475-556: `executeAutoSave` function with three version checkpoints

---

## 2. How executionVersionRef Works

### Version Increment Pattern

```typescript
// Line 196: Declaration
const executionVersionRef = useRef(0);

// In executeAutoSave (line 477):
executionVersionRef.current++;
const executionVersion = executionVersionRef.current;
```

**Key Point:** Version is incremented BEFORE capturing fields to ensure proper tracking.

### Three Version Checkpoints

The implementation checks the version at THREE critical points during async operations:

#### Checkpoint 1: After Initial Validation (lines 503-508)
```typescript
const validationsComplete = await waitForFieldValidation(
  fieldsToWaitFor,
  executionVersion,
);

// Abort if version changed while waiting
if (!validationsComplete || executionVersionRef.current !== executionVersion) {
  return;
}
```

#### Checkpoint 2: After Trigger Validation (lines 524-526)
```typescript
const isValid = await methods.trigger(fieldsToTrigger as any);

// Abort if version changed
if (executionVersionRef.current !== executionVersion) {
  return;
}
```

#### Checkpoint 3: After Final Validation (lines 539-544)
```typescript
const postTriggerComplete = await waitForFieldValidation(
  fieldsToTrigger,
  executionVersion,
);

// Abort if version changed
if (!postTriggerComplete || executionVersionRef.current !== executionVersion) {
  return;
}
```

### Final Submission (lines 547-550)
```typescript
// Only submit if version still matches (no new changes)
if (executionVersionRef.current === executionVersion) {
  await handleSubmit(values as TFieldValues);
}
```

---

## 3. waitForFieldValidation Version Check

**Location:** Lines 441-469

```typescript
const waitForFieldValidation = useCallback(
  async (fields: string[], version: number): Promise<boolean> => {
    // ... field validation logic ...

    const startTime = Date.now();
    const maxWaitMs = 10000; // 10 second timeout

    // CRITICAL: Version check INSIDE polling loop
    while (Date.now() - startTime < maxWaitMs) {
      // Check if version changed (abort immediately)
      if (executionVersionRef.current !== version) {
        return false;
      }

      // Check validation status...
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return validatingFields.current.size === 0;
  },
  [executionVersionRef],
);
```

**Key Point:** Version is checked inside the polling loop, allowing immediate abort when new changes occur.

---

## 4. Test Scenarios to Cover

### Scenario 1: Rapid Single-Field Changes
**Description:** User types 10 characters rapidly within debounce period.

**Expected Behavior:**
1. Each character increments `executionVersionRef.current`
2. Only the last version reaches submission
3. Intermediate versions are aborted at checkpoints
4. Final submission contains only the final value

### Scenario 2: Rapid Changes During Async Validation
**Description:** New field changes occur while validation is in progress.

**Expected Behavior:**
1. First change starts validation, increments version
2. Second change increments version while first validation running
3. First validation completes but version check fails (abort)
4. Second validation completes and version check succeeds
5. Only the second value is submitted

### Scenario 3: Multiple Fields Rapid Changes
**Description:** Rapid changes across multiple fields.

**Expected Behavior:**
1. Each field change increments version
2. Debounce timer resets on each change
3. Final submission includes all fields' last values
4. Only ONE submission occurs

### Scenario 4: Component Unmount During Operation
**Description:** Component unmounts while async operation is in progress.

**Expected Behavior:**
1. Async operation is in progress
2. Component unmounts
3. Version check prevents stale state updates
4. No errors or warnings

---

## 5. Version Tracking Flow Diagram

```
User Input "a"
    ↓
executeAutoSave() called
    ↓
executionVersionRef: 0 → 1
captured version = 1
    ↓
[Async Operation Starts]
    ↓
User Input "b" (while async operation running)
    ↓
executeAutoSave() called again
    ↓
executionVersionRef: 1 → 2
captured version = 2
    ↓
[First async operation completes]
    ↓
Checkpoint: executionVersionRef.current (2) !== captured version (1)
    ↓
ABORT first operation
    ↓
[Second async operation completes]
    ↓
Checkpoint: executionVersionRef.current (2) === captured version (2)
    ↓
SUBMIT with second value
```

---

## 6. Why Three Checkpoints Are Necessary

Each checkpoint protects against a different scenario:

1. **Checkpoint 1 (after initial validation):**
   - Prevents stale save if validation completes after new changes
   - Example: User types "a", validation starts, user types "b", validation completes

2. **Checkpoint 2 (after trigger validation):**
   - Prevents stale save after cross-field validation
   - Example: Field A changes, triggers Field B validation, Field A changes again

3. **Checkpoint 3 (after final validation):**
   - Prevents stale save after triggered field validation
   - Example: Field B validation completes, but Field A changed again

All three checkpoints are NECESSARY for complete race condition prevention.

---

## 7. Related Patterns in Codebase

### useSubscriptions runIdRef Pattern

**File:** `packages/react/src/hooks/useSubscriptions.ts`

Similar version tracking pattern for preventing over-cleanup:

```typescript
// Line 36: Per-effect run ID tracking
const runIdRef = useRef(0);

// Line 44-48: Capture run-specific subscriptions
const currentRunId = ++runIdRef.current;
runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

// Line 66-85: Cleanup only removes subscriptions from THIS run
const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId);
if (thisRunSubscriptions) {
  [...thisRunSubscriptions].reverse().forEach((target) => {
    removeSubscription(target, fieldName);
  });
  runSubscriptionsRef.current.delete(currentRunId);
}
```

This demonstrates the same pattern: track a version/token and only operate if it matches.

---

## 8. Edge Cases Handled

### React 18 Strict Mode
- Double-invocation is handled correctly
- First mount: version = 1, unmount: cleanup
- Second mount: version = 2 (NEW version), no stale updates

### Rapid Changes (>10 within debounce)
- Version counter handles rapid increments
- No overflow concerns (would take 285,374+ years)

### Component Unmount
- Version check prevents state updates after unmount
- No memory leaks from tracking data

### Multiple Debounce Resets
- Each new change increments version
- Previous versions are properly aborted

---

## 9. Test Verification Points

When testing execution version tracking, verify:

1. **Version Increment:** Version increments before each async operation
2. **Checkpoint 1 Abort:** First checkpoint aborts when version changes
3. **Checkpoint 2 Abort:** Second checkpoint aborts when version changes
4. **Checkpoint 3 Abort:** Third checkpoint aborts when version changes
5. **Final Submission:** Only occurs when version still matches
6. **No Stale Updates:** Intermediate values never reach submission
7. **Memory Safety:** No orphaned operations or memory leaks

---

## 10. Related Analysis Documents

- `plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/docs/P3M3T1S1/ANALYSIS.md` - Comprehensive analysis
- `plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M3T1S1/research/external-race-condition-research.md` - External research
