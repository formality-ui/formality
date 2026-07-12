// @formality-ui/react - Type Overlays
//
// Core (`@formality-ui/core`) is deliberately framework-agnostic: it cannot
// import `react` or `react-hook-form`, so any field that is fundamentally a
// framework construct is typed `unknown` there (InputConfig.component,
// InputConfig.template, FieldConfig.rules, …). See PRD §1.3.2 / §3.2.
//
// This module overlays precise React / react-hook-form types on top of those
// loose core types. React consumers import these (re-exported from the package
// entry point) and get full type safety, while core stays reusable by future
// Vue/Svelte adapters with zero changes.

import type { ComponentType } from "react";
import type {
  RegisterOptions,
  FieldValues,
  RefCallBack,
  UseFormStateReturn,
} from "react-hook-form";
import type { InputConfig, FieldConfig } from "@formality-ui/core";
import type { InputTemplateProps, CustomFieldState } from "./types";

/**
 * `InputConfig` as seen by React consumers.
 *
 * Narrows core's framework-agnostic `component: unknown` /
 * `template?: unknown` to real React component types. `TValue` is preserved so
 * `defaultValue` / `parser` / `formatter` can share a single value type.
 *
 * @example
 * ```tsx
 * import type { ReactInputConfig } from "@formality-ui/react";
 *
 * const textField = {
 *   component: TextField,
 *   defaultValue: "",
 * } satisfies ReactInputConfig<string>;
 * ```
 *
 * Prefer this over the core `InputConfig` type whenever you are writing React
 * code — it will give you a **compile error** if `component` is set to a
 * non-component (e.g. `component: 42` or `component: "textField"`).
 */
export interface ReactInputConfig<TValue = unknown> extends Omit<
  InputConfig<TValue>,
  "component" | "template"
> {
  /** The React component to render for this input type. */
  component: ComponentType<any>;

  /** Optional template wrapper (overrides provider/form defaults). */
  template?: ComponentType<InputTemplateProps>;
}

/**
 * `FieldConfig` as seen by React consumers.
 *
 * Narrows core's framework-agnostic `rules?: Record<string, unknown>` to
 * react-hook-form's `RegisterOptions`, giving autocomplete and checking for
 * `required`, `min`, `max`, `pattern`, `validate`, `valueAsNumber`, `deps`, …
 *
 * The generic `V` defaults to `FieldValues`; pass your form's values type for
 * slightly tighter checking on path-based rules.
 */
export interface ReactFieldConfig<
  V extends FieldValues = FieldValues,
> extends Omit<FieldConfig, "rules"> {
  /** react-hook-form register options forwarded to the field's Controller. */
  rules?: RegisterOptions<V>;
}

/**
 * Map of field name → {@link ReactFieldConfig}. Used by `<Form>`'s `config`
 * prop (via {@link ReactFormFieldsConfig}) so React consumers get RHF-typed
 * `rules` on every field.
 *
 * The keys are narrowed to `Extract<keyof V, string>`. When `V` is left at
 * its default (`FieldValues`) any string key is accepted — byte-for-byte
 * identical to before. When `V` is narrowed to a concrete field-values type
 * (e.g. via `<Form<ClientValues>>`), unknown `config` keys become a
 * **compile error**, catching typos like `ofice` at compile time (PRD §C.4 /
 * T2.1).
 *
 * @example
 * ```tsx
 * import type { ReactFormFieldsConfig } from "@formality-ui/react";
 * import type { FieldValues } from "react-hook-form";
 *
 * // Default — any string key accepted (non-breaking).
 * const a: ReactFormFieldsConfig<FieldValues> = { anything: { type: "text" } };
 *
 * // Narrowed — only known field names accepted.
 * type ClientValues = { name: string; email: string };
 * const b: ReactFormFieldsConfig<ClientValues> = {
 *   name: { type: "text" },
 *   email: { type: "text" },
 * };
 *
 * // @ts-expect-error — typo `ofice` is rejected.
 * const c: ReactFormFieldsConfig<ClientValues> = { ofice: { type: "text" } };
 * ```
 */
