name: "P3.M1.T1.S2 — Audit react package against PRD §4-§6, §9, §12-§13, §20"
description: |

---

## Goal

**Feature Goal**: Perform a **verifiable, regression-proof PRD-compliance audit** of the
`@formality-ui/react` package against PRD §4 (Context System), §6 (Component Specs), §9
(Subscription System, incl. the §8.5 validation-blocking subsection that lives under §9),
§12 (Auto-Save System), §13 (FieldGroup Mechanics), §20 (Field ref delivery via `forwardRef`).
The audit confirms every in-scope module is PRD-compliant across four dimensions —
(a) required exports/components exist & are exported, (b) props/signatures match or deviations
are documented, (c) behavioral specs match, (d) tests cover the behavior — and **closes the one
discovered behavioral gap (§8.5 subscriber-scoped submission blocking) via TDD** with a
documented fallback.

This is a **verification + hardening** task, NOT a feature build. All G1–G9 gaps from
`gap_analysis.md` were closed during P1/P2 (useField extracted in P2.M1.T1, useFieldDisabledState
removed, overlays.ts JSDoc fixed, §20 forwardRef shipped). The scout audits confirmed the entire
react surface is compliant EXCEPT one §8.5 deviation in `handleSubmit`. This task produces the
**evidence** (audit report + executable compliance gate) and **fixes the one behavioral gap**.

**Deliverable** (TWO artifacts, both in the react package):
1. `packages/react/src/__tests__/prd-compliance.audit.test.tsx` — an **executable audit gate**
   that re-asserts the headline behavior of each in-scope module against the PRD, INCLUDING the
   §8.5 subscriber-scoped validation-blocking block (the TDD gap fix). This is the "audit
   checklist" made executable and regression-proof.
2. `packages/react/PRD_AUDIT.md` — the **human-readable audit report/checklist**: a per-section
   4-check table (a/b/c/d) with file:line + test:line evidence, the compliance verdict, the
   accepted deviation notes (useConditions `ConditionResult` return shape; Field §5.3.6 step 4;
   superset props extensions), the §8.5 gap (found + fixed OR documented), the type-safety
   confirmation (Appendix C T1.1–T3.2 all done/exported), the §20 forwardRef confirmation, and the
   90% coverage-gate result.

**Success Definition**:
- `packages/react/PRD_AUDIT.md` exists and marks **every in-scope PRD section COMPLIANT** with a
  concrete evidence pointer (source file:line + test name/path) for each of the 4 checks.
- `prd-compliance.audit.test.tsx` exists, **passes**, and contains at minimum:
  - A §4 Context block (FormContext members incl. debouncedSubmit/submitImmediate; ConfigContext
    defaults; GroupContext default: isDisabled:false, isVisible:true, conditions:[], subscriptions:[]).
  - A §6 Components block (FormalityProvider provides ConfigContext + no wrapper; Form forwards
    `mode` to `useForm` + exposes `resolvedTitle`/`unusedFields` + `transformValuesForSubmit`;
    Field delivers `forwardRef` (§20) + 8-layer merge + conditions OR/AND/last-wins + parse-before-
    onChange/format-on-render; FieldGroup `<span>` wrapper + OR-disabled/AND-visible + accumulation;
    UnusedFields `shouldRegister={false}`).
  - A §9 Subscription block (inverted index, watcher setter, pending-queue drain, LIFO unsubscribe).
  - A §12 Auto-Save block (scoped validation of changed+affected only via `methods.trigger`;
    execution-version guard; debounce branches false/number/undefined; `submitImmediate` flush).
  - A §13 FieldGroup-nesting block (merge table: OR disabled, AND visible, accumulate).
  - A §20 forwardRef block (plain function component receives a non-undefined `forwardRef` RefCallBack
    that reaches a DOM input).
  - The §8.5 TDD block: "manual submit proceeds when an in-flight async validator has NO
    subscribers" and "manual submit blocks when an in-flight async validator HAS subscribers."
- **§8.5 gap resolved** — EITHER fixed via TDD (handleSubmit made subscriber-scoped per §8.5, full
  suite green) OR, if the fix causes regressions, documented as an accepted stricter-but-safe
  deviation and the audit test adjusted to assert the current behavior + cite §8.5.
