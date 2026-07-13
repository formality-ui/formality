name: "P2.M1.T2.S1 — Remove orphaned useFieldDisabledState hook and its test file"
description: |

---

## Goal

**Feature Goal**: DELETE the **orphaned, dead-code** hook
`packages/react/src/hooks/useFieldDisabledState.ts` (197 lines) and its test
`packages/react/src/__tests__/useFieldDisabledState.test.tsx` (16 tests), then
PROVE the removal is safe: zero failing tests, green typecheck, green coverage
gate (≥ 90%), and **zero remaining references** to the hook anywhere in
`packages/react/src/`. This closes the P2.M1.T2 dead-code-cleanup item — the
hook is a superseded precursor to the inline disabled-resolution logic now
living in `useField.tsx` (PRD §5.3.4), never exported and never imported by any
production code.

**Deliverable**:
1. **Two files deleted** (via `git rm`):
   - `packages/react/src/hooks/useFieldDisabledState.ts`
   - `packages/react/src/__tests__/useFieldDisabledState.test.tsx`
2. **One stale comment updated** in `packages/react/src/__tests__/useFormState.test.tsx`
   (line 45) — the sole live-code reference to the deleted test file, rewritten
   to remove the dangling citation (see Task 3).
3. **All gates green**: `pnpm test` (count drops by exactly 16; zero failures),
   `pnpm typecheck`, `pnpm test:coverage` (≥ 90% on all four metrics),
   `pnpm lint`, `pnpm build`.
4. **Import-free proof**: `grep -rn "useFieldDisabledState" packages/react/src/`
   returns **zero matches**.

**Success Definition**:
- The two files no longer exist on disk.
- `grep -rn "useFieldDisabledState" packages/react/src/` → empty.
- `pnpm test` → all remaining tests pass (count = post-S3 baseline − 16;
  **zero failures**, 5 skipped unchanged).
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:coverage` all green.
- The only edit outside the 2 deletions is the 1-line comment cleanup at
  `useFormState.test.tsx:45`.

## User Persona (if applicable)

**Target User**: Formality React-adapter maintainer hardening the v1.0 source
tree. This task removes a known orphan so the public API and source graph
contain only code that is actually reachable.

**Use Case**: After the `useField` extraction (P2.M1.T1) relocated disabled
resolution inline into `useField.tsx`, `useFieldDisabledState` became
unreachable. A maintainer deletes it to prevent confusion and rot.

**User Journey**: (1) confirm the hook is dead (grep imports + barrel), (2)
delete the two files, (3) clean the one stale comment, (4) run the gates, (5)
confirm zero remaining references.

**Pain Points Addressed**: Dead code misleads future contributors (it looks
important — it's a tested hook), inflates the coverage denominator, and can be
mistaken for the live disabled-resolution path. Removing it makes
`useField.tsx`'s inline logic the single source of truth.

## Why

- **Dead code is a liability.** `useFieldDisabledState` is implemented and
  tested but never exported (`index.ts` lines 72–81 omit it) and never imported
  by any component (`Field.tsx` and the extracted `useField.tsx` both resolve
  disabled inline per PRD §5.3.4). It is a superseded precursor.
- **The `useField` extraction made it unambiguously dead.** P2.M1.T1.S2 moved
  disabled resolution INTO `useField.tsx` (lines 388–420), delegating to
  `useConditions` + `groupContext.state.isDisabled`. There is now no code path
  that could call `useFieldDisabledState`. Removing it is the natural close-out
  of the hook-architecture-reconciliation milestone (P2.M1.T2).
- **No user/config/API surface change.** The hook was never exported, so no
  consumer can break. No docs, README, or config reference it.

## What

Delete the orphaned hook and its test, clean the one dangling comment, and run
the repo's standard validation gates. No behavioral change to any runtime code.

### Success Criteria

- [ ] `packages/react/src/hooks/useFieldDisabledState.ts` is deleted.
- [ ] `packages/react/src/__tests__/useFieldDisabledState.test.tsx` is deleted.
- [ ] `grep -rn "useFieldDisabledState" packages/react/src/` → **zero matches**.
- [ ] `useFormState.test.tsx:45` no longer cites the deleted file (comment cleaned).
- [ ] `pnpm test` → zero failures (5 skipped unchanged; count drops by 16).
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` → green.
- [ ] `pnpm test:coverage` → statements/branches/functions/lines all ≥ 90%.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the dead-code
PROOF (three independent checks), the exact two file paths, the one stale
comment and its rewrite, the full inventory of dangling references and which to
ignore (CHANGELOG, generated coverage, historical plan docs), the verified
validation commands, and the expected test-count delta. All cited below with
exact paths and line numbers. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/005_8f88e0ec4482/P2M1T2S1/research/research-notes.md
  why: |
    THIS TASK'S FIELD GUIDE. The dead-code proof (§1, three independent
    confirmations), the two files + test count (§2), the FULL dangling-reference
    inventory + disposition per reference (§3), the exact stale-comment rewrite
    (§4), the verified validation commands + coverage-impact analysis (§5),
    the baseline & dependency context (§6), risk assessment (§7). READ THIS FIRST.

