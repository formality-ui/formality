name: "P1.M1.T1.S1 — Audit runtime implementation in Form.tsx against PRD §11.1–§11.3 scoped-gate and coalescing spec"
description: |

---

## Goal

**Feature Goal**: Verify that the shipped auto-save runtime in
`packages/react/src/components/Form.tsx` matches PRD §11.1–§11.3 (scoped
validity gate, `executeAutoSave` logic, per-field debounce coalescing, and
the `changeField` 3-way debounce branch) **as it exists today**, and produce
a line-number-cited confirmation record — OR a gap report if a real
discrepancy is found.

**Deliverable**: A **read-only audit record** (markdown confirmation with a
line citation for each of the four specified behaviors, OR a gap report).
This is **not a code-change subtask** unless a real gap is discovered. The
record feeds P1.M1.T1.S2 (test-side audit) and gates P1.M1.T2 (the doc
sweep runs only after the audit confirms the runtime).

**Success Definition**:
1. Every one of the four specified behaviors is walked against the current
   source and confirmed with an exact line citation.
2. If all match → record "no drift, already ships" with the citations.
3. If a gap is found → scope the *minimal* code fix and note it (and any doc
   the fix touches rides with it per Mode A).
4. No code is modified unless a genuine discrepancy is found.

> **RESEARCH FINDING (pre-verified): The architecture audit
> (`plan/004_8583c4771a2e/architecture/autosave-impl-audit.md`) confirms
> ZERO DRIFT, and this was re-verified against live source during PRP
> research — the file is 879 lines and every cited line number is current.
> The overwhelmingly likely outcome is "no drift, already ships." The
> implementing agent's job is to independently re-confirm this (line numbers
> may drift by the time it runs) and write the record.**

## User Persona

**Target User**: The Formality maintainer / QA reviewer. This is an internal
verification artifact, not an end-user feature.

**Use Case**: Before updating docs (P1.M1.T2) and before auditing tests
(P1.M1.T1.S2), confirm the runtime actually behaves as the updated PRD §11
spec claims — so docs and tests describe reality, not aspiration.

**Pain Points Addressed**: Prevents docs/tests from drifting from runtime
(the exact class of bug this plan exists to catch — e.g. stale whole-form-
validity claims in `examples/06-auto-save.tsx` flagged for P1.M1.T2.S1).

## Why

- **Business value**: Establishes a trusted baseline. The auto-save scoped-
  gate behavior is subtle (an unrelated invalid field must NOT block a valid
  edit), and getting it wrong silently drops user saves. An explicit
  line-cited audit is the cheapest way to be certain.
- **Integration**: This subtask is the **gate** for the rest of P1.M1:
  - **P1.M1.T1.S2** (test-side audit) consumes this record to know which
    behaviors must have test coverage.
  - **P1.M1.T2.S1** (doc sweep) runs only after this audit confirms the
    runtime, so it edits docs to match verified behavior.
- **Scope boundary**: READ-ONLY by default. Touch `Form.tsx` only if a real
  gap is found, and then only the minimal fix. Do NOT touch tests
  (P1.M1.T1.S2), examples/READMEs (P1.M1.T2.S1), or core.

## What

Walk each of the four specified behaviors against the current source and
confirm a match. The expected findings (re-verified during PRP research at
the line numbers below; re-confirm at execution time as lines may have
shifted):

### Behavior 1 — Scoped validity gate (PRD §11.1 point 4)

Auto-save validates ONLY the changed field + its affected (dependent) fields.
An unrelated invalid field does NOT block a valid edit. No whole-form
validity check.

- **Gate 1** — changed-field `onChange` error check: `executeAutoSave` at
  ~Form.tsx:549-648; the loop checking `methods.getFieldState(fieldName).error`
  and returning early at ~585-591.
- **Gate 2** — affected-field revalidation via `methods.trigger`: ~594-616;
  calls `methods.trigger(fieldsToTrigger)`, returns if `!isValid`.
