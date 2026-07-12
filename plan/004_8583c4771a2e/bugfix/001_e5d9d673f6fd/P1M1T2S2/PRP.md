name: "P1.M1.T2.S2 — Track the isDisabled React-adapter limitation as a known issue in project documentation"
description: |

---

## Goal

**Feature Goal**: Make the `isDisabled` field-state condition matcher React-adapter
limitation discoverable to developers and users **without** requiring them to read
`it.skip(...)` comments inside `packages/react/src/__tests__/Field.test.tsx`.
Today the limitation is documented ONLY in those 5 skip comments (produced by the
sibling subtask P1.M1.T2.S1). This subtask surfaces it as a first-class project
artifact: a `KNOWN_ISSUES.md` file plus a README cross-reference.

This is **Mode-A documentation**: the documentation **IS** the deliverable
(this subtask has no code/runtime component).

**Deliverable**:
1. **NEW file** `packages/react/KNOWN_ISSUES.md` documenting, at minimum:
   (a) Title: *"isDisabled field-state condition matcher not functional in React adapter"*.
   (b) Symptom: conditions using `{ isDisabled: true }` (or `isDisabled: false`)
       do not evaluate correctly in the React adapter because the `fieldStates`
       map used by `evaluateConditions` intentionally omits the `disabled` property.
   (c) Root cause: `useFieldDisabledState.ts` (~lines 126-145) builds `fieldStates`
       without `disabled` **on purpose** — the inline comment reads
       *"CRITICAL: Do NOT add disabled to fieldStates (creates circular dependency)"*.
       Core's `evaluate.ts` (~lines 84-87) reads `fieldState?.disabled`, which is
       therefore always `undefined` in the React adapter.
   (d) Workaround: use **value-based conditions** (e.g.
       `{ when: 'source', is: 'disable', disabled: true }` — gates on a field's
       *value*) or apply `disabled` explicitly via the `<Field disabled>` JSX
       prop or `FieldConfig.disabled: true` in config, instead of the
       `isDisabled` field-state matcher.
   (e) Potential future fix: a **non-reactive disabled-state registry** that
       resolves disabled states without creating circular React watch/re-render
       dependencies (explicitly out of scope for this bugfix).
   (f) Reference: the specific skipped test cases in
       `packages/react/src/__tests__/Field.test.tsx` (the 5 `it.skip(...)`
       blocks at ~lines 1132, 1172, 1226, 1308, 1356) for concrete
       before/after scenarios.
2. **MODIFY** `packages/react/README.md` — add a `## Known Issues` section that
   links to `KNOWN_ISSUES.md` (and ideally to the skip-comment region of
   `Field.test.tsx`), so the limitation is discoverable from the package's
   primary documentation surface.

**Success Definition**:
1. `packages/react/KNOWN_ISSUES.md` exists and contains all six required
   content points (a)-(f) above, in clear, actionable prose with at least one
   code example for the symptom and one for the workaround.
2. `packages/react/README.md` has a `## Known Issues` section linking to
   `KNOWN_ISSUES.md`.
3. Both files pass `npx prettier --check` (`.md` files are NOT in
   `.prettierignore` — prettier owns markdown formatting).
4. No source/runtime/test files are modified: `Form.tsx`,
   `useFieldDisabledState.ts`, `evaluate.ts`, and any `*.test.tsx` are
   **untouched** (the limitation is documented, not fixed — fixing it is
   out-of-scope feature work).
5. `npx vitest run` remains green (989 passed | 5 skipped) — the docs-only
   change cannot affect tests, but this is confirmed rather than assumed.

## User Persona

**Target User**: Two audiences —
1. **Application developers** consuming `@formality-ui/react` who reach for the
   `isDisabled` condition matcher (documented in the root README's Condition
   Reference table) and find it silently does nothing.
2. **Maintainers** of Formality who need to know *why* the 5 tests in
   `Field.test.tsx` are skipped and *what* the resolution path looks like,
   without spelunking test files.

**Use Case**: A developer writes a form where field B should disable when field
A is disabled. They write `{ when: 'fieldA', isDisabled: true, disabled: true }`
(matching the documented `isDisabled` condition property). It silently fails.
They consult the React package README → "Known Issues" → learn the matcher is a
React-adapter limitation, read the value-based workaround, and unblock
themselves without filing a bug.

**User Journey**: README → `## Known Issues` → link → `KNOWN_ISSUES.md` →
Symptom (matches what they saw) → Workaround code example → apply → works.

