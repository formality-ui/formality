/**
 * Example 04: Validation System
 * ==============================
 * This example demonstrates all validation features:
 * - Named validators (defined in provider)
 * - Inline validator functions
 * - Async validators (API calls, debounced checks)
 * - Validator composition (multiple validators per field)
 * - Type-level validation (on input configs)
 * - Field-level validation (on field configs)
 * - Custom error messages
 * - Error message resolution by type
 */

import React, { memo } from 'react';
import {
  FormalityProvider,
  Form,
  Field,
  type InputConfig,
  type FormFieldsConfig,
  type ValidatorsConfig,
  type ErrorMessagesConfig,
} from '@formality-ui/react';

// =============================================================================
// Input Types with Built-in Error Display
// =============================================================================

const inputs: Record<string, InputConfig> = {
  textField: {
    component: memo(({ value, onChange, label, name, error, disabled }) => (
      <div className={`field ${error ? 'has-error' : ''}`}>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {error && <span className="error">{error}</span>}
      </div>
    )),
    defaultValue: '',
  },
  emailField: {
    component: memo(({ value, onChange, label, name, error }) => (
      <div className={`field ${error ? 'has-error' : ''}`}>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          type="email"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {error && <span className="error">{error}</span>}
      </div>
    )),
    defaultValue: '',
    // Type-level validator: ALL email fields require valid email format
    validator: 'email',
  },
  passwordField: {
    component: memo(({ value, onChange, label, name, error, isValidating }) => (
      <div className={`field ${error ? 'has-error' : ''}`}>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          type="password"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {isValidating && <span className="loading">Checking...</span>}
        {error && <span className="error">{error}</span>}
      </div>
    )),
    defaultValue: '',
  },
  numberField: {
    component: memo(({ value, onChange, label, name, error }) => (
      <div className={`field ${error ? 'has-error' : ''}`}>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        />
        {error && <span className="error">{error}</span>}
      </div>
    )),
    defaultValue: '',
  },
};

// =============================================================================
// Named Validators (Defined in Provider)
// =============================================================================

const validators: ValidatorsConfig = {
  // Simple required validator
  required: (value) => {
    if (value === undefined || value === null || value === '' || value === false) {
      return { type: 'required' }; // Returns type for message lookup
    }
    return true;
  },

  // Email format validator
  email: (value) => {
    if (!value) return true; // Let 'required' handle empty values
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(String(value))) {
      return { type: 'email' };
    }
    return true;
  },

  // Parameterized validator factory: minLength(5)
  minLength: (min: number) => (value) => {
    if (!value) return true;
    if (String(value).length < min) {
      return { type: 'minLength', message: `Must be at least ${min} characters` };
    }
    return true;
  },

  // Parameterized validator factory: maxLength(100)
  maxLength: (max: number) => (value) => {
    if (!value) return true;
    if (String(value).length > max) {
      return { type: 'maxLength', message: `Must be at most ${max} characters` };
    }
    return true;
  },

  // Parameterized validator factory: min(0)
  min: (minVal: number) => (value) => {
    if (value === '' || value === null || value === undefined) return true;
    if (Number(value) < minVal) {
      return { type: 'min', message: `Must be at least ${minVal}` };
    }
    return true;
  },

  // Parameterized validator factory: max(100)
  max: (maxVal: number) => (value) => {
    if (value === '' || value === null || value === undefined) return true;
    if (Number(value) > maxVal) {
      return { type: 'max', message: `Must be at most ${maxVal}` };
    }
    return true;
  },

  // Pattern validator
  pattern: (regex: RegExp, message: string) => (value) => {
    if (!value) return true;
    if (!regex.test(String(value))) {
      return message;
    }
    return true;
  },

  // Cross-field validation (access other form values)
  matchField: (fieldName: string) => (value, formValues) => {
    if (!value) return true;
    if (value !== formValues[fieldName]) {
      return { type: 'match', message: `Must match ${fieldName}` };
    }
    return true;
  },
};

// =============================================================================
// Error Messages (Centralized)
// =============================================================================

