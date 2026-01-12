# Quick Reference: 8-Layer Prop Priority Testing

**Task:** P1.M1.T3.S3
**Date:** 2025-01-11

## The 8 Layers (Low to High Priority)

```
Layer 1 (lowest):  providerDefaultFieldProps
Layer 2:           providerSelectDefaultFieldProps (dynamic)
Layer 3:           formDefaultFieldProps
Layer 4:           formSelectDefaultFieldProps (dynamic)
Layer 5:           inputProps
Layer 6:           fieldConfigProps
Layer 7:           selectProps (dynamic)
Layer 8:           componentProps
Layer 9 (highest): coreProps (always wins - not tested for override)
```

## Test Component Template

```typescript
import React, { forwardRef } from "react";

interface TestInputProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  name: string;
  size?: string;
  variant?: string;
  className?: string;
  [key: string]: unknown;
}

export const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, name, size, variant, className, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      data-size={size}
      data-variant={variant}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={className}
      {...props}
    />
  )
);

TestInput.displayName = "TestInput";
```

## Test Structure Template

```typescript
describe("8-Layer Priority System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should apply Layer X", () => {
    // Arrange: Set up component with Layer X prop
    // Act: Render component
    // Assert: Verify Layer X prop is applied
  });

  it("Layer X+1 should override Layer X", () => {
    // Arrange: Set both Layer X and Layer X+1 with same prop
    // Act: Render component
    // Assert: Verify Layer X+1 value wins
  });
});
```

## Common Assertion Patterns

```typescript
// Attribute assertions
expect(element).toHaveAttribute("data-size", "large");
expect(element).toHaveAttribute("data-variant", "outlined");

// Class assertions
expect(element).toHaveClass("test-class");
expect(element).not.toHaveClass("other-class");

// State assertions
expect(element).toBeDisabled();
expect(element).toBeEnabled();
expect(element).toBeRequired();

// Style assertions
expect(element.style.color).toBe("red");
expect(element.style.fontSize).toBe("14px");

// Async assertions
await waitFor(() => {
  expect(element).toHaveClass("updated");
});
```

## Testing Priority Order

### Single Layer Test
```typescript
it("Layer 1: providerDefaultFieldProps applies", () => {
  render(
    <FormalityProvider
      defaultFieldProps={{ size: "small" }}
    >
      <Form config={{ test: { type: "textField" } }}>
        <Field name="test" />
      </Form>
    </FormalityProvider>
  );

  expect(screen.getByTestId("test")).toHaveAttribute("data-size", "small");
});
```

### Adjacent Layer Test
```typescript
it("Layer 2 overrides Layer 1", () => {
  render(
    <FormalityProvider
      defaultFieldProps={{ size: "L1" }}
      selectDefaultFieldProps={{ size: "L2" }}
    >
      <Form config={{ test: { type: "textField" } }}>
        <Field name="test" />
      </Form>
    </FormalityProvider>
  );

  expect(screen.getByTestId("test")).toHaveAttribute("data-size", "L2");
});
```

### Skip Layer Test
```typescript
it("Layer 3 overrides Layer 1 (skipping Layer 2)", () => {
  render(
    <FormalityProvider
      defaultFieldProps={{ size: "L1" }}
      // Layer 2 not set
    >
      <Form
        config={{ test: { type: "textField" } }}
        formConfig={{ defaultFieldProps: { size: "L3" } }}
      >
        <Field name="test" />
      </Form>
    </FormalityProvider>
  );

  expect(screen.getByTestId("test")).toHaveAttribute("data-size", "L3");
});
```

### Merge Test
```typescript
it("should merge different properties from all layers", () => {
  render(
    <FormalityProvider
      defaultFieldProps={{ size: "small" }}
      selectDefaultFieldProps={{ variant: "outlined" }}
    >
      <Form
        config={{ test: { type: "textField" } }}
        formConfig={{ defaultFieldProps: { className: "test" } }}
      >
        <Field
          name="test"
          inputProps={{ autoComplete: "on" }}
        />
      </Form>
    </FormalityProvider>
  );

  const element = screen.getByTestId("test");
  expect(element).toHaveAttribute("data-size", "small");
  expect(element).toHaveAttribute("data-variant", "outlined");
  expect(element).toHaveClass("test");
  expect(element).toHaveAttribute("autocomplete", "on");
});
```

### Dynamic Expression Test
```typescript
it("Layer 2: providerSelectDefaultFieldProps evaluates expressions", async () => {
  const config = {
    toggle: { type: "switch" },
    target: { type: "textField" },
  };

  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{
        className: "toggle ? 'on' : 'off'"
      }}
    >
      <Form config={config}>
        <Field name="toggle" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  // Initial state
  expect(screen.getByTestId("target")).toHaveClass("off");

  // Toggle
  const user = userEvent.setup();
  await user.click(screen.getByTestId("toggle"));

  // After toggle
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("on");
  });
});
```

## Test Coverage Checklist