- docfile: PRD.md §1.3.3 What Belongs in @formality-ui/react (h4.2)
  why: |
    The canonical hook list. `useFieldDisabledState` is NOT in the §1.3.3 table
    (it lists useField, useConditions, useSubscriptions, usePropsEvaluation,
    useFormState, useInferredInputs). Its presence in src/ is a spec deviation;
    removal aligns src/ with the spec.

- docfile: PRD.md §5.3.4 Disabled State Resolution (h4.32) + §1.3.7 (h4.6)
  why: |
    §5.3.4 is the inline disabled-resolution contract now implemented in
    useField.tsx (the logic that SUPERSEDED useFieldDisabledState). §1.3.7 is
    the ≥ 90% coverage gate that must remain green after removal.

- file: packages/react/src/index.ts
  section: lines 72-81 (the hook exports)
  why: |
    PROOF the hook is not exported. Lines 72-81 export useFormState,
    useConditions, usePropsEvaluation, useInferredInputs, useSubscriptions,
    useField — but NOT useFieldDisabledState. Deleting it changes no public API.

- file: packages/react/src/hooks/useField.tsx
  section: lines 388-420 (the live inline disabled resolution)
  why: |
    THE critical safety proof. This is the CURRENT disabled-resolution logic
    (post P2.M1.T1.S2 extraction). It resolves disabled inline via disabledProp
    → fieldConfig.disabled → conditionResult.disabled (useConditions) →
    groupContext.state.isDisabled → prop-layer disabled (PRD §5.3.4). It does
    NOT call useFieldDisabledState — confirming the hook is dead and removal
    cannot break behavior.

- file: packages/react/src/components/Field.tsx
  why: |
    The (now thin, post-extraction) wrapper. `grep useFieldDisabledState` here
    returns NO matches — Field only references `disabled` via the destructured
    `disabledProp` (lines 126, 147). No production consumer exists.

- file: packages/react/src/__tests__/useFormState.test.tsx
  section: line 45 (the stale comment)
  why: |
    The SOLE live-code dangling reference: "Reuses the closure pattern from
    useFieldDisabledState.test.tsx." After deletion this cites a non-existent
    file. Rewrite per Task 3. (This is a comment-only cleanup; no behavioral change.)

