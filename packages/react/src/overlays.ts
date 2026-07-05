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
import type { RegisterOptions, FieldValues } from "react-hook-form";
import type {
  InputConfig,
  FieldConfig,
} from "@formality-ui/core";
import type { InputTemplateProps } from "./types";

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
export interface ReactInputConfig<TValue = unknown>
  extends Omit<InputConfig<TValue>, "component" | "template"> {
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
export interface ReactFieldConfig<V extends FieldValues = FieldValues>
  extends Omit<FieldConfig, "rules"> {
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
