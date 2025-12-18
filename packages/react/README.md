# @formality/react

React implementation of the Formality form framework. Build powerful, dynamic forms with conditional logic, field dependencies, and auto-save support.

## Installation

```bash
npm install @formality/react react-hook-form
# or
pnpm add @formality/react react-hook-form
# or
yarn add @formality/react react-hook-form
```

**Peer Dependencies:**
- `react` >= 18.0.0
- `react-dom` >= 18.0.0
- `react-hook-form` >= 7.0.0

## Quick Start

```tsx
import { FormalityProvider, Form, Field } from '@formality/react';
import type { InputConfig, FormFieldsConfig } from '@formality/react';

// Define your input types
const inputs: Record<string, InputConfig> = {
  textField: {
    component: ({ value, onChange, label, error, ...props }) => (
      <div>
        <label>{label}</label>
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} />
        {error && <span>{error}</span>}
      </div>
    ),
    defaultValue: '',
  },
  switch: {
    component: ({ value, onChange, label }) => (
      <label>
        <input type="checkbox" checked={value ?? false} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
    ),
    defaultValue: false,
  },
};

// Define your form fields
const config: FormFieldsConfig = {
  name: { type: 'textField', label: 'Full Name' },
  email: { type: 'textField', label: 'Email Address' },
  subscribed: { type: 'switch', label: 'Subscribe to newsletter' },
};

// Use in your app
function App() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={config} onSubmit={(values) => console.log(values)}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <Field name="name" />
            <Field name="email" />
            <Field name="subscribed" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}
```

## Components

### FormalityProvider

Global configuration provider. Wrap your app or form section.

```tsx
<FormalityProvider
  inputs={inputConfigs}
  validators={validatorConfigs}
  formatters={formatterConfigs}
  parsers={parserConfigs}
  errorMessages={errorMessageConfigs}
>
  {children}
</FormalityProvider>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `inputs` | `Record<string, InputConfig>` | Input component configurations |
| `validators` | `ValidatorsConfig` | Custom validators |
| `formatters` | `FormattersConfig` | Custom formatters |
| `parsers` | `ParsersConfig` | Custom parsers |
| `errorMessages` | `ErrorMessagesConfig` | Custom error messages |

### Form

Form container with React Hook Form integration.

```tsx
<Form
  config={fieldConfigs}
  formConfig={formLevelConfig}
  record={initialValues}
  onSubmit={handleSubmit}
  autoSave={false}
  debounce={1000}
>
  {({ methods, formState, unusedFields, resolvedTitle }) => (
    // Render your form
  )}
</Form>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `config` | `FormFieldsConfig` | Field configurations |
| `formConfig` | `FormConfig` | Form-level configuration |
| `record` | `Record<string, any>` | Initial values |
| `onSubmit` | `(values) => void` | Submit handler |
| `autoSave` | `boolean` | Enable auto-save |
| `debounce` | `number` | Debounce delay (ms) |

**Render API:**
| Property | Type | Description |
|----------|------|-------------|
| `methods` | `UseFormReturn` | React Hook Form methods |
| `formState` | `FormState` | Form state |
| `unusedFields` | `string[]` | Fields not yet rendered |
| `resolvedTitle` | `string` | Resolved form title |

### Field

Individual field with automatic configuration resolution.

```tsx
<Field
  name="fieldName"
  type="textField"
  disabled={false}
  hidden={false}
  label="Custom Label"
  shouldRegister={true}
>
  {({ fieldState, renderedField, fieldProps, watchers }) => (
    // Custom render
  )}
</Field>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Field name (required) |
| `type` | `string` | Override input type |
| `disabled` | `boolean` | Override disabled state |
| `hidden` | `boolean` | Hide field |
| `label` | `string` | Override label |
| `shouldRegister` | `boolean` | Register as used field |

**Render API:**
| Property | Type | Description |
|----------|------|-------------|
| `fieldState` | `FieldState` | Field state |
| `renderedField` | `ReactNode` | Rendered input component |
| `fieldProps` | `object` | Resolved field props |
| `watchers` | `object` | Watched field values |

### FieldGroup

Apply conditions to multiple fields.

```tsx
const formConfig = {
  groups: {
    signedFields: {
      conditions: [{ when: 'signed', is: true, disabled: false }],
    },
  },
};

<FieldGroup name="signedFields">
  <Field name="creditApp" />
  <Field name="inCarvin" />
</FieldGroup>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Group name (must match formConfig.groups key) |
| `children` | `ReactNode` | Child fields/content |

