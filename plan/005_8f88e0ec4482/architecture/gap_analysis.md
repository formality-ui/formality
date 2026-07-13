# Gap Analysis — Formality v1.0 PRD vs Current Implementation (v0.2.5)

## Executive Summary

The codebase is **~95% PRD-complete**. The remaining work for v1.0 is
**spec-compliance reconciliation** (closing structural/API deviations) and
**release hardening** (docs sync, dead-code cleanup, version bump). There are
**no major missing features** — all five components, the expression engine,
conditions, validation, transform pipeline, auto-save, subscriptions, and the
type-safety overlay system are implemented and tested (1003 tests, 97% coverage).

## GAP Registry

### G1: `config/ordering.ts` structural deviation [STRUCTURAL — Medium]

**PRD §1.3.1/§1.3.2 require:** `config/ordering.ts` module exporting
`sortFieldsByOrder(fields, config)`.

**Current:** Ordering functions (`sortFieldsByOrder`, `getUnusedFields`,
`getOrderedUnusedFields`) live in `packages/core/src/labels/resolve.ts`
(lines 180-213) and are exported from `labels/index.ts` and root `index.ts`
under "Labels & Ordering". The `config/` directory has only `merge.ts`,
`defaults.ts`, `index.ts` — **no `ordering.ts`**.

**Impact:** Structural non-compliance with PRD. Functions work correctly; the
only consumer (`UnusedFields.tsx`) imports from `@formality-ui/core` root barrel.

**Resolution:** Create `packages/core/src/config/ordering.ts`, move the three
ordering functions there, update `config/index.ts` barrel, keep `labels/index.ts`
re-export for backwards compat. The root `index.ts` already exports them.

---

### G2: Missing `validate()` named export [API — Medium]

**PRD §1.3.2 requires:** `validation/validate` module exporting
`validate(value, rules, validators, formValues)`.

**Current:** No function named `validate` exists in core. The module exports
`runValidator`, `runValidatorSync`, `isValid`, `composeValidators` instead.

**Impact:** API-surface non-compliance. The granular functions cover all use
cases functionally, but the PRD-named headline export is absent.

**Resolution:** Add a thin `validate()` wrapper in `validation/validate.ts`
that composes the existing functions, export it. Signature:
`validate(value, rules, validators, formValues)`.

---

### G3: Missing `mergeConfigs()` named export [API — Medium]

**PRD §1.3.2 requires:** `config/merge` module exporting
`mergeConfigs(provider, form, field)`.

**Current:** No function named `mergeConfigs` exists. The module exports
`deepMerge`, `mergeInputConfigs`, `resolveInputConfig`, `mergeStaticProps`,
`mergeFieldProps`, `createConfigContext`.

**Impact:** API-surface non-compliance. Same as G2 — functionally complete,
PRD-named export absent.

**Resolution:** Add a thin `mergeConfigs(provider, form, field)` wrapper that
composes `resolveInputConfig` / `mergeFieldProps`, export it.

---

### G4: `evaluateConditions` signature deviation [API — Low]

**PRD §1.3.2 table:** `evaluateConditions(conditions, state)`.
**PRD §1.3.2 example code:** uses `EvaluateConditionsInput` object arg.

**Current:** `evaluateConditions(input: EvaluateConditionsInput)` — single
object arg `{ conditions, fieldValues, fieldStates?, record?, props? }`.

**Resolution:** The PRD's own example code already uses the object-arg form.
The §1.3.2 table is stale text. The current implementation is correct.
**No code change needed** — this is a PRD-table-text inconsistency, not a code
gap. Document the decision.

---

### G5: `resolveInitialValue` / `resolveLabel` parameter order [API — Low]

**PRD §1.3.2:** `resolveInitialValue(record, config, inputConfig)` and
`resolveLabel(config, fieldName)`.

**Current:** `resolveInitialValue(fieldName, fieldConfig?, inputConfig?, record?, defaultValues?)`
and `resolveLabel(fieldName, fieldConfig?, evaluatedSelectProps?, componentProps?)`.

**Resolution:** The current signatures are richer supersets used internally by
the React adapter. The PRD literal signatures are simplified representations.
**No code change needed** — document as accepted deviation. These are internal
APIs consumed only by the react adapter, not by end users.

---

### G6: `useField` hook absent [STRUCTURAL — Medium]

**PRD §1.3.3 requires:** `hooks/useField` — "RHF Controller integration, uses
transform/pipeline, validation/validate".

