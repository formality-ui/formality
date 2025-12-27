import { describe, it, expect } from 'vitest';
import {
  evaluateConditions,
  conditionMatches,
  mergeConditionResults,
  inferFieldsFromConditions,
} from '../index';
import type { ConditionDescriptor, ConditionResult } from '../index';

describe('Conditions', () => {
  describe('evaluateConditions', () => {
    it('should evaluate disabled conditions with when trigger', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'signed', is: false, disabled: true },
      ];

      const result = evaluateConditions({
        conditions,
        fieldValues: { signed: false },
      });

      expect(result.disabled).toBe(true);
      expect(result.hasDisabledCondition).toBe(true);
    });

    it('should evaluate visible conditions', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'showAdvanced', truthy: true, visible: true },
      ];

      // When condition matches
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { showAdvanced: true },
        }).visible
      ).toBe(true);

      // When condition doesn't match
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { showAdvanced: false },
        }).visible
      ).toBeUndefined();
    });

    it('should use OR logic for disabled', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'a', truthy: true, disabled: true },
        { when: 'b', truthy: true, disabled: true },
      ];

      // Both false
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { a: false, b: false },
        }).disabled
      ).toBeUndefined();

      // One true
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { a: true, b: false },
        }).disabled
      ).toBe(true);

      // Both true
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { a: true, b: true },
        }).disabled
      ).toBe(true);
    });

    it('should use AND logic for visible', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'a', truthy: true, visible: true },
        { when: 'b', truthy: true, visible: true },
      ];

      // Both true
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { a: true, b: true },
        }).visible
      ).toBe(true);

      // One hidden
      const conditionsWithHidden: ConditionDescriptor[] = [
        { when: 'a', truthy: true, visible: true },
        { when: 'b', truthy: true, visible: false },
      ];

      expect(
        evaluateConditions({
          conditions: conditionsWithHidden,
          fieldValues: { a: true, b: true },
        }).visible
      ).toBe(false);
    });

    it('should use last matching setValue', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'a', truthy: true, set: 'first' },
        { when: 'b', truthy: true, set: 'second' },
      ];

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { a: true, b: true },
        }).setValue
      ).toBe('second');
    });

    it('should evaluate selectWhen expressions', () => {
      const conditions: ConditionDescriptor[] = [
        { selectWhen: 'count > 5', disabled: true },
      ];

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { count: 10 },
        }).disabled
      ).toBe(true);

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { count: 3 },
        }).disabled
      ).toBeUndefined();
    });

    it('should evaluate selectSet expressions', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'trigger', truthy: true, selectSet: 'source' },
      ];

      // With field state proxies, 'source' and 'source.value' are aliases
      // Both return the field's value
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { trigger: true, source: 42 },
        }).setValue
      ).toBe(42);
    });

    it('should access nested properties via selectSet', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'trigger', truthy: true, selectSet: 'source.id' },
      ];

      // Accessing properties on an object value works via proxy delegation
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { trigger: true, source: { id: 42, name: 'Test' } },
        }).setValue
      ).toBe(42);
    });

    it('should handle is matcher', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'status', is: 'active', visible: true },
      ];

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { status: 'active' },
        }).visible
      ).toBe(true);

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { status: 'inactive' },
        }).visible
      ).toBeUndefined();
    });

    it('should handle truthy: false matcher', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'value', truthy: false, visible: true },
      ];

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { value: '' },
        }).visible
      ).toBe(true);

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { value: 'something' },
        }).visible
      ).toBeUndefined();
    });

    it('should handle isValid matcher - field is valid', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'email', isValid: true, disabled: true },
      ];

      // Valid field (no error, not invalid)
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'test@example.com' },
          fieldStates: { email: { value: 'test@example.com', invalid: false } },
        }).disabled
      ).toBe(true);

      // Invalid field (has error)
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'bad' },
          fieldStates: { email: { value: 'bad', invalid: true, error: 'Invalid email' } },
        }).disabled
      ).toBeUndefined();
    });

    it('should handle isValid: false matcher - field is invalid', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'email', isValid: false, visible: true },
      ];

      // Show error help when email is invalid
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'bad' },
          fieldStates: { email: { value: 'bad', invalid: true, error: 'Invalid email' } },
        }).visible
      ).toBe(true);

      // Hide when email is valid
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'test@example.com' },
          fieldStates: { email: { value: 'test@example.com', invalid: false } },
        }).visible
      ).toBeUndefined();
    });

    it('should handle isDisabled matcher - field is disabled', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'source', isDisabled: true, visible: false },
      ];

      // Hide when source is disabled
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { source: 'value' },
          fieldStates: { source: { value: 'value', disabled: true } },
        }).visible
      ).toBe(false);

      // Show when source is enabled
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { source: 'value' },
          fieldStates: { source: { value: 'value', disabled: false } },
        }).visible
      ).toBeUndefined();
    });

    it('should handle isDisabled: false matcher - field is enabled', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'source', isDisabled: false, disabled: true },
      ];

      // Disable when source is enabled (not disabled)
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { source: 'value' },
          fieldStates: { source: { value: 'value', disabled: false } },
        }).disabled
      ).toBe(true);

      // Don't disable when source is disabled
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { source: 'value' },
          fieldStates: { source: { value: 'value', disabled: true } },
        }).disabled
      ).toBeUndefined();
    });

    it('should combine isValid with value matchers', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'email', is: 'admin@test.com', isValid: true, visible: true },
      ];

      // Both value match AND valid = show
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'admin@test.com' },
          fieldStates: { email: { value: 'admin@test.com', invalid: false } },
        }).visible
      ).toBe(true);

      // Value matches but invalid = don't show
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'admin@test.com' },
          fieldStates: { email: { value: 'admin@test.com', invalid: true } },
        }).visible
      ).toBeUndefined();

      // Valid but value doesn't match = don't show
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'other@test.com' },
          fieldStates: { email: { value: 'other@test.com', invalid: false } },
        }).visible
      ).toBeUndefined();
    });

    it('should combine isDisabled with truthy matcher', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'toggle', truthy: true, isDisabled: false, set: 'enabled-and-on' },
      ];

      // Truthy AND not disabled = set value
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { toggle: true },
          fieldStates: { toggle: { value: true, disabled: false } },
        }).setValue
      ).toBe('enabled-and-on');

      // Truthy but disabled = no match
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { toggle: true },
          fieldStates: { toggle: { value: true, disabled: true } },
        }).setValue
      ).toBeUndefined();

      // Not truthy but enabled = no match
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { toggle: false },
          fieldStates: { toggle: { value: false, disabled: false } },
        }).setValue
      ).toBeUndefined();
    });

    it('should handle missing fieldStates gracefully', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'email', isValid: true, disabled: true },
      ];

      // Without fieldStates, isValid defaults to true (assume valid)
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'test@example.com' },
        }).disabled
      ).toBe(true);
    });

    it('should handle multi-field when with isTruthy', () => {
      const conditions: ConditionDescriptor[] = [
        {
          when: {
            email: { isValid: true },
            name: { isTruthy: true },
          },
          visible: true,
        },
      ];

      // Both conditions met
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'test@example.com', name: 'John' },
          fieldStates: { email: { value: 'test@example.com', invalid: false } },
        }).visible
      ).toBe(true);

      // Email valid but name is empty
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'test@example.com', name: '' },
          fieldStates: { email: { value: 'test@example.com', invalid: false } },
        }).visible
      ).toBeUndefined();

      // Name truthy but email invalid
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'bad', name: 'John' },
          fieldStates: { email: { value: 'bad', invalid: true, error: 'Invalid' } },
        }).visible
      ).toBeUndefined();
    });

    it('should handle multi-field when with is matcher', () => {
      const conditions: ConditionDescriptor[] = [
        {
          when: {
            status: { is: 'active' },
            role: { is: 'admin' },
          },
          disabled: true,
        },
      ];

      // Both match
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { status: 'active', role: 'admin' },
        }).disabled
      ).toBe(true);

      // Only one matches
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { status: 'active', role: 'user' },
        }).disabled
      ).toBeUndefined();
    });

    it('should handle multi-field when with isDisabled', () => {
      const conditions: ConditionDescriptor[] = [
        {
          when: {
            source: { isDisabled: false },
            target: { isTruthy: true },
          },
          set: 'ready',
        },
      ];

      // Source enabled and target truthy
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { source: 'a', target: 'b' },
          fieldStates: {
            source: { value: 'a', disabled: false },
            target: { value: 'b' },
          },
        }).setValue
      ).toBe('ready');

      // Source disabled
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { source: 'a', target: 'b' },
          fieldStates: {
            source: { value: 'a', disabled: true },
            target: { value: 'b' },
          },
        }).setValue
      ).toBeUndefined();
    });

    it('should handle multi-field when with combined matchers per field', () => {
      const conditions: ConditionDescriptor[] = [
        {
          when: {
            email: { isValid: true, isTruthy: true },
          },
          visible: true,
        },
      ];

      // Valid and truthy
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'test@example.com' },
          fieldStates: { email: { value: 'test@example.com', invalid: false } },
        }).visible
      ).toBe(true);

      // Truthy but invalid
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: 'bad' },
          fieldStates: { email: { value: 'bad', invalid: true } },
        }).visible
      ).toBeUndefined();

      // Valid but empty (falsy)
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { email: '' },
          fieldStates: { email: { value: '', invalid: false } },
        }).visible
      ).toBeUndefined();
    });

    it('should handle multi-field when with truthy alias', () => {
      // truthy and isTruthy should work the same
      const conditions: ConditionDescriptor[] = [
        {
          when: {
            a: { truthy: true },
            b: { isTruthy: true },
          },
          visible: true,
        },
      ];

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { a: 'yes', b: 'yes' },
        }).visible
      ).toBe(true);

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { a: '', b: 'yes' },
        }).visible
      ).toBeUndefined();
    });

    it('should use default truthy check when no matcher in multi-field', () => {
      const conditions: ConditionDescriptor[] = [
        {
          when: {
            a: {},
            b: {},
          },
          visible: true,
        },
      ];

      // Both truthy
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { a: 'yes', b: 'yes' },
        }).visible
      ).toBe(true);

      // One falsy
      expect(
        evaluateConditions({
          conditions,
          fieldValues: { a: 'yes', b: '' },
        }).visible
      ).toBeUndefined();
    });
  });

  describe('conditionMatches', () => {
    it('should check single condition match', () => {
      expect(
        conditionMatches({ when: 'signed', truthy: true }, { signed: true })
      ).toBe(true);

      expect(
        conditionMatches({ when: 'signed', truthy: true }, { signed: false })
      ).toBe(false);
    });

    it('should include record in context', () => {
      expect(
        conditionMatches(
          { selectWhen: 'record.isAdmin === true' },
          {},
          { isAdmin: true }
        )
      ).toBe(true);
    });
  });

  describe('mergeConditionResults', () => {
    it('should merge multiple results', () => {
      const results: ConditionResult[] = [
        {
          disabled: true,
          visible: true,
          setValue: undefined,
          hasDisabledCondition: true,
          hasVisibleCondition: true,
          hasSetCondition: false,
        },
        {
          disabled: false,
          visible: false,
          setValue: 'test',
          hasDisabledCondition: true,
          hasVisibleCondition: true,
          hasSetCondition: true,
        },
      ];

      const merged = mergeConditionResults(results);

      // disabled: OR logic
      expect(merged.disabled).toBe(true);
      // visible: AND logic
      expect(merged.visible).toBe(false);
      // setValue: last wins
      expect(merged.setValue).toBe('test');
    });

    it('should handle empty results array', () => {
      const merged = mergeConditionResults([]);

      expect(merged.disabled).toBeUndefined();
      expect(merged.visible).toBeUndefined();
      expect(merged.setValue).toBeUndefined();
    });
  });

  describe('inferFieldsFromConditions', () => {
    it('should extract when field references', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'client', disabled: true },
        { when: 'signed', visible: true },
      ];

      expect(inferFieldsFromConditions(conditions)).toEqual([
        'client',
        'signed',
      ]);
    });

    it('should infer fields from selectWhen expressions', () => {
      const conditions: ConditionDescriptor[] = [
        { selectWhen: 'client.id > 0 && signed', disabled: true },
      ];

      expect(inferFieldsFromConditions(conditions)).toEqual([
        'client',
        'signed',
      ]);
    });

    it('should include explicit subscribesTo', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'trigger', disabled: true, subscribesTo: ['extra', 'field'] },
      ];

      expect(inferFieldsFromConditions(conditions)).toEqual([
        'trigger',
        'extra',
        'field',
      ]);
    });

    it('should return unique fields', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'client', disabled: true },
        { selectWhen: 'client.id > 0', visible: true },
      ];

      expect(inferFieldsFromConditions(conditions)).toEqual(['client']);
    });

    it('should extract fields from multi-field when object', () => {
      const conditions: ConditionDescriptor[] = [
        {
          when: {
            email: { isValid: true },
            name: { isTruthy: true },
            status: { is: 'active' },
          },
          visible: true,
        },
      ];

      expect(inferFieldsFromConditions(conditions)).toEqual([
        'email',
        'name',
        'status',
      ]);
    });

    it('should combine multi-field when with other conditions', () => {
      const conditions: ConditionDescriptor[] = [
        { when: 'client', disabled: true },
        {
          when: {
            email: { isValid: true },
            name: { isTruthy: true },
          },
          visible: true,
        },
        { selectWhen: 'approved && signed', set: 'done' },
      ];

      expect(inferFieldsFromConditions(conditions)).toEqual([
        'client',
        'email',
        'name',
        'approved',
        'signed',
      ]);
    });
  });
});
