name: "P1.M3.T1.S2 — Update root README.md where it touches type safety + coverage"
description: |

  Mode B changeset-level documentation sweep (delta PRD R5 / PRD §1.3.7 + Appendix C
  §C.8). Sync the TWO areas of the repo-root `README.md` that are affected by the
  P1.M1 (type-safety exports: R2/R3/R4) + P1.M2.T1.S5 (90% coverage gate: R1)
  changeset — nothing else.

---

## Goal

**Feature Goal**: Bring the repo-root `README.md`'s type-safety surface and
testing/coverage guidance into sync with the changeset that just landed
(generic `<Form<TFieldValues>>` / `<Field name>` key-checking, `defineInputs`,
`FormalityFieldComponentProps`, and the enforced 90% coverage gate). Eliminate
stale/missing claims. **Minimal edits only** — this is an overview/landing
README, not the detailed reference.

**Deliverable**: An **edited** root `README.md` (one file, additive/accurate)
containing exactly two changes:

1. **(Part a — type safety)** One concise new `## Type Safety` section that
   *names* the four new consumer-facing capabilities and **links to
   `packages/react/README.md`** (the sibling-S1 detailed reference) for full
   snippets — it does **not** duplicate them. (The root README has no existing
   features/type-safety list to extend, so one new overview section is the
   accurate, minimal move.)
2. **(Part b — coverage)** Two surgical updates inside `## Development` /
   `## Contributing`: add a `pnpm test:coverage` row to the `### Scripts` table,
   and rewrite the `### Testing` subsection to state the **90% gate** (all four
   metrics), the **exclusions**, and a link to **PRD §1.3.7**.

**Success Definition**:
- The four type-safety capabilities are **named** in the root README and each
  maps to a **real** export (verified by grep against
  `packages/react/src/index.ts` — see Validation Level 2).
- The coverage facts in the README **exactly match** `vitest.config.ts`
  (90/90/90/90; v8; exclude `examples/**`, `packages/svelte/**`,
  `packages/vue/**`, `**/dist/**`).
- The new Type Safety section **links to** `packages/react/README.md` and does
  **not** copy S1's `@ts-expect-error`/before-after snippets (no duplication).
- `git diff --stat` shows **exactly one file** (`README.md`). `packages/react/README.md`,
  source, tests, config, and `package.json` are untouched.

## User Persona (if applicable)

**Target User**: A developer evaluating Formality from the repo root — scanning
the landing README to learn (a) what type-safety guarantees the library gives
them, and (b) what the contribution/testing bar is. The primary downstream
beneficiary is the `sellario-ui` consumer adopting the new types.

**Use Case**: Reader opens the root README, sees a Type Safety overview, clicks
through to `packages/react/README.md` for copy-paste snippets; a contributor
reads the Testing subsection and knows the 90% gate + how to run coverage.

**Pain Points Addressed**:
- The root README currently has **zero** mention of the new type-safety exports
  (they only exist in source) — the overview under-sells/omits a shipped feature.
- The Testing subsection uses the non-canonical `pnpm test -- --coverage` and
  says **nothing** about the enforced 90% gate or the exclusions, so contributors
  discover the gate only when CI fails.

## Why

- **Delta PRD R5** ("Sync changeset-level documentation") requires the root
  README's overview/feature and testing sections to be in sync with the
  changeset — "no stale claims."
- **PRD §1.3.7 (h4.6)** + **§B (h3.95)** — the 90% coverage gate is a hard,
  documented quality bar; the root README's Testing/Contributing sections must
  state it.
- **PRD §C.4 (h4.60/h4.61/h4.62) + §C.8 (h3.117)** — the type-safety exports are
  a named deliverable; the root README overview should surface them and point to
  the detailed reference.
- **Sequencing**: Inputs are all present — P1.M1.T1/T2/T3 (exports) are
  COMPLETE; P1.M2.T1.S5 (coverage threshold block) is COMPLETE (verified in
  `vitest.config.ts`). The detailed React README (P1.M3.T1.S1) is being
  implemented in parallel and is treated as a **contract** — its `## Type Safety`
  section WILL exist for the root README to deep-link.

## What

A **single-file, additive/accurate** markdown edit. No code, no tests, no
runtime, no config, no `package.json`, no other README. The root README is an
**overview** — the edit is deliberately lighter than the React-package README
(S1): it names capabilities and links out, rather than reproducing snippets.

### Success Criteria

