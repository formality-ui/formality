name: "P1.M3.T1.S1 — Update packages/react/README.md with new type-safety exports + coverage gate"
description: |

---

## Goal

**Feature Goal**: Surface the full new consumer-facing type-safety + testing
surface in `packages/react/README.md` by adding two new sections — a **Type
Safety** section (generic `<Form<TFieldValues>>` config key-checking, generic
`<Field name>` name-checking, `defineInputs` + `InputType`, and
`FormalityFieldComponentProps` replacing the consumer's hand-rolled
`WithFormality`) and a **Testing & Coverage** section (the 90% gate). This is
the **Mode B changeset-level doc sweep** (delta PRD R5 / PRD §1.3.7 + Appendix C
§C.8) that finally makes the exports landed in P1.M1 (R2/R3/R4) and the gate
landed in P1.M2.T1.S5 (R1) discoverable to consumers — especially the driving
downstream consumer `sellario-ui`.

**Deliverable**: An **edited** `packages/react/README.md` (one file, additive
only) containing:
1. A new `## Type Safety` section (with four subsections — see Implementation
   Tasks Task 2), placed immediately after the existing `## TypeScript Support`
   section.
2. A new `## Testing & Coverage` section (see Task 3), placed before `## License`.
3. (Minor) a one-line extension of the existing `## TypeScript Support` import
   catalog so it lists the new exports (`defineInputs`, `ReactInputConfig`,
   `ReactFieldConfig`, `ReactFormFieldsConfig`, `FormalityFieldComponentProps`,
   `RefCallBack`, `UseFormStateReturn`).

**Success Definition**:
- Every symbol named in the README's new code blocks is **actually exported**
  from `packages/react/src/index.ts` (verified by grep — see Task 1 / Validation
  Level 1).
- Every `tsx`/`ts` code block is **type-correct** (verified by copy-paste into a
  scratch `__typechecks__` file + `tsc --noEmit`, OR by careful manual review
  against `overlays.ts`/`Field.tsx` — see Task 4 / Validation Level 2).
- The new content is **accurate** to the real runtime/type contract — in
  particular the `FormalityFieldComponentProps` section states the
  `forwardRef`-is-`RefCallBack` fact and the **runtime caveat** (Field today
  delivers `ref`, not a top-level `forwardRef`).
- The README remains internally consistent (no contradictions with the existing
  Quick Start; cross-references resolve).
- **No other file is modified.** Specifically: root `README.md` is owned by the
  sibling task `P1.M3.T1.S2` — do NOT touch it.

## User Persona (if applicable)

**Target User**: React adapter consumer / library author. The primary
beneficiary is the downstream consumer `sellario-ui`, which today hand-rolls a
lossy `WithFormality<P>` helper (the motivation for T3.1 / `FormalityFieldComponentProps`).

**Use Case**: A consumer reads `packages/react/README.md` to learn (a) how to
get compile-time checking on their `Form` config keys and `Field` names, (b)
how to derive a checked `InputType` union, and (c) what props Formality injects
onto their field component so they can stop maintaining `WithFormality`.

**User Journey**:
1. Consumer opens `packages/react/README.md`.
2. Scrolls to **Type Safety** → copies the `defineInputs` + `InputType` snippet
   and the `FormalityFieldComponentProps` before/after snippet.
3. Drops their `WithFormality` and adopts the shipped type.
4. (Contributor path) scrolls to **Testing & Coverage** → runs `pnpm
   test:coverage` knowing the 90% bar and the exclusions.

**Pain Points Addressed**:
- Consumers reverse-engineer the injected-props contract (bugs from
  inconsistent stripping — the `sellario-ui` `state?: unknown` problem).
- `config={{ ofice: ... }}` and `<Field name="ofice" />` typos silently render
  nothing because the checking is opt-in / requires narrowing — undocumented.
- `type: "texField"` typos are invisible — the `defineInputs` opt-in path is
  undocumented.
- The 90% coverage gate is undocumented in the package README.

## Why

