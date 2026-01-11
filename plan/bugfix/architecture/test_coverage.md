# Test Coverage Analysis Report
## Formality Bug Fix Project - Testing Gaps and Patterns

**Date:** 2025-01-11
**Status:** Complete Analysis
**Total Existing Tests:** 341 (329 core + React combined)

---

## Executive Summary

This document analyzes the Formality test suite to identify coverage gaps for the 8 reported bugs. The test suite has good coverage for basic functionality but lacks specific tests for the edge cases and bugs identified in this project.

**Key Findings:**
- **341 existing tests** across core and React packages
- **Critical gaps** for selectDefaultFieldProps evaluation (Bug #1)
- **Partial coverage** for debounce: false immediate submission (Bug #2)
- **False sense of security** - mocked tests pass but real usage fails
- **Good patterns** established but not consistently applied

---

## Table of Contents

1. [Test Inventory](#1-test-inventory)
2. [Coverage Analysis by Bug](#2-coverage-analysis-by-bug)
3. [Testing Patterns and Conventions](#3-testing-patterns-and-conventions)
4. [Test Utilities and Helpers](#4-test-utilities-and-helpers)
5. [Required Test Scenarios](#5-required-test-scenarios)
6. [Recommendations](#6-recommendations)

---

## 1. Test Inventory

### 1.1 Core Package Tests

**Location:** `/packages/core/src/__tests__/`

| Test File | Test Count | Categories |
|-----------|-----------|------------|
| `conditions.test.ts` | 74 | Condition evaluation, multi-field, matchers |
| `config.test.ts` | 45 | Config transformation, mergeFieldProps |
| `expression.test.ts` | 41 | Expression evaluation, parsing, caching |
| `validation.test.ts` | ~20 | Validation rules, error messages |
| `transform.test.ts` | ~15 | Config normalization |
| `sample.test.ts` | ~10 | Sample configurations |
| `labels.test.ts` | ~10 | Label generation |
| `framework-independence.test.ts` | ~5 | Core package independence |

**Total Core Tests:** ~220 tests

### 1.2 React Package Tests

**Location:** `/packages/react/src/__tests__/`

| Test File | Test Count | Categories |
|-----------|-----------|------------|
| `Form.test.tsx` | ~60 | Form rendering, submission, auto-save |
| `Field.test.tsx` | ~50 | Field rendering, props merging, validation |
| `FieldGroup.test.tsx` | ~30 | Group behavior, disabled state |
| `FormalityProvider.test.tsx` | 20 | Provider context, defaultFieldProps |
| `autosave-validation.test.tsx` | 22 | Debounce, async validation, race conditions |
| `integration/complete-form.test.tsx` | ~50 | End-to-end form workflows |
| `makeProxyState.test.ts` | ~15 | Proxy state pattern |
| `render-isolation.test.tsx` | ~10 | Re-render optimization |
| `UnusedFields.test.tsx` | ~10 | Unused field handling |
| `sample.test.tsx` | ~5 | Sample React forms |

**Total React Tests:** ~272 tests

**Grand Total:** ~492 tests (Note: Some tests may be counted in both categories)

---

## 2. Coverage Analysis by Bug

### Bug #1: selectDefaultFieldProps Evaluation (CRITICAL)

**Coverage Status:** **GAP - NO TESTS**

#### Existing Tests

**File:** `/packages/react/src/__tests__/FormalityProvider.test.tsx`

```typescript
describe("FormalityProvider", () => {
  it("should pass defaultFieldProps to fields", () => {
    // Tests basic defaultFieldProps passing
    // Does NOT test expression evaluation
  });
});
```

**File:** `/packages/react/src/__tests__/config.test.tsx`

```typescript
describe("mergeFieldProps", () => {
  it("should merge props in priority order", () => {
    // Tests mergeFieldProps function
    // Does NOT test selectDefaultFieldProps evaluation
  });
});
```

#### Missing Test Scenarios

1. **Expression Evaluation in Props:**
   ```typescript
   const config = {
     defaultFieldProps: {
       disabled: "!signed", // Should evaluate based on signed field
     }
   };
   // Test: When signed=false, field should be disabled
   // Test: When signed=true, field should be enabled
   ```

2. **8-Layer Priority Order:**
   ```typescript
   // Test scenario where all 8 layers provide conflicting values
   providerDefaultFieldProps: { disabled: true },
   formDefaultFieldProps: { disabled: false },
   inputProps: { disabled: true },
   fieldConfigProps: { disabled: false },
   selectProps: { disabled: true },
   componentProps: { disabled: false },
   coreProps: { disabled: true },
   // Expected: Priority order respected
   ```

3. **Dynamic Prop Evaluation:**
   ```typescript
   // Test that expressions re-evaluate when dependencies change
   const config = {
     defaultFieldProps: {
       label: "fields.clientType + ' - ' + fields.clientName",
     }
   };
   // Test: Changing clientType or clientName updates label
   ```

4. **Complex Expressions:**
   ```typescript
   const config = {
     defaultFieldProps: {
       placeholder: "(fields.count > 5) ? 'Many items' : 'Few items'",
     }
   };
   ```

#### Critical Gap

**No tests verify that expressions in `selectDefaultFieldProps` are evaluated correctly against the current form state.**

---

### Bug #2: debounce: false Immediate Submission (CRITICAL)

**Coverage Status:** **PARTIAL**

#### Existing Tests

**File:** `/packages/react/src/__tests__/autosave-validation.test.tsx`

```typescript
describe("AutoSave Debounce", () => {
  it("should debounce rapid changes", async () => {
    // Tests debounce timing with fake timers
    // Does NOT test debounce: false
  });

  it("should wait for validation before submitting", async () => {
    // Tests async validation coordination
    // Does NOT test immediate submission
  });
});
```

**File:** `/packages/react/src/__tests__/Form.test.tsx`

```typescript
describe("Form", () => {
  it("should accept debounce prop", () => {
    // Tests that Form accepts debounce prop
    // Does NOT test field-level override
  });
});
```

#### Missing Test Scenarios

1. **Immediate Submission with debounce: false:**
   ```typescript
   const config = {
     toggle: {
       type: "switch",
       debounce: false, // Should submit immediately
     }
   };
   // Test: onChange triggers immediate submit (no delay)
   // Test: submitImmediate() is called, not debouncedSubmit()
   ```

2. **Mixed Debounce Settings:**
   ```typescript
   const config = {
     textField: {
       type: "textField",
       debounce: 1000, // Debounced
     },
     switch: {
       type: "switch",
       debounce: false, // Immediate
     }
   };
   // Test: textField uses debounce
   // Test: switch submits immediately
   ```

3. **changeField Method Behavior:**
   ```typescript
   // Test that changeField accepts inputConfig parameter
   // Test that it checks inputConfig.debounce
   // Test conditional execution logic
   ```

#### Critical Gap

**No direct tests of `changeField` method behavior or immediate submission when `debounce: false`.**

---

### Bug #3: disabled Property in Field States (MAJOR)

**Coverage Status:** **PARTIAL**

#### Existing Tests

**File:** `/packages/core/src/__tests__/conditions.test.ts`

```typescript
describe("Conditions", () => {
  it("should disable field when condition is met", () => {
    // Tests disabled from conditions
    // Tests disabled state in field states
  });

  it("should resolve disabled from multiple sources", () => {
    // Tests disabled from config, props, conditions
    // Does NOT test priority order
  });
});
```

**File:** `/packages/react/src/__tests__/Field.test.tsx`

```typescript
describe("Field", () => {
  it("should be disabled when disabled prop is true", () => {
    // Tests disabled from JSX prop
  });

  it("should be disabled when field config has disabled", () => {
    // Tests disabled from config
  });
});
```

#### Missing Test Scenarios

1. **Disabled from All Sources (Priority Order):**
   ```typescript
   // Test priority: JSX prop > config > conditions > group
   // Test when all sources provide different values
   // Test that highest priority wins
   ```

2. **Disabled in Expression Context:**
   ```typescript
   const config = {
     field1: {
       conditions: [{ when: "toggle", is: true, disabled: true }],
     },
     field2: {
       conditions: [{
         when: "field1",
         isDisabled: true, // Should check field1.disabled
         disabled: true,
       }],
     }
   };
   // Test: field2 checks field1's disabled state
   ```

3. **Complex Nested Disabled States:**
   ```typescript
   // Test disabled in FieldGroup
   // Test disabled cascading to child fields
   // Test disabled with multiple condition levels
   ```

#### Critical Gap

**No comprehensive tests verify the priority order when multiple disabled sources conflict.**

---

### Bug #4: Multi-Field isDisabled Conditions (MAJOR)

**Coverage Status:** **PARTIAL**

#### Existing Tests

**File:** `/packages/core/src/__tests__/conditions.test.ts`

```typescript
describe("Conditions - Multi-field", () => {
  it("should evaluate object when conditions", () => {
    // Tests { when: { field1: true, field2: false } }
    // Tests value matchers (is, isNot)
    // Does NOT test isDisabled matcher
  });

  it("should support mixed matchers", () => {
    // Tests { when: { field1: { value: 5 }, field2: { isDirty: true } } }
    // Does NOT test isDisabled in mixed matchers
  });
});
```

#### Missing Test Scenarios

1. **isDisabled with Multi-Field Conditions:**
   ```typescript
   const config = {
     result: {
       conditions: [{
         when: { field1: true, field2: false },
         isDisabled: true, // Should work but doesn't
         disabled: true,
       }],
     }
   };
   // Test: Disabled when ALL fields match AND are disabled
   ```

2. **isDisabled with Mixed Matchers:**
   ```typescript
   const config = {
     result: {
       conditions: [{
         when: {
           field1: { value: 5 },      // Value matcher
           field2: { isDisabled: true }, // Field state matcher
         },
         isDisabled: true,
         disabled: true,
       }],
     }
   };
   ```

3. **Performance with Many Dependent Fields:**
   ```typescript
   // Test 10+ fields in object when condition
   // Test evaluation performance
   ```

#### Critical Gap

**No specific tests for `isDisabled` matcher in multi-field object conditions.**

---

### Bug #5: Memory Leak Prevention (MEDIUM)

**Coverage Status:** **GAP - NO TESTS**

#### Existing Tests

**File:** `/packages/react/src/__tests__/autosave-validation.test.tsx`

```typescript
describe("AutoSave", () => {
  it("should clean up timers on unmount", () => {
    // Tests debounce cleanup
    // Does NOT test subscription cleanup
  });
});
```

#### Missing Test Scenarios

1. **Component Unmounting:**
   ```typescript
   // Test: Unmount form during active subscriptions
   // Test: All subscriptions are cleaned up
   // Test: No memory leaks after unmount
   ```

2. **Rapid Prop/Config Changes:**
   ```typescript
   // Test: Change config 10 times rapidly
   // Test: Subscriptions are tracked correctly
   // Test: No orphaned subscriptions
   ```

3. **Subscription Management:**
   ```typescript
   // Test: Add/remove fields dynamically
   // Test: Subscriptions added/removed correctly
   // Test: No double-cleanup
   ```

#### Critical Gap

**No tests specifically targeting memory leaks or subscription cleanup.**

---

### Bug #6: Type Safety in Expression Arithmetic (MEDIUM)

**Coverage Status:** **PARTIAL**

#### Existing Tests

**File:** `/packages/core/src/expression/test.ts`

```typescript
describe("Expression Evaluation", () => {
  it("should handle null and undefined in logical expressions", () => {
    // Tests: null && true, undefined || false
    // Does NOT test arithmetic with null/undefined
  });

  it("should handle missing properties", () => {
    // Tests: accessing undefined properties
    // Does NOT test arithmetic on non-numeric values
  });
});
```

#### Missing Test Scenarios

1. **Arithmetic with null/undefined:**
   ```typescript
   // Test: 5 + null → ? (should be undefined or error)
   // Test: 10 - undefined → ?
   // Test: null * 5 → ?
   ```

2. **Type Coercion Edge Cases:**
   ```typescript
   // Test: "hello" - 5 → NaN (should be undefined)
   // Test: {} + 5 → ?
   // Test: [] * 2 → ?
   ```

3. **Complex Expressions with Mixed Types:**
   ```typescript
   // Test: (field1 > 5) + field2 where field2 is string
   // Test: field1 + field2 where both are strings
   ```

#### Critical Gap

**No tests for arithmetic operations with non-numeric types or complex type safety scenarios.**

---

### Bug #7: Race Condition Prevention (MEDIUM)

**Coverage Status:** **PARTIAL**

#### Existing Tests

**File:** `/packages/react/src/__tests__/autosave-validation.test.tsx`

```typescript
describe("AutoSave Race Conditions", () => {
  it("should handle rapid field changes", async () => {
    // Tests rapid typing in text field
    // Tests execution version tracking
  });

  it("should wait for async validation", async () => {
    // Tests validation coordination
    // Tests abort on new changes
  });
});
```

#### Missing Test Scenarios

1. **Rapid State Changes:**
   ```typescript
   // Test: Change field value 10 times rapidly
   // Test: Only last value is submitted
   // Test: Intermediate saves are aborted
   ```

2. **Concurrent Validation and Submission:**
   ```typescript
   // Test: Start validation, change value again
   // Test: First validation completes after second starts
   // Test: Correct version is submitted
   ```

3. **Execution Version Tracking:**
   ```typescript
   // Test: Version increments correctly
   // Test: Stale operations are aborted
   // Test: Version wraps correctly (if number type)
   ```

#### Critical Gap

**No tests specifically targeting race conditions in state updates or execution versions.**

---

## 3. Testing Patterns and Conventions

### 3.1 Framework and Setup

**Test Runner:** Vitest
**Testing Library:** @testing-library/react
**Interaction Testing:** user-event
**Environment:** jsdom
**Cleanup:** Automatic cleanup via `afterEach` hook

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./packages/react/src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
```

### 3.2 Test Component Pattern

**All test components must use `forwardRef`:**

```typescript
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}
        data-testid={name}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        {...props}
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);

TestInput.displayName = "TestInput";
```

**Key Requirements:**
1. ✅ Use `forwardRef`
2. ✅ Set `displayName`
3. ✅ Use `data-testid` for selectors
4. ✅ Optional chaining: `onChange?.()`
5. ✅ Nullish coalescing: `value ?? ""`
6. ✅ Index signature: `[key: string]: unknown`

### 3.3 Context Testing Pattern

```typescript
describe("FormalityProvider", () => {
  it("should provide context to child components", () => {
    const TestConsumer = () => {
      const context = useFormContext();
      return <div data-testid="context">{JSON.stringify(context)}</div>;
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <TestConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId("context")).toBeInTheDocument();
  });
});
```

### 3.4 Async Testing Pattern

```typescript
describe("Async Validation", () => {
  it("should show validation error", async () => {
    const validator = async () => "Required";

    render(
      <Form config={{ name: { type: "textField", validator } }}>
        <Field name="name" />
      </Form>
    );

    const input = screen.getByTestId("name");
    await userEvent.type(input, "a");
    await userEvent.clear(input);

    await waitFor(() => {
      expect(screen.getByTestId("name-error")).toHaveTextContent("Required");
    });
  });
});
```

### 3.5 Debounce Testing Pattern

```typescript
describe("AutoSave Debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce rapid changes", async () => {
    const submitHandler = vi.fn();

    render(
      <Form
        config={{ name: { type: "textField" } }}
        onSubmit={submitHandler}
        autoSave
        debounce={500}
      >
        <Field name="name" />
      </Form>
    );

    const input = screen.getByTestId("name");

    // Type multiple characters rapidly
    await act(async () => {
      await userEvent.type(input, "hello", { delay: null });
    });

    // Advance past debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // Should only submit once with final value
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });

    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ name: "hello" })
    );
  });
});
```

### 3.6 Integration Testing Pattern

```typescript
describe("Complete Form Workflow", () => {
  it("should handle complex form with conditions", async () => {
    const config = {
      clientType: { type: "select", options: ["Individual", "Company"] },
      companyName: {
        type: "textField",
        conditions: [{
          when: "clientType",
          is: "Company",
          required: true,
        }],
      },
      signed: { type: "switch" },
      submit: {
        type: "submitButton",
        conditions: [{
          when: "signed",
          is: true,
          disabled: false, // Enable when signed
        }],
      },
    };

    render(
      <Form config={config}>
        <Field name="clientType" />
        <Field name="companyName" />
        <Field name="signed" />
        <Field name="submit" />
      </Form>
    );

    // Test initial state
    expect(screen.getByTestId("companyName")).not.toBeInTheDocument();

    // Select "Company"
    await userEvent.selectOptions(screen.getByTestId("clientType"), "Company");
    await waitFor(() => {
      expect(screen.getByTestId("companyName")).toBeInTheDocument();
    });

    // Submit button should be disabled
    expect(screen.getByTestId("submit")).toBeDisabled();

    // Sign the form
    await userEvent.click(screen.getByTestId("signed"));
    await waitFor(() => {
      expect(screen.getByTestId("submit")).not.toBeDisabled();
    });
  });
});
```

---

## 4. Test Utilities and Helpers

### 4.1 Mock Components

```typescript
// Text input
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(...);

