name: "P1.M1.T1.S1 — Switch CI test step to the coverage-gated run"
description: |

---

## Goal

**Feature Goal**: Restore the PRD §1.3.7 mandatory 90% coverage gate by making
the CI `verify` job invoke `pnpm test:coverage` (which computes coverage AND
enforces the vitest `thresholds`) instead of `pnpm test` (which does neither).

**Deliverable**: A one-line edit to `.github/workflows/ci.yml` — the
`- run: pnpm test` step (line 38) becomes `- run: pnpm test:coverage`.
**No other file changes.** The `thresholds` block in `vitest.config.ts` is the
single source of truth and must NOT be touched.

**Success Definition**:
1. `.github/workflows/ci.yml` `verify` job runs `pnpm test:coverage` (not `pnpm test`).
2. Step ordering, the build step, and all other steps are unchanged.
3. `vitest.config.ts` `thresholds` block is byte-for-byte intact.
4. `release.yml` is untouched (it only builds + publishes via changesets).
5. Local validation proves the gate actually fires:
   - `pnpm test:coverage` exits 0 at current coverage (97.29%/95.56%/99.07%/97.29%).
   - Regression proof: temporarily raising one threshold to 99 makes
     `pnpm test:coverage` exit non-zero while `pnpm test` still exits 0 — then
     REVERT the threshold.

## User Persona

**Target User**: Maintainers and contributors of `formality` — and the CI
system itself. This is infrastructure, not an end-user feature.

**Use Case**: A contributor opens a PR that accidentally deletes test suites
or lands untested code. CI must turn RED, not green.

**Pain Points Addressed**: Today CI runs `pnpm test` (= `vitest run`, no
`--coverage`), so vitest never computes coverage and never evaluates the
`thresholds` block. The 90% gate is completely inert in the only place
enforcement matters — a sub-90% regression merges green, silently undoing the
protection P1.M2 was meant to deliver.

## Why

