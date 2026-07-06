name: "P1.M1.T3.S1 — Verify root README + React README feature listings for FormalityFieldComponentProps (Mode B overview sweep)"
description: |

---

## Goal

**Feature Goal**: The catch-all changeset-level **OVERVIEW** documentation
sweep (Mode B) for PRD §20 (Field ref delivery via `forwardRef`). After the
runtime delivery (P1.M1.T1.S1) and the per-symbol contract-doc rewrite
(P1.M1.T1.S2 / Mode A), confirm that **no consumer-facing overview /
feature-listing sentence** in the root `README.md` or
`packages/react/README.md` implies that the `forwardRef` contract is
type-only / not-yet-runtime-backed / "coming soon". If any overview wording is
now stale or misleading, update it minimally. If all overview wording is
already accurate (the expected outcome per scout verification), make **NO
edit** and record that decision in the PR description.

**Deliverable**: A confirmed-accurate (or lightly edited) changeset-level
overview of `FormalityFieldComponentProps` across `README.md` (root) and
`packages/react/README.md`, with **no stale "type-only" / "future" framing
remaining anywhere consumer-facing**. This is the catch-all that prevents a
coherent delta from shipping with a stale README.

**Success Definition**:
1. Every consumer-facing **overview / feature-listing** mention of
   `FormalityFieldComponentProps` (root README:584–585; react README import
   list ~440, `## Type Safety` intro ~455–458, section header ~558, "After —
   the shipped precise type" caption ~576) is re-read and judged accurate OR
   minimally corrected.
2. No overview sentence anywhere implies `forwardRef` is type-only /
   not-yet-runtime-backed / "coming soon" / "future".
3. The **per-symbol caveat prose** (overlays.ts JSDoc 167–174; react README
   609–616) is **NOT touched** here — that is P1.M1.T1.S2 (Mode A), already
   landed.
4. Decision recorded in the PR description (edited? what? or "verified
   accurate, no edit" with the rubric applied).
5. `pnpm typecheck` green; `pnpm lint` clean (sanity gates; doc edits should
   not affect them).

## User Persona

**Target User**: React consumers of `@formality-ui/react` (and the driving
downstream consumer `sellario-ui`) who skim the README **overview / feature
lists** to understand what Formality ships, without reading every per-symbol
JSDoc.

**Use Case**: A consumer reads the root README "Type Safety" bullet list or
the react README "Type Safety" intro and forms an expectation about whether
`FormalityFieldComponentProps.forwardRef` is actually delivered at runtime.

**Pain Points Addressed**: A coherent runtime delta (forwardRef now delivered)
could ship with a stale README that still implies (even via omission in an
overview) that the ref contract is "type-only" or "coming soon". This sweep
catches that one last place.

## Why

- **Business value**: Defense-in-depth for doc accuracy. S1 (runtime) and S2
  (per-symbol Mode A docs) handle the contract and its JSDoc; this task is the
  Mode B catch-all that sweeps the **overview/capability-summary framing** so
  nothing consumer-facing contradicts the shipped runtime. Per SOW §5 it
  exists specifically to let the implementing agent make the final call.
- **Integration**: Runs **last**, after every implementing subtask
  (P1.M1.T1.S1, P1.M1.T1.S2, P1.M1.T2.S1). It depends on the runtime delivery
  being live and the per-symbol caveat prose being correct (S2). It does not
  change runtime or types — it only reviews/edits overview prose.
- **Scope boundary (CRITICAL)**:
  - This task covers ONLY the **overview / feature-listing / capability-summary**
    framing. It does **NOT** duplicate the **per-symbol contract prose** that
    P1.M1.T1.S2 owns (overlays.ts JSDoc 167–174 + react README caveat 609–616).
  - It does NOT re-type `FormalityFieldComponentProps`, touch runtime/source
    files, edit `packages/core`, or migrate the test harness.
  - Expected outcome (per scout verification): **NO edit needed** — record the
    decision. Edits only if the rubric (below) finds a genuinely stale
    overview sentence.

## What

A read-and-judge sweep of every consumer-facing **overview** mention of
`FormalityFieldComponentProps`, applying a fixed rubric. Edit only if stale;
otherwise record "verified accurate, no edit".

### Decision Rubric (apply to each overview mention)

- **STALE → edit**: the sentence implies `forwardRef` is type-only /
  not-yet-runtime-backed / "coming soon" / "future" / "ahead of runtime".
- **ACCURATE → no edit**: the sentence is silent on runtime (just describes
  the type) OR explicitly affirms runtime delivery.

### Scout-verified current state (re-confirm against the live tree at edit time)

| File | Line(s) | Overview mention | Rubric verdict |
|------|---------|------------------|----------------|
| `README.md` (root) | 584–585 | `- **\`FormalityFieldComponentProps<P>\`** — the shipped injected-props type, replacing the hand-rolled lossy \`WithFormality<P>\`.` (bullet in `## Type Safety`) | ACCURATE — silent on runtime; no "future"/"type-only"/"coming soon" wording |
| `packages/react/README.md` | ~440 | `FormalityFieldComponentProps,` inside an `import type { ... }` code fence | ACCURATE — import example only |
| `packages/react/README.md` | ~455–460 | `## Type Safety` intro: "...It also ships a precise type for the props Formality **injects** onto your field components, so you can stop hand-rolling a lossy \`WithFormality<P>\` helper." | ACCURATE — affirms runtime injection ("the props Formality injects") |
| `packages/react/README.md` | ~558 | `### Field component props: \`FormalityFieldComponentProps\`` (section header) | ACCURATE — neutral header |
| `packages/react/README.md` | ~561–563 | "`FormalityFieldComponentProps<P>` is the **precise** type for that contract — replacing the lossy `WithFormality<P>`" | ACCURATE |
| `packages/react/README.md` | ~576 | `**After — the shipped precise type:**` (code-block caption) | ACCURATE |

**The caveat paragraph (react README ~609–616, now `**Runtime delivery (important).**`)**
is **P1.M1.T1.S2 (Mode A) territory and is NOT in this task's scope.** It has
already been rewritten. Do not touch it.

### Success Criteria

- [ ] Every overview mention in the table above is re-read and judged via the rubric.
- [ ] No consumer-facing overview sentence implies `forwardRef` is type-only / not-yet-runtime-backed / "coming soon".
- [ ] If a stale overview sentence was found, it was edited minimally to state `<Field>` delivers `forwardRef` at runtime as a top-level prop.
- [ ] If all overview wording was accurate, NO edit was made and the decision is recorded in the PR description.
- [ ] The per-symbol caveat prose (overlays.ts JSDoc 167–174; react README 609–616) was NOT touched (S2's Mode A).
- [ ] No runtime/source/core/type-body file was edited.
- [ ] `pnpm typecheck` green; `pnpm lint` clean.

## All Needed Context

### Context Completeness Check

_Pass._ This is a read-and-judge doc sweep with a fixed rubric. The scout
report (`research/key_findings.md`) maps every overview mention with verbatim
quotes + line numbers + rubric verdicts, all re-verified against the live
working tree. The implementing agent needs only to re-confirm line numbers
(they may have shifted as S2 lands) and apply the rubric.

### Documentation & References

```yaml
# MUST READ
- url: PRD §20.7 (heading:h3.101) — "Documentation update"
  why: Defines the doc-sync scope for the forwardRef delta. This task is the
        Mode B (overview) half; the per-symbol JSDoc half is S2 (Mode A).
  critical: "Out of scope: state/formState injection, re-typing the type, any
             core change. Mode A per-symbol prose is S2; this task is the
             overview/capability-summary framing only."

- url: PRD §20.1 (heading:h3.95) — "Requirement (the change)"
  why: The runtime truth the docs must reflect: `<Field>` delivers `forwardRef`
        as a regular top-level enumerable prop (no React.forwardRef wrap required).

- docfile: plan/003_de060244cb57/architecture/docs_to_update.md
  why: Verified docs-state map with verbatim quotes + line numbers for ALL
        FormalityFieldComponentProps mentions (root README, react README,
        overlays.ts). §3 confirms the root README has only the line-584 bullet
        and NO caveat prose.
  section: "§3 (root README — no caveat prose), §2 (react README), Summary table"
  critical: "Root README: only line 584–585 feature bullet; NO forwardRef/Runtime
             caveat/future wording anywhere else. React README caveat (609–615) =
             Mode A (S2)."

- docfile: plan/003_de060244cb57/P1M1T3S1/research/key_findings.md
  why: This task's scout report — the rubric + per-mention verdicts + scope
        boundaries + the expected "no edit" outcome.

# PARALLEL-EXECUTION CONTEXT (S2 is being implemented / has landed concurrently)
- file: plan/003_de060244cb57/P1M1T1S2/PRP.md
  section: "Goal + Success Criteria (overlays.ts JSDoc 167–174 + react README 609–615 = Mode A)"
  why: S2 owns the PER-SYMBOL caveat prose. This task (Mode B) owns ONLY the
        overview/feature-listing framing. Do NOT touch the regions S2 edits.
        S2's caveat rewrite has ALREADY landed in the working tree (react
        README:609 now reads "Runtime delivery (important).").
  critical: "If you find a stale sentence in the react README, FIRST check
             whether it's in S2's region (the caveat paragraph ~609–616). If so,
             it's S2's job (likely already done) — do NOT duplicate it. Only
             overview/feature-listing sentences are this task's."

- file: README.md   # repo root
  section: "Line 584–585 (Type Safety feature bullet)"
  why: The SINGLE overview mention in the root README. Re-read and judge.
  gotcha: "Do NOT add forwardRef runtime prose here unless the bullet is actually
           stale — it isn't (scout-verified accurate). Adding unprompted runtime
           detail to a Type Safety bullet list is scope creep; the bullet's job is
           to point to the react README for the full contract."

- file: packages/react/README.md
  section: "import list ~440; Type Safety intro ~455–460; section header ~558;
            Before/After caption ~576; (caveat ~609–616 = S2, DO NOT TOUCH)"
  why: The overview mentions to judge. Re-confirm line numbers (S2 may have
        shifted them).
  gotcha: "Line ~556 ('those types is a follow-up; defineInputs is the opt-in
           entry point') is about the defineInputs/InputType FOLLOW-UP, NOT
           forwardRef — out of scope. Do not 'fix' it."
```

### Current Codebase tree (relevant slice)

```bash
README.md                       # ← REVIEW (and edit ONLY if a stale overview bullet found): line 584–585
packages/react/
  README.md                     # ← REVIEW (edit only if stale): ~440, ~455–460, ~558, ~576
                                #    (caveat ~609–616 = S2 Mode A — DO NOT TOUCH)
  src/overlays.ts               # (read-only ref) JSDoc 167–174 = S2 Mode A — DO NOT TOUCH
  src/components/Field.tsx      # (out of scope) S1/T2 runtime territory
packages/core/                  # (out of scope)
```

### Desired Codebase tree with files to be added

```bash
# EXPECTED (most likely): NO files modified. Decision recorded in PR description.
# IF a stale overview sentence is found:
README.md                       # MODIFIED — only the stale bullet (line ~584), minimally
packages/react/README.md        # MODIFIED — only the stale overview sentence, minimally
# (no new files; no runtime/type/core changes; no per-symbol caveat edits)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (scope boundary — do NOT duplicate S2): The per-symbol caveat prose
// lives at overlays.ts JSDoc ~167–174 AND react README ~609–616. That is
// P1.M1.T1.S2 (Mode A), ALREADY LANDED. This task (Mode B) touches ONLY
// overview/feature-listing framing. If you "find" the caveat stale, you're
// looking at S2's region — leave it.

// CRITICAL (the expected outcome is NO edit): Scout verification shows every
// overview mention is accurate. The root README bullet (584–585) is silent on
// runtime (describes only the type) — silence is NOT stale framing. The react
// README intro (~458) actually AFFIRMS runtime ("the props Formality injects").
// Do NOT manufacture an edit to hit a quota; "verified accurate, no edit" IS
// the correct deliverable.

// GOTCHA (line drift): S2 edits react README ~609–616 and may have already
// landed (working tree shows "Runtime delivery (important)." at 609). Re-confirm
// line numbers with a grep before judging; do not rely on fixed numbers.

// GOTCHA (the defineInputs follow-up sentence): react README ~556 ("those types
// is a follow-up; defineInputs is the opt-in entry point") is about the
// defineInputs/InputType feature follow-up, NOT forwardRef. It is accurate and
// out of scope. Do not touch it.

// GOTCHA (don't add runtime prose to the root Type Safety bullet): The root
// README bullet's job is to summarize the type and point to the react README for
// the full contract (line 588 pointer). Adding forwardRef runtime detail there
// is scope creep and bloats a bullet list. Leave it as the accurate one-liner.

// GOTCHA (typecheck/lint are sanity gates, not proof): README/markdown edits do
// not affect tsc output. `pnpm typecheck`/`pnpm lint` catch ACCIDENTAL damage
// (e.g. if you stray into source). The real proof of the sweep is the grep
// verification (Level 3) + reading the diff.

// GOTCHA (no behavior to test): This is doc-only. Do NOT add tests. There is no
// runtime or type change to exercise.
```

## Implementation Blueprint

### Data models and structure

None. No data models, no types, no runtime. Pure doc review/edit.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (re-confirm line numbers + verbatim text)
  - GREP (root README): `grep -niE "FormalityFieldComponentProps|forwardRef|type-only|future runtime|coming soon|not yet|ahead of|WithFormality" README.md`
    → expect ONLY line 584–585 (the Type Safety bullet). No caveat prose.
  - GREP (react README): `grep -niE "FormalityFieldComponentProps|forwardRef|Runtime caveat|Runtime delivery|future runtime|type-only|ahead of|WithFormality" packages/react/README.md`
    → map every mention to its line. Confirm the caveat (~609) now reads
      "Runtime delivery (important)." (S2 landed) — that region is OUT OF SCOPE.
  - WHY: Guard against line drift (S2 may still be settling) and pin the
        exact overview mentions to judge.

Task 2: APPLY THE RUBRIC to each overview mention
  - RE-READ each overview mention identified in Task 1 (root README:584–585;
    react README ~440 import list, ~455–460 Type Safety intro, ~558 section
    header, ~561–563 contract sentence, ~576 "After — the shipped precise type"
    caption).
  - FOR EACH, ask: does this sentence imply forwardRef is type-only /
    not-yet-runtime-backed / "coming soon" / "future" / "ahead of runtime"?
      - If YES (STALE) → flag for minimal edit (Task 3).
      - If NO (ACCURATE — silent on runtime OR affirms runtime) → no edit.
  - EXPECTED (scout-verified): ALL overview mentions are ACCURATE → proceed
        directly to Task 4 (no edit).
  - CRITICAL: do NOT judge the caveat paragraph (~609–616) — it's S2's region.

Task 3: (ONLY IF Task 2 found a stale overview sentence) EDIT minimally
  - EDIT the stale sentence to state that `<Field>` delivers `forwardRef` at
    runtime as a regular, top-level prop (no React.forwardRef wrap required for
    plain function components). Keep the surrounding voice/format.
  - DO NOT touch the per-symbol caveat (S2), the type body, runtime/source,
    or core.
  - IF the edit is in packages/react/README.md, note the file-overlap with S2
    in the PR description (S2 also edits that file's caveat) and ensure your
    edit is in a DIFFERENT region (overview, not caveat).
  - (EXPECTED: this task is usually skipped — no stale overview found.)

Task 4: RECORD THE DECISION (always — this is a required deliverable)
  - WRITE in the PR description:
      - The list of overview mentions reviewed (file:line).
      - The rubric applied (STALE vs ACCURATE) and the per-mention verdict.
      - The conclusion: "all overview wording accurate; no edit" OR the minimal
        edit(s) made and why.
      - Explicit confirmation that the per-symbol caveat (S2/Mode A) was NOT
        touched and is already correct.
  - WHY: SOW §5 requires the implementing agent to make and document the final
        call. "No edit" is only defensible if the review is recorded.

Task 5: VALIDATION (sanity gates — catch accidental damage)
  - RUN: `pnpm typecheck` (root tsc — catches accidental source/type damage).
  - RUN: `pnpm lint` (catches malformed markdown/JSDoc if you strayed).
  - RUN: `pnpm format` (prettier — review any reflow).
  - EXPECT: green. These are sanity gates; the real proof is the grep + diff.
```

### Implementation Patterns & Key Details

```typescript
// There is no code pattern — this is a doc rubric. The only "pattern" is the
// decision rubric (apply per mention):

//   STALE  → edit  : implies forwardRef is type-only / not-yet-runtime-backed /
//                     "coming soon" / "future" / "ahead of runtime".
//   ACCURATE → keep: silent on runtime (just describes the type) OR affirms
//                     runtime delivery.

// Example of an ACCURATE overview sentence (root README:584 — KEEP):
//   "- **`FormalityFieldComponentProps<P>`** — the shipped injected-props type,
//     replacing the hand-rolled lossy `WithFormality<P>`."
//   Why accurate: describes the TYPE (which IS shipped); silent on runtime.
//   Silence is not stale framing.

// Example of an ACCURATE overview sentence that AFFIRMS runtime (react README:458 — KEEP):
//   "...a precise type for the props Formality injects onto your field components..."
//   Why accurate: "injects" affirms runtime delivery.

// (Hypothetical) example of a STALE overview sentence (would need edit):
//   "- **`FormalityFieldComponentProps<P>`** — the injected-props TYPE (forwardRef
//      delivery is a future runtime task)."
//   Why stale: explicitly calls forwardRef delivery "future".
//   Fix: drop the parenthetical; or restate that <Field> delivers forwardRef now.
//   NOTE: scout found NO such sentence — this is illustrative only.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
RUNTIME: none (doc-only).
PUBLIC API: none changed.
DOCS:
  - Root README Type Safety bullet (584–585): reviewed; edit ONLY if stale (expected: no edit).
  - React README overview mentions (~440, ~455–460, ~558, ~576): reviewed; edit ONLY if stale.
  - React README caveat (~609–616): S2 (Mode A) — NOT touched here.
TESTS: none (doc-only; no behavior change).
PARALLEL-SAFE:
  - S2 edits react README ~609–616 (caveat). This task reviews ~440/458/558/576
    (overview). Different regions. IF this task must edit the react README
    overview, keep the edit OUT of the caveat region and note the overlap.
  - No overlap with S1 (Field.tsx runtime) or T2.S1 (tests).
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Only relevant if Task 3 made an edit
pnpm format            # prettier — review any markdown reflow
pnpm lint              # eslint — catch malformed markdown if configured

# Expected: Zero errors (doc edits shouldn't affect lint). If typecheck/lint
# fail, you strayed into source — revert those lines.
```

### Level 2: Typecheck (Sanity — catch accidental damage)

```bash
pnpm typecheck
# Expected: green. A doc sweep cannot change tsc output. If this fails, you
# accidentally edited a .ts file — revert it.
```

### Level 3: Prose Verification (the actual proof of this sweep)

```bash
# Confirm NO stale overview framing remains ANYWHERE consumer-facing:
grep -niE "forwardRef.*(type-only|type only|not yet|coming soon|future)|future runtime task|ahead of the runtime|out of scope for this type-only" \
  README.md packages/react/README.md
# Expected: NO matches. (The caveat region was S2's job and is already fixed;
#  any remaining match = a genuinely stale overview sentence you must edit.)

# Confirm FormalityFieldComponentProps overview mentions are intact (still listed):
grep -niE "FormalityFieldComponentProps" README.md packages/react/README.md
# Expected: the known overview mentions (root:584; react:440,458,558,561-563,576)
#  plus the (S2-owned) caveat region. Nothing was accidentally deleted.

# Confirm the root README still points to the react README for the full contract:
grep -ni "React package README" README.md
# Expected: line ~588 pointer intact.
```

### Level 4: Scope Verification

```bash
# IF no edit (expected): confirm the working tree is clean for these files.
git diff --exit-code README.md packages/react/README.md packages/react/src/overlays.ts \
  packages/react/src/components/Field.tsx packages/core
# Expected: exit 0 (nothing changed) — OR, if Task 3 edited an overview sentence,
#  ONLY README.md and/or packages/react/README.md show a diff.

# IF an edit was made: confirm the diff is overview-only (not the caveat, not source).
git diff README.md packages/react/README.md
# Expected: changes ONLY in overview/feature-listing lines; the caveat region
#  (~609–616) is untouched (S2's); no .ts file changed.
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` green (sanity — no source/type damage).
- [ ] `pnpm lint` clean.
- [ ] If no edit: `git diff --exit-code README.md packages/react/README.md` → exit 0.
- [ ] If edited: `git diff --stat` shows ONLY `README.md` and/or `packages/react/README.md`.

### Feature Validation

- [ ] Every overview mention (root:584–585; react:~440, ~455–460, ~558, ~576) re-read and judged via the rubric.
- [ ] No consumer-facing overview sentence implies forwardRef is type-only / not-yet-runtime-backed / "coming soon".
- [ ] `grep -niE "future runtime task|ahead of the runtime|out of scope for this type-only|forwardRef.*(type-only|not yet|coming soon)" README.md packages/react/README.md` → NO matches in overview regions.
- [ ] The per-symbol caveat (overlays.ts ~167–174; react README ~609–616) was NOT touched (S2/Mode A).
- [ ] Decision recorded in the PR description (edited? what? or "verified accurate, no edit" + rubric applied).

### Code Quality Validation

- [ ] If edited: each edit is in the file's own voice (markdown prose); minimal and surgical.
- [ ] No incidental reflow outside the target sentence.
- [ ] No scope leak into source/types/core/tests.

### Documentation & Deployment

- [ ] Overview framing now consistent with the shipped runtime (forwardRef delivered by `<Field>`).
- [ ] No new env vars, config, or runtime code.
- [ ] Mode B catch-all complete; the delta cannot ship with a stale README overview.

---

## Anti-Patterns to Avoid

- ❌ Don't edit the per-symbol caveat prose (overlays.ts ~167–174; react README ~609–616) — that's P1.M1.T1.S2 (Mode A), already landed. This task is overview/feature-listing framing ONLY.
- ❌ Don't manufacture an edit to hit a quota — "verified accurate, no edit" is the correct and expected deliverable. Silence on runtime (e.g. root README:584 describes only the type) is NOT stale framing.
- ❌ Don't add forwardRef runtime prose to the root README Type Safety bullet — its job is to summarize the type and point to the react README. Adding runtime detail there is scope creep.
- ❌ Don't touch `packages/react/src/overlays.ts`, `Field.tsx`, `packages/core`, or any test file — all out of scope.
- ❌ Don't "fix" the react README ~556 sentence ("those types is a follow-up; `defineInputs` is the opt-in entry point") — it's about the defineInputs/InputType follow-up, not forwardRef; accurate and out of scope.
- ❌ Don't add tests — doc-only; no behavior change.
- ❌ Don't rely on fixed line numbers — S2 is settling the react README; re-confirm with a grep before judging.
- ❌ Don't skip recording the decision in the PR description — SOW §5 requires the implementing agent to make and document the final call, even (especially) when the answer is "no edit".

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is a tightly scoped, read-and-judge doc sweep with a fixed
rubric, and the scout report has already mapped every overview mention with
verbatim quotes, line numbers, and per-mention verdicts (all ACCURATE). The
per-symbol caveat (the only place stale wording ever lived) is S2's Mode A
territory and has already landed in the working tree. The expected outcome is
"verified accurate, no edit; decision recorded" — a low-risk deliverable. The
1-point deduction accounts for (a) the inherent subjectivity of "does this
overview sentence imply X" (mitigated by the explicit STALE/ACCURATE rubric),
and (b) the need to re-confirm line numbers since S2 is concurrently editing
the react README (mitigated by Task 1's grep). Parallel-safety with S2 is high:
this task reviews different regions (overview) than S2 edits (caveat), and
likely makes no edit at all.
