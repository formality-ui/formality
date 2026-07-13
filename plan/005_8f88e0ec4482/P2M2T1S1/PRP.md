name: "P2.M2.T1.S1 — Update overlays.ts descriptive paragraph for forwardRef"
description: |

---

## Goal

**Feature Goal**: Fix the **one stale JSDoc sentence** in
`packages/react/src/overlays.ts` so the `FormalityFieldComponentProps`
**descriptive paragraph** stops describing the `coreProps` ref member as *"a
React-special key — `ref`"* and instead states it is delivered as a regular,
enumerable, top-level prop named `forwardRef` — matching the §20.7-compliant
*"Runtime delivery (important)"* subsection (already correct, lines 169–176)
and the §20.1 runtime behavior already shipped in `useField.tsx:678`
(`forwardRef: field.ref`). This closes **gap_analysis.md G8** and is the final
PRD §20.7 documentation requirement (P2.M2.T1).

**Deliverable**: A **comment-only** edit to **lines ~142–150** of
`packages/react/src/overlays.ts` (the `FormalityFieldComponentProps` lead-in
paragraph). One paragraph rewritten; **no other file, line, type, or runtime
code touched.** No behavioral change.

**Success Definition**:
- `grep -n "as a React-special key" packages/react/src/overlays.ts` → **zero
  matches** (the stale phrase is gone).
- `grep -n "future runtime\|out of scope for this type-only\|Runtime caveat" packages/react/src/overlays.ts`
  → **zero matches** (no stale wording anywhere in the file).
- The descriptive paragraph names `forwardRef` as a regular enumerable
  top-level prop (NOT React's special `ref` key) and is internally consistent
  + consistent with the "Runtime delivery (important)" subsection (169–176).
- The "Runtime delivery (important)" subsection, the type body, and the rest of
  the file are **byte-identical** to before (`git diff` shows only the
  paragraph block).
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`
  all green (defensive — comment edits cannot change behavior).

## User Persona (if applicable)

**Target User**: Formality React-adapter consumer reading the
`FormalityFieldComponentProps` JSDoc (in-editor hover / generated docs) to wire
a ref onto an input component.

**Use Case**: A consumer writing `const Field: ComponentType<FormalityFieldComponentProps<P>>`
reads the type's JSDoc to learn how the ref reaches their component.

**User Journey**: Hover `FormalityFieldComponentProps` → read the descriptive
paragraph → see a single, coherent statement that `forwardRef` arrives as a
regular top-level prop and should be destructured + wired to the inner input.

**Pain Points Addressed**: Today the paragraph contradicts itself — it calls
the ref *"a React-special key — `ref`"* in sentence 2 then calls it *"a
top-level `forwardRef` key delivered at runtime"* in sentence 4. A reader
can't tell which is true. The fix makes the paragraph match the shipped
runtime (§20.1) and the already-correct §20.7 subsection.

## Why

- **PRD §20.7 requires the stale ref-key / "future runtime task" wording be
  removed.** The §20.7 *"Runtime delivery (important)"* subsection was already
  rewritten correctly, but the **earlier descriptive paragraph was missed**
  (gap_analysis.md G8, flagged `[DOCS — Trivial]`). This task completes §20.7.
- **Internal consistency.** A JSDoc paragraph that contradicts itself (special
  `ref` key in one sentence, top-level `forwardRef` prop in another) is worse
  than no docs. The fix makes both sentences agree with the shipped runtime.
- **No risk to users.** This is prose inside a `/** */` block. It cannot affect
  types, builds, tests, or runtime behavior.

## What

Rewrite **one JSDoc paragraph** — the `FormalityFieldComponentProps` lead-in
(lines ~142–150) — to remove the stale *"React-special key — `ref`"* wording
and state `forwardRef` is delivered as a regular enumerable top-level prop.
Leave the rest of the file (the §20.7 "Runtime delivery (important)"
subsection, the type body, all other JSDoc blocks) untouched.

### Success Criteria

- [ ] Line ~144's *"and — as a React-special key — `ref`"* wording is removed.
- [ ] The `coreProps` enumeration now names `forwardRef` as a regular
      enumerable top-level prop, NOT React's special `ref` key.
- [ ] The paragraph is internally consistent and consistent with the
      "Runtime delivery (important)" subsection (lines 169–176).
- [ ] `grep -n "as a React-special key" packages/react/src/overlays.ts` → empty.
- [ ] `grep -n "future runtime\|out of scope for this type-only\|Runtime caveat" packages/react/src/overlays.ts` → empty.
- [ ] `git diff --stat` shows exactly **1 file** changed
      (`packages/react/src/overlays.ts`); the diff hunk covers only the
      descriptive-paragraph block.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` green.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the exact file
path, the exact stale line and its exact replacement, the list of lines that
are **already correct and must NOT be touched**, the runtime evidence that the
new wording is accurate, and the validation commands. All cited below with
exact paths/line numbers and a full before/after. ✅ Passes the
"No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/005_8f88e0ec4482/P2M2T1S1/research/research-notes.md
  why: |
    THIS TASK'S FIELD GUIDE. §1 the exact before/after (the sole edit), §2 what
    is already correct (DO NOT TOUCH), §3 runtime proof the wording is accurate,
    §4 the whole-file stale-wording audit, §5 verified validation commands,
    §6 parallel-work boundaries, §7 risk. READ THIS FIRST.

- docfile: PRD.md §20 Field ref delivery via forwardRef (h2.21)
  why: |
    The parent feature. §20.1 is the runtime change (ALREADY shipped at
    useField.tsx:678). §20.7 is the documentation requirement this task fulfills
    — specifically: "Remove the 'Runtime caveat' paragraph and all 'future
    runtime task' / 'out of scope for this type-only change' wording. State that
    forwardRef is delivered at runtime as a top-level prop by <Field>."

- docfile: PRD.md §20.7 Documentation update (h3.101)
  why: |
    The exact contract bullet list for the JSDoc rewrite. Keep the "Destructure
    before forwarding" guidance and the MUI v9 slotProps note (both already
    present & correct in the file).