**Current:** No `useField` hook file exists. The Controller integration, parse/
format pipeline, and validation wiring are **implemented inline in `Field.tsx`**
(the `Controller render` block, ~lines 430-702). Functionally complete.

**Impact:** Structural/module-contract divergence only. No runtime gap.

**Resolution:** Extract the Controller integration logic from `Field.tsx` into a
`useField` hook that `Field` delegates to. This improves testability and module
reusability. Alternative: accept the inline implementation and document the
deviation. **Decision: extract** — the PRD explicitly lists this hook as a
module, and extraction improves the architecture.

---

### G7: `useFieldDisabledState` orphaned code [HYGIENE — Low]

**Current:** `packages/react/src/hooks/useFieldDisabledState.ts` (197 lines) is
implemented and has a test file (`useFieldDisabledState.test.tsx`), but is
**neither exported from `index.ts`** nor **used by `Field.tsx`** (Field resolves
disabled inline via `useConditions`).

**Impact:** Dead code that can drift from reality. It was likely a precursor to
the current inline disabled-resolution logic.

**Resolution:** Remove `useFieldDisabledState.ts` and its test, OR wire it into
`Field`'s disabled-resolution path. **Decision: remove** — it's dead code and
`Field` already handles disabled resolution correctly inline.

---

### G8: overlays.ts stale wording [DOCS — Trivial]

**Current:** `packages/react/src/overlays.ts` lines ~143-145 still describe the
coreProps ref member as "a React-special key — `ref`" — stale after §20
forwardRef delivery change.

**Resolution:** Update the descriptive paragraph to reflect `forwardRef`
delivery.

---

### G9: `precision` field on InputConfig [FEATURE — Low/Optional]

**PRD §10.6** suggests `precision?: number` on InputConfig for number formatting.

**Current:** Not implemented on InputConfig. Precision is handled via named
formatters (`createFloatFormatter`, etc.) and field-level `props.precision`.

**Resolution:** This is an optional enhancement, not a hard PRD requirement (the
PRD presents it as a "Solution" suggestion). The existing named-formatter
approach is equivalent. **Defer** — document as an accepted design choice.

---

## Already Complete (PRD says incomplete, code shows done)

These items in PRD Appendix C were annotated as PARTIAL/NOT-STARTED but are
**fully implemented** in the current codebase:

| PRD Item | PRD Annotation | Actual Status | Evidence |
|----------|---------------|---------------|----------|
| T2.1 (generic Form/Field) | ⚠️ PARTIAL | ✅ DONE | `ReactFormFieldsConfig<V>` with `Extract<keyof V, string>` in `overlays.ts:97-100`; `FormProps.config: ReactFormFieldsConfig<TFieldValues>` in `Form.tsx:48`; `FieldProps<TName>` in `Field.tsx:70`; typecheck files prove typo rejection |
| T2.2 (defineInputs) | ❌ NOT STARTED | ✅ DONE | `defineInputs` in `overlays.ts:159-162`, exported at `index.ts:110`; `defineInputs.test-d.ts` + `defineInputs.test.ts` |
| T3.1 (FormalityFieldComponentProps) | ❌ NOT STARTED | ✅ DONE | `overlays.ts:185-194` with real types (`CustomFieldState`, `UseFormStateReturn`, `RefCallBack`); used internally in `Field.tsx:612` |
| §20.7 (forwardRef JSDoc) | (requirement) | ✅ DONE | "Runtime caveat" removed; "Runtime delivery (important)" added in `overlays.ts:168-174` |

## Summary of Required Work

| ID | Gap | Type | Effort | Phase |
|----|-----|------|--------|-------|
| G1 | Move ordering to config/ordering.ts | Structural | 1 SP | P1 |
| G2 | Add validate() named export | API | 1 SP | P1 |
| G3 | Add mergeConfigs() named export | API | 1 SP | P1 |
| G4 | evaluateConditions signature | Doc-only | 0.5 SP | P1 |
| G5 | resolveInitialValue/resolveLabel params | Doc-only | 0.5 SP | P1 |
| G6 | Extract useField hook | Structural | 2 SP | P2 |
| G7 | Remove useFieldDisabledState | Hygiene | 0.5 SP | P2 |
| G8 | Fix overlays.ts wording | Docs | 0.5 SP | P2 |
| G9 | precision on InputConfig | Optional/Defer | — | — |
| — | Final docs sync (README, overview) | Docs | 1 SP | P3 |
| — | Release: version bump + verify | Release | 1 SP | P3 |
