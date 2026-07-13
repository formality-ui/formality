# Research: semantic-release v25 — Forcing a 1.0.0 major bump from 0.2.5

> Scope: `semantic-release@^25.0.5` + `@semantic-release/commit-analyzer@^13` (default
> config, NO custom `releaseRules`), as configured in this repo's `.releaserc.json`.
> State at research time: last git tag **`v0.2.5`**; ~17 commits since, several `feat:`;
> target version **1.0.0**.

---

## CONCLUSION (the one sentence the implementer needs)

**To release 1.0.0 from 0.2.5 the implementer MUST add ONE commit since `v0.2.5`
that carries a breaking-change marker** — either the `!` shorthand (`feat!:`) or a
`BREAKING CHANGE:` / `BREAKING-CHANGES:` footer. With only the existing `feat:`
commits, semantic-release computes **0.3.0 (MINOR)**, never 1.0.0. There is no
`--release-as` / force-major flag and no `0.x` special-casing. A manual
`package.json` version bump does NOT work (see Q6 / CRITICAL below).

---

## Q1. `feat:` from 0.2.5 → 0.3.0 or 1.0.0?

**0.3.0 (MINOR). A bare `feat:` NEVER produces a major bump.**

Default `preset` = **angular**. Type→level mapping:

| Commit signal | Level |
|---|---|
| `BREAKING CHANGE` / `!` marker | **major** |
| `feat` | **minor** |
| `fix`, `perf` | patch |
| `revert` | patch |
| `build`,`chore`,`ci`,`docs`,`refactor`,`style`,`test` | NO release (default) |

Existing commits since `v0.2.5` include `feat(react): implement useField hook`,
`feat(core): add validate()`, `feat(core): add mergeConfigs()` → each contributes a
**minor**. Aggregated highest = minor → **`0.2.5` → `0.3.0`**.

Empirically confirmed by this repo's CHANGELOG: `0.0.1→0.1.0` and `0.1.0→0.2.0`
were both driven by `feat:` and both produced a MINOR (not a major). No `feat:`
ever produced a major in this repo's history.

## Q2. EXACT mechanism to force MAJOR (to 1.0.0)

Two equivalent, fully-supported markers (you need only ONE; using both is safe):

**(a) `!` shorthand** — a `!` immediately before the `:` ending the type/scope:
```
feat!: graduate to v1.0.0
chore!: graduate to v1.0.0
feat(react)!: redesign useField return signature
```

**(b) footer keyword** (both recognized as aliases):
- `BREAKING CHANGE:` (canonical — with the space)
- `BREAKING-CHANGES:` (hyphenated alias)

```
feat!: graduate Formality to v1.0.0

BREAKING CHANGE: promote @formality-ui/core and @formality-ui/react to
stable 1.0.0 — the v1.0 public API baseline.
```

The analyzer sets the commit's breaking flag → maps to **major**. Confirmed by
the Conventional Commits v1.0.0 spec.

## Q3. Does semantic-release special-case pre-1.0 / 0.x?

**NO.** Unlike npm/semver's "0.x is unstable, breaking only bumps minor" rule,
semantic-release applies the analyzer's level literally. `0.2.5` + breaking →
**`1.0.0`** (major), not `0.3.0`. Confirmed empirically (this repo's `0.0.1→0.1.0`
via `feat:` was a true minor, proving no 0.x patch-only rule).

> Practical consequence: a sequence of `feat:` commits plateaus at 0.3.0, 0.4.0, …
> and NEVER reaches 1.0.0 without an explicit breaking marker.

## Q4. `--dry-run` locally: tokens needed? correct command?

In dry-run, semantic-release runs ONLY `analyzeCommits → verifyRelease →
generateNotes` and PRINTS the computed version + notes. It SKIPS `verifyConditions`,
`prepare`, `publish`, `success`, `fail`. **Because `verifyConditions` is skipped,
`@semantic-release/github`'s verifyConditions does NOT run → no real `GITHUB_TOKEN`
required for a dry-run.**