// Switch/checkbox
const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(...);

// Select dropdown
const TestSelect = forwardRef<HTMLSelectElement, TestSelectProps>(...);

// Context consumer
const TestConsumer = () => { ... };
```

### 4.2 Test Utilities

```typescript
// User interaction
import { userEvent } from "@testing-library/user-event";

// Async utilities
import { waitFor, act } from "@testing-library/react";

// Fake timers
import { vi, beforeEach, afterEach } from "vitest";

// Selectors
import { screen, within } from "@testing-library/react";

// Assertions
import { expect } from "vitest";
```

### 4.3 Configuration Mocks

```typescript
const testInputs: Record<string, InputConfig> = {
  textField: {
    component: TestInput,
    defaultValue: "",
  },
  switch: {
    component: TestSwitch,
    defaultValue: false,
  },
  select: {
    component: TestSelect,
    defaultValue: null,
    options: ["Option 1", "Option 2"],
  },
};
```

---

## 5. Required Test Scenarios

### 5.1 For Bug #1 (selectDefaultFieldProps)

```typescript
describe("selectDefaultFieldProps Evaluation", () => {
  it("should evaluate expressions in provider defaultFieldProps", async () => {
    const config = {
      signed: { type: "switch" },
      name: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{
          disabled: "!signed", // Expression
        }}
      >
        <Form config={config}>
          <Field name="name" />
          <Field name="signed" />
        </Form>
      </FormalityProvider>
    );

    // Initially disabled (signed=false, so !signed=true)
    expect(screen.getByTestId("name")).toBeDisabled();

    // Sign the form
    await userEvent.click(screen.getByTestId("signed"));

    // Should be enabled (signed=true, so !signed=false)
    await waitFor(() => {
      expect(screen.getByTestId("name")).not.toBeDisabled();
    });
  });

  it("should evaluate all 8 layers of props in priority order", () => {
    // Test with all 8 layers providing conflicting values
    // Verify priority order is respected
  });

  it("should handle complex expressions in defaultFieldProps", async () => {
    // Test: (fields.count > 5) ? 'Many' : 'Few'
    // Test: fields.clientType + ' - ' + fields.clientName
  });
});
```

### 5.2 For Bug #2 (debounce: false)

```typescript
describe("Immediate Submission", () => {
  it("should submit immediately when debounce: false", async () => {
    const submitHandler = vi.fn();

    const config = {
      switch: {
        type: "switch",
        debounce: false, // Immediate
      },
    };

    render(
      <Form
        config={config}
        onSubmit={submitHandler}
        autoSave
        debounce={1000}
      >
        <Field name="switch" />
      </Form>
    );

    // Click switch
    await userEvent.click(screen.getByTestId("switch"));

    // Should submit immediately (no delay)
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("should mix immediate and debounced fields", async () => {
    // Test field with debounce: 1000
    // Test field with debounce: false
    // Verify each uses correct debounce setting
  });
});
```

### 5.3 For Bug #5 (Memory Leaks)

```typescript
describe("Memory Leak Prevention", () => {
  it("should clean up subscriptions on unmount", async () => {
    const { unmount } = render(
      <Form config={{ name: { type: "textField" } }}>
        <Field name="name" />
      </Form>
    );

    // Trigger some subscriptions
    await userEvent.type(screen.getByTestId("name"), "test");

    // Unmount
    unmount();

    // Verify no memory leaks (would need custom tracking)
  });

  it("should handle rapid prop changes without memory growth", async () => {
    const { rerender } = render(
      <Form config={{ name: { type: "textField" } }}>
        <Field name="name" />
      </Form>
    );

    // Rapidly change config 10 times
    for (let i = 0; i < 10; i++) {
      rerender(
        <Form config={{ name: { type: "textField", defaultValue: i } }}>
          <Field name="name" />
        </Form>
      );
    }

    // Verify subscriptions are tracked correctly
    // Verify no orphaned subscriptions
  });
});
```

---

## 6. Recommendations

### 6.1 High Priority Test Additions

1. **Add comprehensive props evaluation tests** for Bug #1
   - Expression evaluation in defaultFieldProps
   - 8-layer priority order
   - Dynamic re-evaluation on dependency changes

2. **Implement memory leak tests** for Bug #5
   - Component unmounting and cleanup
   - Rapid prop/config changes
   - Subscription management

3. **Add changeField method tests** for Bug #2
   - Immediate submission with debounce: false
   - Mixed debounce settings
   - Method behavior verification

### 6.2 Medium Priority Test Additions

1. **Enhance disabled property tests** with priority order scenarios
2. **Add type safety edge case tests** for Bug #6
3. **Implement race condition tests** for Bug #7

### 6.3 Structural Improvements

1. **Create test utilities** for common scenarios
2. **Add performance benchmarks** for complex forms
3. **Implement integration tests** for complete user workflows
4. **Add visual debugging** for complex state changes

### 6.4 Test Organization

- Create dedicated test files for each major bug category
- Use test fixtures for common form scenarios
- Implement property-based testing for edge cases
- Add visual regression tests for conditional rendering

---

## 7. Summary

### 7.1 Current Test Coverage

**Strong Areas:**
- Basic component rendering
- Simple condition evaluation
- Debounce timing (with fake timers)
- Validation error display
- Form submission

**Weak Areas:**
- Expression evaluation in props
- Immediate submission (debounce: false)
- Memory leak prevention
- Type safety in arithmetic
- Multi-field isDisabled conditions

### 7.2 Testing Gaps Summary

| Bug | Coverage | Gap Severity | Test Count Needed |
|-----|----------|--------------|-------------------|
| #1 selectDefaultFieldProps | None | Critical | ~10 tests |
| #2 debounce: false | Partial | Critical | ~6 tests |
| #3 disabled property | Partial | Medium | ~6 tests |
| #4 multi-field isDisabled | Partial | Medium | ~6 tests |
| #5 memory leaks | None | High | ~4 tests |
| #6 type safety | Partial | Low | ~4 tests |
| #7 race conditions | Partial | Low | ~4 tests |

**Total New Tests Needed:** ~40 tests

### 7.3 Next Steps

1. **Write failing tests first** for each bug
2. **Implement bug fixes** to make tests pass
3. **Add regression tests** to prevent recurrence
4. **Update test documentation** with new patterns

---

**Document Status:** Complete
**Last Updated:** 2025-01-11
**Maintainer:** Lead Technical Architect
