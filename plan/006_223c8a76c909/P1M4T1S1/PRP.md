## Goal

**Feature Goal**: Add a new subsection to the root `README.md` that documents Formality's field-level overrides (`config[name]` can now carry `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, `getSubmitField` as per-instance overrides of their `InputConfig` counterparts), the single precedence rule, the override-vs-compose-vs-merge asymmetry, and a concise `switch`-defaults-on example.

**Deliverable**: A new `### Per-field overrides for type-level levers` subsection inserted under `## Value Transformation` in the root `README.md`, formatted with the file's existing markdown conventions (prose + fenced `tsx` example + small table + `>` blockquote gotcha). One file modified: `README.md`.

**Success Definition**: A reader of the root README can (a) discover that the six `InputConfig` levers are also settable per-field on `config[name]`, (b) learn the single precedence rule (field value wins when `!== undefined`), (c) learn that these six *override* while `validator` *composes* and `props` *merges*, and (d) see a copy-pasteable `switch`-defaults-on example — without having to read the internal PRD. `pnpm format:check` passes on `README.md`; the full suite (`pnpm test`, `pnpm typecheck`, `pnpm lint`) stays green.

## User Persona (if applicable)

**Target User**: React developer integrating Formality (the public README audience), as well as maintainers onboarding to the configuration model.

**Use Case**: A developer wants ONE field to behave differently from the other fields that share its input type — e.g. one `switch` that defaults **on** without making every switch default on — without spawning a whole new input type/component.

**User Journey**:
1. Developer reads the root README "Value Transformation" / "Composing input types" area to learn about `InputConfig` levers.
2. They encounter the new "Per-field overrides for type-level levers" subsection and learn those same levers can be set per-instance on `config[name]`.
3. They copy the `switch` example, adjust the lever, and ship — no new component, no PRD consultation.

**Pain Points Addressed**: Today the field-level capability exists in code (P1.M1–P1.M3 complete) but is **undocumented in every README** (verified: `packages/react/README.md#Per-field-debounce-overrides` documents only *type-level* `InputConfig.debounce`). Developers cannot discover the capability without reading source or the internal PRD.

## Why

- **Documentation sync (Mode B)**: This is the changeset-level doc-sync task for the P1 "Field-Level Type Overrides" effort. All implementing subtasks (P1.M1 types+helper, P1.M2 initial-value resolution, P1.M3 React adapter wiring) are **Complete**. This task runs last to surface the shipped capability to users.
- **Discoverability**: The root README is the primary user-facing entry point; the field-config levers already live there in the "Composing input types" bundle table, so a sibling subsection is the natural home.
- **Reduces copy-paste duplication**: The `switch`-defaults-on use case otherwise tempts users to register a whole new input type just to change one field's default — the new section shows the lighter path.

## What

A new `### Per-field overrides for type-level levers` subsection appended to the `## Value Transformation` section of `README.md`, immediately **before** the closing "See [`examples/02-input-types.tsx`]…" paragraph. It must, at minimum:

1. State that `FieldConfig` (`config[name]`) now accepts the six levers — `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, `getSubmitField` — as per-instance overrides of their `InputConfig` counterparts.
2. State the **single precedence rule**: the field-level value wins over the type-level value when it is **not `undefined`** — so `null`, `false`, `0`, and `""` are *meaningful* overrides/defaults (not "unset").
3. State the **override vs compose vs merge** asymmetry: these six *override*; `validator` *composes* (field runs, then type); `props` *merge*.
4. Include a concise, self-contained `switch`-defaults-on example (the canonical use case) showing one field overridden while siblings keep the type default.
5. Surface the `defaultValue`-specific gotcha: it is a new priority tier **between** `record`/`defaultValues` and the type default (not a bare `??` of the type default).

Do **NOT**:
- Duplicate the full PRD §6.4 specification. Surface the capability concisely.
- Reference internal PRD `§` numbers — the root README is user-facing and never cites PRD section numbers (verified convention).
- Touch any source file. This is a docs-only change to `README.md` only.

### Success Criteria

- [ ] New `### Per-field overrides for type-level levers` subsection exists under `## Value Transformation` in root `README.md`.
- [ ] All six lever names are named in the prose.
- [ ] The `!== undefined` precedence rule is stated with the `null`/`false`/`0`/`""` clarification.
- [ ] The override/compose/merge asymmetry is stated (six override; validator composes; props merge).
- [ ] A runnable `switch`-defaults-on `tsx` example is present and consistent with the project's existing `InputConfig`/`FieldConfig` shapes.
- [ ] No PRD `§` references in the new text.
- [ ] `pnpm format:check` passes (README is prettier-managed).
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` all remain green.

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** — this PRP supplies: the exact file and insertion anchor (unique text), the verified code facts (types + helper + precedence chain with file:line citations), the canonical example copy, the README style conventions to mirror, and the project-validated commands. The implementer needs only to read the existing "Composing input types" subsection for tone and then write the new markdown block.

### Documentation & References

```yaml
# MUST READ - exact insertion anchor and surrounding style
- file: README.md
  why: Target file. The new subsection goes UNDER "## Value Transformation" (L566).
  section: "## Value Transformation" → "### Composing input types: reuse a component + default props + named transforms" (L588-670)
  pattern: ### subsections with short prose + fenced ```tsx example + small tables + `>` blockquote gotchas.
  gotcha: README NEVER cites internal PRD `§` numbers. Cross-refs point to `examples/*.tsx` and `./packages/react/README.md#...` only.

