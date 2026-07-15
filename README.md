# Formality

You've built this form before. A few fields, a couple of conditions. Then more fields get added. Fields start depending on each other — one change should cascade into another, a selection should trigger a fetch, a toggle should auto-fill another field. Before long you have `useEffect` blocks watching fields, `setValue` calls pushing changes back, and derived state scattered across the component. The real dependency graph is buried inside effect hooks where no one can see it.

Formality is a **declarative form logic layer** built on top of React Hook Form. You describe field relationships, conditional behavior, and derived values in configuration. The library handles the wiring.

**All form behavior lives in one place instead of being scattered across components.**

### What you're probably writing

```tsx
function ManualForm() {
  const { register, watch, setValue, resetField } = useForm();
  const country = watch("country");
  const quantity = watch("quantity");
  const unitPrice = watch("unitPrice");

  // Cascading: load states when country changes
  useEffect(() => {
    if (country) fetchStates(country.id).then(setStateOptions);
    else {
      resetField("state");
      resetField("city");
    }
  }, [country]);

  // Derived value: compute total
  const [totalPrice, setTotalPrice] = useState(0);
  useEffect(() => {
    setTotalPrice((quantity ?? 0) * (unitPrice ?? 0));
  }, [quantity, unitPrice]);

  // Auto-fill: set address when toggled
  const useDefault = watch("useDefaultAddress");
  useEffect(() => {
    if (useDefault) setValue("shippingAddress", "123 Main St");
  }, [useDefault]);

  return (
    <form>
      <select {...register("country")} />
      <select {...register("state")} disabled={!country} />
      {paymentMethod === "Credit Card" && <input {...register("cardNumber")} />}
      <p>Total: {totalPrice}</p>
    </form>
  );
}
```

### The same form with Formality

```tsx
const config = {
  country: { type: "select", props: { useOptions: useCountries } },
  state: {
    type: "select",
    props: { useOptions: useStates },
    selectProps: { queryParams: "country.id", disabled: "!country" },
  },
  paymentMethod: {
    type: "select",
    props: { options: ["Credit Card", "Bank Transfer", "PayPal"] },
  },
  cardNumber: {
    type: "textField",
    // Show only when payment method is "Credit Card".
    // By default fields are visible, so we express this as a
    // hide-rule that fires for any other value.
    conditions: [
      { selectWhen: 'paymentMethod !== "Credit Card"', visible: false },
    ],
  },
  quantity: { type: "number" },
  unitPrice: { type: "number" },
  totalPrice: {
    type: "number",
    conditions: [
      {
        selectWhen: "quantity && unitPrice",
        selectSet: "quantity * unitPrice",
      },
    ],
    disabled: true,
  },
  useDefaultAddress: { type: "switch" },
  shippingAddress: {
    type: "textField",
    conditions: [
      { when: "useDefaultAddress", truthy: true, set: "123 Main St" },
    ],
  },
};
```

No `useEffect`. No manual syncing. Every relationship is visible in one config object.

---

## Built on React Hook Form

Formality does not replace your form library. It uses React Hook Form internally for registration, validation, and submission.

- Full access to all RHF APIs via the render function's `methods`
- Drop down to RHF at any point — no lock-in
- Formality is an abstraction layer on top of RHF, not an alternative to it

```tsx
<Form config={config} onSubmit={onSubmit}>
  {({ methods, handleSubmit }) => (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* `handleSubmit` runs form-level validate + transformValuesForSubmit. */}
      {/* `methods` is the full UseFormReturn from RHF (escape hatch).        */}
      <Field name="email" />
      <button type="submit" disabled={!methods.formState.isValid}>
        Submit
      </button>
    </form>
  )}
</Form>
```

The render API's `handleSubmit` routes submission through Formality's
pipeline (form-level `validate` + `transformValuesForSubmit`). Use
`methods.handleSubmit` directly only if you want to bypass those transforms
and call RHF verbatim.

If Formality doesn't handle something, use RHF directly. The escape hatch is always available.

---

