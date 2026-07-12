name: "P1.M1.T2.S1 — Remove diagnostic probe files and skip failing isDisabled tests with documentation"
description: |

---

## Goal

**Feature Goal**: Restore green CI by ensuring the repository contains NO
diagnostic probe files and the 5 failing `isDisabled` field-state condition
tests are `it.skip(...)` with explanatory `KNOWN LIMITATION` comments. This is
the hygiene half of bug-fix Issue 2 (PRD §1.3.7 / build integrity).

> **CRITICAL RESEARCH FINDING (re-verified against live source):** This work
> is **already complete in the committed tree**. The repository HEAD has moved
> PAST the PRD's reference commit (`8e3fd4c`). At the current HEAD, commit
> `1863b44 test(react): skip out-of-scope failing isDisabled tests; remove
> probes` already:
> 1. Removed both probe files (`_tmp_isdisabled_probe.test.tsx`,
>    `_tmp_isdisabled_probe2.test.tsx`) — confirmed absent via `find`.
> 2. Changed the 5 failing `isDisabled` tests to `it.skip(...)` with
>    multi-line `KNOWN LIMITATION` comments (Field.test.tsx lines 1132, 1172,
>    1226, 1308, 1356).
>
> `npx vitest run packages/react/src/__tests__/Field.test.tsx` → **70 passed
> | 5 skipped (75)**, 0 failed.
>
> **This is therefore a VERIFY-AND-CONFIRM subtask.** The implementing agent's
> job is to independently re-confirm the live state matches the contract,
> write a short verification record, and make edits ONLY if drift is found.
> The expected outcome is "no drift, hygiene already complete."

