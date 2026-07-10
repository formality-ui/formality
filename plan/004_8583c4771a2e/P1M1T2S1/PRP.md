name: "P1.M1.T2.S1 — Fix stale whole-form-validity claims in examples/06-auto-save.tsx Example 4; confirm READMEs and JSDoc are already aligned"
description: |

---

## Goal

**Feature Goal**: Fix the **three stale user-facing lines** in
`examples/06-auto-save.tsx` Example 4 ("Auto-Save with Validation") that
describe the OLD whole-form validity gate as if it were the current auto-save
behavior, then **confirm** (read-only) that the five other explicitly-audited
doc locations are already aligned with the NEW scoped behavior (PRD §11.1
point 4). Make NO edit where the audit found the docs clean — just record the
decision.

The NEW behavior (PRD §11.1 point 4): auto-save submits if the **changed
field** and its **affected (dependent) fields** are valid; an **unrelated
invalid field does NOT block** a valid edit. Whole-form validity is enforced
only on a full manual submit.

**Deliverable**:
1. `examples/06-auto-save.tsx` — three corrected lines in Example 4:
   - Line 322 (comment): rewrite to describe the scoped gate.
   - Line 370 (user-facing copy `<p>`): rewrite to describe the scoped gate.
   - Line 382 (`Form valid: ...isValid...` display): reframe as a
     manual-submit gate indicator (keep the `isValid` display but relabel it
     so it is no longer read as an auto-save gate).
