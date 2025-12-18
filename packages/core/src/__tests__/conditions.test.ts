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
        { when: 'trigger', truthy: true, selectSet: 'source.value' },
      ];

      expect(
        evaluateConditions({
          conditions,
          fieldValues: { trigger: true, source: { value: 42 } },
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
  });
});
