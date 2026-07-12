# P1.M2.T1.S2 — pending() regression tests: ALREADY EXIST & PASS

## TL;DR

The work this task describes is **already complete and shipped** (commit
`0dca79a`, the combined Issue 1 + Issue 3 fix). All 4 contract scenarios (a)-(d)
from the item description exist **verbatim** — same test titles, same assertion
sequences — inside the `describe("AutoSave DebouncedFunction.pending() reflects
real state (Issue 3)", …)` block of
`packages/react/src/__tests__/autosave-submit-immediate.test.tsx`, and they
**pass** (verified: `pnpm vitest run autosave-submit-immediate.test.tsx` →
8 passed, 0 failed).

This mirrors the sibling S1 task exactly: the orchestrator status
("Researching") is a planning-time assumption; the codebase is the source of
truth and already satisfies the contract. Expected code diff for this task:
**EMPTY**.

## Contract → existing-test verification map

| contract scenario | existing test (`it(...)` title) | location | match |
| ----------------- | ------------------------------- | -------- | ----- |
| (a) pending true while scheduled, false after fire | `"debouncedSubmit.pending() should be true while a Form-level save is scheduled and false after it fires"` | autosave-submit-immediate.test.tsx (Issue 3 describe) | ✅ exact — debounce={500}, pending()===false init, type→pending()===true, advance 600ms→pending()===false |
| (b) pending false after cancel() | `"debouncedSubmit.pending() should be false after cancel() clears a scheduled save"` | same describe | ✅ exact — type→pending()===true, cancel()→pending()===false, advance 1000ms→submitHandler NOT called |
| (c) flush() fires pending numeric save immediately | `"debouncedSubmit.flush() should fire a pending numeric-debounce save immediately"` | same describe | ✅ exact + STRONGER — also asserts payload {fieldA:"x"} and no-double after 1000ms |
| (d) immediate (debounce:false) adapter never pending | `"the immediate (debounce: false) adapter is never pending"` | same describe | ✅ exact — debounce={false}, type, advance 0ms→pending()===false |

All 4 titles match the item description's scenarios (a)-(d) **word for word**.
The assertion sequences match or exceed the contract.

## Placement contract satisfied

Item OUTPUT requires: "The pending() regression suite lives alongside the
Issue 1 tests in autosave-submit-immediate.test.tsx." → **CONFIRMED**: both
describe blocks (Issue 1 flush + Issue 3 pending) coexist in the same file,
sharing one harness (TestInput/baseInputs/ContextCapture) and one
beforeEach/aftergether fake-timer setup.

## API surface exercised (all confirmed present + working)

- `ctx.debouncedSubmit` — the public `DebouncedFunction` on `FormContextValue`,
  reached via `<ContextCapture/>` + `useFormContext()`.
- `.pending()` — returns the `wrapDebounced` closure flag `isPending`
  (Form.tsx:~882). True while a save is scheduled; cleared by the lodash
  trailing invocation, by `cancel()`, and by `flush()`.
- `.cancel()` / `.flush()` — public adapter methods (Form.tsx:~870-876).
- Immediate adapter (`debounce={false}`) keeps `pending: () => false`
  (Form.tsx:~699) — correct: an immediate fn is never pending. Covered by (d).
- `DebouncedFunction` interface: `types.ts:117-123`
  (`(): void; cancel; flush; pending: () => boolean`).

## Validation run (executed during research)

```
pnpm vitest run packages/react/src/__tests__/autosave-submit-immediate.test.tsx
→ Test Files  1 passed (1)
→ Tests      8 passed (8)     [4 Issue 1 + 4 Issue 3]
```

## Residual gaps

**None.** The 4 contract tests exist, match verbatim, and pass. There is no
test to add, no test to fix, and no test to move. The only legitimate
deliverable is a **verification pass** proving the above, after which the git
diff should be empty (or, at most, a clarifying comment — but none is needed).

## Risk

The single risk (identical to S1): an implementing agent sees the
"Researching" status, assumes the work is open, and **rewrites or duplicates**
the existing passing tests — which could introduce flakiness or a conflicting
describe block. The PRP must lead with an "ALREADY EXISTS" banner and forbid
duplication.