- file: packages/react/src/__tests__/useFieldDisabledState.test.tsx
  why: |
    The test file to DELETE. 16 it() cases across 9 describe blocks. Removing it
    removes 16 passing tests from the suite (expected; tests assert behavior of
    dead code).
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
├── hooks/
│   ├── useFieldDisabledState.ts          # ← DELETE (197 lines, orphaned, never exported/imported)
│   ├── useField.tsx                      # KEEP — owns the LIVE inline disabled resolution (L388-420)
│   ├── useConditions.ts                  # KEEP — provides conditionResult.disabled used by useField
│   └── ... (useFormState, usePropsEvaluation, useInferredInputs, useSubscriptions)
├── components/
│   └── Field.tsx                         # KEEP — thin wrapper; does NOT import useFieldDisabledState
├── __tests__/
│   ├── useFieldDisabledState.test.tsx    # ← DELETE (16 tests, asserts the dead hook)
│   ├── useFormState.test.tsx             # EDIT line 45 — remove stale "from useFieldDisabledState.test.tsx" citation
│   └── ... (all other tests — KEEP, unchanged)
└── index.ts                              # KEEP — never exported useFieldDisabledState (no edit needed)
```

### Desired Codebase tree after this task

```bash
packages/react/src/
├── hooks/
│   ├── useField.tsx                      # unchanged (owns live disabled resolution)
│   └── ... (useConditions, useFormState, usePropsEvaluation, useInferredInputs, useSubscriptions)
├── __tests__/
│   ├── useFormState.test.tsx             # line 45 comment rewritten (dangling ref removed)
│   └── ... (useFieldDisabledState.test.tsx GONE)
└── index.ts                              # unchanged
# DELETED: hooks/useFieldDisabledState.ts, __tests__/useFieldDisabledState.test.tsx
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL — this is a DELETION of triple-confirmed dead code. Do NOT "fix" or
// "repurpose" the hook. Do NOT wire it into Field.tsx/useField.tsx. The contract
// is delete + clean the stale comment + run gates. Any other edit is out of scope.

// CRITICAL — the dependency on P2.M1.T1.S3 is ALREADY SATISFIED in the current
// working tree: the extracted useField.tsx resolves disabled INLINE (L388-420),
// NOT via useFieldDisabledState. Removing the hook cannot break behavior regardless
// of S3's final state. (Verified in research-notes §1c.)

// GOTCHA — there is ONE stale code comment referencing the deleted test file:
//   packages/react/src/__tests__/useFormState.test.tsx:45
//   "// Reuses the closure pattern from useFieldDisabledState.test.tsx."
// Rewrite it (Task 3) so the codebase has no dangling file references. This is the
// ONLY non-deletion edit and it is comment-only.

// CRITICAL — do NOT edit CHANGELOG.md:111 ("Add useFieldDisabledState hook...").
// It is an append-only HISTORICAL release note. The deletion gets its OWN new
// changelog entry later via semantic-release. Editing history is forbidden.

// GOTCHA — `pnpm test:coverage` regenerates coverage/coverage-final.json, which
// currently contains a (stale) useFieldDisabledState.ts entry. After removal + a
// fresh coverage run, that entry disappears automatically. Do NOT hand-edit the
// coverage JSON.

// GOTCHA — the test count drops by exactly 16 (the it() cases in the deleted test
// file). This is EXPECTED, not a regression. The 5 skipped tests are unrelated
// and remain 5. Zero FAILURES is the real success signal.

// GOTCHA — the contract cites "gap_analysis.md G7"; that file does NOT exist on
// disk at plan/005_8f88e0ec4482/. The orphan status is real and documented in
// agent research artifacts (research-notes §1d). Do not block on the missing file.

