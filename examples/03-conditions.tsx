/**
 * Example 03: Conditional Logic
 * ==============================
 * This example demonstrates all condition features:
 * - when: Watch a single field
 * - selectWhen: Watch complex expressions
 * - is: Exact value matching
 * - truthy: Boolean coercion matching
 * - disabled: Disable field when condition matches
 * - visible: Show/hide field when condition matches
 * - set: Set static value when condition matches
 * - selectSet: Set dynamic value from expression
 * - subscribesTo: Manual subscriptions for function-based conditions
 * - FieldGroup: Apply conditions to multiple fields
 * - Nested FieldGroups: Hierarchical conditional logic
 */

import React, { memo } from 'react';
import {
  FormalityProvider,
  Form,
  Field,
  FieldGroup,
  type InputConfig,
  type FormFieldsConfig,
  type FormConfig,
} from '@formality/react';

// =============================================================================
// Minimal Input Types for Examples
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
          className={disabled ? 'disabled' : ''}
        />
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
  select: {
    component: memo(({ value, onChange, label, options, disabled }) => (
      <div className="field">
        <label>{label}</label>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select...</option>
          {options?.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )),
    defaultValue: '',
  },
  number: {
    component: memo(({ value, onChange, label, disabled }) => (
      <div className="field">
        <label>{label}</label>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          disabled={disabled}
        />
      </div>
    )),
    defaultValue: null,
  },
};

// =============================================================================
// Example 1: Basic Visibility Condition
// =============================================================================
// Show/hide a field based on another field's value

const visibilityConfig: FormFieldsConfig = {
  showDetails: {
    type: 'switch',
    label: 'Show Additional Details',
  },
  additionalDetails: {
    type: 'textField',
    label: 'Additional Details',
    conditions: [
      {
        when: 'showDetails',
        truthy: false,
        visible: false, // Hidden when showDetails is false
      },
    ],
  },
};