- file: packages/react/src/overlays.ts
  section: lines 139-190 (the FormalityFieldComponentProps JSDoc + type)
  why: |
    THE FILE TO EDIT. Lines 142-150 = the descriptive paragraph (the SOLE edit).
    Lines 169-176 = the §20.7 "Runtime delivery (important)" subsection
    (ALREADY CORRECT — do not touch). Lines 181-190 = the type body (already
    correct — do not re-type).

- file: packages/react/src/hooks/useField.tsx
  section: lines 670-678 (coreProps construction)
  why: |
    RUNTIME PROOF. Line 678 is `forwardRef: field.ref` — the ref is delivered as
    a REGULAR enumerable coreProps key spread onto the component via
    {...finalProps}, NOT React's special `ref` key. This is §20.1, already
    shipped. The JSDoc must match this. (Comment-only reference; do not edit
    useField.tsx.)
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
├── overlays.ts                  # ← EDIT: lines ~142-150 (descriptive paragraph only)
├── hooks/
│   └── useField.tsx             # RUNTIME EVIDENCE (line 678: forwardRef: field.ref) — DO NOT EDIT
└── components/
    └── Field.tsx                # unaffected — DO NOT EDIT
```

### Desired Codebase tree after this task

```bash
packages/react/src/
└── overlays.ts                  # 1 paragraph rewritten (lines ~142-150); rest byte-identical
# No files added or deleted. No type/runtime/build change.
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL — this is a COMMENT-ONLY edit inside a /** */ JSDoc block. It cannot
// change types, lint, tests, or runtime behavior. Run the gates defensively,
// not because a comment can break them. Do NOT add/alter any code.

// CRITICAL — scope is the descriptive paragraph (lines ~142-150) ONLY. The
// §20.7 "Runtime delivery (important)" subsection (lines 169-176) is ALREADY
// CORRECT (gap_analysis §20.7 row = ✅ DONE). Re-rewriting it is OUT OF SCOPE.

// CRITICAL — do NOT re-type FormalityFieldComponentProps (lines 181-190). The
// contract is explicit: "the type is already correct" (PRD §20.7 out-of-scope).

// GOTCHA — line 173 ("off the old React-special `ref` key") is LEGITIMATE
// migration context (describes migrating AWAY from the old mechanism), NOT
// stale wording. Leave it. Only line ~144 ("and — as a React-special key —
// `ref`)") is stale. The §4 audit in research-notes confirms this.

// GOTCHA (prettier) — wrap the revised JSDoc lines to ≤ ~72 cols of comment
// text to match the surrounding lines, so `pnpm format:check` passes as-is.
// The proposed paragraph in research-notes §1 is pre-wrapped.

