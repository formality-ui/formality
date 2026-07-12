name: "P1.M1.T1.S1 — Implement per-field debouncer flush in submitImmediate"
description: |

---

## Goal

**Feature Goal**: Ensure `submitImmediate()` (the public FormContext flush API)
flushes ALL pending auto-save timers — both the Form-level debouncer AND the
per-field numeric debounce timers in `fieldDebouncersRef` — as a single
coalesced save, with no double-submit, no `executionVersionRef` abort race,
and no spurious empty save when idle.

**Deliverable**: A **verification-first** subtask. The architecture report
and live-source research both confirm the fix is **already shipped** at
`packages/react/src/components/Form.tsx:720-748` with its explanatory inline
comment, and the 4 required regression tests already exist in
`packages/react/src/__tests__/autosave-submit-immediate.test.tsx` (lines 88,
136, 192, 256). The implementing agent's job is to **re-confirm the live
implementation matches the contract below**, fix only if drift is found, and
ensure the Mode-A inline comment is present.

> **EXPECTED OUTCOME: "no drift, already ships."** This was re-verified
> during PRP research (git HEAD `fa75dae`, working tree clean, all 4 test
> scenarios present). The implementing agent should independently re-confirm
> and record the result; it should NOT rewrite a working implementation.

**Success Definition**:
1. `submitImmediate` (Form.tsx) implements all four contract steps: (a) detect pending across both timer sources, (b) early-return if nothing pending, (c) cancel ALL timers, (d) invoke `executeAutoSave` exactly once.
2. The inline comment explains WHY it cancels-then-invokes rather than naive `forEach(fn => fn.flush())` (the `executionVersionRef` race) — Mode A docs ride-with.
3. The 4 regression tests exist and pass (form-level flush fires; per-field flush fires; both-pending → single submit; nothing-pending → no-op).
4. `pnpm typecheck`, `pnpm test` (and `pnpm test:coverage` ≥90%), `pnpm lint` all green.

## User Persona

**Target User**: React consumers of `@formality-ui/react` who call
`ctx.submitImmediate()` — e.g. a "Save Now" button, or flushing a pending
auto-save before navigation/unmount.

**Use Case**: A consumer edits a field configured with a per-field numeric
`inputConfig={{ debounce: 3000 }}`, then clicks "Save Now" 500ms later
(before the 3000ms timer fires). The pending save MUST land immediately.

**Pain Points Addressed**:
- Today's broken path (pre-fix): `submitImmediate` only flushed the Form-level
  debouncer, silently dropping per-field-debounced saves.
- Data loss on unmount: `edit per-field-debounced field → submitImmediate() →
  unmount` lost the edit (per-field timers are `.cancel()`-ed, not flushed,
  on unmount).
- The fix's cancel-then-invoke design also prevents a subtle race where a
  trailing timer fires after the flush, bumps `executionVersionRef`, and
  aborts the real flushed save.

## Why

- **Business value**: Closes a silent data-loss class of bug for the per-field
  numeric debounce feature (PRD §11.3). Without it, "Save Now" / flush-before-
  navigate drops edits with no user feedback — the exact failure mode the
  scoped-gate work elsewhere took pains to avoid.
- **Integration**: Depends on the `pending()` fix (Issue 3, P1.M2.T1.S1 —
  `wrapDebounced`) for correct pending-state detection. Both fixes are already
  in the tree; this subtask verifies them together. P1.M1.T1.S2 owns the
  fuller regression-test suite (already present); P1.M3.T1 owns the
  README/CHANGELOG narrative.
- **Scope boundary**: Touch ONLY `submitImmediate` in Form.tsx (+ its inline
  comment). Do NOT touch `executeAutoSave`, `changeField`, `getOrCreateDebounced`,
  core, or any test file in this subtask (tests are P1.M1.T1.S2). The fix is
  React-layer only.

## What

### The contract (4 steps)

`submitImmediate` MUST:
1. **Detect pending** across both timer sources:
   `debouncedSubmitRef.current?.pending() === true || [...fieldDebouncersRef.current.values()].some((fn) => fn.pending())`.
2. **Early-return if nothing is pending** — avoids a spurious empty save
   (`executeAutoSave` would bump `executionVersionRef` and run validation for no reason).
