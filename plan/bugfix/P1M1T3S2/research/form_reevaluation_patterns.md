# Research: Testing Form-Level Props Re-Evaluation with waitFor

## Summary

Research on testing the re-evaluation behavior of form-level `selectDefaultFieldProps` when dependencies change. This documents patterns for testing async state changes, expression re-evaluation, and the use of `waitFor` in React tests.

## Key Concepts

### How Re-Evaluation Works

From the codebase analysis:

1. **Dependency Inference**: The `useInferredInputs` hook analyzes expressions to determine which fields to watch
2. **Subscription**: `useWatch` from react-hook-form subscribes to those specific fields
3. **Trigger**: When a watched field changes, `useWatch` triggers a re-render
4. **Re-evaluation**: `usePropsEvaluation` re-evaluates expressions with new form state
5. **Update**: Field component receives new props and re-renders

### The waitFor Pattern

`waitFor` is essential for testing async state changes because:
- Expression evaluation happens after the render cycle
- React state updates are batched and asynchronous
- DOM updates may not be immediate

```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByTestId("field")).toHaveClass("updated-class");
});
```

## Test Patterns

### Pattern 1: Basic Re-Evaluation Test

Test that form-level props re-evaluate when a dependency changes:

```typescript
it("should re-evaluate form props when dependency changes", async () => {
  const config: FormFieldsConfig = {
    signed: { type: "switch" },
    target: { type: "textField" },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={config}
        formConfig={{ selectDefaultFieldProps: { className: 'signed ? "yes" : "no"' } }}
      >
        <Field name="signed" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: Initial state - signed=false → "no"
  expect(screen.getByTestId("target")).toHaveClass("no");

  // ACT: Toggle signed to true
  const user = userEvent.setup();
  await user.click(screen.getByTestId("signed"));

  // ASSERT: signed=true → "yes" (after waitFor)
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("yes");
  });
});
```

**Key Points**:
- Test initial state before interaction
- Use `userEvent.setup()` for user interactions
- Always await userEvent methods
- Use `waitFor` for assertions after state changes

### Pattern 2: Toggle Back and Forth

Test that re-evaluation works in both directions:

```typescript
it("should re-evaluate form props when dependency toggles back", async () => {
  const config: FormFieldsConfig = {
    toggle: { type: "switch" },
    target: { type: "textField" },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={config}
        formConfig={{ selectDefaultFieldProps: { className: 'toggle ? "on" : "off"' } }}
      >
        <Field name="toggle" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  const user = userEvent.setup();

  // ASSERT: Initial state - toggle=false → "off"
  expect(screen.getByTestId("target")).toHaveClass("off");

  // ACT: Toggle to true
  await user.click(screen.getByTestId("toggle"));
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("on");
  });

  // ACT: Toggle back to false
  await user.click(screen.getByTestId("toggle"));
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("off");
  });
});
```

**Key Points**:
- Test multiple state transitions
- Verify re-evaluation works bidirectionally
- Each toggle should trigger re-evaluation

### Pattern 3: Multiple Fields Watching Same Dependency

Test that all dependent fields update together:

```typescript
it("should re-evaluate for multiple fields watching same dependency", async () => {
  const config: FormFieldsConfig = {
    signed: { type: "switch" },
    field1: { type: "textField" },
    field2: { type: "textField" },
    field3: { type: "textField" },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={config}
        formConfig={{ selectDefaultFieldProps: { className: 'signed ? "enabled" : "disabled"' } }}
      >
        <Field name="signed" />
        <Field name="field1" />
        <Field name="field2" />
        <Field name="field3" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: All fields have "disabled" class initially
  expect(screen.getByTestId("field1")).toHaveClass("disabled");
  expect(screen.getByTestId("field2")).toHaveClass("disabled");
  expect(screen.getByTestId("field3")).toHaveClass("disabled");

  // ACT: Toggle signed
  const user = userEvent.setup();
  await user.click(screen.getByTestId("signed"));

  // ASSERT: All fields update to "enabled"
  await waitFor(() => {
    expect(screen.getByTestId("field1")).toHaveClass("enabled");
    expect(screen.getByTestId("field2")).toHaveClass("enabled");
    expect(screen.getByTestId("field3")).toHaveClass("enabled");
  });
});
```

**Key Points**:
- Test that all watching fields update together
- Use waitFor with multiple assertions
- Verify complete state transition

### Pattern 4: String Expression Re-Evaluation

Test that string field references update correctly:

```typescript
it("should re-evaluate string expression when dependency changes", async () => {
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

  // ACT: Type in source field
  await user.type(screen.getByTestId("source"), "Test Value");

  // ASSERT: Both targets update with source value
  await waitFor(() => {
    expect(screen.getByTestId("target1")).toHaveAttribute("placeholder", "Test Value");
    expect(screen.getByTestId("target2")).toHaveAttribute("placeholder", "Test Value");
  });

  // ACT: Clear and type new value
  await user.clear(screen.getByTestId("source"));
  await user.type(screen.getByTestId("source"), "New Value");

  // ASSERT: Both targets update again
  await waitFor(() => {
    expect(screen.getByTestId("target1")).toHaveAttribute("placeholder", "New Value");
    expect(screen.getByTestId("target2")).toHaveAttribute("placeholder", "New Value");
  });
});
```

**Key Points**:
- Test that string expressions update in real-time
- Test multiple updates
- Verify all dependent fields receive same value

### Pattern 5: Form Overrides Provider During Re-Evaluation

Test that form-level expressions override provider-level during re-evaluation:

