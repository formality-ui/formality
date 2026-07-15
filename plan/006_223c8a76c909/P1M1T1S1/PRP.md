# PRP — P1.M1.T1.S1: Add field-level override fields to `FieldConfig` type

**Parent plan**: `plan/006_223c8a76c909` — §6.4 Field-Level Overrides.
**Status**: Core foundation (types). This is the FIRST sub-task; it is a pure
**type-only** edit to one interface. It produces no runtime behavior on its own.
The behavioral wiring happens in later sub-tasks (S2 helper, S3 export,
P1.M2/P1.M3 resolution sites).

---

## Goal

**Feature Goal**: Add six optional field-level override fields to the core
`FieldConfig` interface so a single field instance can override its input
*type*'s `defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, and
`getSubmitField` (PRD §6.4). Type-only change; fully additive and non-breaking.

**Deliverable**: An updated `FieldConfig` interface in
`packages/core/src/types/config.ts` with the six new optional fields, each
carrying JSDoc that references its §6.4 sub-section. No other file is modified
structurally.

**Success Definition**:
1. `pnpm typecheck` passes (`tsc --build` over `packages/core` + `packages/react`).
2. `pnpm test` passes — all 1085 existing tests stay green (additive optional
   fields cannot break them).
3. The six fields are present on `FieldConfig` with the exact types below and
   placed **after `recordKey` and before `rules`** (PRD §3.2 layout).
4. `ReactFieldConfig` (in `packages/react/src/overlays.ts`) inherits the six
   fields automatically — verified, NO edit to `overlays.ts` is required or
   permitted in this task.
5. JSDoc on each new field references the correct §6.4 sub-section (Mode A docs
   ride with the work).

---

## Why

Formality's config is layered by specificity: Provider → InputConfig (per type)
→ FormConfig (per form) → **FieldConfig (per field instance)**. PRD §6.4
requires that every behavioral lever on `InputConfig` be overridable per-field.
`FieldConfig` currently mirrors only some levers; the six in this task had no
field-level counterpart. This task adds the **type surface** that later
sub-tasks (S2/S3/P1.M2/P1.M3) will resolve against. It is the foundational
prerequisite for all of §6.4.

- **Business value**: enables per-instance tuning (a single switch defaulting
  on, one autocomplete with a longer debounce, one field uppercasing-on-parse)
  without affecting every field of that type.
- **Scope boundary**: type-only here. Resolution precedence (`!== undefined`),
the `resolveFieldOverType` helper, and adapter wiring are explicitly separate
sub-tasks — do not implement them in this task.

---

## What

A type-only addition to the core `FieldConfig` interface. The fields mirror the
shape of the same-named fields on `InputConfig<TValue>`, with one deliberate
difference: `parser`/`formatter` use `(value: unknown) => unknown` (NOT the
`TValue`-generic form) because `FieldConfig` is not generic over `TValue`
(PRD §6.4.3 / §3.2). On `InputConfig`, `defaultValue` is **required**; on
`FieldConfig` it is **optional** (`defaultValue?: unknown`), because `undefined`
means "not specified" and all other values (`null`, `false`, `0`, `""`) are
meaningful overrides (PRD §6.4.5).

### Success Criteria

- [ ] `FieldConfig` has six new optional fields in the order: `defaultValue`,
      `debounce`, `parser`, `formatter`, `valueField`, `getSubmitField`.
- [ ] Fields are placed **after `recordKey`** and **before `rules`** (PRD §3.2).
- [ ] `parser` / `formatter` are typed `string | ((value: unknown) => unknown)`
      (NOT generic over `TValue`).
- [ ] `defaultValue` is typed `unknown` and is **optional**.
- [ ] Each field has JSDoc referencing its §6.4 sub-section (exact text below).
- [ ] `pnpm typecheck` and `pnpm test` both pass.
- [ ] `overlays.ts` is **unchanged** (auto-propagation verified).

---

## All Needed Context

### Context Completeness Check

> _"If someone knew nothing about this codebase, would they have everything
> needed to implement this successfully?"_ — **YES.** This PRP names the exact
> file, the exact interface, the exact line range, the exact insertion point,
> the exact field order, the exact types, the exact JSDoc text, and the exact
> validation commands. The change is a localized, mechanical edit to one
> interface body.