3. **Cancel ALL timers** — `debouncedSubmitRef.current?.cancel()` AND
   `fieldDebouncersRef.current.forEach((fn) => fn.cancel())`. This prevents a
   trailing timer callback from firing after the flush, bumping
   `executionVersionRef`, and aborting the real flushed save (the
   version-abort race).
4. **Invoke `executeAutoSave` exactly once** — `executeAutoSaveRef.current?.()`.
   The shared `pendingChangedFields` set captures all pending changes across
   both timer sources, so one invocation drains them all.

### CRITICAL: Why NOT the PRD's naive `forEach(fn => fn.flush())`

The PRD's suggested fix is **insufficient**. Flushing two timers naively
would run `executeAutoSave` twice. The second (empty) invocation bumps
`executionVersionRef`, which aborts the real first invocation — **dropping
the save entirely**. The cancel-then-invoke-once design avoids this race
entirely. The inline comment in Form.tsx MUST document this reasoning (Mode A).

### The repro table this fix satisfies

| Field debounce setup               | Elapsed < field ms | After `submitImmediate()`     |
| ---------------------------------- | ------------------ | ----------------------------- |
| Form-level `debounce={3000}`       | 500ms              | **1 submit** ✓ (always worked)|
| `inputConfig={{ debounce: 3000 }}` | 500ms              | **1 submit** ✓ (was 0 — the bug) |
| Both pending simultaneously        | 500ms              | **1 submit** ✓ (no double)    |
| Nothing pending                    | —                  | **0 submits** ✓ (no-op)       |

### Success Criteria

- [ ] `submitImmediate` implements all 4 contract steps above.
- [ ] Inline comment explains the cancel-then-invoke rationale (the `executionVersionRef` race).
- [ ] The 4 regression tests exist and pass (form-level, per-field, both-pending, nothing-pending).
- [ ] `pnpm typecheck` / `pnpm test` / `pnpm test:coverage` / `pnpm lint` all green.
- [ ] No double-submit, no version-abort race, no spurious empty save.

## All Needed Context

### Context Completeness Check

_Pass._ The contract is fully specified (4 steps + the rationale), the
architecture report cites exact line numbers, and live-source research during
PRP authorship confirmed the implementation is already present. The
implementing agent needs only to re-confirm and ensure the comment exists.

### Documentation & References

