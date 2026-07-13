name: "P3.M2.T1.S1 — Sync README.md architecture & package-structure sections to v1.0"
description: |

---

## Goal

**Feature Goal**: Update the **four** README.md sections named in the contract
so the repo's top-level README **accurately reflects the v1.0 module structure
and core headline exports** that landed across P1 (core: `config/ordering.ts`,
`validate()`, `mergeConfigs()`), P2 (react: `useField` hook extracted,
`useFieldDisabledState` removed, overlays.ts forwardRef JSDoc), and P3.M1 (full
PRD-compliance audits). This is **Mode B — the changeset-level documentation
sync** that spans the whole v1.0 delta ("DOCS: [Mode B]").

**Deliverable**: A modified `README.md` (root, 856 lines today) where:

1. **`### Project Structure`** (line 777) tree lists `config/ordering.ts`
   (core) and `hooks/useField.tsx` (react) — currently it is a 6-line coarse
   tree that shows neither.
2. **`## Packages`** (line 202) carries a one-sentence note that
   `@formality-ui/core` exports the headline `validate()` and `mergeConfigs()`
   functions (plus the existing granular helpers).
3. **`## Architecture`** (line 684) mentions that the `Field` component's logic
   (Controller integration, props resolution, transform, conditions) lives in
   the extracted **`useField`** hook.
4. **`## Type Safety`** (line 663) is **verified accurate** against the actual
   codebase — all Appendix C items (T1.1–T3.2) are **complete** (see Context §8;
   the stale PRD snapshot is wrong), so this section needs no factual change;
   only touch it if a re-read finds stale wording.

AND: the README edit keeps `pnpm format:check` **green** (README is NOT in
`.prettierignore`) and `pnpm typecheck:examples` **green** (examples/ unchanged).

**Success Definition**:
- `git diff --name-only` shows **only** `README.md` (no source, no config, no
  other docs, no `packages/*/README.md`, no `examples/`).
- The four target sections contain the deltas above; `config/ordering.ts` and
  `hooks/useField.tsx` are present in the Project Structure tree; `useField` is
  named in the Architecture overview; `validate()`/`mergeConfigs()` are named in
  the Packages note.
- `pnpm format:check` exits 0 (run `pnpm format` / `pnpm prettier --write
  README.md` first if needed).
- `pnpm typecheck:examples` exits 0 (no-regression; examples/ untouched).
- No new executable TypeScript code block is added that would fail to compile
  against the real `validate`/`mergeConfigs` signatures (see Context §7).
- No change to user-facing API documentation beyond reflecting the actual
  current state (contract constraint #3).

## User Persona (if applicable)

**Target User**: A developer reading the top-level README to understand
Formality's v1.0 architecture and what `@formality-ui/core` exports — and a
maintainer performing the v1.0 release (P3.M3.T1) who needs the README to match
the shipped module layout.

**Use Case**: Onboarding / orienting to the monorepo structure; confirming that
core's `validate`/`mergeConfigs` headline functions exist without having to grep
the source.

**Pain Points Addressed**: README's Project Structure tree is too coarse (shows
no src modules); Packages table doesn't advertise the PRD-headline core exports;
Architecture diagram hides that Field's logic is encapsulated in a `useField`
hook.

## Why

- **v1.0 release accuracy.** P3.M3.T1 (version bump) ships with this README as
  the project's front door. It must not describe a stale module layout
  (pre-ordering-extraction, pre-useField-extraction) or omit the PRD §1.3.2
  headline exports.
- **Closes the documentation half of P1 + P2 structural work.** P1.M1 moved
  ordering to `config/ordering.ts`; P1.M2 added `validate()`/`mergeConfigs()`;
  P2.M1.T1 extracted `useField`; P2.M1.T2 removed `useFieldDisabledState`. The
  *code* is done; the *README* was never updated to match. This task is that
  sync (Mode B).
- **No feature risk.** This is docs-only. The only guardrails are: keep
  `format:check` green, keep `typecheck:examples` green, don't drift the API
  prose, and don't touch anything but `README.md`.

## What

Edit **only** `README.md` (root). Four targeted edits (Tasks 2–5), each scoped
to a known line range. Reflect the actual current state — do NOT invent new
exports, do NOT rewrite API docs, do NOT touch examples or package READMEs.

### Success Criteria

- [ ] `### Project Structure` (line 777) tree shows `config/ordering.ts` under
      `packages/core/src/` AND `hooks/useField.tsx` under `packages/react/src/`.
- [ ] `## Packages` (line 202) note names `validate()` and `mergeConfigs()` as
      core headline exports.
- [ ] `## Architecture` (line 684) names the `useField` hook as where Field's
      Controller/props/transform/condition logic lives.
- [ ] `## Type Safety` (line 663) re-verified accurate (all Appendix C items
      complete in real code); changed only if re-reading finds a factual error.