- **Delta PRD R5** ("Sync changeset-level documentation") explicitly requires
  this: "Update `packages/react/README.md` … to document the new type-safety
  exports (`defineInputs` + `InputType`, `FormalityFieldComponentProps`,
  generic `<Form<TFieldValues>>` / `<Field name>` key-checking) and add a short
  note on the 90% coverage gate."
- **PRD §C.8 (h3.117)** — "Definition of Done / PR Description Should Include …
  A short 'consumer before/after' snippet showing the type safety gained." The
  README is the durable home for that snippet.
- **PRD §1.3.7 (h4.6)** — the 90% gate is a hard, documented quality bar; the
  package README should state it so contributors understand the bar and
  consumers understand what's covered.
- **Sequencing**: This task depends on P1.M1.T1/T2/T3 (R2/R3/R4 exports —
  COMPLETE) and P1.M2.T1.S5 (R1 coverage threshold block — currently being
  implemented; treat its PRP as a contract: the `thresholds` block WILL exist in
  root `vitest.config.ts`). All inputs exist or are contractually defined.

## What

A purely **additive** edit to a single markdown file. No code, no tests, no
runtime, no config, no package.json. Two new top-level sections + a minor
extension to the existing type catalog. All snippets are copied from / checked
against the real source (`packages/react/src/overlays.ts`,
`packages/react/src/index.ts`, `packages/react/src/components/Field.tsx`,
`vitest.config.ts`).

### Success Criteria

- [ ] `## Type Safety` section present in `packages/react/README.md`, placed
      after `## TypeScript Support`, covering all four topics (Form key-check,
      Field name-check, `defineInputs`+`InputType`, `FormalityFieldComponentProps`
      before/after).
- [ ] `## Testing & Coverage` section present, placed before `## License`,
      stating `pnpm test:coverage`, the 90% all-four-metrics gate, and the
      exclusion table.
- [ ] Every documented symbol resolves to a real export in
      `packages/react/src/index.ts` (grep verification — Validation Level 1).
- [ ] All code blocks type-check (Validation Level 2).
- [ ] `FormalityFieldComponentProps` section states both the `RefCallBack` fact
      AND the runtime `ref`-vs-`forwardRef` caveat.
- [ ] Diff is confined to `packages/react/README.md` (`git diff --stat` shows
      exactly one file). Root `README.md` and all other files untouched.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: (1) the exact
file to edit and where to insert each section, (2) the exact symbols to
document and their precise signatures (so snippets compile), (3) the
`FormalityFieldComponentProps` runtime caveat (so the doc isn't misleading),
(4) the coverage gate facts, and (5) the sibling-task boundary (do not touch
root README). All cited below with exact paths. ✅ Passes the "No Prior
Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- file: packages/react/README.md
  why: THE file to edit. Read it end-to-end first. Note its section order
        (Installation, Quick Start, Components, Conditions, Dynamic Props,
        Auto-Save, Hooks, Contexts, TypeScript Support, Utilities, License) and
        its existing tone/markdown style (## headers, fenced ```tsx blocks,
        Props/Render-API tables, terse prose).
  pattern: |
    Sections are `##` headers; code is ```tsx fenced blocks; tables use the
    | Prop | Type | Description | shape. MATCH this style for the new sections.
  gotcha: |
    The existing `## Quick Start` imports `InputConfig, FormFieldsConfig` from
    core and uses `Record<string, InputConfig>`. The new `## Type Safety`
    section should RECOMMEND the react overlay types (`ReactInputConfig`) as the
    preferred React pattern, but DO NOT rewrite Quick Start (out of scope —
    additive only). Cross-reference from Type Safety if useful.

- file: packages/react/src/index.ts
  why: |
    The public surface — the SINGLE source of truth for what is actually
    exported. Every symbol named in the README MUST appear here. Verify with the
    grep loop in Task 1. Key exports for this task:
      type  ReactInputConfig, ReactFieldConfig, ReactFormFieldsConfig,
            FormalityFieldComponentProps
      value defineInputs            (NOTE: value export, not `export type`)
      type  RefCallBack, UseFormStateReturn, FieldValues  (re-exported from RHF)
      type  FormProps, FieldProps   (already generic: FormProps<TFieldValues>,
                                     FieldProps<TName extends string = string>)
  gotcha: |
    `defineInputs` is `export { defineInputs } from "./overlays"` — a VALUE. In
    README snippets import it as a value (`import { defineInputs }`), NOT
    `import type { defineInputs }`. The overlay TYPES use `import type`.

- file: packages/react/src/overlays.ts
  why: |
    Contains the PRECISE signatures + canonical JSDoc examples to copy into the
    README verbatim (or near-verbatim):
      - `defineInputs` JSDoc @example → copy into the InputType subsection.
      - `ReactFormFieldsConfig` JSDoc @example (the @ts-expect-error `ofice`
        case) → copy into the Form key-check subsection.
      - `FormalityFieldComponentProps` JSDoc (destructure-before-forward pattern
        + MUI v9 slotProps note + runtime caveat) → copy into the
        injected-props subsection.
  critical: |
    The `FormalityFieldComponentProps` runtime caveat MUST be reproduced in the
    README: "Today Field delivers the RHF ref via the React-special `ref` key,
    not a top-level `forwardRef` prop. To receive it as `forwardRef` on a bare
    function component, wrap with React.forwardRef or target React 19's
    ref-as-prop." Omitting this makes the doc MISLEADING (consumers will expect
    `forwardRef` to arrive at runtime when it does not yet).

