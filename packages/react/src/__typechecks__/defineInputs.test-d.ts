// Type-level assertions for defineInputs (PRD §C.4 / T2.2).
//
// This file is NOT a runtime test (vitest's `include` only picks up
// `*.test.{ts,tsx}`). It is a pure type-check file consumed by `tsc --build`
// (the root `pnpm typecheck` gate). The `// @ts-expect-error` comments below
// MUST be honored by the compiler — if any of them becomes "unused" (TS2578),
// the corresponding rejection was NOT enforced and the feature is broken (a CI
// failure).
//
// What is being proved:
//   1. `keyof typeof inputs` resolves to the LITERAL key union of the argument
//      (not widened to `string | number`).
//   2. A typo'd key (e.g. `"texField"`) is REJECTED by the type system.
//   3. A key never registered (e.g. `"radio"`) is REJECTED.
//   4. The `Record<string, ReactInputConfig>` constraint flows T1.1's checking
//      through: a non-component `component` value is REJECTED.

import { defineInputs } from "../overlays";
import type { ComponentType } from "react";

const Stub: ComponentType<any> = () => null;

// ---------------------------------------------------------------------------
// 1. The literal key union is derived from the argument's shape.
// ---------------------------------------------------------------------------
const inputs = defineInputs({
  textField: { component: Stub, defaultValue: "" },
  switch: { component: Stub, defaultValue: false },
});

// `InputType` is EXACTLY `"textField" | "switch"` — assigning a valid key works.
type InputType = keyof typeof inputs;
const _ok1: InputType = "textField";
const _ok2: InputType = "switch";

// Silence "unused" — these bindings exist only for type-checking.
void inputs;
void _ok1;
void _ok2;

// ---------------------------------------------------------------------------
// 2. A typo'd key is REJECTED.
// ---------------------------------------------------------------------------
// @ts-expect-error — "texField" is not a valid input key (typo for "textField").
const _bad: InputType = "texField";
void _bad;

// ---------------------------------------------------------------------------
// 3. A key never registered is REJECTED.
//    The returned object's keys are the literal union (not widened to string).
// ---------------------------------------------------------------------------
type Keys = keyof typeof inputs;
const _assertKeys: Keys = "switch";
void _assertKeys;

// @ts-expect-error — "radio" was never registered as an input key.
const _badKey: Keys = "radio";
void _badKey;

// ---------------------------------------------------------------------------
// 4. Constraint: a non-component `component` is REJECTED (T1.1 checking flows
//    through the Record<string, ReactInputConfig> constraint).
// ---------------------------------------------------------------------------
// @ts-expect-error — `component` must be a ComponentType, not a string.
defineInputs({ bad: { component: "not-a-component", defaultValue: "" } });