## Separation of Concerns

Form logic does not belong in components. A component should render UI, not orchestrate field dependencies, compute derived values, or manage cascading side effects.

In a typical complex form, the logic is scattered:

- `useEffect` blocks scattered across the component for field synchronization
- `watch` calls pulling values into the render cycle
- `setValue` calls pushing changes back imperatively
- Conditional rendering driven by form state inside JSX

This mixes "what the form looks like" with "what the form does." The result is hard to read, hard to test, and hard to modify without introducing regressions.

Formality separates these concerns:

- **Configuration** defines behavior (conditions, derived values, dependencies)
- **Components** handle rendering only
- **The library** resolves relationships at runtime

Behavior is centralized in config objects. Components stay focused on presentation. The dependency graph is visible at a glance, not buried inside effect hooks.

---

## The Form Logic Layer

Formality separates form logic from rendering. All behavior — visibility, disabled state, derived values, cascading dependencies — is expressed in configuration objects, not in component code.

Conditions are the engine behind this. They are not just for showing and hiding fields. They are a **general-purpose behavior system** that controls:

| Behavior                | How           | Example                                                      |
| ----------------------- | ------------- | ------------------------------------------------------------ |
| Visibility              | `visible`     | Show card number only when payment is "Credit Card"          |
| Disabled state          | `disabled`    | Disable city selector until state is chosen                  |
| Static value assignment | `set`         | Auto-fill address when "use default" is toggled              |
| Dynamic computed values | `selectSet`   | Calculate total from quantity x price                        |
| Multi-field matching    | `when` object | Show section only when email is valid AND name is filled     |
| Complex expressions     | `selectWhen`  | Flag a discount when age >= 25 AND hasLicense AND years >= 3 |

These all work through the same `conditions` array on any field or group.

---

## Forms as Data

Because Formality expresses form behavior as plain configuration objects, a form's entire logic — field types, relationships, conditions, derived values — can be represented as data. That data can come from anywhere.

```
// A complete field definition, expressible as JSON
{
  "type": "select",
  "label": "State",
  "props": { "useOptions": "useStates" },
  "selectProps": {
    "queryParams": "country.id",
    "disabled": "!country"
  }
}
```

This means:

- **API-driven forms**: Fetch field configurations from your backend and render them dynamically. Admin-configurable forms, multi-tenant layouts, or user-customizable dashboards become straightforward.
- **Serialization**: Config objects can be serialized, stored, and reconstructed. No functions required for standard behavior.
- **Declarative business rules**: Conditions describe _what should happen_, not _how to make it happen_. The engine resolves the how.

String expressions are what enable this model. A condition like `selectSet: "price * quantity"` is a portable, serializable rule — not a JavaScript function bound to a module. Functions remain fully supported for cases that need them (complex calculations, string manipulation, TypeScript type safety), but they are not required for the majority of form logic.

In practice: use string expressions for standard relationships, reach for functions when you need full programming flexibility.

---

## Packages

| Package                                   | Description                  | Status  |
| ----------------------------------------- | ---------------------------- | ------- |
| [@formality-ui/core](./packages/core)     | Framework-agnostic utilities | Stable  |
| [@formality-ui/react](./packages/react)   | React implementation         | Stable  |
| [@formality-ui/vue](./packages/vue)       | Vue implementation           | Planned |
| [@formality-ui/svelte](./packages/svelte) | Svelte implementation        | Planned |

> **Headline exports.** `@formality-ui/core` exposes the PRD §1.3.2 entry points
> [`validate()`](./PRD.md) and [`mergeConfigs()`](./PRD.md) alongside granular helpers
> (`runValidator`, `composeValidators`, `deepMerge`, `mergeFieldProps`, …). The React
> adapter consumes them internally; framework-agnostic consumers can import them directly.

<!--
import { validate, mergeConfigs } from "@formality-ui/core";
const result = await validate(value, rules, validators, formValues); // async
const { inputConfig, fieldConfig } = mergeConfigs(provider, form, field);
-->

---

