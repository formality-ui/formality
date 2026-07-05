// Type-level assertions for FieldProps name-narrowing (PRD §C.4 / T2.1).
//
// This file is NOT a runtime test (vitest's `include` only picks up
// `*.test.{ts,tsx}`; this file is named `*.test-d.ts` and is excluded from
// vitest). It is a pure type-check file consumed by `tsc --build` (the root
// `pnpm typecheck` gate). The `// @ts-expect-error` comments below MUST be
// honored by the compiler — if any of them becomes "unused" (TS2578), the
// corresponding bad input was NOT rejected and the feature is broken (a CI
// failure).
//
// What is being proved:
//   1. The DEFAULT (`FieldProps` === `FieldProps<string>`) still accepts ANY
//      string name → non-breaking (today's `<Field name={anyString} />` still
//      compiles).
//   2. A NARROWED `FieldProps<"name" | "email">` accepts its known names.
//   3. A NARROWED `FieldProps<"name" | "email">` REJECTS a typo name.
//   4. `FieldProps` REJECTS a non-string name (`TName extends string`).

import type { FieldProps } from "../components/Field";

// ---------------------------------------------------------------------------
// 1. Default (`FieldProps`): any string name accepted — non-breaking.
// ---------------------------------------------------------------------------
const defaultAcceptsAnyString: FieldProps = { name: "whatever" };
const defaultAcceptsAnyString2: FieldProps<string> = { name: "ofice" };
void defaultAcceptsAnyString;
void defaultAcceptsAnyString2;

// ---------------------------------------------------------------------------
// 2. Narrowed `FieldProps<Names>`: known names accepted.
// ---------------------------------------------------------------------------
type Names = "name" | "email";

const narrowAcceptsKnownName: FieldProps<Names> = { name: "name" };
const narrowAcceptsKnownEmail: FieldProps<Names> = { name: "email" };
void narrowAcceptsKnownName;
void narrowAcceptsKnownEmail;

// ---------------------------------------------------------------------------
// 3. Narrowed `FieldProps<Names>`: typo name REJECTED.
//    The @ts-expect-error is attached to the offending property line so the
//    compiler reports TS2353/TS2322 there and consumes the directive.
// ---------------------------------------------------------------------------
const narrowRejectsTypo: FieldProps<Names> = {
  // @ts-expect-error — `typo` is not in Names; must error.
  name: "typo",
};
void narrowRejectsTypo;

const narrowRejectsTypo2: FieldProps<Names> = {
  // @ts-expect-error — `ofice` is not in Names; must error.
  name: "ofice",
};
void narrowRejectsTypo2;

// ---------------------------------------------------------------------------
// 4. Default `FieldProps`: non-string name REJECTED (`TName extends string`).
// ---------------------------------------------------------------------------
const rejectsNonStringName: FieldProps = {
  // @ts-expect-error — `name` must be a string (TName extends string); must error.
  name: 123,
};
void rejectsNonStringName;
