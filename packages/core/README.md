# @formality/core

Framework-agnostic form utilities for the Formality framework. This package provides pure functions for expression evaluation, condition processing, validation, and configuration management that can be used with any JavaScript framework.

## Installation

```bash
npm install @formality/core
# or
pnpm add @formality/core
# or
yarn add @formality/core
```

## Overview

`@formality/core` is the foundation of the Formality framework. It provides:

- **Expression Engine**: Parse and evaluate dynamic expressions against form state
- **Condition Evaluation**: Process conditional visibility, disabled states, and value setting
- **Validation Pipeline**: Compose and run validators with error message resolution
- **Value Transformation**: Parse input values and format display values
- **Configuration Utilities**: Merge and resolve field configurations
- **Label Resolution**: Auto-generate and resolve field labels

## Key Features

### Zero Framework Dependencies

This package has no React, Vue, or Svelte dependencies. It exports pure functions that can be used in any JavaScript environment.

### Expression Evaluation

Evaluate dynamic expressions against form state:

```typescript
import { evaluate, buildEvaluationContext } from '@formality/core';

const context = buildEvaluationContext({
  fields: {
    client: { value: { id: 5, name: 'Acme' } },
    signed: { value: true },
  },
  record: { originalName: 'Old Name' },
});

// Simple field access
evaluate('client', context);        // { id: 5, name: 'Acme' }
evaluate('client.id', context);     // 5

// Expressions
evaluate('client && signed', context);  // true
evaluate('client.id > 3', context);     // true
```

### Condition Evaluation

Evaluate conditions for field visibility and disabled state:

```typescript
import { evaluateConditions } from '@formality/core';

const result = evaluateConditions({
  conditions: [
    { when: 'signed', is: false, disabled: true },
    { when: 'archived', truthy: true, visible: false },
  ],
  fieldValues: { signed: false, archived: false },
});

result.disabled;  // true
result.visible;   // true
```

### Validation

Compose and run validators:

```typescript
import { runValidator, composeValidators, required, minLength } from '@formality/core';

const validator = composeValidators([required(), minLength(3)]);
const result = await runValidator(validator, 'ab', {});
// { type: 'minLength', message: 'Minimum 3 characters required' }
```

### Value Transformation

Parse and format values:

```typescript
import { parse, format, createFloatParser, createFloatFormatter } from '@formality/core';

const parser = createFloatParser();
const formatter = createFloatFormatter(2);

parse('42.567', parser);        // 42.567 (number)
format(42.567, formatter);      // '42.57' (string, 2 decimals)
```

### Label Resolution

Auto-generate human-readable labels from field names:

```typescript
import { humanizeLabel, resolveLabel } from '@formality/core';

humanizeLabel('clientContact');      // 'Client Contact'
humanizeLabel('minGrossMargin');     // 'Min Gross Margin'
humanizeLabel('userId');             // 'User Id'
```

## API Reference

### Expression Engine

| Function | Description |
|----------|-------------|
| `evaluate(expr, context)` | Evaluate an expression string against context |
| `evaluateDescriptor(descriptor, context)` | Evaluate a SelectValue descriptor |
| `buildEvaluationContext(fields, record, props)` | Build evaluation context |
| `buildFormContext(fields, record)` | Build form-level context |
| `buildFieldContext(name, fields, record, props)` | Build field-level context |
| `inferFieldsFromExpression(expr)` | Extract field dependencies from expression |
| `inferFieldsFromDescriptor(descriptor)` | Extract field dependencies from descriptor |
| `clearExpressionCache()` | Clear the expression parser cache |

### Condition Evaluation

| Function | Description |
|----------|-------------|
| `evaluateConditions(input)` | Evaluate conditions and return disabled/visible/setValue |
| `conditionMatches(condition, context)` | Check if a single condition matches |
| `mergeConditionResults(results)` | Merge multiple condition results |
| `inferFieldsFromConditions(conditions)` | Extract field dependencies from conditions |

### Validation