- file: README.md
  why: UNIQUE INSERTION ANCHOR. Insert the new ### subsection immediately BEFORE this paragraph (it currently closes the Value Transformation section).
  anchor: |
    See [`examples/02-input-types.tsx`](./examples/02-input-types.tsx) for the full
    set of `InputConfig` options (named vs inline transforms, default `props`,
    `validator`, `template`, etc.).
  note: This paragraph text is unique in the file → safe for exact-text edit. The "\n\n---" separator follows it.

# MUST READ - verified code facts the new section must state (cite behavior, not line numbers, in the README)
- file: packages/core/src/types/config.ts
  why: Confirms the six FieldConfig override fields EXIST (so the docs reflect shipped reality). Fields: defaultValue?: unknown, debounce?: number | false, parser?: string | ((value:unknown)=>unknown), formatter?: (same), valueField?: string, getSubmitField?: (fieldName:string)=>string.
  pattern: Each field's JSDoc already documents per-instance override semantics — mirror that wording for user-facing prose.

- file: packages/core/src/config/defaults.ts
  why: Source of the single precedence rule and the defaultValue priority tier.
  critical: |
    resolveFieldOverType(fieldVal, typeVal) = fieldVal !== undefined ? fieldVal : typeVal  (L30-35)
    resolveInitialValue priority (L96-125): defaultValues[fieldName] → record[recordKey] → resolveFieldOverType(fieldConfig.defaultValue, inputConfig.defaultValue) → undefined.
    ⇒ field-level defaultValue is a NEW tier BETWEEN record/defaultValues and the type default — NOT a bare ?? of the type default.

- file: packages/react/README.md
  why: NAMING PRECEDENT to mirror. Uses "### Per-field debounce overrides" (L300) and the "Per-field X" phrasing.
  pattern: Adopt "### Per-field overrides for type-level levers" to stay consistent with the sibling react README's naming.
  gotcha: That react README section documents ONLY type-level InputConfig.debounce — it does NOT cover field-level overrides. Do not assume it is a duplicate; the root README subsection (this task) is the changeset-level sync.

- file: examples/02-input-types.tsx
  why: The existing cross-ref target of the Value Transformation section; confirms real InputConfig/FieldConfig shapes the example must match (component, defaultValue, props, etc.).

- docfile: plan/006_223c8a76c909/delta_prd.md
  why: The PRD delta that introduced §6.4 field-level overrides. Source of the override/compose/merge table and the canonical use cases. Translate the INTENT to user-facing prose (no § citations in README).

- docfile: plan/006_223c8a76c909/P1M4T1S1/research/readme-structure-and-insertion-point.md
  why: Sibling research note that already pinned the insertion point, README style, and verified code facts. This PRP is built on it.
```

### Current Codebase tree (relevant slice)

```bash
README.md                       # <-- ONLY file this task modifies (888 lines, ~33KB)
packages/core/src/types/config.ts       # FieldConfig override fields (shipped, read-only ref)
packages/core/src/config/defaults.ts    # resolveFieldOverType + resolveInitialValue (read-only ref)
packages/react/README.md                # "Per-field debounce overrides" naming precedent (read-only ref)
examples/02-input-types.tsx             # cross-ref target / shape reference (read-only ref)
.prettierignore                         # README is NOT ignored → prettier IS a gate
package.json                            # scripts: format, format:check, test, typecheck, lint
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
README.md   # MODIFIED ONLY. Adds one ### subsection (~40-70 lines incl. example + gotcha) under "## Value Transformation".
            # No new files. No source changes.
