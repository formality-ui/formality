# Formality v1.0 — Coverage Gate + Appendix C Type-Safety Audit

**Scope:** `packages/react/src/` (+ core for the coverage aggregate). PRD §1.3.7 (90% gate) and PRD Appendix C items T1.1–T3.2.
**Mode:** RESEARCH ONLY — no files edited.
**Run:** `pnpm test:coverage` (whole workspace: core + react), date 2026-07-13.

---

## SECTION 1 — Coverage Gate

### 1.1 Gate verdict: **PASS** ✅

- **Exit code:** `0` (clean exit, no threshold violation).
- Threshold config: `vitest.config.ts` lines 33–38 → `thresholds: { statements:90, branches:90, functions:90, lines:90 }` (hard gate; CI exits 1 if any drop below 90).
- **Important nuance:** the threshold is applied to the **AGGREGATE "All files" roll-up**, NOT per-file (no `perFile: true` set). The aggregate clears the bar comfortably:

| Metric | Aggregate (All files) | Gate | Result |
|--------|----------------------:|-----:|:------:|
| Statements | **97.32%** | ≥90 | PASS |
| Branches   | **94.82%** | ≥90 | PASS |
| Functions  | **99.13%** | ≥90 | PASS |
| Lines      | **97.32%** | ≥90 | PASS |

### 1.2 Test counts (core + react)

Vitest reports the workspace as a single combined summary: **39 test files, 1066 tests (1061 passed | 5 skipped)**. Split by project:

| Project | Test files | Tests passed | Tests skipped | Total |
|---------|-----------:|-------------:|--------------:|------:|
| `@formality-ui/core`  | 11 | 661 | 0 | 661 |
| `@formality-ui/react` | 28 | 400 | 5 | 405 |
| **Total** | **39** | **1061** | **5** | **1066** |

- All 5 skipped tests live in **react** `src/__tests__/Field.test.tsx` (`75 tests | 5 skipped`).
- No skipped test files.

### 1.3 Per-file coverage for `packages/react/src/`

| File | Stmts | Branch | Funcs | Lines | Uncovered | Note |
|------|------:|-------:|------:|------:|-----------|------|
| `react/src` *(dir roll-up)* | 83.33 | 66.66 | 66.66 | 83.33 | — | dragged down by type-only 0% modules; **not** what is gated |
| `index.ts` | **0** | **0** | **0** | **0** | 1 | type/re-export barrel — 1 executable stmt |
| `overlays.ts` | 100 | 100 | 100 | 100 | — | |
| `types.ts` | **0** | **0** | **0** | **0** | — | type-only module |
| `components/Field.tsx` | 100 | 100 | 100 | 100 | — | |
| `components/FieldGroup.tsx` | 100 | 91.3 | 100 | 100 | 97,103 | |
| `components/Form.tsx` | 95.86 | 91.53 | 100 | 95.86 | 640-641,653-654 | |
| `components/FormalityProvider.tsx` | 100 | 100 | 100 | 100 | — | |
| `components/UnusedFields.tsx` | 100 | 100 | 100 | 100 | — | |
| `context/ConfigContext.ts` | 100 | 100 | 100 | 100 | — | |
| `context/FormContext.ts` | 100 | 100 | 100 | 100 | — | |
| `context/GroupContext.ts` | 100 | 100 | 100 | 100 | — | |
| `hooks/useConditions.ts` | 98.81 | 97.95 | 100 | 98.88 | 96-97 | |
| `hooks/useField.tsx` | 99.48 | 95.65 | 100 | 99.48 | 486,650 | |
| `hooks/useFormState.ts` | 100 | 100 | 100 | 100 | — | |
| `hooks/useInferredInputs.ts` | 100 | 100 | 100 | 100 | — | |
| `hooks/usePropsEvaluation.ts` | 94.59 | **72** | 100 | 94.59 | 209,222,232,252 | ⚠ only substantive sub-90% gap |
| `hooks/useSubscriptions.ts` | 100 | 100 | 100 | 100 | — | |
| `typeAssertions/injectedProps.types.ts` | **0** | 100 | 100 | **0** | 28-56 | type-only proof module |
| `utils/makeProxyState.ts` | 100 | 100 | 100 | 100 | — | |