### Single Layer Tests (8 tests × 3 assertions = 24 tests)
- [ ] Layer 1: providerDefaultFieldProps
- [ ] Layer 2: providerSelectDefaultFieldProps
- [ ] Layer 3: formDefaultFieldProps
- [ ] Layer 4: formSelectDefaultFieldProps
- [ ] Layer 5: inputProps
- [ ] Layer 6: fieldConfigProps
- [ ] Layer 7: selectProps
- [ ] Layer 8: componentProps

### Adjacent Layer Tests (7 tests)
- [ ] L2 > L1
- [ ] L3 > L2
- [ ] L4 > L3
- [ ] L5 > L4
- [ ] L6 > L5
- [ ] L7 > L6
- [ ] L8 > L7

### Skip Layer Tests (6 tests)
- [ ] L3 > L1 (skip L2)
- [ ] L4 > L1 (skip L2, L3)
- [ ] L5 > L2 (skip L3, L4)
- [ ] L7 > L4 (skip L5, L6)
- [ ] L8 > L3 (skip L4-L7)
- [ ] L8 > L1 (skip L2-L7)

### Merge Behavior Tests (4 tests)
- [ ] Deep merge nested objects
- [ ] Replace arrays
- [ ] Merge different properties
- [ ] Override same properties

### Dynamic Layer Tests (6 tests)
- [ ] L2 expression evaluation
- [ ] L2 re-evaluation
- [ ] L4 expression evaluation
- [ ] L4 re-evaluation
- [ ] L7 expression evaluation
- [ ] L7 re-evaluation

### Edge Cases (8 tests)
- [ ] Undefined layers
- [ ] Null values
- [ ] Empty objects
- [ ] Function callbacks
- [ ] Frozen objects
- [ ] Symbol properties
- [ ] Circular references
- [ ] Property descriptors

### Performance Tests (2 tests)
- [ ] Rapid changes without memory leaks
- [ ] Only re-evaluate affected layers

**Total: 41 tests**

## Key Implementation Files

```
packages/
├── core/src/config/merge.ts              # Core merging logic
│   └── mergeFieldProps()                 # Main merge function
├── react/src/
│   ├── hooks/usePropsEvaluation.ts       # Dynamic prop evaluation
│   ├── components/Field.tsx              # Field component
│   └── __tests__/
│       ├── helpers/                      # NEW: Test helpers
│       │   ├── test-components.tsx       # Mock components
│       │   ├── test-renderers.tsx        # Custom render
│       │   └── test-assertions.ts        # Assertions
│       ├── selectDefaultFieldProps.test.tsx  # Existing tests
│       └── propPriority.test.tsx         # NEW: Priority tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific file
npm test propPriority

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run with UI
npm test -- --ui
```

## Documentation References

- **Main Research:** `prop_merging_testing_best_practices.md`
- **External Resources:** `external_resources.md`
- **Implementation Guide:** `implementation_guide.md`
- **This Quick Reference:** `quick_reference.md`

## Best Practices Summary

1. **Use forwardRef** for test components
2. **Always include data-testid** for reliable selectors
3. **Use userEvent** over fireEvent
4. **Use waitFor** for async assertions
5. **Test isolation** - each test should be independent
6. **Test both merge and override** behavior
7. **Test dynamic expression evaluation**
8. **Test edge cases** (null, undefined, empty)
9. **Measure performance** for rapid changes
10. **Aim for 80%+ coverage**

## Common Pitfalls

❌ **Don't** use implementation details (internal state, methods)
❌ **Don't** forget forwardRef on test components
❌ **Don't** use fireEvent instead of userEvent
❌ **Don't** forget waitFor for async updates
❌ **Don't** test props that don't affect output

✅ **Do** test what users see and interact with
✅ **Do** use data-testid for selectors
✅ **Do** use userEvent for interactions
✅ **Do** use waitFor for async assertions
✅ **Do** test rendered output

## Test Data Factory

```typescript
function createLayerProps(layer: number, prop: string, value: string) {
  const configs = {
    1: { defaultFieldProps: { [prop]: value } },
    2: { selectDefaultFieldProps: { [prop]: value } },
    3: { formConfig: { defaultFieldProps: { [prop]: value } } },
    4: { formConfig: { selectDefaultFieldProps: { [prop]: value } } },
    5: { inputProps: { [prop]: value } },
    6: { fieldConfigProps: { [prop]: value } },
    7: { selectProps: { [prop]: value } },
    8: { componentProps: { [prop]: value } },
  };

  return configs[layer];
}
```

## Status

- **Research:** ✅ Complete
- **Documentation:** ✅ Complete
- **Implementation:** 🔄 Pending
- **Tests:** ⏳ Not started

**Next Steps:**
1. Create test helpers
2. Implement single layer tests
3. Implement adjacent layer tests
4. Implement skip layer tests
5. Implement merge behavior tests
6. Implement dynamic layer tests
7. Implement edge case tests
8. Implement performance tests
9. Verify coverage
10. Documentation

---

**Version:** 1.0.0
**Last Updated:** 2025-01-11
**Maintainer:** Development Team