## Quick Start (React)

```bash
npm install @formality-ui/react react-hook-form
```

```tsx
import { FormalityProvider, Form, Field } from "@formality-ui/react";

const inputs = {
  textField: {
    component: ({ value, onChange, label, error }) => (
      <div>
        <label>{label}</label>
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        {error && <span className="error">{error}</span>}
      </div>
    ),
    defaultValue: "",
  },
  switch: {
    component: ({ checked, onChange, label }) => (
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    ),
    defaultValue: false,
    inputFieldProp: "checked",
  },
};

const config = {
  name: { type: "textField", label: "Full Name" },
  email: { type: "textField", label: "Email Address" },
  subscribe: { type: "switch", label: "Subscribe to newsletter" },
};

function MyForm() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={config} onSubmit={console.log}>
        {({ handleSubmit }) => (
          <form onSubmit={handleSubmit(console.log)}>
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

## Conditions: The Behavior System

Conditions are Formality's core mechanism for expressing field relationships. Every condition has a **trigger** (what to watch), optional **matchers** (what to match), and **actions** (what to do when matched).

### Single-Field Conditions

```tsx
const config = {
  showDetails: { type: "switch", label: "Show Details" },
  details: {
    type: "textField",
    label: "Additional Details",
    conditions: [{ when: "showDetails", truthy: false, visible: false }],
  },
  status: {
    type: "select",
    label: "Status",
    conditions: [
      { when: "signed", is: false, disabled: true },
      { when: "priority", is: "urgent", set: "expedited" },
    ],
  },
};
```

### Multi-Field Conditions (AND logic)

Match on multiple fields simultaneously:

```tsx
conditions: [
  {
    when: {
      email: { isValid: true },
      name: { isTruthy: true },
    },
    visible: true,
  },
];
```

### Condition Reference

| Property     | Description                                                      |
| ------------ | ---------------------------------------------------------------- |
| `when`       | Field name to watch (string), or object for multi-field matching |
| `selectWhen` | Expression to evaluate (for complex conditions)                  |
| `is`         | Exact value to match                                             |
| `truthy`     | Check if value is truthy (`true`) or falsy (`false`)             |
| `isValid`    | Check if field is valid (`true`) or invalid (`false`)            |
| `isDisabled` | Check if field is disabled (`true`) or enabled (`false`)         |
| `disabled`   | Set disabled state when condition matches                        |
| `visible`    | Set visibility when condition matches                            |
| `set`        | Set static value when condition matches                          |
| `selectSet`  | Set dynamic value from expression or function                    |

**Resolution rules:**

- `disabled`: OR logic — disabled if **any** condition sets it
- `visible`: AND logic — hidden if **any** condition sets `false`
- `set`/`selectSet`: last matching condition wins

> **Showing a field only when a value matches** — fields are visible by
> default, and unmatched conditions don't affect visibility. So a lone
> `{ when, is: X, visible: true }` does **nothing** (the field stays visible
> for every value). To show a field _only_ for a specific value, express it
> as a hide-rule for every other value, e.g.
> `{ selectWhen: 'paymentMethod !== "Credit Card"', visible: false }`.
> Note also that `is` short-circuits matcher evaluation — `truthy` is never
> consulted once `is` is present.

> **⚠️ `isDisabled` limitation (React adapter)** — cross-field `isDisabled`
> matching is currently non-functional in the React adapter because the
> disabled-state map is intentionally excluded from reactive subscriptions
> to avoid circular re-render loops. See
> [`packages/react/KNOWN_ISSUES.md`](packages/react/KNOWN_ISSUES.md) for
> details and workarounds (value-based conditions, an explicit `disabled`
> prop, or `selectProps: { disabled: '...' }`).

---

## Derived Values (`set` and `selectSet`)

Most form libraries don't handle computed fields cleanly. Formality treats derived values as a first-class concept.

### Static value with `set`

Auto-fill a field when a condition is met:

```tsx
shippingAddress: {
  type: "textField",
  conditions: [
    { when: "useDefaultAddress", truthy: true, set: "123 Main Street" },
  ],
}
```

### Dynamic computation with `selectSet`

Calculate values from other fields using string expressions or functions:

```tsx
totalPrice: {
  type: "number",
  conditions: [
    {
      selectWhen: "basePrice && quantity",
      selectSet: "basePrice * quantity * (applyDiscount ? 0.8 : 1)",
    },
  ],
  disabled: true,
}
```

```tsx
fullName: {
  type: "textField",
  conditions: [
    {
      selectWhen: "firstName || lastName",
      subscribesTo: ["firstName", "lastName"],
      selectSet: ({ fields }) => {
        const first = fields.firstName?.value ?? "";
        const last = fields.lastName?.value ?? "";
        return `${first} ${last}`.trim();
      },
      disabled: true,
    },
  ],
}
```

Cascading updates work automatically. If field A derives from B, and B derives from C, changing C propagates through the entire chain.

---

## Field Dependencies

Fields can dynamically compute props based on other fields. This handles cascading selects, conditional query parameters, and derived props.

```tsx
const config = {
  country: { type: "select", props: { useOptions: useCountries } },
  state: {
    type: "select",
    props: { useOptions: useStates },
    selectProps: {
      queryParams: "country.id", // pass country.id to the states hook
      disabled: "!country", // disable until country is selected
    },
  },
  city: {
    type: "select",
    props: { useOptions: useCities },
    selectProps: {
      queryParams: "state.id",
      disabled: "!state",
    },
  },
};
```

### String Expressions vs Callback Functions

Most options accept both string expressions and callback functions. String expressions are the default because they are portable and serializable — they enable API-driven forms and config storage. Functions are available for anything that needs full programming power.

**String expressions** (auto-infer dependencies, serializable):

```tsx
selectProps: {
  value: 'price * quantity',
  disabled: '!client',
  queryParams: 'client.id',
}
```

**Callback functions** (require explicit `subscribesTo`):

```tsx
subscribesTo: ['price', 'quantity', 'discount'],
selectProps: {
  value: ({ fields }) => {
    const price = fields.price?.value ?? 0;
    const qty = fields.quantity?.value ?? 0;
    const discount = fields.discount?.value ?? 0;
    return Math.round(price * qty * (1 - discount / 100) * 100) / 100;
  },
}
```

| Use case               | Recommended approach                |
| ---------------------- | ----------------------------------- |
| Simple field access    | String: `'fieldName'`               |
| Property access        | String: `'client.id'`               |
| Basic arithmetic       | String: `'price * quantity'`        |
| Comparisons            | String: `'age >= 21 && hasLicense'` |
| Complex calculations   | Function (rounding, formatting)     |
| String manipulation    | Function (toUpperCase, trim, etc.)  |
| Business logic         | Function                            |
| TypeScript type safety | Function                            |

---

## Validation

Compose multiple validators with async support:

```tsx
const validators = {
  required: (value) => (!value ? { type: "required" } : true),
  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : "Invalid email",
  minLength: (min) => (value) =>
    value?.length < min ? `Must be at least ${min} characters` : true,
};

