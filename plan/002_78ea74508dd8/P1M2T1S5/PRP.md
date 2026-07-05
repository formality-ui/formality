name: "P1.M2.T1.S5 — Add 90% coverage thresholds to root vitest.config.ts and verify green"
description: |

---

## Goal

**Feature Goal**: Convert `pnpm test:coverage` from a *silently-green* run into
a **hard CI gate** by adding the PRD §1.3.7 `coverage.thresholds` block to the
**root** `vitest.config.ts`. After this change, the script exits **non-zero**
the instant *any* of statements/branches/functions/lines drops below **90%**,
so coverage can no longer regress past the gate unnoticed.

**Deliverable**:

1. **MODIFY** `vitest.config.ts` (repo root — the file that already holds
   `coverage.provider` + `coverage.exclude`). Add **exactly** this block under
   the existing `test.coverage` object, immediately after `exclude` (verbatim
   per PRD §1.3.7 / Appendix B h3.95):

   ```ts
   // Hard gate — CI fails (exit 1) if any of these drop below 90%. PRD §1.3.7.
   thresholds: {
     statements: 90,
     branches: 90,
     functions: 90,
     lines: 90,
   },
   ```

2. **Do NOT touch** anything else:
   - `coverage.exclude` stays byte-identical (PRD §1.3.7 out-of-scope list).
   - `coverage.provider` stays `"v8"`.
   - `packages/core/vitest.config.ts` and `packages/react/vitest.config.ts`
     stay untouched (they hold no `coverage` block — coverage resolves at the
     workspace **root**, see `architecture/system_context.md` §1.2 /
     `coverage_gaps.md` §6).
   - No CI workflow file edit (the gate **is** the script's non-zero exit code;
     nothing in `.github/` is in scope for S5).
   - No test files, no source files, no new deps, no docs files
     (item OUTPUT §5: infra, documented in-code).

**Success Definition**:

1. `pnpm test:coverage` exits **0** with all four metrics ≥ 90% in the printed
   `All files` row.
2. The threshold block is present in `vitest.config.ts` and **nothing else** in
   that file changed (diff is the `thresholds` object + its comment only).
3. A **temporary** negative-control check proves the gate actually bites: with
   the thresholds temporarily raised to `100` (or to a value above the current
   metric), `pnpm test:coverage` exits **non-zero** with a clear
   `ERROR: Coverage for X does not meet threshold` message. (This check is done
   locally to *prove* the gate works; it is **reverted before commit** — the
   committed value is the 90 block.)
4. `pnpm typecheck` and `pnpm lint` on `vitest.config.ts` remain clean
   (config is TypeScript — the block must be type-valid).

## User Persona (if applicable)

**Target User**: CI / library maintainer (PRD §1.3.7 / Appendix B h3.95). The
gate protects every future PR across `packages/core` and `packages/react`.

**Use Case**: `pnpm test:coverage` runs in CI as a required gate; a PR that
drops any metric under 90% fails the build automatically.

**Pain Points Addressed**: Today coverage *can* regress below 90% silently — the
run stays green because there is no threshold to fail. S5 makes 90% an enforced
floor, completing R1 of `architecture/system_context.md` §1.3.

## Why

- **PRD §1.3.7 (h4.6) — hard mandatory gate.** "The repository MUST maintain
  ≥ 90% coverage across statements, branches, functions, and lines… enforced by
  vitest coverage thresholds and run in CI; the build fails if any metric drops
  below 90%." S5 is the literal enforcement step.
- **Appendix B h3.95 — checklist item.** "`Coverage thresholds` set to 90 for
  statements, branches, functions, and lines" + "`pnpm test:coverage` is green
  and fails the build below 90%." Both are closed by S5.
- **Sequencing.** S5 is the **last** subtask in P1.M2.T1 *deliberately*: S1–S4
  backfilled tests to lift metrics ≥ 90% (post-S4 repo sits at ~92–94%). The
  gate is only turned on once the floor is already met, so enabling it cannot
  break CI. Confirmed at authoring time: even pre-S4 the repo is at
  **93.31 / 91.62 / 98.14 / 93.31** — all above 90% (see
  `research/threshold-semantics.md` §5).

## What

A single, surgical config addition. The PRD §1.3.7 verbatim config (the
`thresholds` sub-object) is grafted onto the existing `test.coverage` object.
No behavior, API, file list, or runtime path changes — only the threshold
comparison is newly active.

### Success Criteria