```yaml
# MUST READ
- url: Bug-fix Issue 1 (plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd — heading:h2.2/h3.0)
  why: The authoritative defect statement + repro table + the PRD's (insufficient) suggested fix.
  critical: "The PRD's naive forEach(fn => fn.flush()) is INSUFFICIENT — it double-invokes executeAutoSave and the empty 2nd call aborts the real 1st via executionVersionRef. Use cancel-then-invoke-once."

- url: PRD §4.1 (FormContextValue.submitImmediate: () => void) + §11.3 (per-field numeric debounce) + §11.2 (fieldDebouncersRef cache)
  why: The public contract being satisfied ("Execute pending debounced submit immediately") + the per-field timer model.
  critical: After §11.3, "pending debounced submit" includes the per-field timers in fieldDebouncersRef, not just debouncedSubmitRef.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/system_context.md
  why: Verified-current-state report. Confirms the fix is ALREADY shipped at Form.tsx:722-743 with the explanatory comment, and the 4 regression tests already exist.
  section: "Issue-by-Issue Status → Issue 1 (Major): submitImmediate per-field flush — ✅ FIXED" + "Auto-Save Architecture"
  critical: "Current implementation is SUPERIOR to the PRD's suggested fix: detects pending state, cancels ALL timers, runs executeAutoSave exactly once."

- file: packages/react/src/components/Form.tsx
  section: "submitImmediate (~720-748)"
  why: THE function to verify/fix. Re-locate it (grep for `const submitImmediate`).
  pattern: "useCallback(() => { detect pending → early-return → cancel all → executeAutoSaveRef.current?.() }, [])"
  gotcha: "Re-confirm line numbers at execution time (research showed 720-748; the architecture report cited 722-743; lines drift)."

- file: packages/react/src/components/Form.tsx
  section: "refs: fieldDebouncersRef (~225), pendingChangedFields (~215), debouncedSubmitRef (~506), executeAutoSaveRef (~509)"
  why: The four refs submitImmediate must coordinate. Verify each exists and is referenced correctly.
  pattern: "fieldDebouncersRef = useRef(new Map<number, DebouncedFunction>()) keyed by ms interval."
  gotcha: "fieldDebouncersRef is keyed by ms, NOT by field name — fields sharing ms share one timer. submitImmediate must flush/cancel across the whole Map."

- file: packages/react/src/components/Form.tsx
  section: "wrapDebounced (~862-884)"
  why: The helper that gives DebouncedFunction a correct pending(). submitImmediate's pending-detection DEPENDS on this being correct (Issue 3 / P1.M2.T1.S1).
  pattern: "let isPending = false; ... pending: () => isPending (set true on schedule, false on fire/cancel/flush)."
  gotcha: "If wrapDebounced is missing/broken, pending() always returns false and submitImmediate's early-return path becomes a no-op even when saves ARE pending. Verify wrapDebounced is wired into BOTH debouncedSubmit and getOrCreateDebounced."

- file: packages/react/src/types.ts
  section: "DebouncedFunction interface (~117-123)"
  why: The public contract submitImmediate relies on (cancel/flush/pending must exist on each debouncer).
  pattern: "interface DebouncedFunction { (): void; cancel: () => void; flush: () => void; pending: () => boolean; }"
  gotcha: "The immediate adapter (debounce === false) hardcodes pending: () => false — an immediate fn is never 'pending'. submitImmediate's pending-detection must tolerate this (it does, via .some())."

- file: packages/react/src/__tests__/autosave-submit-immediate.test.tsx
  section: "tests at lines 88, 136, 192, 256 (the 4 submitImmediate scenarios) + 301/341/381/434 (pending() scenarios)"
  why: CONFIRM these 4 regression tests already exist and pass. They are owned by P1.M1.T1.S2 — do NOT author them here, just verify presence.
  pattern: "Form-level flush fires; per-field flush fires (Issue 1 repro); both-pending → single submit; nothing-pending → no-op."
  gotcha: "If a test is MISSING, that is P1.M1.T1.S2's gap to fill, not this subtask. This subtask verifies the runtime; flag missing tests in the record, don't write them here."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
  components/Form.tsx               # ← submitImmediate lives here (~720-748); verify/fix + inline comment
  types.ts                          # DebouncedFunction interface (cancel/flush/pending)
  __tests__/
    autosave-submit-immediate.test.tsx  # 4 submitImmediate regression tests + 4 pending() tests (verify presence)
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/components/Form.tsx   # VERIFIED (or minimally fixed if drift found) + inline comment
# (no new files; tests belong to P1.M1.T1.S2)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Do NOT use the PRD's naive `fieldDebouncersRef.current.forEach(fn => fn.flush())`.
// Flushing multiple timers runs executeAutoSave multiple times. The 2nd (empty) invocation
// bumps executionVersionRef, which makes the 1st (real) invocation's post-await version
// check fail → it returns early → THE SAVE IS DROPPED. Cancel-then-invoke-ONCE is mandatory.

// CRITICAL: submitImmediate is a useCallback with an EMPTY dependency array (it reads
// everything via refs). Do NOT add deps — that would rebuild its identity and break
// consumers who stash it. All coordination is through refs (debouncedSubmitRef,
// fieldDebouncersRef, executeAutoSaveRef).

// GOTCHA: fieldDebouncersRef is keyed by ms interval, not field name. Multiple fields
// sharing the same numeric debounce share ONE timer entry. `[...fieldDebouncersRef.current.values()]`
// is the set of distinct timers (one per unique ms), not one per field.

// GOTCHA: The pending-detection must check BOTH sources: debouncedSubmitRef (Form-level)
// AND fieldDebouncersRef (per-field). Checking only one misses the other's pending save.

// GOTCHA: The early-return ("nothing pending → no-op") is NOT optional. Without it,
// calling submitImmediate when idle would invoke executeAutoSave, which increments
// executionVersionRef and runs validation for an empty pendingChangedFields set — a
// spurious empty save that could abort a concurrent real save.

// GOTCHA: The cancel step must run for ALL timers, not just pending ones. A timer that
// isn't pending right now (.cancel() is a no-op for it) is harmless to cancel, but a
// timer that BECOMES pending between the detection and the executeAutoSave call (unlikely
// but possible) would race the flush. Cancel-all is the safe choice.

// GOTCHA: This subtask DEPENDS on wrapDebounced (Issue 3 / P1.M2.T1.S1) being present —
// otherwise pending() always returns false and the detection logic short-circuits. Verify
// wrapDebounced is wired into both debouncedSubmit (Form.tsx:705) and getOrCreateDebounced
// (Form.tsx:659). Both are already present in the tree.

// GOTCHA: executeAutoSave reads the latest values via methods.getValues(), so a canceled
// in-flight save (if any) is superseded without data loss. The single invocation after
// cancel-all is correct.
```

