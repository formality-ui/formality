# Research: Testing Form-Level Props Evaluation

## Summary

Research on testing patterns for form-level `selectDefaultFieldProps` evaluation in React components. This research documents best practices for testing form-level configuration that overrides provider-level defaults.

## Key Concepts

### Form-Level Props vs Provider-Level Props

**Form-Level (`formConfig.selectDefaultFieldProps`)**:
- Defined in the `Form` component's `formConfig` prop
- Applies only to fields within that specific form
- Has **higher priority** than provider-level props (layer 5 > layer 7)
- Evaluates expressions with access to form state

**Provider-Level (`provider.selectDefaultFieldProps`)**:
- Defined in the `FormalityProvider` component
- Applies to ALL forms within the provider scope
- Has **lower priority** than form-level props (layer 7 < layer 5)
- Serves as global defaults that can be overridden

### Priority Order (8-Layer System)

From `/packages/core/src/config/merge.ts`:
```
1. Component props (JSX)           ← HIGHEST
2. Field config selectProps
3. Field config props
4. Input config props
5. Form selectDefaultFieldProps     ← THIS LEVEL
6. Form defaultFieldProps
7. Provider selectDefaultFieldProps
8. Provider defaultFieldProps       ← LOWEST
```

## Test Patterns

### Pattern 1: Testing Form-Level Override

**Goal**: Verify that form-level props override provider-level props

```typescript
it("should prioritize form props over provider props", () => {
  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{ size: '"small"', variant: '"provider"' }}
    >
      <Form
        config={{ field: { type: "textField" } }}
        formConfig={{ selectDefaultFieldProps: { size: '"large"' } }}
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: Form size overrides provider size
  expect(screen.getByTestId("field")).toHaveAttribute("data-size", "large");

  // ASSERT: Provider variant applies (form didn't override)
  expect(screen.getByTestId("field")).toHaveAttribute("data-variant", "provider");
});
```

**Key Points**:
- Use distinct values at each level for clear assertions
- Test both override behavior (same prop) and merge behavior (different props)

### Pattern 2: Testing Form-Level Expression Evaluation

**Goal**: Verify that form-level expressions evaluate correctly

```typescript
it("should evaluate form-level boolean expression for className", async () => {
  const config: FormFieldsConfig = {
    signed: { type: "switch" },
    target: { type: "textField" },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={config}
        formConfig={{ selectDefaultFieldProps: { className: 'signed ? "signed-enabled" : "signed-disabled"' } }}
      >
        <Field name="signed" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: Initial state - signed=false → "signed-disabled"
  expect(screen.getByTestId("target")).toHaveClass("signed-disabled");

  // ACT: Toggle signed to true
  const user = userEvent.setup();
  await user.click(screen.getByTestId("signed"));

  // ASSERT: signed=true → "signed-enabled"
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("signed-enabled");
  });
});
```

**Key Points**:
- Form-level expressions have access to all form fields
- Expressions re-evaluate when dependencies change
- Use `waitFor` for async assertions after state changes

### Pattern 3: Testing Form-Level Function Callbacks

**Goal**: Verify that form-level function callbacks receive correct parameters

```typescript
it("should call form-level function with formState", () => {
  let capturedFormState: any;

  const config: FormFieldsConfig = {
    field: { type: "textField" },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={config}
        formConfig={{
          selectDefaultFieldProps: (formState, methods) => {
            capturedFormState = formState;
            return { className: formState.fields.field?.value ? "has-value" : "no-value" };
          }
        }}
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: Function was called with formState
  expect(capturedFormState).toBeDefined();
});
```

**Key Points**:
- Function callbacks receive `(formState, methods)` parameters
- `formState.fields` contains field state proxies
- `methods` contains react-hook-form methods

### Pattern 4: Testing Re-Evaluation After Dependency Changes

**Goal**: Verify that form-level props re-evaluate when dependencies change

