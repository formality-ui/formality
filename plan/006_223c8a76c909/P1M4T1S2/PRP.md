name: "P1.M4.T1.S2 — Verify JSDoc consistency across all affected core and react exports (§6.4 field-level overrides)"
description: |

---

## Goal

**Feature Goal**: Verify that every JSDoc/source comment on the §6.4 "field-level overrides" affected exports — across `packages/core/src/` and `packages/react/src/` — references §6.4 consistently and uses uniform precedence wording ("the field-level value wins over the type-level value when `!== undefined`, so `null`/`false`/`0`/`""` are meaningful"). Close the ONE genuine consistency gap discovered in research (`InputConfig.defaultValue` has no field-level mention while its five sibling levers and its field-level counterpart do), and confirm there is no stale JSDoc describing pre-§6.4 behavior.

**Deliverable**: (1) A completed verification pass (grep + per-symbol walk) over 15 affected symbols, documented in this PRP's validation section. (2) One required JSDoc edit: extend `InputConfig.defaultValue`'s one-liner in `packages/core/src/types/config.ts:64` to mention the per-field override + §6.4.1. (3) Optional low-risk polish (clearly marked) for verbosity/falsy-enumeration parity. (4) Green `pnpm typecheck` and `pnpm test` (plus `pnpm lint` + `pnpm format:check`) proving nothing broke.

**Success Definition**: A maintainer grepping `§6.4` across `packages/core/src/` and `packages/react/src/` finds consistent references on every affected export, every field-override JSDoc uses the canonical `!== undefined` precedence wording, `InputConfig.defaultValue` is no longer the lone type-level lever without a field-level mention, and the full validation suite stays green.

## User Persona (if applicable)

**Target User**: Formality maintainers and contributors reading core/react source JSDoc (IDE hover, generated API docs, code review). Not the public README audience (that is the sibling task P1.M4.T1.S1).

**Use Case**: A maintainer hovers `InputConfig.defaultValue` / `FieldConfig.defaultValue` / `resolveFieldOverType` in their IDE and gets a consistent, §6.4-cross-referenced story of the field-over-type override rule — no symbol tells a different (or missing) version of the rule.

**Pain Points Addressed**: Today the implementing subtasks each updated the JSDoc on the symbols *they* touched (Mode A), but the ownership was split across 7 PRPs — leaving one quiet asymmetry (`InputConfig.defaultValue`) and several cosmetic phrasing variances. This sweep is the single place that audits the whole set at once.

## Why

- **Changeset-level documentation sync (Mode B).** This is the final JSDoc consistency sweep for the P1 "Field-Level Type Overrides (§6.4)" effort. All implementing subtasks (P1.M1 types+helper, P1.M2 initial-value resolution, P1.M3 React adapter wiring) are **Complete**. This task runs last to guarantee doc uniformity before the changeset ships.
- **Closes a real (if small) gap.** Research found exactly one genuine inconsistency: `InputConfig.defaultValue` is the only type-level lever with no field-level mention, while its five sibling `InputConfig` levers (`debounce`/`parser`/`formatter`/`valueField`/`getSubmitField`) and its field-level counterpart (`FieldConfig.defaultValue`, which cites §6.4.1) all have one. No implementing PRP owned this JSDoc (see `research/jsdoc-contract-matrix.md` Q1), so the sweep owns it.
- **Complementary to — not overlapping with — P1.M4.T1.S1.** The sibling task (running in parallel) edits the root **README.md** (user-facing markdown that deliberately *never* cites internal PRD `§` numbers). This task edits **source-file JSDoc** (which *does* cite `§6.4`). The two never touch the same file. See "Integration Points".

## What

A two-part change confined to **JSDoc / source comments only** in `packages/core/src/` and `packages/react/src/`:

1. **Verification (confirm, do not rewrite).** Walk the 15 affected symbols (listed under "Implementation Blueprint → Data models / symbol set"). Confirm each references §6.4 and uses the canonical precedence wording. Research already established that **all 15 currently pass** except the one fix below — the verification step exists to *prove* that fact on the tree the implementer actually sees (in case anything drifted) and to catch any new inconsistency. **Do NOT rewrite JSDoc that is already consistent** — that risks introducing churn/regressions and is out of scope.

