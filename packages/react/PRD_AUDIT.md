# React Package PRD Compliance Audit (v1.0)

> **Verdict: ✅ COMPLIANT.** Every in-scope PRD section (`@formality-ui/react`
> against PRD §4, §6, §9, §12, §13, §20) is PRD-complete across all four checks
> (exports/components exist / props & signatures / behavior / tests). **One
> behavioral gap was found and fixed** (§8.5 subscriber-scoped submit blocking —
> `handleSubmit` previously blocked on _any_ validating field instead of only
> fields with subscribers). Baseline: **400 react tests → 424 react tests** (24
> new executable audit tests), **0 failures, 5 skipped (unchanged)**. Full
> workspace suite: **1085 passed | 5 skipped**. Coverage gate **PASS**
> (aggregate 97.32 / 94.95 / 99.13 / 97.32, all ≥90%).

---

## Summary

This audit confirms `@formality-ui/react` is ready for the v1.0.0 release gate
(P3.M3.T1). It produces two artifacts:

1. **`packages/react/src/__tests__/prd-compliance.audit.test.tsx`** — an
   executable regression-proof audit gate that re-asserts the headline behavior
   of every in-scope PRD section in one file (§4 / §6 / §9 / §12 / §13 / §20),
   **including the §8.5 subscriber-scoped submit-blocking block** (the gap fix).
2. **`packages/react/PRD_AUDIT.md`** (this file) — the human-readable audit report.

The audit is a **verification + one-small-TDD-fix** task, not a feature build.
All structural gaps (G6 `useField` extracted, G7 `useFieldDisabledState` removed,
G8 `overlays.ts` JSDoc fixed) were closed during P1/P2, and Appendix C items
T1.1–T3.2 plus §20 `forwardRef` shipped earlier. This task adds the **evidence**
and fixes the **one** behavioral gap the scout audits surfaced (§8.5).

**Result:** 400 → **424 react tests, 0 failures.** One source fix applied
(`Form.tsx` `handleSubmit` subscriber-scoped gate).

---

## Scope

**In scope (audited here — react-only):**

| PRD Section | Topic                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------- |
| §4          | Context System (`FormContext`, `ConfigContext`, `GroupContext` members + defaults)           |
| §6          | Component Specs (`FormalityProvider` / `Form` / `Field` / `FieldGroup` / `UnusedFields`)     |
| §9          | Subscription System (inverted index, watcher setter, pending-queue drain, LIFO unsubscribe)  |
| §12         | Auto-Save System (scoped validation, version guard, debounce branches, `submitImmediate`)    |
| §13         | FieldGroup Mechanics (no fieldset; OR-disabled / AND-visible / accumulation across nesting)  |
| §20         | Field ref delivery via `forwardRef` (§20.5 acceptance: plain function component + DOM input) |

> **Note on §8.5.** PRD §8.5 "Validation Blocking" is numbered under §8 but is a
> subsection of the §9 Subscription System (it gates submission on the
> subscriber/dependent relationship the inverted index tracks). It is audited
> here as part of §9 and is the **one behavioral gap found + fixed**.

**Out of scope (core package — audited in P3.M1.T1.S1):**

- §3 / §5 / §8 / §10 / §11 / §14–§17 — core expression / conditions / validation /
  transform / config / labels (see `packages/core/PRD_AUDIT.md`).
- §10.9.1 validation 4-layer composition wiring — React `Field` Controller
  `rules.validate` composes the layers; the RULES-layer primitives live in core.

---

## Method

Each in-scope section is checked against four dimensions, per the four scout
field guides referenced in `plan/005_8f88e0ec4482/P3M1T1S2/PRP.md`:

- **(a) Exists / Exported** — every required component / hook / context is
  present and reachable from the public barrel (`src/index.ts`). Asserted
  structurally in the audit gate's §4 / §6 blocks.
- **(b) Props / Signatures** — the component props / hook signatures match the
  PRD, or an accepted deviation (richer superset) is documented.
- **(c) Behavior** — the headline behavioral spec matches (conditions OR/AND,
  scoped validation, LIFO cleanup, `forwardRef` delivery, subscriber-scoped
  blocking, …).
- **(d) Tests** — a primary per-module test asserts the behavior, PLUS the
  executable audit gate re-asserts the headline behavior.

