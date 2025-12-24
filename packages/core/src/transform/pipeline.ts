// @formality-ui/core - Value Transformation Pipeline
// Pure functions for parsing and formatting field values
// ZERO framework dependencies

/**
 * Parser function type
 * Transforms user input into form value
 */
export type ParserFunction = (value: unknown) => unknown;

/**
 * Formatter function type
 * Transforms form value into display value
 */
export type FormatterFunction = (value: unknown) => unknown;

/**
 * Parser specification - can be a named parser or inline function
 */
export type ParserSpec = string | ParserFunction;

/**
 * Formatter specification - can be a named formatter or inline function
 */
export type FormatterSpec = string | FormatterFunction;

/**
 * Named parsers configuration
 */
export type ParsersConfig = Record<string, ParserFunction>;

/**
 * Named formatters configuration
 */
export type FormattersConfig = Record<string, FormatterFunction>;

/**
 * Parse an input value using a parser specification
 *
 * Used on onChange to transform user input into form value.
 *
 * @param value - Raw input value from component
 * @param parserSpec - Parser specification (name or function)
 * @param namedParsers - Named parsers config from provider
 * @returns Parsed value for form state
 *
 * @example
 * // Named parser
 * parse("42.69", "float", { float: v => parseFloat(String(v)) || 0 })
 * // → 42.69
 *
 * // Inline parser
 * parse("42.69", v => parseFloat(String(v)) || 0)
 * // → 42.69
 */
export function parse(
  value: unknown,
  parserSpec?: ParserSpec,
  namedParsers?: ParsersConfig
): unknown {
  // No parser - return value as-is
  if (parserSpec === undefined) {
    return value;
  }

  // Named parser
  if (typeof parserSpec === 'string') {
    const parser = namedParsers?.[parserSpec];
    if (!parser) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Parser "${parserSpec}" not found in parsers config`);
      }
      return value;
    }
    try {
      return parser(value);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Parser "${parserSpec}" threw error:`, error);
      }
      return value;
    }
  }

  // Inline parser function
  if (typeof parserSpec === 'function') {
    try {
      return parserSpec(value);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Inline parser threw error:', error);
      }
      return value;
    }
  }

  return value;
}

/**
 * Format a form value using a formatter specification
 *
 * Used on render to transform form value into display value.
 *
 * @param value - Form state value
 * @param formatterSpec - Formatter specification (name or function)
 * @param namedFormatters - Named formatters config from provider
 * @returns Formatted value for display
 *
 * @example
 * // Named formatter
 * format(42.69, "float", { float: v => typeof v === 'number' ? v.toFixed(2) : '' })
 * // → "42.69"
 *
 * // Inline formatter
 * format(42.69, v => typeof v === 'number' ? v.toFixed(2) : '')
 * // → "42.69"
 */
export function format(
  value: unknown,
  formatterSpec?: FormatterSpec,
  namedFormatters?: FormattersConfig
): unknown {
  // No formatter - return value as-is
  if (formatterSpec === undefined) {
    return value;
  }

  // Named formatter
  if (typeof formatterSpec === 'string') {
    const formatter = namedFormatters?.[formatterSpec];
    if (!formatter) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Formatter "${formatterSpec}" not found in formatters config`);
      }
      return value;
    }
    try {
      return formatter(value);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Formatter "${formatterSpec}" threw error:`, error);
      }
      return value;
    }
  }

  // Inline formatter function
  if (typeof formatterSpec === 'function') {
    try {
      return formatterSpec(value);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Inline formatter threw error:', error);
      }
      return value;
    }
  }

  return value;
}

/**
 * Extract the actual value from a complex object using valueField
 *
 * Used for autocomplete/select components that store objects but need to
 * extract a specific property for submission.
 *
 * @param value - Complex value (object or primitive)
 * @param valueField - Property name to extract
 * @returns Extracted value or original value if not applicable
 *
 * @example
 * extractValueField({ id: 5, name: "Acme" }, "id")
 * // → 5
 *
 * extractValueField("simple", "id")
 * // → "simple" (no extraction needed)
 */
export function extractValueField(
  value: unknown,
  valueField?: string
): unknown {
  // No valueField - return as-is
  if (!valueField) {
    return value;
  }

  // Value is null/undefined - return as-is
  if (value === null || value === undefined) {
    return value;
  }

  // Value is not an object - return as-is
  if (typeof value !== 'object') {
    return value;
  }

  // Extract the field
  return (value as Record<string, unknown>)[valueField];
}

/**
 * Transform a field name for submission
 *
 * Used for fields that need a different name in the submitted data.
 * Example: "client" field with getSubmitField → "clientId"
 *
 * @param fieldName - Original field name
 * @param getSubmitField - Transform function
 * @returns Transformed field name
 *
 * @example
 * transformFieldName("client", name => `${name}Id`)
 * // → "clientId"
 */
export function transformFieldName(
  fieldName: string,
  getSubmitField?: (name: string) => string
): string {
  if (!getSubmitField) {
    return fieldName;
  }
  return getSubmitField(fieldName);
}

/**
 * Create a float parser with configurable behavior
 *
 * @param fallback - Value to return on parse failure (default: 0)
 * @returns Parser function
 */
export function createFloatParser(fallback: number = 0): ParserFunction {
  return (value: unknown) => {
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? fallback : parsed;
  };
}

/**
 * Create a float formatter with configurable precision
 *
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatter function
 */
export function createFloatFormatter(precision: number = 2): FormatterFunction {
  return (value: unknown) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '';
    }
    return value.toFixed(precision);
  };
}

/**
 * Create an integer parser
 *
 * @param fallback - Value to return on parse failure (default: 0)
 * @returns Parser function
 */
export function createIntParser(fallback: number = 0): ParserFunction {
  return (value: unknown) => {
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? fallback : parsed;
  };
}

/**
 * Create a trim parser that removes whitespace
 *
 * @returns Parser function
 */
export function createTrimParser(): ParserFunction {
  return (value: unknown) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.trim();
  };
}

/**
 * Create default parsers config
 *
 * @returns Standard parsers config
 */
export function createDefaultParsers(): ParsersConfig {
  return {
    float: createFloatParser(),
    int: createIntParser(),
    integer: createIntParser(),
    trim: createTrimParser(),
    string: (value) => String(value ?? ''),
  };
}

/**
 * Create default formatters config
 *
 * @returns Standard formatters config
 */
export function createDefaultFormatters(): FormattersConfig {
  return {
    float: createFloatFormatter(2),
    float2: createFloatFormatter(2),
    float3: createFloatFormatter(3),
    float4: createFloatFormatter(4),
    percent: createFloatFormatter(2),
    percent3: createFloatFormatter(3),
    integer: (value) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return '';
      }
      return Math.round(value).toString();
    },
    string: (value) => String(value ?? ''),
  };
}
