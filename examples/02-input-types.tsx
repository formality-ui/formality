/**
 * Example 02: Input Type Configuration
 * =====================================
 * This example demonstrates the full range of InputConfig options:
 * - component: The React component to render
 * - defaultValue: Initial value for new records
 * - debounce: Control validation/auto-save timing
 * - inputFieldProp: Custom prop name for value (e.g., 'checked' for switches)
 * - valueField: Extract specific property for submission
 * - getSubmitField: Transform field name for API submission
 * - parser/formatter: Transform values between display and form state
 * - validator: Type-level validation
 * - template: Wrapper component for error display, labels, etc.
 * - props: Default props for this input type
 */

import React, { memo } from 'react';
import { FormalityProvider, Form, Field, type InputConfig } from '@formality-ui/react';

// =============================================================================
// Input Type: Text Field with Debounce
// =============================================================================
// Debounce prevents validation from running on every keystroke

const textField: InputConfig = {
  component: memo(({ value, onChange, label, name, error }) => (
    <div className="field">
      <label>{label}</label>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </div>
  )),
  defaultValue: '',
  debounce: 300, // Wait 300ms after user stops typing before validating
};

// =============================================================================
// Input Type: Switch with inputFieldProp
// =============================================================================
// Switches use 'checked' instead of 'value'

const switchInput: InputConfig = {
  component: memo(({ checked, onChange, label, name, disabled }) => (
    <div className="field">
      <label>
        <input
          type="checkbox"
          checked={checked ?? false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {label}
      </label>
    </div>
  )),
  defaultValue: false,
  inputFieldProp: 'checked', // Pass value as 'checked' prop, not 'value'
  debounce: false, // No debounce - react immediately to clicks
};

// =============================================================================
// Input Type: Autocomplete with valueField and getSubmitField
// =============================================================================
// For complex objects where you display the full object but submit only an ID

interface Option {
  id: number;
  name: string;
  code?: string;
}

const autocomplete: InputConfig<Option | null> = {
  component: memo(({ value, onChange, options, label, disabled }) => (
    <div className="field">
      <label>{label}</label>
      <select
        value={value?.id ?? ''}
        onChange={(e) => {
          const selected = options?.find((o: Option) => o.id === Number(e.target.value));
          onChange(selected ?? null);
        }}
        disabled={disabled}
      >
        <option value="">Select...</option>
        {options?.map((opt: Option) => (
          <option key={opt.id} value={opt.id}>
            {opt.name} {opt.code && `(${opt.code})`}
          </option>
        ))}
      </select>
    </div>
  )),
  defaultValue: null,
  // Extract the 'id' property when submitting
  valueField: 'id',
  // Transform "client" to "clientId" for API submission
  getSubmitField: (fieldName) => `${fieldName}Id`,
};

// =============================================================================
// Input Type: Decimal with Parser and Formatter
// =============================================================================
// Transform between string display and numeric form state

const decimal: InputConfig = {
  component: memo(({ value, onChange, label, error, precision = 2 }) => (
    <div className="field">
      <label>{label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </div>
  )),
  defaultValue: '',
  // Named parsers/formatters (defined in provider config)
  parser: 'float',
  formatter: 'float',
};

// =============================================================================
// Input Type: Currency with Inline Parser/Formatter
// =============================================================================

const currency: InputConfig = {
  component: memo(({ value, onChange, label }) => (
    <div className="field">
      <label>{label}</label>
      <div className="currency-input">
        <span>$</span>
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )),
  defaultValue: '',
  // Inline parser: string "1,234.56" -> number 1234.56
  parser: (value) => {
    if (value === '' || value == null) return null;
    const cleaned = String(value).replace(/[,$]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  },
  // Inline formatter: number 1234.56 -> string "1,234.56"
  formatter: (value) => {
    if (value == null) return '';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },
};

// =============================================================================
// Input Type: With Default Props
// =============================================================================
// Set default props that all instances of this type will receive

const textArea: InputConfig = {
  component: memo(({ value, onChange, label, rows, cols }) => (
    <div className="field">
      <label>{label}</label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        cols={cols}
      />
    </div>
  )),
  defaultValue: '',
  // Default props - can be overridden per-field
  props: {
    rows: 4,
    cols: 50,
  },
};

// =============================================================================
// Input Type: With Template (Error Display Wrapper)
// =============================================================================
// Templates wrap the input component to provide consistent error display

const FieldTemplate = memo(({
  Field: InputComponent,
  fieldProps,
  fieldState,
}: {
  Field: React.ComponentType<any>;
  fieldProps: Record<string, unknown>;
  fieldState: { error?: { message?: string }; isTouched: boolean };
}) => (
  <div className={`field-wrapper ${fieldState.error ? 'has-error' : ''}`}>
    <InputComponent {...fieldProps} />
    {fieldState.isTouched && fieldState.error && (
      <div className="error-message">{fieldState.error.message}</div>
    )}
  </div>
));

const validatedTextField: InputConfig = {
  component: memo(({ value, onChange, label }) => (
    <div className="field">
      <label>{label}</label>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )),
  defaultValue: '',
  template: FieldTemplate,
  validator: 'required', // Type-level validation (all fields of this type are required)
};

// =============================================================================
// Combined Provider Configuration
// =============================================================================

const inputs: Record<string, InputConfig> = {
  textField,
  switch: switchInput,
  autocomplete,
  decimal,
  currency,
  textArea,
  validatedTextField,
};

// Named parsers and formatters (referenced by string in input configs)
const parsers = {
  float: (value: unknown) => {
    if (value === '' || value == null) return null;
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
  },
  int: (value: unknown) => {
    if (value === '' || value == null) return null;
    const num = parseInt(String(value), 10);
    return isNaN(num) ? null : num;
  },
};

const formatters = {
  float: (value: unknown) => {
    if (value == null) return '';
    return (value as number).toFixed(2);
  },
  float3: (value: unknown) => {
    if (value == null) return '';
    return (value as number).toFixed(3);
  },
};

// =============================================================================
// Example Form Using Various Input Types
// =============================================================================

const config = {
  client: {
    type: 'autocomplete',
    label: 'Client',
    props: {
      options: [
        { id: 1, name: 'Acme Corp', code: 'ACM' },
        { id: 2, name: 'Globex Inc', code: 'GLX' },
        { id: 3, name: 'Initech', code: 'INT' },
      ],
    },
  },
  isActive: {
    type: 'switch',
    label: 'Active',
  },
  billRate: {
    type: 'decimal',
    label: 'Bill Rate',
  },
  totalBudget: {
    type: 'currency',
    label: 'Total Budget',
  },
  notes: {
    type: 'textArea',
    label: 'Notes',
    props: { rows: 6 }, // Override default rows
  },
};

export function InputTypesDemo() {
  const handleSubmit = (values: Record<string, unknown>) => {
    console.log('Submitted:', values);
    // Output: { clientId: 1, isActive: true, billRate: 125.50, ... }
    // Note: 'client' became 'clientId' due to getSubmitField
  };

  return (
    <FormalityProvider inputs={inputs} parsers={parsers} formatters={formatters}>
      <Form config={config} onSubmit={handleSubmit}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(handleSubmit)}>
            <Field name="client" />
            <Field name="isActive" />
            <Field name="billRate" />
            <Field name="totalBudget" />
            <Field name="notes" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

export default InputTypesDemo;
