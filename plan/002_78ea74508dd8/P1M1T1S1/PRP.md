name: "P1.M1.T1.S1 — Key-check ReactFormFieldsConfig<V> against TFieldValues"
description: |

---

## Goal

**Feature Goal**: Narrow the key set of `ReactFormFieldsConfig<V>` in
`@formality-ui/react` from unbounded `string` to `Extract<keyof V, string>` so
that `<Form<ClientValues> config={{ ofice: {...} }} />` becomes a compile
error, while `<Form config={{ anyString: {...} }} />` (the default
`FieldValues` case) stays byte-for-byte identical to today.

**Deliverable**: A one-line type change to
`packages/react/src/overlays.ts:72-76` (plus a JSDoc update). No runtime
changes, no core changes, no new files. The narrowed type flows automatically
into `FormProps<TFieldValues>.config` (Form.tsx:48) which is already typed
`ReactFormFieldsConfig<TFieldValues>`.

**Success Definition**:

1. `tsc --noEmit` on `@formality-ui/react` (and root `tsc --build`) is green.
2. `vitest run` for the react package is green — no test regressions.
3. A new type-level assertion exists proving both:
   - `<Form<TFieldValues> config={{ unknownKey: {...} }}>` compiles (default),
   - `<Form<{ name: string }> config={{ name: {...} }}>` compiles AND
     `<Form<{ name: string }> config={{ typo: {...} }}>` is a **compile error**.
4. The change is non-breaking: any code that compiled before still compiles
   (verified by the default-case assertion above + the existing test suite).

## User Persona

**Target User**: React consumers of `@formality-ui/react` (e.g. the
`sellario-ui` downstream package) who pass a concrete `TFieldValues` generic
to `<Form<TFieldValues>>` and want typos in `config` keys caught at compile
time.

**Use Case**: `<Form<ClientValues> config={{ office: {...}, ofice: {...} }} />`
— the misspelled `ofice` key should be flagged by the compiler.

**Pain Points Addressed**: Today an unknown config key silently renders
nothing (the field is never registered). This is the "silent no-op" footgun
called out in PRD §C.4 / T2.1.

## Why

- **Business value**: Catches a whole class of "field rendered nothing"
  bugs (typos in field names) at compile time — the cheapest possible fix.
- **Integration**: This is the FIRST half of PRD T2.1 (the "strict key-checking
  half"). The CORE half (`FormFieldsConfig<TName extends string = string>` with
  the safe `string` default) is already DONE. This subtask completes the REACT
  overlay half. Sibling subtask P1.M1.T1.S2 makes `FieldProps` generic over its
  name (the second half of T2.1) — do NOT touch `FieldProps` here; that's S2.
- **Scope boundary**: Touch ONLY the react overlay. Core `FormFieldsConfig` is
  already generic and MUST NOT be modified. `transformValuesForSubmit`
  (Form.tsx:715) uses core's `FormFieldsConfig` (default `string`) and is
  internal — leave it untouched.

## What

Change the `ReactFormFieldsConfig<V>` alias in `packages/react/src/overlays.ts`
from `Record<string, ReactFieldConfig<V>>` to
`Record<Extract<keyof V, string>, ReactFieldConfig<V>>`.

When `V = FieldValues` (the default), `Extract<keyof FieldValues, string>`
evaluates to `string`, so the default case is **identical** to today's
`Record<string, ...>` — non-breaking (PRD §C.3).

When `V` is a concrete type like `{ name: string; email: string }`, the key set
collapses to `"name" | "email"`, so an unknown key (`ofice`) is rejected.

### Success Criteria

- [ ] `packages/react/src/overlays.ts` exports
      `ReactFormFieldsConfig<V>` with key type `Extract<keyof V, string>`.
- [ ] `FormProps<TFieldValues>.config` (Form.tsx:48) — **unchanged source** —
      now rejects unknown keys when `TFieldValues` is concrete.
