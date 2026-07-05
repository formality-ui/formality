# Issue 1 — CI Coverage Gate Not Enforced (Critical)

## PRD reference
§1.3.7 "Testing Strategy": _"Mandatory coverage gate (90%)… enforced by vitest
coverage thresholds **and run in CI (`pnpm test:coverage`)**… **the build fails
if any metric drops below 90%**."_

## Verified current state
- `.github/workflows/ci.yml`, job `verify`, step (line 38): `- run: pnpm test`.
- `package.json`: `"test": "vitest run"` (NO `--coverage`) vs
  `"test:coverage": "vitest run --coverage"` (the gate).
- `vitest.config.ts` `thresholds` block: `{ statements: 90, branches: 90, functions: 90, lines: 90 }`.
  This is **correct** and matches PRD §1.3.7 verbatim — but vitest only evaluates thresholds
  when coverage is *enabled*, i.e. only via `pnpm test:coverage`.

## Root cause
The thresholds block is inert in CI because CI invokes `pnpm test` (no `--coverage`).
Vitest neither computes coverage nor checks thresholds under `pnpm test`. A future PR that
deletes broad test suites or lands untested code merges **green**, silently defeating the gate.

Local proof (per PRD): `pnpm test` prints no `% Coverage` table and exits 0 even if a
threshold is violated; `pnpm test:coverage` prints the full report and exits non-zero below 90%.

## Fix (confirmed feasible, low-risk)
In `.github/workflows/ci.yml`, replace the test step:
```diff
-      - run: pnpm test
+      - run: pnpm test:coverage
```
The existing `thresholds` block does the enforcement; this single change restores the
PRD §1.3.7 guarantee. **No other workflow needs the change** — `release.yml` does not run tests.

## Why no new test is needed / how to validate
- CI workflow YAML cannot be unit-tested in-repo. Validation strategy:
  1. Confirm `pnpm test:coverage` script exists and is green locally (PRD reports 97.29% stmts — clears 90%).
  2. Confirm `vitest.config.ts` `thresholds` is intact (statements/branches/functions/lines = 90).
  3. Optionally validate the workflow YAML is well-formed (e.g. `actionlint` if available, else visual review).
  4. Regression proof: temporarily raise a threshold to 99 → `pnpm test:coverage` exits non-zero;
     `pnpm test` exits 0 (demonstrating the gate only fires under coverage).

## Risk / blast radius
- **Negligible.** One line. Coverage currently sits at 97.29%/95.56%/99.07%/97.29% — a comfortable
  margin above the 90% gate, so the first CI run will be green. The only "cost" is CI runtime
  (v8 coverage instrumentation), which is acceptable for a correctness gate.

## Notes for implementing agent
- Do **not** duplicate the thresholds logic into CI; the source of truth is `vitest.config.ts`.
- Do **not** add `pnpm test:coverage` to `release.yml` (release only builds + publishes).
- Optional hardening (cache the v8 provider) is OUT OF SCOPE for this minimal fix; track separately.
