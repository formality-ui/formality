name: "P1.M3.T1.S1 — Update packages/react/README.md with auto-save API accuracy"
description: |

---

## Goal

**Feature Goal**: Make `packages/react/README.md` **accurately document the
full auto-save API surface** for the bugfix changeset
(`001_e5d9d673f6fd`): per-field debounce overrides (`InputConfig.debounce:
number | false | undefined`) and the coalescing model, the `submitImmediate()`
flush semantics, the `DebouncedFunction` contract (`cancel` / `flush` /
`pending`) surfaced via context, and a `debounce` prop type correction. This is
the **Mode B changeset-level doc sweep** (PRD h2.0/h2.4) that surfaces the
fixes landed in P1.M1.T1 (submitImmediate per-field flush), P1.M1.T2
(isDisabled known-issue tracking), and P1.M2.T1 (pending() correctness).

**Deliverable**: An **edited** `packages/react/README.md` (one file) that:
1. **EXPANDS** the `## Auto-Save` section (currently bare, L279–295) to document
   per-field `InputConfig.debounce` overrides and coalescing, `submitImmediate()`
   (flush pending auto-save immediately), and the `DebouncedFunction` contract
   (`debouncedSubmit.cancel/flush/pending` via `useFormContext()`).
2. **FIXES** the `debounce` row in the Form Props table (L143): `number` →
   `number | false` (matches the real `FormProps.debounce` type).
3. **VERIFIES** (does NOT rewrite) the existing `## Known Issues` section
   (L658–665) already links to `./KNOWN_ISSUES.md` for the isDisabled limitation.
4. **VERIFIES** (does NOT touch) `examples/06-auto-save.tsx` Example 4 still
   accurately describes scoped validation.

**Success Definition**:
- Every auto-save symbol named in the new README text resolves to a real export
  / source location (grep harness in research note §6 → all "OK").
- `submitImmediate` is documented where it ACTUALLY lives
  (`FormContextValue` / `useFormContext()`), and is **NOT** fabricated as a row
  in the Form render-prop (`FormRenderAPI`) table — see Accuracy Trap.
- The `debounce` prop type in the Form Props table matches `Form.tsx:71`
  (`number | false`).
- The Known Issues link resolves to the real `packages/react/KNOWN_ISSUES.md`.
- Example 4 is unchanged and still describes scoped validation.
- `git diff --stat` shows **exactly one file**: `packages/react/README.md`.

## User Persona (if applicable)

**Target User**: React adapter consumer integrating auto-save (the driving
downstream consumer hit the per-field debounce + flush gaps). Secondary:
contributors who need to know `submitImmediate` flushes per-field timers.

**Use Case**: A consumer wants (a) different debounce cadences per input type
(e.g. a switch saves immediately, a text field waits 2s), (b) a "Save Now"
button that flushes pending debounced saves immediately, and (c) to know
whether a save is pending (`debouncedSubmit.pending()`).

**User Journey**:
1. Reads `## Auto-Save` → learns `InputConfig.debounce` overrides per input and
   that fields sharing an ms coalesce into one timer.
2. Sees `submitImmediate()` documented as the flush API (via `useFormContext()`)
   and wires a "Save Now" button to it.
3. Sees the Known Issues pointer and avoids the `isDisabled` matcher.

**Pain Points Addressed**:
- Per-field debounce is implemented but undocumented → consumers don't know the
  override exists or how coalescing works.
- `submitImmediate` is destructured in the `useFormContext` example with no
  description → consumers don't know it flushes per-field + form-level timers.
- `DebouncedFunction.pending()` was buggy (Issue 3) and undocumented; now fixed
  but still undocumented.
- The `debounce` prop table says `number` but the real type is `number | false`.

## Why

- **PRD h2.0 (Overview)** — the Mode-B doc sweep is explicitly validated as
  "correct and complete" for the prior round, and this changeset adds the
  auto-save API accuracy that round didn't cover (per-field debounce,
  submitImmediate flush, pending()).
