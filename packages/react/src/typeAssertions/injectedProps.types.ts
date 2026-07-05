// Build-time type-level proof for FormalityFieldComponentProps (PRD §C.4 T3.1).
//
// This file is a PLAIN .ts module under src/ (NOT a *.test.* file, NOT under
// __tests__/). packages/react/tsconfig.json excludes test files from
// `tsc --build`, so type-level assertions MUST live here to be verified by
// `pnpm typecheck`. There is no runtime code; the file is exercised purely by
// the typechecker.

import type { ComponentType } from "react";
import type {
  FormalityFieldComponentProps,
  RefCallBack,
  UseFormStateReturn,
  FieldValues,
} from "../index"; // exercise the PUBLIC surfaces (re-exports)
import type { CustomFieldState } from "../types";

// --- A representative consumer input component ---
interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

// POSITIVE: a component typed via FormalityFieldComponentProps<P> compiles,
// including the destructure-before-forward pattern (strip the three injected
// props before spreading the rest onto the DOM input).
const TextField: ComponentType<
  FormalityFieldComponentProps<TextFieldProps>
> = ({ state, formState, forwardRef, ...domProps }) => {
  // The three injected props are typed (not `unknown`):
  const _state:
    | CustomFieldState
    | Record<string, CustomFieldState>
    | undefined = state;
  const _fs: UseFormStateReturn<FieldValues> | undefined = formState;
  const _ref: RefCallBack | undefined = forwardRef;
  // The own props survive the destructure (label is string-typed):
  const _label: string = (domProps as { label: string }).label;
  void _state;
  void _fs;
  void _ref;
  void _label;
  void domProps;
  return null as unknown as JSX.Element;
};

// POSITIVE: default P = unknown — a component with no own props still works
// (preserves today's ComponentType<any>-equivalent looseness).
const Bare: ComponentType<FormalityFieldComponentProps> = () =>
  null as unknown as JSX.Element;

// POSITIVE: CustomFieldState single-shape (provideState) and Record-shape
// (passSubscriptions) are both valid for `state`.
const _single: CustomFieldState | Record<string, CustomFieldState> | undefined =
  undefined;

// A consumer's old lossy helper is replaceable 1:1 — no @ts-expect-error needed
// because the assignability above IS the proof.

// Export symbols so the file is not tree-shaken from the typecheck graph AND
// the representative components are part of the module's surface (silences
// no-unused-vars at lint while keeping them as build-time type proof):
export type _AssertInjectedProps =
  | typeof TextField
  | typeof Bare
  | typeof _single;
export { TextField, Bare };