**Pain Points Addressed**:
- The root `README.md` Condition Reference (line 326) documents `isDisabled` as
  *"Check if field is disabled (`true`) or enabled (`false`)"* with **no caveat**.
  Consumers have no way to know it doesn't work in the React adapter.
- The only current documentation of the limitation is buried in `it.skip(...)`
  comments in a test file — a place no end-user would look.

## Why

- **Business value**: The `isDisabled` limitation is a real, reproducible gap
  between core's capability and the React adapter's propagation of state
  (PRD §h3.1 "Issue 2"). Tracking it project-wide (not just in skip comments)
  is an explicit ask from the PRD's Suggested Fix:
  *"decide whether the isDisabled React limitation is tracked as a known issue
  elsewhere (not just in skip comments)."* This subtask answers that with "yes,
  here is KNOWN_ISSUES.md."
- **Integration with existing features**: This is the **tracking half** of
  Issue 2 (PRD §h3.1). The **hygiene half** — removing probe files + skipping
  the failing tests with comments (P1.M1.T2.S1) — is already committed
  (`1863b44`). This subtask (S2) consumes S1's skip comments as the source of
  truth and makes them discoverable at the package-doc level.
- **Problems this solves and for whom**: developers silently hitting a
  non-functional documented matcher; maintainers losing context on *why* 5
  tests are skipped.
- **Scope boundary (CRITICAL)**:
  - This is **documentation only**. Do NOT fix the limitation (wire `disabled`
    into `fieldStates`) — that is out-of-scope feature work
    (PRD §h3.1 "Or (feature)…").
  - Do NOT edit `useFieldDisabledState.ts`, `evaluate.ts`, `Form.tsx`, or any
    `*.test.tsx` — these are READ-ONLY references.
  - Do NOT edit the **root** `README.md` (the contract scopes the Known Issues
    section to `packages/react/README.md`). The root README's Condition
    Reference caveat is a separate, larger doc decision owned by humans.
  - Do NOT create a root-level `KNOWN_ISSUES.md` — the contract specifies
    `packages/react/KNOWN_ISSUES.md` (the limitation is React-adapter-specific).

## What

### The contract (what "done" looks like)

**(a) A new file `packages/react/KNOWN_ISSUES.md`** containing, at minimum, the
six content points from the Goal's Deliverable section. Recommended structure
(follow the packages/react/README.md heading conventions: `# ` title,
`## `/`### ` sections, GitHub-pipe tables):

```
# Known Issues — @formality-ui/react

> React-adapter-specific limitations. For general Formality behavior, see the
> root README and PRD.

## isDisabled field-state condition matcher not functional in React adapter

### Symptom
... (with a `{ isDisabled: true }` code example that does NOT work)

### Root cause
... (useFieldDisabledState.ts ~126-145 omits disabled; evaluate.ts ~84-87 reads it → always undefined)

### Workaround
... (value-based condition `{ when, is }` example + explicit `<Field disabled>` example)

### Potential future fix
... (non-reactive disabled-state registry; explicitly out of scope)

### Reference
... (Field.test.tsx ~1132-1356 skip comments; root README Condition Reference line 326)
```

**(b) A `## Known Issues` section in `packages/react/README.md`** linking to
`KNOWN_ISSUES.md`. The README currently ends with (in order):
`... ## Testing & Coverage` → `## License`. Insert `## Known Issues` **between**
`## Testing & Coverage` and `## License`. The section should be a short
paragraph + link, e.g.:

```markdown
## Known Issues

- **`isDisabled` condition matcher (React adapter)** — conditions using the
  `isDisabled` field-state matcher do not currently evaluate correctly in the
  React adapter. See [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) for the symptom,
  root cause, and a value-based workaround.
```

### Success Criteria

- [ ] `packages/react/KNOWN_ISSUES.md` exists.
- [ ] KNOWN_ISSUES.md title is *"isDisabled field-state condition matcher not functional in React adapter"*.
- [ ] KNOWN_ISSUES.md documents the Symptom, Root cause, Workaround, Potential
      future fix, and Reference (points a, b, c, d, e, f from the contract).
- [ ] KNOWN_ISSUES.md includes at least one code example for the symptom and
      one for the workaround.
- [ ] `packages/react/README.md` has a `## Known Issues` section linking to
      `KNOWN_ISSUES.md` (relative link `./KNOWN_ISSUES.md`).
- [ ] `npx prettier --check packages/react/KNOWN_ISSUES.md packages/react/README.md` passes.
- [ ] `npx vitest run` stays green (989 passed | 5 skipped).
- [ ] No source/runtime/test files modified (`git diff --exit-code` on
      `Form.tsx`, `useFieldDisabledState.ts`, `evaluate.ts`, `*.test.tsx` → exit 0).

