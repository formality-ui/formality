# Bug Fix Requirements

## Overview

End-to-end validation of plan `002_78ea74508dd8` (Phase P1: Type-Safety Completion &
Coverage Gate) against `PRD.md`. The type-safety deliverables (R2–R4) and the local
coverage configuration (R1) were verified directly:

- `pnpm typecheck` → green. The generic `<Form<TFieldValues>>` key-narrowing, generic
  `FieldProps<TName>`, `defineInputs`, and `FormalityFieldComponentProps` all behave as
  specified, AND are genuinely exercised by build-time assertion files
  (`packages/react/src/__typechecks__/*.test-d.ts`,
  `packages/react/src/typeAssertions/injectedProps.types.ts`) — confirmed present in
  `packages/react/tsconfig.tsbuildinfo`, so the `@ts-expect-error` directives are real
  compile gates, not dead code.
- `pnpm test:coverage` → green at **97.29% statements / 95.56% branches / 99.07%
  functions / 97.29% lines** (941 passing). The `thresholds` block added in P1.M2.T1.S5
  matches PRD §1.3.7 verbatim and correctly fails the run below 90%.
- `pnpm lint` → 0 errors.
- README documentation (P1.M3.T1) is accurate and honest (correctly flags per-form
  `Field` name-narrowing as a deferred follow-up).

**The headline defect is NOT in the coverage *configuration* — it is that the gate is
never actually *run* in CI**, which directly violates the governing PRD requirement and
renders the entire P1.M2 milestone ("Coverage gate — 90% **enforced** and green") inert
in the only place enforcement matters. One additional latent (out-of-CI) defect was found
in the examples and is recorded as Minor.

---

## Critical Issues (Must Fix)

### Issue 1: The 90% coverage gate is NOT enforced in CI — PRD §1.3.7 is violated

**Severity**: Critical

**PRD Reference**: §1.3.7 "Testing Strategy" — _"**Mandatory coverage gate (90%).** The
repository MUST maintain ≥ 90% coverage across statements, branches, functions, and
lines. This is a hard quality gate, enforced by vitest coverage thresholds **and run in
CI (`pnpm test:coverage`)**; **the build fails if any metric drops below 90%**."_

**Expected Behavior**: CI runs `pnpm test:coverage` (or equivalent) on every push/PR, so
the vitest `thresholds` block fires and the CI build **fails** whenever any of
statements/branches/functions/lines drops below 90%.

**Actual Behavior**: The CI workflow runs `pnpm test`, which is defined as `vitest run`
with **no `--coverage` flag**. Vitest only computes coverage (and enforces thresholds)
when coverage is enabled, so the thresholds added in P1.M2.T1.S5 are **completely inert
in CI**. Coverage can regress to any level and CI stays green.

Evidence (current `main`):
- `.github/workflows/ci.yml`, `verify` job, step `- run: pnpm test` (line 38). There is
  **no** `pnpm test:coverage` step anywhere in `ci.yml` or `release.yml`.
- `package.json`: `"test": "vitest run"` (no coverage) vs
  `"test:coverage": "vitest run --coverage"` (the gate).
- Local proof: `pnpm test 2>&1 | grep -cE "% Coverage|threshold|ERROR.*coverage"` →
  **0** (no coverage report, no threshold check). `pnpm test:coverage` → full report +
  threshold enforcement.

Consequence: an entire milestone (P1.M2, "Coverage gate — 90% **enforced**") and an
explicit, "Mandatory"/"MUST"/"build fails" PRD requirement are satisfied only on a
developer's laptop. A future PR that deletes broad test suites (or lands untested code)
will merge with a green CI, silently undoing the protection this changeset was meant to
deliver.

**Steps to Reproduce**:
1. `cat .github/workflows/ci.yml` — observe the only test step is `pnpm test`.
2. `pnpm test` — note no `% Coverage` table is printed and no threshold is evaluated.
3. (Equivalent demonstration of the gap) Temporarily raise a threshold in
   `vitest.config.ts` to 99 (or delete a test file) → `pnpm test` still exits 0; only
   `pnpm test:coverage` exits non-zero. CI would therefore pass a sub-90% regression.

**Suggested Fix**: In `.github/workflows/ci.yml`, replace the test step:

```diff
-      - run: pnpm test
+      - run: pnpm test:coverage
```