- **PRD h2.4 (Testing Summary)** — "Areas needing more attention: Integration
  of the per-field debounce cache with the rest of the FormContext auto-save API
  (`submitImmediate` — Issue 1; `pending()` — Issue 3)." Documenting these is the
  durable, consumer-facing closure of that gap.
- **Item contract (OUTPUT)** — "README.md accurately documents the auto-save API
  surface including per-field debounce and submitImmediate. A Known Issues
  section links to KNOWN_ISSUES.md."
- **Sequencing / parallel context**: Depends on P1.M1.T1 (submitImmediate flush
  — COMPLETE), P1.M1.T2 (KNOWN_ISSUES.md — COMPLETE), P1.M2.T1 (pending() fix —
  COMPLETE). Runs in parallel with P1.M2.T2.S1 (forwardRef test cleanup —
  verify-only, NO README touch, zero overlap). Sibling P1.M3.T1.S2 owns
  CHANGELOG.md (not README) — no overlap.

## What

A surgical, mostly-**additive** edit to a single markdown file. No code, no
tests, no runtime, no config, no CHANGELOG (sibling S2 owns it), no
KNOWN_ISSUES.md (P1.M1.T2.S2 owns it), no examples file (verify-only). The new
content is transcribed from / checked against the real source
(`Form.tsx`, `FormContext.ts`, `types.ts`, core `config.ts`).

### Success Criteria

- [ ] `## Auto-Save` section documents per-field `InputConfig.debounce`
      (`number | false | undefined`) and the coalescing-by-ms model.
- [ ] `## Auto-Save` section (or `### useFormContext`) documents `submitImmediate`
      as "Flush pending auto-save immediately" AND states it is accessed via
      `useFormContext()` (NOT the Form render prop).
- [ ] `DebouncedFunction` contract (`cancel` / `flush` / `pending`) documented
      for `debouncedSubmit`; `pending()` noted as reliable (Issue 3 fixed).
- [ ] Form Props table `debounce` row fixed: `number` → `number | false`.
- [ ] `## Known Issues` section verified to link to `./KNOWN_ISSUES.md`
      (already exists — no rewrite).
- [ ] Example 4 (`examples/06-auto-save.tsx`) verified unchanged, still scoped.
- [ ] `git diff --stat` shows exactly one file: `packages/react/README.md`.
- [ ] `submitImmediate` is NOT added to the Form render-prop (`FormRenderAPI`)
      table (accuracy — see All Needed Context).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the exact file to
edit, the precise API surface (types + behavior) transcribed from source, the
**accuracy trap** that `submitImmediate` is on `FormContextValue` not
`FormRenderAPI`, the list of what is already done (Known Issues, Example 4) so
they don't redo it, and the sibling boundaries. All cited below with exact
paths/lines. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M3T1S1/research/auto-save-api-audit.md
  why: |
    THIS TASK'S FIELD GUIDE. Contains: the verify-and-extend audit table (what's
    already done vs. genuinely missing), the exact auto-save API surface
    transcribed from source with line numbers, the ACCURACY TRAP about where
    submitImmediate lives, the README section map, the sibling boundaries, and
    the grep verification harness. READ THIS FIRST — it prevents redoing
    already-done work and prevents the submitImmediate-table accuracy bug.

