name: "P3.M3.T1.S1 — Version bump to 1.0.0 and release verification"
description: |

---

## Goal

**Feature Goal**: Promote `@formality-ui/core` and `@formality-ui/react` to
**version 1.0.0** (shared, as the monorepo's semantic-release requires) and
**prove** — via `semantic-release --dry-run` and the full CI `verify` suite —
that the next push to `main` will publish **1.0.0** with green CI and correct
`dist/` artifacts. This is the **final, release-gating** task of the v1.0 effort;
it produces the trigger commit and the verification evidence, it does NOT itself
publish (the `release.yml` workflow publishes on push to `main`).

**Deliverable**: One new git commit — a **Conventional-Commit breaking-change
marker** (e.g. `chore!: graduate to v1.0.0` with a `BREAKING CHANGE:` footer) —
plus a documented, verified state in which:
1. `semantic-release --dry-run --no-ci` prints **"The next release version is 1.0.0"**.
2. The full CI `verify` suite is green (the exact command in contract step (d)).
3. Both packages build to `dist/` with `index.js`, `index.cjs`, `index.d.ts`.
4. The release decision is documented (CHANGELOG auto-generation confirmed; manual
   `package.json` bump explicitly rejected with the reason from research).

**Success Definition**:
- `git describe --tags --abbrev=0` is still `v0.2.5` (NOT yet released — readiness,
  not publication).
- `semantic-release --dry-run --no-ci` computes **1.0.0** (the breaking commit is
  in history since `v0.2.5`).
- `pnpm lint && pnpm format:check && pnpm typecheck && pnpm typecheck:examples && pnpm test:coverage && pnpm --filter @formality-ui/core --filter @formality-ui/react build` exits 0.
- `packages/core/package.json` and `packages/react/package.json` still both read
  `0.2.5` at the end of this task (semantic-release will stamp 1.0.0 during the
  real release's `prepare` — see Gotcha #4; do NOT pre-bump them).
- The graduation commit exists in `git log v0.2.5..HEAD` and contains a recognized
  breaking marker (`!:` and/or `BREAKING CHANGE:` footer).

## User Persona (if applicable)

**Target User**: The maintainer performing the Formality **v1.0.0 release** — and
the automated `release.yml` CI workflow that will consume this trigger commit.

**Use Case**: Confirm that conventional-commit history alone now yields 1.0.0 (it
did NOT before — see Why), then let the next `main` push publish both packages at
1.0.0 automatically.

**User Journey**:
1. Review the v1.0 scope (P1+P2+P3 audits complete; README synced via P3.M2.T1.S1).
2. Run the baseline dry-run → observe `0.3.0` (proves the gap).
3. Add the graduation breaking-change commit.
4. Re-run the dry-run → observe `1.0.0`.
5. Run the full CI suite → green.
6. Verify `dist/` artifacts.
7. Document the decision; push to `main` (triggers `release.yml` → publish 1.0.0).

**Pain Points Addressed**: A sequence of `feat:` commits never reaches 1.0.0 on
its own (semantic-release has no `--release-as` and no `0.x` special-casing); a
manual `package.json` bump is silently discarded by `release.mjs prepare`. The
only correct path is an explicit breaking-change commit. This task owns that.

## Why

- **Reaching 1.0.0 requires an explicit breaking marker.** Research
  (`research/semantic-release-major-bump-behavior.md`) confirms: with default
  `@semantic-release/commit-analyzer` (angular preset), a bare `feat:` → **minor**,
  so the ~17 commits since `v0.2.5` (including `feat(core): add validate()`,
  `feat(core): add mergeConfigs()`, `feat(react): implement useField hook`)
  compute to **0.3.0**, not 1.0.0. `grep` confirms **no** existing commit since
  `v0.2.5` carries `!:` or `BREAKING CHANGE`. The graduation commit closes that gap.
- **The contract's "OR manually set version to 1.0.0" branch is a trap here.**
  `scripts/release.mjs prepare` OVERWRITES both `packages/core/package.json` and
  `packages/react/package.json` with `nextRelease.version` (computed from commits)
  during the real release. A manual bump is silently discarded. The PRP steers the
  implementer to the only working mechanism (the breaking commit) and documents why.
- **Release gating.** This is the last work item before the actual publish. The
  dry-run + full-CI + dist verification is the evidence that a `main` push will
  succeed rather than fail mid-publish (which, for 1.0.0, would be embarrassing
  and partially-irreversible on the npm registry).

## What

Create ONE git commit that is recognized by `@semantic-release/commit-analyzer` as
a **major** (breaking) release, then verify end-to-end. No source code, no config,
no manual version bump. The commit may be empty (`--allow-empty`) since its
purpose is purely the conventional-commit message — it does not change files.

Concretely the implementer:
- Verifies the baseline (versions match at 0.2.5; tree clean; last tag `v0.2.5`).
- Runs the baseline dry-run and records that it computes **0.3.0** (proving the gap).
- Creates the graduation commit (robust message: both `!` AND `BREAKING CHANGE:` footer).
- Re-runs the dry-run and confirms it now computes **1.0.0**.
- Runs the full CI `verify` suite (green).
- Builds both packages and verifies `dist/` artifacts.
- Confirms CHANGELOG is auto-generated by `@semantic-release/changelog` (no manual edit).
- Documents the release decision (in the commit body and, optionally, a plan note).

### Success Criteria

- [ ] Baseline dry-run (`--no-ci`) computes **0.3.0** BEFORE the graduation commit (evidence of the gap).
- [ ] A graduation commit exists in `git log v0.2.5..HEAD` carrying a breaking marker (`grep -E '!:|BREAKING CHANGE'` on its message returns a match).
- [ ] Post-commit dry-run (`--no-ci`) computes **1.0.0** and prints release notes that include the v1.0 graduation + the P1/P2 feat items.
- [ ] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm typecheck:examples && pnpm test:coverage && pnpm --filter @formality-ui/core --filter @formality-ui/react build` exits 0.
- [ ] `packages/core/dist/{index.js,index.cjs,index.d.ts}` and `packages/react/dist/{index.js,index.cjs,index.d.ts}` all exist after the build.
- [ ] `packages/core/package.json` and `packages/react/package.json` STILL read `0.2.5` (NOT pre-bumped — release.mjs stamps the real version at publish time).
- [ ] CHANGELOG auto-generation confirmed (`.releaserc.json` has `@semantic-release/changelog`; no manual CHANGELOG edit committed).
- [ ] `git diff --name-only` after the graduation commit shows **no tracked file changes** if `--allow-empty` was used (the commit touches no source/config/docs).

## All Needed Context

### Context Completeness Check

A developer who knows nothing about this codebase would need: the exact
semantic-release mechanics for forcing a major bump (and why `feat:` is
insufficient and why a manual `package.json` bump fails); the exact dry-run command
form (`--no-ci`, no tokens); the exact full-CI command; the dist artifact shape;
the package version/source-of-truth facts; and the list of what NOT to touch. All
cited below with verified values. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# THE TWO RESEARCH DOCS — read these FIRST; they contain every verified fact below.
- docfile: plan/005_8f88e0ec4482/P3M3T1S1/research/semantic-release-major-bump-behavior.md
  why: |
    THE decision document. Proves: (Q1) feat:→0.3.0 not 1.0.0; (Q2) the exact `!`
    and `BREAKING CHANGE:`/`BREAKING-CHANGES:` marker syntax; (Q3) no 0.x special-casing;
    (Q4) dry-run skips verifyConditions (no tokens) BUT needs `--no-ci` locally (the
    repo's release:dry script LACKS --no-ci and is silently skipped outside CI);
    (Q5) exec/changelog/git are all SKIPPED in dry-run (no file writes);
    (Q6) version comes from the git TAG, and release.mjs prepare OVERWRITES package.json
    → manual bump is a no-op (why the contract's "manual bump" branch is rejected).
  critical: Use `pnpm exec semantic-release --dry-run --no-ci`, NOT `pnpm release:dry`.

- docfile: plan/005_8f88e0ec4482/P3M3T1S1/research/ci-and-build-verification.md
  why: Verbatim scripts, coverage thresholds (90/90/90/90), exclude list, tsup output
       (index.js/.cjs/.d.ts), .gitignore (dist NOT committed), package versions
       (core=react=0.2.5, vue=svelte=0.0.0 private), release.mjs prepare/publish flow.
  critical: dist/ is gitignored + prettier-ignored → build-generated; verify it exists.

# SEMANTIC-RELEASE BEHAVIOR (authoritative)
- url: https://github.com/semantic-release/commit-analyzer#readme
  why: Default preset `angular`; type→level mapping (feat→minor, breaking→major);
       breaking detected from `!` and/or `BREAKING CHANGE:` footer.
- url: https://www.conventionalcommits.org/en/v1.0.0/
  why: Authoritative `!`-after-type syntax and `BREAKING CHANGE` footer (+ `BREAKING-CHANGES` synonym).
- url: https://semantic-release.gitbook.io/semantic-release/usage/configuration
  why: `dryRun` skip-list (verifyConditions/prepare/publish skipped) and the `ci`/`noCi`
       gate (outside CI, semantic-release exits-0-doing-nothing without --no-ci).

# THE RELEASE MACHINERY YOU MUST NOT BREAK OR BYPASS
- file: .releaserc.json
  why: Defines branches:["main"], plugins (commit-analyzer, notes-generator, changelog,
       exec→release.mjs, git→commits package.json+CHANGELOG, github). Confirms CHANGELOG
       is auto-generated (no manual edit needed) and that package.json versions are
       STAMPED by release.mjs during prepare.
- file: scripts/release.mjs
  why: prepare: stamps nextRelease.version onto BOTH packages/core + packages/react
       package.json AND builds both. publish: pnpm publish core then react. PROVES a
       manual package.json bump is overwritten → the only way to 1.0.0 is the commit.
- file: .github/workflows/release.yml
  why: The workflow that actually publishes on push to main (fetch-depth:0, typecheck,
       test, then `npx semantic-release`). This task does NOT trigger it directly; it
       prepares the commit that, once on main, makes that workflow emit 1.0.0.
- file: .github/workflows/ci.yml
  why: The `verify` job = lint, format:check, typecheck, typecheck:examples,
       test:coverage, build core+react. EXACT match to contract step (d).

# VERSIONS (verified at research time)
- file: packages/core/package.json   # version: "0.2.5" — publishable
- file: packages/react/package.json  # version: "0.2.5" — publishable; depends on workspace:* core
- file: packages/vue/package.json     # version: "0.0.0", private:true — NOT published (stub)
- file: packages/svelte/package.json  # version: "0.0.0", private:true — NOT published (stub)
- file: package.json                  # version: "0.1.0", private:true — root, IRRELEVANT to release
  why: Confirm core & react MATCH (0.2.5==0.2.5) and that vue/svelte/root are NOT in scope.

# BUILD OUTPUT SHAPE (for dist verification)
- file: packages/core/tsup.config.ts
  why: entry src/index.ts; format esm+cjs; dts on; clean:true. Output = dist/index.{js,cjs,d.ts,d.cts} + maps.
- file: packages/react/tsup.config.ts
  why: same + external [react,react-dom,react-hook-form], jsx automatic.

# THE PREDECESSOR PRP (parallel execution context)
- docfile: plan/005_8f88e0ec4482/P3M2T1S1/PRP.md
  why: P3.M2.T1.S1 (README sync) runs BEFORE this task. Its output is a single `docs:`
       commit editing only README.md. That commit is a NON-release type (docs) so it does
       NOT affect version computation. This task's graduation commit is added ON TOP.
       (At research time that README commit already exists in git as
       `docs: sync README architecture and structure to v1.0`.)
```

### Current Codebase tree (release-relevant slice — verified)

```bash
formality/
├── .github/workflows/
│   ├── ci.yml                 # verify job = step (d) command (exact)
│   └── release.yml            # publishes on push:main via semantic-release
├── .releaserc.json            # changelog auto-gen + exec→release.mjs + git assets
├── scripts/
│   └── release.mjs            # prepare: stamp both package.json + build; publish core→react
├── packages/
│   ├── core/   package.json (0.2.5)  dist/ (gitignored, build-gen)  ← index.{js,cjs,d.ts}
│   ├── react/  package.json (0.2.5)  dist/ (gitignored, build-gen)  ← index.{js,cjs,d.ts}
│   ├── vue/    package.json (0.0.0, private)   # stub — NOT published
│   └── svelte/ package.json (0.0.0, private)   # stub — NOT published
├── CHANGELOG.md               # auto-generated by @semantic-release/changelog (DO NOT hand-edit)
├── package.json               # version 0.1.0, private — IRRELEVANT to semantic-release
├── vitest.config.ts           # 90/90/90/90 gate; excludes examples/svelte/vue/dist/scripts
└── README.md                  # synced by P3.M2.T1.S1 (its `docs:` commit does NOT bump version)
```

### Desired Codebase tree with files changed by this task

```bash
# NO new files. NO modified tracked files. The ONLY change is a new git commit:
#   git log v0.2.5..HEAD  →  includes the graduation commit (chore!:/BREAKING CHANGE)
# If --allow-empty is used, `git diff` of the commit is EMPTY (message-only).
# dist/ is regenerated by the build step during verification (gitignored — not committed).
```

### Known Gotchas of our codebase & Library Quirks

```bash
# CRITICAL (THE core gotcha): `feat:` → MINOR, not MAJOR.
#   semantic-release default commit-analyzer (angular preset): feat=minor, fix/perf=patch,
#   breaking(!: or BREAKING CHANGE: footer)=major. The ~17 commits since v0.2.5 contain
#   feat: but NO breaking marker → they compute to 0.3.0. You MUST add a breaking commit.
#   Verify the gap first: `git log v0.2.5..HEAD --format='%s%n%b' | grep -iE '!:|BREAKING CHANGE'`
#   (returns nothing today → confirms the gap).

# CRITICAL: a MANUAL package.json version bump DOES NOT WORK and is rejected.
#   scripts/release.mjs `prepare` OVERWRITES both packages/*/package.json `version`
#   with nextRelease.version (computed from commits). Any pre-bump to 1.0.0 is discarded.
#   The contract's "(c) ... OR manually set version to 1.0.0" branch is a dead end HERE.
#   → DO NOT edit any package.json version. Use the breaking-commit route.

# CRITICAL: `pnpm release:dry` is `semantic-release --dry-run` — it LACKS `--no-ci`,
#   so it is SILENTLY SKIPPED outside CI (prints "This run was not triggered in a known
#   CI environment" and exits 0). For a local preview use:
#       pnpm exec semantic-release --dry-run --no-ci
#   In dry-run, verifyConditions/prepare/publish are SKIPPED → NO tokens required and
#   NO file writes (CHANGELOG/package.json/dist untouched by the dry-run).

# CRITICAL: dist/ is gitignored AND prettier-ignored. It is build-generated, never
#   committed. The dry-run does NOT build. To verify dist artifacts, run the REAL build:
#       pnpm --filter @formality-ui/core --filter @formality-ui/react build
#   then assert packages/{core,react}/dist/index.{js,cjs,d.ts} exist.

# CRITICAL: CHANGELOG.md is auto-generated by @semantic-release/changelog during the REAL
#   release's `prepare` step (NOT in dry-run). The contract DOCS line "Update CHANGELOG.md
#   if semantic-release doesn't auto-generate it" is satisfied by default — .releaserc.json
#   HAS the changelog plugin. → DO NOT hand-edit CHANGELOG.md (it is .prettierignore'd and
#   managed by the release). Confirm the plugin is present and document that decision.

# GOTCHA: version comes from the git TAG, not package.json. Current version = v0.2.5.
#   At the END of this task BOTH package.json files still read "0.2.5" — that is CORRECT.
#   They become 1.0.0 only when release.yml runs the real release on main.

# GOTCHA: vue/svelte are version "0.0.0" + private:true — NOT published and NOT touched.
#   The shared version applies ONLY to core + react (the two PACKAGES in release.mjs's
#   PACKAGES array). Do not attempt to bump vue/svelte.

# GOTCHA: the graduation commit should use --allow-empty (it is a message-only trigger).
#   This keeps `git diff --name-only` empty → no source/config/docs are touched by THIS
#   task. If you instead attach the breaking marker to a real file change, that file is
#   now part of the release commit scope — avoid it.

# GOTCHA: the breaking marker is recognized from BOTH `!:` and the `BREAKING CHANGE:`
#   footer (you need only one; using BOTH is maximally robust and removes all doubt).
#   Footer keyword aliases: `BREAKING CHANGE:` (canonical) and `BREAKING-CHANGES:`.

# GOTCHA: do NOT push to main as part of this task unless explicitly instructed. The
#   deliverable is "ready to publish + verified", not "published". Pushing triggers
#   release.yml which does an irreversible npm publish of 1.0.0. Leave the push as the
#   final human/orchestrator decision and document it.
```

## Implementation Blueprint

### Data models and structure

None. No code, no types, no config. The only artifact is a git commit (message-only,
`--allow-empty`) plus regenerated `dist/` (gitignored, build-verified, not committed).

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: BASELINE — verify the starting state and the GAP before doing anything
  - VERIFY versions match (contract step a):
      node -e "const c=require('./packages/core/package.json').version,r=require('./packages/react/package.json').version;console.log('core='+c,'react='+r,c===r?'MATCH':'MISMATCH')"
      # Expect: core=0.2.5 react=0.2.5 MATCH ✓
  - VERIFY tree is clean:          git status --short   # expect empty
  - VERIFY last tag + commit count:
      git describe --tags --abbrev=0   # expect v0.2.5
      git rev-list --count v0.2.5..HEAD   # expect ~17
  - PROVE THE GAP (no breaking marker exists today — this is WHY a new commit is needed):
      git log v0.2.5..HEAD --format='%s%n%b' | grep -iE '!:|BREAKING CHANGE' || echo "NO BREAKING MARKER → semantic-release will compute 0.3.0 (minor), NOT 1.0.0"
  - RECORD the baseline dry-run computes 0.3.0 (this is the evidence the gap is real):
      pnpm exec semantic-release --dry-run --no-ci 2>&1 | tee /tmp/release-dry-baseline.log
      grep -iE "next release version|no new version|nothing to release" /tmp/release-dry-baseline.log
      # Expect BEFORE the graduation commit: "The next release version is 0.3.0"
      # (If it already says 1.0.0, a breaking marker already exists — skip Task 3, go to Task 4.)
  - STOP CHECK: if versions do NOT match, or the tree is dirty, or last tag != v0.2.5,
    STOP and report — do not proceed (the release math depends on these).

Task 2: UNDERSTAND — confirm the release machinery (read-only; 2 minutes)
  - READ .releaserc.json: confirm @semantic-release/changelog plugin present (→ CHANGELOG
    auto-generated; DOCS line satisfied by default) and that @semantic-release/exec prepareCmd
    = `node scripts/release.mjs prepare ${nextRelease.version}`.
  - READ scripts/release.mjs: confirm prepare stamps nextRelease.version onto BOTH
    packages/core/package.json + packages/react/package.json and builds both. (This is the
    proof a manual package.json bump is a no-op — Gotcha #2.)
  - If the changelog plugin is somehow MISSING, STOP and report (that would require a config
    change outside this task's scope — the contract's DOCS branch would then need hand-editing,
    which is a different decision).

Task 3: CREATE THE GRADUATION COMMIT — the breaking-change trigger (the ONLY mutation)
  - DECIDE the message. Use a clear, honest conventional-commit breaking marker. Recommended:
        Type: chore  (it is a release-process action, not a feature)  — feat!: is also acceptable.
        Subject: chore!: graduate Formality to v1.0.0 stable release
        Body: a short paragraph noting v1.0 completes the core + react architecture, the
              90% coverage gate, the extracted useField hook, and the headline exports.
        Footer: BREAKING CHANGE: <one-line summary of the v1.0 public-API stabilization>
  - CREATE the commit (message-only, --allow-empty keeps the tree clean):
      git commit --allow-empty \
        -m "chore!: graduate Formality to v1.0.0 stable release" \
        -m "Formality v1.0.0 marks the first stable public API for @formality-ui/core and @formality-ui/react. The core architecture (expression engine, conditions, validation, transform, config merge), the React adapter (Form, Field, FieldGroup, the extracted useField hook), the PRD §1.3.7 90% coverage gate, and the headline exports validate() and mergeConfigs() are all complete per PRD v1.0. This is the stable baseline; subsequent changes follow normal semver." \
        -m "BREAKING CHANGE: Formality graduates from 0.2.x to 1.0.0. The public API for @formality-ui/core and @formality-ui/react is now stable. This is the v1.0.0 milestone release."
    # NOTE: using BOTH `!:` and `BREAKING CHANGE:` is maximally robust (either alone works).
  - VERIFY the commit is recognized as breaking:
      git log -1 --format='%B' | grep -iE '!:|BREAKING CHANGE' && echo "✓ breaking marker present"
      git log v0.2.5..HEAD --format='%H %s' | head   # graduation commit is now in the range
  - DO NOT push yet (Task 6 / final note covers the push decision).

Task 4: VERIFY — dry-run now computes 1.0.0 (contract step b/c)
  - RUN the post-commit dry-run (note: --no-ci, NOT pnpm release:dry which lacks it):
      pnpm exec semantic-release --dry-run --no-ci 2>&1 | tee /tmp/release-dry-1.0.0.log
  - ASSERT the computed version:
      grep -E "The next release version is 1\.0\.0" /tmp/release-dry-1.0.0.log && echo "✓ dry-run = 1.0.0"
      # If it shows 0.3.0, the breaking marker was not parsed — recheck the commit message
      # (common cause: footer not separated by a blank line, or `!` not immediately before `:`).
  - REVIEW the generated release notes in the log: they should list the v1.0 graduation plus
    the P1/P2 feat items (validate, mergeConfigs, useField, ordering relocation). This satisfies
    the DOCS line "confirm the release notes document the v1.0 milestone".
  - ASSERT no files were written by the dry-run (it skips prepare/publish/changelog/git):
      git status --short   # expect still empty (only the graduation commit; dist unchanged by dry-run)
      git diff --name-only # expect empty (the graduation commit was --allow-empty)

Task 5: VERIFY — full CI suite green (contract step d) + dist artifacts correct (step e)
  - RUN the exact contract step (d) command (this is the ci.yml `verify` job, local):
      pnpm lint && pnpm format:check && pnpm typecheck && pnpm typecheck:examples && pnpm test:coverage && pnpm --filter @formality-ui/core --filter @formality-ui/react build && echo "✅ FULL CI GREEN"
      # Expected: exit 0. Coverage gate ≥90% on statements/branches/functions/lines.
      # If any step fails: read the error, fix root cause in the relevant package (this may be
      # a real regression caught at the gate — investigate; do NOT weaken the gate).
  - VERIFY dist artifacts (contract step e):
      for p in core react; do
        for f in index.js index.cjs index.d.ts; do
          test -s "packages/$p/dist/$f" && echo "✓ packages/$p/dist/$f" || echo "✗ MISSING packages/$p/dist/$f"
        done
      done
      # Expected: all 6 files present and non-empty. (tsup clean:true guarantees a fresh build.)
  - SANITY: confirm a consumer can resolve the package shape (optional, quick):
      node -e "console.log(require('./packages/core/package.json').exports['.'])"   # types/import/require → dist

Task 6: DOCUMENT — release decision + CHANGELOG handling (contract DOCS line)
  - CONFIRM CHANGELOG auto-generation (no manual edit):
      grep -n '@semantic-release/changelog' .releaserc.json   # expect a match
  - The contract DOCS line is satisfied BY DEFAULT: .releaserc.json HAS the changelog plugin,
    so semantic-release regenerates CHANGELOG.md during the real release's `prepare` step.
    → DO NOT hand-edit CHANGELOG.md. Document this decision in the commit body (already in
    Task 3) and/or a short plan note (e.g. this PRP's research dir is sufficient).
  - FINAL STATE assertions:
      git describe --tags --abbrev=0                 # expect STILL v0.2.5 (not yet released)
      grep '"version"' packages/core/package.json    # expect STILL "0.2.5" (release.mjs stamps 1.0.0 later)
      grep '"version"' packages/react/package.json   # expect STILL "0.2.5"
      git status --short                             # expect clean (dist gitignored; commit was --allow-empty)
  - HAND-OFF NOTE (do not execute unless instructed): the actual publish happens when the
    graduation commit reaches `main` — release.yml runs typecheck + test then
    `npx semantic-release`, which (prepare) stamps 1.0.0 into both package.json + builds +
    updates CHANGELOG, then (publish) `pnpm publish`s core then react, then tags v1.0.0 and
    creates the GitHub release. The local dry-run + green CI above are the proof that will
    succeed. Push to main is the human/orchestrator's final go/no-go.
```

### Implementation Patterns & Key Details

```bash
# PATTERN — the dry-run command (use EXACTLY this form locally):
#   pnpm exec semantic-release --dry-run --no-ci
#   - `--dry-run`: skip prepare/publish/verifyConditions; print computed version + notes only.
#   - `--no-ci`: defeat the "not in a CI environment" short-circuit (otherwise exit 0, no output).
#   - No GITHUB_TOKEN/NPM_TOKEN needed in dry-run (verifyConditions is skipped).
#   - If a plugin STILL complains about a token (version-dependent), set dummies:
#       GITHUB_TOKEN=dummy NPM_TOKEN=dummy pnpm exec semantic-release --dry-run --no-ci
#   - Do NOT use bare `pnpm release:dry` (it is `semantic-release --dry-run` without --no-ci →
#     silently skipped outside CI). (Optional repo improvement, OUT of this task's scope:
#     add --no-ci to the release:dry script. Do NOT make that change here.)

# PATTERN — the graduation commit (robust breaking marker, message-only):
#   Use BOTH `!:` and `BREAKING CHANGE:` footer for maximum parser compatibility.
#   Use --allow-empty so no file is touched (keeps git diff --name-only empty).
#   Example (verbatim-ready):
#     git commit --allow-empty \
#       -m "chore!: graduate Formality to v1.0.0 stable release" \
#       -m "<short body paragraph: v1.0 completes core+react, coverage gate, useField, exports>" \
#       -m "BREAKING CHANGE: <one-line: graduates 0.2.x → 1.0.0 stable public API>"
#   - `chore!:` is recognized as major because the breaking flag (from `!`/footer) overrides
#     chore's default no-release type. `feat!:` is equally valid.

# PATTERN — the full CI command (the ci.yml `verify` job, run locally):
#   pnpm lint && pnpm format:check && pnpm typecheck && pnpm typecheck:examples \
#     && pnpm test:coverage \
#     && pnpm --filter @formality-ui/core --filter @formality-ui/react build
#   Each segment is an existing root script (see research/ci-and-build-verification.md §1).
#   The filtered build is the PUBLISHABLE pair (core+react) and matches release.mjs prepare.

# PATTERN — leave package.json versions at 0.2.5 (do NOT pre-bump):
#   release.mjs prepare writes nextRelease.version into both package.json during the real
#   release. Pre-bumping to 1.0.0 by hand is (a) discarded, and (b) would make the
#   `@semantic-release/git` assets differ from what release.mjs expects. Leave them at 0.2.5.
```

### Integration Points

```yaml
GIT:
  - commit: "Add ONE breaking-change graduation commit (chore!:/BREAKING CHANGE), --allow-empty.
             It is the trigger the release.yml workflow consumes when it lands on main."
  - tag: "v1.0.0 is NOT created by this task. release.yml's semantic-release creates it on publish.
          `git describe --tags --abbrev=0` must still show v0.2.5 at task end."

SEMANTIC-RELEASE (.releaserc.json) — NOT MODIFIED by this task:
  - "commit-analyzer derives 1.0.0 (major) from the breaking commit since v0.2.5."
  - "changelog plugin auto-regenerates CHANGELOG.md during real release prepare → no manual edit."
  - "exec prepareCmd (release.mjs) stamps 1.0.0 into BOTH packages + builds, on the real release."

PACKAGE.JSON (all) — NOT MODIFIED by this task:
  - "core & react stay 0.2.5; release.mjs overwrites them to 1.0.0 at publish time."
  - "root stays 0.1.0 private (irrelevant); vue/svelte stay 0.0.0 private (not published)."

CI (.github/workflows):
  - "ci.yml verify job is the local gate (step d). release.yml does the publish on push:main."
  - "This task does NOT trigger release.yml. It prepares + verifies the trigger commit."

NO DATABASE / ROUTES / NEW CONFIG — a release-readiness + verification task; one git commit.
```

## Validation Loop

### Level 1: Baseline evidence (the gap is real)

```bash
# Versions match (contract step a):
node -e "const c=require('./packages/core/package.json').version,r=require('./packages/react/package.json').version;console.log('core='+c,'react='+r,c===r?'MATCH ✓':'MISMATCH ✗')"
# Expected: core=0.2.5 react=0.2.5 MATCH ✓

# No breaking marker exists yet (proves why a new commit is required):
git log v0.2.5..HEAD --format='%s%n%b' | grep -iE '!:|BREAKING CHANGE' || echo "✓ gap confirmed (no breaking marker → would compute 0.3.0)"

# Baseline dry-run (BEFORE the graduation commit) computes 0.3.0:
pnpm exec semantic-release --dry-run --no-ci 2>&1 | grep -iE "next release version" | tee /tmp/release-dry-baseline.log
# Expected (baseline): "The next release version is 0.3.0"
```

### Level 2: The graduation commit is recognized as breaking

```bash
# After Task 3, the commit's message carries a breaking marker:
git log -1 --format='%B' | grep -iE '!:|BREAKING CHANGE' && echo "✓ breaking marker present"
# Expected: matches on the `!:` subject and/or the `BREAKING CHANGE:` footer.
```

### Level 3: Dry-run now computes 1.0.0 (contract step b/c) — the core gate

```bash
pnpm exec semantic-release --dry-run --no-ci 2>&1 | tee /tmp/release-dry-1.0.0.log
grep -E "The next release version is 1\.0\.0" /tmp/release-dry-1.0.0.log && echo "✓ DRY-RUN = 1.0.0"
# Expected: exactly "1.0.0". Notes block lists the v1.0 graduation + feat items (validate, mergeConfigs, useField).

# Dry-run wrote nothing:
git status --short   # expect empty (commit was --allow-empty; dry-run skips prepare/publish/changelog)
```

### Level 4: Full CI suite green (contract step d) + dist correct (step e)

```bash
# Full CI verify (exact contract command):
pnpm lint && pnpm format:check && pnpm typecheck && pnpm typecheck:examples \
  && pnpm test:coverage \
  && pnpm --filter @formality-ui/core --filter @formality-ui/react build \
  && echo "✅ FULL CI GREEN"
# Expected: exit 0. Coverage ≥ 90% on statements/branches/functions/lines (hard gate).

# dist artifacts present and non-empty (contract step e):
for p in core react; do for f in index.js index.cjs index.d.ts; do
  test -s "packages/$p/dist/$f" && echo "✓ packages/$p/dist/$f" || echo "✗ MISSING $p/$f"
done; done
# Expected: all 6 ✓.
```

### Level 5: Release-decision & scope integrity (DOCS line + final state)

```bash
# CHANGELOG auto-generation confirmed (no manual edit needed):
grep -n '@semantic-release/changelog' .releaserc.json && echo "✓ CHANGELOG auto-generated — DO NOT hand-edit"

# Package.json versions UNCHANGED (release.mjs stamps 1.0.0 later, not this task):
grep '"version"' packages/core/package.json    # expect "0.2.5"
grep '"version"' packages/react/package.json   # expect "0.2.5"

# No tag created yet (readiness, not publication):
git describe --tags --abbrev=0                 # expect v0.2.5

# Scope: the only new thing is the graduation commit (no tracked file changes):
git status --short                             # expect clean
git show --stat --oneline HEAD | grep -E '\|' || echo "✓ graduation commit touches no files (--allow-empty)"
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: baseline dry-run computes **0.3.0**; versions **match** (0.2.5/0.2.5); no prior breaking marker.
- [ ] Level 2: graduation commit message carries `!:` AND/OR `BREAKING CHANGE:`.
- [ ] Level 3: post-commit dry-run (`--no-ci`) computes **1.0.0**; release notes include the v1.0 milestone.
- [ ] Level 4: full CI suite exits 0; coverage ≥ 90% all four metrics; `dist/{index.js,index.cjs,index.d.ts}` exist in core & react.
- [ ] Level 5: `.releaserc.json` has the changelog plugin; both package.json still `0.2.5`; last tag still `v0.2.5`; tree clean.

### Feature Validation (contract LOGIC a–e)

- [ ] (a) Verified both `packages/core/package.json` and `packages/react/package.json` have matching versions (0.2.5).
- [ ] (b) Ran the dry-run to see the computed version.
- [ ] (c) Since commits alone yield 0.3.0 (not 1.0.0), added a `BREAKING CHANGE`/`!:` graduation commit (the manual-bump branch was evaluated and rejected with the release.mjs-overwrites reason).
- [ ] (d) Ran the full CI suite one final time — green.
- [ ] (e) Verified the `dist/` builds are correct (all 6 artifacts present + non-empty).
- [ ] DOCS: confirmed semantic-release auto-generates the CHANGELOG (`.releaserc.json` has the plugin) and the generated notes document the v1.0 milestone.

### Code Quality Validation

- [ ] No source/config/docs files modified by this task (graduation commit is `--allow-empty`).
- [ ] No package.json version hand-edited (release.mjs owns that at publish time).
- [ ] No CHANGELOG.md hand-edit (auto-managed by semantic-release).
- [ ] The breaking marker is robust (both `!:` and `BREAKING CHANGE:` footer used).
- [ ] The release decision is documented (commit body explains the v1.0 graduation).

### Documentation & Deployment

- [ ] The commit message clearly states this is the v1.0.0 stable-API graduation.
- [ ] The hand-off note records that pushing to `main` triggers `release.yml` → publish 1.0.0.
- [ ] No irreversible action (npm publish) taken by this task; readiness only.

---

## Anti-Patterns to Avoid

- ❌ Don't **manually bump `package.json` versions to 1.0.0.** `scripts/release.mjs prepare`
  OVERWRITES both `packages/core/package.json` and `packages/react/package.json` with
  `nextRelease.version` (computed from commits) during the real release. A manual bump is
  silently discarded and can desync the `@semantic-release/git` assets. The ONLY working
  mechanism is a breaking-change commit. (See research Q6.)
- ❌ Don't **rely on the existing `feat:` commits to produce 1.0.0.** With default
  commit-analyzer, `feat:` → **minor** (0.3.0), never major. `grep` confirms no breaking
  marker exists in `v0.2.5..HEAD`. You MUST add the graduation commit.
- ❌ Don't **use bare `pnpm release:dry`.** The script is `semantic-release --dry-run` and
  LACKS `--no-ci`, so it is silently skipped outside CI (exit 0, no version output). Use
  `pnpm exec semantic-release --dry-run --no-ci` for the local preview.
- ❌ Don't **hand-edit CHANGELOG.md.** `@semantic-release/changelog` regenerates it during
  the real release's `prepare` step. Hand-editing creates a merge conflict with the
  generated content and violates the contract DOCS branch (auto-generation is confirmed
  present → no manual edit needed).
- ❌ Don't **expect the dry-run to build `dist/` or write files.** In `--dry-run`,
  `prepare`/`publish`/`changelog`/`git` are ALL skipped. To verify dist, run the REAL
  filtered build (`pnpm --filter @formality-ui/core --filter @formality-ui/react build`).
- ❌ Don't **push to `main` as part of this task** (unless explicitly instructed). Pushing
  triggers `release.yml`, which performs an irreversible `pnpm publish` of 1.0.0 to npm.
  The deliverable is "verified ready", not "published". The push is the human/orchestrator's
  final go/no-go.
- ❌ Don't **create the graduation commit with a real file change.** Use `--allow-empty` so
  the commit is message-only. Attaching a file change makes that file part of the release
  commit scope and muddies `git diff --name-only`.
- ❌ Don't **use only a weak breaking signal.** Use BOTH the `!:` shorthand AND the
  `BREAKING CHANGE:` footer for maximum parser compatibility (either alone works, but both
  removes all doubt across versions/configs).
- ❌ Don't **bump or touch vue/svelte.** They are `0.0.0` + `private:true` stubs, NOT in
  `release.mjs`'s `PACKAGES` array, NOT published. The shared version applies only to
  core + react.
- ❌ Don't **weaken the CI/coverage gate to force green.** If `test:coverage` or any step
  fails, investigate the real regression. This is the final gate before publishing 1.0.0 —
  a red step means a real problem, not a nuisance to bypass.
- ❌ Don't **modify `.releaserc.json`, `release.yml`, `ci.yml`, or `release.mjs`.** They are
  the verified-correct release machinery. This task adds ONE git commit and verifies; it does
  not reconfigure the pipeline. (The only optional, out-of-scope improvement is adding
  `--no-ci` to the `release:dry` script — explicitly leave it for a separate task.)

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **verification + single-commit** task whose central decision — that a
  breaking-change commit is mandatory and a manual `package.json` bump is a no-op — is
  **proven by research** (`research/semantic-release-major-bump-behavior.md`, Q1–Q6) and
  **confirmed empirically** (`git log v0.2.5..HEAD | grep BREAKING` returns nothing; versions
  already match at 0.2.5). The implementer cannot go down the dead-end "manual bump" branch
  because the PRP explains WHY it fails (release.mjs overwrites both package.json) and the
  Anti-Patterns forbid it.
- The three non-obvious traps are each enforced by a hard gate: (1) `feat:`→0.3.0 not 1.0.0
  → caught by the Level-3 grep for "1.0.0"; (2) `pnpm release:dry` lacks `--no-ci` → the PRP
  mandates `pnpm exec semantic-release --dry-run --no-ci` and forbids the bare script; (3)
  manual bump is discarded → Anti-Pattern #1 + the "leave versions at 0.2.5" Level-5 check.
- The full-CI command is the **exact** `ci.yml verify` job (verified segment-by-segment in
  `research/ci-and-build-verification.md` §1), and the dist artifact shape is verified against
  the real tsup configs. Every assertion in the validation loop is a concrete, runnable grep/test.
- The only reason this isn't 10/10 is the residual, low-probability risk that a specific
  `semantic-release@25` plugin build still pings a token during dry-run (research Q4 flagged
  version variance) — mitigated by the documented dummy-token fallback — and the human
  judgment of the exact graduation-commit prose (which the `BREAKING CHANGE:` grep makes
  detectable if it were malformed).