- **Full react suite still green** (baseline: 405 tests, 5 skipped → 405 + N new audit tests,
  0 failures). Core suite untouched (it is S1's responsibility).
- **Coverage gate passes**: `pnpm test:coverage` exits 0, aggregate ≥90% (statements/branches/
  functions/lines). Baseline: aggregate 97.32 / 94.82 / 99.13 / 97.32.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all green.

## User Persona (if applicable)

**Target User**: Formality maintainer / downstream React consumer who must trust that
`@formality-ui/react` matches the v1.0 PRD before the v1.0.0 release (P3.M3.T1).

**Use Case**: A maintainer opens the audit report to answer "is react v1.0 PRD-complete across
contexts, components, subscriptions, auto-save, FieldGroup, and forwardRef?" and a CI run executes
the audit gate to prevent silent regressions against the PRD contract.

**User Journey**: Read `PRD_AUDIT.md` verdict → drill into the cited test → `pnpm test:coverage`
proves the behavior holds + the 90% gate passes → ship v1.0 react with confidence.

**Pain Points Addressed**: Today react compliance is "known good" only via scattered tests and the
scout reports. There is no single executable gate or checklist that maps each PRD section to
evidence, and the §8.5 subscriber-scoped blocking deviation is untested and undocumented.

## Why

- **v1.0 release gate (P3.M1).** Before the v1.0.0 version bump (P3.M3.T1), react must carry
  auditable proof of PRD compliance for all in-scope sections. This task IS that proof. It is the
  react twin of P3.M1.T1.S1 (core audit) — S1 owns `packages/core/`, this task owns
  `packages/react/`. The two never overlap.
- **Closes the one undocumented behavioral gap.** The scout audits found exactly ONE material
  behavioral deviation: `handleSubmit` (Form.tsx:468-471) blocks submission on ANY validating field,
  whereas PRD §8.5 specifies subscriber-scoped blocking (block only when a validating field HAS
  subscribers/dependents). This task fixes it via TDD (or, with a clear fallback, documents it).
- **Regression-proofing.** An executable `prd-compliance.audit.test.tsx` prevents future refactors
  from silently breaking a PRD-cited behavior — far more durable than a prose checklist alone, and
  it double-knits the §8.5 fix so it cannot silently revert.

## What

Create two new files in the react package. The ONLY source-logic change permitted is the §8.5
`handleSubmit` fix (and only if it keeps the full suite green); everything else is test + report.
The work is: write the executable audit gate (TDD-first for §8.5), write the audit report, run the
full gate + coverage, confirm green.

### Success Criteria

- [ ] `packages/react/PRD_AUDIT.md` exists with a per-section 4-check (a/b/c/d) table covering
      §4, §6, §9, §12, §13, §20 — every row COMPLIANT with evidence.
- [ ] `packages/react/src/__tests__/prd-compliance.audit.test.tsx` exists and passes.
- [ ] The §8.5 block passes: submit proceeds when an in-flight async validator has NO subscribers;
      blocks when it HAS subscribers. (Either via the handleSubmit fix, or — fallback only — the
      test asserts current stricter behavior and §8.5 is documented as an accepted deviation.)
- [ ] The §20 forwardRef block passes: a plain function component receives `forwardRef`.
- [ ] Appendix C items T1.1–T3.2 confirmed present + exported (cited in the report).
- [ ] Coverage gate passes: `pnpm test:coverage` exits 0, aggregate ≥90%.
- [ ] Full react suite green: `pnpm --filter @formality-ui/react exec vitest run` → all pass
      (405 + N), 0 fail, 5 skipped unchanged.
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm format:check` + `pnpm build` green.
- [ ] `git diff --stat` touches only the two new files + the §8.5 fix in Form.tsx (the fallback
      path touches only the two new files).

## All Needed Context

### Context Completeness Check

A developer who knows nothing about this codebase would need: the PRD sections in scope, the
verified baseline (405 react tests / coverage gate passing), the exact location of every in-scope
component/hook/context + its existing tests, the ONE behavioral gap (§8.5) + the exact fix, the
accepted deviations, the Appendix C type-safety status, and the exact validation commands. All
cited below with file:line. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include these in context window before implementing
- docfile: plan/005_8f88e0ec4482/P3M1T1S2/research/components-audit.md
  why: |
    FIELD GUIDE #1. Per-component (FormalityProvider/Form/Field/FieldGroup/UnusedFields) verdicts
    with file:line props+behavior+test evidence. Confirms all 5 COMPLIANT. The §20 forwardRef line
    is useField.tsx:678 (`forwardRef: field.ref`). READ THIS FIRST for the §6 + §20 blocks.

- docfile: plan/005_8f88e0ec4482/P3M1T1S2/research/hooks-contexts-audit.md
  why: |
    FIELD GUIDE #2. Per-hook (useConditions/useField/useFormState/useInferredInputs/
    usePropsEvaluation/useSubscriptions) + per-context (Form/Config/Group) verdicts with file:line.
    §8.3 churn fix verified at useInferredInputs.ts:76-82 (JSON signature) + :84-109 (useMemo
    [signature]). useSubscriptions LIFO at useSubscriptions.ts:79-81, runIdRef at :36/44/48/66/85.
    Documents the useConditions ConditionResult-return accepted deviation.

- docfile: plan/005_8f88e0ec4482/P3M1T1S2/research/autosave-subscription-audit.md
  why: |
    FIELD GUIDE #3. §12 auto-save (executeAutoSave Form.tsx:559-666, Gate 1 :594, Gate 2 :632,
    executionVersionRef :228/561-562, getOrCreateDebounced :686-704, submitImmediate :762-785,
    changeField :371-401) + §9 subscription (addSubscription :254-280, registerWatcherSetter
    :317-335) — all COMPLIANT. AND THE §8.5 GAP: handleSubmit Form.tsx:468-471 blocks on ANY
    validating field instead of subscriber-scoped. The full test-coverage matrix (behavior →
    test file:line) is here — cite it in the report.

- docfile: plan/005_8f88e0ec4482/P3M1T1S2/research/coverage-typesafety-audit.md
  why: |
    FIELD GUIDE #4. Coverage gate PASSES (aggregate 97.32/94.82/99.13/97.32, exit 0; only
    usePropsEvaluation.ts branch at 72% is sub-90 but does NOT fail the aggregate gate).
    Appendix C T1.1-T3.2 ALL PASS (overlays.ts: T1.1 component:49, T1.2 rules:69, T1.3 template:52,
    T2.1a ReactFormFieldsConfig:103-105, T2.1b Form.tsx:48, T2.1c Field.tsx:38/113, T2.2
    defineInputs:133-136, T3.1 FormalityFieldComponentProps:182/190, T3.2 ReactInputConfig<TValue>:44).
    §20.7 JSDoc "Runtime delivery (important)" at overlays.ts:170.

- docfile: plan/005_8f88e0ec4482/P3M1T1S1/PRP.md
  why: |
    THE SIBLING (core audit). It establishes the exact pattern this task mirrors (executable
    prd-compliance.audit.test + PRD_AUDIT.md). S1 writes to packages/core/; this task writes to
    packages/react/. NO file overlap. Mirror S1's structure/sections/quality bar.

- docfile: plan/005_8f88e0ec4482/architecture/gap_analysis.md
  why: |
    G1-G9 registry. G6 (useField extracted), G7 (useFieldDisabledState removed), G8 (overlays.ts
    JSDoc fixed) all DONE in P2. "Already Complete" table confirms T2.1/T2.2/T3.1/§20.7 done.
    Cite these in PRD_AUDIT.md. §8.5 is NOT in gap_analysis (newly found by this audit's scouts).

# PRD SECTIONS in scope (read the cited ranges from PRD.md)
- docfile: PRD.md §4 Context System (FormContext h3.10, ConfigContext h3.11, GroupContext h3.12)
- docfile: PRD.md §6 Component Specs (§5.1 FormalityProvider h3.16, §5.2 Form h3.17, §5.3 Field
           h3.18, §5.4 FieldGroup h3.19, §5.5 UnusedFields h3.20)
- docfile: PRD.md §9 Subscription System (h2.10; NOTE §8.5 "Validation Blocking" is a subsection
           of §9 despite the 8.x numbering — search "Validation Blocking")
- docfile: PRD.md §12 Auto-Save System (h2.13: §11.1 behavior h3.48, §11.2 impl h3.49, §11.3
           debounce h3.50)
- docfile: PRD.md §13 FieldGroup Mechanics (h2.14: §12.1-§12.7)
- docfile: PRD.md §20 Field ref delivery via forwardRef (h2.21: line 4910; §20.5 acceptance,
           §20.6 testing, §20.7 docs)

# SOURCE FILES under audit (read to confirm behavior; edit ONLY Form.tsx for the §8.5 fix)
- file: packages/react/src/components/Form.tsx
  why: THE §8.5 FIX SITE. handleSubmit at :455-489; the all-fields validating gate at :468-471 is
        the deviation. Also: executeAutoSave :559-666, changeField :371-401, addSubscription
        :254-280, registerWatcherSetter :317-335, mode forwarding :198, resolvedTitle :797-819,
        transformValuesForSubmit :933-966.
- file: packages/react/src/hooks/useField.tsx
  why: THE §20 forwardRef SITE — coreProps `forwardRef: field.ref` at :678. Also 8-layer
        mergeFieldProps :666-685, conditions/deisenabled :388-432, parse/format :560-581.
- file: packages/react/src/components/FieldGroup.tsx
  why: §13 mechanics — span wrapper :150-154, OR-disabled :74-79, AND-visible :82-85,
        accumulation :96-106.
- file: packages/react/src/hooks/useInferredInputs.ts
  why: §8.3 churn fix — JSON signature :76-82, useMemo [signature] :84-109.
- file: packages/react/src/hooks/useSubscriptions.ts
  why: §9 lifecycle — LIFO unsubscribe :79-81, runIdRef tracking :36/44/48/66/85.
- file: packages/react/src/context/{FormContext,ConfigContext,GroupContext}.ts
  why: §4 contexts — FormContextValue members, ConfigContext defaults :60-71, GroupContext
        default :63-75 (isDisabled:false, isVisible:true, conditions:[], subscriptions:[]).
- file: packages/react/src/overlays.ts
  why: Appendix C types (T1.1:49, T1.2:69, T1.3:52, T2.1a:103-105, T2.2:133-136,
        T3.1:182/190, T3.2:44) + §20.7 JSDoc :170.

# EXISTING TESTS (the evidence for check d; follow their patterns in the audit gate)
- file: packages/react/src/__tests__/useField.test.tsx
  why: PATTERN to follow — REAL <FormalityProvider><Form> wrapper, vitest globals, renderHook.
        Note tests render real Form/provider (useField calls useWatch unconditionally). Import
        components from "../components/..." not deep mocks.
- file: packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx
  why: PATTERN for the §20 forwardRef audit block (plain function component + forwardRef reaches
        DOM input + no React 18 ref warning + focus-on-error). Lines :164-240.
- file: packages/react/src/__tests__/Field.subscriptionStability.test.tsx
  why: PATTERN for the §8.3 churn regression (counts [Formality Subscription] logs, asserts no
        "Maximum update depth"). The audit gate's subscription block can be lighter-weight.
- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: PATTERN for §12 auto-save scoped-validation assertions (changed+affected validated,
        unrelated invalid field does NOT block). Lines :170/:432/:557/:597.
- file: packages/react/src/__tests__/integration/complete-form.test.tsx:336
  why: "should block submission while async validation is running" — CRITICAL: this test relies
        on RHF's OWN validation blocking (the email validator FAILS), NOT the handleSubmit gate.
        It MUST stay green after the §8.5 fix. Read it before editing handleSubmit.
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
├── index.ts                       # BARREL — all hooks/contexts/components/overlay types exported
├── overlays.ts                    # Appendix C types (T1.1-T3.2) + §20.7 forwardRef JSDoc :170
├── types.ts                       # type-only module (0% coverage by design)
├── components/
│   ├── FormalityProvider.tsx      # §5.1 — provides ConfigContext, no wrapper ✓
│   ├── Form.tsx                   # §5.2 — mode/autoSave/executeAutoSave/subscriptions ✓ + §8.5 GAP at :468-471
│   ├── Field.tsx                  # §5.3 — THIN wrapper delegating to useField ✓
│   ├── FieldGroup.tsx             # §5.4/§13 — span wrapper + OR/AND nesting ✓
│   └── UnusedFields.tsx           # §5.5 — shouldRegister={false} ✓
├── hooks/
│   ├── useField.tsx               # §1.3.3/§5.3/§20 — Controller lifecycle; forwardRef at :678 ✓
│   ├── useConditions.ts           # §13.6 — returns ConditionResult (accepted deviation)
│   ├── useFormState.ts            # §4/§5 — isolated useWatch ✓
│   ├── useInferredInputs.ts       # §13.5/§8.3 — JSON-signature memo (churn fix) ✓
│   ├── usePropsEvaluation.ts      # §16 — 3-layer eval (branch 72% — only sub-90 file)
│   └── useSubscriptions.ts        # §9 — LIFO + runIdRef ✓
├── context/
│   ├── FormContext.ts             # §4.1 — debouncedSubmit/submitImmediate present ✓
│   ├── ConfigContext.ts           # §4.2 — defaults :60-71 ✓
│   └── GroupContext.ts            # §4.3 — default :63-75 ✓
├── __tests__/                     # 28 files, 405 tests (5 skipped) — the evidence base
└── __typechecks__/                # 4 .test-d.ts files (Appendix C type proofs)
```

### Desired Codebase tree with files to be added

```bash
packages/react/
├── PRD_AUDIT.md                                       # NEW — audit report/checklist (deliverable 1)
└── src/__tests__/
    └── prd-compliance.audit.test.tsx                  # NEW — executable audit gate + §8.5 fix (deliverable 2)
# The ONLY source file that may change is Form.tsx (the §8.5 handleSubmit fix), and ONLY if the
# full suite stays green. The fallback path changes NO source files.
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL — this is an AUDIT task. Default to ADDING tests + a report. The ONLY source edit is
// the §8.5 handleSubmit fix, and ONLY if it keeps the full react suite green (see Task 4 fallback).

// CRITICAL — §8.5 is the ONE behavioral gap. handleSubmit (Form.tsx:468-471) blocks submission on
// ANY validating field. PRD §8.5 says block only when a validating field HAS subscribers. The fix
// is small (replace the for-loop with a subscriber-scoped check using invertedSubscriptions.current).
// handleSubmit is SHARED by auto-save (executeAutoSave :666 → handleSubmit) and manual submit
// (handleRenderSubmit → handleSubmit), so the fix affects BOTH paths — but by the time auto-save
// reaches handleSubmit, changed+affected fields are already validated (Gate 1/Gate 2 +
// waitForFieldValidation), so only UNRELATED in-flight validators are affected, and per §8.5 those
// should only block if they have subscribers. This ALIGNS with the auto-save "unrelated invalid
// field doesn't block a valid edit" philosophy (autosave-validation.test.tsx:432, already green).

// CRITICAL — integration/complete-form.test.tsx:336 ("block submission while async validation
// is running") MUST stay green. It blocks because the email validator FAILS (RHF sets the error
// and does not call the submit callback), NOT because of the handleSubmit validating gate. The
// §8.5 fix does not weaken RHF's own validation. Verify this test passes after the fix.

// CRITICAL — the §8.3 churn fix (useInferredInputs JSON-signature memo) is ALREADY in place and
// regression-tested. Do NOT re-implement it. Cite useInferredInputs.ts:76-82/:84-109 as evidence.
// The audit gate should ASSERT the memo is keyed on a content signature (lightweight: render a
// field whose subscribesTo is a new inline array each render and assert no "Maximum update depth").

// GOTCHA — react tests are .tsx and render REAL components. useField/useConditions call
// useWatch({ control }) unconditionally during render, so you CANNOT mock `methods` as `{}` (no
// .control) — you must wrap in a REAL <FormalityProvider><Form>. See useField.test.tsx header.
// For watcher-setter spies, overlay the real Form's FormContext value with a copy whose
// registerWatcherSetter is a vi.fn (nearest provider wins) — see useField.test.tsx:198.

// GOTCHA — test imports use vitest globals (globals:true in react vitest.config.ts): you can use
// describe/it/expect/vi WITHOUT importing them, BUT the existing convention (useField.test.tsx:24)
// is to import them explicitly: `import { describe, it, expect, vi } from "vitest"`. Follow that.
// @testing-library/react provides render/renderHook/act/screen; setup.ts wires jest-dom + cleanup.

// GOTCHA — the coverage threshold (vitest.config.ts:33-38) is AGGREGATE-only (no perFile:true).
// The gate PASSES at aggregate 97.32/94.82/99.13/97.32. The only sub-90 substantive file is
// usePropsEvaluation.ts (branch 72%) — it does NOT fail the gate. Adding audit-gate function-
// branch assertions for usePropsEvaluation is a BONUS (improves that file) but NOT required.
// Do NOT add `perFile: true` to the threshold — that would fail CI on the 0% type-only modules.

// GOTCHA — 5 tests are skipped in Field.test.tsx (baseline). Your new audit tests must NOT be
// skipped. Confirm the skip count stays at 5 after your changes.

// CRITICAL — do NOT edit PRD.md, tasks.json, prd_snapshot.md, gap_analysis.md, plan/**,
// CHANGELOG.md, README.md, or ANY packages/core/ file. S1 owns core; this task owns react only.
// The audit report is a NEW file in packages/react/, not an edit to an existing doc.

// PARALLEL WORK — S1 (P3.M1.T1.S1) writes packages/core/{src/__tests__/prd-compliance.audit.test.ts,
// PRD_AUDIT.md}. This task writes packages/react/{src/__tests__/prd-compliance.audit.test.tsx,
// PRD_AUDIT.md}. Different packages — no conflict. Both contribute to `pnpm test:coverage`.
```

## Implementation Blueprint

### Data models and structure

None. This task adds a test file and a markdown report, plus (optionally) a ~6-line edit to
`handleSubmit`. No types/models/runtime code.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — load the field guides + confirm the baseline
  - READ (ALL sections):
      plan/005_8f88e0ec4482/P3M1T1S2/research/components-audit.md
      plan/005_8f88e0ec4482/P3M1T1S2/research/hooks-contexts-audit.md
      plan/005_8f88e0ec4482/P3M1T1S2/research/autosave-subscription-audit.md
      plan/005_8f88e0ec4482/P3M1T1S2/research/coverage-typesafety-audit.md
      plan/005_8f88e0ec4482/P3M1T1S1/PRP.md   (the sibling pattern to mirror)
  - READ PRD.md §8.5 "Validation Blocking" (search that heading) + §20.5/§20.6 (forwardRef acceptance).
  - CONFIRM the baseline is green BEFORE writing anything:
      pnpm --filter @formality-ui/react exec vitest run
      # Expected: 405 passed | 5 skipped, 0 failed (28 files). If NOT green, STOP — report the
      # pre-existing failure (do not paper over it).
  - CONFIRM the §8.5 gap is real (sanity check the research):
      grep -n "isAnySubscribedFieldValidating\|subscriber" packages/react/src/components/Form.tsx
      # Expected: NO matches (confirms the subscriber-scoped gate is absent). The gap is the
      # all-fields loop at Form.tsx:468-471.
  - CONFIRM coverage gate baseline:
      pnpm test:coverage 2>&1 | tail -20
      # Expected: exit 0, aggregate ≥90%. Note the numbers for the report.

Task 2: CREATE prd-compliance.audit.test.tsx — §4 + §6 + §20 blocks
  - FILE: packages/react/src/__tests__/prd-compliance.audit.test.tsx  (NEW)
  - IMPORTS: `import { describe, it, expect, vi } from "vitest";` + render/renderHook/screen/act
            from "@testing-library/react" + userEvent from "@testing-library/user-event" + the
            components/hooks/contexts (Form, FormalityProvider, Field, FieldGroup, UnusedFields,
            FormContext/useFormContext, ConfigContext/useConfigContext, GroupContext/useGroupContext,
            useField) from their source paths + types from "../overlays" / "@formality-ui/core".
  - FOLLOW pattern: packages/react/src/__tests__/useField.test.tsx (REAL provider+form wrapper,
            vitest globals imported explicitly, describe/it nesting).
  - BLOCK A — §4 CONTEXT: describe("PRD §4 Context System"):
            - it("FormContext exposes required members"): render a <Form> with a render-prop child
              that captures the FormContextValue (via useFormContext) and assert it has config,
              methods, registerField/unregisterField, addSubscription/removeSubscription,
              registerWatcherSetter/unregisterWatcherSetter, changeField, setFieldValidating,
              getFormState, debouncedSubmit (with .cancel/.flush/.pending), submitImmediate,
              unusedFields. (Cite FormContext.ts:25-139.)
            - it("ConfigContext ships documented defaults"): useConfigContext() outside a provider
              → defaultSubscriptionPropName === "state", empty maps. (Cite ConfigContext.ts:60-71.)
            - it("GroupContext default is enabled/visible"): useGroupContext() outside any
              FieldGroup → isDisabled:false, isVisible:true, conditions:[], subscriptions:[].
              (Cite GroupContext.ts:63-75.)
  - BLOCK B — §6 COMPONENTS: describe("PRD §6 Components"):
            - FormalityProvider: it("provides ConfigContext without a wrapper DOM node") — render
              a child, assert container.firstChild IS the child (FormalityProvider.test.tsx:247
              pattern).
            - Form: it("forwards mode to useForm") — render <Form mode="onTouched">, assert RHF
              formState reflects onTouched (or spy on useForm via vi.mock react-hook-form —
              PREFER a behavioral check: type+blur timing). it("exposes resolvedTitle + unusedFields
              + methods in render API") — render-prop captures {resolvedTitle, unusedFields,
              methods}. it("transformValuesForSubmit renames valueField + getSubmitField on submit")
              (Form.test.tsx:229 pattern).
            - Field: it("delivers forwardRef (§20) to a plain function component") — render a plain
              function component typed ComponentType<FormalityFieldComponentProps> that attaches
              ref={forwardRef} to an <input>; assert the input is the RHF-registered node (see
              FieldForwardRef.acceptance.test.tsx:169 pattern). it("parses before onChange and
              formats on render") — provider with a named parser/formatter; type + assert. 
              it("conditions OR-disable / AND-visible / last-set-wins") — field with two matching
              conditions.
            - FieldGroup: it("renders a <span> wrapper with display:none when hidden") — query the
              span by data-formality-group, assert style.display==='none' (FieldGroup.test.tsx:122
              pattern). it("nests with OR-disabled / AND-visible") — nested FieldGroups.
            - UnusedFields: it("renders undeclared fields with shouldRegister={false}") — assert
              the rendered Fields are NOT counted in unusedFields (UnusedFields.test.tsx:225 pattern).
  - BLOCK C — §20 forwardRef (dedicated, mirrors §20.5 acceptance): describe("PRD §20 forwardRef"):
            - it("plain function component receives a non-undefined forwardRef RefCallBack") —
              destructure forwardRef, attach ref={forwardRef} to <input>, assert input resolves +
              RHF focus-on-error reaches it (FieldForwardRef.acceptance.test.tsx:201 pattern).
            - it("emits no React-18 'Function components cannot be given refs' warning") —
              vi.spyOn(console, "error"), assert the warning never fires.

Task 3: ADD §9 + §12 + §13 blocks to the audit test
  - BLOCK D — §9 SUBSCRIPTION: describe("PRD §9 Subscription System"):
            - it("addSubscription updates the inverted index and notifies a mounted target") —
              two fields where B subscribesTo A; assert A's watchers includes B (overlay the real
              Form's FormContext with a spied registerWatcherSetter per useField.test.tsx:198, OR
              assert behaviorally via a watched-field re-render).
            - it("pending queue drains on target mount (mount-order resolution)") — render B
              before A, then mount A; assert A sees B (§8.4).
            - it("cleanup is LIFO and per-run (no leak)") — change a field's subscribesTo twice and
              assert the invertedSubscriptions has exactly the latest set (useSubscriptions.test.tsx:282
              pattern).
            - it("useInferredInputs is referentially stable (no max-depth churn)") — render a field
              whose subscribesTo is a fresh inline array each render; assert no
              "Maximum update depth" error and stable identity (useInferredInputs.test.tsx:47 +
              Field.subscriptionStability.test.tsx:65 pattern).
  - BLOCK E — §12 AUTO-SAVE: describe("PRD §12 Auto-Save System"):
            - it("validates only changed + affected fields, not the whole form (scoped)") —
              edit field A (no subscribers); assert an unrelated required field B is NOT validated
              and the save proceeds (autosave-validation.test.tsx:432 pattern).
            - it("Gate 1 triggers changed fields; Gate 2 triggers affected fields") — edit a field
              with a dependent; assert both validated, save blocked if either invalid.
            - it("aborts a stale save when a new change arrives mid-validation (version guard)") —
              use a slow async validator, change value twice, assert only final value saved
              (autosave-rapid-changes.test.tsx:78 pattern).
            - it("debounce:false submits immediately; number=per-field timer; undefined=Form-level")
              — three fields, one each, assert timing (autosave-field-debounce.test.tsx pattern).
            - it("submitImmediate flushes pending Form-level + per-field saves as one submit") —
              (autosave-submit-immediate.test.tsx:192 pattern).
  - BLOCK F — §13 FieldGroup MECHANICS: describe("PRD §13 FieldGroup Mechanics"):
            - it("does NOT render a <fieldset> and does NOT set a disabled attribute") — assert no
              fieldset in the rendered tree; disabled propagates via context only.
            - it("accumulates conditions and subscriptions from all ancestors") — triple-nested
              FieldGroups; assert the innermost GroupContextValue.conditions/subscriptions include
              all ancestors (FieldGroup.test.tsx:209 pattern).

Task 4: §8.5 TDD gap-fix block + THE handleSubmit fix (the one behavioral gap)
  - BLOCK G — §8.5 VALIDATION BLOCKING (TDD): describe("PRD §8.5 subscriber-scoped submit blocking"):
            // TDD: write these BEFORE editing handleSubmit. Run them. They will FAIL on the current
            // all-fields gate. Then apply the fix. Re-run — they should PASS.
            - it("manual submit PROCEEDS when an in-flight async validator has NO subscribers"):
                Setup: field `email` (async validator, ~100ms) with NO dependents; field `notes`
                (no validator). Edit notes, submit. Assert onSubmit IS called (the in-flight email
                validator has no subscribers, so §8.5 says do not block). This FAILS today (the
                all-fields gate at Form.tsx:469 blocks).
            - it("manual submit BLOCKS when an in-field async validator HAS subscribers"):
                Setup: field `email` (async validator) with a dependent field `emailStatus`
                (conditions: when email...). Edit email (validator in-flight), submit. Assert
                onSubmit is NOT called until the email validator settles (subscriber-scoped block).
  - THE FIX — edit packages/react/src/components/Form.tsx handleSubmit (lines ~468-471):
            // BEFORE (deviates from §8.5):
            //   for (const [, isValidating] of validatingFields.current) {
            //     if (isValidating) return;
            //   }
            // AFTER (§8.5 subscriber-scoped):
            //   let blocking = false;
            //   for (const [fieldName, isValidating] of validatingFields.current) {
            //     if (!isValidating) continue;
            //     const subscribers = invertedSubscriptions.current.get(fieldName);
            //     if (subscribers && subscribers.size > 0) { blocking = true; break; }
            //   }
            //   if (blocking) return;
            // NOTE: verify the ref name is `invertedSubscriptions.current` (grep it in Form.tsx).
            // It is a useRef<Map<string, Set<string>>>; reading .current needs NO useCallback dep
            // change. Add a one-line JSDoc above referencing §8.5 (Mode A docs update).
  - RUN the full react suite after the fix:
      pnpm --filter @formality-ui/react exec vitest run
      # Expected: 405 + N audit tests pass, 0 fail, 5 skipped. ESPECIALLY confirm:
      #   - integration/complete-form.test.tsx:336 "block submission while async validation is
      #     running" still PASSES (RHF blocks it via the failing validator, not the gate).
      #   - autosave-validation.test.tsx:225 "wait for async validators" still passes.
      #   - autosave-validation.test.tsx:432 "unrelated invalid field still saves" still passes.
  - FALLBACK (only if a regression CANNOT be cleanly resolved):
      # 1. REVERT the handleSubmit edit (git checkout packages/react/src/components/Form.tsx).
      # 2. Adjust Block G: instead of asserting subscriber-scoped behavior, assert the CURRENT
      #    stricter behavior ("submit blocks while ANY field is validating — stricter than §8.5,
      #    accepted as safe") and add a comment citing §8.5 as a documented deviation.
      # 3. In PRD_AUDIT.md, mark §8.5 (under §9) as COMPLIANT-WITH-DOCUMENTED-DEVIATION: the impl
      #    is strictly safer (blocks on any validating field), which never causes incorrect data
      #    submission; the subscriber-scoped optimization is deferred. Record the reasoning.

Task 5: WRITE packages/react/PRD_AUDIT.md — the audit report/checklist
  - FILE: packages/react/PRD_AUDIT.md (NEW)
  - STRUCTURE:
      # React Package PRD Compliance Audit (v1.0)
      ## Summary  → one-line verdict: "COMPLIANT. 1 behavioral gap (§8.5 subscriber-scoped submit
                   blocking) found and fixed [or documented]. Coverage gate PASS (97.32/94.82/99.13/
                   97.32). Baseline 405 react tests → <new count>, 0 failures, 5 skipped."
      ## Scope   → list §4, §6, §9, §12, §13, §20; note out-of-scope (§3/§5/§8/§10/§11/§14-§17 =
                   core, audited in P3.M1.T1.S1).
      ## Method  → the 4 checks per section: (a) exports/components exist, (b) props/signatures/
                   deviations, (c) behavioral specs match, (d) test coverage. Cite the 4 research
                   field guides.
      ## Per-section table (THE DELIVERABLE) — one row per section with columns:
         | Section | (a) Exists/Exported | (b) Props/Signatures | (c) Behavior | (d) Tests | Verdict |
         Fill each cell with a concrete pointer, e.g. "(a) index.ts exports FieldGroup ✓",
         "(c) FieldGroup.tsx:150-154 span wrapper; :74-79 OR-disabled ✓",
         "(d) FieldGroup.test.tsx:122, :209 ✓".
      ## Appendix C type-safety (T1.1–T3.2) → table: item | exists | exported | file:line | verdict.
         All PASS (cite coverage-typesafety-audit.md §2).
      ## §20 forwardRef → confirmation: useField.tsx:678 forwardRef:field.ref; §20.7 JSDoc
         overlays.ts:170; acceptance test FieldForwardRef.acceptance.test.tsx:164. DONE.
      ## Coverage gate → the §1.3.7 result: aggregate numbers + exit 0; note usePropsEvaluation.ts
         branch 72% is the only sub-90 substantive file (does not fail aggregate gate).
      ## Accepted deviations → useConditions returns ConditionResult (disabled/visible) not
         {isDisabled,isVisible} — richer superset consumed by useField (like core G4/G5); Field
         §5.3.6 step 4 (debounce===false → methods.trigger) routed via auto-save gates + RHF mode;
         superset props (Form.debounce?:number|false, FormRenderAPI.handleSubmit,
         FieldProps.inputConfig?, UnusedFieldsProps.children?); PRD §5.1 SelectDescriptor→SelectValue
         naming drift.
      ## Gaps found & fixed → §8.5: handleSubmit blocked on any validating field; fixed to
         subscriber-scoped per §8.5 (Form.tsx:468-471); Block G tests added; full suite green.
         [OR fallback: §8.5 documented as accepted stricter-but-safe deviation.]
      ## Scope boundaries → core's G1-G9 closed in P1/P2; Appendix C done; this task is react-only.
      ## Reproduce → exact commands (pnpm --filter @formality-ui/react exec vitest run,
         pnpm test:coverage, pnpm typecheck/lint/format:check/build).
  - ACCURACY: every pointer must be a REAL file:line or test name confirmed against the field
              guides / the codebase. Do not fabricate — open each cited test and confirm.

