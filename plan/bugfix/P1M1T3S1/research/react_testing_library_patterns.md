# React Testing Library Best Practices for Testing React Context

**Source**: External research by agent a3a3dfd

## Summary

Comprehensive research on testing React Context providers and context-consuming components using React Testing Library.

## Key Patterns

### 1. Testing Components that Consume React Context

```javascript
import { render, screen } from '@testing-library/react';
import { UserContext } from './UserContext';
import UserProfile from './UserProfile';

test('displays user name from context', () => {
  const userValue = { name: 'John Doe', email: 'john@example.com' };

  render(
    <UserContext.Provider value={userValue}>
      <UserProfile />
    </UserContext.Provider>
  );

  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('john@example.com')).toBeInTheDocument();
});
```

### 2. Testing Provider-Level Configurations

```javascript
test('provides default theme when no value is passed', () => {
  const TestComponent = () => {
    const { theme } = useContext(ThemeContext);
    return <div data-testid="theme">{theme}</div>;
  };

  render(
    <ThemeProvider>
      <TestComponent />
    </ThemeProvider>
  );

  expect(screen.getByTestId('theme')).toHaveTextContent('light');
});
```

### 3. Using Render with Custom Wrapper Components

Create a `test-utils.js` file:

```javascript
import { render } from '@testing-library/react';
import { ThemeProvider } from './context/ThemeContext';

const AllTheProviders = ({ children }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 4. data-testid Selector Patterns

**Naming Convention**:
```javascript
// Good: Descriptive and hierarchical
<button data-testid="login-submit-button">Submit</button>
<input data-testid="login-email-input" />
<div data-testid="user-profile-avatar" />
```

**Priority Order for Selectors**:
```javascript
// 1. Best: Accessible queries
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')

// 2. Good: Text-based queries
screen.getByText('Welcome')

// 3. Acceptable: Test ID (last resort)
screen.getByTestId('submit-button')
```

### 5. waitFor Patterns for Async State Changes

```javascript
import { render, screen, waitFor } from '@testing-library/react';

test('displays fetched user data', async () => {
  render(<UserProfile />);

  // Wait for async state update
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Resources

- Testing Library React Documentation: https://testing-library.com/docs/react-testing-library/intro/
- Testing Library Guidelines: https://testing-library.com/docs/guiding-principles/
- Async Testing: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
