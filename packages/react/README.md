# @formality-ui/react

React implementation of the Formality form framework. Build powerful, dynamic forms with conditional logic, field dependencies, and auto-save support.

## Installation

```bash
npm install @formality-ui/react react-hook-form
# or
pnpm add @formality-ui/react react-hook-form
# or
yarn add @formality-ui/react react-hook-form
```

**Peer Dependencies:**

- `react` >= 18.0.0
- `react-dom` >= 18.0.0
- `react-hook-form` >= 7.0.0

## Quick Start

```tsx
import { FormalityProvider, Form, Field } from "@formality-ui/react";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/react";

// Define your input types
const inputs: Record<string, InputConfig> = {
  textField: {
    component: ({ value, onChange, label, error, ...props }) => (
      <div>
        <label>{label}</label>
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
        {error && <span>{error}</span>}
      </div>
    ),
    defaultValue: "",
  },
  switch: {
    component: ({ value, onChange, label }) => (
      <label>
        <input
          type="checkbox"
          checked={value ?? false}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    ),
    defaultValue: false,
  },
};

// Define your form fields
const config: FormFieldsConfig = {
  name: { type: "textField", label: "Full Name" },
  email: { type: "textField", label: "Email Address" },
  subscribed: { type: "switch", label: "Subscribe to newsletter" },
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
      conditions: [{ when: "signed", is: true, disabled: false }],
    },
  },
};

<FieldGroup name="signedFields">
  <Field name="creditApp" />
  <Field name="inCarvin" />
</FieldGroup>;
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
  signed: { type: "switch" },
  creditApp: {
    type: "switch",
    conditions: [
      { when: "signed", is: false, disabled: true },
      { when: "signed", is: true, visible: true },
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
  client: { type: "autocomplete" },
  clientContact: {
    type: "autocomplete",
    selectProps: {
      queryParams: "client.id",
      disabled: "!client",
      placeholder: "client.name",
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
import { useFormContext } from "@formality-ui/react";

function CustomComponent() {
  const { config, methods, record, unusedFields, submitImmediate } =
    useFormContext();
  // ...
}
```

### useConditions

Evaluate conditions manually:

```typescript
import { useConditions } from "@formality-ui/react";

const { disabled, visible, setValue } = useConditions({
  conditions: fieldConfig.conditions,
});
```

### usePropsEvaluation

Evaluate dynamic props:

```typescript
import { usePropsEvaluation } from "@formality-ui/react";

const evaluatedProps = usePropsEvaluation(selectProps, watchedValues);
```

### useFormState

Subscribe to form state changes:

```typescript
import { useFormState } from "@formality-ui/react";

const { methods, formState } = useFormState(options);
```

### useSubscriptions

Subscribe to field value changes:

```typescript
import { useSubscriptions } from "@formality-ui/react";

const watchedValues = useSubscriptions(fieldNames);
```

### useInferredInputs

Infer input configurations:

```typescript
import { useInferredInputs } from "@formality-ui/react";

const inputs = useInferredInputs(config);
```

## Contexts

### ConfigContext

Global configuration context:

```typescript
import { useConfigContext } from "@formality-ui/react";

const { inputs, validators, formatters, parsers, errorMessages } =
  useConfigContext();
```

### FormContext

Form-level context:

```typescript
import { useFormContext } from "@formality-ui/react";

const { config, methods, record, formConfig, unusedFields } = useFormContext();
```

### GroupContext

Group-level context for nested conditions:

```typescript
import { useGroupContext } from "@formality-ui/react";

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

  // React type overlays — precise React/RHF types layered over core's loose
  // `unknown` types. Prefer these in React code (see Type Safety below).
  ReactInputConfig,
  ReactFieldConfig,
  ReactFormFieldsConfig,
  FormalityFieldComponentProps,

  // Re-exported react-hook-form types — so consumers need no direct RHF import.
  RefCallBack,
  UseFormStateReturn,
  FieldValues,
} from "@formality-ui/react";

// `defineInputs` is a VALUE export (an identity helper), not a type — import
// it separately, not inside an `import type { ... }` block.
import { defineInputs } from "@formality-ui/react";
```

