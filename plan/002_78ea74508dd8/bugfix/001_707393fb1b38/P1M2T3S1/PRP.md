name: "P1.M2.T3.S1 — Add `pnpm typecheck:examples` step to the CI verify job"
description: |

  Wire the existing `typecheck:examples` script (`tsc -p examples/tsconfig.json
  --noEmit`) into the `verify` job of `.github/workflows/ci.yml` as a BLOCKING
  step, grouped immediately after `pnpm typecheck`, and document it as a
  first-class script in the README §Scripts table. This is PRD Issue-2 fix
  **step 3** — the CI gate that makes P1.M2.T2.S1's green `typecheck:examples`
  enforceable going forward.

---

## Goal

**Feature Goal**: Make example type-regressions fail CI. The
`pnpm typecheck:examples` script already exists in root `package.json` and
(dependency P1.M2.T2.S1 having landed) already exits 0 locally; it is simply
**not invoked anywhere in CI**, so it protects nothing. Add it to the `verify`
job as a blocking step so any future regression in `examples/**/*.tsx` fails
the build — exactly the "wire the check into CI accordingly" recommendation
from PRD Issue-2.

**Deliverable**:
1. `.github/workflows/ci.yml` — one new step in the `verify` job:
   `- run: pnpm typecheck:examples`, placed immediately after the existing
   `- run: pnpm typecheck` step (grouped with the type-checking steps).
2. `README.md` — one new row in the §Scripts table (near the `typecheck` row):
   `` | `pnpm typecheck:examples` | Type-check the examples directory | ``

**Success Definition**:
1. The `verify` job runs `typecheck:examples` between `pnpm typecheck` and
   `pnpm test:coverage`.
2. The step is BLOCKING: no `continue-on-error:`; a non-zero exit fails the job.
3. The step is NOT added to `release.yml` (per contract; release only builds +
   publishes).
4. README §Scripts table lists `pnpm typecheck:examples` as a first-class script.
5. Locally: `pnpm typecheck:examples` exits 0 (dependency P1.M2.T2.S1 deliverable),
   the edited `ci.yml` is valid YAML, and (optionally) `actionlint` passes.

## User Persona

**Target User**: (a) Maintainers who need example regressions caught before
merge rather than discovered by consumers copying broken snippets. (b) The
P1.M2 milestone itself — this task is what makes "examples are type-clean"
a durable guarantee rather than a one-time cleanup.

**Use Case**: A future PR adds a new `fields.x?.value >= n` comparison in
`examples/` without coercing to `number`; CI fails on the `typecheck:examples`
step instead of shipping a red-squiggle example.

**Pain Points Addressed**: Today `typecheck:examples` is a script that runs
green locally but is invisible to CI — so its protection can silently rot the
moment anyone forgets to run it. This task closes that gap.

## Why

- **PRD Issue-2 (step 3) / §1.3.7.** Examples are excluded from the coverage
  gate but are shipped user-facing documentation — the canonical "how to use
  Formality" reference. PRD Issue-2 explicitly recommends wiring the check
  into CI; now that P1.M2.T2.S1 has made it green, blocking is the correct
  choice.
- **Completes the P1.M2 milestone's enforcement story.** P1.M1 closed the
  coverage-gate-in-CI gap (Issue-1); this closes the examples-typecheck-in-CI
  gap (Issue-2). Without it, P1.M2.T1.S1 + P1.M2.T2.S1's 293→0 error cleanup
  is unprotected against regression.
- **Enables the docs narrative.** P1.M2.T4.S1 will describe "what CI runs" in
  README §Contributing/Testing; it depends on this task having actually added
  the step (and the script being documented as first-class here).

## What

### Behavior
- The `verify` job gains one new step, `- run: pnpm typecheck:examples`,
  positioned immediately after `- run: pnpm typecheck` and before
  `- run: pnpm test:coverage`.
- The step blocks the job on any example type error (default Actions behavior
  for non-zero exit; no flag required, and none to be added).
- `release.yml` is unchanged.

### Documentation
- README §Scripts table gains a row for `pnpm typecheck:examples` near the
  existing `pnpm typecheck` row.

### Success Criteria
- [ ] `verify` job runs `pnpm typecheck:examples` after `pnpm typecheck`.
- [ ] Step is blocking (no `continue-on-error`).
- [ ] `release.yml` untouched.
- [ ] README §Scripts table has the new row.
- [ ] `pnpm typecheck:examples` exits 0 locally; edited YAML parses (and
      actionlint passes if available).