```typescript
it("should re-evaluate form props when dependency changes", async () => {
  const config: FormFieldsConfig = {
    source: { type: "textField", defaultValue: "" },
    target1: { type: "textField" },
    target2: { type: "textField" },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={config}
        formConfig={{ selectDefaultFieldProps: { placeholder: "source" } }}
      >
        <Field name="source" />
        <Field name="target1" />
        <Field name="target2" />
      </Form>
    </FormalityProvider>
  );

  const user = userEvent.setup();
  await user.type(screen.getByTestId("source"), "Test");

  // Both targets should update
  await waitFor(() => {
    expect(screen.getByTestId("target1")).toHaveAttribute("placeholder", "Test");
    expect(screen.getByTestId("target2")).toHaveAttribute("placeholder", "Test");
  });
});
```

**Key Points**:
- Form-level props use `useWatch` to track dependencies
- All fields watching the same dependency update together
- Use `waitFor` to wait for re-evaluation to complete

### Pattern 5: Testing Multiple Priority Levels

**Goal**: Verify the complete priority chain: field > form > provider

```typescript
it("should apply correct priority: field > form > provider", () => {
  const config: FormFieldsConfig = {
    field: {
      type: "textField",
      selectProps: { size: '"field"' },
    },
  };

  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{ size: '"provider"', variant: '"provider"' }}
    >
      <Form
        config={config}
        formConfig={{ selectDefaultFieldProps: { size: '"form"', className: '"form-class"' } }}
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );

  const field = screen.getByTestId("field");

  // ASSERT: Priority: field > form > provider
  expect(field).toHaveAttribute("data-size", "field");      // Field wins
  expect(field).toHaveClass("form-class");                  // Form applies (field doesn't override)
  expect(field).toHaveAttribute("data-variant", "provider"); // Provider applies
});
```

**Key Points**:
- Test all three levels simultaneously
- Use different props at each level to verify merge behavior
- Verify that highest priority wins for conflicting props

## External Documentation References

### React Testing Library
- **Introduction**: https://testing-library.com/docs/react-testing-library/intro/
- **waitFor API**: https://testing-library.com/docs/dom-testing-library/api-async#waitfor
- **Cheatsheet**: https://testing-library.com/docs/react-testing-library/cheatsheet/

### React Context Testing
- **Testing Context**: https://react.dev/learn/scaling-up-with-reducer-and-context
- **renderHook API**: https://testing-library.com/docs/react-testing-library/api#renderhook

### React Hook Form
- **Testing Guide**: https://react-hook-form.com/docs/write-tests-for-react-hook-form
- **useWatch API**: https://react-hook-form.com/docs/usewatch

### Best Practices
- **Common Mistakes**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- **Testing Async**: https://testing-library.com/docs/dom-testing-library/faq#what-if-async-updates-arent-happening

## Gotchas and Considerations

1. **Test components must use forwardRef**: The Field component passes ref to input, so test fixtures must match this pattern

2. **Always use data-testid for selectors**: This matches existing test patterns and is more stable than DOM-based queries

3. **Always use waitFor for async assertions**: Expression evaluation happens after render cycle

4. **Use userEvent.setup() per test**: Creates a fresh userEvent instance for each test

5. **All userEvent methods are async**: Always await userEvent calls

6. **Form props override provider props**: This is the key behavior to verify

7. **Expressions use jsep syntax**: Field references like `'fieldName'` evaluate to field value

8. **Function callbacks receive (formState, methods)**: Verify correct parameters are passed

9. **Re-evaluation happens via useWatch**: When watched field changes, props update

10. **Default values matter**: If field has no default value, it's undefined in formState

## Summary

Form-level `selectDefaultFieldProps` testing requires:
1. Testing override behavior (form > provider)
2. Testing expression evaluation with form state
3. Testing function callback parameters
4. Testing re-evaluation when dependencies change
5. Testing complete priority chain (field > form > provider)