2. **One required fix (the deliverable).** Extend `InputConfig.defaultValue`'s one-line JSDoc at `packages/core/src/types/config.ts:64` to add a field-level override mention + §6.4.1, mirroring the wording pattern of its five sibling `InputConfig` levers and noting the defaultValue-specific tier nuance (it is a new priority tier between `record`/`defaultValues` and the type default — *not* a bare `??`; §6.4.1/§13.1).

3. **Optional polish (clearly marked, low-risk, skip if time-pressed).** Verbosity parity within `FieldConfig`'s five terse sibling blocks, falsy-enumeration parity on `InputConfig.valueField`/`getSubmitField`, and §6.4.0-vs-§6.4.5 citation-attribution drift. See "Implementation Tasks → Task 4".

Do **NOT**:
- Touch `README.md` (that is P1.M4.T1.S1 — a different task, different file).
- Touch `PRD.md`, any `tasks.json`, any `prd_snapshot.md`, or any test file.
- Rewrite already-consistent JSDoc. This is a *consistency sweep*, not a restyling pass.
- Change any runtime behavior. No non-comment / non-JSDoc edits.

### Success Criteria

- [ ] Verification pass complete: every one of the 15 affected symbols references §6.4 (or is a barrel that intentionally carries no JSDoc) and uses the canonical precedence wording; documented via the grep commands in Validation Level 3.
- [ ] `InputConfig.defaultValue` (`packages/core/src/types/config.ts:64`) now mentions `FieldConfig.defaultValue`, the `!== undefined` rule, and §6.4.1.
- [ ] No stale JSDoc anywhere in `packages/core/src/` or `packages/react/src/` describes pre-§6.4 behavior.
- [ ] `pnpm typecheck` green. `pnpm test` green.
- [ ] `pnpm lint` green. `pnpm format:check` green.
- [ ] Only comment/JSDoc text changed; no behavior change; only files under `packages/core/src/` and `packages/react/src/` touched.

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes.** This PRP supplies: the complete 15-symbol audit with exact file:line citations and current JSDoc quotes (from `research/current-jsdoc-audit.md`), the JSDoc contracts each implementing subtask owed (from `research/jsdoc-contract-matrix.md`), the canonical precedence wording to enforce, the exact recommended replacement text for the one required fix, the project-validated commands, and explicit scope guards (what NOT to touch, including the parallel README task).

### Documentation & References

