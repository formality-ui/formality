# P1.M3.T1.S1 — Exported Surface & README Audit (research)

> Source-of-truth snapshot for the `packages/react/README.md` documentation
> sweep (Mode B, delta PRD R5). Every symbol below was read directly from
> `packages/react/src/index.ts`, `packages/react/src/overlays.ts`, and
> `packages/react/src/components/Field.tsx`. README structural facts come from
> the current `packages/react/README.md` (452 lines).

---

## 1. The current `packages/react/README.md` — section map

```
line   section
 1     # @formality-ui/react
 5     ## Installation
21     ## Quick Start            ← uses OLD types: `Record<string, InputConfig>`, `FormFieldsConfig`
84     ## Components             (FormalityProvider, Form, Field, FieldGroup, UnusedFields)
227    ## Conditions
261    ## Dynamic Props (selectProps)
279    ## Auto-Save
296    ## Hooks
364    ## Contexts
397    ## TypeScript Support     ← a big `import type {...}` catalog (lines 397–436)
437    ## Utilities
450    ## License
```

**grep for any new topic → NO MATCHES.** None of: `Type Safety`, `Testing`,
`Coverage`, `defineInputs`, `FormalityFieldComponentProps`, `ReactInputConfig`,
`ReactFieldConfig`, `ReactFormFieldsConfig`, `InputType`, `test:coverage`,
`thresholds`, `overlay`. **The entire new surface is undocumented in this file.**

> Note: the existing `## TypeScript Support` block (397–436) is a **type-import
> catalog only** — it lists `FormProps`, `FieldProps`, `InputConfig`,
`FieldConfig`, `FormFieldsConfig`, etc. It does NOT explain *how* the types
help you (key-checking, injected-props contract). The new `## Type Safety`
section is the "how", complementing the "what" catalog. Place `## Type Safety`
immediately AFTER `## TypeScript Support` (i.e. after line 436, before
`## Utilities` at 437).

---

## 2. Exact exported symbols this PRP must document

All confirmed present in `packages/react/src/index.ts` (the public surface).
**Every symbol referenced in README snippets MUST come from this list** —
verify with `grep` after editing (see PRP Task 1).

### 2a. React overlay types (`packages/react/src/overlays.ts`, re-exported as `type`)

```ts
// from packages/react/src/overlays.ts
import type { ComponentType } from "react";
import type { RegisterOptions, FieldValues, RefCallBack, UseFormStateReturn } from "react-hook-form";
import type { InputConfig, FieldConfig } from "@formality-ui/core";
import type { InputTemplateProps, CustomFieldState } from "./types";

export interface ReactInputConfig<TValue = unknown> extends Omit<InputConfig<TValue>, "component" | "template"> {
  component: ComponentType<any>;
  template?: ComponentType<InputTemplateProps>;
}

export interface ReactFieldConfig<V extends FieldValues = FieldValues> extends Omit<FieldConfig, "rules"> {
  rules?: RegisterOptions<V>;
}

// KEY-CHECKING type — note Extract<keyof V, string>:
export type ReactFormFieldsConfig<V extends FieldValues = FieldValues> =
  Record<Extract<keyof V, string>, ReactFieldConfig<V>>;

export function defineInputs<T extends Record<string, ReactInputConfig>>(inputs: T): T;

export type FormalityFieldComponentProps<P = unknown> = P & {
  state?: CustomFieldState | Record<string, CustomFieldState>;
  formState?: UseFormStateReturn<FieldValues>;
  forwardRef?: RefCallBack;
};
```

### 2b. Re-exported react-hook-form types (so consumers don't need a direct RHF import)

```ts
// from packages/react/src/index.ts
export type { RefCallBack, UseFormStateReturn, FieldValues } from "react-hook-form";
```

### 2c. `defineInputs` is a VALUE export (identity fn), not a type

```ts
export { defineInputs } from "./overlays";   // value, not `export type`
```

### 2d. Generic `FormProps` / `FieldProps` (already landed in P1.M1.T1)

- `FormProps<TFieldValues extends FieldValues = FieldValues>` with
  `config: ReactFormFieldsConfig<TFieldValues>` → **unknown config keys are a
  compile error** when `TFieldValues` is narrowed. Default `FieldValues` keeps
  today's "any string key" behavior (non-breaking).
- `FieldProps<TName extends string = string>` with `name: TName`
  (`packages/react/src/components/Field.tsx:66`). Default `TName = string` keeps
  `<Field name={anyString} />` compiling. Name-checking **only engages when
  narrowed** (e.g. `FieldProps<"name" | "email">`); `<Form<T>>` does NOT
  auto-narrow the children `<Field>` names (React generics don't thread into
  children context). Document the explicit-narrow pattern honestly.

---

## 3. The `FormalityFieldComponentProps` before/after (from architecture note)

