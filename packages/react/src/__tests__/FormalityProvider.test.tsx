import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormalityProvider } from '../components/FormalityProvider';
import { useConfigContext } from '../context/ConfigContext';
import type { InputConfig } from '@formality/core';

// Test component that reads context
function TestConsumer() {
  const config = useConfigContext();
  return (
    <div data-testid="consumer">
      <span data-testid="inputs-count">{Object.keys(config.inputs).length}</span>
      <span data-testid="default-prop-name">{config.defaultSubscriptionPropName}</span>
    </div>
  );
}

describe('FormalityProvider', () => {
  const TestInput = () => <input />;

  const testInputs: Record<string, InputConfig> = {
    textField: {
      component: TestInput,
      defaultValue: '',
    },
    switch: {
      component: TestInput,
      defaultValue: false,
    },
  };

  it('should provide inputs to descendants', () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <TestConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('inputs-count')).toHaveTextContent('2');
  });

  it('should use default subscription prop name', () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <TestConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('default-prop-name')).toHaveTextContent('state');
  });

  it('should allow custom subscription prop name', () => {
    render(
      <FormalityProvider
        inputs={testInputs}
        defaultSubscriptionPropName="formState"
      >
        <TestConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('default-prop-name')).toHaveTextContent('formState');
  });

  it('should provide formatters and parsers', () => {
    const formatters = { currency: (v: unknown) => `$${v}` };
    const parsers = { number: (v: unknown) => Number(v) };

    function FormatterConsumer() {
      const config = useConfigContext();
      return (
        <div>
          <span data-testid="formatter-result">
            {config.formatters.currency?.(100)}
          </span>
          <span data-testid="parser-result">
            {String(config.parsers.number?.('42'))}
          </span>
        </div>
      );
    }

    render(
      <FormalityProvider
        inputs={testInputs}
        formatters={formatters}
        parsers={parsers}
      >
        <FormatterConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('formatter-result')).toHaveTextContent('$100');
    expect(screen.getByTestId('parser-result')).toHaveTextContent('42');
  });

  it('should provide validators config', () => {
    const validators = {
      customValidator: (value: unknown) => {
        if (!value) return 'Value is required';
        return true;
      },
    };

    function ValidatorConsumer() {
      const config = useConfigContext();
      const hasValidator = 'customValidator' in config.validators;
      return <span data-testid="has-validator">{hasValidator ? 'yes' : 'no'}</span>;
    }

    render(
      <FormalityProvider inputs={testInputs} validators={validators}>
        <ValidatorConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('has-validator')).toHaveTextContent('yes');
  });

  it('should provide error messages config', () => {
    const errorMessages = {
      required: 'This field is required',
      minLength: 'Too short',
    };

    function ErrorMessageConsumer() {
      const config = useConfigContext();
      return (
        <div>
          <span data-testid="required-msg">{config.errorMessages.required}</span>
          <span data-testid="minlength-msg">{config.errorMessages.minLength}</span>
        </div>
      );
    }

    render(
      <FormalityProvider inputs={testInputs} errorMessages={errorMessages}>
        <ErrorMessageConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('required-msg')).toHaveTextContent('This field is required');
    expect(screen.getByTestId('minlength-msg')).toHaveTextContent('Too short');
  });

  it('should provide default field props', () => {
    const defaultFieldProps = {
      variant: 'outlined',
      size: 'small',
    };

    function FieldPropsConsumer() {
      const config = useConfigContext();
      return (
        <div>
          <span data-testid="variant">{config.defaultFieldProps.variant as string}</span>
          <span data-testid="size">{config.defaultFieldProps.size as string}</span>
        </div>
      );
    }

    render(
      <FormalityProvider inputs={testInputs} defaultFieldProps={defaultFieldProps}>
        <FieldPropsConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('variant')).toHaveTextContent('outlined');
    expect(screen.getByTestId('size')).toHaveTextContent('small');
  });

  it('should provide input templates', () => {
    const CustomTemplate = () => <div>Template</div>;
    const inputTemplates = {
      card: CustomTemplate,
    };

    function TemplateConsumer() {
      const config = useConfigContext();
      const hasCardTemplate = 'card' in config.inputTemplates;
      return <span data-testid="has-template">{hasCardTemplate ? 'yes' : 'no'}</span>;
    }

    render(
      <FormalityProvider inputs={testInputs} inputTemplates={inputTemplates}>
        <TemplateConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('has-template')).toHaveTextContent('yes');
  });

  it('should provide default input template', () => {
    const DefaultTemplate = () => <div>Default Template</div>;

    function DefaultTemplateConsumer() {
      const config = useConfigContext();
      const hasDefault = config.defaultInputTemplate !== undefined;
      return <span data-testid="has-default">{hasDefault ? 'yes' : 'no'}</span>;
    }

    render(
      <FormalityProvider inputs={testInputs} defaultInputTemplate={DefaultTemplate}>
        <DefaultTemplateConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('has-default')).toHaveTextContent('yes');
  });

  it('should not render any wrapper elements', () => {
    const { container } = render(
      <FormalityProvider inputs={testInputs}>
        <div data-testid="child">Child Content</div>
      </FormalityProvider>
    );

    // FormalityProvider should only render its children (via Context.Provider)
    expect(container.firstChild).toBe(screen.getByTestId('child'));
  });

  it('should use empty defaults for optional props', () => {
    function DefaultsConsumer() {
      const config = useConfigContext();
      return (
        <div>
          <span data-testid="formatters-count">{Object.keys(config.formatters).length}</span>
          <span data-testid="parsers-count">{Object.keys(config.parsers).length}</span>
          <span data-testid="validators-count">{Object.keys(config.validators).length}</span>
          <span data-testid="error-messages-count">{Object.keys(config.errorMessages).length}</span>
          <span data-testid="templates-count">{Object.keys(config.inputTemplates).length}</span>
          <span data-testid="field-props-count">{Object.keys(config.defaultFieldProps).length}</span>
        </div>
      );
    }

    render(
      <FormalityProvider inputs={testInputs}>
        <DefaultsConsumer />
      </FormalityProvider>
    );

    expect(screen.getByTestId('formatters-count')).toHaveTextContent('0');
    expect(screen.getByTestId('parsers-count')).toHaveTextContent('0');
    expect(screen.getByTestId('validators-count')).toHaveTextContent('0');
    expect(screen.getByTestId('error-messages-count')).toHaveTextContent('0');
    expect(screen.getByTestId('templates-count')).toHaveTextContent('0');
    expect(screen.getByTestId('field-props-count')).toHaveTextContent('0');
  });

  it('should memoize context value when all props are stable references', () => {
    const references: unknown[] = [];

    // Define stable references for all optional props
    const stableFormatters = {};
    const stableParsers = {};
    const stableValidators = {};
    const stableErrorMessages = {};
    const stableInputTemplates = {};
    const stableDefaultFieldProps = {};

    function ReferenceTracker() {
      const config = useConfigContext();
      references.push(config);
      return null;
    }

    const { rerender } = render(
      <FormalityProvider
        inputs={testInputs}
        formatters={stableFormatters}
        parsers={stableParsers}
        validators={stableValidators}
        errorMessages={stableErrorMessages}
        inputTemplates={stableInputTemplates}
        defaultFieldProps={stableDefaultFieldProps}
      >
        <ReferenceTracker />
      </FormalityProvider>
    );

    // Rerender with same prop references
    rerender(
      <FormalityProvider
        inputs={testInputs}
        formatters={stableFormatters}
        parsers={stableParsers}
        validators={stableValidators}
        errorMessages={stableErrorMessages}
        inputTemplates={stableInputTemplates}
        defaultFieldProps={stableDefaultFieldProps}
      >
        <ReferenceTracker />
      </FormalityProvider>
    );

    // Should be same reference due to useMemo with same dependency references
    expect(references[0]).toBe(references[1]);
  });
});

describe('ConfigContext default values', () => {
  it('should provide default values when no FormalityProvider', () => {
    function DefaultValuesConsumer() {
      const config = useConfigContext();
      return (
        <div>
          <span data-testid="inputs-count">{Object.keys(config.inputs).length}</span>
          <span data-testid="prop-name">{config.defaultSubscriptionPropName}</span>
        </div>
      );
    }

    // Render without FormalityProvider - should use defaults
    render(<DefaultValuesConsumer />);

    expect(screen.getByTestId('inputs-count')).toHaveTextContent('0');
    expect(screen.getByTestId('prop-name')).toHaveTextContent('state');
  });
});
