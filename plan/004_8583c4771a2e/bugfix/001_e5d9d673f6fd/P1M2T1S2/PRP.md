name: "P1.M2.T1.S2 — Regression tests for DebouncedFunction.pending() state transitions (Issue 3)"
description: |

---

## ⚠️ CRITICAL CONTEXT — READ FIRST: THE TESTS ALREADY EXIST AND PASS

Before any editing, the implementing agent MUST understand that the work this
task describes is **already complete and shipped** in the current working tree.
It landed in commit **`0dca79a`** — *"fix(react): flush per-field debounce
saves in submitImmediate; fix pending() ← Issues 1+3"* — which was the
**combined** Issue 1 + Issue 3 change. The Issue-1 implementation task
(`P1.M1.T1.S1`, marked Complete) folded in the Issue-3 regression **tests**
(this task) because the fix and its tests are inseparable: you cannot ship a
`pending()` correctness fix without the tests that prove `pending()` flips
correctly.

**Consequence for the implementer:**
- **DO NOT create the 4 `pending()` tests.** They exist, verbatim, inside the
  `describe("AutoSave DebouncedFunction.pending() reflects real state (Issue
  3)", …)` block of
  `packages/react/src/__tests__/autosave-submit-immediate.test.tsx`. Their
  titles match the item-description scenarios (a)-(d) word for word.
- **DO NOT add a second `pending()` describe block** elsewhere. That would
  duplicate coverage and can cause flaky double-invocation under fake timers.
- This PRP is therefore a **VERIFY-AND-FINALIZE** PRP: confirm — via the
  contract-to-test verification map below — that every scenario (a)-(d) is
  present and passing in the current file, then run the validation gates to
  prove it. That is the entirety of the work. The expected `git diff` is
  **EMPTY**.