// CRITICAL (verbatimModuleSyntax: true) — when editing useFormState.test.tsx,
// do not introduce new imports; only delete the one comment line. No type-only
// import concerns arise from a comment edit.
```

## Implementation Blueprint

### Data models and structure

None. This task removes code; it introduces no models, types, or interfaces.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION + final dead-code re-confirmation (fast, defensive)
  - READ: plan/.../P2M1T2S1/research/research-notes.md   (the field guide — esp. §1 proof, §3 reference inventory)
  - RE-CONFIRM the hook is still dead RIGHT NOW (the S2 extraction is mid-flight
    in the working tree; verify the live resolution path is still inline, not the hook):
      grep -rn "useFieldDisabledState" packages/react/src/
      # Expected BEFORE deletion: exactly 3 groups of matches —
      #   (a) useFormState.test.tsx:45 (the stale comment)
      #   (b) hooks/useFieldDisabledState.ts (self)
      #   (c) __tests__/useFieldDisabledState.test.tsx (self)
      # If you see a NEW match in useField.tsx/Field.tsx/index.ts, STOP — the
      # extraction regressed and wired the hook in. Re-read research §1c before proceeding.
  - CONFIRM the live inline resolution still exists (the thing that superseded the hook):
      grep -n "const isDisabled" packages/react/src/hooks/useField.tsx
      # Expected: a match around L388 (disabledProp → fieldConfig.disabled →
      # conditionResult.disabled → groupContext.state.isDisabled). This is the live logic.

Task 2: DELETE the two files
  - COMMAND (use git rm so the deletion is tracked):
      git rm packages/react/src/hooks/useFieldDisabledState.ts
      git rm packages/react/src/__tests__/useFieldDisabledState.test.tsx
  - VERIFY both are gone:
      ls packages/react/src/hooks/useFieldDisabledState.ts packages/react/src/__tests__/useFieldDisabledState.test.tsx
      # Expected: "No such file or directory" for both.

Task 3: CLEAN the one stale comment (the sole non-deletion edit)
  - FILE: packages/react/src/__tests__/useFormState.test.tsx
  - FIND (around line 45):
        // Create wrapper with record and config for testing the hook inside <Form>.
        // Reuses the closure pattern from useFieldDisabledState.test.tsx.
        const createWrapper = (
  - EDIT — delete the dangling-citation line, keep the first comment line:
        // Create wrapper with record and config for testing the hook inside <Form>.
        const createWrapper = (
  - WHY: line 45 cited the now-deleted useFieldDisabledState.test.tsx. Leaving it
    creates a dangling reference to a non-existent file. This is a comment-only
    cleanup; no import or behavior changes.
  - DO NOT touch any other line in useFormState.test.tsx.

Task 4: PROVE zero remaining references (the import-free guarantee)
  - COMMAND:
      grep -rn "useFieldDisabledState" packages/react/src/
      # Expected: ZERO matches. If ANY match appears, a file still imports/cites the
      # hook — remove that reference (it can only be another stale comment or an import
      # line that should have been part of this deletion). Re-run until empty.
  - COMMAND (broader sanity check, excludes non-source dirs):
      grep -rn "useFieldDisabledState" --include="*.ts" --include="*.tsx" packages/ examples/
      # Expected: ZERO matches in packages/ and examples/.
      # (References may still appear under plan/ and .pi-subagents/artifacts/ — those are
      #  immutable historical docs and the generated coverage/*.json; all are EXPECTED and
      #  must NOT be edited. See research §3.)

Task 5: RUN THE GATES (the safety proof)
  - 5a. pnpm --filter @formality-ui/react test
        # The React package in isolation. Expected: all green; the 16 deleted tests are
        # gone; no test FAILS; the 5 skipped remain.
  - 5b. pnpm test
        # Full monorepo suite. Expected: zero failures; count = (post-S3 baseline) − 16.
        # (Do not hardcode a count — the post-S3 baseline is unknown until S3 lands. The
        #  invariant is: pass-count drops by EXACTLY 16, fail-count stays 0, skip stays 5.)
  - 5c. pnpm typecheck
        # tsc --build. Expected: zero errors. If a "Cannot find module .../useFieldDisabledState"
        # error appears, a file still imports it — Task 4 should have caught it; fix that file.
  - 5d. pnpm test:coverage
        # Expected: statements/branches/functions/lines ALL ≥ 90% (root vitest.config.ts
        # threshold, PRD §1.3.7). Removing ~197 well-covered lines + their tests is net-neutral
        # to slightly positive on the repo-wide ratio. If a metric dips below 90%, it signals
        # an UNRELATED regression — investigate, do not "fix" by restoring the dead code.
  - 5e. pnpm lint && pnpm build
        # Expected: zero errors. eslint . (verbatimModuleSyntax + rules-of-hooks) and
        # pnpm -r build (tsup) both green.

Task 6: FINAL VERIFICATION — confirm the deletion is complete & clean
  - 6a. CONFIRM git tracked the deletions:
        git status --short
        # Expected: two "D" entries (the deleted files) + "M" on useFormState.test.tsx
        # (the comment edit). No other source changes.
  - 6b. CONFIRM no dangling reference anywhere in source:
        grep -rn "useFieldDisabledState" packages/react/src/
        # Expected: empty.
  - 6c. SUMMARIZE the gate results (test count delta, coverage %, zero failures).
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — the entire "implementation" is a deletion + a comment trim. There is
// no code to write. The value of this PRP is the SAFETY PROOF (research §1) and
// the GATE discipline (Task 5). Do exactly the 3 edits (2 deletes + 1 comment)
// and nothing else.

// PATTERN — use `git rm` (not `rm`) so the deletion is staged and visible in
// `git status`. This makes the change reviewable and reversible.

// PATTERN — the stale-comment rewrite is surgical. ONLY this block changes in
// useFormState.test.tsx:
//   BEFORE (2 comment lines):
//     // Create wrapper with record and config for testing the hook inside <Form>.
//     // Reuses the closure pattern from useFieldDisabledState.test.tsx.
//   AFTER (1 comment line):
//     // Create wrapper with record and config for testing the hook inside <Form>.
```