// CRITICAL — do NOT edit CHANGELOG.md, README.md, plan/**, prd_snapshot.md,
// or any file under .pi-subagents/artifacts/**. Those are append-only history
// / owned by humans / owned by the orchestrator. The only allowed write is the
// one paragraph in overlays.ts.

// PARALLEL WORK — P2.M1.T2.S1 (running concurrently) deletes
// useFieldDisabledState.ts + its test. It does NOT touch overlays.ts. No
// conflict; do not duplicate its work.
```

## Implementation Blueprint

### Data models and structure

None. No types, models, or runtime code. A prose edit inside one JSDoc block.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — read the field guide + locate the stale paragraph
  - READ: plan/005_8f88e0ec4482/P2M2T1S1/research/research-notes.md  (esp. §1, §2, §4)
  - OPEN: packages/react/src/overlays.ts and navigate to the FormalityFieldComponentProps
          JSDoc block (/** at line 139; type at line 181).
  - CONFIRM the stale sentence is still on line ~144:
      grep -n "as a React-special key" packages/react/src/overlays.ts
      # Expected: exactly ONE match on line ~144
      #   (...and — as a React-special key — `ref`). The three...)
      # If ZERO matches, the fix is already applied — STOP (task already done).
      # If MORE THAN ONE match, re-read research-notes §4 — the audit must be
      # refreshed before proceeding.
  - CONFIRM the §20.7 subsection is still present & correct (do NOT edit it):
      grep -n "Runtime delivery (important)" packages/react/src/overlays.ts
      # Expected: exactly ONE match on line ~169.

Task 2: REWRITE the descriptive paragraph (lines ~142-150) — the SOLE edit
  - FILE: packages/react/src/overlays.ts
  - FIND the EXACT current block (lines 142-150):
        * `<Field>` renders your input component via React Hook Form's `<Controller>`.
        * At runtime Formality merges a `coreProps` bundle onto the component (name,
        * value, onChange, onBlur, and — as a React-special key — `ref`). The three
        * members below are the **injected-props contract**: `formState` always
        * reaches templates and render-prop children, and reaches plain components
        * that have opted into Formality state via `provideState` /
        * `passSubscriptions`; `state` (subscribed field state) and a top-level
        * `forwardRef` key are delivered at runtime by `<Field>` (see "Runtime
        * delivery" below).
  - REPLACE WITH:
        * `<Field>` renders your input component via React Hook Form's `<Controller>`.
        * At runtime Formality merges a `coreProps` bundle onto the component (name,
        * value, onChange, onBlur, and `forwardRef` — RHF's ref callback, delivered as
        * a regular enumerable top-level prop, NOT React's special `ref` key; see §20.1
        * and "Runtime delivery" below). The three members below are the
        * **injected-props contract**: `formState` always reaches templates and
        * render-prop children, and reaches plain components that have opted into
        * Formality state via `provideState` / `passSubscriptions`; `state`
        * (subscribed field state) and `forwardRef` are delivered at runtime by
        * `<Field>` (see "Runtime delivery" below).
  - WHY: line ~144's "and — as a React-special key — `ref`" is stale after §20.1
    (which ships `forwardRef: field.ref` as a regular prop at useField.tsx:678).
    The paragraph now names `forwardRef` correctly, removes the
    self-contradiction with its own later sentence, and aligns with the §20.7
    "Runtime delivery (important)" subsection.
  - DO NOT touch any other line: the module header, the other JSDoc blocks
    (ReactInputConfig, ReactFieldConfig, ReactFormFieldsConfig, defineInputs),
    the "Destructure before forwarding" / "Wiring forwardRef" / "Runtime
    delivery (important)" subsections, or the type body.

Task 3: VERIFY no stale wording remains anywhere in the file
  - grep -n "as a React-special key" packages/react/src/overlays.ts
      # Expected: ZERO matches.
  - grep -nE "future runtime|out of scope for this type-only|Runtime caveat" packages/react/src/overlays.ts
      # Expected: ZERO matches.
  - CONFIRM line ~173 is untouched (it is legitimate migration context, NOT stale):
      grep -n "off the old React-special \`ref\` key" packages/react/src/overlays.ts
      # Expected: exactly ONE match on line ~173 (the §20.7 subsection) — unchanged.

Task 4: CONFIRM scope — exactly one file changed, one hunk
  - git diff --stat
      # Expected: packages/react/src/overlays.ts | <N> +-
      # Exactly ONE file. If any other file appears, undo it — out of scope.
  - git diff packages/react/src/overlays.ts
      # Expected: a single contiguous hunk covering only the descriptive
      # paragraph (lines ~142-150). The "Runtime delivery (important)" subsection
      # (169-176) and the type body (181-190) must NOT appear in the diff.

Task 5: RUN THE GATES (defensive — comment edit cannot break behavior)
  - 5a. pnpm typecheck
        # tsc --build. Expected: zero errors (types unchanged).
  - 5b. pnpm lint
        # eslint . Expected: zero errors. If prettier/line-length fires, re-wrap
        # the JSDoc lines to ≤ ~72 cols and re-run.
  - 5c. pnpm format:check
        # prettier --check . Expected: clean. If it reports the edited file,
        # run `pnpm format` to re-wrap, then re-check (the change must remain
        # prose-only — prettier only reflows the comment).
  - 5d. pnpm test
        # vitest run. Expected: identical results to before (comment-only edit;
        # no test count change, no failures, 5 skipped unchanged).
  - 5e. pnpm build
        # pnpm -r build (tsup). Expected: both packages emit cleanly.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — the entire "implementation" is ONE prose paragraph rewritten inside
// an existing /** */ JSDoc block. There is no code to write. The value of this
// PRP is the EXACT before/after (Task 2), the scope guardrails (don't touch the
// §20.7 subsection or the type body), and the stale-wording audit (Task 3).

// PATTERN — match the surrounding JSDoc line wrapping (~72 cols of comment
// text) so `pnpm format:check` passes without intervention. The proposed
// replacement in Task 2 is pre-wrapped to that width.

// PATTERN — the "Runtime delivery (important)" subsection (lines 169-176) is
// the authoritative §20.7 wording and was already audited as ✅ DONE. The
// revised paragraph is a SUMMARY that points to it ("see §20.1 and 'Runtime
// delivery' below"); it does not duplicate the full migration guidance.
```

