// @formality-ui/react - AutoSave Validation Tests
// Tests for coordinated validation during auto-save

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from '../components/Form';
import { Field } from '../components/Field';
import { FormalityProvider } from '../components/FormalityProvider';
import type { InputConfig } from '@formality-ui/core';

// Track validation calls
let validationCalls: string[] = [];

// Helper to create an async validator that tracks calls
function createAsyncValidator(fieldName: string, delayMs: number = 50) {
  return async (value: unknown) => {
    validationCalls.push(`${fieldName}:start`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    validationCalls.push(`${fieldName}:end`);
    return true;
  };
}

// Test input components
const TestInput = ({ value, onChange, name, ...props }: any) => (
  <input
    data-testid={name}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  />
);

const TestSwitch = ({ value, onChange, name, ...props }: any) => (
  <input
    type="checkbox"
    data-testid={name}
    checked={!!value}
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

describe('AutoSave Validation Coordination', () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    validationCalls = [];
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ROOT CAUSE: All fields validating on any change', () => {
    it('should NOT validate ALL fields when ONE field changes with autoSave', async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: 'textField', validator: createAsyncValidator('fieldA') },
              fieldB: { type: 'textField', validator: createAsyncValidator('fieldB') },
              fieldC: { type: 'textField', validator: createAsyncValidator('fieldC') },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
            <Field name="fieldB" />
            <Field name="fieldC" />
          </Form>
        </FormalityProvider>
      );

      // Wait for initial render and clear any initial validations
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      validationCalls = [];

      // Change ONLY fieldA
      const fieldA = screen.getByTestId('fieldA');
      await act(async () => {
        await userEvent.type(fieldA, 'x', { delay: null });
      });

      // Advance past debounce period
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // CRITICAL ASSERTION: Only fieldA should have validated, NOT fieldB or fieldC
      // This is the ROOT CAUSE test - if this fails, all fields are validating on every change
      const fieldBValidations = validationCalls.filter((c) => c.startsWith('fieldB'));
      const fieldCValidations = validationCalls.filter((c) => c.startsWith('fieldC'));

      // These should be empty - fieldB and fieldC should NOT validate when only fieldA changed
      expect(fieldBValidations).toHaveLength(0);
      expect(fieldCValidations).toHaveLength(0);
    });
  });

  describe('Dependent Field Validation', () => {
    it('should validate dependent fields but NOT independent fields', async () => {
      // fieldB depends on fieldA via condition
      // fieldC is independent
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: 'switch' },
              fieldB: {
                type: 'textField',
                validator: createAsyncValidator('fieldB'),
                conditions: [{ when: 'fieldA', is: true, disabled: true }],
              },
              fieldC: { type: 'textField', validator: createAsyncValidator('fieldC') },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
            <Field name="fieldB" />
            <Field name="fieldC" />
          </Form>
        </FormalityProvider>
      );

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      validationCalls = [];

      // Change fieldA (which affects fieldB via condition)
      const fieldA = screen.getByTestId('fieldA');
      await act(async () => {
        await userEvent.click(fieldA);
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // fieldC should NOT validate (it's independent of fieldA)
      const fieldCValidations = validationCalls.filter((c) => c.startsWith('fieldC'));
      expect(fieldCValidations).toHaveLength(0);
    });
  });

  describe('Async Validation Waiting', () => {
    it('should wait for async validators to complete before submitting', async () => {
      // Test that submit happens AFTER async validation completes, not before
      const validationLog: string[] = [];

      const asyncValidator = async (value: unknown) => {
        validationLog.push('validation:start');
        await new Promise((r) => setTimeout(r, 100));
        validationLog.push('validation:end');
        return true;
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: 'textField', validator: asyncValidator },
            }}
            onSubmit={() => {
              validationLog.push('submit');
              submitHandler();
            }}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>
      );

      // Change field
      const fieldA = screen.getByTestId('fieldA');
      await act(async () => {
        await userEvent.type(fieldA, 'test', { delay: null });
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Advance past async validation delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      // Submit should have been called
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // Verify submit happened AFTER validation completed
      const submitIndex = validationLog.indexOf('submit');
      const validationEndIndex = validationLog.lastIndexOf('validation:end');
      expect(submitIndex).toBeGreaterThan(validationEndIndex);
    });
  });

  describe('Cascading Changes', () => {
    it('should debounce multiple rapid changes and only submit once', async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: 'textField' },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>
      );

      const fieldA = screen.getByTestId('fieldA');

      // Type multiple characters rapidly
      await act(async () => {
        await userEvent.type(fieldA, 'hello', { delay: null });
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Should only submit ONCE with final value
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: 'hello',
        })
      );
    });

    it('should reset debounce timer when new change comes in', async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: 'textField' },
              fieldB: { type: 'textField' },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>
      );

      // Change fieldA
      const fieldA = screen.getByTestId('fieldA');
      await act(async () => {
        await userEvent.type(fieldA, 'a', { delay: null });
      });

      // Wait 300ms (less than debounce)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // No submit yet
      expect(submitHandler).not.toHaveBeenCalled();

      // Change fieldB before debounce completes
      const fieldB = screen.getByTestId('fieldB');
      await act(async () => {
        await userEvent.type(fieldB, 'b', { delay: null });
      });

      // Wait another 300ms (600ms total from first change, 300ms from second)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // Still no submit (debounce restarted)
      expect(submitHandler).not.toHaveBeenCalled();

      // Wait for full debounce from second change
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // NOW submit should happen, once, with both values
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: 'a',
          fieldB: 'b',
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should NOT submit if validation fails', async () => {
      const failingValidator = async () => {
        return 'Validation failed';
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: 'textField', validator: failingValidator },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={100}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>
      );

      // Change field
      const fieldA = screen.getByTestId('fieldA');
      await act(async () => {
        await userEvent.type(fieldA, 'test', { delay: null });
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // Submit should NOT be called (validation failed)
      expect(submitHandler).not.toHaveBeenCalled();
    });
  });
});