---

## Per-Section Compliance Table

> Evidence pointers are **verified** (each cited file:line was opened and
> confirmed to assert the claimed behavior). `(audit)` = the new
> `src/__tests__/prd-compliance.audit.test.tsx`.

| Section                   | (a) Exists / Exported                                                                                                                  | (b) Props / Signatures                                                                                                                       | (c) Behavior                                                                                                                                                                                   | (d) Tests                                                                                                                                                                                 | Verdict               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **§4 Context System**     | `FormContext`+`useFormContext` (`index.ts:40`); `ConfigContext`+`useConfigContext` (`:37`); `GroupContext`+`useGroupContext` (`:43`) ✓ | `FormContextValue` ships all documented members incl. `debouncedSubmit` (with `.cancel/.flush/.pending`) + `submitImmediate` ✓               | `ConfigContext` default `defaultSubscriptionPropName:'state'` (`ConfigContext.ts:60-71`); `GroupContext` default `isDisabled:false, isVisible:true, [], []` (`GroupContext.ts:63-75`) ✓        | `Form.test.tsx`; `FormalityProvider.test.tsx`; (audit) `PRD §4 Context System` ✓                                                                                                          | **COMPLIANT**         |
| **§6 Components**         | `FormalityProvider` (`index.ts:49`); `Form` (`:46`); `Field` (`:53`); `FieldGroup` (`:58`); `UnusedFields` (`:61`) ✓                   | `Form` forwards `mode`→`useForm` + exposes `resolvedTitle`/`unusedFields`/`methods`/`handleSubmit` via `FormRenderAPI` (`Form.tsx:91-116`) ✓ | `FormalityProvider` no wrapper DOM; `Field` 8-layer merge + parse/format + conditions; `FieldGroup` `<span>` + OR/AND; `UnusedFields` `shouldRegister={false}` ✓                               | `Field.test.tsx`; `FieldGroup.test.tsx:92/118`; `UnusedFields.test.tsx:71/225`; `FormalityProvider.test.tsx`; (audit) `PRD §6 Components` ✓                                               | **COMPLIANT**         |
| **§9 Subscription**       | `useSubscriptions` (`index.ts:78`); `useInferredInputs` (`:77`); inverted-index refs in `Form.tsx:212` (`invertedSubscriptions`) ✓     | Match PRD ✓                                                                                                                                  | LIFO unsubscribe (`useSubscriptions.ts:79-81`); `runIdRef` per-run tracking (`:36/44/48`); pending-queue drain; §8.3 churn fix via JSON-signature memo (`useInferredInputs.ts:76-82,84-109`) ✓ | `useSubscriptions.test.tsx`; `Field.subscriptionStability.test.tsx`; (audit) `PRD §9 Subscription System` ✓                                                                               | **COMPLIANT**         |
| **§9 / §8.5 Submit gate** | `handleSubmit` internal (`Form.tsx:461`); reached by auto-save (`executeAutoSave:667`) + manual submit (`handleRenderSubmit:506`) ✓    | Subscriber-scoped per PRD §8.5 (`Form.tsx:468-477`) ✓ (FIXED — see [Gaps Found](#gaps-found--fixed))                                         | Blocks only while a validating field HAS subscribers; an in-flight validator with no subscribers does NOT block ✓ (FIXED)                                                                      | (audit) `PRD §8.5 subscriber-scoped submit blocking` ✓                                                                                                                                    | **COMPLIANT** (fixed) |
| **§12 Auto-Save**         | `autoSave`/`debounce`/`onSubmit` props (`Form.tsx`); `debouncedSubmit`+`submitImmediate` on `FormContext` ✓                            | `debounce?: number \| false` (superset); per-field numeric debounce via `getOrCreateDebounced` (`Form.tsx:686+`) ✓                           | Scoped validation of changed+affected only (`executeAutoSave:559-666`; Gate 1 `:594`, Gate 2 `:632`); version guard (`executionVersionRef:228/561`); `submitImmediate` flush (`:769+`) ✓       | `autosave-validation.test.tsx:225/432`; `autosave-rapid-changes.test.tsx`; `autosave-field-debounce.test.tsx`; `autosave-submit-immediate.test.tsx`; (audit) `PRD §12 Auto-Save System` ✓ | **COMPLIANT**         |
| **§13 FieldGroup Mech.**  | `FieldGroup` (`index.ts:58`) ✓                                                                                                         | `FieldGroupProps { name, children }` — no `hidden` prop (visibility via conditions, per §5.4) ✓                                              | No `<fieldset>`; `<span>` wrapper (`FieldGroup.tsx:150-154`); OR-disabled (`:96`), AND-visible (`:101`); accumulation across nesting (`:108-118`) ✓                                            | `FieldGroup.test.tsx:122/209`; (audit) `PRD §13 FieldGroup Mechanics` ✓                                                                                                                   | **COMPLIANT**         |
| **§20 forwardRef**        | `FormalityFieldComponentProps` (delivers `forwardRef`) (`overlays.ts:182`); `Field`→`useField` wiring ✓                                | `forwardRef?: RefCallBack` on the component-props contract (`overlays.ts:194`) ✓                                                             | `coreProps` emits `forwardRef: field.ref` (`useField.tsx:678`); plain function component receives a non-undefined `forwardRef` that reaches a DOM input ✓                                      | `FieldForwardRef.acceptance.test.tsx:164-240`; `Field.forwardRef.test.tsx`; (audit) `PRD §20 forwardRef` ✓                                                                                | **COMPLIANT**         |

---

## Appendix C Type-Safety (T1.1–T3.2)

All Appendix C items are **present, exported, and typecheck clean** (verified by
reading `overlays.ts` + the `__typechecks__/*.test-d.ts` proofs; the gate
`pnpm typecheck` is green).

| Item      | Description                        | Exists | Exported       | File:line                              | Verdict  |
| --------- | ---------------------------------- | ------ | -------------- | -------------------------------------- | -------- |
| **T1.1**  | `ReactInputConfig.component` typed | ✓      | `index.ts:98`  | `overlays.ts:44-63`                    | **PASS** |
| **T1.2**  | `ReactInputConfig.rules` typed     | ✓      | `index.ts:98`  | `overlays.ts:65+` (`ReactFieldConfig`) | **PASS** |
| **T1.3**  | `ReactInputConfig.template` typed  | ✓      | `index.ts:98`  | `overlays.ts:57`                       | **PASS** |
| **T2.1a** | `ReactFormFieldsConfig<V>` generic | ✓      | `index.ts:100` | `overlays.ts:103`                      | **PASS** |
| **T2.1b** | `FormProps.config` generic         | ✓      | `Form.tsx:48`  | `Form.tsx:48`                          | **PASS** |
| **T2.1c** | `FieldProps<TName>` generic        | ✓      | `Field.tsx`    | `Field.tsx:38/113`                     | **PASS** |
| **T2.2**  | `defineInputs` identity helper     | ✓      | `index.ts:113` | `overlays.ts:133`                      | **PASS** |
| **T3.1**  | `FormalityFieldComponentProps<P>`  | ✓      | `index.ts:101` | `overlays.ts:182`                      | **PASS** |
| **T3.2**  | `ReactInputConfig<TValue>` generic | ✓      | `index.ts:98`  | `overlays.ts:44`                       | **PASS** |

---

## §20 forwardRef Confirmation

- **Delivery site:** `useField.tsx:678` — `coreProps` emits
  `forwardRef: field.ref` (the CURRENT implemented behavior; the legacy
  React-special `ref` key is no longer used).
- **§20.7 JSDoc:** `overlays.ts:170` — "Runtime delivery (important)" paragraph
  documents that `<Field>` delivers RHF's ref as a regular top-level enumerable
  prop named `forwardRef` (no `React.forwardRef` wrap required for a plain
  function component).
- **Acceptance test:** `FieldForwardRef.acceptance.test.tsx:164-240` — the four
  §20.6 tests (plain-component delivery, no React-18 ref warning, focus-on-error,
  `React.forwardRef` migration regression).
- **Audit gate:** `prd-compliance.audit.test.tsx` → `PRD §20 forwardRef` (3
  tests) re-asserts plain-component delivery + no-ref-warning + focus-on-error.

**§20 is DONE.**

---

## Coverage Gate (PRD §1.3.7 ≥ 90%)

```
$ pnpm test:coverage
All files | 97.32 | 94.95 | 99.13 | 97.32 |   (statements / branches / functions / lines)
Test Files  40 passed (40)
Tests       1085 passed | 5 skipped (1090)
```

**Result: PASS** (exit 0). Aggregate coverage is **97.32 / 94.95 / 99.13 / 97.32**
— well above the 90% floor on every dimension. (Baseline before this task was
97.32 / 94.82 / 99.13 / 97.32; branch coverage ticked up to **94.95** because the
§8.5 subscriber-scoped fix exercises a previously-uncovered branch.)

The coverage threshold in `vitest.config.ts` is **aggregate-only** (no
`perFile: true`), which is the PRD §1.3.7 contract. The only substantive sub-90
file is `usePropsEvaluation.ts` (branch 72%); it does **not** fail the aggregate
gate. Adding `perFile: true` would fail CI on the 0% type-only modules
(`index.ts`, `types.ts`) and is explicitly forbidden.

---

## Accepted Deviations

All deviations are **richer supersets** consumed internally by the adapter —
they never lose information relative to the PRD's simplified signatures, and
they are documented at the implementation site.

| Deviation                               | What                                                                                                                                                                                                                                                      | Evidence                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `useConditions` return shape            | Returns a `ConditionResult` (`disabled`/`visible`/`hasDisabledCondition`/`hasVisibleCondition`/`hasSetCondition`/`setValue`) — a richer superset than `{isDisabled,isVisible}`, consumed by `useField`. Mirrors core's G4/G5 documented-superset pattern. | `useConditions.ts`; consumed in `useField.tsx` + `FieldGroup.tsx:96-118` |
| `Field` §5.3.6 step 4 (debounce=false)  | `debounce===false` routes through the auto-save gates + RHF `mode` (not a direct `methods.trigger`). Behaviorally equivalent; documented in the auto-save gates.                                                                                          | `Form.tsx:557+` (`executeAutoSave` NOTE)                                 |
| Superset props                          | `Form.debounce?: number \| false`; `FormRenderAPI.handleSubmit`; `FieldProps.inputConfig?`; `UnusedFieldsProps.children?` — supersets of the PRD's literal signatures.                                                                                    | `Form.tsx:91-116`; `Field.tsx`; `UnusedFields.tsx:33`                    |
| `SelectDescriptor`→`SelectValue` naming | PRD §5.1 uses `SelectDescriptor` in prose; the implementation uses `SelectValue` (a naming drift, not a behavioral gap).                                                                                                                                  | `overlays.ts` / `@formality-ui/core` types                               |

---

## Gaps Found & Fixed

### §8.5 Subscriber-Scoped Submit Blocking — **FOUND & FIXED (source + test)**

**PRD §8.5 mandate (PRD.md:3037):**

```typescript
// In Form submit handler
const isAnySubscribedFieldValidating = ...
  for (const [fieldName, isValidating] of validatingFields.entries()) {
    if (isValidating) {
      const subscribers = invertedSubscriptions.get(fieldName);
      if (subscribers && subscribers.size > 0) {
        return true; // Block submission
      }
    }
  }
```

> **Why** (PRD): _If Field A is validating and Field B depends on it, we
> shouldn't submit until Field A completes validation._

**Before this audit:** `handleSubmit` (`Form.tsx`, old lines 468-471) blocked
submission while **ANY** field was validating — stricter than §8.5:

```typescript
// BEFORE (deviates from §8.5):
for (const [, isValidating] of validatingFields.current) {
  if (isValidating) return;
}
```

This deviation bit on the **auto-save path**: `executeAutoSave` validates only
the changed + affected fields (Gate 1 / Gate 2 + `waitForFieldValidation`), then
calls `handleSubmit` directly. An UNRELATED in-flight async validator (e.g. an
async validator on `email` triggered by RHF's own `onChange`) was still marked
validating at that point, so the all-fields gate stalled a perfectly-valid
scoped save of an independent edit (`notes`) — contradicting the auto-save
"unrelated invalid field doesn't block a valid edit" philosophy
(`autosave-validation.test.tsx:432`).

**Fix:** Replaced the all-fields gate with the subscriber-scoped gate per
§8.5 (`Form.tsx:468-477`):

```typescript
// AFTER (§8.5 subscriber-scoped):
for (const [fieldName, isValidating] of validatingFields.current) {
  if (!isValidating) continue;
  const subscribers = invertedSubscriptions.current.get(fieldName);
  if (subscribers && subscribers.size > 0) return;
}
```

An in-flight validator on a field with **no subscribers** no longer blocks; an
in-flight validator on a field **with subscribers/dependents** still blocks
(until that validator settles). The fix is bounded and safe:

- **Manual submit path** is unaffected — RHF's own `methods.handleSubmit` still
  validates registered fields and rejects invalid submits before `handleSubmit`
  runs. The `integration/complete-form.test.tsx:336` "block submission while
  async validation is running" test stays green because it blocks via the RHF
  validator returning `"Invalid email"` (a real failure), NOT via the
  `validatingFields` gate.
- **Auto-save path** is improved — unrelated in-flight validators no longer
  stall scoped saves, aligning with §8.5's intent and the existing
  `autosave-validation.test.tsx:432` behavior.

**Regression guard:** The `PRD §8.5 subscriber-scoped submit blocking` block in
`prd-compliance.audit.test.tsx` (2 tests) double-knits the fix:

1. `auto-save PROCEEDS while an UNRELATED in-flight async validator (NO
subscribers) runs` — fails on the old all-fields gate, passes after the fix.
2. `auto-save does NOT proceed while an in-flight async validator HAS
subscribers` — the subscriber-scoped block still holds.

Both tests pass. The full react suite (424 tests) and the full workspace suite
(1085 tests) are green with **zero regressions**.

---

## Scope Boundaries

- **Core's G1–G9 closed in P1/P2** (see `plan/005_8f88e0ec4482/architecture/gap_analysis.md`):
  G6 `useField` extracted, G7 `useFieldDisabledState` removed, G8 `overlays.ts`
  JSDoc fixed. Appendix C T2.1/T2.2/T3.1/§20.7 all DONE. This task is
  react-only and did not touch any of these.
- **§10.9.1 validation 4-layer composition** (`RHF rules → field → type → form`)
  is wired by the React `Field` Controller's `rules.validate` (`useField.tsx:509-549`).
  Core ships the RULES-layer primitives only (audited in P3.M1.T1.S1). React is
  marked **COMPLIANT** for its layer-wiring responsibility.

---

## Reproduce

```bash
# 1. The executable audit gate (incl. the §8.5 subscriber-scoped block):
pnpm --filter @formality-ui/react exec vitest run src/__tests__/prd-compliance.audit.test.tsx
# → 24 passed

# 2. Just the §8.5 subscriber-scoped block:
pnpm --filter @formality-ui/react exec vitest run src/__tests__/prd-compliance.audit.test.tsx -t "subscriber-scoped"
# → 2 passed

# 3. Full react suite (no regression; skip count unchanged at 5):
pnpm --filter @formality-ui/react exec vitest run
# → 424 passed | 5 skipped (29 files)

# 4. Coverage gate (PRD §1.3.7 ≥90%):
pnpm test:coverage
# → exit 0; All files 97.32 / 94.95 / 99.13 / 97.32; 1085 passed | 5 skipped

# 5. Build-quality gates (all green):
pnpm typecheck      # tsc --build — 0 errors
pnpm lint           # eslint . — 0 errors (only pre-existing `any` warnings)
pnpm build          # pnpm -r build — all packages emit cleanly

# 6. Confirm scope (the §8.5 fix + the two new files only; no core changes):
git diff --name-only ; git status --short
```

---

## Files Touched

| File                                                         | Change   | Purpose                                                                                                 |
| ------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------- |
| `packages/react/src/__tests__/prd-compliance.audit.test.tsx` | **NEW**  | Executable audit gate — §4 / §6 / §9 / §12 / §13 / §20 + §8.5 subscriber-scoped fix (24 tests)          |
| `packages/react/PRD_AUDIT.md`                                | **NEW**  | This report                                                                                             |
| `packages/react/src/components/Form.tsx`                     | **EDIT** | §8.5 fix: `handleSubmit` all-fields gate → subscriber-scoped gate (`Form.tsx:468-477`); +JSDoc (Mode A) |

**No `packages/core/` file was modified** (that is P3.M1.T1.S1's scope). The
§8.5 fix is the ONE sanctioned behavioral change; it keeps the full react +
workspace suites green and is double-knit by the audit gate's §8.5 block.
