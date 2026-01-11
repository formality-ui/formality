# Research: Testing Form-Level vs Provider-Level Priority Order

## Summary

Research on testing the priority order between form-level and provider-level props in the Formality UI library. This documents the 8-layer priority system and testing patterns for verifying correct override behavior.

## The 8-Layer Priority System

### Official Priority Order

From `/packages/core/src/config/merge.ts`:

```typescript
export function mergeFieldProps(options: {
  providerDefaultFieldProps,        // Layer 8 (lowest)
  providerSelectDefaultFieldProps,  // Layer 7
  formDefaultFieldProps,           // Layer 6
  formSelectDefaultFieldProps,      // Layer 5 ← FOCUS HERE
  inputProps,                       // Layer 4
  fieldConfigProps,                // Layer 3
  selectProps,                      // Layer 2
  componentProps,                  // Layer 1
  coreProps,                        // Always wins
})
```

### Key Insight for P1.M1.T3.S2

**Form-level props (layers 5-6) override Provider-level props (layers 7-8)**

This means:
- `formConfig.selectDefaultFieldProps` (layer 5) > `provider.selectDefaultFieldProps` (layer 7)
- `formConfig.defaultFieldProps` (layer 6) > `provider.defaultFieldProps` (layer 8)

## Test Patterns for Priority Testing

### Pattern 1: Simple Override Test

Test that form-level props override provider-level props for the same property:

```typescript
it("should prioritize form props over provider props", () => {
  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{ size: '"small"' }}  // Provider: small
    >
      <Form
        config={{ field: { type: "textField" } }}
        formConfig={{ selectDefaultFieldProps: { size: '"large"' } }}  // Form: large
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: Form size wins (large > small)
  expect(screen.getByTestId("field")).toHaveAttribute("data-size", "large");
});
```

### Pattern 2: Merge Test (Non-Conflicting Props)

Test that non-conflicting props from both levels are applied:

```typescript
it("should merge form and provider props when different", () => {
  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{
        size: '"small"',      // Provider provides size
        variant: '"provider"' // Provider provides variant
      }}
    >
      <Form
        config={{ field: { type: "textField" } }}
        formConfig={{
          selectDefaultFieldProps: {
            size: '"large"',         // Form overrides size
            className: '"form-class"' // Form adds className
          }
        }}
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );

  const field = screen.getByTestId("field");

  // ASSERT: Form size overrides provider size
  expect(field).toHaveAttribute("data-size", "large");

  // ASSERT: Provider variant applies (form didn't override)
  expect(field).toHaveAttribute("data-variant", "provider");

  // ASSERT: Form className applies (provider didn't provide)
  expect(field).toHaveClass("form-class");
});
```

### Pattern 3: Complete Priority Chain Test

Test all three levels (provider, form, field) simultaneously:

```typescript
it("should apply correct priority: field > form > provider", () => {
  const config: FormFieldsConfig = {
    field: {
      type: "textField",
      selectProps: { size: '"field"' },  // Field: highest
    },
  };

  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{
        size: '"provider"',   // Provider: lowest
        variant: '"provider"',
        className: '"provider"'
      }}
    >
      <Form
        config={config}
        formConfig={{
          selectDefaultFieldProps: {
            size: '"form"',        // Form: middle
            variant: '"form"',
            className: '"form-class"'
          }
        }}
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );

  const field = screen.getByTestId("field");

  // ASSERT: Priority for each prop
  expect(field).toHaveAttribute("data-size", "field");      // Field wins
  expect(field).toHaveAttribute("data-variant", "form");     // Form wins (field didn't provide)
  expect(field).toHaveClass("form-class");                  // Form wins
  expect(field).not.toHaveClass("provider");               // Provider overridden
});
```

### Pattern 4: Dynamic Expression Priority Test

Test that form-level expressions override provider-level expressions:

```typescript
it("should prioritize form expressions over provider expressions", async () => {
  const config: FormFieldsConfig = {
    toggle: { type: "switch" },
    target: { type: "textField" },
  };

  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{
        className: 'toggle ? "provider-on" : "provider-off"'  // Provider expression
      }}
    >
      <Form
        config={config}
        formConfig={{
          selectDefaultFieldProps: {
            className: 'toggle ? "form-on" : "form-off"'  // Form expression (should win)
          }
        }}
      >
        <Field name="toggle" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: Initial state - form expression wins
  expect(screen.getByTestId("target")).toHaveClass("form-off");

  // ACT: Toggle the switch
  const user = userEvent.setup();
  await user.click(screen.getByTestId("toggle"));

  // ASSERT: Toggled state - form expression still wins
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("form-on");
  });

  // ASSERT: Provider expression never applied
  expect(screen.getByTestId("target")).not.toHaveClass("provider-on");
  expect(screen.getByTestId("target")).not.toHaveClass("provider-off");
});
```