### UnusedFields

Render fields from config not explicitly placed.

```tsx
<Form config={config}>
  <Field name="name" />
  {/* Other fields from config rendered automatically */}
  <UnusedFields />
</Form>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `exclude` | `string[]` | Field names to exclude |

## Conditions

Add conditional logic to fields:

```typescript
const config: FormFieldsConfig = {
  signed: { type: 'switch' },
  creditApp: {
    type: 'switch',
    conditions: [
      { when: 'signed', is: false, disabled: true },
      { when: 'signed', is: true, visible: true },
    ],
  },
};
```

**Condition Properties:**
| Property | Description |
|----------|-------------|
| `when` | Field name to watch |
| `selectWhen` | Expression to evaluate |
| `is` | Exact value to match |
| `truthy` | Truthy/falsy match |
| `disabled` | Set disabled state when matched |
| `visible` | Set visibility when matched |
| `set` | Value to set when matched |
| `selectSet` | Expression for value to set |

### Condition Merging Logic

- **disabled**: OR logic (disabled if ANY group/field is disabled)
- **visible**: AND logic (visible only if ALL groups/fields are visible)

## Dynamic Props (selectProps)

Evaluate props dynamically based on form state:

```typescript
const config: FormFieldsConfig = {
  client: { type: 'autocomplete' },
  clientContact: {
    type: 'autocomplete',
    selectProps: {
      queryParams: 'client.id',
      disabled: '!client',
      placeholder: 'client.name',
    },
  },
};
```

## Auto-Save

Enable automatic form submission on changes:

```tsx
<Form
  config={config}
  autoSave
  debounce={2000}
  onSubmit={async (values) => {
    await saveToServer(values);
  }}
>
  {/* Fields */}
</Form>
```

## Hooks

### useFormContext

Access form state and methods from any child component:

```typescript
import { useFormContext } from '@formality/react';

function CustomComponent() {
  const { config, methods, record, unusedFields, submitImmediate } = useFormContext();
  // ...
}
```

### useConditions

Evaluate conditions manually:

```typescript
import { useConditions } from '@formality/react';

const { disabled, visible, setValue } = useConditions({
  conditions: fieldConfig.conditions,
});
```

### usePropsEvaluation

Evaluate dynamic props:

```typescript
import { usePropsEvaluation } from '@formality/react';

const evaluatedProps = usePropsEvaluation(selectProps, watchedValues);
```

### useFormState

Subscribe to form state changes:

```typescript
import { useFormState } from '@formality/react';

const { methods, formState } = useFormState(options);
```

### useSubscriptions

Subscribe to field value changes:

```typescript
import { useSubscriptions } from '@formality/react';

const watchedValues = useSubscriptions(fieldNames);
```

### useInferredInputs

Infer input configurations:

```typescript
import { useInferredInputs } from '@formality/react';

const inputs = useInferredInputs(config);
```

## Contexts

### ConfigContext

Global configuration context:

```typescript
import { useConfigContext } from '@formality/react';

const { inputs, validators, formatters, parsers, errorMessages } = useConfigContext();
```

### FormContext

Form-level context:

```typescript
import { useFormContext } from '@formality/react';

const { config, methods, record, formConfig, unusedFields } = useFormContext();
```

### GroupContext

Group-level context for nested conditions:

```typescript
import { useGroupContext } from '@formality/react';

const groupState = useGroupContext();
```

## TypeScript Support

All types are exported for full TypeScript support:

```typescript
import type {
  // Components
  FormalityProviderProps,
  FormProps,
  FormRenderAPI,
  FieldProps,
  FieldRenderAPI,
  FieldGroupProps,
  UnusedFieldsProps,

  // Contexts
  ConfigContextValue,
  FormContextValue,
  GroupContextValue,
  GroupState,

  // Core types (re-exported)
  InputConfig,
  FieldConfig,
  FormFieldsConfig,
  FormConfig,
  ConditionDescriptor,
  ValidationResult,
  ValidatorSpec,

  // React-specific types
  InputTemplateProps,
  CustomFieldState,
  ExtendedFormState,
  UseFormStateOptions,
  WatcherSetterFn,
  DebouncedFunction,
} from '@formality/react';
```

## Utilities

### makeProxyState

Create proxy state for efficient subscriptions:

```typescript
import { makeProxyState, makeDeepProxyState } from '@formality/react';

const proxy = makeProxyState(initialState);
const deepProxy = makeDeepProxyState(initialState);
```

## License

MIT
