/**
 * Formality Examples Index
 * ========================
 *
 * This directory contains comprehensive examples showcasing every feature
 * of the Formality form library.
 *
 * QUICK START:
 * - 01-basic-form.tsx       → Start here! Basic Form, Field, FormalityProvider
 *
 * INPUT CONFIGURATION:
 * - 02-input-types.tsx      → InputConfig options: component, valueField, parser/formatter
 *
 * CONDITIONAL LOGIC:
 * - 03-conditions.tsx       → when, is, truthy, disabled, visible, set, selectSet
 *
 * VALIDATION:
 * - 04-validation.tsx       → Sync/async validators, error messages, composition
 *
 * FIELD DEPENDENCIES:
 * - 05-field-dependencies   → selectProps, cascading selects, expression syntax
 *
 * AUTO-SAVE:
 * - 06-auto-save.tsx        → autoSave, debounce, immediate submission
 *
 * ADVANCED FEATURES:
 * - 07-advanced-features    → UnusedFields, ordering, recordKey, templates
 *
 * REAL-WORLD EXAMPLE:
 * - 08-real-world-example   → Complete Quote form with all features combined
 *
 * STRING VS FUNCTION:
 * - 09-string-vs-function   → When to use expressions vs callbacks
 */

// Basic Form Setup
export {
  BasicForm,
  BasicFormWithData,
} from './01-basic-form';

// Input Type Configuration
export {
  InputTypesDemo,
} from './02-input-types';

// Conditional Logic
export {
  VisibilityExample,
  DisabledExample,
  ExactMatchExample,
  SetValueExample,
  SelectSetExample,
  ComplexConditionExample,
  FieldGroupExample,
  NestedFieldGroupExample,
  FunctionConditionExample,
} from './03-conditions';

// Validation
export {
  BasicValidationExample,
  InlineValidationExample,
  AsyncValidationExample,
  CrossFieldValidationExample,
  ConditionalValidationExample,
  ValidatorReturnTypesExample,
} from './04-validation';

// Field Dependencies
export {
  CascadingSelectsExample,
  ExpressionSyntaxExample,
  QualifiedPathsExample,
  SelectDefaultFieldPropsExample,
  DynamicLabelsExample,
  FunctionSelectPropsExample,
  NestedObjectExample,
} from './05-field-dependencies';

// Auto-Save
export {
  BasicAutoSaveExample,
  CustomDebounceExample,
  MixedDebounceExample,
  ValidatedAutoSaveExample,
  ConditionalAutoSaveExample,
  HybridSaveExample,
} from './06-auto-save';

// Advanced Features
export {
  UnusedFieldsExample,
  FieldOrderingExample,
  RecordKeyExample,
  FormTitleExample,
  ProvideStateExample,
  PassSubscriptionsExample,
  FieldRenderFunctionExample,
  CustomTemplateExample,
} from './07-advanced-features';

// Real-World Example
export {
  QuoteForm,
  NewQuoteDemo,
  EditQuoteDemo,
} from './08-real-world-example';

// String vs Function Comparison
export {
  SelectPropsComparisonExample,
  ConditionWhenComparisonExample,
  SetValueComparisonExample,
  DefaultFieldPropsComparisonExample,
  WhenToUseGuide,
} from './09-string-vs-function';