- **Explicit "no whole-form validity check"** — deliberate comment block at
  ~620-629. Confirm there is NO call to `methods.formState.isValid` and NO
  whole-form `methods.trigger()` (no args).

### Behavior 2 — `executeAutoSave` structure (PRD §11.2)

- `pendingChangedFields`: declared ~215; populated in `changeField` ~363;
  copied+cleared in `executeAutoSave` ~555-558.
- `pendingAffectedFields`: declared ~216; populated in `changeField` ~366-368;
  copied+cleared in `executeAutoSave` ~556-558.
- `getAffectedFields()`: transitive dependency traversal via
  `invertedSubscriptions` ~338-356.
- **Execution-version abort**: `executionVersionRef` declared ~218;
  incremented+captured ~551-552; re-checked after EVERY `await` at ~579-583,
  ~598-600, ~612-616 (aborts stale saves when new changes arrive
  mid-validation).

### Behavior 3 — Per-field debounce coalescing (PRD §11.3 Example 4)

- `getOrCreateDebounced(ms)`: ~650-682; per-interval memoized cache keyed by
  `ms`, stored in `fieldDebouncersRef: Map<number, DebouncedFunction>`
  declared ~225.
- **Fields sharing `ms` share one timer** — cache keyed by `ms` (~651-652).
- **Faster timer submits whole pending batch** — `executeAutoSave` copies
  BOTH `pendingChangedFields` + `pendingAffectedFields` (~555-558).
- **Slower timer that fires with nothing pending is a no-op** —
  `executeAutoSave` early-returns when `changedFields.size === 0` (~566-568).

### Behavior 4 — `changeField` 3-way branch (PRD §11.2)

`changeField` at ~358-392. Three-way branch on `inputConfig.debounce`:
- `false` → immediate `executeAutoSaveRef.current?.()` (~376-378).
- `number` → `getOrCreateDebouncedRef.current?.(fieldDebounce)()` (~382).
- `undefined` → `debouncedSubmitRef.current?.()` (Form-level fallback)
  (~385-388).

### Success Criteria

- [ ] All four behaviors walked against current source; each has a line citation.
- [ ] Outcome recorded: either "no drift, already ships" (with citations) OR a gap report.
- [ ] No code modified UNLESS a genuine gap was found (and if found, minimal fix + Mode A docs ride-along).
- [ ] Record is written to a location consumable by P1.M1.T1.S2 / P1.M1.T2.

## All Needed Context

### Context Completeness Check

_Pass._ This is a read-only audit. The spec (PRD §11.1–§11.3), the
architecture audit (with verified line numbers), and the single source file
(`Form.tsx`) fully define the work. No prior codebase knowledge is needed
beyond "open Form.tsx, walk these four behaviors, record citations."

### Documentation & References