- [ ] A type-level test (TypeScript `expectError`-style or a
      `@ts-expect-error` block) asserts both the default-passes and
      concrete-rejects cases.
- [ ] `tsc --build` (root) is green; `vitest run` is green.
- [ ] JSDoc on `ReactFormFieldsConfig<V>` is updated (Mode A, per item spec).
- [ ] No core files modified; no `FieldProps` changes (that's S2).

## All Needed Context

### Context Completeness Check

_Pass._ The change is a single type alias in one file. The downstream effect
(`FormProps.config` key-checking) requires zero source edits because
Form.tsx:48 is already `config: ReactFormFieldsConfig<TFieldValues>`. All
references verified by grep (see Documentation & References).

### Documentation & References

```yaml
# MUST READ
- url: PRD §C.4 T2.1 (heading:h4.60) — the work item being implemented.
  why: Defines the exact target signature and the non-breaking-default requirement.
  critical: "When TName = string this is identical to today's Record<string, FieldConfig> (non-breaking)."

- url: PRD §C.3 (heading:h3.112) — Non-Negotiable Constraints.
  why: "No breaking public API changes. Generic defaults must preserve today's behavior."
  critical: This is a type-ONLY change. Do NOT touch runtime logic.

- url: PRD §C.2 (heading:h3.110) — framework-agnostic core constraint.
  why: Core must NOT import react. React precision lives in the overlay.
  critical: Do NOT modify packages/core — only packages/react/src/overlays.ts.

- file: packages/react/src/overlays.ts
  why: THE file to edit. Lines 72-76 contain the current unbounded Record<string, ...>.
  pattern: Existing overlay style — `export type X<V extends FieldValues = FieldValues> = ...`.
  gotcha:
    The generic constraint `V extends FieldValues = FieldValues` MUST be preserved
    exactly so the default collapses to `string`.

- file: packages/react/src/components/Form.tsx
  section: "FormProps<TFieldValues> (lines 43-71); config on line 48"
  why:
    This is the consumer of ReactFormFieldsConfig<TFieldValues>. NO EDIT needed here —
    the key-checking appears automatically once the alias is narrowed.
  pattern: Line 38 `import type { ReactFormFieldsConfig } from "../overlays";`
  gotcha:
    "Line 715 transformValuesForSubmit uses CORE FormFieldsConfig (default string) —
    leave it ALONE. It is internal and unrelated."

- file: packages/react/src/index.ts
  section: "Line 95 — ReactFormFieldsConfig re-export"
  why: Confirms the type is part of the public surface (already exported; do not change the export).
  pattern: Public overlay exports are re-exported from index.ts.

- file: plan/002_78ea74508dd8/architecture/type_system_state.md
  section: "§1 (overlays.ts) and §2 (Form.tsx)"
  why: Verified-current inventory of exact signatures at the touch points.
  critical:
    Confirms Form.tsx:48 is the ONLY field-type usage of ReactFormFieldsConfig;
    all other usages are the definition (overlays.ts:72) and the re-export (index.ts:95).
```

### Current Codebase tree (relevant slice)

```bash
packages/
  core/src/
    config.ts              # core FormFieldsConfig<TName=string> — ALREADY GENERIC, DO NOT TOUCH
  react/src/
    overlays.ts            # ← EDIT HERE: ReactFormFieldsConfig<V> (lines 72-76)
    index.ts               # re-export (line 95) — no change
    components/
      Form.tsx             # FormProps.config (line 48) — no change; auto-benefits
      __tests__/
        Form.test.tsx      # existing runtime tests — must stay green
    __tests__/             # (or components/__tests__) — add type assertion test here
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/
  overlays.ts              # MODIFIED — narrow key type + JSDoc
  __tests__/typeSafety.test-d.ts  # NEW (or co-locate as *.test-d.ts) — type-level assertions
```

> If the repo does not already use `*.test-d.ts` / `vitest typecheck`, prefer
> the simplest mechanism that runs in CI: a `*.test-d.tsx` file gated by
> `@ts-expect-error` comments, OR add it under the existing vitest typecheck
> config if present. Check `vitest.config.ts` / root `tsconfig.json` first —
> see Level 4 validation.

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: The generic default MUST be preserved as `= FieldValues`.
//   ReactFormFieldsConfig<V extends FieldValues = FieldValues>
// When V = FieldValues, Extract<keyof FieldValues, string> === string  → identical to today.
// Narrowing the *default* (e.g. dropping `= FieldValues`) WOULD break callers → forbidden.

// CRITICAL: Do NOT change packages/core. Core's FormFieldsConfig<TName extends string = string>
// is already generic with the safe `string` default. This subtask is react-overlay-only.

// GOTCHA: transformValuesForSubmit (Form.tsx:715) imports the CORE FormFieldsConfig
// (imported from @formality-ui/core, default `string`). It is unrelated to the overlay
// type of the same name. Leave it alone.

// GOTCHA: TypeScript `Extract<keyof V, string>` is the idiomatic way to get the
// string-key union of an object type. For FieldValues (an interface with an index
// signature) keyof evaluates to `string | number`, and Extract<…, string> === string.

// GOTCHA: This change is type-only. There is no runtime code to test functionally;
// the test that proves it works is a TYPE-LEVEL test, not a runtime test.
```

## Implementation Blueprint

### Data models and structure

No new data models. The only model change is the type alias itself.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (read-only sanity check)
  - READ packages/react/src/overlays.ts lines 72-76 (confirm Record<string, ...>).
  - READ packages/react/src/components/Form.tsx line 48 (confirm ReactFormFieldsConfig<TFieldValues>).
  - READ packages/react/src/components/Form.tsx line 715 (confirm transformValuesForSubmit uses CORE FormFieldsConfig, NOT the overlay).
  - GREP: `rg -n "ReactFormFieldsConfig" packages/` → expect exactly: overlays.ts:72 (def), overlays.ts:69 (JSDoc ref), index.ts:95 (re-export), Form.tsx:38 (import), Form.tsx:48 (usage).
  - GREP: `rg -n "FormFieldsConfig" packages/react/src/components/Form.tsx` → confirm line 715 uses the core import, separate from the overlay.
  - WHY: The item description says "Form.tsx:48 is the only field-type usage"; confirm before editing so nothing surprises you.

Task 2: MODIFY packages/react/src/overlays.ts — narrow the key type
  - EDIT the ReactFormFieldsConfig alias (lines 72-76):
      FROM: Record<string, ReactFieldConfig<V>>
      TO:   Record<Extract<keyof V, string>, ReactFieldConfig<V>>
  - PRESERVE: the generic signature `V extends FieldValues = FieldValues` exactly.
  - PRESERVE: formatting (the existing alias spans multiple lines; keep tsup/prettier style).
  - DEPENDENCIES: none (pure type change).

Task 3: MODIFY packages/react/src/overlays.ts — update JSDoc (Mode A docs)
  - UPDATE the JSDoc block immediately above ReactFormFieldsConfig (currently lines 67-71).
  - ADD a note: when `V` is narrowed to a concrete field-values type (e.g. via <Form<TFieldValues>>),
    unknown `config` keys are now a compile error. When `V` is the default FieldValues, behavior
    is unchanged (any string key accepted).
  - INCLUDE a short @example showing the rejected-typo case.
  - FOLLOW pattern: the existing JSDoc style on ReactFieldConfig / ReactInputConfig in the same file.

Task 4: CREATE a type-level test asserting both directions
  - CREATE packages/react/src/__tests__/ReactFormFieldsConfig.test-d.ts (or .test-d.tsx).
  - ASSERT (compiles): ReactFormFieldsConfig<FieldValues> accepts any string key.
  - ASSERT (compiles): ReactFormFieldsConfig<{ name: string }> accepts `{ name: { ... } }`.
  - ASSERT (ERROR): ReactFormFieldsConfig<{ name: string }> rejects `{ typo: { ... } }` via @ts-expect-error.
  - ASSERT (ERROR): FormProps<{ name: string }>['config'] rejects `{ typo: ... }` via @ts-expect-error.
  - FOLLOW pattern: check whether the repo already runs *.test-d.ts (look at vitest.config.ts).
    - If vitest typecheck is configured → use plain type assertions + `// @ts-expect-error`.
    - If NOT configured → still create the .test-d.ts file; it documents intent and is checked by `tsc --build`
      as long as it's included by tsconfig. Verify with `tsc --build` (Level 1).
  - COVERAGE: positive (default accepts anything, concrete accepts known key) + negative (concrete rejects typo).

Task 5: BUILD + TYPECHECK + TEST the react package
  - RUN: `pnpm --filter @formality-ui/react build` (tsup).
  - RUN: `pnpm --filter @formality-ui/react exec tsc --noEmit` (or root `pnpm typecheck`).
  - RUN: `pnpm --filter @formality-ui/react test` (vitest run).
  - EXPECT: all green. If tsc surfaces an inference break inside react, add an explicit type
    argument at that INTERNAL call site only (do NOT widen the public type). The item spec says
    Form.tsx:48 is the only field-type usage, so breakage here is unlikely.

Task 6: ROOT typecheck + full test sweep
  - RUN: `pnpm typecheck` (root `tsc --build` — exercises core + react + any consumers in-repo).
  - RUN: `pnpm test` (root vitest — full suite).
  - EXPECT: green. This is the PRD §C.6 "do not move on if anything is red" gate.
```

### Implementation Patterns & Key Details

```typescript
// packages/react/src/overlays.ts — THE change (Task 2)

// BEFORE (lines 72-76):
export type ReactFormFieldsConfig<V extends FieldValues = FieldValues> = Record<
  string,
  ReactFieldConfig<V>
>;

// AFTER:
export type ReactFormFieldsConfig<V extends FieldValues = FieldValues> = Record<
  Extract<keyof V, string>,
  ReactFieldConfig<V>
>;

// WHY this is non-breaking:
//   V = FieldValues (default) ⇒ keyof FieldValues = string | number
//   ⇒ Extract<string | number, string> = string ⇒ Record<string, ...>  ← identical to today.
//   V = { name: string; email: string } ⇒ Extract<keyof V, string> = "name" | "email"
//   ⇒ Record<"name" | "email", ...> ⇒ unknown keys rejected. ✓

// Type-level test sketch (Task 4):
//   import type { ReactFormFieldsConfig, FormProps } from "../overlays"; // and FormProps from components/Form
//   type Default = ReactFormFieldsConfig<FieldValues>;
//   const a: Default = { anything: { type: "text" } }; // OK
//
//   type Narrow = ReactFormFieldsConfig<{ name: string }>;
//   const b: Narrow = { name: { type: "text" } };      // OK
//   // @ts-expect-error unknown key rejected
//   const c: Narrow = { typo: { type: "text" } };
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
PUBLIC API:
  - `ReactFormFieldsConfig<V>` (re-exported at packages/react/src/index.ts:95) — signature
    generic preserved; behavior tightened ONLY for concrete V. Existing callers using the
    default (`ReactFormFieldsConfig` with no arg, or `ReactFormFieldsConfig<FieldValues>`)
    are unaffected.
INTERNAL:
  - FormProps<TFieldValues>.config (Form.tsx:48) auto-benefits; NO source edit.
  - transformValuesForSubmit (Form.tsx:715) uses CORE FormFieldsConfig — DO NOT TOUCH.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing overlays.ts (Task 2/3)
pnpm --filter @formality-ui/react exec tsc --noEmit
pnpm format            # prettier — keep style consistent (only formats if needed)
pnpm lint              # eslint — should be clean (type-only change)

# Expected: Zero errors.
```

### Level 2: Unit Tests (Component Validation)

```bash
# React package tests (existing runtime suite must stay green)
pnpm --filter @formality-ui/react test

# Full suite (catches cross-package regressions)
pnpm test

# Expected: all green. No runtime behavior changed, so existing tests must pass unchanged.
```

### Level 3: Build & Typecheck (System Validation)

```bash
# Build the react package (tsup emits dist/)
pnpm --filter @formality-ui/react build

# Root typecheck — tsconfig project references (core + react + in-repo consumers)
pnpm typecheck    # = tsc --build

# Expected: green. If tsc reports an inference break inside react, fix at the
# INTERNAL call site with an explicit type argument (do NOT widen the public type).
```

### Level 4: Type-Level Validation (the actual proof of this feature)

```bash
# The .test-d.ts file (Task 4) MUST be included by tsconfig so tsc --build checks it.
# Confirm it is picked up:
pnpm typecheck

# If the repo supports vitest typecheck mode, also run:
#   pnpm --filter @formality-ui/react exec vitest typecheck
# (only if vitest.config.ts has a `test.typecheck` section — otherwise rely on tsc --build).

# Expected: the @ts-expect-error lines in the test file are honored (i.e. the typo key IS
# rejected). If a @ts-expect-error is "unused", the typo was NOT rejected — that's a FAILURE.
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm --filter @formality-ui/react build` succeeds.
- [ ] `pnpm typecheck` (root `tsc --build`) is green — includes the new `*.test-d.ts`.
- [ ] `pnpm test` (root vitest) is green.
- [ ] `pnpm lint` is clean.
- [ ] The `*.test-d.ts` file's `@ts-expect-error` lines are USED (typos actually rejected).

### Feature Validation

- [ ] `ReactFormFieldsConfig<{ name: string }>` rejects an unknown key (compile error).
- [ ] `ReactFormFieldsConfig<{ name: string }>` accepts `{ name: {...} }`.
- [ ] `ReactFormFieldsConfig<FieldValues>` (default) still accepts any string key — non-breaking.
- [ ] `FormProps<{ name: string }>['config']` rejects `{ typo: {...} }` (auto via Form.tsx:48).
- [ ] Core `FormFieldsConfig` (config.ts) was NOT modified.
- [ ] `transformValuesForSubmit` (Form.tsx:715) was NOT modified.
- [ ] `FieldProps` was NOT modified (deferred to P1.M1.T1.S2).

### Code Quality Validation

- [ ] JSDoc on `ReactFormFieldsConfig<V>` updated (Mode A) with the new key-checking behavior + example.
- [ ] Generic default `= FieldValues` preserved exactly.
- [ ] Follows existing overlay style in overlays.ts.
- [ ] No runtime code added (type-only change).

### Documentation & Deployment

- [ ] JSDoc self-documents the consumer-facing behavior change.
- [ ] No new environment variables or config.

---

## Anti-Patterns to Avoid

- ❌ Don't narrow the generic DEFAULT (dropping `= FieldValues`) — that breaks callers.
- ❌ Don't touch `packages/core` — the core generic is already done.
- ❌ Don't edit `Form.tsx` source — Form.tsx:48 auto-benefits; only edit if an inference break forces an explicit type arg at an INTERNAL site (unlikely).
- ❌ Don't modify `FieldProps` — that is P1.M1.T1.S2, a separate subtask.
- ❌ Don't skip the type-level test — runtime tests cannot prove key-checking works; only a type test can.
- ❌ Don't widen the type back to `Record<string, ...>` if tsc complains — fix at the internal call site instead.

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is a single-line type-alias change with a mathematically
guaranteed non-breaking default (`Extract<keyof FieldValues, string> === string`).
The only consumer (Form.tsx:48) is already wired correctly. The sole risk is an
unexpected internal inference break inside react, which the item spec says is
unlikely (Form.tsx:48 is the only field-type usage). The type-level test is the
real deliverable that proves correctness and must not be skipped.
