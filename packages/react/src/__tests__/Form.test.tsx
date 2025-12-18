// @formality/react - Form Component Tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from '../components/Form';
import { FormalityProvider } from '../components/FormalityProvider';
import { useFormContext } from '../context/FormContext';
import type { InputConfig, FormFieldsConfig } from '@formality/core';

// Test input component
const TestInput = ({ value, onChange, ...props }: any) => (
  <input
    data-testid={props.name}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
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
    component: ({ value, onChange }) => (
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked)}
        data-testid="switch"
      />
    ),
    defaultValue: false,
  },
};

// Consumer component for testing context
function ContextConsumer() {
  const ctx = useFormContext();
  return (
    <div>
      <span data-testid="config-keys">{Object.keys(ctx.config).join(',')}</span>
      <span data-testid="unused-fields">{ctx.unusedFields.join(',')}</span>
    </div>
  );
}

describe('Form', () => {
  const config: FormFieldsConfig = {
    name: { type: 'textField' },
    email: { type: 'textField' },
    active: { type: 'switch' },
  };

  it('should provide FormContext to children', () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <ContextConsumer />
        </Form>
      </FormalityProvider>
    );

    expect(screen.getByTestId('config-keys')).toHaveTextContent(
      'name,email,active'
    );
  });

  it('should track unused fields', () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <ContextConsumer />
        </Form>
      </FormalityProvider>
    );

    // All fields are unused initially
    expect(screen.getByTestId('unused-fields')).toHaveTextContent(
      'name,email,active'
    );
  });

  it('should expose render API via function children', () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config} formConfig={{ title: 'Test Form' }}>
          {({ resolvedTitle, unusedFields }) => (
            <div>
              <span data-testid="title">{resolvedTitle}</span>
              <span data-testid="unused">{unusedFields.length}</span>
            </div>
          )}
        </Form>
      </FormalityProvider>
    );

    expect(screen.getByTestId('title')).toHaveTextContent('Test Form');
    expect(screen.getByTestId('unused')).toHaveTextContent('3');
  });

  it('should initialize with default values from input config', () => {
    const configWithDefaults: FormFieldsConfig = {
      name: { type: 'textField' },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={configWithDefaults}>
          {({ methods }) => {
            const value = methods.getValues('name');
            return (
              <span data-testid="value">
                {value === '' ? 'empty-string' : value ?? 'undefined'}
              </span>
            );
          }}
        </Form>
      </FormalityProvider>
    );

    // Default value should be from InputConfig.defaultValue (empty string)
    expect(screen.getByTestId('value')).toHaveTextContent('empty-string');
  });

  it('should initialize with record values', () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config} record={{ name: 'John', email: 'john@example.com' }}>
          {({ methods }) => (
            <div>
              <span data-testid="name">{methods.getValues('name')}</span>
              <span data-testid="email">{methods.getValues('email')}</span>
            </div>
          )}
        </Form>
      </FormalityProvider>
    );

    expect(screen.getByTestId('name')).toHaveTextContent('John');
    expect(screen.getByTestId('email')).toHaveTextContent('john@example.com');
  });

  it('should call onSubmit with form values', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: 'textField' } }}
          onSubmit={onSubmit}
          record={{ name: 'Test' }}
        >
          {({ methods }) => (
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <button type="submit" data-testid="submit">
                Submit
              </button>
            </form>
          )}
        </Form>
      </FormalityProvider>
    );

    await user.click(screen.getByTestId('submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('should expose methods via render API', () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          {({ methods }) => (
            <span data-testid="has-methods">
              {typeof methods.register === 'function' ? 'yes' : 'no'}
            </span>
          )}
        </Form>
      </FormalityProvider>
    );

    expect(screen.getByTestId('has-methods')).toHaveTextContent('yes');
  });

  it('should expose formState via render API', () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          {({ formState }) => (
            <span data-testid="is-valid">
              {formState.isValid ? 'valid' : 'invalid'}
            </span>
          )}
        </Form>
      </FormalityProvider>
    );

    // Form should be valid by default (no validation rules)
    expect(screen.getByTestId('is-valid')).toHaveTextContent('valid');
  });

  it('should merge form-level input overrides with provider inputs', () => {
    // Capture the merged inputs via context
    let capturedConfig: any;

    function ConfigCapture() {
      const ctx = useFormContext();
      capturedConfig = ctx.formConfig;
      return null;
    }

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            inputs: {
              textField: { debounce: 500 },
            },
          }}
        >
          <ConfigCapture />
        </Form>
      </FormalityProvider>
    );

    expect(capturedConfig.inputs).toEqual({
      textField: { debounce: 500 },
    });
  });
});