## Implementation Blueprint

### Data models and structure

No data models change. `DebouncedFunction` (types.ts:117-123) already declares
`cancel`/`flush`/`pending`. This is pure runtime wiring.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: RE-LOCATE submitImmediate + confirm dependency refs are present
  - GREP: `grep -n "const submitImmediate\|fieldDebouncersRef\|debouncedSubmitRef\|executeAutoSaveRef\|pendingChangedFields" packages/react/src/components/Form.tsx`
  - CONFIRM wrapDebounced is defined (~862) AND wired into both debouncedSubmit (~705) and getOrCreateDebounced (~659) — this subtask depends on pending() working (Issue 3).
  - WHY: Lines drift; re-locate before editing/verifying. If wrapDebounced is missing, STOP — that's P1.M2.T1.S1's prerequisite and submitImmediate's pending-detection cannot work without it.

Task 2: VERIFY submitImmediate against the 4-step contract
  - READ the current submitImmediate body.
  - CONFIRM step 1 (detect pending — both sources): a boolean expression reading debouncedSubmitRef.current?.pending() OR fieldDebouncersRef values' pending().
  - CONFIRM step 2 (early-return if !anyPending): `if (!anyPending) return;`.
  - CONFIRM step 3 (cancel ALL timers): both debouncedSubmitRef.current?.cancel() AND fieldDebouncersRef.current.forEach(fn => fn.cancel()).
  - CONFIRM step 4 (invoke executeAutoSave ONCE): executeAutoSaveRef.current?.().
  - CONFIRM the useCallback has an EMPTY dependency array.
  - OUTCOME: if all 4 steps present → Task 3 (comment) + Task 5 (record). If any step missing/wrong → Task 4 (fix).

Task 3: VERIFY/ADD the Mode-A inline comment
  - READ the comment block above/within submitImmediate.
  - CONFIRM it explains WHY cancel-then-invoke-once (NOT naive flush): the executionVersionRef race — a trailing timer firing after the flush would bump the version and abort the real save.
  - IF missing or vague → ADD/expand it. Keep it concise (the existing comment in the tree is a good model: ~10 lines).
  - This is the ONLY doc touch for this subtask (Mode A, rides-with; no README change).

Task 4 (CONDITIONAL — only if Task 2 found drift): FIX submitImmediate
  - IF the live implementation does NOT match the 4-step contract → rewrite submitImmediate to match it exactly.
  - PRESERVE: empty dependency array, the refs-based coordination, the useCallback wrapper.
  - DO NOT: switch to naive forEach-flush; add deps; touch executeAutoSave/changeField/getOrCreateDebounced.
  - (Research indicates this task will NOT fire — the implementation is already correct. But the agent must verify, not assume.)

Task 5: VERIFY the 4 regression tests exist (do NOT author them)
  - GREP: `grep -nE "^\s*(it|test)\(" packages/react/src/__tests__/autosave-submit-immediate.test.tsx`
  - CONFIRM at least one test for each scenario: form-level flush, per-field flush (Issue 1 repro), both-pending single-submit, nothing-pending no-op.
  - IF any are MISSING → flag in the verification record (P1.M1.T1.S2 owns authoring). Do NOT write the tests here.

Task 6: FULL VALIDATION
  - RUN: `pnpm typecheck` (root tsc --build).
  - RUN: `pnpm --filter @formality-ui/react test -- autosave-submit-immediate` (the relevant suite).
  - RUN: `pnpm test` (full suite — no regressions).
  - RUN: `pnpm test:coverage` (≥90% gate).
  - RUN: `pnpm lint`.
  - EXPECT: all green. If the submitImmediate tests fail, the implementation has drift — return to Task 4.

Task 7: WRITE the verification record (the deliverable)
  - RECORD the outcome: "submitImmediate verified — matches 4-step contract" OR "GAP: <step> missing/wrong, fixed in this diff".
  - CITE the current line numbers for each of the 4 steps + the comment block.
  - NOTE the test-file line numbers for the 4 regression scenarios (or flag gaps for P1.M1.T1.S2).
  - THE RECORD confirms P1.M1.T1.S2 can proceed (its regression tests have a correct runtime to test against).
