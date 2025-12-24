# Formality

A powerful, framework-agnostic form library for building complex, dynamic forms with conditional logic, field dependencies, and auto-save support.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [@formality-ui/core](./packages/core) | Framework-agnostic utilities | Stable |
| [@formality-ui/react](./packages/react) | React implementation | Stable |
| [@formality-ui/vue](./packages/vue) | Vue implementation | Planned |
| [@formality-ui/svelte](./packages/svelte) | Svelte implementation | Planned |

## Documentation

| Resource | Description |
|----------|-------------|
| [Examples](./examples) | Comprehensive runnable examples |
| [Developer Docs (PRD.md)](./PRD.md) | Complete technical specification |
| [Development Guide](./DEVELOPMENT.md) | Contributing and development setup |

---

## Features

- **Declarative Configuration**: Define forms with simple configuration objects
- **Conditional Logic**: Show, hide, disable, or set field values based on form state
- **Field Dependencies**: Fields automatically react to changes in other fields
- **Dynamic Props**: Evaluate props using string expressions or callback functions
- **Auto-Save**: Debounced automatic form submission
- **Value Transformation**: Parse inputs and format displays with custom pipelines
- **Validation**: Composable validators with async support
- **Framework Agnostic Core**: Same logic works across React, Vue, and Svelte

---

## Quick Start (React)

```bash
npm install @formality-ui/react react-hook-form
```

```tsx
import { FormalityProvider, Form, Field } from '@formality-ui/react';

// 1. Define input types (reusable across your app)
const inputs = {
  textField: {
    component: ({ value, onChange, label, error }) => (
      <div>
        <label>{label}</label>
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        {error && <span className="error">{error}</span>}
      </div>
    ),
    defaultValue: '',
  },
  switch: {
    component: ({ checked, onChange, label }) => (
      <label>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
    ),
    defaultValue: false,
    inputFieldProp: 'checked',
  },
};

// 2. Define field configuration
const config = {
  name: { type: 'textField', label: 'Full Name' },
  email: { type: 'textField', label: 'Email Address' },
  subscribe: { type: 'switch', label: 'Subscribe to newsletter' },
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
            <Field name="subscribe" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}
```

---

## Conditional Fields

Control field visibility, disabled state, and values based on other fields:

```typescript
const config = {
  showDetails: { type: 'switch', label: 'Show Details' },

  details: {
    type: 'textField',
    label: 'Additional Details',
    conditions: [
      // Hide when showDetails is false
      { when: 'showDetails', truthy: false, visible: false },
    ],
  },

  status: {
    type: 'select',
    label: 'Status',
    conditions: [
      // Disable when not signed
      { when: 'signed', is: false, disabled: true },
      // Auto-set value when condition is met
      { when: 'priority', is: 'urgent', set: 'expedited' },
    ],
  },
};
```

### Condition Options

| Property | Description |
|----------|-------------|
| `when` | Field name to watch |
| `selectWhen` | Expression to evaluate (for complex conditions) |
| `is` | Exact value to match |
| `truthy` | Check if value is truthy (`true`) or falsy (`false`) |
| `disabled` | Set disabled state when condition matches |
| `visible` | Set visibility when condition matches |
| `set` | Set static value when condition matches |
| `selectSet` | Set dynamic value from expression or function |

---

## Field Dependencies

Fields can dynamically compute props based on other fields:

```typescript
const config = {
  country: {
    type: 'select',
    props: { useOptions: useCountries },
  },

  state: {
    type: 'select',
    props: { useOptions: useStates },
    selectProps: {
      // Pass country ID to state options hook
      queryParams: 'country.id',
      // Disable until country is selected
      disabled: '!country',
    },
  },

  city: {
    type: 'select',
    props: { useOptions: useCities },
    selectProps: {
      queryParams: 'state.id',
      disabled: '!state',
    },
  },
};
```

---

## String Expressions vs Callback Functions

Most configuration options accept **both** string expressions and callback functions:

### String Expressions (Recommended for Simple Cases)
```typescript
// Auto-infers dependencies - no subscribesTo needed
selectProps: {
  value: 'price * quantity',
  disabled: '!client',
  queryParams: 'client.id',
}
```

### Callback Functions (For Complex Logic)
```typescript
// MUST declare subscribesTo explicitly
subscribesTo: ['price', 'quantity', 'discount'],
selectProps: {
  value: ({ fields }) => {
    const price = fields.price?.value ?? 0;
    const qty = fields.quantity?.value ?? 0;
    const discount = fields.discount?.value ?? 0;

    // Complex logic with rounding
    return Math.round(price * qty * (1 - discount / 100) * 100) / 100;
  },
}
```

### When to Use Each

| Use Case | Recommended Approach |
|----------|---------------------|
| Simple field access | String: `'fieldName'` |
| Property access | String: `'client.id'` |
| Basic arithmetic | String: `'price * quantity'` |
| Comparisons | String: `'age >= 21 && hasLicense'` |
| Complex calculations | Function (for rounding, formatting) |
| String manipulation | Function (toUpperCase, trim, etc.) |
| Business logic | Function |
| TypeScript type safety | Function |

---

## Validation

Compose multiple validators with async support:

