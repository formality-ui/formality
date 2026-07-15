// @formality-ui/core - Config Module Barrel Export

export {
  mergeConfigs,
  deepMerge,
  mergeInputConfigs,
  resolveInputConfig,
  resolveFieldType,
  mergeStaticProps,
  mergeFieldProps,
  createConfigContext,
} from "./merge";

export {
  resolveFieldOverType,
  resolveInitialValue,
  resolveAllInitialValues,
  isEmptyValue,
  getInputDefaultValue,
  mergeRecordWithDefaults,
} from "./defaults";

export {
  sortFieldsByOrder,
  getUnusedFields,
  getOrderedUnusedFields,
} from "./ordering";