## All Needed Context

### Context Completeness Check

"If someone knew nothing about this codebase, would they have everything
needed to implement this successfully?" — Yes. The exact file, the exact
insertion point (with the full current step list quoted), the precise new
line, the README table's exact current content + format + the exact row to
add, the one non-obvious gotcha (WHY the step must follow `pnpm typecheck` —
dist production via `tsc --build`), and verified validation commands are all
cited below. ✅

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/002_78ea74508dd8/bugfix/001_707393fb1b38/P1M2T3S1/research/ci_step_ordering.md
  section: full doc
  why: |
    AUTHORITATIVE ordering analysis. Proves (with empirical file/exports
    inspection) that `pnpm typecheck:examples` resolves `@formality-ui/{core,
    react}` through their `dist/*.d.ts`, that `pnpm typecheck` (`tsc --build`)
    is what PRODUCES that dist, and that CI's fresh checkout (no dist/tsbuildinfo
    cache) always re-emits. → The step MUST come after `pnpm typecheck`; placing
    it before yields phantom TS6305/resolution errors. Read this before choosing
    placement.

- docfile: plan/002_78ea74508dd8/bugfix/001_707393fb1b38/architecture/external_deps.md
  section: "TypeScript project references" + "GitHub Actions (ci.yml)" + scripts table
  why: |
    Confirms: examples/tsconfig.json is composite + react-jsx with references
    to packages/core + packages/react; it is NOT part of the main `tsc --build`
    graph (`typecheck`), so its errors are invisible to CI until this task.
    Also confirms `release.yml` does NOT run tests/typecheck (only build +
    publish) → do not add the step there.

- file: .github/workflows/ci.yml
  why: |
    THE file to edit. Current `verify` job step order (verbatim):
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:coverage
      - name: Build core + react
        run: pnpm --filter @formality-ui/core --filter @formality-ui/react build
    INSERT the new step between `pnpm typecheck` and `pnpm test:coverage`.
  pattern: Bare `- run: pnpm <script>` form (no explicit `name:`) for grouped
           steps — MATCH this for the new step. Only the `Build core + react`
           step uses an explicit `name:` (longer command).
  gotcha: Do NOT add `continue-on-error: true` — the step must block. A bare
          `run:` already fails the job on non-zero exit.

- file: package.json
  section: scripts
  why: |
    Confirms the script already exists and needs NO creation:
      "typecheck:examples": "tsc -p examples/tsconfig.json --noEmit"
    (alongside "typecheck": "tsc --build"). Do NOT modify package.json.

- file: README.md
  section: "### Scripts" (the §Development table, ~lines 697–709)
  why: |
    The table to extend. CURRENT content (verbatim, note the column padding):
      | Script               | Description                          |
      | -------------------- | ------------------------------------ |
      | `pnpm build`         | Build all packages                   |
      | `pnpm test`          | Run all tests                        |
      | `pnpm test:coverage` | Run tests with the 90% coverage gate |
      | `pnpm typecheck`     | Type check all packages              |
      | `pnpm lint`          | Lint all packages                    |
    ADD one row immediately AFTER the `pnpm typecheck` row:
      | `pnpm typecheck:examples` | Type-check the examples directory   |
  pattern: Backticks around the script name (matches every other row).
  gotcha: "`pnpm typecheck:examples`" (23 chars in the cell) is longer than the
          current widest cell (`pnpm test:coverage`), so the FIRST column's
          dashed separator + cell padding must be re-widened by ~3 chars to keep
          the table aligned. Re-align ALL rows' first column for consistency
          (markdown tables tolerate misalignment, but the existing table is
          hand-aligned — preserve that). The Description column is already wide
          enough ("Type-check the examples directory" fits).

- file: examples/tsconfig.json
  why: |
    Confirms the composite/references structure that makes the ordering matter:
      { "extends": "../tsconfig.json",
        "compilerOptions": { "composite": true, "rootDir": ".",
            "outDir": "../.tsbuildcache/examples", "jsx": "react-jsx" },
        "include": ["**/*.ts", "**/*.tsx"],
        "references": [{ "path": "../packages/core" }, { "path": "../packages/react" }] }
    READ ONLY — do not modify.

- file: packages/react/package.json
  section: exports/main/module/types
  why: |
    Confirms WHY examples need dist: `"types": "./dist/index.d.ts"` and
    `exports.types: "./dist/index.d.ts"`. The examples' import of
    `@formality-ui/react` resolves to this dist file. READ ONLY.