The existing `thresholds` block in `vitest.config.ts` already fails the run below 90%, so
this one-line change restores the PRD §1.3.7 guarantee. (Optional hardening: also cache
the v8 coverage provider and/or add `pnpm typecheck:examples` as a separate non-blocking
or blocking step — see Issue 2.)

---

## Major Issues (Should Fix)

_None found within the scope of P1's deliverables._ The type-safety exports, the local
coverage configuration, and the README documentation all meet their PRD/contract
requirements.

---

## Minor Issues (Nice to Fix)

### Issue 2: `pnpm typecheck:examples` fails (latent — not enforced in CI)

**Severity**: Minor

**PRD Reference**: §1.3.7 (examples are excluded from the coverage gate but are still
shipped user-facing documentation); examples are the canonical "how to use Formality"
reference.

**Expected Behavior**: `pnpm typecheck:examples` exits 0 so the example snippets
consumers copy from actually compile.

**Actual Behavior**: `pnpm typecheck:examples` exits **2** with 12 TypeScript errors,
all in `examples/09-string-vs-function.tsx`, e.g.:

- `error TS2322: Type 'Record<string, InputConfig<unknown>>' is not assignable to type
  'Record<string, ReactInputConfig<unknown>>'.` (`component: unknown` vs
  `ComponentType<any>`) at lines 261, 375, 457 — i.e. a `FormalityProvider inputs={...}`
  literal typed against the *core* `InputConfig` instead of the React overlay
  `ReactInputConfig`.
- `error TS2365: Operator '>=' cannot be applied to types '{}' and 'number'.` and
  `TS2362/TS2363` arithmetic errors at lines 250, 354, 357, 359, 362 — condition
  expression values widening to `{}`.

**Scope note (important for triage)**: These errors do **not** appear to be introduced by
this changeset (P1). They involve the `ReactInputConfig` overlay (added in a prior
changeset, `e2bf5a7`) and expression/operator typing — neither of which P1 (R2–R5)
touched. P1 only changed `ReactFormFieldsConfig` key-narrowing, `FieldProps<TName>`,
`defineInputs`, `FormalityFieldComponentProps`, the coverage gate, and READMEs. They are
recorded here for completeness because the QA pass surfaced them; they may be better
tracked under a separate maintenance task. They are additionally latent because
`typecheck:examples` is not a CI step.

**Steps to Reproduce**: `pnpm typecheck:examples` (from repo root).

**Suggested Fix**: Either (a) type the example `inputs` literals with
`defineInputs({...})` / `satisfies Record<string, ReactInputConfig>` so `component` is a
real `ComponentType`, and annotate the comparison expressions (or cast) so the operands
are `number`; or (b) add `pnpm typecheck:examples` to CI so this regressions are caught
going forward. At minimum, decide whether shipped examples must stay type-clean and wire
the check into CI accordingly.

---

## Testing Summary

- Total tests performed: 941 passing / 6 skipped (via `pnpm test:coverage`).
- Coverage: 97.29% statements / 95.56% branches / 99.07% functions / 97.29% lines —
  clears the 90% gate with margin.
- Passing gates: `pnpm typecheck` ✅, `pnpm test` ✅, `pnpm test:coverage` (thresholds)
  ✅, `pnpm lint` (0 errors) ✅.
- Failing gates: `pnpm typecheck:examples` ❌ (Issue 2).
- **Critical finding: the 90% coverage gate is not invoked by CI** (Issue 1).
- Areas with good coverage / verified correct:
  - Generic `<Form<TFieldValues>>` config key-narrowing (R2/T2.1 step 1) — verified via
    build-time `@ts-expect-error` assertions present in the tsc build graph.
  - Generic `FieldProps<TName>` (R2/T2.1 step 2) — verified; default `string` is
    non-breaking, narrowed form rejects typos.
  - `defineInputs` identity helper (R3/T2.2) — referential identity + literal-key union
    both verified at runtime and type level.
  - `FormalityFieldComponentProps<P>` (R4/T3.1) — exported, reused as the internal cast
    in `Field.tsx:470`, destructure-before-forward pattern documented and type-proven.
  - Coverage thresholds config (R1/T2.1.S5) — matches PRD §1.3.7 verbatim; green locally.
- Areas needing attention:
  - CI must run `pnpm test:coverage` (Issue 1 — Critical).
  - Examples do not typecheck and the check is not in CI (Issue 2 — Minor).
