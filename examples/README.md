# Formality Examples

This directory contains comprehensive, runnable examples demonstrating every feature of the Formality form library.

## Example Index

| Example | Description | Key Features |
|---------|-------------|--------------|
| [01-basic-form](./01-basic-form.tsx) | Getting started | FormalityProvider, Form, Field, onSubmit |
| [02-input-types](./02-input-types.tsx) | Input configuration | component, valueField, parser/formatter, templates |
| [03-conditions](./03-conditions.tsx) | Conditional logic | when, is, truthy, disabled, visible, set, selectSet |
| [04-validation](./04-validation.tsx) | Validation system | sync/async validators, composition, error messages |
| [05-field-dependencies](./05-field-dependencies.tsx) | Dynamic props | selectProps, cascading selects, expressions |
| [06-auto-save](./06-auto-save.tsx) | Auto-save | autoSave, debounce, immediate submission |
| [07-advanced-features](./07-advanced-features.tsx) | Advanced features | UnusedFields, ordering, recordKey, templates |
| [08-real-world-example](./08-real-world-example.tsx) | Complete example | All features combined in a Quote form |
| [09-string-vs-function](./09-string-vs-function.tsx) | Configuration styles | String expressions vs callback functions |

---

## Quick Start

Start with `01-basic-form.tsx` to understand the fundamental building blocks:

```tsx
import { FormalityProvider, Form, Field } from '@formality-ui/react';

// 1. Define input types (reusable across your app)
const inputs = {
  textField: {
    component: ({ value, onChange, label }) => (
      <input value={value ?? ''} onChange={e => onChange(e.target.value)} />
    ),
    defaultValue: '',
  },
};

// 2. Define field configuration
const config = {
  name: { type: 'textField', label: 'Name' },
  email: { type: 'textField', label: 'Email' },
};

// 3. Render the form
function MyForm() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={config} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <Field name="name" />
            <Field name="email" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}
```

---

## Feature Deep Dives

### Conditional Logic (Example 03)

Show, hide, or disable fields based on form state:

```tsx
const config = {
  showDetails: { type: 'switch' },
  details: {
    type: 'textField',
    conditions: [
      // Hide when showDetails is false
      { when: 'showDetails', truthy: false, visible: false }
    ],
  },
};
```

### Dynamic Props (Example 05)

Compute props from other field values:

```tsx
const config = {
  country: { type: 'select' },
  state: {
    type: 'select',
    selectProps: {
      queryParams: 'country.id',  // Pass country ID to state options hook
      disabled: '!country',       // Disable until country selected
    },
  },
};
```

### Validation (Example 04)

Compose multiple validators with async support:

```tsx
const config = {
  email: {
    type: 'textField',
    validator: [
      'required',
      'email',
      async (value) => {
        const exists = await checkEmailExists(value);
        if (exists) return 'Email already registered';
        return true;
      },
    ],
  },
};
```

---

## String Expressions vs Functions (Example 09)

Most configuration options accept **both** string expressions and callback functions:

### String Expression (Auto-infers dependencies)
```tsx
{
  selectProps: {
    value: 'price * quantity',     // Auto-watches 'price' and 'quantity'
    disabled: '!client',
  },
}
```

### Callback Function (Requires subscribesTo)
```tsx
{
  subscribesTo: ['price', 'quantity'],  // REQUIRED for functions!
  selectProps: {
    value: ({ fields }) => {
      const price = fields.price?.value ?? 0;
      const qty = fields.quantity?.value ?? 0;
      return Math.round(price * qty * 100) / 100;
    },
  },
}
```

### When to Use Each

| Use Case | Recommended |
|----------|-------------|
| Simple field access | String: `'fieldName'` |
| Property access | String: `'client.id'` |
| Basic arithmetic | String: `'price * qty'` |
| Comparisons | String: `'age >= 21'` |
| Complex calculations | Function (rounding, formatting) |
| String manipulation | Function (toUpperCase, trim) |
| Business logic | Function |
| Type safety | Function (TypeScript) |
| Serializable config | String (JSON-safe) |

---

## Running Examples

These examples are designed to be copy-pasted into your React application. To run them:

1. Install dependencies:
   ```bash
   npm install @formality-ui/react react-hook-form
   ```

2. Copy an example file into your project

3. Import and render the component

For a complete working example, see `08-real-world-example.tsx` which demonstrates a full Quote form with all features integrated.

---

## Additional Resources

- [Main README](../README.md) - Package overview and quick start
- [Developer Documentation (PRD.md)](../PRD.md) - Complete technical specification
- [Core Package](../packages/core/README.md) - Framework-agnostic utilities
- [React Package](../packages/react/README.md) - React implementation details