Task 6: RUN THE FULL GATE — confirm green + scope
  - 6a. pnpm --filter @formality-ui/react exec vitest run
        # Expected: 405 + N new audit tests pass, 0 failures, 5 skipped (unchanged).
  - 6b. pnpm test:coverage
        # Expected: exit 0, aggregate ≥90% (statements/branches/functions/lines). Record numbers.
  - 6c. pnpm typecheck     # tsc --build — zero errors (new test + the §8.5 fix typecheck).
  - 6d. pnpm lint          # eslint . — zero errors.
  - 6e. pnpm format:check  # prettier --check . — clean. If the new files fail, run `pnpm format`
        # and re-check (prettier may reflow the markdown tables / test formatting).
  - 6f. pnpm build         # pnpm -r build — both packages emit cleanly (defensive).
  - 6g. git diff --stat
        # Expected: the two NEW files + Form.tsx (the §8.5 fix). [Fallback: only the two new files.]
        # Confirm NO packages/core/ file changed (that is S1's scope).
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — the audit test is a SECOND line of defense. It re-asserts headline behavior that is
// ALSO covered by the per-module test files. That redundancy is intentional: it makes the PRD
// contract executable in ONE place and survives module-test refactors. Do not delete the
// per-module tests; cite them in PRD_AUDIT.md as the primary evidence.