```

### Known Gotchas of our codebase & Library Quirks

```text
# CRITICAL: README.md is prettier-managed (NOT in .prettierignore). It currently passes `prettier --check`.
# A markdown table or code fence that breaks prettier's wrapping rules WILL fail `pnpm format:check`.
# Mitigation: run `pnpm format` (or `pnpm exec prettier --write README.md`) after editing; re-run `pnpm format:check`.

# CRITICAL: The root README never cites internal PRD §-numbers. Cross-refs are to ./examples/*.tsx and
# ./packages/react/README.md#<anchor>. Writing "see §6.4" would break convention and confuse users.

# GOTCHA: There is NO markdown linter (no markdownlint/remark config). Prettier is the ONLY markdown gate.

# GOTCHA: The "See [`examples/02-input-types.tsx`]…" paragraph is the VALUE-TRANSFORMATION section's closing
# note. Place the new ### subsection BEFORE it so that line stays the closing note of the whole section.

# GOTCHA: field-level defaultValue is NOT a bare ?? of the type default — it sits BELOW record and the
# defaultValues Form prop in the initial-value chain. The new gotcha callout must state this precisely.

# CRITICAL: This is a DOCS-ONLY task. Do not touch packages/** source, PRD.md, tasks.json, or any test.
```

## Implementation Blueprint

### Data models and structure

Not applicable — this task changes no data models. The models it *documents* already exist and are verified (see Context). For reference, the shipped `FieldConfig` override fields are:

```typescript
// packages/core/src/types/config.ts (shipped — read-only reference for the doc prose)
defaultValue?: unknown;
debounce?: number | false;
parser?: string | ((value: unknown) => unknown);
formatter?: string | ((value: unknown) => unknown);
valueField?: string;
getSubmitField?: (fieldName: string) => string;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ the insertion site and style precedents
  - READ: README.md lines ~566-672 (## Value Transformation through the closing "See examples" paragraph).
  - READ: packages/react/README.md lines ~300-340 (### Per-field debounce overrides) for the "Per-field X" naming and table style.
  - READ: packages/core/src/config/defaults.ts (resolveFieldOverType + resolveInitialValue) to confirm exact precedence facts.
  - GOAL: internalize tone, fenced-code-block style, blockquote gotcha style, and the verified precedence facts BEFORE writing.

Task 2: EDIT README.md — insert the new ### subsection (THE ONLY TASK)
  - EDIT file: README.md
  - INSERT: a new "### Per-field overrides for type-level levers" subsection IMMEDIATELY BEFORE the
            "See [`examples/02-input-types.tsx`](./examples/02-input-types.tsx) for the full set …" paragraph.
  - ANCHOR (oldText) for the exact-text edit — use this paragraph + the following separator:
      See [`examples/02-input-types.tsx`](./examples/02-input-types.tsx) for the full
      set of `InputConfig` options (named vs inline transforms, default `props`,
      `validator`, `template`, etc.).

      ---
    (This block is unique in the file.) Place the new subsection text BEFORE it, preserving the paragraph + "---" verbatim.
  - CONTENT REQUIREMENTS (see "Content blueprint" below for exact copy to adapt):
      a. One-paragraph intro: the six InputConfig levers (defaultValue, debounce, parser, formatter, valueField, getSubmitField) are ALSO settable per-instance on config[name], overriding the type-level value for ONE field only.
      b. A fenced ```tsx example: the canonical switch-defaults-on case (see "Canonical example" below).
      c. The single precedence rule as a short callout/table: field value wins when !== undefined → null/false/0/"" are meaningful.
      d. The override-vs-compose-vs-merge asymmetry (six override; validator composes; props merge) — a small table or one-line bullet set.
      e. A `>` blockquote gotcha: field-level defaultValue is a new priority tier BETWEEN record/defaultValues and the type default (NOT a bare ?? of the type default).
  - STYLE: mirror existing ### subsections — prose + ```tsx fence + optional table + `>` gotcha. NO PRD § references. Use ./examples/*.tsx and ./packages/react/README.md#... cross-refs only.
  - PRESERVE: the "See [`examples/02-input-types.tsx`]…" paragraph and the "---" separator unchanged.
  - DO NOT: modify any other file. Do not add new headings above ### (the parent is "## Value Transformation").

Task 3: VALIDATE (format first, then no-regression suite)
  - RUN: pnpm format   (auto-fix any markdown wrapping the new block triggers)
  - RUN: pnpm format:check   (MUST pass on README.md)
  - RUN: pnpm test     (coverage gate stays green; docs change cannot reduce coverage)
  - RUN: pnpm typecheck && pnpm lint   (no-regression sanity — README change shouldn't affect these)
```

### Implementation Patterns & Key Details

#### Canonical example (the switch-defaults-on case the contract requires)

Adapt this into the fenced ```tsx block. It is concise, self-contained, and demonstrates per-instance override without affecting siblings — consistent with the project's existing `InputConfig`/`FieldConfig` shapes:

```tsx
// Type-level default: every switch starts OFF.
const inputs = {
  switch: { component: Switch, defaultValue: false },
};

// Per-field override: ONE switch ("active") starts ON; siblings keep the type default.
const config = {
  active: { type: "switch", defaultValue: true }, // overrides the type default
  paused: { type: "switch" }, // no override → starts OFF (type default)
};

// <Field name="active" /> → starts ON
// <Field name="paused" /> → starts OFF
```

#### Content blueprint (prose the implementer should adapt — keep it concise, do not paste the PRD verbatim)

Intro paragraph (adapt to README voice):

> The six type-level levers — `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, `getSubmitField` — are also available **per field** on `config[name]`. Setting one on a single `FieldConfig` overrides the input type's value for that field only, leaving every other field of the same type untouched.

Precedence rule (one short line + clarification):

> **One rule for all six.** A field-level value wins over the type-level value whenever it is **not `undefined`** — so `null`, `false`, `0`, and `""` are meaningful overrides, not treated as "unset".

Override-vs-compose-vs-merge (small table or bullets — translate from the PRD intent, no `§`):

| Lever set per-field | Field ↔ Type |
| ------------------- | ------------ |
| `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, `getSubmitField` | **override** (field wins when set) |
| `validator` | **compose** (field runs, then type) |
| `props` | **merge** (type props spread under field props) |

`>` blockquote gotcha (the defaultValue tier nuance):

> **`defaultValue` is a new priority tier, not a fallback.** A field-level `defaultValue` sits *below* the `record` value and an explicit `defaultValues` Form prop, and *above* the type's `defaultValue`. So on an edit form, a real record value still wins; the field default only fills in when the record omits the key.

### Integration Points

```yaml
FILES MODIFIED:
  - README.md   # one ### subsection inserted under "## Value Transformation", before the "See examples/02-input-types.tsx" paragraph.

FILES NOT MODIFIED (read-only references / out of scope):
  - PRD.md                          # read-only, owned by humans
  - plan/**/tasks.json              # owned by orchestrator
  - packages/core/src/types/config.ts          # shipped (P1.M1.T1.S1) — referenced, not edited
  - packages/core/src/config/defaults.ts       # shipped (P1.M1.T1.S2 / P1.M2.T1.S1) — referenced, not edited
  - packages/react/README.md       # P1.M4.T1.S2 is a SEPARATE task (JSDoc consistency) — not this one
  - Any test file                   # docs-only; no test changes

CONFIG / DATABASE / ROUTES: none (pure documentation).
```

## Validation Loop

### Level 1: Markdown Formatting (Immediate Feedback)

```bash
# README.md is prettier-managed (NOT in .prettierignore). Run after editing.
pnpm exec prettier --check README.md   # expect: clean. If it fails, READ the diff.

# Auto-fix markdown wrapping (table/code-fence) the new block may trigger:
pnpm exec prettier --write README.md
# (or project-wide: pnpm format)

# Re-confirm:
pnpm format:check   # MUST pass — this is the real markdown gate for the PR.
# Expected: all files clean, zero errors. README.md must appear in the passing set.
```

### Level 2: No-Regression Suite (Component Validation)

```bash
# Docs-only change: these cannot be broken BY this change, but confirm the tree is green.
pnpm test           # vitest run; enforces the 90/90/90/90 coverage gate. Must stay green.
pnpm typecheck      # tsc --build across the monorepo. Must stay green.
pnpm lint           # eslint . across the monorepo. Must stay green.
# Expected: identical to the pre-change baseline (no new failures).
```

### Level 3: Content / Manual Review (System Validation)

```bash
# Render-check: confirm the new subsection reads correctly and is correctly nested.
# 1. Confirm the new ### sits UNDER ## Value Transformation and BEFORE the "See examples" paragraph:
grep -n -E "^(## Value Transformation|### Per-field overrides for type-level levers|See \[.examples/02-input-types)" README.md
# Expected ordering by line number:
#   <N>  ## Value Transformation
#   <N>  ### Per-field overrides for type-level levers
#   <N>  See [`examples/02-input-types.tsx`]...   (closing note, unchanged)

# 2. Confirm all six lever names appear in the new prose (none dropped):
grep -n -E "defaultValue|debounce|parser|formatter|valueField|getSubmitField" README.md | tail -20

# 3. Confirm NO PRD §-references leaked into the README (forbidden convention):
! grep -nE "§[0-9]" README.md && echo "OK: no PRD section refs in README"

# 4. Confirm the forbidden files were NOT touched:
git status --porcelain
# Expected: ONLY README.md modified. Nothing under packages/, PRD.md, plan/, or any test.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Render the README locally (optional, if a previewer is available) to eyeball:
#   - the fenced ```tsx block renders as code,
#   - the override/compose/merge table renders aligned,
#   - the `>` gotcha renders as a blockquote.
# (No project-bundled markdown renderer; a GitHub render or `glow`/`mdcat` is sufficient.)

# Confirm the example is consistent with the real shipped types (sanity, not a build step):
#   FieldConfig.defaultValue?: unknown         -> { type: "switch", defaultValue: true }  ✓
#   FieldConfig has no required override keys  -> { type: "switch" } (no override) is valid ✓
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm format:check` passes (README.md is prettier-managed — the real gate).
- [ ] `pnpm test` green (coverage gate unaffected).
- [ ] `pnpm typecheck` green (no-regression).
- [ ] `pnpm lint` green (no-regression).

### Feature Validation

- [ ] New `### Per-field overrides for type-level levers` subsection exists under `## Value Transformation`.
- [ ] All six levers named: `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, `getSubmitField`.
- [ ] The `!== undefined` precedence rule stated with the `null`/`false`/`0`/`""` clarification.
- [ ] Override/compose/merge asymmetry stated (six override; validator composes; props merge).
- [ ] A `switch`-defaults-on ```tsx example present and consistent with shipped `InputConfig`/`FieldConfig` shapes.
- [ ] `defaultValue`-tier gotcha present (between record/defaultValues and type default; not a bare `??`).
- [ ] The "See [`examples/02-input-types.tsx`]…" paragraph and the `---` separator preserved unchanged.

### Code Quality Validation

- [ ] Mirrors existing `###` subsection conventions (prose + ```tsx + table + `>` gotcha).
- [ ] No internal PRD `§` references (README is user-facing).
- [ ] No source files, tests, `PRD.md`, or `tasks.json` modified.
- [ ] Insertion placed BEFORE the "See examples" paragraph so it stays the section's closing note.

### Documentation & Deployment

- [ ] Prose is self-documenting and concise (does not duplicate the full PRD §6.4 spec).
- [ ] Example is copy-pasteable and self-contained.
- [ ] Cross-references (if any) point only to `./examples/*.tsx` or `./packages/react/README.md#...`.

---

## Anti-Patterns to Avoid

- ❌ Don't copy-paste the full PRD §6.4 text into the README — surface the capability concisely.
- ❌ Don't cite internal PRD `§`-numbers (e.g. "see §6.4") — the root README never does.
- ❌ Don't move the "See [`examples/02-input-types.tsx`]…" paragraph or the `---` separator — insert before them.
- ❌ Don't touch `packages/**` source, `PRD.md`, `tasks.json`, or any test — docs-only, README.md only.
- ❌ Don't claim `defaultValue` is a "bare `??` fallback" — it is a new priority tier between record/defaultValues and the type default.
- ❌ Don't say the six levers "compose" — they **override**; only `validator` composes and `props` merge.
- ❌ Don't skip `pnpm format:check` — README.md is prettier-managed and it IS the gate for this change.

---

## Confidence Score

**9/10** — One-pass success is highly likely. The task is a single markdown insertion with a verified unique anchor, code-confirmed facts (types, helper, precedence chain all cited with file:line), an explicit content blueprint, a ready canonical example, and project-validated commands. The only residual risk is markdown table/fence prettier wrapping, which `pnpm format` auto-fixes deterministically.

Dependencies satisfied: P1.M1 (types + helper), P1.M2 (initial-value resolution), P1.M3 (React adapter wiring) are all **Complete** — the feature being documented is shipped, so this sync reflects real behavior.