```

### Implementation Patterns & Key Details

```tsx
// packages/react/src/components/Form.tsx — submitImmediate (the contract to verify/match):

// const submitImmediate = useCallback(() => {
//   // (Mode A comment) Flush every pending auto-save immediately — both the per-field
//   // numeric debounce timers (autosave Issue 1) and the Form-level debounce.
//   //
//   // Pending changes accumulate in a single shared set (pendingChangedFields), so one
//   // executeAutoSave captures them all. We therefore (a) detect any pending timer,
//   // (b) cancel every idle timer so its trailing callback can't fire a second,
//   // version-bumping invocation that would abort this flush (see executionVersionRef
//   // in executeAutoSave), and (c) run the save pipeline exactly once.
//
//   // STEP 1: detect pending across both sources
//   const anyPending =
//     debouncedSubmitRef.current?.pending() === true ||
//     [...fieldDebouncersRef.current.values()].some((fn) => fn.pending());
//
//   // STEP 2: nothing pending → no-op (avoid spurious empty save)
//   if (!anyPending) return;
//
//   // STEP 3: cancel ALL timers (prevent the version-abort race)
//   debouncedSubmitRef.current?.cancel();
//   fieldDebouncersRef.current.forEach((fn) => fn.cancel());
//
//   // STEP 4: invoke executeAutoSave exactly once (shared pending set drains all)
//   executeAutoSaveRef.current?.();
// }, []);  // ← EMPTY deps; all coordination via refs

// PATTERN: refs-only coordination → empty dep array → stable identity.
// GOTCHA: cancel-all is safe even for non-pending timers (cancel is a no-op for them).
// CRITICAL: do NOT replace this with forEach(fn => fn.flush()) — that double-invokes
//           executeAutoSave and the empty 2nd call aborts the real 1st (executionVersionRef race).
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
RUNTIME:
  - submitImmediate (Form.tsx): the 4-step flush — verify/fix + Mode A comment.
  - wrapDebounced (Form.tsx:862): PREREQUISITE — pending() must work (Issue 3, P1.M2.T1.S1). Verify it's wired in.
  - executeAutoSave / changeField / getOrCreateDebounced: UNCHANGED — do not touch.
PUBLIC API: none changed. submitImmediate's contract ("Execute pending debounced submit immediately") is unchanged; this fix makes the implementation MATCH the documented contract.
DOCS: Mode A inline comment in Form.tsx only (rides with the work). No README change — submitImmediate's public contract is unchanged.
TESTS: verify presence of the 4 regression scenarios in autosave-submit-immediate.test.tsx; authoring is P1.M1.T1.S2.
```

## Validation Loop

### Level 1: Audit Rigor (the primary validation for a verify-first subtask)

```bash
# Re-locate submitImmediate and the refs it coordinates
grep -n "const submitImmediate\|fieldDebouncersRef\|debouncedSubmitRef\|executeAutoSaveRef" packages/react/src/components/Form.tsx

# Confirm wrapDebounced (the pending() prerequisite, Issue 3) is present AND wired in
grep -n "function wrapDebounced\|wrapDebounced(" packages/react/src/components/Form.tsx
# Expected: 1 definition + ≥2 call sites (debouncedSubmit + getOrCreateDebounced).

# Confirm the 4 contract steps are present in submitImmediate's body:
sed -n '/const submitImmediate = useCallback/,/}, \[\]);/p' packages/react/src/components/Form.tsx | \
  grep -nE "anyPending|if \(!anyPending\)|\.cancel\(\)|executeAutoSaveRef\.current"
# Expected: ≥4 distinct matches covering detect / early-return / cancel-all / invoke-once.

# Confirm the Mode-A comment explains the race (NOT a naive flush):
sed -n '/const submitImmediate = useCallback/,/}, \[\]);/p' packages/react/src/components/Form.tsx | \
  grep -iE "version|abort|race|trailing|once"
# Expected: ≥1 match (the comment explaining why cancel-then-invoke-once).
```

### Level 2: Regression Tests (confirm they exist + pass)

```bash
# List the submitImmediate regression tests
grep -nE "^\s*(it|test)\(" packages/react/src/__tests__/autosave-submit-immediate.test.tsx
# Expected: ≥4 tests covering form-level flush, per-field flush, both-pending, nothing-pending.

