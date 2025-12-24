// @formality-ui/react - Complete Form Integration Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from '../../components/Form';
import { Field } from '../../components/Field';
import { FieldGroup } from '../../components/FieldGroup';
import { UnusedFields } from '../../components/UnusedFields';
import { FormalityProvider } from '../../components/FormalityProvider';
import type { InputConfig, FormFieldsConfig, FormConfig } from '@formality-ui/core';

// === TEST COMPONENTS ===

const TestInput = ({ value, onChange, disabled, label, error, ...props }: any) => (
  <div data-testid={`field-wrapper-${props.name}`}>
    {label && <label htmlFor={props.name}>{label}</label>}
    <input
      id={props.name}
      data-testid={props.name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-invalid={!!error}
      {...props}
    />
    {error && (
      <span data-testid={`${props.name}-error`} role="alert">
        {error}
      </span>
    )}
  </div>
);

const TestSwitch = ({ value, onChange, disabled, label, ...props }: any) => (
  <div data-testid={`field-wrapper-${props.name}`}>
    {label && <label htmlFor={props.name}>{label}</label>}
    <input
      id={props.name}
      type="checkbox"
      data-testid={props.name}
      checked={value ?? false}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      {...props}
    />
  </div>
);

const TestSelect = ({
  value,
  onChange,
  disabled,
  options = [],
  ...props
}: any) => (
  <select
    data-testid={props.name}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    {...props}
  >
    <option value="">Select...</option>
    {options.map((opt: string) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: '' },
  switch: { component: TestSwitch, defaultValue: false },
  select: { component: TestSelect, defaultValue: '' },
  decimal: {
    component: TestInput,
    defaultValue: '',
    parser: (v: string) => parseFloat(v) || 0,
    formatter: (v: number) => (typeof v === 'number' ? v.toFixed(2) : ''),
  },
};

// === INTEGRATION TESTS ===

describe('Integration: Complete Form Workflows', () => {
  describe('Multi-Field Dependencies', () => {
    it('should update dependent field when source field changes', async () => {
      const config: FormFieldsConfig = {
        client: { type: 'textField' },
        clientContact: {
          type: 'textField',
          selectProps: { placeholder: 'client' },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="client" />
            <Field name="clientContact" />
          </Form>
        </FormalityProvider>
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId('client'), 'Acme Corp');

      await waitFor(() => {
        expect(screen.getByTestId('clientContact')).toHaveAttribute(
          'placeholder',
          'Acme Corp'
        );
      });
    });

    it('should support selectProps expressions for dynamic placeholder', async () => {
      const config: FormFieldsConfig = {
        source: { type: 'textField' },
        target: {
          type: 'textField',
          selectProps: { placeholder: 'source' },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ source: 'Initial' }}>
            <Field name="source" />
            <Field name="target" />
          </Form>
        </FormalityProvider>
      );

      // Target should have placeholder from source value
      expect(screen.getByTestId('target')).toHaveAttribute('placeholder', 'Initial');
    });

    it('should configure multiple fields with conditions', () => {
      const config: FormFieldsConfig = {
        toggle: { type: 'switch' },
        field1: {
          type: 'textField',
          conditions: [{ when: 'toggle', is: true, disabled: true }],
        },
        field2: {
          type: 'textField',
          conditions: [{ when: 'toggle', is: true, disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="toggle" />
            <Field name="field1" />
            <Field name="field2" />
          </Form>
        </FormalityProvider>
      );

      // All fields should render
      expect(screen.getByTestId('toggle')).toBeInTheDocument();
      expect(screen.getByTestId('field1')).toBeInTheDocument();
      expect(screen.getByTestId('field2')).toBeInTheDocument();
    });
  });

  describe('Nested FieldGroup Conditions', () => {
    it('should support nested FieldGroup components', () => {
      const config: FormFieldsConfig = {
        targetField: { type: 'textField' },
      };

      const formConfig: FormConfig = {
        groups: {
          outerGroup: {},
          innerGroup: {},
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} formConfig={formConfig}>
            <FieldGroup name="outerGroup">
              <FieldGroup name="innerGroup">
                <Field name="targetField" />
              </FieldGroup>
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      // Both groups should have their span wrappers
      const outerSpan = document.querySelector(
        '[data-formality-group="outerGroup"]'
      );
      const innerSpan = document.querySelector(
        '[data-formality-group="innerGroup"]'
      );
      expect(outerSpan).toBeInTheDocument();
      expect(innerSpan).toBeInTheDocument();

      // Field should be nested correctly
      expect(screen.getByTestId('targetField')).toBeInTheDocument();
    });

    it('should render nested groups with correct hierarchy', () => {
      const config: FormFieldsConfig = {
        field: { type: 'textField' },
      };

      const formConfig: FormConfig = {
        groups: {
          outer: {},
          inner: {},
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} formConfig={formConfig}>
            <FieldGroup name="outer">
              <FieldGroup name="inner">
                <Field name="field" />
              </FieldGroup>
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      // Inner group should be nested inside outer group
      const outerSpan = document.querySelector(
        '[data-formality-group="outer"]'
      );
      const innerSpan = document.querySelector(
        '[data-formality-group="inner"]'
      );
      expect(outerSpan?.contains(innerSpan)).toBe(true);
    });

    it('should configure group conditions in formConfig', () => {
      const config: FormFieldsConfig = {
        toggle: { type: 'switch' },
        targetField: { type: 'textField' },
      };

      const formConfig: FormConfig = {
        groups: {
          conditionalGroup: {
            conditions: [{ when: 'toggle', truthy: true, disabled: true }],
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} formConfig={formConfig}>
            <Field name="toggle" />
            <FieldGroup name="conditionalGroup">
              <Field name="targetField" />
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      // Group and field should render
      expect(screen.getByTestId('toggle')).toBeInTheDocument();
      expect(screen.getByTestId('targetField')).toBeInTheDocument();
    });
  });

  describe('Complete Submission Workflow', () => {
    it('should call onSubmit with form values', async () => {
      const onSubmit = vi.fn();

      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} onSubmit={onSubmit}>
            {({ methods }) => (
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Field name="name" />
                <button type="submit" data-testid="submit">
                  Submit
                </button>
              </form>
            )}
          </Form>
        </FormalityProvider>
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId('name'), 'Test Item');
      await user.click(screen.getByTestId('submit'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Item',
          }),
          expect.anything()
        );
      });
    });

    it('should block submission while async validation is running', async () => {
      const onSubmit = vi.fn();

      const config: FormFieldsConfig = {
        email: {
          type: 'textField',
          validator: async (value) => {
            await new Promise((r) => setTimeout(r, 100));
            if (typeof value !== 'string' || !value.includes('@')) {
              return 'Invalid email';
            }
            return true;
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} onSubmit={onSubmit}>
            {({ methods }) => (
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Field name="email" />
                <button type="submit" data-testid="submit">
                  Submit
                </button>
              </form>
            )}
          </Form>
        </FormalityProvider>
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId('email'), 'invalid');
      await user.tab(); // Trigger blur to validate
      await user.click(screen.getByTestId('submit'));

      // Validation should fail
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'Invalid email'
        );
      });

      // onSubmit should not have been called
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should allow valid submission after fixing validation errors', async () => {
      const onSubmit = vi.fn();

      const config: FormFieldsConfig = {
        email: {
          type: 'textField',
          validator: (value) => {
            if (typeof value !== 'string' || !value.includes('@')) {
              return 'Invalid email';
            }
            return true;
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} onSubmit={onSubmit}>
            {({ methods }) => (
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Field name="email" />
                <button type="submit" data-testid="submit">
                  Submit
                </button>
              </form>
            )}
          </Form>
        </FormalityProvider>
      );

      const user = userEvent.setup();

      // First submit with invalid value
      await user.type(screen.getByTestId('email'), 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Fix the value
      await user.clear(screen.getByTestId('email'));
      await user.type(screen.getByTestId('email'), 'valid@example.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });

      // Now submit should work
      await user.click(screen.getByTestId('submit'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'valid@example.com' }),
          expect.anything()
        );
      });
    });
  });

  describe('Auto-Save Configuration', () => {
    it('should accept autoSave and debounce props', () => {
      const onSubmit = vi.fn();

      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      // Verify the Form component accepts autoSave and debounce props without error
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={config}
            autoSave={true}
            debounce={500}
            onSubmit={onSubmit}
            record={{ name: '' }}
          >
            <Field name="name" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('name')).toBeInTheDocument();
    });

    it('should expose form context with expected properties', () => {
      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} autoSave debounce={500}>
            {({ methods }) => (
              <span data-testid="has-methods">
                {typeof methods.handleSubmit === 'function' ? 'yes' : 'no'}
              </span>
            )}
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('has-methods')).toHaveTextContent('yes');
    });
  });

  describe('Value Transformation End-to-End', () => {
    it('should apply parser to transform input values', async () => {
      // Create a simple uppercase parser for testing
      const uppercaseInputs: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: '',
          parser: (v: string) => (typeof v === 'string' ? v.toUpperCase() : v),
        },
      };

      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      render(
        <FormalityProvider inputs={uppercaseInputs}>
          <Form config={config}>
            {({ methods }) => (
              <>
                <Field name="name" />
                <span data-testid="stored-value">{methods.watch('name')}</span>
              </>
            )}
          </Form>
        </FormalityProvider>
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId('name'), 'hello');

      await waitFor(() => {
        // Value should be parsed (uppercased)
        expect(screen.getByTestId('stored-value')).toHaveTextContent('HELLO');
      });
    });

    it('should apply formatter to display values', () => {
      // Create a simple lowercase formatter for testing
      const lowercaseInputs: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: '',
          formatter: (v: string) =>
            typeof v === 'string' ? v.toLowerCase() : v,
        },
      };

      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      render(
        <FormalityProvider inputs={lowercaseInputs}>
          <Form config={config} record={{ name: 'HELLO' }}>
            <Field name="name" />
          </Form>
        </FormalityProvider>
      );

      // Value should be formatted (lowercased) for display
      expect(screen.getByTestId('name')).toHaveValue('hello');
    });
  });

  describe('Field Ordering in UnusedFields', () => {
    it('should render unused fields in order property sequence', () => {
      const config: FormFieldsConfig = {
        third: { type: 'textField', order: 30 },
        first: { type: 'textField', order: 10 },
        second: { type: 'textField', order: 20 },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <div data-testid="container">
              <UnusedFields />
            </div>
          </Form>
        </FormalityProvider>
      );

      const container = screen.getByTestId('container');
      const wrappers = container.querySelectorAll(
        '[data-testid^="field-wrapper-"]'
      );

      expect(wrappers[0]).toHaveAttribute('data-testid', 'field-wrapper-first');
      expect(wrappers[1]).toHaveAttribute('data-testid', 'field-wrapper-second');
      expect(wrappers[2]).toHaveAttribute('data-testid', 'field-wrapper-third');
    });

    it('should maintain order when some fields are manually placed', () => {
      const config: FormFieldsConfig = {
        fourth: { type: 'textField', order: 40 },
        first: { type: 'textField', order: 10 },
        third: { type: 'textField', order: 30 },
        second: { type: 'textField', order: 20 },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="third" />
            <div data-testid="container">
              <UnusedFields />
            </div>
          </Form>
        </FormalityProvider>
      );

      // 'third' is manually placed, so unused fields are first, second, fourth
      const container = screen.getByTestId('container');
      const wrappers = container.querySelectorAll(
        '[data-testid^="field-wrapper-"]'
      );

      expect(wrappers[0]).toHaveAttribute('data-testid', 'field-wrapper-first');
      expect(wrappers[1]).toHaveAttribute('data-testid', 'field-wrapper-second');
      expect(wrappers[2]).toHaveAttribute('data-testid', 'field-wrapper-fourth');
    });
  });

  describe('Label Resolution Pipeline', () => {
    it('should auto-generate labels from camelCase field names', () => {
      const config: FormFieldsConfig = {
        clientContact: { type: 'textField' },
        minGrossMargin: { type: 'textField' },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="clientContact" />
            <Field name="minGrossMargin" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByText('Client Contact')).toBeInTheDocument();
      expect(screen.getByText('Min Gross Margin')).toBeInTheDocument();
    });

    it('should use explicit label from config over auto-generated', () => {
      const config: FormFieldsConfig = {
        clientContact: {
          type: 'textField',
          label: 'Primary Contact',
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="clientContact" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByText('Primary Contact')).toBeInTheDocument();
      expect(screen.queryByText('Client Contact')).not.toBeInTheDocument();
    });

    it('should use Field prop label over config label', () => {
      const config: FormFieldsConfig = {
        clientContact: {
          type: 'textField',
          label: 'Config Label',
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="clientContact" label="Prop Label" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByText('Prop Label')).toBeInTheDocument();
      expect(screen.queryByText('Config Label')).not.toBeInTheDocument();
    });

    it('should handle common abbreviations in labels', () => {
      const config: FormFieldsConfig = {
        userId: { type: 'textField' },
        apiKey: { type: 'textField' },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="userId" />
            <Field name="apiKey" />
          </Form>
        </FormalityProvider>
      );

      // Check that abbreviations are properly handled
      expect(screen.getByText('User Id')).toBeInTheDocument();
      expect(screen.getByText('Api Key')).toBeInTheDocument();
    });
  });

  describe('Condition Cascade', () => {
    it('should allow Field disabled prop override to enable when condition disables', () => {
      // This test verifies that the Field component's disabled prop can override conditions
      // Pattern from existing Field tests that's known to work
      const config: FormFieldsConfig = {
        toggle: { type: 'switch' },
        field: {
          type: 'textField',
          conditions: [{ when: 'toggle', truthy: true, disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ toggle: true }}>
            <Field name="toggle" />
            {/* Force disabled=false even though condition would disable */}
            <Field name="field" disabled={false} />
          </Form>
        </FormalityProvider>
      );

      // Field should NOT be disabled because we explicitly set disabled={false}
      expect(screen.getByTestId('field')).not.toBeDisabled();
    });

    it('should allow Field disabled prop to force disable', () => {
      const config: FormFieldsConfig = {
        field: { type: 'textField' },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" disabled />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('field')).toBeDisabled();
    });

    it('should render fields with condition configuration', () => {
      // Verify Field accepts conditions in config without error
      const config: FormFieldsConfig = {
        toggle: { type: 'switch' },
        dependent: {
          type: 'textField',
          conditions: [{ when: 'toggle', truthy: true, disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="toggle" />
            <Field name="dependent" />
          </Form>
        </FormalityProvider>
      );

      // Both fields should render
      expect(screen.getByTestId('toggle')).toBeInTheDocument();
      expect(screen.getByTestId('dependent')).toBeInTheDocument();
    });
  });

  describe('Initial Value Resolution', () => {
    it('should prioritize record values over default values', () => {
      const config: FormFieldsConfig = {
        name: { type: 'textField' },
        active: { type: 'switch' },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ name: 'John', active: true }}>
            {({ methods }) => (
              <div>
                <span data-testid="name-value">{methods.getValues('name')}</span>
                <span data-testid="active-value">
                  {methods.getValues('active') ? 'yes' : 'no'}
                </span>
              </div>
            )}
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('name-value')).toHaveTextContent('John');
      expect(screen.getByTestId('active-value')).toHaveTextContent('yes');
    });

    it('should use input default value when record value is missing', () => {
      const config: FormFieldsConfig = {
        name: { type: 'textField' },
        active: { type: 'switch' },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{}}>
            {({ methods }) => (
              <div>
                <span data-testid="name-value">
                  {methods.getValues('name') || 'empty'}
                </span>
                <span data-testid="active-value">
                  {methods.getValues('active') ? 'yes' : 'no'}
                </span>
              </div>
            )}
          </Form>
        </FormalityProvider>
      );

      // Default values from testInputs
      expect(screen.getByTestId('name-value')).toHaveTextContent('empty');
      expect(screen.getByTestId('active-value')).toHaveTextContent('no');
    });
  });
});