### Documentation & References

```yaml
# PRD — the authoritative spec for these six fields (READ the §6.4 family).
- docfile: PRD.md
  section: §6.4 Field-Level Overrides (§6.4.0 precedence rule, §6.4.1–§6.4.4 per-lever, §6.4.5 edge cases)
  why: Defines exact field types, the `!== undefined` semantics, and the override-vs-compose asymmetry.
  critical: "parser/formatter use `(value: unknown) => unknown` because FieldConfig is NOT generic over TValue (§6.4.3). `undefined` = 'not specified'; null/false/0/\"\" are meaningful (§6.4.5)."
- docfile: PRD.md
  section: §3.2 Core Configuration Types (the FieldConfig interface with the six fields already shown in commented form)
  why: Shows the intended final shape and field ORDER/placement (after recordKey, before rules).
- docfile: PRD.md
  section: §3.2.1 React Overlay Types — confirms `ReactFieldConfig extends Omit<FieldConfig,'rules'>` so new fields propagate automatically; `parser`/`formatter` stay non-generic in the overlay too.
  why: Proves NO edit to overlays.ts is needed for the type surface.

# The single file being edited.
- file: packages/core/src/types/config.ts
  why: Contains BOTH InputConfig (shape reference, lines 60–110) and FieldConfig (the edit target, interface at lines 120–167).
  pattern: "InputConfig already has debounce/parser/formatter/valueField/getSubmitField — copy their union/function shapes verbatim, but swap the TValue-generic parser/formatter signatures for `(value: unknown) => unknown`."
  gotcha: "FieldConfig is NOT generic. Do NOT add a <TValue> parameter to it. `defaultValue?: unknown` (optional, unknown) — InputConfig's `defaultValue: TValue` (required, generic) is a DIFFERENT shape. All six fields are OPTIONAL on FieldConfig."

# The React overlay — DO NOT EDIT (proof it auto-propagates).
- file: packages/react/src/overlays.ts
  why: "`ReactFieldConfig extends Omit<FieldConfig, 'rules'>` — the six framework-agnostic fields are inherited unchanged. No structural edit."
  gotcha: "Updating ReactFieldConfig JSDoc is a SEPARATE task (P1.M1.T2.S1). Do NOT touch overlays.ts in this task."

# Architecture context (read-only) — confirms this is the foundational gap.
- docfile: plan/006_223c8a76c909/architecture/prd_gaps.md
  section: "Gap Detail: §6.4 Field-Level Overrides" + "1. Core Type (types/config.ts)"
  why: Lists exactly which fields are missing on FieldConfig today and confirms the field-vs-type precedence rule is OUT of scope here.
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/types/config.ts      # ← EDIT TARGET (FieldConfig interface, lines 120–167)
packages/core/src/index.ts             # exports FieldConfig (type-only) — NO change needed
packages/react/src/overlays.ts         # ReactFieldConfig overlay — NO change (auto-propagates)
packages/core/src/__tests__/config.test.ts   # constructs FieldConfig literals — must stay green
packages/react/src/__typechecks__/            # *.test-d.ts convention for type assertions
```

### Desired Codebase tree with files to be added/changed

```bash
packages/core/src/types/config.ts                     # MODIFY — add 6 fields to FieldConfig
packages/core/src/__typechecks__/FieldConfig.test-d.ts  # ADD (RECOMMENDED) — type-level assertion of the 6 fields + §6.4.5 semantics
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: FieldConfig is NOT generic over TValue. parser/formatter on FieldConfig
// use `(value: unknown) => unknown` — NOT InputConfig's `(value: unknown) => TValue`
// or `(value: TValue) => unknown`. Copying InputConfig's signatures verbatim would
// introduce a stray `TValue` that does not exist in FieldConfig's scope (compile error).
// PRD §6.4.3 is explicit about this.

// CRITICAL: On InputConfig, `defaultValue: TValue` is REQUIRED. On FieldConfig,
// `defaultValue?: unknown` is OPTIONAL. Do not copy the required-ness.

// CRITICAL: All six fields are OPTIONAL on FieldConfig. Every one ends with `?`.
// `undefined` = "not specified"; null/false/0/"" are meaningful overrides (PRD §6.4.5).

// PLACEMENT: insert the six fields strictly AFTER `recordKey?: string;` and BEFORE
// `rules?: Record<string, unknown>;`. This matches PRD §3.2's FieldConfig layout and
// keeps the "field-level overrides" block visually grouped.

// FIELD ORDER: defaultValue → debounce → parser → formatter → valueField → getSubmitField
// (matches the task contract AND PRD §3.2's commented FieldConfig block).

// OVERLAY: ReactFieldConfig auto-inherits. Editing overlays.ts here is OUT of scope
// (JSDoc update there is P1.M1.T2.S1) and would be wrong anyway — the type surface
// is the same.
```

