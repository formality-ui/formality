import { describe, it, expect } from 'vitest';
import {
  deepMerge,
  mergeInputConfigs,
  resolveInputConfig,
  resolveFieldType,
  mergeStaticProps,
  mergeFieldProps,
  createConfigContext,
  resolveInitialValue,
  resolveAllInitialValues,
  isEmptyValue,
  getInputDefaultValue,
  mergeRecordWithDefaults,
} from '../index';
import type { InputConfig, FieldConfig, FormalityProviderConfig } from '../index';

describe('Config Module', () => {
  describe('deepMerge', () => {
    it('should merge flat objects', () => {
      const base = { a: 1, b: 2 };
      const override = { b: 3, c: 4 };

      expect(deepMerge(base, override)).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should merge nested objects', () => {
      const base = { a: 1, nested: { x: 1, y: 2 } };
      const override = { nested: { y: 3, z: 4 } };

      expect(deepMerge(base, override)).toEqual({
        a: 1,
        nested: { x: 1, y: 3, z: 4 },
      });
    });

    it('should override arrays (not merge)', () => {
      const base = { items: [1, 2, 3] };
      const override = { items: [4, 5] };

      expect(deepMerge(base, override)).toEqual({ items: [4, 5] });
    });

    it('should handle undefined override', () => {
      const base = { a: 1 };
      expect(deepMerge(base, undefined)).toBe(base);
    });

    it('should skip undefined values in override', () => {
      const base = { a: 1, b: 2 };
      const override = { a: undefined, b: 3 };

      expect(deepMerge(base, override as any)).toEqual({ a: 1, b: 3 });
    });
  });

  describe('mergeInputConfigs', () => {
    const providerInputs: Record<string, InputConfig> = {
      textField: {
        component: 'TextField',
        defaultValue: '',
        debounce: 300,
      } as InputConfig,
      switch: {
        component: 'Switch',
        defaultValue: false,
      } as InputConfig,
    };

    it('should return provider inputs when no form inputs', () => {
      expect(mergeInputConfigs(providerInputs, undefined)).toBe(providerInputs);
    });

    it('should merge object-form form inputs', () => {
      const formInputs = {
        textField: { debounce: 500 },
      };

      const merged = mergeInputConfigs(providerInputs, formInputs);

      expect(merged.textField.debounce).toBe(500);
      expect(merged.textField.defaultValue).toBe('');
    });

    it('should handle function-form form inputs', () => {
      const formInputs = (allInputs: Record<string, InputConfig>) => ({
        textField: { debounce: (allInputs.textField?.debounce as number) * 2 },
      });

      const merged = mergeInputConfigs(providerInputs, formInputs);

      expect(merged.textField.debounce).toBe(600);
    });
  });

  describe('resolveInputConfig', () => {
    const inputs: Record<string, InputConfig> = {
      textField: { component: 'TextField', defaultValue: '' } as InputConfig,
      switch: { component: 'Switch', defaultValue: false } as InputConfig,
    };

    it('should resolve existing type', () => {
      expect(resolveInputConfig('textField', inputs)).toBe(inputs.textField);
      expect(resolveInputConfig('switch', inputs)).toBe(inputs.switch);
    });

    it('should fallback to default type', () => {
      expect(resolveInputConfig('nonExistent', inputs)).toBe(inputs.textField);
    });

    it('should return undefined if default not found', () => {
      expect(resolveInputConfig('nonExistent', {}, 'alsoNonExistent')).toBeUndefined();
    });
  });

  describe('resolveFieldType', () => {
    it('should prefer component prop', () => {
      expect(resolveFieldType('componentType', { type: 'configType' })).toBe(
        'componentType'
      );
    });

    it('should use field config type', () => {
      expect(resolveFieldType(undefined, { type: 'configType' })).toBe(
        'configType'
      );
    });

    it('should fallback to default', () => {
      expect(resolveFieldType(undefined, {})).toBe('textField');
      expect(resolveFieldType(undefined, undefined, 'custom')).toBe('custom');
    });
  });

  describe('mergeStaticProps', () => {
    it('should merge layers in order', () => {
      const merged = mergeStaticProps(
        { a: 1, b: 2 },
        { b: 3, c: 4 },
        { c: 5, d: 6 }
      );

      expect(merged).toEqual({ a: 1, b: 3, c: 5, d: 6 });
    });

    it('should skip undefined layers', () => {
      const merged = mergeStaticProps({ a: 1 }, undefined, { b: 2 });
      expect(merged).toEqual({ a: 1, b: 2 });
    });
  });

  describe('mergeFieldProps', () => {
    it('should merge all prop layers', () => {
      const merged = mergeFieldProps({
        providerDefaultFieldProps: { size: 'small' },
        providerSelectDefaultFieldProps: { variant: 'outlined' },
        formDefaultFieldProps: { margin: 'dense' },
        inputProps: { type: 'text' },
        fieldConfigProps: { required: true },
        selectProps: { disabled: false },
        componentProps: { className: 'custom' },
        coreProps: { name: 'myField', value: 'test' },
      });

      expect(merged).toEqual({
        size: 'small',
        variant: 'outlined',
        margin: 'dense',
        type: 'text',
        required: true,
        disabled: false,
        className: 'custom',
        name: 'myField',
        value: 'test',
      });
    });

    it('should let later layers override earlier', () => {
      const merged = mergeFieldProps({
        providerDefaultFieldProps: { disabled: true },
        selectProps: { disabled: false },
      });

      expect(merged.disabled).toBe(false);
    });
  });

  describe('Initial Value Resolution', () => {
    describe('resolveInitialValue', () => {
      it('should use defaultValues first', () => {
        expect(
          resolveInitialValue(
            'client',
            {},
            { defaultValue: 'input default' } as InputConfig,
            { client: 'record value' },
            { client: 'default value' }
          )
        ).toBe('default value');
      });

      it('should use record value with recordKey', () => {
        expect(
          resolveInitialValue(
            'client',
            { recordKey: 'selectedClient' },
            { defaultValue: 'input default' } as InputConfig,
            { selectedClient: 'mapped value' }
          )
        ).toBe('mapped value');
      });

      it('should use record value by field name', () => {
        expect(
          resolveInitialValue(
            'client',
            {},
            { defaultValue: 'input default' } as InputConfig,
            { client: 'record value' }
          )
        ).toBe('record value');
      });

      it('should use input default value', () => {
        expect(
          resolveInitialValue(
            'client',
            {},
            { defaultValue: 'input default' } as InputConfig
          )
        ).toBe('input default');
      });

      it('should return undefined when no value found', () => {
        expect(resolveInitialValue('client', {}, undefined)).toBeUndefined();
      });
    });

    describe('resolveAllInitialValues', () => {
      const inputs: Record<string, InputConfig> = {
        textField: { component: null, defaultValue: '' } as InputConfig,
        switch: { component: null, defaultValue: false } as InputConfig,
      };

      const fieldConfigs: Record<string, FieldConfig> = {
        name: { type: 'textField' },
        active: { type: 'switch' },
      };

      it('should resolve values for all fields', () => {
        const values = resolveAllInitialValues(
          fieldConfigs,
          inputs,
          { name: 'John' }
        );

        expect(values).toEqual({
          name: 'John',
          active: false, // from input default
        });
      });

      it('should include extra default values', () => {
        const values = resolveAllInitialValues(
          fieldConfigs,
          inputs,
          {},
          { extra: 'value' }
        );

        expect(values.extra).toBe('value');
      });
    });

    describe('isEmptyValue', () => {
      it('should detect empty values', () => {
        expect(isEmptyValue(undefined)).toBe(true);
        expect(isEmptyValue(null)).toBe(true);
        expect(isEmptyValue('')).toBe(true);
        expect(isEmptyValue([])).toBe(true);
      });

      it('should not flag non-empty values', () => {
        expect(isEmptyValue(0)).toBe(false);
        expect(isEmptyValue(false)).toBe(false);
        expect(isEmptyValue('value')).toBe(false);
        expect(isEmptyValue([1])).toBe(false);
      });
    });

    describe('getInputDefaultValue', () => {
      it('should use explicit default', () => {
        expect(
          getInputDefaultValue(
            { component: null, defaultValue: 'explicit' } as InputConfig
          )
        ).toBe('explicit');
      });

      it('should infer from type name', () => {
        expect(getInputDefaultValue(undefined, 'switch')).toBe(false);
        expect(getInputDefaultValue(undefined, 'checkbox')).toBe(false);
        expect(getInputDefaultValue(undefined, 'number')).toBe(0);
        expect(getInputDefaultValue(undefined, 'autocomplete')).toBe(null);
        expect(getInputDefaultValue(undefined, 'multiSelect')).toEqual([]);
        expect(getInputDefaultValue(undefined, 'textField')).toBe('');
      });
    });

    describe('mergeRecordWithDefaults', () => {
      it('should merge record over defaults', () => {
        const defaults = { a: 1, b: 2 };
        const record = { b: 3, c: 4 };

        expect(mergeRecordWithDefaults(record, defaults)).toEqual({
          a: 1,
          b: 3,
          c: 4,
        });
      });

      it('should preserve intentional nulls in record', () => {
        const defaults = { value: 'default' };
        const record = { value: null };

        expect(mergeRecordWithDefaults(record, defaults)).toEqual({
          value: null,
        });
      });
    });
  });
});
