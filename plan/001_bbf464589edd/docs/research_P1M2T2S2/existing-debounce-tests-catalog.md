# Existing Debounce Tests Catalog

## Overview

This document catalogs all existing debounce tests in the codebase as part of P1.M2.T2.S2 research for ensuring backward compatibility when adding `debounce: false` feature.

## Test File: autosave-validation.test.tsx

**Location**: `packages/react/src/__tests__/autosave-validation.test.tsx`

**Total Tests**: 8 existing tests (before P1.M2.T2.S1 and P1.M2.T2.S2 additions)

### Test Structure

```
describe("AutoSave Validation Coordination", () => {
  describe("ROOT CAUSE: All fields validating on any change", () => {
    it("should NOT validate ALL fields when ONE field changes with autoSave")
  })

  describe("Dependent Field Validation", () => {
    it("should validate dependent fields but NOT independent fields")
  })

  describe("Async Validation Waiting", () => {
    it("should wait for async validators to complete before submitting")
  })

  describe("Cascading Changes", () => {
    it("should debounce multiple rapid changes and only submit once")
    it("should reset debounce timer when new change comes in")
  })

  describe("Validation Errors", () => {
    it("should NOT submit if validation fails")
  })

  describe("Immediate Submission (debounce: false)", () => {
    it("should call submitHandler immediately when inputConfig.debounce is false")
    it("should contrast with normal debounce behavior")
  })
})
```

## Detailed Test Catalog

### 1. ROOT CAUSE: Selective Validation (Line 94-152)

**Test**: "should NOT validate ALL fields when ONE field changes with autoSave"

**Purpose**: Verifies that only the changed field validates, not all fields in the form.

**Debounce Configuration**:

- Form: `debounce={500}`
- Fields: `fieldA`, `fieldB`, `fieldC` (all with async validators)

**Key Assertions**:

- After changing `fieldA` only: `fieldBValidations.length === 0`
- After changing `fieldA` only: `fieldCValidations.length === 0`

**Timer Usage**:

```typescript
await vi.advanceTimersByTimeAsync(100); // Initial render
await vi.advanceTimersByTimeAsync(600); // Past debounce period
```

**Backward Compatibility Concern**: None - tests field validation scope, not debounce timing.

---

### 2. Dependent Field Validation (Line 156-207)

**Test**: "should validate dependent fields but NOT independent fields"

**Purpose**: Verifies conditional field validation based on field dependencies.

**Debounce Configuration**:

- Form: `debounce={500}`

**Key Assertions**:

