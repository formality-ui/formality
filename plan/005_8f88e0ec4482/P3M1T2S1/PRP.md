name: "P3.M1.T2.S1 — Run full CI verification suite (v1.0 quality gate)"
description: |

---

## Goal

**Feature Goal**: Execute the **complete CI quality-gate suite** (the exact 6
steps from `.github/workflows/ci.yml` job `verify`) on the codebase as it stands
**after P1 + P2 + P3.M1.T1 (S1 core audit + S2 react audit) are complete**, and
**resolve every failure by fixing the root cause** — never by weakening a gate —
so that **all 6 steps exit green**. This is the final pre-release quality gate
that makes **v1.0 release-ready** from a CI perspective (feeds P3.M3.T1 version
bump).

This is a **verification + small-fix** task, NOT a feature build. There is no new
user-facing surface ("DOCS: none").

**Deliverable**: A codebase where **all 6 CI steps pass**, in order:

1. `pnpm lint` → exit 0
2. `pnpm format:check` → exit 0  ← **the one guaranteed fix: `pnpm format`**
3. `pnpm typecheck` → exit 0
4. `pnpm typecheck:examples` → exit 0
5. `pnpm test:coverage` → exit 0 (≥90% on statements/branches/functions/lines, §1.3.7)
6. `pnpm --filter @formality-ui/core --filter @formality-ui/react build` → exit 0

The only **concrete source change** this task is expected to make is the
`pnpm format` reformat of the prettier-violating test files (currently
`config.test.ts`, `validation.test.ts`, `useField.test.tsx`, and any S2-leftover).
Every other step is expected to already be green; if any is not, fix the **root
cause** (real code), never the gate.

**Success Definition**:
- All 6 steps above run green, **in CI order**, on the final tree.
- `git diff --stat` shows ONLY test-file prettier reformatting (the known format
  drift) plus, if S2 left it behind, deletion of the stray `debug-85.test.tsx`.
  No threshold/ignore/config loosening.
- Coverage gate **passes** with aggregate ≥90% (baseline ~97.29/94.73/99.13/97.29).
- No gate is skipped, `// eslint-disable`'d, `.prettierignore`'d, or
  `it.skip`'d to achieve green. The 63 `no-explicit-any` **warnings** (exit 0) are
  explicitly OUT OF SCOPE.

## User Persona (if applicable)

**Target User**: Formality maintainer performing the v1.0 release (P3.M3.T1) who
needs a single, authoritative "CI is green" sign-off before the version bump.

**Use Case**: Before tagging v1.0.0, run the full gate locally and confirm it
mirrors CI exactly; fix any drift introduced during P1/P2/P3.M1 so the release
PR is green on the first CI run.

**User Journey**: Run the 6 steps → `format:check` is the only failure →
`pnpm format` → re-run all 6 → all green → v1.0 is release-ready.

**Pain Points Addressed**: P1/P2/S1 commits were made locally without a
format-enforcing pre-commit hook, so prettier drift slipped into committed test
files. CI is the only enforcer; this task catches and fixes it before release.

## Why

- **v1.0 release gate.** P3.M3.T1 (version bump) requires a green CI. This task
  IS the local execution of that gate and the cleanup of any drift accumulated
  across P1 (core: ordering move, `validate()`/`mergeConfigs()` exports, JSDoc),
  P2 (react: useField extraction, orphan removal, overlays JSDoc), and P3.M1.T1
  (core + react PRD-compliance audits). It is the last quality checkpoint.
- **Catches the format drift S1 shipped.** S1's core audit commit (71ead92) and
  P2's useField work introduced prettier violations that no local hook caught.
- **Final guardrail for the coverage contract (§1.3.7).** Confirms the 90% gate
  holds on the final tree with all new audit tests included.

## What