```yaml
# MUST READ — the two research notes that pin every finding with file:line citations
- docfile: plan/006_223c8a76c909/P1M4T1S2/research/current-jsdoc-audit.md
  why: Per-symbol audit of the CURRENT JSDoc state with file:line + verbatim quotes,
       plus the ranked CONSISTENCY GAPS list. This is the authoritative "what is true now".
  section: "CONSISTENCY GAPS — ranked concrete fixes"

- docfile: plan/006_223c8a76c909/P1M4T1S2/research/jsdoc-contract-matrix.md
  why: The JSDoc CONTRACT each of the 8 implementing subtasks owed, plus the 8 "open
       questions" the sweep must decide (esp. Q1 = InputConfig.defaultValue gap, Q2 =
       optional FieldConfig section header, Q5 = barrels carry no JSDoc by design).
  section: "Open questions the consistency sweep must decide"

# MUST READ — the PRD spec being referenced (§6.4) so the implementer can quote it precisely
- docfile: PRD.md
  why: The authoritative text of §6.4.0 (precedence rule), §6.4.1 (defaultValue tier),
       §6.4.5 (null/false/0/"" semantics). The JSDoc cites these anchors.
  section: "7. Field Configuration System" → "6.4 Field-Level Overrides" (§6.4.0–§6.4.5)

# MUST READ — the only file with a REQUIRED edit
- file: packages/core/src/types/config.ts
  why: (1) Contains the required fix site: InputConfig.defaultValue at line 64.
       (2) Contains the FieldConfig override block (lines 178-218) — the pattern to mirror.
       (3) Contains the shared section-header comment (lines 178-180) that carries the
           canonical rule for all six — verify it is intact.
  pattern: The five sibling InputConfig fields (debounce L78-82, parser L115-119,
           formatter L126-130, valueField L95-98, getSubmitField L105-108) each follow
           "Per-field override via `FieldConfig.X` (§6.4.Y); the field-level value wins
           when `!== undefined` (resolved via `resolveFieldOverType`, §6.4.0 …)".
  gotcha: FieldConfig.defaultValue (L184-186) already states the defaultValue-specific
          tier nuance. The InputConfig.defaultValue fix should reference the SAME §6.4.1
          (not §6.4.0) and note the tier-not-?? nuance — see "Implementation Patterns".

# READ — the other affected source files (verification targets, no edit expected)
- file: packages/core/src/config/defaults.ts
  why: resolveFieldOverType (L8-13 prose + L21-28 examples) and resolveInitialValue
       (L42-45, L57-59, L86-94). Both already canonical (full). Verify only.
- file: packages/react/src/overlays.ts
  why: ReactFieldConfig JSDoc (L65-69). Already canonical (core). Verify only.
- file: packages/react/src/hooks/useField.tsx
  why: parser/formatter override comment (L559-563). Already canonical (full). Verify only.
- file: packages/react/src/components/Form.tsx
  why: debounce comment (L387-391) + getSubmitField/valueField comment (L962-965).
       Both already canonical (core). Verify only.

# READ — the sibling task contract (DO NOT overlap it)
- docfile: plan/006_223c8a76c909/P1M4T1S1/PRP.md
  why: P1.M4.T1.S1 owns README.md ONLY and never cites § numbers. This task (S2) owns
       source JSDoc and DOES cite §6.4. Confirm the two tasks touch disjoint files.
  critical: Do NOT edit README.md. Do NOT remove §6.4 references from any source file.
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/types/config.ts      # REQUIRED EDIT (InputConfig.defaultValue L64); verify FieldConfig block L178-218
packages/core/src/config/defaults.ts   # VERIFY ONLY (resolveFieldOverType, resolveInitialValue)
packages/core/src/config/index.ts      # VERIFY (barrel — NO JSDoc by design, see contract Q5)
packages/core/src/index.ts             # VERIFY (barrel — NO JSDoc by design)
packages/react/src/overlays.ts         # VERIFY ONLY (ReactFieldConfig)
packages/react/src/hooks/useField.tsx  # VERIFY ONLY (parser/formatter comment L559-563)
packages/react/src/components/Form.tsx # VERIFY ONLY (debounce L387-391, submit specs L962-965)
README.md                              # OUT OF SCOPE — owned by P1.M4.T1.S1 (parallel task)
PRD.md                                 # READ-ONLY
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
packages/core/src/types/config.ts   # MODIFIED: InputConfig.defaultValue JSDoc extended (L64).
                                     # (Optional polish: FieldConfig sibling-block verbosity — see Task 4.)
# No new files. No behavior change. No other packages edited unless optional polish is taken.
```

### Known Gotchas of our codebase & Library Quirks

```text
# CRITICAL: prettier manages .ts/.tsx (NOT in .prettierignore) at printWidth 80. Multi-line
# JSDoc prose WILL be reflowed. ALWAYS run `pnpm format` after editing, then `pnpm format:check`.
# Do not hand-align JSDoc line breaks — prettier owns them.

# CRITICAL: This task's JSDoc DOES cite internal PRD §-numbers (§6.4.x) — that is the OPPOSITE
# convention from the README task (P1.M4.T1.S1), which forbids § refs. Do not "fix" §6.4 refs
# out of source files, and do not add § refs to README.md.

# GOTCHA: InputConfig.defaultValue is NOT a simple "field ?? type" lever like the other five.
# Per §6.4.1/§13.1 it is a NEW PRIORITY TIER in the initial-value chain (defaultValues → record
# → fieldConfig.defaultValue → inputConfig.defaultValue). The fix's wording must reflect this
# (it is resolved by resolveFieldOverType at the field-vs-type STEP, but sits below record/
# defaultValues overall). FieldConfig.defaultValue (L184-186) already states this — mirror it.

# GOTCHA: The "null/false/0/\"\" meaningful" semantics are attributed to §6.4.0 in some files
# (config.ts parser/formatter, resolveFieldOverType) and to §6.4.5 in others (useField.tsx L563,
# test suite). BOTH sections exist; this is citation-style drift, NOT an error. Do not "fix" it
# unless explicitly doing the optional Rank-4 polish. (See research/current-jsdoc-audit.md.)

# CRITICAL: The barrel files (packages/core/src/config/index.ts, packages/core/src/index.ts)
# intentionally carry NO JSDoc on resolveFieldOverType (contract Q5). Do NOT add JSDoc there.

# CRITICAL: This is a DOCS-ONLY (JSDoc/comment) task. Do not touch README.md, PRD.md, any
# tasks.json, any prd_snapshot.md, or any test. No runtime change.
```

