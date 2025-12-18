// @formality/react - UnusedFields Component Tests
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Form } from '../components/Form';
import { Field } from '../components/Field';
import { UnusedFields } from '../components/UnusedFields';
import { FormalityProvider } from '../components/FormalityProvider';
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
};

describe('UnusedFields', () => {
  it('should render fields not explicitly declared', () => {
    const config: FormFieldsConfig = {
      name: { type: 'textField' },
      email: { type: 'textField' },
      phone: { type: 'textField' },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="name" />
          <UnusedFields />
        </Form>
      </FormalityProvider>
    );

    // name is explicitly declared
    expect(screen.getByTestId('name')).toBeInTheDocument();
    // email and phone should be rendered by UnusedFields
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('phone')).toBeInTheDocument();
  });

  it('should not cause infinite loop with shouldRegister={false}', () => {
    const config: FormFieldsConfig = {
      name: { type: 'textField' },
      email: { type: 'textField' },
    };

    // If shouldRegister wasn't false, this would cause infinite re-renders
    // The test passing without timeout is proof it works
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <UnusedFields />
        </Form>
      </FormalityProvider>
    );

    expect(screen.getByTestId('name')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toBeInTheDocument();
  });

  it('should respect field order property', () => {
    const config: FormFieldsConfig = {
      third: { type: 'textField', order: 3 },
      first: { type: 'textField', order: 1 },
      second: { type: 'textField', order: 2 },
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
    const inputs = container.querySelectorAll('input');

    expect(inputs[0]).toHaveAttribute('data-testid', 'first');
    expect(inputs[1]).toHaveAttribute('data-testid', 'second');
    expect(inputs[2]).toHaveAttribute('data-testid', 'third');
  });

  it('should place fields without order after ordered fields', () => {
    const config: FormFieldsConfig = {
      unordered: { type: 'textField' },
      second: { type: 'textField', order: 2 },
      first: { type: 'textField', order: 1 },
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
    const inputs = container.querySelectorAll('input');

    // Ordered fields first, then unordered
    expect(inputs[0]).toHaveAttribute('data-testid', 'first');
    expect(inputs[1]).toHaveAttribute('data-testid', 'second');
    expect(inputs[2]).toHaveAttribute('data-testid', 'unordered');
  });

  it('should support custom render function', () => {
    const config: FormFieldsConfig = {
      name: { type: 'textField' },
      email: { type: 'textField' },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <UnusedFields>
            {({ name, component }) => (
              <div key={name} data-testid={`wrapper-${name}`} className="custom-wrapper">
                {component}
              </div>
            )}
          </UnusedFields>
        </Form>
      </FormalityProvider>
    );

    expect(screen.getByTestId('wrapper-name')).toHaveClass('custom-wrapper');
    expect(screen.getByTestId('wrapper-email')).toHaveClass('custom-wrapper');
  });

  it('should render nothing when all fields are explicitly declared', () => {
    const config: FormFieldsConfig = {
      name: { type: 'textField' },
      email: { type: 'textField' },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="name" />
          <Field name="email" />
          <div data-testid="unused-container">
            <UnusedFields />
          </div>
        </Form>
      </FormalityProvider>
    );

    // Both fields are explicitly declared, so UnusedFields should render nothing
    const container = screen.getByTestId('unused-container');
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('should not include explicitly declared fields', () => {
    const config: FormFieldsConfig = {
      declared: { type: 'textField' },
      undeclared1: { type: 'textField' },
      undeclared2: { type: 'textField' },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="declared" />
          <div data-testid="unused-container">
            <UnusedFields />
          </div>
        </Form>
      </FormalityProvider>
    );

    // declared should not appear in the unused container
    const container = screen.getByTestId('unused-container');
    const inputs = container.querySelectorAll('input');

    expect(inputs).toHaveLength(2);
    // Check that 'declared' is not among them
    const testIds = Array.from(inputs).map(i => i.getAttribute('data-testid'));
    expect(testIds).not.toContain('declared');
    expect(testIds).toContain('undeclared1');
    expect(testIds).toContain('undeclared2');
  });

  it('should pass shouldRegister={false} to prevent fields from registering', () => {
    // This test verifies the implementation detail that shouldRegister={false}
    // is passed to Field components rendered by UnusedFields

    const config: FormFieldsConfig = {
      explicit: { type: 'textField' },
      unused: { type: 'textField' },
    };

    // Render with explicit field first
    const { rerender } = render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="explicit" />
          <UnusedFields />
        </Form>
      </FormalityProvider>
    );

    // Both should be rendered
    expect(screen.getByTestId('explicit')).toBeInTheDocument();
    expect(screen.getByTestId('unused')).toBeInTheDocument();

    // Re-render - if shouldRegister was true, we'd get a loop
    // but since it's false, this should work fine
    rerender(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="explicit" />
          <UnusedFields />
        </Form>
      </FormalityProvider>
    );

    // Still works without infinite loop
    expect(screen.getByTestId('explicit')).toBeInTheDocument();
    expect(screen.getByTestId('unused')).toBeInTheDocument();
  });
});