- docfile: plan/002_78ea74508dd8/bugfix/001_707393fb1b38/P1M2T2S1/PRP.md
  section: "Goal" + "Success Definition"
  why: |
    DEPENDENCY CONTRACT. P1.M2.T2.S1 produces the green `pnpm typecheck:examples`
    (exit 0, 0 errors across all 9 example files) that this task gates. This
    task assumes that state. If T2.S1 has NOT landed (typecheck:examples still
    fails), STOP — adding a failing step to CI would break the build.
    Detection: run `pnpm typecheck:examples`; it must exit 0 before editing ci.yml.

- docfile: plan/002_78ea74508dd8/bugfix/001_707393fb1b38/P1M2T1S1/PRP.md
  section: "PARALLEL EXECUTION CONTRACT" (if present) / Goal
  why: |
    T1.S1 is T2.S1's own dependency (the InputConfig→ReactInputConfig annotation
    migration). Both must be in the tree for typecheck:examples to be green.
    This task (T3.S1) is sequenced AFTER T2.S1; it does not edit examples.

- url: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun
  why: |
    Confirms `run:` step exits-status semantics: non-zero exit code marks the
    step failed and stops the job (unless `continue-on-error: true`). This is
    why a bare `- run: pnpm typecheck:examples` is already BLOCKING with no
    extra flag.
```

### Current Codebase tree (relevant slice)

```bash
.github/workflows/
├── ci.yml                # EDIT — add one step to `verify` job
└── release.yml           # NO TOUCH (build+publish only; no test/typecheck)
README.md                 # EDIT — add one row to §Scripts table
package.json              # NO TOUCH (typecheck:examples script already exists)
examples/tsconfig.json    # NO TOUCH (composite + references; READ for context)
packages/{core,react}/    # NO TOUCH (their dist is produced by `pnpm typecheck`)
```

### Desired Codebase tree with files to be added

```bash
# No files added. Two existing files EDITED IN PLACE:
.github/workflows/ci.yml   # +1 step in `verify`
README.md                  # +1 row in §Scripts table
```

### Known Gotchas of our codebase & Library Quirks

```yaml
# CRITICAL — STEP ORDERING (the one non-obvious thing in this task):
#   `pnpm typecheck:examples` = `tsc -p examples/tsconfig.json --noEmit`.
#   Non-build `tsc -p` does NOT build referenced projects; it READS their
#   emitted .d.ts from each referenced project's declarationDir (dist).
#   packages/react/package.json points `types`/`exports.types` at
#   ./dist/index.d.ts. So dist MUST exist when the step runs.
#   `pnpm typecheck` (`tsc --build`, composite + declaration:true +
#   declarationDir:dist) is what PRODUCES that dist. → The new step MUST come
#   AFTER `pnpm typecheck`. Placing it BEFORE yields phantom TS6305 / module-
#   resolution errors. The contract's recommended placement (immediately after
#   `pnpm typecheck`) is correct for exactly this reason.

# CRITICAL — BLOCKING, NO FLAG:
#   Do NOT add `continue-on-error: true`. A bare `- run:` already fails the job
#   on non-zero exit. PRD Issue-2 says "wire the check into CI accordingly" —
#   now that examples are clean (T2.S1), blocking is the intended behavior.

# CRITICAL — release.yml IS OUT OF SCOPE:
#   release.yml only builds (tsup) + publishes (changesets); it deliberately
#   runs no tests/typecheck. Do NOT add the step there. (See architecture/
#   external_deps.md "GitHub Actions".)

# FORMATTING — README table column width:
#   `pnpm typecheck:examples` is the longest script name in the table. The
#   first column's padding + dashed separator must be widened ~3 chars and
#   every row re-aligned, or the table renders fine but looks ragged vs. the
#   current hand-aligned style. Markdown tolerates misalignment; match the
#   existing аккуратность.

# NAMING — match the bare `- run:` form:
#   The sibling steps (`pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`)
#   omit an explicit `name:`. Use `- run: pnpm typecheck:examples` (no `name:`)
#   to match. The `Build core + react` step is the only named one (longer cmd).

# PRECONDITION — dependency must be green BEFORE editing ci.yml:
#   Run `pnpm typecheck:examples` first. If it does NOT exit 0, P1.M2.T2.S1 has
#   not landed; STOP (adding a failing step would red the build for everyone).