| Function | Description |
|----------|-------------|
| `runValidator(spec, value, formValues, validators)` | Run validator(s) asynchronously |
| `runValidatorSync(spec, value, formValues, validators)` | Run validator(s) synchronously |
| `isValid(result)` | Check if validation result is valid |
| `composeValidators(validators)` | Compose multiple validators |
| `required()` | Built-in required validator |
| `minLength(min)` | Built-in minimum length validator |
| `maxLength(max)` | Built-in maximum length validator |
| `pattern(regex)` | Built-in pattern validator |
| `resolveErrorMessage(result, messages)` | Resolve error message from result |
| `formatTypeAsMessage(type)` | Format validation type as message |
| `createErrorMessages(config)` | Create error messages configuration |
| `getErrorType(result)` | Get the error type from result |
| `createValidationError(type, message)` | Create a validation error object |

### Value Transformation

| Function | Description |
|----------|-------------|
| `parse(value, parser, parsers)` | Parse input value |
| `format(value, formatter, formatters)` | Format value for display |
| `extractValueField(value, field)` | Extract a field from a value object |
| `transformFieldName(name, config)` | Transform field name based on config |
| `createFloatParser()` | Create float parser |
| `createFloatFormatter(decimals)` | Create float formatter with precision |
| `createIntParser()` | Create integer parser |
| `createTrimParser()` | Create string trimming parser |
| `createDefaultParsers()` | Create default parsers configuration |
| `createDefaultFormatters()` | Create default formatters configuration |

### Configuration

| Function | Description |
|----------|-------------|
| `deepMerge(target, source)` | Deep merge objects |
| `mergeInputConfigs(base, override)` | Merge input configurations |
| `resolveInputConfig(type, inputs, formInputs)` | Resolve input configuration |
| `resolveFieldType(name, config, inputs)` | Resolve field type from config |
| `mergeStaticProps(layers)` | Merge static props from multiple layers |
| `mergeFieldProps(layers)` | Merge props from multiple layers |
| `createConfigContext(config)` | Create configuration context |
| `resolveInitialValue(name, config, inputConfig, record)` | Resolve initial field value |
| `resolveAllInitialValues(config, inputs, record)` | Resolve all initial values |
| `isEmptyValue(value)` | Check if a value is empty |
| `getInputDefaultValue(inputConfig)` | Get default value from input config |
| `mergeRecordWithDefaults(config, inputs, record)` | Merge record with default values |

### Labels & Ordering

| Function | Description |
|----------|-------------|
| `humanizeLabel(fieldName)` | Convert camelCase to human-readable |
| `resolveLabel(name, config, evaluated, props)` | Resolve field label |
| `resolveFormTitle(formConfig, record)` | Resolve form title |
| `isAutoGeneratedLabel(label, fieldName)` | Check if label was auto-generated |
| `createLabelWithUnit(label, unit)` | Create label with unit suffix |
| `parseLabelWithUnit(labelWithUnit)` | Parse label with unit |
| `sortFieldsByOrder(fields, config)` | Sort fields by order property |
| `getUnusedFields(allFields, usedFields)` | Get unused field names |
| `getOrderedUnusedFields(allFields, usedFields, config)` | Get ordered unused fields |

## TypeScript Types

```typescript
import type {
  // Configuration
  SelectValue,
  SelectFunction,
  InputConfig,
  FieldConfig,
  FormConfig,
  FormFieldsConfig,
  GroupConfig,
  FormalityProviderConfig,

  // State
  FieldError,
  FieldState,
  FormState,

  // Conditions
  ConditionDescriptor,
  ConditionResult,

  // Validation
  ValidatorSpec,
  ValidatorFunction,
  ValidationResult,
  ValidatorFactory,
  ValidatorsConfig,
  ErrorMessagesConfig,

  // Transform
  ParserFunction,
  FormatterFunction,
  ParserSpec,
  FormatterSpec,
  ParsersConfig,
  FormattersConfig,

  // Expression
  EvaluationContext,
} from '@formality/core';
```

## Constants

| Constant | Description |
|----------|-------------|
| `QUALIFIED_PREFIXES` | Prefixes for qualified field references |
| `KEYWORDS` | Reserved keywords in expressions |

## License

MIT