```typescript
it("should re-evaluate form expression over provider expression", async () => {
  const config: FormFieldsConfig = {
    toggle: { type: "switch" },
    target: { type: "textField" },
  };

  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{
        className: 'toggle ? "provider-on" : "provider-off"'
      }}
    >
      <Form
        config={config}
        formConfig={{
          selectDefaultFieldProps: {
            className: 'toggle ? "form-on" : "form-off"'
          }
        }}
      >
        <Field name="toggle" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  const user = userEvent.setup();

  // ASSERT: Initial - form expression wins
  expect(screen.getByTestId("target")).toHaveClass("form-off");
  expect(screen.getByTestId("target")).not.toHaveClass("provider-off");

  // ACT: Toggle
  await user.click(screen.getByTestId("toggle"));

  // ASSERT: Toggled - form expression still wins
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("form-on");
    expect(screen.getByTestId("target")).not.toHaveClass("provider-on");
  });
});
```

**Key Points**:
- Form-level props override provider-level props
- This holds true during re-evaluation
- Provider expressions are never visible when form overrides

### Pattern 6: Complex Expression Re-Evaluation

Test complex expressions with multiple dependencies:

```typescript
it("should re-evaluate complex expression with multiple dependencies", async () => {
  const config: FormFieldsConfig = {
    userType: { type: "textField", defaultValue: "user" },
    isPremium: { type: "switch", defaultValue: false },
    target: { type: "textField" },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={config}
        formConfig={{
          selectDefaultFieldProps: {
            className: 'userType === "admin" ? "admin" : isPremium ? "premium" : "basic"'
          }
        }}
      >
        <Field name="userType" />
        <Field name="isPremium" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  const user = userEvent.setup();

  // ASSERT: Initial state - userType="user", isPremium=false → "basic"
  expect(screen.getByTestId("target")).toHaveClass("basic");

  // ACT: Toggle isPremium to true
  await user.click(screen.getByTestId("isPremium"));
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("premium");
  });

  // ACT: Change userType to "admin"
  await user.clear(screen.getByTestId("userType"));
  await user.type(screen.getByTestId("userType"), "admin");
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("admin");
  });

  // ACT: Toggle isPremium back to false
  await user.click(screen.getByTestId("isPremium"));
  await waitFor(() => {
    // Still "admin" because admin > premium in expression
    expect(screen.getByTestId("target")).toHaveClass("admin");
  });
});
```

**Key Points**:
- Test complex conditional logic
- Verify expression evaluates correctly for each state
- Test multiple dependency changes

## waitFor Best Practices

### 1. Always Use waitFor for Async Assertions

```typescript
// GOOD: Use waitFor for async updates
await user.click(screen.getByTestId("toggle"));
await waitFor(() => {
  expect(screen.getByTestId("target")).toHaveClass("enabled");
});

// BAD: Missing waitFor
await user.click(screen.getByTestId("toggle"));
expect(screen.getByTestId("target")).toHaveClass("enabled"); // May fail!
```

### 2. Use Descriptive Assertions in waitFor

```typescript
// GOOD: Clear assertion
await waitFor(() => {
  expect(screen.getByTestId("target")).toHaveClass("enabled");
});

// ALSO GOOD: Multiple related assertions
await waitFor(() => {
  expect(screen.getByTestId("field1")).toHaveClass("enabled");
  expect(screen.getByTestId("field2")).toHaveClass("enabled");
  expect(screen.getByTestId("field3")).toHaveClass("enabled");
});
```

### 3. Default Timeout is 1000ms

```typescript
// Default timeout is 1000ms (1 second)
await waitFor(() => {
  expect(element).toBeInTheDocument();
}); // Times out after 1000ms

// Can customize if needed
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 2000 }); // 2 second timeout
```

### 4. findBy Queries Are Built-in waitFor

```typescript
// These are equivalent:
const element = await screen.findByTestId("target");

await waitFor(() => {
  expect(screen.getByTestId("target")).toBeInTheDocument();
});
```

## External Documentation References

### React Testing Library waitFor
- **waitFor API**: https://testing-library.com/docs/dom-testing-library/api-async#waitfor
- **Async FAQ**: https://testing-library.com/docs/dom-testing-library/faq#what-if-async-updates-arent-happening
- **Cheatsheet**: https://testing-library.com/docs/react-testing-library/cheatsheet/

### React Hook Form
- **useWatch**: https://react-hook-form.com/docs/usewatch
- **Testing Guide**: https://react-hook-form.com/docs/write-tests-for-react-hook-form

### User Event
- **User Event Docs**: https://testing-library.com/docs/user-event
- **Interactions**: https://testing-library.com/docs/user-event/convenience

## Common Pitfalls

1. **Forgetting waitFor**: State updates are async - always use waitFor for assertions after interactions

2. **Not awaiting userEvent**: All userEvent methods return promises - always await them

3. **Testing implementation**: Test through rendered output, not internal state

4. **Wrong test ID**: Ensure test IDs match what components render

5. **Race conditions**: Use waitFor to avoid flaky tests due to timing

6. **Multiple state changes**: Test each transition separately for clarity

7. **Not testing initial state**: Always verify initial state before interactions

8. **Over-specific selectors**: Use data-testid for stability, not CSS classes

## Summary

For P1.M1.T3.S2 (Test form-level evaluation), the key re-evaluation patterns are:

1. **Basic re-evaluation**: Form props update when dependencies change
2. **Bidirectional**: Re-evaluation works in both directions
3. **Multiple fields**: All watching fields update together
4. **String expressions**: Field references update in real-time
5. **Priority maintained**: Form overrides provider during re-evaluation
6. **Complex expressions**: Multi-dependency expressions evaluate correctly

Always use `waitFor` for assertions after state changes to avoid flaky tests.