```yaml
# MUST READ
- url: PRD §11.1 (heading:h3.48) — "Behavior", point 4 (scoped validity gate)
  why: The core behavioral requirement being audited (unrelated invalid field must NOT block a valid edit).
  critical: "Validity is scoped to what this save can touch… Whole-form validity is still enforced on a full manual submit."

- url: PRD §11.2 (heading:h3.49) — "Implementation" (the executeAutoSave code block + changeField)
  why: The reference implementation pseudocode to walk against. Lists pendingChangedFields, getAffectedFields, Gate 1, Gate 2, the no-whole-form-check note, and the execution-version abort.
  critical: "NOTE: no whole-form validity check here — the two gates above already cover exactly the fields this save can touch."

- url: PRD §11.3 (heading:h3.50) — "Debounce Behavior", Example 4 (coalescing-by-interval)
  why: Defines per-interval coalescing: fields sharing ms share one timer; faster timer submits whole pending batch; slower timer with nothing pending is a no-op.
  critical: "Pending changes accumulate across ALL fields, so the faster timer submits the whole pending batch, and a slower timer that fires with nothing new pending is a no-op."

- docfile: plan/004_8583c4771a2e/architecture/autosave-impl-audit.md
  why: The prior architecture audit — verified line-number citations for all four behaviors. Re-confirm these at execution time (lines may have drifted).
  section: "§1 Scoped Validity Gate", "§2 executeAutoSave Function", "§3 Per-Field Debounce Coalescing", "§4 changeField Branching"
  critical: "Summary: All four specified behaviors are implemented and match the PRD spec. No discrepancies found." The implementing agent must independently re-confirm, not blindly trust.

- file: packages/react/src/components/Form.tsx
  section: "executeAutoSave (~549-648); changeField (~358-392); getOrCreateDebounced (~650-682); getAffectedFields (~338-356); refs declared ~202-228"
  why: THE file under audit. All four behaviors live here.
  pattern: executeAutoSave is an async useCallback; changeField is a useCallback with a 3-way branch; getOrCreateDebounced caches in a Map<number, DebouncedFunction>.
  gotcha: "Line numbers in this PRP are from research time (file = 879 lines). RE-LOCATE each symbol before citing (grep for the symbol name, don't trust the number blindly)."

- file: packages/react/src/components/Form.tsx
  section: "comment block ~620-629 (the explicit no-whole-form-check NOTE)"
  why: This is the single most important citation — it proves the scoped gate is intentional, not accidental.
  pattern: "// NOTE: we intentionally do NOT bail on whole-form errors here… Rejecting on *any* unrelated field's error would silently drop a valid edit…"
  gotcha: "Confirm there is NO methods.formState.isValid read and NO bare methods.trigger() (no args = whole form) in executeAutoSave."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/components/
  Form.tsx              # ← THE audit target (read-only unless a gap is found)
# (no files added; this is an audit, not an implementation)
```

### Desired Codebase tree with files to be added

```bash
# The audit RECORD is the deliverable. Write it to the work item's research/
# directory (or as a PR comment), NOT into packages/:
plan/004_8583c4771a2e/P1M1T1S1/
  audit-record.md       # NEW — the confirmation/gap record (the deliverable)
# Form.tsx is touched ONLY if a real gap is found.
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: This is a READ-ONLY audit by default. Do NOT modify Form.tsx unless
// a genuine discrepancy is found. If all four behaviors match, the deliverable
// is a confirmation record, not a code change.

// CRITICAL: Re-locate every symbol before citing. The file was 879 lines at
// research time; line numbers drift. Use `grep -n` on the symbol name
// (executeAutoSave, changeField, getOrCreateDebounced, pendingChangedFields,
// executionVersionRef, invertedSubscriptions) and cite the CURRENT line.

// GOTCHA: The scoped gate has TWO distinct gates — don't conflate them:
//   Gate 1 (~585-591): changed-field onChange error → methods.getFieldState(name).error
//   Gate 2 (~594-616): affected-field revalidation → methods.trigger(affectedFields)
// Both must be present, and neither must be a whole-form check.

// GOTCHA: "No whole-form validity check" is proven TWO ways:
//   (a) the explicit comment block (~620-629), AND
//   (b) absence of methods.formState.isValid reads and bare methods.trigger() calls
//       (methods.trigger() with NO args validates the whole form).
// Confirm both.

// GOTCHA: The execution-version abort must re-check after EVERY await, not just once.
// There are multiple await points (~579-583, ~598-600, ~612-616). Each must compare
// executionVersionRef.current !== executionVersion and return on mismatch.

// GOTCHA: Coalescing correctness hinges on executeAutoSave copying BOTH pending sets
// (pendingChangedFields AND pendingAffectedFields) before clearing. If it only copied
// changedFields, the "faster timer submits whole pending batch" guarantee would break.

// GOTCHA: getOrCreateDebounced cache is keyed by ms (number), in fieldDebouncersRef
// (a Map<number, DebouncedFunction>). Fields sharing the same ms share one timer entry.

// GOTCHA: The changeField branch keys off inputConfig?.debounce with strict equality:
//   === false → immediate; typeof === "number" → per-field timer; else → Form-level.
// A truthy non-number (e.g. debounce: true) would fall to the else branch — confirm
// the spec only contemplates false | number | undefined (it does, per §6.3.3).
```