// PATTERN — react tests render REAL components. For anything touching Field/useField/FieldGroup,
// wrap in <FormalityProvider inputs={...}><Form config={...}>...</Form></FormalityProvider>. For
// watcher-setter/subscription assertions, overlay the real Form's FormContext with a copy whose
// registerWatcherSetter/addSubscription are vi.fn spies (nearest provider wins) — see
// useField.test.tsx:198. Do NOT mock react-hook-form's useForm to `{}` (useField calls
// useWatch({control}) unconditionally → throws).

// PATTERN — §20 forwardRef audit block: use a PLAIN function component (NOT React.forwardRef):
//   const PlainInput: ComponentType<FormalityFieldComponentProps> =
//     ({ forwardRef, ...rest }) => <input ref={forwardRef as any} data-testid="plain" {...rest} />;
//   // render inside <Form><Field type="plain" .../></Form>; assert the input is the RHF node +
//   // no console.error "Function components cannot be given refs".
// (Mirrors FieldForwardRef.acceptance.test.tsx:169.)

// PATTERN — §8.5 TDD tests. Use a slow async validator (setTimeout 100ms) so the validator is
// genuinely IN-FLIGHT at submit time. For the "HAS subscribers" case, add a dependent field via
// conditions: { when: "email", truthy: true, visible: true } (this makes email have a subscriber).
// Assert onSubmit call timing with vi.fn() + waitFor / fake timers. The two tests MUST fail
// before the fix and pass after.

