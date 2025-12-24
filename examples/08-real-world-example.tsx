/**
 * Example 08: Real-World Form
 * ============================
 * A comprehensive example combining multiple features:
 * - Complex field types with validation
 * - Cascading dependencies (client → contact → position)
 * - Conditional field groups
 * - Auto-calculated fields
 * - Auto-save
 * - Dynamic form title
 * - Value transformation
 *
 * This example models a "Quote" form similar to a staffing/recruitment system.
 */

import React, { memo, useCallback, useState } from 'react';
import {
  FormalityProvider,
  Form,
  Field,
  FieldGroup,
  type InputConfig,
  type FormFieldsConfig,
  type FormConfig,
  type ValidatorsConfig,
  type ErrorMessagesConfig,
} from '@formality/react';

// =============================================================================
// Mock Data & API Hooks
// =============================================================================

const offices = [
  { id: 1, name: 'New York Office' },
  { id: 2, name: 'Chicago Office' },
  { id: 3, name: 'Los Angeles Office' },
];

const clients = [
  { id: 1, name: 'Acme Corporation', defaultMargin: 0.25 },
  { id: 2, name: 'Globex Industries', defaultMargin: 0.30 },
  { id: 3, name: 'Initech LLC', defaultMargin: 0.20 },
];

const contactsByClient: Record<number, Array<{ id: number; fullName: string; email: string }>> = {
  1: [
    { id: 101, fullName: 'John Smith', email: 'john@acme.com' },
    { id: 102, fullName: 'Jane Doe', email: 'jane@acme.com' },
  ],
  2: [
    { id: 201, fullName: 'Bob Wilson', email: 'bob@globex.com' },
  ],
  3: [
    { id: 301, fullName: 'Alice Brown', email: 'alice@initech.com' },
    { id: 302, fullName: 'Charlie Green', email: 'charlie@initech.com' },
  ],
};

const positions = [
  { id: 1, title: 'Software Engineer', jobCode: 'SE-001' },
  { id: 2, title: 'Project Manager', jobCode: 'PM-001' },
  { id: 3, title: 'Data Analyst', jobCode: 'DA-001' },
];

const placementTypes = [
  { id: 'temp', name: 'Temporary' },
  { id: 'perm', name: 'Permanent' },
  { id: 'contract', name: 'Contract-to-Hire' },
];

// Simulated API hooks
const useOffices = () => ({ data: offices, isLoading: false });
const useClients = () => ({ data: clients, isLoading: false });
const useContacts = (clientId: number | null) => ({
  data: clientId ? contactsByClient[clientId] || [] : [],
  isLoading: false,
});
const usePositions = () => ({ data: positions, isLoading: false });
const usePlacementTypes = () => ({ data: placementTypes, isLoading: false });

// =============================================================================
// Input Components
// =============================================================================