- [ ] `grep -n "useFieldDisabledState" README.md` → no matches (already none;
      must stay none).
- [ ] `pnpm format:check` → exit 0.
- [ ] `pnpm typecheck:examples` → exit 0.
- [ ] `git diff --name-only` → exactly `README.md` (one file).

## All Needed Context

### Context Completeness Check

A developer who knows nothing about this codebase would need: the exact README
line map + current text of the four target sections; the actual v1.0 source
layout of `packages/core/src` and `packages/react/src` (so the tree is real, not
invented); the exact `validate`/`mergeConfigs` signatures (so any usage snippet
compiles); the verified Appendix C status (all DONE — contradicting the stale
PRD snapshot); the prettier/typecheck gates and the fact README is NOT in
`.prettierignore`; and the do-NOT list. All cited below with verified line
numbers. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# THE FIELD GUIDE — verified current-state analysis (read this FIRST)
- docfile: plan/005_8f88e0ec4482/P3M2T1S1/research/readme-current-state-analysis.md
  why: |
    THE ground truth. Documents: README line map (Packages=202, Type Safety=663,
    Architecture=684, Project Structure=777 — all match the contract); the CURRENT
    text of each target section; the ACTUAL core+react src layout (config/ordering.ts
    NEW, hooks/useField.tsx distinct, useFieldDisabledState GONE); the verified
    validate()/mergeConfigs() signatures; the verified Appendix C status (ALL items
    DONE in real code, contradicting the stale PRD snapshot); the prettier interaction
    (README NOT in .prettierignore → pnpm format touches it); the typecheck:examples
    scope (examples/ only, NOT README blocks); and §12 (nothing stale to remove —
    the work is purely additive).

