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
  buildFormContext,
  buildFieldContext,
  buildEvaluationContext,
} from './context';

export {
  inferFieldsFromExpression,
  inferFieldsFromDescriptor,
} from './infer';