## Implementation Blueprint

### Data models and structure

No data models change. The "model" this task operates on is the **set of 15 affected JSDoc/comment surfaces** to verify, plus the one to fix. Reference set (all verified-present in research):

```text
CORE — packages/core/src/types/config.ts
  InputConfig.defaultValue        L64     ← REQUIRED FIX (no field-level mention today)
  InputConfig.debounce            L78-82    verify (§6.4.2, §6.4.0)
  InputConfig.valueField          L95-98    verify (§6.4.4, §6.4.0)
  InputConfig.getSubmitField      L105-108  verify (§6.4.4, §6.4.0)
  InputConfig.parser              L115-119  verify (§6.4.3, §6.4.0)
  InputConfig.formatter           L126-130  verify (§6.4.3, §6.4.0)
  FieldConfig section header      L178-180  verify (canonical rule for all six)
  FieldConfig.defaultValue        L184-186  verify (§6.4.1, §13.1) — the MIRROR for the fix
  FieldConfig.debounce            L191-193  verify (§6.4.2)
  FieldConfig.parser              L198-199  verify (§6.4.3)
  FieldConfig.formatter           L204-205  verify (§6.4.3)
  FieldConfig.valueField          L210-211  verify (§6.4.4)
  FieldConfig.getSubmitField      L216-217  verify (§6.4.4)

CORE — packages/core/src/config/defaults.ts
  resolveFieldOverType            L8-28     verify (§6.4.0; canonical full)
  resolveInitialValue             L42-94    verify (§6.4.1, §13.1)

REACT — packages/react/src/overlays.ts
  ReactFieldConfig                L65-69    verify (§6.4, §6.4.0, §3.2.1)

REACT wiring comments
  useField.tsx parser/formatter   L559-563  verify (§6.4.3, §6.4.0, §6.4.5)
  Form.tsx debounce               L387-391  verify (§6.4.2, §6.4.0)
  Form.tsx submit specs           L962-965  verify (§6.4.4, §6.4.0)
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY — grep §6.4 across both packages and walk the 15-symbol set
  - RUN: grep -rn "§6.4\|§ 6.4\|6\.4" packages/core/src/ packages/react/src/
    (Confirm the reference set matches the table above; nothing regressed/drifted since research.)
  - READ each of the 15 symbols above and confirm:
      (a) it mentions field-level overrides (YES expected for all except barrels),
      (b) it references §6.4 (and the expected sub-section),
      (c) it uses the canonical precedence wording ("field-level value wins when `!== undefined`").
  - FIND pattern: any symbol that FAILS (a)/(b)/(c), or any STALE JSDoc describing pre-§6.4 behavior.
  - OUTCOME: a short note (in the PR description / commit message) confirming which symbols passed
    and that the only required fix is InputConfig.defaultValue (Task 2). If research was wrong and
    something else drifted, fix it the same minimal way (field-level mention + correct §6.4.x).
  - DO NOT rewrite symbols that already pass. This is confirm-only.

Task 2: FIX — InputConfig.defaultValue field-level mention (THE REQUIRED EDIT)
  - EDIT file: packages/core/src/types/config.ts
  - OLD (exact, L64): "  /** Default value for this input type (e.g., '' for text, false for switch) */"
  - NEW: replace the one-liner with a multi-line JSDoc that:
      • keeps the type-level purpose line,
      • adds "Per-field override via `FieldConfig.defaultValue` (§6.4.1)",
      • states the field-level value "wins when `!== undefined` (resolved via
        `resolveFieldOverType`, §6.4.0 — so null/false/0/\"\" are meaningful defaults)",
      • notes the defaultValue tier nuance: a field-level default is a new priority tier
        *below* `record`/`defaultValues` and *above* this type default (§6.4.1, §13.1),
        not a bare `??`.
  - MIRROR: the five sibling InputConfig fields (debounce/parser/formatter/valueField/getSubmitField)
    for tone/structure, and FieldConfig.defaultValue (L184-186) for the §6.4.1 + tier wording.
  - NAMING: keep `TValue` generic unchanged; the field is still `defaultValue: TValue;`.
  - See "Implementation Patterns" below for the exact recommended replacement text.
  - PRESERVE: the field declaration `defaultValue: TValue;` and all surrounding members unchanged.

Task 3: VALIDATE (format first, then no-regression suite)
  - RUN: pnpm format        # prettier reflows the new multi-line JSDoc to printWidth 80
  - RUN: pnpm format:check  # MUST pass
  - RUN: pnpm typecheck     # tsc --build across the monorepo — MUST stay green
  - RUN: pnpm test          # vitest run (coverage gate) — MUST stay green
  - RUN: pnpm lint          # eslint . — MUST stay green

Task 4: OPTIONAL POLISH — only if time permits AND each change is a comment-only no-op
  (Each is LOW priority / cosmetic. The task PASSES without any of these. Skip if unsure.)
  4a. FieldConfig verbosity parity (config.ts L191-217): the five terse sibling blocks could
      add inline "`!== undefined` … null/false meaningful" to match FieldConfig.defaultValue.
      The shared section header (L178-180) already states the rule, so this is cosmetic.
  4b. Falsy-enumeration parity: InputConfig.valueField (L95-98) and getSubmitField (L105-108)
      could add the "null/false/0/\"\"" enumeration their parser/formatter siblings carry.
  4c. Citation-attribution drift: pick ONE canonical section (§6.4.0 OR §6.4.5) for the
      "null/false/0/\"\" meaningful" rule and apply it everywhere. LOWEST priority — both
      sections exist; leaving it is acceptable.
  - If ANY optional polish is taken, re-run pnpm format / format:check / typecheck / test / lint.
```

