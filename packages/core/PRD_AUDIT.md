# Core Package PRD Compliance Audit (v1.0)

> **Verdict: ✅ COMPLIANT.** Every in-scope PRD section (`@formality-ui/core` against
> PRD §3, §5, §8, §9-core, §10, §11, §14, §15, §16) is PRD-complete across all four
> checks (exports / signatures / edge cases / tests). **One test-coverage gap was
> found and fixed** (§10.7 parser/formatter inverse contract — untested before this
> audit). The behavior under test was already correct; **no source change was
> required.** Baseline: **606 tests → 661 tests** (55 new executable audit tests),
> **0 failures.** Framework-independence gate unchanged at **exactly 14 tests**.

---

## Summary

This audit confirms `@formality-ui/core` is ready for the v1.0.0 release gate
(P3.M3.T1). It produces two artifacts:

1. **`packages/core/src/__tests__/prd-compliance.audit.test.ts`** — an executable
   regression-proof audit gate that re-asserts the headline behavior of every
   in-scope PRD section in one file, **including the newly-added §10.7
   parser/formatter inverse-contract block** (the gap fix).
2. **`packages/core/PRD_AUDIT.md`** (this file) — the human-readable audit report.

The audit is a **verification + hardening** task, not a feature build. All code-level
gaps (G1–G5) were closed during P1 (ordering relocated, `validate`/`mergeConfigs`
added, signature deviations documented). This task adds the **evidence** and closes
the one undocumented test gap.

**Result:** 606 → **661 tests, 0 failures.** No source logic changed.

---

## Scope

**In scope (audited here — core-only):**

| PRD Section | Topic                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| §3          | State types (`FieldState`, `FormState`, `FieldError`, …)                                                                         |
| §5          | Expression Engine (qualified/unqualified paths, dual context, proxies)                                                           |
| §8          | Conditions (OR-disabled / AND-visible / last-wins-set)                                                                           |
| §9          | Subscription — core's expression-context contribution only (`buildEvaluationContext` / `buildFormContext` / `buildFieldContext`) |
| §10         | Validation — RULES-layer primitives only (see Scope Boundaries)                                                                  |
| §11         | Transform Pipeline (parse/format/extractValueField/transformFieldName)                                                           |
| §14         | Initial Value Resolution (priority order + recordKey)                                                                            |
| §15         | Field Ordering (`sortFieldsByOrder`, `getUnusedFields`, `getOrderedUnusedFields`)                                                |
| §16         | Label Resolution (6-source priority chain + humanize)                                                                            |

**Out of scope (React adapter — audited in P3.M1.T1.S2):**

