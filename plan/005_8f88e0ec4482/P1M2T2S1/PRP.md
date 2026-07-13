name: "P1.M2.T2.S1 — Implement mergeConfigs() wrapper over existing merge functions"
description: |

---

## Goal

**Feature Goal**: Close gap **G3** of the v1.0 spec-compliance audit by adding
the PRD §1.3.2 headline export `mergeConfigs(provider, form, field)` to
`@formality-ui/core`. The function is a **thin convenience wrapper** that
composes the existing pure functions (`mergeInputConfigs` → `resolveFieldType` →
`resolveInputConfig` for the input config; `mergeStaticProps` for the static
field-config prop layers). It exists to satisfy the PRD-mandated public API
surface for the common 3-source (provider + form + field) static merge; all
granular functions remain available for advanced/dynamic use.

**Deliverable**:
1. A new exported `mergeConfigs()` function in
   `packages/core/src/config/merge.ts`.
2. Two barrel additions: `packages/core/src/config/index.ts` and
   `packages/core/src/index.ts` (root, "Configuration" block).
3. New unit tests in `packages/core/src/__tests__/config.test.ts` covering
   provider-only, provider+form, provider+form+field, and override priority.
4. JSDoc on `mergeConfigs()` explaining it is the PRD §1.3.2 headline export
   and how it relates to `resolveInputConfig` / `mergeFieldProps` / the static-
   vs-dynamic boundary.

**Success Definition**:
1. `import { mergeConfigs } from "@formality-ui/core"` resolves to a function.
2. `mergeConfigs(provider, form?, field?)` returns
   `{ inputConfig: InputConfig | undefined; fieldConfig: FieldConfig }`, where
   `inputConfig` is resolved for the field's type and `fieldConfig.props` is the
   3-source static merge (provider → form → field).
3. Existing tests unaffected — the new tests are additive; nothing existing
   changes signature or behavior.
4. `pnpm --filter @formality-ui/core build` + `pnpm typecheck` + `pnpm test` +
   `pnpm lint` all green; coverage stays ≥90%.

## User Persona

**Target User**: Library consumers who read PRD §1.3.2's core-export table and
expect to call the *named* headline function `mergeConfigs(provider, form,
field)` — the ergonomic, documented entry point for the common config merge —
rather than composing `mergeInputConfigs` + `resolveInputConfig` +
`mergeStaticProps` by hand.

**Use Case**: A consumer (or future Vue/Svelte adapter) building a field render
pipeline outside React wants the resolved `InputConfig` + merged static
`FieldConfig` for a field in one call:
`const { inputConfig, fieldConfig } = mergeConfigs(provider, form, field)`.

**Pain Points Addressed**: API-surface non-compliance (G3). Functionally the
library already merges correctly via the granular functions; this adds the
PRD-named convenience export for the common case.

## Why

- **Spec compliance (PRD §1.3.2).** The core-export table explicitly lists
  `config/merge` → `mergeConfigs(provider, form, field)`. Its absence is a
  documented gap (gap_analysis.md G3, "Medium").
- **Lowest-risk path to compliance.** Every required semantic already exists:
  `mergeInputConfigs` (provider+form input maps, incl. function form),
  `resolveFieldType` (type derivation), `resolveInputConfig` (type → InputConfig),
  `mergeStaticProps` (ordered prop merge). `mergeConfigs` is a pure composition
  — no new logic, no new branches, no behavioral risk.
- **Scope discipline.** This task owns ONLY the static, stateless convenience
  wrapper. The FULL props pipeline (`mergeFieldProps`, PRD §5.3.2/§6.1) includes
  *evaluated* `selectProps`/`selectDefaultFieldProps` layers that require a
  `FormState` (expression evaluation) — those are NOT part of `mergeConfigs`
  (a pure function has no state). The granular functions stay exported for the
  dynamic case. This mirrors the sibling task P1.M2.T1.S1 (validate()) exactly:
  thin named wrapper, no re-implementation.

## What

Add one thin function and wire it through two barrels, plus tests and JSDoc.
No change to `deepMerge`, `mergeInputConfigs`, `resolveInputConfig`,
`resolveFieldType`, `mergeStaticProps`, `mergeFieldProps`, or
`createConfigContext`.

### Success Criteria

- [ ] `mergeConfigs(provider, form?, field?)` exported from
      `@formality-ui/core` (root barrel) and from `@formality-ui/core/config`.