// CRITICAL — the §8.5 fix. handleSubmit is shared by auto-save + manual submit. After the fix,
// an unrelated in-flight async validator no longer blocks a scoped save / submit — which is the
// §8.5 intent AND matches the existing "unrelated invalid field doesn't block" auto-save behavior.
// The risk is bounded: RHF's own methods.handleSubmit still validates registered fields on the
// manual path, and executeAutoSave's Gate 1/Gate 2 still validate changed+affected fields. The
// handleSubmit validating gate was a secondary safety net for the in-flight async race; §8.5
// refines it to subscriber-scoped. Run the FULL suite; if complete-form.test.tsx:336 or any
// autosave-validation test regresses, use the fallback (revert + document).

// CRITICAL — if ANY audit assertion fails for a reason OTHER than §8.5, that is the audit WORKING.
// Investigate: (i) test bug (fix the test), (ii) real PRD-compliance gap (apply the minimal TDD
// source fix + JSDoc, Mode A, record it), or (iii) PRD misunderstanding (correct the assertion +
// cite the PRD line). Only (ii) touches source. The EXPECTED non-§8.5 outcome is all-green.
```

### Integration Points

```yaml
FILES ADDED (this task — the only guaranteed writes):
  - packages/react/src/__tests__/prd-compliance.audit.test.tsx   # executable audit gate + §8.5 fix
  - packages/react/PRD_AUDIT.md                                   # human-readable audit report/checklist