## All Needed Context

### Context Completeness Check

_Pass._ The limitation, root cause, workaround, and potential fix are all
defined by (1) the item contract, (2) the S1 skip comments in
`packages/react/src/__tests__/Field.test.tsx` (verified live at lines 1132,
1172, 1226, 1308, 1356), (3) the root-cause source in
`packages/react/src/hooks/useFieldDisabledState.ts` (~126-145) and
`packages/core/src/conditions/evaluate.ts` (~84-87), and (4) the architecture
`system_context.md` §"Issue 2 — ✅ HYGIENE DONE, ⚠️ LIMITATION UNTRACKED".
The exact file paths, line numbers, the verbatim "CRITICAL: Do NOT add disabled
to fieldStates" comment, the README's current structure (13 `## ` sections,
last two are `## Testing & Coverage` then `## License`), and the prettier
formatting gate (`.md` not in `.prettierignore`) are all verified. An agent
unfamiliar with the codebase has everything needed.

### Documentation & References

```yaml
# MUST READ — the source of truth (produced by sibling subtask S1)
- file: packages/react/src/__tests__/Field.test.tsx
  section: "isDisabled region ~1088-1400: describe('Conditions disabled priority …');
            5 it.skip at 1132/1172/1226/1308/1356 with KNOWN LIMITATION comments;
            ACTIVE passing tests at 1088, 1271, 1393 (do NOT reference these as failing)."
  why: THE authoritative description of the limitation. The skip comments state the
        symptom, root cause, and why it can't be trivially fixed. Quote/paraphrase them
        for KNOWN_ISSUES.md.
  pattern: "Each skip comment documents: (1) the isDisabled matcher needs disabled in
            fieldStates; (2) config-level/JSX-prop disabled is NOT propagated into
            fieldStates; (3) adding it creates circular re-render dependencies."
  gotcha: "Do NOT edit this file. It is READ-ONLY reference. The 5 it.skip are the
           failing/limited cases; the it() tests at 1088/1271/1393 PASS and must not
           be cited as broken."

# MUST READ — the root cause (READ-ONLY — do NOT edit)
- file: packages/react/src/hooks/useFieldDisabledState.ts
  section: "~126-145 (fieldStates useMemo; comment: 'CRITICAL: Do NOT add disabled to
            fieldStates (creates circular dependency)'; states[...] omits the disabled key)."
  why: Confirms WHY fieldStates has no disabled. This is the single sentence to quote
        in the Root Cause section of KNOWN_ISSUES.md.
  gotcha: "READ-ONLY. Editing this to add 'disabled' is the out-of-scope feature fix."

- file: packages/core/src/conditions/evaluate.ts
  section: "~84-87 (isDisabled matcher: const isFieldDisabled = fieldState?.disabled ?? false;)."
  why: Confirms CORE fully supports isDisabled; only the React adapter fails to populate it.
        Cite this to explain that core's own unit tests pass.
  gotcha: "READ-ONLY. Do NOT edit core."

# MUST READ — the file being modified + the package README structure
- file: packages/react/README.md
  section: "13 ## sections; order ends … '## Testing & Coverage' → '## License'.
            Insert '## Known Issues' BETWEEN those two. Uses ## for sections, ### for
            subsections, GitHub-pipe tables for property tables."
  why: The file to MODIFY (add the Known Issues section). Match its heading depth and tone.
  pattern: "Section heading is '## Known Issues' (h2, to match sibling sections). Link with
            relative path ./KNOWN_ISSUES.md."
  gotcha: "Do NOT edit the ROOT README.md (condition reference caveat is out of scope).
           Only packages/react/README.md per the contract."

# REFERENCE — how the root README documents isDisabled (for the cross-reference)
- file: README.md
  section: "### Condition Reference (line ~316-344); row for isDisabled (line ~326):
            'Check if field is disabled (true) or enabled (false)' — no caveat."
  why: KNOWN_ISSUES.md should cross-reference this so devs coming from the conditions docs
        find the caveat. Mention it in the Reference section.
  gotcha: "Do NOT modify the root README.md. Just reference it from KNOWN_ISSUES.md."

# REFERENCE — the architecture verification (confirms current state)
- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/system_context.md
  section: "Issue 2 (Major): Red CI + probe files — ✅ HYGIENE DONE, ⚠️ LIMITATION UNTRACKED"
  why: Confirms S1's hygiene is committed (1863b44) and that the 'UNTRACKED' gap is
        exactly what this subtask closes. Use its 'Root cause' phrasing for consistency.
  critical: "'What still needs doing: the PRD says decide whether the isDisabled React
             limitation is tracked as a known issue elsewhere — currently ONLY in skip
             comments. No KNOWN_ISSUES.md exists.' → This subtask creates it."

# REFERENCE — the bug-fix Issue 2 statement
- url: Bug-fix PRD §h3.1 (plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd — Issue 2)
  section: "Suggested Fix: 'decide whether the isDisabled React limitation is tracked as
            a known issue elsewhere (not just in skip comments).'"
  why: The mandate this subtask fulfills. Quote it in KNOWN_ISSUES.md if useful for context.

# DOWNSTREAM / SIBLING CONTEXT
- file: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M1T2S1/PRP.md
  section: "Goal (hygiene half: probes removed + 5 it.skip with KNOWN LIMITATION comments)."
  why: S1 is the PRODUCER of the skip comments that are this subtask's source of truth.
        Assume S1 is implemented exactly as specified (5 it.skip at 1132/1172/1226/1308/1356).
  critical: "S1 edits ONLY Field.test.tsx (verify-first, likely no-op). This subtask edits
             ONLY KNOWN_ISSUES.md (new) + packages/react/README.md. NO file overlap with S1."
- file: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M3T1.S1 (future sibling)
  section: "Update packages/react/README.md with auto-save API accuracy (planned, not run)."
  why: P1.M3.T1.S1 will ALSO edit packages/react/README.md (auto-save accuracy). This
        subtask's README edit is in a DIFFERENT section (## Known Issues, near the end),
        so there is no textual conflict — but both land before P1.M3.T1 to avoid merge churn.
  critical: "Keep this subtask's README edit to a SINGLE new '## Known Issues' section
             inserted before '## License'. Do not touch other sections (P1.M3.T1 owns those)."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/
  README.md                 # ← MODIFY: add '## Known Issues' section before '## License'
  CHANGELOG.md              # (do NOT touch — prettier-ignored, owned by P1.M3.T1.S2)
  package.json
  src/
    __tests__/Field.test.tsx     # READ-ONLY source of truth (5 it.skip @1132/1172/1226/1308/1356)
    hooks/useFieldDisabledState.ts  # READ-ONLY root cause (~126-145)
  ...
packages/core/src/conditions/evaluate.ts  # READ-ONLY root cause (~84-87)
README.md                  # READ-ONLY reference (Condition Reference line 326) — do NOT edit
```