- file: packages/react/README.md
  why: THE file to edit (669 lines). Read it end-to-end first; note its markdown
        style (## headers, ```tsx fences, | Prop | Type | Description | tables).
  sections: |
    L111  ### Form           (Props table L136 — debounce row WRONG; Render API table L141)
    L279  ## Auto-Save       (BARE L279–295 — EXPAND here)
    L298  ### useFormContext (destructures submitImmediate L304, no description)
    L658  ## Known Issues    (ALREADY EXISTS — verify only)
  gotcha: |
    The README already has ## Type Safety (L453) and ## Testing & Coverage
    (L631) from a PRIOR plan. Those are NOT this task's concern — do not touch
    them. This task is strictly the auto-save API accuracy + Known Issues verify.

- file: packages/react/src/components/Form.tsx
  why: Source of truth for the auto-save behavior. Key spots:
        L63–71   FormProps.debounce JSDoc (type `number | false`, default 1000)
        L158     debounce default = 1000
        L215     pendingChangedFields (shared accumulator)
        L225     fieldDebouncersRef (per-ms coalesced cache)
        L372–387 changeField debounce routing (false/number/undefined)
        L726–745 submitImmediate (flush BOTH sources, no-op if idle, run once)
        L862–884 wrapDebounced (pending() now tracks real state — Issue 3)
  critical: |
    FormRenderAPI (L82–110) does NOT include submitImmediate. Its members are
    unusedFields / formState / methods / handleSubmit / resolvedTitle. Do NOT
    document submitImmediate as a Form render-prop field.

- file: packages/react/src/context/FormContext.ts
  why: |
    Defines FormContextValue (L20). submitImmediate (L127) and debouncedSubmit
    (L124, a DebouncedFunction) live HERE — accessed via useFormContext() (L162).
    This is where submitImmediate + debouncedSubmit MUST be documented as living.

- file: packages/react/src/types.ts
  section: DebouncedFunction interface (L117–123)
  why: |
    The public contract for debouncedSubmit: `(): void`, `cancel()`, `flush()`,
    `pending()`. Document all four in the Auto-Save section. pending() is now
    reliable (Issue 3 fixed in wrapDebounced, Form.tsx:862–884).

- file: packages/core/src/types/config.ts
  section: InputConfig.debounce (L68–81)
  why: |
    Source of truth for the per-field override type `debounce?: number | false`
    and the coalescing/fallback semantics (false=immediate; number=per-ms
    coalesced timer; unset=Form-level fallback). Transcribe the routing table.

- file: packages/react/KNOWN_ISSUES.md
  why: |
    The TARGET of the README's Known Issues link (already linked at L660).
    Comprehensive (Symptom/Root cause/Workarounds/Future fix/References). Do NOT
    edit — owned by P1.M1.T2.S2. Verify the README's one-liner is consistent
    with this file's "## isDisabled ..." heading.

- file: examples/06-auto-save.tsx
  section: Example 4 (L320, "Auto-Save with Validation"); L322 + L372
  why: |
    VERIFY ONLY — do NOT edit. Example 4 already describes scoped validation
    ("Auto-save validates only the changed field (and its dependents) before
    saving"). The item explicitly forbids changing it. Confirm the two scoped
    lines are present, then leave the file untouched.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/system_context.md
  section: "Auto-Save Architecture (Form.tsx)" + "Issue-by-Issue Status"
  why: |
    The architecture doc's own statement of the auto-save design (key refs
    table, debounce routing, coalescing, submitImmediate, wrapDebounced) and the
    per-issue status (Issues 1/3 FIXED, Issue 2 limitation tracked). Grounds the
    README's behavior claims.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M2T2S1/PRP.md
  section: "⚠️ CRITICAL CONTEXT — READ FIRST" banner
  why: |
    The PARALLEL SIBLING. It is verify-only (forwardRef test cleanup already
    shipped) and touches NO README content. Confirms zero file overlap with
    this task (S1 = README.md only; S2[P1M2.T2.S1] = test files only).

- url: https://lodash.com/per-day/docs/debounce
  why: |
    Formality's debouncers wrap lodash `debounce` (Form.tsx:18). The
    cancel/flush/pending semantics mirror lodash's. Cite if useful for the
    DebouncedFunction contract description; the README should stay focused on
    Formality's surface, not lodash internals.
```

### Current Codebase tree (relevant slice)

```bash
packages/react/README.md                       # ← THE file to EDIT (auto-save accuracy)
packages/react/src/components/Form.tsx         # auto-save source of truth (submitImmediate, routing, wrapDebounced)
packages/react/src/context/FormContext.ts      # FormContextValue — where submitImmediate/debouncedSubmit live
packages/react/src/types.ts                    # DebouncedFunction interface (cancel/flush/pending)
packages/core/src/types/config.ts              # InputConfig.debounce type
packages/react/KNOWN_ISSUES.md                 # link TARGET (verify, do not edit)
packages/react/CHANGELOG.md                    # NOT in scope (sibling P1.M3.T1.S2 owns it)
examples/06-auto-save.tsx                      # Example 4 — verify only, do NOT edit
plan/004_.../P1M3T1S1/research/auto-save-api-audit.md  # field guide
```

### Desired Codebase tree with files to be modified

```bash
packages/react/README.md   # MODIFIED — expand ## Auto-Save; fix debounce prop type;
                          #            (verify Known Issues + Example 4, no edit to those)
# (no other files change)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (ACCURACY TRAP): submitImmediate is NOT on FormRenderAPI. The Form
// render-prop table (Form.tsx:82–110 FormRenderAPI: unusedFields/formState/
// methods/handleSubmit/resolvedTitle) does NOT include it. submitImmediate and
// debouncedSubmit are on FormContextValue (FormContext.ts:124/127), reached via
// useFormContext(). Document them THERE (Auto-Save section +/or useFormContext),
// NEVER as a row in the Form render-prop table. Adding a wrong row is a doc bug.

// CRITICAL: the debounce Form prop type is `number | false` (Form.tsx:71), NOT
// `number`. The README Form Props table (L143) currently says `number` — FIX it.
// false = submit immediately (no timer); default = 1000 (Form.tsx:158).

// CRITICAL: per-field InputConfig.debounce is `number | false | undefined`
// (core config.ts:81). The three-way routing (Form.tsx:372–387):
//   false      → immediate (no timer)
//   <number>   → per-field timer, COALESCED BY MS (fields sharing an ms share
//                ONE timer in fieldDebouncersRef; pending changes accumulate in
//                pendingChangedFields and save together)
//   undefined  → fall back to Form-level debounce
// Document all three branches + the coalescing model. Do not imply per-field
// timers are per-field-NAME (they are per-ms).

// CRITICAL: pending() is now RELIABLE (Issue 3 fixed). wrapDebounced
// (Form.tsx:862–884) tracks an isPending flag; the immediate adapter (false)
// hardcodes pending: () => false. Do NOT carry any stale "pending() always
// returns false" caveat into the README — that was the bug, now fixed.

// CRITICAL (SCOPE): this task edits ONLY packages/react/README.md.
//   - Do NOT edit packages/react/CHANGELOG.md (sibling P1.M3.T1.S2).
//   - Do NOT edit packages/react/KNOWN_ISSUES.md (P1.M1.T2.S2's deliverable).
//   - Do NOT edit examples/06-auto-save.tsx (verify only; item forbids changes).
//   - Do NOT touch the ## Type Safety / ## Testing & Coverage sections (prior plan).

// GOTCHA: The existing ## Known Issues section (L658–665) already links to
// ./KNOWN_ISSUES.md. VERIFY it; do not rewrite. If (and only if) the link text
// or one-liner is factually wrong, make a minimal correction — otherwise leave it.

// GOTCHA: Example 4's scoped-validation wording is correct and MUST NOT change.
// The item is explicit: "Do NOT change the existing scoped-validation description
// in Example 4 — the PRD confirmed the doc sweep is correct." This is verify-only.
```

## Implementation Blueprint

### Data models and structure

None — pure markdown documentation. No data models, no code generation.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — read the README + the source-of-truth files + the field guide
  - READ: plan/.../P1M3T1S1/research/auto-save-api-audit.md  (the field guide — FIRST)
  - READ: packages/react/README.md  (end to end; note L279 Auto-Save, L298 useFormContext,
           L136 Form Props table, L658 Known Issues — already-populated sections)
  - READ: packages/react/src/components/Form.tsx  (L63–71, L215, L225, L372–387,
           L726–745, L862–884 — the auto-save behavior)
  - READ: packages/react/src/context/FormContext.ts  (L124 debouncedSubmit, L127 submitImmediate)
  - READ: packages/react/src/types.ts  (L117–123 DebouncedFunction)
  - READ: packages/core/src/types/config.ts  (L68–81 InputConfig.debounce)
  - RUN the grep harness (research note §6) to confirm symbol locations BEFORE writing.
  - CONFIRM the accuracy trap: `sed -n '82,110p' Form.tsx | grep submitImmediate`
    → must be EMPTY (submitImmediate is NOT on FormRenderAPI).

Task 2: EXPAND the `## Auto-Save` section (L279–295) — the core of this task
  - FILE: packages/react/README.md
  - WHERE: in place at `## Auto-Save`. KEEP the existing basic `<Form autoSave
           debounce={2000}>` example as the intro; ADD content after it.
  - ADD three subsections (### level), each snippet-led and matching README style:
    2a. ### Per-field debounce overrides
        - State the type: `InputConfig.debounce?: number | false | undefined`.
        - Show a provider inputs example with three cadences: a switch
          (`debounce: false` → immediate), a textField (`debounce: 2000`),
          a select (`debounce: 500`).
        - Document the three-way routing (transcribe from Form.tsx:372–387):
            false      → submit immediately (no timer)
            <number>   → per-field timer at that ms
            undefined  → fall back to the Form-level `debounce` prop
        - Document COALESCING: fields sharing the same numeric debounce share a
          SINGLE timer (keyed by ms, not field name); all pending changes save
          together when the timer fires. (Source: fieldDebouncersRef Form.tsx:225.)
    2b. ### Flushing pending saves: submitImmediate()
        - State plainly: `submitImmediate()` flushes any pending auto-save
          immediately — BOTH per-field numeric timers AND the Form-level timer.
          No-op when nothing is pending (no spurious empty save). Runs the save
          pipeline exactly once. (Source: Form.tsx:726–745.)
        - State where it lives: accessed via `useFormContext()` (it is on
          FormContextValue, NOT the Form render prop). Cross-reference the
          `### useFormContext` section.
        - Show a "Save Now" button snippet:
            `const { submitImmediate } = useFormContext();`
            `<button onClick={() => submitImmediate()}>Save Now</button>`
    2c. ### The debounced submit handle (cancel / flush / pending)
        - Note that `useFormContext()` also exposes `debouncedSubmit`, a
          `DebouncedFunction` (types.ts:117–123) with:
            ()         → schedule the debounced invocation
            .cancel()  → cancel any pending invocation
            .flush()   → immediately execute any pending invocation
            .pending() → true if an invocation is scheduled
        - Note `pending()` is reliable (tracks real scheduled state); for most
          UI needs prefer `submitImmediate()` (it handles both timer sources +
          the cancel-race). (Source: wrapDebounced Form.tsx:862–884, Issue 3.)
  - STYLE: match existing README (### headers under ##, ```tsx fences, terse
           prose, tables only where they add value).

Task 3: FIX the Form Props `debounce` row (accuracy)
  - FILE: packages/react/README.md (Form Props table ~L136–143)
  - CHANGE: the `debounce` row's Type cell from `number` to `number | false`,
            and its Description to note `false` = submit immediately; default 1000.
  - SOURCE: Form.tsx:71 (`debounce?: number | false`) + Form.tsx:158 (default 1000).
  - PRESERVE: all other rows in the Form Props table and the Render API table.
    Do NOT add submitImmediate to the Render API table (accuracy trap).

Task 4: (LIGHT) pointer under `### useFormContext` (L298)
  - FILE: packages/react/README.md (the useFormContext section ~L298–310)
  - The existing destructure example already pulls `submitImmediate`. ADD a
    one-line note (or a tiny 2-row table) right after the example stating:
      `submitImmediate` — flush pending auto-save immediately (see Auto-Save).
      `debouncedSubmit` — the DebouncedFunction handle (cancel/flush/pending).
  - DO NOT duplicate the full Auto-Save content here; just point to §Auto-Save.
  - This ensures a reader who lands on useFormContext knows what these two are.

Task 5: VERIFY the already-done pieces (do NOT rewrite)
  - 5a. KNOWN ISSUES: confirm `## Known Issues` (L658–665) links to
        `./KNOWN_ISSUES.md` and the one-liner matches the file's heading. If (and
        only if) the link is broken or the one-liner is factually wrong, make a
        minimal correction. Otherwise LEAVE IT.
  - 5b. EXAMPLE 4: open `examples/06-auto-save.tsx`, confirm Example 4 (L320)
        still says "Auto-save validates only the changed field (and its
        dependents)" (L322/L372). DO NOT EDIT the file — verify only.
  - 5c. DO NOT touch ## Type Safety (L453) or ## Testing & Coverage (L631).