const inputs: Record<string, InputConfig> = {
  textField: {
    component: memo(({ value, onChange, label, disabled, error }) => (
      <div className={`field ${error ? 'has-error' : ''}`}>
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

  select: {
    component: memo(({
      value,
      onChange,
      label,
      disabled,
      error,
      useOptions,
      queryParams,
      labelKey = 'name',
      secondaryLabelKey,
    }) => {
      const { data: options = [], isLoading } = useOptions?.(queryParams) ?? { data: [], isLoading: false };

      return (
        <div className={`field ${error ? 'has-error' : ''}`}>
          <label>{label}</label>
          <select
            value={value?.id ?? ''}
            onChange={(e) => {
              const selected = options.find((o: any) => o.id === (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)));
              onChange(selected ?? null);
            }}
            disabled={disabled || isLoading}
          >
            <option value="">{isLoading ? 'Loading...' : 'Select...'}</option>
            {options.map((opt: any) => (
              <option key={opt.id} value={opt.id}>
                {opt[labelKey]}
                {secondaryLabelKey && opt[secondaryLabelKey] && ` (${opt[secondaryLabelKey]})`}
              </option>
            ))}
          </select>
          {error && <span className="error">{error}</span>}
        </div>
      );
    }),
    defaultValue: null,
    valueField: 'id',
    getSubmitField: (name) => `${name}Id`,
  },

  buttonGroup: {
    component: memo(({ value, onChange, label, disabled, useOptions }) => {
      const { data: options = [] } = useOptions?.() ?? { data: [] };

      return (
        <div className="field button-group">
          <label>{label}</label>
          <div className="buttons">
            {options.map((opt: { id: string; name: string }) => (
              <button
                key={opt.id}
                type="button"
                className={value?.id === opt.id ? 'selected' : ''}
                onClick={() => onChange(opt)}
                disabled={disabled}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      );
    }),
    defaultValue: null,
    valueField: 'id',
    getSubmitField: (name) => `${name}Id`,
    debounce: false,
  },

  switch: {
    component: memo(({ checked, onChange, label, disabled }) => (
      <label className={`switch ${disabled ? 'disabled' : ''}`}>
        <input
          type="checkbox"
          checked={checked ?? false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="switch-label">{label}</span>
      </label>
    )),
    defaultValue: false,
    inputFieldProp: 'checked',
    debounce: false,
  },

  decimal: {
    component: memo(({ value, onChange, label, disabled, error, prefix, suffix }) => (
      <div className={`field ${error ? 'has-error' : ''}`}>
        <label>{label}</label>
        <div className="input-with-affixes">
          {prefix && <span className="prefix">{prefix}</span>}
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
          {suffix && <span className="suffix">{suffix}</span>}
        </div>
        {error && <span className="error">{error}</span>}
      </div>
    )),
    defaultValue: '',
    parser: 'float',
    formatter: 'float',
  },

  percent: {
    component: memo(({ value, onChange, label, disabled, error }) => (
      <div className={`field ${error ? 'has-error' : ''}`}>
        <label>{label}</label>
        <div className="input-with-affixes">
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
          <span className="suffix">%</span>
        </div>
        {error && <span className="error">{error}</span>}
      </div>
    )),
    defaultValue: '',
    parser: 'float',
    formatter: 'float',
  },
};

// =============================================================================
// Parsers & Formatters
// =============================================================================

const parsers = {
  float: (value: unknown) => {
    if (value === '' || value == null) return null;
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
  },
};

const formatters = {
  float: (value: unknown) => {
    if (value == null) return '';
    return (value as number).toFixed(2);
  },
};

// =============================================================================
// Validators
// =============================================================================

const validators: ValidatorsConfig = {
  required: (value) => {
    if (value === undefined || value === null || value === '' || value === false) {
      return { type: 'required' };
    }
    return true;
  },
  positiveNumber: (value) => {
    if (value != null && Number(value) <= 0) {
      return { type: 'positiveNumber' };
    }
    return true;
  },
  maxMargin: (value) => {
    if (value != null && Number(value) > 100) {
      return { type: 'maxMargin' };
    }
    return true;
  },
};

const errorMessages: ErrorMessagesConfig = {
  required: 'This field is required',
  positiveNumber: 'Must be a positive number',
  maxMargin: 'Margin cannot exceed 100%',
};

// =============================================================================
// Field Configuration
// =============================================================================

const quoteConfig: FormFieldsConfig = {
  // Office selection
  office: {
    type: 'select',
    label: 'Office',
    props: { useOptions: useOffices },
    validator: 'required',
    order: 10,
  },

  // Client (enables contact field)
  client: {
    type: 'select',
    label: 'Client',
    props: { useOptions: useClients },
    validator: 'required',
    order: 20,
  },

  // Contact (depends on client)
  clientContact: {
    type: 'select',
    label: 'Client Contact',
    props: {
      useOptions: useContacts,
      labelKey: 'fullName',
    },
    selectProps: {
      queryParams: 'client.id',
      disabled: '!client',
    },
    validator: 'required',
    order: 30,
  },

  // Position
  position: {
    type: 'select',
    label: 'Position',
    props: {
      useOptions: usePositions,
      labelKey: 'title',
      secondaryLabelKey: 'jobCode',
    },
    validator: 'required',
    order: 40,
  },

  // Placement Type (button group)
  placementType: {
    type: 'buttonGroup',
    label: 'Placement Type',
    props: { useOptions: usePlacementTypes },
    validator: 'required',
    order: 50,
  },

  // Compliance switches
  davisBacon: {
    type: 'switch',
    label: 'Davis-Bacon Wages',
    order: 60,
  },
  operatingAgreement: {
    type: 'switch',
    label: 'Operating Agreement Required',
    order: 70,
  },
  holdHarmless: {
    type: 'switch',
    label: 'Hold Harmless Agreement',
    // Auto-set to false when not signed
    conditions: [
      {
        when: 'signed',
        is: false,
        set: false,
      },
    ],
    order: 80,
  },

  // Rate fields
  minBillRate: {
    type: 'decimal',
    label: 'Min Bill Rate',
    props: { prefix: '$' },
    validator: ['required', 'positiveNumber'],
    order: 90,
  },
  maxBillRate: {
    type: 'decimal',
    label: 'Max Bill Rate',
    props: { prefix: '$' },
    order: 100,
  },

  // Margin fields
  minGrossMarginPercent: {
    type: 'percent',
    label: 'Min Gross Margin (%)',
    validator: ['required', 'maxMargin'],
    order: 110,
  },
  maxGrossMarginPercent: {
    type: 'percent',
    label: 'Max Gross Margin (%)',
    validator: 'maxMargin',
    order: 120,
  },
  minGrossMarginDollars: {
    type: 'decimal',
    label: 'Min Gross Margin ($)',
    props: { prefix: '$' },
    // Auto-calculate from bill rate and margin %
    conditions: [
      {
        selectWhen: 'minBillRate && minGrossMarginPercent',
        selectSet: 'minBillRate * (minGrossMarginPercent / 100)',
      },
    ],
    disabled: true,
    order: 130,
  },
  maxGrossMarginDollars: {
    type: 'decimal',
    label: 'Max Gross Margin ($)',
    props: { prefix: '$' },
    conditions: [
      {
        selectWhen: 'maxBillRate && maxGrossMarginPercent',
        selectSet: 'maxBillRate * (maxGrossMarginPercent / 100)',
      },
    ],
    disabled: true,
    order: 140,
  },

  // Status switches
  signed: {
    type: 'switch',
    label: 'Quote Signed',
    order: 150,
  },
  creditApp: {
    type: 'switch',
    label: 'Credit Application',
    // Complex condition: auto-set based on multiple fields
    conditions: [
      {
        when: 'signed',
        is: true,
        selectSet: 'davisBacon && operatingAgreement',
      },
    ],
    order: 160,
  },

  // Fields that only appear when signed
  inSystem: {
    type: 'switch',
    label: 'Entered in System',
    order: 170,
  },
  ccipCcop: {
    type: 'switch',
    label: 'CCIP/CCOP Verified',
    order: 180,
  },
};

// =============================================================================
// Form Configuration
// =============================================================================

const quoteFormConfig: FormConfig = {
  // Dynamic title based on record
  selectTitle: 'record.client ? "Edit Quote: " + record.client.name : "New Quote"',

  // Group configuration
  groups: {
    signedOnlyFields: {
      conditions: [
        {
          when: 'signed',
          is: false,
          visible: false,
        },
      ],
    },
  },

  // Default field props
  defaultFieldProps: {
    className: 'quote-field',
  },
};

// =============================================================================
// The Form Component
// =============================================================================

interface QuoteRecord {
  office?: { id: number; name: string };
  client?: { id: number; name: string };
  clientContact?: { id: number; fullName: string };
  position?: { id: number; title: string };
  placementType?: { id: string; name: string };
  minBillRate?: number;
  maxBillRate?: number;
  minGrossMarginPercent?: number;
  maxGrossMarginPercent?: number;
  signed?: boolean;
  davisBacon?: boolean;
  operatingAgreement?: boolean;
}

interface QuoteFormProps {
  record?: QuoteRecord;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  autoSave?: boolean;
}

export function QuoteForm({ record, onSubmit, autoSave = false }: QuoteFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSubmit = useCallback(async (values: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      await onSubmit(values);
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [onSubmit]);

  return (
    <FormalityProvider
      inputs={inputs}
      parsers={parsers}
      formatters={formatters}
      validators={validators}
      errorMessages={errorMessages}
    >
      <Form
        config={quoteConfig}
        formConfig={quoteFormConfig}
        record={record}
        onSubmit={handleSubmit}
        autoSave={autoSave}
        debounce={2000}
      >
        {({ methods, resolvedTitle }) => (
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="quote-form">
            <header className="form-header">
              <h2>{resolvedTitle}</h2>
              {autoSave && (
                <div className="save-status">
                  {isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
                </div>
              )}
            </header>

            <section className="form-section">
              <h3>Basic Information</h3>
              <div className="field-row">
                <Field name="office" />
                <Field name="client" />
              </div>
              <div className="field-row">
                <Field name="clientContact" />
                <Field name="position" />
              </div>
              <Field name="placementType" />
            </section>

            <section className="form-section">
              <h3>Compliance</h3>
              <div className="switch-group">
                <Field name="davisBacon" />
                <Field name="operatingAgreement" />
                <Field name="holdHarmless" />
              </div>
            </section>

            <section className="form-section">
              <h3>Rates & Margins</h3>
              <div className="field-grid">
                <Field name="minBillRate" />
                <Field name="maxBillRate" />
                <Field name="minGrossMarginPercent" />
                <Field name="maxGrossMarginPercent" />
                <Field name="minGrossMarginDollars" />
                <Field name="maxGrossMarginDollars" />
              </div>
            </section>

            <section className="form-section">
              <h3>Status</h3>
              <div className="switch-group">
                <Field name="signed" />
                <Field name="creditApp" />
              </div>

              {/* These fields only show when quote is signed */}
              <FieldGroup name="signedOnlyFields">
                <div className="switch-group signed-fields">
                  <Field name="inSystem" />
                  <Field name="ccipCcop" />
                </div>
              </FieldGroup>
            </section>

            {!autoSave && (
              <footer className="form-footer">
                <button
                  type="submit"
                  disabled={isSaving || !methods.formState.isValid}
                >
                  {isSaving ? 'Saving...' : 'Save Quote'}
                </button>
              </footer>
            )}
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Demo: New Quote
// =============================================================================

export function NewQuoteDemo() {
  const handleSubmit = async (values: Record<string, unknown>) => {
    console.log('Creating quote:', values);
    await new Promise((r) => setTimeout(r, 500));
  };

  return (
    <div className="demo">
      <h1>New Quote Demo</h1>
      <QuoteForm onSubmit={handleSubmit} />
    </div>
  );
}

// =============================================================================
// Demo: Edit Quote with Auto-Save
// =============================================================================

export function EditQuoteDemo() {
  const existingQuote: QuoteRecord = {
    office: { id: 1, name: 'New York Office' },
    client: { id: 1, name: 'Acme Corporation' },
    clientContact: { id: 101, fullName: 'John Smith' },
    position: { id: 1, title: 'Software Engineer' },
    placementType: { id: 'contract', name: 'Contract-to-Hire' },
    minBillRate: 75,
    maxBillRate: 125,
    minGrossMarginPercent: 25,
    maxGrossMarginPercent: 35,
    signed: true,
    davisBacon: false,
    operatingAgreement: true,
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    console.log('Updating quote:', values);
    await new Promise((r) => setTimeout(r, 500));
  };

  return (
    <div className="demo">
      <h1>Edit Quote Demo (Auto-Save)</h1>
      <QuoteForm record={existingQuote} onSubmit={handleSubmit} autoSave={true} />
    </div>
  );
}

export default {
  QuoteForm,
  NewQuoteDemo,
  EditQuoteDemo,
};
