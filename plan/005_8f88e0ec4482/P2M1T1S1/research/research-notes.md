# Research Notes — P2.M1.T1.S1: Design useField hook interface & type contract

Scope: CREATE `packages/react/src/hooks/useField.ts` (types + JSDoc + stub) — a
DESIGN step. Extraction of Field.tsx logic into the hook is **S2**. This step
has **NO behavioral change** (Field.tsx untouched).

## 1. The contract is already (structurally) defined in Field.tsx

`packages/react/src/components/Field.tsx` already exports `FieldRenderAPI`,
whose shape is **byte-for-byte** the `UseFieldReturn` specified by the work
item:

```ts
// Field.tsx (existing) — the shape useField must return
export interface FieldRenderAPI {
  fieldState: ControllerFieldState;
  renderedField: ReactNode;
  fieldProps: Record<string, unknown>;
  watchers: Record<string, boolean>;
  formState: UseFormStateReturn<FieldValues>;
}
```

And `FieldProps<TName extends string = string>` (also in Field.tsx) is the input
shape; Field destructures: `name, type: typeProp, disabled: disabledProp,
hidden: hiddenProp, children, shouldRegister = true, inputConfig: inputConfigProp,
...restProps`.

**=> `UseFieldParams` mirrors `FieldProps`'s relevant fields; `UseFieldReturn`
mirrors `FieldRenderAPI`.** These are the ground-truth for the extraction target.

## 2. Key design decisions (resolved)

- **Do NOT import `FieldRenderAPI` into useField.ts.** S2 will make `Field.tsx`
  import `useField` from `./hooks/useField`. Importing `FieldRenderAPI` into
  useField.ts now would create a `Field ↔ useField` module cycle. Instead,
  define `UseFieldReturn` as a fresh interface (structurally matching
  `FieldRenderAPI`), and assert the equivalence in a type-only
  `__typechecks__/useField.test-d.ts`. S2/S3 may later alias
  `type FieldRenderAPI = UseFieldReturn`.
- **Do NOT add `useField` to `packages/react/src/index.ts` (the barrel) in S1.**
  Rationale: S1 ships a non-functional stub; exporting it from the public barrel
  exposes an unimplemented API to consumers. Matches the `useFieldDisabledState`
  precedent (defined in `src/hooks/`, NOT in barrel). The barrel export is a
  decision for S2/S3 once behavior lands. File-level `export` still satisfies
  "exported from the file".
- **`children` is a pass-through param, NOT applied inside the hook.** Field.tsx
  computes `renderedField` (raw template/component/host element) FIRST, then
  applies `children({ fieldState, renderedField, fieldProps, watchers,
  formState })` at the render layer. So `UseFieldReturn.renderedField` = the RAW
  rendered input (not children-applied). The hook returns the raw element + the
  `FieldRenderAPI` data; the Field component applies the render-prop. (Getting
  this backwards breaks S3 behavioral parity.)
- **Generic `UseFieldParams<TName extends string = string>`** to thread
  name-type narrowing (PRD §C.4 / T2.1) — matches `FieldProps<TName>`.
- **`inputConfig?: Partial<InputConfig>` is INCLUDED** in `UseFieldParams`
  (Field.tsx destructures `inputConfigProp`; omitting it would make the
  contract incomplete for S2). The work-item bullet list didn't mention it, but
  Field.tsx is ground truth.
- **Stub THROWS** (`new Error("useField is not implemented yet…")`) — loudest
  "not implemented" signal; nothing calls it in S1 (Field still inline). Underscore
  param `_params` to satisfy unused-arg lint.

## 3. Repo conventions (verified via scout + direct reads)

- **Hook file header**: `// @formality-ui/react - useField Hook` then a blank line
  (see useConditions.ts L1-2). Full JSDoc on the function with `@param`,
  `@returns`, `@example` (see useFormState.ts — the typed-public-hook model).
- **`verbatimModuleSyntax: true`** (root tsconfig) — ALL type-only imports must
  be `import type`. Confirmed.
- **Barrel** (`packages/react/src/index.ts` L72-79): exports `useFormState`
  (value + `UseFormStateOptions` type), `useConditions`, `usePropsEvaluation`,
  `useInferredInputs`, `useSubscriptions` (value only). `useFieldDisabledState`
  is NOT exported. => S1: do not touch the barrel.