Task 6: VERIFY — accuracy, scope (run BEFORE considering the task done)
  - 6a. Run the grep harness from research note §6. Every symbol resolves;
        submitImmediate is NOT on FormRenderAPI; the debounce type matches source;
        KNOWN_ISSUES.md exists; Example 4 scoped wording present.
  - 6b. SCOPE: `git diff --stat` shows EXACTLY ONE file
        (`packages/react/README.md`). CHANGELOG.md, KNOWN_ISSUES.md,
        examples/06-auto-save.tsx, and all source/test files untouched.
  - 6c. CONTENT-ACCURACY CHECKLIST (re-read your new Auto-Save section against
        Form.tsx):
        - per-field routing shows all three branches (false/number/undefined).
        - coalescing described as by-ms (not by-field-name).
        - submitImmediate described as flushing BOTH sources + no-op-if-idle.
        - pending() described as reliable (no stale "always false" caveat).
        - submitImmediate/debouncedSubmit attributed to useFormContext(), NOT
          the Form render prop.
```

### Implementation Patterns & Key Details

```tsx
// PATTERN — per-field debounce provider example (transcribe routing from Form.tsx:372–387):
const inputs = {
  // switch saves IMMEDIATELY on click (no timer):
  switch:     { component: Switch,    defaultValue: false, debounce: false },
  // textField waits 2s after typing stops:
  textField:  { component: TextField, defaultValue: "",    debounce: 2000 },
  // select waits 0.5s:
  select:     { component: Select,    defaultValue: "",    debounce: 500 },
  // numberField falls back to the Form-level `debounce` prop:
  numberField:{ component: NumberField, defaultValue: 0 /* debounce: undefined */ },
};