- [ ] Root `README.md` has a new `## Type Safety` section naming all four
      capabilities (generic `<Form<TFieldValues>>` config key-check, generic
      `<Field name>` name-check, `defineInputs`/`InputType`,
      `FormalityFieldComponentProps`) and linking to `packages/react/README.md`.
- [ ] The Type Safety section does **not** duplicate S1's copy-paste snippets
      (`@ts-expect-error` cases, before/after `WithFormality`).
- [ ] `### Scripts` table includes a `pnpm test:coverage` row.
- [ ] `### Testing` subsection states: `pnpm test:coverage`; ≥90% on
      statements/branches/functions/lines; the gate fails the build below 90%;
      the four exclusion globs; and links PRD §1.3.7.
- [ ] Coverage facts in the README **exactly match** `vitest.config.ts`.
- [ ] `git diff --stat` = exactly one file (`README.md`).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: (1) the exact
file to edit and where each change goes (line anchors), (2) the exact
capabilities to name + that they're real exports, (3) the exact coverage facts,
(4) the sibling-S1 boundary (link, don't duplicate; don't edit that file), and
(5) the out-of-scope stale `DEVELOPMENT.md` link to leave alone. All cited
below with exact paths/line numbers. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- file: README.md
  why: THE file to edit. Read it end to end first. Note it is an OVERVIEW
        README (no granular features list; type safety only hinted at L185 prose
        and L447 table row). Match its tone: ## headers, fenced ```bash/```tsx
        blocks, terse prose, tables.
  gotcha: |
    The root README is the landing doc. Do NOT turn it into a reference manual.
    Name capabilities + link out; do not paste long snippets.

- file: packages/react/src/index.ts
  why: |
    The SINGLE source of truth for what is actually exported. Every capability
    named in the new Type Safety section MUST resolve to an export here:
      value defineInputs
      type  ReactInputConfig, ReactFieldConfig, ReactFormFieldsConfig,
            FormalityFieldComponentProps
      type  FormProps (generic <TFieldValues>), FieldProps (generic <TName>)
    (RefCallBack/UseFormStateReturn/FieldValues are re-exported RHF types.)
  critical: Run the Level 2 grep before/after writing — zero "MISSING" allowed.

