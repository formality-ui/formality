# Catalog of Existing Debounce Tests

## Overview
This document catalogs all existing debounce-related tests in the codebase to understand what's already tested and what gaps exist.

## Existing Tests in autosave-validation.test.tsx

### 1. Normal Debounce Tests (Pre-existing)

#### Test: "should NOT validate ALL fields when ONE field changes with autoSave"
- **Lines**: 94-152
- **Behavior**: Verifies only changed field validates after debounce
- **Debounce Value**: 500ms
- **Pattern**:
  - Change fieldA
  - Advance 600ms (500ms debounce + buffer)
  - Assert only fieldA validated
- **Status**: PASSING - This test verifies normal debounce behavior

#### Test: "should validate dependent fields but NOT independent fields"
- **Lines**: 156-207
- **Behavior**: Validates conditional field dependencies
- **Debounce Value**: 500ms
- **Status**: PASSING - Tests dependent field validation coordination

#### Test: "should wait for async validators to complete before submitting"
- **Lines**: 211-265
- **Behavior**: Async validation completes before submit
- **Debounce Value**: 500ms
- **Status**: PASSING - Tests timing coordination

#### Test: "should debounce multiple rapid changes and only submit once"
- **Lines**: 269-307
- **Behavior**: Single submission for rapid changes
- **Debounce Value**: 500ms
- **Status**: PASSING - Tests debounce coalescing

#### Test: "should reset debounce timer when new change comes in"
- **Lines**: 309-371
- **Behavior**: Debounce timer restarts on new changes
- **Debounce Value**: 500ms
- **Pattern**:
  - Change fieldA, wait 300ms (partial)
  - Change fieldB, wait 300ms (still partial)
  - Assert no submission
  - Wait final 300ms
  - Assert submission happens
- **Status**: PASSING - Tests debounce reset behavior

#### Test: "should NOT submit if validation fails"
- **Lines**: 375-408
- **Behavior**: No submission on validation failure
- **Debounce Value**: 100ms
- **Status**: PASSING - Tests error handling

### 2. Immediate Submission Tests (Added in P1.M2.T2.S1)

#### Test: "should call submitHandler immediately when inputConfig.debounce is false"
- **Lines**: 412-456
- **Behavior**: Immediate submission with debounce: false
- **Debounce Value**: 500ms (form level), false (field level)
- **Status**: NEW - Tests debounce: false feature

#### Test: "should contrast with normal debounce behavior"
- **Lines**: 458-506
- **Behavior**: Compares immediate vs debounced fields
- **Status**: NEW - Tests both behaviors in same test

## Key Insights

### What's Already Tested
1. **Normal debounce timing** - Tests verify 500ms delay is respected
2. **Debounce reset** - Tests verify timer restarts on new changes
3. **Multiple rapid changes** - Tests verify coalescing into one submission
4. **Validation coordination** - Tests verify validation runs before submit
5. **Immediate submission** - Tests verify debounce: false bypasses delay

### Gaps in Testing
1. **Default debounce value** - No test explicitly verifies the 1000ms default
2. **Form-level debounce: false** - Only field-level inputConfig tested
3. **Custom debounce values** - No tests with debounce values other than 500/1000
4. **Explicit regression tests** - No tests that explicitly state "normal debounce is preserved after debounce: false feature"

## Test File Structure

```
describe("AutoSave Validation Coordination", () => {
  describe("ROOT CAUSE: All fields validating on any change", () => { ... });
  describe("Dependent Field Validation", () => { ... });
  describe("Async Validation Waiting", () => { ... });
  describe("Cascading Changes", () => { ... });
  describe("Validation Errors", () => { ... });
  describe("Immediate Submission (debounce: false)", () => { ... });
});
```

## Recommended Additions for P1.M2.T2.S2

1. **Add "Normal Debounce Behavior" describe block** - Explicit tests for normal debounce preservation
2. **Add regression test** - Specifically stating "normal debounce unchanged after debounce: false"
3. **Add default debounce value test** - Verify 1000ms default when no debounce prop provided
4. **Document existing tests** - Ensure they're run as part of regression check
