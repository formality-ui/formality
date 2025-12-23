// @formality/core - Expression Module Barrel Export

export type { EvaluationContext } from './evaluate';

export {
  evaluate,
  evaluateDescriptor,
  clearExpressionCache,
} from './evaluate';

export {
  QUALIFIED_PREFIXES,
  KEYWORDS,
  FIELD_PROXY_MARKER,
  FIELD_PROXY_VALUE,
  buildFormContext,
  buildFieldContext,
  buildEvaluationContext,
  createFieldStateProxy,
  isFieldProxy,
  unwrapFieldProxy,
} from './context';

export {
  inferFieldsFromExpression,
  inferFieldsFromDescriptor,
} from './infer';