## Implementation Blueprint

### Data models and structure

Not applicable — this is an audit. No data models change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: RE-LOCATE all audit symbols in the current Form.tsx
  - GREP: `grep -n "executeAutoSave\|pendingChangedFields\|pendingAffectedFields\|executionVersionRef\|getOrCreateDebounced\|invertedSubscriptions\|getAffectedFields\|fieldDebouncersRef\|debouncedSubmit" packages/react/src/components/Form.tsx`
  - RECORD: the current line number for each symbol (lines drift from the architecture-audit citations).
  - WHY: Every citation in the record must point at the CURRENT line, not a stale number.

Task 2: WALK Behavior 1 — Scoped validity gate (PRD §11.1 point 4)
  - READ executeAutoSave in full.
  - CONFIRM Gate 1: a loop over changedFields checking methods.getFieldState(name).error → early return. Cite lines.
  - CONFIRM Gate 2: methods.trigger(fieldsToTrigger) where fieldsToTrigger is affected-only (NOT changed, NOT whole-form) → return if !isValid. Cite lines.
  - CONFIRM the explicit "no whole-form check" comment block exists. Cite lines.
  - CONFIRM absence: grep executeAutoSave body for `formState.isValid` and bare `methods.trigger()` (no args) → expect NONE.
  - RECORD: "Behavior 1 — MATCHES" with the four citations, or a gap report.

Task 3: WALK Behavior 2 — executeAutoSave structure (PRD §11.2)
  - CONFIRM pendingChangedFields: declared, populated in changeField, copied+cleared at top of executeAutoSave. Cite each.
  - CONFIRM pendingAffectedFields: same lifecycle. Cite each.
  - CONFIRM getAffectedFields: traverses invertedSubscriptions (transitive). Cite lines.
  - CONFIRM execution-version abort: executionVersionRef incremented+captured at entry; re-checked after EVERY await (enumerate each await point). Cite each.
  - RECORD: "Behavior 2 — MATCHES" with citations, or a gap report.

Task 4: WALK Behavior 3 — Per-field debounce coalescing (PRD §11.3 Example 4)
  - CONFIRM getOrCreateDebounced(ms): cache in fieldDebouncersRef Map<number, ...>, keyed by ms. Cite lines.
  - CONFIRM "fields sharing ms share one timer": cache lookup is by ms. Cite lines.
  - CONFIRM "faster timer submits whole pending batch": executeAutoSave copies BOTH pending sets. Cite lines.
  - CONFIRM "slower timer no-ops when nothing pending": executeAutoSave early-returns on changedFields.size === 0. Cite lines.
  - RECORD: "Behavior 3 — MATCHES" with citations, or a gap report.

Task 5: WALK Behavior 4 — changeField 3-way branch (PRD §11.2)
  - READ changeField in full.
  - CONFIRM the 3-way branch on inputConfig?.debounce:
      === false → executeAutoSaveRef.current?.() (immediate);
      typeof === "number" → getOrCreateDebouncedRef.current?.(ms)();
      else → debouncedSubmitRef.current?.() (Form-level fallback).
  - Cite the lines for each branch.
  - RECORD: "Behavior 4 — MATCHES" with citations, or a gap report.

Task 6: WRITE the audit record (the deliverable)
  - CREATE plan/004_8583c4771a2e/P1M1T1S1/audit-record.md (or append to research/).
  - IF all four match: write "## Outcome: no drift, already ships" + a citation table (behavior → PRD ref → Form.tsx lines → evidence quote).
  - IF any gap: write "## Outcome: GAP FOUND" + the specific behavior, the expected vs actual, the minimal fix scope, and any Mode A docs that ride with it.
  - THE RECORD is the deliverable — it feeds P1.M1.T1.S2 (tests) and gates P1.M1.T2 (docs).

Task 7 (conditional — ONLY if a gap was found): scope the minimal fix
  - IF a gap exists: write the minimal Form.tsx edit needed (do NOT implement broad refactors).
  - NOTE any doc the fix touches (Mode A ride-along).
  - IF no gap: SKIP this task entirely. Do not edit Form.tsx.

