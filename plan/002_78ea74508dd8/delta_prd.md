# Delta PRD — Type-Safety Completion & Coverage Gate

**Base:** `plan/001_bbf464589edd/prd_snapshot.md` (5011 lines) → `PRD.md` (5859 lines, +848)
**Scope of this delta:** ONLY the new/modified requirements not yet implemented.

---

## 1. Diff Analysis (what actually changed)

The PRD diff adds three things, but **only parts are unimplemented**:

| PRD change                                                                                                                                                                                                                                                                         | Status in code (verified)                                                                                                                                                                  | Work needed?                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **§1.3.7 Test Coverage Gate (90%)** — new section. Requires vitest v8 coverage with explicit excludes (`examples/**`, `packages/svelte/**`, `packages/vue/**`, `**/dist/**`) and 90% thresholds on statements/branches/functions/lines, enforced in CI.                            | Root `vitest.config.ts` has `provider: "v8"` + correct `exclude` list ✅. **`thresholds` block is MISSING** ❌. `test:coverage` script exists ✅.                                          | **YES** — add thresholds, verify ≥90% green, CI gate.                      |
| **§1.3.2 / §3.2 / §3.2.1 core-types-framework-agnostic + React overlay docs** — core `component`/`template`/`rules`/`*Template` → `unknown`; `FormFieldsConfig<TName=string>` generic; new §3.2.1 overlay types (`ReactInputConfig`, `ReactFieldConfig`, `ReactFormFieldsConfig`). | `packages/react/src/overlays.ts` implements all three ✅; threaded into `FormalityProviderProps`, `ConfigContext`, `FormProps` ✅; exported ✅; core generic `FormFieldsConfig<TName>` ✅. | **NO** — already implemented (Appendix C T1.1/T1.2/T1.3/T3.2 marked DONE). |
| **Appendix C — Type-Safety Hardening plan** with per-item status.                                                                                                                                                                                                                  | See §2 below.                                                                                                                                                                              | **PARTIAL** — T2.1 remainder, T2.2, T3.1 remain.                           |

## 2. Scope Delta (work to do this session)

### Appendix C verified status

- **T1.1** `ReactInputConfig.component` — ✅ DONE
- **T1.2** `ReactFieldConfig.rules` / `ReactFormFieldsConfig` — ✅ DONE
- **T1.3** template alignment — ✅ DONE
- **T3.2** document `TValue` — ✅ DONE
- **T2.1** generic `Form`/`Field` — ⚠️ **PARTIAL**. Core `FormFieldsConfig<TName>` done. **Remaining:** `FormProps.config` must reject unknown keys (currently `ReactFormFieldsConfig<V> = Record<string, ReactFieldConfig<V>>` — `string`, not `Extract<keyof V, string>`), and `FieldProps` must become generic (`FieldProps<TName extends string = string>`, today `interface FieldProps { name: string; }`).
- **T2.2** `defineInputs` — ❌ **NOT STARTED**. Not present anywhere in `packages/`.
- **T3.1** `FormalityFieldComponentProps` — ❌ **NOT STARTED**. Not present anywhere in `packages/`.

### R1 — Complete the coverage threshold gate (§1.3.7)

**Problem.** The root `vitest.config.ts` defines `coverage.exclude` but has **no `thresholds`**. The 90% gate described in §1.3.7 is therefore not enforced; coverage can silently regress.

**Requirement.** Add the `thresholds` block (statements/branches/functions/lines = 90) to the root `vitest.config.ts` exactly as specified in §1.3.7. Run `pnpm test:coverage` and resolve any metric that drops below 90% (by adding tests to `packages/core/**` / `packages/react/**`, never by weakening the threshold or broadening excludes). The threshold applies repo-wide excluding only the paths already in `exclude`.

- **Verification:** `pnpm test:coverage` exits 0; all four metrics ≥ 90%.
- **Docs (Mode A):** none beyond the existing inline §1.3.7 comments in `vitest.config.ts`.

### R2 — Finish T2.1 strict key-checking (REACT)

**Problem.** `<Form<ClientValues> config={{ ofice: ... }}>` and `<Field name="ofice" />` still compile silently.

**Requirement.**

1. Narrow `FormProps.config` so unknown config keys are rejected: type it as `Record<Extract<keyof TFieldValues, string>, ReactFieldConfig<TFieldValues>>` (or equivalently re-parameterize `ReactFormFieldsConfig<V>` over `Extract<keyof V, string>`). Preserve today's behavior for the default `FieldValues` (where `Extract<keyof FieldValues, string>` collapses to `string`).
2. Make `FieldProps` generic: `interface FieldProps<TName extends string = string> { name: TName; ... }`. Default `TName = string` keeps `<Field name={anyString} />` compiling unchanged.