export function VisibilityExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={visibilityConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Toggle Visibility</h3>
            <Field name="showDetails" />
            <Field name="additionalDetails" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 2: Disabled State Condition
// =============================================================================
// Disable fields based on another field's value

const disabledConfig: FormFieldsConfig = {
  isLocked: {
    type: 'switch',
    label: 'Lock Form',
  },
  editableField: {
    type: 'textField',
    label: 'Editable When Unlocked',
    conditions: [
      {
        when: 'isLocked',
        truthy: true,
        disabled: true, // Disabled when isLocked is true
      },
    ],
  },
};

export function DisabledExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={disabledConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Disable Field</h3>
            <Field name="isLocked" />
            <Field name="editableField" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 3: Exact Value Matching with 'is'
// =============================================================================
// React to specific values, not just truthy/falsy

const exactMatchConfig: FormFieldsConfig = {
  paymentMethod: {
    type: 'select',
    label: 'Payment Method',
    props: {
      options: ['Credit Card', 'Bank Transfer', 'PayPal', 'Check'],
    },
  },
  cardNumber: {
    type: 'textField',
    label: 'Card Number',
    conditions: [
      {
        when: 'paymentMethod',
        is: 'Credit Card', // Only show when exactly 'Credit Card'
        visible: true,
      },
      {
        when: 'paymentMethod',
        is: 'Credit Card',
        truthy: false, // When NOT 'Credit Card', hide
        visible: false,
      },
    ],
  },
  bankAccount: {
    type: 'textField',
    label: 'Bank Account Number',
    conditions: [
      {
        when: 'paymentMethod',
        is: 'Bank Transfer',
        visible: true,
      },
      {
        when: 'paymentMethod',
        is: 'Bank Transfer',
        truthy: false,
        visible: false,
      },
    ],
  },
  paypalEmail: {
    type: 'textField',
    label: 'PayPal Email',
    conditions: [
      {
        when: 'paymentMethod',
        is: 'PayPal',
        visible: true,
      },
      {
        when: 'paymentMethod',
        is: 'PayPal',
        truthy: false,
        visible: false,
      },
    ],
  },
};

export function ExactMatchExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={exactMatchConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Payment Method (Exact Match)</h3>
            <Field name="paymentMethod" />
            <Field name="cardNumber" />
            <Field name="bankAccount" />
            <Field name="paypalEmail" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 4: Setting Values with 'set'
// =============================================================================
// Automatically set a field's value when conditions are met

const setValueConfig: FormFieldsConfig = {
  useDefaultAddress: {
    type: 'switch',
    label: 'Use Default Shipping Address',
  },
  shippingAddress: {
    type: 'textField',
    label: 'Shipping Address',
    conditions: [
      {
        when: 'useDefaultAddress',
        truthy: true,
        set: '123 Main Street, City, Country', // Set static value
        disabled: true, // Also disable when using default
      },
    ],
  },
};

export function SetValueExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={setValueConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Set Value from Condition</h3>
            <Field name="useDefaultAddress" />
            <Field name="shippingAddress" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 5: Dynamic Values with 'selectSet'
// =============================================================================
// Set a field's value based on an expression

const selectSetConfig: FormFieldsConfig = {
  basePrice: {
    type: 'number',
    label: 'Base Price ($)',
  },
  quantity: {
    type: 'number',
    label: 'Quantity',
  },
  applyDiscount: {
    type: 'switch',
    label: 'Apply 20% Discount',
  },
  totalPrice: {
    type: 'number',
    label: 'Total Price ($)',
    conditions: [
      {
        when: 'applyDiscount',
        is: false,
        // Calculate: basePrice * quantity
        selectSet: 'basePrice * quantity',
      },
      {
        when: 'applyDiscount',
        is: true,
        // Calculate with discount: basePrice * quantity * 0.8
        selectSet: 'basePrice * quantity * 0.8',
      },
    ],
  },
};

export function SelectSetExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={selectSetConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Dynamic Calculated Value</h3>
            <Field name="basePrice" />
            <Field name="quantity" />
            <Field name="applyDiscount" />
            <Field name="totalPrice" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 6: Complex Expressions with 'selectWhen'
// =============================================================================
// Watch multiple fields with complex logic

const complexConditionConfig: FormFieldsConfig = {
  age: {
    type: 'number',
    label: 'Age',
  },
  hasLicense: {
    type: 'switch',
    label: 'Has Driving License',
  },
  yearsExperience: {
    type: 'number',
    label: 'Years of Driving Experience',
  },
  insuranceDiscount: {
    type: 'textField',
    label: 'Insurance Discount',
    conditions: [
      {
        // Complex condition: age >= 25 AND has license AND 3+ years experience
        selectWhen: 'age >= 25 && hasLicense && yearsExperience >= 3',
        set: 'Eligible for 15% discount!',
      },
      {
        // Default case
        selectWhen: '!(age >= 25 && hasLicense && yearsExperience >= 3)',
        set: 'No discount available',
      },
    ],
  },
};

export function ComplexConditionExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={complexConditionConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Complex Conditions (selectWhen)</h3>
            <Field name="age" />
            <Field name="hasLicense" />
            <Field name="yearsExperience" />
            <Field name="insuranceDiscount" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 7: FieldGroup Conditions
// =============================================================================
// Apply conditions to multiple fields at once

const fieldGroupConfig: FormFieldsConfig = {
  accountType: {
    type: 'select',
    label: 'Account Type',
    props: {
      options: ['Personal', 'Business'],
    },
  },
  // These fields will be controlled by the FieldGroup
  companyName: {
    type: 'textField',
    label: 'Company Name',
  },
  taxId: {
    type: 'textField',
    label: 'Tax ID',
  },
  companySize: {
    type: 'select',
    label: 'Company Size',
    props: {
      options: ['1-10', '11-50', '51-200', '200+'],
    },
  },
};

const fieldGroupFormConfig: FormConfig = {
  groups: {
    businessFields: {
      conditions: [
        {
          when: 'accountType',
          is: 'Personal', // When Personal, hide business fields
          visible: false,
        },
      ],
    },
  },
};

export function FieldGroupExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={fieldGroupConfig} formConfig={fieldGroupFormConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>FieldGroup Conditions</h3>
            <Field name="accountType" />

            {/* All fields in this group share the same conditions */}
            <FieldGroup name="businessFields">
              <Field name="companyName" />
              <Field name="taxId" />
              <Field name="companySize" />
            </FieldGroup>

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 8: Nested FieldGroups
// =============================================================================
// Hierarchical conditions that accumulate

const nestedGroupConfig: FormFieldsConfig = {
  enableSection: {
    type: 'switch',
    label: 'Enable Advanced Options',
  },
  enableSubsection: {
    type: 'switch',
    label: 'Enable Expert Settings',
  },
  advancedOption1: {
    type: 'textField',
    label: 'Advanced Option 1',
  },
  advancedOption2: {
    type: 'textField',
    label: 'Advanced Option 2',
  },
  expertOption1: {
    type: 'textField',
    label: 'Expert Option 1',
  },
  expertOption2: {
    type: 'textField',
    label: 'Expert Option 2',
  },
};

const nestedGroupFormConfig: FormConfig = {
  groups: {
    advancedSection: {
      conditions: [
        {
          when: 'enableSection',
          truthy: false,
          disabled: true,
        },
      ],
    },
    expertSection: {
      conditions: [
        {
          when: 'enableSubsection',
          truthy: false,
          disabled: true,
        },
      ],
    },
  },
};

export function NestedFieldGroupExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={nestedGroupConfig} formConfig={nestedGroupFormConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Nested FieldGroups</h3>
            <p>Expert options require BOTH toggles to be enabled</p>

            <Field name="enableSection" />

            <FieldGroup name="advancedSection">
              <Field name="advancedOption1" />
              <Field name="advancedOption2" />

              <Field name="enableSubsection" />

              {/* Nested group: inherits disabled from parent */}
              <FieldGroup name="expertSection">
                <Field name="expertOption1" />
                <Field name="expertOption2" />
              </FieldGroup>
            </FieldGroup>

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 9: Function-Based Conditions with subscribesTo
// =============================================================================
// For complex logic that can't be expressed as strings

const functionConditionConfig: FormFieldsConfig = {
  firstName: {
    type: 'textField',
    label: 'First Name',
  },
  lastName: {
    type: 'textField',
    label: 'Last Name',
  },
  fullName: {
    type: 'textField',
    label: 'Full Name (Auto-generated)',
    conditions: [
      {
        // Function-based selectSet for complex string operations
        selectWhen: 'firstName || lastName', // Trigger when either changes
        subscribesTo: ['firstName', 'lastName'], // Required for function conditions
        selectSet: ({ fields }) => {
          const first = fields.firstName?.value ?? '';
          const last = fields.lastName?.value ?? '';
          return `${first} ${last}`.trim();
        },
        disabled: true, // Read-only computed field
      },
    ],
  },
};

export function FunctionConditionExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={functionConditionConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Function-Based Conditions</h3>
            <Field name="firstName" />
            <Field name="lastName" />
            <Field name="fullName" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

export default {
  VisibilityExample,
  DisabledExample,
  ExactMatchExample,
  SetValueExample,
  SelectSetExample,
  ComplexConditionExample,
  FieldGroupExample,
  NestedFieldGroupExample,
  FunctionConditionExample,
};