// PATTERN — submitImmediate "Save Now" (FormContextValue via useFormContext):
function SaveNowButton() {
  const { submitImmediate } = useFormContext();
  return <button onClick={() => submitImmediate()}>Save Now</button>;
}
// submitImmediate() flushes BOTH per-field and Form-level timers; no-op if idle.

// PATTERN — DebouncedFunction handle (types.ts:117–123):
const { debouncedSubmit } = useFormContext();
debouncedSubmit.cancel();   // cancel the pending save
debouncedSubmit.flush();    // fire the pending save now
debouncedSubmit.pending();  // true if a save is scheduled (reliable — Issue 3 fixed)

// GOTCHA for prose: "submitImmediate() and debouncedSubmit are on FormContextValue,
// accessed via useFormContext() — they are NOT part of the <Form> render-prop API."
```

### Integration Points

```yaml
DOCUMENTATION (this task):
  - file: packages/react/README.md
  - change: EXPAND ## Auto-Save (per-field debounce + submitImmediate + DebouncedFunction);
            FIX Form Props `debounce` row (number → number | false);
            (light) pointer under ### useFormContext.
  - verify: ## Known Issues (L658) already links KNOWN_ISSUES.md — confirm, don't rewrite.

DOCUMENTATION (NOT in scope):
  - file: packages/react/CHANGELOG.md     → sibling P1.M3.T1.S2. Do not edit.
  - file: packages/react/KNOWN_ISSUES.md  → P1.M1.T2.S2's deliverable. Do not edit.
  - file: examples/06-auto-save.tsx       → verify only; item forbids changes.
  - sections ## Type Safety / ## Testing & Coverage → prior plan; do not touch.

