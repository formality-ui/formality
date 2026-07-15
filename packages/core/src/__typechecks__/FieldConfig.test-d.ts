// Type-level assertions for the field-level override fields on FieldConfig
// (PRD §6.4 — added in P1.M1.T1.S1).
//
// This file is NOT a runtime test (vitest's `include` only picks up
// `*.test.ts`). It is a pure type-check file consumed by `tsc --build` (the
// root `pnpm typecheck` gate). The core `tsconfig.json` excludes only
// `src/**/*.test.ts` and `src/**/__tests__/**`, so this `.test-d.ts` is
// compiled (and errors fail the gate) but never executed.
//
// What is being proved:
//   1. All six override fields exist on FieldConfig and accept the exact
//      types specified by the task contract (PRD §6.4.0–§6.4.4).
//   2. §6.4.5 semantics — `null`, `false`, `0`, and `""` are all meaningful
//      overrides, i.e. assignable to `defaultValue: unknown`.
//   3. `parser` / `formatter` accept BOTH a named string AND an inline
//      function (union).
//   4. `debounce` accepts both a number and `false`.
//   5. `getSubmitField` accepts an inline `(fieldName: string) => string`.

import type { FieldConfig } from "../types/config";

// ---------------------------------------------------------------------------
// 1. All six fields present with the exact types (assignability via literals).
// ---------------------------------------------------------------------------
const allFields: FieldConfig = {
  defaultValue: "anything",
  debounce: 500,
  parser: "float",
  formatter: "uppercase",
  valueField: "id",
  getSubmitField: (name: string) => `${name}Id`,
};
void allFields;

// ---------------------------------------------------------------------------
// 2. §6.4.5 semantics — null / false / 0 / "" are meaningful overrides
//    (all assignable to `unknown`).
// ---------------------------------------------------------------------------
const meaningfulNull: FieldConfig = { defaultValue: null };
const meaningfulFalse: FieldConfig = { defaultValue: false };
const meaningfulZero: FieldConfig = { defaultValue: 0 };
const meaningfulEmpty: FieldConfig = { defaultValue: "" };
void meaningfulNull;
void meaningfulFalse;
void meaningfulZero;
void meaningfulEmpty;

// ---------------------------------------------------------------------------
// 3. parser / formatter: union of named string | inline function.
// ---------------------------------------------------------------------------
const parserAsString: FieldConfig = { parser: "float" };
const parserAsFunction: FieldConfig = {
  parser: (value: unknown) => String(value),
};
const formatterAsString: FieldConfig = { formatter: "uppercase" };
const formatterAsFunction: FieldConfig = {
  formatter: (value: unknown) => String(value),
};
void parserAsString;
void parserAsFunction;
void formatterAsString;
void formatterAsFunction;

// ---------------------------------------------------------------------------
// 4. debounce: number | false.
// ---------------------------------------------------------------------------
const debounceNumber: FieldConfig = { debounce: 750 };
const debounceFalse: FieldConfig = { debounce: false };
void debounceNumber;
void debounceFalse;

// ---------------------------------------------------------------------------
// 5. getSubmitField: inline field-name transform function.
// ---------------------------------------------------------------------------
const submitFieldOverride: FieldConfig = {
  getSubmitField: (fieldName: string) => `${fieldName}_id`,
};
void submitFieldOverride;