const config = {
  email: { type: "textField", validator: ["required", "email"] },
  password: {
    type: "passwordField",
    validator: [
      "required",
      validators.minLength(8),
      async (value) => {
        const isCommon = await checkCommonPassword(value);
        return isCommon ? "Password is too common" : true;
      },
    ],
  },
};
```

---

## Auto-Save

Debounced automatic form submission:

```tsx
<Form config={config} onSubmit={handleSubmit} autoSave debounce={2000}>
  {/* fields */}
</Form>;

// Input-level debounce control
const inputs = {
  textField: { component: TextField, debounce: 1000 },
  switch: { component: Switch, debounce: false },
};
```

---

## Field Groups

Apply conditions to multiple fields at once:

```tsx
const formConfig = {
  groups: {
    businessFields: {
      conditions: [{ when: "accountType", is: "personal", visible: false }],
    },
  },
};

<Form config={fieldConfig} formConfig={formConfig}>
  <Field name="accountType" />
  <FieldGroup name="businessFields">
    <Field name="companyName" />
    <Field name="taxId" />
    <Field name="companySize" />
  </FieldGroup>
</Form>;
```

Groups can be nested — inner groups inherit conditions from outer groups.

---

## Value Transformation

Transform values between user input and form state:

```tsx
const inputs = {
  currency: {
    component: CurrencyInput,
    defaultValue: null,
    parser: (value) => parseFloat(String(value).replace(/[,$]/g, "")) || null,
    formatter: (value) =>
      value == null ? "" : new Intl.NumberFormat("en-US").format(value),
  },
  autocomplete: {
    component: Autocomplete,
    defaultValue: null,
    valueField: "id",
    getSubmitField: (name) => `${name}Id`,
  },
};
```

### Composing input types: reuse a component + default props + named transforms

An input type is just an `InputConfig` that bundles a `component` with optional
defaults. **You do not have to write a new component** to get a specialized
field — reuse an existing one and stack on:

| Field                                                                                                 | What it does                                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `props`                                                                                               | Default props applied to every field of this type (e.g. `placeholder`, `maxLength`, `inputMode`). Per-field props override them. |
| `parser`                                                                                              | Transform user input → form value. A **string** names an entry in the provider's `parsers`; a function is inline.                |
| `formatter`                                                                                           | Transform form value → display value. Same string/function rules as `parser`.                                                    |
| `validator`, `template`, `inputFieldProp`, `valueField`, `getSubmitField`, `debounce`, `defaultValue` | The rest of the bundle (see `InputConfig`).                                                                                      |

The canonical example is a phone-number field that is just a text field with
default props and a named parser/formatter — no new component required:

```tsx
// 1. Register the named parser/formatter ONCE at the provider level
const parsers = {
  // "(555) 123-4567" -> "5551234567"
  phone: (value: unknown) => String(value ?? "").replace(/[^\d]/g, ""),
};