### Before — what consumers (e.g. sellario-ui) hand-roll today (BUGGY)

```ts
type WithFormality<P> = P & {
  state?: unknown;            // lossy
  formState?: unknown;        // lossy
  forwardRef?: React.Ref<HTMLInputElement>;  // wrong: RHF hands RefCallBack
};
```

### After — the shipped type (precise)

```ts
import type { FormalityFieldComponentProps } from "@formality-ui/react";

export type { FormalityFieldComponentProps } from "@formality-ui/react";
// FormalityFieldComponentProps<P = unknown> = P & {
//   state?: CustomFieldState | Record<string, CustomFieldState>;
//   formState?: UseFormStateReturn<FieldValues>;
//   forwardRef?: RefCallBack;
// }
```

### Consumer component pattern (destructure before forward)

```tsx
const TextField: React.ComponentType<FormalityFieldComponentProps<TextFieldProps>> =
  ({ state, formState, forwardRef, ...domProps }) => (
    <input ref={forwardRef} {...domProps} />   // forwardRef = RHF RefCallBack
  );
```

### Two accuracy caveats the README MUST state (from overlays.ts JSDoc)

1. **`forwardRef` ≠ `React.Ref`.** It is RHF's `RefCallBack`
   (`(instance: any) => void`). For a plain `<input>` use `ref={forwardRef}`.
   For **MUI v9** (Checkbox etc.) which dropped the top-level `inputRef`, wire
   via slots: `slotProps={{ input: { ref: forwardRef } }}`.
2. **Runtime caveat.** Today `Field` delivers the RHF ref via the React-special
   `ref` key, NOT a top-level `forwardRef` prop. To receive it as `forwardRef`
   on a bare function component, wrap with `React.forwardRef`, or target React
   19's ref-as-prop. Making Field deliver a top-level `forwardRef` key for bare
   components is a FUTURE runtime task (out of scope for the type-only T3.1).
   The type ships the intended contract now so consumers stop hand-rolling
   `WithFormality`.

> Do NOT claim `FormalityFieldComponentProps` *replaces* `WithFormality` in a
> way that implies runtime parity — the replacement is **at the type level**;
> the runtime `ref`-vs-`forwardRef` gap remains (documented above).

---

## 4. The coverage gate (facts for the "Testing & Coverage" section)

Verified against `vitest.config.ts` (root) + the P1.M2.T1.S5 PRP (which adds
the `thresholds` block — treat as applied):

| Fact | Value |
|------|-------|
| Command | `pnpm test:coverage` (script = `vitest run --coverage`; `package.json:12`) |
| Provider | `v8` |
| Thresholds (all four) | `statements: 90, branches: 90, functions: 90, lines: 90` (PRD §1.3.7) |
| Gate behavior | vitest v8 provider **sets process exit code to 1** when any metric < threshold → CI fails |
| Scope | **Repo-wide** (merged workspace: `packages/core` + `packages/react`), excluding only the list below |

**Out-of-scope exclusions (do NOT count toward the threshold):**

| Glob | Reason (PRD §1.3.7) |
|------|---------------------|
| `examples/**` | Demo apps; not shipped |
| `packages/svelte/**` | Stubbed adapter |
| `packages/vue/**` | Stubbed adapter |
| `**/dist/**` | Build output (catches nested package dists) |

Plus vitest's `coverageConfigDefaults.exclude` (node_modules, etc.), spread
first. See `vitest.config.ts` for the exact array.

---

## 5. Sibling task boundary (anti-overlap)

- **This task (S1)** owns `packages/react/README.md` ONLY.
- **Sibling S2** (`P1.M3.T1.S2`, not yet started) owns the **root** `README.md`
  where it touches type safety + coverage.
- **Rule:** S1 must NOT edit `README.md` (root) or any other README. S2 must NOT
  edit `packages/react/README.md`. Zero file overlap.

---

## 6. Accuracy verification harness (for the implementer)

Because this is pure markdown, the strongest automated check is **"every code
block compiles and every named symbol actually exports."** Two concrete checks:

1. **Symbol existence** — after editing, grep each documented symbol against the
   real entry point:
   ```bash
   for sym in defineInputs FormalityFieldComponentProps ReactInputConfig \
              ReactFieldConfig ReactFormFieldsConfig RefCallBack \
              UseFormStateReturn FieldValues FormProps FieldProps; do
     grep -q "\b$sym\b" packages/react/src/index.ts \
       || echo "NOT EXPORTED: $sym"
   done
   ```
2. **Snippet compile (optional but high-signal)** — copy each `tsx` code block
   into a scratch file under `packages/react/src/__typechecks__/` (this dir
   already exists and is part of the react `tsc --noEmit` surface) and run
   `pnpm --filter @formality-ui/react exec tsc --noEmit`. Delete the scratch
   file after. (The `@ts-expect-error` lines prove the negative cases.)
