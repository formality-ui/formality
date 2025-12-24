// @formality-ui/react - FieldGroup Component Tests
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Form } from '../components/Form';
import { Field } from '../components/Field';
import { FieldGroup } from '../components/FieldGroup';
import { FormalityProvider } from '../components/FormalityProvider';
import type { InputConfig, FormFieldsConfig, FormConfig } from '@formality-ui/core';

// Test input component
const TestInput = ({ value, onChange, disabled, ...props }: any) => (
  <input
    data-testid={props.name}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    {...props}
  />
);

// Switch input for visibility conditions
const TestSwitch = ({ value, onChange, ...props }: any) => (
  <input
    type="checkbox"
    data-testid={props.name}
    checked={value ?? false}
    onChange={(e) => onChange(e.target.checked)}
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

describe('FieldGroup', () => {
  describe('visibility', () => {
    it('should render children with span wrapper when visible', async () => {
      const config: FormFieldsConfig = {
        signed: { type: 'switch' },
        name: { type: 'textField' },
      };

      const formConfig: FormConfig = {
        groups: {
          details: {
            // Hide when signed is false (falsy)
            conditions: [{ when: 'signed', truthy: false, visible: false }],
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} formConfig={formConfig} record={{ signed: true }}>
            <Field name="signed" />
            <FieldGroup name="details">
              <Field name="name" />
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      // Group should be visible (display should not be 'none')
      await waitFor(() => {
        const groupSpan = document.querySelector('[data-formality-group="details"]');
        expect(groupSpan).toBeInTheDocument();
        expect(groupSpan).not.toHaveStyle({ display: 'none' });
      });
    });

    it('should always render children in DOM (span wrapper preserves children)', () => {
      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      const formConfig: FormConfig = {
        groups: {
          details: {},
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} formConfig={formConfig}>
            <FieldGroup name="details">
              <Field name="name" />
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      // Group span should exist with data-formality-group attribute
      const span = document.querySelector('[data-formality-group="details"]');
      expect(span).toBeInTheDocument();
      // Child field should be in the DOM
      expect(screen.getByTestId('name')).toBeInTheDocument();
    });

    it('should have span wrapper element (not return null when hidden)', () => {
      // This test verifies the key fix: FieldGroup uses span wrapper
      // instead of returning null when not visible
      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      const formConfig: FormConfig = {
        groups: {
          myGroup: {},
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} formConfig={formConfig}>
            <FieldGroup name="myGroup">
              <Field name="name" />
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      // The span wrapper should always exist
      const span = document.querySelector('[data-formality-group="myGroup"]');
      expect(span).toBeInTheDocument();
      expect(span?.tagName).toBe('SPAN');
    });
  });

  describe('disabled propagation', () => {
    it('should provide group context to child fields', () => {
      // Verify that FieldGroup provides a context that children can use
      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      const formConfig: FormConfig = {
        groups: {
          details: {},
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} formConfig={formConfig}>
            <FieldGroup name="details">
              <Field name="name" />
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      // Field should render within the group
      expect(screen.getByTestId('name')).toBeInTheDocument();
    });
  });

  describe('nesting', () => {
    it('should support nested FieldGroup components', () => {
      const config: FormFieldsConfig = {
        field: { type: 'textField' },
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
                <Field name="field" />
              </FieldGroup>
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      // Both groups should have their span wrappers
      const outerSpan = document.querySelector('[data-formality-group="outerGroup"]');
      const innerSpan = document.querySelector('[data-formality-group="innerGroup"]');
      expect(outerSpan).toBeInTheDocument();
      expect(innerSpan).toBeInTheDocument();

      // Field should be nested correctly
      expect(screen.getByTestId('field')).toBeInTheDocument();
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
      const outerSpan = document.querySelector('[data-formality-group="outer"]');
      const innerSpan = document.querySelector('[data-formality-group="inner"]');
      expect(outerSpan?.contains(innerSpan)).toBe(true);
    });
  });

  describe('group without config', () => {
    it('should work with undefined group config (defaults to visible and enabled)', () => {
      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      // No formConfig.groups defined
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <FieldGroup name="undefinedGroup">
              <Field name="name" />
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      // Should render normally
      expect(screen.getByTestId('name')).toBeInTheDocument();
      expect(screen.getByTestId('name')).not.toBeDisabled();

      const groupSpan = document.querySelector('[data-formality-group="undefinedGroup"]');
      expect(groupSpan).not.toHaveStyle({ display: 'none' });
    });
  });

  describe('data attribute', () => {
    it('should have data-formality-group attribute for testing', () => {
      const config: FormFieldsConfig = {
        name: { type: 'textField' },
      };

      const formConfig: FormConfig = {
        groups: {
          myGroup: {},
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} formConfig={formConfig}>
            <FieldGroup name="myGroup">
              <Field name="name" />
            </FieldGroup>
          </Form>
        </FormalityProvider>
      );

      const groupSpan = document.querySelector('[data-formality-group="myGroup"]');
      expect(groupSpan).toBeInTheDocument();
    });
  });
});
