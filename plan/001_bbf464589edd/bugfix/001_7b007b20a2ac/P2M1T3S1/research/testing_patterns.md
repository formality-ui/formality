# React Testing Patterns for Disabled State

## Testing Framework Stack

- **vitest** (^2.0.0) - Test runner
- **@testing-library/react** (^14.0.0) - React component testing
- **@testing-library/jest-dom** (^6.0.0) - DOM matchers
- **@testing-library/user-event** (^14.5.2) - User interaction simulation
- **jsdom** (^24.0.0) - DOM implementation

## Key Patterns from Existing Tests

### 1. Test Component Structure

```typescript
// Test input with forwardRef (required for Field components)
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}
    />
  ),
);
```

### 2. Test Inputs Configuration

```typescript
const testInputs: Record<string, InputConfig> = {
  textField: {
    component: TestInput,
    defaultValue: "",
  },
};
```

### 3. Render Wrapper Pattern

```typescript
const createWrapper = (config: FormFieldsConfig = {}, record: Record<string, unknown> = {}) => {
  return ({ children }: { children: React.ReactNode }) => (
    <FormalityProvider inputs={testInputs}>
      <Form config={config} record={record}>
        {children}
      </Form>
    </FormalityProvider>
  );
};
```

### 4. Disabled State Testing

```typescript
// Test field is disabled
expect(screen.getByTestId("field")).toBeDisabled();

// Test field is enabled
expect(screen.getByTestId("field")).not.toBeDisabled();
```

### 5. Dynamic Prop Changes

```typescript
const { rerender } = render(
  <FormalityProvider inputs={testInputs}>
    <Form config={config}>
      <Field name="field" disabled={true} />
    </Form>
  </FormalityProvider>
);

// Verify initial state
expect(screen.getByTestId("field")).toBeDisabled();

// Rerender with new prop
rerender(
  <FormalityProvider inputs={testInputs}>
    <Form config={config}>
      <Field name="field" disabled={false} />
    </Form>
  </FormalityProvider>
);

// Verify updated state
expect(screen.getByTestId("field")).not.toBeDisabled();
```

### 6. User Interaction Testing

```typescript
const user = userEvent.setup();

// Try to type in disabled field
await user.type(screen.getByTestId("disabledField"), "text");

// Verify value didn't change
expect(screen.getByTestId("disabledField")).toHaveValue("");
```

### 7. Condition-Based Testing

```typescript
// Config with conditions
const config: FormFieldsConfig = {
  toggle: { type: "switch" },
  dependent: {
    type: "textField",
    disabled: false,  // Config says enabled
    conditions: [
      { when: "toggle", truthy: true, disabled: true }  // But condition disables
    ],
  },
};

// JSX prop overrides both
<Field name="dependent" disabled={false} />  // Should be enabled
```

## Testing Best Practices

1. **Use data-testid** for reliable element selection
2. **Test user-facing behavior**, not implementation details
3. **Use waitFor** for async state updates
4. **Test both states**: disabled=true and disabled=false
5. **Test DOM attributes**: `toBeDisabled()` checks actual disabled attribute
6. **Test user interaction**: Verify disabled fields can't be interacted with
7. **Test re-rendering**: Verify prop changes update the field state

## Avoid Anti-Patterns

- ❌ Testing hook directly instead of Field component (for integration tests)
- ❌ Testing implementation instead of behavior
- ❌ Not testing dynamic prop changes
- ❌ Not testing user interaction
- ❌ Testing only one source at a time (test multiple sources simultaneously)