CODE / TESTS / CONFIG:
  - change: NONE. Mode B documentation. No source/test/config edits.
```

## Validation Loop

### Level 1: Markdown & Style (Immediate Feedback)

```bash
# 1. Section structure intact; Auto-Save expanded in place:
grep -nE "^#{2,3} " packages/react/README.md
# Expected: `## Auto-Save` still present (L279 region) with new ### subsections;
# `## Known Issues` still present (~L658); no accidental header demotions.

# 2. Prettier (if configured on .md — accept its formatting for new lines):
pnpm exec prettier --check packages/react/README.md || \
  pnpm exec prettier --write packages/react/README.md

# 3. ESLint typically does NOT lint .md — not a gate for this file.
```

### Level 2: Accuracy — every documented symbol resolves (THE key gate)

```bash
# Run the harness from research note §6.
for sym in submitImmediate debouncedSubmit DebouncedFunction InputConfig; do
  grep -rn "\b$sym\b" packages/react/src/ packages/core/src/types/ >/dev/null \
    && echo "OK: $sym" || echo "MISSING: $sym  ← NOT FOUND — fix the README"
done
# Expected: all "OK", zero "MISSING".

# Confirm submitImmediate is NOT wrongly placed on FormRenderAPI in SOURCE:
sed -n '82,110p' packages/react/src/components/Form.tsx | grep -q submitImmediate \
  && echo "ERROR: source says submitImmediate IS on FormRenderAPI — re-check" \
  || echo "OK: submitImmediate is on FormContextValue, not FormRenderAPI"