# SCOPE FENCES (do NOT touch in this task):
#   examples/**/*.tsx              → P1.M2.T1.S1 + P1.M2.T2.S1 (already done)
#   packages/**                    → READ ONLY
#   vitest.config.ts               → done (P1.M2.T1.S5)
#   README §Contributing/Testing   → P1.M2.T4.S1 (the broader CI narrative)
#   release.yml                    → out of scope (build+publish only)
#   package.json                   → script already exists; no change
```

## Implementation Blueprint

### Data models and structure

None. This is a CI-config + documentation change: one YAML step + one markdown
table row. No code, no types, no runtime change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 0 (PRECONDITION): Confirm dependency P1.M2.T2.S1 has landed (examples green)
  - RUN: pnpm --filter @formality-ui/core --filter @formality-ui/react build
         (ensure dist is current; examples read dist/index.d.ts)
  - RUN: pnpm typecheck:examples; echo "EXIT=$?"
  - ASSERT: EXIT=0 AND zero "error TS" lines.
  - WHY: adding a failing step to CI would break the build for every PR. If this
         fails, T2.S1 is not landed — STOP and flag it. Do not edit ci.yml yet.
  - VERIFY: grep -c "ReactInputConfig" packages/react/dist/index.d.ts  → ≥ 1
            (confirms dist is current, not stale).

Task 1: EDIT .github/workflows/ci.yml — add the typecheck:examples step
  - FILE: .github/workflows/ci.yml
  - LOCATE the `verify` job steps; find the line `- run: pnpm typecheck`.
  - INSERT immediately AFTER it (before `- run: pnpm test:coverage`):
      - run: pnpm typecheck:examples
  - RESULTING step block (verbatim):
        - run: pnpm lint
        - run: pnpm typecheck
        - run: pnpm typecheck:examples
        - run: pnpm test:coverage
        - name: Build core + react
          run: pnpm --filter @formality-ui/core --filter @formality-ui/react build
  - DO NOT add `name:` (match the bare `- run:` form of the siblings).
  - DO NOT add `continue-on-error:` (must block).
  - DO NOT edit `release.yml`.
  - PRESERVE: every other line of ci.yml (triggers, concurrency, permissions,
    setup steps, job name "Typecheck · Test · Build").
  - WHY placement after `pnpm typecheck`: that step (`tsc --build`) emits
    packages/{core,react}/dist/*.d.ts, which examples' composite references
    consume. See research/ci_step_ordering.md.

Task 2: EDIT README.md — add the §Scripts table row
  - FILE: README.md, section "### Scripts" (~line 697–709).
  - LOCATE the row: | `pnpm typecheck`     | Type check all packages              |
  - INSERT immediately AFTER it:
      | `pnpm typecheck:examples` | Type-check the examples directory   |
  - RE-ALIGN the table's first column: `pnpm typecheck:examples` is the new
    widest cell (~23 chars). Widen the dashed separator and pad every row's
    first column so the table stays hand-aligned (matching current style).
    Example final table:
      | Script                   | Description                          |
      | ------------------------ | ------------------------------------ |
      | `pnpm build`             | Build all packages                   |
      | `pnpm test`              | Run all tests                        |
      | `pnpm test:coverage`     | Run tests with the 90% coverage gate |
      | `pnpm typecheck`         | Type check all packages              |
      | `pnpm typecheck:examples`| Type-check the examples directory    |
      | `pnpm lint`              | Lint all packages                    |
    (Exact spacing is not semantically significant in markdown, but preserve
    alignment. Note `typecheck:examples`| sits flush against the pipe — that's
    acceptable, or add a trailing space if preferred for readability.)
  - DO NOT touch README §Contributing / §Testing / §Examples — those belong to
    P1.M2.T4.S1 (the broader CI narrative). This task adds ONLY the Scripts row.

Task 3: VALIDATE the change locally
  - RUN: pnpm typecheck:examples; echo "EXIT=$?"   → expect EXIT=0
  - RUN: pnpm lint                                 → expect 0 errors
         (eslint . — README.md + ci.yml are in scope; ci.yml may be ignored by
         eslint config, but README.md is linted — keep markdown clean.)
  - RUN: YAML parse check on ci.yml, e.g.:
           python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('yaml OK')"
         → expect: yaml OK
  - RUN (optional, if actionlint available):
           docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color
         OR: npx --yes actionlint@latest
         → expect: no errors for ci.yml (ignore any unrelated warnings).
  - RUN: git diff --stat
         → expect EXACTLY two files: .github/workflows/ci.yml, README.md.
```

