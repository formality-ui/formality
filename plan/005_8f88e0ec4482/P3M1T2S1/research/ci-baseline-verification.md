# Research Notes — P3.M1.T2.S1 (Run full CI verification suite)

## Method

This is a **verification** task. The most valuable research is empirical: run each
of the 6 CI steps (`.github/workflows/ci.yml` `verify` job) on the current tree
and record the exact exit code + output. All numbers below were captured on
2026-07-13 by executing the real commands.

## 1. The CI contract (`.github/workflows/ci.yml` → job `verify`)

The `verify` job runs these steps **in order** (each must be green):

```
pnpm install --frozen-lockfile   # CI-only; locally deps already installed
pnpm lint                        # → package.json: "eslint ."
pnpm format:check                # → "prettier --check ."
pnpm typecheck                   # → "tsc --build"  (root tsconfig references core+react)
pnpm typecheck:examples          # → "tsc -p examples/tsconfig.json --noEmit"
pnpm test:coverage               # → "vitest run --coverage"  (90% gate, §1.3.7)
pnpm --filter @formality-ui/core --filter @formality-ui/react build   # → tsup, both packages
```

## 2. Empirical baseline — per-step results (current tree: P1+P2+S1 done, S2 in progress)

| # | Step | Exit | Verdict | Detail |
|---|------|------|---------|--------|
| 1 | `pnpm lint` | **0** | ✅ PASS | **0 errors**, 63 `@typescript-eslint/no-explicit-any` **warnings** (warnings never fail CI — `eslint .` exits non-zero only on errors). Warning sites: Form.tsx, useConditions.ts, useField.tsx, useFormState.ts, usePropsEvaluation.ts, overlays.ts, types.ts. |
| 2 | `pnpm format:check` | **1** | ❌ **FAIL** | See §3 below — the ONE definite defect this task fixes. |
| 3 | `pnpm typecheck` | **0** | ✅ PASS | `tsc --build` clean. Root tsconfig references `packages/core` + `packages/react`. |
| 4 | `pnpm typecheck:examples` | **0** | ✅ PASS | `tsc -p examples/tsconfig.json --noEmit` clean. 9 example files (01–09). |
| 5 | `pnpm test:coverage` | **1** | ⚠️ FAIL NOW / ✅ gate HEALTHY | See §4 — failures are S2's WIP audit test; the **90% coverage threshold itself PASSES**. |
| 6 | `pnpm --filter ...core --filter ...react build` | **0** | ✅ PASS | Both packages emit ESM+CJS+DTS via tsup. core DTS 54.5KB; react DTS 48.8KB. |

## 3. THE DEFINITE DEFECT — `pnpm format:check` fails (Step 2)

`prettier --check .` flags these files (exit 1):

```
[warn] packages/core/src/__tests__/config.test.ts          # from S1 (commit 71ead92)
[warn] packages/core/src/__tests__/validation.test.ts       # from S1 (commit 71ead92)
[warn] packages/react/src/__tests__/useField.test.tsx       # from P2 (commit 6f6200c)
[warn] packages/react/src/__tests__/prd-compliance.audit.test.tsx   # S2 WIP (untracked) — S2's responsibility
```

**Root cause:** prettier formatting drift — long object literals written on one line
that prettier wants broken across lines. Example diff (config.test.ts):

```diff
-        inputs: { textField: { component: null, defaultValue: "" } as InputConfig },
+        inputs: {
+          textField: { component: null, defaultValue: "" } as InputConfig,
+        },
```

**The 3 COMMITTED files are NOT fixed by S2** (S2's scope = react audit test +
`packages/react/PRD_AUDIT.md` + optional Form.tsx §8.5 edit). So these 3 format
violations **persist into this task's INPUT** and are the guaranteed concrete fix.

**Fix:** `pnpm format` (→ `prettier --write .`). `.prettierignore` already excludes
`plan/`, `PRD.md`, `CHANGELOG.md`, `**/dist/`, `coverage/`, `*.tsbuildinfo` — so the
write only touches real source/test files. **This is "fix the root cause, not the
gate": reformat the files; do NOT loosen format:check or add ignores.**

**Why S1 shipped with format violations:** there is no local pre-commit hook
mandating `format:check`; CI is the only enforcer, and these commits were made
locally. This task is the safety net that catches them before v1.0.

## 4. Coverage gate (Step 5) — HEALTHY; test failures are S2 WIP

**Coverage threshold status (root `vitest.config.ts`):** `statements/branches/
functions/lines` all `90`. **Aggregate gate PASSES** comfortably:

```
All files | 97.29 (stmts) | 94.73 (branches) | 99.13 (funcs) | 97.29 (lines)
```

(Measured by excluding S2's 2 WIP files so the suite could complete; the numbers
are representative — the committed tree minus S2's in-flight work.)

The current `pnpm test:coverage` **exit 1 is caused by 3 failing TESTS**, not by
the coverage threshold. All 3 are in S2's WIP audit file
`packages/react/src/__tests__/prd-compliance.audit.test.tsx` (untracked):

1. `PRD §6 > UnusedFields renders undeclared fields...` → `ReferenceError: UnusedFields is not defined` (missing import in the WIP test).
2. `PRD §12 > submitImmediate is exposed on the Form render API` → `expected 'undefined' to be 'function'`.
3. (3rd failure — see vitest output).

**These are S2's responsibility.** Per the S2 PRP contract, S2 delivers a passing
audit test (with a documented fallback for §8.5). **When this task (T2.S1) runs,
S2 will be COMPLETE → these tests pass.** This task's job is to VERIFY that (run
the full suite and confirm green), NOT to write S2's audit logic.

