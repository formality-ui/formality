# Testing Patterns for Async Expression Evaluation

**Source**: External research by agent a79dd13 + codebase analysis

## Summary

Comprehensive patterns for testing async expression evaluation in React components, specifically for the formality codebase.

## 1. Using waitFor for Async State Changes

### Basic waitFor Usage

**From Field.test.tsx:283-288**:
```typescript
await waitFor(() => {
  expect(screen.getByTestId("target")).toHaveAttribute(
    "placeholder",
    "Updated",
  );
});
```

### waitFor with Custom Timeout

```typescript
await waitFor(
  () => {
    expect(screen.getByText("Async complete")).toBeInTheDocument();
  },
  { timeout: 5000, interval: 100 }
);
```

### Using act() with Fake Timers

**From autosave-validation.test.tsx:124-126**:
```typescript
await act(async () => {
  await vi.advanceTimersByTimeAsync(100);
});
```

## 2. Testing Expressions That Evaluate Based on Form State

### Pattern: Testing selectProps Expression Evaluation

**From Field.test.tsx:255-289**:
```typescript
it("should update selectProps when referenced field changes", async () => {
  const config: FormFieldsConfig = {
    source: { type: "textField" },
    target: {
      type: "textField",
      selectProps: { placeholder: "source" }, // Expression references 'source'
    },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form config={config} record={{ source: "Initial" }}>
        <Field name="source" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  // Initial evaluation
  expect(screen.getByTestId("target")).toHaveAttribute("placeholder", "Initial");

  // Trigger change
  const user = userEvent.setup();
  await user.clear(screen.getByTestId("source"));
  await user.type(screen.getByTestId("source"), "Updated");

  // Wait for re-evaluation
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveAttribute("placeholder", "Updated");
  });
});
```

### Pattern: Testing Conditional Expressions

**From Field.test.tsx:182-203**:
```typescript
it("should support visible condition in config", () => {
  const config: FormFieldsConfig = {
    toggle: { type: "textField" },
    conditional: {
      type: "textField",
      conditions: [{ when: "toggle", is: "no", visible: false }],
    },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form config={config} defaultValues={{ toggle: "yes" }}>
        <Field name="toggle" />
        <Field name="conditional" />
      </Form>
    </FormalityProvider>
  );

  // Field renders because condition doesn't match
  expect(screen.getByTestId("conditional")).toBeInTheDocument();
});
```

## 3. Testing Conditional Rendering Based on State

### Pattern: Testing Visibility

**From Field.test.tsx:119-129**:
```typescript
it("should not render when hidden prop is true", () => {
  render(
    <FormalityProvider inputs={testInputs}>
      <Form config={{ name: { type: "textField" } }}>
        <Field name="name" hidden />
      </Form>
    </FormalityProvider>
  );

  expect(screen.queryByTestId("name")).not.toBeInTheDocument();
});
```

**Key Point**: Use `queryByTestId` (not `getByTestId`) when testing element absence.

### Pattern: Testing Disabled State Changes

**From Field.test.tsx:429-450**:
```typescript
it("should use disabled prop over condition result", () => {
  const config: FormFieldsConfig = {
    toggle: { type: "switch" },
    field: {
      type: "textField",
      conditions: [{ when: "toggle", truthy: true, disabled: true }],
    },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form config={config} record={{ toggle: true }}>
        <Field name="toggle" />
        <Field name="field" disabled={false} /> {/* Explicit override */}
      </Form>
    </FormalityProvider>
  );

  expect(screen.getByTestId("field")).not.toBeDisabled();
});
```

## 4. Testing Dynamic Props Evaluation

### Pattern: Testing Value Transformation