- [ ] Composes `mergeInputConfigs` → `resolveFieldType` → `resolveInputConfig`
      for `inputConfig`, and `mergeStaticProps` for `fieldConfig.props`, with
      **no additional logic** (no re-resolution, no expression evaluation).
- [ ] Tests cover: provider-only, provider+form, provider+form+field, override
      priority (form.defaultFieldProps beats provider; field.props beats both).
- [ ] `mergeConfigs` has a JSDoc block naming it the PRD §1.3.2 headline export
      and documenting the static-vs-dynamic boundary + the optional-form /
      possibly-undefined-inputConfig decisions.
- [ ] All gates green; `git diff` touches only `merge.ts`, `config/index.ts`,
      `index.ts` (root, Configuration block only), and `config.test.ts`.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the existing
function signatures (esp. that `resolveInputConfig` needs a `type` and returns
`| undefined`, and that `mergeFieldProps` needs evaluated dynamic layers a pure
function can't supply), the exact type shapes, both barrel files' structure
with line numbers, the test-file conventions, the G3 gap write-up, and the
3 resolved design decisions. All cited below with exact paths/lines. ✅ Passes
the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ - include in context window before implementing
- docfile: plan/005_8f88e0ec4482/P1M2T2S1/research/mergeconfigs_design.md
  section: full doc
  why: |
    AUTHORITATIVE design analysis. Contains the verbatim signatures of all 7
    existing merge functions (with line numbers), the verified type shapes, and
    the 3 RESOLVED DESIGN DECISIONS (optional form; inputConfig|undefined return;
    static-only merge via mergeStaticProps NOT mergeFieldProps). Read this FIRST
    — it is the single source of truth for the implementation.

- docfile: plan/005_8f88e0ec4482/architecture/gap_analysis.md
  section: "### G3: Missing mergeConfigs() named export [API — Medium]"
  why: |
    The authoritative gap statement. Confirms PRD §1.3.2 requires
    mergeConfigs(provider, form, field); current core exports the granular
    functions but not the named headline export; resolution = thin wrapper
    composing resolveInputConfig/mergeFieldProps. This task implements exactly
    that (using mergeStaticProps for the static layers — see Decision 3).

- file: packages/core/src/config/merge.ts
  why: |
    The file to edit. mergeConfigs() composes functions defined HERE. Read the
    full file (258 lines). Key functions + signatures:
      mergeInputConfigs(providerInputs, formInputs?) → Record<string, InputConfig>   [L70]
      resolveInputConfig(type, inputs, defaultType="textField") → InputConfig|undefined [L107]
      resolveFieldType(componentType?, fieldConfig?, defaultType="textField") → string [L128]
      mergeStaticProps(...layers) → Record<string, unknown>                          [L155]
      createConfigContext(providerConfig, formConfig?) → ConfigContextValue          [L227]
  pattern: |
    mergeConfigs composes (no new logic):
      const mergedInputs = mergeInputConfigs(provider.inputs, form?.inputs);
      const type = resolveFieldType(undefined, field, "textField");
      const inputConfig = resolveInputConfig(type, mergedInputs);   // InputConfig | undefined
      const fieldConfig: FieldConfig = { ...field,
        props: mergeStaticProps(provider.defaultFieldProps, form?.defaultFieldProps, field?.props) };
      return { inputConfig, fieldConfig };
  gotcha: |
    Do NOT use mergeFieldProps for the field-level merge — it requires EVALUATED
    selectProps/selectDefaultFieldProps (dynamic layers needing FormState).
    mergeConfigs is pure (no state); use mergeStaticProps on the 3 STATIC layers
    only. This is Decision 3 and is non-negotiable.

- file: packages/core/src/types/config.ts
  why: |
    The exact types. FormalityProviderConfig (L235): inputs REQUIRED, defaultFieldProps?.
    FormConfig (L198): ALL fields optional (inputs?, defaultFieldProps?, selectDefaultFieldProps?).
    FieldConfig: props?: Record<string, unknown> (among type?, label?, etc.).
    InputConfig: component + defaultValue required (component is `unknown` in core —
    framework-shaped; mergeConfigs cannot synthesize one → inputConfig can be undefined).
  pattern: |
    Import as type-only (already imported at merge.ts L5-10):
      import type { InputConfig, FieldConfig, FormConfig, FormalityProviderConfig } from "../types";
  gotcha: |
    FormConfig is fully optional internally; this justifies making mergeConfigs's
    `form` param optional too (Decision 1) — matches createConfigContext's precedent.

- file: packages/core/src/config/index.ts
  why: |
    The module barrel. mergeConfigs must be added to the `export { ... } from
    "./merge"` block (currently lists deepMerge first). Place `mergeConfigs`
    FIRST — it is the PRD headline export.
  pattern: |
    export {
      mergeConfigs,        // ← ADD FIRST (PRD §1.3.2 headline export)
      deepMerge,
      mergeInputConfigs,
      resolveInputConfig,
      resolveFieldType,
      mergeStaticProps,
      mergeFieldProps,
      createConfigContext,
    } from "./merge";

- file: packages/core/src/index.ts
  section: "Configuration" block (lines 117-130)
  why: |
    The ROOT barrel. mergeConfigs must be added to the Configuration export
    block. Place FIRST there too.
  pattern: |
    export {
      mergeConfigs,        // ← ADD FIRST
      deepMerge,
      mergeInputConfigs,
      resolveInputConfig,
      resolveFieldType,
      mergeStaticProps,
      mergeFieldProps,
      createConfigContext,
      resolveInitialValue,
      ...
    } from "./config";
  gotcha: |
    The Configuration block is at L117-130. The "Validation" block (~L72-87) is
    owned by the parallel sibling P1.M2.T1.S1 (validate()); the "Labels &
    Ordering" block (~L133) by P1.M1.T1.S2. Do NOT touch either — only the
    Configuration block. See "Known Gotchas" for barrel-collision safety.

- file: packages/core/src/__tests__/config.test.ts
  why: |
    The test file to extend. Follow its EXACT conventions: imports come from
    "../index" (root barrel); structure is describe("Config Module", () => {
    describe("deepMerge", …), … }). Add a new sibling describe("mergeConfigs", …).
  pattern: |
    - import `mergeConfigs` from "../index" (add to the existing import list).
    - import type { FormConfig } from "../index" (InputConfig, FieldConfig,
      FormalityProviderConfig are ALREADY imported — add FormConfig).
    - build a minimal provider: { inputs: { textField: { component: ..., defaultValue: "" } } }
      (component can be a dummy like null/(() => null) — core types it `unknown`).
    - assert result.inputConfig === the resolved InputConfig (identity or shape);
      assert result.fieldConfig.props reflects the override priority.
  gotcha: |
    Tests import from "../index" (root barrel), so Task 2+3 (barrel edits) MUST
    be done before the tests compile. If a test can't resolve `mergeConfigs`,
    re-check the barrel edits.

- docfile: plan/005_8f88e0ec4482/P1M2T1S1/PRP.md
  section: "PARALLEL EXECUTION CONTRACT" + "Anti-Patterns"
  why: |
    The PARALLEL SIBLING (validate() wrapper). It established the thin-wrapper
    pattern for this milestone and confirms the barrel-block-disjoint safety
    (it edits the Validation block L72-87; this task edits Configuration L117-130).
    Mirror its discipline: pure delegation, no casts, no re-implementation.
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/
├── config/
│   ├── merge.ts             # ← ADD mergeConfigs() here; composes existing fns
│   ├── defaults.ts          # resolveInitialValue etc. (unchanged)
│   ├── ordering.ts          # sortFieldsByOrder etc. (unchanged)
│   └── index.ts             # ← ADD mergeConfigs to the "./merge" export (FIRST)
├── types/
│   └── config.ts            # InputConfig, FieldConfig, FormConfig, FormalityProviderConfig (unchanged)
├── __tests__/
│   └── config.test.ts       # ← ADD a `describe("mergeConfigs", …)` block
└── index.ts                 # ← ADD mergeConfigs to the "Configuration" block (FIRST), L117-130
```

### Desired Codebase tree with files to be added

```bash
# No new files. Four existing files edited:
packages/core/src/config/merge.ts          # + mergeConfigs() function + JSDoc
packages/core/src/config/index.ts          # + mergeConfigs in export list (FIRST)
packages/core/src/index.ts                 # + mergeConfigs in Configuration block (FIRST)
packages/core/src/__tests__/config.test.ts # + describe("mergeConfigs", …) block
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: mergeConfigs is a PURE COMPOSITION wrapper. Do NOT reimplement
//   mergeInputConfigs/resolveInputConfig/mergeStaticProps logic. Reimplementing
//   them = duplicated branches that can drift. Compose the existing functions.

// CRITICAL: Do NOT use mergeFieldProps for the field-level merge. mergeFieldProps
//   takes EVALUATED selectProps/selectDefaultFieldProps (dynamic layers that need
//   a FormState + expression engine). mergeConfigs is pure (no state) and CANNOT
//   evaluate them. Use mergeStaticProps on the 3 STATIC layers only:
//     provider.defaultFieldProps → form?.defaultFieldProps → field?.props
//   This is Decision 3 — non-negotiable.

// CRITICAL: resolveInputConfig returns `InputConfig | undefined` (it returns
//   inputs[type] ?? inputs["textField"], which is undefined if neither is
//   registered). Do NOT cast to InputConfig to satisfy the contract's stated
//   return type — that hides a real possibility. Return the HONEST
//   `InputConfig | undefined` (Decision 2) and document it in JSDoc.

// DECISION 1 (document in JSDoc): `form` is OPTIONAL (`form?: FormConfig`), not
//   required as the contract literally states. Justification: (a) the sibling
//   createConfigContext(providerConfig, formConfig?: FormConfig) makes form
//   optional — precedent; (b) enables the "provider-only" test case; (c) every
//   FormConfig field is optional so "empty form" ≡ "no form". Optional is a
//   strict superset of required; does not break the contract's intent.

// GOTCHA: The type for resolveInputConfig is derived via resolveFieldType(
//   undefined, field, "textField") → field?.type ?? "textField". mergeConfigs
//   has no component-type arg (it's not a Field component), so pass `undefined`
//   as the first arg. Do NOT hardcode "textField" inline — use resolveFieldType
//   so the defaultType parameter flows through consistently.

// GOTCHA: barrel-collision with parallel tasks. Two siblings run concurrently:
//   - P1.M2.T1.S1 (validate()) edits root index.ts "Validation" block (~L72-87).
//   - P1.M1.T1.S2 (ordering verification) MAY edit "Labels & Ordering" (~L133).
//   THIS task edits the "Configuration" block (~L117-130). All three blocks are
//   disjoint and 15-45 lines apart. A merge-time textual conflict (if any) is in
//   a different block; keep ALL edits. Neither sibling touches config/ files,
//   so merge.ts / config/index.ts / config.test.ts are safe.

// SCOPE: This task is the static convenience wrapper ONLY. Do NOT:
//   - evaluate selectProps/selectDefaultFieldProps expressions (needs FormState);
//   - re-implement the full PRD §5.3.2/§6.1 8-layer pipeline (that's mergeFieldProps'
//     job, called by the adapter's Field with evaluated layers);
//   - change any existing function signature;
//   - add mergeConfigs to the react package (CORE export only — P2/P3 own react).
```

## Implementation Blueprint

### Data models and structure

No new models. `mergeConfigs()` uses the existing types verbatim. The only
new surface is the return shape
`{ inputConfig: InputConfig | undefined; fieldConfig: FieldConfig }`.

```typescript
import type {
  InputConfig,
  FieldConfig,
  FormConfig,
  FormalityProviderConfig,
} from "../types";   // already imported at merge.ts L5-10 — verify, add FormConfig if missing

// NOTE: form is OPTIONAL (Decision 1); inputConfig can be undefined (Decision 2).
export function mergeConfigs(
  provider: FormalityProviderConfig,
  form?: FormConfig,
  field?: FieldConfig,
): { inputConfig: InputConfig | undefined; fieldConfig: FieldConfig } {
  // (a) Resolve the InputConfig for the field's type.
  const mergedInputs = mergeInputConfigs(provider.inputs, form?.inputs);
  const type = resolveFieldType(undefined, field, "textField");
  const inputConfig = resolveInputConfig(type, mergedInputs);

  // (b) Merge the 3 STATIC field-config prop layers (provider → form → field).
  const fieldConfig: FieldConfig = {
    ...field,
    props: mergeStaticProps(
      provider.defaultFieldProps,
      form?.defaultFieldProps,
      field?.props,
    ),
  };

  return { inputConfig, fieldConfig };
}
```

`mergeInputConfigs`, `resolveFieldType`, `resolveInputConfig`, `mergeStaticProps`
are all defined in the SAME file (merge.ts) — no new runtime imports, only the
type import block (already present).

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD mergeConfigs() to packages/core/src/config/merge.ts
  - PLACEMENT: module-level exported function. Place it AFTER createConfigContext
    (the other high-level wrapper, L227-258) so the low-level functions are
    defined before it reads naturally, OR at the end of the file. Do NOT nest it.
  - SIGNATURE: mergeConfigs(provider: FormalityProviderConfig, form?: FormConfig,
    field?: FieldConfig): { inputConfig: InputConfig | undefined; fieldConfig: FieldConfig }
  - BODY: exactly the composition shown above (Decisions 1-3). No extra branches.
  - TYPES: ensure InputConfig, FieldConfig, FormConfig, FormalityProviderConfig
    are in the type import block at the top of merge.ts (InputConfig/FieldConfig/
    FormalityProviderConfig already imported at L5-10; ADD FormConfig if absent).
  - JSDOC (Mode A ride-with): explain (1) PRD §1.3.2 headline export for
    config/merge; (2) it is a convenience wrapper composing mergeInputConfigs →
    resolveFieldType → resolveInputConfig (for inputConfig) and mergeStaticProps
    (for fieldConfig.props); (3) STATIC-ONLY — it does NOT evaluate selectProps/
    selectDefaultFieldProps (those need FormState; use mergeFieldProps for the
    full dynamic pipeline); (4) form is optional (matches createConfigContext);
    (5) inputConfig may be undefined when the resolved type is unregistered;
    (6) the granular functions remain available for advanced use.

Task 2: EXPORT mergeConfigs from packages/core/src/config/index.ts
  - EDIT: the `export { ... } from "./merge"` block.
  - ADD: `mergeConfigs,` as the FIRST entry (before deepMerge).
  - PRESERVE: the existing entries and the separate "./defaults" + "./ordering" blocks.

Task 3: EXPORT mergeConfigs from packages/core/src/index.ts (ROOT barrel)
  - EDIT: the "Configuration" export block (lines 117-130).
  - ADD: `mergeConfigs,` as the FIRST entry (before deepMerge at L119).
  - PRESERVE: every other entry; do NOT touch "Validation" (~L72-87) or
    "Labels & Ordering" (~L133) blocks — those belong to parallel tasks.

Task 4: ADD tests to packages/core/src/__tests__/config.test.ts
  - IMPORT: add `mergeConfigs,` to the existing value import list from "../index".
  - IMPORT TYPE: add `FormConfig,` alongside the existing InputConfig/FieldConfig/
    FormalityProviderConfig type imports (FormConfig is NOT currently imported).
  - ADD: a new sibling `describe("mergeConfigs", () => { ... })` block inside the
    top-level `describe("Config Module", ...)`. Cover these cases:
      it("resolves an inputConfig from provider inputs (provider-only)")
        provider = { inputs: { textField: { component: null, defaultValue: "" } } }
        const { inputConfig } = mergeConfigs(provider);
        expect(inputConfig).toBe(provider.inputs.textField)   // identity (no form override)
      it("merges form.inputs overrides over provider.inputs (provider+form)")
        provider.inputs has textField; form.inputs = { textField: { defaultValue: "default" } }
        → inputConfig.defaultValue === "default" (deepMerge applied); component preserved
      it("resolves the inputConfig for the field's type (provider+form+field)")
        field = { type: "switch" }; provider.inputs.switch exists
        → inputConfig === provider.inputs.switch (resolved via resolveFieldType)
      it("falls back to textField when field.type is unregistered")
        field = { type: "nope" }; provider has textField but not "nope"
        → inputConfig === provider.inputs.textField (resolveInputConfig default)
      it("merges static field-config props in priority order (override priority)")
        provider.defaultFieldProps = { disabled: true, label: "P" }
        form.defaultFieldProps   = { disabled: false }            // form beats provider
        field.props              = { label: "F" }                 // field beats both
        const { fieldConfig } = mergeConfigs(provider, form, field)
        expect(fieldConfig.props).toEqual({ disabled: false, label: "F" })
      it("preserves the field's own config fields (type, label, ...)")
        field = { type: "switch", label: "On" }
        → fieldConfig.type === "switch", fieldConfig.label === "On" (spread preserves)
      it("returns undefined inputConfig when the type is unregistered and no textField default")
        provider = { inputs: { other: {...} } }   // no textField, field.type missing
        → inputConfig === undefined (Decision 2 honesty)
  - NAMING: `it("...", ...)` matching the file's existing style.
  - GOTCHA: tests import from "../index", so Tasks 2+3 must be done first.
  - GOTCHA: provider.inputs.textField.component can be any value (core types it
    `unknown`); use `null` or `(() => null)` in tests — do NOT import React.

Task 5: VALIDATE
  - RUN: pnpm --filter @formality-ui/core build
  - RUN: pnpm vitest run packages/core/src/__tests__/config.test.ts
  - RUN: pnpm --filter @formality-ui/core test   (full suite — ~1003 tests, no regressions)
  - RUN: pnpm typecheck   (root tsc --build — resolves the barrel end-to-end)
  - RUN: pnpm lint
  - RUN: pnpm vitest run packages/core/src/__tests__/framework-independence.test.ts
  - ASSERT: new describe block passes; total rises by the number of new it()s;
    existing tests unaffected; mergeConfigs has zero framework imports.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: the mergeConfigs() wrapper (the ENTIRE functional change in merge.ts).
/**
 * Merge provider + form + (optional) field configs into a resolved pair.
 *
 * PRD §1.3.2 headline export for the `config/merge` module. This is a
 * CONVENIENCE WRAPPER for the common 3-source static merge; it composes the
 * granular functions and delegates all semantics to them:
 *
 *  - `inputConfig` = `resolveInputConfig(resolveFieldType(undefined, field),
 *                    mergeInputConfigs(provider.inputs, form?.inputs))`.
 *    The field's type is derived from `field?.type` (default "textField").
 *  - `fieldConfig.props` = `mergeStaticProps(provider.defaultFieldProps,
 *                    form?.defaultFieldProps, field?.props)` (provider → form →
 *                    field; later wins). The field's own config (type, label,
 *                    disabled, …) is preserved via spread.
 *
 * STATIC ONLY. This function does NOT evaluate `selectProps` or
 * `selectDefaultFieldProps` — those dynamic layers require a `FormState`
 * (expression evaluation) that a pure merge function cannot supply. For the
 * full evaluated 8-layer pipeline (PRD §5.3.2 / §6.1), use {@link mergeFieldProps}
 * from within an adapter that has form state.
 *
 * The granular functions ({@link mergeInputConfigs}, {@link resolveInputConfig},
 * {@link mergeStaticProps}, {@link mergeFieldProps}) remain exported for
 * advanced use.
 *
 * @param provider - Provider config (inputs REQUIRED).
 * @param form     - Optional form config. When omitted, only provider inputs/
 *                   defaultFieldProps apply (matches {@link createConfigContext}).
 * @param field    - Optional field config. Its `type` selects the inputConfig;
 *                   its `props` are the highest-priority static prop layer.
 * @returns `{ inputConfig, fieldConfig }`. `inputConfig` is `undefined` when the
 *          resolved type is not registered and no "textField" default exists.
 */
export function mergeConfigs(
  provider: FormalityProviderConfig,
  form?: FormConfig,
  field?: FieldConfig,
): { inputConfig: InputConfig | undefined; fieldConfig: FieldConfig } {
  const mergedInputs = mergeInputConfigs(provider.inputs, form?.inputs);
  const type = resolveFieldType(undefined, field, "textField");
  const inputConfig = resolveInputConfig(type, mergedInputs);

  const fieldConfig: FieldConfig = {
    ...field,
    props: mergeStaticProps(
      provider.defaultFieldProps,
      form?.defaultFieldProps,
      field?.props,
    ),
  };

  return { inputConfig, fieldConfig };
}

// PATTERN: barrel placement (both index.ts files) — mergeConfigs FIRST.
// config/index.ts (from "./merge") and root index.ts Configuration block (from "./config"):
export {
  mergeConfigs,        // PRD §1.3.2 headline export
  deepMerge,
  mergeInputConfigs,
  // ... unchanged
} from "./merge";       // (config/index.ts)  |  } from "./config"; (root index.ts)
```

### Integration Points

```yaml
CORE BARREL (root index.ts):
  - block: "Configuration" (lines 117-130)
  - edit: "add `mergeConfigs,` as the FIRST entry"
  - fence: "do NOT touch 'Validation' (~L72-87, sibling P1.M2.T1.S1) or
            'Labels & Ordering' (~L133, P1.M1.T1.S2)"

MODULE BARREL (config/index.ts):
  - block: 'export { ... } from "./merge"'
  - edit: "add `mergeConfigs,` as the FIRST entry"

TYPES:
  - file: packages/core/src/types/config.ts (UNCHANGED)
  - note: |
      InputConfig, FieldConfig, FormConfig, FormalityProviderConfig are already
      defined. merge.ts already imports 3 of them (L5-10); ADD FormConfig to that
      import if it is not already there (it is needed for the `form?: FormConfig` param).

PARALLEL EXECUTION CONTRACT:
  - Sibling P1.M2.T1.S1 (validate(), parallel) edits root index.ts "Validation"
    block (L72-87) + validation barrels. THIS task edits "Configuration" (L117-130)
    + config barrels. Disjoint blocks. Neither touches the other's files
    (validate.ts/validation/ vs merge.ts/config/). No conflict; keep both at merge.
  - P1.M1.T1.S2 (Implementing) MAY touch "Labels & Ordering" (~L133). Also disjoint.

SCOPE FENCES (do NOT touch):
  - deepMerge/mergeInputConfigs/resolveInputConfig/resolveFieldType/mergeStaticProps/
    mergeFieldProps/createConfigContext signatures → unchanged
  - PRD §5.3.2/§6.1 full 8-layer dynamic pipeline → out of scope (adapter's job)
  - defaults.ts / ordering.ts → unchanged
  - react package re-exports → P2/P3 own react work
  - README/CHANGELOG narrative → P3.M2.T1 owns docs sync
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After Task 1 (merge.ts) — fast feedback
pnpm --filter @formality-ui/core build        # tsup build must succeed
pnpm typecheck                                 # root tsc — barrel resolves end-to-end
pnpm lint
# Expected: zero errors. mergeConfigs is pure composition; the only way to break
# the build is a typo, a missing FormConfig type import, or a wrong barrel entry.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run just the config suite (fast iteration)
pnpm vitest run packages/core/src/__tests__/config.test.ts
# Expected: the new describe("mergeConfigs", …) block passes; existing deepMerge/
# mergeInputConfigs/resolveInputConfig/mergeFieldProps/createConfigContext tests pass.

# Full core suite — prove existing tests are unaffected
pnpm --filter @formality-ui/core test
# Expected: total rises by exactly the number of new it()s; zero regressions.
```

### Level 3: Barrel / Cross-Package Validation (System Validation)

```bash
# Confirm the export is reachable at the documented import paths
pnpm typecheck   # root tsc --build resolves core root + config module barrels
# Smoke-check the built dist declares mergeConfigs:
pnpm --filter @formality-ui/core build
grep -n "mergeConfigs" packages/core/dist/index.d.ts | head
grep -n "mergeConfigs" packages/core/dist/index.js   | head
# Expected: mergeConfigs appears as an exported function in both.

# framework-independence guard — merge.ts must have ZERO framework imports
pnpm vitest run packages/core/src/__tests__/framework-independence.test.ts
# Expected: green (mergeConfigs composes only local pure functions + types).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Coverage — confirm mergeConfigs()'s lines are covered and core stays ≥90%:
pnpm test:coverage
# Expected: merge.ts coverage does not drop; mergeConfigs's body lines are hit
# by the new tests (every branch: provider-only, form override, field type
# resolution, textField fallback, undefined-inputConfig, prop priority).

# Override-priority proof (the key behavioral assertion): the Task 4
# "override priority" test asserts fieldConfig.props === { disabled: false (form
# wins over provider), label: "F" (field wins over both) }. That IS the proof —
# no extra command needed.

# Parity proof (optional, strong): assert mergeConfigs's inputConfig is
# IDENTICAL (===) to resolveInputConfig(resolveFieldType(undefined, field),
# mergeInputConfigs(provider.inputs, form?.inputs)) for a sample — confirms pure
# delegation. The Task 4 "provider-only" identity test (`toBe(provider.inputs.textField)`)
# already proves this for the common path.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `pnpm --filter @formality-ui/core build`, `pnpm typecheck`,
      `pnpm lint` all green.
- [ ] Level 2: `pnpm vitest run .../config.test.ts` green; full core suite has
      zero regressions (count rises by new `it()`s only).
- [ ] Level 3: `mergeConfigs` present in `packages/core/dist/index.d.ts` + `.js`.
- [ ] Level 4: coverage ≥90%; `framework-independence` test green.

### Feature Validation

- [ ] `import { mergeConfigs } from "@formality-ui/core"` resolves.
- [ ] `mergeConfigs(provider, form?, field?)` returns
      `{ inputConfig: InputConfig | undefined; fieldConfig: FieldConfig }`.
- [ ] inputConfig resolved via mergeInputConfigs → resolveFieldType → resolveInputConfig.
- [ ] fieldConfig.props is the 3-source static merge (provider → form → field).
- [ ] Tests cover provider-only / provider+form / provider+form+field / override
      priority / textField fallback / undefined-inputConfig / field-config preservation.
- [ ] JSDoc names it the PRD §1.3.2 headline export + documents the static-only
      boundary + optional form + possibly-undefined inputConfig.

### Code Quality Validation

- [ ] mergeConfigs() body is PURE COMPOSITION (no duplicated merge logic).
- [ ] Uses `mergeStaticProps` (NOT `mergeFieldProps`) for the field-level merge.
- [ ] Return type is honest (`InputConfig | undefined`), no casts.
- [ ] `mergeConfigs` placed FIRST in both barrel export lists.
- [ ] `git diff` confined to merge.ts / config/index.ts / root index.ts
      (Configuration block) / config.test.ts.
- [ ] No change to any existing function signature or any other export.
- [ ] Anti-patterns avoided (see below).

### Documentation & Deployment

- [ ] mergeConfigs() JSDoc complete (Mode A ride-with).
- [ ] No README/CHANGELOG edits (P3.M2.T1 owns the cross-cutting doc sync).

---

## Anti-Patterns to Avoid

- ❌ **Don't reimplement the granular functions inside mergeConfigs().** The
  point of G3's "thin wrapper" resolution is composition. Duplicating
  mergeInputConfigs/resolveInputConfig/mergeStaticProps creates drift risk and
  untested paths. Compose them.
- ❌ **Don't use `mergeFieldProps` for the field-level merge.** It requires
  EVALUATED `selectProps`/`selectDefaultFieldProps` (dynamic layers needing
  FormState + the expression engine). mergeConfigs is pure (no state) and
  cannot evaluate them. Use `mergeStaticProps` on the 3 static layers only.
  This is Decision 3.
- ❌ Don't cast `inputConfig` to `InputConfig` to satisfy the contract's stated
  non-undefined return. `resolveInputConfig` genuinely returns `undefined` for
  unregistered types; return the honest `InputConfig | undefined` (Decision 2)
  and document it. Casts hide reality (the sibling PRP forbids them too).
- ❌ Don't make `form` required. Make it optional (`form?: FormConfig`) to match
  `createConfigContext`'s precedent, enable the provider-only test case, and
  reflect that all FormConfig fields are optional (Decision 1).
- ❌ Don't hardcode `"textField"` inline for the type. Use
  `resolveFieldType(undefined, field, "textField")` so the default flows through
  the existing function and stays consistent.
- ❌ Don't forget to spread `...field` into `fieldConfig` — the field's own
  config (type, label, disabled, …) must be preserved; only `.props` is the
  merged result. `{ ...field, props: mergeStaticProps(...) }`.
- ❌ Don't touch the "Validation" (~L72-87) or "Labels & Ordering" (~L133)
  blocks of root `index.ts`. Those belong to parallel tasks P1.M2.T1.S1 and
  P1.M1.T1.S2; only edit the "Configuration" block (~L117-130).
- ❌ Don't add `mergeConfigs` to the react package or update READMEs/CHANGELOG.
  Those are P2/P3 scope. This task is core-only.
- ❌ Don't re-implement PRD §5.3.2/§6.1's full 8-layer dynamic props pipeline.
  mergeConfigs is the STATIC convenience wrapper; the adapter wires the dynamic
  layers via `mergeFieldProps` with a FormState.
- ❌ Don't introduce a framework import in merge.ts. Core is framework-free by
  §1.3.6; `framework-independence.test.ts` guards it. Test `component` values
  must be `null`/plain functions, NOT React components.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale: This is the same lowest-complexity class as the sibling `validate()`
task — a pure-composition wrapper plus two barrel edits and additive tests. All
four target functions (`mergeInputConfigs`, `resolveFieldType`,
`resolveInputConfig`, `mergeStaticProps`) already exist in merge.ts, are fully
tested, and are read in full above. The three design decisions that could trip
an implementer (optional form, undefined-return honesty, static-only merge) are
resolved explicitly with justification and encoded into the exact function body,
JSDoc, and tests. The failure modes are mechanical: using `mergeFieldProps`
instead of `mergeStaticProps`, casting away the undefined, making form required,
or a missing barrel entry — all called out above and caught by the Task 4 tests
(which assert override priority, textField fallback, undefined-inputConfig, and
type resolution end-to-end). The -1 covers the small risk of a merge-time
textual collision on root `index.ts` with the two parallel siblings; the
disjoint-block guidance (Configuration vs Validation vs Labels & Ordering) and
the typecheck gate (resolves the barrel end-to-end) make that a non-issue if the
implementer keeps all blocks' edits.
