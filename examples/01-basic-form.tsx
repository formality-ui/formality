/**
 * Example 01: Basic Form Setup
 * =============================
 * This example demonstrates the fundamental building blocks of a Formality form:
 * - FormalityProvider for global configuration
 * - Form component with field configuration
 * - Field component for rendering inputs
 * - Basic submit handling
 */

import React from 'react';
import {
  FormalityProvider,
  Form,
  Field,
  type InputConfig,
  type FormFieldsConfig,
} from '@formality/react';

// =============================================================================
// Step 1: Define Input Types
// =============================================================================
// Input types define reusable components with their behaviors.
// These are typically defined once in your app and shared across all forms.

const inputs: Record<string, InputConfig> = {
  textField: {
    component: ({ value, onChange, label, name, disabled, error }) => (
      <div className="field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {error && <span className="error">{error}</span>}
      </div>
    ),
    defaultValue: '',
  },

  emailField: {
    component: ({ value, onChange, label, name, disabled, error }) => (
      <div className="field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          type="email"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {error && <span className="error">{error}</span>}
      </div>
    ),
    defaultValue: '',
  },

  numberField: {
    component: ({ value, onChange, label, name, disabled, error }) => (
      <div className="field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {error && <span className="error">{error}</span>}
      </div>
    ),
    defaultValue: '',
    // Parse string input to number for form state
    parser: (value) => (value === '' ? null : parseFloat(String(value))),
    // Format number back to string for display
    formatter: (value) => (value == null ? '' : String(value)),
  },
};

// =============================================================================
// Step 2: Define Field Configuration
// =============================================================================
// Field config maps field names to their types and properties.

const config: FormFieldsConfig = {
  firstName: {
    type: 'textField',
    label: 'First Name',
  },
  lastName: {
    type: 'textField',
    label: 'Last Name',
  },
  email: {
    type: 'emailField',
    label: 'Email Address',
  },
  age: {
    type: 'numberField',
    label: 'Age',
  },
};

// =============================================================================
// Step 3: Create the Form Component
// =============================================================================

export function BasicForm() {
  const handleSubmit = (values: Record<string, unknown>) => {
    console.log('Form submitted:', values);
    // Output: { firstName: "John", lastName: "Doe", email: "john@example.com", age: 30 }
  };

  return (
    <FormalityProvider inputs={inputs}>
      <Form config={config} onSubmit={handleSubmit}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(handleSubmit)}>
            <h2>Contact Information</h2>

            {/* Fields render in the order they appear in JSX */}
            <Field name="firstName" />
            <Field name="lastName" />
            <Field name="email" />
            <Field name="age" />

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Step 4: With Initial Data (Edit Mode)
// =============================================================================

export function BasicFormWithData() {
  // Initial data - typically from an API
  const record = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    age: 28,
  };

  const handleSubmit = (values: Record<string, unknown>) => {
    console.log('Updated values:', values);
  };

  return (
    <FormalityProvider inputs={inputs}>
      <Form config={config} record={record} onSubmit={handleSubmit}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(handleSubmit)}>
            <h2>Edit Contact</h2>

            <Field name="firstName" />
            <Field name="lastName" />
            <Field name="email" />
            <Field name="age" />

            <button type="submit">Save Changes</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

export default BasicForm;
