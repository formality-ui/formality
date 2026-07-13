name: "P3.M1.T1.S1 — Audit core package against PRD §3-§5, §8-§11, §14-§17"
description: |

---

## Goal

**Feature Goal**: Perform a **verifiable, regression-proof PRD-compliance audit** of the
`@formality-ui/core` package against PRD §3 (Type System), §5 (Expression Engine), §8
(Conditions), §9 (Subscription — core's expression-context contribution only), §10 (Validation),
§11 (Transform Pipeline), §14 (Initial Value Resolution), §15 (Field Ordering), §16 (Label
Resolution). The audit confirms every in-scope module is PRD-compliant across four dimensions —
(a) required exports exist & are exported, (b) signatures match or deviations are documented,
(c) §19 edge cases are handled, (d) tests cover the behavior — and **closes the one discovered
test-coverage gap (parser/formatter inverse contract, §11.10.7) via TDD**.

This is a **verification + hardening** task, NOT a feature build. Per `gap_analysis.md`, all
code-level gaps (G1–G5) were closed during P1 (ordering relocated, `validate`/`mergeConfigs`
added, signature deviations documented). This task produces the **evidence** (audit report +
executable compliance gate) and **fixes the one missing test** that the gap analysis did not
flag.

**Deliverable** (TWO artifacts, both in the core package):
1. `packages/core/src/__tests__/prd-compliance.audit.test.ts` — an **executable audit gate**
   that re-asserts the headline behavior of each in-scope module against the PRD, INCLUDING the
   parser/formatter inverse-contract test (the TDD gap fix). This is the "audit checklist" made
   executable and regression-proof.
2. `packages/core/PRD_AUDIT.md` — the **human-readable audit report/checklist**: a per-section
   4-check table (a/b/c/d) with file:line + test:line evidence, the compliance verdict, the
   accepted deviation notes (G4/G5), the G9 deferral, the scope boundaries (validation 4-layer
   composition = React, not core), and a record of the one gap found + fixed.

**Success Definition**:
- `packages/core/PRD_AUDIT.md` exists and marks **every in-scope PRD section COMPLIANT** with a
  concrete evidence pointer (source file:line + test name/path) for each of the 4 checks.
- `prd-compliance.audit.test.ts` exists, **passes**, and contains at minimum:
  - A §1.3.2 API-surface block asserting every required export is a function/type on the barrel.
  - A §5 expression block (qualified vs unqualified path, dual-context proxy unwrapping).
  - A §8 conditions block (OR-disabled / AND-visible / last-wins-set).
  - A §10 validation block (named/factory/array spec, `resolveErrorMessage` table).
  - A §11 transform block **including the parser/formatter inverse-contract test**
    (`parse(format(v)) === v` for matching precision; mismatch documented as consumer's job).
  - A §14 initial-value block (priority order + recordKey mapping).
  - A §15 ordering block (`sortFieldsByOrder`, `getUnusedFields`, `getOrderedUnusedFields`).
  - A §16 label block (6-source priority chain).
- **Full core suite still green** (baseline: 606 tests → 606 + N new audit tests, 0 failures).
  Framework-independence test still **exactly 14 tests, all passing**.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all green.
- No behavioral code change is required. If the inverse-contract test REVEALS an actual bug (it
  should not — see research), apply the minimal TDD fix and note it in `PRD_AUDIT.md`.

## User Persona (if applicable)

**Target User**: Formality maintainer / future Vue or Svelte adapter author who must trust that
`@formality-ui/core` matches the v1.0 PRD before depending on it.

**Use Case**: A maintainer opens the audit report to answer "is core v1.0 PRD-complete?" and a
CI run executes the audit gate to prevent silent regressions against the PRD contract.

**User Journey**: Read `PRD_AUDIT.md` verdict → drill into the cited test → `pnpm test` proves
the behavior holds → ship v1.0 core with confidence.

**Pain Points Addressed**: Today compliance is "known good" only via scattered tests and
`gap_analysis.md`. There is no single executable gate or checklist that maps each PRD section to
evidence, and the §11.10.7 inverse contract is untested (a latent v1.0 risk).

## Why

- **v1.0 release gate (P3.M1).** Before the v1.0.0 version bump (P3.M3.T1), core must carry
  auditable proof of PRD §1.3.2 compliance for all in-scope sections. This task IS that proof.
- **Closes the last undocumented test gap.** `gap_analysis.md` covered code/structural gaps
  (G1–G5) but did not flag the missing §11.10.7 parser/formatter inverse-contract test. The PRD
  explicitly mandates this test ("Test all parser/formatter pairs with real data to ensure no
  precision loss"). This task adds it.
- **Regression-proofing.** An executable `prd-compliance.audit.test.ts` prevents future refactors
  from silently breaking a PRD-cited behavior — far more durable than a prose checklist alone.

## What

Create two new files in the core package. No existing source logic changes unless the
inverse-contract test exposes a real defect (not expected — verified by reading
`transform/pipeline.ts`). The work is: write the executable audit gate (TDD-first for the inverse
contract), write the audit report, run the full gate, confirm green.

### Success Criteria

- [ ] `packages/core/PRD_AUDIT.md` exists with a per-section 4-check (a/b/c/d) table covering
      §3, §5, §8, §9(core part), §10, §11, §14, §15, §16 — every row COMPLIANT with evidence.
- [ ] `packages/core/src/__tests__/prd-compliance.audit.test.ts` exists and passes.
- [ ] The inverse-contract test asserts `parse(format(v))` round-trips for float2/float3/float4
      precision pairs AND documents the precision-mismatch (truncation) case per §11.10.7.
- [ ] Full core suite green: `pnpm --filter @formality-ui/core exec vitest run` → all pass,
      framework-independence still exactly 14 tests.
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm format:check` + `pnpm build` green.
- [ ] `git diff --stat` touches only the two new files (plus any minimal TDD fix if a real bug
      is uncovered — in which case the source file + its JSDoc are also updated, Mode A).

## All Needed Context

### Context Completeness Check

A developer who knows nothing about this codebase would need: the exact PRD §1.3.2 API table,
the verified baseline (606 tests / 14 independence tests), the exact location of every in-scope
module + its existing tests, the one confirmed gap (inverse contract), the accepted deviations
(G4/G5/G9), the scope boundaries (validation layers = React), and the exact validation commands.
All cited below with file:line. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/005_8f88e0ec4482/P3M1T1S1/research/audit-findings.md
  why: |
    THIS TASK'S FIELD GUIDE. §1 baseline (606 tests, 14 independence). §2 the COMPLETE §1.3.2
    API-vs-implementation compliance table (do not re-derive). §3 the test-coverage matrix for
    the 5 item-description verifications. §4 the ONE gap (inverse contract) + expected behavior.
    §5 scope boundaries. §6 §19 edge cases. §7 conventions. READ THIS FIRST.

- docfile: PRD.md §1.3.2 What Belongs in @formality-ui/core (line 166)
  why: |
    The canonical API-surface table + the evaluateConditions example code. This table IS check
    (a). Every "Key Exports" cell must map to a real export on the core barrel.

- docfile: PRD.md §11.7 Parser/Formatter Contract (h3.47, search "MUST be inverses")
  why: |
    THE GAP SOURCE. "Parsers and formatters MUST be inverses... Test all parser/formatter pairs
    with real data to ensure no precision loss." This mandates the inverse-contract test.

- docfile: plan/005_8f88e0ec4482/architecture/gap_analysis.md
  why: |
    G1-G9 registry. G4 (evaluateConditions obj-arg) + G5 (resolveInitialValue/resolveLabel
    supersets) are DOCUMENTED deviations (P1.M3.T1.S1 done). G9 (precision on InputConfig) is
    DEFERRED — named-formatter approach is equivalent. Cite these in PRD_AUDIT.md.

# SOURCE FILES under audit (read to confirm behavior; do NOT edit unless TDD finds a bug)
- file: packages/core/src/index.ts
  why: THE BARREL. Assert every §1.3.2 export is present here (check a). 200+ lines, all exports.
- file: packages/core/src/expression/context.ts
  why: §5.4.1 dual context mapping + createFieldStateProxy + buildEvaluationContext.
- file: packages/core/src/expression/evaluate.ts
  why: §5.2 evaluate + evaluateDescriptor + proxy unwrapping (unwrapFieldProxy).
- file: packages/core/src/conditions/evaluate.ts
  why: §8 evaluateConditions (OR/AND/last-wins) + G4 deviation JSDoc.
- file: packages/core/src/validation/validate.ts
  why: §10 validate (RULES layer only) + runValidator/composeValidators/required/minLength/...
- file: packages/core/src/validation/messages.ts
  why: §10.9.4 resolveErrorMessage + createErrorMessages/getErrorType.
- file: packages/core/src/transform/pipeline.ts
  why: §11 parse/format/extractValueField/transformFieldName + createFloat(Parser|Formatter).
- file: packages/core/src/config/merge.ts
  why: §6.1/§7 mergeConfigs (P1.M2) + mergeFieldProps (8-layer) + createConfigContext.
- file: packages/core/src/config/defaults.ts
  why: §14 resolveInitialValue (priority + recordKey) + G5 deviation JSDoc.
- file: packages/core/src/config/ordering.ts
  why: §15 sortFieldsByOrder/getUnusedFields/getOrderedUnusedFields (P1.M1 relocated).
- file: packages/core/src/labels/resolve.ts
  why: §16 resolveLabel (6-source priority) + G5 deviation JSDoc + ordering re-export.

# EXISTING TESTS (the evidence for check d; follow their patterns in the audit gate)
- file: packages/core/src/__tests__/framework-independence.test.ts
  why: 14-test gate that must stay green. Pattern: fs-based source scan + functional smoke tests.
- file: packages/core/src/__tests__/transform.test.ts
  why: PATTERN to follow — note the "Coverage backfill (PRD §5.3.5 / §10)" numbered-comment style
        (// T1:, // T2:). Import via `from "../index"`. Inverse-contract tests belong in the
        audit file, but mirror this file's describe/it nesting + vi.spyOn(console,"warn") style.
- file: packages/core/src/__tests__/conditions.test.ts
  why: OR/AND/last-wins already tested (L48/79/107) — cite as evidence; do not duplicate.
- file: packages/core/src/__tests__/config.test.ts
  why: mergeConfigs (L212) + resolveInitialValue priority/recordKey (L393) already tested — cite.
- file: packages/core/src/__tests__/expression.complex.test.ts
  why: Qualified/Unqualified access (L308/378) already tested — cite as evidence.
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/
├── index.ts                      # BARREL — every §1.3.2 export surfaces here
├── __tests__/
│   ├── framework-independence.test.ts   # 14 tests — MUST stay 14/green
│   ├── expression.test.ts               # §5 path resolution (qualified/unqualified) ✓
│   ├── expression.complex.test.ts       # §5 dual-context proxies ✓ (L308/378)
│   ├── conditions.test.ts               # §8 OR/AND/last-wins ✓ (L48/79/107)
│   ├── validation.test.ts               # §10 rules layer ✓ (55 tests)
│   ├── transform.test.ts                # §11 parse/format — but NO inverse contract ✗
│   ├── config.test.ts                   # §6.1/§7/§14 mergeConfigs + resolveInitialValue ✓
│   ├── labels.test.ts                   # §16 label resolution ✓
│   ├── state_types.test.ts              # §3 state types ✓
│   └── sample.test.ts
├── expression/{context,evaluate,infer,index}.ts
├── conditions/{evaluate,index}.ts
├── validation/{validate,messages,index}.ts
├── transform/{pipeline,index}.ts
├── config/{merge,defaults,ordering,index}.ts
├── labels/{resolve,index}.ts
└── types/{config,state,conditions,validation,index}.ts
```

### Desired Codebase tree with files to be added

```bash
packages/core/
├── PRD_AUDIT.md                                      # NEW — audit report/checklist (deliverable 1)
└── src/__tests__/
    └── prd-compliance.audit.test.ts                  # NEW — executable audit gate + inverse-contract fix (deliverable 2)
# No source file changes unless the inverse-contract test exposes a real bug (not expected).
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL — this is an AUDIT task. Default to ADDING tests + a report, NOT editing source
// logic. Only edit a source file if a new test FAILS and reveals a genuine defect (then apply
// the minimal TDD fix + update its JSDoc, Mode A, and record it in PRD_AUDIT.md).

// CRITICAL — the inverse-contract test is expected to PASS on the first run (the functions in
// transform/pipeline.ts already round-trip correctly). It is a VERIFICATION test, not a
// bug-fix. If it unexpectedly fails, investigate the real cause — do not weaken the test.

// CRITICAL — validation "4-layer composition" (§10.9.1: RHF rules → field → type → form) is
// NOT a core responsibility. Core implements ONLY the RULES-layer primitives (validate,
// runValidator, composeValidators). The layer wiring lives in the React adapter's Field
// Controller (validate.ts JSDoc states this explicitly). Mark §10 as COMPLIANT for core's
// scope; auditing the layer composition belongs to P3.M1.T1.S2 (react). Do NOT try to add
// layer-composition logic to core — it would violate framework-agnosticism (§1.3.2).

// CRITICAL — G9 (precision field on InputConfig) is DEFERRED, not a gap. The named-formatter
// approach (float2/float3/float4 in createDefaultFormatters) is the accepted equivalent. The
// inverse-contract test must use MATCHING-precision pairs and document mismatch (the PRD
// §11.10.7 "Invalid" example) as the consumer's responsibility.

// GOTCHA — test imports go through the barrel: `import { ... } from "../index"` (see
// transform.test.ts:10). Do NOT import deep paths in the audit test; the audit's check (a) is
// partly "are these reachable from the public barrel?".

// GOTCHA — framework-independence.test.ts scans ALL .ts under src/ (excluding __tests__) for
// React/Vue/Svelte/react-hook-form imports. Your new test file lives in __tests__/ so it is
// exempt — but NEVER add a framework import to any audited source file. The 14-test count must
// not change.

// GOTCHA — vitest is the runner. For warn-gated branches use vi.spyOn(console, "warn").
// Reset spies with .mockRestore(). See transform.test.ts T1 (L48).

// CRITICAL — do NOT edit PRD.md, tasks.json, prd_snapshot.md, gap_analysis.md, or any plan/**
// file. Your only writes are the two new files (+ a minimal source/JSDoc fix IF a real bug is
// found). The audit report is a NEW file, not an edit to an existing doc.

// PARALLEL WORK — P2.M2.T1.S1 edits packages/react/src/overlays.ts (JSDoc prose). It does NOT
// touch core. No conflict.
```

## Implementation Blueprint

### Data models and structure

None. This task adds a test file and a markdown report. No types/models/runtime code.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — load the field guide + confirm the baseline
  - READ: plan/005_8f88e0ec4482/P3M1T1S1/research/audit-findings.md  (ALL sections)
  - READ: PRD.md §1.3.2 (line 166) + §11.7 ("MUST be inverses")
  - CONFIRM the baseline is green BEFORE writing anything:
      pnpm --filter @formality-ui/core exec vitest run
      # Expected: 606 passed (10 files). If NOT green, STOP — fix the pre-existing failure first
      # (it is out of scope to introduce regressions; report it). Confirm framework-independence
      # reports exactly "14 tests".
  - CONFIRM the inverse-contract gap is real (sanity check the research):
      grep -rn "inverse\|round.trip\|parse(format\|format(parse" packages/core/src/__tests__/
      # Expected: NO matches (confirms the gap). If matches now exist, re-scope Task 5.

Task 2: CREATE packages/core/src/__tests__/prd-compliance.audit.test.ts — §1.3.2 + §5 + §8 blocks
  - FILE: packages/core/src/__tests__/prd-compliance.audit.test.ts  (NEW)
  - IMPORT: `import { describe, it, expect } from "vitest";` and the barrel
            `import * as Core from "../index";` PLUS named imports as needed.
  - FOLLOW pattern: packages/core/src/__tests__/transform.test.ts (barrel import, describe/it
            nesting, vitest assertions).
  - BLOCK A — §1.3.2 API SURFACE (check a): one describe("PRD §1.3.2 API surface", ...) with an
            it() per required export asserting `expect(typeof Core.<fn>).toBe("function")`:
            evaluate, evaluateDescriptor, inferFieldsFromDescriptor, buildEvaluationContext,
            buildFormContext, buildFieldContext, createFieldStateProxy, evaluateConditions,
            conditionMatches, mergeConditionResults, inferFieldsFromConditions, validate,
            runValidator, runValidatorSync, isValid, composeValidators, resolveErrorMessage,
            parse, format, extractValueField, transformFieldName, mergeConfigs, resolveInputConfig,
            resolveInitialValue, resolveAllInitialValues, sortFieldsByOrder, getUnusedFields,
            getOrderedUnusedFields, resolveLabel, humanizeLabel, resolveFormTitle.
            (These are the §1.3.2 "Key Exports" + their documented companions — see index.ts.)
  - BLOCK B — §5 EXPRESSION (check d re-assert): describe("PRD §5 Expression Engine"):
            - it("resolves unqualified path to field value"): buildEvaluationContext({client:{id:5}})
              → evaluate("client") proxies to value; evaluate("client.id") === 5.
            - it("keeps qualified paths literal"): evaluate("record.name") over a record.
            - it("proxy exposes metadata"): evaluate("signed.isTouched") with fieldStates.
  - BLOCK C — §8 CONDITIONS: describe("PRD §8 Conditions"):
            - it("OR for disabled"): two disabled-true conditions, one matches → disabled true.
            - it("AND for visible"): visible true + visible false → visible false.
            - it("last matching set wins"): two setValue conditions both match → second wins.

Task 3: ADD §10 + §14 + §15 + §16 blocks to the audit test
  - BLOCK D — §10 VALIDATION: describe("PRD §10 Validation"):
            - it("named validator resolves via registry"): validate("", "required", {required})
              → invalid.
            - it("factory referenced by name materializes"): validate("", "minLength", factory).
            - it("array short-circuits on first failure").
            - it("resolveErrorMessage table"): false→"Invalid value"; string→string;
              {type:"required"}→lookup; true/undefined→undefined.
  - BLOCK E — §14 INITIAL VALUE: describe("PRD §14 Initial Value Resolution"):
            - it("priority: defaultValues > record[recordKey] > inputConfig.defaultValue"):
              resolveInitialValue with all three → defaultValues wins; drop it → record wins;
              drop both → inputConfig.defaultValue.
            - it("recordKey maps record key to field name"):
              resolveInitialValue("client", {recordKey:"clientId"}, ..., {clientId:5}) === 5.
  - BLOCK F — §15 ORDERING: describe("PRD §15 Field Ordering"):
            - it("sortFieldsByOrder orders by order prop; undefined last (Infinity)").
            - it("getUnusedFields excludes declared set").
            - it("getOrderedUnusedFields composes both").
  - BLOCK G — §16 LABEL: describe("PRD §16 Label Resolution"):
            - it("6-source priority: componentProps.label > fieldConfig.props.label >
              evaluatedSelectProps.label > fieldConfig.label > fieldConfig.title > humanize").
            - it("humanizeLabel camelCase → words").

Task 4: ADD §11 TRANSFORM block + THE INVERSE-CONTRACT TEST (the TDD gap fix)
  - BLOCK H — §11 TRANSFORM: describe("PRD §11 Transform Pipeline"):
            - it("parse applies named/inline parser; format applies named/inline formatter").
            - it("extractValueField extracts id for submit (§11.10.3)").
            - it("transformFieldName renames for submit").
  - THE GAP FIX — describe("PRD §11.7 Parser/Formatter Inverse Contract"):
            // TDD: write these BEFORE reasoning about whether they pass. Run them. They should
            // PASS (functions already correct). If one FAILS, that is a real defect — apply the
            // minimal fix to transform/pipeline.ts + its JSDoc (Mode A), record in PRD_AUDIT.md.
            - it("float parser/formatter round-trip at precision 2"):
                const p = createFloatParser(); const f = createFloatFormatter(2);
                const v = 42.69;
                expect(parse(format(v, f), p)).toBe(v);            // parse(format(v)) === v
                expect(format(parse("42.69", p), f)).toBe("42.69"); // format(parse(s)) === s
            - it("float3 and float4 precision pairs round-trip"):
                for (const prec of [3, 4]) { const f = createFloatFormatter(prec);
                  const v = Number(`42.6${"9".repeat(prec-1)}`); // e.g. 42.699, 42.6999
                  expect(parse(format(v, f), createFloatParser())).toBeCloseTo(v, prec); }
            - it("default parsers/formatters round-trip (createDefaultParsers/Formatters)"):
                const ps = createDefaultParsers(); const fs = createDefaultFormatters();
                expect(parse(format(42.5, fs.float), ps.float)).toBe(42.5);
            - it("documents precision-mismatch truncation is consumer's job (§11.10.7 Invalid)"):
                // MISMATCHED precision is NOT a contract violation — it is the documented
                // truncation case. Assert it truncates (proving the behavior is understood):
                const f2 = createFloatFormatter(2);
                expect(format(42.691, f2)).toBe("42.69"); // truncated, by design
                // A consumer wanting 3-place fidelity must use float3 — see G9 deferral.
  - RUN: pnpm --filter @formality-ui/core exec vitest run src/__tests__/prd-compliance.audit.test.ts
            # Expected: ALL green. If the inverse-contract tests FAIL, fix transform/pipeline.ts
            # minimally (TDD), update its JSDoc, and record the fix in PRD_AUDIT.md §"Gaps found".

Task 5: WRITE packages/core/PRD_AUDIT.md — the audit report/checklist
  - FILE: packages/core/PRD_AUDIT.md (NEW)
  - STRUCTURE:
      # Core Package PRD Compliance Audit (v1.0)
      ## Summary  → one-line verdict: "COMPLIANT. 1 test-coverage gap (§11.7 inverse contract)
                   found and fixed. Baseline 606 tests → <new count>, 0 failures."
      ## Scope   → list §3, §5, §8, §9(core), §10, §11, §14, §15, §16; note out-of-scope
                   (§4/§6/§12/§13/§20 = React, audited in P3.M1.T1.S2).
      ## Method  → the 4 checks per section: (a) exports exist, (b) signatures/deviations,
                   (c) §19 edge cases, (d) test coverage. Cite research/audit-findings.md.
      ## Per-section table (THE DELIVERABLE) — one row per section with columns:
         | Section | (a) Exports | (b) Signatures | (c) §19 edges | (d) Tests | Verdict |
         Fill each cell with a concrete pointer, e.g. "(a) index.ts exports evaluate ✓",
         "(d) expression.test.ts:200, expression.complex.test.ts:308 ✓",
         "(b) G4 deviation documented in conditions/evaluate.ts JSDoc ✓".
      ## Accepted deviations → G4 (evaluateConditions obj-arg), G5 (resolveInitialValue/resolveLabel
                   supersets), G9 (precision field deferred) — each with the JSDoc file:line.
      ## Gaps found & fixed → §11.7 inverse contract: was untested; added test block in
                   prd-compliance.audit.test.ts; behavior confirmed correct (no source change
                   needed) [OR: minimal fix applied to transform/pipeline.ts + JSDoc if a bug].
      ## Scope boundaries → validation 4-layer composition (§10.9.1) is React (Field Controller),
                   not core; core provides RULES-layer primitives only.
      ## Reproduce → the exact commands (pnpm --filter @formality-ui/core exec vitest run, etc.).
  - ACCURACY: every pointer in the table must be a REAL file:line or test name you confirmed.
              Do not fabricate evidence — open each cited test and confirm it asserts the claim.

Task 6: RUN THE FULL GATE — confirm green + scope
  - 6a. pnpm --filter @formality-ui/core exec vitest run
        # Expected: 606 + N new audit tests pass, 0 failures. framework-independence = 14 tests.
  - 6b. pnpm typecheck     # tsc --build — zero errors (new test file typechecks).
  - 6c. pnpm lint          # eslint . — zero errors.
  - 6d. pnpm format:check  # prettier --check . — clean. If the new files fail, run `pnpm format`
        # and re-check (prettier may reflow markdown tables / test formatting).
  - 6e. pnpm build         # pnpm -r build — both packages emit cleanly (defensive).
  - 6f. git diff --stat
        # Expected: exactly the two NEW files (PRD_AUDIT.md + prd-compliance.audit.test.ts).
        # If a third file appears (a source fix), confirm it is the documented TDD fix only.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — the audit test is a SECOND line of defense. It re-asserts headline behavior that is
// ALSO covered by the per-module test files. That redundancy is intentional: it makes the PRD
// contract executable in ONE place and survives module-test refactors. Do not delete the
// per-module tests; cite them in PRD_AUDIT.md as the primary evidence.

// PATTERN — barrel import for check (a): `import * as Core from "../index"`. Asserting
// `typeof Core.evaluate === "function"` proves the export is reachable from the PUBLIC surface,
// which is exactly what §1.3.2 requires. (See transform.test.ts:10 for the `from "../index"`
// convention.)

// PATTERN — inverse-contract test shape (the gap fix). Use MATCHING precision pairs and assert
// BOTH directions (parse∘format and format∘parse):
//   const p = createFloatParser();           // fallback 0
//   const f = createFloatFormatter(2);       // precision 2
//   expect(parse(format(42.69, f), p)).toBe(42.69);
//   expect(format(parse("42.69", p), f)).toBe("42.69");
// For precision 3/4 use toBeCloseTo(v, prec) to tolerate float representation. Assert the
// MISMATCHED-precision truncation explicitly so the §11.10.7 "Invalid" example is documented,
// not just the "Valid" one.

// PATTERN — vitest warn-spy for branches that console.warn (e.g. missing named parser). Mirror
// transform.test.ts: vi.spyOn(console, "warn").mockImplementation(()=>{}); ...; spy.mockRestore().

// CRITICAL — if ANY audit assertion fails, that is the audit WORKING. Do not delete the failing
// assertion to make the suite green. Investigate: is it (i) a test bug (fix the test), (ii) a
// real PRD-compliance gap (apply the minimal TDD source fix + JSDoc, Mode A, record it), or
// (iii) a misunderstanding of the PRD (correct the assertion + cite the PRD line)? Only (ii)
// touches source. The EXPECTED outcome is all-green with NO source change.
```

### Integration Points

```yaml
FILES ADDED (this task — the only allowed writes):
  - packages/core/src/__tests__/prd-compliance.audit.test.ts   # executable audit gate + inverse-contract fix
  - packages/core/PRD_AUDIT.md                                  # human-readable audit report/checklist

FILES THAT MAY BE EDITED ONLY IF A REAL BUG IS FOUND BY THE INVERSE-CONTRACT TEST (not expected):
  - packages/core/src/transform/pipeline.ts   # minimal TDD fix + JSDoc (Mode A)
  # Record any such fix in PRD_AUDIT.md "Gaps found & fixed".

FILES NOT TOUCHED (verify with git diff --name-only):
  - All other core source files            # audited, not modified
  - packages/react/**, packages/vue/**, packages/svelte/**  # out of scope (P3.M1.T1.S2 = react)
  - PRD.md, tasks.json, prd_snapshot.md    # orchestrator/human-owned — NEVER edit
  - plan/**, gap_analysis.md               # research/planning — NEVER edit
  - CHANGELOG.md, README.md                # changeset-level docs sync is P3.M2 — out of scope

NO DATABASE / CONFIG / ROUTES — a test + report task.
```

## Validation Loop

### Level 1: The audit gate itself (the primary success check)

```bash
# The new executable audit must pass, including the inverse-contract block:
pnpm --filter @formality-ui/core exec vitest run src/__tests__/prd-compliance.audit.test.ts -t "Inverse Contract"
# Expected: the §11.7 inverse-contract tests pass (proving parse/format round-trip).

pnpm --filter @formality-ui/core exec vitest run src/__tests__/prd-compliance.audit.test.ts
# Expected: the ENTIRE audit gate (§1.3.2 surface + §5/§8/§10/§11/§14/§15/§16 blocks) passes.
```

### Level 2: Full core suite (no regression)

```bash
pnpm --filter @formality-ui/core exec vitest run
# Expected: baseline 606 + new audit tests, 0 failures. Confirm the framework-independence file
# still reports exactly "14 tests" (it scans src/ — your test is in __tests__/ so exempt).
```

### Level 3: Build quality gates

```bash
pnpm typecheck      # tsc --build        — zero errors (new test typechecks against the barrel)
pnpm lint           # eslint .           — zero errors
pnpm format:check   # prettier --check . — clean (re-run `pnpm format` if it flags the new files)
pnpm build          # pnpm -r build      — both packages emit cleanly
# Expected: all green. If typecheck/lint fail on the new test, fix the test (imports, types).
```

### Level 4: Audit-report accuracy (manual)

```bash
# Manually open packages/core/PRD_AUDIT.md and spot-check 3 evidence pointers per the 4-check
# table: open the cited test file:line and confirm it actually asserts the claimed behavior.
# Especially confirm: (1) the §11.7 row says the gap was fixed + points to the audit test block;
# (2) every §1.3.2 "Key Exports" cell maps to a real export; (3) the deviation notes cite the
# real JSDoc locations (conditions/evaluate.ts, config/defaults.ts, labels/resolve.ts).
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `prd-compliance.audit.test.ts` passes incl. the §11.7 inverse-contract block.
- [ ] Level 2: `pnpm --filter @formality-ui/core exec vitest run` → all pass (606 + N), 0 fail.
- [ ] Level 2: framework-independence still reports **exactly 14 tests**.
- [ ] Level 3: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all green.

### Feature Validation (audit completeness)

- [ ] `PRD_AUDIT.md` marks §3, §5, §8, §9(core), §10, §11, §14, §15, §16 COMPLIANT.
- [ ] Every section row has all 4 checks (a/b/c/d) with a concrete evidence pointer.
- [ ] The §11.7 inverse-contract gap is recorded as found + fixed (test added; behavior correct).
- [ ] Accepted deviations (G4/G5) and the G9 deferral are documented with JSDoc file:line.
- [ ] The validation 4-layer scope boundary (React, not core) is documented.
- [ ] The audit gate asserts every §1.3.2 "Key Exports" is reachable from the barrel (check a).

### Code Quality Validation

- [ ] `git diff --name-only` → exactly the two new files (+ a documented source fix ONLY if a
      real bug was found by the inverse-contract test).
- [ ] New test follows barrel-import + describe/it conventions (transform.test.ts pattern).
- [ ] New test does NOT import any framework (React/Vue/Svelte/react-hook-form).
- [ ] `PRD_AUDIT.md` evidence pointers are verified-accurate (not fabricated).
- [ ] Anti-patterns avoided (check against Anti-Patterns section).

### Documentation & Deployment

- [ ] `PRD_AUDIT.md` includes a "Reproduce" section with the exact commands.
- [ ] If a source fix was applied, its JSDoc is updated (Mode A) and noted in the report.
- [ ] No CHANGELOG/README edits (changeset-level docs sync is P3.M2 — out of scope).

---

## Anti-Patterns to Avoid

- ❌ Don't **edit source logic to "make the audit pass."** The audit is a verification task. The
  inverse-contract test should pass on the first run. Only apply a source fix if a test reveals a
  GENUINE defect — and even then, keep it minimal + update JSDoc (Mode A) + record it.
- ❌ Don't **weaken or delete a failing assertion** to get green. A failure is the audit working.
  Investigate root cause (test bug / real gap / PRD misunderstanding) — only a real gap touches source.
- ❌ Don't **add validation layer-composition logic to core.** §10.9.1's 4-layer wiring (RHF rules →
  field → type → form) is the React Field Controller's job (validate.ts JSDoc says so). Core ships
  the RULES-layer primitives only. Adding layer logic would violate §1.3.2 framework-agnosticism.
- ❌ Don't **fabricate evidence** in `PRD_AUDIT.md`. Open every cited test file:line and confirm it
  asserts the claimed behavior. A wrong pointer is worse than none.
- ❌ Don't **duplicate the per-module tests** wholesale. The audit gate re-asserts HEADLINE
  behavior (one or two assertions per PRD claim); the deep coverage stays in conditions.test.ts,
  expression.complex.test.ts, etc. Cite those as primary evidence in the report.
- ❌ Don't **import deep paths** in the audit test. Use `from "../index"` — check (a) is partly
  "is this reachable from the public barrel?".
- ❌ Don't **edit PRD.md, tasks.json, prd_snapshot.md, gap_analysis.md, plan/\*\*, CHANGELOG.md,
  or README.md.** Those are orchestrator/human/changeset-owned. Your only writes are the two new
  files (+ a documented source fix IF a real bug is found).
- ❌ Don't **skip the baseline check.** Run the full core suite BEFORE writing anything; if 606
  isn't green, you are auditing a broken baseline — stop and report (do not paper over it).
- ❌ Don't **treat G9 (precision field) as a gap.** It is DEFERRED by design (named formatters are
  the equivalent). The inverse-contract test uses matching precision; document mismatch as the
  consumer's responsibility per §11.10.7.
- ❌ Don't **change the framework-independence test count.** It must stay 14. Your new test lives
  in `__tests__/` (exempt from the source scan) and must not import any framework.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **verification + test-addition** task on a baseline that is already green (606 tests,
  14 independence tests) and already P1-complete (all G1–G5 gaps closed, deviations documented).
  The risk surface is tiny: one new test file + one markdown report.
- The ONE real work item — the §11.7 inverse-contract test — targets functions already verified
  correct by reading `transform/pipeline.ts` (`createFloatParser`/`createFloatFormatter` round-trip
  for matching precision). The test is expected to PASS, closing the coverage gap without a source
  change. If it unexpectedly fails, the TDD path is clearly specified.
- Every PRD section in scope is mapped to its exact source file, its existing test evidence
  (file:line), and its audit-gate assertion, so the implementer does not re-research. The §1.3.2
  compliance table is provided verbatim in the field guide.
- The only residual risk — an implementer over-reaching into source edits or adding validation
  layer logic to core — is forbidden in bold in the task list, Gotchas, and Anti-Patterns, and
  guarded by `git diff --name-only` (expect exactly two new files unless a documented TDD fix).
```