2. A **confirmation record** (in this PRP's research/ dir or the PR body) that
   the five audited locations are clean and need no edit — OR an inline edit if
   the sweep unexpectedly finds a stale claim.
3. `pnpm typecheck:examples` green (examples are type-checked in CI) +
   `npx vitest run` green (no regression; examples are excluded from coverage
   per §1.3.7).

**Success Definition**:
1. None of the three fixed lines still implies whole-form validity gates
   auto-save.
2. No stale whole-form-validity-gating claim remains anywhere user-facing
   (the five audited locations confirmed clean; a repo-wide grep for the stale
   phrasing returns no hits in user-facing docs).
3. Example 4 still type-checks and renders (no broken JSX / undefined ref).
4. `examples/06-auto-save.tsx` is the ONLY file edited (unless the sweep finds
   an unexpected stale claim elsewhere).
5. The `"invalid"` status variant (declared but never set) — out of scope to
   wire up; the reframe of line 382 does not depend on it.

## User Persona

**Target User**: React consumers reading the auto-save examples (linked from
`README.md:720`) to learn when auto-save fires — and contributors reviewing
the changeset's doc accuracy.

**Use Case**: A consumer reads Example 4 ("Auto-Save with Validation"),
writes a form with a required `email` and an optional `notes`, edits `notes`,
and expects (from the example's current copy) that the save is blocked while
`email` is empty. Under the NEW scoped behavior the `notes` edit DOES save.
The example's current text (`Form only saves when all fields are valid`) lies
about this.

**User Journey**: open `examples/06-auto-save.tsx` → read Example 4 →
understand auto-save validates only the changed field + dependents → write a
form accordingly.

**Pain Points Addressed**: The example actively misleads about a subtle,
easily-misunderstood behavior (scoped vs whole-form validity). This is the
only stale cross-cutting doc claim found by the architecture audit.

## Why

- **Business value**: User-facing docs must match shipped behavior. The scoped
  auto-save gate (PRD §11.1 point 4) is subtle and high-value (it's the fix
  for "Issue 2"); the example that documents it must not contradict it.
- **Integration**: This is the **Mode B changeset-level documentation sweep**
  for the auto-save validity change. The runtime (P1.M1.T1.S1 — Complete) and
  tests (P1.M1.T1.S2) are verified; this subtask aligns the last stale doc.
  It is the final gate before the changeset ships.
- **Scope boundary (CRITICAL)**: This is a **doc-only** edit to ONE file
  (`examples/06-auto-save.tsx`), three lines. It does NOT:
  - Edit `Form.tsx`, the READMEs, JSDoc, or CHANGELOG unless the sweep finds
    an unexpected stale claim (the audit says they're clean).
  - Change runtime behavior, types, or tests.
  - Wire up the dead `"invalid"` status variant (out of scope — the line 382
    reframe doesn't depend on it).
- **Parallel-safe**: P1.M1.T1.S2 (concurrent) is a read-only test/coverage
  audit that writes only to `plan/.../audit-record.md` and (if it finds a
  gap) possibly a test file. This subtask edits only `examples/06-auto-save.tsx`.
  **No file overlap.**

## What

### The three edits (examples/06-auto-save.tsx, Example 4)

All three are confirmed verbatim during PRP research (lines 322, 370, 382):

| Line | Current (stale) | Fix |
|------|-----------------|-----|
| 322 | `// Auto-save only triggers when form is valid` | Rewrite comment → describe scoped gate |
| 370 | `<p>Form only saves when all fields are valid</p>` | Rewrite copy → describe scoped gate |
| 382 | `Form valid: {methods.formState.isValid ? "Yes" : "No"}` | **Reframe** (not remove) the `isValid` display as a manual-submit gate indicator, not an auto-save gate |

**Suggested replacement text** (adapt wording; keep it user-friendly):

- Line 322 comment:
  `// Auto-save validates only the changed field (and its dependents) before saving`
- Line 370 copy:
  `<p>Auto-save saves a change once the edited field (and its dependents) validate; an unrelated invalid field won't block it.</p>`
- Line 382 reframe (keep the `isValid` read; relabel so it's clearly the
  manual-submit gate, not the auto-save gate):
  `<p>Manual-submit ready (all fields valid): {methods.formState.isValid ? "Yes" : "No"}</p>`
  (The `isValid` display now documents "would a full manual submit succeed?",
  which IS a whole-form check — accurate and non-misleading.)

### The read-only confirmation sweep

Confirm the five audited locations are clean (make NO edit; record "clean"):
1. `README.md` §"Auto-Save" (~502) — neutral snippet, no validity-scope claim.
2. `README.md` capability bullet (~643) — "auto-save requirements with
   validation awareness" (accurate under NEW behavior).
3. `packages/react/README.md` §"Auto-Save" (~279) + prop tables (~121, 137) —
   neutral (`autoSave | boolean | Enable auto-save`; `debounce | number | ...`).
4. `packages/react/src/components/Form.tsx` `autoSave`/`debounce` JSDoc (~57-71)
   — accurate and scoped.
5. `CHANGELOG.md` (~27-28) — "Auto-save validation now targets only changed
   fields, not all fields." (correctly describes NEW behavior).

Then a **repo-wide grep** for stale phrasings to catch anything the audit
missed (see Validation Level 4).

### Success Criteria

- [ ] Line 322 comment rewritten to describe the scoped gate (no "only when form is valid").
- [ ] Line 370 copy rewritten to describe the scoped gate (no "only saves when all fields are valid").
- [ ] Line 382 reframed so the `isValid` display is clearly a manual-submit
      indicator, not an auto-save gate (kept, not removed).
- [ ] The five audited locations confirmed clean (no edit) — recorded.
- [ ] Repo-wide grep for stale phrasings returns no NEW user-facing hits.
- [ ] `pnpm typecheck:examples` green.
- [ ] `npx vitest run` green (no regression).
- [ ] `examples/06-auto-save.tsx` is the only file edited (unless sweep finds otherwise).
- [ ] No runtime/type/test change.

## All Needed Context

### Context Completeness Check

_Pass._ The staleness audit
(`plan/004_8583c4771a2e/architecture/doc-staleness-audit.md`) names the exact
three stale lines with verbatim text and confirms the five other locations
clean. All six locations were RE-VERIFIED against live source during PRP
research (line numbers + text match exactly). The example file's structure
around Example 4 (the `ValidatedAutoSaveExample` render-prop with `methods` in
scope, the `status` state, the `saveToAPI` helper) was inspected, so the
line 382 reframe is known to be safe. No prior codebase knowledge is needed
beyond "edit three lines in one example file; read five locations to confirm."

### Documentation & References

```yaml
# MUST READ
- url: PRD §11.1 (heading:h3.48) — "Behavior", point 4 (the scoped validity gate)
  why: Defines the NEW behavior the docs must describe.
  critical: "Only submits if the changed field and its affected (dependent) fields are
             valid … An unrelated invalid field does NOT block a valid edit … Whole-form
             validity is still enforced on a full manual submit." ← the line 382 reframe
             (isValid = manual-submit gate) is justified by this last sentence.

- url: PRD §11.2 (heading:h3.49) — "Implementation" (executeAutoSave gates)
  why: Confirms there is NO whole-form validity check in executeAutoSave — only the
        two scoped gates (changed field onChange error; dependent fields trigger).
  critical: "NOTE: no whole-form validity check here — the two gates above already cover
             exactly the fields this save can touch." ← why "form is valid" framing is stale.

- url: PRD §1.3.7 (heading:h4.6) — "Testing Strategy"
  why: Examples are EXCLUDED from coverage (`examples/**`) but ARE type-checked in CI.
  critical: "Run `pnpm typecheck:examples` to confirm no type regression; `npx vitest run`
             confirms no test regression. Examples are NOT measured by the 90% gate."

- docfile: plan/004_8583c4771a2e/architecture/doc-staleness-audit.md
  why: The authoritative staleness map — names the 3 stale lines (verbatim) + confirms
        the 5 clean locations. Re-verified live during PRP research.
  section: "Verdict", "Location-by-Location Findings", "Suggested Fix"
  critical: "ONE stale item found: examples/06-auto-save.tsx Example 4 (lines 322, 370, 382).
             The five explicitly-listed doc locations are clean."

# PARALLEL-EXECUTION CONTEXT (S2 test-audit is being implemented concurrently)
- file: plan/004_8583c4771a2e/P1M1T1S2/PRP.md
  section: "Goal (read-only test/coverage audit; writes audit-record.md)"
  why: S2 (concurrent) audits the auto-save TESTS + coverage gate. It writes ONLY to
        plan/.../audit-record.md (and, only if it finds a gap, possibly a test file).
        ZERO overlap with this subtask (which edits only examples/06-auto-save.tsx).
  critical: "S2 is READ-ONLY by default. Do NOT touch examples/READMEs (that's P1.M1.T2.S1
             = this subtask). Confirm S2 didn't edit the example; coordinate only if both
             somehow touch the same file (they don't)."

# THE EDIT TARGET (verbatim current text, re-verified)
- file: examples/06-auto-save.tsx
  section: "Example 4 — 'Auto-Save with Validation' (lines 322, 370, 382)"
  why: THE file to edit. Three lines.
  pattern: "Example file with multiple exported example components; Example 4 is
            `export function ValidatedAutoSaveExample()` @348, uses a render-prop
            `{({ methods }) => (...)}` so `methods.formState.isValid` is in scope."
  gotcha: "Line 382 uses `methods.formState.isValid` — `methods` comes from the render-prop
           destructuring inside <Form>, so it is in scope. Reframe (relabel) rather than
           remove — the isValid read is still valid as a manual-submit indicator.
           Do NOT remove the `<div className=\"validation-status\">` wrapper (it's styled)."

- file: examples/06-auto-save.tsx
  section: "status state @349: useState<'idle'|'saving'|'saved'|'invalid'>"
  why: Context for the line 382 reframe. The 'invalid' variant is DECLARED but NEVER SET
        (only saving/saved/idle are set in handleSubmit @354-357).
  gotcha: "Do NOT try to wire up the 'invalid' status — it's a pre-existing dead variant
           and out of scope. The line 382 reframe is independent of it (just relabel the
           isValid display). Leaving 'invalid' declared-but-unset is fine (it compiles)."

# THE CLEAN LOCATIONS (read-only confirm — DO NOT EDIT)
- file: README.md
  section: "§Auto-Save (~502); capability bullet (~643); examples table link (~720)"
  why: CONFIRM clean. §Auto-Save is a neutral snippet; the bullet says 'validation
        awareness' (accurate); line 720 links the example file being fixed.
  verify: "`grep -nE 'only.*when.*valid|form is valid|all fields are valid' README.md`
           → expect NO hits (neutral)."

- file: packages/react/README.md
  section: "§Auto-Save (~279); prop tables (~121, 137)"
  why: CONFIRM clean. `autoSave | boolean | Enable auto-save` and `debounce | number |
        Debounce delay (ms)` are neutral; no validity-scope claim.
  verify: "`grep -nE 'only.*when.*valid|form is valid|all fields are valid' packages/react/README.md`
           → expect NO hits."

- file: packages/react/src/components/Form.tsx
  section: "autoSave/debounce JSDoc (~57-71)"
  why: CONFIRM clean + accurate + scoped. `autoSave?: boolean` ('Enable auto-save on
        field changes'); `debounce` JSDoc documents per-field override. No stale claim.
  verify: "`grep -nE 'only.*when.*valid|form is valid|all fields are valid' packages/react/src/components/Form.tsx`
           → expect NO hits."

- file: CHANGELOG.md
  section: "~27-28"
  why: CONFIRM it correctly describes NEW behavior already.
  verify: "`grep -n 'targets only changed fields' CHANGELOG.md` → expect hits (already correct)."

- file: vitest.config.ts
  section: "coverage.exclude (~line 19: 'examples/**')"
  why: CONFIRM examples are excluded from coverage (so editing them cannot regress the gate).
  gotcha: "Examples are STILL type-checked (`pnpm typecheck:examples`) — coverage-excluded
           ≠ unchecked. Run typecheck:examples after the edit."
```

### Current Codebase tree (relevant slice)

```bash
examples/
  06-auto-save.tsx          # ← EDIT: 3 lines in Example 4 (322 comment, 370 <p>, 382 display)
README.md                   # CONFIRM clean (~502, ~643); links example @720
packages/react/
  README.md                 # CONFIRM clean (~279, ~121, ~137)
  src/components/Form.tsx   # CONFIRM clean (autoSave/debounce JSDoc ~57-71)
CHANGELOG.md                # CONFIRM already describes NEW behavior (~27-28)
vitest.config.ts            # examples/** excluded from coverage (~19)
```

### Desired Codebase tree with files to be added

```bash
examples/06-auto-save.tsx   # MODIFIED — 3 reframed lines in Example 4 (comment + <p> + isValid display)
# (no new files; no README/JSDoc/CHANGELOG edits unless the sweep finds an unexpected stale claim)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (line 382 is a REFRAME, not a removal): Keep the `methods.formState.isValid`
// read and its surrounding <div className="validation-status"> wrapper. Just relabel
// the text so it reads as a MANUAL-SUBMIT gate indicator, not an auto-save gate.
// Removing the isValid display entirely would lose a useful (accurate) indicator;
// the issue is only that it's currently framed as gating auto-save.

// CRITICAL (methods is in scope): Line 382's `methods` comes from the render-prop
// destructuring `{({ methods }) => (...)}` inside <Form> (Example 4, ~line 365).
// The reframe keeps using `methods.formState.isValid` — no new variable, no scope change.

// CRITICAL (don't touch the dead 'invalid' status variant): The `status` useState
// @349 declares an 'invalid' variant that is NEVER set (handleSubmit only sets
// saving/saved/idle). This is a pre-existing dead branch, OUT OF SCOPE. Do not wire
// it up. Leaving it declared-but-unset compiles fine; the line 382 reframe is
// independent of it.

// CRITICAL (examples are type-checked but coverage-excluded): examples/** is in
// vitest.config.ts coverage.exclude (~line 19), so editing them CANNOT regress the
// 90% gate. BUT examples ARE type-checked in CI via `pnpm typecheck:examples`
// (= `tsc -p examples/tsconfig.json --noEmit`). ALWAYS run typecheck:examples after
// the edit — a JSX/typing break there fails CI.

// GOTCHA (don't over-edit): The audit found EXACTLY three stale lines. Do not
// "improve" the rest of Example 4 (the validators, the config, the other examples).
// Minimal, surgical edits to the three lines only. If you think another line is stale,
// confirm against PRD §11.1-11.3 first; only edit if it genuinely contradicts the spec.

// GOTCHA (sweep is READ-ONLY unless a hit is found): The five audited locations were
// verified clean during PRP research (grep returned no hits for the stale phrasings).
// Record "clean" for each. Only edit one if a NEW grep finds a stale claim the audit
// missed — and then only that line.

// GOTCHA (parallel execution): P1.M1.T1.S2 (concurrent) is a read-only test audit
// that writes only to plan/.../audit-record.md. It does NOT edit examples. No file
// overlap. Don't wait on it.

// GOTCHA (the README link @720 is NOT stale): README.md:720 links the example file
// (`| [06-auto-save](./examples/06-auto-save.tsx) | Auto-save configuration |`).
// The LINK is fine; the STALE CONTENT is inside the example file. Fix the content,
// leave the link.
```

## Implementation Blueprint

### Data models and structure

Not applicable — doc-only edits to prose/JSX text. No data models change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (re-confirm the 3 stale lines + the 5 clean locations)
  - READ examples/06-auto-save.tsx lines 318-388 (Example 4 in full, incl. the render-prop scope).
  - GREP for the stale phrasings repo-wide (catch anything the audit missed):
      grep -rnE "only saves when all fields are valid|Auto-save only triggers when form is valid|Form only saves when all" \
        examples/ README.md packages/ CHANGELOG.md
    → expect hits ONLY in examples/06-auto-save.tsx (lines 322, 370). (Line 382's
      `Form valid:` phrasing won't match this grep — check it by reading.)
  - GREP the 5 clean-location files for stale phrasings → expect NO hits (record "clean").
  - CONFIRM `methods` is in scope at line 382 (render-prop destructuring inside <Form>).
  - WHY: Guard against line drift and catch any stale claim the audit missed before editing.

Task 2: EDIT examples/06-auto-save.tsx line 322 (comment)
  - REPLACE: `// Auto-save only triggers when form is valid`
    WITH: `// Auto-save validates only the changed field (and its dependents) before saving`
    (or equivalent scoped-gate wording).
  - PRESERVE: the `// ===` banner lines above/below; the blank line after.
  - DEPENDENCIES: Task 1.

Task 3: EDIT examples/06-auto-save.tsx line 370 (user-facing <p> copy)
  - REPLACE: `<p>Form only saves when all fields are valid</p>`
    WITH: `<p>Auto-save saves a change once the edited field (and its dependents) validate; an unrelated invalid field won't block it.</p>`
    (or equivalent scoped-gate wording — keep it user-friendly, one sentence).
  - PRESERVE: the surrounding <div>, the <h3>, the status-badge block.
  - DEPENDENCIES: Task 2.

Task 4: EDIT examples/06-auto-save.tsx line 382 (isValid display — REFRAME, not remove)
  - REPLACE: `Form valid: {methods.formState.isValid ? "Yes" : "No"}`
    WITH: `Manual-submit ready (all fields valid): {methods.formState.isValid ? "Yes" : "No"}`
    (or equivalent — the KEY change is the LABEL makes clear this is the whole-form
    manual-submit gate, NOT the auto-save gate).
  - PRESERVE: the `<div className="validation-status">` wrapper; the `methods.formState.isValid`
    read (still valid + accurate as a manual-submit indicator).
  - DO NOT: remove the isValid display, wire up the dead 'invalid' status, or change `methods` scope.
  - DEPENDENCIES: Task 3.

Task 5: RUN the confirmation sweep (read-only — record "clean" or edit if a hit is found)
  - GREP each of the 5 audited locations for stale phrasings:
      grep -nE "only.*when.*valid|form is valid|all fields are valid" \
        README.md packages/react/README.md packages/react/src/components/Form.tsx
    → expect NO hits. Record "clean" for each in the PR / confirmation note.
  - GREP CHANGELOG.md: `grep -n "targets only changed fields" CHANGELOG.md`
    → expect hits (already describes NEW behavior). Record "already correct".
  - IF any grep unexpectedly returns a stale hit: make the minimal inline edit to that line
    (same scoped-gate reframing) and note it. (Research found none expected.)
  - DEPENDENCIES: Task 4.

Task 6: VALIDATION (typecheck + test regression)
  - RUN: `pnpm typecheck:examples` (= `tsc -p examples/tsconfig.json --noEmit`)
    → expect green. Catches any JSX/typing break from the edit.
  - RUN: `pnpm typecheck` (root tsc --build) → sanity (should be unaffected; example edits
    don't touch packages, but run it as a guard).
  - RUN: `npx vitest run` (or `pnpm test`) → expect green. Examples are excluded from
    coverage/tests, so this confirms no incidental regression elsewhere.
  - EXPECT: all green. typecheck:examples is the meaningful gate (examples are CI type-checked).

Task 7: SCOPE-LEAK CHECK
  - RUN: `git diff --stat` → expect EXACTLY:
        examples/06-auto-save.tsx   (modified)
    (UNLESS Task 5 found an unexpected stale claim in a README/JSDoc/CHANGELOG — then
     that file too, noted explicitly.)
  - RUN: `git diff --exit-code packages/react/src/components/Form.tsx packages/react/src/__tests__ vitest.config.ts vitest.workspace.ts`
    → expect exit 0 (untouched — runtime/tests/config are S1/S2 territory).
  - RUN: `git diff examples/06-auto-save.tsx | grep -E '^\+|^-' | grep -iE 'valid|saves|auto-save'`
    → confirm the diff touches ONLY the 3 intended lines (no incidental edits to validators/config).
```

### Implementation Patterns & Key Details

```typescript
// examples/06-auto-save.tsx — Example 4 — THE three edits (Tasks 2, 3, 4)

// BEFORE (line 322, comment under the Example 4 banner):
// // Auto-save only triggers when form is valid
// AFTER:
// // Auto-save validates only the changed field (and its dependents) before saving

// BEFORE (line 370, user-facing <p> inside the render-prop):
// <p>Form only saves when all fields are valid</p>
// AFTER:
// <p>Auto-save saves a change once the edited field (and its dependents) validate; an unrelated invalid field won't block it.</p>

// BEFORE (line 382, display inside <div className="validation-status">):
// Form valid: {methods.formState.isValid ? "Yes" : "No"}
// AFTER (REFRAME — keep the isValid read, relabel as the manual-submit gate):
// Manual-submit ready (all fields valid): {methods.formState.isValid ? "Yes" : "No"}

// WHY line 382 is a reframe not a removal:
//   PRD §11.1 point 4 last sentence: "Whole-form validity is still enforced on a full
//   manual submit." So `isValid` IS a meaningful, accurate indicator — of the MANUAL
//   submit gate. The bug was only that it was labeled as if it gated auto-save.
//   Relabeling preserves the useful indicator without the misleading framing.

// PATTERN: match the file's existing voice (plain comments; plain <p> copy; no JSDoc).
// GOTCHA:  `methods` at line 382 is from the render-prop `{({ methods }) => (...)}` — in scope.
// CRITICAL: do NOT touch the `status` 'invalid' variant (@349, never set) — out of scope.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
RUNTIME: none (doc-only).
PUBLIC API: none changed.
DOCS:
  - examples/06-auto-save.tsx Example 4: 3 lines reframed (this subtask).
  - README.md / packages/react/README.md / Form.tsx JSDoc / CHANGELOG.md: CONFIRMED clean (no edit).
TESTS: none (doc-only; examples excluded from coverage per §1.3.7).
CI:
  - examples ARE type-checked (`pnpm typecheck:examples`) → run it after the edit.
  - examples are NOT coverage-measured → editing them cannot regress the 90% gate.
PARALLEL-SAFE:
  - S2 (concurrent) audits tests + coverage, writes only plan/.../audit-record.md (read-only by default).
  - This subtask edits only examples/06-auto-save.tsx. No file overlap.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing examples/06-auto-save.tsx (Tasks 2/3/4)
pnpm format            # prettier — review any reflow (keep edits minimal)
pnpm lint              # eslint — examples may or may not be linted; run it as a guard

# Expected: Zero errors (or only pre-existing example-lint noise unrelated to the 3 lines).
```

### Level 2: Typecheck (the meaningful gate — examples are CI type-checked)

```bash
# Examples are type-checked in CI via this script:
pnpm typecheck:examples
# Expected: green. Catches any JSX/typing break from the edit (e.g. if the reframe
# accidentally broke the <div> or removed `methods` usage incorrectly).

# Root typecheck (sanity — example edits shouldn't affect packages, but guard it):
pnpm typecheck
# Expected: green.
```

### Level 3: Test Regression (examples excluded, but confirm no incidental break)

```bash
# Examples are excluded from coverage AND from the test run (coverage.exclude = examples/**),
# but run the suite to confirm no incidental regression elsewhere:
npx vitest run
# (equivalently: pnpm test)
# Expected: green. The 3-line example edit cannot affect runtime tests, but this guards
# against an accidental edit to a non-example file.
```

### Level 4: Staleness Sweep (the actual proof — no stale claim remains)

```bash
# Confirm the 3 fixed lines no longer carry the stale phrasing:
grep -nE "only saves when all fields are valid|Auto-save only triggers when form is valid" \
  examples/06-auto-save.tsx
# Expected: NO matches (both stale phrases gone).

# Confirm line 382's new framing is present (isValid kept, relabeled):
grep -n "isValid" examples/06-auto-save.tsx
# Expected: exactly ONE match (@382), now with the manual-submit framing.

# Confirm the 5 audited locations are clean (no stale claim):
grep -nE "only.*when.*valid|form is valid|all fields are valid" \
  README.md packages/react/README.md packages/react/src/components/Form.tsx
# Expected: NO matches (record "clean" for each).

# Confirm CHANGELOG already describes NEW behavior:
grep -n "targets only changed fields" CHANGELOG.md
# Expected: matches (already correct).

# Repo-wide catch-all for any stale phrasing the audit missed (user-facing docs):
grep -rnE "auto-save only.*form is valid|saves when all fields are valid|whole.form.*auto-save" \
  examples/ README.md packages/react/README.md packages/react/src/components/Form.tsx CHANGELOG.md
# Expected: NO matches. (If any appears in a user-facing doc, edit it with the same reframing.)
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck:examples` green (the meaningful gate for example edits).
- [ ] `pnpm typecheck` green (sanity).
- [ ] `npx vitest run` green (no incidental regression).
- [ ] `pnpm lint` clean (or only pre-existing example noise).

### Feature Validation

- [ ] Line 322 comment describes the scoped gate (no "only when form is valid").
- [ ] Line 370 `<p>` copy describes the scoped gate (no "only saves when all fields are valid").
- [ ] Line 382 reframed: `isValid` display labeled as manual-submit gate, not auto-save gate (kept, not removed).
- [ ] The 5 audited locations confirmed clean (recorded) — no edit.
- [ ] Repo-wide stale-phrase grep returns no user-facing hits.
- [ ] CHANGELOG confirmed already describes NEW behavior.

### Code Quality Validation

- [ ] Edits minimal + surgical (exactly the 3 stale lines; no incidental edits to validators/config/other examples).
- [ ] Line 382 keeps the `<div className="validation-status">` wrapper and the `methods.formState.isValid` read.
- [ ] The dead `"invalid"` status variant left untouched (out of scope).
- [ ] Example 4 still type-checks and renders (render-prop `methods` still in scope).

### Scope & Documentation

- [ ] `git diff --stat` shows EXACTLY `examples/06-auto-save.tsx` (unless sweep found an unexpected stale claim, noted).
- [ ] No runtime file (Form.tsx), test file, vitest config, or core file edited.
- [ ] No README/JSDoc/CHANGELOG edited unless the sweep found a stale claim (recorded either way).
- [ ] Mode B changeset-level doc sweep complete; no separate doc subtask needed.

---

## Anti-Patterns to Avoid

- ❌ Don't REMOVE line 382's `isValid` display — REFRAME it. It's a valid manual-submit indicator; only its framing was wrong.
- ❌ Don't wire up the dead `"invalid"` status variant (@349) — it's pre-existing and out of scope.
- ❌ Don't "improve" the rest of Example 4 (validators, config) or the other examples — edit only the 3 stale lines.
- ❌ Don't edit README.md, packages/react/README.md, Form.tsx JSDoc, or CHANGELOG.md unless a grep finds a stale claim — the audit verified them clean.
- ❌ Don't edit Form.tsx, any test file, vitest.config.ts, or packages/core — runtime/tests/config territory (S1/S2).
- ❌ Don't skip `pnpm typecheck:examples` — examples ARE CI type-checked; a JSX break there fails CI even though examples are coverage-excluded.
- ❌ Don't trust the audit's line numbers blindly — re-read lines 318-388 (Task 1) before editing; lines drift.
- ❌ Don't change the `<div className="validation-status">` wrapper or the `methods` scope — the reframe is text-only.
- ❌ Don't add a separate doc subtask — this IS the Mode B changeset-level doc sweep.

---

## Confidence Score

**10/10** — one-pass success likelihood.

Rationale: This is a tightly scoped, doc-only edit to three lines in one
example file, with verbatim current text and exact line numbers confirmed
live during PRP research (322 comment, 370 `<p>`, 382 display). The five
audited clean locations were re-verified by grep (no stale-phrase hits).
The line 382 reframe is safe: `methods.formState.isValid` is in scope (render-
prop destructuring), the `<div>` wrapper is preserved, and the dead `"invalid"`
status variant is explicitly out of scope. The only validation that matters
(`pnpm typecheck:examples`) is a straightforward CI gate, and example edits
cannot regress the 90% coverage gate (examples are coverage-excluded per
§1.3.7). Parallel-safety with S2 (concurrent test audit) is guaranteed — S2
writes only to `plan/.../audit-record.md`. No residual risk beyond trivial
wording choice, which the success criteria constrain tightly.