### Implementation Patterns & Key Details

#### Recommended replacement text for `InputConfig.defaultValue` (Task 2)

The implementer should adapt this to match the file's exact JSDoc style (em-dash `—`, backticked identifiers — the sibling blocks use backticks). Prettier will reflow the line breaks:

```typescript
  /**
   * Default value for this input type (e.g., `''` for text, `false` for switch).
   *
   * Per-field override via `FieldConfig.defaultValue` (§6.4.1); the field-level
   * value wins when `!== undefined` (resolved via `resolveFieldOverType`,
   * §6.4.0 — so null/false/0/"" are meaningful defaults). A field-level default
   * is a new priority tier *below* `record`/`defaultValues` and *above* this
   * type default (§6.4.1, §13.1) — not a bare `??` of this value.
   */
  defaultValue: TValue;
```

**Why this wording:** it mirrors the five sibling `InputConfig` levers (debounce/parser/formatter/valueField/getSubmitField all say "Per-field override via `FieldConfig.X` (§6.4.Y); the field-level value wins when `!== undefined` (resolved via `resolveFieldOverType`, §6.4.0 …)"), cites the SAME §6.4.1 its field-level counterpart `FieldConfig.defaultValue` uses, and captures the defaultValue-specific tier nuance that §6.4.1/§13.1 are explicit about (it is NOT a bare `??`).

#### Canonical precedence wording (the consistency bar)

Every field-override JSDoc should express this one rule. Allow phrasing variants as long as the *concept* is identical (contract Q7 — exact-string uniformity is NOT required):

> The field-level value wins over the type-level value when it is **`!== undefined`** — so `null`, `false`, `0`, and `""` are meaningful overrides/defaults (not "unset"), resolved via the single `resolveFieldOverType` helper (§6.4.0).