# Run the relevant suite
pnpm --filter @formality-ui/react test -- autosave-submit-immediate
# Expected: all green.
```

### Level 3: Full Suite + Coverage Gate (no regressions, ≥90%)

```bash
pnpm test            # full suite — no regressions
pnpm test:coverage   # ≥90% gate (PRD §1.3.7)
# Expected: green. submitImmediate's branches (anyPending true/false) must be exercised
#           by the regression tests to keep coverage above the floor.
```

### Level 4: Typecheck, Build, Lint (clean baseline)

```bash
pnpm typecheck                              # root tsc --build
pnpm --filter @formality-ui/react build     # tsup
pnpm lint                                   # 0 errors
# Expected: all green.
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` green; `pnpm --filter @formality-ui/react build` green.
- [ ] `pnpm test` green (no regressions); `pnpm test:coverage` green (≥90%).
- [ ] `pnpm lint` clean.
- [ ] `git diff --stat` shows ONLY Form.tsx changed (and ONLY if Task 4 fired — otherwise only the comment, or nothing).

### Feature Validation

- [ ] submitImmediate step 1 (detect pending, both sources) present and cited.
- [ ] submitImmediate step 2 (early-return if !anyPending) present and cited.
- [ ] submitImmediate step 3 (cancel ALL timers) present and cited.
- [ ] submitImmediate step 4 (invoke executeAutoSave ONCE) present and cited.
- [ ] Mode-A inline comment explains the executionVersionRef race (why NOT naive flush).
- [ ] The 4 regression test scenarios exist in autosave-submit-immediate.test.tsx (or flagged for P1.M1.T1.S2).
- [ ] Repro table satisfied: per-field `inputConfig={{ debounce: 3000 }}` + 500ms → 1 submit after submitImmediate.

### Code Quality Validation

- [ ] useCallback dependency array is EMPTY (refs-only coordination).
- [ ] No naive `forEach(fn => fn.flush())` (that's the rejected PRD suggestion).
- [ ] No edits to executeAutoSave, changeField, getOrCreateDebounced, core, or test files.
- [ ] Comment is concise (~10 lines, matches existing tone).

### Documentation & Deployment

- [ ] Mode-A inline comment present in Form.tsx (rides with the work).
- [ ] No README/CHANGELOG edit here (those are P1.M3.T1).
- [ ] Verification record written (outcome + citations), consumable by P1.M1.T1.S2.

---

## Anti-Patterns to Avoid

- ❌ Don't use the PRD's naive `forEach(fn => fn.flush())` — it double-invokes executeAutoSave and the empty 2nd call aborts the real 1st via executionVersionRef.
- ❌ Don't add dependencies to the useCallback — it coordinates via refs; adding deps rebuilds its identity and breaks consumers.
- ❌ Don't touch executeAutoSave, changeField, getOrCreateDebounced, or core — this subtask is submitImmediate-only.
- ❌ Don't author the regression tests here — that's P1.M1.T1.S2. Verify presence; flag gaps.
- ❌ Don't assume the fix is present without re-verifying — lines drift and commits land. Re-locate via grep, then confirm each of the 4 steps.
- ❌ Don't skip the early-return (step 2) — without it, an idle submitImmediate runs a spurious empty save that can abort a concurrent real save.
- ❌ Don't skip the cancel-all (step 3) — a trailing timer firing after the flush bumps executionVersionRef and aborts the flushed save.
- ❌ Don't edit the README/CHANGELOG here — those are P1.M3.T1 (Mode B docs).

---

## Confidence Score

**10/10** — one-pass success likelihood.

Rationale: This is a verify-first subtask and the fix is already shipped.
Live-source research during PRP authorship confirmed: submitImmediate
(Form.tsx:720-748) implements all 4 contract steps with the explanatory
Mode-A comment; wrapDebounced (Form.tsx:862-884) provides correct pending();
and all 4 regression scenarios exist in autosave-submit-immediate.test.tsx
(lines 88, 136, 192, 256). Git HEAD is `fa75dae` with a clean working tree.
The implementing agent's task is mechanical: re-confirm the 4 steps, ensure
the comment is present, run the gates. The expected outcome is "no drift,
already ships." The only failure mode is citing a stale line number —
mitigated by Task 1's mandatory grep re-location.