- [ ] `coverage.thresholds` block present in **root** `vitest.config.ts` with
      `statements: 90, branches: 90, functions: 90, lines: 90`.
- [ ] `coverage.provider` still `"v8"`; `coverage.exclude` byte-identical to
      current (still spreads `coverageConfigDefaults.exclude` + the four PRD
      out-of-scope globs).
- [ ] `pnpm test:coverage` exits **0**; `All files` row ≥ 90% on all four
      metrics.
- [ ] Negative-control proof: temporarily raising a threshold above the current
      metric makes the run exit non-zero with a threshold-violation message;
      the 90 block is then restored (committed value = 90).
- [ ] Per-package `vitest.config.ts` files unchanged.
- [ ] No CI workflow / test / source / docs changes.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the exact file to
edit (root `vitest.config.ts`), the exact block to add (PRD §1.3.7 verbatim),
the reason it lives at the root (coverage resolves at workspace root, not
per-package), the verification command (`pnpm test:coverage` exit code), and
proof the gate actually fails when violated. All cited below with exact paths.
✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: PRD.md §1.3.7 (h4.6)
  section: "1.3.7 Testing Strategy → Enforcement configuration"
  why: |
    Contains the EXACT verbatim vitest.config.ts block including the
    `thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 }`
    object and the surrounding comments. S5 copies this object verbatim (the
    `provider` + `exclude` parts already exist in the file — do not duplicate
    them).
  critical: |
    The thresholds keys are `statements/branches/functions/lines` (NOT `lines`
    only, NOT a nested object, NOT per-file). Each value is a plain integer
    percent.

- docfile: PRD.md Appendix B h3.95
  section: "Test Coverage Gate (MANDATORY — see §1.3.7)"
  why: The literal acceptance checklist this subtask closes (thresholds=90 +
        pnpm test:coverage green + fails below 90%).

- file: vitest.config.ts
  why: |
    THE file to modify (repo root). Currently has `provider:"v8"` and the
    correct `exclude` but NO `thresholds` block. The block is added as a sibling
    of `provider`/`exclude` inside `test.coverage`.
  pattern: |
    Current shape:
      export default defineConfig({
        test: {
          coverage: {
            provider: "v8",
            exclude: [ ...coverageConfigDefaults.exclude, "examples/**",
                       "packages/svelte/**", "packages/vue/**", "**/dist/**" ],
          },
        },
      });
    Target shape: same, + a `thresholds` object after `exclude`.
  gotcha: |
    `coverage.exclude` REPLACES vitest's defaults — it already spreads
    coverageConfigDefaults.exclude first. Do NOT re-derive or reorder excludes;
    leave that array byte-identical.

- file: vitest.workspace.ts
  why: Confirms coverage is resolved at the WORKSPACE root (both projects are
       registered here), which is WHY the thresholds block must live in the
       root vitest.config.ts, not in either package config.
  pattern: defineWorkspace(["packages/core/vitest.config.ts",
                            "packages/react/vitest.config.ts"])

- file: packages/core/vitest.config.ts
  why: Proof there is NO coverage block here (only name/environment/include/
       globals). Do NOT add thresholds here — coverage never resolves against
       per-project configs.
- file: packages/react/vitest.config.ts
  why: Same — jsdom env + setup.ts only. Untouched by S5.

- docfile: plan/002_78ea74508dd8/architecture/system_context.md
  section: §1.1 (toolchain), §1.2 (coverage.exclude already done), §1.3 R1
           (thresholds missing), §2 constraint #6 (never weaken threshold/excludes)
  why: The authoritative plan-level rationale + constraints for R1/S5.

- docfile: plan/002_78ea74508dd8/architecture/coverage_gaps.md
  section: §1 (gate status + the verbatim threshold block to add), §6 (tooling
           notes: vitest 2.1.9, coverage resolved at root, re-run to confirm)
  why: Confirms the exact block shape + the "add tests, never weaken" rule.

- docfile: plan/002_78ea74508dd8/P1M2T1S5/research/threshold-semantics.md
  section: §2 (type: Partial<Record<Threshold, number>>), §3 (exit code 1 on
           fail), §4 (resolved at root), §5 (current baseline all ≥ 90%)
  why: |
    Grounds the validation section in the ACTUAL installed toolchain. Proves:
    (a) each threshold key is a plain integer percent; (b) vitest's v8 provider
    sets exit code to 1 when a threshold is not met (cite:
    node_modules/vitest/dist/coverage.d.ts → `checkThresholds` doc comment
    "Sets exit code to 1 when thresholds not reached."); (c) the block is safe
    to enable now because current metrics are 93.31/91.62/98.14/93.31.