### Sub-90 files (do NOT fail the aggregate gate — informational)
- `react/src/hooks/usePropsEvaluation.ts`: branch **72%** (documented in S2 PRP;
  aggregate branch 94.73% absorbs it). **Never add `perFile: true`** — it would
  fail CI on 0% type-only modules (`types.ts`, barrel `index.ts`).
- `react/src/index.ts`, `react/src/types.ts`, `core/src/types/*`,
  `react/src/typeAssertions/*`: 0% by design (type-only/barrels; excluded by
  intent, not by config — they're tiny and the aggregate absorbs them).

## 5. Stray debug file — `debug-85.test.tsx`

`packages/react/src/__tests__/debug-85.test.tsx` (54 lines, untracked, S2
artifact — `describe("debug §8.5 timing", ...)`). It is **collected by vitest**
(contributed to the 40-file count) and currently passes, but it is a throwaway
debug test, NOT a real assertion. **S2 must remove it.** If it survives into
this task's input, this task should delete it (it pollutes the suite and the
`git diff`). Verify it's gone as part of the pre-flight.

## 6. Tooling / hygiene facts (verified)

- **`.gitignore`**: `dist/`, `coverage/`, `*.tsbuildinfo`, `.tsbuildcache/`,
  `.pi/`, `.pi-subagents/` all ignored → build/coverage artifacts never pollute git.
- **`git check-ignore`** confirms `packages/core/dist` + `packages/react/dist` ARE
  ignored.
- **`vitest.config.ts` (root)** `coverage.exclude` REPLACES vitest defaults, so it
  spreads `coverageConfigDefaults.exclude` first, then adds `examples/**`,
  `packages/svelte/**`, `packages/vue/**`, `**/dist/**`, **and `scripts/**`**.
  ⚠️ `scripts/**` is a **documented deviation** from PRD §1.3.7's literal exclude
  list (which omits `scripts/`); the config comment explains why
  (`scripts/release.mjs` is a one-off semantic-release driver, not shipped source).
  This deviation is INTENTIONAL and ALREADY DOCUMENTED — do not "fix" it by
  removing `scripts/**` (that would drop coverage below baseline noise).
- **`vitest.workspace.ts`** wires `packages/core/vitest.config.ts` +
  `packages/react/vitest.config.ts`. Svelte/Vue adapters are excluded from the
  workspace (stubbed, §1.3.7).
- **`pnpm` version** pinned via `packageManager: pnpm@8.15.0`; Node 20 in CI.
- **Test file counts**: 11 core `.test.ts`, 26 react `.test.tsx` (37 total) plus
  `.test-d.ts` type tests under `__typechecks__` (not run by `vitest run`; run by
  typecheck via tsd-style assertions compiled by tsc).

## 7. What this task actually DOES (concrete)

This is a **small fix + verification** task, not a feature build:

1. **Pre-flight**: confirm S2 is complete (`packages/react/PRD_AUDIT.md` exists;
   `prd-compliance.audit.test.tsx` is committed/tracked; `debug-85.test.tsx` is gone).
2. **Run all 6 steps in CI order.** Record each exit code.
3. **Fix the ONE guaranteed defect**: `pnpm format` to resolve the prettier
   violations in `config.test.ts`, `validation.test.ts`, `useField.test.tsx` (and
   any S2-leftover if untracked). Root-cause fix only.
4. **If any OTHER step fails** (e.g. S2's audit test still red, or a lint error
   surfaced): fix the ROOT CAUSE (real code), never weaken/skip the gate.
   Escalate to the human if a failure is fundamentally out of scope.
5. **Output**: all 6 steps green. v1.0 is release-ready from the quality-gate
   perspective (feeds P3.M3.T1 version bump).

No new user-facing files required ("DOCS: none"). The deliverable is the GREEN
state + the `pnpm format` diff. An optional short verification note may be added
but is not mandated by the contract.

## 8. Scope boundaries / do-NOT list

- Do NOT edit `PRD.md`, `tasks.json`, `prd_snapshot.md`, `gap_analysis.md`,
  `plan/**`, `CHANGELOG.md`, `README.md`.
- Do NOT touch `vitest.config.ts` thresholds (90 is the §1.3.7 contract) and do
  NOT add `perFile: true`.
- Do NOT remove the `scripts/**` coverage exclude (documented intentional deviation).
- Do NOT convert lint `no-explicit-any` **warnings** to errors or fix all 63 — they
  are warnings, exit 0, out of scope (would balloon the diff; not a gate failure).
- Do NOT write S2's audit logic. If S2's test is red at task time, that is S2's
  incomplete work — flag it, don't paper over it.
- Do NOT loosen `format:check` (no `.prettierignore` additions, no
  `--no-error-on-unmatched-pattern`). Reformat the files.
