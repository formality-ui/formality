# @testing-library/user-event Testing Patterns

**Source**: External research by agent a9e7733 + codebase analysis

## Summary

Research on userEvent from @testing-library/user-event for React component testing, with patterns from the formality codebase.

## Key Patterns

### 1. userEvent.setup()

**Best practice: Call setup() in each test**

```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

// With options
const user = userEvent.setup({
  delay: null, // No delay for faster tests
});
```

### 2. Testing User Interactions

**Type interaction**:
```typescript
const user = userEvent.setup();
await user.type(screen.getByTestId('name'), 'hello');
```

**Click interaction**:
```typescript
const user = userEvent.setup();
await user.click(screen.getByRole('button'));
```

**Clear interaction**:
```typescript
const user = userEvent.setup();
await user.clear(screen.getByTestId('email'));
```

**Tab interaction** (for blur validation):
```typescript
const user = userEvent.setup();
await user.tab();
```

### 3. Async Testing Patterns with userEvent

**All userEvent methods return Promises - always await them**:

```typescript
// Pattern 1: waitFor for state changes
await user.type(screen.getByTestId('input'), 'value');
await waitFor(() => {
  expect(screen.getByTestId('result')).toHaveTextContent('value');
});

// Pattern 2: findBy queries (built-in waiting)
await user.click(screen.getByRole('button'));
expect(await screen.findByText('Success')).toBeInTheDocument();
```

### 4. Differences Between userEvent and fireEvent

| Feature | fireEvent | userEvent |
|---------|-----------|-----------|
| Level | Low-level DOM events | High-level user simulation |
| Async | No | Yes (returns promises) |
| Realism | Basic event dispatch | Full browser-like behavior |
| Recommendation | Use sparingly | **Default choice** |

**Example**:
```typescript
// fireEvent - only fires change event
fireEvent.change(input, { target: { value: 'hello' } });

// userEvent - simulates typing
await user.type(input, 'hello');
// Fires: focus → keydown → keypress → keyup → input → change (for each char)
```

### 5. Codebase Examples

**From Field.test.tsx:283-288**:
```typescript
it("should update selectProps when referenced field changes", async () => {
  const user = userEvent.setup();
  await user.clear(screen.getByTestId("source"));
  await user.type(screen.getByTestId("source"), "Updated");

  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveAttribute(
      "placeholder",
      "Updated",
    );
  });
});
```

**From Field.test.tsx:376-384** - Validation on blur:
```typescript
const user = userEvent.setup();
await user.type(screen.getByTestId("email"), "invalid");
await user.tab(); // Trigger blur/validation

await waitFor(() => {
  expect(screen.getByTestId("email-error")).toHaveTextContent(
    "Must be a valid email",
  );
});
```

## Best Practices

1. **Always use userEvent.setup() per test** - Creates fresh instance
2. **Always await userEvent methods** - All methods return promises
3. **Prefer userEvent over fireEvent** - More realistic behavior
4. **Test complete workflows** - Not just individual interactions
5. **Use role-based selectors** when possible (accessibility-first)

## Resources

- https://testing-library.com/docs/user-event/intro
- https://testing-library.com/docs/user-event/convenience
- Codebase: `/home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx`
- Codebase: `/home/dustin/projects/formality/packages/react/src/__tests__/Form.test.tsx`