### Desired Codebase tree with files to be added

```bash
packages/react/
  KNOWN_ISSUES.md           # NEW — the primary deliverable
  README.md                 # MODIFIED — +1 section ('## Known Issues') before '## License'
# (no other files added or modified)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL (docs-only, no fix): This subtask DOCUMENTS the isDisabled limitation, it does
     NOT fix it. Wiring `disabled` into fieldStates (useFieldDisabledState.ts) or editing
     evaluate.ts to make the skipped tests pass is out-of-scope feature work. The
     limitation is documented via KNOWN_ISSUES.md + README link. -->

<!-- CRITICAL (READ-ONLY files): Do NOT edit useFieldDisabledState.ts, evaluate.ts, Form.tsx,
     or any *.test.tsx. These are references only. `git diff --exit-code` on each must be 0. -->

<!-- GOTCHA (prettier owns markdown): .md files are NOT in .prettierignore (only PRD.md and
     CHANGELOG.md are). So KNOWN_ISSUES.md and packages/react/README.md MUST pass
     `npx prettier --check`. Run `npx prettier --write` on both before committing, or author
     them in prettier-compatible style (trailing newline, no hard tabs, consistent list/table
     spacing). -->

<!-- GOTCHA (README section ordering): packages/react/README.md ends with '## Testing & Coverage'
     then '## License'. Insert '## Known Issues' BETWEEN them (not after License, not at top).
     This keeps License last (convention) and groups Known Issues with the meta/test sections. -->

<!-- GOTCHA (relative link): From packages/react/README.md, the link to the new file is
     './KNOWN_ISSUES.md' (same directory), NOT '../KNOWN_ISSUES.md' or an absolute path.
     GitHub renders relative links correctly. -->

<!-- GOTCHA (do NOT cite passing tests as broken): Field.test.tsx has ACTIVE, PASSING tests
     in the isDisabled region: line 1088 ('should use AND logic…'), line 1271 ('should not
     disable result when only one source field is disabled'), and the whole
     describe('multi-field isDisabled with mixed matchers') @1392 (e.g. line 1393). These
     pass today. The KNOWN_ISSUES doc must reference ONLY the 5 it.skip cases (1132/1172/
     1226/1308/1356) as the limitation's test evidence — do not imply the whole region fails. -->

<!-- GOTCHA (root README has no caveat): The ROOT README.md Condition Reference (line ~326)
     documents isDisabled with no caveat. KNOWN_ISSUES.md should CROSS-REFERENCE this so
     devs find the caveat, but do NOT edit the root README (out of scope — only
     packages/react/README.md per the contract). -->

<!-- GOTCHA (P1.M3.T1.S1 also edits this README): A future sibling subtask will edit
     packages/react/README.md for auto-save API accuracy. Keep this subtask's edit scoped to a
     SINGLE new '## Known Issues' section to avoid textual conflict. Do not reflow other
     sections. -->

<!-- GOTCHA (scope of the doc): The limitation is React-adapter-specific. Core's evaluate.ts
     fully supports isDisabled and its own unit tests pass. KNOWN_ISSUES.md must make clear
     the gap is 'core supports it, React adapter does not propagate disabled into fieldStates',
     NOT 'isDisabled is unimplemented'. -->
```

