# Research: Testing React Prop Merging and Priority Systems

**Task:** P1.M1.T3.S3 - Test 8-layer priority order
**Date:** 2025-01-11
**Status:** Research Phase

## Executive Summary

This document compiles best practices for testing complex React prop merging systems with multiple priority layers. Based on analysis of the Formality codebase and established testing patterns, it provides comprehensive guidance for testing an 8-layer prop priority system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Testing Library Best Practices](#testing-library-best-practices)
3. [Prop Override Testing Patterns](#prop-override-testing-patterns)
4. [Shallow vs Deep Prop Merging](#shallow-vs-deep-prop-merging)
5. [Vitest/React Testing Library Patterns](#vitestreact-testing-library-patterns)
6. [Mocking Strategies](#mocking-strategies)
7. [Priority System Testing](#priority-system-testing)
8. [Comprehensive Test Coverage](#comprehensive-test-coverage)
9. [Documentation References](#documentation-references)

---

## System Overview

### The 8-Layer Prop Priority System

The Formality system implements an 8-layer prop merging mechanism (plus core props):

```
Layer 1 (lowest):  providerDefaultFieldProps
Layer 2:           providerSelectDefaultFieldProps (dynamic)
Layer 3:           formDefaultFieldProps
Layer 4:           formSelectDefaultFieldProps (dynamic)
Layer 5:           inputProps
Layer 6:           fieldConfigProps
Layer 7:           selectProps (dynamic)
Layer 8:           componentProps
Layer 9 (highest): coreProps (always wins)
```

### Key Implementation Files

- **Core merging logic:** `/packages/core/src/config/merge.ts`
- **React hook:** `/packages/react/src/hooks/usePropsEvaluation.ts`
- **Field component:** `/packages/react/src/components/Field.tsx`
- **Existing tests:** `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx`

---

## Testing Library Best Practices

### 1. Test Isolation

**Principle:** Each test should be independent and not rely on other tests.

```typescript
describe("8-Layer Priority System", () => {
  beforeEach(() => {
    // Reset any global state
    vi.clearAllMocks();
  });

  it("should test layer 1 in isolation", () => {
    // Test only providerDefaultFieldProps
  });

  it("should test layer 2 in isolation", () => {
    // Test only providerSelectDefaultFieldProps
  });
});
```

### 2. data-testid for Selectors

**Principle:** Use `data-testid` attributes for reliable element selection.

```typescript
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name} // CRITICAL: Always include
      data-size={size}     // For testing size prop
      data-variant={variant} // For testing variant prop
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}
    />
  )
);
```

### 3. forwardRef for Test Components

**Principle:** Test components must use `forwardRef` to match real component behavior.

```typescript
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  (props, ref) => (
    <input ref={ref} {...props} />
  )
);
TestInput.displayName = "TestInput";
```

**Why:** The Field component passes ref to input components. Without forwardRef, tests may fail to catch ref-related bugs.

### 4. Async Assertions with waitFor

**Principle:** Use `waitFor` for assertions that depend on state updates.

```typescript
it("should re-evaluate props when dependency changes", async () => {
  render(<Component />);

  await user.click(screen.getByTestId("toggle"));

  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("updated");
  });
});
```

### 5. User Interactions with userEvent

**Principle:** Use `userEvent` over `fireEvent` for more realistic interactions.

```typescript
const user = userEvent.setup();

await user.click(screen.getByTestId("checkbox"));
await user.type(screen.getByTestId("input"), "text");
await user.clear(screen.getByTestId("input"));
```

---

## Prop Override Testing Patterns

### Pattern 1: Incremental Layer Testing

Test each layer individually, then test combinations:

```typescript
describe("Layer Priority", () => {
  // Test each layer in isolation
  it("Layer 1: providerDefaultFieldProps applies", () => {
    // Only providerDefaultFieldProps set
  });

  it("Layer 2: providerSelectDefaultFieldProps overrides Layer 1", () => {
    // Both Layer 1 and Layer 2 set with same prop
    // Verify Layer 2 wins
  });

  it("Layer 3: formDefaultFieldProps overrides Layer 2", () => {
    // Layers 1, 2, and 3 set
    // Verify Layer 3 wins
  });

  // ... continue for all layers
});
```

### Pattern 2: Conflict Detection Tests

Test scenarios where multiple layers define the same property:

```typescript
describe("Prop Conflicts", () => {
  it("should resolve conflicts using priority order", () => {
    render(
      <FormalityProvider
        defaultFieldProps={{ size: "small" }}
        selectDefaultFieldProps={{ size: "medium" }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: { size: "large" },
            selectDefaultFieldProps: { size: "xlarge" }
          }}
        >
          <Field
            name="test"
            inputProps={{ size: "xxlarge" }}
            fieldConfigProps={{ size: "xxxlarge" }}
            selectProps={{ size: "huge" }}
            componentProps={{ size: "gigantic" }}
          />
        </Form>
      </FormalityProvider>
    );

    // Layer 8 (componentProps) should win
    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "gigantic");
  });
});
```

### Pattern 3: Property Isolation Tests

Test that different properties from different layers all apply:

```typescript
it("should merge different properties from all layers", () => {
  render(
    <FormalityProvider
      defaultFieldProps={{ size: "provider-size" }}
      selectDefaultFieldProps={{ variant: "provider-variant" }}
    >
      <Form
        config={config}
        formConfig={{
          defaultFieldProps: { className: "form-class" },
          selectDefaultFieldProps: { placeholder: "form-placeholder" }
        }}
      >
        <Field
          name="test"
          inputProps={{ disabled: true }}
          fieldConfigProps={{ required: true }}
          selectProps={{ autoComplete: "on" }}
        />
      </Form>
    </FormalityProvider>
  );

  const field = screen.getByTestId("test");

  // All properties from different layers should be present
  expect(field).toHaveAttribute("data-size", "provider-size");
  expect(field).toHaveAttribute("data-variant", "provider-variant");
  expect(field).toHaveClass("form-class");
  expect(field).toHaveAttribute("placeholder", "form-placeholder");
  expect(field).toBeDisabled();
  expect(field).toHaveAttribute("required");
  expect(field).toHaveAttribute("autoComplete", "on");
});
```

---

## Shallow vs Deep Prop Merging

### Understanding Merge Behavior

**Shallow Merge (Object.assign):**
```typescript
const base = { config: { theme: "dark" } };
const override = { config: { color: "red" } };
const result = { ...base, ...override };
// result.config = { color: "red" } - theme is lost!
```

**Deep Merge (recursive):**
```typescript
const base = { config: { theme: "dark" } };
const override = { config: { color: "red" } };
const result = deepMerge(base, override);
// result.config = { theme: "dark", color: "red" } - both preserved!
```

### Testing Deep Merge

The Formality system uses **deep merge** for nested objects:

```typescript
describe("Deep Merge Behavior", () => {
  it("should deep merge style objects", () => {
    render(
      <FormalityProvider
        defaultFieldProps={{
          style: { color: "red", fontSize: "14px" }
        }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: {
              style: { fontWeight: "bold" }
            }
          }}
        >
          <Field name="test" />
        </Form>
      </FormalityProvider>
    );

    const field = screen.getByTestId("test");

    // All style properties should be present
    expect(field.style.color).toBe("red");
    expect(field.style.fontSize).toBe("14px");
    expect(field.style.fontWeight).toBe("bold");
  });

  it("should override nested properties at same level", () => {
    render(
      <FormalityProvider
        defaultFieldProps={{
          config: { theme: "light" }
        }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: {
              config: { theme: "dark" }
            }
          }}
        >
          <Field name="test" />
        </Form>
      </FormalityProvider>
    );

    // Form-level should override provider-level for same property
    expect(screen.getByTestId("test")).toHaveAttribute(
      "data-theme",
      "dark"
    );
  });
});
```

### Testing Array Handling

Arrays are typically replaced (not merged) in prop systems:

```typescript
describe("Array Handling", () => {
  it("should replace arrays instead of merging", () => {
    render(
      <FormalityProvider
        defaultFieldProps={{
          classes: ["base-class"]
        }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: {
              classes: ["form-class"]
            }
          }}
        >
          <Field name="test" />
        </Form>
      </FormalityProvider>
    );

    // Array should be replaced, not merged
    const field = screen.getByTestId("test");
    expect(field).not.toHaveClass("base-class");
    expect(field).toHaveClass("form-class");
  });
});
```

---

## Vitest/React Testing Library Patterns

### Pattern 1: Custom Render Function

Create a reusable render function for complex setups:

```typescript
import { render, RenderOptions } from "@testing-library/react";
import { FormalityProvider, Form, Field } from "@formality-ui/react";

interface TestConfig {
  providerProps?: Record<string, unknown>;
  formProps?: Record<string, unknown>;
  fieldProps?: Record<string, unknown>;
  config?: FormFieldsConfig;
}

function renderFormalityTest({
  providerProps = {},
  formProps = {},
  fieldProps = {},
  config = { test: { type: "textField" } }
}: TestConfig) {
  return render(
    <FormalityProvider inputs={testInputs} {...providerProps}>
      <Form config={config} {...formProps}>
        <Field name="test" {...fieldProps} />
      </Form>
    </FormalityProvider>
  );
}

// Usage
describe("Custom Render Pattern", () => {
  it("simplifies complex test setups", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: { size: "small" }
      },
      formProps: {
        formConfig: {
          defaultFieldProps: { variant: "outlined" }
        }
      }
    });

    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "small");
    expect(screen.getByTestId("test")).toHaveAttribute("data-variant", "outlined");
  });
});
```

### Pattern 2: Test Factories

Create factory functions for generating test props:

```typescript
function createLayerProps(layer: number, overrides = {}) {
  const configs = {
    1: { providerDefaultFieldProps: { size: "layer1", ...overrides } },
    2: { providerSelectDefaultFieldProps: { size: "layer2", ...overrides } },
    3: { formDefaultFieldProps: { size: "layer3", ...overrides } },
    4: { formSelectDefaultFieldProps: { size: "layer4", ...overrides } },
    5: { inputProps: { size: "layer5", ...overrides } },
    6: { fieldConfigProps: { size: "layer6", ...overrides } },
    7: { selectProps: { size: "layer7", ...overrides } },
    8: { componentProps: { size: "layer8", ...overrides } },
  };

  return configs[layer];
}

describe("Test Factories", () => {
  it("generates consistent test data", () => {
    renderFormalityTest({
      providerProps: createLayerProps(1),
      formProps: createLayerProps(3),
      fieldProps: { ...createLayerProps(5), ...createLayerProps(8) }
    });

    // Layer 8 should win
    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "layer8");
  });
});
```

### Pattern 3: Parameterized Tests

Use test.each for data-driven testing:

```typescript
describe("Priority Order (Parameterized)", () => {
  const priorityTests = [
    {
      name: "Layer 8 > Layer 7",
      active: 8,
      expected: "layer8",
      props: {
        7: { size: "layer7" },
        8: { size: "layer8" }
      }
    },
    {
      name: "Layer 7 > Layer 6",
      active: 7,
      expected: "layer7",
      props: {
        6: { size: "layer6" },
        7: { size: "layer7" }
      }
    },
    // ... more test cases
  ];

  test.each(priorityTests)("$name", ({ active, expected, props }) => {
    // Implementation
  });
});
```

### Pattern 4: Assertion Helpers

Create reusable assertion helpers:

```typescript
function assertProps(testId: string, props: Record<string, unknown>) {
  const element = screen.getByTestId(testId);

  Object.entries(props).forEach(([key, value]) => {
    if (key === "className") {
      expect(element).toHaveClass(value as string);
    } else if (key === "disabled") {
      value
        ? expect(element).toBeDisabled()
        : expect(element).not.toBeDisabled();
    } else if (typeof value === "boolean") {
      expect(element).toHaveAttribute(key, value.toString());
    } else {
      expect(element).toHaveAttribute(key, value as string);
    }
  });
}

describe("Assertion Helpers", () => {
  it("simplifies complex assertions", () => {
    renderFormalityTest({ /* ... */ });

    assertProps("test", {
      size: "large",
      variant: "outlined",
      disabled: "true",
      className: "test-class"
    });
  });
});
```

---

## Mocking Strategies

### Mocking Expression Evaluation

When testing prop priority, you may want to mock expression evaluation:

```typescript
import { evaluateDescriptor } from "@formality-ui/core";

vi.mock("@formality-ui/core", () => ({
  ...vi.importActual("@formality-ui/core"),
  evaluateDescriptor: vi.fn(),
}));

describe("Mocked Expression Evaluation", () => {
  beforeEach(() => {
    vi.mocked(evaluateDescriptor).mockImplementation((descriptor, context) => {
      // Return simple values for testing
      if (typeof descriptor === "object" && "disabled" in descriptor) {
        return { disabled: true };
      }
      return descriptor;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tests priority without expression complexity", () => {
    renderFormalityTest({
      providerProps: {
        selectDefaultFieldProps: { disabled: true }
      }
    });

    expect(screen.getByTestId("test")).toBeDisabled();
  });
});
```

### Mocking React Hook Form

For unit testing hooks in isolation:

```typescript
import { useFormContext } from "react-hook-form";

const mockUseFormContext = vi.mocked(useFormContext);

describe("usePropsEvaluation Unit Tests", () => {
  beforeEach(() => {
    mockUseFormContext.mockReturnValue({
      record: {},
      methods: {
        control: {},
        getValues: vi.fn(),
        setValue: vi.fn(),
      }
    });
  });

  it("evaluates provider props in isolation", () => {
    // Test hook logic without full component tree
  });
});
```

### Mocking Field Components

Create lightweight mock components:

```typescript
const MockInput = forwardRef<HTMLDivElement, { value?: unknown; disabled?: boolean }>(
  ({ value, disabled }, ref) => (
    <div ref={ref} data-testid="mock-input" data-disabled={disabled}>
      {value}
    </div>
  )
);
```

---

## Priority System Testing

### Strategy 1: Binary Search Testing

Test priority using binary search approach:

```typescript
describe("Priority Order - Binary Search", () => {
  const layers = [
    "providerDefaultFieldProps",
    "providerSelectDefaultFieldProps",
    "formDefaultFieldProps",
    "formSelectDefaultFieldProps",
    "inputProps",
    "fieldConfigProps",
    "selectProps",
    "componentProps",
  ];

  layers.forEach((layer, index) => {
    it(`${layer} (layer ${index + 1}) overrides lower layers`, () => {
      // Set all lower layers to "lower"
      // Set current layer to "current"
      // Verify current layer wins
    });

    it(`${layer} (layer ${index + 1}) is overridden by higher layers`, () => {
      // Set current layer to "current"
      // Set all higher layers to "higher"
      // Verify highest layer wins
    });
  });
});
```

### Strategy 2: Full Stack Testing

Test all layers at once:

```typescript
describe("Full Stack Priority", () => {
  it("should respect complete priority order", () => {
    render(
      <FormalityProvider
        defaultFieldProps={{ size: "L1" }}
        selectDefaultFieldProps={{ variant: "L2" }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: { className: "L3" },
            selectDefaultFieldProps: { placeholder: "L4" }
          }}
        >
          <Field
            name="test"
            inputProps={{ autoComplete: "L5" }}
            fieldConfigProps={{ required: true }}
            selectProps={{ readOnly: true }}
            componentProps={{ id: "L8" }}
          />
        </Form>
      </FormalityProvider>
    );

    const field = screen.getByTestId("test");

    // All unique properties should be present
    expect(field).toHaveAttribute("data-size", "L1");
    expect(field).toHaveAttribute("data-variant", "L2");
    expect(field).toHaveClass("L3");
    expect(field).toHaveAttribute("placeholder", "L4");
    expect(field).toHaveAttribute("autoComplete", "L5");
    expect(field).toHaveAttribute("required");
    expect(field).toHaveAttribute("readonly");
    expect(field).toHaveAttribute("id", "L8");
  });
});
```

### Strategy 3: Core Props Always Win

Test that coreProps (name, value, onChange) cannot be overridden:

```typescript
describe("Core Props Priority", () => {
  it("coreProps always override all other layers", () => {
    render(
      <FormalityProvider
        defaultFieldProps={{ name: "provider-name" }}
        selectDefaultFieldProps={{ value: "provider-value" }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: { onChange: () => {} }
          }}
        >
          <Field
            name="actual-name"
            inputProps={{ value: "input-value" }}
            fieldConfigProps={{ onChange: () => {} }}
            selectProps={{ name: "select-name" }}
          />
        </Form>
      </FormalityProvider>
    );

    const field = screen.getByTestId("actual-name");

    // Core props should always be from Field's actual props
    expect(field).toHaveAttribute("name", "actual-name");
    expect(field).not.toHaveAttribute("name", "provider-name");
    expect(field).not.toHaveAttribute("name", "select-name");
  });
});
```

---

## Comprehensive Test Coverage

### Test Coverage Categories

#### 1. Single Layer Tests (8 tests)

Test each layer in isolation:

```typescript
const singleLayerTests = [
  { layer: 1, name: "providerDefaultFieldProps", prop: "defaultFieldProps" },
  { layer: 2, name: "providerSelectDefaultFieldProps", prop: "selectDefaultFieldProps" },
  { layer: 3, name: "formDefaultFieldProps", prop: "defaultFieldProps" },
  { layer: 4, name: "formSelectDefaultFieldProps", prop: "selectDefaultFieldProps" },
  { layer: 5, name: "inputProps", prop: "inputProps" },
  { layer: 6, name: "fieldConfigProps", prop: "props" },
  { layer: 7, name: "selectProps", prop: "selectProps" },
  { layer: 8, name: "componentProps", prop: undefined },
];
```

#### 2. Adjacent Layer Tests (7 tests)

Test each layer against the next higher layer:

```typescript
describe("Adjacent Layer Priority", () => {
  it("L2 overrides L1", () => {});
  it("L3 overrides L2", () => {});
  it("L4 overrides L3", () => {});
  it("L5 overrides L4", () => {});
  it("L6 overrides L5", () => {});
  it("L7 overrides L6", () => {});
  it("L8 overrides L7", () => {});
});
```

#### 3. Skip Layer Tests (6 tests)

Test priority with gaps:

```typescript
describe("Skip Layer Priority", () => {
  it("L3 overrides L1 (skipping L2)", () => {});
  it("L5 overrides L2 (skipping L3, L4)", () => {});
  it("L7 overrides L4 (skipping L5, L6)", () => {});
  it("L8 overrides L3 (skipping L4-L7)", () => {});
  // ... more skip tests
});
```

#### 4. Merge Behavior Tests (4 tests)

```typescript
describe("Merge Behavior", () => {
  it("should deep merge nested objects", () => {});
  it("should replace arrays", () => {});
  it("should merge different properties", () => {});
  it("should override same properties", () => {});
});
```

#### 5. Dynamic Layer Tests (6 tests)

Test expression evaluation for dynamic layers (2, 4, 7):

```typescript
describe("Dynamic Layer Evaluation", () => {
  it("L2: providerSelectDefaultFieldProps evaluates expressions", () => {});
  it("L2: providerSelectDefaultFieldProps re-evaluates on change", () => {});
  it("L4: formSelectDefaultFieldProps evaluates expressions", () => {});
  it("L4: formSelectDefaultFieldProps re-evaluates on change", () => {});
  it("L7: selectProps evaluates expressions", () => {});
  it("L7: selectProps re-evaluates on change", () => {});
});
```

#### 6. Edge Cases (8 tests)

```typescript
describe("Edge Cases", () => {
  it("handles undefined layers", () => {});
  it("handles null values", () => {});
  it("handles empty objects", () => {});
  it("handles function callbacks", () => {});
  it("handles circular references", () => {});
  it("handles Symbol properties", () => {});
  it("handles frozen objects", () => {});
  it("handles property descriptors", () => {});
});
```

#### 7. Performance Tests (2 tests)

```typescript
describe("Performance", () => {
  it("handles rapid prop changes without memory leaks", () => {});
  it("only re-evaluates affected layers", () => {});
});
```

### Total Test Count

- Single Layer: 8 tests
- Adjacent Layer: 7 tests
- Skip Layer: 6 tests
- Merge Behavior: 4 tests
- Dynamic Layers: 6 tests
- Edge Cases: 8 tests
- Performance: 2 tests
- **Total: 41 comprehensive tests**

---

## Documentation References

### Official Documentation

1. **React Testing Library**
   - URL: https://testing-library.com/docs/react-testing-library/intro/
   - Key Topics: Queries, Async utilities, User interactions
   - Best Practice: "The more your tests resemble the way your software is used, the more confidence they can give you."

2. **Vitest**
   - URL: https://vitest.dev/guide/
   - Key Topics: Mocking, Test context, Coverage
   - Best Practice: Use `vi` global for all mocking operations

3. **React Hook Form Testing**
   - URL: https://react-hook-form.com_advanced-usage#Testing
   - Key Topics: Testing form validation, Controller testing
   - Best Practice: Wrap components in `<FormProvider>` for testing

4. **userEvent**
   - URL: https://testing-library.com/docs/user-event/intro/
   - Key Topics: Click, type, clear, upload
   - Best Practice: Always `await` userEvent actions

### Community Resources

1. **Testing Prop Merging Patterns**
   - URL: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
   - Key Topics: Not using implementation details, Testing behavior
   - Relevant Quote: "The more your tests resemble the way your software is used, the more confidence they can give you."

2. **Component Testing Best Practices**
   - URL: https://testingjavascript.com/
   - Key Topics: Integration testing, Test isolation
   - Best Practice: Test full integration points, not implementation

### Internal Documentation

1. **Formality Core API**
   - Path: `/packages/core/README.md`
   - Key Topics: mergeFieldProps, evaluateDescriptor, buildFieldContext

2. **Formality React API**
   - Path: `/packages/react/README.md`
   - Key Topics: usePropsEvaluation, Field component, FormalityProvider

3. **Existing Test Patterns**
   - Path: `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx`
   - Key Topics: Expression evaluation, Priority testing, Re-evaluation tests

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create test utilities and helpers
- [ ] Set up test fixtures (mock components)
- [ ] Write single layer tests (8 tests)
- [ ] Configure test coverage reporting

### Phase 2: Priority Testing (Week 2)
- [ ] Write adjacent layer tests (7 tests)
- [ ] Write skip layer tests (6 tests)
- [ ] Write merge behavior tests (4 tests)
- [ ] Document test results

### Phase 3: Dynamic Testing (Week 3)
- [ ] Write dynamic layer tests (6 tests)
- [ ] Write re-evaluation tests
- [ ] Test expression caching
- [ ] Performance benchmarks

### Phase 4: Edge Cases (Week 4)
- [ ] Write edge case tests (8 tests)
- [ ] Write performance tests (2 tests)
- [ ] Regression test suite
- [ ] Documentation updates

---

## Test File Structure

```
packages/react/src/__tests__/
├── Field.test.tsx                    # Existing Field tests
├── selectDefaultFieldProps.test.tsx  # Existing dynamic props tests
├── propPriority.test.tsx             # NEW: 8-layer priority tests
│   ├── single-layer.test.ts          # 8 tests
│   ├── adjacent-layer.test.ts        # 7 tests
│   ├── skip-layer.test.ts            # 6 tests
│   ├── merge-behavior.test.ts        # 4 tests
│   ├── dynamic-layers.test.ts        # 6 tests
│   ├── edge-cases.test.ts            # 8 tests
│   └── performance.test.ts           # 2 tests
└── helpers/
    ├── test-components.tsx           # Mock components
    ├── test-renderers.tsx            # Custom render functions
    └── test-assertions.ts            # Assertion helpers
```

---

## Conclusion

This research document provides comprehensive guidance for testing the Formality 8-layer prop priority system. The key takeaways are:

1. **Test isolation is critical** - Each layer should be testable independently
2. **Use data-testid consistently** - Reliable selectors are essential
3. **Test both merge and override behavior** - Verify deep merge and priority override
4. **Mock strategically** - Only mock when testing priority, not functionality
5. **Comprehensive coverage requires 40+ tests** - Cover all combinations and edge cases
6. **Performance matters** - Test rapid changes and memory leaks

The existing test file `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx` demonstrates many of these patterns and should be used as a reference for implementing the full priority test suite.

---

**Next Steps:**
1. Review this research document with the team
2. Prioritize test categories based on risk
3. Implement tests in phases
4. Establish coverage metrics
5. Set up continuous integration

**Document Status:** Ready for implementation
**Last Updated:** 2025-01-11
**Maintainer:** Development Team