### 1.4 Files UNDER 90% (audit-relevant gaps)

**Only one substantive, non-by-design gap:**

1. ⚠ **`hooks/usePropsEvaluation.ts` — BRANCH 72%** (lines 209, 222, 232, 252). All four uncovered lines are `>) ?? {};` — the **function-invocation branches** of the props-evaluation pipeline (the `typeof X === "function"` paths for `formDefaultFieldProps` / `selectProps` etc.). No test exercises the dynamic-function variant of those props layers. **Severity: low.** This is the single most actionable coverage debt in `react/src`.

**By-design 0% modules (NOT real gaps — type-only, no executable logic):**
2. `index.ts` (0% all) — package barrel; 1 re-export statement.
3. `types.ts` (0% all) — pure type-only module.
4. `typeAssertions/injectedProps.types.ts` (0% stmts/lines) — build-time type proof module; `vitest.config.ts` comment explicitly notes type-only modules are "correctly reported as 0% by design."

**Gate-architecture observation (not a failure):** because the 90% threshold is **aggregate-only** (no `perFile: true`), the `usePropsEvaluation.ts` branch gap (72%) and the type-only 0% files do **not** fail CI. If PRD §1.3.7 is later interpreted as a **per-file** 90% floor, `usePropsEvaluation.ts` (branch) and the three type-only modules would need attention. As implemented today the gate passes.

---

## SECTION 2 — Appendix C Type-Safety Items (T1.1–T3.2)

All items located in `packages/react/src/overlays.ts` and wired through `packages/react/src/index.ts`. Every public overlay type is re-exported. Verdict per item:

| Item | Requirement | Exists? | Exported? | Location (file:line) | Verdict |
|------|-------------|:------:|:---------:|----------------------|:-------:|
| **T1.1** | `ReactInputConfig.component` typed as React `ComponentType` | ✅ | ✅ `index.ts:98` | `overlays.ts:49` `component: ComponentType<any>;` | **PASS** |
| **T1.2** | `ReactFieldConfig.rules` typed as `RegisterOptions` | ✅ | ✅ `index.ts:99` | `overlays.ts:69` `rules?: RegisterOptions<V>;` | **PASS** |
| **T1.3** | `ReactInputConfig.template` typed as `ComponentType<InputTemplateProps>` | ✅ | ✅ (part of T1.1 type) `index.ts:98` | `overlays.ts:52` `template?: ComponentType<InputTemplateProps>;` | **PASS** |
| **T2.1a** | `ReactFormFieldsConfig<V>` with `Extract<keyof V, string>` | ✅ | ✅ `index.ts:100` | `overlays.ts:103-105` `Record<Extract<keyof V, string>, ReactFieldConfig<V>>` | **PASS** |
| **T2.1b** | `FormProps.config: ReactFormFieldsConfig<TFieldValues>` | ✅ | ✅ (part of `FormProps`) | `Form.tsx:48` (interface at `Form.tsx:43`, `Form<TFieldValues>` at `Form.tsx:160`) | **PASS** |
| **T2.1c** | `FieldProps<TName>` generic tied to name | ✅ | ✅ (`FieldProps` exported with `Field`) | `Field.tsx:38` `interface FieldProps<TName extends string = string>`; `Field.tsx:113` `function Field<TName...>` | **PASS** (see note) |
| **T2.2** | `defineInputs` identity helper | ✅ | ✅ `index.ts:113` (VALUE export) | `overlays.ts:133-136` `export function defineInputs<T...>(inputs): T { return inputs; }` | **PASS** |
| **T3.1** | `FormalityFieldComponentProps` exported + `forwardRef: RefCallBack` | ✅ | ✅ `index.ts:101` | `overlays.ts:182` type decl; `overlays.ts:190` `forwardRef?: RefCallBack;` | **PASS** |
| **T3.2** | `ReactInputConfig<TValue>` generic (optional) | ✅ | ✅ `index.ts:98` | `overlays.ts:44` `export interface ReactInputConfig<TValue = unknown> extends Omit<InputConfig<TValue>, ...>` | **PASS** (optional item, present) |

