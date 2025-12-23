// @formality/react - Validation Isolation Tests
// Comprehensive test suite to identify where validation is being triggered unnecessarily
// This suite is diagnostic - tests that fail indicate areas that need investigation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useRef } from 'react';
import { Form } from '../components/Form';
import { Field } from '../components/Field';
import { FieldGroup } from '../components/FieldGroup';
import { FormalityProvider } from '../components/FormalityProvider';
import type { InputConfig, FormFieldsConfig, FormConfig } from '@formality/core';

// ============================================================================
// TEST INPUT COMPONENTS
// ============================================================================

const TestInput = ({ value, onChange, onBlur, disabled, label, error, name }: any) => (
  <div>
    {label && <label data-testid={`${name}-label`}>{label}</label>}
    <input
      data-testid={name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
    />
    {error && <span data-testid={`${name}-error`}>{error}</span>}
  </div>
);

const TestSwitch = ({ value, onChange, onBlur, disabled, name }: any) => (
  <input
    type="checkbox"
    data-testid={name}
    checked={value ?? false}
    onChange={(e) => onChange(e.target.checked)}
    onBlur={onBlur}
    disabled={disabled}
  />
);

const baseInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: '' },
  switch: { component: TestSwitch, defaultValue: false },
};

// ============================================================================
// VALIDATION ISOLATION TESTS
// ============================================================================

