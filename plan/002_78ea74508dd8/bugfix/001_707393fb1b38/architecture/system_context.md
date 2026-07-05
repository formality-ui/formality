# System Context — Bugfix `001_707393fb1b38`

## Scope
This changeset addresses two defects surfaced by the end-to-end QA validation
of plan `002_78ea74508dd8` (Phase P1: Type-Safety Completion & Coverage Gate):

| Issue | Severity | PRD § | One-line summary |
|-------|----------|-------|------------------|
| 1 | **Critical** | §1.3.7 | The 90% coverage gate is configured but **never run in CI**. |
| 2 | Minor | §1.3.7 (examples) | `pnpm typecheck:examples` fails; the check is not in CI. |

Both are reproducible on current `main`. Neither requires new product features —
they are CI-wiring + type-annotation corrections.

## Repository shape (verified)
- **Monorepo** managed by **pnpm 8.15.0** workspaces (`packageManager` in root `package.json`).
- Packages: `packages/core` (framework-agnostic), `packages/react` (React + react-hook-form overlay),
  `packages/svelte` & `packages/vue` (stubbed/private WIP — excluded from coverage).
- **Test runner:** Vitest 2.x workspace (`vitest.workspace.ts` → core + react per-package configs).
  Root `vitest.config.ts` holds the cross-cutting **coverage** settings (resolves against workspace root).
- **Coverage provider:** `@vitest/coverage-v8` (v8). Installed in root `devDependencies`.
- **Examples:** `examples/*.tsx` (9 files), compiled via `examples/tsconfig.json`
  (`tsc -p examples/tsconfig.json --noEmit`, script `typecheck:examples`).
- **CI:** `.github/workflows/ci.yml` (one job `verify`: lint → typecheck → test → build).
  `.github/workflows/release.yml` builds + publishes via changesets (does **not** run tests).

## Key file → responsibility map
| File | Role |
|------|------|
| `.github/workflows/ci.yml` | PR/push verification pipeline. **Contains the defect (Issue 1).** |
| `package.json` | Defines `test` (`vitest run`) vs `test:coverage` (`vitest run --coverage`). |
| `vitest.config.ts` | Coverage `thresholds` block (statements/branches/functions/lines = 90). **Correct** — matches PRD §1.3.7 verbatim. |
| `packages/react/src/overlays.ts` | `ReactInputConfig`, `ReactFormFieldsConfig`, `defineInputs`, `FormalityFieldComponentProps`. The React-overlay types examples SHOULD use. |
| `packages/core/src/types/config.ts` | Framework-agnostic `InputConfig` (`component: unknown`). The type examples MISUSE for React code. |
| `examples/*.tsx` | 9 demo files. **All fail `typecheck:examples` (Issue 2).** |
| `README.md`, `packages/react/README.md` | User-facing docs that assert coverage is a CI gate (aspirational until Issue 1 is fixed). |

## Documentation surface affected
- **README.md §Scripts** (`pnpm test:coverage` row exists; `pnpm typecheck:examples` does **not**).
- **README.md §Contributing/Testing** — already states coverage "fails CI"; becomes *true* after Issue 1.
- No per-feature doc file is strictly touched by the CI one-liner, but a Mode-B sweep
  documenting that CI runs `test:coverage` + `typecheck:examples` is warranted (see tasks.json final task).

## Cross-cutting decisions
1. **Issue 1 fix is a genuine one-liner.** The thresholds block already exists and is correct;
   only the CI invocation is missing.
2. **Issue 2 scope is LARGER than the PRD states** — see `examples_typecheck.md`. The PRD says
   "12 errors in `09-string-vs-function.tsx`"; the verified reality is **293 errors across all 9 files**.
   Root cause is uniform: examples use the **core** `InputConfig` instead of the **React** overlay.
3. **`typecheck:examples` should be added to CI** after the examples are made clean, so the
   regression cannot recur (PRD Issue 2 explicitly recommends this).

See sibling files: `ci_coverage_gate.md`, `examples_typecheck.md`, `external_deps.md`.