Known acceptable phrasing variants already in the tree (do NOT "normalize" these):
- `InputConfig.debounce` leads with "wins when **set**" then recovers "`!== undefined`" — acceptable.
- `InputConfig.valueField`/`getSubmitField` omit the `null/false/0/""` enumeration — acceptable (they defer to §6.4.0).
- `FieldConfig`'s five terse blocks rely on the shared section header (L178-180) for the canonical rule — acceptable.

### Integration Points

```yaml
FILES MODIFIED:
  - packages/core/src/types/config.ts   # InputConfig.defaultValue JSDoc extended (required).
                                         # (Optional polish in same file only.)

FILES NOT MODIFIED (out of scope):
  - README.md                            # owned by P1.M4.T1.S1 (parallel task) — disjoint file
  - PRD.md                               # read-only, owned by humans
  - plan/**/tasks.json                   # owned by orchestrator
  - packages/core/src/config/defaults.ts # already canonical (full) — verify only
  - packages/react/src/overlays.ts       # already canonical (core) — verify only
  - packages/react/src/hooks/useField.tsx        # already canonical — verify only
  - packages/react/src/components/Form.tsx       # already canonical — verify only
  - Any test file                        # JSDoc-only task; no test changes

CONFIG / DATABASE / ROUTES: none (pure documentation/JSDoc).
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# JSDoc lives in prettier-managed .ts/.tsx. Reformat then check.
pnpm format                 # auto-reflow the new multi-line JSDoc to printWidth 80
pnpm format:check           # MUST pass (zero files differ)
# Expected: clean. If format:check fails, READ the diff and accept prettier's reflow.

pnpm lint                   # eslint . across the monorepo — MUST stay green
# Expected: no new errors. (A comment-only change should not trip eslint.)
```

### Level 2: No-Regression Suite (Component Validation)

```bash
# The task is JSDoc/comment-only, so these cannot be broken BY it — but confirm the tree is green.
pnpm typecheck              # tsc --build across the monorepo — MUST stay green
pnpm test                   # vitest run; enforces the 90/90/90/90 coverage gate — MUST stay green
# Expected: identical to the pre-change baseline (no new failures).
```

### Level 3: Content / Consistency Verification (System Validation — THE CORE GATE)

```bash
# 1. Confirm InputConfig.defaultValue now references §6.4 (the required fix landed):
grep -n "defaultValue" packages/core/src/types/config.ts | grep "§6.4\|FieldConfig.defaultValue"
# Expected: a match on the InputConfig.defaultValue block (and the existing FieldConfig.defaultValue block).

# 2. Confirm EVERY affected symbol still references §6.4 (nothing regressed, nothing went stale):
grep -rn "§6.4" packages/core/src/ packages/react/src/ | grep -v "__tests__\|__typechecks__"
# Expected: references on config.ts (InputConfig + FieldConfig blocks), defaults.ts (helper + resolver),
#           overlays.ts (ReactFieldConfig), useField.tsx, Form.tsx (×2). Compare against the 15-symbol table.

# 3. Confirm NO stale JSDoc describes pre-§6.4 behavior (no symbol says the old type-only story):
#    Manual: hover each of the 15 symbols; each must either reference §6.4 or be a barrel (no JSDoc by design).
grep -rn "§6.4\|resolveFieldOverType\|FieldConfig\.\(defaultValue\|debounce\|parser\|formatter\|valueField\|getSubmitField\)" \
  packages/core/src/types/config.ts packages/core/src/config/defaults.ts \
  packages/react/src/overlays.ts packages/react/src/hooks/useField.tsx packages/react/src/components/Form.tsx
# Expected: dense, consistent coverage — the rule is referenced the same way everywhere.

# 4. Confirm ONLY JSDoc/comment text changed and only under packages/ (no README/PRD/test drift):
git status --porcelain
# Expected: only packages/core/src/types/config.ts (+ any optional-polish files under packages/).
#           README.md, PRD.md, tasks.json, *.test.* MUST NOT appear.

# 5. (Sanity) Confirm the barrels intentionally carry no JSDoc (contract Q5) — no false failure:
grep -n "resolveFieldOverType" packages/core/src/config/index.ts packages/core/src/index.ts
# Expected: bare re-export lines only (no JSDoc /** ... */ block) — this is correct by design.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# IDE-hover sanity (manual, no command): hover InputConfig.defaultValue, FieldConfig.defaultValue,
# resolveFieldOverType, and ReactFieldConfig in an editor. Confirm the four tell the SAME
# field-over-type story with matching §6.4 anchors — that is the whole point of this sweep.

# (No project-bundled JSDoc-render/TSDoc check exists; prettier + tsc + eslint + the grep gate
#  above are the deterministic validators. The hover check is the human confirmation.)
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm format:check` passes (prettier-managed JSDoc).
- [ ] `pnpm typecheck` green (no-regression).
- [ ] `pnpm test` green (coverage gate unaffected).
- [ ] `pnpm lint` green (no-regression).