- file: vitest.config.ts
  why: Source of truth for the coverage facts to transcribe EXACTLY:
        provider v8; exclude = coverageConfigDefaults.exclude + examples/**,
        packages/svelte/**, packages/vue/**, **/dist/**; thresholds 90/90/90/90.
  critical: Transcribe the four exclusion globs + their reason verbatim from
            PRD §1.3.7. Do not paraphrase the threshold (it is ALL FOUR metrics).

- file: package.json
  why: Confirms the script names exist: `test:coverage` = `vitest run --coverage`.
        Use the canonical `pnpm test:coverage` (the current README uses the
        non-canonical `pnpm test -- --coverage` — replace it).

- docfile: plan/002_78ea74508dd8/P1M3T1S2/research/root-readme-touchpoints.md
  why: |
    This task's own field guide. Read FIRST. Contains: the verified section map
    with line numbers, the exact two touchpoint regions (with current text), the
    verified export list, the verified coverage facts, the sibling-S1 boundary,
    and the out-of-scope stale DEVELOPMENT.md link note.

- docfile: plan/002_78ea74508dd8/P1M3T1S1/PRP.md
  section: Goal + Integration Points
  why: |
    CONTRACT for the sibling React-README task. Confirms S1 adds a `## Type
    Safety` section to packages/react/README.md — so the root README can safely
    deep-link to it. Also confirms the sibling boundary: S1 owns
    packages/react/README.md; S2 owns root README.md; ZERO overlap.

- docfile: PRD.md §1.3.7 (h4.6)
  why: Verbatim source for the 90%/all-four-metrics bar + the exclusion table
        (examples/** = Demo apps; packages/svelte/**, packages/vue/** = stubbed
        adapters). Transcribe the reason column.
- docfile: PRD.md §C.4 (h4.60/h4.61/h4.62) + §C.8 (h3.117)
  why: The requirements the Type Safety section summarizes.

- url: https://vitest.dev/guide/coverage.html#coverage-thresholds
  why: Authoritative cite for "thresholds fail the run below the floor" —
        optionally link from the Testing subsection.
```

### Current Codebase tree (relevant slice)

```bash
README.md                                   # ← THE file to EDIT (minimal, accurate)
packages/react/src/index.ts                 # public surface — verify capabilities resolve here
vitest.config.ts                            # coverage gate facts (transcribe verbatim)
package.json                                # script names (pnpm test:coverage exists)
packages/react/README.md                    # S1's file — LINK to it; DO NOT edit/duplicate
plan/002_78ea74508dd8/P1M3T1S2/research/root-readme-touchpoints.md  # field guide
```

### Desired Codebase tree with files to be modified

```bash
README.md   # MODIFIED — +1 new section (Type Safety), +2 surgical updates
            #            (Scripts table row, Testing subsection rewrite)
# (no other files change)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: This is Mode B (documentation). The diff MUST be exactly one file
     (root README.md). Do NOT edit packages/react/README.md (sibling S1 owns it),
     any source/test/config file, or package.json. -->

<!-- CRITICAL: The root README is an OVERVIEW. Do NOT duplicate S1's detailed
     snippets (@ts-expect-error cases, WithFormality before/after, defineInputs
     example block). Name the capabilities and LINK to packages/react/README.md.
     Duplicating creates two sources of truth that will drift. -->

<!-- CRITICAL: Name-checking for <Field name="..."> is OPT-IN / engages only when
     FieldProps is narrowed. It is NOT automatic from <Form<TFieldValues>> (React
     generics don't thread into children). State this honestly if you describe
     it — do NOT imply <Form<T>> auto-checks child <Field> names. -->

<!-- CRITICAL: Transcribe the coverage facts from vitest.config.ts EXACTLY. The
     gate is 90 on ALL FOUR metrics (statements, branches, functions, lines) —
     not "≥90% coverage". The four exclusion globs are examples/**,
     packages/svelte/**, packages/vue/**, **/dist/** (plus vitest defaults).
     Paraphrasing these is the #1 accuracy risk. -->

<!-- CRITICAL: Use the canonical `pnpm test:coverage` (defined in package.json).
     The current README uses `pnpm test -- --coverage` — replace it. -->

<!-- OUT OF SCOPE (do NOT fix): the ## Documentation table links
     [Development Guide](./DEVELOPMENT.md) but DEVELOPMENT.md does not exist.
     This is pre-existing and unrelated to this changeset. Leave it. Flag in the
     PR description if you like, but do not edit it here. -->

<!-- GOTCHA: GitHub anchor for PRD.md "#### 1.3.7 Testing Strategy" is not
     guaranteed stable. Safest: link `./PRD.md` and reference "§1.3.7 (Testing
     Strategy)" in prose. An anchor like `./PRD.md#137-testing-strategy` may
     work on GitHub but is brittle — prefer prose + file link. -->
```

## Implementation Blueprint

### Data models and structure

None — pure markdown documentation.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — read the file to edit + the two sources of truth + field guide
  - READ: README.md  (end to end; note section order + that it's an OVERVIEW)
  - READ: packages/react/src/index.ts  (the exact public surface)
  - READ: vitest.config.ts  (the exact coverage facts)
  - READ: plan/002_78ea74508dd8/P1M3T1S2/research/root-readme-touchpoints.md
          (the field guide — has line numbers + current text of both touchpoints)
  - RUN the symbol-existence grep (Validation Level 2) to confirm every
    capability you plan to name REALLY exports. Fix any "MISSING" before writing.

Task 2: (Part a) ADD the `## Type Safety` section  (concise overview + link-out)
  - FILE: README.md
  - WHERE: insert AFTER `## Value Transformation` (ends ~L549) and BEFORE
           `## Architecture` (L551). (Alternative acceptable placement: after
           `## Field Dependencies` ~L449 / before `## Validation` L451, since
           type-safety is already referenced there. Pick ONE; do not add two.)
  - STRUCTURE: one `## Type Safety` header, a 1–2 sentence intro, then a short
           bulleted list naming the four capabilities — each as a one-liner
           with the symbol name in backticks. End with a single line linking to
           the detailed reference:
             "For full type signatures and copy-paste examples, see the
              [React package README](./packages/react/README.md#type-safety)."
  - CONTENT (name these four, accurately — all are REAL exports):
      - **Checked `Form` config keys** — `<Form<TFieldValues>>` rejects unknown
        `config` keys (typos like `ofice`). Backwards compatible: default
        `<Form>` still accepts any string key.
      - **Checked `Field` names (opt-in)** — `FieldProps<TName>` narrows `name`.
        Checking engages only when narrowed; it is NOT automatic from
        `<Form<TFieldValues>>`.
      - **`defineInputs` / `InputType` (opt-in)** — derive a union of your
        input-type keys for `keyof` checking on `Field` `type` / `FieldConfig.type`.
      - **`FormalityFieldComponentProps<P>`** — the shipped injected-props type,
        replacing the hand-rolled lossy `WithFormality<P>`.
  - STYLE: match existing README (## header, terse prose, backticked symbols,
           ```tsx only if a tiny 1–2 line illustration truly helps; prefer
           NO long snippets — link out instead).
  - DO NOT DUPLICATE: no `@ts-expect-error` blocks, no `WithFormality`
           before/after, no `defineInputs` example object. Those live in S1.

Task 3: (Part b) UPDATE the `### Scripts` table  (add one row)
  - FILE: README.md (the `### Scripts` table, ~L656–665)
  - ADD a row (keep existing rows; alphabetical/logical placement is fine):
        | `pnpm test:coverage` | Run tests with the 90% coverage gate |
  - DO NOT remove/reorder existing rows.

Task 4: (Part b) REWRITE the `### Testing` subsection  (canonical command + gate)
  - FILE: README.md (the `### Testing` subsection, ~L689–699)
  - REPLACE the current bash block (which uses `pnpm test -- --coverage`) with
           the canonical commands:
        ```bash
        pnpm test                          # run all tests
        pnpm test:coverage                 # run tests + enforce the 90% coverage gate
        pnpm test --filter=@formality-ui/core
        pnpm test --filter=@formality-ui/react
        ```
  - ADD a concise note (a short paragraph or small table — NOT an essay):
      - **The bar**: ≥ 90% across statements, branches, functions, **and** lines
        (all four). The run exits non-zero (fails CI) if any drops below.
      - **Scope**: repo-wide merged coverage (core + react). All code in
        `packages/core/**` and `packages/react/**` is in scope.
      - **Exclusions** (not measured against the gate) — small table, reason
        column transcribed from PRD §1.3.7:
          examples/**        — Demo apps; not shipped
          packages/svelte/** — Stubbed adapter (no implementation yet)
          packages/vue/**    — Stubbed adapter (no implementation yet)
          **/dist/**         — Build output
      - **Link**: "See [PRD §1.3.7 — Testing Strategy](./PRD.md) for the full
        specification." (Use prose §1.3.7 reference + the ./PRD.md file link;
        anchor optional/brittle.)
  - KEEP IT SHORT. The item asks for a note, not a section. One command block +
    one short paragraph (or 4-row exclusion table) + one link is the right size.

Task 5: VERIFY — accuracy, scope, no-duplication (run BEFORE declaring done)
  - 5a. SYMBOL EXISTENCE: every capability named in the new Type Safety section
       resolves to a real export in packages/react/src/index.ts (Level 2 grep).
       ZERO "MISSING".
  - 5b. COVERAGE FACTS MATCH: the exclusions + 90/all-four in the README match
       vitest.config.ts exactly (Level 4 grep).
  - 5c. NO DUPLICATION: the new Type Safety section does NOT contain
       `@ts-expect-error`, `WithFormality`, or a multi-line `defineInputs({...})`
       example (those are S1's content). It DOES contain a link to
       packages/react/README.md.
  - 5d. SCOPE: `git diff --stat` shows EXACTLY ONE file (`README.md`).
  - 5e. CANONICAL COMMAND: README uses `pnpm test:coverage`, not
       `pnpm test -- --coverage`.
```

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN — the Type Safety section (overview shape; fill one-liners accurately): -->
## Type Safety

Formality ships precise React / react-hook-form types so configuration mistakes
are caught at compile time. The capabilities below are all opt-in or
backwards-compatible — existing code keeps compiling unchanged.

- **Checked `Form` config keys** — `<Form<TFieldValues>>` rejects unknown `config`
  keys (typos like `ofice`). Default `<Form>` still accepts any string key.
- **Checked `Field` names (opt-in)** — narrow `FieldProps<TName>` to get `name`
  checking. (Not automatic from `<Form<TFieldValues>>` — narrow explicitly.)
- **`defineInputs` / `InputType` (opt-in)** — derive a union of your input-type
  keys for `keyof` checking on `Field` `type`.
- **`FormalityFieldComponentProps<P>`** — the shipped injected-props type,
  replacing a hand-rolled `WithFormality<P>`.

For full type signatures and copy-paste examples, see the
[React package README](./packages/react/README.md#type-safety).

<!-- PATTERN — the Testing note (short): -->
### Testing

```bash
pnpm test                          # run all tests
pnpm test:coverage                 # run tests + enforce the 90% coverage gate
pnpm test --filter=@formality-ui/core
pnpm test --filter=@formality-ui/react
```

Coverage is enforced at **≥ 90%** across statements, branches, functions, **and**
lines — the build fails below that floor (v8 provider, PRD §1.3.7). The gate
applies repo-wide to all shipped code (`packages/core/**`, `packages/react/**`).
The following are excluded from the measurement:

| Excluded path        | Reason                                  |
| -------------------- | --------------------------------------- |
| `examples/**`        | Demo apps; not shipped                  |
| `packages/svelte/**` | Stubbed adapter (no implementation yet) |
| `packages/vue/**`    | Stubbed adapter (no implementation yet) |
| `**/dist/**`         | Build output                            |

See [PRD §1.3.7 — Testing Strategy](./PRD.md) for the full specification.

<!-- GOTCHA: keep the section sizes close to the patterns above. The root README
     is an overview; long reference content belongs in packages/react/README.md
     (S1) and PRD.md. -->
```

### Integration Points

```yaml
DOCUMENTATION (this task):
  - file: README.md  (repo root)
  - changes:
      (a) ADD `## Type Safety` section (overview + link to packages/react/README.md)
      (b) ADD `pnpm test:coverage` row to `### Scripts` table
      (b) REWRITE `### Testing` subsection (canonical command + 90% gate + exclusions + PRD §1.3.7 link)
  - preserve: every other section, the stale DEVELOPMENT.md link, tone, tables.

DOCUMENTATION (NOT in scope — sibling S1):
  - file: packages/react/README.md   → NONE (owned by P1.M3.T1.S1). Link, don't edit.

CODE / TESTS / CONFIG / PACKAGE.JSON:
  - change: NONE. Mode B documentation only.
```

## Validation Loop

### Level 1: Markdown & Style (Immediate Feedback)

```bash
# Section structure intact + new section in a sensible position:
grep -nE "^#{2} " README.md
# Expected: a `## Type Safety` line present; existing sections unchanged;
# `## Architecture`, `## License` etc. still present in order.

# Prettier (if configured on .md — accept its formatting for new lines):
pnpm exec prettier --check README.md || pnpm exec prettier --write README.md
# (If prettier isn't configured for markdown, this is a no-op / not a gate.)

# ESLint typically does NOT lint .md — do not expect lint to cover this file.
```

### Level 2: Accuracy — every named capability really exports (THE key gate)

```bash
# Every capability named in the new Type Safety section must resolve to a real
# export in packages/react/src/index.ts.
for sym in defineInputs FormalityFieldComponentProps ReactInputConfig \
           ReactFieldConfig ReactFormFieldsConfig FormProps FieldProps; do
  grep -q "\b$sym\b" packages/react/src/index.ts \
    && echo "OK:     $sym" \
    || echo "MISSING: $sym  ← NOT EXPORTED — fix the README or stop claiming it"
done
# Expected: all "OK", zero "MISSING".
```

### Level 3: Coverage facts match the config (high-signal correctness)

```bash
# The README's coverage claims must match vitest.config.ts exactly.
grep -nE "90%|statements|branches|functions|lines" README.md   # 90 / all four
grep -nE "examples/\*\*|packages/svelte|packages/vue|dist" README.md   # 4 globs
grep -nE "test:coverage" README.md   # canonical command present
grep -nE "1\.3\.7|Testing Strategy" README.md   # PRD link/reference present
# Cross-check: vitest.config.ts must contain the same four globs + 90 thresholds.
grep -nE "examples/\*\*|packages/svelte|packages/vue|dist|90" vitest.config.ts
```

### Level 4: Scope & no-duplication review (manual, final)

```bash
# 1. SCOPE — exactly one file changed:
git diff --stat
# Expected: only README.md. packages/react/README.md and everything else untouched.

# 2. NO DUPLICATION of S1's detailed snippets:
grep -nE "@ts-expect-error|WithFormality" README.md
# Expected: ZERO hits in the NEW Type Safety section (those live in S1). (The
# pre-existing L447 table row "TypeScript type safety | Function" is unrelated
# and may remain; do not conflate.)

# 3. LINK-OUT present (Type Safety points to the React README, not a duplicate):
grep -nE "packages/react/README" README.md
# Expected: at least one link from the Type Safety section.

# 4. CANONICAL command (no stale `pnpm test -- --coverage`):
grep -nE "pnpm test -- --coverage" README.md && echo "STALE COMMAND STILL PRESENT" || echo "canonical OK"

# 5. NAME-CHECK honesty (Field checking is opt-in, not automatic from <Form<T>>):
grep -nE "narrow|opt-in|not automatic|engages" README.md
# Expected: text stating Field name-checking is opt-in / engages when narrowed.

# 6. OUT-OF-SCOPE preserved (stale DEVELOPMENT.md link left alone):
grep -nE "DEVELOPMENT\.md" README.md
# Expected: the pre-existing link is still there (we did NOT touch it).
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: README structure intact; new `## Type Safety` present;
      prettier (if configured) clean.
- [ ] Level 2 passed: symbol-existence grep shows zero "MISSING".
- [ ] Level 3 passed: coverage facts in README match `vitest.config.ts` exactly.
- [ ] Level 4 passed: scope = one file; no S1 duplication; link-out present;
      canonical command; opt-in Field checking stated honestly; stale
      DEVELOPMENT.md link preserved (out of scope).

### Feature Validation

- [ ] `## Type Safety` names all four capabilities (Form key-check, Field
      name-check, `defineInputs`/`InputType`, `FormalityFieldComponentProps`)
      and links to `packages/react/README.md`.
- [ ] `### Scripts` table has a `pnpm test:coverage` row.
- [ ] `### Testing` subsection states `pnpm test:coverage`, the 90%/all-four
      gate, the exclusions table, and links PRD §1.3.7.
- [ ] Field name-checking described as opt-in/narrowed (not automatic).
- [ ] Type Safety section does NOT duplicate S1's snippets.

### Code Quality Validation

- [ ] New section matches the existing README's tone, header depth, fence style.
- [ ] No contradictions with Quick Start or other sections.
- [ ] Links resolve (`./packages/react/README.md`, `./PRD.md`).
- [ ] No source/test/config/package.json/other-README changes.

### Documentation & Deployment

- [ ] The root README is a coherent overview whose type-safety + testing claims
      are accurate to the shipped changeset.
- [ ] `packages/react/README.md` left entirely for sibling `P1.M3.T1.S1`.

---

## Anti-Patterns to Avoid

- ❌ Don't name a capability that isn't exported — run the Level 2 grep FIRST and
  fix any "MISSING" before writing prose around it.
- ❌ Don't duplicate S1's detailed snippets (`@ts-expect-error` cases,
  `WithFormality` before/after, the `defineInputs({...})` example) in the root
  README. Name + link; the root is an overview, not a reference.
- ❌ Don't claim `<Field name="...">` is auto-narrowed by `<Form<TFieldValues>>`.
  It is not. State the opt-in/narrowed pattern honestly.
- ❌ Don't paraphrase the coverage gate. It is 90 on **all four** metrics
  (statements, branches, functions, lines), and the four exclusion globs are
  fixed. Transcribe from `vitest.config.ts` / PRD §1.3.7 exactly.
- ❌ Don't keep the stale `pnpm test -- --coverage` — use the canonical
  `pnpm test:coverage` (defined in `package.json`).
- ❌ Don't edit `packages/react/README.md`, any source/test/config file, or
  `package.json`. Sibling `P1.M3.T1.S1` owns the React README; everything else
  is out of scope for Mode B.
- ❌ Don't "fix" the stale `[Development Guide](./DEVELOPMENT.md)` link while
  you're in there. It's pre-existing and unrelated to this changeset — touching
  it is scope creep. (Flag it in the PR description instead.)
- ❌ Don't pad the Type Safety or Testing sections into essays. Overview README:
  name + link (Type Safety); command + short note + tiny exclusion table
  (Testing).

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **single-file, additive/accurate, documentation-only** task with the
  entire source of truth already verified and distilled in the research note
  (`root-readme-touchpoints.md`): exact section map with line numbers, exact
  current text of both touchpoints, confirmed export list, confirmed coverage
  facts, and the sibling-S1 boundary.
- The strongest accuracy risks (naming a non-exported symbol; misstating the
  coverage gate) are neutralized by Level 2 (symbol grep) and Level 3
  (config-cross-check), both specified as concrete commands.
- The duplication/scope risks are bounded by Level 4 greps
  (`@ts-expect-error`/`WithFormality` absent from new section; `git diff --stat`
  = one file; canonical command present).
- Residual 1 point: placement of the new `## Type Safety` section and exact
  prose tone are subjective; Task 2 specifies a recommended placement + a
  concrete pattern to mirror, but the implementer must read the existing README
  and match its voice.