const formatters = {
  // "5551234567" -> "(555) 123-4567"
  phone: (value: unknown) => {
    const d = String(value ?? "").replace(/[^\d]/g, "");
    const m = d.match(/^(\d{3})(\d{3})(\d{4})$/);
    return m ? `(${m[1]}) ${m[2]}-${m[3]}` : d;
  },
};

const inputs = {
  textField: { component: TextField, defaultValue: "" },

  // A "phone" type — same component, bundled defaults, NO new component
  phone: {
    component: TextField, // reuse the existing text field
    defaultValue: "",
    props: {
      type: "tel", // underlying <input type="tel">
      inputMode: "tel",
      placeholder: "(555) 555-5555",
      maxLength: 14,
    },
    parser: "phone", // named parser (looked up above)
    formatter: "phone", // named formatter (looked up above)
  },
};

function App() {
  return (
    <FormalityProvider
      inputs={inputs}
      parsers={parsers}
      formatters={formatters}
    >
      {/* ... */}
    </FormalityProvider>
  );
}

// 2. In a form config, the type key selects the whole bundle:
//      { mobile: { type: "phone", label: "Mobile" } }
//    <Field name="mobile" /> renders the text field with type="tel" and
//    applies phone formatting automatically — no new component required.
```

> **`type` gotcha:** Formality's `type` (the input-type key set on
> `<Field type="…">` or `FieldConfig.type`) is **not** the DOM `type`
> attribute. The former selects the `InputConfig`; the underlying element's
> `type` is an ordinary prop that belongs in `InputConfig.props` (or
> `FieldConfig.props`). They never collide, because `<Field>` consumes its own
> `type` prop instead of forwarding it to the component.

> **Named lookups must be registered.** A `parser`/`formatter` string is
> resolved against the provider's `parsers`/`formatters` maps. If the name is
> missing, Formality logs a warning (in non-production builds) and passes the
> value through unchanged.

### Per-field overrides for type-level levers

The six type-level levers — `defaultValue`, `debounce`, `parser`,
`formatter`, `valueField`, `getSubmitField` — are also available **per field**
on `config[name]`. Setting one on a single `FieldConfig` overrides the input
type's value for that field only, leaving every other field of the same type
untouched — no new input type required.

The canonical case is one `switch` that defaults **on** while the rest keep
the type default:

```tsx
// Type-level default: every switch starts OFF.
const inputs = {
  switch: { component: Switch, defaultValue: false },
};

