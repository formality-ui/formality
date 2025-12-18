import { describe, it, expect } from 'vitest';
import {
  parse,
  format,
  extractValueField,
  transformFieldName,
  createFloatParser,
  createFloatFormatter,
  createIntParser,
  createTrimParser,
  createDefaultParsers,
  createDefaultFormatters,
} from '../index';

describe('Transform Pipeline', () => {
  describe('parse', () => {
    it('should return value as-is when no parser', () => {
      expect(parse('hello')).toBe('hello');
      expect(parse(42)).toBe(42);
    });

    it('should apply named parser', () => {
      const parsers = {
        toUpper: (v: unknown) => String(v).toUpperCase(),
      };

      expect(parse('hello', 'toUpper', parsers)).toBe('HELLO');
    });

    it('should apply inline parser', () => {
      const parser = (v: unknown) => Number(v) * 2;
      expect(parse('5', parser)).toBe(10);
    });

    it('should handle missing named parser gracefully', () => {
      expect(parse('value', 'nonExistent', {})).toBe('value');
    });

    it('should handle parser errors gracefully', () => {
      const badParser = () => {
        throw new Error('Parser error');
      };
      expect(parse('value', badParser)).toBe('value');
    });
  });

  describe('format', () => {
    it('should return value as-is when no formatter', () => {
      expect(format('hello')).toBe('hello');
      expect(format(42)).toBe(42);
    });

    it('should apply named formatter', () => {
      const formatters = {
        currency: (v: unknown) => `$${Number(v).toFixed(2)}`,
      };

      expect(format(42.5, 'currency', formatters)).toBe('$42.50');
    });

    it('should apply inline formatter', () => {
      const formatter = (v: unknown) => `Value: ${v}`;
      expect(format(5, formatter)).toBe('Value: 5');
    });

    it('should handle formatter errors gracefully', () => {
      const badFormatter = () => {
        throw new Error('Formatter error');
      };
      expect(format('value', badFormatter)).toBe('value');
    });
  });

  describe('extractValueField', () => {
    it('should extract field from object', () => {
      const obj = { id: 5, name: 'Acme' };
      expect(extractValueField(obj, 'id')).toBe(5);
      expect(extractValueField(obj, 'name')).toBe('Acme');
    });

    it('should return as-is when no valueField', () => {
      const obj = { id: 5, name: 'Acme' };
      expect(extractValueField(obj)).toBe(obj);
    });

    it('should return primitive values as-is', () => {
      expect(extractValueField('simple', 'id')).toBe('simple');
      expect(extractValueField(42, 'id')).toBe(42);
    });

    it('should handle null/undefined', () => {
      expect(extractValueField(null, 'id')).toBe(null);
      expect(extractValueField(undefined, 'id')).toBe(undefined);
    });
  });

  describe('transformFieldName', () => {
    it('should return name as-is when no transform', () => {
      expect(transformFieldName('client')).toBe('client');
    });

    it('should apply transform function', () => {
      const transform = (name: string) => `${name}Id`;
      expect(transformFieldName('client', transform)).toBe('clientId');
    });
  });

  describe('Built-in Parsers', () => {
    describe('createFloatParser', () => {
      it('should parse float strings', () => {
        const parser = createFloatParser();
        expect(parser('42.69')).toBe(42.69);
        expect(parser('0.5')).toBe(0.5);
      });

      it('should use fallback for invalid input', () => {
        const parser = createFloatParser(0);
        expect(parser('invalid')).toBe(0);

        const customFallback = createFloatParser(-1);
        expect(customFallback('invalid')).toBe(-1);
      });
    });

    describe('createIntParser', () => {
      it('should parse integer strings', () => {
        const parser = createIntParser();
        expect(parser('42')).toBe(42);
        expect(parser('42.9')).toBe(42); // Truncates
      });

      it('should use fallback for invalid input', () => {
        const parser = createIntParser(0);
        expect(parser('invalid')).toBe(0);
      });
    });

    describe('createTrimParser', () => {
      it('should trim whitespace', () => {
        const parser = createTrimParser();
        expect(parser('  hello  ')).toBe('hello');
        expect(parser('\t\n test \t\n')).toBe('test');
      });

      it('should return non-strings as-is', () => {
        const parser = createTrimParser();
        expect(parser(42)).toBe(42);
        expect(parser(null)).toBe(null);
      });
    });
  });

  describe('Built-in Formatters', () => {
    describe('createFloatFormatter', () => {
      it('should format with specified precision', () => {
        const format2 = createFloatFormatter(2);
        expect(format2(42.691)).toBe('42.69');

        const format3 = createFloatFormatter(3);
        expect(format3(42.6919)).toBe('42.692');
      });

      it('should return empty string for non-numbers', () => {
        const formatter = createFloatFormatter();
        expect(formatter('not a number')).toBe('');
        expect(formatter(NaN)).toBe('');
      });
    });
  });

  describe('Default Parsers/Formatters', () => {
    it('should create default parsers', () => {
      const parsers = createDefaultParsers();

      expect(parsers.float('42.69')).toBe(42.69);
      expect(parsers.int('42')).toBe(42);
      expect(parsers.integer('42')).toBe(42);
      expect(parsers.trim('  hello  ')).toBe('hello');
      expect(parsers.string(42)).toBe('42');
    });

    it('should create default formatters', () => {
      const formatters = createDefaultFormatters();

      expect(formatters.float(42.691)).toBe('42.69');
      expect(formatters.float2(42.691)).toBe('42.69');
      expect(formatters.float3(42.6919)).toBe('42.692');
      expect(formatters.float4(42.69199)).toBe('42.6920');
      expect(formatters.percent(42.5)).toBe('42.50');
      expect(formatters.integer(42.9)).toBe('43');
      expect(formatters.string(42)).toBe('42');
    });
  });
});