# Then confirm the README did NOT add submitImmediate to the Form Render API table:
awk '/\*\*Render API:\*\*/,/### Field/' packages/react/README.md | grep -q submitImmediate \
  && echo "ERROR: README put submitImmediate in the Form Render API table (wrong)" \
  || echo "OK: README does not list submitImmediate in the Form render-prop table"

# Confirm the debounce prop type now matches source (number | false):
grep -nE "debounce .* number \| false" packages/react/README.md
# Expected: at least one hit in the Form Props table.
grep -n "debounce?: number | false" packages/react/src/components/Form.tsx
# Expected: one hit (FormProps) — the README must agree with this.
```

### Level 3: Link & cross-reference integrity

```bash
# 1. Known Issues link resolves:
grep -oE "\./KNOWN_ISSUES\.md" packages/react/README.md | head -1 \
  && test -f packages/react/KNOWN_ISSUES.md \
  && echo "OK: KNOWN_ISSUES.md link target exists" \
  || echo "MISSING: KNOWN_ISSUES.md link broken"

# 2. useFormContext pointer + Auto-Save cross-reference both exist:
grep -niE "useFormContext" packages/react/README.md | wc -l   # >= 2 (section + pointer)
grep -niE "submitImmediate" packages/react/README.md | wc -l  # >= 2 (Auto-Save + pointer/table)

# 3. Example 4 untouched + still scoped:
git diff --stat examples/06-auto-save.tsx   # Expected: no changes (empty)
grep -n "changed field (and its dependents)" examples/06-auto-save.tsx  # >= 1 hit
```

### Level 4: Scope & content-accuracy review (manual, final)

```bash
# 1. SCOPE — exactly one file changed:
git diff --stat
# Expected: ONLY packages/react/README.md. CHANGELOG.md, KNOWN_ISSUES.md,
# examples/06-auto-save.tsx, and all source/test/config untouched.

# 2. Three-way per-field routing documented:
grep -niE "debounce.*false|immediate|fall back|coalesc" packages/react/README.md
# Expected: hits covering false→immediate, number→per-field timer, undefined→fallback,
# and the coalescing-by-ms model.

# 3. submitImmediate flush semantics + no-op-if-idle:
grep -niE "flush|pending|no-op|nothing.*pending|both" packages/react/README.md
# Expected: text stating submitImmediate flushes BOTH sources and no-ops when idle.

# 4. No stale "pending() always returns false" caveat (that was the bug):
grep -niE "always returns false|never pending" packages/react/README.md
# Expected: NO matches in the auto-save context (pending() is now reliable).

# 5. Render-prop table unchanged (no submitImmediate row):
awk '/\*\*Render API:\*\*/,/### Field/' packages/react/README.md
# Expected: rows = methods / formState / unusedFields / resolvedTitle only.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: README structure intact; Auto-Save expanded with ### subsections; prettier clean.
- [ ] Level 2 passed: symbol grep all "OK"; submitImmediate NOT in Form Render API table; `debounce` type = `number | false`.
- [ ] Level 3 passed: KNOWN_ISSUES.md link resolves; useFormContext ↔ Auto-Save cross-refs present; Example 4 untouched + scoped.
- [ ] Level 4 passed: scope = one file; three-way routing + coalescing documented; submitImmediate flush + no-op documented; no stale pending() caveat.

