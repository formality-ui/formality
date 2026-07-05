# External Dependencies & Tooling Reference

## Vitest coverage (v8)
- **Provider:** `@vitest/coverage-v8` (`^2.0.0`), installed at repo root `devDependencies`.
- **Thresholds** (vitest config): `coverage.thresholds = { statements, branches, functions, lines }`.
  Vitest evaluates thresholds ONLY when coverage is enabled (i.e. `--coverage` flag / `coverage.enabled`).
  Below-threshold → process exits **1**. Docs: https://vitest.dev/guide/coverage.html#coverage-thresholds
- **Workspace resolution:** root `vitest.config.ts` is the cross-cutting config; coverage is resolved
  against the workspace ROOT (`ctx.config.root`), not per-project roots. `vitest.workspace.ts`
  references the per-package configs that define *what* runs.
- **`coverage.exclude` REPLACES defaults** (does not extend) — hence `vitest.config.ts` spreads
  `coverageConfigDefaults.exclude` first, then adds `examples/**`, `packages/svelte/**`,
  `packages/vue/**`, `**/dist/**`.

## GitHub Actions (ci.yml)
- Trigger: `push` to `main` + all `pull_request`.
- Job `verify` (ubuntu-latest, Node 20): checkout → setup pnpm (reads `packageManager`) →
  setup-node (cache: pnpm) → `pnpm install --frozen-lockfile` → lint → typecheck → **test** → build.
- `concurrency` cancels superseded runs on the same ref.
- **No `test:coverage` step anywhere** → the defect.
- `release.yml`: separate workflow (`push: main`), builds + changesets publish; does NOT run tests.

## TypeScript project references
- Root `tsconfig.json` is the base; `examples/tsconfig.json` extends it with
  `composite: true`, `jsx: react-jsx`, references to `packages/core` + `packages/react`.
- Script: `typecheck:examples` = `tsc -p examples/tsconfig.json --noEmit`.
- The example build is **not** part of the main `tsc --build` graph (`typecheck`), so errors
  there are invisible unless `typecheck:examples` is run / added to CI.

## pnpm scripts (root package.json) — relevant subset
| Script | Command | In CI? |
|--------|---------|--------|
| `test` | `vitest run` | ✅ (but no coverage) |
| `test:coverage` | `vitest run --coverage` | ❌ (THE GAP) |
| `typecheck` | `tsc --build` | ✅ |
| `typecheck:examples` | `tsc -p examples/tsconfig.json --noEmit` | ❌ |
| `lint` | `eslint .` | ✅ |

## No new runtime dependencies required
Both fixes are configuration/type-only. No packages need adding or upgrading.
