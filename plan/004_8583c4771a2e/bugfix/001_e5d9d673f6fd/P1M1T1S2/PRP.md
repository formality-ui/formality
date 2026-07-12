name: "P1.M1.T1.S2 — Add regression tests for submitImmediate flush behavior (Issue 1)"
description: |

---

## Goal

**Feature Goal**: Ensure the four `submitImmediate` flush regression tests
mirroring the Issue 1 repro table are present in
`packages/react/src/__tests__/autosave-submit-immediate.test.tsx`, that each
test's body matches its contract scenario exactly (debounce setup, timing,
assertions, no-double-fire guards), and that all four pass against the fixed
`submitImmediate` shipped by P1.M1.T1.S1.

**Deliverable**: A **verification-first** subtask. Live-source research during
PRP authorship confirmed all four regression tests **already exist** in the
file — the describe block name matches the contract verbatim
(`"AutoSave submitImmediate flushes per-field debounce (Issue 1)"`) and the
four `it(...)` titles match scenarios (a)–(d) exactly. The implementing
agent's job is to **re-confirm the live tests match the contract**, fix/author
ONLY if drift or a missing scenario is found, run the suite green, and write
a short verification record.

> **EXPECTED OUTCOME: "no drift, all four tests present + green."** Re-verified
> during PRP research (git HEAD `fa75dae`, working tree clean; tests at lines
> 88, 136, 192, 256). The implementing agent should independently re-confirm
> and record the result; it should NOT rewrite working tests.

**Success Definition**:
1. All four contract scenarios (a)–(d) have a corresponding `it(...)` in the
   Issue-1 describe block, with test bodies matching the contract's debounce
   setup / timing / assertions.
2. `pnpm --filter @formality-ui/react test -- autosave-submit-immediate` is
   green — all 4 Issue-1 tests pass (plus the 4 Issue-3 pending() tests in the
   same file).
3. Full suite (`pnpm test`) green; coverage gate (`pnpm test:coverage`) ≥90%.
4. No source files modified; tests edited ONLY if a scenario is genuinely
   missing or its body drifts from the contract.

## User Persona

**Target User**: The Formality maintainer / future contributor. This is an
internal regression-test guard, not an end-user feature.

**Use Case**: A future change to `submitImmediate` or the debounce adapters
trips one of these tests before the change can land — preventing a regression
of the silent-data-loss bug (Issue 1).

**Pain Points Addressed**: Locks in the Issue-1 fix so the "Save Now" /
flush-before-navigate path can't silently drop per-field-debounced saves
again. The `(b)` test is the exact Issue-1 repro; `(c)` guards the
version-abort race; `(d)` prevents spurious empty saves.

## Why

- **Business value**: A regression test for a silent-data-loss bug is the
  cheapest possible insurance. Without these tests, a future refactor of
  `submitImmediate` (or `wrapDebounced`) could re-introduce Issue 1 with no
  signal until a consumer loses data.
- **Integration**: This subtask is the **test-side companion** to P1.M1.T1.S1
  (which ships the runtime fix). S1's PRP explicitly scopes test authoring to
  THIS subtask (S2). Together they form "runtime fix + regression lock-in."
  - S1 produces: a `submitImmediate` that detects pending across both timer
    sources, cancels all timers, and invokes `executeAutoSave` exactly once.
  - S2 (this) produces: the four tests proving that runtime correct across
    the repro matrix.