---

## Implementation Blueprint

### Data models and structure

This task adds fields to an existing interface. The exact final block to insert
(between `recordKey` and `rules`) is:

```typescript
  // ── Field-level overrides for type-level levers (PRD §6.4). ──────────
  // All six follow ONE rule: the field value wins over the type value when
  // !== undefined (override, NOT compose — only `validator` composes; §10).
  // See resolveFieldOverType (core helper, added in P1.M1.T1.S2).

  /**
   * Per-instance default value. Overrides the input type's defaultValue;
   * superseded by record/defaultValues prop. Honored when !== undefined, so
   * null/false/0/"" are meaningful. See §6.4.1, §13.1.
   */
  defaultValue?: unknown;

  /**
   * Per-instance auto-save debounce. Overrides the input type's debounce;
   * falls back to Form-level debounce prop (default 1000). false = submit
   * immediately. See §6.4.2.
   */
  debounce?: number | false;

  /**
   * Per-instance value transform (input→form). Overrides the input type's
   * parser. String = named parser; function = inline. See §6.4.3.
   */
  parser?: string | ((value: unknown) => unknown);

  /**
   * Per-instance value transform (form→display). Overrides the input type's
   * formatter. String = named formatter; function = inline. See §6.4.3.
   */
  formatter?: string | ((value: unknown) => unknown);

  /**
   * Submit-side value extraction from complex objects. Overrides the input
   * type's valueField. See §6.4.4.
   */
  valueField?: string;

  /**
   * Submit-side field name transformation. Overrides the input type's
   * getSubmitField. See §6.4.4.
   */
  getSubmitField?: (fieldName: string) => string;
```

> The section header comment (`// ── Field-level overrides …`) is OPTIONAL but
> recommended — it mirrors the visual grouping PRD §3.2 uses and aids future
> readers. The per-field JSDoc text is taken verbatim from the task contract
> (Mode A docs ride with the work).

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY packages/core/src/types/config.ts — extend FieldConfig
  - LOCATE: the `export interface FieldConfig {` block (lines ~120–167).
  - FIND: the line `recordKey?: string;` (currently ~line 140) and the line
          `rules?: Record<string, unknown>;` (currently ~line 143), with one
          blank line between them.
  - INSERT: the six-field block (see "Data models and structure" above) into
            that gap, AFTER `recordKey` and BEFORE `rules`.
  - TYPES (exact — do not deviate):
      defaultValue?:   unknown
      debounce?:       number | false
      parser?:         string | ((value: unknown) => unknown)
      formatter?:      string | ((value: unknown) => unknown)
      valueField?:     string
      getSubmitField?: (fieldName: string) => string
  - JSDOC: each field gets the exact text from the task contract (reproduced
           above in "Data models and structure"), referencing §6.4.x.
  - NAMING: field names are lowercase camelCase, matching InputConfig's
            existing same-named fields.
  - DO NOT: add a <TValue> generic to FieldConfig. Do NOT touch InputConfig,
            any other interface, or any runtime code.
  - PLACEMENT: strictly between `recordKey` and `rules`.

