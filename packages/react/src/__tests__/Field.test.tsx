// @formality/react - Field Component Tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from '../components/Form';
import { Field } from '../components/Field';
import { FormalityProvider } from '../components/FormalityProvider';
import type { InputConfig, FormFieldsConfig } from '@formality/core';

// Test input component with all common props
const TestInput = ({ value, onChange, disabled, label, error, ...props }: any) => (
  <div>
    {label && <label data-testid={`${props.name}-label`}>{label}</label>}
    <input
      data-testid={props.name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      {...props}
    />
    {error && <span data-testid={`${props.name}-error`}>{error}</span>}
  </div>
);

// Test switch input
const TestSwitch = ({ value, onChange, disabled, ...props }: any) => (
  <input
    type="checkbox"
    data-testid={props.name}
    checked={value ?? false}
    onChange={(e) => onChange(e.target.checked)}
    disabled={disabled}
    {...props}
  />
);

// Test inputs config
const testInputs: Record<string, InputConfig> = {
  textField: {
    component: TestInput,
    defaultValue: '',
  },
  switch: {
    component: TestSwitch,
    defaultValue: false,
  },
};

describe('Field', () => {
  describe('rendering', () => {
    it('should render the configured component', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField' } }}>
            <Field name="name" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('name')).toBeInTheDocument();
    });

    it('should resolve label from config', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField', label: 'Full Name' } }}>
            <Field name="name" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('name-label')).toHaveTextContent('Full Name');
    });

    it('should auto-generate label from field name when not specified', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ clientContact: { type: 'textField' } }}>
            <Field name="clientContact" />
          </Form>
        </FormalityProvider>
      );

      // clientContact should become "Client Contact"
      expect(screen.getByTestId('clientContact-label')).toHaveTextContent('Client Contact');
    });

    it('should not render when hidden prop is true', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField' } }}>
            <Field name="name" hidden />
          </Form>
        </FormalityProvider>
      );

      expect(screen.queryByTestId('name')).not.toBeInTheDocument();
    });

    it('should not render when field config has hidden: true', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField', hidden: true } }}>
            <Field name="name" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.queryByTestId('name')).not.toBeInTheDocument();
    });

    it('should use component prop label over config label', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField', label: 'Config Label' } }}>
            <Field name="name" label="Prop Label" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('name-label')).toHaveTextContent('Prop Label');
    });
  });

  describe('conditions', () => {
    it('should render field with conditions array', () => {
      // Verify Field accepts conditions in config
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

    it('should support visible condition in config', () => {
      // Verify Field accepts visible conditions
      const config: FormFieldsConfig = {
        conditional: {
          type: 'textField',
          conditions: [{ when: 'toggle', truthy: false, visible: false }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="conditional" />
          </Form>
        </FormalityProvider>
      );

      // Field should render (no trigger field, so condition doesn't match)
      expect(screen.getByTestId('conditional')).toBeInTheDocument();
    });

    it('should support "is" condition type in config', () => {
      // Verify Field accepts "is" conditions for exact value matching
      const config: FormFieldsConfig = {
        status: { type: 'textField' },
        dependent: {
          type: 'textField',
          conditions: [{ when: 'status', is: 'active', disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="status" />
            <Field name="dependent" />
          </Form>
        </FormalityProvider>
      );

      // Both fields should render
      expect(screen.getByTestId('status')).toBeInTheDocument();
      expect(screen.getByTestId('dependent')).toBeInTheDocument();
    });
  });

  describe('selectProps', () => {
    it('should evaluate selectProps expressions', () => {
      const config: FormFieldsConfig = {
        source: { type: 'textField' },
        target: {
          type: 'textField',
          selectProps: { placeholder: 'source' },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ source: 'Hello World' }}>
            <Field name="source" />
            <Field name="target" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('target')).toHaveAttribute('placeholder', 'Hello World');
    });

    it('should update selectProps when referenced field changes', async () => {
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

      expect(screen.getByTestId('target')).toHaveAttribute('placeholder', 'Initial');

      // Type in source field
      const user = userEvent.setup();
      await user.clear(screen.getByTestId('source'));
      await user.type(screen.getByTestId('source'), 'Updated');

      await waitFor(() => {
        expect(screen.getByTestId('target')).toHaveAttribute('placeholder', 'Updated');
      });
    });
  });

  describe('value transformation', () => {
    it('should apply parser on change', async () => {
      const parseToUpperCase = vi.fn((value: string) => value.toUpperCase());

      const inputs: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: '',
          parser: parseToUpperCase,
        },
      };

      render(
        <FormalityProvider inputs={inputs}>
          <Form config={{ name: { type: 'textField' } }}>
            {({ methods }) => (
              <>
                <Field name="name" />
                <span data-testid="value">{methods.watch('name')}</span>
              </>
            )}
          </Form>
        </FormalityProvider>
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId('name'), 'hello');

      await waitFor(() => {
        expect(screen.getByTestId('value')).toHaveTextContent('HELLO');
      });
    });

    it('should apply formatter for display', async () => {
      const formatToLower = vi.fn((value: string) =>
        typeof value === 'string' ? value.toLowerCase() : value
      );

      const inputs: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: '',
          formatter: formatToLower,
        },
      };

      render(
        <FormalityProvider inputs={inputs}>
          <Form config={{ name: { type: 'textField' } }} record={{ name: 'HELLO' }}>
            <Field name="name" />
          </Form>
        </FormalityProvider>
      );

      // Value should be formatted for display
      expect(screen.getByTestId('name')).toHaveValue('hello');
    });
  });

  describe('validation', () => {
    it('should run field-level validator on blur', async () => {
      const config: FormFieldsConfig = {
        email: {
          type: 'textField',
          validator: (value) => {
            if (typeof value === 'string' && !value.includes('@')) {
              return 'Must be a valid email';
            }
            return true;
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="email" />
          </Form>
        </FormalityProvider>
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId('email'), 'invalid');
      await user.tab(); // Trigger blur/validation

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Must be a valid email');
      });
    });

    it('should clear error when validation passes', async () => {
      const config: FormFieldsConfig = {
        email: {
          type: 'textField',
          validator: (value) => {
            if (typeof value === 'string' && !value.includes('@')) {
              return 'Must be a valid email';
            }
            return true;
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="email" />
          </Form>
        </FormalityProvider>
      );

      const user = userEvent.setup();

      // First, trigger invalid state
      await user.type(screen.getByTestId('email'), 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Now fix the value
      await user.clear(screen.getByTestId('email'));
      await user.type(screen.getByTestId('email'), 'valid@email.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('disabled prop override', () => {
    it('should use disabled prop over condition result', () => {
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

      expect(screen.getByTestId('field')).not.toBeDisabled();
    });

    it('should use disabled prop to force disable', () => {
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
  });

  describe('render prop', () => {
    it('should pass field API to render function', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField' } }}>
            <Field name="name">
              {({ fieldState, renderedField, watchers }) => (
                <div data-testid="wrapper">
                  {renderedField}
                  <span data-testid="touched">{fieldState.isTouched ? 'yes' : 'no'}</span>
                  <span data-testid="watchers">{Object.keys(watchers).length}</span>
                </div>
              )}
            </Field>
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('touched')).toHaveTextContent('no');
      expect(screen.getByTestId('watchers')).toHaveTextContent('0');
    });

    it('should provide fieldProps to render function', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField', label: 'Test Label' } }}>
            <Field name="name">
              {({ fieldProps }) => (
                <span data-testid="label">{fieldProps.label as string}</span>
              )}
            </Field>
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('label')).toHaveTextContent('Test Label');
    });

    it('should update touched state after blur', async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField' } }}>
            <Field name="name">
              {({ fieldState, renderedField }) => (
                <div data-testid="wrapper">
                  {renderedField}
                  <span data-testid="touched">{fieldState.isTouched ? 'yes' : 'no'}</span>
                </div>
              )}
            </Field>
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId('touched')).toHaveTextContent('no');

      const user = userEvent.setup();
      await user.click(screen.getByTestId('name'));
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('touched')).toHaveTextContent('yes');
      });
    });
  });

  describe('shouldRegister prop', () => {
    it('should register field by default', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField' }, other: { type: 'textField' } }}>
            {({ unusedFields }) => (
              <>
                <Field name="name" />
                <span data-testid="unused">{unusedFields.join(',')}</span>
              </>
            )}
          </Form>
        </FormalityProvider>
      );

      // 'name' is registered, so only 'other' is unused
      expect(screen.getByTestId('unused')).toHaveTextContent('other');
    });

    it('should not register field when shouldRegister={false}', () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: 'textField' }, other: { type: 'textField' } }}>
            {({ unusedFields }) => (
              <>
                <Field name="name" shouldRegister={false} />
                <span data-testid="unused">{unusedFields.join(',')}</span>
              </>
            )}
          </Form>
        </FormalityProvider>
      );

      // 'name' is not registered, so both are unused
      expect(screen.getByTestId('unused')).toHaveTextContent('name,other');
    });
  });

  describe('type override', () => {
    it('should use type prop over config type', () => {
      const config: FormFieldsConfig = {
        toggle: { type: 'textField' },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            {/* Override textField with switch */}
            <Field name="toggle" type="switch" />
          </Form>
        </FormalityProvider>
      );

      // Should render as checkbox (switch type) not text input
      expect(screen.getByTestId('toggle')).toHaveAttribute('type', 'checkbox');
    });
  });
});