const errorMessages: ErrorMessagesConfig = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: 'Input is too short',
  maxLength: 'Input is too long',
  min: 'Value is too small',
  max: 'Value is too large',
  match: 'Fields do not match',
  // Can also be functions for dynamic messages (not shown here)
};

// =============================================================================
// Example 1: Basic Validation
// =============================================================================

const basicConfig: FormFieldsConfig = {
  name: {
    type: 'textField',
    label: 'Full Name',
    validator: 'required', // Named validator
  },
  email: {
    type: 'emailField', // Has type-level 'email' validator
    label: 'Email',
    validator: 'required', // Adds required on top of email validation
  },
  age: {
    type: 'numberField',
    label: 'Age',
    // Compose multiple validators
    validator: ['required', validators.min(18), validators.max(120)],
  },
};

export function BasicValidationExample() {
  return (
    <FormalityProvider
      inputs={inputs}
      validators={validators}
      errorMessages={errorMessages}
    >
      <Form config={basicConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Basic Validation</h3>
            <Field name="name" />
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
// Example 2: Inline Validator Functions
// =============================================================================

const inlineConfig: FormFieldsConfig = {
  username: {
    type: 'textField',
    label: 'Username',
    validator: [
      'required',
      // Inline validator function
      (value) => {
        if (!/^[a-zA-Z0-9_]+$/.test(String(value))) {
          return 'Username can only contain letters, numbers, and underscores';
        }
        return true;
      },
      validators.minLength(3),
      validators.maxLength(20),
    ],
  },
  bio: {
    type: 'textField',
    label: 'Bio',
    // Single inline validator
    validator: (value) => {
      if (value && String(value).length > 500) {
        return 'Bio must be 500 characters or less';
      }
      return true;
    },
  },
};

export function InlineValidationExample() {
  return (
    <FormalityProvider
      inputs={inputs}
      validators={validators}
      errorMessages={errorMessages}
    >
      <Form config={inlineConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Inline Validators</h3>
            <Field name="username" />
            <Field name="bio" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 3: Async Validation
// =============================================================================

// Simulated API check
const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
  const taken = ['admin', 'root', 'system', 'administrator'];
  return !taken.includes(username.toLowerCase());
};

const checkEmailRegistered = async (email: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const registered = ['test@example.com', 'admin@example.com'];
  return !registered.includes(email.toLowerCase());
};

const asyncConfig: FormFieldsConfig = {
  username: {
    type: 'textField',
    label: 'Username',
    validator: [
      'required',
      validators.minLength(3),
      // Async validator
      async (value) => {
        if (!value) return true;
        const available = await checkUsernameAvailable(String(value));
        if (!available) {
          return 'This username is already taken';
        }
        return true;
      },
    ],
  },
  email: {
    type: 'emailField',
    label: 'Email',
    validator: [
      'required',
      async (value) => {
        if (!value) return true;
        const available = await checkEmailRegistered(String(value));
        if (!available) {
          return 'This email is already registered';
        }
        return true;
      },
    ],
  },
};

export function AsyncValidationExample() {
  return (
    <FormalityProvider
      inputs={inputs}
      validators={validators}
      errorMessages={errorMessages}
    >
      <Form config={asyncConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Async Validation (Check Availability)</h3>
            <p>Try: admin, test@example.com (already taken)</p>
            <Field name="username" />
            <Field name="email" />
            <button type="submit" disabled={methods.formState.isValidating}>
              {methods.formState.isValidating ? 'Checking...' : 'Submit'}
            </button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 4: Cross-Field Validation
// =============================================================================

const crossFieldConfig: FormFieldsConfig = {
  password: {
    type: 'passwordField',
    label: 'Password',
    validator: [
      'required',
      validators.minLength(8),
      // Custom password strength validator
      (value) => {
        const pwd = String(value);
        if (!/[A-Z]/.test(pwd)) return 'Must contain uppercase letter';
        if (!/[a-z]/.test(pwd)) return 'Must contain lowercase letter';
        if (!/[0-9]/.test(pwd)) return 'Must contain number';
        return true;
      },
    ],
  },
  confirmPassword: {
    type: 'passwordField',
    label: 'Confirm Password',
    validator: [
      'required',
      // Cross-field: must match password
      validators.matchField('password'),
    ],
  },
};

export function CrossFieldValidationExample() {
  return (
    <FormalityProvider
      inputs={inputs}
      validators={validators}
      errorMessages={errorMessages}
    >
      <Form config={crossFieldConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Cross-Field Validation</h3>
            <Field name="password" />
            <Field name="confirmPassword" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 5: Conditional Validation
// =============================================================================

const conditionalValidationConfig: FormFieldsConfig = {
  hasCompany: {
    type: 'textField', // Using as a checkbox stand-in
    label: 'Are you registering as a business?',
  },
  companyName: {
    type: 'textField',
    label: 'Company Name',
    // This field is only required when hasCompany is truthy
    validator: (value, formValues) => {
      if (formValues.hasCompany && !value) {
        return 'Company name is required for business registration';
      }
      return true;
    },
    conditions: [
      {
        when: 'hasCompany',
        truthy: false,
        visible: false,
      },
    ],
  },
  taxId: {
    type: 'textField',
    label: 'Tax ID',
    validator: (value, formValues) => {
      if (formValues.hasCompany && !value) {
        return 'Tax ID is required for business registration';
      }
      if (value && !/^\d{2}-\d{7}$/.test(String(value))) {
        return 'Tax ID must be in format XX-XXXXXXX';
      }
      return true;
    },
    conditions: [
      {
        when: 'hasCompany',
        truthy: false,
        visible: false,
      },
    ],
  },
};

export function ConditionalValidationExample() {
  return (
    <FormalityProvider
      inputs={inputs}
      validators={validators}
      errorMessages={errorMessages}
    >
      <Form config={conditionalValidationConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Conditional Validation</h3>
            <p>Type "yes" to show business fields</p>
            <Field name="hasCompany" />
            <Field name="companyName" />
            <Field name="taxId" />
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 6: All Validator Return Types
// =============================================================================

const allReturnTypesConfig: FormFieldsConfig = {
  returnTrue: {
    type: 'textField',
    label: 'Returns true (always valid)',
    validator: () => true,
  },
  returnUndefined: {
    type: 'textField',
    label: 'Returns undefined (always valid)',
    validator: () => undefined,
  },
  returnFalse: {
    type: 'textField',
    label: 'Returns false (generic error)',
    validator: (value) => (value === 'invalid' ? false : true),
  },
  returnString: {
    type: 'textField',
    label: 'Returns string (custom message)',
    validator: (value) => (value === 'error' ? 'Custom error message' : true),
  },
  returnTypeObject: {
    type: 'textField',
    label: 'Returns { type } (lookup message)',
    validator: (value) => (value === 'type' ? { type: 'required' } : true),
  },
  returnTypeWithMessage: {
    type: 'textField',
    label: 'Returns { type, message }',
    validator: (value) =>
      value === 'both' ? { type: 'custom', message: 'Inline message' } : true,
  },
};

export function ValidatorReturnTypesExample() {
  return (
    <FormalityProvider
      inputs={inputs}
      validators={validators}
      errorMessages={errorMessages}
    >
      <Form config={allReturnTypesConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Validator Return Types</h3>
            <p>Type the trigger word to see each error type</p>
            <Field name="returnTrue" />
            <Field name="returnUndefined" />
            <Field name="returnFalse" /> {/* Type: "invalid" */}
            <Field name="returnString" /> {/* Type: "error" */}
            <Field name="returnTypeObject" /> {/* Type: "type" */}
            <Field name="returnTypeWithMessage" /> {/* Type: "both" */}
            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

export default {
  BasicValidationExample,
  InlineValidationExample,
  AsyncValidationExample,
  CrossFieldValidationExample,
  ConditionalValidationExample,
  ValidatorReturnTypesExample,
};
