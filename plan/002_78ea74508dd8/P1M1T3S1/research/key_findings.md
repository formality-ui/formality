# P1.M1.T3.S1 — Key Research Findings

Source-grounded facts that drive the PRP. All verified against the working
tree on 2026-07-05 (after P1.M1.T1.S1 + P1.M1.T1.S2 landed; P1.M1.T2.S1
concurrent).

## 1. Exact cast to replace (Field.tsx) — content, NOT line number

The architecture doc cites `Field.tsx:426`, but P1.M1.T1.S2 (generic
FieldProps, now COMPLETE) added lines, shifting the cast to **line 463**.
Locate by CONTENT:

```tsx
// packages/react/src/components/Field.tsx (~line 463), inside the Controller render cb:
const Component = inputConfig.component as React.ComponentType<any>;
```

There is a **SECOND** cast a few lines below that MUST NOT be touched:

```tsx
// packages/react/src/components/Field.tsx (~line 475) — TEMPLATE territory, OUT OF SCOPE:
const TemplateComponent = template as React.ComponentType<any> | undefined;
```

`coreProps` sets `ref: field.ref` (RHF `RefCallBack`) ~line 421 inside the
`mergeFieldProps({ coreProps: { ..., ref: field.ref } })` call. The render
then spreads finalProps onto `<Component {...finalProps} />` (~line 481+).

## 2. overlays.ts current state (the file to add the type in)

Current imports (top of file):

```ts
import type { ComponentType } from "react";
import type { RegisterOptions, FieldValues } from "react-hook-form";
import type { InputConfig, FieldConfig } from "@formality-ui/core";
import type { InputTemplateProps } from "./types";
```

→ Need to ADD `RefCallBack, UseFormStateReturn` to the RHF import and
`CustomFieldState` to the `./types` import.

No `FormalityFieldComponentProps` anywhere (grep = ZERO hits). File ends with
the `ReactFormFieldsConfig` type (S1's key-narrowed version). P1.M1.T2.S1
(concurrent) APPENDS a `defineInputs` identity fn at end — APPEND the new type
there too (independent regions; mergeable).

## 3. index.ts export structure (where to add the export)

Last section of `packages/react/src/index.ts`:

```ts
export type {
  ReactInputConfig,
  ReactFieldConfig,
  ReactFormFieldsConfig,
} from "./overlays";
```

→ ADD `FormalityFieldComponentProps` to that block. RHF types
(`RefCallBack, UseFormStateReturn, FieldValues`) are NOT currently re-exported
— add `export type { RefCallBack, UseFormStateReturn, FieldValues } from "react-hook-form";`
for consumer convenience (clause d, recommended).

P1.M1.T2.S1 (concurrent) adds `export { defineInputs } from "./overlays";`
(VALUE line) right after this type block — different line, mergeable.

## 4. Test placement — tsconfig excludes **tests** from tsc --build

`packages/react/tsconfig.json` excludes `src/**/*.test.{ts,tsx}` and
`src/**/__tests__/**`. So `@ts-expect-error` directives in `__tests__/` are
NEVER verified by `pnpm typecheck` (`tsc --build`). For a rigorous
build-time type proof, compile-time assertions MUST live in a plain `.ts`
file under `src/` (e.g. `src/typeAssertions/injectedProps.types.ts`).
`src/typeAssertions/` does NOT exist yet. (Same convention P1.M1.T2.S1 PRP
prescribes.)

## 5. RHF is a peer dependency

`packages/react/package.json` peerDependencies: `react-hook-form: ^7.0.0`;
installed `7.68.0`. Re-exporting RHF types from `@formality-ui/react` is safe
(type-only, no new runtime dep). `RefCallBack` (capital B) confirmed in
`node_modules/react-hook-form/types/controller.d.ts` + `form.d.ts`.

## 6. The `state` prop contract (NOT injected at runtime today)

`examples/07-advanced-features.tsx` (lines 67-99) shows BOTH intended shapes:

- `provideState: true` → component reads `state?.isTouched` (single
  `CustomFieldState`).
- `passSubscriptions: true` → component iterates `Object.entries(subscribedState)`
  (`Record<string, CustomFieldState>`).

Grep confirms `provideState|passSubscriptions` has ZERO consumers in
`Field.tsx` today — runtime injection is a FUTURE task (out of R4 scope).
The type ships the intended contract now. Type = `CustomFieldState |
Record<string, CustomFieldState>`.

## 7. Assignability safety of the new cast

`React.ComponentType<FormalityFieldComponentProps>` (default `P = unknown`)
resolves to `React.ComponentType<{ state?, formState?, forwardRef? }>` (all
optional, since `unknown & T = T`). Spreading `finalProps` (an object type)
onto it compiles because a props type with only-optional members accepts any
object. → No breakage; still an `as` cast (zero behavior change).

## 8. What the test must prove (clause e)

- A representative consumer input component (e.g. a TextField that
  destructures `state/formState/forwardRef` OUT before rendering `<input>`)
  satisfies `ComponentType<FormalityFieldComponentProps<TextFieldProps>>`
  (compile-time → `src/typeAssertions/`).
- The type is exported (compile-time, proven by importing it).
- A lightweight runtime smoke (vitest, `__tests__/`) rendering such a
  component does not crash and destructures correctly (no DOM leak).
