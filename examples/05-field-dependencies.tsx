/**
 * Example 05: Field Dependencies & Dynamic Props
 * ===============================================
 * This example demonstrates field dependency features:
 * - selectProps: Dynamically evaluate props based on form state
 * - Expression syntax: Access field values, record data, metadata
 * - Cascading selects: Options depend on other fields
 * - Dynamic disabled state via selectProps
 * - selectDefaultFieldProps: Global dynamic props
 * - subscribesTo: Manual subscription declarations
 */

import React, { memo, useMemo } from 'react';
import {
  FormalityProvider,
  Form,
  Field,
  type InputConfig,
  type FormFieldsConfig,
  type FormConfig,
} from '@formality-ui/react';

// =============================================================================
// Mock Data for Examples
// =============================================================================

const countries = [
  { id: 'us', name: 'United States' },
  { id: 'ca', name: 'Canada' },
  { id: 'uk', name: 'United Kingdom' },
  { id: 'au', name: 'Australia' },
];

const statesByCountry: Record<string, Array<{ id: string; name: string }>> = {
  us: [
    { id: 'ca', name: 'California' },
    { id: 'ny', name: 'New York' },
    { id: 'tx', name: 'Texas' },
  ],
  ca: [
    { id: 'on', name: 'Ontario' },
    { id: 'bc', name: 'British Columbia' },
    { id: 'qc', name: 'Quebec' },
  ],
  uk: [
    { id: 'eng', name: 'England' },
    { id: 'sco', name: 'Scotland' },
    { id: 'wal', name: 'Wales' },
  ],
  au: [
    { id: 'nsw', name: 'New South Wales' },
    { id: 'vic', name: 'Victoria' },
    { id: 'qld', name: 'Queensland' },
  ],
};

const citiesByState: Record<string, Array<{ id: string; name: string }>> = {
  ca: [
    { id: 'la', name: 'Los Angeles' },
    { id: 'sf', name: 'San Francisco' },
  ],
  ny: [
    { id: 'nyc', name: 'New York City' },
    { id: 'buf', name: 'Buffalo' },
  ],
  tx: [
    { id: 'hou', name: 'Houston' },
    { id: 'aus', name: 'Austin' },
  ],
  on: [
    { id: 'tor', name: 'Toronto' },
    { id: 'ott', name: 'Ottawa' },
  ],
  bc: [
    { id: 'van', name: 'Vancouver' },
    { id: 'vic', name: 'Victoria' },
  ],
  // ... more cities
};

// Simulated hooks that would normally fetch from API
const useCountries = () => ({ data: countries, isLoading: false });
const useStates = (countryId: string | null) => ({
  data: countryId ? statesByCountry[countryId] || [] : [],
  isLoading: false,
});
const useCities = (stateId: string | null) => ({
  data: stateId ? citiesByState[stateId] || [] : [],
  isLoading: false,
});

// =============================================================================
// Input Types
// =============================================================================

