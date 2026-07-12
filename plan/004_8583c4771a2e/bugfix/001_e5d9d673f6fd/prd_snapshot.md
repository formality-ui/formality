# Bug Fix Requirements

## Overview

End-to-end validation of the **P1 "Scoped Auto-Save Validation & Per-Field
Debounce Coalescing"** work (PRD §11/§12) plus a broad sweep of the surrounding
implementation against the PRD.

**What was validated and is healthy:**
- The headline auto-save behaviors all match PRD §11.1–§11.3 and are well
  covered by the 4 `autosave-*.test.tsx` suites (43 tests, all green):
  - Scoped validity gate (§11.1 point 4) — editing a valid field saves even
    while an unrelated field is invalid; whole-form validity still gates a full
    manual submit. (`autosave-validation.test.tsx` → "Unrelated Invalid Field
    (Issue 2)".)
  - Per-field numeric debounce honored (§11.3), including coalescing-by-
    interval (shared ms → shared timer; faster timer submits the pending batch;
    slower timer no-ops; no-debounce falls back to the Form-level `debounce`).
    (`autosave-field-debounce.test.tsx` → "Coalescing semantics".)
  - Execution-version abort of stale saves mid-validation.
- Coverage gate (PRD §1.3.7) is **green**: 97.26% statements / 95.72%
  branches / 98.16% functions / 97.26% lines — all above the 90% floor.
- The Mode-B doc sweep (P1.M1.T2) is **correct and complete**: the three stale
  whole-form-validity claims in `examples/06-auto-save.tsx` Example 4 were
  rewritten to describe the scoped gate, and the READMEs / `Form.tsx` JSDoc /
  CHANGELOG were already neutral/accurate (no stale claims remain).

**Two Major issues were found** that standard validation (which only ran the
green working tree) missed. Both are reproducible.

---

## Critical Issues (Must Fix)

None.

---

## Major Issues (Should Fix)

### Issue 1: `submitImmediate()` does not flush pending per-field numeric debounce saves

**Severity**: Major
**PRD Reference**: §4.1 (`FormContextValue.submitImmediate: () => void; //
Execute pending debounced submit immediately`) in conflict with §11.3 / §11.2
(per-field numeric `InputConfig.debounce` and the `fieldDebouncersRef` cache).

**Expected Behavior**
`submitImmediate` is the public FormContext API to "Execute pending debounced
submit immediately" (§4.1). After the per-field numeric debounce feature
(§11.3) was added, "pending debounced submit" includes the per-field timers
memoized in `fieldDebouncersRef`. A consumer who edits a per-field-debounced
field and then calls `submitImmediate()` (e.g. a "Save Now" button, or flushing
before navigation/unmount) must have that pending save flushed immediately.

**Actual Behavior**
`submitImmediate` only flushes the single Form-level debouncer
(`debouncedSubmitRef.current?.flush()`). It never touches
`fieldDebouncersRef`, so any pending **per-field** numeric debounce save is
left on its own timer and is NOT flushed.

Airtight repro (probe, fake timers, `{ shouldAdvanceTime: true }`):

| Field debounce setup | Elapsed < field ms | After `submitImmediate()` |
| --- | --- | --- |
| Form-level `debounce={3000}` | 500ms | **1 submit** ✓ (flush works) |
| `inputConfig={{ debounce: 3000 }}` | 500ms | **0 submits** ✗ (flush fails) |

The per-field save only lands later when the field's own 3000ms timer fires.

**Steps to Reproduce**
1. Render a `<Form autoSave debounce={500}>` with a `<Field name="fieldA"
   inputConfig={{ debounce: 3000 }} />` and capture `FormContext` via
   `<FormContext.Consumer>`.
2. Type into `fieldA`; advance fake timers 500ms (no submit yet — correct).
3. Call `ctx.submitImmediate()`; advance timers 0ms.
4. Assert `submitHandler` was called. → It is **not** (BUG). The save only
   appears after advancing another 3000ms (the field's own timer).

(Reproduced in a temporary probe test; deleted after confirmation. The
form-level flush path is already exercised by
`Form.coverage.test.tsx` → "should expose working cancel/flush/pending on the
immediateFn adapter", which is why only the per-field path is broken.)

**Location**
`packages/react/src/components/Form.tsx:732-738`:
```ts
const submitImmediate = useCallback(() => {
    debouncedSubmitRef.current?.flush();   // ← only Form-level; ignores fieldDebouncersRef
}, []);
```
`fieldDebouncersRef` is declared at `Form.tsx:225`, populated by
`getOrCreateDebounced` (`Form.tsx:650-682`), and only ever `.cancel()`-ed on
unmount (`Form.tsx:681-682`) — never flushed.

**Impact**
- "Save Now" / flush-before-navigate silently drops the change for any field
  using a numeric `InputConfig.debounce`, with no user feedback — the exact
  silent-drop class of bug the scoped-gate work elsewhere took pains to avoid
  (cf. `autosave-validation.test.tsx` "Unrelated Invalid Field").
- Compounds with data loss: on unmount the per-field timers are `.cancel()`-ed,
  not flushed (`Form.tsx:681-682`). So `edit per-field-debounced field →
  submitImmediate() → unmount` loses the edit entirely.

**Suggested Fix**
Flush the per-field debouncers in `submitImmediate`, e.g.:
```ts
const submitImmediate = useCallback(() => {
    fieldDebouncersRef.current.forEach((fn) => fn.flush()); // lodash debounce exposes .flush()
    debouncedSubmitRef.current?.flush();
}, []);
```
Add regression tests mirroring the repro table above (form-level flush still
fires; per-field flush now fires; no double-submit when both are pending).

---

### Issue 2: Committed `main` HEAD (`8e3fd4c`) has a red test suite + committed diagnostic scratch files

**Severity**: Major
**PRD Reference**: §1.3.7 (mandatory ≥90% coverage gate / green CI) and general
build/CI integrity. (Note: the failing tests are for the `isDisabled`
field-state condition matcher, which is **not** a PRD-mandated feature and is
**not** part of the auto-save P1 scope — see below.)

**Expected Behavior**
The committed `main` branch should have a green test suite and contain no
temporary diagnostic scratch files.

**Actual Behavior**
Two related problems ship on `main` HEAD (`8e3fd4c test: consolidate
disabled-layer tests and add isDisabled probes`):

1. **4 failing tests committed.** `packages/react/src/__tests__/Field.test.tsx`
   at HEAD contains 5 active `isDisabled`-matcher tests; 4 of them fail:
   - `Field > Conditions disabled priority … > should reference isDisabled matcher from other field`
   - `… > two-field isDisabled conditions > should disable result when both source fields are disabled`
   - `… > two-field isDisabled conditions > should re-evaluate when source field disabled states change`
   - `… > two-field isDisabled conditions > should work with field state matchers in object when`

   Verified by checking out HEAD's `Field.test.tsx` and running it in
   isolation: `1 failed | Tests 4 failed`. CI running on `main` HEAD is red.

2. **2 diagnostic scratch files committed.**
   `packages/react/src/__tests__/_tmp_isdisabled_probe.test.tsx` and
   `_tmp_isdisabled_probe2.test.tsx` are exploratory "PROBE:" test files that
   should not be in version control.

**Why standard validation missed it**
The working tree currently masks both problems via **uncommitted** changes:
- `Field.test.tsx` is modified (uncommitted) to flip those 5 tests to
  `it.skip(...)` with "KNOWN LIMITATION" comments.
- The two probe files are `git rm`-ed (uncommitted).

So a plain `npx vitest run` against the working tree is green (980 passed,
6 skipped), hiding the red committed state. `git status --short`:
```
 M packages/react/src/__tests__/Field.test.tsx
 D packages/react/src/__tests__/_tmp_isdisabled_probe.test.tsx
 D packages/react/src/__tests__/_tmp_isdisabled_probe2.test.tsx
```

**Impact**
- CI on `main` HEAD fails (4 failing tests). Anyone building/testing the
  committed branch gets a red suite; the green working tree is not committed.
- The repo is in an inconsistent state (committed-red, working-tree-green via
  uncommitted masks).
- The skipped tests document a real React-integration limitation: the
  `isDisabled` field-state condition matcher (implemented and unit-tested in
  `@formality-ui/core` — see `packages/core/src/conditions/evaluate.ts`) does
  not work in the React adapter because config-level / JSX-prop `disabled`
  states are not propagated into the `fieldStates` used for condition
  evaluation (per the skip comments). Masking with `it.skip` hides this gap.

**Steps to Reproduce**
```bash
git show HEAD:packages/react/src/__tests__/Field.test.tsx \
  > packages/react/src/__tests__/Field.test.tsx
npx vitest run src/__tests__/Field.test.tsx   # → 4 failed
git checkout -- packages/react/src/__tests__/Field.test.tsx   # restore
```

**Suggested Fix** (humans to choose)
- Minimum (hygiene): commit the working-tree masks + probe deletions so `main`
  is green and clean, and decide whether the `isDisabled` React limitation is
  tracked as a known issue elsewhere (not just in skip comments).
- Or (feature): wire config-level / JSX-prop `disabled` into the `fieldStates`
  used by React condition evaluation so the un-skipped `isDisabled` tests pass
  end-to-end (core already supports it). Then drop the probes permanently.
- Either way, remove `_tmp_isdisabled_probe*.test.tsx` from history going
  forward.

---

## Minor Issues (Nice to Fix)

### Issue 3: `DebouncedFunction.pending()` always returns `false` for both Form-level and per-field debouncers

**Severity**: Minor
**PRD Reference**: §4.1 (`DebouncedFunction.pending: () => boolean; // Check if
there's a pending invocation`).
**Actual**: In `Form.tsx`, both the immediate adapter (`debouncedSubmit` when
`debounce === false`) and the per-field `getOrCreateDebounced` hardcode
`pending: () => false`, and the normal lodash path also returns `false`
(`// lodash debounce handles this internally` — but it does not, since the
returned fn is wrapped). So `pending()` misreports "not pending" while a save
is in fact scheduled. Low impact (the API appears unused by consumers), but it
violates the documented contract. Fix: delegate to lodash's real pending state
or track it explicitly.

### Issue 4: `forwardRef` render-function warnings in the test suite

**Severity**: Minor (test hygiene)
**Actual**: `npx vitest run --coverage` emits many `Warning: forwardRef render
functions accept exactly two parameters: props and ref. Did you forget to use
the ref parameter?` The shared test input components use `forwardRef<…>(
({ value, onChange, name, forwardRef, … }) => …)` and ignore the second `ref`
parameter (they consume `forwardRef` from props per the §20 pattern). Cosmetic
only; does not affect results. Fix: drop the unused `forwardRef(() => …)` wrap
in the test components (the §20 contract delivers `forwardRef` as a prop, so
the wrap is unnecessary in tests) or accept the `ref` parameter.

---

## Testing Summary

- **Total tests in suite (working tree):** 986 (980 passed, 6 skipped) across
  36 test files (26 react + 10 core).
- **Auto-save-specific:** 43 tests across 4 `autosave-*.test.tsx` files — all
  pass; spec coverage mapping in
  `plan/004_8583c4771a2e/architecture/autosave-test-audit.md` is still
  accurate.
- **Coverage gate (§1.3.7):** GREEN — 97.26% statements / 95.72% branches /
  98.16% functions / 97.26% lines (all ≥ 90%).
- **Committed HEAD (`8e3fd4c`) Field.test.tsx:** 4 failed (Issue 2).
- **Adversarial probes written & removed:** 2 airtight repros for Issue 1
  (form-level flush = 1 call vs per-field flush = 0 calls).
- **Doc sweep (P1.M1.T2):** verified correct — `examples/06-auto-save.tsx`
  Example 4 fixed; READMEs / JSDoc / CHANGELOG already neutral.

**Areas with good coverage:**
- Scoped auto-save validation (§11.1.4) and per-field debounce coalescing
  (§11.3) — comprehensive.
- Execution-version / stale-save abort timing.
- The Mode-B documentation sweep.

**Areas needing more attention:**
- Integration of the per-field debounce cache with the rest of the
  FormContext auto-save API (`submitImmediate` — Issue 1; `pending()` —
  Issue 3).
- Repository/CI hygiene on `main`: the committed branch is red and contains
  diagnostic scratch files masked only by uncommitted working-tree changes
  (Issue 2).