# THE FILE YOU ARE EDITING (read fully before editing)
- file: README.md
  why: |
    856 lines. The four target sections are at lines 202, 663, 684, 777. Read each
    target section + its immediate neighbors before editing so your edit preserves
    surrounding prose and anchors. CRITICAL: the README has many markdown anchors
    (e.g. #development, #type-safety) referenced from elsewhere — do not rename
    headings (§20.x, Type Safety, Architecture, Project Structure stay verbatim).

# THE ACTUAL v1.0 MODULE LAYOUT — model the Project Structure tree on this
- file: packages/core/src/index.ts
  why: |
    The core barrel. Confirms `validate` (from ./validation) and `mergeConfigs`
    (from ./config) are exported as PRD §1.3.2 headline names alongside granular
    helpers (runValidator, composeValidators, deepMerge, mergeFieldProps, …).
    Also shows ordering re-exported under "Labels & Ordering".
- file: packages/core/src/config/index.ts
  why: Barrel for config/ — shows ordering.ts exports (sortFieldsByOrder,
        getUnusedFields, getOrderedUnusedFields) live in ./ordering (canonical).
- file: packages/core/src/config/ordering.ts
  why: The NEW (P1.M1) module. JSDoc marks it "(Mode A) canonical location per
        PRD §1.3.1/§1.3.2; labels/resolve.ts re-exports for backwards compat."
- file: packages/react/src/index.ts
  why: React barrel. Confirms `useField` exported from ./hooks/useField (P2.M1.T1).
        Lists the 6 live hooks (useField, useConditions, useFormState,
        useInferredInputs, usePropsEvaluation, useSubscriptions) — useFieldDisabledState
        is ABSENT (P2.M1.T2 removed it).
- file: packages/react/src/hooks/useField.tsx
  why: |
    The extracted hook (P2.M1.T1). GOTCHA: the actual file extension is **.tsx**
    (it contains JSX), NOT .ts. The contract says "hooks/useField.ts" — that is the
    conceptual module name; the README tree MUST use the real extension **.tsx**.

# VERIFIED HEADLINE-EXPORT SIGNATURES (so any usage snippet compiles)
- file: packages/core/src/validation/validate.ts   # line 41
  why: |
    `export async function validate(value: unknown, rules: ValidatorSpec,
    validators?: ValidatorsConfig, formValues?: Record<string, unknown>):
    Promise<ValidationResult | undefined>` — thin async wrapper over runValidator.
    If the Packages note shows a usage snippet, it MUST match this signature.
- file: packages/core/src/config/merge.ts           # line 293
  why: |
    `export function mergeConfigs(provider: FormalityProviderConfig, form?:
    FormConfig, field?: FieldConfig): { inputConfig: InputConfig | undefined;
    fieldConfig: FieldConfig }`. Returns resolved inputConfig + statically-merged
    fieldConfig (dynamic selectProps layers need mergeFieldProps, NOT this).

# PRD — the structure the README must mirror (READ-ONLY, do not edit)
- docfile: PRD.md §1.3.1 (heading:h4.0 "Package Structure") + §1.3.2 (heading:h4.1)
  why: |
    The authoritative package tree + the headline-export table (validate,
    mergeConfigs, sortFieldsByOrder, …). The README Project Structure tree should
    be a TRIMMED version of §1.3.1's tree (not a verbatim copy — keep it readable).
    §1.3.2 confirms validate()/mergeConfigs() are the headline names.
- docfile: PRD.md Appendix C (heading:h2.24)
  why: |
    The Type-Safety Hardening spec. NOTE: the in-file status markers are STALE
    (T2.1 "PARTIAL", T2.2/T3.1 "NOT STARTED"). The ACTUAL codebase has ALL items
    DONE — verified by grep of react index.ts (defineInputs line 113,
    FormalityFieldComponentProps line 101, ReactInputConfig 98, ReactFieldConfig 99).
    Task (d) "confirm all Appendix C items are complete" is satisfied by the real
    code; the README Type Safety section is already accurate.

# THE PACKAGE-LEVEL DOCS THIS TASK MUST NOT DUPLICATE OR EDIT
- file: packages/react/README.md   # ## Type Safety (line 533) + forwardRef guidance
  why: |
    react's own README already has full Type Safety detail (Checked Form keys,
    Checked Field names, defineInputs, FormalityFieldComponentProps) AND the §20
    forwardRef delivery guidance. The ROOT README links to it
    (packages/react/README.md#type-safety). DO NOT edit react's README and DO NOT
    duplicate its forwardRef section into the root README — that would be scope
    creep (contract #3: don't change API docs beyond reflecting actual state).

# GATES — what this docs edit must keep green
- file: package.json   # scripts
  why: |
    format → "prettier --write ."; format:check → "prettier --check .";
    typecheck:examples → "tsc -p examples/tsconfig.json --noEmit"; typecheck →
    "tsc --build". README.md is covered by prettier (NOT in .prettierignore).
- file: .prettierignore
  why: |
    Ignores plan/, PRD.md, CHANGELOG.md, **/dist/, coverage/, *.tsbuildinfo — but
    NOT README.md. So `pnpm format` WILL reformat README.md. After editing, run
    `pnpm format` (or `pnpm prettier --write README.md`) then `pnpm format:check`.
- file: examples/tsconfig.json
  why: typecheck:examples compiles examples/01–09 + index.ts against core+react.
        This task does NOT touch examples/, so it must stay green (no-regression guard).
```

### Current Codebase tree (the v1.0 ground truth — verified)

```bash
packages/
├── core/                       # @formality-ui/core — zero framework deps
│   └── src/
│       ├── conditions/   evaluate.ts, index.ts
│       ├── config/       defaults.ts, index.ts, merge.ts, ordering.ts   ← ordering.ts NEW (P1.M1)
│       ├── expression/   context.ts, evaluate.ts, index.ts, infer.ts
│       ├── labels/       index.ts, resolve.ts
│       ├── transform/    index.ts, pipeline.ts
│       ├── types/        conditions.ts, config.ts, index.ts, state.ts, validation.ts
│       ├── validation/   index.ts, messages.ts, validate.ts             ← validate() NEW (P1.M2.T1)
│       └── index.ts      (barrel: exports validate + mergeConfigs headline fns)
└── react/                      # @formality-ui/react — RHF implementation
    └── src/
        ├── components/   Field.tsx, FieldGroup.tsx, FormalityProvider.tsx, Form.tsx, UnusedFields.tsx
        ├── context/      ConfigContext.ts, FormContext.ts, GroupContext.ts
        ├── hooks/        useConditions.ts, useField.tsx, useFormState.ts,
        │                  useInferredInputs.ts, usePropsEvaluation.ts, useSubscriptions.ts
        │                  ← useField.tsx is a DISTINCT module (P2.M1.T1); extension .tsx
        │                  ← useFieldDisabledState.ts REMOVED (P2.M1.T2)
        ├── overlays.ts   (React type overlays; forwardRef JSDoc accurate — P2.M2 DONE)
        ├── typeAssertions/ injectedProps.types.ts
        ├── types.ts, utils/makeProxyState.ts
        └── index.ts      (barrel: exports useField + React overlay types + defineInputs)
examples/  01–09 + index.ts   (typecheck:examples target — UNCHANGED by this task)
README.md  (856 lines — THIS is the only file this task edits)
```

### Desired Codebase tree with files changed by this task

```bash
README.md   # ONLY file modified. Four in-place edits at lines 202, 663, 684, 777.
            # No new files. No other files touched.
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: useField's real extension is .tsx, NOT .ts. The contract's "hooks/useField.ts"
     is the conceptual module name. The README tree MUST list `useField.tsx` (it contains JSX).
     Listing `.ts` would be a factual error about the shipped layout. -->

<!-- CRITICAL: README.md is NOT in .prettierignore, so `pnpm format` (prettier --write .)
     WILL reformat it. After every edit, run `pnpm format` then `pnpm format:check` (exit 0).
     Prettier will normalize table column padding, list spacing, and the tree-diagram fences.
     Write the tree inside a fenced code block so prettier leaves its internal spacing alone. -->

<!-- CRITICAL: `typecheck:examples` compiles examples/ ONLY — it does NOT type-check README
     markdown code blocks. The contract phrase "README's code examples still compile" is loose;
     the binding check is that examples/ stays green (unchanged) AND any NEW code snippet you
     add to README is type-valid against the real validate()/mergeConfigs() signatures. Prefer
     adding NO new executable TS to README — describe the exports in prose / a one-line snippet. -->

<!-- CRITICAL: All Appendix C items are DONE in the real codebase. The PRD snapshot's status
     markers (T2.1 "PARTIAL", T2.2/T3.1 "NOT STARTED") are STALE. Do NOT weaken the Type Safety
     section to "planned" or "partial" — that would RE-INTRODUCE inaccuracy. The README Type
     Safety section (line 663) is already correct; verify it, don't downgrade it. -->

<!-- CRITICAL: forwardRef / §20 delivery documentation is ALREADY satisfied at the package level
     (react README ## Type Safety → Field component props + overlays.ts JSDoc). The root README
     does NOT list overlays.ts and does NOT need a forwardRef section. Adding one would duplicate
     react's README and violate contract #3 (don't change API docs beyond reflecting actual state).
     The root README links to packages/react/README.md#type-safety for detail — leave that link. -->

<!-- GOTCHA: The README is referenced by anchor from multiple places (e.g. the Development section
     self-links "#development"; the Documentation table links ./PRD.md and ./examples). Do NOT
     rename the headings "## Packages", "## Type Safety", "## Architecture", "### Project Structure",
     or "## Development" — rename would break anchors. Add prose/sub-bullets under existing headings. -->

<!-- GOTCHA: keep the Project Structure tree TRIMMED. PRD §1.3.1 has the full verbose tree; the
     README tree should show the top packages + the key src subdirs + the two files this changeset
     introduces (config/ordering.ts, hooks/useField.tsx). Do not paste all 23 core/react files —
     that bloats a user-facing README. Aim for ~15-20 lines of tree. -->

<!-- GOTCHA: the Packages note should stay one concise sentence (maybe + a tiny fenced snippet).
     Don't turn it into an API reference — the README already links to PRD.md for the full spec. -->

<!-- SCOPE: Do NOT edit packages/react/README.md, packages/vue/README.md, packages/svelte/README.md,
     examples/**, PRD.md, plan/**, tasks.json, prd_snapshot.md, any source file, or any config.
     This task edits EXACTLY README.md (root). Confirm with `git diff --name-only`. -->
```

## Implementation Blueprint

### Data models and structure

None. No code, no types, no config. The only artifact is edited markdown prose
+ a tree diagram inside `README.md`.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ + BASELINE — confirm the ground truth before touching anything
  - READ: plan/005_8f88e0ec4482/P3M2T1S1/research/readme-current-state-analysis.md (THE field guide).
  - READ: README.md fully (856 lines) — especially lines 200-210 (Packages), 663-683 (Type Safety),
    684-727 (Architecture + Expression Engine), 777-800 (Project Structure + Scripts).
  - VERIFY the four target lines still match the field guide:
      grep -n "^## Packages$\|^## Type Safety$\|^## Architecture$\|^### Project Structure$" README.md
      # Expect: 202, 663, 684, 777. If any drifted (a prior edit shifted lines), re-locate by content.
  - VERIFY the v1.0 ground truth (so your tree reflects REAL files, not the contract's loose names):
      ls packages/core/src/config/         # MUST contain ordering.ts (P1.M1)
      ls packages/react/src/hooks/         # MUST contain useField.tsx (.tsx!) and NOT useFieldDisabledState.ts
      grep -n "validate\b" packages/core/src/index.ts        # headline export present
      grep -n "mergeConfigs\b" packages/core/src/index.ts    # headline export present
  - CAPTURE the format baseline (README must be compliant BEFORE you start, per P3.M1.T2.S1 green state):
      pnpm format:check 2>&1 | tail -3 ; echo "format:check exit: ${PIPESTATUS[0]}"   # expect 0
    # If format:check is NOT green on README at baseline, that is an incomplete P3.M1.T2.S1 — STOP
    # and report (don't fix P3.M1.T2.S1's work). This task assumes a green baseline.

Task 2: EDIT `## Packages` (line 202) — note core headline exports   [DELTA (b)]
  - TARGET: the Packages table + the blank line after it (lines ~202-210).
  - KEEP the existing 4-row table verbatim (core/react/vue/svelte + Stable/Planned).
  - ADD immediately AFTER the table a one-sentence note (+ optional 3-line fenced snippet) stating
    that @formality-ui/core exports the PRD §1.3.2 headline functions `validate()` and
    `mergeConfigs()` (alongside the granular helpers runValidator/composeValidators/deepMerge/
    mergeFieldProps/…), used internally by the React adapter and available to framework-agnostic
    consumers. Example phrasing (adapt; keep concise):
      > **Headline exports.** `@formality-ui/core` exposes the PRD §1.3.2 entry points
      > [`validate()`](./PRD.md) and [`mergeConfigs()`](./PRD.md) alongside granular helpers
      > (`runValidator`, `composeValidators`, `deepMerge`, `mergeFieldProps`, …). The React
      > adapter consumes them internally; framework-agnostic consumers can import them directly.
  - IF you include a snippet, it MUST match the verified signatures (Context §7):
      // import { validate, mergeConfigs } from "@formality-ui/core";
      // const result = await validate(value, rules, validators, formValues);   // async
      // const { inputConfig, fieldConfig } = mergeConfigs(provider, form, field);
    Keep it illustrative (commented) to avoid implying a runnable example. Prefer prose-only.
  - DO NOT rename the `## Packages` heading (anchor). DO NOT change the table rows. DO NOT edit
    vue/svelte status (they remain "Planned"/stubbed — accurate).

Task 3: EDIT `## Architecture` (line 684) — name the useField hook   [DELTA (c)]
  - TARGET: the Architecture section (lines ~684-710), specifically the `Field (Component)` box
    in the ASCII diagram AND/OR the prose immediately under the diagram (before "### Expression
    Engine" at line 711).
  - ADD a concise mention that the Field component's responsibilities (Controller integration,
    props resolution & evaluation, value transformation, condition application) are encapsulated
    in the extracted **`useField`** hook (`packages/react/src/hooks/useField.tsx`).
  - TWO acceptable placements (pick ONE; do not duplicate):
    (A) Add a bullet to the Field box in the diagram, e.g. "• Logic via `useField` hook", OR
    (B) Add one sentence of prose under the diagram, e.g.:
      "The `Field` component is a thin shell: its Controller integration, props-resolution
      pipeline, value transformation, and condition application all live in the `useField`
      hook (`packages/react/src/hooks/useField.tsx`), extracted in v1.0 for reuse and testing."
  - Placement (B) is preferred (keeps the ASCII diagram clean). Use the real path/extension.
  - DO NOT rename `## Architecture` or `### Expression Engine` headings. DO NOT rewrite the
    diagram's other boxes. DO NOT remove the "Props resolution / Value transformation / Condition
    application" bullets (they're accurate — useField *does* that work).

Task 4: EDIT `### Project Structure` (line 777) — expand the tree   [DELTA (a)]
  - TARGET: the fenced tree at lines ~777-788 (currently a 6-line coarse tree).
  - REPLACE the coarse tree with a TRIMMED-but-real tree (~15-20 lines) that shows the two
    packages' src subdirectories and, critically, the two files this changeset introduced:
      packages/core/src/config/ordering.ts        (P1.M1)
      packages/react/src/hooks/useField.tsx       (P2.M1.T1)   ← extension .tsx, NOT .ts
  - MODEL it on PRD §1.3.1 but TRIMMED — do not paste all 23 files. Show the key subdirs
    (core: conditions/config/expression/labels/transform/types/validation; react: components/
    context/hooks) with the headline file(s) per subdir. Inline-comment ordering.ts + useField.tsx.
  - REQUIRED content checks (your final tree MUST contain these tokens — the success gate greps them):
      grep -c "config/ordering.ts" README.md      # ≥ 1
      grep -c "hooks/useField.tsx" README.md      # ≥ 1   (NOTE: .tsx)
  - KEEP it inside a fenced code block (``` … ```) so prettier does not reflow its internal spacing.
  - PRESERVE the surrounding "formality/ ├── packages/ ├── examples/ ├── PRD.md └── package.json"
    top-level shape (it's still accurate). Add the src/ detail under packages/core and packages/react.
  - DO NOT list useFieldDisabledState.ts anywhere (it's removed — P2.M1.T2).
  - DO NOT add vue/svelte src trees (they're stubbed; the coarse `packages/` mention or a "(stubbed)"
    comment suffices). The README's existing Packages table already marks them "Planned".

Task 5: VERIFY `## Type Safety` (line 663) — confirm Appendix C complete   [DELTA (d)]
  - TARGET: lines ~663-683. READ the existing section.
  - VERIFY against the REAL code (Context §8) that all 4 capabilities are accurately described:
      grep -n "defineInputs\|FormalityFieldComponentProps\|ReactInputConfig\|ReactFormFieldsConfig\|ReactFieldConfig" packages/react/src/index.ts
    # All present → all Appendix C items (T1.1–T3.2) are DONE in real code.
  - The current section ALREADY lists: Checked Form config keys (<Form<TFieldValues>>), Checked
    Field names (FieldProps<TName> opt-in), defineInputs/InputType (opt-in),
    FormalityFieldComponentProps<P>. This is ACCURATE.
  - ACTION: In the normal case, NO edit is needed — the section is correct. Only touch it if a
    re-read reveals a factual error (e.g. a bullet that claims something is "planned" when it's
    shipped, or vice versa). If you do edit, keep it minimal and factual.
  - DO NOT downgrade any capability to "partial"/"planned" — that would re-introduce inaccuracy.
  - DO NOT remove the link to packages/react/README.md#type-safety (it points to the full detail).

Task 6: FORMAT + VALIDATE — the binding gates
  - FORMAT the README (README.md is NOT in .prettierignore, so prettier owns its formatting):
      pnpm prettier --write README.md        # normalize table padding, list spacing, fences
    # (equivalently `pnpm format`, which also touches any other drifted file — prefer the scoped
    #  `prettier --write README.md` so the diff stays README-only.)
  - GATE 1 (format):  pnpm format:check 2>&1 | tail -3 ; echo "exit: ${PIPESTATUS[0]}"   # expect 0
  - GATE 2 (examples, no-regression): pnpm typecheck:examples 2>&1 | tail -3 ; echo "exit: ${PIPESTATUS[0]}"  # expect 0
  - GATE 3 (scope):   git diff --name-only    # expect EXACTLY "README.md" (one line)
  - GATE 4 (content assertions — the delta is actually present):
      grep -n "config/ordering.ts"   README.md && echo "ordering ✓"
      grep -n "hooks/useField.tsx"   README.md && echo "useField.tsx ✓"
      grep -n "useField"             README.md   # Architecture mention present (Task 3)
      grep -n "mergeConfigs\|validate()" README.md   # Packages note present (Task 2)
      grep -c "useFieldDisabledState" README.md   # expect 0 (must be ABSENT)
  - GATE 5 (anchors intact — headings NOT renamed):
      grep -n "^## Packages$\|^## Type Safety$\|^## Architecture$\|^### Project Structure$\|^## Development$" README.md
      # expect 202/663/684/777-ish lines (may shift slightly from added lines) — all 5 headings present.
```

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN — additive, surgical edits. This task ADDS deltas to existing sections; it does not
     rewrite them. Keep every edit scoped to the named line range; preserve surrounding prose;
     never rename a heading (breaks anchors). -->

<!-- PATTERN — model the tree on REAL files. Run `ls packages/core/src/config` and
     `ls packages/react/src/hooks` (Task 1) and copy the real filenames into the tree. The
     contract's "useField.ts" is the conceptual name; the real file is useField.tsx. A README tree
     that shows `.ts` would be a factual lie about the shipped layout. -->

<!-- PATTERN — keep README user-facing prose concise. The Packages note = 1 sentence (maybe + a
     commented 2-line snippet). The Architecture useField mention = 1 sentence. The Project
     Structure tree = ~15-20 lines. This is the front door, not an API reference (that's PRD.md). -->

<!-- PATTERN — fenced code blocks for trees/diagrams. Put the Project Structure tree and any code
     snippet inside ``` fences. Prettier leaves fenced content's internal spacing alone but WILL
     normalize the fence language tag and surrounding blank lines. -->

<!-- CRITICAL — "reflect the actual current state, nothing more" (contract #3). Do not document
     forwardRef in the root README (it's in react's README + overlays.ts). Do not document the
     §8.5 auto-save timing fix or other §-by-§ audit items (those are PRD/package-doc concerns).
     This task's README scope = the 4 sections + the 5 deltas. Resist scope creep. -->
```

### Integration Points

```yaml
FILE CHANGED (this task — the ONLY write):
  - README.md   # four in-place edits: Packages note (202), Architecture useField (684),
                # Project Structure tree (777), Type Safety verify (663 — usually no edit)

FILES NOT TOUCHED (verify with `git diff --name-only` == ["README.md"]):
  - packages/react/README.md     # owns Type-Safety + forwardRef detail; root README links to it
  - packages/vue/README.md, packages/svelte/README.md   # "Coming soon" stubs — accurate, leave
  - examples/**                  # typecheck:examples target — untouched, stays green
  - PRD.md, tasks.json, prd_snapshot.md, plan/**        # orchestrator/human-owned, READ-ONLY
  - All source files (packages/core/**, packages/react/**)  # this is docs, not code
  - All config (package.json, tsconfig*, vitest.config.ts, .prettierignore, eslint.config.mjs)

NO DATABASE / ROUTES / NEW CONFIG — a docs-sync task editing one markdown file.
```

## Validation Loop

### Level 1: Format gate (README is prettier-owned)

```bash
pnpm prettier --write README.md          # normalize after edits
pnpm format:check 2>&1 | tail -3 ; echo "format:check=${PIPESTATUS[0]}"
# Expected: exit 0, "All matched files use Prettier code style!" (README.md not in any [warn] line).
# If [warn] README.md appears, re-run `pnpm prettier --write README.md`. Do NOT add README to
# .prettierignore (that weakens the gate and breaks the P3.M1.T2.S1 contract).
```

### Level 2: Type-check no-regression (examples unchanged)

```bash
pnpm typecheck:examples 2>&1 | tail -3 ; echo "typecheck:examples=${PIPESTATUS[0]}"
# Expected: exit 0. examples/ is UNCHANGED by this task, so it must stay green. If it fails,
# a collateral type break occurred (e.g. you accidentally edited a .ts file) — investigate; do NOT
# edit examples/ to force green. NOTE: this does NOT type-check README markdown blocks (see gotchas).
```

### Level 3: Content assertions (the delta is actually present + nothing stale)

```bash
# The 5 deltas are present:
grep -n "config/ordering.ts" README.md            && echo "✓ ordering.ts in Project Structure"
grep -n "hooks/useField.tsx"   README.md          && echo "✓ useField.tsx (.tsx) in Project Structure"
grep -n "useField"             README.md | grep -qv "hooks/useField.tsx" && echo "✓ useField named in Architecture"
grep -nE "validate\(\)|mergeConfigs\(\)" README.md && echo "✓ headline exports named in Packages note"

# Nothing stale / removed-module leaked in:
test "$(grep -c 'useFieldDisabledState' README.md)" -eq 0 && echo "✓ no useFieldDisabledState (removed P2.M1.T2)"

# Anchors intact (headings NOT renamed — 5 expected):
grep -cE "^## Packages$|^## Type Safety$|^## Architecture$|^### Project Structure$|^## Development$" README.md
# Expected: 5
```

### Level 4: Scope integrity (exactly one file changed)

```bash
git diff --name-only
# Expected: exactly one line → README.md
git diff --name-only | grep -v '^README.md$' && echo "UNEXPECTED EXTRA CHANGE ↑ (BAD)" || echo "scope clean ✓"

# Confirm no API-doc / package-doc / config / source drift:
git diff --name-only | grep -E 'packages/.*/README.md|examples/|PRD.md|plan/|tasks.json|prd_snapshot|package.json|tsconfig|vitest|eslint|prettierignore|packages/(core|react)/src/' \
  && echo "OUT-OF-SCOPE EDIT ↑ (BAD)" || echo "no out-of-scope edits ✓"
```

### Level 5: Optional full-CI no-regression (hand-off confidence for P3.M3.T1)

```bash
# If you want release-level confidence, run the chained gate (README edits don't affect these,
# but it confirms you didn't accidentally touch anything else):
pnpm lint && pnpm format:check && pnpm typecheck && pnpm typecheck:examples \
  && pnpm test:coverage \
  && pnpm --filter @formality-ui/core --filter @formality-ui/react build \
  && echo "✅ full CI green — README sync ready for v1.0 release (P3.M3.T1)"
# Expected: all green (these were green at baseline per P3.M1.T2.S1; README edits don't regress them).
# NOTE: `pnpm format` is the only step README.md influences; the rest are no-regression confirmations.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `pnpm format:check` exits 0 (README prettier-compliant; NOT added to .prettierignore).
- [ ] Level 2: `pnpm typecheck:examples` exits 0 (examples/ unchanged, no regression).
- [ ] Level 3: all 5 content assertions pass; `useFieldDisabledState` count is 0; 5 headings present.
- [ ] Level 4: `git diff --name-only` is exactly `README.md`; no out-of-scope edits.

### Feature Validation (the deltas)

- [ ] `## Packages` (202) names `validate()` + `mergeConfigs()` as core headline exports.
- [ ] `## Architecture` (684) names the `useField` hook as where Field's logic lives.
- [ ] `### Project Structure` (777) tree lists `config/ordering.ts` and `hooks/useField.tsx` (.tsx!).
- [ ] `## Type Safety` (663) verified accurate (all Appendix C items complete in real code); not
      downgraded to partial/planned.
- [ ] No new executable TS in README that fails to compile against the real validate/mergeConfigs sigs.

### Code Quality Validation

- [ ] Edits are additive & surgical (no heading renames; surrounding prose preserved).
- [ ] Project Structure tree is trimmed (~15-20 lines), not a verbatim PRD §1.3.1 paste.
- [ ] Tree uses the REAL extension `useField.tsx` (not the contract's loose `useField.ts`).
- [ ] forwardRef NOT duplicated into root README (handled by react README + overlays.ts).
- [ ] Anchors (`#development`, `#type-safety`, etc.) intact.

### Documentation & Deployment

- [ ] README reflects the actual v1.0 module structure and core exports (the changeset-level sync).
- [ ] No edits to package-level READMEs / PRD.md / examples / config / source.
- [ ] Hand-off to P3.M3.T1: README matches the shipped v1.0 layout.

---

## Anti-Patterns to Avoid

- ❌ Don't **list `useField.ts` (with `.ts`)** in the Project Structure tree. The real file is
  `useField.tsx` (it contains JSX). The contract's "useField.ts" is the conceptual module name.
  A `.ts` entry would be a factual error about the shipped layout. Run `ls packages/react/src/hooks`
  and copy the real name.
- ❌ Don't **let `pnpm format:check` go red.** README.md is NOT in `.prettierignore`, so prettier
  owns its formatting. After every edit, run `pnpm prettier --write README.md` then `format:check`.
  NEVER add README.md to `.prettierignore` to force green (that breaks the P3.M1.T2.S1 gate contract).
- ❌ Don't **downgrade the Type Safety section to "partial" or "planned".** The stale PRD snapshot
  marks T2.1/T2.2/T3.1 as partial/not-started, but the ACTUAL code has all Appendix C items DONE
  (verified: `defineInputs` index.ts:113, `FormalityFieldComponentProps` index.ts:101). The README
  Type Safety section is already accurate; verify it, don't weaken it.
- ❌ Don't **add a forwardRef section to the root README.** §20 delivery is documented at the package
  level (react README `## Type Safety → Field component props` + `overlays.ts` JSDoc, P2.M2 DONE).
  Duplicating it in the root README violates contract #3 (don't change API docs beyond actual state).
- ❌ Don't **rename headings.** The README is linked by anchor from multiple places (`#development`,
  `#type-safety`, the Documentation table). Renaming `## Packages` / `## Architecture` / `### Project
  Structure` / `## Type Safety` / `## Development` breaks those anchors. Add prose under existing headings.
- ❌ Don't **paste the full PRD §1.3.1 tree.** It has ~23 files. A user-facing README Project Structure
  should be a trimmed ~15-20-line tree showing the key subdirs + the two new files. The verbose tree
  lives in PRD.md (already linked).
- ❌ Don't **edit anything except `README.md`.** Not react/vue/svelte READMEs, not examples/, not
  PRD.md, not plan/, not config, not source. `git diff --name-only` must be exactly `README.md`.
- ❌ Don't **rely on `typecheck:examples` to validate README code blocks.** It compiles `examples/`
  ONLY, not markdown. If you add a TS snippet to README, validate it by hand against the real
  signatures (Context §7); prefer prose/commented snippets to avoid implying a runnable example.
- ❌ Don't **invent exports.** Only document what `grep` confirms in `packages/core/src/index.ts`
  (`validate`, `mergeConfigs`) and `packages/react/src/index.ts` (`useField`). The README reflects
  actual state — no aspirational APIs.
- ❌ Don't **start editing if `format:check` is red at baseline.** That means P3.M1.T2.S1 (which
  runs first, in P3.M1) is incomplete. STOP and report rather than fix-forward into a sibling task.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **docs-only** task with a **mechanical, contract-specified** delta on a single file
  (`README.md`) whose target line numbers I have **verified match exactly** (Packages=202, Type
  Safety=663, Architecture=684, Project Structure=777). The ground-truth source layout
  (`config/ordering.ts` present; `hooks/useField.tsx` distinct; `useFieldDisabledState` absent) and
  the headline-export signatures (`validate`, `mergeConfigs`) are **verified by grep/ls**, so the
  implementer cannot invent or mis-state facts — they transcribe real files.
- The one non-obvious trap — `useField`'s real extension is **`.tsx`** not `.ts` — is called out in
  bold in Gotchas, Tasks (Task 4 content gate), and Anti-Patterns, plus enforced by a `grep
  hooks/useField.tsx` success assertion.
- The second trap — README is **prettier-owned** (not in `.prettierignore`) and P3.M1.T2.S1 runs
  `pnpm format` first — is handled by a baseline `format:check` check (Task 1, with a STOP if red)
  and a post-edit `pnpm prettier --write README.md` + `format:check` gate (Task 6, Level 1).
- The third subtlety — the stale PRD snapshot claims Appendix C items are incomplete when the real
  code has them all DONE — is documented (Context §8) with the anti-pattern "don't downgrade Type
  Safety to partial," preventing the implementer from re-introducing inaccuracy.
- Scope is locked to one file via `git diff --name-only == ["README.md"]` (Level 4) and an
  explicit out-of-scope grep. The only reason this isn't 10/10 is the residual judgment call of
  *how much* to trim the Project Structure tree and *exactly how* to phrase the Packages/Architecture
  notes — but the content gates (`grep` assertions) make a wrong outcome detectable in validation.