Task 2 (RECOMMENDED, optional): ADD packages/core/src/__typechecks__/FieldConfig.test-d.ts
  - CREATE the directory `packages/core/src/__typechecks__/` (does not exist yet).
  - WHY: type-only change has no runtime test target. A `.test-d.ts` assertion
         is the highest-value validation artifact and follows the existing
         convention in packages/react/src/__typechecks__/ (consumed by the root
         `pnpm typecheck` / `tsc --build` gate).
  - VERIFY (core tsconfig picks it up): core tsconfig `include: ["src/**/*"]`,
          `exclude: ["src/**/*.test.ts", "src/**/__tests__/**"]` — `.test-d.ts`
          is NEITHER excluded, so `tsc --build` compiles it. (vitest's core
          `include: ["src/**/*.test.ts"]` will NOT run it as a runtime test —
          correct, it is type-only.)
  - ASSERT:
      (a) each of the six fields exists on FieldConfig with the exact type
          (use `Expect<Equal<…>>`-style or plain assignability checks via
          `null as unknown as FieldConfig`);
      (b) the §6.4.5 semantics — `null`, `false`, `0`, and `""` are all
          assignable to `defaultValue` (it is `unknown`);
      (c) a string parser AND an inline function parser are both assignable to
          `parser` (union), and likewise for `formatter`;
      (d) `false` and a `number` are both assignable to `debounce`.
  - FOLLOW pattern: packages/react/src/__typechecks__/ReactFormFieldsConfig.test-d.ts
          (header comment explaining "NOT a runtime test; consumed by tsc --build").
  - NAMING: file ends in `.test-d.ts`.
  - NOTE: if the implementing agent is uncertain about the exact-diff test
          helpers, plain `const _x: FieldConfig = { … };` literals with the
          fields set are sufficient — TS will error if a field is missing or
          mistyped. Keep it minimal.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: FieldConfig fields are each preceded by a `/** ... */` JSDoc comment.
// Match the existing style in the same interface (2-space indent, `;` terminators).

// PATTERN: union types are spaced — `number | false`, `string | ((value: unknown) => unknown)`.
// Note the DOUBLE parens around the function in a union: `string | ((...) => ...)`.

// GOTCHA: do NOT write `string | (value: unknown) => unknown` (missing parens) —
// TS parses that as `(string | (value: unknown)) => unknown`, a function type,
// which is wrong. The parens are mandatory. InputConfig (line 93/96) shows the
// correct form — copy it exactly, then drop the TValue generic.

// GOTCHA: `defaultValue?: unknown` — note `unknown` (not `any`, not `TValue`).
// `unknown` is the intentionally-loose type so any value type is a valid default
// at the field-config level (PRD §6.4.1).
```

### Integration Points

```yaml
DATABASE:
  - none (pure TypeScript interface; no persistence, no migration).

CONFIG:
  - none (no settings/env vars).

ROUTES / EXPORTS:
  - FieldConfig is already `export type { … FieldConfig … }` from
    packages/core/src/index.ts. Adding fields does NOT require touching the
    export list (it is a type export, already present).
  - packages/react/src/index.ts re-exports ReactFieldConfig, which auto-inherits
    the new fields. NO change.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# From repo root. Lint + format-check the edited file.
pnpm lint
pnpm format:check

# If prettier complains about the new block, run:
#   pnpm prettier --write packages/core/src/types/config.ts
# (and the test-d file if added).

# Type-check the whole monorepo (the real gate for a type-only change).
pnpm typecheck      # = tsc --build across packages/core + packages/react

# Expected: ZERO errors. If TS errors, the most likely cause is a stray
# `TValue` in parser/formatter (FieldConfig is not generic) or missing parens
# in the union — read the error, fix the signature.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Full suite (from repo root). config.test.ts constructs FieldConfig literals
# and must stay green (additive optional fields cannot break it).
pnpm test

# Targeted (faster feedback) — the file that exercises FieldConfig most:
pnpm vitest run packages/core/src/__tests__/config.test.ts
pnpm vitest run packages/react/src/__tests__/   # ReactFieldConfig consumers

# Expected: 1085 passed | 5 skipped (41 files) — unchanged from baseline.
# Coverage gate (90/90/90/90) must remain green (type additions do not move it).
pnpm test:coverage   # optional — confirm thresholds still met
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify the React overlay auto-inherits the new fields (no edit to overlays.ts).
# A quick compile-time proof: build the packages.
pnpm -r build

# Smoke-check that ReactFieldConfig exposes the new fields (type-level, via tsc):
#   If Task 2 (test-d) was added, `pnpm typecheck` already proves inheritance.
#   Otherwise, temporarily add a one-liner assertion in a scratch file, e.g.:
#     import type { ReactFieldConfig } from "@formality-ui/react";
#     const _x: ReactFieldConfig = { defaultValue: "ok", debounce: 500, parser: "float" };
#   then revert it. (Do NOT commit scratch files.)