## Type Safety

Formality ships opt-in, compile-time checking for the three places typos hurt
most: **Form config keys**, **Field names**, and **input `type` strings**. It
also ships a precise type for the props Formality injects onto your field
components, so you can stop hand-rolling a lossy `WithFormality<P>` helper.

All of the checks below are **opt-in and non-breaking** — the non-generic
`<Form>`, `<Field>`, and `InputConfig`/`FormFieldsConfig` patterns shown in
[Quick Start](#quick-start) keep working byte-for-byte. The overlays below are
the recommended pattern for new React code.

### Checked Form config keys (`<Form<TFieldValues>>`)

`<Form>` is generic over your form's field-values type. With the default
generic, any string key is accepted (unchanged behavior). Narrow the generic to
your values type and unknown `config` keys become a **compile error** —
catching typos like `ofice` at compile time instead of silently rendering
nothing.

```tsx
import { Form } from "@formality-ui/react";
import type { ReactFormFieldsConfig } from "@formality-ui/react";

type ClientValues = { name: string; email: string; subscribed: boolean };

// ✅ Narrowed — only known field names are accepted.
const config: ReactFormFieldsConfig<ClientValues> = {
  name: { type: "textField", label: "Full Name" },
  email: { type: "textField", label: "Email" },
  subscribed: { type: "switch", label: "Subscribe" },
};

// @ts-expect-error — typo `ofice` is rejected when the generic is narrowed.
const bad: ReactFormFieldsConfig<ClientValues> = {
  ofice: { type: "textField" },
};

<Form<ClientValues> config={config}>{/* ... */}</Form>;
```

The default `<Form>` (no generic) still accepts any string key, so existing
consumers migrate at their own pace.

### Checked Field names (`FieldProps<TName>`)

By default `<Field name="..." />` accepts **any string** — this is backwards
compatible and matches the Quick Start. Name-checking engages **only when
`FieldProps` is explicitly narrowed**.

> React generics do **not** thread from `<Form<T>>` into its children, so a
> `<Form<ClientValues>>` does **not** automatically narrow the `name` on a
> child `<Field>`. To check field names you narrow `FieldProps` explicitly
> (the honest pattern below), typically via a thin typed wrapper.

```tsx
import { Field } from "@formality-ui/react";
import type { FieldProps } from "@formality-ui/react";

type ClientValues = { name: string; email: string; subscribed: boolean };
type Names = keyof ClientValues; // "name" | "email" | "subscribed"

// Default usage — any string name compiles (unchanged):
<Field name="anything" />;

// Opt-in strict usage — a typed wrapper that narrows FieldProps:
function TypedField(props: FieldProps<Names>) {
  return <Field {...props} />;
}

<TypedField name="email" />; // ✅
// @ts-expect-error — typo `ofice` is rejected once FieldProps is narrowed.
const _bad: FieldProps<Names> = { name: "ofice" };
```

Automatic per-form narrowing — where a `<Field>` auto-narrows against the
enclosing `<Form<TFieldValues>>`'s key set — is a planned follow-up.

### Checking input types with `defineInputs` (opt-in)

`type: "textField"` typos (e.g. `type: "texField"`) are invisible by default
because `FieldConfig.type` / `FieldProps.type` default to `string`.
`defineInputs` is an **identity helper** that lets you derive a checked union
of your input-type keys, which you can then thread into `type`.

`defineInputs` is a **value** export (it returns `inputs` unchanged with zero
runtime effect — bundlers tree-shake it to nothing). Import it as a value, not
`import type`:

```tsx
import { defineInputs } from "@formality-ui/react";

const inputs = defineInputs({
  textField: { component: TextField, defaultValue: "" },
  switch: { component: Switch, defaultValue: false },
});

// "textField" | "switch" — a checked union of your input-type keys.
export type InputType = keyof typeof inputs;
```

This is purely additive — the existing non-generic `Field` and
`FieldConfig.type` still work unchanged. End-to-end wiring of `InputType` into
those types is a follow-up; `defineInputs` is the opt-in entry point.

### Field component props: `FormalityFieldComponentProps`

`<Field>` renders your input component via React Hook Form's `<Controller>` and
injects a bundle of props onto it. `FormalityFieldComponentProps<P>` is the
**precise** type for that contract — replacing the lossy `WithFormality<P>`
helper consumers (e.g. `sellario-ui`) hand-roll today.

**Before — the lossy hand-rolled helper:**

```tsx
// ❌ Lossy: state/formState are `unknown`, and forwardRef is the wrong type.
type WithFormality<P> = P & {
  state?: unknown;
  formState?: unknown;
  forwardRef?: React.Ref<HTMLInputElement>; // wrong: RHF hands a RefCallBack
};
```

**After — the shipped precise type:**

```tsx
import type { FormalityFieldComponentProps } from "@formality-ui/react";

// FormalityFieldComponentProps<P = unknown> = P & {
//   state?: CustomFieldState | Record<string, CustomFieldState>;
//   formState?: UseFormStateReturn<FieldValues>;
//   forwardRef?: RefCallBack;
// }

type TextFieldProps = { label?: string };

const TextField: React.ComponentType<
  FormalityFieldComponentProps<TextFieldProps>
> = ({ state, formState, forwardRef, ...domProps }) => (
  <input ref={forwardRef} {...domProps} />
);
```

**Destructure before forwarding.** Always pull `state`, `formState`, and
`forwardRef` **out** of props before spreading the rest onto the underlying DOM
node — otherwise these non-DOM props leak to the DOM and React warns.

**Wiring `forwardRef` to the inner input.** `forwardRef` is RHF's `RefCallBack`
(`(instance: any) => void`), **not** `React.Ref<HTMLInputElement>`. For a
plain `<input>` use `ref={forwardRef}`. For **MUI v9** components (e.g.
`Checkbox`) that no longer accept a top-level `inputRef`, wire it via slots:

```tsx
slotProps={{ input: { ref: forwardRef } }}
```

**Runtime delivery (important).** `<Field>` delivers the RHF ref as a regular,
top-level `forwardRef` prop — no `React.forwardRef` wrap is required for a
plain function component that destructures `forwardRef` and wires it to the
inner input (`ref={forwardRef}`). Consumers migrating off the old
React-special `ref` key: a `React.forwardRef`-wrapped component should consume
`props.forwardRef` (PRD §20.4), and under React 19 ref-as-prop use `forwardRef`
directly. The type ships the **intended contract** so consumers can stop
hand-rolling `WithFormality`.

## Utilities

### makeProxyState

Create proxy state for efficient subscriptions:

```typescript
import { makeProxyState, makeDeepProxyState } from "@formality-ui/react";

const proxy = makeProxyState(initialState);
const deepProxy = makeDeepProxyState(initialState);
```

## Testing & Coverage

Run the test suite with coverage from the repo root:

```bash
pnpm test:coverage
# equivalent to: vitest run --coverage
```

Coverage is enforced as a **hard gate**: the run exits non-zero if **any** of
statements, branches, functions, or lines drop below **90%**
([vitest coverage thresholds](https://vitest.dev/guide/coverage.html#coverage-thresholds)).

Coverage is computed **repo-wide** (merged across `packages/core` and
`packages/react`), excluding only the directories below:

| Glob                 | Reason                 |
| -------------------- | ---------------------- |
| `examples/**`        | Demo apps; not shipped |
| `packages/svelte/**` | Stubbed adapter        |
| `packages/vue/**`    | Stubbed adapter        |
| `**/dist/**`         | Build output           |

All other code — `packages/core/**`, `packages/react/**`, and any future
adapter with a real implementation — is in scope and must clear 90%. See
`vitest.config.ts` for the exact configuration.

## Known Issues

- **`isDisabled` condition matcher (React adapter)** — conditions using the
  `isDisabled` field-state matcher do not currently evaluate correctly in the
  React adapter because the `fieldStates` map intentionally omits the
  `disabled` property (to avoid circular re-render dependencies). See
  [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) for the symptom, root cause, and a
  value-based workaround.

## License

MIT