- **`FieldRenderAPI` IS currently exported** from the barrel via
  `export type { FieldProps, FieldRenderAPI } from "./components/Field";`.
- **Hook tests**: `packages/react/src/__tests__/*.test.tsx`, import the hook via
  RELATIVE path (`../hooks/useX`), call via `renderHook` from
  `@testing-library/react`, NO shared wrapper (each file builds an inline
  FormContext.Provider wrapper). Core types come from `@formality-ui/core`.
  NOTE: `useConditions.test.tsx` / `usePropsEvaluation.test.tsx` do NOT exist;
  the existing hook tests are: `useSubscriptions`, `useFormState`,
  `useInferredInputs`, `useFieldDisabledState`.
- **Type-assertion files**: `packages/react/src/__typechecks__/*.test-d.ts` —
  pure tsc assertions (`// @ts-expect-error` + `const x: T = ...` + `void x;`),
  NO `expectTypeOf`/`assertType`, NOT run by vitest, auto-included by
  `tsc --build` (react tsconfig includes `src/**/*`, excludes only `*.test.*`
  and `__tests__/**`). `typeAssertions/*.ts` is the same idea as a plain module.
- **No existing stub pattern** in `packages/react/src/hooks/`
  (`grep not-implemented|TODO|stub` → empty). Closest analogue: `useFieldDisabledState`
  (defined + tested but unused/dead — being REMOVED in P2.M1.T2.S1, a sibling).
- **`useField.ts` confirmed ABSENT** (matches G6).

## 4. Imports useField.ts will need (all `import type`)

- `type { ReactNode } from "react"` — for `renderedField` + `children`.
- `type { ControllerFieldState, UseFormStateReturn, FieldValues } from "react-hook-form"`.
- `type { InputConfig } from "@formality-ui/core"` — for `inputConfig?: Partial<InputConfig>`.
- NO import from `../components/Field` (avoids cycle; see §2).

## 5. Validation gates (verified commands)

- `pnpm typecheck` → root `tsc --build` (composite refs). Validates the new
  file AND any `__typechecks__/*.test-d.ts` automatically. (No per-package
  typecheck script.)
- `pnpm test` → `vitest run` (workspace core+react; react include
  `src/**/*.test.{ts,tsx}`). Must stay green; new stub test passes.
- `pnpm lint` → `eslint .` (rules-of-hooks + unused-args active).
- `pnpm build` → `pnpm -r build` (tsup) — new file must compile & emit.
- `pnpm test:coverage` → 90% hard gate on ALL of `packages/react/**` (PRD §1.3.7).
  A single uncovered stub function is unlikely to breach 90% (repo ~97% / 1003
  tests) but a minimal stub test removes ALL risk and matches repo convention.
- `git diff --stat` → ONLY new files (useField.ts, useField.test.tsx, optionally
  useField.test-d.ts). NO modification to Field.tsx, index.ts, overlays.ts, etc.

## 6. Parallel-execution context & siblings

- **P1.M3.T1.S1 (parallel, "previous")**: JSDoc-only on
  `packages/core/src/{conditions/evaluate,config/defaults,labels/resolve}.ts`.
  ZERO file overlap with this task (react vs core). It READS useConditions.ts +
  Field.tsx as evidence but does NOT modify them. Safe in parallel.
- **P2.M1.T1.S2 (next, depends on THIS)**: implements the useField body + wires
  Field.tsx → useField. THIS PRP's contract is S2's implementation target. The
  "UseFieldReturn ≡ FieldRenderAPI" + "children is pass-through" decisions
  (§2) are what make S2/S3 succeed.
- **P2.M1.T2.S1 (sibling)**: REMOVES `useFieldDisabledState.ts` + its test.
  Different file; no overlap. (Do not confuse the two useField* hooks.)
- **P2.M2.T1.S1 (sibling)**: edits `overlays.ts` forwardRef wording. This task
  only READS overlays.ts (`FormalityFieldComponentProps`) — no conflict.

## 7. Open items deliberately DEFERRED to S2 (out of S1 scope)

- Implementing the useField body (Controller, parse/format, validation rules,
  mergeFieldProps, template/host render, state injection, forwardRef delivery).
- Refactoring Field.tsx to delegate to useField.
- Reconciling `FieldRenderAPI` into an alias of `UseFieldReturn`.
- Adding useField to the public barrel.
- Behavioral/parity tests (S3).