The honest framing: the orchestrator's task status ("Researching") reflects a
planning-time assumption that this work was still open; the actual codebase
already satisfies the contract. This PRP's job is to (a) document that fact,
(b) give the agent a precise checklist to prove it, and (c) explicitly forbid
rewriting/duplicating working tests. This is the exact same situation as the
sibling task `P1.M2.T1.S1` (see its PRP's "ALREADY EXISTS" banner).

---

## Goal

**Feature Goal**: Guarantee that `DebouncedFunction.pending()` — the public
method on the Form-level `debouncedSubmit` (and, by shared construction, the
per-field debounce cache) — has a regression suite asserting its real scheduled
state transitions: `false` at rest → `true` while a save is scheduled → `false`
after it fires / is cancelled / is flushed, and `false` always for the
immediate (`debounce: false`) adapter. The suite must live alongside the
Issue 1 tests in `autosave-submit-immediate.test.tsx`.

**Deliverable**:
1. **Verification** (no code change): confirm, via the contract-to-test map
   below, that all four contract scenarios (a)-(d) are present in
   `packages/react/src/__tests__/autosave-submit-immediate.test.tsx` — correct
   describe block, correct `it(...)` titles, correct assertion sequences — and
   that the file is green.
2. **Validation**: run the file in isolation and as part of the full gate; all
   must pass.
3. **No new test files. No new describe blocks. No edits** unless a genuine
   gap is found (none is expected).

**Success Definition**:
1. Every contract scenario (a)-(d) is confirmed present (checked off) in
   `autosave-submit-immediate.test.tsx`, inside the
   `"AutoSave DebouncedFunction.pending() reflects real state (Issue 3)"`
   describe block.
2. `pnpm vitest run packages/react/src/__tests__/autosave-submit-immediate.test.tsx`
   reports **8 passed (0 failed)** — 4 Issue 1 flush tests + 4 Issue 3
   `pending()` tests.
3. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:coverage` (≥90%) all
   green.
4. `git diff` is **empty** (or, if a genuine micro-gap was found and fixed,
   confined to `autosave-submit-immediate.test.tsx`).

## User Persona

**Target User**: Formality maintainers and any consumer who reads the
`DebouncedFunction` contract (`packages/react/src/types.ts:117-123`) and
relies on `.pending()` — either directly, or implicitly through
`ctx.submitImmediate()`, whose flush/no-flush decision
(`Form.tsx:733-734`) reads `.pending()` across both the Form-level and
per-field timer sources.

**Use Case**: A "Save Now" button calls `ctx.submitImmediate()`. That flush's
correctness (Issue 1) **depends on** `pending()` being truthful (Issue 3):
if `pending()` falsely reports `false` while a save is scheduled, the flush's
"nothing pending → early-return" guard skips a real pending save. The
`pending()` regression suite is what pins this invariant.

**Pain Points Addressed**: PRD §4.1 documents
`pending: () => boolean; // Check if there's a pending invocation`. Before
commit `0dca79a` every debouncer hardcoded `pending: () => false` (lodash's
real `.pending()` was shadowed by `Object.assign`), so the API misreported
"not pending" while a save was scheduled. The `wrapDebounced` fix (S1) tracks
`isPending` explicitly; this task's tests prove it flips correctly. Both
shipped together.

## Why

- **Contract accuracy (PRD §4.1 / Issue 3).** `DebouncedFunction.pending()` is
  a documented public surface. A regression suite is the only way to prevent
  a future refactor from silently re-introducing the hardcoded `() => false`.
- **Guards the Issue 1 fix.** `submitImmediate`'s "anything pending?" guard
  reads `.pending()`. Wrong `pending()` ⇒ skipped flush (Issue 1 regression).
  The `pending()` suite is the canary for both issues.
- **Scope discipline.** This subtask owns ONLY the `pending()` regression
  tests. The `wrapDebounced` implementation is `P1.M2.T1.S1`; the public-API
  / CHANGELOG narrative is `P1.M3.T1`. Both are tracked separately — do not
  duplicate.

## What

A verify-and-finalize pass over the existing `pending()` regression suite in
`packages/react/src/__tests__/autosave-submit-immediate.test.tsx`. No new
files, no new tests, no behavior change. The expected diff is empty.

### Success Criteria

- [ ] Contract-to-test verification map (below) fully checked — scenarios
      (a)-(d) all present in the Issue 3 describe block.
- [ ] `pnpm vitest run packages/react/src/__tests__/autosave-submit-immediate.test.tsx`
      → 8 passed (4 Issue 1 + 4 Issue 3), 0 failed.
- [ ] Immediate-adapter test (d) still asserts `pending() === false` for
      `debounce={false}` (the adapter correctly hardcodes `() => false`).
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:coverage` green.
- [ ] `git diff` empty (or confined to this one test file if a genuine
      micro-gap was found and fixed — none is expected).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the
`DebouncedFunction` interface contract, the exact test file and describe block
containing the `pending()` tests, the `wrapDebounced` shape that makes
`pending()` truthful, the shared test harness conventions (fake timers +
`ContextCapture`), and the proof that the tests already pass. All cited below
with exact paths and line numbers. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ - include in context window before implementing
- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/system_context.md
  section: "Issue 3 (Minor): pending() correctness — ✅ FIXED" + "Testing Patterns" + "DebouncedFunction Contract"
  why: |
    Authoritative system map. Confirms the pending() tests live in
    autosave-submit-immediate.test.tsx, that wrapDebounced (Form.tsx:862-884)
    tracks isPending explicitly, and lists the exact fake-timer +
    ContextCapture patterns the suite uses.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M2T1S1/PRP.md
  section: "CRITICAL CONTEXT — THE IMPLEMENTATION ALREADY EXISTS" + "Contract-Verification Map"
  why: |
    The sibling task's PRP. It establishes (with the same evidence) that the
    wrapDebounced fix AND its regression tests shipped together in commit
    0dca79a. Its scope-fence explicitly assigns the pending() tests to THIS
    task (P1.M2.T1.S2) and notes they "ALREADY EXIST at
    autosave-submit-immediate.test.tsx:289". Read it to understand the
    parallel verify-and-finalize framing.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M2T1S2/research/pending-tests-already-exist.md
  section: "Contract → existing-test verification map"
  why: |
    The per-scenario proof, compiled during this PRP's research, that each
    contract scenario (a)-(d) maps 1:1 to an existing passing test with a
    verbatim title. This IS the core deliverable evidence.

- file: packages/react/src/__tests__/autosave-submit-immediate.test.tsx
  section: |
    The ENTIRE file, especially:
      - shared harness: TestInput, baseInputs, ContextCapture (top of file)
      - describe "AutoSave submitImmediate flushes per-field debounce (Issue 1)"
        (4 tests)
      - describe "AutoSave DebouncedFunction.pending() reflects real state
        (Issue 3)" (4 tests) ← THIS TASK'S SUBJECT
  why: |
    The System Under Verification. The contract-to-test map below maps each
    item-description scenario to a specific `it(...)` in this file. Read the
    Issue 3 describe block first and confirm every scenario before touching
    anything.
  pattern: |
    Each Issue 3 test follows this shape (copy of the harness from
    autosave-validation/autosave-field-debounce):
      const ref: MutableRefObject<any> = { current: null };
      render(<FormalityProvider inputs={baseInputs}>
        <Form config={{ fieldA:{type:"textField"} }} onSubmit={submitHandler}
              autoSave debounce={500}>
          <Field name="fieldA" />
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>);
      await act(async () => { await vi.advanceTimersByTimeAsync(100); });
      const debounced = ref.current.debouncedSubmit;
      // ... drive a change, assert debounced.pending() transitions ...
  gotcha: |
    The public surface is `ref.current.debouncedSubmit` (a DebouncedFunction on
    FormContextValue), reached ONLY via a ContextCapture consumer calling
    useFormContext(). Do not try to import debouncedSubmit directly — it is
    internal to <Form>.

- file: packages/react/src/components/Form.tsx
  section: |
    wrapDebounced (lines ~851-884) + debouncedSubmit useMemo (~689-711,
    immediate adapter ~692-702 + normal branch ~705) + submitImmediate
    (~722-745, reads .pending() at ~733-734)
  why: |
    The implementation these tests exercise. wrapDebounced's pending() returns
    the isPending closure flag; the immediate adapter keeps
    pending: () => false. submitImmediate is the real consumer that makes
    correct pending() load-bearing. Read these ranges to understand WHAT the
    tests are proving (you will not edit them).
  pattern: |
    wrapDebounced(callback, ms):
      let isPending = false;
      const debounced = debounce(() => { isPending = false; callback(); }, ms);
      return Object.assign(() => { isPending = true; debounced(); },
        { cancel: () => { isPending = false; debounced.cancel(); },
          flush:  () => { isPending = false; debounced.flush();  },
          pending: () => isPending }) as DebouncedFunction;
  gotcha: |
    In the lodash trailing body, `isPending = false` MUST precede `callback()`
    so the flag clears exactly when the save fires. The Issue 3 tests assert
    pending()===false AFTER advancing past the debounce window — if this
    ordering were reversed, that assertion would fail. (Do not change it; this
    is just why the tests are meaningful.)

- file: packages/react/src/types.ts
  section: lines 117-123 (DebouncedFunction interface)
  why: |
    The contract being regression-tested:
    `(): void; cancel: () => void; flush: () => void; pending: () => boolean`.
    No change to this interface is needed or wanted.

- file: packages/react/src/__tests__/autosave-field-debounce.test.tsx
  why: |
    Sibling suite that exercises the per-field debounce cache
    (getOrCreateDebounced → wrapDebounced). The Form-level pending() tests in
    THIS file prove pending() for the Form-level debouncedSubmit; because both
    adapters are built by the SAME wrapDebounced helper, per-field pending()
    correctness transitively holds. Do not duplicate per-field pending() tests
    here — the coalescing semantics are already covered in that sibling file.
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
├── types.ts                         # DebouncedFunction interface (lines 117-123) — UNCHANGED
├── components/
│   └── Form.tsx                     # wrapDebounced (~851-884) + debouncedSubmit (~689-711) + submitImmediate (~722-745)
├── context/
│   └── FormContext.ts               # FormContextValue.debouncedSubmit (public surface the tests read)
└── __tests__/
    └── autosave-submit-immediate.test.tsx   # ← BOTH describe blocks live here (Issue 1 + Issue 3) — EXISTS, GREEN
```

### Desired Codebase tree with files to be added

```bash
# No files added. No files changed (expected diff: EMPTY).
# The 4 pending() tests already live in autosave-submit-immediate.test.tsx.
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: the 4 pending() tests ALREADY EXIST (commit 0dca79a) and PASS.
//   DO NOT recreate them. DO NOT add a parallel describe block. A from-scratch
//   rewrite is the single biggest risk in this task — under fake timers,
//   duplicate pending() assertions can race and flake.

// CRITICAL: the public surface is ctx.debouncedSubmit (a DebouncedFunction),
//   reachable ONLY via a <ContextCapture/> consumer calling useFormContext().
//   The existing tests already do exactly this. There is no other supported
//   way to read pending() from outside <Form>.

// GOTCHA: fake timers MUST use { shouldAdvanceTime: true } or RHF's onChange
//   validation never settles and the auto-save never schedules → pending()
//   would never become true and the tests would fail spuriously. The existing
//   beforeEach uses vi.useFakeTimers({ shouldAdvanceTime: true }); preserve it.

// GOTCHA: userEvent.type MUST be called with { delay: null } under fake
//   timers, or the per-keystroke delay stalls. The existing tests do this.

// GOTCHA: the immediate adapter (debounce === false) correctly hardcodes
//   pending: () => false. Scenario (d) asserts pending()===false for
//   debounce={false} — this is the CONTRACT, not a bug. Do not "fix" the
//   adapter to track isPending; an immediate fn is genuinely never pending,
//   and submitImmediate's guard (Form.tsx:733-734) relies on it being false.

// SCOPE: The wrapDebounced implementation is P1.M2.T1.S1. The CHANGELOG /
//   README narrative is P1.M3.T1. Do NOT edit Form.tsx, types.ts,
//   CHANGELOG.md, or README.md in this task. This task is the TESTS only —
//   and they already exist.

// PARALLEL CONTEXT: P1.M2.T1.S1 (the wrapDebounced verify-and-finalize) may
//   touch a comment in Form.tsx. P1.M2.T2.S1 (Issue 4, forwardRef warnings)
//   touches test input components. Neither touches the Issue 3 describe block
//   in autosave-submit-immediate.test.tsx. No conflict.
```

## Implementation Blueprint

### Data models and structure

No model changes. `DebouncedFunction` (`types.ts:117-123`) is the existing
contract these tests exercise. Nothing to add.

### Contract-to-Test Verification Map (PERFORM FIRST — this IS the core of the task)

Open `packages/react/src/__tests__/autosave-submit-immediate.test.tsx`,
navigate to the
`describe("AutoSave DebouncedFunction.pending() reflects real state (Issue 3)", …)`
block, and confirm each scenario below is present and matches. Check the box
only after visual confirmation. **If ANY scenario is missing or its assertion
sequence diverges from the contract, stop and flag it** — that would mean the
working tree diverged from commit `0dca79a` and the task becomes real
test-writing work (re-create per the pattern in the map). Do NOT silently
proceed.

```yaml
SCENARIO (a) — pending() true while a Form-level save is scheduled, false after it fires
  - expected it() title: "debouncedSubmit.pending() should be true while a Form-level save is scheduled and false after it fires"
  - expected assertions:
      1. render <Form autoSave debounce={500}> with a Field + ContextCapture
      2. after settle (advance 100ms): expect(debounced.pending()).toBe(false)
      3. userEvent.type(fieldA, "x", { delay: null })
      4. expect(debounced.pending()).toBe(true)      // ← the Issue 3 regression assertion
      5. advance 600ms (> debounce)
      6. expect(debounced.pending()).toBe(false)
  - check: [ ] present, title verbatim, all 6 assertion steps present

SCENARIO (b) — pending() false after cancel() clears a scheduled save
  - expected it() title: "debouncedSubmit.pending() should be false after cancel() clears a scheduled save"
  - expected assertions:
      1. render <Form autoSave debounce={500}> + Field + ContextCapture
      2. type "x"
      3. expect(debounced.pending()).toBe(true)
      4. debounced.cancel()
      5. expect(debounced.pending()).toBe(false)     // ← cancel clears pending
      6. advance 1000ms
      7. expect(submitHandler).not.toHaveBeenCalled() // ← and no save fires
  - check: [ ] present, title verbatim, all 7 assertion steps present

SCENARIO (c) — flush() fires a pending numeric-debounce save immediately
  - expected it() title: "debouncedSubmit.flush() should fire a pending numeric-debounce save immediately"
  - expected assertions:
      1. render <Form autoSave debounce={500}> + Field + ContextCapture
      2. type "x"
      3. expect(debounced.pending()).toBe(true)
      4. debounced.flush()
      5. expect(debounced.pending()).toBe(false)     // ← flush clears pending
      6. advance 0ms
      7. expect(submitHandler).toHaveBeenCalledTimes(1)
      8. (strengthens contract) expect(submitHandler).toHaveBeenCalledWith(
           expect.objectContaining({ fieldA: "x" }))
      9. advance 1000ms
     10. expect(submitHandler).toHaveBeenCalledTimes(1)  // ← no double-submit
  - check: [ ] present, title verbatim, all 10 assertion steps present

SCENARIO (d) — the immediate (debounce: false) adapter is never pending
  - expected it() title: "the immediate (debounce: false) adapter is never pending"
  - expected assertions:
      1. render <Form autoSave debounce={false}> + Field + ContextCapture
      2. after settle: submitHandler.mockClear()
      3. type "x"
      4. advance 0ms
      5. expect(debounced.pending()).toBe(false)     // ← immediate adapter: never pending
  - check: [ ] present, title verbatim, all 5 assertion steps present

PLACEMENT — both describe blocks coexist in the same file
  - expected: the file contains BOTH
      describe("AutoSave submitImmediate flushes per-field debounce (Issue 1)", …)
      describe("AutoSave DebouncedFunction.pending() reflects real state (Issue 3)", …)
    sharing one harness (TestInput / baseInputs / ContextCapture) and one
    beforeEach/aftergether fake-timer setup.
  - check: [ ] confirmed (satisfies item OUTPUT: "lives alongside the Issue 1 tests")
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY (read-only) — run the Contract-to-Test Verification Map above
  - ACTION: open packages/react/src/__tests__/autosave-submit-immediate.test.tsx,
            locate the Issue 3 describe block, and confirm scenarios (a)-(d)
            + PLACEMENT are all present and match.
  - OUTCOME: all boxes checked. If any is missing → STOP; the tree has diverged
             from commit 0dca79a and this becomes real test-writing work
             (re-create per the pattern in the map). Do NOT silently proceed.
  - WHY FIRST: establishes that ~100% of the task is already done; scopes the
               remaining work to running the validation gates only.

Task 2: VALIDATE (no edits) — run the regression suite in isolation
  - RUN: pnpm vitest run packages/react/src/__tests__/autosave-submit-immediate.test.tsx
  - ASSERT: "8 passed | 0 failed" (4 Issue 1 flush + 4 Issue 3 pending).
            The four Issue 3 test titles appear in the output.
  - NOTE: If a test FAILS, do not "fix" it by weakening assertions — read the
          failure; it almost certainly indicates the wrapDebounced fix (S1) is
          not actually present, which is an S1 problem, not an S2 one. Flag it.

Task 3: VALIDATE (no edits) — run the full gate
  - RUN: pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage
  - ASSERT: all green; coverage ≥90% (PRD §1.3.7). The autosave-submit-immediate
            file contributes 8 passing tests to the total.

Task 4: CONFIRM empty diff
  - RUN: git diff --stat
  - ASSERT: empty (no source changes). If Task 1 found a genuine gap and you
            added a test, the diff is confined to autosave-submit-immediate.test.tsx.
```

### Implementation Patterns & Key Details

```tsx
// PATTERN: the ContextCapture consumer used to read the public debouncedSubmit.
// (ALREADY in the test file — for reference only; do NOT recreate.)
function ContextCapture({ captureRef }: { captureRef: MutableRefObject<any> }) {
  captureRef.current = useFormContext();
  return null;
}
// usage:
const ref: MutableRefObject<any> = { current: null };
render(<FormalityProvider inputs={baseInputs}>
  <Form config={{ fieldA:{type:"textField"} }} onSubmit={submitHandler}
        autoSave debounce={500}>
    <Field name="fieldA" />
    <ContextCapture captureRef={ref} />
  </Form>
</FormalityProvider>);
const debounced = ref.current.debouncedSubmit;   // the DebouncedFunction under test
expect(debounced.pending()).toBe(false);          // at rest

// PATTERN: the pending() transition assertion core (scenario a).
await act(async () => { await userEvent.type(fieldA, "x", { delay: null }); });
expect(debounced.pending()).toBe(true);           // scheduled → true (Issue 3 regression)
await act(async () => { await vi.advanceTimersByTimeAsync(600); });
expect(debounced.pending()).toBe(false);          // fired → false

// CRITICAL: the immediate adapter is NEVER pending — this is correct, not a bug.
//   Scenario (d) asserts pending()===false for debounce={false}. The adapter's
//   pending: () => false is intentional; submitImmediate's guard depends on it.
```

### Integration Points

```yaml
PUBLIC API UNDER TEST:
  - surface: "FormContextValue.debouncedSubmit (a DebouncedFunction)"
  - file: "packages/react/src/context/FormContext.ts"
  - methods exercised: ".pending()" (primary), ".cancel()", ".flush()"

IMPLEMENTATION DEPENDENCY (sibling task):
  - task: "P1.M2.T1.S1 (wrapDebounced verify-and-finalize)"
  - contract: |
      wrapDebounced (Form.tsx:~851-884) MUST be present and wired into both
      debouncedSubmit (normal branch, ~705) and getOrCreateDebounced (~659),
      with pending: () => isPending. Scenario (a)'s pending()===true assertion
      will FAIL if S1's fix is absent — which is exactly the regression signal
      this suite exists to provide.

SCOPE FENCES (do NOT touch in this task):
  - Form.tsx: "P1.M2.T1.S1 (comment touch-up at most)"
  - types.ts DebouncedFunction interface: "no change"
  - CHANGELOG.md / README.md: "P1.M3.T1"
  - per-field coalescing tests: "autosave-field-debounce.test.tsx (already covers per-field timers)"

PARALLEL EXECUTION CONTRACT:
  - P1.M2.T1.S1 (in progress) may edit a Form.tsx comment. It does NOT touch
    autosave-submit-immediate.test.tsx. P1.M2.T2.S1 (Issue 4) edits test input
    components in OTHER files; autosave-submit-immediate.test.tsx already uses
    a plain function component (TestInput) consuming forwardRef from props, so
    it is already Issue-4-clean. Zero file overlap; fully independent.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# No edits expected, but confirm cleanliness.
pnpm typecheck        # tsc --build
pnpm lint             # eslint flat config
# Expected: zero errors. If errors appear, someone diverged the tree —
# investigate before doing anything else.
```

### Level 2: The Regression Suite Itself (the deliverable gate)

```bash
# THE proof that the 4 pending() tests exist and pass.
pnpm vitest run packages/react/src/__tests__/autosave-submit-immediate.test.tsx
# Expected:
#   Test Files  1 passed (1)
#   Tests       8 passed (8)     [4 Issue 1 flush + 4 Issue 3 pending]
# The output must list, under
#   "AutoSave DebouncedFunction.pending() reflects real state (Issue 3)":
#     ✓ debouncedSubmit.pending() should be true while a Form-level save is scheduled and false after it fires
#     ✓ debouncedSubmit.pending() should be false after cancel() clears a scheduled save
#     ✓ debouncedSubmit.flush() should fire a pending numeric-debounce save immediately
#     ✓ the immediate (debounce: false) adapter is never pending
```

### Level 3: Full Gate Validation (System Validation)

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage
# Expected: all green; coverage ≥90% (PRD §1.3.7 / §1.3.7 h4.6).
# `pnpm test` totals ~989 passed (matching system_context.md §Testing Summary).

# Confirm the diff is empty (or, if a genuine gap was fixed, test-file-only):
git diff --stat
git diff --name-only
# Expected: no output (empty), or only
#   packages/react/src/__tests__/autosave-submit-immediate.test.tsx
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Prove the regression signal is REAL: if wrapDebounced's pending() were
# reverted to () => false, scenario (a) would fail. (Do NOT actually revert —
# this is a reasoning check, not a command.)
#
# Reasoning: scenario (a) asserts debounced.pending() === true AFTER typing
# and BEFORE the 500ms timer fires. With the old hardcoded () => false this
# assertion would be `expected false to be true` → test fails. That is exactly
# the regression this suite catches. Confirmed by the fact that these tests
# were authored alongside the fix in commit 0dca79a and pass against the fix.

# Confirm the immediate-adapter invariant is asserted (scenario d):
#   grep -n "debounce={false}" packages/react/src/__tests__/autosave-submit-immediate.test.tsx
# Expected: one match, inside the "the immediate (debounce: false) adapter is
# never pending" test.
```

## Final Validation Checklist

### Technical Validation

- [ ] Contract-to-Test Verification Map scenarios (a)-(d) + PLACEMENT ALL confirmed.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:coverage` green.

### Feature Validation

- [ ] `autosave-submit-immediate.test.tsx` → 8 passed (4 Issue 1 + 4 Issue 3).
- [ ] All 4 Issue 3 `it(...)` titles match the item-description scenarios verbatim.
- [ ] Scenario (d) asserts `pending() === false` for `debounce={false}` (immediate
      adapter invariant preserved).
- [ ] `git diff` empty (or confined to the one test file if a gap was fixed).

### Code Quality Validation

- [ ] No new test files; no duplicate `pending()` describe block.
- [ ] No change to `Form.tsx`, `types.ts`, `FormContext.ts`.
- [ ] No change to README.md / CHANGELOG.md (P1.M3.T1's scope).
- [ ] Anti-patterns avoided (see below).

### Documentation & Deployment

- [ ] No doc changes needed (item OUTPUT §5: test-only, no API/config/surface change).
- [ ] Test names are self-documenting (they already describe each transition).

---

## Anti-Patterns to Avoid

- ❌ **Don't recreate the 4 `pending()` tests.** They exist (commit `0dca79a`)
  and pass. A from-scratch rewrite is the single biggest risk in this task —
  under fake timers, a duplicate `pending()` describe block can race and flake.
- ❌ Don't add a `pending()` describe block to any OTHER file (e.g.
  `Form.coverage.test.tsx` or `autosave-field-debounce.test.tsx`). The contract
  requires the suite to live in `autosave-submit-immediate.test.tsx` alongside
  the Issue 1 tests — and it already does.
- ❌ Don't "fix" the immediate adapter's `pending: () => false`. An immediate
  function is genuinely never pending; scenario (d) asserts this on purpose,
  and `submitImmediate`'s guard depends on it.
- ❌ Don't delegate `pending()` to lodash's `debounced.pending()`. The whole
  point of `wrapDebounced` (S1) is that `Object.assign` creates a NEW function
  object that does NOT share lodash's internal pending flag — hence the
  explicit `isPending` closure. (This is an S1 concern, but flagging it here so
  no agent "improves" the tests to assert lodash delegation.)
- ❌ Don't weaken a failing test's assertions to make it green. If a test fails,
  the `wrapDebounced` fix (S1) is likely absent or reordered — that is an S1
  regression, not an S2 authoring problem. Flag it rather than masking it.
- ❌ Don't touch `Form.tsx`, `types.ts`, `FormContext.ts`, `CHANGELOG.md`, or
  `README.md`. Each is owned by another task (S1 / P1.M3.T1) or is the
  unchanged contract.
- ❌ Don't treat "status: Researching" in the plan as evidence the work is
  undone. The codebase is the source of truth, and it already satisfies the
  contract. Verify, finalize, and move on.

---

**Confidence Score: 9/10** for one-pass *completion* success.

Rationale: The 4 `pending()` regression tests already exist, verbatim, inside
the required file and describe block, and are green (verified during research:
`pnpm vitest run autosave-submit-immediate.test.tsx` → 8 passed). The
contract-to-test verification map lets an agent confirm every scenario (a)-(d)
in a single read of one describe block. There is no code to write and no test
to add — the expected diff is empty. The -1 covers the single risk that the
implementing agent, seeing "Researching" status, ignores this PRP's "ALREADY
EXISTS" banner and duplicates/rewrites the working tests — the banner +
verification map + anti-patterns section exist precisely to prevent that. If
the agent follows the map, completion is essentially guaranteed and the diff
will be empty.
