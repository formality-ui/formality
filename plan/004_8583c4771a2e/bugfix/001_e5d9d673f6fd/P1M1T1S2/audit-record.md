# P1.M1.T1.S2 — Verification Record

## Outcome

**No drift, all four Issue-1 tests present + green.**

This was a verify-first subtask. Live-source re-confirmation at execution
time found all four contract scenarios already present in
`packages/react/src/__tests__/autosave-submit-immediate.test.tsx` with bodies
matching the contract exactly. No test edits were required (Task 3 did not
fire). No source/core/Form.tsx files were modified.

## Per-Scenario Verification Table

All line numbers re-confirmed at execution time (git HEAD `093b791`).

| Scenario | `it(...)` title | Line | Body matches contract | Harness patterns | Run result |
|----------|-----------------|------|-----------------------|------------------|------------|
| (a) | `should flush a pending Form-level debounce save immediately` | 88 | ✅ Form `debounce={3000}`, fieldA no per-field debounce, type "x", advance 500ms → no submit, `submitImmediate()` + advance 0ms → 1 submit `{ fieldA: "x" }` | ✅ fake timers `{ shouldAdvanceTime: true }`, ContextCapture, plain-fn TestInput, act-wrapped `userEvent.type({ delay: null })` + `advanceTimersByTimeAsync`, `mockClear()` after settle | PASS |
| (b) | `should flush a pending per-field numeric debounce save immediately (Issue 1 repro)` | 136 | ✅ Form `debounce={500}`, fieldA `inputConfig={{ debounce: 3000 }}`, type "x", advance 500ms → no submit, `submitImmediate()` + advance 0ms → 1 submit `{ fieldA: "x" }`; advance 3000ms → STILL 1 submit (no-double-fire guard retained) | ✅ same as (a) | PASS |
| (c) | `should flush both a Form-level and a per-field pending save as a single submit (no double, no drop)` | 192 | ✅ Form `debounce={2000}`, fieldA Form-level + fieldB `inputConfig={{ debounce: 3000 }}`, type "a"+"b" in single act block, advance 500ms → no submit, `submitImmediate()` + advance 0ms → 1 submit `{ fieldA: "a", fieldB: "b" }`; advance 3500ms → STILL 1 submit (no-double-fire guard retained) | ✅ same as (a); both edits in same `act()` block | PASS |
| (d) | `should be a no-op when nothing is pending (no spurious empty save)` | 256 | ✅ Form `debounce={500}`, no edit, `submitImmediate()` + advance 0ms → not called | ✅ same as (a) | PASS |

### Harness pattern verification (file-wide)

- `vi.useFakeTimers({ shouldAdvanceTime: true })` in `beforeEach` — present
  (lines 81, 294 for the Issue-3 describe).
- `vi.useRealTimers()` in `afterEach` — present (lines 85, 298).
- `ContextCapture` plain-fn consumer rendering `null`, stashing
  `useFormContext()` onto a `MutableRefObject<any>` ref — present (line 70).
- `TestInput` is a **plain function component** consuming `forwardRef` from
  props (line 42); **no `React.forwardRef` wrap** — Issue 4 / §20 contract met.
- `userEvent.type(field, text, { delay: null })` wrapped in `act()` — present
  in all four tests.
- `vi.advanceTimersByTimeAsync` (async variant) wrapped in `act()` — present
  in all four tests.
- `submitHandler.mockClear()` called after the initial mount settle
  (`advanceTimersByTimeAsync(100)`) — present in all four tests.

### Scope boundary respected

- Issue-3 `pending()` describe block (line 289+) — **untouched** (owned by
  P1.M2.T1.S2). All 4 of its tests also pass.
- `Form.tsx` and `packages/core` — **untouched** (`git diff --exit-code` → 0).
- No cross-file test imports (harness is self-contained in the file).

## Test Run Results

### Level 2 — submitImmediate suite

```
$ pnpm --filter @formality-ui/react test -- autosave-submit-immediate

Test Files  1 passed (1)
     Tests  8 passed (8)
```

All 8 tests green: 4 Issue-1 regression tests + 4 Issue-3 pending() tests.

### Level 3 — Full suite + coverage gate

```
$ pnpm test
Test Files  37 passed (37)
     Tests  989 passed | 5 skipped (994)

$ pnpm test:coverage
All files | 97.29 | 95.77 | 99.1 | 97.29 |
Test Files  37 passed (37)
     Tests  989 passed | 5 skipped (994)
```

Coverage **97.29%** (statements) / **95.77%** (branches) / **99.1%**
(functions) / **97.29%** (lines) — all comfortably above the 90% gate
(`vitest.config.ts` thresholds: statements/branches/functions/lines = 90).

### Level 4 — Typecheck, lint, scope

```
$ pnpm typecheck   # tsc --build — green, no output

$ pnpm lint
✖ 62 problems (0 errors, 62 warnings)
```

Lint: **0 errors**. The 62 warnings are all pre-existing
`@typescript-eslint/no-explicit-any` warnings in source files
(`useFormState.ts`, `usePropsEvaluation.ts`, `overlays.ts`, `types.ts`, etc.);
none originate from `autosave-submit-immediate.test.tsx`.

```
$ git diff --stat
 plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/tasks.json | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)

$ git diff --exit-code packages/react/src/components/Form.tsx packages/core
# exit 0 (untouched)
```

The only `git diff` entry is `plan/.../tasks.json` (orchestrator-owned status
bookkeeping, not modified by this agent). **No source, core, or test files
were edited** — Task 3 (author/fix) did not fire because no drift was found.

## Conclusion

The Issue-1 regression lock-in is complete. The four `submitImmediate` flush
regression tests mirroring the Issue 1 repro table are present with exact
contract titles and bodies, exercise `submitImmediate` across all four
scenarios (Form-level flush, per-field flush, both-pending coalesce, idle
no-op), retain the no-double-fire guards (b: 3000ms; c: 3500ms), and pass
against the fixed `submitImmediate` shipped by P1.M1.T1.S1. A future change
to `submitImmediate` or the debounce adapters that re-introduces Issue 1
(silent data loss on the per-field-debounced save path) will trip one of
these tests before it can land.
