/**
 * Example 09: String Expressions vs Callback Functions
 * =====================================================
 * This example demonstrates that MOST configuration options accept BOTH
 * string expressions AND callback functions. Understanding when to use
 * each is key to effective Formality usage.
 *
 * STRING EXPRESSIONS:
 * - Auto-infer field dependencies (no subscribesTo needed)
 * - More concise for simple cases
 * - Serializable (can be stored as JSON)
 * - Limited to expression syntax
 *
 * CALLBACK FUNCTIONS:
 * - Full JavaScript power (loops, conditionals, API calls)
 * - Access to React Hook Form methods
 * - Type safety with TypeScript
 * - REQUIRES explicit subscribesTo declaration
 */

import React, { memo } from 'react';
import {
  FormalityProvider,
  Form,
  Field,
  type InputConfig,
  type FormFieldsConfig,
  type FormConfig,
  type FormState,
} from '@formality-ui/react';

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
  numberField: {
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
// COMPARISON 1: selectProps
// =============================================================================
// Both achieve the same result - compute props dynamically

const selectPropsConfig: FormFieldsConfig = {
  // Source fields
  firstName: { type: 'textField', label: 'First Name' },
  lastName: { type: 'textField', label: 'Last Name' },
  basePrice: { type: 'numberField', label: 'Base Price' },
  quantity: { type: 'numberField', label: 'Quantity' },

  // STRING EXPRESSION: Auto-infers dependencies on firstName, lastName
  // Concise, but limited to expression syntax
  fullNameString: {
    type: 'textField',
    label: 'Full Name (String Expression)',
    selectProps: {
      // String concatenation in expression
      value: 'firstName + " " + lastName',
      disabled: 'true',
    },
  },

  // FUNCTION: Must declare subscribesTo explicitly
  // More verbose, but full JavaScript power
  fullNameFunction: {
    type: 'textField',
    label: 'Full Name (Function)',
    subscribesTo: ['firstName', 'lastName'], // REQUIRED for functions!
    selectProps: {
      value: ({ fields }: FormState) => {
        const first = fields.firstName?.value ?? '';
        const last = fields.lastName?.value ?? '';
        // Can do complex string manipulation
        return `${first} ${last}`.trim().toUpperCase();
      },
      disabled: () => true,
    },
  },

  // STRING EXPRESSION: Simple arithmetic
  totalString: {
    type: 'numberField',
    label: 'Total (String Expression)',
    selectProps: {
      value: 'basePrice * quantity',
      disabled: 'true',
    },
  },

  // FUNCTION: Complex calculation with rounding, currency formatting, etc.
  totalFunction: {
    type: 'numberField',
    label: 'Total (Function)',
    subscribesTo: ['basePrice', 'quantity'],
    selectProps: {
      value: ({ fields }: FormState) => {
        const price = fields.basePrice?.value ?? 0;
        const qty = fields.quantity?.value ?? 0;
        // Apply tax, round to 2 decimals, etc.
        const subtotal = price * qty;
        const tax = subtotal * 0.08;
        return Math.round((subtotal + tax) * 100) / 100;
      },
      disabled: () => true,
    },
  },
};

export function SelectPropsComparisonExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={selectPropsConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>selectProps: String vs Function</h3>

            <div className="input-section">
              <h4>Source Fields</h4>
              <Field name="firstName" />
              <Field name="lastName" />
              <Field name="basePrice" />
              <Field name="quantity" />
            </div>

            <div className="comparison-section">
              <div className="string-column">
                <h4>String Expressions</h4>
                <code>value: 'firstName + " " + lastName'</code>
                <Field name="fullNameString" />
                <code>value: 'basePrice * quantity'</code>
                <Field name="totalString" />
              </div>

              <div className="function-column">
                <h4>Callback Functions</h4>
                <code>{`value: ({ fields }) => \`\${first} \${last}\`.toUpperCase()`}</code>
                <Field name="fullNameFunction" />
                <code>{`value: ({ fields }) => (price * qty) * 1.08`}</code>
                <Field name="totalFunction" />
              </div>
            </div>

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// COMPARISON 2: Condition when/selectWhen
// =============================================================================

const conditionWhenConfig: FormFieldsConfig = {
  age: { type: 'numberField', label: 'Age' },
  hasLicense: { type: 'switch', label: 'Has License' },
  yearsExperience: { type: 'numberField', label: 'Years Experience' },

  // STRING: when + is/truthy
  simpleConditionField: {
    type: 'textField',
    label: 'Simple Condition (String)',
    conditions: [
      {
        when: 'hasLicense', // Simple field reference
        truthy: false,      // Check if falsy
        disabled: true,
      },
    ],
  },

  // STRING: selectWhen for complex expressions
  complexExpressionField: {
    type: 'textField',
    label: 'Complex Expression (String)',
    conditions: [
      {
        // Expression: multiple fields, operators
        selectWhen: 'age >= 21 && hasLicense && yearsExperience >= 2',
        set: 'Qualified!',
      },
      {
        selectWhen: '!(age >= 21 && hasLicense && yearsExperience >= 2)',
        set: 'Not qualified',
      },
    ],
  },

  // FUNCTION: selectWhen with callback
  functionConditionField: {
    type: 'textField',
    label: 'Function Condition',
    subscribesTo: ['age', 'hasLicense', 'yearsExperience'], // REQUIRED!
    conditions: [
      {
        // Function for complex business logic
        selectWhen: ({ fields }: FormState) => {
          const age = fields.age?.value ?? 0;
          const licensed = fields.hasLicense?.value ?? false;
          const exp = fields.yearsExperience?.value ?? 0;

          // Complex logic that would be hard in string expression
          if (age >= 25 && licensed && exp >= 5) return true; // Senior
          if (age >= 21 && licensed && exp >= 2) return true; // Standard
          return false;
        },
        set: 'Qualified via function!',
      },
    ],
  },
};

export function ConditionWhenComparisonExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={conditionWhenConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Conditions: when vs selectWhen (String vs Function)</h3>

            <div className="input-section">
              <Field name="age" />
              <Field name="hasLicense" />
              <Field name="yearsExperience" />
            </div>

            <div className="comparison-section">
              <div className="example">
                <h4>Simple: when + truthy (String)</h4>
                <pre>{`when: 'hasLicense', truthy: false, disabled: true`}</pre>
                <Field name="simpleConditionField" />
              </div>

              <div className="example">
                <h4>Complex: selectWhen (String Expression)</h4>
                <pre>{`selectWhen: 'age >= 21 && hasLicense && yearsExperience >= 2'`}</pre>
                <Field name="complexExpressionField" />
              </div>

              <div className="example">
                <h4>Function: selectWhen (Callback)</h4>
                <pre>{`selectWhen: ({ fields }) => { /* complex logic */ }`}</pre>
                <Field name="functionConditionField" />
              </div>
            </div>

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// COMPARISON 3: set vs selectSet
// =============================================================================

const setValueConfig: FormFieldsConfig = {
  useDefault: { type: 'switch', label: 'Use Default Address' },
  quantity: { type: 'numberField', label: 'Quantity' },
  unitPrice: { type: 'numberField', label: 'Unit Price' },
  discountPercent: { type: 'numberField', label: 'Discount %' },

  // STATIC SET: set to literal value
  addressStatic: {
    type: 'textField',
    label: 'Address (Static set)',
    conditions: [
      {
        when: 'useDefault',
        truthy: true,
        set: '123 Main Street, Default City', // Static value
        disabled: true,
      },
    ],
  },

  // STRING selectSet: expression-based value
  totalString: {
    type: 'numberField',
    label: 'Total (String selectSet)',
    conditions: [
      {
        selectWhen: 'quantity && unitPrice',
        // String expression for calculation
        selectSet: 'quantity * unitPrice * (1 - discountPercent / 100)',
      },
    ],
    disabled: true,
  },

  // FUNCTION selectSet: complex logic
  totalFunction: {
    type: 'numberField',
    label: 'Total (Function selectSet)',
    subscribesTo: ['quantity', 'unitPrice', 'discountPercent'],
    conditions: [
      {
        selectWhen: ({ fields }: FormState) =>
          fields.quantity?.value && fields.unitPrice?.value,
        // Function with complex business rules
        selectSet: ({ fields }: FormState) => {
          const qty = fields.quantity?.value ?? 0;
          const price = fields.unitPrice?.value ?? 0;
          const discount = fields.discountPercent?.value ?? 0;

          let subtotal = qty * price;

          // Volume discount tiers (complex logic)
          if (qty >= 100) subtotal *= 0.9;  // 10% volume discount
          else if (qty >= 50) subtotal *= 0.95; // 5% volume discount

          // Apply percentage discount
          subtotal *= (1 - discount / 100);

          // Round to 2 decimals
          return Math.round(subtotal * 100) / 100;
        },
      },
    ],
    disabled: true,
  },
};

export function SetValueComparisonExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={setValueConfig} onSubmit={console.log}>
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(console.log)}>
            <h3>Setting Values: set vs selectSet (String vs Function)</h3>

            <div className="input-section">
              <Field name="useDefault" />
              <Field name="quantity" />
              <Field name="unitPrice" />
              <Field name="discountPercent" />
            </div>

            <div className="comparison-section">
              <div className="example">
                <h4>Static: set (Literal Value)</h4>
                <pre>{`set: '123 Main Street, Default City'`}</pre>
                <Field name="addressStatic" />
              </div>

              <div className="example">
                <h4>Dynamic: selectSet (String Expression)</h4>
                <pre>{`selectSet: 'quantity * unitPrice * (1 - discountPercent / 100)'`}</pre>
                <Field name="totalString" />
              </div>

              <div className="example">
                <h4>Complex: selectSet (Function)</h4>
                <pre>{`selectSet: ({ fields }) => { /* volume discounts, rounding */ }`}</pre>
                <Field name="totalFunction" />
                <small>Try quantity &gt;= 50 for volume discount!</small>
              </div>
            </div>

            <button type="submit">Submit</button>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// COMPARISON 4: selectDefaultFieldProps
// =============================================================================

const defaultFieldPropsConfig: FormFieldsConfig = {
  globalToggle: { type: 'switch', label: 'Enable All Fields' },
  field1: { type: 'textField' },
  field2: { type: 'textField' },
  field3: { type: 'textField' },
};

// STRING form config
const stringFormConfig: FormConfig = {
  selectDefaultFieldProps: {
    // String expression: evaluated for each field
    disabled: '!globalToggle',
    // Access field's own name via props
    label: 'props.name',
  },
};

// FUNCTION form config (equivalent behavior)
const functionFormConfig: FormConfig = {
  selectDefaultFieldProps: {
    // Functions receive form state
    disabled: ({ fields }: FormState) => !fields.globalToggle?.value,
    // Can access field name via props in context
    label: ({ props }: FormState) => {
      const name = props?.name ?? '';
      // Humanize: "firstName" -> "First Name"
      return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
    },
  },
};

export function DefaultFieldPropsComparisonExample() {
  return (
    <FormalityProvider inputs={inputs}>
      <div className="side-by-side">
        <div className="form-column">
          <h4>String selectDefaultFieldProps</h4>
          <pre>{`disabled: '!globalToggle', label: 'props.name'`}</pre>
          <Form config={defaultFieldPropsConfig} formConfig={stringFormConfig} onSubmit={console.log}>
            {({ methods }) => (
              <form onSubmit={methods.handleSubmit(console.log)}>
                <Field name="globalToggle" />
                <Field name="field1" />
                <Field name="field2" />
                <Field name="field3" />
              </form>
            )}
          </Form>
        </div>

        <div className="form-column">
          <h4>Function selectDefaultFieldProps</h4>
          <pre>{`disabled: ({ fields }) => !fields.globalToggle?.value`}</pre>
          <Form config={defaultFieldPropsConfig} formConfig={functionFormConfig} onSubmit={console.log}>
            {({ methods }) => (
              <form onSubmit={methods.handleSubmit(console.log)}>
                <Field name="globalToggle" />
                <Field name="field1" />
                <Field name="field2" />
                <Field name="field3" />
              </form>
            )}
          </Form>
        </div>
      </div>
    </FormalityProvider>
  );
}

// =============================================================================
// SUMMARY: When to Use Each
// =============================================================================

export function WhenToUseGuide() {
  return (
    <div className="guide">
      <h2>When to Use String Expressions vs Functions</h2>

      <table>
        <thead>
          <tr>
            <th>Use Case</th>
            <th>String Expression</th>
            <th>Callback Function</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Simple field reference</td>
            <td><code>'fieldName'</code></td>
            <td>Overkill - use string</td>
          </tr>
          <tr>
            <td>Property access</td>
            <td><code>'client.id'</code></td>
            <td>Overkill - use string</td>
          </tr>
          <tr>
            <td>Basic arithmetic</td>
            <td><code>'price * quantity'</code></td>
            <td>Use function for rounding/formatting</td>
          </tr>
          <tr>
            <td>Comparisons</td>
            <td><code>'age &gt;= 21'</code></td>
            <td>Overkill - use string</td>
          </tr>
          <tr>
            <td>Logical operators</td>
            <td><code>'a && b || c'</code></td>
            <td>Use function for complex branching</td>
          </tr>
          <tr>
            <td>Ternary</td>
            <td><code>'signed ? "Yes" : "No"'</code></td>
            <td>Use function for multiple branches</td>
          </tr>
          <tr>
            <td>String manipulation</td>
            <td><code>'first + " " + last'</code></td>
            <td><strong>Recommended</strong> for toUpperCase, trim, etc.</td>
          </tr>
          <tr>
            <td>Complex business logic</td>
            <td>Not possible</td>
            <td><strong>Required</strong></td>
          </tr>
          <tr>
            <td>API calls in logic</td>
            <td>Not possible</td>
            <td><strong>Required</strong></td>
          </tr>
          <tr>
            <td>Access RHF methods</td>
            <td>Not possible</td>
            <td><strong>Required</strong></td>
          </tr>
          <tr>
            <td>Type safety</td>
            <td>No type checking</td>
            <td><strong>Full TypeScript support</strong></td>
          </tr>
          <tr>
            <td>Serializable config</td>
            <td><strong>Yes - JSON safe</strong></td>
            <td>No - cannot serialize functions</td>
          </tr>
        </tbody>
      </table>

      <h3>Key Rule</h3>
      <p>
        <strong>When using callback functions, you MUST declare <code>subscribesTo</code>!</strong>
      </p>
      <pre>{`// WRONG - function without subscribesTo
{
  selectProps: {
    value: ({ fields }) => fields.price?.value * fields.qty?.value
  }
  // Missing subscribesTo! Field won't update when price/qty change.
}

// CORRECT - function with explicit subscribesTo
{
  subscribesTo: ['price', 'qty'], // Tell Formality what to watch
  selectProps: {
    value: ({ fields }) => fields.price?.value * fields.qty?.value
  }
}`}</pre>
    </div>
  );
}

export default {
  SelectPropsComparisonExample,
  ConditionWhenComparisonExample,
  SetValueComparisonExample,
  DefaultFieldPropsComparisonExample,
  WhenToUseGuide,
};
