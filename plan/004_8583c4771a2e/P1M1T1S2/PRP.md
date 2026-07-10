name: "P1.M1.T1.S2 — Audit test coverage of all spec scenarios + confirm coverage gate ≥90%"
description: |

---

## Goal

**Feature Goal**: Verify — by walking the `describe`/`it` names of the four
auto-save test files and running the coverage gate — that every auto-save
spec scenario in PRD §11.1–§11.3 has a corresponding passing test, and that
the full-suite coverage remains green at ≥90% across all four metrics
(statements, branches, functions, lines). Produce a confirmation record
mapping each spec scenario → its test name/file, plus the live coverage
numbers.

**Deliverable**: A **read-only audit record** (the confirmation table:
spec scenario → test name → file → status; plus the four coverage metrics).
NO test additions, NO config changes, NO source edits — unless the audit
surfaces an actual gap or regression, in which case scope the minimal fix.

**Success Definition**:
1. Each spec'd scenario (scoped validation gates, per-field debounce +
   coalescing, execution-version / stale-save abort, immediate submission,
   form-level fallback) is mapped to a named `it(...)` test in one of the
   four files, confirmed by reading the current `describe`/`it` names.
2. `pnpm test:coverage` (or `npx vitest run --coverage`) run from the repo
   root is GREEN, and all four metrics (statements, branches, functions,
   lines) are recorded and confirmed ≥90% with no regression vs the
   architecture-audit baseline (97.25% / 95.7% / 98.16% / 97.25%).
3. All 43 tests across the four files pass (21 + 10 + 4 + 8).
4. The coverage config (`vitest.config.ts`) is confirmed to enforce the
   §1.3.7 90% threshold (statements/branches/functions/lines all = 90) and
   to exclude only the §1.3.7 paths (+ the documented `scripts/**`
   deviation) — i.e., the gate is real and correctly scoped.
5. No files modified UNLESS a genuine gap/regression is found.

> **RESEARCH FINDING (pre-verified): The architecture audit
> (`plan/004_8583c4771a2e/architecture/autosave-test-audit.md`) confirms all
> 43 tests pass and every spec scenario is covered, with coverage at
> 97.25% / 95.7% / 98.16% / 97.25%. This was RE-VERIFIED against live source
> during PRP research: the four files exist, the per-file `it` counts are
> exactly 21/10/4/8 (= 43), and the `describe`/`it` names match the audit's
> mapping verbatim. The vitest config enforces 90% on all four metrics. The
> overwhelmingly likely outcome is "no drift, all green." The implementing
> agent's job is to independently re-confirm (run the commands, re-read the
> names) and write the record.**

## User Persona

**Target User**: The Formality maintainer / QA reviewer. This is an internal
verification artifact, not an end-user feature.

**Use Case**: Before the doc sweep (P1.M1.T2.S1) edits docs to describe the
auto-save behavior, confirm the test suite actually locks in every spec'd
scenario AND the repo still clears the 90% gate — so docs describe
test-backed reality.

**Pain Points Addressed**: Prevents the doc sweep from documenting behavior
that has no test (and would therefore silently regress). The scoped-validity
behavior is subtle; the "Unrelated Invalid Field (Issue 2)" test is the key
regression guard and must be confirmed present and green.

## Why

- **Business value**: Establishes a trusted test baseline for the auto-save
  subsystem. The 90% coverage gate (PRD §1.3.7) is a hard CI gate — if it
  regresses, CI fails. This audit confirms both the *scenario coverage*
  (right tests exist) and the *metric coverage* (gate is green).
- **Integration**: This subtask is the **test-side gate** for P1.M1:
  - **P1.M1.T1.S1** (runtime audit) confirms the Form.tsx implementation
    matches the spec. This subtask (S2) confirms the *tests* lock in that
    behavior and the *gate* is green. Together they form the "runtime +
    tests both verified" baseline.
  - **P1.M1.T2.S1** (doc sweep) runs AFTER this audit confirms green, so it
    edits docs to match test-backed, coverage-passing reality.