**Deliverable**:
1. A **verification record** (in this PRP's research/ dir) confirming:
   (a) no `_tmp_isdisabled_probe*.test.tsx` files exist anywhere in the repo;
   (b) the 5 `isDisabled` tests are `it.skip(...)` with `KNOWN LIMITATION`
       comments explaining the root cause;
   (c) `npx vitest run` is green (0 failed; only intentional skips).
2. Edits ONLY if a probe file re-appears, a skip comment is missing/stale, or a
   test has drifted back to active `it(...)` — otherwise NO file changes.

**Success Definition**:
1. No `_tmp_isdisabled_probe*.test.tsx` (or any `*_tmp_*` / `*probe*` diagnostic
   scratch file) exists under `packages/`.
2. The 5 `isDisabled` tests are `it.skip(...)` and each carries a `KNOWN
   LIMITATION` comment documenting: (i) the `isDisabled` matcher is implemented
   in core but doesn't work in the React adapter, (ii) config-level / JSX-prop
   `disabled` states are not propagated into `fieldStates`, (iii) adding
   `disabled` to `fieldStates` creates circular re-render dependencies.
3. `npx vitest run` is green: 0 failed; the only skips are the intentional
   `it.skip` tests (5 in Field.test.tsx + any other pre-existing intentional
   skips elsewhere).
4. Git status is clean (no new uncommitted masks) — the green state is COMMITTED.
5. No source/runtime files (Form.tsx, useFieldDisabledState.ts, evaluate.ts)
   are modified (the limitation is documented, not fixed — fixing it is
   out-of-scope feature work; tracking it project-wide is P1.M1.T2.S2).

## User Persona

**Target User**: The Formality maintainer + CI. This is an internal hygiene
fix, not an end-user feature.

**Use Case**: A maintainer checks out `main` HEAD and runs `npx vitest run` —
it must be green with no diagnostic scratch files cluttering the repo.

**Pain Points Addressed**: At the PRD's reference commit (`8e3fd4c`), CI was red
(4 failing tests) and 2 exploratory probe files were committed. This subtask
confirms that broken state has been cleaned up and the cleanup is committed.

## Why

- **Business value**: Green CI is a prerequisite for everything else in this
  bug-fix plan. A red `main` HEAD blocks all other work and erodes trust in
  the test suite. This subtask confirms the hygiene fix is in place.
- **Integration**: This is the **hygiene half** of Issue 2 (PRD §h3.1). The
  other half — tracking the `isDisabled` React-adapter limitation in a
  project-level known-issues document — is **P1.M1.T2.S2** (separate subtask).
  This subtask (S1) confirms ONLY: probes gone + tests skipped + comments
  present + suite green.
- **Scope boundary (CRITICAL)**:
  - This is a **verify-and-confirm** subtask. The cleanup is already committed
    (`1863b44`). Edit ONLY on drift.
  - Do NOT fix the `isDisabled` limitation itself (wire `disabled` into
    `fieldStates`) — that is out-of-scope feature work (PRD §h3.1 "Or
    (feature): wire config-level / JSX-prop disabled…"). The limitation is
    DOCUMENTED via skip comments here and TRACKED project-wide in S2.
  - Do NOT create a `KNOWN_ISSUES.md` or project-level tracking doc — that is
    S2's deliverable.
  - Do NOT touch Form.tsx, useFieldDisabledState.ts, evaluate.ts, or any
    runtime source.
- **Parallel-safe**: P1.M1.T1.S2 (concurrent) is a verify-first subtask on
  `autosave-submit-immediate.test.tsx` (Issue 1 regression tests). It edits
  only that one test file. This subtask touches ONLY `Field.test.tsx` (and
  only if drift is found) + deletes probe files (only if they re-appear).
  **No file overlap.**

## What

### The contract (what "done" looks like — already committed at HEAD `1863b44`)

**(a) No probe files.** `packages/react/src/__tests__/_tmp_isdisabled_probe.test.tsx`
and `_tmp_isdisabled_probe2.test.tsx` must NOT exist. (Repo-wide: no `*_tmp_*`
or `*probe*` diagnostic scratch files under `packages/`.)

**(b) 5 isDisabled tests are `it.skip(...)` with KNOWN LIMITATION comments.**
In `packages/react/src/__tests__/Field.test.tsx`, these 5 tests must be skipped
with explanatory comments (verified live at HEAD at lines 1132, 1172, 1226,
1308, 1356):
- `should reference isDisabled matcher from other field` (@1132)
- `should handle circular dependencies without infinite loops` (@1172)
- `should disable result when both source fields are disabled` (@1226, inside
  `describe("two-field isDisabled conditions")` @1225)
- `should re-evaluate when source field disabled states change` (@1308)
- `should work with field state matchers in object when` (@1356)

Each skip comment must document the three root-cause points (matcher is
core-only; disabled not propagated to fieldStates; adding it creates circular
re-render deps).

**(c) Suite green.** `npx vitest run` → 0 failed; only intentional skips
(5 in Field.test.tsx). `npx vitest run packages/react/src/__tests__/Field.test.tsx`
→ 70 passed | 5 skipped.

**(d) Green state is COMMITTED.** `git status` must be clean (no uncommitted
masks hiding a red committed state — the exact inconsistency Issue 2 flagged
at the old HEAD).

### Success Criteria

- [ ] No `_tmp_isdisabled_probe*.test.tsx` (or `*_tmp_*` / `*probe*`) file under `packages/`.
- [ ] The 5 isDisabled tests are `it.skip(...)` (not active `it(...)`).
- [ ] Each skipped test carries a `KNOWN LIMITATION` comment with the 3 root-cause points.
- [ ] `npx vitest run` green (0 failed; only intentional skips).
- [ ] `npx vitest run packages/react/src/__tests__/Field.test.tsx` → 70 passed | 5 skipped.
- [ ] `git status` clean (green state committed; no uncommitted masks).
- [ ] No runtime source files modified (Form.tsx, useFieldDisabledState.ts, evaluate.ts untouched).
- [ ] Verification record written.

## All Needed Context

### Context Completeness Check

_Pass._ The bug-fix Issue 2 (PRD §h3.1), the architecture system_context.md
(§"Issue 2 — ✅ HYGIENE DONE, ⚠️ LIMITATION UNTRACKED"), and live-source
re-verification during PRP authorship all confirm the hygiene work is already
committed (`1863b44`). The 5 skip locations (Field.test.tsx 1132/1172/1226/
1308/1356), the root-cause analysis (useFieldDisabledState.ts:126-145 omits
`disabled` from fieldStates; core evaluate.ts:84-87 reads `fieldState?.disabled`
→ always undefined), and the green test result (70 passed | 5 skipped) are all
verified. The implementing agent needs only to re-confirm and record.

### Documentation & References

```yaml
# MUST READ
- url: Bug-fix Issue 2 (plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd — heading:h2.2 / h3.1)
  why: The authoritative issue statement — names the 4 failing tests, the 2 probe files, the red HEAD.
  critical: "Suggested Fix (minimum/hygiene): commit the working-tree masks + probe deletions so main
             is green and clean, and decide whether the isDisabled React limitation is tracked as a
             known issue elsewhere." → The HYGIENE half = this subtask; the TRACKING half = S2.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/system_context.md
  why: Verified-current-state report. Confirms HEAD is PAST the PRD ref commit; the hygiene is DONE
        at commit 1863b44; lists exactly what was done; names the root cause.
  section: "Current Codebase State (HEAD: …)" + "Issue 2 (Major): Red CI + probe files — ✅ HYGIENE DONE, ⚠️ LIMITATION UNTRACKED"
  critical: "What was done: Probe files removed; 5 failing tests changed to it.skip(...) with KNOWN
             LIMITATION comments; committed (1863b44). What still needs doing: the PRD says 'decide
             whether the isDisabled React limitation is tracked as a known issue elsewhere' —
             currently ONLY in skip comments. No KNOWN_ISSUES.md exists." → the "still needs doing"
             is S2, NOT this subtask.

- url: PRD §1.3.7 (heading:h4.6 — Testing Strategy, ≥90% coverage gate / green CI)
  why: The CI-integrity mandate this hygiene work satisfies.
  critical: Skipping tests does NOT lower coverage below 90% (the isDisabled paths are in core, which
            has its own passing tests). Confirm `pnpm test:coverage` stays green.

# THE TARGET FILE (read-only verify; edit ONLY on drift)
- file: packages/react/src/__tests__/Field.test.tsx
  section: "isDisabled region ~1100-1400: describes 'Conditions disabled priority' @945,
            'two-field isDisabled conditions' @1225; 5 it.skip @1132/1172/1226/1308/1356;
            'multi-field isDisabled with mixed matchers' @1392 (active, passing)."
  why: THE file to verify. The 5 skips + KNOWN LIMITATION comments must be present.
  pattern: "it.skip('should ...', () => { /* KNOWN LIMITATION: ... (3 root-cause points) ... */ ... })"
  gotcha: "The region ALSO has ACTIVE passing tests: 'should not disable result when only one source
           field is disabled' @1271 (it, not it.skip — it passes today) and the 'multi-field isDisabled
           with mixed matchers' describe @1392 (all active, passing). Do NOT skip those — only the 5
           contract tests stay skipped."

- file: packages/react/src/__tests__/Field.test.tsx
  section: "KNOWN LIMITATION comment contents (verify each skip has the 3 root-cause points)"
  why: The comments ARE the Mode-A documentation for this subtask (per contract clause 5).
  verify: "Each skip's comment must mention: (1) isDisabled matcher is core-only / doesn't work in
           React adapter; (2) config-level / JSX-prop disabled not propagated into fieldStates;
           (3) adding disabled to fieldStates creates circular re-render dependencies."

# THE PROBE FILES (must NOT exist)
- file: packages/react/src/__tests__/_tmp_isdisabled_probe.test.tsx   (ABSENT — verify)
- file: packages/react/src/__tests__/_tmp_isdisabled_probe2.test.tsx  (ABSENT — verify)
  why: Diagnostic scratch files that must not be in version control.
  verify: "`find packages -name '*_tmp_*' -o -name '*probe*'` (excluding node_modules) → NO matches."

# ROOT CAUSE (read-only — do NOT fix here)
- file: packages/react/src/hooks/useFieldDisabledState.ts
  section: "~126-145 (builds fieldStates WITHOUT 'disabled'; comment: 'CRITICAL: Do NOT add disabled
            to fieldStates (creates circular dependency)')"
  why: READ-ONLY root-cause reference. Confirms WHY the isDisabled tests can't pass today.
  gotcha: "Do NOT edit this file. Adding 'disabled' to fieldStates to make the tests pass is the
           FEATURE fix (out of scope). The limitation is documented via skip comments + tracked in S2."

- file: packages/core/src/conditions/evaluate.ts
  section: "~84-87 (checks fieldState?.disabled for the isDisabled matcher — always undefined in React)"
  why: READ-ONLY root-cause reference. Core supports the matcher; the React adapter just doesn't populate it.
  gotcha: "Do NOT edit core. Core's own unit tests for isDisabled pass — only the React integration fails."

# PARALLEL-EXECUTION CONTEXT (S2-of-T1 is being implemented concurrently)
- file: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M1T1S2/PRP.md
  section: "Goal (verify-first on autosave-submit-immediate.test.tsx, Issue 1 regression tests)"
  why: P1.M1.T1.S2 (concurrent) is a verify-first subtask on a DIFFERENT test file
        (autosave-submit-immediate.test.tsx, Issue 1). ZERO overlap with this subtask
        (which touches Field.test.tsx + probe-file deletion only).
  critical: "S2-of-T1 edits at most autosave-submit-immediate.test.tsx. This subtask edits at most
             Field.test.tsx. Different files; no conflict. Coordinate only that both land before P1.M3.T1."

# DOWNSTREAM CONSUMER
- file: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M1T2.S2 (sibling subtask — not yet run)
  section: "Track the isDisabled React-adapter limitation as a known issue in project documentation"
  why: S2-of-T2 consumes this subtask's skip comments as the source of truth for the project-level
        known-issues doc. The skip comments must be accurate/complete so S2 can reference them.
  critical: "This subtask (S1) does NOT create the known-issues doc — that's S2. S1 only ensures the
             skip comments are present + accurate + the suite is green."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/__tests__/
  Field.test.tsx                          # ← VERIFY: 5 it.skip @1132/1172/1226/1308/1356 + KNOWN LIMITATION comments
  # (_tmp_isdisabled_probe*.test.tsx — ABSENT; verify with find)
packages/react/src/hooks/
  useFieldDisabledState.ts                # READ-ONLY root cause (~126-145)
packages/core/src/conditions/
  evaluate.ts                             # READ-ONLY root cause (~84-87)
```

### Desired Codebase tree with files to be added

```bash
# NO files added. NO files deleted (probes already gone at HEAD).
# Field.test.tsx MODIFIED ONLY if a skip/comment has drifted (verify-first).
plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M1T2S1/
  research/
    verification-record.md                # NEW — the verification record (the deliverable)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (verify-first, not implement-first): The hygiene work is ALREADY COMMITTED at
// 1863b44 (HEAD is past the PRD's 8e3fd4c reference commit). Re-confirm the live state;
// edit ONLY on drift. Blindly re-doing the cleanup (e.g. re-creating then deleting probe
// files, or rewriting the skip comments) is scope creep and risks corrupting the committed
// green state.

// CRITICAL (do NOT fix the limitation): The isDisabled React-adapter limitation is DOCUMENTED,
// not FIXED, by this subtask. Wiring `disabled` into fieldStates to make the tests pass is
// the FEATURE fix (PRD §h3.1 "Or (feature)…") and is out of scope. Editing useFieldDisabledState.ts
// or evaluate.ts here is a forbidden scope leak.

// CRITICAL (do NOT create the known-issues doc here): Project-level tracking of the limitation
// is P1.M1.T2.S2's deliverable. This subtask's "docs" are ONLY the inline KNOWN LIMITATION
// comments in Field.test.tsx (Mode A). Creating KNOWN_ISSUES.md here duplicates/conflicts with S2.

// GOTCHA (some isDisabled tests STAY ACTIVE): Not every test in the isDisabled region is skipped.
// 'should not disable result when only one source field is disabled' @1271 is an ACTIVE it()
// (it passes today — it asserts the negative case that happens to hold). The 'multi-field
// isDisabled with mixed matchers' describe @1392 is ALL ACTIVE and passing. Do NOT skip those —
// only the 5 contract tests (1132/1172/1226/1308/1356) stay skipped.

// GOTCHA (git status must be CLEAN): Issue 2's original sin was an uncommitted green working
// tree masking a red committed HEAD. After this subtask, `git status` must be clean — the green
// state is committed, not held as uncommitted masks. If you make any edit, COMMIT it (or leave
// it for the orchestrator's commit step) — do not leave an uncommitted mask.

// GOTCHA (coverage gate unaffected): Skipping these 5 tests does NOT drop coverage below 90%
// because the isDisabled code paths live in @formality-ui/core (evaluate.ts), which has its OWN
// passing unit tests. The React integration is what's broken, not the core logic. Confirm
// `pnpm test:coverage` stays ≥90% on all four metrics.

// GOTCHA (root cause is intentional): useFieldDisabledState.ts:126-145 OMITS 'disabled' from
// fieldStates ON PURPOSE (the comment says 'CRITICAL: Do NOT add disabled to fieldStates
// (creates circular dependency)'). This is a known architectural trade-off, not an oversight.
// The skip comments should reflect that adding disabled is a non-trivial design problem, not
// a one-line fix.

// GOTCHA (parallel execution): P1.M1.T1.S2 (concurrent) verifies Issue-1 regression tests in
// autosave-submit-immediate.test.tsx. This subtask verifies Field.test.tsx + probe absence.
// No file overlap. Do not wait on S2-of-T1.
```

## Implementation Blueprint

### Data models and structure

Not applicable — this is a hygiene/verify subtask. No data models change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY probe files are absent (repo-wide)
  - RUN: `find packages -name '*_tmp_*' -o -name '*probe*'` (exclude node_modules)
    → expect NO matches.
  - RUN: `ls packages/react/src/__tests__/_tmp_isdisabled_probe*.test.tsx 2>&1`
    → expect "No such file or directory".
  - ALSO CHECK git history is clean of them at HEAD: `git ls-files packages/react/src/__tests__ | grep -i probe`
    → expect NO matches (they're not tracked).
  - OUTCOME: if absent → record "probes gone". If present → `git rm` them (Task 4).

Task 2: VERIFY the 5 isDisabled tests are it.skip with KNOWN LIMITATION comments
  - GREP: `grep -nE "it\.skip\(|it\(" packages/react/src/__tests__/Field.test.tsx | grep -iE "isDisabled|disabled"`
    → confirm the 5 contract tests are `it.skip(...)`:
      @1132 "should reference isDisabled matcher from other field"
      @1172 "should handle circular dependencies without infinite loops"
      @1226 "should disable result when both source fields are disabled"
      @1308 "should re-evaluate when source field disabled states change"
      @1356 "should work with field state matchers in object when"
  - CONFIRM each skip's comment contains the 3 root-cause points (matcher core-only / disabled
    not in fieldStates / circular-dep risk). READ lines 1132-1360.
  - CONFIRM the ACTIVE tests stay active: @1271 "should not disable result when only one source
    field is disabled" (it, not it.skip) + the 'multi-field isDisabled with mixed matchers'
    describe @1392 (all it, passing).
  - OUTCOME: if all 5 skipped + comments complete → Task 3. If a test drifted to active it()
    or a comment is missing/stale → Task 4 (fix).

Task 3: RUN the suite — confirm green
  - RUN: `npx vitest run packages/react/src/__tests__/Field.test.tsx`
    → expect "70 passed | 5 skipped (75)", 0 failed.
  - RUN: `npx vitest run` (full suite)
    → expect 0 failed; only intentional skips.
  - RUN: `pnpm test:coverage` (≥90% gate per §1.3.7 — confirm unaffected by the skips).
  - OUTCOME: green → Task 5 (record). If a test fails → Task 4 (debug; likely a skip regressed
    to active it(), or an unrelated regression — investigate root cause).

Task 4 (CONDITIONAL — only if Task 1/2/3 found drift): APPLY the minimal fix
  - IF a probe file re-appeared: `git rm packages/react/src/__tests__/_tmp_isdisabled_probe*.test.tsx`.
  - IF a skip regressed to active it(): change it back to it.skip(...) and (re)add the KNOWN
    LIMITATION comment with the 3 root-cause points (mirror the comment style of the sibling skips).
  - IF a skip comment is missing/stale: rewrite it to include the 3 root-cause points.
  - DO NOT: fix the isDisabled limitation itself (no useFieldDisabledState.ts / evaluate.ts edits);
    create a known-issues doc (S2's job); skip the active passing tests (@1271, @1392+).
  - AFTER fixing: re-run Task 3 to confirm green.
  - (Research indicates this task will NOT fire — HEAD 1863b44 already has everything in place.
    But the agent must verify, not assume.)

Task 5: WRITE the verification record (the deliverable)
  - CREATE plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M1T2S1/research/verification-record.md.
  - INCLUDE:
      (a) Outcome line: "no drift, hygiene already complete (committed at 1863b44)" OR "DRIFT FOUND + fixed: <details>".
      (b) Probe-file check: the `find`/`git ls-files` commands + "no matches" result.
      (c) Skip check: a table of the 5 tests → line → it.skip ✓ → comment-has-3-root-causes ✓.
      (d) Test-run results: Field.test.tsx (70 passed | 5 skipped) + full suite (0 failed) +
          coverage (all four metrics ≥90%).
      (e) Git status: clean (green state committed).
  - THE RECORD is the deliverable — it gates S2 (which references the skip comments as the
    source of truth for the project-level known-issues doc).

Task 6: SCOPE-LEAK CHECK
  - RUN: `git status --short` → expect CLEAN (no uncommitted masks) IF Task 4 didn't fire,
    OR the minimal Task-4 edit staged IF it did.
  - RUN: `git diff --exit-code packages/react/src/components/Form.tsx packages/react/src/hooks/useFieldDisabledState.ts packages/core/src/conditions/evaluate.ts`
    → expect exit 0 (runtime/root-cause files untouched).
  - RUN: `git diff --exit-code packages/react/src/__tests__/autosave-submit-immediate.test.tsx`
    → expect exit 0 (P1.M1.T1.S2's file, untouched).
  - EXPECT: no runtime/source/core edits; at most Field.test.tsx (ONLY if Task 4 fired).
```

### Implementation Patterns & Key Details

```typescript
// The KNOWN LIMITATION comment shape the 5 skips must carry (verify present; mirror if rewriting):

// it.skip("should reference isDisabled matcher from other field", () => {
//   // KNOWN LIMITATION: isDisabled matcher requires two-pass evaluation with allFieldsConfig
//   // and reads `fieldState?.disabled` from the fieldStates map. The React adapter
//   // (useFieldDisabledState.ts:126-145) intentionally OMITS `disabled` from fieldStates
//   // because adding it creates circular re-render dependencies. As a result the isDisabled
//   // field-state condition matcher — implemented and unit-tested in @formality-ui/core
//   // (evaluate.ts:84-87) — does NOT work in the React adapter: config-level and JSX-prop
//   // `disabled` states are not propagated into the fieldStates used for condition evaluation.
//   // This is a known React-adapter limitation (tracked project-wide in <S2's doc>).
//   ...
// });

// PATTERN: each skip names (1) what's broken, (2) the root cause (disabled not in fieldStates),
//          (3) why it can't be trivially fixed (circular dependency), and (4) that core supports it.
// GOTCHA:  do NOT skip the ACTIVE passing test @1271 ("should not disable result when only one
//          source field is disabled") — it passes today and is a valid negative-case guard.
// CRITICAL: do NOT edit useFieldDisabledState.ts / evaluate.ts to make the skips pass — that's
//           the out-of-scope feature fix.

// Verification-record layout (Task 5) — the deliverable:

// # P1.M1.T2.S1 — isDisabled hygiene verification Record
//
// ## Outcome: no drift, hygiene already complete (committed at 1863b44)
//   (or: DRIFT FOUND + fixed: <details>)
//
// ## Probe-file check
// Command: `find packages -name '*_tmp_*' -o -name '*probe*'` → NO matches ✓
// Command: `git ls-files packages/react/src/__tests__ | grep -i probe` → NO matches ✓
//
// ## Skip check
// | Test | Line | it.skip ✓ | Comment has 3 root-causes ✓ |
// |---|---|---|---|
// | should reference isDisabled matcher from other field | 1132 | ✓ | ✓ |
// | should handle circular dependencies without infinite loops | 1172 | ✓ | ✓ |
// | should disable result when both source fields are disabled | 1226 | ✓ | ✓ |
// | should re-evaluate when source field disabled states change | 1308 | ✓ | ✓ |
// | should work with field state matchers in object when | 1356 | ✓ | ✓ |
//
// ## Test-run results
// Field.test.tsx: 70 passed | 5 skipped (75), 0 failed ✓
// Full suite (`npx vitest run`): 0 failed; only intentional skips ✓
// Coverage (`pnpm test:coverage`): statements/branches/functions/lines all ≥90% ✓
//
// ## Git status: clean (green state committed) ✓
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
RUNTIME: none (verify-only; NO source edits — useFieldDisabledState.ts / evaluate.ts / Form.tsx untouched).
TESTS:
  - packages/react/src/__tests__/Field.test.tsx — VERIFY the 5 skips; edit ONLY on drift.
  - probe files — VERIFY absent; git rm ONLY if re-appeared.
COVERAGE GATE:
  - vitest.config.ts 90% threshold — CONFIRM unaffected by the skips (core has its own isDisabled tests).
OUTPUTS (the deliverable):
  - plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M1T2S1/research/verification-record.md.
DOWNSTREAM CONSUMERS:
  - P1.M1.T2.S2 (known-issues doc): consumes the skip comments as the source of truth.
  - P1.M3.T1 (doc sweep): the CHANGELOG narrative references "skipped out-of-scope isDisabled tests; removed probes".
DOCS:
  - Mode A inline: the KNOWN LIMITATION comments in Field.test.tsx (verify present/accurate).
  - Mode B project-level: S2's known-issues doc (NOT this subtask).
PARALLEL-SAFE:
  - P1.M1.T1.S2 (concurrent) verifies autosave-submit-immediate.test.tsx (Issue 1). Different file.
  - This subtask verifies Field.test.tsx + probe absence. No file overlap.
```

## Validation Loop

> This is a verify-and-confirm subtask. The "validation" IS the verification —
> probe-absence check, skip-presence check, suite run. Levels 2-3 apply only
> if a fix was made (Task 4).

### Level 1: Verification Rigor (always — this IS the validation)

```bash
# Probe files absent (repo-wide)
find packages -name '*_tmp_*' -o -name '*probe*' | grep -v node_modules
# Expected: NO output (no matches).

git ls-files packages/react/src/__tests__ | grep -i probe
# Expected: NO output (probes not tracked at HEAD).

# The 5 contract tests are it.skip with KNOWN LIMITATION comments
grep -nE "it\.skip\(" packages/react/src/__tests__/Field.test.tsx | grep -iE "isDisabled|disabled"
# Expected: 5 matches at ~1132/1172/1226/1308/1356.

# Confirm the root-cause points are documented in the skip comments
sed -n '1100,1360p' packages/react/src/__tests__/Field.test.tsx | grep -ciE "KNOWN LIMITATION|circular|fieldStates|disabled"
# Expected: multiple matches (the comments mention these terms).

# Confirm the ACTIVE passing tests are NOT skipped
sed -n '1271,1272p' packages/react/src/__tests__/Field.test.tsx
# Expected: `it("should not disable result when only one source field is disabled"...` (it, not it.skip).
```

### Level 2: Suite Run (always — required deliverable)

```bash
# Field.test.tsx in isolation
npx vitest run packages/react/src/__tests__/Field.test.tsx
# Expected: 70 passed | 5 skipped (75), 0 failed.

# Full suite
npx vitest run
# Expected: 0 failed; only intentional skips.
```

### Level 3: Coverage Gate + Clean Tree (always)

```bash
# Coverage gate unaffected by the skips (core has its own isDisabled tests)
pnpm test:coverage
# Expected: all four metrics ≥90%, green.

# Git status must be CLEAN (green state committed — not an uncommitted mask)
git status --short
# Expected: clean (no uncommitted changes), OR only this subtask's Task-4 edit if drift was found.

# Runtime/root-cause files untouched
git diff --exit-code \
  packages/react/src/components/Form.tsx \
  packages/react/src/hooks/useFieldDisabledState.ts \
  packages/core/src/conditions/evaluate.ts
# Expected: exit 0 (these are READ-ONLY here).
```

### Level 4: Typecheck & Lint (only if a Task-4 fix was made)

```bash
# Run ONLY if Task 4 edited Field.test.tsx (e.g. re-added a skip + comment).
pnpm typecheck
pnpm lint
# Expected: green. If no fix was made, SKIP (the committed state is already verified green).
```

## Final Validation Checklist

### Technical Validation

- [ ] No `_tmp_isdisabled_probe*.test.tsx` / `*_tmp_*` / `*probe*` file under `packages/`.
- [ ] The 5 isDisabled tests are `it.skip(...)` (1132/1172/1226/1308/1356).
- [ ] Each skip's comment documents the 3 root-cause points.
- [ ] `npx vitest run packages/react/src/__tests__/Field.test.tsx` → 70 passed | 5 skipped.
- [ ] `npx vitest run` (full suite) → 0 failed; only intentional skips.
- [ ] `pnpm test:coverage` ≥90% on all four metrics (unaffected by skips).
- [ ] `git status` clean (green state committed; no uncommitted masks).
- [ ] Runtime/root-cause files untouched: `git diff --exit-code` Form.tsx / useFieldDisabledState.ts / evaluate.ts → exit 0.

### Feature Validation

- [ ] Probe files confirmed absent (find + git ls-files both empty).
- [ ] 5 contract tests confirmed `it.skip` with complete KNOWN LIMITATION comments.
- [ ] ACTIVE passing tests (@1271; @1392+) NOT skipped.
- [ ] Suite green with 0 failures.
- [ ] Outcome unambiguous: "no drift, hygiene already complete" OR "DRIFT FOUND + fixed".

### Code Quality Validation

- [ ] No runtime source edits (Form.tsx / useFieldDisabledState.ts / evaluate.ts untouched).
- [ ] No feature-fix scope leak (the isDisabled limitation is documented, not fixed).
- [ ] No known-issues doc created (that's P1.M1.T2.S2's deliverable).
- [ ] Field.test.tsx edited ONLY if a skip/comment drifted (verify-first).
- [ ] The skip comments are accurate enough for S2 to reference as source-of-truth.

### Documentation & Deployment

- [ ] Mode A inline docs (KNOWN LIMITATION comments) verified present + accurate.
- [ ] Verification record written to `plan/.../P1M1T2S1/research/verification-record.md`.
- [ ] No CHANGELOG/README edits here (those are P1.M3.T1).

---

## Anti-Patterns to Avoid

- ❌ Don't re-do the cleanup blindly — it's already committed (`1863b44`). Verify first; edit ONLY on drift.
- ❌ Don't fix the isDisabled limitation (wire `disabled` into fieldStates) — that's out-of-scope feature work; the limitation is DOCUMENTED here and TRACKED in S2.
- ❌ Don't edit `useFieldDisabledState.ts`, `evaluate.ts`, or `Form.tsx` — root-cause/runtime files are READ-ONLY here.
- ❌ Don't create a `KNOWN_ISSUES.md` or project-level tracking doc — that's P1.M1.T2.S2's deliverable; creating it here duplicates/conflicts.
- ❌ Don't skip the ACTIVE passing tests (@1271 "should not disable result when only one source field is disabled"; the @1392 "multi-field isDisabled with mixed matchers" describe) — they pass today.
- ❌ Don't leave an uncommitted green mask — the green state must be COMMITTED (Issue 2's original sin was exactly an uncommitted mask over a red HEAD).
- ❌ Don't assume the suite is green without running it — re-run even if the skips look correct (a different test could have regressed).
- ❌ Don't touch `autosave-submit-immediate.test.tsx` — that's P1.M1.T1.S2's file (concurrent).
- ❌ Don't rewrite the skip comments if they're already accurate — verify the 3 root-cause points are present; rewrite only if stale/incomplete.
- ❌ Don't edit CHANGELOG/README — those are P1.M3.T1.

---

## Confidence Score

**10/10** — one-pass success likelihood.

Rationale: This is a verify-and-confirm subtask, and the hygiene work is already
committed. Live-source research during PRP authorship confirmed: (1) no probe
files exist anywhere (`find` empty, `git ls-files` empty); (2) the 5 isDisabled
tests are `it.skip(...)` with KNOWN LIMITATION comments at Field.test.tsx
1132/1172/1226/1308/1356; (3) `npx vitest run packages/react/src/__tests__/Field.test.tsx`
is green at 70 passed | 5 skipped. The architecture system_context.md explicitly
states "Issue 2 — ✅ HYGIENE DONE" at commit `1863b44`. The implementing agent's
task is mechanical: re-run the find/grep/vitest commands, confirm the state,
write the record. The expected outcome is "no drift, hygiene already complete."
The only failure mode is misidentifying an active passing test as a skip
candidate (mitigated by Task 2's explicit list of the 5 contract lines + the
warning about the active @1271/@1392 tests), or editing a runtime file in a
misguided attempt to "fix" the limitation (explicitly forbidden in the
anti-patterns + gotchas).