```typescript
// Define validators in provider config
const validators = {
  required: (value) => {
    if (!value) return { type: 'required' };
    return true;
  },
  email: (value) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format';
    }
    return true;
  },
  // Parameterized validator factory
  minLength: (min) => (value) => {
    if (value?.length < min) return `Must be at least ${min} characters`;
    return true;
  },
};

// Use in field config
const config = {
  email: {
    type: 'textField',
    validator: ['required', 'email'], // Compose multiple validators
  },
  password: {
    type: 'passwordField',
    validator: [
      'required',
      validators.minLength(8),
      // Async validator
      async (value) => {
        const isCommon = await checkCommonPassword(value);
        if (isCommon) return 'Password is too common';
        return true;
      },
    ],
  },
};
```

---

## Auto-Save

Enable automatic form submission with debouncing:

```typescript
<Form
  config={config}
  onSubmit={handleSubmit}
  autoSave={true}    // Enable auto-save
  debounce={2000}    // Wait 2s after changes before saving
>
  {/* fields */}
</Form>

// Input-level debounce control
const inputs = {
  textField: {
    component: TextField,
    debounce: 1000,  // Wait 1s for text inputs
  },
  switch: {
    component: Switch,
    debounce: false, // Save immediately on toggle
  },
};
```

---

## Field Groups

Apply conditions to multiple fields at once:

```typescript
// Form config
const formConfig = {
  groups: {
    businessFields: {
      conditions: [
        { when: 'accountType', is: 'personal', visible: false },
      ],
    },
  },
};

// Usage in JSX
<Form config={fieldConfig} formConfig={formConfig}>
  <Field name="accountType" />

  <FieldGroup name="businessFields">
    <Field name="companyName" />
    <Field name="taxId" />
    <Field name="companySize" />
  </FieldGroup>
</Form>
```

---

## Value Transformation

Transform values between user input and form state:

```typescript
const inputs = {
  currency: {
    component: CurrencyInput,
    defaultValue: null,
    // Parse: User types "1,234.56" → Form stores 1234.56
    parser: (value) => {
      const cleaned = String(value).replace(/[,$]/g, '');
      return parseFloat(cleaned) || null;
    },
    // Format: Form has 1234.56 → Display shows "1,234.56"
    formatter: (value) => {
      if (value == null) return '';
      return new Intl.NumberFormat('en-US').format(value);
    },
  },

  autocomplete: {
    component: Autocomplete,
    defaultValue: null,
    valueField: 'id',                        // Extract 'id' for submission
    getSubmitField: (name) => `${name}Id`,   // "client" → "clientId"
  },
};
```

---

## Architecture

Formality uses a layered architecture:

```
┌─────────────────────────────────────────────┐
│          FormalityProvider (Global)         │
│  • Input type definitions                   │
│  • Formatters/Parsers                       │
│  • Validators & Error messages              │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│              Form (Instance)                │
│  • React Hook Form integration              │
│  • Field registry & subscriptions           │
│  • Condition evaluation                     │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│             Field (Component)               │
│  • Props resolution & evaluation            │
│  • Value transformation                     │
│  • Condition application                    │
└─────────────────────────────────────────────┘
```

### Core Concepts

#### Expression Engine

Evaluate dynamic expressions against form state:

```typescript
// Unqualified paths auto-resolve to field values
'client'              → fields.client.value
'client.id'           → fields.client.value.id

// Qualified paths for specific access
'fields.client.isTouched'  → field metadata
'record.originalValue'     → original record data
'props.name'               → current field name
```

#### Condition System

- **disabled**: OR logic (disabled if ANY condition disables)
- **visible**: AND logic (visible only if ALL conditions allow)
- **set/selectSet**: Last matching condition wins

---

## Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/formality.git
cd formality

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

### Project Structure

```
formality/
├── packages/
│   ├── core/        # Framework-agnostic utilities
│   └── react/       # React implementation
├── examples/        # Comprehensive examples
├── PRD.md           # Developer documentation
└── package.json
```

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | Type check all packages |
| `pnpm lint` | Lint all packages |

---

## Examples

See the [examples directory](./examples) for comprehensive, runnable examples:

| Example | Description |
|---------|-------------|
| [01-basic-form](./examples/01-basic-form.tsx) | Getting started with Form, Field, Provider |
| [02-input-types](./examples/02-input-types.tsx) | Input configuration options |
| [03-conditions](./examples/03-conditions.tsx) | Conditional logic |
| [04-validation](./examples/04-validation.tsx) | Validation system |
| [05-field-dependencies](./examples/05-field-dependencies.tsx) | Dynamic props and cascading |
| [06-auto-save](./examples/06-auto-save.tsx) | Auto-save configuration |
| [07-advanced-features](./examples/07-advanced-features.tsx) | UnusedFields, ordering, templates |
| [08-real-world-example](./examples/08-real-world-example.tsx) | Complete Quote form |
| [09-string-vs-function](./examples/09-string-vs-function.tsx) | Expression vs callback comparison |

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm test --filter=@formality-ui/core
pnpm test --filter=@formality-ui/react

# Run with coverage
pnpm test -- --coverage
```

---

## Support

If Formality helps you build something great, consider fueling future development:

<a href="https://buymeacoffee.com/dustindsch2" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50"></a>

## License

MIT