- **Scope boundary**: READ-ONLY by default. Touch tests / config / source
  ONLY if a genuine gap or regression is found, and then only the minimal
  fix. Do NOT touch Form.tsx (S1's territory), examples/READMEs
  (P1.M1.T2.S1), or core.

## What

### Part A — Scenario coverage walk (PRD §11.1–§11.3)

Walk each spec'd scenario to its named test. The expected mapping
(re-verified during PRP research; `describe`/`it` names match the live files
verbatim):

**Scoped validation** (`autosave-validation.test.tsx`, 21 tests):
- "Dependent Field Validation" (describe @163) → `it("should validate dependent fields but NOT independent fields")` @163
- "Async Validation Waiting" (describe @217) → `it("should wait for async validators to complete before submitting")` @218
- "Unrelated Invalid Field (Issue 2)" (describe @418) → `it("should auto-save a valid field even when an unrelated field is invalid")` @425 — **THE key regression test for the scoped gate** (PRD §11.1 point 4); also its complement @502 "should still NOT auto-save when the CHANGED field itself is invalid"
- "Validation Errors" (describe @381) → `it("should NOT submit if validation fails")` @382
- "Immediate Submission (debounce: false)" (describe @542) → `it("should call submitHandler immediately when inputConfig.debounce is false")` @543

**Per-field debounce + coalescing** (`autosave-field-debounce.test.tsx`, 10 tests):
- "Per-field numeric debounce is honored" (describe @72) → `it("should NOT submit before the field's numeric debounce elapses...")` @73 (+3 siblings)
- "Coalescing semantics" (describe @266) → shared-interval coalesce @267, **faster timer submits batch / slower no-ops** @319, lone slow field @381
- "Mixed debounce: false + numeric" (describe @433) → immediate while numeric pending @434, coalesce pending into immediate @499
- "Form-level fallback preserved" (describe @554) → `it("should fall back to the Form-level debounce when the field debounce is unset")` @555

**Execution-version / stale-save abort** (`autosave-async-timing.test.tsx` 4 tests + `autosave-rapid-changes.test.tsx` 8 tests):
- "Version Checkpoint During Validation" (describe @311, async-timing) → `it("should abort at version checkpoint inside waitForFieldValidation")` @312
- "All Three Version Checkpoints" (describe @392, async-timing) → `it("should check version at all three checkpoints in executeAutoSave")` @393
- "abort intermediate auto-save operations" (it @137, rapid-changes) + "Version Check Verification" (describe @395, rapid-changes) → `it("should verify version checkpoint aborts stale saves")` @396

### Part B — Coverage gate run (PRD §1.3.7)

Run `pnpm test:coverage` from the repo root. Confirm:
- All 36 test files pass (43 of them in the 4 autosave files).
- All four metrics ≥90% (baseline: 97.25% stmt / 95.7% branch / 98.16% func / 97.25% line).
- The `vitest.config.ts` thresholds block enforces `statements/branches/functions/lines: 90` (a real CI-failing gate, not advisory).

### Success Criteria

- [ ] Every spec scenario in §11.1–§11.3 mapped to a named test (record the `it` name + file + line).
- [ ] The "Unrelated Invalid Field (Issue 2)" test confirmed present + green (the scoped-gate regression guard).
- [ ] `pnpm test:coverage` green; all four metrics recorded and ≥90%.
- [ ] All 43 autosave tests pass (21 + 10 + 4 + 8).
- [ ] `vitest.config.ts` thresholds confirmed = 90 on all four metrics (gate is real).
- [ ] No files modified unless a genuine gap/regression is found.

## All Needed Context

### Context Completeness Check

_Pass._ This is a read-only audit. The spec (PRD §11.1–§11.3, §1.3.7), the
architecture audit (with the verified scenario→test mapping + coverage
numbers), the four test files, and the vitest config fully define the work.
No prior codebase knowledge is needed beyond "read the test names, run the
coverage command, record the results."

### Documentation & References

```yaml
# MUST READ
- url: PRD §11.1 (heading:h3.48) — "Behavior", point 4 (scoped validity gate)
  why: Defines the behaviors that MUST have tests — esp. "an unrelated invalid field does NOT block a valid edit".
  critical: The "Unrelated Invalid Field (Issue 2)" test is THE regression guard for this; confirm it exists + passes.

- url: PRD §11.2 (heading:h3.49) — "Implementation" (executeAutoSave + changeField)
  why: The reference pseudocode — defines the execution-version abort and the 3-way debounce branch that the async-timing + rapid-changes + field-debounce tests lock in.
  critical: "The full implementation also tracks an execution version to abort stale saves when new changes arrive mid-validation." → covered by the "Version Checkpoint" tests.

- url: PRD §11.3 (heading:h3.50) — "Debounce Behavior", Example 4 (coalescing-by-interval)
  why: Defines coalescing: shared-ms → shared timer; faster timer submits whole batch; slower timer no-ops when nothing pending.
  critical: The "Coalescing semantics" describe (field-debounce @266) covers all three sub-behaviors.

- url: PRD §1.3.7 (heading:h4.6) — "Testing Strategy" (the ≥90% coverage gate)
  why: Defines the gate: statements/branches/functions/lines all ≥90%, enforced by vitest thresholds + CI; excludes examples/svelte/vue.
  critical: "the build fails if any metric drops below 90%." Confirm the thresholds block in vitest.config.ts enforces this.

- docfile: plan/004_8583c4771a2e/architecture/autosave-test-audit.md
  why: The prior test audit — the verified scenario→test mapping + the coverage numbers (97.25/95.7/98.16/97.25). Re-confirm at execution time.
  section: "Spec Coverage Mapping", "Coverage Gate"
  critical: "43/43 tests green… Coverage: 97.25% statements | 95.7% branches | 98.16% functions | 97.25% lines." The implementing agent must independently re-run + re-read, not blindly trust.

# PARALLEL-EXECUTION CONTEXT (S1 is being implemented concurrently)
- file: plan/004_8583c4771a2e/P1M1T1S1/PRP.md
  section: "Goal + What (Behaviors 1-4) + Anti-Patterns"
  why: S1 audits the RUNTIME (Form.tsx) against §11.1–§11.3. This subtask (S2) audits the TESTS + coverage gate. They are complementary: S1 = "does the code match the spec"; S2 = "do the tests lock it in + is the gate green". Do NOT duplicate S1's runtime walk; focus on the test names + coverage run.
  critical: "S1 is READ-ONLY by default; touches Form.tsx only if a gap is found. S2 likewise touches tests/config only if a gap is found." No file overlap unless both find gaps in different files.

- file: packages/react/src/__tests__/autosave-validation.test.tsx
  section: "describe('AutoSave Validation Coordination') @87; 21 it() blocks"
  why: Scoped-validation tests. Confirm the 5 spec items (Dependent, Async, Unrelated-Invalid Issue 2, Validation Errors, Immediate debounce:false).
  pattern: "describe('<Scenario>') → it('<behavior assertion>'); uses render+fireEvent+waitForTimers mount pattern."
  gotcha: "The 'Unrelated Invalid Field (Issue 2)' describe @418 has TWO its (@425 valid-saves, @502 changed-invalid-blocks) — both are the scoped-gate proof; record both."

- file: packages/react/src/__tests__/autosave-field-debounce.test.tsx
  section: "describe('AutoSave Per-Field Numeric Debounce (Issue 1)') @59; 10 it() blocks"
  why: Per-field debounce + coalescing tests. Confirm the 4 spec items (numeric honored, coalescing semantics incl. faster-submits-batch/slower-no-ops, mixed false+numeric, form-level fallback).
  pattern: "Uses fake timers (vi.useFakeTimers) + advanceTimersByTime to assert debounce intervals."
  gotcha: "'Coalescing semantics' @266 has 3 its — the @319 one ('faster submits batch; slower no-ops') is the exact Example-4 proof."

- file: packages/react/src/__tests__/autosave-async-timing.test.tsx
  section: "describe('AutoSave Race Condition - Async Timing Edge Cases') @61; 4 it() blocks"
  why: Execution-version abort tests — 'Version Checkpoint During Validation' @311 + 'All Three Version Checkpoints' @392.
  pattern: "Mocks async validators with controlled promise resolution to force mid-validation version changes."
  gotcha: "The 'All Three Version Checkpoints' @392 proves the version re-check happens after EVERY await in executeAutoSave (cross-ref S1 Behavior 2)."

- file: packages/react/src/__tests__/autosave-rapid-changes.test.tsx
  section: "describe('AutoSave Race Condition - Rapid Changes') @58; 8 it() blocks"
  why: Stale-save abort tests — 'abort intermediate auto-save operations' @137 + 'Version Check Verification' @395/@396.
  pattern: "Drives 10+ rapid changes and asserts only the final value submits."
  gotcha: "Also has negative tests (@536 'should not submit if validation fails during rapid changes') that overlap the scoped-gate coverage."

- file: vitest.config.ts   # repo root
  section: "test.coverage.thresholds + test.coverage.exclude"
  why: CONFIRM the gate is real: thresholds {statements:90, branches:90, functions:90, lines:90}. CONFIRM the exclude list matches §1.3.7 (+ documented scripts/** deviation).
  pattern: "thresholds block makes CI fail (exit 1) if any metric < 90."
  gotcha: "The exclude list has a DOCUMENTED deviation: 'scripts/**' is excluded (release automation, not shipped source). This is intentional and commented in the file — NOT a gap. §1.3.7's literal list is examples/svelte/vue/dist; scripts/** is an additive, justified exclusion."

- file: vitest.workspace.ts   # repo root
  section: "defineWorkspace([core, react])"
  why: Confirms coverage is collected across BOTH packages (the 90% gate is repo-wide per §1.3.7).
  gotcha: "Coverage resolves against the workspace root, which is why the exclude list lives in the ROOT vitest.config.ts (not the per-package configs)."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/__tests__/
  autosave-validation.test.tsx        # 21 tests — scoped validation (read-only audit target)
  autosave-field-debounce.test.tsx    # 10 tests — per-field debounce + coalescing
  autosave-async-timing.test.tsx      #  4 tests — execution-version abort
  autosave-rapid-changes.test.tsx     #  8 tests — stale-save abort
vitest.config.ts                      # ROOT — coverage thresholds + exclude (confirm gate is real)
vitest.workspace.ts                   # ROOT — core + react projects (coverage scope)
# (no files added; this is an audit, not an implementation)
```

### Desired Codebase tree with files to be added

```bash
# The audit RECORD is the deliverable. Write it to the work item's research/
# dir (or as a sibling md), NOT into packages/:
plan/004_8583c4771a2e/P1M1T1S2/
  audit-record.md       # NEW — the scenario→test mapping + coverage numbers (the deliverable)
# Tests / config / source touched ONLY if a real gap/regression is found.
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: This is a READ-ONLY audit by default. Do NOT add tests, edit
// vitest.config.ts, or touch source UNLESS a genuine gap/regression is found.
// If all scenarios are covered + coverage is green, the deliverable is a
// confirmation record, not a code/test change.

// CRITICAL: Re-read the CURRENT describe/it names. The architecture audit's
// line numbers were verified at PRP research time (21/10/4/8 = 43 tests),
// but lines drift. Use `grep -nE "^\s*(describe|it|test)\(" <file>` to get
// the current names+lines, don't trust the PRP's numbers blindly.

// CRITICAL: The coverage command is `pnpm test:coverage` (= `vitest run --coverage`)
// from the REPO ROOT. Running it from a package subdir will NOT pick up the
// root vitest.config.ts coverage settings (coverage resolves against the
// workspace root). Always run from repo root.

// GOTCHA: The coverage thresholds are a HARD CI gate. `vitest run --coverage`
// exits 1 if ANY metric < 90. "Green" means exit 0 AND all four metrics ≥90.
// Record the EXACT four numbers (don't just say "green").

// GOTCHA: The vitest.config.ts exclude list has a DOCUMENTED deviation from
// §1.3.7's literal list: it ALSO excludes `scripts/**` (release automation).
// This is intentional (commented in the file: "a one-off semantic-release
// driver with no unit tests; counting it would be noise"). This is NOT a gap —
// do not "fix" it by removing scripts/** from the exclude list. Confirm it's
// still documented/justified in the config comments.

// GOTCHA: The "Unrelated Invalid Field (Issue 2)" test is THE regression guard
// for the scoped gate (PRD §11.1 point 4). It has TWO assertions:
//   @425 "should auto-save a valid field even when an unrelated field is invalid" (positive)
//   @502 "should still NOT auto-save when the CHANGED field itself is invalid" (negative complement)
// Record BOTH — together they prove the gate is scoped (changed+dependent), not whole-form.

// GOTCHA: Coalescing coverage lives in the "Coalescing semantics" describe with 3 its.
// The @319 it ("faster submits batch; slower no-ops") is the exact Example-4 proof.
// Don't just record the describe header — record the specific it that proves each
// Example-4 sub-behavior (shared timer, faster-submits-batch, slower-no-ops).

// GOTCHA: The execution-version abort is covered across TWO files (async-timing
// for the checkpoint-inside-validation path; rapid-changes for the rapid-change
// abort path). Don't expect all version-abort tests in one file.

// GOTCHA: vitest fake timers (vi.useFakeTimers / advanceTimersByTime) are used
// heavily in the debounce tests. If `pnpm test:coverage` shows a flake in these,
// it's a real test issue, not an audit artifact — but the architecture audit
// found 43/43 green, so this is unlikely.
```

## Implementation Blueprint

### Data models and structure

Not applicable — this is an audit. No data models change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: RE-READ the current describe/it names in all four test files
  - GREP each file: `grep -nE "^\s*(describe|it|test)\(" packages/react/src/__tests__/autosave-*.test.tsx`
  - RECORD: current line numbers (the PRP/architecture-audit numbers may have drifted).
  - CONFIRM per-file it() counts: validation=21, field-debounce=10, async-timing=4, rapid-changes=8 (total 43).
  - WHY: Every mapping in the record must cite the CURRENT test name + line, not a stale number.

Task 2: WALK Part A — map each spec scenario to its named test
  - FOR each spec scenario in §11.1–§11.3, find the matching describe/it and record:
      spec scenario → PRD ref → test `it(...)` name → file → line → status (present/missing).
  - CONFIRM the 5 scoped-validation items (Dependent, Async, Unrelated-Invalid Issue 2 [BOTH its], Validation Errors, Immediate debounce:false).
  - CONFIRM the 4 per-field-debounce items (numeric honored, coalescing 3-sub-behavior, mixed false+numeric, form-level fallback).
  - CONFIRM the 2 execution-version items (Version Checkpoint @async-timing, All Three Checkpoints @async-timing) + 2 stale-save items (abort intermediate @rapid-changes, Version Check Verification @rapid-changes).
  - RECORD: "Part A — all scenarios covered" with the mapping table, OR a gap report naming the missing scenario.

Task 3: WALK Part B — confirm the coverage gate config is real
  - READ vitest.config.ts: CONFIRM thresholds {statements:90, branches:90, functions:90, lines:90}.
  - READ vitest.config.ts: CONFIRM exclude list = §1.3.7 (examples/svelte/vue/dist) + documented scripts/** deviation.
  - READ vitest.workspace.ts: CONFIRM it lists core + react (coverage is repo-wide).
  - RECORD: "gate is real + correctly scoped" with the threshold block quoted.

Task 4: RUN the coverage gate
  - RUN (from repo ROOT): `pnpm test:coverage`  (== `vitest run --coverage`)
  - RECORD: exit code (must be 0) + the four metric numbers (statements/branches/functions/lines).
  - RECORD: test-file count + total test count (expect 36 files; 43 in the 4 autosave files).
  - COMPARE: metrics vs the architecture-audit baseline (97.25/95.7/98.16/97.25). Note any delta.
  - EXPECT: green, all four ≥90%, no regression. If any metric <90 or any test fails → GAP (Task 6).

Task 5: WRITE the audit record (the deliverable)
  - CREATE plan/004_8583c4771a2e/P1M1T1S2/audit-record.md (or research/ subdir).
  - INCLUDE three sections:
      (a) Part A: spec scenario → test name/file/line/status table.
      (b) Part B: coverage numbers (all four metrics) + exit code + comparison to baseline.
      (c) Gate config: the thresholds block quoted + exclude-list confirmation.
  - INCLUDE a clear outcome line: "## Outcome: no drift, all scenarios covered + gate green" OR "## Outcome: GAP FOUND".
  - THE RECORD is the deliverable — it gates P1.M1.T2.S1 (docs run after green is confirmed).

Task 6 (conditional — ONLY if a gap/regression is found): scope the minimal fix
  - IF a scenario is missing a test: write the minimal test addition (follow the existing mount/fake-timer pattern in the relevant file).
  - IF coverage regressed below 90%: identify the uncovered lines/files; write the minimal test to recover (do NOT lower the threshold — that would violate §1.3.7).
  - IF a test fails: debug root cause; the architecture audit found 43/43 green, so a failure likely indicates a real regression or an environment issue.
  - NOTE any doc the fix touches (Mode A ride-along).
  - IF no gap: SKIP this task entirely. Do not add tests or edit config.

Task 7: SANITY CHECK (if no code/test change)
  - RUN: `git diff --exit-code packages/ vitest.config.ts vitest.workspace.ts` → expect exit 0 (no changes) when outcome is "no drift".
  - EXPECT: clean. (Only the audit-record.md is new.)
```

### Implementation Patterns & Key Details

```typescript
// Audit-record layout (Task 5) — the deliverable:

// # Auto-Save Test Coverage Audit — P1.M1.T1.S2
//
// ## Outcome: no drift, all scenarios covered + gate green   (or: GAP FOUND)
//
// ## Part A — Spec Scenario → Test Mapping
//
// | Spec scenario (PRD) | Test `it(...)` name | File | Line | Status |
// |---|---|---|---|---|
// | §11.1 pt4 scoped gate — unrelated invalid doesn't block | "should auto-save a valid field even when an unrelated field is invalid" | autosave-validation.test.tsx | 425 | ✅ |
// | §11.1 pt4 scoped gate — changed-invalid DOES block | "should still NOT auto-save when the CHANGED field itself is invalid" | autosave-validation.test.tsx | 502 | ✅ |
// | §11.3 Ex4 — faster timer submits batch | "should let the faster debounce submit a coalesced batch; the slower timer no-ops" | autosave-field-debounce.test.tsx | 319 | ✅ |
// | ... (one row per scenario) ...
//
// ## Part B — Coverage Gate
//
// Command: `pnpm test:coverage` (from repo root)
// Exit code: 0
// Test files: 36 passed   |   Autosave tests: 43/43 (21+10+4+8)
// Coverage:
//   statements: 97.25%  (≥90 ✅)  [baseline 97.25% — no regression]
//   branches:    95.7%  (≥90 ✅)  [baseline 95.7%]
//   functions:  98.16%  (≥90 ✅)  [baseline 98.16%]
//   lines:      97.25%  (≥90 ✅)  [baseline 97.25%]
//
// ## Gate Config (vitest.config.ts)
//
// thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 }  // hard CI gate
// exclude: [...defaults, examples/**, packages/svelte/**, packages/vue/**, **/dist/**, scripts/**]
//   (scripts/** is a documented deviation — release automation, not shipped source)

// PATTERN: for each scenario, cite the SPECIFIC it() that proves it — not just the describe header.
// GOTCHA:  record BOTH Issue-2 its (@425 + @502) — together they prove the gate is scoped, not whole-form.
// CRITICAL: record the EXACT four coverage numbers + exit code; "green" alone is not enough evidence.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none (vitest.config.ts is READ-ONLY unless a gap is found)
ROUTES: none
TESTS:
  - packages/react/src/__tests__/autosave-*.test.tsx — READ-ONLY (unless a scenario is missing).
COVERAGE GATE:
  - vitest.config.ts thresholds — READ-ONLY confirmation (do NOT lower the 90 threshold).
OUTPUTS (the deliverable):
  - plan/004_8583c4771a2e/P1M1T1S2/audit-record.md — the scenario→test mapping + coverage numbers.
DOWNSTREAM CONSUMERS:
  - P1.M1.T2.S1 (doc sweep): runs only AFTER this audit confirms green.
DOCS: none — read-only audit. If a gap fix touches a doc, it rides with the fix (Mode A).
PARALLEL-SAFE:
  - S1 audits Form.tsx (runtime); S2 audits tests + coverage. No file overlap unless both find gaps.
```

## Validation Loop

> This is a read-only audit. The "validation" is the test-name walk + the
> coverage run, not a code change. Levels 2-3 apply only if a fix was made.

### Level 1: Audit Rigor (always — this IS the validation)

```bash
# Re-read current describe/it names (lines drift from the architecture-audit numbers)
grep -nE "^\s*(describe|it|test)\(" packages/react/src/__tests__/autosave-*.test.tsx

# Confirm per-file it() counts (expect 21 / 10 / 4 / 8 = 43)
for f in autosave-validation autosave-field-debounce autosave-async-timing autosave-rapid-changes; do
  echo "$f: $(grep -cE '^\s*it\(|^\s*test\(' packages/react/src/__tests__/$f.test.tsx)"
done

# Confirm the scoped-gate regression guard exists (THE key test)
grep -n "Unrelated Invalid Field\|auto-save a valid field even when an unrelated" \
  packages/react/src/__tests__/autosave-validation.test.tsx
# Expected: matches at the describe (@418) + the positive it (@425).

# Confirm the coalescing Example-4 proof exists
grep -n "faster debounce submit a coalesced batch; the slower timer no-ops" \
  packages/react/src/__tests__/autosave-field-debounce.test.tsx
# Expected: exactly ONE match (@319).

# Confirm the gate config is real
grep -A5 "thresholds:" vitest.config.ts
# Expected: statements: 90, branches: 90, functions: 90, lines: 90.
```

### Level 2: Coverage Gate (always — this is a required deliverable)

```bash
# Run from REPO ROOT (coverage resolves against workspace root)
pnpm test:coverage
# Expected: exit 0; all four metrics ≥90%. Record the EXACT numbers.
# Baseline from architecture audit: 97.25% / 95.7% / 98.16% / 97.25%.
# If any metric <90 or exit ≠0 → GAP (Task 6).
```

### Level 3: Typecheck & Build (only if a test/config fix was made)

```bash
# Run ONLY if Task 6 produced a test addition or config edit.
pnpm typecheck
pnpm --filter @formality-ui/react build
# Expected: green. If no gap was found, SKIP.
```

### Level 4: Audit-Record Completeness (the real gate)

```bash
# The deliverable is the record. Confirm it has both parts:
grep -cE "Part A|Part B" plan/004_8583c4771a2e/P1M1T1S2/audit-record.md
# Expected: 2 (one per part).

# Confirm the mapping table has rows for the key scenarios:
grep -cE "Unrelated Invalid|Coalescing|Version Checkpoint|Immediate|fallback" \
  plan/004_8583c4771a2e/P1M1T1S2/audit-record.md
# Expected: ≥5 (the key scenarios are named).

# Confirm a clear outcome statement + coverage numbers recorded:
grep -E "no drift|GAP FOUND" plan/004_8583c4771a2e/P1M1T1S2/audit-record.md
grep -E "statements:|branches:|functions:|lines:" plan/004_8583c4771a2e/P1M1T1S2/audit-record.md
# Expected: exactly one outcome line; four metric lines with percentages.

# If no gap was found, confirm tests/config/source are untouched:
git diff --exit-code packages/ vitest.config.ts vitest.workspace.ts
# Expected: exit 0 (no changes) when outcome is "no drift".
```

## Final Validation Checklist

### Technical Validation

- [ ] All four test files' `describe`/`it` names re-read (current line numbers, not stale).
- [ ] Per-file it() counts confirmed: 21 / 10 / 4 / 8 (= 43).
- [ ] `pnpm test:coverage` green (exit 0); all four metrics recorded and ≥90%.
- [ ] Coverage metrics compared to baseline (97.25/95.7/98.16/97.25) — no regression noted.
- [ ] `vitest.config.ts` thresholds confirmed = 90 on all four metrics (gate is real).
- [ ] If no gap: `git diff --exit-code packages/ vitest.config.ts vitest.workspace.ts` → exit 0.

### Feature Validation

- [ ] Every §11.1–§11.3 spec scenario mapped to a named test (table in the record).
- [ ] "Unrelated Invalid Field (Issue 2)" test confirmed present + green (BOTH @425 + @502).
- [ ] Coalescing Example-4 sub-behaviors each mapped (shared timer, faster-submits-batch, slower-no-ops).
- [ ] Execution-version / stale-save abort tests confirmed (async-timing + rapid-changes).
- [ ] Immediate submission (debounce:false) + form-level fallback confirmed.
- [ ] Outcome unambiguous: exactly one of "no drift, all green" / "GAP FOUND".

### Code Quality Validation

- [ ] No tests added / config edited / source touched unless a genuine gap was found.
- [ ] If a gap was found: the fix is MINIMAL (follows existing test patterns; does NOT lower the 90 threshold).
- [ ] If a gap was found: any doc the fix touches is noted (Mode A ride-along).
- [ ] The audit record is self-contained (a reader can verify each claim from the test names + coverage output).

### Documentation & Deployment

- [ ] The audit record is written to `plan/004_8583c4771a2e/P1M1T1S2/audit-record.md` (gates P1.M1.T2.S1).
- [ ] No README/example/JSDoc edits unless a gap fix required it (Mode A).
- [ ] No new env vars or config.

---

## Anti-Patterns to Avoid

- ❌ Don't blindly trust the architecture-audit line numbers — re-read the `describe`/`it` names with `grep -nE` before recording. Lines drift.
- ❌ Don't add tests "to be safe" — this is read-only unless a scenario is genuinely missing. An unnecessary test is scope creep.
- ❌ Don't lower the 90 threshold to make coverage pass — that violates §1.3.7. If coverage regressed, find the uncovered code and add a test.
- ❌ Don't run coverage from a package subdir — it won't pick up the root `vitest.config.ts`. Always run `pnpm test:coverage` from the repo root.
- ❌ Don't record just "green" for coverage — record the EXACT four numbers + exit code. The numbers are the evidence.
- ❌ Don't "fix" the `scripts/**` exclude-list deviation — it's documented and intentional (release automation, not shipped source). Confirm it's still justified in the config comments; don't remove it.
- ❌ Don't record only the `describe` header for a scenario — cite the specific `it(...)` that proves each sub-behavior (esp. coalescing's 3 sub-behaviors and Issue-2's 2 its).
- ❌ Don't edit Form.tsx (S1's territory), examples, or READMEs (P1.M1.T2.S1) in this subtask.
- ❌ Don't skip the coverage run — it's a required deliverable, not optional. The gate being green is half the point of this audit.
- ❌ Don't skip writing the record — the record (not the test walk) is the deliverable, and it gates the doc sweep.

---

## Confidence Score

**10/10** — one-pass success likelihood.

Rationale: This is a read-only audit, and the architecture audit + live-source
re-verification during PRP research already confirmed all 43 tests pass (per-file
counts 21/10/4/8 verified by grep), every spec scenario maps to a named test
(describe/it names match verbatim), and coverage is green at 97.25/95.7/98.16/97.25.
The vitest config's 90% threshold on all four metrics was confirmed in the root
`vitest.config.ts`. The implementing agent's task is mechanical: re-read the test
names, run `pnpm test:coverage`, record the mapping + numbers. The only "failure
mode" is citing a stale line number or running coverage from the wrong directory —
both mitigated by Task 1's `grep -nE` re-read and the explicit "run from repo root"
instruction. The expected outcome is "no drift, all scenarios covered + gate green."