- §4 Context System, §6 Component Specs, §12–§13 FieldGroup, §20 `forwardRef`
- §9 Subscription System (providers, hooks, inverted index)
- **§10.9.1 validation 4-layer composition** (`RHF rules → field → type → form`) —
  see [Scope Boundaries](#scope-boundaries).

---

## Method

Each in-scope section is checked against four dimensions, per
`plan/005_8f88e0ec4482/P3M1T1S1/research/audit-findings.md`:

- **(a) Exports exist** — every §1.3.2 "Key Exports" entry is reachable from the
  core barrel (`src/index.ts`) and is a function/type. Asserted programmatically in
  the audit gate's `§1.3.2 API surface` block.
- **(b) Signatures match / deviations documented** — the implementation signature
  matches the PRD, or an accepted deviation is recorded in JSDoc (G4/G5).
- **(c) §19 edge cases handled** — empty/null/undefined, submit-vs-display,
  record-vs-form-values, valueField-on-submit-only.
- **(d) Test coverage** — a primary per-module test asserts the behavior, PLUS the
  executable audit gate re-asserts the headline behavior.

---

## Per-Section Compliance Table

> Evidence pointers are **verified** (each cited file:line was opened and confirmed
> to assert the claimed behavior). `(audit)` = the new
> `src/__tests__/prd-compliance.audit.test.ts`.

| Section                         | (a) Exports                                                                                                                                                              | (b) Signatures                                                                                                                    | (c) §19 edges                                                                                   | (d) Tests                                                                                                                                    | Verdict                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **§3 State types**              | All types exported via `index.ts` (`FieldState`, `FormState`, `FieldError`, `ConditionResult`, `ValidationResult`, …) ✓                                                  | Match PRD ✓                                                                                                                       | `isEmptyValue`/`getInputDefaultValue` handle type-based empties (defaults.ts) ✓                 | `state_types.test.ts` (144 lines) ✓                                                                                                          | **COMPLIANT**                                    |
| **§5 Expression**               | `evaluate`, `evaluateDescriptor`, `inferFieldsFromDescriptor`, `buildEvaluationContext`, `buildFormContext`, `buildFieldContext`, `createFieldStateProxy` ✓ (`index.ts`) | Match PRD ✓                                                                                                                       | Dual context: `record.*` literal vs unqualified→field proxy (context.ts `QUALIFIED_PREFIXES`) ✓ | `expression.test.ts`; `expression.complex.test.ts:308` (Qualified Access), `:378` (Unqualified Access); (audit) `PRD §5 Expression Engine` ✓ | **COMPLIANT**                                    |
| **§8 Conditions**               | `evaluateConditions`, `conditionMatches`, `mergeConditionResults`, `inferFieldsFromConditions` ✓                                                                         | G4 deviation documented — `conditions/evaluate.ts:348` (object-arg form matches PRD §1.3.2 _example code_; table text is stale) ✓ | OR/AND/last-wins cumulative logic (evaluate.ts) ✓                                               | `conditions.test.ts:48` (OR disabled), `:79` (AND visible), `:107` (last-wins set); (audit) `PRD §8 Conditions` ✓                            | **COMPLIANT**                                    |
| **§9 Subscription (core part)** | `buildEvaluationContext`, `buildFormContext`, `buildFieldContext` ✓                                                                                                      | Match PRD ✓                                                                                                                       | Field-state proxies carry metadata (isTouched, isDirty, …) ✓                                    | `expression.complex.test.ts`; (audit) `PRD §5 Expression Engine` (proxy exposes metadata) ✓                                                  | **COMPLIANT**                                    |
| **§10 Validation**              | `validate`, `runValidator`, `runValidatorSync`, `isValid`, `composeValidators`, `resolveErrorMessage`, `required`, `minLength`, `maxLength`, `pattern` ✓                 | Match PRD (`validate.ts` JSDoc: RULES-layer wrapper over `runValidator`) ✓                                                        | Array short-circuit, factory-by-name materialization, throw-as-failure ✓                        | `validation.test.ts` (55 tests; `resolveErrorMessage` `:412`); (audit) `PRD §10 Validation` ✓                                                | **COMPLIANT** (core scope; see Scope Boundaries) |
| **§11 Transform**               | `parse`, `format`, `extractValueField`, `transformFieldName`, `createFloatParser`, `createFloatFormatter`, `createDefaultParsers`, `createDefaultFormatters` ✓           | Match PRD ✓                                                                                                                       | `extractValueField` submit-only (§19.5); named+inline spec; warn-on-missing ✓                   | `transform.test.ts:16/66/119`; (audit) `PRD §11 Transform Pipeline` + **`PRD §10.7 Inverse Contract`** (gap fix) ✓                           | **COMPLIANT**                                    |
| **§14 Initial Value**           | `resolveInitialValue`, `resolveAllInitialValues` ✓                                                                                                                       | G5 deviation documented — `config/defaults.ts:15` (richer superset signature) ✓                                                   | Priority chain; recordKey mapping; valueField NOT used here (submit-only by design) ✓           | `config.test.ts:393` (defaultValues first), `:406` (recordKey), `:430` (fallback); (audit) `PRD §14 Initial Value Resolution` ✓              | **COMPLIANT**                                    |
| **§15 Ordering**                | `sortFieldsByOrder`, `getUnusedFields`, `getOrderedUnusedFields` ✓ (canonical: `config/ordering.ts`; re-exported from `labels/resolve.ts`)                               | Match PRD (G1 relocated P1.M1) ✓                                                                                                  | `undefined` order → `Infinity` (sorts last) ✓                                                   | `labels.test.ts:161` (`describe("Field Ordering")`: `:169/212/228`); (audit) `PRD §15 Field Ordering` ✓                                      | **COMPLIANT**                                    |
| **§16 Labels**                  | `resolveLabel`, `humanizeLabel`, `resolveFormTitle` ✓                                                                                                                    | G5 deviation documented — `labels/resolve.ts:59` (richer superset signature) ✓                                                    | 6-source priority chain; humanize fallback ✓                                                    | `labels.test.ts:54` (`resolveLabel` priority: `:57/63/69/76/82/88`); (audit) `PRD §16 Label Resolution` ✓                                    | **COMPLIANT**                                    |

---

## Accepted Deviations

All deviations are **documented in JSDoc** at the implementation site and match
PRD §1.3.2's own _example code_ (the table text is a simplified representation).

| ID     | Where                   | What                                                                                                                                                                                                                                                                   | Evidence                                                                                                    |
| ------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **G4** | `evaluateConditions`    | PRD §1.3.2 table says `evaluateConditions(conditions, state)`; implemented as `evaluateConditions(input: EvaluateConditionsInput)` (object-arg). The PRD's _own example code_ (PRD.md §1.3.2) uses the identical object-arg form.                                      | `conditions/evaluate.ts:344–353` JSDoc                                                                      |
| **G5** | `resolveInitialValue`   | PRD table says `resolveInitialValue(record, config, inputConfig)`; implemented as `(fieldName, fieldConfig?, inputConfig?, record?, defaultValues?)` — a richer superset that drives the full priority chain in one call.                                              | `config/defaults.ts:15–18` JSDoc                                                                            |
| **G5** | `resolveLabel`          | PRD table says `resolveLabel(config, fieldName)`; implemented as `(fieldName, fieldConfig?, evaluatedSelectProps?, componentProps?)` — a richer superset resolving the 6-source chain.                                                                                 | `labels/resolve.ts:59–62` JSDoc                                                                             |
| **G9** | `InputConfig.precision` | **DEFERRED (not a gap).** The named-formatter approach (`float2`/`float3`/`float4` in `createDefaultFormatters`) is the accepted equivalent. The inverse-contract test uses matching-precision pairs; mismatch is documented as consumer responsibility per PRD §10.7. | `transform/pipeline.ts` (`createDefaultFormatters`); (audit) `PRD §10.7 Inverse Contract` (truncation case) |

---

## Gaps Found & Fixed

### §10.7 Parser/Formatter Inverse Contract — **FOUND & FIXED (test-only)**

**PRD §10.7 mandate (PRD.md:3446):**

> Parsers and formatters MUST be inverses of each other … Test all parser/formatter
> pairs with real data to ensure no precision loss.

**Before this audit:** No test in `packages/core/src/__tests__/` verified
`parse(format(value)) === value` for matching-precision pairs. (Confirmed: `grep`
for `inverse|round.trip|parse(format|format(parse` across all core tests returned
zero matches — see `audit-findings.md` §4.)

**Fix:** Added the `PRD §10.7 Parser/Formatter Inverse Contract` describe-block to
`src/__tests__/prd-compliance.audit.test.ts` (4 tests):

1. `float parser/formatter round-trip at precision 2 (both directions)` — asserts
   `parse(format(42.69, f2), p) === 42.69` **and** `format(parse("42.69", p), f2) === "42.69"`.
2. `float3 and float4 precision pairs round-trip` — uses `toBeCloseTo(v, prec)` for
   float tolerance.
3. `default parsers/formatters round-trip via named 'float' pair` —
   `createDefaultParsers()` + `createDefaultFormatters()`.
4. `documents precision-mismatch truncation as the consumer's job (PRD §10.7 Invalid)`
   — asserts `format(42.691, f2) === "42.69"` (truncation by design), documenting the
   G9 deferral.

**Source change required?** **No.** The functions in `transform/pipeline.ts`
(`createFloatParser` / `createFloatFormatter`) already round-trip correctly for
matching precision. This was a **verification** test, not a bug fix — it passed on
the first run. No edits to `transform/pipeline.ts` were needed.

---

## Scope Boundaries

### Validation 4-layer composition is React, not core (§10.9.1)

PRD §10.9.1 specifies a 4-layer validation composition:
`RHF rules → field → type → form`. This composition is **NOT a core responsibility**.
Core ships **ONLY the RULES-layer primitives**: `validate`, `runValidator`,
`runValidatorSync`, `isValid`, `composeValidators`, and the built-in factories
(`required`, `minLength`, `maxLength`, `pattern`).

The 4-layer wiring lives in the React adapter's `Field` Controller (`rules.validate`)
— `validate.ts` JSDoc states this explicitly:

> This covers the RULES layer only (PRD §9.1). The field-validator and type-validator
> layers are wired by the adapter's `Field` Controller `rules.validate`; this function
> does not compose them.

Adding layer-composition logic to core would violate §1.3.2 framework-agnosticism.
Auditing the layer composition is **P3.M1.T1.S2 (react audit)**. Core is marked
**COMPLIANT** for its scope.

---

## Reproduce

```bash
# 1. The executable audit gate (incl. the §10.7 inverse-contract block):
pnpm --filter @formality-ui/core exec vitest run src/__tests__/prd-compliance.audit.test.ts
# → 55 passed

# 2. Just the §10.7 inverse-contract block:
pnpm --filter @formality-ui/core exec vitest run src/__tests__/prd-compliance.audit.test.ts -t "Inverse Contract"
# → 4 passed

# 3. Full core suite (no regression; framework-independence stays 14):
pnpm --filter @formality-ui/core exec vitest run
# → 661 passed (11 files); framework-independence.test.ts = 14 tests

# 4. Build-quality gates (all green):
pnpm typecheck      # tsc --build — 0 errors
pnpm lint           # eslint . — 0 errors (only pre-existing react-package `any` warnings)
pnpm build          # pnpm -r build — all packages emit cleanly
```

---

## Files Touched

| File                                                       | Change  | Purpose                                                           |
| ---------------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `packages/core/src/__tests__/prd-compliance.audit.test.ts` | **NEW** | Executable audit gate + §10.7 inverse-contract gap fix (55 tests) |
| `packages/core/PRD_AUDIT.md`                               | **NEW** | This report                                                       |

**No source-logic files were modified.** The §10.7 inverse-contract test passed on
the first run, confirming the transform functions already round-trip correctly for
matching precision — so no TDD source fix was required.
