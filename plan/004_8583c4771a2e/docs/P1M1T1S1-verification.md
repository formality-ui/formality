# P1.M1.T1.S1 — Verification Record

**Subtask**: Implement per-field debouncer flush in `submitImmediate`
**Date**: 2026-07-11
**Git HEAD**: `fa75dae` (working tree clean for source — only orchestrator-managed `plan/` files differ)
**Outcome**: ✅ **NO DRIFT — ALREADY SHIPS.** Implementation matches the 4-step contract exactly.

## Outcome

The live implementation at `packages/react/src/components/Form.tsx` (lines 722-746)
already satisfies the full contract. **No source changes were required.** This record
confirms P1.M1.T1.S2 (regression-test suite) can proceed — its tests have a correct
runtime to test against.

## Contract verification (4 steps)

`submitImmediate` is defined at `Form.tsx:722` as a `useCallback` with an **empty
dependency array** (`}, []);` at line 746) — refs-only coordination, stable identity.

| Step | Contract | Location | Verified |
|------|----------|----------|----------|
| 1. Detect pending (both sources) | `const anyPending = debouncedSubmitRef.current?.pending() === true \|\| [...fieldDebouncersRef.current.values()].some((fn) => fn.pending());` | `Form.tsx:733-734` | ✅ |
| 2. Early-return if nothing pending | `if (!anyPending) return;` | `Form.tsx:735` | ✅ |
| 3. Cancel ALL timers | `debouncedSubmitRef.current?.cancel();` + `fieldDebouncersRef.current.forEach((fn) => fn.cancel());` | `Form.tsx:739-740` | ✅ |
| 4. Invoke `executeAutoSave` ONCE | `executeAutoSaveRef.current?.();` | `Form.tsx:745` | ✅ |

**No naive `forEach(fn => fn.flush())`** — the rejected PRD suggestion is correctly absent.

## Mode-A inline comment (verified)

`Form.tsx:723-731` — the comment explains the cancel-then-invoke rationale, citing the
`executionVersionRef` race explicitly:

> "...cancel every idle timer so its trailing callback can't fire a second,
> **version-bumping** invocation that would **abort this flush** (see
> **executionVersionRef** in executeAutoSave), and (c) run the save pipeline
> **exactly once**."

> "...so their later callbacks don't **race** this manual flush."

This fully documents WHY cancel-then-invoke-once (NOT naive flush). ~9 lines, matches
existing tone. Mode A (rides with the work) — no README change needed.

## Dependency verification (prerequisites)

| Ref / helper | Location | Status |
|--------------|----------|--------|
| `pendingChangedFields` | `Form.tsx:215` | ✅ present |
| `fieldDebouncersRef` (Map keyed by ms) | `Form.tsx:225` | ✅ present |
| `debouncedSubmitRef` | `Form.tsx:506` | ✅ present |
| `executeAutoSaveRef` | `Form.tsx:509` | ✅ present |
| `wrapDebounced` definition | `Form.tsx:862` | ✅ present (Issue 3 / P1.M2.T1.S1) |
| `wrapDebounced` wired into `getOrCreateDebounced` | `Form.tsx:659` | ✅ wired |
| `wrapDebounced` wired into `debouncedSubmit` | `Form.tsx:705` | ✅ wired |

The `pending()` prerequisite (`wrapDebounced`, Issue 3) is present and wired into both
call sites — `submitImmediate`'s detection logic works end-to-end.

## Regression tests (verified present — authored by P1.M1.T1.S2)

`packages/react/src/__tests__/autosave-submit-immediate.test.tsx`:

| Scenario | Test line | Status |
|----------|-----------|--------|
| Form-level flush fires | `it(...)` at line 88 | ✅ present, passing |
| Per-field flush fires (Issue 1 repro) | `it(...)` at line 136 | ✅ present, passing |
| Both-pending → single submit (no double/drop) | `it(...)` at line 192 | ✅ present, passing |
| Nothing-pending → no-op (no spurious save) | `it(...)` at line 256 | ✅ present, passing |

Plus 4 `pending()` scenarios at lines 301, 341, 381, 434 — all present and passing.
**No test gaps flagged for P1.M1.T1.S2.** All 8 tests in the suite pass.

## Validation gates (all green)

| Gate | Command | Result |
|------|---------|--------|
| Level 1 — Typecheck | `pnpm typecheck` | ✅ green (tsc --build, no errors) |
| Level 2 — Targeted suite | `pnpm --filter @formality-ui/react test -- autosave-submit-immediate` | ✅ 8/8 passed |
| Level 3 — Full suite | `pnpm test` | ✅ 989 passed, 5 skipped, 0 failed (37 files) |
| Level 3 — Coverage gate | `pnpm test:coverage` (≥90% hard gate, PRD §1.3.7) | ✅ exit 0 — 97.29% stmts / 95.77% branch / 99.1% funcs / 97.29% lines; `Form.tsx` 96.55%/92.96%/100%/96.55% |
| Level 4 — Build | `pnpm --filter @formality-ui/react build` (tsup) | ✅ ESM + CJS + DTS built |
| Level 4 — Lint | `pnpm lint` | ✅ 0 errors (62 pre-existing `no-explicit-any` warnings, none in `submitImmediate`) |

## Repro table (satisfied by passing tests)

| Field debounce setup | Elapsed < field ms | After `submitImmediate()` | Test |
|----------------------|--------------------|---------------------------|------|
| Form-level `debounce={3000}` | 500ms | **1 submit** ✓ | line 88 |
| `inputConfig={{ debounce: 3000 }}` | 500ms | **1 submit** ✓ (was 0 — the bug) | line 136 |
| Both pending simultaneously | 500ms | **1 submit** ✓ (no double) | line 192 |
| Nothing pending | — | **0 submits** ✓ (no-op) | line 256 |

## Diff scope

`git diff --stat` against source shows **no changes** — this subtask verified, did not
modify. (Only orchestrator-managed `plan/` files differ, which are out of scope.) This
matches the PRP's expected outcome: "no drift, already ships."

## Conclusion

P1.M1.T1.S1 is **complete**. The `submitImmediate` implementation is correct against the
4-step contract, the Mode-A comment is present and accurate, and all validation gates
pass. P1.M1.T1.S2 may proceed to own the fuller regression-test suite (already present)
with confidence that the runtime is correct.