### Integration Points

```yaml
FILE EDITED (this task):
  - packages/react/src/overlays.ts   # lines ~142-150: descriptive paragraph rewritten

FILES NOT TOUCHED (verify with `git diff --name-only` — expect exactly 1 entry):
  - packages/react/src/hooks/useField.tsx     # runtime ref delivery already correct (L678)
  - packages/react/src/components/Field.tsx   # unaffected
  - packages/react/src/index.ts               # re-export barrel — unaffected
  - packages/react/src/overlays.ts type body  # lines 181-190 — already correct
  - CHANGELOG.md                              # append-only history — DO NOT edit
  - README.md                                 # changeset-level docs sync is P3.M2 — out of scope
  - plan/**, prd_snapshot.md                  # orchestrator-owned — DO NOT edit

NO DATABASE / CONFIG / ROUTES — a JSDoc prose edit.
```

## Validation Loop

### Level 1: Stale-wording removal (the primary success check)

```bash
grep -n "as a React-special key" packages/react/src/overlays.ts
# Expected: ZERO matches (the stale phrase is gone).

grep -nE "future runtime|out of scope for this type-only|Runtime caveat" packages/react/src/overlays.ts
# Expected: ZERO matches.
```

### Level 2: Scope & consistency (the guardrail check)

```bash
# Exactly one file changed:
git diff --name-only
# Expected: packages/react/src/overlays.ts  (only)

# The §20.7 subsection and the legitimate migration line are UNCHANGED:
grep -n "Runtime delivery (important)" packages/react/src/overlays.ts   # 1 match, line ~169
grep -n "off the old React-special .ref. key" packages/react/src/overlays.ts  # 1 match, line ~173

# The diff is ONE contiguous hunk over the descriptive paragraph only:
git diff packages/react/src/overlays.ts
```

### Level 3: Build quality gates (defensive — comment-only change)

```bash
pnpm typecheck      # tsc --build   — zero errors
pnpm lint           # eslint .      — zero errors
pnpm format:check   # prettier      — clean (JSDoc pre-wrapped to ~72 cols)
pnpm test           # vitest run    — unchanged (no count/failure/skip delta)
pnpm build          # pnpm -r build — both packages emit cleanly
# Expected: all green. None of these can regress from a comment edit; if one
# does, it indicates an UNRELATED failure — investigate, do not "fix" by
# reverting the JSDoc.
```

### Level 4: Documentation-readability validation (manual)