### Integration Points

```yaml
FILES DELETED (this task):
  - packages/react/src/hooks/useFieldDisabledState.ts          # the orphaned hook (197 lines)
  - packages/react/src/__tests__/useFieldDisabledState.test.tsx # its test (16 it() cases / 9 describes)

FILES EDITED (this task):
  - packages/react/src/__tests__/useFormState.test.tsx          # line 45: delete the dangling-citation comment

FILES NOT TOUCHED (verify with git diff --name-only):
  - packages/react/src/index.ts            # never exported the hook — no barrel change needed
  - packages/react/src/hooks/useField.tsx  # owns the LIVE inline disabled resolution (KEEP)
  - packages/react/src/components/Field.tsx# does NOT import the hook (KEEP)
  - packages/react/src/hooks/useConditions.ts # provides conditionResult.disabled to useField (KEEP)
  - CHANGELOG.md                           # append-only history — DO NOT edit (line 111 is historical)
  - coverage/**                            # regenerated by pnpm test:coverage — DO NOT hand-edit

NO DATABASE / CONFIG / ROUTES — pure source-tree cleanup.
```

## Validation Loop

### Level 1: The Import-Free Guarantee (the primary safety check)

```bash
# After deletion + comment cleanup, this MUST return nothing:
grep -rn "useFieldDisabledState" packages/react/src/
# Expected: empty (zero matches).

# Broader source-only sanity check:
grep -rn "useFieldDisabledState" --include="*.ts" --include="*.tsx" packages/ examples/
# Expected: empty in packages/ and examples/.
# (Matches under plan/ and .pi-subagents/artifacts/ are immutable historical docs — expected, ignore.)
```

### Level 2: Test Suite (behavior unchanged for all reachable code)

```bash
pnpm --filter @formality-ui/react test   # React package in isolation
pnpm test                                # full monorepo suite
# Expected: zero FAILURES. The pass-count drops by exactly 16 (the deleted test
# file's it() cases). The 5 skipped tests are unrelated and stay at 5.
# IF any test FAILS (not "missing" — FAILS): something imported the hook. Re-run
# Task 4 (grep) to find the residual reference and remove it.
```

### Level 3: Type Checking, Lint & Build

```bash
pnpm typecheck   # tsc --build
# Expected: zero errors. A "Cannot find module ...useFieldDisabledState" error
# means a residual import survived — fix that file (part of this deletion).

pnpm lint        # eslint .
# Expected: zero errors. No new unused-import warnings (we deleted, not added).

pnpm build       # pnpm -r build (tsup)
# Expected: both @formality-ui/core and @formality-ui/react emit cleanly.
```

### Level 4: Coverage Gate (PRD §1.3.7 — ≥ 90% on all four metrics)