FILE EDITED (the §8.5 TDD fix — ONLY if the full suite stays green):
  - packages/react/src/components/Form.tsx   # handleSubmit ~lines 468-471: all-fields gate →
                                             # subscriber-scoped gate (§8.5); +1-line JSDoc (Mode A)
  # Record the fix in PRD_AUDIT.md "Gaps found & fixed". [Fallback: revert, document the deviation.]

FILES NOT TOUCHED (verify with git diff --name-only):
  - All other react source files            # audited, not modified
  - packages/core/**                        # S1's scope (P3.M1.T1.S1)
  - packages/vue/**, packages/svelte/**     # out of scope
  - vitest.config.ts                        # do NOT add perFile:true (would fail on 0% type modules)
  - PRD.md, tasks.json, prd_snapshot.md     # orchestrator/human-owned — NEVER edit
  - plan/**, gap_analysis.md                # research/planning — NEVER edit
  - CHANGELOG.md, README.md                 # changeset-level docs sync is P3.M2 — out of scope

NO DATABASE / CONFIG / ROUTES — a test + report task (+ one ~6-line behavioral fix).
```

## Validation Loop

### Level 1: The audit gate itself (the primary success check)

```bash
# The new executable audit must pass, INCLUDING the §8.5 block:
pnpm --filter @formality-ui/react exec vitest run src/__tests__/prd-compliance.audit.test.tsx -t "subscriber-scoped"
# Expected: the §8.5 subscriber-scoped submit-blocking tests pass (after the handleSubmit fix).

pnpm --filter @formality-ui/react exec vitest run src/__tests__/prd-compliance.audit.test.tsx
# Expected: the ENTIRE audit gate (§4/§6/§9/§12/§13/§20 blocks) passes.
```

### Level 2: Full react suite (no regression)

```bash
pnpm --filter @formality-ui/react exec vitest run
# Expected: baseline 405 + new audit tests, 0 failures, 5 skipped (unchanged). ESPECIALLY confirm
# integration/complete-form.test.tsx:336, autosave-validation.test.tsx:{225,432}, and all
# useSubscriptions.test.tsx / Field.subscriptionStability.test.tsx tests stay green.
```

### Level 3: Coverage gate (PRD §1.3.7 ≥90%)

```bash
pnpm test:coverage
# Expected: exit 0. Aggregate (All files) ≥90% on statements/branches/functions/lines. Record the
# exact numbers for PRD_AUDIT.md. (Baseline: 97.32/94.82/99.13/97.32.) The usePropsEvaluation.ts
# branch (72%) does NOT fail the aggregate gate. Do NOT add perFile:true.
```

### Level 4: Build quality gates + audit-report accuracy

```bash
pnpm typecheck      # tsc --build        — zero errors (new test + the §8.5 fix typecheck)
pnpm lint           # eslint .           — zero errors
pnpm format:check   # prettier --check . — clean (re-run `pnpm format` if it flags the new files)
pnpm build          # pnpm -r build      — both packages emit cleanly

# Manual: open packages/react/PRD_AUDIT.md and spot-check 3 evidence pointers per the 4-check
# table: open the cited test file:line and confirm it asserts the claimed behavior. Especially
# confirm: (1) the §9 row cites the §8.5 fix (or the documented deviation); (2) every Appendix C
# item T1.1-T3.2 maps to a real overlays.ts line; (3) §20 cites useField.tsx:678 + overlays.ts:170.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `prd-compliance.audit.test.tsx` passes incl. the §8.5 subscriber-scoped block.
- [ ] Level 2: `pnpm --filter @formality-ui/react exec vitest run` → all pass (405 + N), 0 fail,
      5 skipped (unchanged).
- [ ] Level 3: `pnpm test:coverage` exits 0, aggregate ≥90%.
- [ ] Level 4: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all green.

### Feature Validation (audit completeness)

- [ ] `PRD_AUDIT.md` marks §4, §6, §9, §12, §13, §20 COMPLIANT.
- [ ] Every section row has all 4 checks (a/b/c/d) with a concrete evidence pointer.
- [ ] The §8.5 gap is recorded as found + fixed (handleSubmit subscriber-scoped) [or documented
      deviation under the fallback].
- [ ] Appendix C items T1.1–T3.2 confirmed present + exported (table with file:line).
- [ ] §20 forwardRef confirmed (useField.tsx:678 + overlays.ts:170 JSDoc + acceptance test).
- [ ] Coverage gate result recorded (aggregate numbers + exit 0).
- [ ] Accepted deviations documented (useConditions ConditionResult; Field §5.3.6 step 4; superset
      props; SelectDescriptor→SelectValue naming).

### Code Quality Validation

- [ ] `git diff --name-only` → the two new files + Form.tsx (§8.5 fix). [Fallback: two new files.]
      NO packages/core/ file changed (S1's scope).
- [ ] New test follows REAL-provider-wrapper + vitest-globals conventions (useField.test.tsx).
- [ ] New test is NOT skipped (skip count stays at 5).
- [ ] `PRD_AUDIT.md` evidence pointers are verified-accurate (not fabricated).
- [ ] Anti-patterns avoided (check against Anti-Patterns section).

### Documentation & Deployment

- [ ] `PRD_AUDIT.md` includes a "Reproduce" section with the exact commands.
- [ ] If the §8.5 fix was applied, its handleSubmit JSDoc is updated (Mode A) + noted in the report.
- [ ] No CHANGELOG/README edits (changeset-level docs sync is P3.M2 — out of scope).

---

## Anti-Patterns to Avoid

- ❌ Don't **edit source logic other than the §8.5 handleSubmit fix.** This is an audit. The §8.5
  fix is the ONE sanctioned behavioral change, and only if the full suite stays green. Everything
  else is a test + a report. Re-implementing the §8.3 churn fix, "fixing" the useConditions return
  shape, or adding perFile coverage would all be over-reach.
- ❌ Don't **weaken or skip a failing assertion** to get green (except the §8.5 fallback, which is a
  documented design decision, not a silent skip). A non-§8.5 failure is the audit working —
  investigate root cause (test bug / real gap / PRD misunderstanding).
- ❌ Don't **mock react-hook-form's useForm to `{}`.** useField/useConditions call
  `useWatch({ control })` unconditionally during render — a `{}` mock throws on every render. Wrap
  in a REAL `<FormalityProvider><Form>`; for spy assertions, overlay the real Form's FormContext
  value (nearest provider wins). See useField.test.tsx:198.
- ❌ Don't **break integration/complete-form.test.tsx:336** with the §8.5 fix. That test blocks via
  RHF's own failing-validator path, NOT the handleSubmit gate. If it regresses, your fix is wrong —
  revert and use the document-deviation fallback.
- ❌ Don't **add `perFile: true` to the coverage threshold.** It would fail CI on the 0% type-only
  modules (index.ts, types.ts, typeAssertions/). The aggregate gate is the PRD §1.3.7 contract.
- ❌ Don't **fabricate evidence** in `PRD_AUDIT.md`. Open every cited test file:line and confirm it
  asserts the claimed behavior. A wrong pointer is worse than none.
- ❌ Don't **duplicate the per-module tests** wholesale. The audit gate re-asserts HEADLINE behavior
  (one or two assertions per PRD claim); the deep coverage stays in Field.test.tsx,
  useSubscriptions.test.tsx, autosave-*.test.tsx. Cite those as primary evidence in the report.
- ❌ Don't **edit packages/core/, PRD.md, tasks.json, prd_snapshot.md, gap_analysis.md, plan/\*\*,
  CHANGELOG.md, or README.md.** S1 owns core; orchestrator/humans own the rest. Your writes are the
  two new react files (+ the Form.tsx §8.5 fix).
- ❌ Don't **skip the baseline check.** Run the full react suite + coverage BEFORE writing anything;
  if 405 isn't green or the coverage gate fails, you are auditing a broken baseline — stop and report.
- ❌ Don't **treat the useConditions ConditionResult return shape as a gap.** It is a richer superset
  (disabled/visible/hasDisabledCondition/...) consumed by useField — document it as an accepted
  deviation like core's G4/G5, do NOT change the return type.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **verification + one-small-TDD-fix** task on a baseline that is already green (405 react
  tests, 5 skipped; coverage gate passing at aggregate 97.32/94.82/99.13/97.32) and already P1/P2-
  complete (useField extracted, useFieldDisabledState removed, overlays.ts fixed, §20 forwardRef
  shipped, Appendix C T1.1–T3.2 all done/exported). The scout audits confirmed every in-scope module
  is COMPLIANT except one §8.5 deviation.
- The ONE real work item — the §8.5 subscriber-scoped `handleSubmit` fix — is small (~6 lines),
  well-specified by the PRD, and aligns with the existing "unrelated invalid field doesn't block"
  auto-save philosophy. Its risk is bounded (RHF's own validation + Gate 1/Gate 2 remain), and the
  fallback (document as stricter-but-safe deviation) is clearly specified so the task ships
  completely either way.
- Every PRD section in scope is mapped to its exact source file:line, its existing test evidence
  (file:line), and its audit-gate assertion in the 4 field guides, so the implementer does not
  re-research. The Appendix C table, §20 confirmation, and coverage result are pre-verified.
- The pattern is proven — it mirrors the sibling P3.M1.T1.S1 (core audit) PRP, which ships the same
  two-artifact shape (executable audit gate + report) in the adjacent package with no file overlap.
- The residual risks — an implementer over-reaching into source edits, breaking complete-form.test
  with the §8.5 fix, or adding perFile coverage — are forbidden in bold in the task list, Gotchas,
  and Anti-Patterns, and guarded by `git diff --name-only` and the named-test spot-checks.