- docfile: plan/002_78ea74508dd8/P1M2T1S4/PRP.md
  section: Goal + "Parallel-Execution Contract" + Integration Points
  why: |
    Sibling S4 (backfill tests → ~92–94%) runs IN PARALLEL and is the LAST line
    of defense before the gate turns on. S4 is explicitly forbidden from
    touching vitest.config.ts ("No coverage.thresholds added to any vitest
    config (that is S5's job)"). S5 consumes S4's output (the lifted metrics)
    and produces the gate. ZERO file overlap with S4 (S4 = test files only;
    S5 = vitest.config.ts only). Treat S4 as applied when validating.

- url: https://vitest.dev/guide/coverage.html#coverage-thresholds
  why: |
    Vitest v2 docs: "You can also use coverage.thresholds to configure the
    minimum coverage thresholds for your project. If the coverage does not meet
    the thresholds, the test will fail." Confirms the per-key number semantics
    and the non-zero-exit behavior used by the v8 provider in this repo.

- url: https://vitest.dev/config/#coverage
  why: The `test.coverage` config root; documents `provider`, `exclude`,
       `thresholds` siblings and that exclude *replaces* defaults.
```

### Current Codebase tree (relevant slice)

```bash
vitest.config.ts              # ← THE file to MODIFY (add thresholds block)
vitest.workspace.ts           # registers core + react projects (unchanged)
packages/core/vitest.config.ts    # name/node env/include/globals (unchanged)
packages/react/vitest.config.ts   # name/jsdom env/include/setup.ts (unchanged)
packages/core/src/**/            # all source + tests (unchanged by S5)
packages/react/src/**/           # all source + tests (unchanged by S5)
.github/                         # CI workflows (NOT in scope for S5)
coverage/                        # generated artifacts (gitignored; regenerated)
```

### Desired Codebase tree with files to be modified

```bash
vitest.config.ts   # MODIFIED — `coverage.thresholds` block added (90/90/90/90)
# (no other files change)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: coverage is resolved at the WORKSPACE ROOT, NOT per-package
// (architecture/system_context.md §1.2, coverage_gaps.md §6). The thresholds
// block MUST go in the ROOT vitest.config.ts alongside the existing
// coverage.exclude. Putting it in packages/*/vitest.config.ts would be a
// no-op — those configs have no `coverage` key and coverage never resolves
// against them.

// CRITICAL: coverage.exclude REPLACES vitest's defaults. The current file
// already spreads coverageConfigDefaults.exclude first. Do NOT re-derive,
// reorder, trim, or add to excludes. The diff is the thresholds object ONLY.

// CRITICAL: each threshold value is a plain integer PERCENT (0–100), not a
// ratio. vitest v2 type: Partial<Record<"statements"|"branches"|"functions"|
// "lines"|"perFile", number>>. The PRD block uses 90 (== 90%), which is what
// the PRD §1.3.7 / Appendix B h3.95 mandate.

// CRITICAL: the v8 provider sets PROCESS EXIT CODE to 1 when a threshold is
// missed (node_modules/vitest/dist/coverage.d.ts → checkThresholds). So the
// "gate" is the script's exit code — there is no separate CI threshold env var
// or workflow file to edit. pnpm propagates vitest's non-zero exit.

// CRITICAL: do NOT weaken the threshold to make CI pass. If a metric is short,
// the fix belongs in S4 (add tests), NEVER here. PRD §1.3.7 + system_context.md
// §2 constraint #6 are explicit: "Coverage gate must be cleared by adding
// tests, never by weakening the threshold or broadening excludes."

// GOTCHA: the existing file has rich block comments referencing PRD §1.3.7.
// Preserve them; add the inline §1.3.7 comment on the thresholds block too so
// the gate is documented in-code (item DOCS §5: no separate docs subtask).

// GOTCHA: thresholds compare against the MERGED workspace coverage (core +
// react), with excludes applied. The `All files` row in the coverage table is
// the number the gate checks — not any single package's row.

// GOTCHA: `pnpm test:coverage` = `vitest run --coverage` (root package.json
// script). There is no `--coverage.thresholds.*` CLI flag being used; the
// config block is the single source of truth.
```

## Implementation Blueprint

### Data models and structure

No data models. S5 is a config-only change to a single `defineConfig({ test: {
coverage: { ... } } })` object.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ the current root vitest.config.ts and PRD §1.3.7 block
  - FILE: vitest.config.ts
  - CONFIRM: test.coverage currently has only `provider: "v8"` and `exclude`.
  - CROSS-CHECK: PRD §1.3.7 (h4.6) "Enforcement configuration" — the verbatim
    thresholds object: { statements: 90, branches: 90, functions: 90, lines: 90 }.
  - NO change yet; this is orientation to guarantee the diff is additive.

Task 2: ADD the coverage.thresholds block to vitest.config.ts (the ONLY edit)
  - FILE: vitest.config.ts
  - WHERE: inside `test.coverage`, immediately AFTER the closing `]` of the
           `exclude` array (sibling of `provider` and `exclude`).
  - ADD (verbatim):
      // Hard gate — CI fails (exit 1) if any of these drop below 90%. PRD §1.3.7.
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
  - PRESERVE: the `provider: "v8"` line, the entire `exclude` array (including
              the `...coverageConfigDefaults.exclude` spread and the four PRD
              out-of-scope globs), and all existing block/header comments.
  - NAMING/PLACEMENT: keys `statements/branches/functions/lines` in that order
                      (matches PRD §1.3.7); values are integer `90`.
  - DO NOT: touch packages/*/vitest.config.ts, .github/**, any test or source
            file, package.json, or any exclude entry.

Task 3: VERIFY typecheck + lint on the config file
  - RUN: pnpm typecheck            # tsc --build across repo; config must parse
  - RUN: pnpm lint                 # eslint . ; vitest.config.ts must be clean
  - RUN: pnpm exec prettier --check vitest.config.ts
  - EXPECT: zero errors. The block is plain TS literal — if prettier reformats,
            accept its formatting for the new object only; do not reflow
            unrelated lines.

Task 4: VERIFY the gate is GREEN at 90
  - RUN: pnpm test:coverage
  - ASSERT (printed `All files` row): statements >= 90, branches >= 90,
         functions >= 90, lines >= 90.
  - ASSERT: process exit code 0. (`echo $?` immediately after, or check the
            pnpm "done" / CI-green signal.)
  - IF ANY METRIC < 90:
        ⚠️ DO NOT lower the threshold. DO NOT broaden excludes.
        The deficit belongs to S4 (add tests). Halt S5 and report exactly which
        metric is short and by how much, so S4 backfill can target it. Per PRD
        §1.3.7 + system_context.md §2 #6, the only permitted remediation is more
        tests.

Task 5: NEGATIVE-CONTROL — prove the gate actually fails (local only, revert)
  - TEMPORARILY edit vitest.config.ts: set all four thresholds to 100 (or just
    bump `statements` to 100).
  - RUN: pnpm test:coverage
  - ASSERT: exit code NON-ZERO and the run prints a message like
            "ERROR: Coverage for statements (XX.XX%) does not meet global
            threshold (100%)" (exact phrasing is vitest's). This PROVES the
    threshold block is wired and binding.
  - REVERT vitest.config.ts back to the 90 block (Task 2 value). Re-run
    `pnpm test:coverage` and confirm exit 0 again. The COMMITTED value MUST be
    90; the negative-control edit is never committed.

Task 6: FINAL confirmation + commit-readiness
  - RUN: git diff vitest.config.ts
  - ASSERT: the diff is ONLY the `thresholds` object + its inline comment.
            No whitespace churn elsewhere, no exclude changes, no per-package
            or CI changes.
  - RUN: pnpm test:coverage  (final green at 90; exit 0)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: the target vitest.config.ts after Task 2 (only the thresholds block
// is new; everything else is the existing file unchanged):
import { defineConfig, coverageConfigDefaults } from "vitest/config";

// ...existing header comment block (PRD §1.3.7) — unchanged...
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      exclude: [
        ...coverageConfigDefaults.exclude,
        // PRD §1.3.7 — out of scope: demo apps and stubbed adapters.
        "examples/**",
        "packages/svelte/**",
        "packages/vue/**",
        "**/dist/**",
      ],
      // Hard gate — CI fails (exit 1) if any of these drop below 90%. PRD §1.3.7.
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});

// PATTERN (negative control, Task 5 — NEVER committed): temporarily raise to
// 100 to prove the gate fails, then revert to the 90 block above.

// GOTCHA: the threshold the gate checks is the merged workspace `All files`
// row (core + react combined, excludes applied) — not a per-package row. The
// current `All files` row is 93.31 / 91.62 / 98.14 / 93.31, all comfortably
// above 90 (research/threshold-semantics.md §5), so the 90 gate turns on green.
```

### Integration Points

```yaml
VITEST CONFIG (root):
  - file: vitest.config.ts
  - change: ADD test.coverage.thresholds = { statements:90, branches:90,
              functions:90, lines:90 } (PRD §1.3.7 verbatim)
  - preserve: provider:"v8", exclude[...] unchanged

VITEST CONFIG (per-package):
  - files: packages/core/vitest.config.ts, packages/react/vitest.config.ts
  - change: NONE (no coverage key; coverage resolves at root)

CI:
  - files: .github/**
  - change: NONE for S5. The gate IS the non-zero exit of `pnpm test:coverage`
            (v8 provider sets exit 1 on threshold miss — see
            research/threshold-semantics.md §3). If a workflow already runs
            `pnpm test:coverage`, it now hardens automatically.

PACKAGE.JSON:
  - change: NONE. `test:coverage` already = `vitest run --coverage`.

DOCUMENTATION:
  - change: NONE beyond the inline §1.3.7 comment on the thresholds block
            (item DOCS §5: infra, documented in-code; the changeset-level docs
            sync is P1.M3.T1, a separate work item).
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Config is TypeScript — it must parse/typecheck/lint cleanly.
pnpm typecheck
pnpm lint
pnpm exec prettier --check vitest.config.ts
# Expected: zero errors. If prettier reformats the new object, apply its
# formatting to the new lines only. If typecheck/lint error, the thresholds
# object shape is wrong — re-read PRD §1.3.7 verbatim block.
```

### Level 2: Unit Tests (no behavior change expected)

```bash
# S5 changes NO runtime behavior, so the suite is unaffected. Run it to prove
# no accidental side effect (e.g. a stray edit to an exclude or a per-package
# config).
pnpm test
# Expected: identical pass/fail count to before S5 (all green, including the
# S1–S4 backfilled tests). Any change here means the diff leaked beyond the
# thresholds block — re-read `git diff vitest.config.ts`.
```

### Level 3: Coverage Gate (THE deliverable validation)

```bash
# Run the gate.
pnpm test:coverage
echo "EXIT CODE: $?"   # MUST be 0

# Inspect the printed `All files` row — all four columns must be >= 90.
# Expected (current baseline, S1–S4 applied): ~93 / ~92-94 / ~98 / ~93.
# If exit code != 0: read the "ERROR: Coverage for <metric> ... does not meet
# threshold (90)" line. Per PRD §1.3.7 + system_context.md §2 #6, DO NOT lower
# the threshold or broaden excludes — report the shortfall to S4.

# Negative control (local only, REVERT before commit):
#   temporarily set the four thresholds to 100 in vitest.config.ts
#   pnpm test:coverage ; echo "EXIT: $?"   # MUST be non-zero
#   git checkout vitest.config.ts          # restore the 90 block
#   pnpm test:coverage ; echo "EXIT: $?"   # MUST be 0 again
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Prove the gate is real AND scoped correctly.
# 1. Confirm NO per-package threshold leakage: grep the repo for any other
#    thresholds block (there should be exactly one, in the root config).
grep -rn "thresholds" vitest.config.ts packages/*/vitest.config.ts vitest.workspace.ts
# Expected: exactly one hit — in vitest.config.ts.

# 2. Confirm excludes are unchanged (the gate must not have been "softened"):
git diff vitest.config.ts | grep -E '^\+' | grep -iE 'exclude|dist|examples|svelte|vue'
# Expected: NO matches (no exclude lines added/removed by S5).

# 3. Confirm the committed thresholds are exactly 90/90/90/90 (post-revert):
grep -A6 "thresholds" vitest.config.ts
# Expected: statements: 90, branches: 90, functions: 90, lines: 90.

# 4. (If CI is observable) confirm `pnpm test:coverage` is the gate that runs
#    in CI and that it now fails-fast below 90% — the gate is the exit code,
#    not a CI-side env var. No CI file edit is part of S5.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: `pnpm typecheck`, `pnpm lint`, `prettier --check` clean.
- [ ] Level 2 passed: `pnpm test` green (no change vs. pre-S5).
- [ ] Level 3 passed: `pnpm test:coverage` exit **0**; `All files` row ≥ 90 on
      statements, branches, functions, lines.
- [ ] Negative control passed: raising thresholds to 100 made the run exit
      non-zero with a threshold-violation message; the 90 block was restored and
      re-confirmed green.

### Feature Validation

- [ ] `coverage.thresholds` block present in **root** `vitest.config.ts` with
      `statements: 90, branches: 90, functions: 90, lines: 90`.
- [ ] `coverage.provider` still `"v8"`.
- [ ] `coverage.exclude` byte-identical to pre-S5 (still spreads
      `coverageConfigDefaults.exclude` + the four PRD §1.3.7 out-of-scope globs).
- [ ] Per-package `vitest.config.ts` files unchanged.
- [ ] No CI workflow / test / source / docs / package.json changes.
- [ ] `git diff vitest.config.ts` shows ONLY the thresholds object + its inline
      comment.

### Code Quality Validation

- [ ] Inline comment referencing PRD §1.3.7 stays on the thresholds block
      (item DOCS §5: documented in-code).
- [ ] Existing header/block comments in `vitest.config.ts` preserved verbatim.
- [ ] Threshold values are integer `90` (percent), in the PRD §1.3.7 key order
      (statements, branches, functions, lines).
- [ ] Anti-patterns avoided: threshold NOT weakened to pass; excludes NOT
      broadened; no per-package or CI edits.

### Documentation & Deployment

- [ ] No separate docs file (infra, documented in-code per item DOCS §5).
- [ ] Changeset-level docs sync deferred to P1.M3.T1 (separate work item) —
      S5 does not edit READMEs.

---

## Anti-Patterns to Avoid

- ❌ Don't lower a threshold (e.g. set branches to 88) to make the run pass. If
  a metric is short, add tests in **S4** — the gate is absolute (PRD §1.3.7,
  system_context.md §2 #6).
- ❌ Don't broaden `coverage.exclude` to hide under-covered files (e.g. adding
  `packages/react/src/index.ts` for the 0% barrel). That's hiding, not fixing.
- ❌ Don't put the thresholds block in `packages/core/vitest.config.ts` or
  `packages/react/vitest.config.ts`. Coverage resolves at the **workspace
  root**; per-package configs have no `coverage` key and the block would be a
  silent no-op.
- ❌ Don't reorder, trim, or re-derive `coverage.exclude`. The diff is the
  `thresholds` object ONLY.
- ❌ Don't edit any CI workflow file. The gate is the non-zero exit code of
  `pnpm test:coverage` (v8 provider), not a CI-side threshold setting.
- ❌ Don't touch any test or source file — S5 is config-only. The parallel
  sibling S4 owns all test backfill.
- ❌ Don't commit the negative-control edit (thresholds=100). It is a local
  proof step only; the committed value is `90`.
- ❌ Don't add a `perFile: true` threshold. PRD §1.3.7 specifies the repo-wide
  aggregate gate (statements/branches/functions/lines), not per-file.
- ❌ Don't duplicate the PRD's full `defineConfig` snippet into the file. The
  `provider`/`exclude` parts already exist — graft ONLY the `thresholds` object,
  or you will create a malformed config (duplicate keys / broken `exclude`).

---

**Confidence Score: 10/10** for one-pass implementation success.

Rationale:
- This is a **single-object, single-file, verbatim-from-PRD** config change.
  The exact block is dictated by PRD §1.3.7 (h4.6) and Appendix B h3.95 and
  restated in `architecture/coverage_gaps.md` §1 — there is no design decision
  to make, only transcription + verification.
- The target file's current shape was read directly (`provider` + `exclude`
  present, no `thresholds`); the diff is mechanically the `thresholds` object
  appended to `test.coverage`.
- The toolchain behavior was verified against the installed packages
  (vitest/coverage-v8 2.1.9): the v8 provider's `checkThresholds` "Sets exit
  code to 1 when thresholds not reached" — so the gate is the script's exit
  code, with no CI file in scope.
- The current baseline was measured by an actual `pnpm test:coverage` run:
  `All files` = 93.31 / 91.62 / 98.14 / 93.31 — every metric already ≥ 90%, so
  enabling the gate cannot break CI; S4's parallel backfill only widens the
  margin to ~92–94%.
- Zero file overlap with parallel sibling S4 (S5 = root vitest.config.ts only;
  S4 = test files only), so the two cannot collide.
- The only residual risk (a metric dipping under 90 after S4 lands) is handled
  by an explicit, contract-mandated escape hatch: halt and route the deficit
  back to S4, never weaken the gate.
