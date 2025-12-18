# Formality

A powerful, framework-agnostic form library for building complex, dynamic forms with conditional logic, field dependencies, and auto-save support.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [@formality/core](./packages/core) | Framework-agnostic utilities | Stable |
| [@formality/react](./packages/react) | React implementation | Stable |
| [@formality/vue](./packages/vue) | Vue implementation | Planned |
| [@formality/svelte](./packages/svelte) | Svelte implementation | Planned |

## Features

- **Declarative Configuration**: Define forms with simple configuration objects
- **Conditional Logic**: Show, hide, or disable fields based on form state
- **Field Dependencies**: Fields can depend on and react to other fields
- **Dynamic Props**: Evaluate props based on current form values
- **Auto-Save**: Debounced automatic form submission
- **Value Transformation**: Parse inputs and format displays
- **Validation**: Composable validators with async support
- **Framework Agnostic Core**: Same logic works across React, Vue, and Svelte

## Quick Start (React)

```bash
npm install @formality/react react-hook-form
```

```tsx
import { FormalityProvider, Form, Field } from '@formality/react';

const inputs = {
  textField: {
    component: ({ value, onChange, label }) => (
      <div>
        <label>{label}</label>
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      </div>
    ),
    defaultValue: '',
  },
};

const config = {
  name: { type: 'textField' },
  email: { type: 'textField' },
};

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

## Conditional Fields

```typescript
const config = {
  showDetails: { type: 'switch' },
  details: {
    type: 'textField',
    conditions: [
      { when: 'showDetails', truthy: true, visible: true },
    ],
  },
};
```

## Field Dependencies

```typescript
const config = {
  client: { type: 'autocomplete' },
  clientContact: {
    type: 'autocomplete',
    selectProps: {
      queryParams: 'client.id',
      disabled: '!client',
    },
  },
};
```

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
│   ├── core/       # Framework-agnostic utilities
│   ├── react/      # React implementation
│   ├── vue/        # Vue implementation (planned)
│   └── svelte/     # Svelte implementation (planned)
├── pnpm-workspace.yaml
└── package.json
```

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | Type check all packages |
| `pnpm lint` | Lint all packages |

## Architecture

Formality uses a layered architecture:

1. **@formality/core**: Pure functions with zero framework dependencies
   - Expression evaluation
   - Condition processing
   - Validation pipeline
   - Configuration merging
   - Label resolution

2. **@formality/react** (and future adapters): Framework-specific implementations
   - React components and hooks
   - React Hook Form integration
   - Context providers

This separation allows the same battle-tested logic to power multiple framework implementations.

### Core Concepts

#### Expression Engine

Evaluate dynamic expressions against form state:

```typescript
import { evaluate } from '@formality/core';

evaluate('client.id > 5', context);  // true/false
evaluate('!signed', context);        // boolean negation
evaluate('client && contact', context); // logical AND
```

#### Condition System

Conditions control field visibility and disabled state:

- **disabled**: OR logic (disabled if ANY condition disables)
- **visible**: AND logic (visible only if ALL conditions allow)

#### Props Pipeline

Props are merged from multiple sources:
1. Input config defaults
2. Field config
3. Form config overrides
4. Evaluated selectProps
5. Component props

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm test --filter=@formality/core
pnpm test --filter=@formality/react

# Run with coverage
pnpm test -- --coverage
```

## License

MIT