- **Scope boundary**: Touch ONLY `autosave-submit-immediate.test.tsx`. Do NOT
  modify Form.tsx (S1's territory), the Issue-3 pending() tests in the same
  file (P1.M2.T1.S2), other autosave suites, core, READMEs/CHANGELOG (P1.M3.T1),
  or examples.

## What

### The four contract scenarios (mirroring PRD §h3.0 repro table)

These are the exact `it(...)` titles and behaviors the describe block
`"AutoSave submitImmediate flushes per-field debounce (Issue 1)"` must contain:

**(a) `"should flush a pending Form-level debounce save immediately"`** — baseline.
- Setup: `<Form autoSave debounce={3000}>`, `<Field name="fieldA" />` (no
  per-field debounce, uses Form-level). `baseInputs` maps `textField` → TestInput.
- Type `"x"` into fieldA, advance 500ms (no submit yet — correct, Form timer is 3000ms).
- Call `ctx.submitImmediate()`, advance 0ms.
- Assert: `submitHandler` called **once** with `{ fieldA: "x" }`.

**(b) `"should flush a pending per-field numeric debounce save immediately (Issue 1 repro)"`** — THE bug repro.
- Setup: `<Form autoSave debounce={500}>`, `<Field name="fieldA" inputConfig={{ debounce: 3000 }} />`.
- Type `"x"` into fieldA, advance 500ms (no submit yet — correct, field timer is 3000ms).
- Call `ctx.submitImmediate()`, advance 0ms.
- Assert: `submitHandler` called **once** with `{ fieldA: "x" }` (was 0 before fix).
- Advance 3000ms (the field's own timer).
- Assert: STILL **one** submit (no double-fire from the canceled field timer).

**(c) `"should flush both a Form-level and a per-field pending save as a single submit (no double, no drop)"`** — race guard.
- Setup: `<Form autoSave debounce={2000}>`, fieldA uses Form-level (2000ms),
  fieldB has `inputConfig={{ debounce: 3000 }}`.
- Type `"a"` into fieldA AND `"b"` into fieldB within the same tick.
- Advance 500ms (no submit yet).
- Call `ctx.submitImmediate()`, advance 0ms.
- Assert: exactly **one** submit with `{ fieldA: "a", fieldB: "b" }`.
- Advance 3500ms.
- Assert: STILL **one** submit (neither idle timer double-fires).

**(d) `"should be a no-op when nothing is pending (no spurious empty save)"`** — idle guard.
- Setup: `<Form autoSave debounce={500}>`, `<Field name="fieldA" />`.
- No edit. Call `ctx.submitImmediate()`, advance 0ms.
- Assert: `submitHandler` **not** called.

### Required test-harness patterns (PRD contract clause 1)

Every test in this describe block MUST use:
- `vi.useFakeTimers({ shouldAdvanceTime: true })` in `beforeEach`;
  `vi.useRealTimers()` in `afterEach`.
- The `ContextCapture` pattern: a null-rendering component that stashes
  `useFormContext()` onto a `MutableRefObject` ref so the test can call
  `ref.current.submitImmediate()` directly.
- `TestInput` — a PLAIN function component consuming `forwardRef` from props
  (NOT `React.forwardRef()` wrapped — see Issue 4 / §20). It renders
  `<input ref={forwardRef} data-testid={name} ... />`.
- `userEvent.type(field, "x", { delay: null })` wrapped in `act()` for input.
- `vi.advanceTimersByTimeAsync(ms)` wrapped in `act()` for timer advancement.
- `submitHandler = vi.fn()`, with `submitHandler.mockClear()` after the initial
  mount/settle to ignore any mount-time noise.

### Success Criteria

- [ ] All four `it(...)` scenarios (a)–(d) present with the exact contract titles.
- [ ] Each test body matches its contract (debounce setup, timing, assertions, no-double-fire).
- [ ] All harness patterns (fake timers, ContextCapture, plain-fn TestInput, act-wrapped input/timers) used.
- [ ] `pnpm --filter @formality-ui/react test -- autosave-submit-immediate` green (4 Issue-1 + 4 Issue-3 tests pass).
- [ ] `pnpm test` green; `pnpm test:coverage` ≥90%.
- [ ] No source files touched; tests edited ONLY if a scenario is missing/drifting.

## All Needed Context

### Context Completeness Check

_Pass._ The contract fully specifies the four test scenarios (titles, setups,
timings, assertions), the harness patterns are enumerated, the architecture
context cites exact line numbers and confirms the tests exist, and live-source
research during PRP authorship re-verified all four tests at lines 88/136/192/256.
The implementing agent needs only to re-confirm and run green.

### Documentation & References

```yaml
# MUST READ
- url: Bug-fix Issue 1 (plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd — heading:h2.2 / h3.0)
  why: The authoritative repro table the four tests mirror, + the exact Steps-to-Reproduce for scenario (b).
  critical: "The per-field save only lands later when the field's own 3000ms timer fires." Test (b) asserts the OPPOSITE after the fix: 1 submit immediately, STILL 1 after advancing 3000ms.

- url: PRD §4.1 (FormContextValue.submitImmediate) + §11.2/§11.3 (fieldDebouncersRef, per-field numeric debounce)
  why: The public contract the tests lock in ("Execute pending debounced submit immediately") + the per-field timer model.
  critical: After §11.3, "pending debounced submit" includes per-field timers. Test (b) is the proof; test (c) proves coalescing across both sources.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/system_context.md
  why: Verified-current-state report. Confirms the 4 tests already exist + enumerates the required harness patterns (fake timers, ContextCapture, plain-fn TestInput, act-wrapped input/timers).
  section: "Issue-by-Issue Status → Issue 1" + "Testing Patterns"
  critical: "Tests: 4 tests in autosave-submit-immediate.test.tsx: (1) Form-level flush fires; (2) per-field flush fires (Issue 1 repro); (3) both pending → single submit; (4) no-op when nothing pending."

# PARALLEL-EXECUTION CONTEXT (S1 is being implemented concurrently)
- file: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M1T1S1/PRP.md
  section: "Goal + What (the 4-step contract) + Anti-Patterns (don't author tests here)"
  why: S1 ships the runtime fix (submitImmediate: detect-pending → early-return → cancel-all → invoke-once). This subtask (S2) ships the TESTS that lock it in. Treat S1's 4-step contract as the runtime the tests exercise.
  critical: "S1's PRP anti-pattern: 'Don't author the regression tests here — that's P1.M1.T1.S2. Verify presence; flag gaps.' → confirms this subtask owns authoring the 4 tests." S1 also notes the tests ALREADY EXIST (lines 88/136/192/256) — so this is verify-first.

- file: packages/react/src/__tests__/autosave-submit-immediate.test.tsx
  section: "describe('AutoSave submitImmediate flushes per-field debounce (Issue 1)') @75; its @88/@136/@192/@256; Issue-3 describe @289"
  why: THE file to verify/author. Lines verified during PRP research; re-confirm at execution time (lines drift).
  pattern: "Shared TestInput + ContextCapture + baseInputs harness @1-73; describe @75; 4 its for Issue 1; 4 its for Issue 3 @289+."
  gotcha: "The file ALSO contains the Issue-3 pending() describe @289 (owned by P1.M2.T1.S2). Do NOT touch those tests — verify ONLY the Issue-1 describe @75-288."

- file: packages/react/src/__tests__/autosave-submit-immediate.test.tsx
  section: "TestInput @34-56 (plain fn consuming forwardRef); ContextCapture @66-70; baseInputs @60-62"
  why: The shared harness the four tests MUST reuse. Confirm TestInput is a PLAIN function component (not React.forwardRef) per Issue 4 / §20.
  pattern: "function TestInput({ ..., forwardRef, ...props }) { return <input ref={forwardRef} data-testid={name} ... />; }"
  gotcha: "TestInput's props type is TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }. The [key: string]: unknown index signature on TestInputProps lets the forwardRef passthrough compile."

- file: packages/react/src/components/Form.tsx
  section: "submitImmediate (~720-748); fieldDebouncersRef (~225); debouncedSubmitRef (~506); executeAutoSaveRef (~509); wrapDebounced (~862)"
  why: READ-ONLY — the runtime the tests exercise. S1 owns any edits here. The tests call ref.current.submitImmediate(); confirm (by reading, not editing) that it exists on FormContextValue.
  pattern: "submitImmediate is exposed on FormContextValue; tests invoke it via the captured context ref."
  gotcha: "Do NOT edit Form.tsx in this subtask. If a test fails because submitImmediate is broken, that's S1's gap — flag it, don't fix the runtime here."

- file: packages/react/src/__tests__/Form.coverage.test.tsx
  section: "'should expose working cancel/flush/pending on the immediateFn adapter'"
  why: The existing test that already exercises the FORM-LEVEL flush path (the reason only the per-field path was broken). Reference for the mount/settle pattern; do NOT duplicate its assertions.
  gotcha: "That test predates the per-field fix and covers the immediate adapter only — it does NOT cover per-field flush. The (b)/(c) tests here fill that exact gap."

- file: packages/react/src/__tests__/autosave-field-debounce.test.tsx
  section: "describe('AutoSave Per-Field Numeric Debounce (Issue 1)') @59"
  why: The reference fake-timer mount pattern for per-field debounce tests. The (b) test here reuses the same shape (inputConfig={{ debounce: N }}).
  gotcha: "This sibling file has its OWN TestInput / harness — do NOT import across test files. Each autosave test file is self-contained with its own harness (per architecture context §Testing Patterns)."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
  __tests__/
    autosave-submit-immediate.test.tsx   # ← VERIFY/AUTHOR the Issue-1 describe (@75-288); Issue-3 describe (@289+) is P1.M2.T1.S2's
    autosave-field-debounce.test.tsx     # reference pattern (self-contained harness) — read-only
    Form.coverage.test.tsx               # existing form-level flush test — read-only reference
  components/Form.tsx                    # submitImmediate runtime — S1's territory (READ-ONLY here)
  context/FormContext.ts                 # FormContextValue.submitImmediate declaration — read-only
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/__tests__/
  autosave-submit-immediate.test.tsx   # VERIFIED (or scenario authored if missing) — Issue-1 describe complete
# (no new files; the tests live in the existing file's Issue-1 describe block)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: This is a VERIFY-FIRST subtask. All four tests already exist (verified
// during PRP research at lines 88/136/192/256). Do NOT rewrite working tests. Re-confirm
// each test body matches its contract scenario; edit ONLY if a scenario is missing or
// its assertions drift from the repro table.

// CRITICAL: vi.useFakeTimers({ shouldAdvanceTime: true }) — the `shouldAdvanceTime: true`
// option is MANDATORY (matches the rest of the autosave suite). Omitting it breaks the
// mount/settle timing because RHF's internal microtasks don't flush correctly under pure
// fake timers. afterEach restores real timers.

// CRITICAL: TestInput MUST be a PLAIN function component consuming forwardRef from props
// (per Issue 4 / §20). Do NOT wrap it in React.forwardRef() — that re-triggers the
// "forwardRef render functions accept exactly two parameters" warning (Issue 4) and is
// the pattern the P1.M2.T2.S1 subtask is eliminating elsewhere.

// GOTCHA: Each test must call submitHandler.mockClear() AFTER the initial mount/settle
// (the `await vi.advanceTimersByTimeAsync(100)` before the edit) to ignore any
// mount-time or defaultValue-resolution noise. Otherwise the "1 submit" assertion may
// see a spurious mount-time call.

// GOTCHA: The "no double-fire" assertions (test (b) advance 3000ms; test (c) advance
// 3500ms) are the KEY guards for the cancel-then-invoke-once design (S1's 4-step
// contract). If submitImmediate used naive forEach(fn => fn.flush()) instead, these
// would fail (the canceled timer would re-fire). Keep these assertions.

// GOTCHA: The ContextCapture pattern stashes useFormContext() synchronously during render
// (captureRef.current = useFormContext()). It renders null. The ref is a MutableRefObject<any>
// so tests can call ref.current.submitImmediate() without TS friction. Follow this exact
// shape — don't try to "improve" the typing (it's intentionally loose for test ergonomics).

// GOTCHA: userEvent.type with { delay: null } under fake timers is the project's standard
// input pattern. The `delay: null` makes typing synchronous-ish; the act() wrapper ensures
// React flushes. Do NOT use fireEvent.change — it bypasses the parser/value pipeline.

// GOTCHA: vi.advanceTimersByTimeAsync (the ASYNC variant) is required, not the sync
// advanceTimersByTime — the async variant flushes the microtask queue (RHF validation +
// the async executeAutoSave). Always wrap in act().

// GOTCHA: Test (c) types into BOTH fields within a single act() block (await type fieldA,
// then await type fieldB). Both edits land in the same tick so both timers become pending
// before submitImmediate is called. If you split them across two acts, only the last
// edit's timer may be pending.

// GOTCHA: The (b) test uses Form debounce={500} AND Field inputConfig={{ debounce: 3000 }}.
// The per-field debounce (3000) OVERRIDES the Form-level (500) for that field — so 500ms
// elapsed correctly yields NO submit (the field's own timer is 3000ms). This is the exact
// setup that was broken (form-level flush couldn't reach the 3000ms per-field timer).

// GOTCHA: Do NOT touch the Issue-3 pending() describe block (@289+). Those tests are owned
// by P1.M2.T1.S2. Verify ONLY the Issue-1 describe (@75-288).
```

## Implementation Blueprint

### Data models and structure

Not applicable — this is a test subtask. No data models change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: RE-READ the current Issue-1 describe block
  - GREP: `grep -nE "^\s*(describe|it|test)\(" packages/react/src/__tests__/autosave-submit-immediate.test.tsx`
  - CONFIRM the describe "AutoSave submitImmediate flushes per-field debounce (Issue 1)" exists (@~75).
  - CONFIRM the 4 its exist with the exact contract titles:
      (a) "should flush a pending Form-level debounce save immediately" (@~88)
      (b) "should flush a pending per-field numeric debounce save immediately (Issue 1 repro)" (@~136)
      (c) "should flush both a Form-level and a per-field pending save as a single submit (no double, no drop)" (@~192)
      (d) "should be a no-op when nothing is pending (no spurious empty save)" (@~256)
  - WHY: Lines drift; re-confirm before verifying/authoring. Record the current line numbers.

Task 2: VERIFY each test body against its contract scenario
  - READ test (a): Form debounce={3000}, fieldA no per-field debounce, type "x", advance 500ms (no submit), submitImmediate(), advance 0ms → assert 1 submit { fieldA: "x" }.
  - READ test (b): Form debounce={500}, fieldA inputConfig={{ debounce: 3000 }}, type "x", advance 500ms (no submit), submitImmediate(), advance 0ms → assert 1 submit { fieldA: "x" }; advance 3000ms → STILL 1 submit.
  - READ test (c): Form debounce={2000}, fieldA Form-level + fieldB inputConfig={{ debounce: 3000 }}, type "a"+"b" same tick, advance 500ms (no submit), submitImmediate(), advance 0ms → assert 1 submit { fieldA: "a", fieldB: "b" }; advance 3500ms → STILL 1 submit.
  - READ test (d): no edit, submitImmediate(), advance 0ms → assert 0 submits.
  - CONFIRM each uses the harness patterns (fake timers { shouldAdvanceTime: true }, ContextCapture, plain-fn TestInput, act-wrapped userEvent.type + advanceTimersByTimeAsync, submitHandler.mockClear() after settle).
  - OUTCOME: if all 4 bodies match → Task 4 (run). If any drift/missing → Task 3 (author/fix).

Task 3 (CONDITIONAL — only if Task 2 found drift/missing): AUTHOR/FIX the test
  - IF a scenario is missing or its body drifts from the contract → write/rewrite it to match the contract exactly (scenarios a-d above).
  - REUSE the existing harness (TestInput, ContextCapture, baseInputs) — do NOT duplicate or re-declare them.
  - DO NOT: touch the Issue-3 pending() describe (@289+); touch Form.tsx; import across test files.
  - DO NOT: use fireEvent.change, React.forwardRef-wrapped TestInput, sync advanceTimersByTime, or omit shouldAdvanceTime.
  - (Research indicates this task will NOT fire — all 4 tests exist and match. But the agent must verify, not assume.)

Task 4: RUN the submitImmediate suite
  - RUN: `pnpm --filter @formality-ui/react test -- autosave-submit-immediate`
  - EXPECT: all green — 4 Issue-1 tests + 4 Issue-3 pending() tests pass.
  - IF a test fails: the likely cause is a runtime gap in submitImmediate (S1's territory). Debug to confirm it's a TEST issue vs a RUNTIME issue; if runtime, flag to S1 (do NOT edit Form.tsx here).

Task 5: FULL VALIDATION
  - RUN: `pnpm test` (full suite — no regressions).
  - RUN: `pnpm test:coverage` (≥90% gate per PRD §1.3.7).
  - RUN: `pnpm typecheck` (root tsc --build — catches accidental type damage if a test was authored).
  - RUN: `pnpm lint` (0 errors).
  - EXPECT: all green.

Task 6: SCOPE-LEAK CHECK + WRITE the verification record
  - RUN: `git diff --stat` → expect NO source files; at most `autosave-submit-immediate.test.tsx` (and ONLY if Task 3 fired — otherwise nothing).
  - RUN: `git diff --exit-code packages/react/src/components/Form.tsx packages/core` → expect exit 0 (untouched).
  - WRITE plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M1T1S2/audit-record.md:
      - Outcome: "no drift, all four Issue-1 tests present + green" OR "GAP/FIX: <scenario> <action>".
      - A table mapping each scenario (a-d) → its it(...) title + current line + PASS/FAIL.
      - The test-run command + result + full-suite + coverage numbers.
  - THE RECORD confirms the regression lock-in is complete.
```

### Implementation Patterns & Key Details

```tsx
// The canonical test shape for scenario (b) — the Issue-1 repro (verify this exists):

// it("should flush a pending per-field numeric debounce save immediately (Issue 1 repro)", async () => {
//   const ref: MutableRefObject<any> = { current: null };
//   render(
//     <FormalityProvider inputs={baseInputs}>
//       <Form config={{ fieldA: { type: "textField" } }} onSubmit={submitHandler} autoSave debounce={500}>
//         <Field name="fieldA" inputConfig={{ debounce: 3000 }} />
//         <ContextCapture captureRef={ref} />
//       </Form>
//     </FormalityProvider>,
//   );
//   await act(async () => { await vi.advanceTimersByTimeAsync(100); });   // settle mount
//   submitHandler.mockClear();
//   const fieldA = screen.getByTestId("fieldA");
//   await act(async () => { await userEvent.type(fieldA, "x", { delay: null }); });
//   await act(async () => { await vi.advanceTimersByTimeAsync(500); });    // before field's 3000ms → no submit
//   expect(submitHandler).not.toHaveBeenCalled();
//   act(() => { ref.current.submitImmediate(); });
//   await act(async () => { await vi.advanceTimersByTimeAsync(0); });
//   expect(submitHandler).toHaveBeenCalledTimes(1);
//   expect(submitHandler).toHaveBeenCalledWith(expect.objectContaining({ fieldA: "x" }));
//   await act(async () => { await vi.advanceTimersByTimeAsync(3000); });   // field's own timer — must NOT double-fire
//   expect(submitHandler).toHaveBeenCalledTimes(1);                        // ← the cancel-then-invoke guard
// });

// PATTERN: settle mount (advance 100ms) → mockClear → type → advance-to-before-timer →
//          assert-no-submit → submitImmediate → advance-0 → assert-1-submit → advance-timer → assert-still-1.
// GOTCHA:  the final "advance + assert-still-1" is the no-double-fire guard; do NOT remove it.
// CRITICAL: TestInput is a PLAIN fn (not React.forwardRef); forwardRef consumed from props.

// Shared harness (verify it exists at file top; reuse, do NOT re-declare):
//   function TestInput({ value, onChange, disabled, name, forwardRef, ...props }) {
//     return <input ref={forwardRef} data-testid={name} type="text" value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} {...props} />;
//   }
//   const baseInputs = { textField: { component: TestInput, defaultValue: "" } };
//   function ContextCapture({ captureRef }) { captureRef.current = useFormContext(); return null; }
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
TESTS:
  - packages/react/src/__tests__/autosave-submit-immediate.test.tsx — verify/author the Issue-1 describe (@75-288) ONLY.
SOURCE (READ-ONLY):
  - Form.tsx submitImmediate — S1's territory; tests exercise it via ref.current.submitImmediate().
  - FormContext.ts FormContextValue.submitImmediate — the public API declaration; read-only.
DOWNSTREAM CONSUMERS:
  - P1.M3.T1 (doc sweep): the README/CHANGELOG narrative references "regression tests added" — this subtask is what they reference.
DOCS: none — test-only additions.
PARALLEL-SAFE:
  - S1 edits Form.tsx (runtime); S2 edits the Issue-1 describe in the test file. No file-overlap conflict (different files). Coordinate only that both land before P1.M3.T1's narrative.
```

## Validation Loop

### Level 1: Test Presence + Body Verification (the primary validation)

```bash
# List the Issue-1 describe + its 4 tests
grep -nE "^\s*(describe|it|test)\(" packages/react/src/__tests__/autosave-submit-immediate.test.tsx
# Expected: describe "AutoSave submitImmediate flushes per-field debounce (Issue 1)" (@~75) +
#           4 its with the exact contract titles (a)-(d).

# Confirm the harness patterns are present in the file
grep -nE "useFakeTimers\(\{ shouldAdvanceTime: true \}\)|useRealTimers|ContextCapture|userEvent\.type.*delay: null|advanceTimersByTimeAsync" \
  packages/react/src/__tests__/autosave-submit-immediate.test.tsx
# Expected: matches for each pattern (fake timers, real-timer restore, ContextCapture, userEvent.type, async timer advance).

# Confirm TestInput is a PLAIN fn (not React.forwardRef-wrapped) — Issue 4 contract
grep -n "function TestInput\|React.forwardRef" packages/react/src/__tests__/autosave-submit-immediate.test.tsx
# Expected: "function TestInput" present; NO "React.forwardRef" wrap for TestInput.
```

### Level 2: Test Execution (the real proof)

```bash
# Run the submitImmediate suite (Issue-1 + Issue-3 tests)
pnpm --filter @formality-ui/react test -- autosave-submit-immediate
# Expected: all green — 4 Issue-1 tests + 4 Issue-3 pending() tests pass.
# If a test fails, determine: TEST bug (fix here) vs RUNTIME bug (flag to S1).
```

### Level 3: Full Suite + Coverage Gate (no regressions, ≥90%)

```bash
pnpm test            # full suite — no regressions
pnpm test:coverage   # ≥90% gate (PRD §1.3.7)
# Expected: green. The 4 Issue-1 tests exercise submitImmediate's branches
#           (anyPending true via Form-level, via per-field, via both; anyPending false),
#           which keeps coverage of that function above the floor.
```

### Level 4: Typecheck, Lint, Scope (clean baseline)

```bash
pnpm typecheck       # root tsc --build — catches accidental type damage if a test was authored
pnpm lint            # 0 errors
git diff --stat      # expect at most autosave-submit-immediate.test.tsx (ONLY if Task 3 fired)
git diff --exit-code packages/react/src/components/Form.tsx packages/core   # exit 0 (untouched)
# Expected: all green; no source/core edits.
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm --filter @formality-ui/react test -- autosave-submit-immediate` green (4 Issue-1 + 4 Issue-3 tests).
- [ ] `pnpm test` green (full suite, no regressions).
- [ ] `pnpm test:coverage` green (≥90% gate).
- [ ] `pnpm typecheck` green; `pnpm lint` clean.
- [ ] `git diff --stat` shows at most `autosave-submit-immediate.test.tsx` (and ONLY if Task 3 fired — otherwise nothing).
- [ ] `git diff --exit-code packages/react/src/components/Form.tsx packages/core` → exit 0.

### Feature Validation

- [ ] Test (a) "Form-level flush" present, body matches contract, passes.
- [ ] Test (b) "per-field flush (Issue 1 repro)" present, body matches contract (incl. the 3000ms no-double-fire), passes.
- [ ] Test (c) "both pending single submit (no double, no drop)" present, body matches contract (incl. the 3500ms no-double-fire), passes.
- [ ] Test (d) "no-op when nothing pending" present, body matches contract, passes.
- [ ] All four use the required harness patterns (fake timers, ContextCapture, plain-fn TestInput, act-wrapped input/timers, mockClear after settle).
- [ ] Issue-3 pending() describe (@289+) untouched (owned by P1.M2.T1.S2).

### Code Quality Validation

- [ ] No source/core/Form.tsx edits.
- [ ] Tests edited ONLY if a scenario was missing/drifting (verify-first).
- [ ] TestInput is a plain function component (not React.forwardRef-wrapped).
- [ ] No cross-file test imports (each autosave file is self-contained).
- [ ] No-double-fire assertions (b: advance 3000ms; c: advance 3500ms) retained.

### Documentation & Deployment

- [ ] No README/CHANGELOG/example edits (those are P1.M3.T1).
- [ ] Verification record written to `plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M1T1S2/audit-record.md` (outcome + per-scenario table + run results).

---

## Anti-Patterns to Avoid

- ❌ Don't rewrite working tests — this is verify-first. All 4 tests already exist; confirm bodies match, edit ONLY on drift.
- ❌ Don't touch Form.tsx or submitImmediate — runtime fixes are S1's territory. Flag runtime gaps, don't fix them here.
- ❌ Don't touch the Issue-3 pending() describe (@289+) — that's P1.M2.T1.S2.
- ❌ Don't wrap TestInput in React.forwardRef() — it must be a plain fn consuming forwardRef from props (Issue 4 / §20).
- ❌ Don't use fireEvent.change, sync advanceTimersByTime, or fake timers without `shouldAdvanceTime: true` — all break the RHF microtask/timing model the suite depends on.
- ❌ Don't skip the `submitHandler.mockClear()` after the mount settle — mount/defaultValue noise will corrupt the "1 submit" assertion.
- ❌ Don't remove the no-double-fire assertions (b's 3000ms advance; c's 3500ms advance) — those are the guards for the cancel-then-invoke-once design.
- ❌ Don't import harness across test files — each autosave file is self-contained with its own TestInput/ContextCapture/baseInputs.
- ❌ Don't edit README/CHANGELOG/examples — those are P1.M3.T1.
- ❌ Don't assume the tests pass without running them — re-run the suite even if the bodies match (the runtime could have regressed).

---

## Confidence Score

**10/10** — one-pass success likelihood.

Rationale: This is a verify-first test subtask. Live-source research during PRP
authorship confirmed all four Issue-1 regression tests already exist in
`autosave-submit-immediate.test.tsx` at lines 88/136/192/256, with the exact
contract titles and bodies matching scenarios (a)–(d) — including the no-double-fire
guards and the shared plain-fn-TestInput + ContextCapture + fake-timer harness.
Git HEAD is `fa75dae` with a clean working tree. The implementing agent's task is
mechanical: re-read the describe block, confirm each body matches its contract,
run the suite green, write the record. The expected outcome is "no drift, all four
tests present + green." The only failure mode is citing a stale line number or
misjudging a runtime-vs-test failure — both mitigated by Task 1's grep re-location
and Task 4's runtime-vs-test debugging guidance.