- file: packages/react/src/components/Field.tsx
  why: Confirms `FieldProps<TName extends string = string>` with `name: TName`
        (around line 66) and that name-checking only engages when NARROWED.
        The honest consumer pattern is `FieldProps<keyof YourValues>`, NOT an
        automatic `<Form<T>>`-context inference. Document the real pattern.
  section: FieldProps interface + its JSDoc (lines ~41–75)

- file: vitest.config.ts
  why: Source of truth for the coverage gate facts (provider, exclude list).
        The `thresholds: { statements:90, branches:90, functions:90, lines:90 }`
        block is being added by sibling P1.M2.T1.S5 — TREAT AS APPLIED.

- docfile: plan/002_78ea74508dd8/P1M2T1S5/PRP.md
  section: Goal + Integration Points (VITEST CONFIG)
  why: |
    Contract for the coverage gate this README documents. Confirms: thresholds
    are 90/90/90/90; v8 provider sets exit code 1 on miss; gate is repo-wide
    merged (core + react); excludes are exactly examples/**, packages/svelte/**,
    packages/vue/**, **/dist/** (+ coverageConfigDefaults.exclude). Cite these
    facts verbatim in the Testing & Coverage section.

- docfile: plan/002_78ea74508dd8/architecture/injected_props_types.md
  section: "TL;DR" + §3 (forwardRef) + §2 (state)
  why: |
    The authoritative report behind FormalityFieldComponentProps. Gives the
    exact runtime types (formState=UseFormStateReturn<FieldValues>;
    state=CustomFieldState | Record<string,CustomFieldState>;
    forwardRef=RefCallBack), the before/after WithFormality contrast, and the
    runtime caveat wording. Quote from here for accuracy.

- docfile: PRD.md §1.3.7 (h4.6)
  why: Verbatim source for the exclusion table + the 90%/all-four-metrics bar.
- docfile: PRD.md §C.4 / Appendix C (h4.60, h4.61, h4.62) + §C.8 (h3.117)
  why: The requirements these docs describe (T2.1 key-check, T2.2 defineInputs,
        T3.1 FormalityFieldComponentProps) and the DoD "consumer before/after
        snippet" this README satisfies.

- docfile: plan/002_78ea74508dd8/P1M3T1S1/research/exported-surface.md
  why: This task's own research note — the exact exports, README section map,
        FormalityFieldComponentProps before/after, coverage facts, the symbol
        grep harness, and the sibling boundary. Read this FIRST; it's the
        distilled field guide for the edit.

- url: https://vitest.dev/guide/coverage.html#coverage-thresholds
  why: Authoritative cite for "thresholds fail the run below the floor" — link
        from the Testing & Coverage section so contributors can read the gate
        semantics.
```

### Current Codebase tree (relevant slice)

```bash
packages/react/README.md         # ← THE file to EDIT (additive only)
packages/react/src/index.ts      # public surface — verify symbols against this
packages/react/src/overlays.ts   # canonical JSDoc examples to copy
packages/react/src/components/Field.tsx   # FieldProps<TName> source of truth
packages/react/src/__typechecks__/        # scratch dir for snippet typecheck (Task 4)
vitest.config.ts                 # coverage gate facts (thresholds via S5)
README.md                        # ROOT readme — NOT in scope (sibling S2 owns it)
plan/002_78ea74508dd8/P1M3T1S1/research/exported-surface.md  # field guide
```

### Desired Codebase tree with files to be modified

```bash
packages/react/README.md   # MODIFIED — +2 sections (Type Safety, Testing & Coverage)
                          #            + minor extension to TypeScript Support catalog
# (no other files change)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: defineInputs is a VALUE export, not a type. README snippets must use
//   import { defineInputs } from "@formality-ui/react";          // ✅ value
//   import type { FormalityFieldComponentProps } from "@formality-ui/react"; // ✅ type
// Swapping these triggers a verbatimModuleSyntax / isolatedModules lint error.

// CRITICAL: FormalityFieldComponentProps does NOT yet have runtime parity. Field
// spreads the RHF ref as the React-special `ref` key (Field.tsx ~451), NOT a
// top-level `forwardRef` prop. The type ships the INTENDED contract. The README
// MUST say this, or consumers will be misled. (architecture/injected_props_types.md §3.)

// CRITICAL: forwardRef is RHF's `RefCallBack` (`(instance:any)=>void`), NOT
// `React.Ref<HTMLInputElement>`. That is the whole point of replacing the
// consumer's lossy `WithFormality`. For MUI v9 (Checkbox etc.), wire via
// `slotProps={{ input: { ref: forwardRef } }}` — show this in the snippet.

// CRITICAL: <Field name="..."> is NOT auto-narrowed by <Form<TFieldValues>>.
// React generics do not thread into children context. Name-checking only
// engages when FieldProps is explicitly narrowed (e.g. FieldProps<keyof V>).
// Document the real explicit-narrow pattern — do NOT imply <Form<T>> checks
// child <Field> names automatically.

// CRITICAL: This is Mode B (documentation). Do NOT edit any source, test,
// config, package.json, or another README. The diff MUST be exactly one file.
// Root README.md is owned by sibling P1.M3.T1.S2 — zero overlap.

// GOTCHA: The existing Quick Start uses core's `InputConfig`/`FormFieldsConfig`
// and `Record<string, InputConfig>`. That's the pre-overlay pattern. The new
// Type Safety section should point readers to the React overlays
// (ReactInputConfig etc.) as the PREFERRED React pattern, but leave Quick Start
// as-is (rewriting it is out of scope and risks scope creep / merge churn with
// nothing).

// GOTCHA: All code blocks must be self-contained and compile. `@ts-expect-error`
// lines (e.g. the `ofice` typo, `component: 42`) are the cleanest way to SHOW a
// rejection in a markdown block — they prove the negative without needing a
// separate "this errors" prose explanation. If you copy them into a scratch
// __typechecks__ file for Task 4, the `@ts-expect-error` MUST fire (else the
// snippet's claimed error doesn't actually occur → doc is wrong).
```

## Implementation Blueprint

### Data models and structure

None — pure markdown documentation. No data models, no code generation.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — read the README + the two source-of-truth files + the field guide
  - READ: packages/react/README.md  (end to end; note section order + markdown style)
  - READ: packages/react/src/index.ts  (the exact public surface)
  - READ: packages/react/src/overlays.ts  (canonical JSDoc examples to copy)
  - READ: packages/react/src/components/Field.tsx  (FieldProps<TName>, ~line 66)
  - READ: plan/002_78ea74508dd8/P1M3T1S1/research/exported-surface.md  (the field guide)
  - RUN the symbol-existence grep (from research note §6) to confirm every symbol
    you plan to name is REALLY exported. This is the single biggest accuracy
    safeguard. Fix any "NOT EXPORTED" BEFORE writing prose around it.

Task 2: ADD the `## Type Safety` section (after `## TypeScript Support`, before `## Utilities`)
  - FILE: packages/react/README.md
  - WHERE: insert immediately AFTER the existing `## TypeScript Support` import
           catalog (which ends ~line 436) and BEFORE `## Utilities` (line 437).
  - STRUCTURE: one `## Type Safety` header + a one-paragraph intro, then four
    `###` subsections, each with a copy-pasteable fenced ```tsx block:
    2a. ### Checked Form config keys (<Form<TFieldValues>>)
        - Show `<Form<ClientValues> config={{ name, email, subscribed }}>` compiling.
        - Show the typo `ofice` rejected with `// @ts-expect-error`.
        - Note: default `<Form>` (no generic) still accepts any string key
          (non-breaking). Copy the example shape from overlays.ts
          `ReactFormFieldsConfig` JSDoc.
    2b. ### Checked Field names (FieldProps<TName>)
        - State plainly: by default `<Field name="..."/>` accepts any string
          (backwards compatible). Name-checking engages ONLY when narrowed.
        - Show the explicit-narrow pattern:
          `type Names = keyof ClientValues;` and a typed wrapper/prop
          `FieldProps<Names>`. Show the typo rejected via @ts-expect-error.
        - Do NOT claim <Form<T>> auto-narrows children (it does not).
    2c. ### Checking input types with defineInputs (opt-in)
        - Copy the `defineInputs` example + `type InputType = keyof typeof
          inputs` derivation verbatim from overlays.ts JSDoc.
        - Import as a VALUE: `import { defineInputs } from "@formality-ui/react"`.
        - Note: additive/opt-in — the existing non-generic `Field`/`type` still
          works unchanged; this is the path to end-to-end `keyof` checking.
    2d. ### Field component props: FormalityFieldComponentProps
        - BEFORE snippet: the consumer's hand-rolled lossy `WithFormality<P>`
          (state?: unknown; formState?: unknown; forwardRef?: Ref<HTMLInputElement>).
        - AFTER snippet: `import type { FormalityFieldComponentProps }` + the
          destructure-before-forward component pattern
          `({ state, formState, forwardRef, ...domProps }) => <input ref={forwardRef} .../>`.
        - TWO accuracy notes (must include both):
          (1) forwardRef is RHF `RefCallBack`; plain `<input>` → `ref={forwardRef}`;
              MUI v9 → `slotProps={{ input: { ref: forwardRef } }}`.
          (2) RUNTIME CAVEAT: Field today delivers the ref via the React-special
              `ref` key, not a top-level `forwardRef` prop; to receive
              `forwardRef` on a bare component, wrap with React.forwardRef or
              target React 19 ref-as-prop. (The type ships the intended
              contract; runtime wiring is a follow-up.)
  - STYLE: match existing README (## / ### headers, ```tsx fences, terse prose,
           tables only where they add value — subsections 2a–2d are snippet-led).

Task 3: ADD the `## Testing & Coverage` section (before `## License`)
  - FILE: packages/react/README.md
  - WHERE: insert AFTER `## Utilities` (ends ~line 448) and BEFORE `## License`
           (line 450).
  - CONTENT (concise — a short note, not an essay):
    - Command: `pnpm test:coverage` (== `vitest run --coverage`).
    - The bar: ≥ 90% on statements, branches, functions, AND lines (all four);
      the run exits non-zero if any drops below (link
      https://vitest.dev/guide/coverage.html#coverage-thresholds).
    - Scope: repo-wide merged coverage (core + react).
    - Exclusion table (verbatim reason column from PRD §1.3.7):
        examples/**           — Demo apps; not shipped
        packages/svelte/**    — Stubbed adapter
        packages/vue/**       — Stubbed adapter
        **/dist/**            — Build output
    - One line: "All other code — `packages/core/**`, `packages/react/**`, and
      any future adapter with a real implementation — is in scope and must clear
      90%."
  - DO NOT reproduce the full vitest.config.ts block; the README points at the
    config for that. Keep it accurate to the ACTUAL exclude list in
    vitest.config.ts (verify before writing).

Task 4: EXTEND the existing `## TypeScript Support` catalog (minor)
  - FILE: packages/react/README.md (the existing `import type { ... }` block ~397–436)
  - ADD the new exports to the existing import list so the catalog is complete:
      // React type overlays (precise React/RHF types over core's loose types)
      ReactInputConfig,
      ReactFieldConfig,
      ReactFormFieldsConfig,
      FormalityFieldComponentProps,
      // re-exported react-hook-form types (so consumers need no direct RHF import)
      RefCallBack,
      UseFormStateReturn,
      FieldValues,
    and the value import (separate, since it's not a type):
      import { defineInputs } from "@formality-ui/react";
  - DO NOT remove or reorder existing entries. This is purely additive.
  - GOTCHA: keep `defineInputs` OUT of the `import type { ... }` block — it is a
    value. Add it as its own `import { defineInputs }` line with a comment.

Task 5: VERIFY — accuracy, compile, scope (run BEFORE considering the task done)
  - 5a. SYMBOL EXISTENCE: run the grep loop from research note §6. Every symbol
       named in the new README sections must resolve to a real index.ts export.
       ZERO "NOT EXPORTED" lines allowed.
  - 5b. SNIPPET COMPILE (high-signal, optional but recommended): copy each new
       ```tsx / ```ts block into a scratch file under
       `packages/react/src/__typechecks__/` (this dir is part of the react
       `tsc --noEmit` surface), run
       `pnpm --filter @formality-ui/react exec tsc --noEmit`, confirm clean,
       then DELETE the scratch file. The `@ts-expect-error` lines MUST fire
       (if one doesn't, the claimed rejection is wrong → fix the snippet).
       Alternative: careful manual review against overlays.ts/Field.tsx.
  - 5c. SCOPE CHECK: `git diff --stat` shows EXACTLY ONE file
       (`packages/react/README.md`). Root README.md and all other files
       untouched.
  - 5d. CONTENT-ACCURACY CHECKLIST (re-read your new sections against):
       - FormalityFieldComponentProps states BOTH the RefCallBack fact AND the
         runtime ref-vs-forwardRef caveat.
       - Field name-checking is described as "engages when narrowed", NOT
         "automatic from <Form<T>>".
       - Coverage exclusions match vitest.config.ts exactly.
       - defineInputs imported as a value, types as `import type`.
```

### Implementation Patterns & Key Details

```tsx
// PATTERN — the canonical defineInputs snippet (copy from overlays.ts JSDoc):
import { defineInputs } from "@formality-ui/react";   // VALUE import

const inputs = defineInputs({
  textField: { component: TextField, defaultValue: "" },
  switch:    { component: Switch,    defaultValue: false },
});
export type InputType = keyof typeof inputs;   // "textField" | "switch"

// PATTERN — Form key-checking (copy shape from ReactFormFieldsConfig JSDoc):
type ClientValues = { name: string; email: string; subscribed: boolean };
// @ts-expect-error — typo "ofice" is rejected when the generic is narrowed
const bad: ReactFormFieldsConfig<ClientValues> = { ofice: { type: "textField" } };

// PATTERN — FormalityFieldComponentProps before/after:
// BEFORE (consumer hand-rolls, lossy):
type WithFormality<P> = P & {
  state?: unknown;
  formState?: unknown;
  forwardRef?: React.Ref<HTMLInputElement>;   // wrong type
};
// AFTER (shipped, precise):
import type { FormalityFieldComponentProps } from "@formality-ui/react";
const TextField: React.ComponentType<FormalityFieldComponentProps<TextFieldProps>> =
  ({ state, formState, forwardRef, ...domProps }) => (
    <input ref={forwardRef} {...domProps} />   // forwardRef: RHF RefCallBack
  );

// GOTCHA to put in prose under the after snippet:
//   "Today Field delivers the RHF ref via the React-special `ref` key, not a
//    top-level `forwardRef` prop. To receive it as `forwardRef` on a bare
//    function component, wrap with React.forwardRef or target React 19's
//    ref-as-prop. The type ships the intended contract now."
```

### Integration Points

```yaml
DOCUMENTATION (this task):
  - file: packages/react/README.md
  - change: ADD `## Type Safety` (after `## TypeScript Support`),
            ADD `## Testing & Coverage` (before `## License`),
            EXTEND the `## TypeScript Support` import catalog (new exports).
  - preserve: all existing sections, Quick Start, tables, tone, markdown style.

DOCUMENTATION (NOT in scope — sibling S2):
  - file: README.md (root)
  - change: NONE (owned by P1.M3.T1.S2). Do not edit.

CODE / TESTS / CONFIG / PACKAGE.JSON:
  - change: NONE. This is Mode B documentation. No source, test, config, or
            manifest edits.
```

## Validation Loop

### Level 1: Markdown & Style (Immediate Feedback)

```bash
# 1. Rendered markdown sanity (no broken tables/fences):
#    open packages/react/README.md in a markdown previewer OR run a quick
#    structural check:
grep -nE "^#{2} " packages/react/README.md
# Expected: the section list now includes `## Type Safety` and
# `## Testing & Coverage` in the correct positions (Type Safety after TypeScript
# Support; Testing & Coverage before License).

# 2. Prettier (if configured on .md — run, accept its formatting for new lines):
pnpm exec prettier --check packages/react/README.md || \
  pnpm exec prettier --write packages/react/README.md
# (If prettier is not configured for markdown, this is a no-op / not a gate.)

# 3. ESLint typically does NOT lint .md — do not expect lint to cover this file.
```

### Level 2: Accuracy — every documented symbol really exports (THE key gate)

```bash
# Run the symbol-existence harness from research note §6. EVERY symbol named in
# the new README sections must resolve to a real index.ts export.
for sym in defineInputs FormalityFieldComponentProps ReactInputConfig \
           ReactFieldConfig ReactFormFieldsConfig RefCallBack \
           UseFormStateReturn FieldValues FormProps FieldProps; do
  grep -q "\b$sym\b" packages/react/src/index.ts \
    && echo "OK:     $sym" \
    || echo "MISSING: $sym  ← NOT EXPORTED — fix the README or stop claiming it"
done
# Expected: all "OK", zero "MISSING".
```

### Level 3: Code blocks compile (high-signal correctness)

```bash
# Copy each new ```tsx / ```ts block into a scratch file under the react
# typecheck surface, compile, then delete. The @ts-expect-error lines MUST fire.
SCRATCH="packages/react/src/__typechecks__/__readme_scratch.tsx"
# (assemble the scratch file from the README blocks — manual or scripted)
pnpm --filter @formality-ui/react exec tsc --noEmit
# Expected: zero errors. If an @ts-expect-error did NOT fire → the snippet's
# claimed rejection is wrong → fix the snippet. If a non-expect-error line
# errors → fix the snippet.
rm -f "$SCRATCH"   # NEVER commit the scratch file
# Re-run tsc --noEmit to confirm the package is clean again.
pnpm --filter @formality-ui/react exec tsc --noEmit
# Alternative (lower rigor): careful manual review of each block against
# overlays.ts / Field.tsx / index.ts. Acceptable only if the symbol grep (L2) is green.
```

### Level 4: Content accuracy & scope review (manual, final)

```bash
# 1. SCOPE — exactly one file changed:
git diff --stat
# Expected: only packages/react/README.md. Root README.md and everything else
# untouched (sibling P1.M3.T1.S2 owns the root README).

# 2. FORMALITYFIELDCOMPONENTPROPS caveat present (the easy-to-forget accuracy bar):
grep -niE "forwardRef|RefCallBack|React.forwardRef|ref-as-prop|runtime caveat|via the .*ref.* key" packages/react/README.md
# Expected: hits showing BOTH the RefCallBack type AND the runtime
# ref-vs-forwardRef caveat are documented.

# 3. FIELD name-checking described honestly (not "automatic"):
grep -niE "narrow|engages when|default.*any string|backwards compat" packages/react/README.md
# Expected: text stating name-checking engages only when narrowed, default accepts any string.

# 4. COVERAGE exclusions match vitest.config.ts:
grep -niE "examples/\*\*|packages/svelte|packages/vue|dist" packages/react/README.md
# Expected: all four exclusion globs present, matching vitest.config.ts exactly.

# 5. defineInputs imported as a VALUE (not `import type`):
grep -nE "import \{ defineInputs \}" packages/react/README.md
# Expected: at least one value import for defineInputs.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: README structure intact; new `##` sections in the right
      positions; prettier (if configured) clean.
- [ ] Level 2 passed: symbol-existence grep shows zero "MISSING".
- [ ] Level 3 passed: all new code blocks compile (scratch typecheck clean and
      deleted) OR rigorous manual review against source.
- [ ] Level 4 passed: scope = one file; all four content-accuracy greps green.

### Feature Validation

- [ ] `## Type Safety` present with all four subsections (Form key-check,
      Field name-check, defineInputs+InputType, FormalityFieldComponentProps).
- [ ] `## Testing & Coverage` present with `pnpm test:coverage`, 90%/all-four,
      and the exclusion table.
- [ ] `## TypeScript Support` catalog extended with the new exports.
- [ ] `FormalityFieldComponentProps` section states BOTH the `RefCallBack` fact
      AND the runtime `ref`-vs-`forwardRef` caveat.
- [ ] Field name-checking described as opt-in/narrowed (not automatic).
- [ ] defineInputs imported as a value; overlay types as `import type`.

### Code Quality Validation

- [ ] New sections match the existing README's tone, header depth, fence style,
      and table shape.
- [ ] No contradictions with the existing Quick Start (cross-reference, don't
      rewrite).
- [ ] All links (e.g. vitest coverage thresholds URL) are valid and anchored.
- [ ] No source/test/config/package.json/other-README changes.

### Documentation & Deployment

- [ ] The README is self-consistent and a consumer can adopt the new types from
      it alone.
- [ ] Root `README.md` left for sibling `P1.M3.T1.S2` (no overlap).

---

## Anti-Patterns to Avoid

- ❌ Don't document a symbol that isn't exported — run the Level 2 grep FIRST and
  fix any "MISSING" before writing prose around it.
- ❌ Don't omit the `FormalityFieldComponentProps` runtime caveat. The type does
  NOT yet have runtime parity (Field spreads `ref`, not `forwardRef`). A
  snippet that implies otherwise misleads `sellario-ui` and every other consumer.
- ❌ Don't claim `<Field name="...">` is auto-narrowed by `<Form<T>>`. It is not
  — React generics don't thread into children. Document the explicit-narrow
  pattern honestly.
- ❌ Don't import `defineInputs` as a type. It's a value export. Mixed value/type
  imports trip `verbatimModuleSyntax` / `isolatedModules`.
- ❌ Don't rewrite `## Quick Start` to use the overlay types. This task is
  additive; rewriting Quick Start is scope creep and risks churn for nothing.
- ❌ Don't edit root `README.md`, any source/test/config file, or `package.json`.
  Sibling `P1.M3.T1.S2` owns the root README; everything else is out of scope for
  Mode B.
- ❌ Don't copy the coverage exclusions from memory — read `vitest.config.ts` and
  the S5 PRP and transcribe exactly (the four globs + their reasons).
- ❌ Don't leave the scratch `__typechecks__` file committed — it's a local proof
  step only.
- ❌ Don't pad the Testing & Coverage section into an essay. The item asks for a
  "concise note" — command, the 90% bar, the exclusion table, one scope line.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **single-file, additive, documentation-only** task with the entire
  source of truth already read and distilled into the research note
  (`exported-surface.md`): exact exports, canonical JSDoc snippets to copy, the
  `FormalityFieldComponentProps` before/after + runtime caveat, and the coverage
  facts.
- The strongest accuracy risk (documenting a non-exported symbol or a wrong
  signature) is neutralized by the Level 2 symbol-existence grep + the optional
  scratch-typecheck (Level 3), both specified as concrete commands.
- The second risk (misleading consumers about `forwardRef` runtime parity) is
  called out repeatedly and backed by the architecture note (`injected_props_types.md` §3).
- The sibling-scope risk (touching root README) is bounded by the Level 4
  `git diff --stat` check.
- Residual 1 point: markdown style/tone matching is subjective; the implementer
  must read the existing README and mirror it (Task 1 makes this explicit).