- **Constraints (Appendix C.3):** non-breaking — generic defaults must preserve today's behavior; runtime unchanged; audit internal `FormProps`/`FieldProps`/`ReactFormFieldsConfig` call sites and add explicit type args where inference breaks.
- **Verification:** `tsc --noEmit` green on core + react; full `pnpm test` green; a type-level assertion that an unknown config key fails to compile.
- **Docs (Mode A):** JSDoc on the new generic `FieldProps<TName>` noting name is checked when narrowed by a typed `<Form<TFieldValues>>`.
- **Leverage prior research:** `plan/001_bbf464589edd/docs/research/typescript_interface_extension_best_practices.md` (backward-compatible interface extension / overlay patterns).

### R3 — T2.2 `defineInputs` opt-in input-type helper (REACT)

**Problem.** `type: "texField"` (typo) silently renders nothing; no way to derive the registered input-key union from the type system.

**Requirement.** Add and export the identity helper `defineInputs<T extends Record<string, ReactInputConfig>>(inputs: T): T` (pure identity, tree-shakes to nothing). Keep existing non-generic `Field`/`FieldConfig.type` working unchanged — additive only. Add a unit test asserting it returns its input and `keyof` yields the expected union.

- **Verification:** `tsc --noEmit` green; `pnpm test` green; bundle size unchanged (identity fn inlined).
- **Docs (Mode A):** JSDoc on `defineInputs` with the `InputType = keyof typeof inputs` usage example from Appendix C.
- **Leverage prior research:** same `typescript_interface_extension_best_practices.md`.

### R4 — T3.1 Export `FormalityFieldComponentProps` (REACT)

**Problem.** Formality injects `state`, `formState`, `forwardRef` onto every field component's props at runtime, but no type ships for it — every consumer hand-rolls a `WithFormality<P>` helper (the driving consumer `sellario-ui` had bugs from inconsistent stripping).

**Requirement.** Read `Field.tsx`'s Controller/merge layer (render callback at `Field.tsx:395` passes `field`/`fieldState`/`formState`; `forwardRef` flows from RHF's `field.ref`) to determine the **exact** runtime types — do not leave them `unknown` unless the runtime truly passes `unknown`. Define and export `FormalityFieldComponentProps<P>` and use it internally where react constructs component props (so it stays in sync by construction). JSDoc must instruct component authors to destructure these three props out before forwarding to the underlying input (avoid leaking to DOM), and call out the MUI-v9 ref wiring (`slotProps.input.ref`) consideration for typing `forwardRef`.

- **Constraints:** new export only; no existing API changed; runtime unchanged.
- **Verification:** `tsc --noEmit` green; `pnpm test` green; react's own field components satisfy the new type.
- **Docs (Mode A):** JSDoc on `FormalityFieldComponentProps` (the three injected props + stripping guidance).
- **Leverage prior research:** `plan/001_bbf464589edd/docs/research/react_forwardref_best_practices.md` and `react_forwardref_research_P1M1T1S7.md` (forwardRef typing).

### R5 — Sync changeset-level documentation (Mode B)

Cross-cutting doc update that only makes sense once R2–R4 land. Update `packages/react/README.md` (and root `README.md` where it already touches type safety) to:

- Document the new type-safety exports: `defineInputs` + `InputType` pattern, `FormalityFieldComponentProps` (replaces consumer `WithFormality`), and the generic `<Form<TFieldValues>>` / `<Field name>` key-checking.
- Add a short note on the 90% coverage gate (how to run `pnpm test:coverage`, what's excluded).

This is a final task depending on R2, R3, R4 (and references R1).

---

## 3. Non-Goals / Out of Scope

- **No re-implementation of T1.1/T1.2/T1.3/T3.2** — already done; do not duplicate.
- **No runtime/behavior changes** — R2–R4 are type-only (T2.2's identity fn and T3.1's internal type reuse are the only code-touching exceptions, per Appendix C.3).
- **No changes to the §3.2 framework-agnostic core types or the existing overlays** — they are correct as-is.
- **No broadening of coverage excludes** to dodge the 90% gate; raise real coverage instead.

---

## 4. Execution Plan (suggested for breakdown agent)

**Phase 1 — Type-Safety Completion & Coverage Gate** (single phase; R1 and R2–R4 are largely independent, R5 last)

- **Milestone A — Type-safety completion (R2, R3, R4)**
  - Task: Finish T2.1 (strict `FormProps.config` key-check + generic `FieldProps`).
  - Task: Add `defineInputs` (T2.2).
  - Task: Export `FormalityFieldComponentProps` (T3.1).
- **Milestone B — Coverage gate (R1)**
  - Task: Add 90% thresholds to root `vitest.config.ts`; verify `pnpm test:coverage` green; backfill tests where a metric is under 90%.
- **Final task — Sync changeset-level docs (R5)**, depends on all above.

**Acceptance:** `pnpm --filter @formality-ui/core build && pnpm --filter @formality-ui/react build` green; `pnpm test` green; `pnpm test:coverage` green at ≥90% all metrics; `tsc --noEmit` green on core + react; new exports (`defineInputs`, `FormalityFieldComponentProps`, generic `FieldProps`) present in `packages/react/src/index.ts`; an unknown `<Form<T>>` config key and a typo'd `type` (when wrapped in `defineInputs`) fail to compile.