# Expected: build succeeds; ReactFieldConfig accepts the new fields with no error.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# PRD §6.4.5 semantics check — confirm "meaningful override" types compile.
# This is exactly what the Task 2 (.test-d.ts) file asserts:
#   defaultValue accepts null / false / 0 / "" (all are assignable to `unknown`).
#   parser accepts both a string ("float") and an inline function.
#   debounce accepts both a number and `false`.

# If Task 2 was skipped, add these assertions to a scratch .ts file, run
# `pnpm typecheck`, then revert. The fields MUST accept these values or the
# §6.4.5 contract is violated.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` passes with zero errors.
- [ ] `pnpm test` passes (1085 passed | 5 skipped baseline held).
- [ ] `pnpm lint` passes; `pnpm format:check` passes.
- [ ] Coverage gate 90/90/90/90 still green (`pnpm test:coverage`).

### Feature Validation

- [ ] All six fields present on `FieldConfig` in the order:
      defaultValue, debounce, parser, formatter, valueField, getSubmitField.
- [ ] Fields placed **after `recordKey`**, **before `rules`**.
- [ ] `parser`/`formatter` are `string | ((value: unknown) => unknown)` — NOT
      generic over TValue.
- [ ] `defaultValue` is `unknown` and OPTIONAL.
- [ ] JSDoc on each field references the correct §6.4.x sub-section.
- [ ] `overlays.ts` / `ReactFieldConfig` is UNCHANGED (auto-propagation verified).
- [ ] `resolveFieldOverType` is NOT added (that is S2 — out of scope).
- [ ] `resolveInitialValue` is NOT modified (that is P1.M2.T1.S1 — out of scope).
- [ ] No adapter runtime code (`useField.tsx`, `Form.tsx`) is touched (P1.M3).

### Code Quality Validation

- [ ] Matches existing `config.ts` style (2-space indent, `/** */` JSDoc, `;` terminators).
- [ ] Union types correctly parenthesized: `string | ((value: unknown) => unknown)`.
- [ ] No stray `TValue` introduced into `FieldConfig`.
- [ ] Type-level assertion file (if added) follows the `.test-d.ts` convention and header comment.

### Documentation & Deployment

- [ ] Mode A docs ride with the work — JSDoc on each field (no separate docs subtask).
- [ ] JSDoc section anchors (§6.4.1–§6.4.5, §13.1, §10) are accurate.

---

## Anti-Patterns to Avoid

- ❌ Don't copy InputConfig's parser/formatter signatures verbatim — they are
  generic over `TValue`, which does not exist in `FieldConfig`. Use
  `(value: unknown) => unknown`.
- ❌ Don't make `defaultValue` required (it is required on InputConfig but
  OPTIONAL on FieldConfig — `undefined` means "not specified").
- ❌ Don't add the `resolveFieldOverType` helper, export it, or wire any
  resolution site here — those are sibling sub-tasks (S2/S3/P1.M2/P1.M3).
  This task ONLY adds the type surface.
- ❌ Don't edit `overlays.ts` or `ReactFieldConfig` — the new fields
  auto-propagate via `Omit<FieldConfig, 'rules'>`. The overlay JSDoc update is
  a separate task (P1.M1.T2.S1).
- ❌ Don't write `string | (value: unknown) => unknown` (missing parens) — it
  parses as a function type. Always parenthesize functions inside unions.
- ❌ Don't catch/run any runtime validation — there is no runtime path in this
  task; rely on `tsc --build` and the existing test suite.
- ❌ Don't reorder existing FieldConfig fields — insert only between
  `recordKey` and `rules`.

---

## Confidence Score

**9/10** — This is a localized, mechanical, type-only edit with an exact
contract (field list, types, order, placement, and verbatim JSDoc) supplied by
the task. The only residual risk is a typo in a union signature (e.g. missing
parens) or accidentally pulling in `TValue`; both are caught immediately by
`pnpm typecheck` and fully specified in the gotchas above. The Task 2 type-level
assertion (recommended) raises the guarantee further by locking the §6.4.5
"meaningful override" semantics against future regression.