## Implementation Blueprint

### Data models and structure

Not applicable — this is a documentation-only deliverable. No data models, types,
or runtime code change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE packages/react/KNOWN_ISSUES.md (the primary deliverable)
  - AUTHOR: a new Markdown file at packages/react/KNOWN_ISSUES.md.
  - STRUCTURE (match packages/react/README.md heading conventions — '# ' title,
    '## '/'### ' sections, GitHub-pipe tables where tabular data helps):
      # Known Issues — @formality-ui/react
      (1-line intro pointing to root README for general behavior)
      ## isDisabled field-state condition matcher not functional in React adapter
        ### Symptom
        ### Root cause
        ### Workaround
        ### Potential future fix
        ### Reference
  - CONTENT — ensure ALL six contract points are present:
      (a) Title heading is exactly: "isDisabled field-state condition matcher not functional in React adapter".
      (b) Symptom: explain that conditions using { isDisabled: true } / { isDisabled: false }
          do not evaluate correctly in the React adapter; fieldStates omits 'disabled'.
          Include a SHORT code example of the BROKEN pattern, e.g.:
            // ❌ Does NOT work in the React adapter:
            // { when: 'source', isDisabled: true, disabled: true }
      (c) Root cause: quote/paraphrase useFieldDisabledState.ts ~126-145 (the fieldStates
          useMemo omits 'disabled' ON PURPOSE; verbatim comment: "CRITICAL: Do NOT add
          disabled to fieldStates (creates circular dependency)"). Explain that
          evaluate.ts ~84-87 reads fieldState?.disabled → always undefined in React.
          Make clear: CORE supports it; the React adapter does not propagate it.
      (d) Workaround: give TWO concrete alternatives with code examples:
            // ✅ Workaround 1 — value-based condition (gates on a field's VALUE):
            //   { when: 'source', is: 'disable', disabled: true }   // source value === 'disable'
            // ✅ Workaround 2 — explicit disabled prop / config:
            //   <Field name="b" disabled />            // JSX prop
            //   { b: { type: 'textField', disabled: true } }   // config
          Note that Workaround 1 only applies when there is a field VALUE to gate on
          (not for config-level/JSX-prop disabled that has no corresponding value).
      (e) Potential future fix: describe a non-reactive disabled-state registry that
          resolves disabled states without creating circular React watch/re-render
          dependencies. State explicitly this is OUT OF SCOPE for the current bugfix.
      (f) Reference: link to the skip comments in packages/react/src/__tests__/Field.test.tsx
          (~lines 1132-1356, the 5 it.skip blocks) for concrete test scenarios. Also
          cross-reference the root README Condition Reference (line ~326) which documents
          isDisabled without a caveat.
  - TONE: clear, actionable, developer-facing. Avoid blame; frame as a known
    architectural trade-off with workarounds.
  - PLACEMENT: packages/react/KNOWN_ISSUES.md (top-level of the react package, sibling to README.md).

Task 2: MODIFY packages/react/README.md — add a '## Known Issues' section
  - FIND: the file ends with '## Testing & Coverage' → '## License' (13 '## ' sections total).
  - INSERT: a new '## Known Issues' section BETWEEN '## Testing & Coverage' and '## License'
    (so License remains last — the convention).
  - CONTENT: a short paragraph + a bullet linking to KNOWN_ISSUES.md. Example:
      ## Known Issues

      - **`isDisabled` condition matcher (React adapter)** — conditions using the
        `isDisabled` field-state matcher do not currently evaluate correctly in the
        React adapter because the `fieldStates` map intentionally omits the
        `disabled` property (to avoid circular re-render dependencies). See
        [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) for the symptom, root cause, and a
        value-based workaround.
  - LINK: relative path './KNOWN_ISSUES.md' (same directory). Verify it renders on GitHub.
  - PRESERVE: all other sections unchanged (P1.M3.T1.S1 owns the auto-save accuracy edits
    to this same file; keep this edit to the single new section to avoid conflict).

Task 3: FORMAT (prettier owns markdown)
  - RUN: `npx prettier --write packages/react/KNOWN_ISSUES.md packages/react/README.md`
    (or author in prettier-compatible style from the start).
  - THEN RUN: `npx prettier --check packages/react/KNOWN_ISSUES.md packages/react/README.md`
    → expect PASS.
  - GOTCHA: .md files are NOT in .prettierignore. A failing prettier check is a
    validation-gate failure.

Task 4: SCOPE-LEAK CHECK (confirm docs-only — no runtime/test changes)
  - RUN: `git diff --exit-code packages/react/src/components/Form.tsx \
      packages/react/src/hooks/useFieldDisabledState.ts \
      packages/core/src/conditions/evaluate.ts \
      packages/react/src/__tests__/Field.test.tsx`
    → expect exit 0 (READ-ONLY files untouched).
  - RUN: `git status --short` → expect ONLY:
      '?? packages/react/KNOWN_ISSUES.md'  (new, untracked)  AND
      ' M packages/react/README.md'        (modified).
  - EXPECT: no other changes. If anything else appears, STOP — it is a scope leak.

Task 5: REGRESSION CHECK (docs change cannot break tests — confirm, don't assume)
  - RUN: `npx vitest run`
    → expect 989 passed | 5 skipped (0 failed). The 5 skips are the intentional
    isDisabled it.skip cases (unchanged by this docs-only subtask).
  - GOTCHA: a failure here means an unrelated regression or accidental source edit —
    investigate; do not "fix" it by editing tests (out of scope).
```

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN: KNOWN_ISSUES.md symptom example block — show the BROKEN usage so devs
     recognize their own code, then point to the workaround. -->

// ❌ Does NOT work in the React adapter today:
const config = {
  source: { type: 'textField' },
  target: {
    type: 'textField',
    conditions: [{ when: 'source', isDisabled: true, disabled: true }],
  },
};

<!-- PATTERN: KNOWN_ISSUES.md workaround example block — give the two working alternatives. -->

// ✅ Workaround 1 — value-based condition (gate on a field's VALUE, not its disabled state):
const config = {
  source: { type: 'textField' },
  target: {
    type: 'textField',
    // source's VALUE is 'disable' (a sentinel string you control):
    conditions: [{ when: 'source', is: 'disable', disabled: true }],
  },
};

// ✅ Workaround 2 — explicit disabled prop / config (no cross-field matcher):
<Field name="target" disabled />                       // JSX prop
// or:
const config = { target: { type: 'textField', disabled: true } };  // config

<!-- PATTERN: README.md section insertion — insert '## Known Issues' between the two
     shown anchors; do not modify either anchor. -->

... existing '## Testing & Coverage' section body ...
<!-- INSERT NEW SECTION HERE -->
## Known Issues

- **`isDisabled` condition matcher (React adapter)** — ... see
  [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) for ...

## License
... existing License body ...

<!-- CRITICAL: the relative link is './KNOWN_ISSUES.md' because both files live in
     packages/react/. GitHub renders this correctly. -->

<!-- GOTCHA: do NOT edit the ROOT README.md. The root README's Condition Reference
     (line ~326) documents isDisabled with no caveat — KNOWN_ISSUES.md should
     CROSS-REFERENCE it, but editing the root README is out of scope. -->
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
RUNTIME: none (documentation-only; NO source edits — useFieldDisabledState.ts /
        evaluate.ts / Form.tsx / Field.test.tsx are READ-ONLY).
DOCS:
  - NEW: packages/react/KNOWN_ISSUES.md (the deliverable).
  - MODIFY: packages/react/README.md (add '## Known Issues' section linking to KNOWN_ISSUES.md).
TESTS: none (docs cannot affect tests; `npx vitest run` is a regression guard, not a target).
FORMATTING:
  - prettier owns .md formatting (NOT in .prettierignore). Gate: `npx prettier --check`.
DOWNSTREAM CONSUMERS:
  - P1.M3.T1.S1 (future): edits packages/react/README.md for auto-save accuracy — keep this
    subtask's edit to a single new section to avoid textual conflict.
  - P1.M3.T1.S2 (future): edits packages/react/CHANGELOG.md — unrelated file.
PARALLEL-SAFE:
  - P1.M1.T2.S1 (concurrent): touches ONLY Field.test.tsx (verify-first). This subtask
    touches ONLY KNOWN_ISSUES.md (new) + packages/react/README.md. NO file overlap.
```

## Validation Loop

> This is a documentation-only deliverable. Levels 1 (formatting) and the
> scope-leak/regression checks are the real validation. Levels 2-3 are guards
> confirming the docs change didn't accidentally touch code.

### Level 1: Formatting & Content (the primary validation)

```bash
# Prettier owns markdown formatting (.md is NOT in .prettierignore)
npx prettier --check packages/react/KNOWN_ISSUES.md packages/react/README.md
# Expected: both files pass (exit 0). If not, run `npx prettier --write` on them and re-check.

# Content presence checks (grep the six required content points in KNOWN_ISSUES.md)
grep -ci "isDisabled field-state condition matcher not functional in React adapter" packages/react/KNOWN_ISSUES.md
# Expected: >= 1 (the title, point a).

grep -ciE "fieldStates|intentionally omits|circular" packages/react/KNOWN_ISSUES.md
# Expected: >= 1 (symptom + root cause, points b/c).

grep -ciE "useFieldDisabledState|evaluate\.ts|disabled to fieldStates" packages/react/KNOWN_ISSUES.md
# Expected: >= 1 (root cause references source, point c).

grep -ciE "value-based|is: 'disable'|<Field name=|disabled: true" packages/react/KNOWN_ISSUES.md
# Expected: >= 1 (workaround, point d).

grep -ciE "non-reactive|registry|out of scope" packages/react/KNOWN_ISSUES.md
# Expected: >= 1 (potential future fix, point e).

grep -ciE "Field\.test\.tsx|it\.skip|1132|1356" packages/react/KNOWN_ISSUES.md
# Expected: >= 1 (reference to skip comments, point f).

# README link check
grep -n "## Known Issues" packages/react/README.md
# Expected: exactly 1 match, located BETWEEN '## Testing & Coverage' and '## License'.

grep -n "KNOWN_ISSUES.md" packages/react/README.md
# Expected: >= 1 match (the relative link ./KNOWN_ISSUES.md).
```

### Level 2: Scope-Leak Check (no runtime/test files modified)

```bash
# READ-ONLY files must be untouched
git diff --exit-code \
  packages/react/src/components/Form.tsx \
  packages/react/src/hooks/useFieldDisabledState.ts \
  packages/core/src/conditions/evaluate.ts \
  packages/react/src/__tests__/Field.test.tsx
# Expected: exit 0 (no changes to any of these).

# Only the two intended files should appear in git status
git status --short
# Expected EXACTLY:
#   ?? packages/react/KNOWN_ISSUES.md
#    M packages/react/README.md
# (nothing else; no *.test.tsx, no source files, no root README.md, no CHANGELOG.md)
```

### Level 3: Regression Guard (docs change cannot break tests)

```bash
# Full suite stays green — docs cannot affect tests, but confirm rather than assume
npx vitest run
# Expected: 989 passed | 5 skipped, 0 failed.
# (The 5 skips are the intentional isDisabled it.skip cases — unchanged by this subtask.)

# Field.test.tsx in isolation (where the skip comments live)
npx vitest run packages/react/src/__tests__/Field.test.tsx
# Expected: 70 passed | 5 skipped, 0 failed (matches S1's verified state).
```

### Level 4: Link / Render Validation (creative)

```bash
# Verify the README → KNOWN_ISSUES.md relative link target exists
ls packages/react/KNOWN_ISSUES.md
# Expected: the file exists (the link is not dangling).

# Optional: if `markdown-link-check` or similar is available, run it on the README;
# otherwise a manual `ls` of the link target is sufficient (both files are in the
# same directory, so './KNOWN_ISSUES.md' resolves trivially).

# Optional: preview both files render correctly (headings, tables, code fences) in a
# Markdown viewer or on a GitHub branch preview. Confirm no broken code-fence (each
# ``` has a matching closing ```).
```

## Final Validation Checklist

### Technical Validation

- [ ] `npx prettier --check packages/react/KNOWN_ISSUES.md packages/react/README.md` passes.
- [ ] Level 1 content-presence greps all return >= 1 (six content points present).
- [ ] `git diff --exit-code` on Form.tsx / useFieldDisabledState.ts / evaluate.ts / Field.test.tsx → exit 0.
- [ ] `git status --short` shows ONLY `packages/react/KNOWN_ISSUES.md` (new) + `packages/react/README.md` (modified).
- [ ] `npx vitest run` → 989 passed | 5 skipped, 0 failed (regression guard).

### Feature Validation

- [ ] `packages/react/KNOWN_ISSUES.md` exists with all six content points (a-f).
- [ ] KNOWN_ISSUES.md title is exactly *"isDisabled field-state condition matcher not functional in React adapter"*.
- [ ] KNOWN_ISSUES.md includes a symptom code example (broken pattern) and a workaround code example (two alternatives).
- [ ] KNOWN_ISSUES.md references Field.test.tsx skip comments (~1132-1356) and the root README Condition Reference (~326).
- [ ] `packages/react/README.md` has a single `## Known Issues` section located between `## Testing & Coverage` and `## License`.
- [ ] README link to `./KNOWN_ISSUES.md` resolves (target file exists).

### Code Quality Validation

- [ ] Follows packages/react/README.md heading conventions (`# `/`## `/`### `, GitHub-pipe tables).
- [ ] File placement matches the desired tree (KNOWN_ISSUES.md at packages/react/ root, sibling to README.md).
- [ ] Anti-patterns avoided (no edits to root README, runtime, or test files).
- [ ] Tone is clear, actionable, and frames the limitation as a known trade-off with workarounds (not blame).

### Documentation & Deployment

- [ ] KNOWN_ISSUES.md is self-contained (a developer can read it without opening other files to understand the workaround).
- [ ] The limitation is now discoverable from packages/react/README.md without reading test skip comments.
- [ ] No CHANGELOG.md edit here (that is P1.M3.T1.S2).

---

## Anti-Patterns to Avoid

- ❌ Don't fix the isDisabled limitation (wire `disabled` into `fieldStates`) — that's out-of-scope feature work; the limitation is DOCUMENTED here.
- ❌ Don't edit `useFieldDisabledState.ts`, `evaluate.ts`, `Form.tsx`, or any `*.test.tsx` — root-cause/runtime/test files are READ-ONLY here.
- ❌ Don't edit the ROOT `README.md` — the contract scopes the Known Issues section to `packages/react/README.md`. The root Condition Reference caveat is a separate human-owned decision.
- ❌ Don't create a root-level `KNOWN_ISSUES.md` — the limitation is React-adapter-specific; the doc belongs at `packages/react/KNOWN_ISSUES.md`.
- ❌ Don't skip prettier — `.md` files are NOT in `.prettierignore`. Run `npx prettier --write` on both files before considering the task done.
- ❌ Don't cite the PASSING tests (Field.test.tsx lines 1088, 1271, 1393) as evidence of the limitation — they pass today. Reference ONLY the 5 `it.skip` cases (1132/1172/1226/1308/1356).
- ❌ Don't imply isDisabled is "unimplemented" — core fully implements it (evaluate.ts:84-87, core unit tests pass). The gap is React-adapter propagation only.
- ❌ Don't reflow other sections of packages/react/README.md — P1.M3.T1.S1 owns auto-save accuracy edits to that file. Keep this subtask's edit to a single new `## Known Issues` section.
- ❌ Don't leave an uncommitted mess — the two-file change (new KNOWN_ISSUES.md + modified README.md) should be the only thing in `git status`.

---

## Confidence Score

**10/10** — one-pass success likelihood.

Rationale: This is a documentation-only deliverable with no runtime/test impact.
All six required content points are fully specified by the item contract and verified
against live source during PRP authorship: (a) the exact title; (b) the symptom with
a broken-pattern example; (c) the root cause with verbatim quote of the
"CRITICAL: Do NOT add disabled to fieldStates (creates circular dependency)" comment
and the `evaluate.ts` `fieldState?.disabled` read; (d) two concrete workarounds
(value-based condition + explicit disabled prop), with the value-based pattern taken
directly from the Field.test.tsx skip-comment test config (line 1132 uses
`{ when: 'trigger', is: 'disable', ... }`); (e) the non-reactive registry future fix;
(f) the exact skip-comment line references (1132/1172/1226/1308/1356). The README
insertion point (between `## Testing & Coverage` and `## License`), the relative link
form (`./KNOWN_ISSUES.md`), and the prettier formatting gate are all verified. The
only failure modes are (1) editing a READ-ONLY file (explicitly forbidden + guarded
by `git diff --exit-code`), (2) a prettier failure (fixable with one
`prettier --write`), or (3) citing a passing test as broken (mitigated by the explicit
line list and anti-pattern warning). None of these can block one-pass success.