- **Business value**: Makes an explicit PRD "MUST"/"build fails" requirement
  actually enforced. Without this, the entire P1.M2 milestone ("Coverage gate —
  90% **enforced** and green") is satisfied only on a developer's laptop.
- **Integration**: This is a pure configuration fix layered on top of the
  already-correct `thresholds` block (P1.M2.T1.S5). It changes no runtime
  behavior, no source code, and no test logic.
- **Scope boundary**: This subtask is the **minimal** one-line fix. Out of scope
  (track separately): provider caching, and the `pnpm typecheck:examples` CI
  step (that's P1.M2.T3.S1, a sibling task). The README narrative update is
  deferred to the final Mode-B doc task P1.M2.T4.S1.

## What

In `.github/workflows/ci.yml`, in the `verify` job, replace exactly:

```diff
-      - run: pnpm test
+      - run: pnpm test:coverage
```

That's the entire change. The `pnpm test:coverage` script already exists in
root `package.json` as `vitest run --coverage`, and vitest's `thresholds`
block in `vitest.config.ts` (`{ statements: 90, branches: 90, functions: 90,
lines: 90 }`) does the enforcement. Vitest only evaluates thresholds when
coverage is enabled, so switching the invoked script is the complete fix.

### Success Criteria

- [ ] `.github/workflows/ci.yml` `verify` job step reads `- run: pnpm test:coverage`.
- [ ] No other CI step added, removed, or reordered.
- [ ] `vitest.config.ts` `thresholds` block unchanged.
- [ ] `release.yml` unchanged.
- [ ] Local proof captured: `pnpm test:coverage` exits 0; regression-raise to 99 → non-zero, then reverted.

## All Needed Context

### Context Completeness Check

_Pass._ This is a single-line YAML edit. All inputs are verified below with
exact current content and line numbers. No prior codebase knowledge is needed
beyond "replace this one line in this one file."

### Documentation & References

```yaml
# MUST READ
- url: Bug-fix Issue 1 (plan/002_78ea74508dd8/bugfix/001_707393fb1b38 — heading:h2.1/h3.0)
  why: The authoritative statement of the defect + the exact suggested diff.
  critical: "The existing thresholds block already fails the run below 90%, so this one-line change restores the PRD §1.3.7 guarantee."

- url: PRD §1.3.7 "Testing Strategy"
  why: The governing requirement being restored.
  critical: "Mandatory coverage gate (90%)… run in CI (`pnpm test:coverage`)… the build fails if any metric drops below 90%."

- docfile: plan/002_78ea74508dd8/bugfix/001_707393fb1b38/architecture/ci_coverage_gate.md
  why: Verified-current-state report for this exact fix (root cause + validation strategy).
  section: "Verified current state" + "Why no new test is needed / how to validate"
  critical: Confirms thresholds block is correct and must NOT be touched; the only defect is the CI invocation.

- file: .github/workflows/ci.yml
  section: "job `verify`, step on line 38: `- run: pnpm test`"
  why: THE file and THE line to edit.
  pattern: Steps are bare `- run: <script>` entries (lint, typecheck, test) followed by the build step.
  gotcha: Preserve exact 6-space indentation under `steps:`. Keep the step in its current position
          (after `pnpm typecheck`, before `Build core + react`). Do NOT reorder.

- file: .github/workflows/release.yml
  section: lines 45-57
  why: Confirms release.yml only runs `pnpm install` + `pnpm build` + changesets — NO test step.
  critical: Do NOT add `pnpm test:coverage` here. Release intentionally does not run tests.

- file: package.json
  section: "scripts (lines 10-12)"
  why: Confirms the script names — `"test": "vitest run"` vs `"test:coverage": "vitest run --coverage"`.
  critical: The `test:coverage` script ALREADY EXISTS. Do not create it; only invoke it from CI.

- file: vitest.config.ts
  section: "coverage.thresholds (lines 27-31)"
  why: The single source of truth for the 90% gate.
  pattern: "thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 }"
  gotcha: DO NOT touch this file. Do NOT duplicate threshold logic into CI YAML.
```

### Current Codebase tree (relevant slice)

```bash
.github/workflows/
  ci.yml          # ← EDIT HERE: line 38, `pnpm test` → `pnpm test:coverage`
  release.yml     # DO NOT TOUCH (no test step; only build + changeset publish)
package.json      # scripts.test + scripts.test:coverage already defined (lines 10-12)
vitest.config.ts  # coverage.thresholds = 90/90/90/90 (lines 27-31) — DO NOT TOUCH
```

### Desired Codebase tree with files to be added

```bash
.github/workflows/
  ci.yml          # MODIFIED — one line (the test step now runs :coverage)
# (no files added; no files removed)
```

### Known Gotchas of our codebase & Library Quirks

```yaml
# CRITICAL: Vitest only evaluates the `thresholds` block when coverage is ENABLED.
#   `pnpm test`  → vitest run          → NO coverage, NO threshold check (silently green).
#   `pnpm test:coverage` → vitest run --coverage → computes coverage + enforces thresholds.
# The entire defect is that CI invoked the former; the fix is to invoke the latter.

# CRITICAL: vitest.config.ts is the SINGLE source of truth for thresholds.
#   Do NOT add `--coverage.thresholds=...` or any threshold logic to the CI YAML.

# GOTCHA: release.yml intentionally does NOT run tests (it only builds + publishes
#   via changesets). Adding test:coverage there is out of scope and would be wrong.

# GOTCHA: YAML indentation in ci.yml is 6 spaces under `steps:`. Match the existing
#   bare `- run: <script>` style exactly (no `name:` key on the test step — mirror lint/typecheck).

# GOTCHA: Coverage instrumentation adds CI runtime. Acceptable for a correctness gate
#   and explicitly in scope; provider caching is OPTIONAL and OUT OF SCOPE (track separately).

# GOTCHA: The README already claims coverage "fails CI if any drops below 90%". That claim
#   was aspirational and becomes TRUE as a direct result of this change. Do NOT edit the README
#   here — the cross-cutting README narrative is handled by P1.M2.T4.S1 (Mode-B docs task).
```

## Implementation Blueprint

### Data models and structure

Not applicable — no data models, no source code. Pure CI configuration.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (read-only sanity check)
  - READ .github/workflows/ci.yml — confirm `verify` job, step `- run: pnpm test` on line 38,
    surrounded by `pnpm lint`, `pnpm typecheck`, and the `Build core + react` step.
  - READ package.json lines 10-12 — confirm `"test:coverage": "vitest run --coverage"` exists.
  - READ vitest.config.ts lines 27-31 — confirm thresholds block {statements:90, branches:90, functions:90, lines:90}.
  - READ .github/workflows/release.yml — confirm it has NO test step (only install/build/changesets).
  - WHY: Confirm the contract assumptions hold before editing.

Task 2: EDIT .github/workflows/ci.yml — swap the test step
  - EDIT line 38: change `- run: pnpm test` to `- run: pnpm test:coverage`.
  - PRESERVE: exact 6-space indentation, the bare `- run:` form (no `name:` key), and step ordering
    (must remain after `pnpm typecheck` and before `Build core + react`).
  - DO NOT: touch any other line in ci.yml, release.yml, package.json, or vitest.config.ts.
  - DO NOT: add a `name:` to the step, add caching, or duplicate threshold logic.

Task 3: LOCAL VALIDATION — the gate actually fires
  - RUN: `pnpm test:coverage` → confirm exit 0 (current coverage 97.29%/95.56%/99.07%/97.29% clears 90%).
  - RUN (regression proof): temporarily set ONE threshold in vitest.config.ts to 99 → run `pnpm test:coverage`
    → confirm exit NON-ZERO. Then run `pnpm test` → confirm it still exits 0 (proving the gate only fires
    under coverage). REVERT the threshold to 90 immediately.
  - EXPECT: proves the swap is what activates enforcement.

Task 4 (optional): LINT the workflow YAML
  - RUN: `actionlint .github/workflows/ci.yml` IF actionlint is installed locally.
  - IF NOT INSTALLED: skip (do not install tooling for this minimal fix); visual review suffices.
  - EXPECT: no errors. (A bare `- run: pnpm test:coverage` is valid GitHub Actions syntax.)

Task 5: CONFIRM no scope creep
  - RUN: `git diff --stat` → expect ONLY `.github/workflows/ci.yml` changed, one line.
  - EXPECT: release.yml, package.json, vitest.config.ts, README.md all untouched.
```

### Implementation Patterns & Key Details

```yaml
# .github/workflows/ci.yml — the verify job steps (after the fix):

#     - run: pnpm lint
#     - run: pnpm typecheck
#     - run: pnpm test:coverage      # ← was: pnpm test  (THE fix, line 38)
#     - name: Build core + react
#       run: pnpm --filter @formality-ui/core --filter @formality-ui/react build

# PATTERN: match the existing bare `- run: <script>` style used by `lint` and `typecheck`.
# GOTCHA: do NOT add a `name:` key to this step — it didn't have one before; keep it bare.
# CRITICAL: keep step ORDER — test:coverage must run AFTER typecheck and BEFORE the build step,
#           exactly where `pnpm test` sat. Do not reorder.
```

### Integration Points

```yaml
DATABASE: none
CONFIG:
  - vitest.config.ts thresholds block is the single source of truth — UNCHANGED.
ROUTES: none
CI:
  - ci.yml `verify` job: test step now enforces coverage (the only integration point).
  - release.yml: UNCHANGED (intentionally no test step).
PUBLIC API: none — no user-facing/config/API surface change.
DOCS: none here — README narrative (CI now actually runs test:coverage) is handled by P1.M2.T4.S1.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing ci.yml (Task 2)
# YAML is not lintable by the JS toolchain; rely on:
actionlint .github/workflows/ci.yml 2>/dev/null || echo "actionlint not installed — visual review only"

# Confirm the diff is minimal and correct
git diff .github/workflows/ci.yml
# Expected: exactly one line changed: `- run: pnpm test` → `- run: pnpm test:coverage`.
```

### Level 2: Local Script Validation (the actual proof)

```bash
# Confirm the coverage script exists and is green at current coverage
pnpm test:coverage
# Expected: exit 0. Prints the % Coverage table. Current: 97.29% stmts / 95.56% branches /
#           99.07% functions / 97.29% lines — all clear the 90% gate with margin.

# Confirm the gate actually fires (regression proof — REVERT afterward)
# 1. Edit vitest.config.ts: temporarily set `statements: 99` (or any metric to 99).
# 2. Run:
pnpm test:coverage   # Expected: exit NON-ZERO (threshold violated)
pnpm test            # Expected: exit 0 (no coverage → no threshold check → confirms the gap)
# 3. REVERT vitest.config.ts back to 90. Confirm `pnpm test:coverage` is green again.
```

### Level 3: Scope & Integrity Check

```bash
# Confirm no scope creep
git diff --stat
# Expected: ONLY .github/workflows/ci.yml changed.

# Confirm the other must-not-touch files are clean
git diff --exit-code vitest.config.ts package.json .github/workflows/release.yml
# Expected: exit 0 (no changes to those files).

# Re-run the broader gates to confirm nothing else broke
pnpm lint
pnpm typecheck
# Expected: both green (this change cannot affect them, but confirms a clean baseline).
```

### Level 4: Workflow Semantics Validation

```bash
# GitHub Actions YAML can't be executed locally, so validate structurally:
# 1. ci.yml still defines exactly one `verify` job.
# 2. The test step uses the bare `- run:` form (matches lint/typecheck).
# 3. Step order is preserved: checkout → pnpm → node → install → lint → typecheck → test:coverage → build.
# 4. release.yml still has NO `test` or `test:coverage` step.

grep -n "run:" .github/workflows/ci.yml
# Expected output includes (in order):
#   ... pnpm install --frozen-lockfile
#   ... pnpm lint
#   ... pnpm typecheck
#   ... pnpm test:coverage      <- the fix
#   ... pnpm --filter ... build

grep -cE "test:coverage|pnpm test" .github/workflows/release.yml
# Expected: 0  (release.yml must not run tests)
```

## Final Validation Checklist

### Technical Validation

- [ ] `git diff --stat` shows ONLY `.github/workflows/ci.yml` changed.
- [ ] `pnpm test:coverage` exits 0 locally.
- [ ] Regression proof performed: threshold→99 made `pnpm test:coverage` fail; then REVERTED to 90.
- [ ] `pnpm lint` green; `pnpm typecheck` green (baseline sanity).
- [ ] (If available) `actionlint .github/workflows/ci.yml` clean.

### Feature Validation

- [ ] ci.yml `verify` job step reads `- run: pnpm test:coverage`.
- [ ] Step ordering preserved (after typecheck, before build).
- [ ] Bare `- run:` form preserved (no added `name:` key).
- [ ] release.yml has NO test step.
- [ ] PRD §1.3.7 "build fails if any metric drops below 90%" is now TRUE in CI.

### Code Quality Validation

- [ ] Minimal diff (one line) — no incidental edits.
- [ ] Matches existing ci.yml step style (bare `- run: <script>`).
- [ ] No duplicated threshold logic in CI (vitest.config.ts remains sole source of truth).
- [ ] No out-of-scope additions (no provider caching, no typecheck:examples step — those are separate tasks).

### Documentation & Deployment

- [ ] No README edit here (deferred to P1.M2.T4.S1 — Mode-B docs task).
- [ ] No new env vars or secrets.
- [ ] The existing README claim ("fails CI if any drops below 90%") becomes accurate as a result.

---

## Anti-Patterns to Avoid

- ❌ Don't touch `vitest.config.ts` — the thresholds block is correct and is the single source of truth.
- ❌ Don't duplicate threshold logic (`--coverage.thresholds`, env vars, etc.) into the CI YAML.
- ❌ Don't add `pnpm test:coverage` to `release.yml` — release intentionally does not run tests.
- ❌ Don't add provider caching, a `name:` key, or any other "while I'm here" changes — out of scope.
- ❌ Don't skip the regression-proof step — it's the only way to demonstrate the gate now fires.
- ❌ Don't edit the README in this subtask — the cross-cutting narrative is P1.M2.T4.S1's job.
- ❌ Don't reorder CI steps — `test:coverage` stays exactly where `test` was.

---

## Confidence Score

**10/10** — one-pass success likelihood.

Rationale: This is a literal one-line YAML edit (`pnpm test` → `pnpm test:coverage`)
with the target script already defined in `package.json`, the enforcement logic
already correct in `vitest.config.ts`, and the constraints (don't touch
release.yml, don't touch thresholds, don't touch README) all explicitly
enumerated. The only non-trivial work is the regression-proof validation, which
is fully specified. There is no realistic failure mode for the edit itself.