- `fieldCValidations.length === 0` (independent field doesn't validate)

**Timer Usage**:

```typescript
await vi.advanceTimersByTimeAsync(600);
```

**Backward Compatibility Concern**: None - tests conditional validation, not debounce timing.

---

### 3. Async Validation Waiting (Line 210-265)

**Test**: "should wait for async validators to complete before submitting"

**Purpose**: Verifies submit happens AFTER async validation completes.

**Debounce Configuration**:

- Form: `debounce={500}`
- Validator delay: `100ms`

**Key Assertions**:

- `submitIndex > validationEndIndex` (submit after validation)

**Timer Usage**:

```typescript
await vi.advanceTimersByTimeAsync(600); // Past debounce
await vi.advanceTimersByTimeAsync(200); // Past async validation
```

**Backward Compatibility Concern**: **CRITICAL** - This test verifies the coordination between debounce and async validation. The new `debounce: false` feature must NOT break this coordination.

---

### 4. Cascading Changes - Coalescing (Line 268-307)

**Test**: "should debounce multiple rapid changes and only submit once"

**Purpose**: Verifies debounce coalesces rapid changes into single submission.

**Debounce Configuration**:

- Form: `debounce={500}`

**Key Assertions**:

- `submitHandler.mock.calls.length === 1` (only one submit)
- Submit contains final value: `"hello"`

**Timer Usage**:

```typescript
await vi.advanceTimersByTimeAsync(600);
```

**Backward Compatibility Concern**: **CRITICAL** - This is the core debounce behavior test. The new `debounce: false` feature must NOT affect normal debounce coalescing.

---

### 5. Cascading Changes - Timer Reset (Line 309-371)

**Test**: "should reset debounce timer when new change comes in"

**Purpose**: Verifies debounce timer resets on each change.

**Debounce Configuration**:

- Form: `debounce={500}`

**Key Assertions**:

```typescript
// After 300ms (less than debounce)
expect(submitHandler).not.toHaveBeenCalled();

// After second change + 300ms (600ms total from first)
expect(submitHandler).not.toHaveBeenCalled(); // Timer reset!

// After another 300ms (900ms total from first, 300ms from second)
expect(submitHandler).toHaveBeenCalledTimes(1); // Finally submits
```

**Timer Usage**:

```typescript
await vi.advanceTimersByTimeAsync(300); // Partial debounce
await vi.advanceTimersByTimeAsync(300); // Still partial
await vi.advanceTimersByTimeAsync(300); // Complete debounce from second change
```

**Backward Compatibility Concern**: **CRITICAL** - This verifies the timer reset behavior. The new feature must preserve this.

---

### 6. Validation Errors (Line 374-408)

**Test**: "should NOT submit if validation fails"

**Purpose**: Verifies validation failure prevents submission.

**Debounce Configuration**:

- Form: `debounce={100}`

**Key Assertions**:

```typescript
expect(submitHandler).not.toHaveBeenCalled();
```

**Timer Usage**:

```typescript
await vi.advanceTimersByTimeAsync(300);
```

**Backward Compatibility Concern**: None - tests validation error handling, not debounce timing.

---

### 7. Immediate Submission (Line 411-460)

**Test**: "should call submitHandler immediately when inputConfig.debounce is false"

**Purpose**: Verifies `debounce: false` causes immediate submission.

**Debounce Configuration**:

- Form: `debounce={500}` (normal debounce)
- Field: `inputConfig={{ debounce: false }}` (override)

**Key Assertions**:

```typescript
// After only 100ms (well before 500ms debounce)
expect(submitHandler).toHaveBeenCalledTimes(1); // IMMEDIATE!
```

**Timer Usage**:

```typescript
await vi.advanceTimersByTimeAsync(100); // Only for async validation
```

**Backward Compatibility Concern**: This is the NEW feature being added, not a backward compatibility concern.

---

### 8. Contrast Test (Line 462-527)

**Test**: "should contrast with normal debounce behavior"

**Purpose**: Shows difference between immediate and normal debounce.

**Debounce Configuration**:

- Form: `debounce={500}`
- Field 1: `inputConfig={{ debounce: false }}` (immediate)
- Field 2: No inputConfig (normal debounce)

**Key Assertions**:

```typescript
// Immediate field: submits after 100ms
expect(submitHandler).toHaveBeenCalledTimes(1);

// Debounced field: still not submitted after 100ms
expect(submitHandler).toHaveBeenCalledTimes(1); // Still 1

// After advancing past debounce
expect(submitHandler).toHaveBeenCalledTimes(2); // Now 2
```

**Timer Usage**:

```typescript
await vi.advanceTimersByTimeAsync(100); // Immediate submits
await vi.advanceTimersByTimeAsync(500); // Debounced submits
```

**Backward Compatibility Concern**: This test explicitly validates that normal debounce behavior is preserved.

---

## Key Insights

### 1. Debounce Values Used in Tests

| Test     | Debounce Value | Buffer Used | Total Advance |
| -------- | -------------- | ----------- | ------------- |
| Test 1-5 | 500ms          | 100ms       | 600ms         |
| Test 6   | 100ms          | 200ms       | 300ms         |
| Test 7-8 | 500ms          | 100ms       | 600ms         |

**Pattern**: Tests use `debounce + 100ms` buffer for advancing timers.

### 2. Default Debounce Value

**Code Reference**: `packages/react/src/components/Form.tsx` line 136

```typescript
const { debounce = 1000 } = props;
```

**Default**: `1000ms`

**Test Coverage Gap**: None of the existing tests explicitly verify the 1000ms default. All tests use explicit `debounce` prop.

### 3. Critical Backward Compatibility Tests

**Tests that MUST continue to pass after adding `debounce: false`**:

1. **Test 4**: Debounce coalescing (rapid changes → single submission)
2. **Test 5**: Timer reset (new changes restart debounce timer)
3. **Test 3**: Async validation coordination (submit waits for validation)

These tests verify the core debounce behavior that must be preserved.

### 4. Test Naming Conventions

- Descriptive: "should [expected behavior] when [condition]"
- Contrast tests: "should contrast with [other behavior]"
- Root cause tests: Labelled "ROOT CAUSE:" for bug fix verification

### 5. Common Test Patterns

**Setup Pattern**:

```typescript
beforeEach(() => {
  validationCalls = [];
  submitHandler = vi.fn();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});
```

**User Input Pattern**:

```typescript
await act(async () => {
  await userEvent.type(field, "value", { delay: null });
});
```

**Timer Advancement Pattern**:

```typescript
await act(async () => {
  await vi.advanceTimersByTimeAsync(600);
});
```

**Assertion Pattern**:

```typescript
await waitFor(() => {
  expect(submitHandler).toHaveBeenCalledTimes(1);
});
```

### 6. Validation Tracking Pattern

```typescript
let validationCalls: string[] = [];

function createAsyncValidator(fieldName: string, delayMs: number = 50) {
  return async (value: unknown) => {
    validationCalls.push(`${fieldName}:start`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    validationCalls.push(`${fieldName}:end`);
    return true;
  };
}
```

This pattern tracks validation call order and timing.

### 7. Test Component Pattern

```typescript
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  ),
);
```

All test inputs use `data-testid` for querying.

---

## Backward Compatibility Requirements

### For P1.M2.T2.S2 (Test Normal Debounce Preserved)

The following must be true after implementing `debounce: false`:

1. **Tests 1-6 must pass without modification**
   - These tests don't use `inputConfig` at all
   - They verify core debounce behavior
   - Any failure indicates a regression

2. **Test 7-8 must pass**
   - These test the new `debounce: false` feature
   - Already implemented in P1.M2.T2.S1

3. **New regression tests should be added**
   - Explicitly verify default 1000ms debounce
   - Explicitly verify form-level debounce prop works
   - Explicitly verify undefined inputConfig uses normal debounce
   - Explicitly verify empty inputConfig uses normal debounce

---

## Test Execution Commands

```bash
# Run all autosave validation tests
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx

# Run specific test by name
pnpm test -t "should NOT validate ALL fields"

# Run with verbose output
pnpm test packages/react/src/__tests__/autosave-validation.test.tsx --reporter=verbose

# Count total tests
grep -c "it(" packages/react/src/__tests__/autosave-validation.test.tsx
```

---

## Summary

**Total Existing Tests**: 8 (6 normal debounce, 2 immediate submission)

**Critical for Regression**: Tests 3, 4, 5 (async validation, coalescing, timer reset)

**Test Coverage Gaps**:

- No explicit test for 1000ms default debounce value
- No explicit test distinguishing undefined vs empty inputConfig

**Recommended Additions for P1.M2.T2.S2**:

1. Test for default 1000ms debounce
2. Test for form-level debounce override
3. Test for undefined inputConfig (normal debounce)
4. Test for empty inputConfig (normal debounce)
5. Explicit "wait for debounce" regression test
