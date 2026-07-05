// Type-level assertions for ReactFormFieldsConfig key-narrowing (PRD §C.4 / T2.1).
//
// This file is NOT a runtime test (vitest's `include` only picks up `*.test.{ts,tsx}`).
// It is a pure type-check file consumed by `tsc --build` (the root `pnpm typecheck`
// gate). The `// @ts-expect-error` comments below MUST be honored by the compiler —
// if any of them becomes "unused" (TS2578), the corresponding typo was NOT rejected
// and the feature is broken (a CI failure).
//
// What is being proved:
//   1. The DEFAULT (V = FieldValues) still accepts any string key  → non-breaking.
//   2. A CONCRETE V accepts its known field names.
//   3. A CONCRETE V rejects unknown/typo keys (compile error).
//   4. FormProps<TFieldValues>["config"] inherits the narrowing (Form.tsx:48).

import type { FieldValues } from "react-hook-form";
import type { ReactFormFieldsConfig } from "../overlays";
import type { FormProps } from "../components/Form";

// ---------------------------------------------------------------------------
// 1. Default (V = FieldValues): any string key accepted — non-breaking.
// ---------------------------------------------------------------------------
type DefaultConfig = ReactFormFieldsConfig<FieldValues>;

const defaultAcceptsAnyStringKey: DefaultConfig = {
  anything: { type: "text" },
  ofice: { type: "text" },
};

// Also via the implicit default (no type argument).
const defaultOmitted: ReactFormFieldsConfig = {
  whatever: { type: "text" },
};

// Silence "unused" — these bindings exist only for type-checking.
void defaultAcceptsAnyStringKey;
void defaultOmitted;

// ---------------------------------------------------------------------------
// 2. Concrete V: known field names accepted.
//    Note: Record<K, T> requires EVERY key in K to be present, so a valid
//    value must include all of ClientValues' keys.
// ---------------------------------------------------------------------------
interface ClientValues {
  name: string;
  email: string;
}

type NarrowConfig = ReactFormFieldsConfig<ClientValues>;

const narrowAcceptsKnownKeys: NarrowConfig = {
  name: { type: "text" },
  email: { type: "email" },
};
void narrowAcceptsKnownKeys;

// ---------------------------------------------------------------------------
// 3. Concrete V: unknown/typo keys REJECTED.
//    The @ts-expect-error is attached to the offending property line so the
//    compiler reports TS2353 there and consumes the directive.
// ---------------------------------------------------------------------------
const narrowRejectsTypo: NarrowConfig = {
  // @ts-expect-error — `ofice` is not a key of ClientValues; must error.
  ofice: { type: "text" },
  name: { type: "text" },
  email: { type: "text" },
};
void narrowRejectsTypo;

const narrowRejectsOther: NarrowConfig = {
  name: { type: "text" },
  email: { type: "text" },
  // @ts-expect-error — `bogus` is not a key of ClientValues; must error.
  bogus: { type: "text" },
};
void narrowRejectsOther;

// ---------------------------------------------------------------------------
// 4. FormProps<TFieldValues>["config"] inherits the narrowing (Form.tsx:48).
// ---------------------------------------------------------------------------
type NarrowFormProps = FormProps<ClientValues>;

const formPropsAcceptsKnownKeys: NarrowFormProps["config"] = {
  name: { type: "text" },
  email: { type: "text" },
};
void formPropsAcceptsKnownKeys;

const formPropsRejectsTypo: NarrowFormProps["config"] = {
  name: { type: "text" },
  email: { type: "text" },
  // @ts-expect-error — typo in <Form<ClientValues> config={{...}}> must error.
  ofice: { type: "text" },
};
void formPropsRejectsTypo;

// ---------------------------------------------------------------------------
// 5. Default FormProps still accepts any string key (non-breaking on Form too).
// ---------------------------------------------------------------------------
const defaultFormProps: FormProps["config"] = {
  anything: { type: "text" },
};
void defaultFormProps;