// Per-field override: ONE switch ("active") starts ON; siblings keep the
// type default.
const config = {
  active: { type: "switch", defaultValue: true }, // overrides the type default
  paused: { type: "switch" }, // no override → starts OFF (type default)
};

// <Field name="active" /> → starts ON
// <Field name="paused" /> → starts OFF
```

**One rule for all six.** A field-level value wins over the type-level value
whenever it is **not `undefined`** — so `null`, `false`, `0`, and `""` are
meaningful overrides, not treated as "unset".

Only these six levers override; the rest of `config[name]` behaves
differently:

| Lever set per-field                                                               | Field ↔ Type                                                     |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, `getSubmitField` | **override** — the field value wins when it is not `undefined`.  |
| `validator`                                                                       | **compose** — the field validator runs, then the type validator. |
| `props`                                                                           | **merge** — type props spread underneath the field's own props.  |

> **`defaultValue` is a new priority tier, not a fallback.** A field-level
> `defaultValue` sits _below_ the `record` value and an explicit
> `defaultValues` Form prop, and _above_ the type's `defaultValue`. So on an
> edit form a real record value still wins; the field default only fills in
> when the record omits the key. It is **not** a bare `??` of the type default.

See [`examples/02-input-types.tsx`](./examples/02-input-types.tsx) for the full
set of `InputConfig` options (named vs inline transforms, default `props`,
`validator`, `template`, etc.).

---

## Type Safety

Formality ships precise React / react-hook-form types so configuration mistakes
are caught at compile time. The capabilities below are all opt-in or
backwards-compatible — existing code keeps compiling unchanged.

- **Checked `Form` config keys** — `<Form<TFieldValues>>` rejects unknown `config`
  keys (typos like `ofice`). Default `<Form>` still accepts any string key.
- **Checked `Field` names (opt-in)** — narrow `FieldProps<TName>` to get `name`
  checking. Checking engages only when narrowed; it is **not** automatic from
  `<Form<TFieldValues>>` (React generics don't thread into children).
- **`defineInputs` / `InputType` (opt-in)** — derive a union of your input-type
  keys for `keyof` checking on `Field` `type` / `FieldConfig.type`.
- **`FormalityFieldComponentProps<P>`** — the shipped injected-props type,
  replacing the hand-rolled lossy `WithFormality<P>`.

For full type signatures and copy-paste examples, see the
[React package README](./packages/react/README.md#type-safety).

---

## Architecture

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

The `Field` component is a thin shell: its Controller integration, props-resolution
pipeline, value transformation, and condition application all live in the `useField`
hook (`packages/react/src/hooks/useField.tsx`), extracted in v1.0 for reuse and testing.

### Expression Engine

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

---

## When to Use Formality

**Use Formality when:**

- Your form has field relationships (cascading selects, conditional sections, derived values)
- You're writing `useEffect` to synchronize form fields
- You need to express complex conditional logic (visibility, disabled state, value overrides)
- You have auto-save requirements with validation awareness
- Form logic is spread across multiple components and hard to track
- You need forms driven by API data or external configuration
- Business rules are buried in component code and should be declarative

**You may not need it when:**

- Your form is simple (a few fields, no relationships)
- You only need basic validation and submission
- React Hook Form alone handles everything you need
- There are no cross-field dependencies or conditional behavior

---

## Documentation

| Resource                            | Description                        |
| ----------------------------------- | ---------------------------------- |
| [Examples](./examples)              | Comprehensive runnable examples    |
| [Developer Docs (PRD.md)](./PRD.md) | Complete technical specification   |
| [Development Guide](#development)   | Contributing and development setup |

---

## Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Setup

```bash
git clone https://github.com/formality-ui/formality.git
cd formality
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