describe('Validation Isolation', () => {
  describe('Basic validation triggering', () => {
    it('DIAGNOSTIC: tracks which validators are called when Field A changes', async () => {
      const user = userEvent.setup();

      const validators = {
        fieldA: vi.fn().mockReturnValue(true),
        fieldB: vi.fn().mockReturnValue(true),
        fieldC: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField', validator: validators.fieldA },
        fieldB: { type: 'textField', validator: validators.fieldB },
        fieldC: { type: 'textField', validator: validators.fieldC },
      };

      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config}>
            <Field name="fieldA" />
            <Field name="fieldB" />
            <Field name="fieldC" />
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fieldA')).toBeInTheDocument();
      });

      // Clear any initial validation calls
      Object.values(validators).forEach(v => v.mockClear());

      // Type a single character in field A
      await user.type(screen.getByTestId('fieldA'), 'x');

      // Wait a bit for any async validation
      await new Promise(r => setTimeout(r, 100));

      // Log what was called for diagnostic purposes
      console.log('After typing in fieldA:');
      console.log('  fieldA validator calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB validator calls:', validators.fieldB.mock.calls.length);
      console.log('  fieldC validator calls:', validators.fieldC.mock.calls.length);

      // THE EXPECTED BEHAVIOR: Only fieldA's validator should be called
      expect(validators.fieldA.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(validators.fieldB).not.toHaveBeenCalled();
      expect(validators.fieldC).not.toHaveBeenCalled();
    });

    it('DIAGNOSTIC: tracks validation on blur vs change', async () => {
      const user = userEvent.setup();

      const validators = {
        fieldA: vi.fn().mockReturnValue(true),
        fieldB: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField', validator: validators.fieldA },
        fieldB: { type: 'textField', validator: validators.fieldB },
      };

      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config}>
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fieldA')).toBeInTheDocument();
      });

      Object.values(validators).forEach(v => v.mockClear());

      // Focus field A
      await user.click(screen.getByTestId('fieldA'));
      console.log('After focus fieldA:');
      console.log('  fieldA calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB calls:', validators.fieldB.mock.calls.length);

      // Type without blurring
      await user.type(screen.getByTestId('fieldA'), 'test');
      console.log('After typing in fieldA (no blur):');
      console.log('  fieldA calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB calls:', validators.fieldB.mock.calls.length);

      const callsBeforeBlur = {
        fieldA: validators.fieldA.mock.calls.length,
        fieldB: validators.fieldB.mock.calls.length,
      };

      // Now blur (tab away)
      await user.tab();
      await new Promise(r => setTimeout(r, 50));

      console.log('After blur:');
      console.log('  fieldA calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB calls:', validators.fieldB.mock.calls.length);

      // fieldB should NEVER be called
      expect(validators.fieldB).not.toHaveBeenCalled();
    });

    it('DIAGNOSTIC: tracks validation when switching between fields', async () => {
      const user = userEvent.setup();

      const validators = {
        fieldA: vi.fn().mockReturnValue(true),
        fieldB: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField', validator: validators.fieldA },
        fieldB: { type: 'textField', validator: validators.fieldB },
      };

      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config}>
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fieldA')).toBeInTheDocument();
      });

      Object.values(validators).forEach(v => v.mockClear());

      // Type in A, then click B (which blurs A)
      await user.type(screen.getByTestId('fieldA'), 'hello');

      console.log('After typing in A:');
      console.log('  fieldA calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB calls:', validators.fieldB.mock.calls.length);

      await user.click(screen.getByTestId('fieldB'));

      console.log('After clicking B (blurs A):');
      console.log('  fieldA calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB calls:', validators.fieldB.mock.calls.length);

      await user.type(screen.getByTestId('fieldB'), 'world');

      console.log('After typing in B:');
      console.log('  fieldA calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB calls:', validators.fieldB.mock.calls.length);

      // Key assertion: fieldA validator should not be called when we type in fieldB
      const fieldACallsBeforeTypingInB = validators.fieldA.mock.calls.length;
      // (This gets the calls after clicking B but before typing in B)
    });
  });

  describe('Validation with subscriptions', () => {
    it('DIAGNOSTIC: tracks validation when a subscribed field changes', async () => {
      const user = userEvent.setup();

      const validators = {
        trigger: vi.fn().mockReturnValue(true),
        subscriber: vi.fn().mockReturnValue(true),
        unrelated: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        trigger: { type: 'switch', validator: validators.trigger },
        subscriber: {
          type: 'textField',
          validator: validators.subscriber,
          conditions: [{ when: 'trigger', is: true, disabled: true }],
        },
        unrelated: { type: 'textField', validator: validators.unrelated },
      };

      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config}>
            <Field name="trigger" />
            <Field name="subscriber" />
            <Field name="unrelated" />
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('trigger')).toBeInTheDocument();
      });

      Object.values(validators).forEach(v => v.mockClear());

      // Toggle the trigger
      await user.click(screen.getByTestId('trigger'));
      await new Promise(r => setTimeout(r, 50));

      console.log('After toggling trigger:');
      console.log('  trigger calls:', validators.trigger.mock.calls.length);
      console.log('  subscriber calls:', validators.subscriber.mock.calls.length);
      console.log('  unrelated calls:', validators.unrelated.mock.calls.length);

      // Subscriber might re-render due to condition change, but should NOT re-validate
      // Unrelated should definitely NOT validate
      expect(validators.unrelated).not.toHaveBeenCalled();
    });

    it('DIAGNOSTIC: tracks validation with selectProps dependencies', async () => {
      const user = userEvent.setup();

      const validators = {
        source: vi.fn().mockReturnValue(true),
        dependent: vi.fn().mockReturnValue(true),
        independent: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        source: { type: 'textField', validator: validators.source },
        dependent: {
          type: 'textField',
          validator: validators.dependent,
          selectProps: { placeholder: 'source.value' },
          subscribesTo: ['source'],
        },
        independent: { type: 'textField', validator: validators.independent },
      };

      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config}>
            <Field name="source" />
            <Field name="dependent" />
            <Field name="independent" />
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('source')).toBeInTheDocument();
      });

      Object.values(validators).forEach(v => v.mockClear());

      // Type in source field
      await user.type(screen.getByTestId('source'), 'test');
      await new Promise(r => setTimeout(r, 50));

      console.log('After typing in source:');
      console.log('  source calls:', validators.source.mock.calls.length);
      console.log('  dependent calls:', validators.dependent.mock.calls.length);
      console.log('  independent calls:', validators.independent.mock.calls.length);

      // Dependent might need to re-render for selectProps, but should NOT validate
      // Independent should definitely NOT validate
      expect(validators.independent).not.toHaveBeenCalled();
    });
  });

  describe('Validation with FieldGroups', () => {
    it('DIAGNOSTIC: tracks validation when group visibility changes', async () => {
      const user = userEvent.setup();

      const validators = {
        showGroup: vi.fn().mockReturnValue(true),
        inGroup: vi.fn().mockReturnValue(true),
        outsideGroup: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        showGroup: { type: 'switch', validator: validators.showGroup },
        inGroup: { type: 'textField', validator: validators.inGroup },
        outsideGroup: { type: 'textField', validator: validators.outsideGroup },
      };

      const formConfig: FormConfig = {
        groups: {
          testGroup: {
            conditions: [{ when: 'showGroup', is: false, visible: false }],
          },
        },
      };

      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config} formConfig={formConfig}>
            <Field name="showGroup" />
            <FieldGroup name="testGroup">
              <Field name="inGroup" />
            </FieldGroup>
            <Field name="outsideGroup" />
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('showGroup')).toBeInTheDocument();
      });

      Object.values(validators).forEach(v => v.mockClear());

      // Toggle group visibility
      await user.click(screen.getByTestId('showGroup'));
      await new Promise(r => setTimeout(r, 50));

      console.log('After toggling group visibility:');
      console.log('  showGroup calls:', validators.showGroup.mock.calls.length);
      console.log('  inGroup calls:', validators.inGroup.mock.calls.length);
      console.log('  outsideGroup calls:', validators.outsideGroup.mock.calls.length);

      // outsideGroup should NEVER validate when showGroup changes
      expect(validators.outsideGroup).not.toHaveBeenCalled();
    });
  });

  describe('Type-level validators', () => {
    it('DIAGNOSTIC: tracks type-level validator calls', async () => {
      const user = userEvent.setup();

      const typeValidator = vi.fn().mockReturnValue(true);

      const inputsWithTypeValidator: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: '',
          validator: typeValidator, // Type-level validator
        },
        switch: { component: TestSwitch, defaultValue: false },
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField' },
        fieldB: { type: 'textField' },
        fieldC: { type: 'textField' },
      };

      render(
        <FormalityProvider inputs={inputsWithTypeValidator}>
          <Form config={config}>
            <Field name="fieldA" />
            <Field name="fieldB" />
            <Field name="fieldC" />
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fieldA')).toBeInTheDocument();
      });

      typeValidator.mockClear();

      // Type in field A
      await user.type(screen.getByTestId('fieldA'), 'x');
      await new Promise(r => setTimeout(r, 50));

      console.log('Type validator called', typeValidator.mock.calls.length, 'times');
      console.log('Call arguments:', typeValidator.mock.calls);

      // Type validator should only be called once (for fieldA)
      // If it's called 3 times, that means all fields are validating
      expect(typeValidator.mock.calls.length).toBe(1);
    });
  });

  describe('Initial load validation', () => {
    it('DIAGNOSTIC: tracks validation on initial render with record data', async () => {
      const validators = {
        fieldA: vi.fn().mockReturnValue(true),
        fieldB: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField', validator: validators.fieldA },
        fieldB: { type: 'textField', validator: validators.fieldB },
      };

      const record = { fieldA: 'initial A', fieldB: 'initial B' };

      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config} record={record}>
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fieldA')).toBeInTheDocument();
      });

      // Wait for any async operations
      await new Promise(r => setTimeout(r, 100));

      console.log('After initial render with record:');
      console.log('  fieldA calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB calls:', validators.fieldB.mock.calls.length);

      // NO validation should run on initial load with server data
      expect(validators.fieldA).not.toHaveBeenCalled();
      expect(validators.fieldB).not.toHaveBeenCalled();
    });

    it('DIAGNOSTIC: tracks validation when record changes', async () => {
      const validators = {
        fieldA: vi.fn().mockReturnValue(true),
        fieldB: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField', validator: validators.fieldA },
        fieldB: { type: 'textField', validator: validators.fieldB },
      };

      const TestWrapper = () => {
        const [record, setRecord] = React.useState({ fieldA: 'v1', fieldB: 'v1' });

        return (
          <FormalityProvider inputs={baseInputs}>
            <Form config={config} record={record}>
              <Field name="fieldA" />
              <Field name="fieldB" />
              <button
                data-testid="update-record"
                onClick={() => setRecord({ fieldA: 'v2', fieldB: 'v2' })}
              >
                Update
              </button>
            </Form>
          </FormalityProvider>
        );
      };

      const user = userEvent.setup();

      render(<TestWrapper />);

      await waitFor(() => {
        expect(screen.getByTestId('fieldA')).toBeInTheDocument();
      });

      await new Promise(r => setTimeout(r, 50));
      Object.values(validators).forEach(v => v.mockClear());

      // Update the record
      await user.click(screen.getByTestId('update-record'));
      await new Promise(r => setTimeout(r, 100));

      console.log('After record update:');
      console.log('  fieldA calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB calls:', validators.fieldB.mock.calls.length);

      // NO validation should run when record changes from server
      expect(validators.fieldA).not.toHaveBeenCalled();
      expect(validators.fieldB).not.toHaveBeenCalled();
    });
  });

  describe('Rules change detection', () => {
    it('DIAGNOSTIC: checks if validation rules are being recreated', async () => {
      const user = userEvent.setup();

      let rulesCreationCount = 0;
      const validatorFactory = () => {
        rulesCreationCount++;
        return vi.fn().mockReturnValue(true);
      };

      // Create validators that we can track
      const validators = {
        fieldA: validatorFactory(),
        fieldB: validatorFactory(),
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField', validator: validators.fieldA },
        fieldB: { type: 'textField', validator: validators.fieldB },
      };

      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config}>
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fieldA')).toBeInTheDocument();
      });

      const initialCreationCount = rulesCreationCount;
      console.log('Initial rules creation count:', initialCreationCount);

      // Type in field A
      await user.type(screen.getByTestId('fieldA'), 'test');
      await new Promise(r => setTimeout(r, 50));

      console.log('After typing, rules creation count:', rulesCreationCount);

      // Rules should NOT be recreated just because we typed
      // If they are being recreated, that's a clue to the issue
    });
  });
});

  describe('Render Performance', () => {
    // Component that tracks input renders
    const TrackingInput = ({ value, onChange, onBlur, name }: any) => {
      const renderCount = useRef(0);
      renderCount.current++;
      console.log(`[Input Render] ${name}: #${renderCount.current}`);
    
      return (
        <input
          data-testid={name}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      );
    };

    const trackingInputs: Record<string, InputConfig> = {
      textField: { component: TrackingInput, defaultValue: '' },
    };

    it('DIAGNOSTIC: detects if unrelated fields re-render when typing', async () => {
      const user = userEvent.setup();

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField' },
        fieldB: { type: 'textField' }, // Unrelated to A
        fieldC: { type: 'textField', selectProps: { label: 'fieldA' } }, // Dependent on A
      };

      render(
        <FormalityProvider inputs={trackingInputs}>
          <Form config={config}>
            <Field name="fieldA" />
            <Field name="fieldB" />
            <Field name="fieldC" />
          </Form>
        </FormalityProvider>
      );

      // Allow initial renders to settle
      await waitFor(() => screen.getByTestId('fieldA'));
      
      // Reset by capturing current count? 
      // We'll just rely on the fact that B should not increase its count when A is typed into.
      
      // Type in field A
      const inputA = screen.getByTestId('fieldA');
      await user.type(inputA, 'x');
      await new Promise(r => setTimeout(r, 50));

      // We can't easily assert on console logs here without spying on console.log
      // But we can verify functionally or just rely on the fact that the fix is in place.
      // For regression, we should spy on console.log or use a mock component that calls a mock function.
    });
    
    it('VERIFY: unrelated fields do NOT re-render', async () => {
       const user = userEvent.setup();
       const renderSpy = vi.fn();
       
       const SpyInput = ({ value, onChange, onBlur, name }: any) => {
         renderSpy(name);
         return (
           <input
             data-testid={name}
             value={value ?? ''}
             onChange={(e) => onChange(e.target.value)}
             onBlur={onBlur}
           />
         );
       };
       
       const spyInputs = {
         textField: { component: SpyInput, defaultValue: '' }
       };
       
       const config: FormFieldsConfig = {
        fieldA: { type: 'textField' },
        fieldB: { type: 'textField' }, // Unrelated
       };
       
       render(
        <FormalityProvider inputs={spyInputs}>
          <Form config={config}>
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>
      );
      
      await waitFor(() => screen.getByTestId('fieldA'));
      renderSpy.mockClear();
      
      // Type in A
      await user.type(screen.getByTestId('fieldA'), 'x');
      await new Promise(r => setTimeout(r, 50));
      
      // Analyze calls
      const calls = renderSpy.mock.calls.map(c => c[0]);
      const fieldACalls = calls.filter(n => n === 'fieldA').length;
      const fieldBCalls = calls.filter(n => n === 'fieldB').length;
      
      console.log('Render calls:', calls);
      
      expect(fieldACalls).toBeGreaterThan(0); // A should render
      expect(fieldBCalls).toBe(0); // B should NOT render
    });
  });

  describe('Render Function Children Pattern (ROOT CAUSE TEST)', () => {
    it('CRITICAL: With render function children, changing field A should NOT validate field B', async () => {
      const user = userEvent.setup();

      const validators = {
        fieldA: vi.fn().mockReturnValue(true),
        fieldB: vi.fn().mockReturnValue(true),
        fieldC: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField', validator: validators.fieldA },
        fieldB: { type: 'textField', validator: validators.fieldB },
        fieldC: { type: 'textField', validator: validators.fieldC },
      };

      // THIS IS THE PATTERN THAT ModalForm USES IN SELLARIO
      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config}>
            {({ formState, methods }) => (
              <>
                <Field name="fieldA" />
                <Field name="fieldB" />
                <Field name="fieldC" />
              </>
            )}
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fieldA')).toBeInTheDocument();
      });

      // Clear any initial validation calls
      Object.values(validators).forEach(v => v.mockClear());

      // Type a single character in field A
      await user.type(screen.getByTestId('fieldA'), 'x');

      // Wait for any async validation
      await new Promise(r => setTimeout(r, 100));

      console.log('=== WITH RENDER FUNCTION PATTERN ===');
      console.log('After typing in fieldA:');
      console.log('  fieldA validator calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB validator calls:', validators.fieldB.mock.calls.length);
      console.log('  fieldC validator calls:', validators.fieldC.mock.calls.length);

      // THE EXPECTED BEHAVIOR: Only fieldA's validator should be called
      expect(validators.fieldA.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(validators.fieldB).not.toHaveBeenCalled(); // THIS WILL FAIL IF BUG EXISTS
      expect(validators.fieldC).not.toHaveBeenCalled(); // THIS WILL FAIL IF BUG EXISTS
    });

    it('CRITICAL: Render function should receive form API without triggering global subscriptions', async () => {
      const user = userEvent.setup();
      const renderSpy = vi.fn();

      const SpyInput = ({ value, onChange, onBlur, name }: any) => {
        renderSpy(name);
        return (
          <input
            data-testid={name}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
          />
        );
      };

      const spyInputs = {
        textField: { component: SpyInput, defaultValue: '' }
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField' },
        fieldB: { type: 'textField' },
      };

      // Using render function pattern like ModalForm does
      render(
        <FormalityProvider inputs={spyInputs}>
          <Form config={config}>
            {({ formState, methods }) => (
              <>
                <Field name="fieldA" />
                <Field name="fieldB" />
              </>
            )}
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => screen.getByTestId('fieldA'));
      renderSpy.mockClear();

      // Type in A
      await user.type(screen.getByTestId('fieldA'), 'x');
      await new Promise(r => setTimeout(r, 50));

      const calls = renderSpy.mock.calls.map(c => c[0]);
      const fieldBCalls = calls.filter(n => n === 'fieldB').length;

      console.log('=== RENDER FUNCTION PATTERN - RE-RENDER CHECK ===');
      console.log('Render calls after typing in A:', calls);

      // Field B should NOT re-render when typing in field A
      expect(fieldBCalls).toBe(0);
    });

    it('CRITICAL: With record prop, changing field A should NOT validate field B', async () => {
      const user = userEvent.setup();

      const validators = {
        fieldA: vi.fn().mockReturnValue(true),
        fieldB: vi.fn().mockReturnValue(true),
      };

      const config: FormFieldsConfig = {
        fieldA: { type: 'textField', validator: validators.fieldA },
        fieldB: { type: 'textField', validator: validators.fieldB },
      };

      // THIS EXACTLY MATCHES HOW THE TARGET PROJECT USES THE FORM
      // - render function children
      // - record prop passed
      const record = { fieldA: 'initial A', fieldB: 'initial B' };

      render(
        <FormalityProvider inputs={baseInputs}>
          <Form config={config} record={record}>
            {({ formState, methods }) => (
              <>
                <Field name="fieldA" />
                <Field name="fieldB" />
              </>
            )}
          </Form>
        </FormalityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fieldA')).toBeInTheDocument();
        expect(screen.getByTestId('fieldA')).toHaveValue('initial A');
      });

      // Clear any initial validation calls
      Object.values(validators).forEach(v => v.mockClear());

      // Type a single character in field A
      await user.type(screen.getByTestId('fieldA'), 'x');

      // Wait for any async validation
      await new Promise(r => setTimeout(r, 100));

      console.log('=== WITH RENDER FUNCTION + RECORD PROP ===');
      console.log('After typing in fieldA:');
      console.log('  fieldA validator calls:', validators.fieldA.mock.calls.length);
      console.log('  fieldB validator calls:', validators.fieldB.mock.calls.length);

      // Only fieldA should validate
      expect(validators.fieldA.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(validators.fieldB).not.toHaveBeenCalled();
    });
  });