### Feature Validation

- [ ] `## Auto-Save` documents per-field `InputConfig.debounce` (number | false | undefined) + coalescing.
- [ ] `## Auto-Save` documents `submitImmediate` (flush both sources, no-op if idle) via `useFormContext()`.
- [ ] `DebouncedFunction` (cancel/flush/pending) documented; `pending()` noted reliable.
- [ ] Form Props `debounce` row fixed to `number | false`.
- [ ] `## Known Issues` verified (already links KNOWN_ISSUES.md).
- [ ] Example 4 verified (unchanged, scoped).

### Code Quality Validation

- [ ] New sections match existing README tone, header depth, fence style, table shape.
- [ ] No contradictions with the existing basic Auto-Save example or Quick Start.
- [ ] All cross-references resolve (useFormContext ↔ Auto-Save ↔ Known Issues).
- [ ] submitImmediate/debouncedSubmit attributed to FormContextValue, never the render prop.

### Documentation & Deployment

- [ ] README is self-consistent; a consumer can wire per-field debounce + Save Now from it alone.
- [ ] CHANGELOG.md left for sibling P1.M3.T1.S2; KNOWN_ISSUES.md left for P1.M1.T2.S2; examples left untouched.

---

## Anti-Patterns to Avoid

- ❌ Don't add `submitImmediate` to the Form **Render API** table. It is on
  `FormContextValue` (`useFormContext()`), NOT `FormRenderAPI` (Form.tsx:82–110).
  Documenting it in the wrong table is a doc bug. (See Accuracy Trap.)
- ❌ Don't rewrite the `## Known Issues` section or `KNOWN_ISSUES.md`. The section
  already exists (L658–665) and links correctly; KNOWN_ISSUES.md is another task's
  deliverable. Verify only.
- ❌ Don't edit `examples/06-auto-save.tsx`. Example 4's scoped-validation wording
  is correct and the item explicitly forbids changes. Verify only.
- ❌ Don't edit `packages/react/CHANGELOG.md`. Sibling P1.M3.T1.S2 owns it.
- ❌ Don't carry a stale "`pending()` always returns false" caveat. That was Issue 3
  (the bug), now fixed in `wrapDebounced`. `pending()` is reliable.
- ❌ Don't describe per-field timers as per-field-NAME. They are per-ms (coalesced);
  fields sharing an ms share ONE timer. (fieldDebouncersRef, Form.tsx:225.)
- ❌ Don't leave the `debounce` prop type as `number`. The real type is
  `number | false` (Form.tsx:71); `false` = submit immediately.
- ❌ Don't touch `## Type Safety` or `## Testing & Coverage` — prior plan work,
  not this task's concern.
- ❌ Don't pad the Auto-Save section into an essay. Match the README's terse,
  snippet-led style; tables only where they add value.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **single-file, additive-plus-one-fix, documentation-only** task with
  the entire source of truth pre-read and distilled into the research note
  (`auto-save-api-audit.md`): exact API surface with line numbers, the
  verify-and-extend audit (so already-done work isn't redone), the accuracy trap
  (submitImmediate placement), and the grep harness.
- The biggest accuracy risk (documenting `submitImmediate` in the wrong table) is
  neutralized by an explicit Accuracy Trap section + a Level 2 grep that fails the
  task if `submitImmediate` appears in the Form Render API table.
- The second risk (redoing already-done Known Issues / Example 4 work) is
  neutralized by the audit table marking them VERIFY ONLY.
- The sibling-scope risk (touching CHANGELOG/KNOWN_ISSUES/examples) is bounded by
  the Level 4 `git diff --stat` one-file check.
- Residual 1 point: the depth/length of the Auto-Save expansion is a judgment
  call; the implementer must match the README's terse style (Task 2 makes this
  explicit, and the Anti-Patterns warn against essay-padding).
