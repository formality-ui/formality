# PRP — P1.M1.T2.S1: Update `ReactFieldConfig` JSDoc to reference §6.4 field-level overrides

**Parent plan**: `plan/006_223c8a76c909` — §6.4 Field-Level Overrides.
**Status**: Documentation-only (Mode A). The §6.4 type surface was added to
core `FieldConfig` by **P1.M1.T1.S1** (COMPLETE — verified in code). The React
overlay `ReactFieldConfig extends Omit<FieldConfig, "rules">` already
**auto-inherits** all six override fields unchanged, but its JSDoc says
nothing about them — so a React consumer hovering the type in their editor
would not discover `defaultValue` / `debounce` / `parser` / `formatter` /
`valueField` / `getSubmitField` are available per-instance. This task adds ONE
paragraph to that JSDoc. **No runtime change, no type change, no new test is
required** (the contract explicitly states "[Mode A] This IS the documentation
update").

---

## Goal

**Feature Goal**: Make `ReactFieldConfig`'s hover/IntelliSense documentation
tell React consumers that the six §6.4 field-level override fields are
inherited unchanged from core `FieldConfig`, name the single precedence rule
(`resolveFieldOverType`, §6.4.0), and call out that per-field
`parser`/`formatter` stay `string | ((value: unknown) => unknown)` (not
generified over `TValue`).

**Deliverable**: One new paragraph appended to the `/** … */` JSDoc block on
`ReactFieldConfig` in `packages/react/src/overlays.ts` (the block currently
spanning lines 55–64). Nothing else changes.

**Success Definition**:
1. The `ReactFieldConfig` JSDoc contains a paragraph that (a) names all six
   override fields, (b) states they are inherited from core `FieldConfig`
   unchanged, (c) states they override their `InputConfig` counterparts
   `when !== undefined`, (d) names `resolveFieldOverType` and §6.4.0, and
   (e) states field-level `parser`/`formatter` stay
   `string | ((value: unknown) => unknown)` (not generified; §3.2.1).
2. The new paragraph is placed at the END of the existing JSDoc block (after
   the generic-`V` paragraph), preserving both existing paragraphs verbatim.
3. `pnpm format:check` passes (prettier reflows JSDoc prose — the gate that
   matters here). Run `pnpm format` if it flags wrapping.
4. `pnpm lint` passes; `pnpm typecheck` is clean (zero compile impact — JSDoc
   only); `pnpm test` stays green (JSDoc has no runtime effect; baseline
   1085 passed | 5 skipped unchanged).
5. The prose matches the contract text semantically, with code identifiers
   backticked to match the file's existing JSDoc convention.

---

## Why

P1.M1.T1.S1 added the six override fields to core `FieldConfig` and explicitly
**deferred** the overlay JSDoc update to a separate task ("Updating
ReactFieldConfig JSDoc is a SEPARATE task (P1.M1.T2.S1). Do NOT touch
overlays.ts in this task."). This is that task.

- **Business value / user impact**: `ReactFieldConfig` is the type React
  consumers actually import and use (PRD §3.2.1). The interface *already*
  carries the six fields through `Omit<FieldConfig, "rules">`, but the
  documentation gap means a consumer reading the hover doc sees only the
  `rules`-narrowing story and never learns per-instance overrides exist.
  Closing this gap makes the §6.4 feature discoverable at the point of use.
- **Integration with existing features**: Purely additive documentation riding
  on top of the (complete) type surface. Does not touch core `FieldConfig`,
  does not touch the (in-flight) `resolveFieldOverType` barrel export
  (P1.M1.T1.S3), and does not touch any adapter runtime wiring (P1.M3).
- **Scope boundary**: This task edits ONLY the `ReactFieldConfig` JSDoc block
  in `overlays.ts`. Do NOT edit `ReactInputConfig`'s JSDoc, the interface
  bodies, any core file, or any runtime/adapter code. Do NOT add the optional
  type-level assertion unless the optional Task 2 is explicitly chosen.

---

## What

Append a single JSDoc paragraph to the `ReactFieldConfig` interface comment in
`packages/react/src/overlays.ts`. The paragraph is taken (semantically) from
the task contract, with code identifiers backticked to match the file's
established style (every identifier in this file's JSDoc is backticked — see
`rules?: Record<string, unknown>`, `RegisterOptions`, `FieldValues`, etc.).

### Success Criteria

- [ ] A new paragraph exists in the `ReactFieldConfig` JSDoc naming all six
      fields: `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`,
      `getSubmitField`.
- [ ] The paragraph states the fields are **inherited from core `FieldConfig`
      unchanged**.
- [ ] The paragraph states they override their `InputConfig` counterparts
      **`when !== undefined`**.
- [ ] The paragraph names **`resolveFieldOverType`** and references **§6.4.0**.
- [ ] The paragraph states field-level `parser`/`formatter` stay
      **`string | ((value: unknown) => unknown)`** — NOT generified over
      `TValue` — referencing **§3.2.1**.
- [ ] The two existing paragraphs (rules-narrowing, generic-`V`) are
      **unchanged**; the new paragraph is appended after them.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass.

---

## All Needed Context

### Context Completeness Check

> _"If someone knew nothing about this codebase, would they have everything
> needed to implement this successfully?"_ — **YES.** This PRP names the exact
> file, quotes the exact current JSDoc block (so the implementer can locate it
> without searching), specifies the exact insertion point (end of the block,
> before the closing ` */ `), supplies the exact paragraph text (pre-wrapped),
> names the exact validation commands, and documents the backtick/wrapping
> conventions prettier will enforce. There is no ambiguity left to resolve.

### Documentation & References

```yaml
# PRD — authoritative source for the paragraph's claims.
- docfile: PRD.md
  section: §6.4 Field-Level Overrides (§6.4.0 precedence rule, §6.4.1–§6.4.4 per-lever, §6.4.5 edge cases)
  why: "Defines the six fields, the `!== undefined` rule, and the `resolveFieldOverType` helper the paragraph references."
  critical: "§6.4.3 states field-level parser/formatter use `(value: unknown) => unknown` (FieldConfig is NOT generic over TValue). §6.4.0 names `resolveFieldOverType`. These are the two facts the paragraph MUST state correctly."
- docfile: PRD.md
  section: §3.2.1 React Overlay Types
  why: "Shows the intended ReactFieldConfig shape and confirms the six fields pass through the overlay unchanged; parser/formatter stay non-generic in the overlay (future enhancement, §3.2 / §6.4.3)."
  critical: "§3.2.1 is the anchor the paragraph cites for the 'per-field TValue is a future enhancement' note."

# The single file being edited.
- file: packages/react/src/overlays.ts
  why: "Contains the ReactFieldConfig interface (line 65) with its JSDoc block (lines 55–64). The edit target."
  pattern: "JSDoc paragraphs separated by a lone ` *` line. Every code identifier is backticked. Multi-line prose wraps ~76–78 chars (prettier printWidth 80 reflows `/** */`). Bare `§N.N` section refs (no 'PRD' prefix needed in-package): line 6 `§1.3.2 / §3.2`, line 145 `§20.1`, line 168 `§5.3.8`."
  gotcha: "prettier (format:check) WILL reflow the new paragraph. Write it close to the wrap width and run `pnpm format` to normalize; never hand-fight prettier on exact break points."

# S1's contract — the type surface this JSDoc documents (S1 is COMPLETE).
- docfile: plan/006_223c8a76c909/P1M1T1S1/PRP.md
  why: "Defines the exact six fields, their types, and placement on FieldConfig. Confirms S1 explicitly DEFERRED this overlay JSDoc edit to T2.S1 — so this task is the intended owner and won't conflict with S1."
  critical: "S1 is COMPLETE: the six fields exist in packages/core/src/types/config.ts after `recordKey`, before `rules`. Verify with `rg -n 'Field-level overrides' packages/core/src/types/config.ts` (expect the section-header comment)."

# S3's contract (parallel, in-flight) — referenced BY NAME in the paragraph, not edited.
- docfile: plan/006_223c8a76c909/P1M1T1S3/PRP.md
  why: "Exports `resolveFieldOverType` from the core barrel. The paragraph names this helper; the prose is correct regardless of S3's merge state (the helper exists and works either way — deep-import today, barrel after S3). No code dependency, only a doc cross-reference."

# Existing type-check convention (ONLY if optional Task 2 is chosen).
- file: packages/react/src/__typechecks__/ReactFormFieldsConfig.test-d.ts
  why: "Established `*.test-d.ts` convention: header comment 'NOT a runtime test; consumed by tsc --build', plain `const _x: Type = { … }` literals, `// @ts-expect-error` for negatives."
  gotcha: "This file currently asserts ReactFormFieldsConfig KEY-NARROWING, not the six override fields. A new sibling file proving inheritance is OPTIONAL (out of the stated contract) — only add if Task 2 is explicitly chosen."

# Validation tooling (root package.json).
- file: package.json
  section: scripts (format, format:check, lint, typecheck, test)
  why: "Exact commands for the validation loop. `format:check` is the primary gate for a JSDoc edit."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
  overlays.ts                 # ← EDIT TARGET: ReactFieldConfig JSDoc block (lines 55–64)
  index.ts                    # re-exports ReactFieldConfig — NO change
  __typechecks__/
    ReactFormFieldsConfig.test-d.ts   # convention ref for OPTIONAL Task 2 (only if chosen)
packages/core/src/types/config.ts     # S1 COMPLETE — six fields present (READ-ONLY here)
plan/006_223c8a76c909/
  P1M1T1S1/PRP.md            # S1 contract (type surface) — READ-ONLY context
  P1M1T1S3/PRP.md            # S3 contract (resolveFieldOverType barrel) — referenced by name
package.json                 # scripts: pnpm format/format:check/lint/typecheck/test
```

### Desired Codebase tree with files to be changed

```bash
packages/react/src/overlays.ts                          # MODIFY — +1 JSDoc paragraph on ReactFieldConfig
# OPTIONAL (Task 2, only if chosen):
packages/react/src/__typechecks__/ReactFieldConfig.test-d.ts   # ADD — type-level inheritance assertion
# (No other files touched. No core files. No runtime code.)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL — prettier reflows JSDoc. The root `format:check` (prettier --check)
// parses `/** */` blocks and rewraps prose at printWidth 80. Write the paragraph
// at roughly the right width, then run `pnpm format` (prettier --write) to
// normalize. Do NOT hand-tune exact line breaks to "beat" prettier — if
// `format:check` fails, just run `pnpm format` and commit its output. The PRP
// supplies a pre-wrapped form that is very likely to pass as-is.

// CRITICAL — backtick every code identifier. This file's JSDoc backticks ALL
// identifiers (rules, RegisterOptions, FieldValues, component, template,
// forwardRef, RefCallBack, …). The contract text writes them bare
// (defaultValue, FieldConfig, TValue, …). Backtick them in the final prose to
// match the file: `defaultValue`, `debounce`, `parser`, `formatter`,
// `valueField`, `getSubmitField`, `FieldConfig`, `InputConfig`, `TValue`,
// `resolveFieldOverType`, `string | ((value: unknown) => unknown)`, and
// `!== undefined`. Semantic content stays identical to the contract.

// CRITICAL — placement is the END of the block. The block has two paragraphs:
//   (1) "Narrows core's framework-agnostic `rules?` …" (lines 57–60)
//   (2) "The generic `V` defaults to `FieldValues` …" (lines 62–63)
// Append the new paragraph AFTER (2), before the closing ` */ ` on line 64.
// Do NOT insert between (1) and (2) — that splits the narrowing/generic story.

// STYLE — paragraph separator. JSDoc paragraphs in this file are separated by
// a single line containing only ` *` (star, one space, nothing else). Match it.

// STYLE — § references. Use bare `§6.4`, `§6.4.0`, `§3.2.1` (no "PRD" prefix).
// Matches line 6 (`§1.3.2 / §3.2`), line 145 (`§20.1`), line 168 (`§5.3.8`).

// SCOPE — do NOT edit:
//   • ReactInputConfig's JSDoc (different type; out of scope).
//   • The ReactFieldConfig INTERFACE BODY (the `rules?: RegisterOptions<V>;`
//     line and its `/** … */` stay exactly as-is).
//   • Any core file (FieldConfig is owned by S1; complete).
//   • resolveFieldOverType or its barrel (S2/S3 own those).
//   • Any adapter runtime code (useField, changeField, transformValuesForSubmit
//     are P1.M3.* — out of scope here).
//
// NO-RUNTIME-EFFECT — JSDoc is stripped at compile time. `pnpm typecheck`
// (tsc --build) cannot "fail because of JSDoc wording"; it can only fail if
// you accidentally break the surrounding TS syntax. Keep the edit strictly
// inside the `/** … */` block and typecheck is guaranteed clean.

// NOT A TEST TARGET — there is no test that asserts JSDoc *content*. The
// validation is: (a) prettier is happy (format:check), (b) eslint is happy
// (lint), (c) the file still compiles (typecheck), (d) tests still pass. A
// human reads the rendered JSDoc to confirm the paragraph is correct.
```

---

## Implementation Blueprint

### Data models and structure

None. This task adds a documentation paragraph to an existing JSDoc block. No
types, no interfaces, no runtime logic.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 0 (PRECHECK): confirm S1's type surface exists before documenting it
  - RUN: rg -n 'Field-level overrides' packages/core/src/types/config.ts
  - EXPECT: one match — the section-header comment S1 added (// ── Field-level
    overrides for type-level levers (PRD §6.4). ──).
  - ALSO RUN: rg -n 'defaultValue\?:|debounce\?:|getSubmitField\?:' \
              packages/core/src/types/config.ts
  - EXPECT: matches for all three (confirming the six fields are present on
    FieldConfig). If EMPTY, S1 has not landed — STOP. This task documents a
    surface that does not yet exist; sequence after S1.
  - READ the current ReactFieldConfig JSDoc to confirm it does NOT yet mention
    §6.4 (so you are not duplicating an existing paragraph):
    rg -n '6\.4|resolveFieldOverType' packages/react/src/overlays.ts
    EXPECT: no matches inside the ReactFieldConfig block (the gap this task
    closes).

Task 1: MODIFY packages/react/src/overlays.ts — append paragraph to ReactFieldConfig JSDoc
  - LOCATE: the JSDoc block directly above `export interface ReactFieldConfig`
    (the `/**` opens at line 55, `*/` closes at line 64). Its CURRENT exact
    content:
        /**
         * `FieldConfig` as seen by React consumers.
         *
         * Narrows core's framework-agnostic `rules?: Record<string, unknown>` to
         * react-hook-form's `RegisterOptions`, giving autocomplete and checking for
         * `required`, `min`, `max`, `pattern`, `validate`, `valueAsNumber`, `deps`, …
         *
         * The generic `V` defaults to `FieldValues`; pass your form's values type for
         * slightly tighter checking on path-based rules.
         */
  - INSERT: a new paragraph AFTER the generic-`V` paragraph (the line ending
    "… path-based rules.") and BEFORE the closing ` */ `. Separate it from the
    prior paragraph with a lone ` *` line (the file's paragraph-separator
    convention).
  - TEXT (exact, pre-wrapped for prettier printWidth 80 — code identifiers
    backticked to match the file; semantic content = contract):
        *
        * The §6.4 field-level override fields (`defaultValue`, `debounce`,
        * `parser`, `formatter`, `valueField`, `getSubmitField`) are inherited
        * from core `FieldConfig` unchanged. They override their `InputConfig`
        * counterparts when `!== undefined`, using the single
        * `resolveFieldOverType` rule (§6.4.0). The field-level
        * `parser`/`formatter` stay `string | ((value: unknown) => unknown)` —
        * NOT generified over `TValue` (per-field `TValue` is a future
        * enhancement, §3.2.1).
  - RESULT (the full block after the edit):
        /**
         * `FieldConfig` as seen by React consumers.
         *
         * Narrows core's framework-agnostic `rules?: Record<string, unknown>` to
         * react-hook-form's `RegisterOptions`, giving autocomplete and checking for
         * `required`, `min`, `max`, `pattern`, `validate`, `valueAsNumber`, `deps`, …
         *
         * The generic `V` defaults to `FieldValues`; pass your form's values type for
         * slightly tighter checking on path-based rules.
         *
         * The §6.4 field-level override fields (`defaultValue`, `debounce`,
         * `parser`, `formatter`, `valueField`, `getSubmitField`) are inherited
         * from core `FieldConfig` unchanged. They override their `InputConfig`
         * counterparts when `!== undefined`, using the single
         * `resolveFieldOverType` rule (§6.4.0). The field-level
         * `parser`/`formatter` stay `string | ((value: unknown) => unknown)` —
         * NOT generified over `TValue` (per-field `TValue` is a future
         * enhancement, §3.2.1).
         */
  - DO NOT:
      • Edit the `ReactInputConfig` JSDoc (different type; out of scope).
      • Edit the ReactFieldConfig interface body or its single `rules` field.
      • Reorder or rewrite the two existing paragraphs.
      • Touch any other file.
  - NOTE on wording vs contract: the contract text writes identifiers bare
      (e.g. "defaultValue", "FieldConfig"). This task backticks them to match
      the file's universal backtick convention; the SEMANTIC content is
      identical to the contract. If a reviewer insists on bare identifiers,
      remove the backticks — but the file's own style argues for keeping them.

Task 2 (OPTIONAL — only if explicitly chosen; OUT of the stated contract):
  ADD packages/react/src/__typechecks__/ReactFieldConfig.test-d.ts
  - WHY: the contract's OUTPUT is "Updated JSDoc on ReactFieldConfig" — a
    type-level assertion is NOT required. It is offered only as a belt-and-
    braces guard that ReactFieldConfig actually exposes the six inherited
    fields (locking inheritance against future refactors). Default: SKIP.
  - IF CHOSEN:
      • CREATE the file with the standard header comment ("NOT a runtime test;
        consumed by `tsc --build`"), mirroring
        ReactFormFieldsConfig.test-d.ts.
      • ASSERT each of the six fields is assignable on a `ReactFieldConfig`
        literal, e.g.:
            const _f: ReactFieldConfig = {
              defaultValue: null,            // unknown → null ok
              debounce: false,               // number | false
              parser: "float",               // string | fn
              formatter: (v: unknown) => v,  // string | fn
              valueField: "id",
              getSubmitField: (n: string) => `${n}Id`,
            };
            void _f;
      • NAME the file ReactFieldConfig.test-d.ts; PLACE in
        packages/react/src/__typechecks__/.
      • tsc --build (pnpm typecheck) compiles it; vitest does NOT run it.
  - GOTCHA: if Task 2 is added, it is part of the diff and must pass
    typecheck. Do not add it unless you intend to maintain it. The JSDoc-only
    Task 1 fully satisfies the contract on its own.

Task 3: FORMAT + VALIDATE
  - RUN: pnpm format        # normalize JSDoc wrapping (prettier --write)
  - RUN: pnpm format:check  # confirm clean
  - RUN: pnpm lint          # eslint (incl. any jsdoc rules)
  - RUN: pnpm typecheck     # tsc --build — JSDoc can't break this unless you
                            # damaged surrounding TS syntax; confirm clean
  - RUN: pnpm test          # 1085 passed | 5 skipped baseline held
  - IF format:check FAILS: it is a wrapping nit — re-run `pnpm format` and
    re-check. Do not hand-edit breaks to fight prettier.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — JSDoc block structure in overlays.ts. Each paragraph is a run of
// ` * <prose>` lines; paragraphs are separated by a lone ` *` line. The block
// opens with `/**` and closes with ` */`. Example (existing, line 140–181 —
// FormalityFieldComponentProps): multiple paragraphs, each ` *`-separated,
// backticked identifiers, § refs inline. Mirror that structure exactly.

// PATTERN — backtick usage. EVERY identifier that is a TS symbol (type, field,
// variable, type-literal) is wrapped in backticks in this file's JSDoc:
//   `rules?: Record<string, unknown>`, `RegisterOptions`, `FieldValues`,
//   `component`, `template`, `forwardRef`, `RefCallBack`.
// Backtick the six field names, the two config-type names, `TValue`,
// `resolveFieldOverType`, and the type literal `string | ((value: unknown) => unknown)`.

// PATTERN — § section refs are bare (no "PRD" prefix) inside the react pkg:
//   line 6  `See PRD §1.3.2 / §3.2.`      (this one has "PRD"; both styles appear)
//   line 145 `see §20.1`                  (bare)
//   line 168 `(PRD §5.3.8).`              (with "PRD")
//   line 175 `(PRD §20.4),`               (with "PRD")
// → bare `§6.4` / `§6.4.0` / `§3.2.1` is fine and matches line 145's style.

// GOTCHA — the contract paragraph uses an em dash "—" before "NOT generified".
// Keep it (the file uses em dashes elsewhere, e.g. "… NOT React's special `ref`
// key; see §20.1"). Ensure your editor emits U+2014, not a hyphen run.

// GOTCHA — do NOT add `@see` / `@link` tags unless matching existing style.
// This file uses inline `§N.N` refs and prose, not formal `@see` tags, for
// cross-refs (the only `{@link}` in overlays.ts is on ReactFormFieldsConfig).
// Keep the new paragraph as plain prose to match ReactFieldConfig's existing
// style.
```

### Integration Points

```yaml
DATABASE:
  - none (pure JSDoc; no persistence, no migration).

CONFIG:
  - none (no settings/env vars).

ROUTES / EXPORTS:
  - none. ReactFieldConfig is already re-exported from packages/react/src/index.ts;
    adding JSDoc does not change the export surface.

DOWNSTREAM (awareness only — none are triggered by this task):
  - P1.M3.T1/T2/T3.S1 — the React adapter will RESOLVE these six fields at
    runtime via resolveFieldOverType. This JSDoc documents that the fields
    exist on the type; it does not wire resolution.
  - P1.M4.T1.S2 ("Verify JSDoc consistency across affected exports") — a later
    task audits JSDoc; this task pre-empts part of that audit by making
    ReactFieldConfig's doc accurate now.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# From repo root. The PRIMARY gate for a JSDoc edit: prettier parses `/** */`
# and rewraps prose at printWidth 80. Run format first to normalize, then check.
pnpm format            # prettier --write (normalizes the new paragraph's wrapping)
pnpm format:check      # prettier --check (must be clean)
pnpm lint              # eslint . (incl. any jsdoc plugin rules)

# Expected: format:check clean after running `pnpm format`. If lint flags a
# jsdoc rule, READ the message — most jsdoc lint rules are satisfied by the
# backtick/plain-prose style above. Do not disable lint rules to pass.

# Type-check the whole monorepo (regression guard — JSDoc has zero compile
# impact, so this proves you didn't accidentally break surrounding syntax).
pnpm typecheck         # = tsc --build (packages/core + packages/react)
# Expected: ZERO errors. If it errors, you almost certainly edited outside the
# `/** … */` block or broke a backtick/code-fence — read the error and fix.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Full suite. JSDoc has no runtime effect, so the baseline MUST hold.
pnpm test              # = vitest run
# Expected: 1085 passed | 5 skipped (unchanged from baseline). 90/90/90/90
# coverage gate (vitest.config.ts) still green — JSDoc adds no uncovered code.

# (There is no targeted test for JSDoc content — JSDoc is not executed. If the
# optional Task 2 .test-d.ts was added, it is validated by `pnpm typecheck`,
# not by vitest.)
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the react package to confirm the public surface still compiles for
# downstream consumers (the JSDoc rides on the exported type).
pnpm -r build
# Expected: build succeeds. (JSDoc cannot break a build; this is a sanity check
# that overlays.ts and its dependents still compile end-to-end.)

# Rendered-doc spot check (manual, highest-signal for a docs task):
#   Open packages/react/src/overlays.ts in an editor with TS language service,
#   hover `ReactFieldConfig`, and confirm the new paragraph appears in the
#   IntelliSense popup naming all six fields + resolveFieldOverType + §6.4.0.
#   (No CLI equivalent — this is a human visual check of the deliverable.)

# Grep proof the paragraph landed and references are intact:
rg -n '§6\.4|resolveFieldOverType|§3\.2\.1' packages/react/src/overlays.ts
# Expected: matches inside the ReactFieldConfig block (the new paragraph).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Cross-reference accuracy: confirm the §6.4 / §6.4.0 / §3.2.1 anchors the
# paragraph cites actually exist in the PRD (so the doc isn't pointing at
# phantom sections). From repo root:
rg -n '#### 6\.4 |#### 6\.4\.0|#### 3\.2\.1' PRD.md
# Expected: matches for each cited section (§6.4 heading, §6.4.0 heading,
# §3.2.1 heading). If any is missing, the PRD section numbering changed —
# update the paragraph's § refs to the current numbers.

# Style consistency: confirm the new paragraph uses the same backtick + §-ref
# conventions as the rest of the file:
rg -n '^\s*\* ' packages/react/src/overlays.ts | head   # eyeball the block

# (No performance/security/load validation applies — pure documentation.)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm format:check` passes (run `pnpm format` first to normalize).
- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes with zero errors.
- [ ] `pnpm test` passes (1085 passed | 5 skipped baseline held; coverage gate green).

### Feature Validation

- [ ] The `ReactFieldConfig` JSDoc contains a new paragraph naming all six
      fields: `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`,
      `getSubmitField`.
- [ ] Paragraph states the fields are inherited from core `FieldConfig` unchanged.
- [ ] Paragraph states they override `InputConfig` counterparts `when !== undefined`.
- [ ] Paragraph names `resolveFieldOverType` and references §6.4.0.
- [ ] Paragraph states `parser`/`formatter` stay
      `string | ((value: unknown) => unknown)` (not generified over `TValue`),
      referencing §3.2.1.
- [ ] The two existing paragraphs (rules-narrowing, generic-`V`) are unchanged.
- [ ] New paragraph is placed at the END of the block (after the `V` paragraph).
- [ ] Hover/IntelliSense on `ReactFieldConfig` shows the new paragraph
      (manual visual check).

### Code Quality Validation

- [ ] Code identifiers are backticked (matches the file's universal convention).
- [ ] § references are bare `§N.N` (matches line 145 `§20.1` style).
- [ ] Paragraph separator is a lone ` *` line (matches existing blocks).
- [ ] Em dash `—` (U+2014) used, not a hyphen run.
- [ ] No files outside `packages/react/src/overlays.ts` are touched (unless the
      OPTIONAL Task 2 `.test-d.ts` was explicitly chosen).

### Documentation & Deployment

- [ ] Mode A docs ride with the work — the JSDoc paragraph IS the deliverable
      (no separate docs subtask required for this item).
- [ ] § anchors (6.4, 6.4.0, 3.2.1) verified present in PRD.md (Level 4 check).
- [ ] No new env vars / config / package.json `exports` map change.

---

## Anti-Patterns to Avoid

- ❌ **Do NOT edit `ReactInputConfig`'s JSDoc.** It is a different overlay type
  and is out of scope. The contract names `ReactFieldConfig` specifically.
- ❌ **Do NOT edit the `ReactFieldConfig` interface body** (the
  `rules?: RegisterOptions<V>;` line and its one-line JSDoc). Only the
  interface-level `/** … */` block above it changes.
- ❌ **Do NOT insert the paragraph between the two existing paragraphs.** Append
  it at the END of the block (after the generic-`V` paragraph). Splitting the
  narrowing/generic discussion harms readability.
- ❌ **Do NOT fight prettier on exact line wrapping.** If `format:check` fails,
  run `pnpm format` and commit its output. The PRP's pre-wrapped form should
  pass as-is, but prettier is the authority.
- ❌ **Do NOT leave code identifiers un-backticked.** Every identifier in this
  file's JSDoc is backticked; bare `defaultValue`/`FieldConfig`/`TValue` would
  be inconsistent with the surrounding style.
- ❌ **Do NOT add `@see` / `@param` / `@returns` tags.** This file uses plain
  prose with inline `§N.N` refs for `ReactFieldConfig` (the only `{@link}` in
  overlays.ts is on `ReactFormFieldsConfig`). Match the plain-prose style.
- ❌ **Do NOT touch core `FieldConfig` or `resolveFieldOverType`.** S1/S2/S3 own
  those. This task is documentation on the React overlay only.
- ❌ **Do NOT add the optional `.test-d.ts` unless explicitly chosen.** The
  contract OUTPUT is "Updated JSDoc on ReactFieldConfig." The type-check file
  is a belt-and-braces extra, not a requirement; adding it expands scope and
  the diff.
- ❌ **Do NOT run before S1 lands.** If `rg 'Field-level overrides'
  packages/core/src/types/config.ts` returns nothing, the surface this JSDoc
  documents doesn't exist yet. Stop and sequence after S1.

---

## Confidence Score

**10/10.** Single file, single JSDoc block, exact contract text supplied,
placement unambiguous (end of block), input dependency (S1) verified complete
in code, validation gates fully mechanical (`format:check` + `lint` +
`typecheck` + `test`). The only residual risk is a prettier-wrapping nit,
which `pnpm format` resolves deterministically; and a possible bare-vs-backtick
identifier style preference, for which the PRP gives a defensible default
(backtick, matching the file) and a trivial fallback. There is no runtime path
to get wrong — JSDoc is stripped at compile time.