### Project Structure

```
formality/
├── packages/
│   ├── core/                  # @formality-ui/core — zero framework deps
│   │   └── src/
│   │       ├── conditions/    # evaluate field conditions
│   │       ├── config/        # defaults.ts, merge.ts, config/ordering.ts (P1.M1)
│   │       ├── expression/    # string-expression engine
│   │       ├── labels/        # label & ordering resolution
│   │       ├── transform/     # format/parse pipelines
│   │       ├── types/         # shared type definitions
│   │       ├── validation/    # validate.ts → validate() (P1.M2.T1)
│   │       └── index.ts       # barrel: validate(), mergeConfigs(), ...
│   ├── react/                 # @formality-ui/react — RHF implementation
│   │   └── src/
│   │       ├── components/    # Field.tsx, Form.tsx, FormalityProvider.tsx, ...
│   │       ├── context/       # Config/Form/Group contexts
│   │       ├── hooks/         # useField.tsx (P2.M1.T1), useConditions, ...
│   │       ├── overlays.ts    # React type overlays (forwardRef JSDoc, P2.M2)
│   │       └── index.ts       # barrel: useField, defineInputs, overlay types
│   ├── vue/                   # Planned (stubbed)
│   └── svelte/                # Planned (stubbed)
├── examples/                  # 01–09 runnable examples + index.ts
├── PRD.md                     # Complete technical specification
└── package.json
```

### Scripts

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `pnpm build`         | Build all packages                   |
| `pnpm test`          | Run all tests                        |
| `pnpm test:coverage` | Run tests with the 90% coverage gate |
| `pnpm typecheck`     | Type check all packages              |
| `pnpm lint`          | Lint all packages                    |

---

## Examples

See the [examples directory](./examples) for comprehensive, runnable examples:

| Example                                                       | Description                                |
| ------------------------------------------------------------- | ------------------------------------------ |
| [01-basic-form](./examples/01-basic-form.tsx)                 | Getting started with Form, Field, Provider |
| [02-input-types](./examples/02-input-types.tsx)               | Input configuration options                |
| [03-conditions](./examples/03-conditions.tsx)                 | Conditional logic                          |
| [04-validation](./examples/04-validation.tsx)                 | Validation system                          |
| [05-field-dependencies](./examples/05-field-dependencies.tsx) | Dynamic props and cascading                |
| [06-auto-save](./examples/06-auto-save.tsx)                   | Auto-save configuration                    |
| [07-advanced-features](./examples/07-advanced-features.tsx)   | UnusedFields, ordering, templates          |
| [08-real-world-example](./examples/08-real-world-example.tsx) | Complete Quote form                        |
| [09-string-vs-function](./examples/09-string-vs-function.tsx) | Expression vs callback comparison          |

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Testing

```bash
pnpm test                          # run all tests
pnpm test:coverage                 # run tests + enforce the 90% coverage gate
pnpm test --filter=@formality-ui/core
pnpm test --filter=@formality-ui/react
```

Coverage is enforced at **≥ 90%** across statements, branches, functions, **and**
lines — the run exits non-zero (fails CI) if any drops below (v8 provider). The
gate applies repo-wide to all shipped code (`packages/core/**`,
`packages/react/**`). The following are excluded from the measurement:

| Excluded path        | Reason                                  |
| -------------------- | --------------------------------------- |
| `examples/**`        | Demo apps; not shipped                  |
| `packages/svelte/**` | Stubbed adapter (no implementation yet) |
| `packages/vue/**`    | Stubbed adapter (no implementation yet) |
| `**/dist/**`         | Build output                            |

See [PRD §1.3.7 — Testing Strategy](./PRD.md) for the full specification.

---

## Support

If Formality helps you build something great, consider fueling future development:

<a href="https://buymeacoffee.com/dustindsch2" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50"></a>

## License

MIT
