# React Testing Library Best Practices Research

Research compiled on 2025-01-13 for testing form interactions, disabled states, and async updates with React Testing Library (RTL).

## Table of Contents

1. [Official RTL Documentation](#official-rtl-documentation)
2. [Testing Disabled Attributes](#testing-disabled-attributes)
3. [Testing Form Interactions with Multiple Fields](#testing-form-interactions-with-multiple-fields)
4. [Testing Async State Updates](#testing-async-state-updates)
5. [Testing Conditional Rendering Based on Field States](#testing-conditional-rendering-based-on-field-states)

---

## Official RTL Documentation

### 1. userEvent Documentation

**URL**: https://testing-library.com/docs/user-event/intro

**Key Concepts**:
- `userEvent` simulates real user interactions (more realistic than `fireEvent`)
- Always use `userEvent.setup()` to create a user instance
- All userEvent methods are asynchronous - use `await`

**Best Practices**:

```javascript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('user interaction with form', async () => {
  const user = userEvent.setup()
  render(<MyForm />)

  // Type in input
  await user.type(screen.getByLabelText('Email'), 'user@example.com')

  // Click button
  await user.click(screen.getByRole('button', { name: 'Submit' }))

  // Clear input
  await user.clear(screen.getByLabelText('Email'))

  // Select options
  await user.selectOptions(
    screen.getByRole('combobox'),
    'option-value'
  )
})
```

**Key Methods**:
- `await user.click(element)` - Click on element
- `await user.type(element, text)` - Type text in input
- `await user.clear(element)` - Clear input value
- `await user.selectOptions(element, value)` - Select dropdown option
- `await user.dblClick(element)` - Double click
- `await user.hover(element)` - Hover over element
- `await user.unhover(element)` - Move mouse away
- `await user.tab()` - Tab to next element

**Common Pitfalls**:
- ❌ Forgetting `await` before userEvent methods
- ❌ Using `fireEvent` instead of `userEvent` (fireEvent doesn't dispatch real events)
- ❌ Not calling `userEvent.setup()` (required in v14+)
- ❌ Chaining actions without awaiting each one

**Version Notes**:
- Version 14+ requires `userEvent.setup()`
- Version 14+ all methods are async
- Always use the latest version for better browser simulation

---

### 2. waitFor Documentation

**URL**: https://testing-library.com/docs/dom-testing-library/api-async

**Key Concepts**:
- `waitFor` waits for a condition to be met
- Built-in retry mechanism with timeout
- Prefer `findBy*` queries over `waitFor` when possible

**Best Practices**:

```javascript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('async state updates', async () => {
  const user = userEvent.setup()
  render(<MyForm />)

  await user.click(screen.getByRole('button', { name: 'Load' }))

  // Wait for element to appear
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })

  // Wait for multiple assertions
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument()
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
  })

  // Wait with custom timeout
  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument()
  }, { timeout: 5000 })
})
```

**Prefer findBy* Queries**:

```javascript
// BETTER - Use findBy* for waiting for elements
const button = await screen.findByRole('button', { name: 'Submit' })

// AVOID - Using waitFor for simple queries
await waitFor(() => {
  expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
})
```

**Common Pitfalls**:
- ❌ Using `waitFor` when `findBy*` query would suffice
- ❌ Setting timeout too low (default is 1000ms)
- ❌ Using `waitFor` to wait for time (use fake timers instead)
- ❌ Not awaiting `waitFor` (it returns a Promise)

**When to Use waitFor**:
- ✅ Multiple assertions that need to pass together
- ✅ Complex conditions that can't be expressed as a single query
- ✅ Non-DOM async operations (API calls, timers)
- ✅ Waiting for element disappearance with `queryBy*`

---

### 3. Query Documentation

**URL**: https://testing-library.com/docs/dom-testing-library/api-queries

**Priority Order for Queries**:

1. **Accessible queries** (recommended):
   - `getByRole()` - Best for semantic elements
   - `getByLabelText()` - Best for form fields
   - `getByPlaceholderText()` - Good for form fields without labels
   - `getByText()` - Good for non-interactive elements
   - `getByDisplayValue()` - Good for form fields with values

2. **Test ID queries** (last resort):
   - `getByTestId()` - Use only when no accessible alternative

**Query Variants**:

```javascript
// getBy* - Throws if not found (default)
const button = screen.getByRole('button')

// queryBy* - Returns null if not found (for absence checks)
const modal = screen.queryByRole('dialog')
expect(modal).toBeNull()

// findBy* - Async, waits for element to appear
const button = await screen.findByRole('button')

// findAllBy* - Async, waits for multiple elements
const items = await screen.findAllByRole('listitem')
```

**Best Practices**:

```javascript
// GOOD - Use accessible queries
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email Address')
screen.getByText('Error message')

// AVOID - Test IDs when accessible queries work
screen.getByTestId('submit-button')
screen.getByTestId('email-input')
```

**Common Pitfalls**:
- ❌ Over-reliance on `getByTestId()` (tests implementation, not user experience)
- ❌ Using `getByText()` for interactive elements (use `getByRole()` instead)
- ❌ Not using accessible name options (e.g., `{ name: 'Submit' }`)
- ❌ Forgetting to use `queryBy*` for checking element absence

---

## Testing Disabled Attributes

### Best Practices

**URL Reference**: https://testing-library.com/docs/dom-testing-library/api-queries#disabled

**Using Jest DOM Matchers** (recommended):

```javascript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Install: @testing-library/jest-dom
test('disabled field', () => {
  render(<Form />)
  const input = screen.getByLabelText('Email')

  // Check if disabled
  expect(input).toBeDisabled()

  // Check if enabled
  expect(input).toBeEnabled()
})
```

**Direct Attribute Check**:

```javascript
test('disabled attribute check', () => {
  render(<Form />)
  const input = screen.getByLabelText('Email')

  // Check disabled attribute
  expect(input).toHaveAttribute('disabled')

  // Check with exact value
  expect(input).toHaveAttribute('disabled', '')
})
```

**Testing Disabled State Changes**:

```javascript
test('field becomes disabled after interaction', async () => {
  const user = userEvent.setup()
  render(<Form />)

  const checkbox = screen.getByLabelText('Disable Email')
  const emailInput = screen.getByLabelText('Email')

  // Initially enabled
  expect(emailInput).toBeEnabled()

  // Click checkbox to disable
  await user.click(checkbox)

  // Now disabled
  expect(emailInput).toBeDisabled()
})
```

**Priority-Based Disabled Testing** (from codebase patterns):

```javascript
test('disabled priority: JSX prop > config > conditions > group', async () => {
  const user = userEvent.setup()
  const config = {
    field: {
      type: 'textField',
      disabled: false, // Config says enabled
      conditions: [
        { when: 'otherField', is: 'match', disabled: true }
      ]
    }
  }

  render(
    <Form config={config} record={{ otherField: 'match' }}>
      <Field name="otherField" />
      <Field name="field" disabled={true} /> {/* JSX forces disabled */}
    </Form>
  )

  // JSX prop (true) overrides config (false) + conditions (true)
  expect(screen.getByTestId('field')).toBeDisabled()
})
```

**Common Pitfalls**:
- ❌ Testing `disabled` attribute on non-form elements (won't work)
- ❌ Using `toHaveClass('disabled')` instead of `toBeDisabled()`
- ❌ Forgetting to test enabled state as well
- ❌ Not testing disabled state prevents user interaction

**Complete Disabled Test Pattern**:

```javascript
test('comprehensive disabled state testing', async () => {
  const user = userEvent.setup()
  render(<Form />)

  const input = screen.getByLabelText('Email')
  const toggle = screen.getByLabelText('Disable Email')

  // Test enabled state
  expect(input).toBeEnabled()

  // User can type when enabled
  await user.type(input, 'test@example.com')
  expect(input).toHaveValue('test@example.com')

  // Disable field
  await user.click(toggle)
  expect(input).toBeDisabled()

  // User cannot type when disabled
  await user.clear(input)
  await user.type(input, 'new@example.com')
  expect(input).toHaveValue('test@example.com') // Value unchanged
})
```

---

## Testing Form Interactions with Multiple Fields

### Best Practices

**URL Reference**: https://testing-library.com/docs/guide-disappearance

**Multi-Field Form Test Pattern**:

```javascript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('complete form workflow', async () => {
  const user = userEvent.setup()
  const handleSubmit = vi.fn()

  render(<RegistrationForm onSubmit={handleSubmit} />)

  // Fill out multiple fields
  await user.type(screen.getByLabelText('Name'), 'John Doe')
  await user.type(screen.getByLabelText('Email'), 'john@example.com')
  await user.type(screen.getByLabelText('Password'), 'securepass123')
  await user.click(screen.getByLabelText('Agree to Terms'))

  // Submit form
  await user.click(screen.getByRole('button', { name: 'Register' }))

  // Verify submission
  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securepass123',
      agreedToTerms: true
    })
  })
})
```

**Field Dependency Testing**:

```javascript
test('conditional field based on multiple fields', async () => {
  const user = userEvent.setup()
  render(<Form />)

  const countrySelect = screen.getByLabelText('Country')
  const stateInput = screen.getByLabelText('State')
  const zipInput = screen.getByLabelText('ZIP Code')

  // State/ZIP initially disabled
  expect(stateInput).toBeDisabled()
  expect(zipInput).toBeDisabled()

  // Select country
  await user.selectOptions(countrySelect, 'USA')

  // State/ZIP now enabled
  expect(stateInput).toBeEnabled()
  expect(zipInput).toBeEnabled()

  // Fill them out
  await user.type(stateInput, 'California')
  await user.type(zipInput, '90210')

  // Verify values
  expect(stateInput).toHaveValue('California')
  expect(zipInput).toHaveValue('90210')
})
```

**Multi-Field Validation Testing**:

```javascript
test('cross-field validation', async () => {
  const user = userEvent.setup()
  render(<Form />)

  const password = screen.getByLabelText('Password')
  const confirmPassword = screen.getByLabelText('Confirm Password')
  const submitButton = screen.getByRole('button', { name: 'Submit' })

  // Type mismatched passwords
  await user.type(password, 'password123')
  await user.type(confirmPassword, 'password456')
  await user.tab() // Trigger validation

  // Should show error
  expect(screen.getByText('Passwords do not match')).toBeInTheDocument()

  // Fix mismatch
  await user.clear(confirmPassword)
  await user.type(confirmPassword, 'password123')
  await user.tab()

  // Error should clear
  await waitFor(() => {
    expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument()
  })
})
```

**Priority-Based Multi-Field Testing** (from codebase):

```javascript
test('multi-field when condition with AND logic', () => {
  const config = {
    field1: { type: 'textField' },
    field2: { type: 'textField' },
    target: {
      type: 'textField',
      conditions: [
        {
          when: {
            field1: { is: 'value1' },
            field2: { is: 'value2' }
          },
          disabled: true
        }
      ]
    }
  }

  render(<Form config={config} record={{ field1: 'value1', field2: 'value2' }}>
    <Field name="field1" />
    <Field name="field2" />
    <Field name="target" />
  </Form>)

  // Both fields match - target is disabled
  expect(screen.getByTestId('target')).toBeDisabled()
})
```

**Common Pitfalls**:
- ❌ Not clearing inputs before typing new values
- ❌ Forgetting to use `await` with userEvent
- ❌ Testing individual fields in isolation (misses cross-field bugs)
- ❌ Not testing both valid and invalid field combinations
- ❌ Using `getByTestId()` instead of accessible queries for form fields

**Best Practice Checklist**:
- ✅ Use `getByLabelText()` for form fields
- ✅ Use `getByRole()` for buttons and interactive elements
- ✅ Test complete user workflows, not individual fields
- ✅ Test cross-field validation and dependencies
- ✅ Test disabled states prevent user interaction
- ✅ Verify form submission with correct data
- ✅ Test both valid and invalid input scenarios

---

## Testing Async State Updates

### Best Practices

**URL Reference**: https://testing-library.com/docs/dom-testing-library/api-async

**Loading States**:

```javascript
test('async data loading', async () => {
  const mockFetch = vi.fn(() =>
    Promise.resolve({ data: 'loaded data' })
  )

  render(<DataFetcher fetch={mockFetch} />)

  // Show loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('loaded data')).toBeInTheDocument()
  })

  // Loading state gone
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
})
```

**Use findBy* for Async Elements**:

```javascript
test('use findBy for async appearance', async () => {
  render(<AsyncComponent />)

  // findBy waits automatically
  const successMessage = await screen.findByText('Success')
  expect(successMessage).toBeInTheDocument()
})
```

**Form Autosave Testing**:

```javascript
test('autosave after field changes', async () => {
  const user = userEvent.setup()
  const autosaveMock = vi.fn()

  render(<Form onAutosave={autosaveMock} />)

  const input = screen.getByLabelText('Name')

  // Type in field
  await user.type(input, 'John')

  // Wait for debounce and autosave
  await waitFor(() => {
    expect(autosaveMock).toHaveBeenCalledWith({ name: 'John' })
  }, { timeout: 2000 })
})
```

**Async Validation Testing**:

```javascript
test('async field validation', async () => {
  const user = userEvent.setup()
  const validateEmail = vi.fn((email) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(email.includes('@') ? true : 'Invalid email')
      }, 100)
    })
  )

  render(<Form validateEmail={validateEmail} />)

  const email = screen.getByLabelText('Email')

  // Type invalid email
  await user.type(email, 'invalid')
  await user.tab() // Trigger validation

  // Wait for async validation
  await waitFor(() => {
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })

  // Fix email
  await user.clear(email)
  await user.type(email, 'valid@example.com')
  await user.tab()

  // Error clears
  await waitFor(() => {
    expect(screen.queryByText('Invalid email')).not.toBeInTheDocument()
  })
})
```

**Reactive Updates Testing** (from codebase patterns):

```javascript
test('selectProps re-evaluates on dependency change', async () => {
  const user = userEvent.setup()
  const config = {
    source: { type: 'textField' },
    target: {
      type: 'textField',
      selectProps: { placeholder: 'source' }
    }
  }

  render(<Form config={config} record={{ source: 'Initial' }}>
    <Field name="source" />
    <Field name="target" />
  </Form>)

  // Initial placeholder
  expect(screen.getByTestId('target')).toHaveAttribute(
    'placeholder',
    'Initial'
  )

  // Change source field
  await user.clear(screen.getByTestId('source'))
  await user.type(screen.getByTestId('source'), 'Updated')

  // Placeholder updates
  await waitFor(() => {
    expect(screen.getByTestId('target')).toHaveAttribute(
      'placeholder',
      'Updated'
    )
  })
})
```

**Common Pitfalls**:
- ❌ Using `waitFor` with timeout too low
- ❌ Using `sleep()` instead of waiting for specific conditions
- ❌ Not testing loading/error states
- ❌ Forgetting to await async operations
- ❌ Using `getBy*` instead of `findBy*` for async elements
- ❌ Not handling promise rejections in error states

**Async Testing Best Practices**:
- ✅ Prefer `findBy*` queries for waiting for elements
- ✅ Use `waitFor` for complex conditions or multiple assertions
- ✅ Test loading, error, and success states
- ✅ Use reasonable timeouts (default 1000ms, adjust as needed)
- ✅ Avoid `setTimeout()` and `sleep()` - wait for actual conditions
- ✅ Test debounced operations with appropriate timeouts
- ✅ Mock async operations for predictable testing

---

## Testing Conditional Rendering Based on Field States

### Best Practices

**URL Reference**: https://testing-library.com/docs/guide-disappearance

**Element Presence/Absence Testing**:

```javascript
test('conditional rendering based on field state', async () => {
  const user = userEvent.setup()
  render(<Form />)

  const checkbox = screen.getByLabelText('Show Details')

  // Details initially hidden
  expect(screen.queryByText('Details')).not.toBeInTheDocument()

  // Check checkbox
  await user.click(checkbox)

  // Details now visible
  expect(screen.getByText('Details')).toBeInTheDocument()

  // Uncheck
  await user.click(checkbox)

  // Details hidden again
  await waitFor(() => {
    expect(screen.queryByText('Details')).not.toBeInTheDocument()
  })
})
```

**Field State Matchers Testing**:

```javascript
test('condition based on field disabled state', () => {
  const config = {
    source: {
      type: 'textField',
      disabled: true
    },
    target: {
      type: 'textField',
      conditions: [
        { when: 'source', isDisabled: true, disabled: true }
      ]
    }
  }

  render(<Form config={config}>
    <Field name="source" />
    <Field name="target" />
  </Form>)

  // Source is disabled
  expect(screen.getByTestId('source')).toBeDisabled()

  // Target is disabled because source is disabled
  expect(screen.getByTestId('target')).toBeDisabled()
})
```

**Multi-Field Condition Testing**:

```javascript
test('conditional based on multiple field values', () => {
  const config = {
    country: { type: 'textField' },
    state: { type: 'textField' },
    zipCode: {
      type: 'textField',
      conditions: [
        {
          when: {
            country: { is: 'USA' },
            state: { truthy: true }
          },
          required: true
        }
      ]
    }
  }

  render(<Form config={config} record={{ country: 'USA', state: 'CA' }}>
    <Field name="country" />
    <Field name="state" />
    <Field name="zipCode" />
  </Form>)

  // ZIP Code field should be required when country=USA and state is set
  const zipInput = screen.getByLabelText('ZIP Code')
  expect(zipInput).toBeRequired()
})
```

**Visible Condition Testing** (from codebase):

```javascript
test('field visibility based on condition', () => {
  const config = {
    toggle: { type: 'textField' },
    conditional: {
      type: 'textField',
      conditions: [
        { when: 'toggle', is: 'no', visible: false }
      ]
    }
  }

  render(<Form config={config} record={{ toggle: 'yes' }}>
    <Field name="toggle" />
    <Field name="conditional" />
  </Form>)

  // Field should be visible (toggle is 'yes', condition doesn't match)
  expect(screen.getByTestId('conditional')).toBeInTheDocument()
})
```

**Dynamic Condition Re-evaluation** (from codebase):

```javascript
test('condition re-evaluates when dependency changes', async () => {
  const user = userEvent.setup()
  const config = {
    otherField: { type: 'textField' },
    field: {
      type: 'textField',
      conditions: [
        { when: 'otherField', is: 'disable', disabled: true }
      ]
    }
  }

  render(<Form config={config} record={{ otherField: 'enable' }}>
    <Field name="otherField" />
    <Field name="field" />
  </Form>)

  // Initially enabled
  expect(screen.getByTestId('field')).not.toBeDisabled()

  // Change otherField to "disable"
  await user.clear(screen.getByTestId('otherField'))
  await user.type(screen.getByTestId('otherField'), 'disable')

  // Condition re-evaluates, field becomes disabled
  await waitFor(() => {
    expect(screen.getByTestId('field')).toBeDisabled()
  })
})
```

**Priority-Based Conditional Testing** (from codebase):

```javascript
test('conditional disabled priority: prop > config > conditions > group', () => {
  const config = {
    otherField: { type: 'textField' },
    field: {
      type: 'textField',
      disabled: false, // Config says enabled
      conditions: [
        { when: 'otherField', is: 'match', disabled: true }
      ]
    }
  }

  // Test 1: JSX prop overrides all
  const { rerender } = render(
    <Form config={config} record={{ otherField: 'match' }}>
      <Field name="field" disabled={false} />
    </Form>
  )
  expect(screen.getByTestId('field')).not.toBeDisabled()

  // Test 2: Config overrides conditions
  rerender(
    <Form config={config} record={{ otherField: 'match' }}>
      <Field name="field" />
    </Form>
  )
  expect(screen.getByTestId('field')).not.toBeDisabled()
})
```

**Common Pitfalls**:
- ❌ Using `getBy*` for elements that might not exist (use `queryBy*`)
- ❌ Not testing both true and false conditions
- ❌ Forgetting to test condition re-evaluation
- ❌ Not testing priority order when multiple conditions apply
- ❌ Testing implementation details instead of user-visible behavior

**Conditional Rendering Best Practices**:
- ✅ Use `queryBy*` for checking element absence
- ✅ Use `getBy*` for checking element presence
- ✅ Test both condition states (true/false)
- ✅ Test condition re-evaluation when dependencies change
- ✅ Test priority order when multiple sources affect the same property
- ✅ Use `waitFor` for async condition updates
- ✅ Test user-visible behavior, not internal state

---

## Summary of Key Patterns

### 1. Test Structure Pattern

```javascript
test('descriptive test name', async () => {
  // Arrange
  const user = userEvent.setup()
  render(<Component />)

  // Act
  await user.click(screen.getByRole('button'))

  // Assert
  await waitFor(() => {
    expect(screen.getByText('Result')).toBeInTheDocument()
  })
})
```

### 2. Disabled State Pattern

```javascript
// Check disabled
expect(element).toBeDisabled()

// Check enabled
expect(element).toBeEnabled()

// Test interaction prevention
await user.type(disabledInput, 'text')
expect(disabledInput).toHaveValue('') // No change
```

### 3. Multi-Field Form Pattern

```javascript
await user.type(screen.getByLabelText('Field 1'), 'value1')
await user.type(screen.getByLabelText('Field 2'), 'value2')
await user.click(screen.getByRole('button', { name: 'Submit' }))

await waitFor(() => {
  expect(submitMock).toHaveBeenCalledWith({
    field1: 'value1',
    field2: 'value2'
  })
})
```

### 4. Async Update Pattern

```javascript
// Trigger async action
await user.click(screen.getByRole('button'))

// Wait for result
const result = await screen.findByText('Success')
expect(result).toBeInTheDocument()
```

### 5. Conditional Rendering Pattern

```javascript
// Check absence
expect(screen.queryByText('Conditional')).not.toBeInTheDocument()

// Trigger condition
await user.click(screen.getByRole('checkbox'))

// Check presence
expect(screen.getByText('Conditional')).toBeInTheDocument()
```

---

## URLs Reference

### Official Documentation

1. **userEvent Introduction**: https://testing-library.com/docs/user-event/intro
2. **userEvent API**: https://testing-library.com/docs/user-event/api
3. **Async API**: https://testing-library.com/docs/dom-testing-library/api-async
4. **Queries**: https://testing-library.com/docs/dom-testing-library/api-queries
5. **Disappearance Guide**: https://testing-library.com/docs/guide-disappearance

### Community Resources

1. **Common Mistakes**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
2. **Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
3. **Jest DOM Matchers**: https://github.com/testing-library/jest-dom
4. **Testing Playground**: https://testing-playground.com/

### Package Documentation

1. **@testing-library/react**: https://testing-library.com/react
2. **@testing-library/user-event**: https://testing-library.com/docs/user-event/intro
3. **@testing-library/jest-dom**: https://github.com/testing-library/jest-dom

---

## Installation Checklist

```bash
# Core packages
npm install --save-dev @testing-library/react
npm install --save-dev @testing-library/user-event
npm install --save-dev @testing-library/jest-dom
npm install --save-dev vitest  # or jest

# For Next.js
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

---

## Quick Reference

### User Actions
```javascript
await user.click(element)
await user.type(element, 'text')
await user.clear(element)
await user.selectOptions(element, 'value')
await user.tab()
```

### Queries
```javascript
screen.getByRole('button', { name: 'Text' })
screen.getByLabelText('Label text')
screen.getByText('Text content')
screen.queryByText('Text') // Returns null if not found
await screen.findByText('Text') // Async, waits
```

### Assertions
```javascript
expect(element).toBeDisabled()
expect(element).toBeEnabled()
expect(element).toHaveAttribute('disabled')
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()
```

### Async
```javascript
await waitFor(() => {
  expect(screen.getByText('Done')).toBeInTheDocument()
})

const element = await screen.findByText('Async')
```