### Feature Validation

- [ ] Verification pass complete over all 15 affected symbols (grep + manual walk); each references §6.4 (or is a barrel by design).
- [ ] `InputConfig.defaultValue` (`packages/core/src/types/config.ts:64`) now mentions `FieldConfig.defaultValue`, the `!== undefined` rule, and §6.4.1.
- [ ] No stale JSDoc anywhere in `packages/core/src/` or `packages/react/src/` describes pre-§6.4 behavior.
- [ ] The canonical precedence rule ("field-level value wins when `!== undefined`, null/false/0/\"\" meaningful") is expressed consistently (concept-identical; phrasing variants allowed).
- [ ] All §6.4 references use the correct sub-section anchors (§6.4.0 rule, §6.4.1 defaultValue, §6.4.2 debounce, §6.4.3 parser/formatter, §6.4.4 getSubmitField/valueField).

### Code Quality Validation

- [ ] Only JSDoc / source-comment text changed — no runtime change, no type-shape change.
- [ ] Only files under `packages/core/src/` and `packages/react/src/` modified.
- [ ] Already-consistent JSDoc was NOT rewritten (confirm-only where it passes).
- [ ] Barrels (`config/index.ts`, `src/index.ts`) left JSDoc-free by design.
- [ ] `README.md`, `PRD.md`, any `tasks.json`, and any test file untouched.

### Documentation & Deployment

- [ ] New `InputConfig.defaultValue` JSDoc is self-consistent with its five sibling levers and with `FieldConfig.defaultValue`.
- [ ] Commit/PR message notes the one required fix and the verification outcome.

---

## Anti-Patterns to Avoid

- ❌ Don't rewrite JSDoc that already references §6.4 consistently — this is a *consistency sweep*, not a restyling pass. Confirm-and-leave where it passes.
- ❌ Don't touch `README.md` — that is the parallel task P1.M4.T1.S1 (different file, opposite §-reference convention).
- ❌ Don't remove `§6.4` references from source files to "clean them up" — source JSDoc is *supposed* to cite §6.4.
- ❌ Don't describe `InputConfig.defaultValue`'s field-level override as a "bare `??` fallback" — it is a new priority tier between `record`/`defaultValues` and the type default (§6.4.1/§13.1).
- ❌ Don't add JSDoc to the barrel files (`config/index.ts`, `src/index.ts`) — they intentionally carry none (contract Q5).
- ❌ Don't "fix" the §6.4.0-vs-§6.4.5 attribution drift unless explicitly doing the optional Rank-4 polish — both sections exist; it is cosmetic.
- ❌ Don't touch `PRD.md`, any `tasks.json`, any `prd_snapshot.md`, or any test — JSDoc/comment-only.
- ❌ Don't skip `pnpm format` then fail `format:check` — prettier owns JSDoc line wrapping; run it.

---

## Confidence Score

**9/10** — One-pass success is highly likely. Research already established the tree is consistent across all 15 affected symbols (no stale JSDoc) with exactly ONE genuine gap (`InputConfig.defaultValue`), pinned with file:line citations and verbatim current text. The required edit has a ready recommended replacement that mirrors five verified sibling blocks. The validation gate is deterministic (grep + tsc + vitest + eslint + prettier). Residual risk is minimal: prettier reflow of the new JSDoc block (auto-fixed by `pnpm format`), and the small chance research missed a drift that the Task 1 verification walk will then catch and fix the same minimal way. Dependencies satisfied: P1.M1–P1.M3 are all **Complete**, so the JSDoc being swept reflects shipped behavior.