### Implementation Patterns & Key Details

```yaml
# The entire code change is two insertions. Verbatim before/after:

# --- .github/workflows/ci.yml (verify job, steps) ---
# BEFORE:
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:coverage
      - name: Build core + react
        run: pnpm --filter @formality-ui/core --filter @formality-ui/react build
# AFTER:
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm typecheck:examples
      - run: pnpm test:coverage
      - name: Build core + react
        run: pnpm --filter @formality-ui/core --filter @formality-ui/react build

# --- README.md (### Scripts table) ---
# BEFORE (last two data rows shown):
#   | `pnpm typecheck`     | Type check all packages              |
#   | `pnpm lint`          | Lint all packages                    |
# AFTER (new row inserted between typecheck and lint, columns re-aligned):
#   | `pnpm typecheck`          | Type check all packages              |
#   | `pnpm typecheck:examples` | Type-check the examples directory    |
#   | `pnpm lint`               | Lint all packages                    |
```

### Integration Points

```yaml
CI (the change surface):
  - file: .github/workflows/ci.yml
  - job: verify
  - step: "- run: pnpm typecheck:examples"  (NEW, blocking)
  - placement: immediately after "- run: pnpm typecheck"
  - rationale: pnpm typecheck (tsc --build) emits packages/{core,react}/dist/*.d.ts,
               which examples/tsconfig.json composite references consume.

DEPENDENCY (P1.M2.T2.S1 — must be landed first):
  - state: "pnpm typecheck:examples exits 0 (0 errors across all 9 example files)."
  - detect: "Run it; EXIT must be 0. If not, T2.S1 is not landed — STOP."

DOWNSTREAM (P1.M2.T4.S1 consumes this):
  - state: "README §Contributing/Testing narrative will describe 'CI runs
            typecheck:examples'. That task depends on THIS task having added
            the step + the Scripts row. Do NOT write that narrative here."

OUT OF SCOPE (do NOT touch):
  - release.yml                → build+publish only; no test/typecheck step
  - package.json               → typecheck:examples script already exists
  - examples/**, packages/**   → owned by T1.S1/T2.S1; library is correct-by-design
  - vitest.config.ts           → done (P1.M2.T1.S5)
  - README §Contributing/Testing/Examples → P1.M2.T4.S1
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# YAML well-formedness of the edited workflow (fast, no deps beyond python3)
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('yaml OK')"
# Expected: yaml OK

# Optional — authoritative workflow linter (if Docker or npx available)
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color .github/workflows/ci.yml
#   OR:  npx --yes actionlint@latest .github/workflows/ci.yml
# Expected: no errors for ci.yml.

# Markdown lint (README is in eslint scope; keep it clean)
pnpm lint
# Expected: 0 errors.
```

### Level 2: The Gated Script Itself (Component Validation)

```bash
# Precondition + the thing the new step runs. Must be green (dependency T2.S1).
pnpm --filter @formality-ui/core --filter @formality-ui/react build   # ensure dist current
pnpm typecheck:examples; echo "EXIT=$?"
# Expected: EXIT=0, zero "error TS" lines across all 9 example files.

# Prove the step is present, blocking, and correctly placed:
grep -nA1 -B1 "pnpm typecheck:examples" .github/workflows/ci.yml
# Expected: the line sits between "- run: pnpm typecheck" and "- run: pnpm test:coverage",
#           with NO "continue-on-error" on or near it.

# Prove release.yml was NOT touched:
git diff --stat .github/workflows/release.yml
# Expected: empty (no changes).
```

### Level 3: Full Local CI Sequence (System Validation)

```bash
# Reproduce the verify job's relevant step order locally to confirm the
# ordering invariant (dist produced by typecheck is consumed by typecheck:examples):
pnpm lint &&
pnpm typecheck &&
pnpm typecheck:examples &&     # <- the new step; must pass here because typecheck just built dist
pnpm test:coverage &&
pnpm --filter @formality-ui/core --filter @formality-ui/react build
# Expected: every command exits 0. Coverage ≥ 90%.

# If `pnpm typecheck:examples` were placed BEFORE `pnpm typecheck` on a clean
# tree (no dist), it would fail — this run proves the chosen order is correct.
```

### Level 4: README Table Render Check