### T2.1c nuance
`FieldProps<TName>` is generic over the field **name** and rejects typo names when narrowed (default `TName = string` = non-breaking). However, **automatic per-form narrowing** — where a `<Field>` auto-derives its valid name set from the enclosing `<Form<TFieldValues>>` — is an **explicitly deferred follow-up** (stated in the `FieldProps` JSDoc, `Field.tsx:25-29`, and the §C.4 note). The type plumbing (`FieldProps<TName>`, `FormProps<TFieldValues>`, `ReactFormFieldsConfig<V>`) is all in place; only the auto-threading between them is deferred. This matches the gap_analysis "T2.1 DONE" reading (opt-in narrowing delivered; auto-narrowing always optional/deferrable).

### Type-level proof files (build-time, not runtime tests)
`packages/react/src/__typechecks__/` — 4 `.test-d.ts` files consumed by `tsc --build` (`pnpm typecheck`), each with `// @ts-expect-error` guards that MUST be honored by the compiler:
- `defineInputs.test-d.ts` — proves `keyof typeof inputs` is the literal union; rejects typo/unregistered keys; rejects non-component `component` (T1.1/T2.2).
- `ReactFormFieldsConfig.test-d.ts` — default accepts any key (non-breaking); concrete `V` accepts known keys, rejects typos; `FormProps<ClientValues>["config"]` inherits narrowing (T2.1).
- `FieldProps.test-d.ts` — default accepts any string; narrowed rejects typos; rejects non-string name (T2.1c).
- `useField.test-d.ts` — `UseFieldReturn` ≡ `FieldRenderAPI` via bidirectional assignability.

`packages/react/src/typeAssertions/injectedProps.types.ts` — plain `.ts` module (so it's in the `tsc --build` graph): positive proof that a `ComponentType<FormalityFieldComponentProps<P>>` compiles with the destructure-before-forward pattern, that the three injected props (`state`/`formState`/`forwardRef`) are typed, and that default `P = unknown` still works (T3.1).

---

## SECTION 3 — forwardRef Delivery (§20)

### 3.1 Runtime delivery
- **`forwardRef: field.ref`** is delivered inside the `coreProps` bundle in **`hooks/useField.tsx:678`**, within the `mergeFieldProps({ ... coreProps: { name, label, disabled, error, value, onChange, onBlur, forwardRef: field.ref, ...stateInjection } })` call (`useField.tsx:670-686`).
- **Clarification:** the forwardRef delivery lives in `useField.tsx`, not `Field.tsx` (which is a thin wrapper that delegates the entire Controller lifecycle to `useField`). **Confirmed present and correct** at `useField.tsx:678`.
- Downstream handling in `useField.tsx`: for the host-element fallback path the `forwardRef` prop is translated back into React's special `ref` key (`useField.tsx:731-757`); the component path is forwardRef-exclusive per §20.4 (`useField.tsx:760`).

### 3.2 JSDoc "Runtime delivery (important)" (§20.7)
- **Present:** `overlays.ts:170` — `**Runtime delivery (important).** <Field> delivers RHF's ref as a regular, top-level, enumerable prop named forwardRef ...`. The full paragraph (overlays.ts:170-177) documents: plain-function-component usage (`ref={forwardRef}`), the React 19 ref-as-prop case, and the §20.4 `React.forwardRef`-wrapped consumer migration. Surrounding JSDoc (overlays.ts:146, 151) cross-references it. **§20.7 DONE confirmed.**

---

## Summary

- **Coverage gate (§1.3.7): PASS** (exit 0; aggregate 97.32/94.82/99.13/97.32, all ≥90). 39 files / 1066 tests (1061 passed, 5 skipped).
- **Appendix C (T1.1–T3.2): ALL 9 ITEMS PASS** — every overlay type exists, is correctly typed, and is exported from `index.ts`. Supporting type-level proof files present in `__typechecks__/` and `typeAssertions/`.
- **forwardRef (§20): CONFIRMED** — delivered at `useField.tsx:678`; §20.7 JSDoc at `overlays.ts:170`.
- **Only actionable coverage debt:** `hooks/usePropsEvaluation.ts` branch coverage at **72%** (function-invocation branches at lines 209/222/232/252). Low severity; does not fail the aggregate gate.
