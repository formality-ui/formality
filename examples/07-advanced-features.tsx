/**
 * Example 07: Advanced Features
 * ==============================
 * This example demonstrates advanced features:
 * - UnusedFields: Render fields not explicitly placed in JSX
 * - Field ordering with `order` property
 * - recordKey: Map API field names to form field names
 * - Form title with selectTitle
 * - provideState: Pass field state to component
 * - passSubscriptions: Pass subscribed field states
 * - Field render function (children as function)
 * - Custom input templates
 */

import React, { memo } from 'react';
import {
  FormalityProvider,
  Form,
  Field,
  FieldGroup,
  UnusedFields,
  type InputConfig,
  type FormFieldsConfig,
  type FormConfig,
  type InputTemplateProps,
} from '@formality/react';

// =============================================================================
// Input Types
// =============================================================================

const inputs: Record<string, InputConfig> = {
  textField: {
    component: memo(({ value, onChange, label, disabled, error }) => (
      <div className="field">
        <label>{label}</label>
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {error && <span className="error">{error}</span>}
      </div>
    )),
    defaultValue: '',
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

  // Input with state access
  textFieldWithState: {
    component: memo(({ value, onChange, label, state, formState }) => (
      <div className="field field-with-state">
        <label>{label}</label>
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {/* Access field metadata via state */}
        <div className="field-metadata">
          <span>Touched: {state?.isTouched ? 'Yes' : 'No'}</span>
          <span>Dirty: {state?.isDirty ? 'Yes' : 'No'}</span>
          <span>Valid: {!state?.invalid ? 'Yes' : 'No'}</span>
        </div>
      </div>
    )),
    defaultValue: '',
  },

  // Input with subscription access
  textFieldWithSubscriptions: {
    component: memo(({ value, onChange, label, subscribedState }) => (
      <div className="field field-with-subs">
        <label>{label}</label>
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {/* Access other fields' states */}
        {subscribedState && (
          <div className="subscribed-state">
            <strong>Watching:</strong>
            {Object.entries(subscribedState).map(([name, state]) => (
              <div key={name}>
                {name}: {JSON.stringify((state as any)?.value)}
              </div>
            ))}
          </div>
        )}
      </div>
    )),
    defaultValue: '',
  },

  numberField: {
    component: memo(({ value, onChange, label }) => (
      <div className="field">
        <label>{label}</label>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        />
      </div>
    )),
    defaultValue: null,
  },
};

// =============================================================================
// Example 1: UnusedFields Component
// =============================================================================
// Render fields from config that aren't explicitly placed in JSX

const unusedFieldsConfig: FormFieldsConfig = {
  // These will be rendered explicitly
  firstName: { type: 'textField', label: 'First Name' },
  lastName: { type: 'textField', label: 'Last Name' },

  // These will be rendered by UnusedFields
  email: { type: 'textField', label: 'Email' },
  phone: { type: 'textField', label: 'Phone' },
  address: { type: 'textField', label: 'Address' },
  city: { type: 'textField', label: 'City' },
  zipCode: { type: 'textField', label: 'ZIP Code' },
};

export function UnusedFieldsExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={unusedFieldsConfig} onSubmit={console.log}>
        {({ methods, unusedFields }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>UnusedFields Component</h3>
            <p>Only first/last name are explicit. Rest rendered by UnusedFields.</p>

            <div className="explicit-section">
              <h4>Explicit Fields:</h4>
              <Field name="firstName" />
              <Field name="lastName" />
            </div>

            <div className="unused-section">
              <h4>Auto-Rendered Fields ({unusedFields.length}):</h4>
              <UnusedFields />
            </div>

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 2: Field Ordering
// =============================================================================
// Control order of fields rendered by UnusedFields

const orderedFieldsConfig: FormFieldsConfig = {
  // Use order property to control UnusedFields rendering order
  zipCode: { type: 'textField', label: 'ZIP Code', order: 50 },
  city: { type: 'textField', label: 'City', order: 40 },
  state: { type: 'textField', label: 'State', order: 45 },
  street: { type: 'textField', label: 'Street Address', order: 30 },
  country: { type: 'textField', label: 'Country', order: 60 },
  apartment: { type: 'textField', label: 'Apt/Suite', order: 35 },

  // Negative order for priority fields
  urgentNote: { type: 'textField', label: 'Urgent Note', order: -10 },
};

export function FieldOrderingExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={orderedFieldsConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Field Ordering</h3>
            <p>Fields sorted by `order` property (negative first, then ascending)</p>

            {/* All fields rendered via UnusedFields, in order */}
            <UnusedFields />

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 3: recordKey for API Field Mapping
// =============================================================================
// Map differently-named API fields to form fields

const recordKeyConfig: FormFieldsConfig = {
  clientContact: {
    type: 'textField',
    label: 'Client Contact',
    // API returns 'clientContactId', but form uses 'clientContact'
    recordKey: 'clientContactName', // Read from record.clientContactName
  },
  position: {
    type: 'textField',
    label: 'Position',
    recordKey: 'jobTitle', // Read from record.jobTitle
  },
  startDate: {
    type: 'textField',
    label: 'Start Date',
    recordKey: 'employmentStartDate', // Read from record.employmentStartDate
  },
};

// API returns data with different field names
const apiRecord = {
  clientContactName: 'John Smith',
  jobTitle: 'Senior Developer',
  employmentStartDate: '2024-01-15',
};

export function RecordKeyExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={recordKeyConfig} record={apiRecord} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>recordKey: API Field Mapping</h3>
            <p>API fields have different names than form fields</p>

            <div className="api-preview">
              <strong>API Record:</strong>
              <pre>{JSON.stringify(apiRecord, null, 2)}</pre>
            </div>

            <Field name="clientContact" />
            <Field name="position" />
            <Field name="startDate" />

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 4: Form Title with selectTitle
// =============================================================================
// Dynamic form title based on record data

const formTitleConfig: FormFieldsConfig = {
  firstName: { type: 'textField', label: 'First Name' },
  lastName: { type: 'textField', label: 'Last Name' },
  email: { type: 'textField', label: 'Email' },
};

const formTitleFormConfig: FormConfig = {
  // Static title
  // title: 'Edit User',

  // Dynamic title from expression
  selectTitle: 'record.firstName ? "Edit: " + record.firstName + " " + record.lastName : "New User"',
};

export function FormTitleExample() {
  const existingUser = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
  };

  return (
    <FormalityProvider inputs={inputs}>
      {/* With existing record - shows "Edit: Jane Doe" */}
      <Form
        config={formTitleConfig}
        formConfig={formTitleFormConfig}
        record={existingUser}
        onSubmit={console.log}
      >
        {({ methods, resolvedTitle }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>{resolvedTitle}</h3>
            <Field name="firstName" />
            <Field name="lastName" />
            <Field name="email" />
            <button type="submit">Save</button>
          </form>
        )}
      </Form>

      <hr />

      {/* Without record - shows "New User" */}
      <Form
        config={formTitleConfig}
        formConfig={formTitleFormConfig}
        onSubmit={console.log}
      >
        {({ methods, resolvedTitle }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>{resolvedTitle}</h3>
            <Field name="firstName" />
            <Field name="lastName" />
            <Field name="email" />
            <button type="submit">Create</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 5: provideState - Pass Field State to Component
// =============================================================================

const provideStateConfig: FormFieldsConfig = {
  username: {
    type: 'textFieldWithState',
    label: 'Username',
    provideState: true, // Pass field state (isTouched, isDirty, etc.)
    validator: (value) => {
      if (!value) return 'Required';
      if (String(value).length < 3) return 'Too short';
      return true;
    },
  },
  email: {
    type: 'textFieldWithState',
    label: 'Email',
    provideState: true,
    validator: (value) => {
      if (!value) return 'Required';
      return true;
    },
  },
};

export function ProvideStateExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={provideStateConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>provideState: Field State Access</h3>
            <p>Components receive isTouched, isDirty, isValid metadata</p>

            <Field name="username" />
            <Field name="email" />

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 6: passSubscriptions - Access Other Fields' States
// =============================================================================

const passSubscriptionsConfig: FormFieldsConfig = {
  baseValue: {
    type: 'numberField',
    label: 'Base Value',
  },
  multiplier: {
    type: 'numberField',
    label: 'Multiplier',
  },
  result: {
    type: 'textFieldWithSubscriptions',
    label: 'Result (watching base and multiplier)',
    subscribesTo: ['baseValue', 'multiplier'],
    passSubscriptions: true, // Pass subscribed fields' states
    passSubscriptionsAs: 'subscribedState', // Prop name for states
    disabled: true,
  },
};

export function PassSubscriptionsExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={passSubscriptionsConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>passSubscriptions: Watch Other Fields</h3>
            <p>Result field can see baseValue and multiplier states</p>

            <Field name="baseValue" />
            <Field name="multiplier" />
            <Field name="result" />

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 7: Field Render Function (Children as Function)
// =============================================================================

const renderFunctionConfig: FormFieldsConfig = {
  status: {
    type: 'textField',
    label: 'Status',
  },
};

export function FieldRenderFunctionExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={renderFunctionConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Field Render Function</h3>
            <p>Access field internals for custom rendering</p>

            <Field name="status">
              {({ fieldState, renderedField, fieldProps, watchers }) => (
                <div className="custom-field-wrapper">
                  {/* Render the actual field */}
                  {renderedField}

                  {/* Custom additions based on field state */}
                  <div className="field-debug">
                    <p>Field Props: {JSON.stringify(Object.keys(fieldProps))}</p>
                    <p>Is Touched: {fieldState.isTouched ? 'Yes' : 'No'}</p>
                    <p>Is Dirty: {fieldState.isDirty ? 'Yes' : 'No'}</p>
                    <p>Has Error: {fieldState.error ? 'Yes' : 'No'}</p>
                    <p>Watchers: {JSON.stringify(watchers)}</p>
                  </div>
                </div>
              )}
            </Field>

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 8: Custom Input Templates
// =============================================================================

// Template wraps input component with consistent styling
const CustomTemplate = memo(({
  Field: InputComponent,
  fieldProps,
  fieldState,
  formState,
}: InputTemplateProps) => (
  <div className={`custom-template ${fieldState.error ? 'has-error' : ''}`}>
    <div className="template-header">
      <span className="field-name">{fieldProps.name}</span>
      {fieldState.isDirty && <span className="dirty-badge">Modified</span>}
    </div>

    <InputComponent {...fieldProps} />

    <div className="template-footer">
      {fieldState.error && (
        <span className="error-text">{fieldState.error.message}</span>
      )}
      {!fieldState.error && fieldState.isTouched && (
        <span className="valid-text">Looks good!</span>
      )}
    </div>
  </div>
));

const templateInputs: Record<string, InputConfig> = {
  ...inputs,
  templatedTextField: {
    ...inputs.textField,
    template: CustomTemplate, // Use custom template
  },
};

const templateConfig: FormFieldsConfig = {
  username: {
    type: 'templatedTextField',
    label: 'Username',
    validator: (value) => {
      if (!value) return { type: 'required', message: 'Username is required' };
      return true;
    },
  },
  bio: {
    type: 'templatedTextField',
    label: 'Bio',
  },
};

export function CustomTemplateExample() {
  return (
    <FormalityProvider inputs={templateInputs}>
      <Form config={templateConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Custom Input Templates</h3>
            <p>Templates wrap inputs with consistent error display and styling</p>

            <Field name="username" />
            <Field name="bio" />

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

export default {
  UnusedFieldsExample,
  FieldOrderingExample,
  RecordKeyExample,
  FormTitleExample,
  ProvideStateExample,
  PassSubscriptionsExample,
  FieldRenderFunctionExample,
  CustomTemplateExample,
};