export type ReactFormFieldsConfig<V extends FieldValues = FieldValues> = Record<
  Extract<keyof V, string>,
  ReactFieldConfig<V>
>;

/**
 * Identity helper that lets consumers derive a union of their input-type keys.
 * Opt-in: wrap your provider inputs to get `keyof` checking on `Field` `type`
 * and `FieldConfig.type`.
 *
 * This is a PURE IDENTITY function — it returns `inputs` unchanged with zero
 * runtime effect, so bundlers (tsup/esbuild/rollup) tree-shake it to nothing.
 * It exists purely so consumers can write `type InputType = keyof typeof inputs`.
 *
 * The existing non-generic `Field` and `FieldConfig.type` / `FieldProps.type`
 * (which default to `type?: string`) are UNCHANGED — this helper is purely
 * additive and opt-in. End-to-end wiring of `InputType` into those types is a
 * follow-up (PRD §C.4 T2.2 step 3).
 *
 * @example
 * ```tsx
 * import { defineInputs } from "@formality-ui/react";
 *
 * const inputs = defineInputs({
 *   textField: { component: TextField, defaultValue: "" },
 *   switch:     { component: Switch,   defaultValue: false },
 * });
 * export type InputType = keyof typeof inputs;   // "textField" | "switch"
 * ```
 */
export function defineInputs<T extends Record<string, ReactInputConfig>>(
  inputs: T,
): T {
  return inputs;
}

/**
 * Props Formality injects onto every field component.
 *
 * `<Field>` renders your input component via React Hook Form's `<Controller>`.
 * At runtime Formality merges a `coreProps` bundle onto the component (name,
 * value, onChange, onBlur, and — as a React-special key — `ref`). The three
 * members below are the **injected-props contract**: `formState` always
 * reaches templates and render-prop children, and reaches plain components
 * that have opted into Formality state via `provideState` /
 * `passSubscriptions`; `state` (subscribed field state) and a top-level
 * `forwardRef` key are delivered at runtime by `<Field>` (see "Runtime
 * delivery" below).
 *
 * **Destructure before forwarding.** Component authors MUST destructure
 * `state`, `formState`, and `forwardRef` OUT of props before spreading the
 * rest onto the underlying DOM `<input>` — otherwise these non-DOM props leak
 * to the DOM and React warns. Recommended pattern:
 *
 * ```tsx
 * const TextField: ComponentType<FormalityFieldComponentProps<TextFieldProps>> =
 *   ({ state, formState, forwardRef, ...domProps }) => (
 *     <input ref={forwardRef} {...domProps} />
 *   );
 * ```
 *
 * **Wiring `forwardRef` to the inner input.** `forwardRef` is RHF's
 * `RefCallBack` (a function). For a plain `<input>` use `ref={forwardRef}`.
 * For MUI v9 components that no longer accept a top-level `inputRef`, wire it
 * via slots: `slotProps={{ input: { ref: forwardRef } }}` (PRD §5.3.8).
 *
 * **Runtime delivery (important).** `<Field>` delivers RHF's ref as a regular,
 * top-level, enumerable prop named `forwardRef` — no `React.forwardRef` wrap
 * is required for a plain function component that destructures `forwardRef`
 * and wires it to the inner input (`ref={forwardRef}`). Consumers migrating
 * off the old React-special `ref` key: a `React.forwardRef`-wrapped component
 * should consume `props.forwardRef` (PRD §20.4), and under React 19
 * ref-as-prop use `forwardRef` directly. The type ships the intended contract
 * so consumers stop hand-rolling a lossy `WithFormality<P>`.
 *
 * @template P - the field component's own props (e.g. TextFieldProps). Defaults
 *   to `unknown` so existing `ComponentType<any>` casts remain valid.
 */
export type FormalityFieldComponentProps<P = unknown> = P & {
  /** Subscribed/own field state when `provideState`/`passSubscriptions` is on. */
  state?: CustomFieldState | Record<string, CustomFieldState>;

  /** React Hook Form form state threaded from `<Controller>`. */
  formState?: UseFormStateReturn<FieldValues>;

  /** RHF ref callback (`RefCallBack`); wire to the inner input (see JSDoc). */
  forwardRef?: RefCallBack;
};