```bash
# Confirm the row is present and the table still parses as a table:
grep -n "typecheck:examples" README.md
# Expected: exactly ONE match — the new §Scripts row.

# Confirm no stray edits to the CI narrative sections (owned by T4.S1):
git diff README.md | grep -E "^[+-].*(Contributing|Testing|Examples|coverage gate)" 
# Expected: empty — this task must not touch those sections.

# Confirm the only two files changed:
git diff --stat
# Expected: .github/workflows/ci.yml  AND  README.md  (nothing else).
```

## Final Validation Checklist

### Technical Validation
- [ ] Level 1: edited `ci.yml` is valid YAML (`python3 yaml.safe_load` → OK).
- [ ] Level 1: `actionlint` passes on `ci.yml` (if run).
- [ ] Level 1: `pnpm lint` → 0 errors.
- [ ] Level 2: `pnpm typecheck:examples` exits 0 (dependency T2.S1 green).
- [ ] Level 2: new step is between `pnpm typecheck` and `pnpm test:coverage`,
      with no `continue-on-error`.
- [ ] Level 2: `release.yml` unchanged (`git diff --stat` empty for it).
- [ ] Level 3: full local step sequence (`lint && typecheck && typecheck:examples
      && test:coverage && build`) all green.

### Feature Validation
- [ ] `verify` job runs `pnpm typecheck:examples` (the PRD Issue-2 CI gate).
- [ ] Step is BLOCKING (default `run:` semantics; no `continue-on-error`).
- [ ] `release.yml` untouched.
- [ ] README §Scripts table lists `pnpm typecheck:examples` near `pnpm typecheck`.

### Code Quality Validation
- [ ] New step uses the bare `- run:` form (matches `lint`/`typecheck`/`test:coverage`).
- [ ] README table remains hand-aligned (first column widened for the new longest cell).
- [ ] Only the two intended files changed (`git diff --stat`).
- [ ] No edits to README §Contributing/Testing/Examples (T4.S1's scope).

### Documentation & Deployment
- [ ] `typecheck:examples` is now a documented first-class script (README §Scripts).
- [ ] The broader "what CI runs" narrative is deferred to P1.M2.T4.S1 (not duplicated).
- [ ] No new env vars, no new deps, no package.json change.

---

## Anti-Patterns to Avoid

- ❌ Don't place the step BEFORE `pnpm typecheck` — examples read
  `packages/{core,react}/dist/*.d.ts`, which `tsc --build` produces. Wrong
  order → phantom TS6305/resolution errors. (Correct: immediately AFTER
  `pnpm typecheck`.)
- ❌ Don't add `continue-on-error: true`. PRD Issue-2 requires the check be
  wired in "accordingly" — now that examples are clean, blocking is intended.
- ❌ Don't add the step to `release.yml`. Release only builds + publishes; it
  intentionally runs no tests/typecheck.
- ❌ Don't modify `package.json` — the `typecheck:examples` script already
  exists. This task only CONSUMES it.
- ❌ Don't edit README §Contributing / §Testing / §Examples narrative — that is
  P1.M2.T4.S1's Mode-B deliverable. This task adds ONLY the §Scripts table row.
- ❌ Don't add an explicit `name:` to the new step — match the bare `- run:`
  form used by `pnpm lint` / `pnpm typecheck` / `pnpm test:coverage`.
- ❌ Don't run the edit before confirming `pnpm typecheck:examples` exits 0
  (Task 0 precondition) — otherwise CI goes red for every PR.
- ❌ Don't touch `examples/**`, `packages/**`, or `vitest.config.ts` — owned by
  T1.S1/T2.S1/library/earlier milestones; this task is config + docs only.
- ❌ Don't widen the change beyond the two insertions (1 YAML step + 1 table row).

---

**Confidence Score: 10/10** for one-pass implementation success.

Rationale: The change is two single-line insertions in well-understood files.
The current `ci.yml` `verify` job step list is quoted verbatim with the exact
insertion point; the README §Scripts table is quoted verbatim with the exact
row to add and re-alignment guidance. The only non-obvious aspect — WHY the
step must follow `pnpm typecheck` (dist production via `tsc --build` consumed
by the examples' composite references) — is proven empirically in
`research/ci_step_ordering.md` (dist exists, react `types`/`exports.types`
point at `./dist/index.d.ts`, root+package tsconfigs are composite with
`declaration:true` + `declarationDir:dist`). Blocking semantics (default
`run:` behavior), release.yml exclusion, and the T4.S1 scope fence are all
called out explicitly. Validation is concrete: a local reproduction of the
exact CI step order plus YAML/actionlint checks. The sole precondition
(T2.S1 green) is gated by Task 0 before any edit.