### Pattern 5: Function Priority Test

Test that form-level functions override provider-level functions:

```typescript
it("should prioritize form functions over provider functions", () => {
  let providerCalled = false;
  let formCalled = false;

  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={() => {
        providerCalled = true;
        return { className: '"provider"' };
      }}
    >
      <Form
        config={{ field: { type: "textField" } }}
        formConfig={{
          selectDefaultFieldProps: () => {
            formCalled = true;
            return { className: '"form"' };
          }
        }}
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: Form function was called
  expect(formCalled).toBe(true);

  // ASSERT: Provider function was NOT called (or called but overridden)
  // Note: Both may be called during evaluation, but form result wins
  expect(screen.getByTestId("field")).toHaveClass("form");
  expect(screen.getByTestId("field")).not.toHaveClass("provider");
});
```

## Testing Strategy for P1.M1.T3.S2

### Test Suite Structure

```typescript
describe("selectDefaultFieldProps - Form Level - Expression-Based", () => {
  // Test form-level expression evaluation
  // Test form overrides provider for same prop
  // Test form and provider merge for different props
});

describe("selectDefaultFieldProps - Form Level - Function Callbacks", () => {
  // Test form-level function receives formState
  // Test form-level function receives methods
  // Test form function overrides provider function
});

describe("selectDefaultFieldProps - Form Level - Re-Evaluation", () => {
  // Test form props re-evaluate when dependency changes
  // Test multiple fields watching same dependency
  // Test form expression overrides provider expression during re-evaluation
});

describe("selectDefaultFieldProps - Form Level - Priority Ordering", () => {
  // Test form props override provider props
  // Test field props override both form and provider
  // Test complete priority chain
});
```

### Test Data Strategy

Use distinct, meaningful values at each level:

```typescript
// GOOD: Clear distinction between levels
Provider:  size = "small",   variant = "provider",  className = "provider-class"
Form:      size = "medium",  variant = "form",      className = "form-class"
Field:     size = "large",   variant = "field",     className = "field-class"

// Expected result:
size = "large"       // Field wins (highest priority)
variant = "field"    // Field wins
className = "field-class" // Field wins
```

### Assertion Strategy

1. **Test override**: Same prop at multiple levels → highest wins
2. **Test merge**: Different props at each level → all apply
3. **Test isolation**: Form A doesn't affect Form B (different forms in same provider)

## External Documentation References

### React Component Props
- **Props Documentation**: https://react.dev/learn/passing-props-to-a-component
- **Composition**: https://react.dev/learn/passing-props-to-a-component#passing-props-as-a-single-object

### Testing Library
- **Priority Testing**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#not-using-testing-library-assertion-helpers
- **Async Testing**: https://testing-library.com/docs/dom-testing-library/api-async

### Design Patterns
- **Configuration Objects**: https://www.patterns.dev/posts/composition-pattern
- **Provider Pattern**: https://www.patterns.dev/posts/provider-pattern

## Gotchas

1. **Core props always win**: Properties like `disabled`, `hidden`, `name` have special handling and override everything

2. **Expression evaluation order**: Both provider and form expressions are evaluated, but form result wins

3. **Function callbacks**: Both provider and form functions may be called, but form result wins

4. **Merge vs replace**: Different props merge, same props replace (not extend)

5. **Scope**: Provider props apply to ALL forms, form props apply only to that form

6. **Static vs dynamic**: `selectDefaultFieldProps` (dynamic) overrides `defaultFieldProps` (static) at the same level

7. **Test isolation**: Each test should be independent - don't rely on state from other tests

8. **waitFor necessity**: Always use waitFor for assertions after state changes

## Summary

For P1.M1.T3.S2 (Test form-level evaluation), the key priority rule to test is:

**Form-level props (layer 5) > Provider-level props (layer 7)**

This means:
1. Form `selectDefaultFieldProps` overrides Provider `selectDefaultFieldProps`
2. Different props from both levels merge together
3. Field-level props (layer 2) override both
4. Expressions re-evaluate when dependencies change