Task 8: SANITY CHECK (if no code change)
  - RUN: `pnpm typecheck && pnpm test` — confirm the audit process introduced no accidental edits (git diff should be empty for Form.tsx when no gap was found).
  - EXPECT: clean. (Only the audit-record.md is new.)
```

### Implementation Patterns & Key Details

```typescript
// Audit method — for each behavior, produce a citation entry like:
//
// ### Behavior N — <name> (PRD §X)
// **Status:** ✅ MATCHES (or ❌ GAP)
// **PRD requirement:** <verbatim quote from §11.x>
// **Location:** packages/react/src/components/Form.tsx:<start>-<end>
// **Evidence:**
//   <verbatim 1-3 line quote from the source proving the match>
// **Notes:** <any nuance — e.g. "Gate 2 uses fieldsToTrigger which excludes changedFields">

// CRITICAL pattern for the "no whole-form check" proof — cite BOTH:
//   (a) the explicit comment block (~620-629), verbatim; AND
//   (b) a negative grep result: "grep for formState.isValid / bare methods.trigger() in
//       executeAutoSave body → 0 matches" — proving the absence, not just the comment's presence.

// PATTERN: when citing coalescing, show the TWO pending-set copy lines together — that's
// the mechanical proof that the faster timer submits the whole batch.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
SOURCE:
  - packages/react/src/components/Form.tsx — READ-ONLY (unless a gap is found).
OUTPUTS (the deliverable):
  - plan/004_8583c4771a2e/P1M1T1S1/audit-record.md — the confirmation/gap record.
DOWNSTREAM CONSUMERS:
  - P1.M1.T1.S2 (test audit): reads this record to know which behaviors need test coverage.
  - P1.M1.T2.S1 (doc sweep): runs only AFTER this audit confirms the runtime.
DOCS: none — read-only audit. If a gap fix touches a doc, it rides with the fix (Mode A).
```

## Validation Loop

> This is a read-only audit. The "validation" is the rigor of the source
> walk, not a test run. Levels 1-3 apply only if a code fix was made.

### Level 1: Audit Rigor (always — this IS the validation)

```bash
# Re-locate every symbol (lines drift from the architecture-audit citations)
grep -n "executeAutoSave\|pendingChangedFields\|pendingAffectedFields\|executionVersionRef\|getOrCreateDebounced\|invertedSubscriptions\|getAffectedFields\|fieldDebouncersRef" packages/react/src/components/Form.tsx

# Prove the "no whole-form check" by ABSENCE (the strongest proof):
# Extract executeAutoSave's body and grep for whole-form patterns.
sed -n '/const executeAutoSave = useCallback/,/}, \[methods, handleSubmit/p' packages/react/src/components/Form.tsx | grep -nE "formState\.isValid|methods\.trigger\(\s*\)"
# Expected: NO matches. (A match would be a GAP — whole-form validity leak.)

# Confirm the explicit comment block exists:
grep -n "intentionally do NOT bail on whole-form" packages/react/src/components/Form.tsx
# Expected: exactly ONE match (the ~620-629 comment block).
```

### Level 2: Coverage Gate (only if a code fix was made)

```bash
# Run ONLY if Task 7 produced a Form.tsx edit.
pnpm test:coverage
# Expected: green (≥90% gate per PRD §1.3.7). If the audit found no gap, SKIP — no code changed.
```

### Level 3: Typecheck & Build (only if a code fix was made)

```bash
# Run ONLY if Task 7 produced a Form.tsx edit.
pnpm typecheck
pnpm --filter @formality-ui/react build
# Expected: green. If no gap was found, SKIP.
```

### Level 4: Audit-Record Completeness (the real gate)

```bash
# The deliverable is the record. Confirm it has an entry for all four behaviors:
grep -cE "Behavior [1-4]" plan/004_8583c4771a2e/P1M1T1S1/audit-record.md
# Expected: 4 (one per behavior).