const inputs: Record<string, InputConfig> = {
  textField: {
    component: memo(({ value, onChange, label, disabled }) => (
      <div className="field">
        <label>{label}</label>
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    )),
    defaultValue: '',
  },

  // Select that accepts useOptions hook and queryParams
  select: {
    component: memo(({ value, onChange, label, disabled, useOptions, queryParams }) => {
      // Call the provided hook with queryParams
      const { data: options, isLoading } = useOptions?.(queryParams) ?? { data: [], isLoading: false };

      return (
        <div className="field">
          <label>{label}</label>
          <select
            value={value?.id ?? ''}
            onChange={(e) => {
              const selected = options?.find((o: { id: string }) => o.id === e.target.value);
              onChange(selected ?? null);
            }}
            disabled={disabled || isLoading}
          >
            <option value="">{isLoading ? 'Loading...' : 'Select...'}</option>
            {options?.map((opt: { id: string; name: string }) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>
      );
    }),
    defaultValue: null,
    valueField: 'id',
    getSubmitField: (name) => `${name}Id`,
  },

  numberField: {
    component: memo(({ value, onChange, label, min, max, disabled }) => (
      <div className="field">
        <label>{label}</label>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          min={min}
          max={max}
          disabled={disabled}
        />
      </div>
    )),
    defaultValue: null,
  },

  switch: {
    component: memo(({ checked, onChange, label, disabled }) => (
      <label className="switch">
        <input
          type="checkbox"
          checked={checked ?? false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {label}
      </label>
    )),
    defaultValue: false,
    inputFieldProp: 'checked',
    debounce: false,
  },
};

// =============================================================================
// Example 1: Cascading Selects
// =============================================================================
// Each select's options depend on the previous selection

const cascadingConfig: FormFieldsConfig = {
  country: {
    type: 'select',
    label: 'Country',
    props: {
      useOptions: useCountries,
    },
  },
  state: {
    type: 'select',
    label: 'State/Province',
    props: {
      useOptions: useStates,
    },
    // Dynamic queryParams based on country selection
    selectProps: {
      queryParams: 'country.id', // Evaluates to country field's value.id
      disabled: '!country', // Disabled when no country selected
    },
  },
  city: {
    type: 'select',
    label: 'City',
    props: {
      useOptions: useCities,
    },
    selectProps: {
      queryParams: 'state.id',
      disabled: '!state',
    },
  },
};

export function CascadingSelectsExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={cascadingConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Cascading Selects</h3>
            <p>Each dropdown depends on the previous selection</p>
            <Field name="country" />
            <Field name="state" />
            <Field name="city" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 2: Expression Syntax in selectProps
// =============================================================================
// Demonstrates all the ways to reference form state

const expressionConfig: FormFieldsConfig = {
  basePrice: {
    type: 'numberField',
    label: 'Base Price',
  },
  quantity: {
    type: 'numberField',
    label: 'Quantity',
  },
  discount: {
    type: 'numberField',
    label: 'Discount %',
  },
  calculatedTotal: {
    type: 'textField',
    label: 'Calculated Total',
    // Multiple expressions in selectProps
    selectProps: {
      // Arithmetic expression
      value: 'basePrice * quantity * (1 - discount / 100)',
      disabled: 'true', // Read-only computed field
    },
  },
};

export function ExpressionSyntaxExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={expressionConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Expression Syntax</h3>
            <p>Total = base * quantity * (1 - discount%)</p>
            <Field name="basePrice" />
            <Field name="quantity" />
            <Field name="discount" />
            <Field name="calculatedTotal" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 3: Qualified Path Prefixes
// =============================================================================
// Access different parts of form state

const qualifiedPathConfig: FormFieldsConfig = {
  firstName: {
    type: 'textField',
    label: 'First Name',
  },
  lastName: {
    type: 'textField',
    label: 'Last Name',
  },
  displayInfo: {
    type: 'textField',
    label: 'Display (shows qualified paths)',
    selectProps: {
      // Access field values (shorthand)
      value: 'firstName', // Same as fields.firstName.value

      // Access field metadata
      // 'fields.firstName.isTouched' - has the field been focused?
      // 'fields.firstName.isDirty' - has the value changed?
      // 'fields.firstName.error' - current error

      // Access original record data
      // 'record.firstName' - original value from props.record

      // Access current field's name
      // 'props.name' - "displayInfo"
    },
    disabled: true,
  },
};

// With record data for comparison
const recordForExample = {
  firstName: 'Jane',
  lastName: 'Doe',
};

export function QualifiedPathsExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={qualifiedPathConfig} record={recordForExample} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Qualified Paths in Expressions</h3>
            <pre>{`
Available prefixes:
- fieldName         → fields.fieldName.value (shorthand)
- fields.name.value → current value
- fields.name.isTouched → boolean
- fields.name.isDirty → boolean
- record.name       → original value from record prop
- props.name        → current field name
            `}</pre>
            <Field name="firstName" />
            <Field name="lastName" />
            <Field name="displayInfo" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 4: selectDefaultFieldProps
// =============================================================================
// Apply dynamic props to ALL fields

const defaultPropsConfig: FormFieldsConfig = {
  enableAll: {
    type: 'switch',
    label: 'Enable All Fields',
  },
  field1: {
    type: 'textField',
    label: 'Field 1',
  },
  field2: {
    type: 'textField',
    label: 'Field 2',
  },
  field3: {
    type: 'textField',
    label: 'Field 3',
  },
};

const defaultPropsFormConfig: FormConfig = {
  // These props are evaluated for EVERY field
  selectDefaultFieldProps: {
    disabled: '!enableAll', // All fields disabled when enableAll is false
  },
  // Static default props
  defaultFieldProps: {
    className: 'form-field',
  },
};

export function SelectDefaultFieldPropsExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form
        config={defaultPropsConfig}
        formConfig={defaultPropsFormConfig}
        onSubmit={console.log}
      >
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>selectDefaultFieldProps</h3>
            <p>Toggle enables/disables all fields at once</p>
            <Field name="enableAll" />
            <Field name="field1" />
            <Field name="field2" />
            <Field name="field3" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 5: Dynamic Labels with props.name
// =============================================================================
// Auto-generate labels from field names

const dynamicLabelConfig: FormFieldsConfig = {
  firstName: { type: 'textField' },
  lastName: { type: 'textField' },
  emailAddress: { type: 'textField' },
  phoneNumber: { type: 'textField' },
};

const dynamicLabelFormConfig: FormConfig = {
  selectDefaultFieldProps: {
    // Evaluates props.name for each field
    label: 'props.name', // Will be humanized: "firstName" -> "First Name"
  },
};

export function DynamicLabelsExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form
        config={dynamicLabelConfig}
        formConfig={dynamicLabelFormConfig}
        onSubmit={console.log}
      >
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Dynamic Labels from Field Names</h3>
            <p>Labels auto-generated from field names</p>
            <Field name="firstName" />
            <Field name="lastName" />
            <Field name="emailAddress" />
            <Field name="phoneNumber" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 6: Function-Based selectProps with subscribesTo
// =============================================================================
// Complex logic that requires explicit subscriptions

const functionSelectPropsConfig: FormFieldsConfig = {
  items: {
    type: 'numberField',
    label: 'Number of Items',
  },
  pricePerItem: {
    type: 'numberField',
    label: 'Price Per Item',
  },
  taxRate: {
    type: 'numberField',
    label: 'Tax Rate %',
  },
  summary: {
    type: 'textField',
    label: 'Order Summary',
    // When using functions, must declare subscribesTo
    subscribesTo: ['items', 'pricePerItem', 'taxRate'],
    selectProps: {
      // Function for complex string formatting
      value: ({ fields }) => {
        const items = fields.items?.value ?? 0;
        const price = fields.pricePerItem?.value ?? 0;
        const tax = fields.taxRate?.value ?? 0;

        const subtotal = items * price;
        const taxAmount = subtotal * (tax / 100);
        const total = subtotal + taxAmount;

        return `${items} items × $${price} = $${subtotal.toFixed(2)} + $${taxAmount.toFixed(2)} tax = $${total.toFixed(2)}`;
      },
      disabled: () => true,
    },
  },
};

export function FunctionSelectPropsExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={functionSelectPropsConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Function-Based selectProps</h3>
            <p>Complex calculations with explicit subscriptions</p>
            <Field name="items" />
            <Field name="pricePerItem" />
            <Field name="taxRate" />
            <Field name="summary" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 7: Nested Object Expressions
// =============================================================================
// Access deep properties in expressions

const nestedObjectConfig: FormFieldsConfig = {
  client: {
    type: 'select',
    label: 'Client',
    props: {
      useOptions: () => ({
        data: [
          { id: 1, name: 'Acme Corp', settings: { currency: 'USD', tier: 'premium' } },
          { id: 2, name: 'Globex', settings: { currency: 'EUR', tier: 'standard' } },
        ],
        isLoading: false,
      }),
    },
  },
  currencyDisplay: {
    type: 'textField',
    label: 'Client Currency',
    selectProps: {
      // Access nested property
      value: 'client.settings.currency',
      disabled: 'true',
    },
  },
  tierDisplay: {
    type: 'textField',
    label: 'Client Tier',
    selectProps: {
      value: 'client.settings.tier',
      disabled: 'true',
    },
  },
  isPremium: {
    type: 'switch',
    label: 'Is Premium Client',
    selectProps: {
      // Expression with nested access
      checked: 'client.settings.tier === "premium"',
      disabled: 'true',
    },
  },
};

export function NestedObjectExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={nestedObjectConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Nested Object Access</h3>
            <p>Access deep properties with dot notation</p>
            <Field name="client" />
            <Field name="currencyDisplay" />
            <Field name="tierDisplay" />
            <Field name="isPremium" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

export default {
  CascadingSelectsExample,
  ExpressionSyntaxExample,
  QualifiedPathsExample,
  SelectDefaultFieldPropsExample,
  DynamicLabelsExample,
  FunctionSelectPropsExample,
  NestedObjectExample,
};