Run the 6 CI steps **in order**. For each, either confirm green or fix the root
cause. The **only expected fix is `pnpm format`** for the prettier drift. If a
non-format step fails (e.g. S2's audit test is still red, or a real lint error),
investigate and fix the **real code** — never weaken the gate.

### Success Criteria

- [ ] `pnpm lint` → exit 0 (0 errors; 63 `no-explicit-any` warnings acceptable).
- [ ] `pnpm format:check` → exit 0 (after `pnpm format`).
- [ ] `pnpm typecheck` → exit 0.
- [ ] `pnpm typecheck:examples` → exit 0.
- [ ] `pnpm test:coverage` → exit 0, aggregate ≥90% on all 4 metrics.
- [ ] `pnpm --filter @formality-ui/core --filter @formality-ui/react build` → exit 0.
- [ ] `git diff --stat` shows only the expected prettier reformat (no
      threshold/ignore/skip changes; no edits to PRD/tasks/plan/config gates).
- [ ] `git diff --name-only` shows **no** edits to `packages/vue/**`,
      `packages/svelte/**` (stubbed/out of scope), `vitest.config.ts`,
      `eslint.config.mjs`, `.prettierignore`, or any orchestrator/human-owned file.

## All Needed Context

### Context Completeness Check

A developer who knows nothing about this codebase would need: the exact 6 CI
commands + their `package.json` script mappings, the empirically-verified
per-step baseline (which pass, which fail, why), the location/cause/fix of the
one guaranteed defect (prettier drift), the coverage config + healthy baseline
numbers, the parallel-S2 contract (what it delivers so this task's input is
well-defined), and the do-NOT list. All cited below with verified exit codes. ✅
Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — the empirical baseline (this task's research, verified by running the real commands)
- docfile: plan/005_8f88e0ec4482/P3M1T2S1/research/ci-baseline-verification.md
  why: |
    THE FIELD GUIDE. Per-step exit codes captured 2026-07-13 by executing the
    actual 6 CI commands. Documents: lint PASS (0 errors/63 warnings), format:check
    FAIL (3-4 prettier-violating files + the exact diff), typecheck PASS,
    typecheck:examples PASS, coverage gate HEALTHY (97.29/94.73/99.13/97.29) with
    test failures isolated to S2's WIP audit file, build PASS. Also documents the
    `scripts/**` coverage-exclude deviation (intentional, do not remove) and the
    stray debug-85.test.tsx. READ THIS FIRST.

# THE CI CONTRACT — the exact 6 steps this task must make green
- file: .github/workflows/ci.yml
  why: |
    Job `verify`, steps in order: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`,
    `pnpm typecheck:examples`, `pnpm test:coverage`,
    `pnpm --filter @formality-ui/core --filter @formality-ui/react build`. Node 20,
    pnpm from packageManager (8.15.0), `pnpm install --frozen-lockfile`.

# SCRIPT MAPPINGS (what each `pnpm <script>` actually runs)
- file: package.json
  why: |
    scripts: lint → "eslint ."; format → "prettier --write ."; format:check →
    "prettier --check ."; typecheck → "tsc --build"; typecheck:examples →
    "tsc -p examples/tsconfig.json --noEmit"; test:coverage → "vitest run --coverage";
    build → "pnpm -r build". `packageManager: pnpm@8.15.0`.

# COVERAGE GATE CONFIG (the §1.3.7 contract — do NOT change)
- file: vitest.config.ts
  why: |
    Root config holds coverage (resolved against workspace root). `provider: "v8"`;
    `exclude`: spreads `coverageConfigDefaults.exclude` then adds `examples/**`,
    `packages/svelte/**`, `packages/vue/**`, `**/dist/**`, AND `scripts/**` (the
    last is a DOCUMENTED intentional deviation — see the inline comment; do NOT
    remove it). `thresholds`: statements/branches/functions/lines all 90 (hard gate).
    CRITICAL GOTCHA: thresholds are AGGREGATE-only (no perFile:true). NEVER add
    `perFile: true` — it would fail CI on 0% type-only modules (types.ts, barrels).
- file: vitest.workspace.ts
  why: Wires `packages/core/vitest.config.ts` + `packages/react/vitest.config.ts`.
        Svelte/Vue excluded (stubbed, §1.3.7).

# FORMATTER / LINTER BOUNDARIES (what `pnpm format` will and won't touch)
- file: .prettierignore
  why: |
    Ignores `**/dist/`, `node_modules/`, `coverage/`, `*.tsbuildinfo`, `plan/`,
    `PRD.md`, `CHANGELOG.md`, `validate.sh`, `validation_report.md`. So `pnpm format`
    ONLY touches real source/test files — it will NOT reformat planning artifacts.
    Do NOT add anything here to make format:check pass (that's weakening the gate).
- file: eslint.config.mjs
  why: |
    Flat config. `@typescript-eslint/no-explicit-any` is a WARNING (not error) —
    that's why lint exits 0 despite 63 hits. Do NOT raise it to error or fix the 63
    (out of scope; would balloon the diff; not a gate failure).

# BUILD CONFIG
- file: tsconfig.json
  why: Root project references; `files: []`, references `packages/core` +
        `packages/react`. `pnpm typecheck` runs `tsc --build` over this graph.
- file: packages/core/tsup.config.ts   # + packages/react/tsup.config.ts
  why: tsup build (ESM+CJS+DTS). `pnpm --filter ... build` invokes these.

# PRD — the coverage contract this task must NOT weaken
- docfile: PRD.md §1.3.7 (heading:h4.6 "Testing Strategy") + Appendix checklist (heading:h3.102)
  why: |
    The ≥90% statements/branches/functions/lines gate, the exclusions
    (examples/**, packages/svelte/**, packages/vue/**), and the enforcement shape.
    This task VERIFIES the gate; it must not alter thresholds or exclusions.

# PARALLEL CONTEXT — what S2 (P3.M1.T1.S2) delivers; this task consumes it
- docfile: plan/005_8f88e0ec4482/P3M1T1S2/PRP.md
  why: |
    THE CONTRACT FOR THIS TASK'S INPUT. S2 delivers (react package):
    `src/__tests__/prd-compliance.audit.test.tsx` (passing audit gate incl. §8.5
    block) + `PRD_AUDIT.md`, and OPTIONALLY a ~6-line §8.5 handleSubmit fix in
    Form.tsx (with a document-deviation fallback). S2 does NOT fix the prettier
    drift in config.test.ts / validation.test.ts / useField.test.tsx (those are
    core-audit / P2 files, out of S2's scope) → that drift is THIS task's fix.
    Assumption at task start: S2 is COMPLETE and green. If S2's audit test is still
    RED at task time, that is incomplete S2 work — flag it, do not paper over it.
```

### Current Codebase tree (relevant slice — run `git status --short` first)

```bash
.github/workflows/ci.yml        # the 6-step verify job (the contract)
package.json                    # script mappings + packageManager pin
vitest.config.ts                # coverage gate (90% threshold + excludes) — DO NOT EDIT
vitest.workspace.ts             # core + react test projects
eslint.config.mjs               # lint config — DO NOT EDIT
.prettierignore / .gitignore    # boundaries
tsconfig.json                   # root project references (core + react)
packages/core/
  src/__tests__/config.test.ts        # ⚠️ prettier drift (from S1) — gets reformatted
  src/__tests__/validation.test.ts    # ⚠️ prettier drift (from S1) — gets reformatted
packages/react/
  src/__tests__/useField.test.tsx     # ⚠️ prettier drift (from P2) — gets reformatted
  src/__tests__/prd-compliance.audit.test.tsx  # S2 deliverable (must be green at task start)
  src/__tests__/debug-85.test.tsx     # S2 debug artifact — must be GONE at task start
  PRD_AUDIT.md                        # S2 deliverable (must exist at task start)
examples/                       # 9 example files (01–09) — typecheck:examples target
```

### Desired Codebase tree with files changed by this task

```bash
# The ONLY files this task is expected to modify (all via `pnpm format`):
packages/core/src/__tests__/config.test.ts        # prettier reformat (long object literals)
packages/core/src/__tests__/validation.test.ts     # prettier reformat
packages/react/src/__tests__/useField.test.tsx     # prettier reformat
# (If S2 left any test file unformatted, e.g. prd-compliance.audit.test.tsx, it gets
#  reformatted too — but that should already be clean when S2 completes.)
# Optional, only if S2 left it behind: DELETE packages/react/src/__tests__/debug-85.test.tsx
#
# NO new files are required ("DOCS: none"). The deliverable is the GREEN state + the diff.
# NO changes to vitest.config.ts, eslint.config.mjs, .prettierignore, tsconfig*, or any gate.
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL — this is a VERIFICATION task. The expected diff is prettier reformatting.
// Run the 6 steps in CI order; fix ONLY the root cause of any failure; never weaken a gate.

// CRITICAL — the ONE guaranteed defect is `pnpm format:check` failing on 3 COMMITTED test
// files (config.test.ts, validation.test.ts from S1; useField.test.tsx from P2). Root cause:
// long object literals on one line. Fix = `pnpm format` (prettier --write .). This is "fix the
// root cause, not the gate." Do NOT add these files to .prettierignore or relax format:check.

// CRITICAL — `pnpm lint` exits 0 despite 63 `no-explicit-any` hits because that rule is a
// WARNING in eslint.config.mjs, not an error. Warnings NEVER fail CI. Do NOT fix the 63, do NOT
// raise the rule to error — both are out of scope and would balloon the diff. Lint is GREEN.

// CRITICAL — the coverage gate is AGGREGATE-only. Baseline aggregate ~97.29/94.73/99.13/97.29
// (all ≥90). The only sub-90 substantive file is react usePropsEvaluation.ts (branch 72%), which
// does NOT fail the aggregate gate. NEVER add `perFile: true` to vitest.config.ts thresholds —
// it would fail CI on the 0% type-only modules (types.ts, barrel index.ts, typeAssertions/).

// CRITICAL — vitest.config.ts excludes `scripts/**` from coverage. This is a DOCUMENTED
// intentional deviation from PRD §1.3.7's literal exclude list (the inline comment explains:
// scripts/release.mjs is a one-off semantic-release driver, not shipped source). Do NOT remove
// `scripts/**` from the exclude list — doing so would drop the aggregate on untested infra noise.

// CRITICAL — `pnpm typecheck` runs `tsc --build` over the root tsconfig project graph
// (references packages/core + packages/react). It writes *.tsbuildinfo (gitignored). If you see
// stale errors after edits, the build cache is at .tsbuildcache/ + packages/*/tsconfig.tsbuildinfo;
// `pnpm typecheck` re-runs incrementally. Do NOT delete tsbuildinfo to "fix" a typecheck failure —
// fix the real type error. (Deleting it only forces a clean rebuild, masking nothing.)

// GOTCHA — `pnpm test:coverage` currently exits 1 ONLY because S2's WIP audit test
// (prd-compliance.audit.test.tsx) has 3 failing tests (ReferenceError: UnusedFields; submitImmediate
// undefined; +1). Those are S2's responsibility. At THIS task's start, S2 is COMPLETE → those pass.
// If they're still red at task time, STOP and flag incomplete S2 work; do NOT edit S2's audit logic
// (that's S2's scope) and do NOT skip the tests to go green.

// GOTCHA — `packages/react/src/__tests__/debug-85.test.tsx` is an S2 debug throwaway
// (describe("debug §8.5 timing")). It IS collected by vitest. S2 should delete it before completing.
// If it survives into this task, DELETE it (it pollutes the suite + git diff). Verify it's gone
// in the pre-flight (Task 1).

// GOTCHA — `pnpm format` respects `.prettierignore` (plan/, PRD.md, CHANGELOG.md, **/dist/,
// coverage/, *.tsbuildinfo). So `prettier --write .` will NOT touch planning artifacts or the
// spec. It only reformats real source/test files. Safe to run repo-wide.

// GOTCHA — build artifacts (packages/*/dist, coverage/, *.tsbuildinfo) are gitignored, so running
// `pnpm build` / `pnpm test:coverage` does NOT pollute `git status`. Confirm `git status --short`
// after the full run shows only the intended test-file reformats.

// CRITICAL — do NOT edit PRD.md, tasks.json, prd_snapshot.md, gap_analysis.md, plan/**,
// CHANGELOG.md, README.md, vitest.config.ts, eslint.config.mjs, .prettierignore, tsconfig.json,
// packages/*/tsconfig.json, or any packages/vue/** / packages/svelte/** file. You are verifying +
// reformatting test files, nothing else.

// PARALLEL WORK — S2 (P3.M1.T1.S2) owns the react audit. This task runs AFTER S2 completes and
// must not duplicate or conflict with S2's deliverables. The pre-flight (Task 1) confirms S2's
// outputs exist and are green before this task proceeds.
```

## Implementation Blueprint

### Data models and structure

None. No types, no runtime code, no config changes. The only writes are
prettier-reformatted test files (and an optional debug-file deletion).

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: PRE-FLIGHT — confirm the input state (S2 complete; baseline understood)
  - READ: plan/005_8f88e0ec4482/P3M1T2S1/research/ci-baseline-verification.md (THE field guide).
  - CONFIRM S2 is complete (this task's input prerequisite):
      test -f packages/react/PRD_AUDIT.md && echo "S2 report present" || echo "S2 INCOMPLETE — STOP"
      git ls-files --error-unmatch packages/react/src/__tests__/prd-compliance.audit.test.tsx \
        && echo "S2 audit test tracked" || echo "S2 audit test UNTRACKED — confirm S2 committed it"
      test ! -f packages/react/src/__tests__/debug-85.test.tsx && echo "debug-85 gone ✓" \
        || echo "debug-85 STILL PRESENT — delete it (S2 leftover)"
    # If S2 is genuinely incomplete (report missing OR audit test red for S2 reasons), STOP and
    # report — do NOT implement S2's work. This task assumes a complete S2.
  - CAPTURE the starting baseline (evidence):
      pnpm lint            2>&1 | tail -3 ; echo "lint exit: ${PIPESTATUS[0]}"
      pnpm format:check    2>&1 | tail -8 ; echo "format:check exit: ${PIPESTATUS[0]}"
      pnpm typecheck       2>&1 | tail -3 ; echo "typecheck exit: ${PIPESTATUS[0]}"
      pnpm typecheck:examples 2>&1 | tail -3 ; echo "typecheck:examples exit: ${PIPESTATUS[0]}"
    # Expected: lint 0; format:check 1 (the known defect); typecheck 0; typecheck:examples 0.
    # Record the actual format:check offender list (should be the 3 committed test files; the
    # S2 audit file must already be clean since S2 completed).

Task 2: FIX THE FORMAT DEFECT (Step 2) — the one guaranteed concrete fix
  - RUN: pnpm format
    # → "prettier --write ." — reformats the violating test files. .prettierignore protects
    #   plan/, PRD.md, CHANGELOG.md, dist/, coverage/, *.tsbuildinfo. Only source/test files change.
  - VERIFY: pnpm format:check ; echo "exit: ${PIPESTATUS[0]}"
    # Expected: exit 0, "All matched files use Prettier code style!" (no [warn] lines).
  - INSPECT the diff is ONLY formatting (no logic changes):
      git diff --stat
      git diff packages/core/src/__tests__/config.test.ts packages/core/src/__tests__/validation.test.ts packages/react/src/__tests__/useField.test.tsx
    # Expected: only whitespace/line-break changes (e.g. long object literals broken across
    #   lines — see the example diff in research/ci-baseline-verification.md §3). If prettier
    #   touched any NON-test file or made a semantic change, investigate before continuing.
  - ROOT-CAUSE PRINCIPLE: we reformatted the files. We did NOT add them to .prettierignore,
    did NOT change format:check, did NOT add ignores. The gate is intact and now passes.

Task 3: RUN THE REMAINING STEPS IN CI ORDER — verify green
  - STEP 1 (lint):        pnpm lint                ; echo "exit: ${PIPESTATUS[0]}"
    # Expected: exit 0 (0 errors). 63 `no-explicit-any` WARNINGS are fine — warnings ≠ failure.
    # If a real ERROR appears (not warning), fix the root cause in that source file.
  - STEP 3 (typecheck):   pnpm typecheck           ; echo "exit: ${PIPESTATUS[0]}"
    # Expected: exit 0. If errors, fix the real type error (do NOT delete tsbuildinfo to mask).
  - STEP 4 (examples):    pnpm typecheck:examples  ; echo "exit: ${PIPESTATUS[0]}"
    # Expected: exit 0. Examples use overlay types (§3.2.1); if it breaks, the §8.5/Form change
    # from S2 likely affected an exported type — fix the type, not the example.
  - STEP 5 (coverage):    pnpm test:coverage       ; echo "exit: ${PIPESTATUS[0]}"
    # Expected: exit 0. Confirm:
    #   (a) NO test failures — especially S2's prd-compliance.audit.test.tsx is fully green
    #       (S2's responsibility; if red, flag incomplete S2 — do NOT edit S2's logic, do NOT skip).
    #   (b) Coverage threshold PASS — the "All files" row shows stmts/branches/funcs/lines all
    #       ≥90 (baseline ~97.29/94.73/99.13/97.29). NO "does not meet threshold (90%)" message.
    # Record the "All files" row for the success evidence.
  - STEP 6 (build):       pnpm --filter @formality-ui/core --filter @formality-ui/react build
                          ; echo "exit: ${PIPESTATUS[0]}"
    # Expected: exit 0 — both packages emit ESM+CJS+DTS via tsup.

Task 4: FULL RE-RUN IN CI ORDER — the authoritative green proof
  - Run all 6 steps back-to-back exactly as CI does, capturing each exit code:
      for step in "pnpm lint" "pnpm format:check" "pnpm typecheck" \
                  "pnpm typecheck:examples" "pnpm test:coverage" \
                  "pnpm --filter @formality-ui/core --filter @formality-ui/react build"; do
        echo "=== $step ==="; sh -c "$step" >/tmp/ci.out 2>&1; echo "exit: $?"; tail -3 /tmp/ci.out
      done
    # Expected: EVERY step exit 0. This is the v1.0 release-ready sign-off.
  - FINAL scope check:
      git status --short
      git diff --stat
    # Expected: ONLY prettier-reformatted test files (config.test.ts, validation.test.ts,
    #   useField.test.tsx [+ any S2-leftover]) and, if applicable, the debug-85 deletion.
    # Confirm NO changes to: vitest.config.ts, eslint.config.mjs, .prettierignore, tsconfig*,
    #   PRD.md, tasks.json, plan/**, CHANGELOG.md, README.md, packages/{vue,svelte}/**.
  - If a step OTHER than format:check failed at any point:
    #   Fix the ROOT CAUSE (real source code). Re-run from the failed step. NEVER achieve green
    #   by: skipping a test, adding eslint-disable, adding .prettierignore, lowering a coverage
    #   threshold, or removing scripts/** from coverage exclude. If a failure is fundamentally
    #   out of scope (e.g. S2's audit logic), STOP and report to the human rather than fix-forward.

Task 5: (OPTIONAL) record the verification — only if a release-evidence artifact is desired
  - The contract says "DOCS: none" (no user-facing/config/API change). The PRIMARY deliverable
    is the green state + the format diff (captured by git). An OPTIONAL short evidence note may
    be appended to the task/commit message with the 6 exit codes + the "All files" coverage row.
  - Do NOT create a new repo-level doc file (would contradict "DOCS: none" and is not required).
```

### Implementation Patterns & Key Details

```bash
# PATTERN — "fix the root cause, not the gate" (the guiding principle of this task).
#   format:check fails  → reformat the files (pnpm format), NOT ignore them.
#   a test fails        → fix the code under test, NOT it.skip / lower threshold.
#   a type error occurs → fix the type, NOT delete tsbuildinfo / @ts-ignore.
#   lint warns          → (out of scope; warnings don't fail; leave them).
# This task is the embodiment of that principle for the v1.0 release gate.

# PATTERN — run steps in CI ORDER. CI aborts on the first failure, so order matters for
# reproducing CI exactly: lint → format:check → typecheck → typecheck:examples →
# test:coverage → build. The format:check fix (Task 2) must come before the full re-run (Task 4).

# PATTERN — capture exit codes explicitly. pnpm/vitest "Command failed with exit code 1" prints
# but the shell `$?` after a pipe reflects the LAST command (tail), not pnpm. Use
# `${PIPESTATUS[0]}` (bash) or run without a pipe into a log file and check `$?`. The research
# field guide shows this gotcha (the format:check failure's real exit is 1 even though a naive
# `echo $?` after `| tail` reads 0).

# COMMAND — the authoritative full-gate re-run (Task 4). Mirror CI exactly:
#   pnpm lint && pnpm format:check && pnpm typecheck && pnpm typecheck:examples \
#     && pnpm test:coverage && pnpm --filter @formality-ui/core --filter @formality-ui/react build
#   echo "ALL GATES exit: $?"   # expect 0
```

### Integration Points

```yaml
FILES CHANGED (this task — the only expected writes, all via `pnpm format`):
  - packages/core/src/__tests__/config.test.ts     # prettier reformat (S1 drift)
  - packages/core/src/__tests__/validation.test.ts # prettier reformat (S1 drift)
  - packages/react/src/__tests__/useField.test.tsx # prettier reformat (P2 drift)
  # + any S2-leftover unformatted test file (should already be clean post-S2)

FILE DELETED (only if S2 left it behind):
  - packages/react/src/__tests__/debug-85.test.tsx # S2 debug throwaway

FILES NOT TOUCHED (verify with git diff --name-only):
  - vitest.config.ts            # 90% threshold + excludes are the §1.3.7 contract
  - vitest.workspace.ts         # core + react projects
  - eslint.config.mjs           # no-explicit-any stays a warning
  - .prettierignore / .gitignore
  - tsconfig.json + packages/*/tsconfig.json + examples/tsconfig.json
  - PRD.md, tasks.json, prd_snapshot.md, gap_analysis.md, plan/**
  - CHANGELOG.md, README.md     # changeset-level docs sync is P3.M2 — out of scope
  - packages/vue/**, packages/svelte/**  # stubbed adapters, out of scope
  - All non-test source files   # no logic changes; this is verification + reformat

NO DATABASE / ROUTES / CONFIG — a verification + test-file-reformat task.
```

## Validation Loop

### Level 1: Each CI step green (the primary success check)

```bash
# Run in CI ORDER. Every step must exit 0.
pnpm lint            ; echo "lint=${PIPESTATUS[0]}"               # expect 0 (0 errors; warnings OK)
pnpm format:check    ; echo "format:check=${PIPESTATUS[0]}"       # expect 0 (after `pnpm format`)
pnpm typecheck       ; echo "typecheck=${PIPESTATUS[0]}"          # expect 0
pnpm typecheck:examples ; echo "examples=${PIPESTATUS[0]}"        # expect 0
pnpm test:coverage   ; echo "coverage=${PIPESTATUS[0]}"           # expect 0
pnpm --filter @formality-ui/core --filter @formality-ui/react build ; echo "build=${PIPESTATUS[0]}"  # expect 0
```

### Level 2: Coverage gate detail (§1.3.7 ≥90%)

```bash
pnpm test:coverage 2>&1 | grep -E "All files|does not meet|threshold"
# Expected: an "All files" row with stmts/branches/funcs/lines ALL ≥90
# (baseline ~97.29 / 94.73 / 99.13 / 97.29). NO "does not meet threshold (90%)" lines.
```

### Level 3: No test regressions + scope integrity

```bash
# Confirm the full suite (core + react, incl. S2's audit gate) is green:
pnpm test:coverage 2>&1 | grep -E "Test Files|Tests "
# Expected: 0 failed. (Counts: ~37 test files; ~1000+ tests, 5 skipped baseline.)

# Confirm the diff is ONLY formatting (+ optional debug-85 deletion):
git status --short
git diff --stat
git diff --name-only | grep -vE '\.test\.(ts|tsx)$|debug-85' && echo "UNEXPECTED NON-TEST CHANGE ↑" || echo "scope clean ✓"
# Expected: "scope clean ✓" — only test files changed (prettier) + debug-85 deletion if any.

# Confirm no gate was weakened:
git diff -- vitest.config.ts eslint.config.mjs .prettierignore | grep -E '^\+|^\-' && echo "GATE CHANGED ↑ (BAD)" || echo "gates untouched ✓"
# Expected: "gates untouched ✓".
```

### Level 4: Reproduce CI exactly (the release-ready proof)

```bash
# The single command that mirrors the CI verify job (minus install, which is local):
pnpm lint \
  && pnpm format:check \
  && pnpm typecheck \
  && pnpm typecheck:examples \
  && pnpm test:coverage \
  && pnpm --filter @formality-ui/core --filter @formality-ui/react build \
  && echo "✅ ALL 6 CI GATES GREEN — v1.0 release-ready"
# Expected: the final echo prints. This is the Definition of Done for this task.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: all 6 CI steps exit 0, run **in CI order**.
- [ ] Level 2: `pnpm test:coverage` "All files" row ≥90% on statements/branches/functions/lines;
      no "does not meet threshold" message.
- [ ] Level 3: `git diff --name-only` shows only test-file prettier reformats (+ optional
      debug-85 deletion); `git diff` on vitest.config.ts/eslint.config.mjs/.prettierignore is empty.
- [ ] Level 4: the chained 6-step command prints "ALL 6 CI GATES GREEN — v1.0 release-ready".

### Feature Validation (verification completeness)

- [ ] Pre-flight confirmed S2 complete (`packages/react/PRD_AUDIT.md` exists; S2 audit test tracked
      + green; `debug-85.test.tsx` gone).
- [ ] The prettier drift in `config.test.ts` / `validation.test.ts` / `useField.test.tsx` is fixed
      via `pnpm format` (root cause), NOT via ignore/skip.
- [ ] `pnpm test:coverage` shows S2's `prd-compliance.audit.test.tsx` fully green (no §8.5/§6/§12
      failures) — confirming the parallel S2 work landed cleanly.
- [ ] No gate was skipped, threshold-lowered, ignore-added, or `it.skip`'d to reach green.
- [ ] `pnpm lint` still exits 0 with the 63 `no-explicit-any` warnings (untouched — out of scope).

### Code Quality Validation

- [ ] `git diff --stat` is minimal (only test-file reformats + optional debug-85 deletion).
- [ ] No edits to `vitest.config.ts` thresholds/excludes, `eslint.config.mjs`, `.prettierignore`,
      `tsconfig*`, or any orchestrator/human-owned file.
- [ ] No edits to `packages/vue/**` or `packages/svelte/**` (stubbed, out of scope).
- [ ] The `scripts/**` coverage-exclude deviation is preserved (intentional, documented).
- [ ] Anti-patterns avoided (check against Anti-Patterns section).

### Documentation & Deployment

- [ ] No new user-facing doc files created ("DOCS: none" per contract).
- [ ] The green state is reproducible via the chained 6-step command (Level 4).
- [ ] Hand-off to P3.M3.T1 (version bump): CI is green; v1.0 is release-ready.

---

## Anti-Patterns to Avoid

- ❌ Don't **weaken a gate to reach green.** format:check failing → reformat the files
  (`pnpm format`); a test failing → fix the code; a type error → fix the type; coverage <90 →
  add tests. NEVER: add to `.prettierignore`, `it.skip`, `@ts-ignore`, lower a threshold, or
  remove `scripts/**` from coverage exclude. "Fix the root cause, not the gate" is THE principle.
- ❌ Don't **delete `*.tsbuildinfo` / `.tsbuildcache/` to "fix" a typecheck failure.** That only
  forces a clean rebuild; it masks nothing and the real error will resurface. Fix the type error.
- ❌ Don't **add `perFile: true` to the coverage thresholds.** It would fail CI on the 0%
  type-only modules (`types.ts`, barrel `index.ts`, `typeAssertions/`). The aggregate gate is the
  §1.3.7 contract.
- ❌ Don't **fix the 63 `no-explicit-any` lint warnings** or raise the rule to error. They are
  warnings (exit 0); CI passes. Touching them balloons the diff and is out of scope.
- ❌ Don't **remove the `scripts/**` coverage exclude.** It's a documented intentional deviation
  (see the inline comment in `vitest.config.ts`); removing it drops the aggregate on untested
  release-infra noise.
- ❌ Don't **implement S2's audit logic.** If S2's `prd-compliance.audit.test.tsx` is red at task
  time, that's incomplete S2 work — STOP and report. Do NOT edit S2's tests, do NOT skip them.
- ❌ Don't **run steps out of CI order and call it done.** CI aborts on first failure, so reproduce
  it exactly: lint → format:check → typecheck → typecheck:examples → test:coverage → build.
- ❌ Don't **rely on a naive `echo $?` after a pipe** to read a pnpm/vitest exit code — it reflects
  `tail`/`grep`, not pnpm. Use `${PIPESTATUS[0]}` or a log-file + `$?`. (This is exactly why the
  format:check failure can look like exit 0 if you check wrong.)
- ❌ Don't **edit PRD.md, tasks.json, prd_snapshot.md, gap_analysis.md, plan/**,
  CHANGELOG.md, README.md, vitest.config.ts, eslint.config.mjs, .prettierignore, tsconfig*, or any
  packages/vue/** / packages/svelte/** file.** You verify + reformat test files; nothing else.
- ❌ Don't **create a new release/doc file.** The contract says "DOCS: none." The deliverable is the
  green state + the format diff.
- ❌ Don't **skip the pre-flight.** If S2 is incomplete (report missing / audit test untracked / red),
  you're verifying a broken input — stop and report rather than paper over S2's gaps.

---

**Confidence Score: 10/10** for one-pass implementation success.

Rationale:
- This is a **verification + one mechanical fix** on a baseline I have **empirically verified by
  running the actual 6 CI commands** with captured exit codes (see
  `research/ci-baseline-verification.md`). There is no guesswork: 5 of 6 steps already pass
  (lint, typecheck, typecheck:examples, coverage-threshold, build); the single guaranteed defect is
  `pnpm format:check` failing on **3 committed test files**, whose fix is a single command
  (`pnpm format`) and whose diff is pure formatting (long object literals broken across lines).
- The coverage gate is **healthy** (aggregate ~97.29/94.73/99.13/97.29, all ≥90). The only current
  `test:coverage` exit 1 is from S2's WIP audit test, which is **S2's responsibility** and is
  contractually green by the time this task runs; the pre-flight (Task 1) detects and halts on any
  incomplete S2 state rather than fixing-forward.
- The principle ("fix the root cause, not the gate") and the exact do-NOT list (no perFile, no
  scripts-exclude removal, no warning-fixing, no gate weakening) are spelled out in bold across the
  Tasks, Gotchas, and Anti-Patterns, and guarded by `git diff --name-only` + the gates-untouched
  check.
- Every command is project-specific and verified executable; the final Level-4 chained command is a
  literal mirror of the CI `verify` job, giving an unambiguous Definition of Done
  ("ALL 6 CI GATES GREEN — v1.0 release-ready").