```bash
# Visually confirm the revised paragraph is internally consistent and points
# to the authoritative "Runtime delivery (important)" subsection:
sed -n '139,190p' packages/react/src/overlays.ts
# Confirm: sentence 2 names `forwardRef` as a regular enumerable top-level prop
# (NOT React's special `ref` key); the later "Runtime delivery (important)"
# subsection (169-176) says the same thing — no contradiction remains.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `grep -n "as a React-special key" packages/react/src/overlays.ts` → **empty**.
- [ ] Level 1: `grep -nE "future runtime|out of scope for this type-only|Runtime caveat" packages/react/src/overlays.ts` → **empty**.
- [ ] Level 3: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` all green.

### Feature Validation (JSDoc correctness)

- [ ] The descriptive paragraph names `forwardRef` as a regular enumerable
      top-level prop (NOT React's special `ref` key).
- [ ] The paragraph is internally consistent (no self-contradiction) and
      consistent with the "Runtime delivery (important)" subsection (169-176).
- [ ] Manual read (`sed -n '139,190p'`) confirms the §20.7 story is coherent.

### Code Quality Validation

- [ ] `git diff --name-only` → exactly **1 file** (`packages/react/src/overlays.ts`).
- [ ] `git diff` hunk covers **only** the descriptive paragraph (lines ~142-150).
- [ ] The §20.7 "Runtime delivery (important)" subsection (169-176) is untouched.
- [ ] The type body (181-190) is untouched — no re-typing.
- [ ] No historical/orchestrator files edited (CHANGELOG, README, plan/**, prd_snapshot.md).
- [ ] Revised JSDoc wrapped to ≤ ~72 cols (passes `pnpm format:check`).
- [ ] Anti-patterns avoided (check against Anti-Patterns section).

### Documentation & Deployment

- [ ] No README/CHANGELOG required (JSDoc cosmetic fix; changeset-level docs
      sync is P3.M2.T1).
- [ ] No new env vars / config / public API / type change.

---

## Anti-Patterns to Avoid

- ❌ Don't re-rewrite the **"Runtime delivery (important)"** subsection
  (lines 169-176). It is ALREADY correct (gap_analysis §20.7 = ✅ DONE). It is
  the authoritative §20.7 wording; the descriptive paragraph merely summarizes
  and points to it.
- ❌ Don't re-type `FormalityFieldComponentProps` (lines 181-190). The contract
  is explicit: "the type is already correct" (PRD §20.7 out-of-scope).
- ❌ Don't delete the *"off the old React-special `ref` key"* phrase on line
  ~173. It is legitimate migration context (describes migrating AWAY from the
  old mechanism), not stale wording. The §4 audit in research-notes confirms
  only line ~144 is stale.
- ❌ Don't edit any file other than `packages/react/src/overlays.ts`. In
  particular, don't touch `useField.tsx`, `Field.tsx`, `index.ts`, CHANGELOG,
  README, or any `plan/**` / `prd_snapshot.md` file.
- ❌ Don't introduce new wording about `state`/`formState` semantics or
  `mergeFieldProps` behavior — those are explicitly PRD §20.7 out-of-scope.
  Keep the edit to the `forwardRef` description only.
- ❌ Don't skip the gates because "it's just a comment." Run them defensively —
  a green gate is the proof the diff didn't accidentally touch code.
- ❌ Don't treat this as a chance to "improve" the rest of the JSDoc. Scope is
  the one stale paragraph. Extra edits violate the contract.

---

**Confidence Score: 10/10** for one-pass implementation success.

Rationale:
- This is a **single prose paragraph** rewritten inside one JSDoc block. There
  is no logic, type, or runtime surface to get wrong.
- The exact before/after is fully specified (Task 2), copied verbatim from the
  current file, so the implementer edits by exact text replacement.
- The required new wording is **already proven accurate** by two independent
  sources in the repo: the §20.7 *"Runtime delivery (important)"* subsection
  (lines 169-176, already correct) and the shipped runtime at
  `useField.tsx:678` (`forwardRef: field.ref`). The revised paragraph merely
  makes the lead-in agree with both.
- The whole-file stale-wording audit (research §4) proves the line-~144 edit is
  the **only** change needed; the legitimate migration phrase on line ~173 is
  explicitly flagged as "keep."
- Scope guardrails are mechanical: `git diff --name-only` must show exactly one
  file, and the grep checks must return empty. The only residual risk — an
  implementer over-editing the §20.7 subsection or the type body — is forbidden
  in bold in the task list and Anti-Patterns.