# Confirm each entry has a line citation:
grep -cE "Form\.tsx:[0-9]" plan/004_8583c4771a2e/P1M1T1S1/audit-record.md
# Expected: ≥4 (at least one citation per behavior).

# Confirm a clear outcome statement:
grep -E "no drift|GAP FOUND" plan/004_8583c4771a2e/P1M1T1S1/audit-record.md
# Expected: exactly one of the two.

# If no gap was found, confirm Form.tsx is untouched:
git diff --exit-code packages/react/src/components/Form.tsx
# Expected: exit 0 (no changes) when outcome is "no drift".
```

## Final Validation Checklist

### Technical Validation

- [ ] All four behaviors walked against current source (Task 2-5).
- [ ] Every citation uses a CURRENT line number (re-located in Task 1, not the stale architecture-audit number).
- [ ] "No whole-form check" proven by BOTH the comment block AND a negative grep (0 matches for `formState.isValid` / bare `methods.trigger()`).
- [ ] Execution-version abort confirmed re-checked after EVERY await (enumerate each).
- [ ] Coalescing proof cites the TWO pending-set copy lines (changed + affected).
- [ ] If no gap: `git diff --exit-code packages/react/src/components/Form.tsx` → exit 0.

### Feature Validation

- [ ] Behavior 1 (scoped gate): MATCHES or GAP — recorded with citations.
- [ ] Behavior 2 (executeAutoSave structure): MATCHES or GAP — recorded with citations.
- [ ] Behavior 3 (per-field debounce coalescing): MATCHES or GAP — recorded with citations.
- [ ] Behavior 4 (changeField 3-way branch): MATCHES or GAP — recorded with citations.
- [ ] Outcome unambiguous: exactly one of "no drift, already ships" / "GAP FOUND".

### Code Quality Validation

- [ ] No code modified unless a genuine gap was found.
- [ ] If a gap was found: the fix is MINIMAL (no incidental refactors).
- [ ] If a gap was found: any doc the fix touches is noted (Mode A ride-along).
- [ ] The audit record is self-contained (a reader can verify each claim from the citations).

### Documentation & Deployment

- [ ] The audit record is written to `plan/004_8583c4771a2e/P1M1T1S1/audit-record.md` (consumable by S2/T2).
- [ ] No README/example/JSDoc edits unless a gap fix required it (Mode A).
- [ ] No new env vars or config.

---

## Anti-Patterns to Avoid

- ❌ Don't blindly trust the architecture-audit line numbers — re-locate each symbol (`grep -n`) before citing. Lines drift.
- ❌ Don't modify Form.tsx "to be safe" — this is read-only unless a real gap is found. An unnecessary edit is scope creep.
- ❌ Don't conflate Gate 1 (changed-field `getFieldState().error`) with Gate 2 (affected-field `methods.trigger`). They're distinct.
- ❌ Don't cite only the comment block for "no whole-form check" — also prove it by a negative grep for `formState.isValid` and bare `methods.trigger()`. Absence is the stronger proof.
- ❌ Don't forget the execution-version abort must re-check after EVERY await — missing one is a stale-save bug. Enumerate each await point.
- ❌ Don't cite only `pendingChangedFields` for coalescing — the "faster timer submits whole batch" guarantee needs BOTH pending sets copied. Cite both lines.
- ❌ Don't edit tests (P1.M1.T1.S2), examples, or READMEs (P1.M1.T2.S1) in this subtask.
- ❌ Don't skip writing the record — the record (not the code walk) is the deliverable.

---

## Confidence Score

**10/10** — one-pass success likelihood.

Rationale: This is a read-only audit, and the architecture audit + live-source
re-verification during PRP research already confirmed all four behaviors
match at exact line numbers (file = 879 lines, all citations current). The
implementing agent's task is mechanical: re-locate each symbol, walk the four
behaviors, and write a citation record. The only "failure mode" is citing a
stale line number — mitigated by Task 1's mandatory `grep -n` re-location
step. There is no realistic scenario where a competent agent cannot complete
this audit and produce the record. The expected outcome is "no drift,
already ships."