**From Field.test.tsx:293-323**:
```typescript
it("should apply parser on change", async () => {
  const parseToUpperCase = vi.fn((value: string) => value.toUpperCase());

  const inputs = {
    textField: {
      component: TestInput,
      defaultValue: "",
      parser: parseToUpperCase,
    },
  };

  render(
    <FormalityProvider inputs={inputs}>
      <Form config={{ name: { type: "textField" } }}>
        {({ methods }) => (
          <>
            <Field name="name" />
            <span data-testid="value">{methods.watch("name")}</span>
          </>
        )}
      </Form>
    </FormalityProvider>
  );

  const user = userEvent.setup();
  await user.type(screen.getByTestId("name"), "hello");

  await waitFor(() => {
    expect(screen.getByTestId("value")).toHaveTextContent("HELLO");
  });
});
```

### Pattern: Testing Dependent Field Updates

**From complete-form.test.tsx:99-126**:
```typescript
it("should update dependent field when source field changes", async () => {
  const config: FormFieldsConfig = {
    client: { type: "textField" },
    clientContact: {
      type: "textField",
      selectProps: { placeholder: "client" },
    },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form config={config}>
        <Field name="client" />
        <Field name="clientContact" />
      </Form>
    </FormalityProvider>
  );

  const user = userEvent.setup();
  await user.type(screen.getByTestId("client"), "Acme Corp");

  await waitFor(() => {
    expect(screen.getByTestId("clientContact")).toHaveAttribute(
      "placeholder",
      "Acme Corp",
    );
  });
});
```

## 5. Mocking Form Context and Provider Context

### Pattern: Using Real Providers (Recommended)

**From Field.test.tsx:80-90**:
```typescript
it("should render the configured component", () => {
  render(
    <FormalityProvider inputs={testInputs}>
      <Form config={{ name: { type: "textField" } }}>
        <Field name="name" />
      </Form>
    </FormalityProvider>
  );

  expect(screen.getByTestId("name")).toBeInTheDocument();
});
```

### Pattern: Creating Custom Render Function

```typescript
// test-utils.tsx
import { render } from '@testing-library/react';
import { FormalityProvider } from '../components/FormalityProvider';
import { Form } from '../components/Form';

const testInputs = {
  textField: { component: TestInput, defaultValue: "" },
  switch: { component: TestSwitch, defaultValue: false },
};

function renderWithFormProviders(
  ui: React.ReactElement,
  { config = {}, formConfig, record, ...renderOptions } = {}
) {
  const Wrapper = ({ children }) => (
    <FormalityProvider inputs={testInputs}>
      <Form config={config} formConfig={formConfig} record={record}>
        {children}
      </Form>
    </FormalityProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Usage
renderWithFormProviders(<Field name="test" />, {
  config: { test: { type: 'textField' } }
});
```

## Testing Anti-Patterns to Avoid

### Don't Use setTimeout Instead of waitFor

```typescript
// ❌ BAD
await new Promise(resolve => setTimeout(resolve, 1000));
expect(screen.getByText("Done")).toBeInTheDocument();

// ✅ GOOD
await waitFor(() => {
  expect(screen.getByText("Done")).toBeInTheDocument();
});
```

### Don't Test Implementation Details

```typescript
// ❌ BAD
expect(component.state.isLoading).toBe(false);

// ✅ GOOD
expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
```

## Key Files in Codebase for Reference

1. `/packages/react/src/__tests__/Field.test.tsx` - selectProps evaluation tests
2. `/packages/react/src/__tests__/Form.test.tsx` - Form context and provider testing
3. `/packages/react/src/__tests__/integration/complete-form.test.tsx` - End-to-end workflows
4. `/packages/react/src/__tests__/autosave-validation.test.tsx` - Async testing with fake timers
5. `/packages/react/src/hooks/usePropsEvaluation.ts` - Implementation of prop evaluation

## Resources

- https://testing-library.com/docs/dom-testing-library/api-async/
- https://testing-library.com/docs/react-testing-library/cheatsheet/
- https://www.react-hook-form.com/testing
- https://vitest.dev/guide/mocking.html