⚠️ **CI gate gotcha (critical for this repo):** Outside a CI environment,
semantic-release logs *"This run was not triggered in a known CI environment..."*
and **exits 0 doing nothing** — UNLESS `--no-ci` is passed. `--dry-run` does NOT
bypass this gate on its own.

⚠️ **This repo's `release:dry` script is `semantic-release --dry-run` — it LACKS
`--no-ci`.** Running `pnpm release:dry` locally is therefore SKIPPED (exit 0, no
analysis). For a real local preview the implementer MUST run:

```bash
# No tokens required in dry-run; --no-ci defeats the CI-only gate.
pnpm exec semantic-release --dry-run --no-ci
# Belt-and-suspenders if a plugin complains (it should not in dry-run):
GITHUB_TOKEN=dummy NPM_TOKEN=dummy pnpm exec semantic-release --dry-run --no-ci
```

> Optional repo improvement (NOT required by this task's contract): change
> `package.json` script `"release:dry": "semantic-release --dry-run"` to add
> `--no-ci`. Left as optional to keep this task's scope to version bump + verify.

## Q5. In dry-run, do exec / changelog / git run?

**None of them run.** All side-effect steps are skipped in dry-run:

| Plugin | Step | Dry-run? |
|---|---|---|
| `@semantic-release/exec` prepareCmd (`release.mjs prepare`) | prepare | ❌ skip |
| `@semantic-release/exec` publishCmd (`release.mjs publish`) | publish | ❌ skip |
| `@semantic-release/changelog` (write CHANGELOG.md) | prepare | ❌ skip |
| `@semantic-release/git` (commit bumped files) | prepare | ❌ skip |
| `@semantic-release/github` (create release) | success | ❌ skip |

So in dry-run: NO file writes, NO build, NO publish, NO CHANGELOG edit. You only
get the **computed version + generated notes** printed to stdout — exactly what's
needed to confirm "will this produce 1.0.0?".

## Q6. Version read from git tag or package.json? (CRITICAL)

**From the GIT TAG (latest tag matching `tagFormat` default `v${version}`),
NOT from package.json.** Latest tag = `v0.2.5` → current version `0.2.5`.

`package.json` versions are plugin territory. This repo uses `@semantic-release/exec`
(not npm plugin). During `prepare`, **`scripts/release.mjs` OVERWRITES BOTH
`packages/core/package.json` and `packages/react/package.json` with
`nextRelease.version`** (the value computed from commits). The root `package.json`
(`0.1.0`, private) is never consulted.

> ⚠️ **THIS IS WHY THE CONTRACT'S "OR manually set version to 1.0.0" BRANCH DOES
> NOT WORK HERE.** A manual `package.json` bump is silently DISCARDED —
> `release.mjs prepare` rewrites both package versions from `nextRelease.version`
> at release time. To get 1.0.0 you MUST make the commit analysis yield `major`
> via a breaking marker. Editing `package.json` manually is a no-op.

## Sources

- `@semantic-release/commit-analyzer` README — https://github.com/semantic-release/commit-analyzer#readme
  (default preset `angular`; feat→minor; breaking→major; releaseRules opt-in).
- Conventional Commits v1.0.0 spec — https://www.conventionalcommits.org/en/v1.0.0/
  (`!` syntax; `BREAKING CHANGE` footer; `BREAKING-CHANGES` synonym).
- semantic-release gitbook → Configuration (`dryRun`, `noCi`/`ci`, `tagFormat`) —
  https://semantic-release.gitbook.io/semantic-release/usage/configuration
- semantic-release gitbook → Plugins (step lifecycle) —
  https://semantic-release.gitbook.io/semantic-release/usage/plugins
- `@semantic-release/exec` README — https://github.com/semantic-release/exec#readme
- `@semantic-release/changelog` README — https://github.com/semantic-release/changelog#readme
- This repo's `CHANGELOG.md` (empirical: feat→minor history), `.releaserc.json`,
  `scripts/release.mjs`.