```bash
pnpm test:coverage   # vitest run --coverage (v8)
# Expected: statements/branches/functions/lines ALL ≥ 90% (root vitest.config.ts
# threshold; CI exits 1 if any drops below).
# Analysis: useFieldDisabledState.ts was ~97.8% statement covered. Removing it
# + its tests reduces total source lines by ~197 and removes the few uncovered
# branches too. Net effect on the repo-wide 90% gate is neutral-to-slightly-positive.
# IF a metric dips below 90%: that indicates an UNRELATED regression (this deletion
# cannot lower coverage below its prior level proportionally). Investigate; do NOT
# restore the dead code.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `grep -rn "useFieldDisabledState" packages/react/src/` → **empty**.
- [ ] Level 2: `pnpm test` → zero failures; pass-count = (post-S3 baseline) − 16; 5 skipped.
- [ ] Level 2: `pnpm --filter @formality-ui/react test` → green.
- [ ] Level 3: `pnpm typecheck` clean; `pnpm lint` clean; `pnpm build` clean.
- [ ] Level 4: `pnpm test:coverage` → all four metrics ≥ 90%.

### Feature Validation (clean removal)

- [ ] Both target files deleted (`git status` shows two `D` entries).
- [ ] `useFormState.test.tsx:45` comment rewritten (no dangling file reference).
- [ ] No NEW behavioral change to any runtime code (deletion + comment-only edit).
- [ ] `index.ts` untouched (hook was never exported — no barrel edit needed).

### Code Quality Validation

- [ ] Deletions tracked via `git rm` (reviewable/reversible).
- [ ] `git diff --name-only` shows exactly 3 entries: 2 deletes + useFormState.test.tsx.
- [ ] No historical files edited (CHANGELOG.md, plan/**, .pi-subagents/artifacts/** untouched).
- [ ] No generated files hand-edited (coverage/** untouched; regenerated by the coverage run).
- [ ] Anti-patterns avoided (check against Anti-Patterns section).

### Documentation & Deployment

- [ ] No README/CHANGELOG required (dead-code cleanup; changeset-level docs sync is P3.M2).
- [ ] No new env vars / config / public API change (the hook was never exported).

---

## Anti-Patterns to Avoid

- ❌ Don't "fix" or "repurpose" `useFieldDisabledState` instead of deleting it. The
  contract is a clean deletion — the hook is triple-confirmed dead code (research §1).
- ❌ Don't wire the hook into `Field.tsx`/`useField.tsx` to "make it useful." That
  reverses the P2.M1.T1 extraction and reintroduces a superseded code path.
- ❌ Don't edit `CHANGELOG.md:111`. It is an append-only historical release note.
  The deletion earns its OWN new entry via semantic-release later.
- ❌ Don't hand-edit `coverage/coverage-final.json`. It is generated; `pnpm
  test:coverage` regenerates it (and the stale `useFieldDisabledState.ts` entry
  disappears automatically).
- ❌ Don't edit files under `plan/**` or `.pi-subagents/artifacts/**` that mention
  the hook. Those are immutable historical research/plan records.
- ❌ Don't treat the 16-test count drop as a regression. Those tests asserted
  behavior of dead code; removing them is correct. **Zero failures** is the signal.
- ❌ Don't skip the stale-comment cleanup at `useFormState.test.tsx:45`. Leaving a
  comment that cites a deleted file is a dangling reference that will confuse
  future readers. It's a 1-line, comment-only, behavior-preserving edit.
- ❌ Don't touch `index.ts`. The hook was never exported, so the barrel needs no change.
- ❌ Don't block on the missing `plan/005_8f88e0ec4482/gap_analysis.md` ("G7"). That
  file is absent on disk; the orphan status is proven independently (research §1).
- ❌ Don't declare done while any gate (test/typecheck/lint/build/coverage) is red,
  or while `grep ... useFieldDisabledState packages/react/src/` returns any match.

---

**Confidence Score: 10/10** for one-pass implementation success.

Rationale:
- This is a **deletion of triple-confirmed dead code** plus a one-line comment
  cleanup. There is no logic to get wrong.
- The safety proof is exhaustive and independent (not exported — `index.ts`
  lines 72–81; not imported by `Field.tsx`; not used by the extracted
  `useField.tsx`, which resolves disabled inline per PRD §5.3.4). The full
  dangling-reference inventory is catalogued with per-reference disposition, so
  the implementer knows exactly what to edit, ignore, and never touch.
- The validation gates are standard repo commands with predicted outcomes (count
  −16, zero failures, coverage ≥ 90% net-neutral). The only residual risk — a
  hidden import — is caught mechanically by the Task 4 grep, which must return
  empty before the task closes.
- The single non-obvious gotcha (the stale comment at `useFormState.test.tsx:45`)
  is called out with its exact before/after, preventing a dangling reference.
